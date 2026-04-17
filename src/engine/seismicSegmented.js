// ============================================================
// 분절관(주철관) 내진성능 본평가 엔진
// 근거: 기존시설물(상수도) 내진성능 평가요령 부록 C, 5.3.2절
//       KDS 57 17 00 / KDS 17 10 00
// ============================================================

import {
  calcTG, calcTs, calcVds, calcWavelength,
  calcGroundDisp, calcGroundStiffness, getImpactFactor,
  calcWm, calcGroundStrain, calcLambda, calcAlpha,
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
// 해설식(5.3.2): σ_o = 0.322 × Wm / Z × (E×I / (Kv×D))^(1/4)
// 탄성지반 위 보(Winkler beam)의 최대 휨응력 공식
// 단위: Wm [kN/m], Z [m³], E [kN/m²], I [m⁴], Kv [kN/m³], D [m]
// 결과 σ_o [kN/m²] → MPa로 변환
// ※ 예제 역산 검증: σ_o=9.53MPa → (E*I/(Kv*D))^0.25=2.237m → Kv≈1848 kN/m³
export function calcAxialStressTraffic(Wm, Z_m, E_kN, I_m, Kv, D_m) {
  if (!Wm || Wm <= 0 || !Kv || Kv <= 0) return 0
  const sigma_o_kN = 0.322 * Wm * Math.pow(E_kN * I_m / (Kv * D_m), 0.25) / Z_m
  return sigma_o_kN / 1000   // MPa
}

// ─── 보정계수 ξ1, ξ2 (분절관 지진 축응력) ───────────────────
// 지침 해설그림 5.3.3, 5.3.4에서 ν', ν값에 따라 읽는 계수
// ν' = l/L' = l/(2L),  ν = l/L
// ξ1: ν'에 따른 축응력 보정계수 (그래프 근사)
// ξ2: ν에 따른 휨응력 보정계수 (그래프 근사)
// 그래프를 수식으로 근사 (0 ≤ ν', ν ≤ 1 범위)
// 지침 예제(C11): ν'=0.022, ξ1=1.0 / ν=0.022, ξ2=1.0
// → ν', ν가 작을 때(<<0.5) ξ ≈ 1.0, ν가 커지면 감소
// 그래프 형태: sin 형태의 envelope — 피크 위치 약 ν=0.25 근방
// 보수적 처리: ξ1=ξ2=1.0 (그래프 상단) — 추후 디지털화 데이터로 교체 가능
export function calcXi1(nu_prime) {
  // ν' = l/L'=l/(2L). 범위 0~1. 그래프 최대 1.0
  // 피크 값 1.0은 ν' ≈ 0~0.25 구간, 이후 감소
  if (nu_prime <= 0.25) return 1.0
  if (nu_prime <= 0.5)  return 1.0 - 2 * (nu_prime - 0.25)  // 선형 감소 근사
  return 0.5 - (nu_prime - 0.5)
}

export function calcXi2(nu_val) {
  // ν = l/L. 범위 0~1. 그래프 최대 1.0
  if (nu_val <= 0.25) return 1.0
  if (nu_val <= 0.5)  return 1.0 - 2 * (nu_val - 0.25)
  return 0.5 - (nu_val - 0.5)
}

// ─── 지진시의 축응력 (분절관) ───────────────────────────────
// 해설식(5.3.12): σ = √(σ'_L² + σ'_B²)
// 해설식(5.3.13): σ'_L = ξ1 × σ_L
// 해설식(5.3.14): σ'_B = ξ2 × σ_B
// 해설식(5.3.15): σ_L = a1 × (π×Uh/L) × E
// 해설식(5.3.16): σ_B = a2 × (2π²×D×Uh/L²) × E
// 단위: E [kN/m²], Uh [m], L [m], D [m] → σ [kN/m²]
// l: 관 1본 길이(m)
export function calcAxialStressSeismic(Uh, L, D_m, E_kN, alpha1, alpha2, l) {
  const Lprime = 2 * L   // 해설식(5.3.21)

  // 지반변형률 기반 응력
  const sigma_L_kN = alpha1 * (Math.PI * Uh / L) * E_kN           // 해설식(5.3.15)
  const sigma_B_kN = alpha2 * (2 * Math.PI ** 2 * D_m * Uh / L ** 2) * E_kN  // 해설식(5.3.16)

  // 보정계수
  const nu_prime = l / Lprime   // 해설식(5.3.23)
  const nu_val = l / L          // 해설식(5.3.22)
  const xi1 = calcXi1(nu_prime)
  const xi2 = calcXi2(nu_val)

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
    xi1, xi2, nu_prime, nu_val,
  }
}

// ─── 이음부 신축량 (분절관 지진시) ──────────────────────────
// 해설식(5.3.28): |uJ| = u0 × ūJ
// 해설식(5.3.29): u0 = a1 × Ua
// 해설식(5.3.30): Ua = (1/2) × Uh
// 해설식(5.3.31): ūJ = |cosh(β1×γ1) - cos(β1×γ1)| / (γ1×sinh(β1×γ1) + cosh(β1×γ1)×... )
//   ※ PDF에서 수식이 일부 손상되어 있으므로 원형 수식 재구성:
//   ūJ = (1/2) × |cosh(β1×γ1) - cos(β1×γ1)| / (... )
//   일본 수도시설 내진공법지침 원식 기반:
//   ūJ = (sinh(β1×γ1) - sin(β1×γ1)) / (cosh(β1×γ1) + cos(β1×γ1))
//   ※ 해설식(5.3.32): a = (1+γ1) / (1+(γ1/β1)²) ... 관련 매개변수
// 해설식(5.3.33): β1 = √(K1×l / (E×A))
// 해설식(5.3.34): γ1 = π×l / (2×L')
// 해설식(5.3.35): L' = 2×L
// K1 [kN/m²], l [m], E [kN/m²], A [m²]
export function calcJointDispSeismic(Uh, L, K1_kN, E_kN, A_m, l, alpha1) {
  const Lprime = 2 * L   // 해설식(5.3.35)

  // Ua: 무한 연속보 관축방향 상대변위진폭 (해설식 5.3.30)
  const Ua = 0.5 * Uh    // m

  // u0 (해설식 5.3.29)
  const u0 = alpha1 * Ua  // m

  // β1, γ1 (해설식 5.3.33, 5.3.34)
  const beta1 = Math.sqrt(K1_kN * l / (E_kN * A_m))
  const gamma1 = Math.PI * l / (2 * Lprime)

  const bg = beta1 * gamma1

  // ūJ: 일본 수도시설 내진공법지침 원식
  // ūJ = (sinh(bg) - sin(bg)) / (cosh(bg) + cos(bg))
  const uJ_bar = (Math.sinh(bg) - Math.sin(bg)) / (Math.cosh(bg) + Math.cos(bg))

  const uJ = Math.abs(u0 * uJ_bar)  // m (해설식 5.3.28)

  return { uJ, u0, Ua, beta1, gamma1, uJ_bar }
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
// KS D 4311 소켓 삽입 깊이 기준 (덕타일주철관)
// 허용 신축량 = 소켓 삽입 깊이 × 0.5 (일반), × 0.8 (내진형)
const DI_INSERTION_MM = {
   75: 78, 100: 78, 125: 78, 150: 80, 200: 80, 250: 80,
  300: 86, 350: 86, 400: 86, 450: 90, 500: 90, 600: 90,
  700: 95, 800: 95, 900: 100, 1000: 100, 1100: 100, 1200: 100,
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

  // ── Step 3: 표층지반 고유주기 ──
  const TG = calcTG(layers)                   // 해설식(5.3.4)
  const Ts = calcTs(TG)                        // 해설식(5.3.5): Ts = 1.25×TG
  const { Vds, vsi } = calcVds(layers, Ts)
  const H_total = layers.reduce((s, l) => s + l.H, 0)

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
  const { alpha1, alpha2 } = calcAlpha(lambda1, lambda2, L)

  // ── Step 9: 내압에 의한 축응력 (해설식 5.3.1) ──
  const sigma_i = calcAxialStressInternal(nu, P_MPa, D, t)  // MPa

  // ── Step 10: 차량하중에 의한 축응력 (해설식 5.3.2~5.3.3) ──
  let sigma_o = 0, Wm = 0, impact_i = 0
  if (Pm > 0 && Kv > 0) {
    const wmResult = calcWm(Pm, b_width, a_contact, h_cover)
    Wm = wmResult.Wm
    impact_i = wmResult.i
    sigma_o = calcAxialStressTraffic(Wm, Z_m, E_kN, I_m, Kv, D_m)  // MPa
  }

  // ── Step 11: 지진시의 축응력 (해설식 5.3.12~5.3.21) ──
  const seismicStress = calcAxialStressSeismic(Uh, L, D_m, E_kN, alpha1, alpha2, l_joint)

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
  const { uJ, u0, Ua, beta1, gamma1, uJ_bar } = calcJointDispSeismic(
    Uh, L, K1, E_kN, A_m, l_joint, alpha1
  )

  // ── Step 15: 이음부 신축량 합산 및 검토 ──
  const e_total = e_i + e_o + e_t + e_d + uJ
  const e_allow = getAllowableJointDisp(DN, isSeismicJoint)
  const dispOK = e_total <= e_allow

  const overallOK = stressOK && dispOK

  return {
    ok: overallOK,
    // 입력 정리
    S, Fa, Fv, SDS, SD1,
    // 지반
    TG, Ts, Vds, H_total, vsi,
    Sv, Sa, Sas, eta, xi, T_A, T_B,
    Uh, L, Lwave1, Lwave2, epsWave,
    // 지반 강성 / 관 특성
    K1, K2, lambda1, lambda2, alpha1, alpha2,
    A_m, I_m, Z_m,
    // 차량하중
    Wm, impact_i,
    // 관체 응력 (MPa)
    sigma_i, sigma_o,
    ...seismicStress,    // sigma_x, sigma_L, sigma_B, sigma_L_prime, sigma_B_prime, xi1, xi2, nu_prime, nu_val
    sigma_total, sigma_allow, stressOK,
    // 이음부 신축량 (m)
    e_i, e_o, e_t, e_d,
    uJ, u0, Ua, beta1, gamma1, uJ_bar,
    e_total, e_allow, dispOK,
  }
}
