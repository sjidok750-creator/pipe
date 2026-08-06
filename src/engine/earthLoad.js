// ============================================================
// 작용 하중(외압) 산정 — 상부 토압 / 노면하중
// 근거: 「시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서」
//       제11장 상수도 11-134 (가) 작용 하중(외압)
//
// ※ 전 과정을 지침 원단위계(cm, kg, kg/cm²)로 계산한다.
// ============================================================

import { EARTH_LOAD, TRAFFIC } from './constants.js'

/**
 * 상부 토압 Wv — 매설깊이에 따라 연직토압 / Marston 분기
 * 근거: 세부지침 11-134 (가)
 *   Wv = γt·H            (H ≤ 2.0 m)  — 연직 토압
 *   Wv = Cd·γt·B         (H > 2.0 m)  — 흙의 Arching 효과 + Marston 토압계수
 *   Cd = [1 − e^(−2kμ′·H/B)] / (2kμ′)
 *   k  = (1−sinφ)/(1+sinφ),  μ′ = tanφ′,  φ′ = φ = 30°
 *   B  = 2D + 100        (cm) — 강관 정부에서의 굴착부 폭
 *
 * ⚠ B 는 cm 단위다. 원문 수식군이 전부 cm 계(H: cm, γt: kg/cm³)이며,
 *   지침 예제 DN500 → B = 200 cm 로 검증된다. mm로 해석하면 Wv가
 *   약 26% 낮게(위험측) 산정된다.
 *
 * @param {number} params.H   - 토피 (m)
 * @param {number} params.Do  - 관 외경 (mm)
 * @param {number} [params.gammaSoil_kgfcm3] - 흙 단위중량 (kg/cm³), 기본 1.8e-3
 * @returns {{ Wv, Cd, B_cm, method }}  Wv 단위: kg/cm²
 */
export function calcEarthLoad({ H, Do, gammaSoil_kgfcm3 = EARTH_LOAD.gamma_t }) {
  const Do_cm = Do / 10
  const H_cm  = H * 100
  const B_cm  = EARTH_LOAD.B_formula_cm(Do_cm)      // cm — B = 2D + 100
  const kmu   = EARTH_LOAD.kmu                      // φ=30° → 0.19245
  const Cd    = (1 - Math.exp(-2 * kmu * H_cm / B_cm)) / (2 * kmu)

  if (H <= EARTH_LOAD.H_limit_m) {
    return { Wv: gammaSoil_kgfcm3 * H_cm, Cd, B_cm, kmu, method: 'prism' }
  }
  return { Wv: Cd * gammaSoil_kgfcm3 * B_cm, Cd, B_cm, kmu, method: 'marston' }
}

/**
 * 노면하중 Wt — 인접 후륜의 단축하중과 분포각 고려
 * 근거: 세부지침 11-134 (가)
 *   Wt = 2nP(1+i) / {[nL + (n−1)C + b + 2H·tanθ]·(a + 2H·tanθ)}
 *   P = 9,600 kg (DB-24)  L = 175 cm  C = 100 cm  b = 50 cm  a = 20 cm  θ = 45°
 *
 * 충격계수 i (11-134 표):
 *   H < 1.5      → 0.5
 *   1.5 < H < 6.5 → 0.65 − 0.10H
 *   6.5 < H      → 0
 * ※ H > 6.5 에서 0 이다. 기존 엑셀(02-1)은 0.5를 반환하는 오류가 있었다 — 회귀 금지.
 *
 * @param {number} params.H - 토피 (m)
 * @returns {{ Wt, i }}  Wt 단위: kg/cm²
 */
export function calcTrafficLoad({
  H,
  n = TRAFFIC.n, P = TRAFFIC.P,
  L_cm = TRAFFIC.L_cm, C_cm = TRAFFIC.C_cm,
  b_cm = TRAFFIC.b_cm, a_cm = TRAFFIC.a_cm,
  theta = TRAFFIC.theta,
}) {
  const H_cm = H * 100
  const tan  = Math.tan(theta * Math.PI / 180)
  const i    = H < 1.5 ? 0.5 : (H <= 6.5 ? 0.65 - 0.1 * H : 0)

  const spread = 2 * H_cm * tan
  const denom  = (n * L_cm + (n - 1) * C_cm + b_cm + spread) * (a_cm + spread)
  return { Wt: 2 * n * P * (1 + i) / denom, i }
}
