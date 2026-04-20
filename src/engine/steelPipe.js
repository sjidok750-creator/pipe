// ============================================================
// 강관 구조안전성 검토 — 6단계 (검토 개념: 주어진 두께로 안전성 확인)
// 근거: AWWA M11 / ASCE / KDS 57 10 00 / KS D 3565
// ============================================================

import { PIPE_MATERIAL, STEEL_THICKNESS, GW_RW, STEEL_BEDDING, STEEL_GRADES } from './constants.js'
import { calcEarthLoad } from './earthLoad.js'
import { calcTrafficLoad } from './trafficLoad.js'

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
  } = inputs

  const mat = PIPE_MATERIAL.steel

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
  // 근거: KDS 57 10 00 §3.2 / AWWA M11 Eq.3-1 / KS D 3565
  // 채택된 두께로 실제 응력 계산 후 허용응력과 비교
  // ────────────────────────────────────────
  const sigmaA_normal = mat.allowRatio_normal * fy  // MPa: 0.50 × fy
  const sigmaA_surge  = mat.allowRatio_surge  * fy  // MPa: 0.75 × fy
  const Psurge = Pd * surgeRatio                        // MPa

  // Barlow 공식: σ = P × Do / (2t)
  const sigma_normal = (Pd     * Do) / (2 * tAdopt)  // MPa
  const sigma_surge  = (Psurge * Do) / (2 * tAdopt)  // MPa

  // 참고: 이 두께가 최소 소요 두께를 만족하는지 역산 (정보 제공용)
  const tp_normal  = (Pd     * Do) / (2 * sigmaA_normal)  // mm
  const tp_surge   = (Psurge * Do) / (2 * sigmaA_surge)   // mm
  const tHandling  = Do / mat.handlingDivisor              // mm
  const tCalcMin   = Math.max(tp_normal, tp_surge, tHandling)
  const tRequired  = tCalcMin + mat.corrosionAllowance     // mm (최소 소요 두께, 참고용)

  const ok_normal = sigma_normal <= sigmaA_normal
  const ok_surge  = sigma_surge  <= sigmaA_surge

  // ────────────────────────────────────────
  // STEP 2: 토압 산정 (Prism Load)
  // ────────────────────────────────────────
  const { We, Pe } = calcEarthLoad({ gammaSoil, H, Do })

  // ────────────────────────────────────────
  // STEP 3: 차량하중 산정 (DB-24)
  // ────────────────────────────────────────
  const { PL, WL, IF, PLraw } = calcTrafficLoad({ H, Do, hasTraffic })
  const Wtotal = We + WL
  const Ptotal = Wtotal / (Do / 1000)  // kPa

  // ────────────────────────────────────────
  // STEP 4: 외압 링 휨응력 검토
  // 근거: KDS 57 10 00 §3.4 / AWWA M11 §5.3
  //
  // σ_b = Kb × W_total[kN/m] × Do[mm] / t²[mm²]  (MPa)
  // 단위: kN/m × mm / mm² = N/mm² = MPa  ✓
  //
  // 허용응력 σ_ba = 0.5 × fy (KDS 57 상시 하중조합)
  // ────────────────────────────────────────
  const beddingRow = STEEL_BEDDING[steelBeddingType] || STEEL_BEDDING['deg90']
  const Kb_steel   = beddingRow.Kb
  const Kx_steel   = beddingRow.Kx

  const sigma_b     = Kb_steel * Wtotal * Do / (tAdopt ** 2)  // MPa
  const sigmaA_bend = mat.allowRatio_normal * fy               // 0.5 × fy MPa
  const ok_bending  = sigma_b <= sigmaA_bend

  // ────────────────────────────────────────
  // STEP 5: 변형량 검토 (Modified Iowa Eq.)
  // 근거: AWWA M11 Eq.5-4 / KDS 57 10 00 §3.5
  // ────────────────────────────────────────
  const DL = 1.5       // 처짐 지연계수 (Deflection Lag Factor)
  const K  = Kx_steel  // 침상계수 — 기초지지각에 따른 Kx

  const t_m  = tAdopt / 1000   // mm → m
  const Do_m = Do / 1000       // mm → m
  const r    = (Do_m - t_m) / 2
  const I    = (t_m ** 3) / 12

  // EI: kN·m²/m (Es: MPa = MN/m² → × 1e3 → kN/m²)
  const EI     = mat.Es * 1e3 * I
  const EI_r3  = EI / (r ** 3)
  const denominator = EI_r3 + 0.061 * Eprime

  const deflectionRatio = (DL * K * Ptotal) / denominator * 100  // %
  const maxDeflection   = hasLining ? mat.maxDeflection_lined : mat.maxDeflection_plain
  const ok_deflection   = deflectionRatio <= maxDeflection

  // ────────────────────────────────────────
  // STEP 6: 좌굴 검토 (AWWA M11 Eq.5-5)
  // 근거: AWWA M11 Eq.5-5 / KDS 57 10 00 §3.6
  // ────────────────────────────────────────
  const Rw = GW_RW[gwLevel] ?? 1.0

  const HoverDo = H / Do_m
  const Bprime  = 1 / (1 + 4 * Math.exp(-0.065 * HoverDo))

  const EI_Do3 = EI / (Do_m ** 3)
  const Pcr = (1 / mat.bucklingFS) * Math.sqrt(32 * Rw * Bprime * Eprime * EI_Do3)

  const Pe_ext = Ptotal
  const bucklingFS_actual = Pcr / Pe_ext
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
    steps: {
      step1: {
        title: '내압 검토',
        ref: 'KDS 57 10 00 §3.2 / AWWA M11 Eq.3-1 / KS D 3565',
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
        ref: 'KDS 57 10 00 §3.3 / AWWA M11 Ch.5',
        gammaSoil, H, Do,
        We, Pe,
        formula: 'W_e = \\gamma_s \\times H \\times D_o',
      },
      step3: {
        title: '차량하중 산정 (DB-24)',
        ref: 'KDS 24 12 20 §4 (DB-24) / Boussinesq 분산',
        hasTraffic, H, PLraw, IF, PL,
        WL, Wtotal, Ptotal,
        formula: 'W_L = P_L \\times D_o',
      },
      step4: {
        title: '외압 링 휨응력 검토',
        ref: 'KDS 57 10 00 §3.4 / AWWA M11 §5.3 / KS D 3565',
        steelBeddingType, Kb_steel,
        beddingLabel: beddingRow.label,
        Wtotal, Do, tAdopt,
        sigma_b, sigmaA_bend,
        ok: ok_bending,
        formula: '\\sigma_b = K_b \\cdot \\frac{W_{total} \\cdot D_o}{t^2} \\leq 0.5 f_y',
      },
      step5: {
        title: '변형량 검토 (Modified Iowa)',
        ref: 'KDS 57 10 00 §3.5 / AWWA M11 Eq.5-4',
        DL, K, Kx_steel, steelBeddingType,
        r, I, EI, EI_r3, Eprime,
        Ptotal, denominator, deflectionRatio, maxDeflection,
        hasLining, ok: ok_deflection,
        formula: '\\frac{\\Delta D}{D} = \\frac{D_L \\cdot K_x \\cdot P_{total}}{\\frac{EI}{r^3} + 0.061E\'} \\times 100',
      },
      step6: {
        title: '외압 좌굴 검토',
        ref: 'KDS 57 10 00 §3.6 / AWWA M11 Eq.5-5',
        gwLevel, Rw, HoverDo, Do_m, H, Bprime, EI_Do3, Eprime,
        Pcr, Pe_ext, bucklingFS_actual, FS_allow: mat.bucklingFS,
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
