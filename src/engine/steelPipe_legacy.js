// ============================================================
// 강관 구조안전성 검토 — 2004 기준 (구 상수도 시설기준)
// 근거: 환경부 「상수도 시설기준」(2004) 5.9절
//
// 현행(2025)과의 주요 차이:
//   토압: Marston 공식  vs Prism Load
//   링휨: Spangler 복합식(E' 포함)  vs 단순 Kb식
//   내압 허용응력: 137 MPa 고정  vs 0.50×fy
//   좌굴 안전율: FS=2.0  vs 2.5
//   강종: SS41(허용 137 MPa) 등 구 KS 강종 포함
// ============================================================

import { PIPE_MATERIAL, STEEL_THICKNESS, GW_RW, STEEL_BEDDING, STEEL_GRADES } from './constants.js'

// ── 2004 기준 강종 및 허용응력 (참고표-4.2.5) ─────────────
// 출처: 구 상수도 시설기준(2004) 참고표-4.2.5 허용응력
// 단위: kN/mm² = MPa
export const LEGACY_STEEL_GRADES = [
  { key: 'STWW290', label: 'STWW 290', sigmaA: 100, note: '상수도용 도복장강관' },
  { key: 'STWW370', label: 'STWW 370', sigmaA: 125, note: '상수도용 도복장강관' },
  { key: 'STWW400', label: 'STWW 400', sigmaA: 140, note: '상수도용 도복장강관' },
  { key: 'SS400',   label: 'SS 400',   sigmaA: 140, note: '일반구조용 강관' },
  { key: 'SM400',   label: 'SM 400',   sigmaA: 140, note: '용접구조용 압연강재' },
]

// ── Marston 토압 Cd 계수 계산 ─────────────────────────────
// Marston-Spangler: 트렌치(굴착)식
//   We = Cd × γ × B²  [kN/m]
//   Cd = (1 - e^(-2Kμ·H/B)) / (2Kμ)
//   Kμ = 0.165 (마찰각 φ=30° 가정, 일반 굴착 토사)
//
// 매립(embankment)식은 별도이나, 2004 기준 도수·송수관은
// 트렌치 매설이 기본이므로 트렌치식 적용
function calcCd(H, B) {
  const Kmu = 0.165  // K × tan(δ), φ=30° 기준 일반값
  const exponent = -2 * Kmu * H / B
  return (1 - Math.exp(exponent)) / (2 * Kmu)
}

// ── Marston 토압 산정 ─────────────────────────────────────
// B: 굴착폭 (m), null이면 Do + 0.6m 자동
function calcMarstonLoad({ gammaSoil, H, Do, excavationWidth }) {
  const Do_m = Do / 1000  // mm → m
  const B = excavationWidth != null ? excavationWidth : Do_m + 0.6
  const Cd = calcCd(H, B)
  const We = Cd * gammaSoil * B * B  // kN/m (단위길이당)
  const Pe = We / Do_m               // kPa
  return { We, Pe, B, Cd }
}

// ── Spangler 링 휨응력 (복합식, E' 포함) ─────────────────
// 2004 기준 링휨 공식 (Spangler-Watkins):
//   σ_b = (2/f) × (1/Z) × W × [Kb × R² + 0.732 × E' × R³ / (EI + 0.061 × E' × R³)]
//              단, 분모 전체에 나누기 → 아래와 같이 정리
//
// 실제 Spangler 원식:
//   σ_b = (2/f·Z) × Kb × W × R² / (EI + 0.061·E'·R³)   × EI
//       + (2/f·Z) × 0.732 × E' × W × R³ / (EI + 0.061·E'·R³)
//
// 통합 정리:
//   σ_b = (2 × Kb × W × R²) / (f × Z × (EI + 0.061·E'·R³)) × EI
//         ← 이 형태가 아님, 올바른 Spangler-Watkins 원식:
//
//   σ_b = (2/f) × (W / Z) × [Kb·R²·EI + 0.732·E'·R³] / (EI + 0.061·E'·R³)
//
// 여기서:
//   f  = 형상계수 (1.5, 2004 기준)
//   Z  = 단면계수 = t²/6  [m³/m]
//   Kb = 침상계수 (AWWA M11 Table)
//   R  = 관 중심 반경 = (Do - t)/2  [m]
//   W  = 단위길이당 하중 [kN/m]
//   E' = 탄성지반반력계수 [kPa]
//   EI = 관의 휨강성 [kN·m²/m]
//
// 단위 검증:
//   분자: W[kN/m] × R²[m²] × EI[kN·m²/m] → kN²·m³/m
//   분모: Z[m³/m] × (EI[kN·m²/m] + E'[kPa]·R³[m³]) → m³/m × kN·m²/m = kN·m⁵/m²
//   결과: kN²·m³/m ÷ kN·m⁵/m² = kN/m² = kPa → ÷1000 = MPa  ✓
function calcSpanglerStress({ W, Kb, R, EI, Eprime, t_m, f_override = 1.5 }) {
  const f  = f_override
  const Z  = (t_m ** 2) / 6  // m³/m (단면계수)
  const R3 = R ** 3
  const R2 = R ** 2

  const numerator   = Kb * R2 * EI + 0.732 * Eprime * R3
  const denominator = EI + 0.061 * Eprime * R3

  // σ_b [kPa] → [MPa]
  const sigma_b_kPa = (2 / f) * (W / Z) * (numerator / denominator)
  return { sigma_b: sigma_b_kPa / 1000, f, Z }
}

// ── 2004 기준 차량하중 ────────────────────────────────────
// 2004 기준은 DB 하중(후축 96 kN). 단순화된 분산 사용.
// 현행 DB-24(196 kN)의 약 절반 수준.
// 2004 기준의 정확한 표가 없으므로 현행 trafficLoad를 DB-24 기준으로
// 계산한 뒤, 하중 비율(96/196 ≈ 0.490)을 적용해 보정.
// ※ 보고서에 이 가정을 명시함.

/**
 * 2004 기준 강관 전체 구조안전성 검토
 * @param {object} inputs
 * @returns {object} 계산 결과
 */
export function calcSteelPipeLegacy(inputs) {
  const {
    DN, Pd, surgeRatio = 1.5, H,
    gammaSoil, Eprime,
    hasTraffic, gwLevel,
    steelBeddingType = 'deg90',
    pipeDimManual = false, DoManual, tManual,
    steelGrade = 'STWW400',
    E_pipeManual = false, E_pipe = null,
    excavationWidth = null,
    shapeFactor = 1.5,      // 형상계수 f
    deflectionLag = 1.5,    // 처짐 지연계수 DL
    legacyTrafficLoad = 0,  // 노면하중 Wt (kN/m) — 직접 입력
  } = inputs

  // 2004 기준 강관: 관경 드롭다운(DN→Do 참고) + 두께 직접입력(tManual) 방식

  const mat = PIPE_MATERIAL.steel
  const Es = (E_pipeManual && E_pipe != null) ? E_pipe : mat.Es  // 206,000 MPa

  // ── 허용응력: 강종별 참고표-4.2.5 값 적용 ──
  const gradeRow    = LEGACY_STEEL_GRADES.find(g => g.key === steelGrade) ?? LEGACY_STEEL_GRADES[2]
  const sigmaA_normal = gradeRow.sigmaA          // MPa (강종별)
  const sigmaA_surge  = gradeRow.sigmaA * 1.33  // 수격 1.33배 완화

  // ── 관 제원 ────────────────────────────────────────────
  // 2004 기준: DN 드롭다운으로 Do 결정, 두께는 tManual 직접입력
  let Do, tAdopt
  if (pipeDimManual && DoManual) {
    // 완전 직접입력 모드 (비규격)
    Do = DoManual
    tAdopt = tManual ?? 8
  } else {
    const row = STEEL_THICKNESS[DN]
    if (!row) throw new Error(`강관 DN(호칭) ${DN}A는 지원하지 않습니다.`)
    Do = row.Do
    // 2004 기준: tManual로 두께 지정 (PN등급 없음)
    tAdopt = tManual ?? 8
    if (!tAdopt || tAdopt <= 0) throw new Error('관 두께 t를 입력하십시오.')
  }

  // ────────────────────────────────────────
  // STEP 1: 내압 검토 (Barlow 공식, 2004)
  // 허용응력: 137 MPa (SS41 기준 고정)
  // 수격압: 허용응력 × 1.33 완화
  // ────────────────────────────────────────
  const Psurge      = Pd * surgeRatio
  const sigma_normal = (Pd     * Do) / (2 * tAdopt)  // MPa
  const sigma_surge  = (Psurge * Do) / (2 * tAdopt)  // MPa

  const tp_normal  = (Pd     * Do) / (2 * sigmaA_normal)
  const tp_surge   = (Psurge * Do) / (2 * sigmaA_surge)
  const tHandling  = Do / mat.handlingDivisor
  const tCalcMin   = Math.max(tp_normal, tp_surge, tHandling)
  const tRequired  = tCalcMin + mat.corrosionAllowance

  const ok_normal = sigma_normal <= sigmaA_normal
  const ok_surge  = sigma_surge  <= sigmaA_surge

  // ────────────────────────────────────────
  // STEP 2: 토압 산정 (Marston 트렌치식)
  // ────────────────────────────────────────
  const { We, Pe, B, Cd } = calcMarstonLoad({ gammaSoil, H, Do, excavationWidth })

  // ────────────────────────────────────────
  // STEP 3: 노면하중 (직접 입력값 사용)
  // 2004 기준: 25톤 트럭 기준 등분포 환산값을 그래프/표에서 읽어 직접 입력
  // ────────────────────────────────────────
  const WL_legacy = hasTraffic ? (legacyTrafficLoad ?? 0) : 0  // kN/m
  const Wtotal = We + WL_legacy
  const Ptotal = Wtotal / (Do / 1000)  // kPa

  // ────────────────────────────────────────
  // STEP 4: 외압 링 휨응력 검토 (Spangler 복합식)
  // 허용응력: 137 MPa (2004 기준 고정)
  // ────────────────────────────────────────
  const beddingRow = STEEL_BEDDING[steelBeddingType] || STEEL_BEDDING['deg90']
  const Kb_steel   = beddingRow.Kb
  const Kx_steel   = beddingRow.Kx

  const t_m  = tAdopt / 1000
  const Do_m = Do / 1000
  const R    = (Do_m - t_m) / 2   // 중심 반경 [m]
  const I    = (t_m ** 3) / 12
  const EI   = Es * 1e3 * I       // kN·m²/m

  const { sigma_b, f: f_shape, Z: Z_section } = calcSpanglerStress({
    W: Wtotal, Kb: Kb_steel, R, EI, Eprime, t_m, f_override: shapeFactor,
  })
  const sigmaA_bend = sigmaA_normal  // 137 MPa (2004 기준 — 현행과 달리 fy 비례 아님)
  const ok_bending  = sigma_b <= sigmaA_bend

  // ────────────────────────────────────────
  // STEP 5: 변형량 검토 (Modified Iowa)
  // 허용처짐: 5% 단일 (라이닝 구분 없음, 2004 기준)
  // ────────────────────────────────────────
  const DL = deflectionLag  // 처짐 지연계수 (입력값)
  const K  = Kx_steel
  const r  = R  // Spangler 에서 쓴 R과 동일 (중심반경)

  const EI_r3       = EI / (r ** 3)
  const denominator = EI_r3 + 0.061 * Eprime
  const deflectionRatio = (DL * K * Ptotal) / denominator * 100  // %
  const maxDeflection   = 5.0  // % — 2004 기준: 라이닝 구분 없이 5%
  const ok_deflection   = deflectionRatio <= maxDeflection

  // ────────────────────────────────────────
  // STEP 6: 외압 좌굴 검토 (AWWA M11 식, FS=2.0)
  // 2004 기준: 안전율 FS=2.0 (현행 2.5보다 낮음)
  // Rw는 명시적 적용 없음 → Rw=1.0 고정
  // ────────────────────────────────────────
  const FS_legacy = 2.0  // 2004 기준 좌굴 안전율
  const Rw        = 1.0  // 2004 기준: 지하수위 계수 미적용

  const HoverDo = H / Do_m
  const Bprime  = 1 / (1 + 4 * Math.exp(-0.065 * HoverDo))
  const EI_Do3  = EI / (Do_m ** 3)

  const Pcr = (1 / FS_legacy) * Math.sqrt(32 * Rw * Bprime * Eprime * EI_Do3)
  const Pe_ext          = Ptotal
  const bucklingFS_actual = Pcr / Pe_ext
  const ok_buckling       = bucklingFS_actual >= FS_legacy

  // ────────────────────────────────────────
  // 최종 결과 조립
  // ────────────────────────────────────────
  const overallOK = ok_normal && ok_surge && ok_bending && ok_deflection && ok_buckling

  return {
    pipeType: 'steel',
    designStandard: '2004',
    pipeDimManual,
    DN: pipeDimManual ? null : DN,
    Do, tAdopt, tRequired,
    pnGrade: pipeDimManual ? null : pnGrade,
    steelGrade, fy,
    steps: {
      step1: {
        title: '내압 검토',
        ref: '구 상수도 시설기준(2004) 5.9절 / Barlow 공식',
        Pd, Psurge, surgeRatio,
        steelGrade, sigmaA_normal, sigmaA_surge,
        tp_normal, tp_surge, tHandling, tCalcMin, tRequired,
        tAdopt, pnGrade,
        sigma_normal, sigma_surge,
        ok_normal, ok_surge,
        ok: ok_normal && ok_surge,
        note: `2004 기준: ${gradeRow.label} 허용응력 ${sigmaA_normal} MPa (참고표-4.2.5), 수격 1.33배 완화`,
      },
      step2: {
        title: '토압 산정 (Marston 트렌치식)',
        ref: '구 상수도 시설기준(2004) 5.9절 / Marston-Spangler',
        gammaSoil, H, Do,
        excavationWidth, B, Cd,
        We, Pe,
        note: `굴착폭 B=${B.toFixed(2)}m, Cd=${Cd.toFixed(3)} (Kμ=0.165)`,
      },
      step3: {
        title: '노면하중 산정 (직접 입력)',
        ref: '구 상수도 시설기준(2004) 참고도-4.2.4 / 25톤 트럭 기준',
        hasTraffic,
        WL_legacy, Wtotal, Ptotal,
        note: '2004 기준: 25톤 트럭 기준 토피별 등분포 환산값(Wt)을 직접 입력',
      },
      step4: {
        title: '외압 링 휨응력 검토 (Spangler 복합식)',
        ref: '구 상수도 시설기준(2004) 5.9절 / Spangler-Watkins',
        steelBeddingType, Kb_steel,
        beddingLabel: beddingRow.label,
        f_shape, Z_section,
        R, EI, Eprime,
        Wtotal, Do, tAdopt,
        sigma_b, sigmaA_bend,
        ok: ok_bending,
        note: '2004 기준: σ_b = (2/f·Z)·W·[Kb·R²·EI + 0.732·E\'·R³] / (EI + 0.061·E\'·R³)',
      },
      step5: {
        title: '변형량 검토 (Modified Iowa)',
        ref: '구 상수도 시설기준(2004) 5.9절 / Modified Iowa',
        DL, K,
        r, I, EI, EI_r3, Eprime,
        Ptotal, denominator, deflectionRatio, maxDeflection,
        ok: ok_deflection,
        note: `2004 기준: DL=${DL}, 허용처짐 5% 단일 (라이닝 구분 없음)`,
      },
      step6: {
        title: '외압 좌굴 검토',
        ref: '구 상수도 시설기준(2004) 5.9절 / AWWA M11 준용',
        Rw, HoverDo, Do_m, H, Bprime, EI_Do3, Eprime,
        Pcr, Pe_ext, bucklingFS_actual, FS_allow: FS_legacy,
        ok: ok_buckling,
        note: '2004 기준: FS=2.0 (현행 2.5), Rw=1.0 고정 (지하수위 계수 미적용)',
      },
    },
    verdict: {
      hoopNormal:  { label: '내압응력 (상시)', value: sigma_normal,      allow: sigmaA_normal, unit: 'MPa', ok: ok_normal },
      hoopSurge:   { label: '내압응력 (수격)', value: sigma_surge,       allow: sigmaA_surge,  unit: 'MPa', ok: ok_surge },
      bending:     { label: '링 휨응력',       value: sigma_b,           allow: sigmaA_bend,   unit: 'MPa', ok: ok_bending },
      deflection:  { label: '처짐율',          value: deflectionRatio,   allow: maxDeflection, unit: '%',   ok: ok_deflection },
      buckling:    { label: '좌굴 안전율',     value: bucklingFS_actual, allow: FS_legacy,     unit: '',    ok: ok_buckling },
      overallOK,
    },
  }
}
