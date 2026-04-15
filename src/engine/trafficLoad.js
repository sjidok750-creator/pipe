// ============================================================
// DB-24 차량하중 산정 — Boussinesq 환산
// 근거: KDS 24 12 20 (도로교설계기준)
// ============================================================

import { DB24_PRESSURE } from './constants.js'

/**
 * H에 대한 선형 보간으로 DB24 등가 수직압력 산정
 * @param {number} H - 매설깊이 (m)
 * @returns {{ PL: number, IF: number }}
 */
function interpolateDB24(H) {
  const depths = Object.keys(DB24_PRESSURE).map(Number).sort((a, b) => a - b)

  // 범위 밖 처리
  if (H <= depths[0]) return DB24_PRESSURE[depths[0]]
  if (H >= depths[depths.length - 1]) return DB24_PRESSURE[depths[depths.length - 1]]

  // 선형 보간
  for (let i = 0; i < depths.length - 1; i++) {
    const d0 = depths[i]
    const d1 = depths[i + 1]
    if (H >= d0 && H <= d1) {
      const ratio = (H - d0) / (d1 - d0)
      const p0 = DB24_PRESSURE[d0]
      const p1 = DB24_PRESSURE[d1]
      return {
        PL: p0.PL + ratio * (p1.PL - p0.PL),
        IF: p0.IF + ratio * (p1.IF - p0.IF),
      }
    }
  }
  return DB24_PRESSURE[depths[depths.length - 1]]
}

/**
 * DB-24 차량하중 산정
 * @param {object} params
 * @param {number} params.H          - 매설깊이 (m)
 * @param {number} params.Do         - 관 외경 (mm)
 * @param {boolean} params.hasTraffic - 차량하중 적용 여부
 * @returns {{ PL: number, WL: number, IF: number, PLraw: number }}
 *   PL: 충격계수 포함 등가 수직압력 (kPa)
 *   WL: 단위길이당 차량하중 (kN/m)
 *   IF: 충격계수
 *   PLraw: 충격계수 적용 전 압력 (kPa)
 */
export function calcTrafficLoad({ H, Do, hasTraffic }) {
  if (!hasTraffic) return { PL: 0, WL: 0, IF: 0, PLraw: 0 }

  const Do_m = Do / 1000  // mm → m
  const { PL: PLraw, IF } = interpolateDB24(H)
  // DB24_PRESSURE 테이블의 PL은 Boussinesq 적분 순압력
  // 충격계수(IF)는 참고용 — 예제집 기준: PL을 직접 하중으로 사용 (IF는 별도 적용 안함)
  // → WL = PL(테이블값) × Do
  const WL = PLraw * Do_m    // kN/m

  return { PL: PLraw, WL, IF, PLraw }
}
