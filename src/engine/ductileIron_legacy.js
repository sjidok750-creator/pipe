// ============================================================
// 덕타일 주철관 구조안전성 검토 — 2004 기준 (구 상수도 시설기준)
// 근거: 환경부 「상수도 시설기준」(2004) 5.10절
//
// 현행(2025)과의 주요 차이:
//   토압:   Marston 공식  vs Prism Load
//   내압 허용응력: fu/4 = 105 MPa  vs fu/3 = 140 MPa
//   링휨 허용응력: 98 MPa  vs 0.5×fu = 210 MPa
//   링휨 공식:    단순식 동일 (DIPRA 방식 유지)
// ============================================================

import { PIPE_MATERIAL, DI_THICKNESS, BEDDING } from './constants.js'

// ── 2004 기준 덕타일 주철관 허용응력 ─────────────────────
// 출처: 구 상수도 시설기준(2004) 참고표-4.2.12
// 내압: fu/4 = 420/4 = 105 MPa (GC400급 기준, 참고표-4.2.12 확인)
// 링휨: 원문 미확인 — 분석파일 근거 98 MPa (1,000 kgf/cm²) 잠정 적용
//       ※ 참고표-4.2.13은 PE관(폴리에틸렌) 계산결과표로 주철관과 무관
//       ※ 덕타일 주철관 링휨 허용응력 원문 조항 추가 확인 필요
const LEGACY_DI_SIGMA_HOOP = 105   // MPa (fu/4, 참고표-4.2.12 확인)
const LEGACY_DI_SIGMA_BEND = 98    // MPa (1,000 kgf/cm² 환산, 원문 미확인 — 잠정값)

// ── Marston 토압 Cd 계수 계산 (강관과 동일 공식) ─────────
function calcCd(H, B) {
  const Kmu = 0.165
  const exponent = -2 * Kmu * H / B
  return (1 - Math.exp(exponent)) / (2 * Kmu)
}

function calcMarstonLoad({ gammaSoil, H, Do, excavationWidth }) {
  const Do_m = Do / 1000
  const B = excavationWidth != null ? excavationWidth : Do_m + 0.6
  const Cd = calcCd(H, B)
  const We = Cd * gammaSoil * B * B  // kN/m
  const Pe = We / Do_m               // kPa
  return { We, Pe, B, Cd }
}

// ── 2004 기준 DB 차량하중 보정 ───────────────────────────
const DB_LEGACY_RATIO = 96 / 196

/**
 * 2004 기준 덕타일 주철관 전체 구조안전성 검토
 * @param {object} inputs
 * @returns {object} 계산 결과
 */
export function calcDuctileIronLegacy(inputs) {
  const {
    DN, Pd, H,
    gammaSoil, Eprime,
    hasTraffic, beddingType,
    diKGrade = 'K9',
    pipeDimManual = false, DoManual, tManual,
    E_pipeManual = false, E_pipe = null,
    excavationWidth = null,
    legacyTrafficLoad = 0,  // 노면하중 Wt (kN/m) — 직접 입력
  } = inputs

  const mat = PIPE_MATERIAL.ductile
  const Edi = (E_pipeManual && E_pipe != null) ? E_pipe : mat.Edi

  // ── 관 제원 ─────────────────────────────────────────────
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

  // 2004 기준 허용응력
  const sigmaA_hoop = LEGACY_DI_SIGMA_HOOP  // 105 MPa
  const sigmaA_bend = LEGACY_DI_SIGMA_BEND  // 98.07 MPa

  // ────────────────────────────────────────
  // STEP 1: 내압 검토 (Di 기준 Barlow, 2004)
  // 허용응력: fu/4 = 105 MPa (현행 fu/3 = 140 MPa보다 엄격)
  // ────────────────────────────────────────
  const Di        = Do - 2 * tAdopt
  const sigma_hoop = (Pd * Di) / (2 * tAdopt)  // MPa

  const tp_hoop = (Pd * Do) / (2 * (sigmaA_hoop + Pd))  // mm

  const ok_hoop = sigma_hoop <= sigmaA_hoop

  // ────────────────────────────────────────
  // STEP 2: 토압 + 차량하중 (Marston + 구 DB)
  // ────────────────────────────────────────
  const { We, Pe, B, Cd } = calcMarstonLoad({ gammaSoil, H, Do, excavationWidth })
  const WL_legacy = hasTraffic ? (legacyTrafficLoad ?? 0) : 0  // kN/m 직접입력
  const Wtotal = We + WL_legacy
  const Ptotal = Wtotal / (Do / 1000)  // kPa

  // 링휨 최소두께 역산
  const tp_bend = Math.sqrt(Kb * Wtotal * Do / sigmaA_bend)
  const tRequired = Math.max(tp_hoop, tp_bend)

  // ────────────────────────────────────────
  // STEP 3: 링 휨응력 검토 (DIPRA 단순식)
  // 공식 자체는 현행과 동일 (E' 미반영)
  // 허용응력: 98 MPa (현행 210 MPa보다 엄격)
  // ────────────────────────────────────────
  const sigma_b  = Kb * Wtotal * Do / (tAdopt ** 2)  // MPa
  const ok_bending = sigma_b <= sigmaA_bend

  // ────────────────────────────────────────
  // STEP 4: 처짐량 검토 (Modified Iowa)
  // 허용처짐: 3% (현행과 동일)
  // ────────────────────────────────────────
  const t_m  = tAdopt / 1000
  const Do_m = Do / 1000
  const r    = (Do_m - t_m) / 2
  const I    = (t_m ** 3) / 12
  const EI   = Edi * 1e3 * I
  const EI_r3  = EI / (r ** 3)
  const denominator    = EI_r3 + 0.061 * Eprime
  const deflectionRatio = (Kd * Ptotal / denominator) * 100  // %
  const maxDeflection  = 3.0
  const ok_deflection  = deflectionRatio <= maxDeflection

  // ────────────────────────────────────────
  // 최종 결과 조립
  // ────────────────────────────────────────
  const overallOK = ok_hoop && ok_bending && ok_deflection

  return {
    pipeType: 'ductile',
    designStandard: '2004',
    pipeDimManual,
    DN: pipeDimManual ? null : DN,
    Do, Di, tAdopt, tRequired,
    selectedGrade: pipeDimManual ? null : diKGrade,
    steps: {
      step1: {
        title: '내압 검토',
        ref: '구 상수도 시설기준(2004) 5.10절',
        Pd, Do, Di, tAdopt, selectedGrade: diKGrade,
        sigma_hoop, sigmaA_hoop,
        tp_hoop, tp_bend, tRequired,
        ok: ok_hoop,
        note: '2004 기준: 허용응력 fu/4 = 105 MPa (현행 fu/3 = 140 MPa)',
      },
      step2: {
        title: '토압 및 차량하중 산정 (Marston + 구 DB)',
        ref: '구 상수도 시설기준(2004) 5.10절',
        gammaSoil, H, Do,
        excavationWidth, B, Cd,
        We, WL_legacy,
        Wtotal, Ptotal,
        note: `굴착폭 B=${B.toFixed(2)}m, Cd=${Cd.toFixed(3)} / 노면하중 Wt=${WL_legacy} kN/m (직접 입력)`,
      },
      step3: {
        title: '링 휨응력 검토',
        ref: '구 상수도 시설기준(2004) 5.10절 / DIPRA 방식',
        Kb, Wtotal, Do, tAdopt,
        sigma_b, sigmaA_bend,
        ok: ok_bending,
        note: '2004 기준: 허용응력 98 MPa (현행 210 MPa). 공식은 DIPRA 단순식 동일.',
      },
      step4: {
        title: '처짐량 검토 (Modified Iowa)',
        ref: '구 상수도 시설기준(2004) 5.10절',
        Kd, r, I, EI, EI_r3, Eprime,
        Ptotal, denominator, deflectionRatio,
        maxDeflection,
        ok: ok_deflection,
      },
    },
    verdict: {
      hoop:       { label: '내압응력',  value: sigma_hoop,      allow: sigmaA_hoop,   unit: 'MPa', ok: ok_hoop },
      bending:    { label: '링 휨응력', value: sigma_b,         allow: sigmaA_bend,   unit: 'MPa', ok: ok_bending },
      deflection: { label: '처짐율',    value: deflectionRatio, allow: maxDeflection, unit: '%',   ok: ok_deflection },
      overallOK,
    },
  }
}
