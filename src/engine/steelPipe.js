// ============================================================
// 강관 구조안전성 계산 — 6단계
// 근거: AWWA M11 / ASCE / KDS 57 10 00 / KS D 3565
// ============================================================

import { PIPE_MATERIAL, STEEL_THICKNESS, GW_RW } from './constants.js'
import { calcEarthLoad } from './earthLoad.js'
import { calcTrafficLoad } from './trafficLoad.js'

/**
 * KS D 3565 표준두께 중 tRequired를 충족하는 최소 두께 선택
 * 선택 순서: PN6 → PN10 → PN16
 */
function selectSteelThickness(tRequired, DN) {
  const row = STEEL_THICKNESS[DN]
  if (!row) return { tAdopt: tRequired, grade: 'custom' }

  const grades = ['PN6', 'PN10', 'PN16']
  for (const grade of grades) {
    if (row[grade] >= tRequired) {
      return { tAdopt: row[grade], grade }
    }
  }
  // 모든 등급 초과 시 PN16 채택 (경고)
  return { tAdopt: row['PN16'], grade: 'PN16+' }
}

/**
 * 강관 전체 구조안전성 계산 (6단계)
 * @param {object} inputs
 * @returns {object} 계산 결과 전체
 */
export function calcSteelPipe(inputs) {
  const {
    DN, Pd, surgeRatio = 1.5, H,
    gammaSoil, Eprime,
    hasTraffic, hasLining, gwLevel,
  } = inputs

  const mat = PIPE_MATERIAL.steel
  const row = STEEL_THICKNESS[DN]
  if (!row) throw new Error(`강관 DN${DN}은 지원하지 않습니다.`)

  const Do = row.Do  // mm

  // ────────────────────────────────────────
  // STEP 1: 내압에 의한 관두께 결정
  // ────────────────────────────────────────
  const sigmaA_normal = mat.allowRatio_normal * mat.fy  // MPa
  const sigmaA_surge  = mat.allowRatio_surge  * mat.fy  // MPa
  const Psurge = Pd * surgeRatio                        // MPa

  // Barlow 공식: t = P × Do / (2 × σa)  [P: MPa, Do: mm → t: mm]
  const tp_normal = (Pd     * Do) / (2 * sigmaA_normal)  // mm
  const tp_surge  = (Psurge * Do) / (2 * sigmaA_surge)   // mm
  const tHandling = Do / mat.handlingDivisor              // mm
  const tCalc     = Math.max(tp_normal, tp_surge, tHandling)
  const tRequired = tCalc + mat.corrosionAllowance        // mm

  const { tAdopt, grade: pnGrade } = selectSteelThickness(tRequired, DN)

  // 채택 두께로 실제 응력 재계산
  const sigma_normal = (Pd     * Do) / (2 * tAdopt)  // MPa
  const sigma_surge  = (Psurge * Do) / (2 * tAdopt)  // MPa

  // ────────────────────────────────────────
  // STEP 2: 토압 산정 (Prism Load)
  // ────────────────────────────────────────
  const { We, Pe } = calcEarthLoad({ gammaSoil, H, Do })

  // ────────────────────────────────────────
  // STEP 3: 차량하중 산정 (DB-24)
  // ────────────────────────────────────────
  const { PL, WL, IF, PLraw } = calcTrafficLoad({ H, Do, hasTraffic })
  const Wtotal = We + WL           // kN/m
  const Ptotal = Wtotal / (Do / 1000)  // kPa

  // ────────────────────────────────────────
  // STEP 4: 변형량 검토 (Modified Iowa Eq.)
  // ────────────────────────────────────────
  const DL = 1.5   // 처짐 지연계수 (Deflection Lag Factor)
  const K  = 0.10  // 침상계수 (Bedding Constant)

  const t_m = tAdopt / 1000      // mm → m
  const Do_m = Do / 1000         // mm → m
  const r = (Do_m - t_m) / 2    // 중립면 반경 (m)
  const I = (t_m ** 3) / 12     // 단면 2차 모멘트 per 단위폭 (m⁴/m)

  // EI: kN·m²/m (Es: MPa = MN/m² → × 1e3 → kN/m²)
  const EI     = mat.Es * 1e3 * I
  const EI_r3  = EI / (r ** 3)
  const denominator = EI_r3 + 0.061 * Eprime

  const deflectionRatio = (DL * K * Ptotal) / denominator * 100  // %
  const maxDeflection   = hasLining ? mat.maxDeflection_lined : mat.maxDeflection_plain

  // ────────────────────────────────────────
  // STEP 5: 좌굴 검토 (AWWA M11 Eq.5-5)
  // ────────────────────────────────────────
  const Rw = GW_RW[gwLevel] ?? 1.0

  // B' = 1 / (1 + 4×e^(-0.065×H/Do_m))
  const HoverDo = H / Do_m
  const Bprime  = 1 / (1 + 4 * Math.exp(-0.065 * HoverDo))

  // Pcr = (1/FS) × √(32 × Rw × B' × E' × EI/Do³)
  const EI_Do3 = EI / (Do_m ** 3)
  const Pcr = (1 / mat.bucklingFS) * Math.sqrt(32 * Rw * Bprime * Eprime * EI_Do3)

  // 좌굴 검토 외압: 토압 + 차량하중 (수직)
  const Pe_ext = Ptotal  // kPa
  const bucklingFS_actual = Pcr / Pe_ext

  // ────────────────────────────────────────
  // 최종 결과 조립
  // ────────────────────────────────────────
  const ok_normal     = sigma_normal <= sigmaA_normal
  const ok_surge      = sigma_surge  <= sigmaA_surge
  const ok_deflection = deflectionRatio <= maxDeflection
  const ok_buckling   = bucklingFS_actual >= mat.bucklingFS
  const overallOK     = ok_normal && ok_surge && ok_deflection && ok_buckling

  return {
    pipeType: 'steel',
    DN, Do, tAdopt, tRequired, pnGrade,
    steps: {
      step1: {
        title: '내압에 의한 관두께 결정',
        ref: 'KDS 57 10 00 / AWWA M11 Eq.3-1',
        Pd, Psurge, surgeRatio,
        sigmaA_normal, sigmaA_surge,
        tp_normal, tp_surge, tHandling, tCalc, tRequired,
        tAdopt, pnGrade,
        sigma_normal, sigma_surge,
        ok_normal, ok_surge,
        formula: 't_p = P × D_o / (2 × \\sigma_a)',
      },
      step2: {
        title: '토압 산정 (Prism Load)',
        ref: 'KDS 57 10 00 §3.1 / AWWA M11 Ch.5',
        gammaSoil, H, Do,
        We, Pe,
        formula: 'W_e = \\gamma_s \\times H \\times D_o',
      },
      step3: {
        title: '차량하중 산정 (DB-24)',
        ref: 'KDS 24 12 20 (DB-24) / Boussinesq',
        hasTraffic, H, PLraw, IF, PL,
        WL, Wtotal, Ptotal,
        formula: 'W_L = P_L \\times D_o',
      },
      step4: {
        title: '변형량 검토 (Modified Iowa)',
        ref: 'AWWA M11 Eq.5-4',
        DL, K, r, I, EI, EI_r3, Eprime,
        denominator, deflectionRatio, maxDeflection,
        hasLining, ok: ok_deflection,
        formula: '\\frac{\\Delta D}{D} = \\frac{D_L \\cdot K \\cdot P_{total}}{\\frac{EI}{r^3} + 0.061E\'}',
      },
      step5: {
        title: '좌굴 검토',
        ref: 'AWWA M11 Eq.5-5',
        gwLevel, Rw, HoverDo, Bprime, EI_Do3,
        Pcr, Pe_ext, bucklingFS_actual, FS_allow: mat.bucklingFS,
        ok: ok_buckling,
        formula: 'P_{cr} = \\frac{1}{FS}\\sqrt{32 R_w B\' E\' \\frac{EI}{D_o^3}}',
      },
    },
    verdict: {
      hoopNormal:  { label: '내압응력 (상시)', value: sigma_normal, allow: sigmaA_normal, unit: 'MPa', ok: ok_normal },
      hoopSurge:   { label: '내압응력 (수격)', value: sigma_surge,  allow: sigmaA_surge,  unit: 'MPa', ok: ok_surge },
      deflection:  { label: '처짐율',          value: deflectionRatio, allow: maxDeflection, unit: '%',   ok: ok_deflection },
      buckling:    { label: '좌굴 안전율',      value: bucklingFS_actual, allow: mat.bucklingFS, unit: '',  ok: ok_buckling },
      overallOK,
    },
  }
}
