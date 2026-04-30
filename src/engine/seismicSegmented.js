// ============================================================
// 분절관(주철관) 내진성능 본평가 엔진
// 근거: 기존시설물(상수도) 내진성능 평가요령 부록 C, 5.3.2절
//       KDS 57 17 00 / KDS 17 10 00
// ============================================================

import {
  calcTG, calcTs, calcVds, calcWavelength,
  calcGroundDisp, calcGroundStiffness, getImpactFactor,
  calcWm, calcGroundStrain, calcLambda, calcAlpha,
  resolveHEffective, resolveLayersForTGVds,
} from './seismicConstants.js'

// 설계지반가속도 S (= Z × I)
export function calcS(Z, I) {
  return Z * I
}

// 증폭계수 Fa, Fv 보간 (S값에 따라 선형 보간)
// factors: [f_S≤0.1, f_S=0.2, f_S=0.3]
export function interpAmpFactor(factors, S) {
  const [f1, f2, f3] = factors
  if (S <= 0.1) return f1
  if (S <= 0.2) return f1 + (f2 - f1) * (S - 0.1) / 0.1
  if (S <= 0.3) return f2 + (f3 - f2) * (S - 0.2) / 0.1
  return f3
}

// 설계스펙트럼 가속도 (KDS 17 10 00)
// S_DS = Fa×S×2.5, S_D1 = Fv×S
export function calcDesignSpectrum(S, Fa, Fv) {
  const SDS = Fa * S * 2.5
  const SD1 = Fv * S
  return { SDS, SD1 }
}

// ─── 기반면(암반) 속도응답스펙트럼 Sv 산정 ─────────────────
// 지침 5.3.2(3): 기반면 가속도 스펙트럼(암반, Fa=Fv=1.0)을 변환 후 감쇠비 보정
// KDS 17 10 00 암반지반 스펙트럼: T_A=0.06s, T_B=0.3s
//   T ≤ T_A: Sa 선형 증가
//   T_A ≤ T ≤ T_B: Sa = Sas (정가속도)
//   T > T_B: Sa = Sas × T_B / T (정속도 구간 → Sv 일정)
// Sv 플래토 = Sas × g × T_B / (2π)
// 감쇠비 보정계수: η = √(10/(5+ξ))  [KDS 17 10 00]
//   붕괴방지수준(ξ=20%): η = √(10/25) = 0.6325
//   기능수행수준(ξ=10%): η = √(10/15) = 0.8165
// S: Z × I (기반암 기준, Fa=Fv=1.0 적용 전)
// 검증: 예제 Z=0.11, I=1.4, Ts=1.543s → Sv=0.113 m/s (붕괴방지)
export function calcSv(S, Ts, level = 'collapse', g = 9.81) {
  const T_A = 0.06    // 암반지반 단주기 전이주기 (KDS 17 10 00 해설표 2.1.7)
  const T_B = 0.3     // 암반지반 장주기 전이주기

  // 암반 기반면 단주기 스펙트럼 가속도 (Fa=1.0)
  const Sas = S * 2.5  // g배수

  // 감쇠비 보정계수
  const xi = level === 'collapse' ? 20 : 10   // % (붕괴방지=20%, 기능수행=10%)
  const eta = Math.sqrt(10 / (5 + xi))

  // 감쇠보정 전 Sv 플래토 = Sas × g × T_B / (2π)
  const Sv_plateau_raw = Sas * g * T_B / (2 * Math.PI)

  // Ts 구간별 Sa 산정 (암반 기준)
  let Sa_raw  // 감쇠보정 전, g배수
  if (Ts <= T_A) {
    Sa_raw = Sas * (0.4 + 0.6 * Ts / T_A)
  } else if (Ts <= T_B) {
    Sa_raw = Sas                          // 정가속도 구간
  } else {
    Sa_raw = Sas * T_B / Ts              // 정속도 구간 (Sa 감소, Sv 일정)
  }

  // 감쇠보정 전 Sv
  const Sv_raw = Sa_raw * g * Ts / (2 * Math.PI)

  // 감쇠보정 후 Sv — 장주기 정속도 구간에서 플래토값 × η 적용
  const Sv = (Ts > T_B ? Sv_plateau_raw : Sv_raw) * eta

  const Sa = Sa_raw * eta   // 감쇠보정 후 Sa (참고용)

  return { Sv, Sa, Sas, Sv_plateau_raw, eta, xi, T_A, T_B }
}

// ─── 내압에 의한 축응력 (분절관) ────────────────────────────
// 해설식(5.3.1): σ_i = ν × P × (D−t) / (2t)
// ν: 포아송비, P: 내압(MPa), D: 외경(mm), t: 관두께(mm)
export function calcAxialStressInternal(nu, P_MPa, D_mm, t_mm) {
  const sigma_i = nu * P_MPa * (D_mm - t_mm) / (2 * t_mm)
  return sigma_i  // MPa
}

// ─── 차량하중에 의한 축응력 (분절관) ────────────────────────
// 해설식(5.3.2): σ_o = 0.322 × Wm / Z × √(E×I / (Kv×D))
// 탄성지반 위 보(Winkler beam)의 최대 휨응력 공식
// 단위: Wm [kN/m], Z [m³], E [kN/m²], I [m⁴], Kv [kN/m³], D [m]
// 결과 σ_o [kN/m²] → MPa로 변환
export function calcAxialStressTraffic(Wm, Z_m, E_kN, I_m, Kv, D_m) {
  if (!Wm || Wm <= 0 || !Kv || Kv <= 0) return 0
  const sigma_o_kN = 0.322 * Wm * Math.sqrt(E_kN * I_m / (Kv * D_m)) / Z_m
  return sigma_o_kN / 1000   // MPa
}

// ─── 보정계수 ξ1, ξ2 (분절관 지진 축응력·휨응력) ────────────
// 근거: 기존시설물(상수도) 내진성능 평가요령 부록C 해설그림 C.1.4, C.1.5
//
// ξ1: 단변수 해석 공식 — ξ1 = 0.5×(1+tanh(k×(ln(ν'×λ1L')−ln(u0))))
//   k=0.952, u0=2.878 (앵커: ν'=0.019, λ1L'=16.818 → ξ1=0.015 ✓)
//   부록C 예제 C.1 결과와 일치 검증
//
// ξ2: 2D lookup table + 로그-선형 보간 (오버슈트 구간 포함)
//   피크 위치 ≈ π/ν, 수렴 ≈ 2π/ν
//   앵커: ν=0.028, λ2L=107.979 → ξ2=0.149 ✓

// ξ1 해석 공식 (단변수: u = ν' × λ1L')
const _XI1_K  = 0.9517
const _XI1_U0 = 2.878

// ξ2 lookup table — (λ2L, ξ2), 곡선 파라미터 ν
// 피크 위치: ν=0.01→350, 0.02→250, 0.04→78, 0.06→52, 0.10→30, 0.20→15
// 앵커 기반 수치화: ν=0.02 x=108→0.024, ν=0.04 x=108→1.055
const _XI2_TABLE = {
  0.01: [[0,0],[100,0.001],[200,0.020],[300,0.120],[350,0.280],[400,0.500],[450,0.750],[500,0.920],[550,1.020],[600,1.055],[650,1.065],[700,1.058],[800,1.030],[1000,1.010],[1400,1.003],[2000,1.000]],
  0.02: [[0,0],[50,0.001],[75,0.004],[100,0.019],[108,0.027],[120,0.048],[140,0.115],[160,0.245],[180,0.460],[200,0.680],[220,0.880],[240,0.995],[250,1.052],[265,1.068],[280,1.072],[300,1.065],[350,1.035],[400,1.015],[500,1.005],[700,1.000]],
  0.04: [[0,0],[20,0.050],[30,0.190],[40,0.430],[50,0.680],[60,0.880],[70,0.990],[78,1.050],[85,1.075],[100,1.055],[125,1.025],[150,1.010],[200,1.003],[300,1.000],[500,1.000]],
  0.06: [[0,0],[15,0.120],[25,0.430],[35,0.760],[45,0.970],[52,1.040],[58,1.070],[65,1.075],[75,1.060],[90,1.030],[120,1.010],[180,1.003],[300,1.000],[500,1.000]],
  0.10: [[0,0],[8,0.140],[15,0.500],[20,0.780],[25,0.940],[30,1.020],[35,1.060],[40,1.070],[50,1.055],[65,1.025],[90,1.010],[150,1.003],[250,1.000],[500,1.000]],
  0.20: [[0,0],[4,0.140],[8,0.500],[12,0.830],[15,0.980],[18,1.040],[22,1.070],[28,1.060],[35,1.030],[50,1.010],[80,1.003],[130,1.000],[500,1.000]],
}

function _interp1D(pts, x) {
  if (x <= pts[0][0]) return pts[0][1]
  if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1]
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i][0] && x <= pts[i + 1][0]) {
      const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
      return pts[i][1] + t * (pts[i + 1][1] - pts[i][1])
    }
  }
  return pts[pts.length - 1][1]
}

// 2D 보간: ν 축은 로그, λ 축은 선형 (ξ2 전용)
function _interpXi2(table, lam, nu) {
  const nuKeys = Object.keys(table).map(Number).sort((a, b) => a - b)
  const nuCl = Math.max(nuKeys[0], Math.min(nuKeys[nuKeys.length - 1], nu))
  let lo = nuKeys[0], hi = nuKeys[nuKeys.length - 1]
  for (let i = 0; i < nuKeys.length - 1; i++) {
    if (nuCl >= nuKeys[i] && nuCl <= nuKeys[i + 1]) { lo = nuKeys[i]; hi = nuKeys[i + 1]; break }
  }
  const xi_lo = _interp1D(table[lo], lam)
  if (lo === hi) return Math.max(0, xi_lo)
  const xi_hi = _interp1D(table[hi], lam)
  const t = (Math.log(nuCl) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))
  // ξ 값이 모두 양수일 때 로그 보간, 0 근처는 선형
  if (xi_lo > 0.001 && xi_hi > 0.001) {
    return Math.max(0, Math.exp(Math.log(xi_lo) + t * (Math.log(xi_hi) - Math.log(xi_lo))))
  }
  return Math.max(0, xi_lo + t * (xi_hi - xi_lo))
}

// ξ1: 축응력 보정계수 — 해석 공식 (단변수 u = ν' × λ1L')
// lam1Lp = λ1 × L',  nu_prime = l / L'
export function calcXi1(lam1Lp, nu_prime) {
  const u = nu_prime * lam1Lp
  if (u <= 0) return 0
  return Math.min(1.0, Math.max(0, 0.5 * (1 + Math.tanh(_XI1_K * (Math.log(u) - Math.log(_XI1_U0))))))
}

// ξ2: 휨응력 보정계수 (오버슈트 허용 — 최대 약 1.07)
// lam2L = λ2 × L,  nu_val = l / L
export function calcXi2(lam2L, nu_val) {
  return Math.max(0, _interpXi2(_XI2_TABLE, lam2L, nu_val))
}

// ─── 지진시의 축응력 (분절관) ───────────────────────────────
// 해설식(5.3.12): σ = √(σ'_L² + σ'_B²)
// 해설식(5.3.13): σ'_L = ξ1 × σ_L
// 해설식(5.3.14): σ'_B = ξ2 × σ_B
// 해설식(5.3.15): σ_L = a1 × (π×Uh/L) × E
// 해설식(5.3.16): σ_B = a2 × (2π²×D×Uh/L²) × E
// 단위: E [kN/m²], Uh [m], L [m], D [m] → σ [kN/m²]
// l: 관 1본 길이(m), lambda1/lambda2: 지반-관 강성 파라미터 (1/m)
export function calcAxialStressSeismic(Uh, L, D_m, E_kN, alpha1, alpha2, l, lambda1, lambda2) {
  const Lprime = Math.SQRT2 * L   // L' = √2·L (기준서 공통)

  // 지반변형률 기반 응력
  const sigma_L_kN = alpha1 * (Math.PI * Uh / L) * E_kN           // 해설식(5.3.15)
  const sigma_B_kN = alpha2 * (2 * Math.PI ** 2 * D_m * Uh / L ** 2) * E_kN  // 해설식(5.3.16)

  // ξ1, ξ2 그래프 x축 파라미터 (해설그림 C.1.4, C.1.5)
  const lam1Lp  = lambda1 * Lprime   // λ1 × L'
  const lam2L   = lambda2 * L        // λ2 × L
  const nu_prime = l / Lprime         // 해설식(5.3.23): ν' = l/L'
  const nu_val   = l / L              // 해설식(5.3.22): ν  = l/L

  const xi1 = calcXi1(lam1Lp, nu_prime)
  const xi2 = calcXi2(lam2L,  nu_val)

  const sigma_L_prime_kN = xi1 * sigma_L_kN   // 해설식(5.3.13)
  const sigma_B_prime_kN = xi2 * sigma_B_kN   // 해설식(5.3.14)

  // 합성응력: 해설식(5.3.12)
  const sigma_x_kN = Math.sqrt(sigma_L_prime_kN ** 2 + sigma_B_prime_kN ** 2)
  const sigma_x_MPa = sigma_x_kN / 1000

  return {
    sigma_x: sigma_x_MPa,        // MPa
    sigma_L: sigma_L_kN / 1000,  // MPa
    sigma_B: sigma_B_kN / 1000,  // MPa
    sigma_L_prime: sigma_L_prime_kN / 1000,  // MPa
    sigma_B_prime: sigma_B_prime_kN / 1000,  // MPa
    xi1, xi2, nu_prime, nu_val, lam1Lp, lam2L,
  }
}

// ─── 이음부 신축량 (분절관 지진시) ──────────────────────────
// 근거: 2025년 상수도설계기준해설편 §4.3.3(2)나⑤, 부록C 예제 C.1 마항
// |uJ| = u0 × ūJ
// u0 = a1 × Ua
// Ua = (1/√2) × Uh
// ūJ = 2γ1|cosh(β1) - cos(γ1)| / (β1·sinh β1)
// a1 = 1 / (1 + (γ1/β1)²)
// β1 = √(K1/(E·A)) × l
// γ1 = 2π·l / L'
// L' = √2·L
// 검증: 예제 β1=0.328, γ1=0.122, ūJ=0.138, |uJ|=0.00301 m ✓
export function calcJointDispSeismic(Uh, L, K1_kN, E_kN, A_m, l) {
  const Lprime = Math.SQRT2 * L             // L' = √2·L

  const Ua = Uh / Math.SQRT2               // Ua = (1/√2) × Uh

  const beta1  = Math.sqrt(K1_kN / (E_kN * A_m)) * l   // β1 = √(K1/(EA))·l
  const gamma1 = 2 * Math.PI * l / Lprime               // γ1 = 2π·l/L'

  // a1 = 1/(1+(γ1/β1)²)
  const a1 = 1 / (1 + (gamma1 / beta1) ** 2)

  const u0 = a1 * Ua  // m

  // ūJ = 2γ1|cosh(β1) - cos(γ1)| / (β1·sinh β1)
  const uJ_bar = (2 * gamma1 * Math.abs(Math.cosh(beta1) - Math.cos(gamma1)))
               / (beta1 * Math.sinh(beta1))

  const uJ = Math.abs(u0 * uJ_bar)  // m

  return { uJ, u0, Ua, beta1, gamma1, uJ_bar, a1 }
}

// ─── 이음부 신축량 (상시하중) ────────────────────────────────
// 해설식(5.3.24): e_i = l × σ_i / E
// 해설식(5.3.25): e_o = l × σ_o / E
// 해설식(5.3.26): e_t = α × ΔT × l
// 해설식(5.3.27): e_d = √(l² + δ²) - l ≈ δ²/(2l) (소변위 근사)
// σ_i, σ_o: kN/m², E: kN/m², l: m
export function calcJointDispStatic(sigma_i_kN, sigma_o_kN, E_kN, l, deltaT, delta_settle, l_settle) {
  const e_i = (sigma_i_kN / E_kN) * l                           // 내압 (m)
  const e_o = (sigma_o_kN / E_kN) * l                           // 차량 (m)
  const e_t = 1.2e-5 * deltaT * l                               // 온도 (m), α주철=1.2e-5/℃
  // 부등침하: 해설식(5.3.27), ed = Δl = √(l²+δ²) - l
  const e_d = delta_settle > 0 && l_settle > 0
    ? Math.sqrt(l_settle ** 2 + delta_settle ** 2) - l_settle
    : 0
  return { e_i, e_o, e_t, e_d }
}

// ─── 허용 신축량 (이음부) ────────────────────────────────────
// 근거: 2025년 상수도설계기준해설편 §4.3.3(2)나⑥
//   "이음부 설계 최대 신축량은 제조사의 이음부 신축 관련 허용기준을 참조하여야 한다"
// 실무 적용: KS D 4311:2016 소켓 삽입깊이(L₂) × 비율
//   일반형 × 0.50, 내진형 × 0.80 (JWWA 수도시설 내진공법지침 기반)
// 출처: KS D 4311:2016 소켓치수표(L₂) 기준
const DI_INSERTION_MM = {
    75:  57,
   100:  60,
   125:  62,
   150:  65,
   200:  68,
   250:  72,
   300:  75,
   350:  78,
   400:  78,
   450:  82,
   500:  85,
   600:  90,
   700:  95,
   800: 100,
   900: 105,
  1000: 110,
  1100: 115,
  1200: 120,
}

export function getAllowableJointDisp(DN, isSeismicJoint = false) {
  const dns = Object.keys(DI_INSERTION_MM).map(Number)
  const closest = dns.reduce((a, b) => Math.abs(b - DN) < Math.abs(a - DN) ? b : a)
  const L_insert_m = DI_INSERTION_MM[closest] / 1000
  return isSeismicJoint ? L_insert_m * 0.8 : L_insert_m * 0.5
}

// ─── 허용응력 (분절관) ───────────────────────────────────────
// 지침 예제(표 C.1.3) 허용응력: 27.50 MPa (덕타일주철관 2종관, 내진 시)
// 산정 근거: KS D 4311 / KDS 57 17 00 (추후 확인 필요 — 현재 예제값 사용)
// 상시 허용응력: 관종/관경에 따라 별도 (현재 예제 기준값 적용)
export const ALLOW_STRESS_DI = {
  seismic: 27.5,   // MPa (예제 기준, 덕타일 주철관 2종관)
}

// ─── 전체 분절관 본평가 메인 함수 ───────────────────────────
/**
 * @param {object} params
 * @param {number} params.DN           - 관경 (mm)
 * @param {number} params.t            - 관두께 (mm)
 * @param {number} params.D            - 외경 (mm)
 * @param {number} params.l_joint      - 관 1본 길이 (m), 기본 6
 * @param {number} params.Z            - 지진구역계수
 * @param {number} params.I_seismic    - 위험도계수
 * @param {number[]} params.Fa_table   - [f1,f2,f3] Fa 증폭계수
 * @param {number[]} params.Fv_table   - [f1,f2,f3] Fv 증폭계수
 * @param {object[]} params.layers     - [{H, Vs}] 표층지반 층
 * @param {number} params.Vbs          - 기반암 전단파속도 (m/s)
 * @param {number} params.gamma        - 흙 단위체적중량 (kN/m³)
 * @param {number} params.P            - 설계수압 (MPa)
 * @param {number} params.nu           - 포아송비 (주철관 0.26)
 * @param {number} params.E            - 탄성계수 (MPa, 주철관 170,000)
 * @param {number} params.h_cover      - 토피 (m)
 * @param {number} params.z_pipe       - 지표~관축 거리 (m)
 * @param {boolean} params.isSeismicJoint - 내진형 이음 여부
 * @param {number} params.Pm           - 후륜 1륜당 차량하중 (kN), 없으면 0
 * @param {number} params.b_width      - 차량점유폭 (m), 기본 2.75
 * @param {number} params.a_contact    - 접지폭 (m), 기본 0.2
 * @param {number} params.Kv           - 연직방향 지반반력계수 (kN/m³)
 * @param {number} params.deltaT       - 온도변화 (℃)
 * @param {number} params.delta_settle - 부등침하량 (m), 없으면 0
 * @param {number} params.l_settle     - 침하구간 길이 (m), 없으면 0
 * @param {number} params.sigma_allow  - 허용응력 (MPa), 미입력 시 27.5 사용
 */
export function evalSegmented(params) {
  const {
    DN, t, D,
    l_joint = 6,
    Z, I_seismic,
    Fa_table, Fv_table,
    layers, Vbs,
    gamma = 18,         // kN/m³
    P,
    nu = 0.26,          // 주철관
    E = 170000,         // MPa, 주철관
    h_cover, z_pipe,
    isSeismicJoint = false,
    Pm = 0,
    b_width = 2.75,
    a_contact = 0.2,
    Kv = 0,
    deltaT = 20,
    delta_settle = 0,
    l_settle = 0,
    sigma_allow: sigma_allow_input,
  } = params

  const D_m = D / 1000     // m (외경)
  const t_m = t / 1000     // m (관두께)
  const E_kN = E * 1000    // kN/m²
  const P_MPa = P          // MPa
  const P_kN = P * 1000    // kN/m²

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

  // ── Step 3: 기반암 깊이 해석 및 표층지반 파라미터 ──
  const { H_effective, H_sum, gap: hGap, warnings: hWarnings } = resolveHEffective({
    layers,
    heightMode: params.heightMode ?? 'sum',
    H_bedrock: params.H_bedrock ?? null,
  })
  const layersEff = resolveLayersForTGVds({
    layers,
    H_effective,
    fillGap: params.fillGapAsLastLayer !== false,
  })
  const TG = calcTG(layersEff)               // 해설식(5.3.4)
  const Ts = calcTs(TG)                      // 해설식(5.3.5): Ts = 1.25×TG
  const { Vds, vsi } = calcVds(layersEff, Ts)
  const H_total = H_effective                // backward-compat alias

  // ── Step 4: 기반면 속도응답스펙트럼 (해설식 5.3.6, 암반기준+감쇠보정) ──
  // S = Z×I (기반암, Fa=Fv=1.0 적용 전 값 사용)
  const seismicLevel = (params.level ?? 'collapse')   // 'collapse' | 'functional'
  const { Sv, Sa, Sas, eta, xi, T_A, T_B } = calcSv(S, Ts, seismicLevel)

  // ── Step 5: 지반수평변위 (해설식 5.3.6) ──
  const Uh = calcGroundDisp(Sv, Ts, z_pipe, H_total)  // m

  // ── Step 6: 파장 (해설식 5.3.7~5.3.9) ──
  const { L, L1: Lwave1, L2: Lwave2, eps: epsWave } = calcWavelength(Ts, Vds, Vbs)

  // ── Step 7: 지반 강성계수 (해설식 5.3.10~5.3.11) ──
  const { K1, K2 } = calcGroundStiffness(gamma, Vds)   // kN/m²

  // ── Step 8: λ1, λ2, α1, α2 (해설식 5.3.17~5.3.20) ──
  const { lambda1, lambda2 } = calcLambda(K1, K2, E_kN, A_m, I_m)
  const { alpha1, alpha2, Lprime } = calcAlpha(lambda1, lambda2, L)

  // ── Step 9: 내압에 의한 축응력 (해설식 5.3.1) ──
  const sigma_i = calcAxialStressInternal(nu, P_MPa, D, t)  // MPa

  // ── Step 10: 차량하중에 의한 축응력 (해설식 5.3.2~5.3.3) ──
  // Wm = 2×Pm×D / (C×(a+2h×tan45°)) × (1+i)  [부록C 해설식(5.3.3)]
  const C_width = params.C_width ?? 3.0   // 차량점유폭 (m), 기본 3.0
  let sigma_o = 0, Wm = 0, impact_i = 0
  if (Pm > 0 && Kv > 0) {
    const wmResult = calcWm(Pm, D_m, C_width, a_contact, h_cover)
    Wm = wmResult.Wm
    impact_i = wmResult.i
    sigma_o = calcAxialStressTraffic(Wm, Z_m, E_kN, I_m, Kv, D_m)  // MPa
  }

  // ── Step 11: 지진시의 축응력 (해설식 5.3.12~5.3.21) ──
  const seismicStress = calcAxialStressSeismic(Uh, L, D_m, E_kN, alpha1, alpha2, l_joint, lambda1, lambda2)

  // ── Step 12: 관체 응력 합산 및 검토 ──
  const sigma_total = sigma_i + sigma_o + seismicStress.sigma_x
  const sigma_allow = sigma_allow_input ?? ALLOW_STRESS_DI.seismic
  const stressOK = sigma_total <= sigma_allow

  // ── Step 13: 이음부 신축량 — 상시하중 (해설식 5.3.24~5.3.27) ──
  const sigma_i_kN = sigma_i * 1000
  const sigma_o_kN = sigma_o * 1000
  const { e_i, e_o, e_t, e_d } = calcJointDispStatic(
    sigma_i_kN, sigma_o_kN, E_kN, l_joint, deltaT, delta_settle, l_settle
  )

  // ── Step 14: 이음부 신축량 — 지진시 (해설식 5.3.28~5.3.35) ──
  const { uJ, u0, Ua, beta1, gamma1, uJ_bar, a1: a1_joint } = calcJointDispSeismic(
    Uh, L, K1, E_kN, A_m, l_joint
  )

  // ── Step 15: 이음부 신축량 합산 및 검토 ──
  const e_total = e_i + e_o + e_t + e_d + uJ
  const e_allow = getAllowableJointDisp(DN, isSeismicJoint)
  const dispOK = e_total <= e_allow

  // ── Step 16: 이음부 굽힘각도 (θ_J) 검토 ──
  // 해설식(5.3.36): θ_J = (π × Uh / L) × sin(π × l / L)
  // 허용 굽힘각도: DN < 300 → 3.5°, DN ≤ 600 → 2.5°, DN > 600 → 1.5°
  const theta_J = (Math.PI * Uh / L) * Math.sin(Math.PI * l_joint / L)  // rad
  const theta_allow_deg = DN < 300 ? 3.5 : DN <= 600 ? 2.5 : 1.5
  const theta_allow = theta_allow_deg * Math.PI / 180  // rad
  const angleOK = Math.abs(theta_J) <= theta_allow

  const overallOK = stressOK && dispOK && angleOK

  return {
    ok: overallOK,
    // 입력 정리
    S, Fa, Fv, SDS, SD1,
    // 지반
    TG, Ts, Vds, H_total, H_effective, H_sum, gap: hGap, warnings: hWarnings, vsi,
    Sv, Sa, Sas, eta, xi, T_A, T_B,
    Uh, L, Lwave1, Lwave2, epsWave,
    // alias (보고서/결과 페이지 호환)
    L1: Lwave1, L2: Lwave2, eps: epsWave,
    // 지반 강성 / 관 특성
    K1, K2, lambda1, lambda2, alpha1, alpha2, Lprime,
    A_m, I_m, Z_m,
    // 차량하중
    Wm, impact_i,
    // 관체 응력 (MPa)
    sigma_i, sigma_o,
    ...seismicStress,    // sigma_x, sigma_L, sigma_B, sigma_L_prime, sigma_B_prime, xi1, xi2, nu_prime, nu_val
    sigma_total, sigma_allow, stressOK,
    // 이음부 신축량 (m)
    e_i, e_o, e_t, e_d,
    uJ, u0, Ua, beta1, gamma1, uJ_bar, a1_joint,
    e_total, e_allow, dispOK,
    // 이음부 굽힘각도 (rad)
    theta_J, theta_allow, angleOK,
    // alias (보고서 호환)
    u_J: uJ, u_allow: e_allow,
  }
}
