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

/**
 * [2004 기준] Marston / 연직토압 분기 토압 산정
 * 근거: 상수도시설기준(2004) [참고-4.2.1]
 *   H ≤ 2.0 m → 연직토압 Wv = γt·H
 *   H > 2.0 m → Marston      Wv = Cd·γt·B,  Cd = [1 − e^(−2kμ'H/B)] / (2kμ')
 *
 * ※ 2004 단위계(cm, kgf/cm²)로 계산한다. SET_A 전용.
 * @param {number} params.gammaSoil_kgfcm3 - 흙 단위중량 (kgf/cm³), 기본 0.0018 (=1.8 t/m³)
 * @param {number} params.H   - 토피 (m)
 * @param {number} params.Do  - 관 외경 (mm)
 * @returns {{ Wv, Cd, B_cm, method }}  Wv 단위: kgf/cm²
 */
export function calcEarthLoadMarston({ H, Do, gammaSoil_kgfcm3 = 0.0018, kmu = 0.19245, B_add_m = 0.40, H_limit = 2.0 }) {
  const Do_cm = Do / 10
  const H_cm  = H * 100
  const B_cm  = Do_cm + B_add_m * 100           // 굴착폭 B (cm)
  const Cd    = (1 - Math.exp(-2 * kmu * H_cm / B_cm)) / (2 * kmu)

  if (H <= H_limit) {
    return { Wv: gammaSoil_kgfcm3 * H_cm, Cd, B_cm, method: 'prism' }
  }
  return { Wv: Cd * gammaSoil_kgfcm3 * B_cm, Cd, B_cm, method: 'marston' }
}

/**
 * [2004 기준] 차량하중 Wt
 * Wt = 2nP(1+i) / {[nL+(n−1)C+b+2H·tanθ]·(a+2H·tanθ)}
 * 충격계수 i : h<1.5 → 0.5 / 1.5≤h≤6.5 → 0.65−0.1h / h>6.5 → 0
 * @returns {{ Wt, i }}  Wt 단위: kgf/cm²
 */
export function calcTrafficLoad2004({ H, n = 2, P = 9600, L = 1.75, C = 1.0, b = 0.5, a = 0.2, theta = 45 }) {
  const H_cm = H * 100
  const th   = theta * Math.PI / 180
  const i    = H < 1.5 ? 0.5 : (H <= 6.5 ? 0.65 - 0.1 * H : 0)
  const tan  = Math.tan(th)
  const denom = (n * L * 100 + (n - 1) * C * 100 + b * 100 + 2 * H_cm * tan) * (a * 100 + 2 * H_cm * tan)
  return { Wt: 2 * n * P * (1 + i) / denom, i }
}
