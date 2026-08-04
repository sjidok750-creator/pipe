// ============================================================
// 현행 KDS 기준 적합성 검토
//
// 구조계산(응력·처짐·좌굴)과는 별개의 축이다.
// 현행 KDS 57 10 00은 관두께를 계산으로 규정하지 않고
// "KS 및 KWWA 등에서 인증된 관종별로 규격에 맞는 압력관을 사용"으로 갈음한다
// (상수도설계기준 해설편 2025, p.543).
// 대신 매설깊이·압력등급 등은 조항으로 정량 규정하므로 이를 검토한다.
// ============================================================

import { MIN_COVER_KDS, PRESSURE_GRADE_KDS, PRESSURE_GRADE_REF } from './constants.js'

/**
 * 매설깊이 적합성 — KDS 57 10 00 §4.1.6 (2)
 *
 * "관로의 매설깊이는 관종 등에 따라 다르지만 일반적으로 관경 900mm 이하는 120cm 이상,
 *  관경 1,000mm 이상은 150cm 이상으로 하고, 도로하중을 고려할 필요가 없을 경우에는
 *  그렇게 하지 않아도 된다. 도로하중을 고려해야 할 위치에 대구경의 관을 부설할 경우에는
 *  매설깊이를 관경보다 크게 해야 한다."
 *
 * @param {number} DN         공칭관경 (mm) — 직접입력 시 Do 사용
 * @param {number} H          토피 (m)
 * @param {boolean} hasTraffic 도로하중 고려 여부
 * @returns {object}
 */
export function checkMinCover({ DN, H, hasTraffic }) {
  // 도로하중을 고려할 필요가 없으면 최소 토피 규정 적용 제외 (조항 단서)
  if (!hasTraffic) {
    return {
      applicable: false,
      H, DN,
      note: '도로하중을 고려하지 않는 구간 — 최소 매설깊이 규정 적용 제외 (§4.1.6 (2) 단서)',
      ref: MIN_COVER_KDS.ref,
      ok: true,
    }
  }

  const isLarge = DN >= MIN_COVER_KDS.large.DN_min
  const H_min = isLarge ? MIN_COVER_KDS.large.H_min : MIN_COVER_KDS.small.H_min
  const okBase = H >= H_min

  // 대구경 추가 요건: 도로하중 고려 위치에서 매설깊이 > 관경
  const DN_m = DN / 1000
  const largeRuleApplies = isLarge
  const okLarge = largeRuleApplies ? H > DN_m : true

  return {
    applicable: true,
    DN, H, H_min,
    basis: isLarge ? 'DN 1,000mm 이상 → 150cm 이상' : 'DN 900mm 이하 → 120cm 이상',
    largeRuleApplies,
    DN_m,
    okBase,
    okLarge,
    ok: okBase && okLarge,
    note: largeRuleApplies && !okLarge
      ? `대구경 관은 매설깊이를 관경(${DN_m.toFixed(3)}m)보다 크게 해야 함`
      : null,
    ref: MIN_COVER_KDS.ref,
  }
}

/**
 * 압력등급 적합성 — 해설편 p.215~216
 *
 * "주철관의 압력기준에서는 사용압력·호칭지름에 관계없이 수격압은 0.54 MPa로 일정하다고
 *  가정한 후, 사용압력에 이 수격압을 더한 값을 최대허용압력으로 하여 관두께를 계산한다."
 * "KS B 1501에서는 재료의 허용응력을 기초로 하여 최고사용압력을 결정한다."
 *
 * → 허용응력은 압력등급을 만드는 단계에 이미 반영되어 있으므로,
 *   설계자는 "최대사용압력 ≤ 해당 등급의 최대허용압력"을 확인한다.
 *
 * @param {number} Pd          설계 운전압력 (MPa)
 * @param {number} surgeRatio  수격 배율
 * @returns {object}
 */
export function checkPressureGrade({ Pd, surgeRatio = 1.5 }) {
  const Pmax = Pd * surgeRatio  // 수격 포함 최대사용압력

  // 최대사용압력을 만족하는 최소 등급 선정
  const required = PRESSURE_GRADE_KDS.find(g => Pmax <= g.maxAllow) || null

  return {
    Pd, surgeRatio, Pmax,
    requiredGrade: required ? required.key : null,
    maxAllow: required ? required.maxAllow : null,
    ok: required != null,
    margin: required ? required.maxAllow - Pmax : null,
    utilization: required ? Pmax / required.maxAllow : null,
    table: PRESSURE_GRADE_KDS,
    ref: PRESSURE_GRADE_REF,
    note: required
      ? `최대사용압력 ${Pmax.toFixed(3)} MPa ≤ ${required.key} 최대허용압력 ${required.maxAllow} MPa`
      : `최대사용압력 ${Pmax.toFixed(3)} MPa 이 최고 등급(20K, 2.75 MPa)을 초과 — 별도 검토 필요`,
  }
}

/**
 * 현행 KDS 기준 적합성 종합
 * @returns {{ items: object, overallOK: boolean }}
 */
export function checkKdsCompliance({ DN, Do, H, hasTraffic, Pd, surgeRatio, pipeDimManual }) {
  // 직접입력 시 외경을 공칭관경 대용으로 사용
  const dnUsed = pipeDimManual ? Do : DN

  const cover = checkMinCover({ DN: dnUsed, H, hasTraffic })
  const grade = checkPressureGrade({ Pd, surgeRatio })

  return {
    items: { cover, grade },
    overallOK: cover.ok && grade.ok,
    ref: '현행 KDS 57 10 00 : 2022 / 상수도설계기준 해설편(2025)',
    scope: '현행 KDS는 관두께를 계산으로 규정하지 않고 KS·KWWA 인증 압력관 사용으로 갈음한다(해설편 p.543). '
         + '따라서 응력·처짐·좌굴 등 구조계산은 별도 축(구조 검토)에서 수행한다.',
  }
}
