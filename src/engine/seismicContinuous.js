// ============================================================
// 연속관(강관) 내진성능 본평가 엔진
// 근거: 기존시설물(상수도) 내진성능 평가요령 부록 C
//       KDS 57 17 00 / KDS 17 10 00
// ============================================================

import {
  calcTG, calcTs, calcVds, calcWavelength,
  calcGroundDisp, calcGroundStiffness, getImpactFactor,
} from './seismicConstants.js'

import { calcS, interpAmpFactor, calcDesignSpectrum, calcSv } from './seismicSegmented.js'

// ─── 내압에 의한 축변형률 ────────────────────────────────────
// 연속관(강관): 내압 P에 의한 후프응력 → 포아송 효과로 축변형률 발생
// ε_i = −ν × σ_θ / E = −ν × P(D−t) / (2t × E)
// 음수: 내압 시 관이 수축(길이 방향)
export function calcStrainInternal(nu, P, D, t, E) {
  const sigma_theta = P * (D - t) / (2 * t)  // 후프응력 (MPa)
  const epsilon_i = -nu * sigma_theta / E     // 내압 축변형률 (무차원)
  return { epsilon_i, sigma_theta }
}

// ─── 토압/차량하중에 의한 축변형률 ──────────────────────────
// 연속관은 외부 횡방향 하중 → 관체 처짐 → 축방향 신장
// Δy: 관체 처짐 (m), L_span: 지지 스팬 (m)
// ε_o ≈ (π² × Δy²) / (8 × L_span²)  [근사]
// 또는: 토압+차량하중 재하에 의한 직접 압축 → 간략법으로 별도 취급
// 실무: 토압 단독 횡하중에 의한 축변형률은 무시 (종방향 구속 없으므로)
// → 차량하중에 의한 직접 충격계수 포함 하중 적용
// ε_o = σ_o_axial / E  (차량 충격에 의한 축응력이 있을 경우)
// 분절관과 달리 연속관은 관 전체에 하중이 분산됨
// 실용: ε_o = 0 (도로 매설 시 축방향 차량하중 성분 무시)
export function calcStrainTraffic() {
  return 0
}

// ─── 온도변화에 의한 축변형률 ────────────────────────────────
// ε_t = α_T × ΔT
// α_T: 열팽창계수 (강관 = 1.2×10⁻⁵ /°C)
// ΔT: 온도변화 (°C), 통상 ±20~30°C 가정
export function calcStrainTemperature(deltaT, alpha_T = 1.2e-5) {
  return alpha_T * deltaT
}

// ─── 부등침하에 의한 축변형률 ────────────────────────────────
// ε_d = D_settle / (2 × L_settle)
// D_settle: 부등침하량 (m), L_settle: 침하 구간 길이 (m)
export function calcStrainSettlement(D_settle, L_settle) {
  if (L_settle <= 0) return 0
  return D_settle / (2 * L_settle)
}

// ─── 지진에 의한 축변형률 ────────────────────────────────────
// 응답변위법 (연속관)
// ε_eq_L = αL = 4Uh/L  (축방향 지반변형률)
// 굽힘에 의한 추가변형률: ε_eq_B = π²×D/(2L²)×Uh (관직경/파장)
// 실용: ε_eq = ε_eq_L (지배)
export function calcStrainSeismic(Uh, L, D_m) {
  const epsilon_eq_L = 4 * Uh / L                    // 축방향
  const epsilon_eq_B = (Math.PI ** 2 * D_m) / (2 * L ** 2) * Uh  // 굽힘 기여
  const epsilon_eq = epsilon_eq_L + epsilon_eq_B
  return { epsilon_eq, epsilon_eq_L, epsilon_eq_B }
}

// ─── 국부좌굴에 의한 허용변형률 ─────────────────────────────
// AWWA M11 / KDS 57 17 00
// ε_allow = 0.5 × (t/D) × (1/√(1−ν²))  ≈ 0.5 × t/D
// 강관: ε_allow = min(0.5t/D, 0.005)
export function calcAllowableStrain(t, D_m, nu = 0.3) {
  const eps1 = 0.5 * (t / D_m) / Math.sqrt(1 - nu ** 2)
  const eps2 = 0.005  // 상한값 (AWWA M11)
  return Math.min(eps1, eps2)
}

// ─── 허용응력 (연속관, 강관) ─────────────────────────────────
// 내진 시: σ_allow = σ_y × 허용계수 = 0.9 × σ_y (내진등급Ⅰ)
//         또는 σ_allow = 0.95 × σ_y (내진등급Ⅱ)
// SS400 기준: σ_y = 235 MPa (t≤16mm), 215 (16<t≤40)
export function getSteelYieldStrength(t_mm) {
  return t_mm <= 16 ? 235 : 215  // MPa
}

export function getAllowableStress_Steel(sigma_y, seismicGrade = 'I') {
  return seismicGrade === 'I'
    ? sigma_y * 0.9
    : sigma_y * 0.95
}

// ─── 조합응력 계산 (후프 + 축) ──────────────────────────────
// Von Mises: σ_vm = √(σ_θ² + σ_x² − σ_θ×σ_x)
export function calcVonMises(sigma_theta, sigma_x) {
  return Math.sqrt(sigma_theta ** 2 + sigma_x ** 2 - sigma_theta * sigma_x)
}

// ─── 전체 연속관 본평가 메인 함수 ───────────────────────────
/**
 * @param {object} params
 * @param {number} params.DN          - 공칭관경 (mm)
 * @param {number} params.t           - 관두께 (mm)
 * @param {number} params.D_out       - 외경 (mm)
 * @param {string} params.seismicGrade - 내진등급 'I' | 'II'
 * @param {string} params.zone        - 지진구역 'I' | 'II'
 * @param {number} params.Z           - 지진구역계수
 * @param {number} params.I_seismic   - 위험도계수
 * @param {number[]} params.Fa_table  - [f1,f2,f3] Fa 증폭계수
 * @param {number[]} params.Fv_table  - [f1,f2,f3] Fv 증폭계수
 * @param {object[]} params.layers    - [{H, Vs}] 표층지반 층
 * @param {number} params.Vbs         - 기반암 전단파속도 (m/s)
 * @param {number} params.P           - 설계수압 (MPa)
 * @param {number} params.deltaT      - 온도변화 (°C)
 * @param {number} params.D_settle    - 부등침하량 (m), 없으면 0
 * @param {number} params.L_settle    - 침하구간 길이 (m), 없으면 0
 * @param {number} params.h_cover     - 토피 (m)
 * @param {number} params.z_pipe      - 지표~관축 거리 (m)
 * @param {number} params.nu          - 포아송비 (강관 0.3)
 * @param {number} params.E           - 탄성계수 (MPa, 강관 206,000)
 */
export function evalContinuous(params) {
  const {
    DN, t, D_out,
    seismicGrade = 'I',
    Z, I_seismic,
    Fa_table, Fv_table,
    layers, Vbs,
    P,
    deltaT = 20,
    D_settle = 0,
    L_settle = 0,
    h_cover, z_pipe,
    nu = 0.3,
    E = 206000,
  } = params

  const D_m = D_out / 1000  // m (외경)
  const t_m = t / 1000      // m

  // ── Step 1: 설계지반가속도 ──
  const S = calcS(Z, I_seismic)

  // ── Step 2: 증폭계수 보간 ──
  const Fa = interpAmpFactor(Fa_table, S)
  const Fv = interpAmpFactor(Fv_table, S)
  const { SDS, SD1 } = calcDesignSpectrum(S, Fa, Fv)

  // ── Step 3: 표층지반 파라미터 ──
  const TG = calcTG(layers)
  const Ts = calcTs(TG)
  const { Vds, vsi } = calcVds(layers, Ts)
  const H_total = layers.reduce((s, l) => s + l.H, 0)

  // ── Step 4: 설계스펙트럼 / 속도응답스펙트럼 ──
  const { Sv, Sa, T0, TS: TS_sp } = calcSv(Ts, SDS, SD1)

  // ── Step 5: 지반수평변위 ──
  const Uh = calcGroundDisp(Sv, Ts, z_pipe, H_total)  // m

  // ── Step 6: 파장 ──
  const { L, L1, L2, eps } = calcWavelength(Ts, Vds, Vbs)

  // ── Step 7: 각 성분 변형률 ──
  const { epsilon_i, sigma_theta } = calcStrainInternal(nu, P, D_out, t, E)
  const epsilon_o = calcStrainTraffic()
  const epsilon_t = calcStrainTemperature(deltaT)
  const epsilon_d = calcStrainSettlement(D_settle, L_settle)
  const { epsilon_eq, epsilon_eq_L, epsilon_eq_B } = calcStrainSeismic(Uh, L, D_m)

  // 조합: 절댓값 합산 (보수적)
  const epsilon_total = Math.abs(epsilon_i) + Math.abs(epsilon_o)
    + Math.abs(epsilon_t) + Math.abs(epsilon_d) + Math.abs(epsilon_eq)

  // ── Step 8: 허용변형률 (국부좌굴) ──
  const epsilon_allow = calcAllowableStrain(t_m, D_m, nu)
  const strainOK = epsilon_total <= epsilon_allow

  // ── Step 9: 조합응력 (Von Mises) ──
  const sigma_x = E * epsilon_eq   // 지진 축응력 (MPa)
  const sigma_i_axial = -nu * sigma_theta  // 내압 포아송 축응력
  const sigma_x_total = sigma_i_axial + E * epsilon_t + E * epsilon_d + sigma_x
  const sigma_vm = calcVonMises(sigma_theta, sigma_x_total)

  const sigma_y = getSteelYieldStrength(t)
  const sigma_allow = getAllowableStress_Steel(sigma_y, seismicGrade)
  const stressOK = sigma_vm <= sigma_allow

  const overallOK = strainOK && stressOK

  return {
    ok: overallOK,
    // 지반
    S, Fa, Fv, SDS, SD1,
    TG, Ts, Vds, H_total,
    Sv, Sa, T0, TS_sp,
    Uh, L, L1, L2, eps,
    // 변형률 성분
    epsilon_i, epsilon_o, epsilon_t, epsilon_d,
    epsilon_eq, epsilon_eq_L, epsilon_eq_B,
    epsilon_total, epsilon_allow, strainOK,
    // 응력
    sigma_theta,
    sigma_x_total, sigma_vm,
    sigma_y, sigma_allow, stressOK,
  }
}
