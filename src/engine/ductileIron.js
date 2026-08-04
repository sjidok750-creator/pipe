// ============================================================
// 덕타일 주철관 구조안전성 검토 — 4단계 (검토 개념: 주어진 K등급으로 안전성 확인)
// 근거: KS D 4311 / KDS 57 10 00 / AWWA C150
// ============================================================

import { PIPE_MATERIAL, DI_THICKNESS, BEDDING, DI_COMBINED_2004, MARSTON_2004, TRAFFIC_2004 } from './constants.js'
import { calcEarthLoad, calcEarthLoadMarston, calcTrafficLoad2004 } from './earthLoad.js'
import { calcTrafficLoad, calcTrafficLoadWm } from './trafficLoad.js'
import { checkKdsCompliance } from './kdsCompliance.js'

/**
 * 덕타일 주철관 전체 구조안전성 검토 (4단계)
 * 입력 K등급(diKGrade)의 두께로 안전성을 검토
 * @param {object} inputs
 * @returns {object} 계산 결과 전체
 */
export function calcDuctileIron(inputs) {
  const {
    DN, Pd, H, surgeRatio = 1.5,
    gammaSoil, Eprime,
    hasTraffic, beddingType,
    diKGrade = 'K9',
    codeStandard = 'KDS2022',
    pipeDimManual = false, DoManual, tManual,
    E_pipeManual = false, E_pipe = null,
    // 차량하중 방식: 'boussinesq'(기본) | 'wm'(직접계산)
    trafficMethod = 'boussinesq',
    wmPm = 100, wmC = 3.0, wmA = 0.2, wmTheta = 45,
  } = inputs

  const mat = PIPE_MATERIAL.ductile
  const Edi = (E_pipeManual && E_pipe != null) ? E_pipe : mat.Edi

  let Do, tAdopt
  if (pipeDimManual) {
    Do = DoManual
    tAdopt = tManual
  } else {
    const row = DI_THICKNESS[DN]
    if (!row) throw new Error(`덕타일 주철관 DN${DN}은 지원하지 않습니다.`)
    Do = row.Do
    tAdopt = row[diKGrade]
    if (!tAdopt) throw new Error(`DN${DN}에서 ${diKGrade} 등급을 찾을 수 없습니다.`)
  }

  const { Kb, Kd } = BEDDING[beddingType] || BEDDING['Type2']

  // ────────────────────────────────────────
  // STEP 1: 내압 검토
  // 근거: KS D 4311 §5
  // 채택된 K등급 두께로 후프응력 계산 후 허용응력과 비교
  // ────────────────────────────────────────
  const sigmaA_hoop = mat.fu * mat.allowRatio_hoop     // = 420/3 = 140 MPa
  const sigmaA_bend = mat.fu * mat.allowRatio_bending  // = 420×0.5 = 210 MPa

  const Di = Do - 2 * tAdopt  // mm 내경
  const sigma_hoop = (Pd * Di) / (2 * tAdopt)  // MPa (내경 기준 Barlow)

  // 최소관두께 역산 (참고용) — KS D 4311
  // 내압 최소두께: Di기반 Barlow 역산 → t = Pd×Do / (2×(σA+Pd))
  // 외압(링휨) 최소두께: σ_b = Kb×W×Do/t² → t = √(Kb×W×Do/σA_bend) [토압 전 계산 불가, step2 이후 재산정]
  const tp_hoop = (Pd * Do) / (2 * (sigmaA_hoop + Pd))  // mm (내압 기준)

  const ok_hoop = sigma_hoop <= sigmaA_hoop

  // ────────────────────────────────────────
  // STEP 2: 토압 + 차량하중
  // ────────────────────────────────────────
  // KWW2004: 토압·차량하중을 2004 [참고-4.2.1] 방식으로 산정
  //   H ≤ 2.0m 연직토압 / H > 2.0m Marston (관종 무관 공통)
  //   ※ 링휨 산정식 자체는 관종별로 다르므로 주철관은 강관의 E′ 포함식을 쓰지 않는다.
  //     주철관 원문식(p.171): σb = 6(Kf·Wf + Kt·Wt)R²/t²  — E′ 미포함, 탄성단면
  let We, WL, PL, IF, PLraw, earth2004 = null
  if (codeStandard === 'KWW2004') {
    const e = calcEarthLoadMarston({
      H, Do, gammaSoil_kgfcm3: gammaSoil / 10 * 0.001,
      kmu: MARSTON_2004.kmu, B_add_m: MARSTON_2004.B_add, H_limit: MARSTON_2004.H_prism_limit,
    })
    const tr = calcTrafficLoad2004({ H, ...TRAFFIC_2004 })
    earth2004 = { Wv: e.Wv, Wt: tr.Wt, Cd: e.Cd, B_cm: e.B_cm, method: e.method, impactFactor: tr.i }
    // kgf/cm² → kN/m  (×0.098067 MPa → ×1000 kPa → ×Do[m])
    const Do_m = Do / 1000
    We = e.Wv * 0.098067 * 1000 * Do_m
    WL = hasTraffic ? tr.Wt * 0.098067 * 1000 * Do_m : 0
    PL = hasTraffic ? tr.Wt * 0.098067 * 1000 : 0
    PLraw = PL; IF = tr.i
  } else {
    ;({ We } = calcEarthLoad({ gammaSoil, H, Do }))
    const trafficResult = trafficMethod === 'wm'
      ? calcTrafficLoadWm({ H, Do, hasTraffic, Pm: wmPm, C: wmC, a: wmA, theta: wmTheta })
      : calcTrafficLoad({ H, Do, hasTraffic })
    ;({ PL, WL, IF, PLraw } = trafficResult)
  }
  const Wtotal = We + WL
  const Ptotal = Wtotal / (Do / 1000)  // kPa

  // ────────────────────────────────────────
  // 링휨 최소두께 역산 (토압 산정 후 계산 가능)
  // tp_bend: σ_b = Kb×Wtotal×Do/t² ≤ σA_bend → t = √(Kb×Wtotal×Do/σA_bend)
  const tp_bend = Math.sqrt(Kb * Wtotal * Do / sigmaA_bend)  // mm (외압 기준)
  const tRequired = Math.max(tp_hoop, tp_bend)               // mm (최소 소요 두께, 참고용)

  // ────────────────────────────────────────
  // STEP 3: 링 휨응력 검토
  // 근거: DIPRA 링휨 / AWWA C150  ※KDS 57 10 00에 명시 조항 없음
  // σ_b = Kb × W_total[kN/m] × Do[mm] / t²[mm²]  (MPa)
  // 단위: kN/m × mm / mm² = N/mm = MPa  ✓
  // 허용응력: σ_ba = 0.5 × fu = 210 MPa  (KS D 4311 GCD400)
  // ────────────────────────────────────────
  const sigma_b_MPa = Kb * Wtotal * Do / (tAdopt ** 2)  // MPa
  const ok_bending  = sigma_b_MPa <= sigmaA_bend

  // ────────────────────────────────────────
  // STEP 3-2: [KWW2004] 조합응력 검토
  // 근거: 상수도시설기준(2004) — 덕타일 주철관
  //   σt = (Ps + Pd)·d / (2t)                      인장응력 (내압)
  //   σb = 6·(Kf·Wf + Kt·Wt)·R² / t²               휨응력 (탄성단면 Z = b·t²/6)
  //   판정: 2.5·σts + 2.0·σtd + 1.4·σb ≤ S         (S = 인장강도 420 MPa)
  //
  // ※ 현행 KDS2022 경로의 단독 허용치(0.5·fu = 210 MPa)는 그대로 유지되며,
  //   본 검토는 codeStandard='KWW2004' 일 때만 추가로 수행된다.
  // ※ S/1.4 = 300 MPa 를 단독 허용치로 노출하지 않는다 (조합검토 전제값).
  // ────────────────────────────────────────
  let combined = null
  if (codeStandard === 'KWW2004') {
    const C = DI_COMBINED_2004
    // 인장응력: 정수압(상시) / 수격압 분리
    const sigma_ts = (Pd * Di) / (2 * tAdopt)                    // MPa — 정수압분
    const sigma_td = (Pd * (surgeRatio - 1) * Di) / (2 * tAdopt) // MPa — 수격 증분
    // 휨응력 σb = 6·(Kf·Wf + Kt·Wt)·R² / t²   (탄성단면 Z = t²/6)
    // 2004 원식에서 W는 단위면적당 하중(압력)이므로 Ptotal[kPa]을 사용한다.
    //   M = Kb·P·R²  [kPa·mm²],  Z = t²/6  [mm²]  →  σ = M/Z [kPa] → /1000 → MPa
    // 결과적으로 DIPRA 링휨식(Kb·W·Do/t²)의 정확히 1.5배가 되며,
    // 이는 탄성단면계수(t²/6) 대 DIPRA식의 계수 차이에 해당한다.
    const R_mm = Do / 2
    const sigma_b_elastic = 6 * Kb * Ptotal * R_mm ** 2 / (tAdopt ** 2) / 1000  // MPa

    const demand = C.FS_static * sigma_ts + C.FS_surge * sigma_td + C.FS_bend * sigma_b_elastic
    combined = {
      sigma_ts, sigma_td, sigma_b: sigma_b_elastic,
      FS_static: C.FS_static, FS_surge: C.FS_surge, FS_bend: C.FS_bend,
      demand, S: C.S,
      utilization: demand / C.S,
      ok: demand <= C.S,
      formula: '2.5\\sigma_{ts} + 2.0\\sigma_{td} + 1.4\\sigma_b \\leq S',
      ref: '상수도시설기준(2004) 덕타일 주철관 조합응력',
      note: `S = ${C.S} MPa (GCD400 인장강도, KS D 4311)`,
    }
  }

  // ────────────────────────────────────────
  // STEP 4: 처짐량 검토 (Modified Iowa)
  // 근거: AWWA C150 (Modified Iowa)
  // ────────────────────────────────────────
  const t_m  = tAdopt / 1000
  const Do_m = Do / 1000
  const r    = (Do_m - t_m) / 2
  const I    = (t_m ** 3) / 12
  const EI   = Edi * 1e3 * I  // kN·m²/m
  const EI_r3  = EI / (r ** 3)
  const denominator = EI_r3 + 0.061 * Eprime
  const deflectionRatio = (Kd * Ptotal / denominator) * 100  // %
  const ok_deflection = deflectionRatio <= mat.maxDeflection

  // ────────────────────────────────────────
  // 최종 결과 조립
  // ────────────────────────────────────────
  const overallOK = ok_hoop && ok_bending && ok_deflection && (combined ? combined.ok : true)

  return {
    pipeType: 'ductile',
    pipeDimManual,
    DN: pipeDimManual ? null : DN,
    Do, Di, tAdopt, tRequired,
    selectedGrade: pipeDimManual ? null : diKGrade,
    appliedCode: codeStandard,
    appliedCodeLabel: codeStandard === 'KWW2004'
      ? '상수도시설기준(2004) — 조합응력 검토'
      : 'DIPRA 링휨 / AWWA C150',
    appliedFormula: codeStandard === 'KWW2004'
      ? '2.5·σts + 2.0·σtd + 1.4·σb ≤ S (=420 MPa)'
      : 'σb = Kb · W_total · Do / t²',
    allowSource: codeStandard === 'KWW2004'
      ? '상수도시설기준(2004) 덕타일 주철관 조합응력 — S = 420 MPa (GCD400 인장강도, KS D 4311)'
      : 'DIPRA / AWWA C150 (0.5·fu = 210 MPa) — KDS 57 10 00에 명시 조항 없음',
    combined,
    earth2004,
    kdsCompliance: checkKdsCompliance({ DN, Do, H, hasTraffic, Pd, surgeRatio, pipeDimManual }),
    steps: {
      step1: {
        title: '내압 검토',
        ref: 'KS D 4311 §5',
        Pd, Do, Di, tAdopt, selectedGrade: diKGrade,
        sigma_hoop, sigmaA_hoop,
        tp_hoop, tp_bend, tRequired,
        ok: ok_hoop,
        formula: '\\sigma_{hoop} = \\frac{P_d \\times D_i}{2t} \\leq \\frac{f_u}{3}',
      },
      step2: {
        title: '토압 및 차량하중 산정',
        ref: codeStandard === 'KWW2004'
          ? '상수도시설기준(2004) [참고-4.2.1] — H≤2m 연직토압 / H>2m Marston'
          : (trafficMethod === 'wm'
              ? '내진성능 평가요령 부록C 해설식(5.3.3)'
              : 'AWWA M11 Ch.5 / KDS 24 12 20'),
        earthMethod: earth2004?.method ?? 'prism',
        gammaSoil, H, Do,
        We, PLraw, IF, PL, WL, Wtotal, Ptotal,
        trafficMethod,
        ...(trafficMethod === 'wm' ? { wmPm, wmC, wmA, wmTheta } : {}),
        formula: trafficMethod === 'wm'
          ? 'W_m = \\frac{2P_m D}{C(a+2h\\tan\\theta)}(1+i)'
          : 'W_{total} = W_e + W_L',
      },
      step3: {
        title: '링 휨응력 검토',
        ref: 'DIPRA 링휨 / AWWA C150',
        Kb, Wtotal, Do, tAdopt,
        sigma_b: sigma_b_MPa, sigmaA_bend,
        ok: ok_bending,
        formula: '\\sigma_b = K_b \\cdot \\frac{W_{total} \\cdot D_o}{t^2} \\leq 0.5 f_u',
      },
      step4: {
        title: '처짐량 검토 (Modified Iowa)',
        ref: 'AWWA C150 (Modified Iowa)',
        Kd, r, I, EI, EI_r3, Eprime,
        Ptotal, denominator, deflectionRatio,
        maxDeflection: mat.maxDeflection,
        ok: ok_deflection,
        formula: '\\frac{\\Delta D}{D} = \\frac{K_d \\cdot P_{total}}{\\frac{EI}{r^3} + 0.061E\'}',
      },
    },
    verdict: {
      hoop:       { label: '내압응력',  value: sigma_hoop,       allow: sigmaA_hoop,       unit: 'MPa', ok: ok_hoop },
      bending:    { label: '링 휨응력', value: sigma_b_MPa,      allow: sigmaA_bend,       unit: 'MPa', ok: ok_bending },
      deflection: { label: '처짐율',    value: deflectionRatio,  allow: mat.maxDeflection, unit: '%',   ok: ok_deflection },
      overallOK,
    },
  }
}

/**
 * 병행 검토 — 주철관 SET_A(2004) / SET_B(현행) 동시 계산
 *
 * ※ 링휨 산정식은 관종별로 원문이 다르므로 강관의 E′ 포함식을 쓰지 않는다.
 *   주철관 원문식(2004 p.171): σb = 6(Kf·Wf + Kt·Wt)R² / t²  — E′ 미포함, 탄성단면
 *   두 기준의 실질 차이는 (a) 토압 산정(Marston/Prism) (b) 조합응력 검토 유무 이다.
 *
 * @returns {{ A, B, verdict, verdictLabel, verdictNote, primary, reference, ... }}
 */
export function calcDuctileIronDual(inputs) {
  const A = calcDuctileIron({ ...inputs, codeStandard: 'KWW2004' })
  const B = calcDuctileIron({ ...inputs, codeStandard: 'KDS2022' })

  // 2004는 조합응력이 지배 판정, 현행은 링휨 단독 허용치
  const aOK = A.combined ? A.combined.ok : A.steps.step3.ok
  const bOK = B.steps.step3.ok

  let verdict, verdictLabel, verdictNote
  if (aOK && bOK) {
    verdict = 'PASS'; verdictLabel = '적합'
    verdictNote = '두 기준 모두 만족.'
  } else if (aOK && !bOK) {
    verdict = 'CHECK_BACKFILL'; verdictLabel = '되메움 확인'
    verdictNote = '구 기준(Marston 토압) 만족, 현행 기준(Prism 토압) 초과. 되메움 다짐도 확인 필요 — 관 결함이 아님.'
  } else if (!aOK && !bOK) {
    verdict = 'REINFORCE'; verdictLabel = '보강 필요'
    verdictNote = '두 기준 모두 초과. K등급 상향 또는 보강 검토 필요.'
  } else {
    verdict = 'REVIEW'; verdictLabel = '검토 요망'
    verdictNote = '구 기준 초과·현행 기준 만족 — 조합응력이 지배한 경우이므로 입력값을 확인하십시오.'
  }

  const primaryCode = inputs.primaryCode ?? 'KWW2004'
  const primary   = primaryCode === 'KWW2004' ? A : B
  const reference = primaryCode === 'KWW2004' ? B : A
  const primaryLabel   = primaryCode === 'KWW2004' ? '상수도기준 2004' : 'KDS 2022'
  const referenceLabel = primaryCode === 'KWW2004' ? 'KDS 2022' : '상수도기준 2004'
  const primaryOK = primaryCode === 'KWW2004' ? aOK : bOK

  return {
    A, B, verdict, verdictLabel, verdictNote,
    primaryCode, primary, reference, primaryLabel, referenceLabel, primaryOK,
    pipeType: 'ductile',
  }
}
