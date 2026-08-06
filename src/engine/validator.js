// ============================================================
// 입력값 유효성 검사
// ============================================================

import { STEEL_THICKNESS, DI_THICKNESS, STEEL_PN_GRADES, DI_K_GRADES,
         BEDDING_ALLOWED, EPRIME_KGFCM2 } from './constants.js'

/**
 * 입력값 전체 유효성 검사
 * 근거: 세부지침 제11장 11.5.2
 * @param {object} inputs
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateInputs(inputs) {
  const errors = {}

  const { pipeType, DN, Pd, H, gammaSoil_kgfcm3, Eprime_kgfcm2, pnGrade, diKGrade,
          pipeDimManual, DoManual, tManual, tMeasured,
          steelBeddingType, pressureZone, Psurge } = inputs

  // 지지각 — 지침 11-135 표에 있는 60·90·120·150° 만 사용 가능
  if (pipeType === 'steel' && steelBeddingType && !BEDDING_ALLOWED.includes(steelBeddingType)) {
    errors.steelBeddingType = '세부지침은 지지각 60·90·120·150°만 규정합니다. 60°로 보정되어 계산됩니다.'
  }

  // 실측 최소 관두께 (선택 입력)
  if (tMeasured != null && tMeasured !== '') {
    const tm = Number(tMeasured)
    if (!Number.isFinite(tm) || tm <= 0) {
      errors.tMeasured = '실측 관두께는 0보다 커야 합니다.'
    } else if (tm > 100) {
      errors.tMeasured = '실측 관두께가 너무 큽니다 (최대 100mm).'
    }
  }

  // 가압구간 수격압
  if (pressureZone === 'pumped' && Psurge != null && Psurge !== '') {
    const ps = Number(Psurge)
    if (!Number.isFinite(ps) || ps <= 0) {
      errors.Psurge = '수격압은 0보다 커야 합니다.'
    } else if (Pd && ps < Pd) {
      errors.Psurge = '수격압은 정수압 이상이어야 합니다 (정수압 이상 상승압력).'
    }
  }

  if (pipeDimManual) {
    if (!DoManual || DoManual < 50 || DoManual > 4000) {
      errors.DoManual = '외경은 50~4000mm 범위여야 합니다.'
    }
    if (!tManual || tManual < 1 || tManual > 100) {
      errors.tManual = '두께는 1~100mm 범위여야 합니다.'
    }
  } else {
    // 관경
    const table = pipeType === 'steel' ? STEEL_THICKNESS : DI_THICKNESS
    if (!DN || !table[DN]) {
      errors.DN = '지원하지 않는 관경입니다.'
    }

    // 두께/등급
    if (pipeType === 'steel') {
      if (!pnGrade || !STEEL_PN_GRADES.includes(pnGrade)) {
        errors.pnGrade = 'PN 등급을 선택해야 합니다.'
      } else if (DN && table[DN] && !table[DN][pnGrade]) {
        errors.pnGrade = `DN${DN}에서 ${pnGrade} 등급이 없습니다.`
      }
    } else {
      if (!diKGrade || !DI_K_GRADES.includes(diKGrade)) {
        errors.diKGrade = 'K 등급을 선택해야 합니다.'
      } else if (DN && table[DN] && !table[DN][diKGrade]) {
        errors.diKGrade = `DN${DN}에서 ${diKGrade} 등급이 없습니다.`
      }
    }
  }

  // 설계 운전압력
  if (!Pd || Pd <= 0) {
    errors.Pd = '설계압력은 0보다 커야 합니다.'
  } else if (Pd > 3.0) {
    errors.Pd = '설계압력이 너무 큽니다 (최대 3.0 MPa).'
  }

  // 매설깊이
  if (!H || H <= 0) {
    errors.H = '매설깊이는 0보다 커야 합니다.'
  } else if (H < 0.5) {
    errors.H = '최소 매설깊이는 0.5m 이상입니다.'
  } else if (H > 20) {
    errors.H = '매설깊이가 너무 큽니다 (최대 20m).'
  }

  // 흙 단위중량 γt (kg/cm³) — 지침 제시값 1.8×10⁻³
  if (!gammaSoil_kgfcm3 || gammaSoil_kgfcm3 < 1.0e-3) {
    errors.gammaSoil_kgfcm3 = 'γt는 1.0×10⁻³ kg/cm³ 이상이어야 합니다.'
  } else if (gammaSoil_kgfcm3 > 2.5e-3) {
    errors.gammaSoil_kgfcm3 = 'γt가 너무 큽니다 (최대 2.5×10⁻³ kg/cm³).'
  }

  // 흙 반력계수 E′ (kg/cm²) — 지침 제시값 28
  if (!Eprime_kgfcm2 || Eprime_kgfcm2 <= 0) {
    errors.Eprime_kgfcm2 = "E′ 값은 0보다 커야 합니다."
  } else if (Eprime_kgfcm2 > 200) {
    errors.Eprime_kgfcm2 = `E′ 값이 너무 큽니다 (지침 제시값 ${EPRIME_KGFCM2} kg/cm²).`
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
