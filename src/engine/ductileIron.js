// ============================================================
// 수도용 덕타일 주철관 구조안전성 검토
// 근거: 「시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서」
//       제11장 상수도 11.5.2 (2) 수도용 덕타일 주철관 (11-137)
//
// 판정: 내압 및 외압에 의한 발생 복합 인장응력이 관재의 기준 인장강도를 만족
//   2.5·σts + 2.0·σtd + 1.4·σb < S
//     σts = P·D/(2t)                     정수압에 의한 인장응력
//     σtd = P′·D/(2t)                    수격압에 의한 인장응력
//     σb  = 6(Kf·Wf + Kt·Wt)·R²/t²       외압(토압+노면하중) 휨응력
//
// ⚠ 강관과 달리 조합식이므로 내압·외압을 분리하지 않는다 (지침이 조합을 규정).
// ⚠ 관두께는 관 상세검사 실측 최소값과 기준 두께 중 작은 값 (11-137 ②)
// ⚠ 자연유하 구간은 정수압, 가압구간은 수격압(정수압 이상 상승압력) 적용 (11-137 ②)
// ============================================================

import {
  DI_THICKNESS, DI_BEDDING, DI_COMBINED, EARTH_LOAD,
  REFERENCES, GUIDE_LABEL, resolveSafetyGrade,
} from './constants.js'
import { calcEarthLoad, calcTrafficLoad } from './earthLoad.js'
import { checkKdsCompliance } from './kdsCompliance.js'

// kg/cm² → MPa
const KGF_TO_MPA = 0.0980665

/**
 * 덕타일 주철관 구조안전성 검토
 * @param {object} inputs
 * @returns {object} 계산 결과 전체
 */
export function calcDuctileIron(inputs) {
  const {
    DN, Pd, H,
    gammaSoil_kgfcm3 = EARTH_LOAD.gamma_t,
    hasTraffic = true,
    diBeddingType = 'deg90',
    diKGrade = 'K9',
    pipeDimManual = false, DoManual, tManual,
    // 실측 최소 관두께 (mm) — 관 상세검사값. 미입력 시 기준 두께 사용 (11-137)
    tMeasured = null,
    // 자연유하 구간: 정수압 / 가압구간: 수격압 (11-137)
    pressureZone = 'gravity',   // 'gravity' | 'pumped'
    Psurge = null,              // MPa — 가압구간 수격압
    // 주부재 손상(단면손실) 유무 — 등급 a/b 구분 (11-133 표 11.74)
    hasSectionLoss = false,
  } = inputs

  // ── 관 제원 및 관두께 적용규칙 (11-137) ──
  let Do, tStandard
  if (pipeDimManual) {
    Do = DoManual
    tStandard = tManual
  } else {
    const row = DI_THICKNESS[DN]
    if (!row) throw new Error(`덕타일 주철관 DN${DN}은 지원하지 않습니다.`)
    Do = row.Do
    tStandard = row[diKGrade]
    if (!tStandard) throw new Error(`DN${DN}에서 ${diKGrade} 등급을 찾을 수 없습니다.`)
  }

  const hasMeasured = tMeasured != null && Number.isFinite(tMeasured) && tMeasured > 0
  const tAdopt = hasMeasured ? Math.min(tMeasured, tStandard) : tStandard
  const thicknessGoverned = hasMeasured
    ? (tMeasured < tStandard ? 'measured' : 'standard')
    : 'standard'

  const beddingRow = DI_BEDDING[diBeddingType] || DI_BEDDING['deg90']
  const { Kf, Kt } = beddingRow

  const Di = Do - 2 * tAdopt   // mm — 내경

  // ────────────────────────────────────────
  // STEP 1: 내압에 의한 인장응력 (11-137 (가))
  //   σts = P·D/(2t)   정수압
  //   σtd = P′·D/(2t)  수격압 — 가압구간에만 적용
  // ────────────────────────────────────────
  const sigma_ts = (Pd * Di) / (2 * tAdopt)          // MPa

  const isPumped = pressureZone === 'pumped'
  const Psurge_used = isPumped ? (Psurge ?? Pd * 1.5) : 0
  // 수격압은 정수압 이상 상승압력분 (11-137)
  const Pdelta = isPumped ? Math.max(0, Psurge_used - Pd) : 0
  const sigma_td = (Pdelta * Di) / (2 * tAdopt)      // MPa

  // ────────────────────────────────────────
  // STEP 2: 작용 하중(외압) — 강관과 동일 공식 (11-137: "강관의 계산공식과 동일")
  // ────────────────────────────────────────
  const earth = calcEarthLoad({ H, Do, gammaSoil_kgfcm3 })
  const traffic = hasTraffic ? calcTrafficLoad({ H }) : { Wt: 0, i: 0 }
  const Wf = earth.Wv       // kg/cm² — 상부 토압
  const Wt_load = traffic.Wt // kg/cm² — 노면하중

  // ────────────────────────────────────────
  // STEP 3: 외압에 의한 휨응력 (11-137 (나))
  //   σb = 6(Kf·Wf + Kt·Wt)·R² / t²
  //   ※ 원단위(cm, kg/cm²)로 계산 후 MPa 환산
  // ────────────────────────────────────────
  const Do_cm = Do / 10
  const t_cm  = tAdopt / 10
  const R_cm  = Do_cm / 2
  const sigma_b_kgf = 6 * (Kf * Wf + Kt * Wt_load) * R_cm ** 2 / (t_cm ** 2)  // kg/cm²
  const sigma_b = sigma_b_kgf * KGF_TO_MPA                                     // MPa

  // ────────────────────────────────────────
  // STEP 4: 조합응력 판정 (11-137)
  //   2.5·σts + 2.0·σtd + 1.4·σb < S
  // ────────────────────────────────────────
  const C = DI_COMBINED
  const demand = C.FS_static * sigma_ts + C.FS_surge * sigma_td + C.FS_bend * sigma_b
  const ok_combined = demand < C.S
  const utilization = demand / C.S

  // 안전율 및 안전성평가 등급 (11-133 [표 11.74])
  const SF = C.S / demand
  const safetyGrade = resolveSafetyGrade(SF, hasSectionLoss)

  const overallOK = ok_combined

  return {
    pipeType: 'ductile',
    pipeDimManual,
    DN: pipeDimManual ? null : DN,
    Do, Di, tAdopt, tStandard, tMeasured, thicknessGoverned, hasMeasured,
    selectedGrade: pipeDimManual ? null : diKGrade,

    // ── 적용 기준 이력 ──
    appliedCodeLabel: GUIDE_LABEL,
    appliedFormula: '2.5·σts + 2.0·σtd + 1.4·σb < S (=420 MPa)',
    allowSource: REFERENCES.diCombined,
    pressureZone,

    // ── 안전성평가 (11-133 표 11.74) ──
    SF, safetyGrade, hasSectionLoss,

    combined: {
      sigma_ts, sigma_td, sigma_b,
      FS_static: C.FS_static, FS_surge: C.FS_surge, FS_bend: C.FS_bend,
      demand, S: C.S, utilization, ok: ok_combined,
      formula: '2.5\\sigma_{ts} + 2.0\\sigma_{td} + 1.4\\sigma_b < S',
      note: `S = ${C.S} MPa (GCD400 인장강도, KS D 4311)`,
    },

    kdsCompliance: checkKdsCompliance({ DN, Do, H, hasTraffic, Pd, Psurge: Psurge_used, pipeDimManual }),

    steps: {
      step1: {
        title: '내압에 의한 인장응력',
        ref: REFERENCES.diCombined,
        Pd, Psurge: Psurge_used, Pdelta, pressureZone, isPumped,
        Do, Di, tAdopt, tStandard, tMeasured, thicknessGoverned,
        sigma_ts, sigma_td,
        ok: true,
        formula: '\\sigma_{ts} = \\frac{P \\cdot D}{2t},\\quad \\sigma_{td} = \\frac{P\' \\cdot D}{2t}',
      },
      step2: {
        title: '작용 하중 (외압)',
        ref: REFERENCES.earthLoad,
        H, Do, gammaSoil_kgfcm3,
        Wf, Cd: earth.Cd, B_cm: earth.B_cm, kmu: earth.kmu, earthMethod: earth.method,
        Wt: Wt_load, impactFactor: traffic.i, hasTraffic,
        ok: true,
        formula: 'W_f = C_d \\cdot \\gamma_t \\cdot B \\quad (H > 2.0m)',
      },
      step3: {
        title: '외압에 의한 휨응력',
        ref: REFERENCES.diCombined,
        diBeddingType, beddingLabel: beddingRow.label,
        Kf, Kt, R_cm, t_cm, Wf, Wt: Wt_load,
        sigma_b_kgf, sigma_b,
        ok: true,
        formula: '\\sigma_b = \\frac{6(K_f W_f + K_t W_t)R^2}{t^2}',
      },
      step4: {
        title: '조합응력 검토',
        ref: REFERENCES.diCombined,
        sigma_ts, sigma_td, sigma_b,
        FS_static: C.FS_static, FS_surge: C.FS_surge, FS_bend: C.FS_bend,
        demand, S: C.S, utilization, SF,
        ok: ok_combined,
        formula: '2.5\\sigma_{ts} + 2.0\\sigma_{td} + 1.4\\sigma_b < S',
      },
    },
    verdict: {
      combined: {
        label: '조합 인장응력', value: demand, allow: C.S, unit: 'MPa', ok: ok_combined,
      },
      overallOK,
    },
  }
}
