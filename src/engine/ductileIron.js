// ============================================================
// 덕타일 주철관 구조안전성 검토 — 4단계 (검토 개념: 주어진 K등급으로 안전성 확인)
// 근거: KS D 4311 / DIPRA / AWWA C150
// ============================================================

import { PIPE_MATERIAL, DI_THICKNESS, BEDDING } from './constants.js'
import { calcEarthLoad } from './earthLoad.js'
import { calcTrafficLoad } from './trafficLoad.js'

/**
 * 덕타일 주철관 전체 구조안전성 검토 (4단계)
 * 입력 K등급(diKGrade)의 두께로 안전성을 검토
 * @param {object} inputs
 * @returns {object} 계산 결과 전체
 */
export function calcDuctileIron(inputs) {
  const {
    DN, Pd, H,
    gammaSoil, Eprime,
    hasTraffic, beddingType,
    diKGrade = 'K9',
    pipeDimManual = false, DoManual, tManual,
    E_pipeManual = false, E_pipe = null,
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
  // 근거: KS D 4311 / DIPRA §2.1
  // 채택된 K등급 두께로 후프응력 계산 후 허용응력과 비교
  // ────────────────────────────────────────
  const sigmaA_hoop = mat.fu * mat.allowRatio_hoop     // = 420/3 = 140 MPa
  const sigmaA_bend = mat.fu * mat.allowRatio_bending  // = 420×0.5 = 210 MPa

  const Di = Do - 2 * tAdopt  // mm 내경
  const sigma_hoop = (Pd * Di) / (2 * tAdopt)  // MPa (내경 기준 Barlow)

  // 최소관두께 역산 (참고용) — KS D 4311 / DIPRA
  // 내압 최소두께: Di기반 Barlow 역산 → t = Pd×Do / (2×(σA+Pd))
  // 외압(링휨) 최소두께: σ_b = Kb×W×Do/t² → t = √(Kb×W×Do/σA_bend) [토압 전 계산 불가, step2 이후 재산정]
  const tp_hoop = (Pd * Do) / (2 * (sigmaA_hoop + Pd))  // mm (내압 기준)

  const ok_hoop = sigma_hoop <= sigmaA_hoop

  // ────────────────────────────────────────
  // STEP 2: 토압 + 차량하중
  // ────────────────────────────────────────
  const { We } = calcEarthLoad({ gammaSoil, H, Do })
  const { PL, WL, IF, PLraw } = calcTrafficLoad({ H, Do, hasTraffic })
  const Wtotal = We + WL
  const Ptotal = Wtotal / (Do / 1000)  // kPa

  // ────────────────────────────────────────
  // 링휨 최소두께 역산 (토압 산정 후 계산 가능)
  // tp_bend: σ_b = Kb×Wtotal×Do/t² ≤ σA_bend → t = √(Kb×Wtotal×Do/σA_bend)
  const tp_bend = Math.sqrt(Kb * Wtotal * Do / sigmaA_bend)  // mm (외압 기준)
  const tRequired = Math.max(tp_hoop, tp_bend)               // mm (최소 소요 두께, 참고용)

  // ────────────────────────────────────────
  // STEP 3: 링 휨응력 검토 (DIPRA §2.3)
  // σ_b = Kb × W_total[kN/m] × Do[mm] / t²[mm²]  (MPa)
  // 단위: kN/m × mm / mm² = N/mm = MPa  ✓
  // 허용응력: σ_ba = 0.5 × fu = 210 MPa
  // ────────────────────────────────────────
  const sigma_b_MPa = Kb * Wtotal * Do / (tAdopt ** 2)  // MPa
  const ok_bending  = sigma_b_MPa <= sigmaA_bend

  // ────────────────────────────────────────
  // STEP 4: 처짐량 검토 (Modified Iowa)
  // 근거: AWWA C150 / DIPRA §2.4
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
  const overallOK = ok_hoop && ok_bending && ok_deflection

  return {
    pipeType: 'ductile',
    pipeDimManual,
    DN: pipeDimManual ? null : DN,
    Do, Di, tAdopt, tRequired,
    selectedGrade: pipeDimManual ? null : diKGrade,
    steps: {
      step1: {
        title: '내압 검토',
        ref: 'KS D 4311 / DIPRA §2.1',
        Pd, Do, Di, tAdopt, selectedGrade: diKGrade,
        sigma_hoop, sigmaA_hoop,
        tp_hoop, tp_bend, tRequired,
        ok: ok_hoop,
        formula: '\\sigma_{hoop} = \\frac{P_d \\times D_i}{2t} \\leq \\frac{f_u}{3}',
      },
      step2: {
        title: '토압 및 차량하중 산정',
        ref: 'KDS 57 10 00 §3.1 / KDS 24 12 20',
        gammaSoil, H, Do,
        We, PLraw, IF, PL, WL, Wtotal, Ptotal,
        formula: 'W_{total} = W_e + W_L',
      },
      step3: {
        title: '링 휨응력 검토',
        ref: 'DIPRA §2.3 / KDS 57 10 00 §3.4',
        Kb, Wtotal, Do, tAdopt,
        sigma_b: sigma_b_MPa, sigmaA_bend,
        ok: ok_bending,
        formula: '\\sigma_b = K_b \\cdot \\frac{W_{total} \\cdot D_o}{t^2} \\leq 0.5 f_u',
      },
      step4: {
        title: '처짐량 검토 (Modified Iowa)',
        ref: 'AWWA C150 / DIPRA §2.4',
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
