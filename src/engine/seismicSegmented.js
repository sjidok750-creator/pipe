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
// 근거: KDS 17 10 00 암반지반(S1) 표준설계응답스펙트럼 + 감쇠보정계수 C_D
//       (평가요령 부록C 및 실무 계산서 동일 적용 확인)
//   T ≤ T_A(0.06s):        Sa = S×(1+30T)   [T_A에서 2.8S 도달]
//   T_A ≤ T ≤ T_B(0.3s):  Sa = 2.8×S       (정가속도)
//   T > T_B:                Sa = 0.84×S/T    (정속도 → Sv 일정)
// 감쇠보정계수: C_D = (6.42/(1.42+ξ))^0.48  [KDS 17 10 00]
//   붕괴방지수준(ξ=20%): C_D = 0.5605
//   기능수행수준(ξ=10%): C_D = 0.7585
//   (T=0에서 1.0, 0~T_A 직선보간, T≥T_A에서 C_D)
// Sv = Sa × g × T / (2π) × C_D
// S: Z × I (기반암 기준, Fa=Fv=1.0 적용 전)
// 검증: 부록C 예제 C.2 — Z=0.11, I=1.4, Ts=1.543s → Sv=0.113 m/s ✓ (그림 C.2.4)
//       실무 계산서 — Ts=0.256s → Sv=0.0967 / Ts=0.404s → Sv=0.113 ✓
// ※ 구버전(2.5S plateau + η=√(10/(5+ξ)))은 붕괴방지수준에서 우연히 0.7% 차이로
//    근접했으나 기능수행수준에서 약 4% 과소 → KDS 원식으로 교체
export function calcSv(S, Ts, level = 'collapse', g = 9.81) {
  const T_A = 0.06    // 암반지반 단주기 전이주기 (KDS 17 10 00)
  const T_B = 0.3     // 암반지반 장주기 전이주기

  // 암반 기반면 단주기 스펙트럼 가속도 (Fa=1.0)
  const Sas = S * 2.8  // g배수

  // 감쇠보정계수 C_D
  const xi = level === 'collapse' ? 20 : 10   // % (붕괴방지=20%, 기능수행=10%)
  const Cd_full = Math.pow(6.42 / (1.42 + xi), 0.48)
  const Cd = Ts <= 0 ? 1.0 : (Ts >= T_A ? Cd_full : 1.0 + (Cd_full - 1.0) * (Ts / T_A))

  // 감쇠보정 전 Sv 플래토 (참고용)
  const Sv_plateau_raw = Sas * g * T_B / (2 * Math.PI)

  // Ts 구간별 Sa 산정 (암반 기준, 감쇠보정 전)
  let Sa_raw  // g배수
  if (Ts <= T_A) {
    Sa_raw = S * (1 + 30 * Ts)
  } else if (Ts <= T_B) {
    Sa_raw = Sas                        // 정가속도 구간
  } else {
    Sa_raw = 0.84 * S / Ts              // 정속도 구간 (Sa 감소, Sv 일정)
  }

  // Sv = Sa×g×T/(2π)×C_D  (T>T_B에서는 0.84S×g×C_D/(2π)로 자동 상수화)
  const Sv = Sa_raw * g * Ts / (2 * Math.PI) * Cd

  const Sa = Sa_raw * Cd   // 감쇠보정 후 Sa (참고용)

  // eta 키는 구버전 호환용 별칭 (= C_D)
  return { Sv, Sa, Sas, Sv_plateau_raw, eta: Cd, Cd, Cd_full, xi, T_A, T_B }
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

// ─── 보정계수 ξ1, ξ2 (분절관 지진 축응력·휨응력) — 해석해 ──
// 근거: 평가요령 부록C 해설그림 5.3.3/5.3.4 (= C.1.4/C.1.5)의 원본 이론 모델
//
// 모델: 이음부에서 힘 전달이 끊기는 관 1본(길이 l)이 정현파 지반변위
//       ug = U·sin(kx+φ)를 받을 때의 응답을 연속관 대비 비율로 나타낸 해석해
//   ξ1: 탄성지반(K1) 위 봉(축력), 양단 축력 0  → EA·u″ = K1(u−ug)
//   ξ2: 탄성지반(K2) 위 보(휨),  양단 M=0, V=0 → EI·u⁗ + K2·u = K2·ug
//   관 위치 불확실성 → 최악 위상 φ에 대해 최대화 (위상 최대화는 해석적 처리:
//   응답이 cosφ·P(x)+sinφ·Q(x) 형태 → max_φ = √(P²+Q²))
//
// 검증 (그래프 판독 불필요 — 이론해가 지침 그래프 원본):
//   · 지침 인쇄 곡선과 픽셀 대조 일치 (ξ1 전 곡선, ξ2 ν≤0.1 전 곡선)
//   · 동일 모델이 지침 인쇄 수식 ūJ(이음부 신축량)를 4자리 재현 (0.2912/0.2913)
//   · 실무 계산서 대사: ξ1(21.274, 0.046)=0.1181(≒0.118), ξ2(78.77, 0.066)=0.759(≒0.76)
//   · ξ2 피크 위치 = 2√2π/ν (보-지반 고유파장 공진) — 지침 곡선과 일치
// ※ 구버전(차트 디지타이즈 룩업)은 ξ2 곡선이 실제 대비 약 2.8배 좌측으로
//    밀려 있어 폐기 — ν=0.028, λ2L=108에서 지침 예제 C.1의 0.149는
//    지침 작성자의 수기 판독값이며 곡선 위 실제 값은 0.186 (이론해 채택)

// n×n 선형계 풀이 — 부분 피벗 가우스 소거
function _solveLinear(A, b) {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let p = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[p][col])) p = r
    if (Math.abs(M[p][col]) < 1e-300) return null
    ;[M[col], M[p]] = [M[p], M[col]]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / M[col][col]
      for (let c2 = col; c2 <= n; c2++) M[r][c2] -= f * M[col][c2]
    }
  }
  return M.map((row, i) => row[n] / M[i][i])
}

// 복소수 헬퍼: [re, im]
const _cMul = (a, b) => [a[0]*b[0] - a[1]*b[1], a[0]*b[1] + a[1]*b[0]]
const _cExp = (re, im) => { const m = Math.exp(re); return [m*Math.cos(im), m*Math.sin(im)] }

// ξ1: 축응력 보정계수 — 탄성지반 위 자유단 봉의 해석해
// lam1Lp = λ1 × L',  nu_prime = l / L'  (l=1 정규화: λ1·l = lam1Lp·ν', k·l = 2π·ν')
export function calcXi1(lam1Lp, nu_prime, nx = 1001) {
  const lam = lam1Lp * nu_prime
  const k = 2 * Math.PI * nu_prime
  if (!(lam > 1e-8) || !(k > 1e-10)) return 0
  const Eexp = Math.exp(-lam)
  // u_h = a1·e^{−λx} + a2·e^{−λ(1−x)},  변형률 BC: u'(0)=u'(1)=0 (이음부 축력 0)
  // 계수행렬 [[−λ, λE],[−λE, λ]], 위상 cos/sin 성분별 우변
  const det = -lam * lam * (1 - Eexp * Eexp)
  if (Math.abs(det) < 1e-300) return 0
  // cos성분: u_p' = k·cos(kx) → rhs [−k, −k·cos(k)]
  const bc0 = -k, bc1 = -k * Math.cos(k)
  const a1c = (bc0 * lam - lam * Eexp * bc1) / det
  const a2c = (lam * Eexp * bc0 - lam * bc1) / det
  // sin성분: u_p' = −k·sin(kx) → rhs [0, +k·sin(k)]
  const bs0 = 0, bs1 = k * Math.sin(k)
  const a1s = (bs0 * lam - lam * Eexp * bs1) / det
  const a2s = (lam * Eexp * bs0 - lam * bs1) / det
  let best = 0
  for (let i = 0; i <= nx; i++) {
    const x = i / nx
    const e1 = -lam * Math.exp(-lam * x)
    const e2 = lam * Math.exp(-lam * (1 - x))
    const P = a1c * e1 + a2c * e2 + k * Math.cos(k * x)
    const Q = a1s * e1 + a2s * e2 - k * Math.sin(k * x)
    const v = P * P + Q * Q
    if (v > best) best = v
  }
  return Math.sqrt(best) / k
}

// ξ2: 휨응력 보정계수 — 탄성지반 위 자유단 보의 해석해
// lam2L = λ2 × L,  nu_val = l / L  (l=1 정규화: λ2·l = lam2L·ν, k·l = 2π·ν)
export function calcXi2(lam2L, nu_val, nx = 1501) {
  const lam = lam2L * nu_val
  const k = 2 * Math.PI * nu_val
  if (!(lam > 1e-6) || !(k > 1e-10)) return 0
  const c = lam / Math.SQRT2
  // 특성근 r = c(−1+i); 기저 F(x)=e^{rx}(좌측감쇠), G(x)=e^{r(1−x)}(우측감쇠)
  // F⁽ⁿ⁾ = rⁿF, G⁽ⁿ⁾ = (−r)ⁿG;  r² = −2ic², r³ = 2c³(1+i)
  const r2 = [0, -2 * c * c]
  const r3 = [2 * c ** 3, 2 * c ** 3]
  const F = (x) => _cExp(-c * x, c * x)
  const G = (x) => _cExp(-c * (1 - x), c * (1 - x))
  // u_h = Re[A·F] + Re[B·G], 미지수 [ReA, ImA, ReB, ImB]
  // u⁽ⁿ⁾ 행: A항 계수 p=rⁿ·F → [p.re, −p.im], B항 q=(−1)ⁿrⁿ·G → [q.re, −q.im]
  const row = (xv, rn, gsign) => {
    const p = _cMul(rn, F(xv))
    const q = _cMul([gsign * rn[0], gsign * rn[1]], G(xv))
    return [p[0], -p[1], q[0], -q[1]]
  }
  const M = [
    row(0, r2, +1),   // u''(0) = −u_p''(0)
    row(1, r2, +1),   // u''(1)
    row(0, r3, -1),   // u'''(0) [(−r)³ = −r³]
    row(1, r3, -1),   // u'''(1)
  ]
  // u_p = sin(kx+φ): u_p''=−k²sin(kx+φ), u_p'''=−k³cos(kx+φ)
  const bc = [k * k * Math.sin(0), k * k * Math.sin(k), k ** 3 * Math.cos(0), k ** 3 * Math.cos(k)]
  const bs = [k * k * Math.cos(0), k * k * Math.cos(k), -(k ** 3) * Math.sin(0), -(k ** 3) * Math.sin(k)]
  const ac = _solveLinear(M, bc)
  const as = _solveLinear(M, bs)
  if (!ac || !as) return 0
  let best = 0
  for (let i = 0; i <= nx; i++) {
    const x = i / nx
    const Fx = F(x), Gx = G(x)
    const upp = (a) => {
      const A = [a[0], a[1]], B = [a[2], a[3]]
      return _cMul(_cMul(A, r2), Fx)[0] + _cMul(_cMul(B, r2), Gx)[0]
    }
    const P = upp(ac) - k * k * Math.sin(k * x)
    const Q = upp(as) - k * k * Math.cos(k * x)
    const v = P * P + Q * Q
    if (v > best) best = v
  }
  return Math.sqrt(best) / (k * k)
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
// α(선팽창계수): 주철 1.0×10⁻⁵/℃ — 부록C 표 C.1.4 역산 확인 (0.0012m = α×20℃×6m)
export function calcJointDispStatic(sigma_i_kN, sigma_o_kN, E_kN, l, deltaT, delta_settle, l_settle, alpha = 1.0e-5) {
  const e_i = (sigma_i_kN / E_kN) * l                           // 내압 (m)
  const e_o = (sigma_o_kN / E_kN) * l                           // 차량 (m)
  const e_t = alpha * deltaT * l                                // 온도 (m)
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
// 평가요령 부록C 표 C.1.3 확인: 허용응력 27.50 MPa (덕타일주철관 2종관, 내진 시)
// 실무 계산서(02-3.xlsx)도 동일값 적용. 관종·등급별 세부 산정근거는 지침에
// 미제시 — 타 등급/관종 적용 시 sigma_allow 직접입력으로 조정
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
 * @param {number} params.nu           - 포아송비 (주철관 0.28, 부록C C.1.2)
 * @param {number} params.E            - 탄성계수 (MPa, 주철관 160,000 = 1.6×10⁸ kN/m², 부록C C.1.2)
 * @param {number} params.tolFactor    - 주철관 두께 공차계수 (t_eff = t/tolFactor, 부록C: 1.1)
 * @param {number} params.e_allow_input - 허용신축량 직접입력 (m), 미입력 시 KS 삽입깊이 기반 산정
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
    nu = 0.28,          // 주철관 (부록C C.1.2: ν=0.28)
    E = 160000,         // MPa, 주철관 (부록C C.1.2: 1.6×10⁸ kN/m²)
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
    tolFactor = 1.1,    // 주철구조물 두께 공차계수 (부록C C.1.2: t = t₀/1.1)
    e_allow_input = null,
  } = params

  const D_m = D / 1000     // m (외경)
  // 유효 관두께: 공칭관두께에서 주철구조물 공차를 뺀 값 (부록C C.1.2, t = t₀/1.1)
  // 단면성능(A, I, Z)과 내압 축응력 모두 유효두께 기준 (부록C 예제 및 실무 계산서 동일)
  const t_eff = t / (tolFactor > 0 ? tolFactor : 1)   // mm
  const t_m = t_eff / 1000  // m (유효 관두께)
  const E_kN = E * 1000    // kN/m²
  const P_MPa = P          // MPa
  const P_kN = P * 1000    // kN/m²

  // 단면 특성 (m 단위, 유효두께 기준)
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

  // ── Step 9: 내압에 의한 축응력 (해설식 5.3.1) — 유효두께 t_eff 적용 ──
  const sigma_i = calcAxialStressInternal(nu, P_MPa, D, t_eff)  // MPa

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
  // 허용신축량: 직접입력 우선 (부록C 예제 C.1은 DN900에 0.031m 적용 — 산정근거 미제시,
  // 제조사 이음 허용기준 확인 권장), 미입력 시 KS D 4311 삽입깊이 기반 산정값 사용
  const e_total = e_i + e_o + e_t + e_d + uJ
  const e_allow = (e_allow_input != null && e_allow_input > 0)
    ? e_allow_input
    : getAllowableJointDisp(DN, isSeismicJoint)
  const dispOK = e_total <= e_allow

  // ── Step 16: 이음부 굽힘각도 (θ_J) 검토 ──
  // 2025년 상수도설계기준해설편 §4.3.3(2)다: θ = 4π²·l·Uh / L²
  // 물리적 의미: 정현파 지반변위의 최대 곡률(κ_max = Uh·(2π/L)²)에 이음부 길이(l)를 곱한 값
  // ※ "추가적으로 검토할 수 있다" — 선택 항목, 최종 합격/불합격에 포함하지 않음
  // ※ 허용굽힘각 출처: 한국주철관공업(KCIP) Tyton 접합 카탈로그
  //   (https://kcip.co.kr/sub/product_ductile_03.php 조인트부 굴곡허용각도)
  //   평가요령(2021) 및 설계기준(2025) 모두 수치 미규정 — 제조사 기준 참고용
  const theta_J = 4 * Math.PI ** 2 * l_joint * Uh / L ** 2  // rad
  // KCIP Tyton 기준: DN≤300→5°, DN≤400→4°, DN≤600→3°, DN≤900→2.5°, DN>900→2°
  const theta_allow_deg =
    DN <= 300 ? 5.0 :
    DN <= 400 ? 4.0 :
    DN <= 600 ? 3.0 :
    DN <= 900 ? 2.5 : 2.0
  const theta_allow = theta_allow_deg * Math.PI / 180  // rad
  const angleOK = Math.abs(theta_J) <= theta_allow     // 참고용

  // 최종 합격 판정: 관체응력 + 이음부신축량만 필수 (굽힘각은 선택 검토)
  const overallOK = stressOK && dispOK

  return {
    ok: overallOK,
    // 입력 정리
    t_nominal: t, t_eff, tolFactor,
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
