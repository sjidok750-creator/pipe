// ============================================================
// 연속관(강관) 내진성능 본평가 엔진
// 근거: 기존시설물(상수도) 내진성능 평가요령 부록 C
//       KDS 57 17 00 / KDS 17 10 00
// ============================================================

import {
  calcTG, calcTs, calcVds, calcWavelength,
  calcGroundDisp, calcGroundStiffness, getImpactFactor,
  calcWm, calcGroundStrain, calcLambda, calcAlpha,
  resolveHEffective, resolveLayersForTGVds,
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

// ─── 부등침하에 의한 축변형률 (연속관 — Winkler beam 모델) ──
// 근거: 2025년 상수도설계기준해설편 §4.3.3(3)라, 평가요령(2021) 해설식(5.3.39~5.3.42)
// 관을 탄성지반 위 보로 간주, 최대 휨모멘트 M = max(M₁, M₂)로 변형률 계산
//
// Wd = γ(h + h″)D               연직토하중 (kN/m)
// β  = ⁴√(K₂/(4EI))             특성값 (m⁻¹)
// M₁ = Wd/(2β²) × e^(-βL/2) × sin(βL/2)
// M₂ = 0.3877×Wd/β² × [0.2079 + e^(-βL)×(sin(βL)−cos(βL))]
// ε_d = M·D / (2·E·I)
//
// @param L      연약지반 구간 (m)
// @param gamma  흙 단위중량 (kN/m³)
// @param h      토피(흙 두께) (m)
// @param h2     성토고 h″ (m) — 성토 없으면 0
// @param D_m    관 외경 (m)
// @param E_kN   탄성계수 (kN/m²)
// @param I_m    단면2차모멘트 (m⁴)
// @param K2     축직교방향 지반강성계수 (kN/m²)
// 검증: 부록C 예제 → ε_d = 2.17×10⁻⁵ ✓
export function calcStrainSettlement(L, gamma, h, h2, D_m, E_kN, I_m, K2) {
  if (L <= 0 || K2 <= 0 || I_m <= 0) return { epsilon_d: 0, M: 0, Wd: 0, beta: 0, M1: 0, M2: 0 }

  const Wd   = gamma * (h + h2) * D_m                   // 연직토하중 (kN/m)
  const beta = Math.pow(K2 / (4 * E_kN * I_m), 0.25)    // 특성값 (m⁻¹)
  const bL   = beta * L

  const M1 = (Wd / (2 * beta ** 2)) * Math.exp(-bL / 2) * Math.sin(bL / 2)
  const M2 = 0.3877 * (Wd / beta ** 2) * (0.2079 + Math.exp(-bL) * (Math.sin(bL) - Math.cos(bL)))
  const M  = Math.max(M1, M2)

  const epsilon_d = M * D_m / (2 * E_kN * I_m)

  return { epsilon_d, M, Wd, beta, M1, M2 }
}

// ─── 지진에 의한 축변형률 (연속관) ──────────────────────────
// 해설식(5.3.43): ε_L = α1 × ε_G  (L > L1)  또는  L/ξ  (L ≤ L1)
// 해설식(5.3.44): ε_B = α2 × (2πD/L) × ε_G  (굽힘 변형률)
// 해설식(5.3.45): ε_x = √(ε_L² + ε_B²)
// 해설식(5.3.52~53): L과 L1(Ly)을 비교하여 ε_L 결정
//   ξ = 2√2 × E×t/τ  (지침 해설식 5.3.52 / sipc 식(52): √는 숫자 2에만 적용)
//   L1 = ξ × ε_y  (판정 기준 변형률 — 지침 C.2: ε_y = 46t/D)
//   L > L1 → ε_L = α1 × ε_G  (일반식)
//   L ≤ L1 → ε_L = L / ξ     (마찰 지배)
// tau: 강관-지반 마찰력 (kN/m²), t_m: 관두께(m), E_kN: 탄성계수(kN/m²)
// epsilon_y: L1 산정 기준 변형률 (허용변형률과 동일 기준 적용)
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
// 해설식(5.3.37): ε_o = σ_o / E, σ_o = 0.322 × Wm / Z × √(E×I / (Kv×D))
// 탄성지반 위 보(Winkler beam)의 최대 휨응력 → 축변형률 변환
// 단위: Wm [kN/m], Z [m³], E [kN/m²], I [m⁴], Kv [kN/m³], D [m]
export function calcStrainTrafficContinuous(Wm, Z, E_kN, I, Kv, D_m) {
  if (!Wm || Wm <= 0) return { epsilon_o: 0, sigma_o_kN: 0 }
  const sigma_o_kN = 0.322 * Wm * Math.sqrt(E_kN * I / (Kv * D_m)) / Z
  const epsilon_o = sigma_o_kN / E_kN
  return { epsilon_o, sigma_o_kN }
}

// ─── 허용변형률 (연속강관) — 46t/D 단일 ─────────────────────
// 근거: 평가요령 부록 C
//   · p.C17 "연속강관의 내진성능평가 기준 : 축변형률(붕괴방지수준)
//            ≤ 허용변형률(국부좌굴 개시변형률)"
//   · <표 C.2.3> 판정행 "항복점변형률 (46t/D) = 0.414 %" (DN1000·t9 예제)
// 지침 표기 46t/D 는 % 값이므로 무차원 변형률로 환산해 반환한다 (÷100).
// D 는 관 외경 [mm] (부록 C.2.1 "관경(외경)").
//
// ⚠ 재료 항복변형률 σ_y/E 를 선택지로 되살리지 말 것.
//   평가요령에 그런 기준은 없다. 종전 화면은 σ_y/E 쪽에 "지침 부록C 표 C.2.3"
//   이라는 근거를 붙이고 46t/D 쪽에는 "ASCE/KDS 해설"을 붙여 근거가 뒤바뀌어
//   있었고, σ_y/E(SS400 235 MPa 기준 0.112 %)를 고르면 허용값이 약 3.7배
//   엄해지면서 근거 없는 N.G 가 인쇄됐다. 판정 기준은 46t/D 하나뿐이다.
export function calcAllowableStrain(t_mm, D_mm) {
  if (!(t_mm > 0) || !(D_mm > 0)) {
    throw new Error(
      `calcAllowableStrain: 허용변형률 46t/D 를 산정할 수 없습니다 ` +
      `(t = ${t_mm}, D = ${D_mm}). 관두께와 외경을 입력하십시오.`
    )
  }
  return 46 * t_mm / D_mm / 100
}

// ⚠ 연속관에 von Mises 조합응력(후프+축) 검토를 되살리지 말 것.
//   근거 문서 어디에도 요구 조항이 없다 (2026-09 전수 확인):
//     · 평가요령 : 연속관 판정은 축변형률 단일 — Σε ≤ εy = 46t/D [부록 표 C.2.3]
//     · KDS 57 00 00 관보 원문 : 'Mises'·'조합응력'·'등가응력' 0회
//     · 상수도설계기준 해설편 2025 : '합성응력'은 σx = √(σL′²+σB′²) (축+휨)일 뿐
//     · 실무 계산서 02-3 관로내진성능평가.xlsx : 응력 판정 행 자체가 없음
//   종전 구현은 허용치로 0.9×σy(=211.5 MPa, SS400 항복강도 기준)를 썼는데
//   출처 조항이 없고, 대상 강종(STWW 400)과도 맞지 않으면서 세부지침 11-134 의
//   210 MPa(원주방향·동수압+수격압 전용)과 값이 비슷해 근거가 있는 것처럼 보였다.
//   세부지침 11-134 [해설 표 11.5.1]에는 강관의 축방향 허용응력 자체가 없다.

// ─── 전체 연속관 본평가 메인 함수 ───────────────────────────
/**
 * @param {object} params
 * @param {number} params.DN           - 공칭관경 (mm)
 * @param {number} params.t            - 관두께 (mm)
 * @param {number} params.D_out        - 외경 (mm)
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
 * @param {number} params.E            - 탄성계수 (MPa, 강관 210,000 = 2.1×10⁸ kN/m², 부록C C.2.2)
 * @param {number} params.Pm           - 후륜 1륜당 차량하중 (kN), 없으면 0
 * @param {number} params.b_width      - 차량점유폭 (m), 기본 2.75
 * @param {number} params.a_contact    - 접지폭 (m), 기본 0.2
 * @param {number} params.Kv           - 연직방향 지반반력계수 (kN/m³)
 * @param {number} params.tau          - 강관-지반 마찰력 (kN/m²), 기본 10
 */
export function evalContinuous(params) {
  const {
    DN, t, D_out,
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
    E = 210000,          // MPa (강관, 부록C C.2.2: 2.1×10⁸ kN/m²)
    Pm = 0,              // kN/輪 (차량 후륜 1륜 하중)
    b_width = 2.75,      // m
    a_contact = 0.2,     // m
    Kv = 0,              // kN/m³ (연직방향 지반반력계수)
    tau = 10,            // kN/m² (강관-지반 마찰력)
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
  const TG = calcTG(layersEff)
  const Ts = calcTs(TG)
  const { Vds, vsi } = calcVds(layersEff, Ts)
  const H_total = H_effective               // backward-compat alias

  // ── Step 4: 기반면 속도응답스펙트럼 (해설식 5.3.6, 암반기준+감쇠보정) ──
  const seismicLevel = params.level ?? 'collapse'
  const { Sv, Sa, Sas, eta, xi: xi_sv, T_A, T_B } = calcSv(S, Ts, seismicLevel)

  // ── Step 5: 지반수평변위 ──
  const Uh = calcGroundDisp(Sv, Ts, z_pipe, H_total)  // m

  // ── Step 6: 파장 ──
  const { L, L1: Lwave1, L2: Lwave2 } = calcWavelength(Ts, Vds, Vbs)

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
  // Wm = 2×Pm×D / (C×(a+2h×tan45°)) × (1+i)  [부록C 해설식(5.3.3)]
  const C_width = params.C_width ?? 3.0   // 차량점유폭 (m), 기본 3.0
  const Kv_used = Kv
  let epsilon_o = 0, sigma_o_kN = 0, Wm_traffic = 0, i_traffic = 0
  if (Pm > 0 && Kv_used > 0) {
    const wmResult = calcWm(Pm, D_m, C_width, a_contact, h_cover)
    Wm_traffic = wmResult.Wm
    i_traffic  = wmResult.i
    ;({ epsilon_o, sigma_o_kN } = calcStrainTrafficContinuous(Wm_traffic, Z_m, E_kN, I_m, Kv_used, D_m))
  }

  // ── Step 11: 온도변화에 의한 축변형률 (해설식 5.3.38) ──
  const epsilon_t = calcStrainTemperature(deltaT)

  // ── Step 12: 부등침하에 의한 축변형률 (해설식 5.3.39~5.3.42) ──
  // L_settle: 연약지반 구간, h2_settle: 성토고 h″ (없으면 0)
  const h2_settle = params.h2_settle ?? 0
  const settleResult = (L_settle > 0)
    ? calcStrainSettlement(L_settle, gamma, h_cover, h2_settle, D_m, E_kN, I_m, K2)
    : { epsilon_d: 0, M: 0, Wd: 0, beta: 0, M1: 0, M2: 0 }
  const epsilon_d = settleResult.epsilon_d

  // ── Step 13: 지진에 의한 축변형률 (해설식 5.3.43~5.3.53) ──
  // 허용변형률 εy = 46t/D [부록 표 C.2.3] — 미끌림 판정길이 Ly = ξ·εy 에도
  // 같은 값을 쓴다 (지침 p.C28 "L ≤ ξ·εy", 실무 계산서 동일).
  const epsilon_allow = calcAllowableStrain(t, D_out)

  const {
    epsilon_G, epsilon_L, epsilon_B, epsilon_x,
    xi, L1: Ly, usedFriction,
  } = calcStrainSeismic(Uh, L, D_m, alpha1, alpha2, E_kN, t_m, tau, epsilon_allow)

  // ── Step 14: 합성 변형률 합산 (절댓값 합산, 보수적) ──
  const epsilon_total = Math.abs(epsilon_i) + Math.abs(epsilon_o)
    + Math.abs(epsilon_t) + Math.abs(epsilon_d) + Math.abs(epsilon_x)

  // ── Step 15: 허용변형률 판정
  const strainOK = epsilon_total <= epsilon_allow

  // 후프응력(보고서 표시용) — εi = ν·σθ/E 유도 근거
  const sigma_theta_MPa = sigma_theta / 1000  // kN/m² → MPa

  const overallOK = strainOK  // 평가요령 부록 C.2 : 축변형률 검토가 유일한 판정 기준

  return {
    ok: overallOK,
    // 지반
    S, Fa, Fv, SDS, SD1,
    TG, Ts, Vds, H_total, H_effective, H_sum, gap: hGap, warnings: hWarnings, vsi,
    Sv, Sa, Sas, eta, xi: xi_sv, T_A, T_B,
    Uh, L, Lwave1, Lwave2,
    // alias (보고서/결과 페이지 호환)
    L1: Lwave1, L2: Lwave2,
    // 지반 강성 / 관 특성
    K1, K2, lambda1, lambda2, alpha1, alpha2, Lprime,
    A_m, I_m, Z_m,
    // 변형률 성분
    epsilon_i, epsilon_o, epsilon_t, epsilon_d,
    // 부등침하 세부 (보고서용)
    settle_M: settleResult.M, settle_M1: settleResult.M1, settle_M2: settleResult.M2,
    settle_Wd: settleResult.Wd, settle_beta: settleResult.beta,
    epsilon_G, epsilon_L, epsilon_B, epsilon_x,
    // alias (보고서/결과 페이지 호환)
    epsilon_eq: epsilon_x, epsilon_eq_L: epsilon_L, epsilon_eq_B: epsilon_B,
    // L1(Ly) 비교
    xi, Ly, usedFriction, tau,
    // 합산
    epsilon_total, epsilon_allow, strainOK,
    // 허용변형률 기준은 46t/D 단일 — 보고서 표기용 별칭
    epsilon_y: epsilon_allow,
    allowSource: '평가요령 부록 <표 C.2.3> 항복점변형률 εy = 46t/D [%]',
    // 응력 (MPa) — 판정에는 쓰지 않는다 (판정은 축변형률 단일)
    sigma_theta: sigma_theta_MPa, sigma_o_kN,
    // 차량하중 산정 세부 (보고서용)
    Kv_used, Wm_traffic, i_traffic,
  }
}
