// ============================================================
// 수도용 도복장 강관 구조안전성 검토
// 근거: 「시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서」
//       제11장 상수도 11.5.2 (1) 수도용 도복장 강관 (11-134 ~ 11-136)
//
// 지침은 관로 안전성검토 식을「상수도시설기준, 환경부」제시 식 사용을 원칙으로 하며,
// 토압식·링휨식·허용기준표·관두께 적용규칙을 직접 명시한다.
//
// ⚠ 하중 조합 규칙 (11-134 ②):
//   "외압 작용의 경우 관 내부의 수압이 없는 조건으로 하고,
//    내압 작용의 경우 외부 하중(노면하중, 토압 등)이 없는 조건으로 한다"
//   → 내압 검토(STEP 1)와 외압 검토(STEP 3~5)는 분리 산정하며 합산하지 않는다.
//
// ⚠ 단위: 전 과정을 지침 원단위계(cm, kg, kg/cm²)로 계산하고 최종만 MPa 환산한다.
//   SI로 항별 계산하면 f·Z / E·I / E′·R³ 스케일이 달라 잘못된 값이 나온다.
// ============================================================

import {
  STEEL_THICKNESS, GW_RW, STEEL_BEDDING, STEEL_GRADES,
  STEEL_ALLOW, STEEL_MAX_DEFLECTION, BEDDING_ALLOWED,
  STEEL_E_KGFCM2, EPRIME_KGFCM2, RING_BENDING, BUCKLING,
  EARTH_LOAD, REFERENCES, GUIDE_LABEL, resolveSafetyGrade,
} from './constants.js'
import { calcEarthLoad, calcTrafficLoad } from './earthLoad.js'
import { checkKdsCompliance } from './kdsCompliance.js'

// kg/cm² → MPa
const KGF_TO_MPA = 0.0980665

/**
 * 강관 구조안전성 검토
 *
 * 관두께 적용규칙 (11-134 ②):
 *   "관두께는 관 상세검사에서 측정된 구간별 최소 관두께와
 *    관경별 기준 관두께(STWW 400) 가운데 작은 값을 적용한다"
 *
 * @param {object} inputs
 * @returns {object} 계산 결과 전체
 */
export function calcSteelPipe(inputs) {
  const {
    DN, Pd, H,
    gammaSoil_kgfcm3 = EARTH_LOAD.gamma_t,
    Eprime_kgfcm2 = EPRIME_KGFCM2,
    hasTraffic = true, gwLevel = 'below',
    steelBeddingType = 'deg90',
    pnGrade = 'PN10',
    pipeDimManual = false, DoManual, tManual,
    steelGrade = 'SPS400', fyManual = 235,
    // 실측 최소 관두께 (mm) — 관 상세검사값. 미입력 시 기준 두께 사용 (11-134)
    tMeasured = null,
    // 수격압 검토 여부 — 자연유하 구간: 정수압 / 가압구간: 수격압 (11-136)
    pressureZone = 'gravity',   // 'gravity'(자연유하) | 'pumped'(가압)
    Psurge = null,              // MPa — 가압구간 수격압(정수압 이상 상승압력)
    // 주부재 손상(단면손실) 유무 — 등급 a/b 구분 (11-133 표 11.74)
    hasSectionLoss = false,
  } = inputs

  const gradeRow = STEEL_GRADES.find(g => g.key === steelGrade)
  const fy = steelGrade === 'MANUAL' ? fyManual : (gradeRow?.fy ?? 235)

  // ── 관 제원 및 관두께 적용규칙 (11-134) ──
  let Do, tStandard
  if (pipeDimManual) {
    Do = DoManual
    tStandard = tManual
  } else {
    const row = STEEL_THICKNESS[DN]
    if (!row) throw new Error(`강관 DN${DN}은 지원하지 않습니다.`)
    Do = row.Do
    tStandard = row[pnGrade]
    if (!tStandard) throw new Error(`DN${DN}에서 ${pnGrade} 등급을 찾을 수 없습니다.`)
  }

  // 실측 최소 관두께와 기준 관두께 중 작은 값 (11-134)
  const hasMeasured = tMeasured != null && Number.isFinite(tMeasured) && tMeasured > 0
  const tAdopt = hasMeasured ? Math.min(tMeasured, tStandard) : tStandard
  const thicknessGoverned = hasMeasured
    ? (tMeasured < tStandard ? 'measured' : 'standard')
    : 'standard'

  // ── 지지각: 지침 표에 있는 60/90/120/150° 만 사용 가능 (11-135) ──
  let beddingKey = steelBeddingType === 'deg180' ? 'deg150' : steelBeddingType
  let beddingCoerced = null
  if (!BEDDING_ALLOWED.includes(beddingKey)) {
    beddingCoerced = beddingKey
    beddingKey = 'deg60'
  }
  const beddingRow = STEEL_BEDDING[beddingKey]
  const { Kb, Kx } = beddingRow

  // 원단위 제원
  // ⚠ 지침 수식의 D 는 **관 내경**이다 (11-134 EQ4 정의부: "D : 관 내경 (mm)",
  //   11-137 EQ10 정의부도 동일). Do(외경)를 대입하면 과대평가된다.
  const Di    = Do - 2 * tAdopt           // mm — 내경
  const Do_cm = Do / 10
  const Di_cm = Di / 10
  const t_cm  = tAdopt / 10
  // R = D/2 + t (11-135 정의부, "관의 평균반경").
  // D=내경이므로 D/2 + t = (Do−2t)/2 + t = Do/2 → 외반경과 일치한다.
  // ※ Do/2 + t 로 쓰면 관 벽 바깥에 R이 놓여 기하학적으로 성립하지 않는다.
  const R     = Di_cm / 2 + t_cm          // cm ( = Do_cm/2 )
  const I     = t_cm ** 3 / 12            // cm³
  const Z     = t_cm ** 2 / 6             // cm²
  const f     = RING_BENDING.f            // 1.5
  const E     = STEEL_E_KGFCM2            // 2.1e6 kg/cm²
  const Ep    = Eprime_kgfcm2             // 28 kg/cm²

  // ────────────────────────────────────────
  // STEP 1: 내압에 의한 관의 응력 (11-134 (나))
  //   σt = P·D / (2t)
  //   ⚠ 내압 검토는 외부 하중이 없는 조건 — 토압·차량하중과 합산하지 않는다.
  //   허용: 정수압(상시) 140 MPa / 동수압+수격압(일시) 210 MPa
  // ────────────────────────────────────────
  // σt = P·D/(2t) — D는 관 내경 (11-134 EQ4 정의부)
  const sigma_t_static = (Pd * Di) / (2 * tAdopt)          // MPa — 정수압
  const ok_static = sigma_t_static <= STEEL_ALLOW.normal

  // 가압구간에서만 수격압(일시하중) 검토 (11-136)
  const isPumped = pressureZone === 'pumped'
  const Psurge_used = isPumped ? (Psurge ?? Pd * 1.5) : null
  const sigma_t_surge = isPumped ? (Psurge_used * Di) / (2 * tAdopt) : null
  const ok_surge = isPumped ? sigma_t_surge <= STEEL_ALLOW.surge : true

  // ────────────────────────────────────────
  // STEP 2: 작용 하중(외압) — 상부 토압 + 노면하중 (11-134 (가))
  // ────────────────────────────────────────
  const earth = calcEarthLoad({ H, Do, gammaSoil_kgfcm3 })
  const traffic = hasTraffic ? calcTrafficLoad({ H }) : { Wt: 0, i: 0 }
  const Wv = earth.Wv
  const Wt = traffic.Wt
  const Wtotal = Wv + Wt                  // kg/cm²

  // ────────────────────────────────────────
  // STEP 3: 외압에 의한 원주방향 휨응력 (11-135 (다))
  //   σb = (2/(f·Z))·(Wv+Wt)·[Kb·R²·E·I + (0.061Kb − 0.083Kx)·E′·R⁵]
  //                          / [E·I + 0.061·E′·R³]
  // ────────────────────────────────────────
  const numerator   = Kb * R ** 2 * E * I
                    + (RING_BENDING.a * Kb - RING_BENDING.b * Kx) * Ep * R ** 5
  // ※ 분모 계수는 원문 표기값 0.061 (aDen). 분자 계수만 표 4열 역산값 사용.
  const denominator = E * I + RING_BENDING.aDen * Ep * R ** 3
  const sigma_b_kgf = (2 / (f * Z)) * Wtotal * numerator / denominator
  const sigma_b     = sigma_b_kgf * KGF_TO_MPA              // MPa
  const ok_bending  = sigma_b <= STEEL_ALLOW.normal

  // ────────────────────────────────────────
  // STEP 4: 외압에 의한 원주방향 변형률 (11-136 (라))
  //   ε = 2·Kx·(Wv+Wt)·R⁴ / [E·I + 0.061·E′·R³] × (1/D) × 100
  //   허용: 관경의 5% 미만 (라이닝 무관)
  // ────────────────────────────────────────
  const deltaX = 2 * Kx * Wtotal * R ** 4 / denominator     // cm
  // ε = … × (1/D) × 100 — D는 관 내경 (11-136 EQ7)
  const deflectionRatio = deltaX / Di_cm * 100              // %
  const maxDeflection = STEEL_MAX_DEFLECTION                // 5.0 %
  const ok_deflection = deflectionRatio < maxDeflection

  // ────────────────────────────────────────
  // STEP 5: 외압에 의한 좌굴하중 (11-136 (마))
  //   qa = (1/FS)·[32·Rw·B′·E′·EI/D³]^(1/2)
  //   FS = 2.5 (H/D ≥ 2) / 3.0 (H/D < 2)
  //   Rw = 1.0,  B′ = 0.15 + 0.041·(H/D)
  // ────────────────────────────────────────
  const H_cm = H * 100
  const HoverD = H_cm / Di_cm
  const FS_buckling = HoverD >= 2 ? BUCKLING.FS_deep : BUCKLING.FS_shallow
  const Bprime = BUCKLING.Bprime(HoverD)
  // 지침 제시값은 Rw = 1.0. 지하수위 선택 시 안전측 보정값 사용 (GW_RW)
  const Rw = GW_RW[gwLevel] ?? BUCKLING.Rw_default
  const rwIsGuideline = Rw === BUCKLING.Rw_default

  const EI = E * I                                          // kg·cm
  const qa = (1 / FS_buckling)
           * Math.sqrt(32 * Rw * Bprime * Ep * EI / Di_cm ** 3)   // kg/cm²
  const ok_buckling = Wtotal <= qa
  const bucklingSF = qa / Wtotal

  // ────────────────────────────────────────
  // 안전율 및 안전성평가 등급 (11-133 [표 11.74])
  //   허용응력설계법 : SF = 허용응력 / 발생응력
  // ────────────────────────────────────────
  const SF_static  = STEEL_ALLOW.normal / sigma_t_static
  const SF_surge   = isPumped ? STEEL_ALLOW.surge / sigma_t_surge : Infinity
  const SF_bending = STEEL_ALLOW.normal / sigma_b
  // 변형률도 허용/발생 비로 환산해 포함한다. 누락하면 ε 초과(종합 N.G.)인데
  // 등급이 a로 나오는 모순이 보고서에 그대로 인쇄된다.
  const SF_deflection = deflectionRatio > 0 ? maxDeflection / deflectionRatio : Infinity
  const SF_min = Math.min(SF_static, SF_surge, SF_bending, SF_deflection, bucklingSF)
  const safetyGrade = resolveSafetyGrade(SF_min, hasSectionLoss)

  const overallOK = ok_static && ok_surge && ok_bending && ok_deflection && ok_buckling

  return {
    pipeType: 'steel',
    pipeDimManual,
    DN: pipeDimManual ? null : DN,
    Do, Di, tAdopt, tStandard, tMeasured, thicknessGoverned, hasMeasured,
    pnGrade: pipeDimManual ? null : pnGrade,
    steelGrade, fy,

    // ── 적용 기준 이력 (보고서에 항상 출력) ──
    appliedCodeLabel: GUIDE_LABEL,
    appliedFormula: "σb = (2/(f·Z))·(Wv+Wt)·[Kb·R²·E·I + (0.061Kb − 0.083Kx)·E′·R⁵] / [E·I + 0.061·E′·R³]",
    allowSource: STEEL_ALLOW.source,
    allowGrade: STEEL_ALLOW.grade,
    kdsCompliance: checkKdsCompliance({ DN, Do, H, hasTraffic, Pd, Psurge: Psurge_used, pipeDimManual }),
    beddingCoerced,
    pressureZone, rwIsGuideline,

    // ── 안전성평가 (11-133 표 11.74) ──
    SF: SF_min, safetyGrade, hasSectionLoss,

    steps: {
      step1: {
        title: '내압에 의한 관의 응력',
        ref: REFERENCES.hoopStress,
        Pd, Psurge: Psurge_used, pressureZone, isPumped,
        sigma_t_static, sigmaA_static: STEEL_ALLOW.normal, ok_static, SF_static,
        sigma_t_surge, sigmaA_surge: STEEL_ALLOW.surge, ok_surge, SF_surge,
        tAdopt, tStandard, tMeasured, thicknessGoverned,
        ok: ok_static && ok_surge,
        formula: '\\sigma_t = \\frac{P \\cdot D}{2t}',
      },
      step2: {
        title: '작용 하중 (외압)',
        ref: REFERENCES.earthLoad,
        H, Do, gammaSoil_kgfcm3,
        Wv, Cd: earth.Cd, B_cm: earth.B_cm, kmu: earth.kmu, earthMethod: earth.method,
        Wt, impactFactor: traffic.i, hasTraffic,
        Wtotal,
        formula: 'W_v = C_d \\cdot \\gamma_t \\cdot B \\quad (H > 2.0m)',
      },
      step3: {
        title: '외압에 의한 원주방향 휨응력',
        ref: REFERENCES.ringBending,
        steelBeddingType: beddingKey, beddingLabel: beddingRow.label,
        Kb, Kx, R, I, Z, f, E, Ep,
        Wtotal, sigma_b_kgf, sigma_b,
        sigmaA_bend: STEEL_ALLOW.normal, SF: SF_bending,
        ok: ok_bending,
        formula: '\\sigma_b = \\frac{2}{f Z}(W_v+W_t)\\frac{K_b R^2 EI + (0.061K_b - 0.083K_x)E\'R^5}{EI + 0.061E\'R^3}',
      },
      step4: {
        title: '외압에 의한 원주방향 변형률',
        ref: REFERENCES.deflection,
        Kx, R, I, E, Ep, Wtotal,
        deltaX, deflectionRatio, maxDeflection,
        ok: ok_deflection,
        formula: '\\varepsilon = \\frac{2K_x(W_v+W_t)R^4}{EI+0.061E\'R^3}\\cdot\\frac{1}{D}\\times 100',
      },
      step5: {
        title: '외압에 의한 좌굴하중',
        ref: REFERENCES.buckling,
        gwLevel, Rw, rwIsGuideline, HoverD, Bprime, FS: FS_buckling,
        E, I, EI, Ep, Do_cm,
        qa, Wtotal, bucklingSF,
        ok: ok_buckling,
        formula: 'q_a = \\frac{1}{FS}\\sqrt{32 R_w B\' E\' \\frac{EI}{D^3}}',
      },
    },
    verdict: {
      hoopStatic:  { label: '내압응력 (정수압·상시)', value: sigma_t_static, allow: STEEL_ALLOW.normal, unit: 'MPa', ok: ok_static },
      ...(isPumped ? {
        hoopSurge: { label: '내압응력 (수격압·일시)', value: sigma_t_surge, allow: STEEL_ALLOW.surge, unit: 'MPa', ok: ok_surge },
      } : {}),
      bending:     { label: '외압 휨응력',   value: sigma_b,         allow: STEEL_ALLOW.normal, unit: 'MPa',   ok: ok_bending },
      deflection:  { label: '관체 변형량',   value: deflectionRatio, allow: maxDeflection,      unit: '%',     ok: ok_deflection },
      buckling:    { label: '좌굴하중',      value: Wtotal,          allow: qa,                 unit: 'kg/cm²', ok: ok_buckling },
      overallOK,
    },
  }
}
