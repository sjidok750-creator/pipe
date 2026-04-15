// ============================================================
// 토압 산정 — Prism Load Method
// 근거: ASCE §3.1 / AWWA M11 Chapter 5
// ============================================================

/**
 * Prism Load 방법으로 매설관 토압 산정
 * @param {object} params
 * @param {number} params.gammaSoil  - 흙 단위중량 (kN/m³)
 * @param {number} params.H          - 관정 매설깊이 (m)
 * @param {number} params.Do         - 관 외경 (mm)
 * @returns {{ We: number, Pe: number }}
 *   We: 단위길이당 토압 (kN/m)
 *   Pe: 등가 수직압력 (kPa)
 */
export function calcEarthLoad({ gammaSoil, H, Do }) {
  const Do_m = Do / 1000  // mm → m
  const We = gammaSoil * H * Do_m  // kN/m
  const Pe = We / Do_m              // kPa
  return { We, Pe }
}
