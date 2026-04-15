// ============================================================
// 입력값 유효성 검사
// ============================================================

import { STEEL_THICKNESS, DI_THICKNESS } from './constants.js'

/**
 * 입력값 전체 유효성 검사
 * @param {object} inputs
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateInputs(inputs) {
  const errors = {}

  const { pipeType, DN, Pd, H, gammaSoil, Eprime, surgeRatio } = inputs

  // 관경
  const table = pipeType === 'steel' ? STEEL_THICKNESS : DI_THICKNESS
  if (!DN || !table[DN]) {
    errors.DN = '지원하지 않는 관경입니다.'
  }

  // 설계 운전압력
  if (!Pd || Pd <= 0) {
    errors.Pd = '설계압력은 0보다 커야 합니다.'
  } else if (Pd > 3.0) {
    errors.Pd = '설계압력이 너무 큽니다 (최대 3.0 MPa).'
  }

  // 수격압 배율
  if (!surgeRatio || surgeRatio < 1.0) {
    errors.surgeRatio = '수격압 배율은 1.0 이상이어야 합니다.'
  } else if (surgeRatio > 3.0) {
    errors.surgeRatio = '수격압 배율이 너무 큽니다 (최대 3.0).'
  }

  // 매설깊이
  if (!H || H <= 0) {
    errors.H = '매설깊이는 0보다 커야 합니다.'
  } else if (H < 0.5) {
    errors.H = '최소 매설깊이는 0.5m 이상입니다.'
  } else if (H > 20) {
    errors.H = '매설깊이가 너무 큽니다 (최대 20m).'
  }

  // 흙 단위중량
  if (!gammaSoil || gammaSoil < 10) {
    errors.gammaSoil = '흙 단위중량은 10 kN/m³ 이상이어야 합니다.'
  } else if (gammaSoil > 25) {
    errors.gammaSoil = '흙 단위중량이 너무 큽니다 (최대 25 kN/m³).'
  }

  // E' 값
  if (!Eprime || Eprime <= 0) {
    errors.Eprime = 'E\' 값은 0보다 커야 합니다.'
  } else if (Eprime > 20000) {
    errors.Eprime = 'E\' 값이 너무 큽니다 (최대 20,000 kPa).'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
