// ============================================================
// 연속관(강관) 내진성능 본평가 엔진
// 근거: 기존시설물(상수도) 내진성능 평가요령 부록 C
//       KDS 57 17 00 / KDS 17 10 00
// ============================================================

import {
  calcTG, calcTs, calcVds, calcWavelength,
  calcGroundDisp, calcGroundStiffness, getImpactFactor,
  calcWm, calcGroundStrain, calcLambda, calcAlpha,
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
// 지침 해설식(5.3.41): ε_d = δ / (2 × l)
// δ: 부등침하량 (m), l: 침하 구간 길이 (m)
// 근거: 경사 θ = δ/l, 축변형률 = sin²(θ)/2 ≈ (δ/l)²/2 (소변위 근사)가 아닌
//       지침 예제 및 해설식은 단순히 δ/(2l) 적용 — 관의 처짐각에 의한 축방향 신장량
//       tan(θ)/2 = (δ/l)/2 = δ/(2l) 로 직접 적용 (지침 부록C 예제값 검증 완료)
export function calcStrainSettlement(D_settle, L_settle) {
  if (L_settle <= 0) return 0
  return D_settle / (2 * L_settle)
}

// ─── 지진에 의한 축변형률 (연속관) ──────────────────────────
// 해설식(5.3.43): ε_L = α1 × ε_G  (L > L1)  또는  L/ξ  (L ≤ L1)
// 해설식(5.3.44): ε_B = α2 × (2πD/L) × ε_G  (굽힘 변형률)
// 해설식(5.3.45): ε_x = √(ε_L² + ε_B²)
// 해설식(5.3.52~53): L과 L1(Ly)을 비교하여 ε_L 결정
//   ξ = 2√2 × E×t/τ  (지침 해설식 5.3.52 / sipc 식(52): √는 숫자 2에만 적용)
//   L1 = ξ × ε_y  (항복점 변형률)
//   L > L1 → ε_L = α1 × ε_G  (일반식)
//   L ≤ L1 → ε_L = L / ξ     (마찰 지배)
// tau: 강관-지반 마찰력 (kN/m²), t_m: 관두께(m), E_kN: 탄성계수(kN/m²)
// epsilon_y: 항복점 변형률 = sigma_y / E
export function calcStrainSeismic(Uh, L, D_m, alpha1, alpha2, E_kN, t_m, tau, epsilon_y) {
  const epsilon_G = calcGroundStrain(Uh, L)

  // L1(Ly) 계산: ξ = 2√2 × E×t/τ  (√는 숫자 2에만 적용)
  const xi = 2 * Math.SQRT2 * E_kN * t_m / tau      // m
  const L1 = xi * epsilon_y                          // m

  let epsilon_L
  if (L > L1) {
    // 일반식: 해설식(5.3.43)
    epsilon_L = alpha1 * epsilon_G
  } else {
    // 마찰 지배: 해설식(5.3.53)
    epsilon_L = L / xi
  }

  // 굽힘 변형률: 지침 해설식(5.3.44): ε_B = α2 × (2πD/L) × ε_G
  const epsilon_B = alpha2 * (2 * Math.PI * D_m / L) * epsilon_G

  // 합성 변형률: 해설식(5.3.45)
  const epsilon_x = Math.sqrt(epsilon_L ** 2 + epsilon_B ** 2)

  return { epsilon_G, epsilon_L, epsilon_B, epsilon_x, xi, L1, usedFriction: L <= L1 }
}

// ─── 차량하중에 의한 축변형률 (연속관) ──────────────────────
// 해설식(5.3.37): ε_o = σ_o / E, σ_o = 0.322 × Wm / Z × (E×I / (Kv×D))^(1/4)
// 탄성지반 위 보(Winkler beam)의 최대 휨응력 → 축변형률 변환
// 단위: Wm [kN/m], Z [m³], E [kN/m²], I [m⁴], Kv [kN/m³], D [m]
// ※ 분절관과 동일한 공식 형태: σ_o = 0.322*Wm*(E*I/(Kv*D))^0.25 / Z
export function calcStrainTrafficContinuous(Wm, Z, E_kN, I, Kv, D_m) {
  if (!Wm || Wm <= 0) return { epsilon_o: 0, sigma_o_kN: 0 }
  const sigma_o_kN = 0.322 * Wm * Math.pow(E_kN * I / (Kv * D_m), 0.25) / Z
  const epsilon_o = sigma_o_kN / E_kN
  return { epsilon_o, sigma_o_kN }
}

// ─── 허용변형률 (연속강관) ───────────────────────────────────
// criterion = 'yield': σ_y/E — 항복점 변형률 (지침 부록C 표 C.2.3, 보수적)
// criterion = 'buckling': 46t/D — 국부좌굴 한계 (ASCE/KDS 해설, t/D 기반)
export function calcAllowableStrain(sigma_y, E_MPa, criterion = 'yield', t_mm, D_mm) {
  if (criterion === 'buckling' && t_mm > 0 && D_mm > 0) {
    return 46 * t_mm / D_mm  // ASCE Guidelines / KDS 해설: 46t/D (무차원)
  }
  return sigma_y / E_MPa  // 항복점 변형률 (무차원)
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
 * @param {number} params.DN           - 공칭관경 (mm)
 * @param {number} params.t            - 관두께 (mm)
 * @param {number} params.D_out        - 외경 (mm)
 * @param {string} params.seismicGrade - 내진등급 'I' | 'II'
 * @param {number} params.Z            - 지진구역계수
 * @param {number} params.I_seismic    - 위험도계수
 * @param {number[]} params.Fa_table   - [f1,f2,f3] Fa 증폭계수
 * @param {number[]} params.Fv_table   - [f1,f2,f3] Fv 증폭계수
 * @param {object[]} params.layers     - [{H, Vs}] 표층지반 층
 * @param {number} params.Vbs          - 기반암 전단파속도 (m/s)
 * @param {number} params.gamma        - 흙 단위체적중량 (kN/m³)
 * @param {number} params.P            - 설계수압 (MPa)
 * @param {number} params.deltaT       - 온도변화 (°C)
 * @param {number} params.D_settle     - 부등침하량 (m), 없으면 0
 * @param {number} params.L_settle     - 침하구간 길이 (m), 없으면 0
 * @param {number} params.h_cover      - 토피 (m)
 * @param {number} params.z_pipe       - 지표~관축 거리 (m)
 * @param {number} params.nu           - 포아송비 (강관 0.3)
 * @param {number} params.E            - 탄성계수 (MPa, 강관 206,000)
 * @param {number} params.Pm           - 후륜 1륜당 차량하중 (kN), 없으면 0
 * @param {number} params.b_width      - 차량점유폭 (m), 기본 2.75
 * @param {number} params.a_contact    - 접지폭 (m), 기본 0.2
 * @param {number} params.Kv           - 연직방향 지반반력계수 (kN/m³)
 * @param {number} params.tau          - 강관-지반 마찰력 (kN/m²), 기본 10
 * @param {string} params.strainCriterion - 허용변형률 기준 'yield' | 'buckling'
 */
export function evalContinuous(params) {
  const {
    DN, t, D_out,
    seismicGrade = 'I',
    Z, I_seismic,
    Fa_table, Fv_table,
    layers, Vbs,
    gamma = 18,          // kN/m³
    P,
    deltaT = 20,
    D_settle = 0,
    L_settle = 0,
    h_cover, z_pipe,
    nu = 0.3,
    E = 206000,          // MPa (강관)
    Pm = 0,              // kN/輪 (차량 후륜 1륜 하중)
    b_width = 2.75,      // m
    a_contact = 0.2,     // m
    Kv = 0,              // kN/m³ (연직방향 지반반력계수)
    tau = 10,            // kN/m² (강관-지반 마찰력)
    strainCriterion = 'yield',  // 'yield' (σ_y/E) | 'buckling' (46t/D)
  } = params

  const D_m = D_out / 1000    // m (외경)
  const t_m = t / 1000        // m
  const E_kN = E * 1000       // kN/m² (MPa → kN/m²)
  const P_kN = P * 1000       // kN/m² (MPa → kN/m²)

  // 단면 특성 (m 단위)
  const A_m = Math.PI / 4 * (D_m ** 2 - (D_m - 2 * t_m) ** 2)    // m²
  const I_m = Math.PI / 64 * (D_m ** 4 - (D_m - 2 * t_m) ** 4)   // m⁴
  const Z_m = I_m / (D_m / 2)                                      // m³

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

  // ── Step 4: 기반면 속도응답스펙트럼 (해설식 5.3.6, 암반기준+감쇠보정) ──
  const seismicLevel = params.level ?? 'collapse'
  const { Sv, Sa, Sas, eta, xi: xi_sv, T_A, T_B } = calcSv(S, Ts, seismicLevel)

  // ── Step 5: 지반수평변위 ──
  const Uh = calcGroundDisp(Sv, Ts, z_pipe, H_total)  // m

  // ── Step 6: 파장 ──
  const { L, L1: Lwave1, L2: Lwave2, eps: epsWave } = calcWavelength(Ts, Vds, Vbs)

  // ── Step 7: 지반 강성계수 (해설식 5.3.10, 5.3.11) ──
  const { K1, K2 } = calcGroundStiffness(gamma, Vds)   // kN/m²

  // ── Step 8: λ1, λ2, α1, α2 ──
  // 지침 해설식(5.3.51): L' = √2·L (연속관)
  const { lambda1, lambda2 } = calcLambda(K1, K2, E_kN, A_m, I_m)
  const { alpha1, alpha2, Lprime } = calcAlpha(lambda1, lambda2, L, 'continuous')

  // ── Step 9: 내압에 의한 축변형률 ──
  // 해설식(5.3.36): ε_i = -ν × P(D-t) / (2tE)
  const { epsilon_i, sigma_theta } = calcStrainInternal(nu, P_kN, D_m, t_m, E_kN)

  // ── Step 10: 차량하중에 의한 축변형률 (해설식 5.3.37) ──
  let epsilon_o = 0, sigma_o_kN = 0
  if (Pm > 0 && Kv > 0) {
    const { Wm } = calcWm(Pm, b_width, a_contact, h_cover)
    ;({ epsilon_o, sigma_o_kN } = calcStrainTrafficContinuous(Wm, Z_m, E_kN, I_m, Kv, D_m))
  }

  // ── Step 11: 온도변화에 의한 축변형률 (해설식 5.3.38) ──
  const epsilon_t = calcStrainTemperature(deltaT)

  // ── Step 12: 부등침하에 의한 축변형률 (해설식 5.3.39~5.3.42) ──
  const epsilon_d = calcStrainSettlement(D_settle, L_settle)

  // ── Step 13: 지진에 의한 축변형률 (해설식 5.3.43~5.3.53) ──
  const sigma_y = getSteelYieldStrength(t)
  const epsilon_y = sigma_y / E   // 항복점 변형률 (무차원, E in MPa)

  const {
    epsilon_G, epsilon_L, epsilon_B, epsilon_x,
    xi, L1: Ly, usedFriction,
  } = calcStrainSeismic(Uh, L, D_m, alpha1, alpha2, E_kN, t_m, tau, epsilon_y)

  // ── Step 14: 합성 변형률 합산 (절댓값 합산, 보수적) ──
  const epsilon_total = Math.abs(epsilon_i) + Math.abs(epsilon_o)
    + Math.abs(epsilon_t) + Math.abs(epsilon_d) + Math.abs(epsilon_x)

  // ── Step 15: 허용변형률
  const epsilon_allow = calcAllowableStrain(sigma_y, E, strainCriterion, t, D_out)
  const strainOK = epsilon_total <= epsilon_allow

  // ── Step 16: Von Mises 조합응력 검토 ──
  // 축방향 합성응력: σ_x = ν×σ_θ + E×(ε_t + ε_d + ε_x)
  const sigma_theta_MPa = sigma_theta / 1000  // kN/m² → MPa (sigma_theta는 kN/m² 단위)
  const sigma_x_total = nu * sigma_theta_MPa + E * (Math.abs(epsilon_t) + Math.abs(epsilon_d) + Math.abs(epsilon_x))
  const sigma_vm = calcVonMises(sigma_theta_MPa, sigma_x_total)
  const sigma_allow = getAllowableStress_Steel(sigma_y, seismicGrade)
  const stressOK = sigma_vm <= sigma_allow

  const overallOK = strainOK && stressOK

  return {
    ok: overallOK,
    // 지반
    S, Fa, Fv, SDS, SD1,
    TG, Ts, Vds, H_total, vsi,
    Sv, Sa, Sas, eta, xi: xi_sv, T_A, T_B,
    Uh, L, Lwave1, Lwave2, epsWave,
    // alias (보고서/결과 페이지 호환)
    L1: Lwave1, L2: Lwave2, eps: epsWave,
    // 지반 강성 / 관 특성
    K1, K2, lambda1, lambda2, alpha1, alpha2, Lprime,
    A_m, I_m, Z_m,
    // 변형률 성분
    epsilon_i, epsilon_o, epsilon_t, epsilon_d,
    epsilon_G, epsilon_L, epsilon_B, epsilon_x,
    // alias (보고서/결과 페이지 호환)
    epsilon_eq: epsilon_x, epsilon_eq_L: epsilon_L, epsilon_eq_B: epsilon_B,
    // L1(Ly) 비교
    xi, Ly, usedFriction,
    // 합산
    epsilon_total, epsilon_allow, strainCriterion, strainOK,
    // 허용
    sigma_y, epsilon_y,
    // 응력 (MPa)
    sigma_theta: sigma_theta_MPa, sigma_o_kN,
    sigma_x_total, sigma_vm, sigma_allow, stressOK,
  }
}
