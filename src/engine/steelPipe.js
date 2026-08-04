// ============================================================
// 강관 구조안전성 검토 — 6단계 (검토 개념: 주어진 두께로 안전성 확인)
// 근거: AWWA M11 / ASCE / KDS 57 10 00 / KS D 3565
// ============================================================

import {
  PIPE_MATERIAL, STEEL_THICKNESS, GW_RW, STEEL_BEDDING, STEEL_GRADES,
  STEEL_ALLOW_2004, STEEL_ALLOW_2004_FALLBACK, STEEL_ES_2004,
  STEEL_DEFLECTION_2004, MARSTON_2004, TRAFFIC_2004, BEDDING_2004_ALLOWED,
} from './constants.js'
import { calcEarthLoad, calcEarthLoadMarston, calcTrafficLoad2004 } from './earthLoad.js'
import { calcTrafficLoad, calcTrafficLoadWm } from './trafficLoad.js'

// kgf/cm² → MPa
const KGF_TO_MPA = 0.098067

/**
 * 링휨 허용응력 결정 — 단일 지점
 *
 * ※ 두 경로 모두 상수도시설기준(2004) 참고표-4.2.5 의 강종별 고정 허용응력을 사용한다.
 *   현행 KDS 57 10 00은 링휨 검토를 요구하지도, 허용응력을 규정하지도 않는다
 *   (해설편 1,363쪽에 "링휨" 0회 / 관두께는 "KS·KWWA 인증 압력관 사용"으로 갈음, p.543).
 *   따라서 종전의 0.50×fy(= 117.5 MPa)는 어느 기준 문서에도 근거가 없어 폐지하고,
 *   원문에 실재하는 유일한 링휨 허용응력인 2004 참고표-4.2.5 값으로 통일한다.
 *
 * ※ 산정식은 codeStandard 에 따라 계속 달라진다(SET_A: E′ 포함 / SET_B: E′ 미포함).
 *   KDS2022 경로는 산정식만 현행이고 허용값은 2004 표이므로 출처를 분리해 명시한다.
 *
 * @returns {{ value, source, ratio, gradeUsed, isFallback }}
 */
function resolveAllowable(codeStandard, { fy, steelGradeLegacy }) {
  const key = STEEL_ALLOW_2004[steelGradeLegacy] != null
    ? steelGradeLegacy
    : STEEL_ALLOW_2004_FALLBACK
  const value = STEEL_ALLOW_2004[key]
  const isFallback = STEEL_ALLOW_2004[steelGradeLegacy] == null

  if (codeStandard === 'KWW2004') {
    return {
      value,
      source: `상수도시설기준(2004) 참고표-4.2.5 — ${key}`,
      ratio: '강종별 고정표 (≈0.6·fy)',
      gradeUsed: key, isFallback,
    }
  }
  // KDS2022 — 산정식은 AWWA M11, 허용값은 2004 표 (현행 기준에 링휨 허용응력 규정 없음)
  return {
    value,
    source: `허용응력: 상수도시설기준(2004) 참고표-4.2.5 — ${key} `
          + '(현행 KDS 57 10 00은 링휨 허용응력을 규정하지 않음) / 산정식: AWWA M11 §5.3',
    ratio: '강종별 고정표 (≈0.6·fy)',
    gradeUsed: key, isFallback,
  }
}

/**
 * [SET_A] 상수도시설기준(2004) 방식 링휨·처짐 계산
 * 근거: 상수도시설기준(2004) pp.171~175 [참고-4.2.1]
 *
 * σb = (2/(f·Z))·(Wv+Wt)·[Kb·R²·E·I + (0.06146·Kb − 0.08303·Kx)·E'·R⁵] / [E·I + 0.061·E'·R³]
 *   f = 1.5 (소성단면계수), Z = t²/6, I = t³/12, R = Do/2
 *
 * ※ 전 과정을 2004 단위계(cm, kgf, kgf/cm²)로 계산하고 최종 결과만 MPa로 환산한다.
 *   SI 단위로 항별 계산하면 f·Z / E·I / E'·R³ 의 스케일이 달라 잘못된 값이 나온다.
 * ※ 처짐식은 2004 원문에 명시되어 있지 않아 기존 엑셀(02-1) 구현을 근거로 함:
 *   Δx = 2·Kx·(Wv+Wt)·R⁴ / (E·I + 0.061·E'·R³),  ε = Δx/Do
 */
function calcSetA({ Do, tAdopt, H, beddingKey, Eprime_MPa, allow, hasLining, gammaSoil_kgfcm3 }) {
  const Do_cm = Do / 10
  const t_cm  = tAdopt / 10
  const R  = Do_cm / 2
  const I  = t_cm ** 3 / 12
  const Z  = t_cm ** 2 / 6
  const f  = 1.5

  // MPa → kgf/cm²
  const E  = STEEL_ES_2004 / KGF_TO_MPA
  const Ep = Eprime_MPa / KGF_TO_MPA

  const row = STEEL_BEDDING[beddingKey] || STEEL_BEDDING['deg90']
  const { Kb, Kx } = row

  const earth = calcEarthLoadMarston({
    H, Do, gammaSoil_kgfcm3,
    kmu: MARSTON_2004.kmu, B_add_m: MARSTON_2004.B_add, H_limit: MARSTON_2004.H_prism_limit,
  })
  const traffic = calcTrafficLoad2004({ H, ...TRAFFIC_2004 })
  const Wtotal = earth.Wv + traffic.Wt   // kgf/cm²

  const numerator   = Kb * R ** 2 * E * I + (0.06146 * Kb - 0.08303 * Kx) * Ep * R ** 5
  const denominator = E * I + 0.061 * Ep * R ** 3
  const sigma_b_kgf = (2 / (f * Z)) * Wtotal * numerator / denominator
  const sigma_b     = sigma_b_kgf * KGF_TO_MPA   // MPa

  const deltaX = 2 * Kx * Wtotal * R ** 4 / (E * I + 0.061 * Ep * R ** 3)
  const deflectionRatio = deltaX / Do_cm * 100   // %
  const maxDeflection = hasLining ? STEEL_DEFLECTION_2004.mortar : STEEL_DEFLECTION_2004.coating

  return {
    Wv: earth.Wv, Wt: traffic.Wt, Wtotal, Cd: earth.Cd, B_cm: earth.B_cm,
    earthMethod: earth.method, impactFactor: traffic.i,
    Kb, Kx, R, I, Z, f,
    sigma_b_kgf, sigma_b,
    sigmaA_bend: allow.value,
    ok_bending: sigma_b <= allow.value,
    SF: allow.value / sigma_b,
    deltaX, deflectionRatio, maxDeflection,
    ok_deflection: deflectionRatio <= maxDeflection,
  }
}

/**
 * 강관 전체 구조안전성 검토 (6단계)
 * 입력 두께(pnGrade)를 채택 두께로 사용하여 안전성을 검토
 * @param {object} inputs
 * @returns {object} 계산 결과 전체
 */
export function calcSteelPipe(inputs) {
  const {
    DN, Pd, surgeRatio = 1.5, H,
    gammaSoil, Eprime,
    hasTraffic, hasLining, gwLevel,
    steelBeddingType = 'deg90',
    pnGrade = 'PN10',
    pipeDimManual = false, DoManual, tManual,
    steelGrade = 'SPS400', fyManual = 235,
    // 적용 설계기준: 'KDS2022'(기본) | 'KWW2004'
    codeStandard = 'KDS2022',
    steelGradeLegacy = 'STWW400',
    E_pipeManual = false, E_pipe = null,
    // 차량하중 방식: 'boussinesq'(기본) | 'wm'(직접계산)
    trafficMethod = 'boussinesq',
    wmPm = 100, wmC = 3.0, wmA = 0.2, wmTheta = 45,
  } = inputs

  const mat = PIPE_MATERIAL.steel
  const Es = (E_pipeManual && E_pipe != null) ? E_pipe : mat.Es

  // fy: 강종 선택 또는 직접입력
  const gradeRow = STEEL_GRADES.find(g => g.key === steelGrade)
  const fy = steelGrade === 'MANUAL' ? fyManual : (gradeRow?.fy ?? mat.fy)

  let Do, tAdopt
  if (pipeDimManual) {
    Do = DoManual
    tAdopt = tManual
  } else {
    const row = STEEL_THICKNESS[DN]
    if (!row) throw new Error(`강관 DN${DN}은 지원하지 않습니다.`)
    Do = row.Do
    tAdopt = row[pnGrade]
    if (!tAdopt) throw new Error(`DN${DN}에서 ${pnGrade} 등급을 찾을 수 없습니다.`)
  }

  // ────────────────────────────────────────
  // STEP 1: 내압 검토 (Barlow 공식)
  // 근거: AWWA M11 Eq.3-1 (Barlow) / KS D 3565  ※KDS 57 10 00에 명시 조항 없음
  // 채택된 두께로 실제 응력 계산 후 허용응력과 비교
  // ────────────────────────────────────────
  // ⚠ 내압(후프) 허용응력 0.50/0.75 fy 는 KDS 57 10 00 · 2004 기준 어느 쪽에도
  //   명시 조항이 없다(2004 참고표-4.2.5는 링휨 전용). 허용응력설계법의 관행값이다.
  //   링휨과 달리 대체할 원문 근거가 없어 값은 유지하되, 출처를 결과에 명시한다.
  const sigmaA_normal = mat.allowRatio_normal * fy  // MPa: 0.50 × fy
  const sigmaA_surge  = mat.allowRatio_surge  * fy  // MPa: 0.75 × fy
  const hoopAllowSource = '허용응력설계법 관행 (상시 0.50·fy / 수격 0.75·fy) — '
    + 'KDS 57 10 00 및 상수도시설기준(2004) 모두 내압 허용응력 명시 조항 없음'
  const Psurge = Pd * surgeRatio                        // MPa

  // Barlow 공식: σ = P × Do / (2t)
  const sigma_normal = (Pd     * Do) / (2 * tAdopt)  // MPa
  const sigma_surge  = (Psurge * Do) / (2 * tAdopt)  // MPa

  // 참고: 이 두께가 최소 소요 두께를 만족하는지 역산 (정보 제공용)
  const tp_normal  = (Pd     * Do) / (2 * sigmaA_normal)  // mm
  const tp_surge   = (Psurge * Do) / (2 * sigmaA_surge)   // mm
  const tHandling  = Do / mat.handlingDivisor              // mm
  const tCalcMin   = Math.max(tp_normal, tp_surge, tHandling)
  const tRequired  = tCalcMin                              // mm (최소 소요 두께, 참고용)

  const ok_normal = sigma_normal <= sigmaA_normal
  const ok_surge  = sigma_surge  <= sigmaA_surge

  // ────────────────────────────────────────
  // STEP 2: 토압 산정 (Prism Load)
  // ────────────────────────────────────────
  const { We, Pe } = calcEarthLoad({ gammaSoil, H, Do })

  // ────────────────────────────────────────
  // STEP 3: 차량하중 산정
  // ────────────────────────────────────────
  const trafficResult = trafficMethod === 'wm'
    ? calcTrafficLoadWm({ H, Do, hasTraffic, Pm: wmPm, C: wmC, a: wmA, theta: wmTheta })
    : calcTrafficLoad({ H, Do, hasTraffic })
  const { PL, WL, IF, PLraw } = trafficResult
  const Wtotal = We + WL
  const Ptotal = Wtotal / (Do / 1000)  // kPa

  // ────────────────────────────────────────
  // STEP 4: 외압 링 휨응력 검토
  //
  // [SET_B] KDS2022 / AWWA M11 §5.3 (기본)
  //   σ_b = Kb × W_total[kN/m] × Do[mm] / t²[mm²]  (MPa),  σ_ba = 0.5 × fy
  //   ※ KDS 57 10 00에는 링휨 허용응력 명시 조항이 없음. 실제 근거는 AWWA M11 + 안전율 2.0 관행
  //
  // [SET_A] KWW2004 — E' 포함식 + 강종별 고정 허용응력 (아래 setA 분기)
  //
  // ⚠ 허용응력은 응력 산정식과 1:1로 묶인다. 교차 조합 금지.
  //   금지: SET_B식 + 0.6fy (이중 관대·위험측) → resolveAllowable()로 구조적 차단
  // ────────────────────────────────────────
  // 구버전 저장 데이터 호환: deg180(기준표에 없는 각도, 폐기) → deg150
  let beddingKey = steelBeddingType === 'deg180' ? 'deg150' : steelBeddingType

  // KWW2004: 참고표-4.2.4 원문에 없는 지지각(deg0/deg30)은 사용 불가 → deg60으로 보정
  let beddingCoerced = null
  if (codeStandard === 'KWW2004' && !BEDDING_2004_ALLOWED.includes(beddingKey)) {
    beddingCoerced = beddingKey
    beddingKey = 'deg60'
  }

  const beddingRow = STEEL_BEDDING[beddingKey] || STEEL_BEDDING['deg90']
  const Kb_steel   = beddingRow.Kb
  const Kx_steel   = beddingRow.Kx

  // 허용응력은 반드시 이 단일 지점에서만 결정 (하드코딩 금지)
  const allow = resolveAllowable(codeStandard, { fy, steelGradeLegacy })

  let setA = null
  let sigma_b, sigmaA_bend, ok_bending
  if (codeStandard === 'KWW2004') {
    setA = calcSetA({
      Do, tAdopt, H, beddingKey,
      Eprime_MPa: Eprime / 1000,          // kPa → MPa
      allow, hasLining,
      // kN/m³ → kgf/cm³
      // 2004 기준은 중력단위계가 원단위로, γt=1.8 t/m³ ↔ 18 kN/m³ 를 등가로 취급한다.
      // (엄밀 환산 18/9.80665=1.8354 t/m³ 를 쓰면 원문 예제값 대비 약 2% 과대평가됨)
      gammaSoil_kgfcm3: gammaSoil / 10 * 0.001,
    })
    sigma_b     = setA.sigma_b
    sigmaA_bend = setA.sigmaA_bend
    ok_bending  = setA.ok_bending
  } else {
    sigma_b     = Kb_steel * Wtotal * Do / (tAdopt ** 2)  // MPa
    sigmaA_bend = allow.value                              // 0.5 × fy MPa
    ok_bending  = sigma_b <= sigmaA_bend
  }

  // ────────────────────────────────────────
  // STEP 5: 변형량 검토 (Modified Iowa Eq.)
  // 근거: AWWA M11 Eq.5-4 (Modified Iowa)
  // ────────────────────────────────────────
  const DL = 1.5       // 처짐 지연계수 (Deflection Lag Factor)
  const K  = Kx_steel  // 침상계수 — 기초지지각에 따른 Kx

  const t_m  = tAdopt / 1000   // mm → m
  const Do_m = Do / 1000       // mm → m
  const r    = (Do_m - t_m) / 2
  const I    = (t_m ** 3) / 12

  // EI: kN·m²/m (Es: MPa = MN/m² → × 1e3 → kN/m²)
  const EI     = Es * 1e3 * I
  const EI_r3  = EI / (r ** 3)
  const denominator = EI_r3 + 0.061 * Eprime

  // SET_A 선택 시 2004 처짐식·허용편평률 사용 (참고표-4.2.6: 도장 5% / 모르타르 3%)
  const deflectionRatio = setA ? setA.deflectionRatio : (DL * K * Ptotal) / denominator * 100  // %
  const maxDeflection   = setA
    ? setA.maxDeflection
    : (hasLining ? mat.maxDeflection_lined : mat.maxDeflection_plain)
  const ok_deflection   = deflectionRatio <= maxDeflection

  // ────────────────────────────────────────
  // STEP 6: 좌굴 검토 (AWWA M11 Eq.5-5)
  // 근거: AWWA M11 Eq.5-5
  // ────────────────────────────────────────
  const Rw = GW_RW[gwLevel] ?? 1.0

  const HoverDo = H / Do_m
  const Bprime  = 1 / (1 + 4 * Math.exp(-0.065 * HoverDo))

  const EI_Do3 = EI / (Do_m ** 3)
  const Pcr_theory = Math.sqrt(32 * Rw * Bprime * Eprime * EI_Do3)  // 이론 좌굴압력 (kPa)
  const Pcr = Pcr_theory / mat.bucklingFS                            // 허용 좌굴압력 (kPa)

  const Pe_ext = Ptotal
  // 안전율 = 이론 좌굴압력 / 실제 외압. 판정: FS_actual ≥ 2.5 (동치: Pcr(허용) ≥ Pe)
  // ※ 종전 구현은 허용값(이미 1/FS 적용)에 다시 FS ≥ 2.5를 요구하여 유효 안전율 6.25를
  //    강제하는 이중 적용 오류가 있었음 — 실무 계산서(02-1.xlsx) 판정 방식과 정합하도록 수정
  const bucklingFS_actual = Pcr_theory / Pe_ext
  const ok_buckling = bucklingFS_actual >= mat.bucklingFS

  // ────────────────────────────────────────
  // 최종 결과 조립
  // ────────────────────────────────────────
  const overallOK = ok_normal && ok_surge && ok_bending && ok_deflection && ok_buckling

  return {
    pipeType: 'steel',
    pipeDimManual,
    DN: pipeDimManual ? null : DN,
    Do, tAdopt, tRequired,
    pnGrade: pipeDimManual ? null : pnGrade,
    steelGrade, fy,

    // ── 적용 기준 이력 (보고서에 항상 출력) ──
    appliedCode: codeStandard,
    appliedCodeLabel: codeStandard === 'KWW2004'
      ? '상수도시설기준(2004) [참고-4.2.1]'
      : 'KDS 57 10 00 : 2022 / AWWA M11',
    appliedFormula: codeStandard === 'KWW2004'
      ? "σb = (2/(f·Z))·(Wv+Wt)·[Kb·R²·E·I + (0.06146·Kb − 0.08303·Kx)·E'·R⁵] / [E·I + 0.061·E'·R³]"
      : 'σb = Kb · W_total · Do / t²',
    allowSource: allow.source,
    hoopAllowSource,
    allowRatioLabel: allow.ratio,
    steelGradeLegacy: codeStandard === 'KWW2004' ? allow.gradeUsed : null,
    allowIsFallback: allow.isFallback,
    beddingCoerced,
    setA,

    steps: {
      step1: {
        title: '내압 검토',
        ref: 'AWWA M11 Eq.3-1 (Barlow) / KS D 3565',
        Pd, Psurge, surgeRatio,
        fy, steelGrade,
        sigmaA_normal, sigmaA_surge,
        tp_normal, tp_surge, tHandling, tCalcMin, tRequired,
        tAdopt, pnGrade,
        sigma_normal, sigma_surge,
        ok_normal, ok_surge,
        ok: ok_normal && ok_surge,
        formula: '\\sigma = \\frac{P \\times D_o}{2t} \\leq \\sigma_a',
      },
      step2: {
        title: '토압 산정 (Prism Load)',
        ref: 'AWWA M11 Ch.5 / KDS 24 12 20 (DB-24)',
        gammaSoil, H, Do,
        We, Pe,
        formula: 'W_e = \\gamma_s \\times H \\times D_o',
      },
      step3: {
        title: trafficMethod === 'wm' ? '차량하중 산정 (Wm 직접계산)' : '차량하중 산정 (DB-24 Boussinesq)',
        ref: trafficMethod === 'wm'
          ? '내진성능 평가요령 부록C 해설식(5.3.3)'
          : 'KDS 24 12 20 §4 (DB-24) / Boussinesq 분산',
        hasTraffic, H, PLraw, IF, PL,
        WL, Wtotal, Ptotal,
        trafficMethod,
        ...(trafficMethod === 'wm' ? { wmPm, wmC, wmA, wmTheta } : {}),
        formula: trafficMethod === 'wm'
          ? 'W_m = \\frac{2P_m D_o}{C(a+2h\\tan\\theta)}(1+i)'
          : 'W_L = P_L \\times D_o',
      },
      step4: {
        title: '외압 링 휨응력 검토',
        ref: 'AWWA M11 §5.3 / KS D 3565',
        steelBeddingType, Kb_steel,
        beddingLabel: beddingRow.label,
        Wtotal, Do, tAdopt,
        sigma_b, sigmaA_bend,
        ok: ok_bending,
        formula: '\\sigma_b = K_b \\cdot \\frac{W_{total} \\cdot D_o}{t^2} \\leq 0.5 f_y',
      },
      step5: {
        title: '변형량 검토 (Modified Iowa)',
        ref: 'AWWA M11 Eq.5-4 (Modified Iowa)',
        DL, K, Kx_steel, steelBeddingType,
        r, I, EI, EI_r3, Eprime,
        Ptotal, denominator, deflectionRatio, maxDeflection,
        hasLining, ok: ok_deflection,
        formula: '\\frac{\\Delta D}{D} = \\frac{D_L \\cdot K_x \\cdot P_{total}}{\\frac{EI}{r^3} + 0.061E\'} \\times 100',
      },
      step6: {
        title: '외압 좌굴 검토',
        ref: 'AWWA M11 Eq.5-5',
        gwLevel, Rw, HoverDo, Do_m, H, Bprime, EI_Do3, Eprime,
        Pcr_theory, Pcr, Pe_ext, bucklingFS_actual, FS_allow: mat.bucklingFS,
        ok: ok_buckling,
        formula: 'P_{cr} = \\frac{1}{FS}\\sqrt{32 R_w B\' E\' \\frac{EI}{D_o^3}}',
      },
    },
    verdict: {
      hoopNormal:  { label: '내압응력 (상시)', value: sigma_normal,      allow: sigmaA_normal,   unit: 'MPa', ok: ok_normal },
      hoopSurge:   { label: '내압응력 (수격)', value: sigma_surge,       allow: sigmaA_surge,    unit: 'MPa', ok: ok_surge },
      bending:     { label: '링 휨응력',       value: sigma_b,           allow: sigmaA_bend,     unit: 'MPa', ok: ok_bending },
      deflection:  { label: '처짐율',          value: deflectionRatio,   allow: maxDeflection,   unit: '%',   ok: ok_deflection },
      buckling:    { label: '좌굴 안전율',     value: bucklingFS_actual, allow: mat.bucklingFS,  unit: '',    ok: ok_buckling },
      overallOK,
    },
  }
}

/**
 * 병기(倂記) 판정 — SET_A / SET_B 동시 계산 후 비교
 *
 * verdict:
 *   PASS           A=OK, B=OK  → 적합
 *   CHECK_BACKFILL A=OK, B=NG  → 되메움 다짐도(E') 확인 필요. 관 결함 아님
 *   REINFORCE      A=NG, B=NG  → 보강 필요
 *   REVIEW         A=NG, B=OK  → 입력 오류 가능성 (경고)
 *
 * @returns {{ A, B, verdict, verdictLabel, verdictNote }}
 */
export function calcSteelPipeDual(inputs) {
  const A = calcSteelPipe({ ...inputs, codeStandard: 'KWW2004' })
  const B = calcSteelPipe({ ...inputs, codeStandard: 'KDS2022' })

  const aOK = A.steps.step4.ok
  const bOK = B.steps.step4.ok

  let verdict, verdictLabel, verdictNote
  if (aOK && bOK) {
    verdict = 'PASS'
    verdictLabel = '적합'
    verdictNote = '두 기준 모두 만족.'
  } else if (aOK && !bOK) {
    verdict = 'CHECK_BACKFILL'
    verdictLabel = '되메움 확인'
    verdictNote = "구 기준(E' 반영) 만족, 현행 기준(지반지지 무시) 초과. 되메움 다짐도(E') 확인 필요 — 관 결함이 아님."
  } else if (!aOK && !bOK) {
    verdict = 'REINFORCE'
    verdictLabel = '보강 필요'
    verdictNote = '두 기준 모두 초과. 관두께 상향 또는 보강 검토 필요.'
  } else {
    verdict = 'REVIEW'
    verdictLabel = '검토 요망'
    verdictNote = '구 기준 초과·현행 기준 만족 — 통상 발생하지 않는 조합. 입력값 확인 필요.'
  }

  return { A, B, verdict, verdictLabel, verdictNote }
}
