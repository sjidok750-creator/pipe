// ============================================================
// 덕타일 주철관 구조안전성 계산 — 4단계
// 근거: KS D 4311 / DIPRA / AWWA C150
// ============================================================

import { PIPE_MATERIAL, DI_THICKNESS, BEDDING } from './constants.js'
import { calcEarthLoad } from './earthLoad.js'
import { calcTrafficLoad } from './trafficLoad.js'

/**
 * 덕타일 주철관 전체 구조안전성 계산 (4단계)
 * @param {object} inputs
 * @returns {object} 계산 결과 전체
 */
export function calcDuctileIron(inputs) {
  const {
    DN, Pd, H,
    gammaSoil, Eprime,
    hasTraffic, beddingType,
  } = inputs

  const mat = PIPE_MATERIAL.ductile
  const row = DI_THICKNESS[DN]
  if (!row) throw new Error(`덕타일 주철관 DN${DN}은 지원하지 않습니다.`)

  const Do = row.Do  // mm
  const { Kb, Kd } = BEDDING[beddingType] || BEDDING['Type2']

  // ────────────────────────────────────────
  // STEP 1: 내압 검토 — K등급 선택
  // ────────────────────────────────────────
  const sigmaA_hoop = mat.fu * mat.allowRatio_hoop       // = 420/3 = 140 MPa
  const sigmaA_bend = mat.fu * mat.allowRatio_bending    // = 420×0.5 = 210 MPa

  // KDS 57 / 수도용 관로 설계 기준: 최소 K9 이상 사용
  // K9 이상 등급 중 내압 검토 충족하는 최소 등급 선택
  const kGrades = ['K9', 'K10', 'K12']
  let selectedGrade = 'K12'
  let tAdopt = row['K12']

  // 최소 충족 K등급 선택 (내경 기준 Barlow)
  for (const grade of kGrades) {
    const t = row[grade]
    const Di = Do - 2 * t  // mm 내경
    const sigma = (Pd * Di) / (2 * t)  // MPa
    if (sigma <= sigmaA_hoop) {
      selectedGrade = grade
      tAdopt = t
      break
    }
  }

  const Di = Do - 2 * tAdopt  // mm
  const sigma_hoop = (Pd * Di) / (2 * tAdopt)  // MPa

  // ────────────────────────────────────────
  // STEP 2: 토압 + 차량하중
  // ────────────────────────────────────────
  const { We } = calcEarthLoad({ gammaSoil, H, Do })
  const { PL, WL, IF, PLraw } = calcTrafficLoad({ H, Do, hasTraffic })
  const Wtotal = We + WL          // kN/m
  const Ptotal = Wtotal / (Do / 1000)  // kPa

  // ────────────────────────────────────────
  // STEP 3: 링 휨응력 (DIPRA §2.3)
  // σ_b = Kb × W_total × Do / t²
  // 단위: [kN/m × mm / mm²] = [kN/m × 1/mm] → MPa 환산
  // W_total (kN/m), Do (mm), t² (mm²)
  // σ_b (MPa) = Kb × W_total(kN/m) × Do(mm) / t²(mm²)
  //           = Kb × W × Do / t² × (1/1000) [MPa]
  // ────────────────────────────────────────
  // σ_b [MPa] = Kb × Wtotal[kN/m] × Do[mm] / t²[mm²]
  // 단위확인: 1kN/m = 1N/mm → kN/m × mm/mm² = N/mm = MPa ✓
  const sigma_b_MPa = Kb * Wtotal * Do / (tAdopt ** 2)  // MPa

  // ────────────────────────────────────────
  // STEP 4: 처짐량 (Modified Iowa)
  // ────────────────────────────────────────
  const t_m  = tAdopt / 1000   // mm → m
  const Do_m = Do / 1000       // mm → m
  const r    = (Do_m - t_m) / 2
  const I    = (t_m ** 3) / 12
  const EI   = mat.Edi * 1e3 * I   // kN·m²/m
  const EI_r3  = EI / (r ** 3)
  const denominator = EI_r3 + 0.061 * Eprime
  const deflectionRatio = (Kd * Ptotal / denominator) * 100  // %

  // ────────────────────────────────────────
  // 최종 결과 조립
  // ────────────────────────────────────────
  const ok_hoop       = sigma_hoop <= sigmaA_hoop
  const ok_bending    = sigma_b_MPa <= sigmaA_bend
  const ok_deflection = deflectionRatio <= mat.maxDeflection
  const overallOK     = ok_hoop && ok_bending && ok_deflection

  return {
    pipeType: 'ductile',
    DN, Do, Di, tAdopt, selectedGrade,
    steps: {
      step1: {
        title: '내압 검토 — K등급 선택',
        ref: 'KS D 4311 / DIPRA §2.1',
        Pd, Do, Di, tAdopt, selectedGrade,
        sigma_hoop, sigmaA_hoop,
        ok: ok_hoop,
        formula: '\\sigma_{hoop} = \\frac{P_d \\times D_i}{2t}',
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
        ref: 'DIPRA §2.3',
        Kb, Wtotal, Do, tAdopt,
        sigma_b: sigma_b_MPa, sigmaA_bend,
        ok: ok_bending,
        formula: '\\sigma_b = K_b \\cdot \\frac{W_{total} \\cdot D_o}{t^2}',
      },
      step4: {
        title: '처짐량 검토 (Modified Iowa)',
        ref: 'AWWA C150 / DIPRA §2.4',
        Kd, r, I, EI, EI_r3, Eprime,
        denominator, deflectionRatio,
        maxDeflection: mat.maxDeflection,
        ok: ok_deflection,
        formula: '\\frac{\\Delta D}{D} = \\frac{K_d \\cdot P_{total}}{\\frac{EI}{r^3} + 0.061E\'}',
      },
    },
    verdict: {
      hoop:       { label: '내압응력', value: sigma_hoop,       allow: sigmaA_hoop,     unit: 'MPa', ok: ok_hoop },
      bending:    { label: '링 휨응력', value: sigma_b_MPa,     allow: sigmaA_bend,     unit: 'MPa', ok: ok_bending },
      deflection: { label: '처짐율',   value: deflectionRatio, allow: mat.maxDeflection, unit: '%',  ok: ok_deflection },
      overallOK,
    },
  }
}
