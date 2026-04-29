// ============================================================
// 차량하중 산정
// [방식 A] Boussinesq 등가압력 (KDS 24 12 20 DB-24) — 구조안전성 기본
// [방식 B] Wm 직접계산 (내진성능 평가요령 부록C 해설식 5.3.3) — 직접계산 옵션
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
  if (!hasTraffic) return { PL: 0, WL: 0, IF: 0, PLraw: 0, method: 'boussinesq' }

  const Do_m = Do / 1000  // mm → m
  const { PL: PLraw, IF } = interpolateDB24(H)
  const PL = PLraw * IF          // 충격계수 적용 설계 차량하중 (kPa)
  const WL = PL * Do_m           // kN/m

  return { PL, WL, IF, PLraw, method: 'boussinesq' }
}

/**
 * [방식 B] Wm 직접계산 — 내진성능 평가요령 부록C 해설식(5.3.3)
 * Wm = 2·Pm·Do / (C·(a + 2h·tan45°)) × (1+i)
 * 충격계수 i: h<1.5→0.5, 1.5≤h≤6.5→0.65-0.1h, h>6.5→0
 *
 * @param {object} params
 * @param {number} params.H       - 토피 (m)
 * @param {number} params.Do      - 관 외경 (mm)
 * @param {boolean} params.hasTraffic
 * @param {number} params.Pm      - 후륜 1륜당 하중 (kN), 기본 100
 * @param {number} params.C       - 차량 점유 폭 (m), 기본 3.0
 * @param {number} params.a       - 접지 폭 (m), 기본 0.2
 * @param {number} params.theta   - 하중분포각 (°), 기본 45
 * @returns {{ WL, Wm, IF, PL, PLraw, method }}
 */
export function calcTrafficLoadWm({ H, Do, hasTraffic, Pm = 100, C = 3.0, a = 0.2, theta = 45 }) {
  if (!hasTraffic) return { WL: 0, Wm: 0, IF: 0, PL: 0, PLraw: 0, method: 'wm' }

  const Do_m = Do / 1000
  const theta_rad = theta * Math.PI / 180

  // 충격계수
  let i = 0
  if (H < 1.5)       i = 0.5
  else if (H <= 6.5) i = 0.65 - 0.1 * H
  else               i = 0.0

  // Wm [kN/m]
  const Wm = (2 * Pm * Do_m) / (C * (a + 2 * H * Math.tan(theta_rad))) * (1 + i)

  // 등가 수직압력 (참고용, kPa)
  const PLraw = Wm / Do_m         // kPa (충격 전)
  const PL    = PLraw             // 이미 (1+i) 포함

  return { WL: Wm, Wm, IF: i, PL, PLraw: Wm / (1 + i) / Do_m, method: 'wm', Pm, C, a, theta }
}
