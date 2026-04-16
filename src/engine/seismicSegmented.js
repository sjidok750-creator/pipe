// ============================================================
// 분절관(주철관) 내진성능 본평가 엔진
// 근거: 기존시설물(상수도) 내진성능 평가요령 부록 C
//       KDS 57 17 00 / KDS 17 10 00
// ============================================================

import {
  calcTG, calcTs, calcVds, calcWavelength,
  calcGroundDisp, calcGroundStiffness, getImpactFactor,
} from './seismicConstants.js'

// 설계지반가속도 S (= Z × I)
export function calcS(Z, I) {
  return Z * I
}

// 증폭계수 Fa, Fv 보간 (S값에 따라 선형 보간)
// AMP_FACTOR 테이블: [S≤0.1, S=0.2, S=0.3]
export function interpAmpFactor(factors, S) {
  // factors: [f_01, f_02, f_03]
  const [f1, f2, f3] = factors
  if (S <= 0.1) return f1
  if (S <= 0.2) return f1 + (f2 - f1) * (S - 0.1) / 0.1
  if (S <= 0.3) return f2 + (f3 - f2) * (S - 0.2) / 0.1
  return f3
}

// 설계스펙트럼 가속도 Sa, Sv
// Ts: 설계고유주기(s), T: 구조물 고유주기(s)
// S_DS = Fa*S*2.5, S_D1 = Fv*S
export function calcDesignSpectrum(S, Fa, Fv) {
  const SDS = Fa * S * 2.5   // 단주기 설계스펙트럼 가속도
  const SD1 = Fv * S         // 1초 주기 설계스펙트럼 가속도
  return { SDS, SD1 }
}

// 속도응답스펙트럼 Sv (m/s)
// Ts: 관로계 고유주기(s), SDS, SD1, g=9.81
export function calcSv(Ts, SDS, SD1, g = 9.81) {
  const T0 = 0.2 * SD1 / SDS   // 단주기 전환점
  const TS = SD1 / SDS          // 장주기 전환점
  let Sa  // 가속도응답스펙트럼 (g 단위)
  if (Ts <= T0) {
    Sa = SDS * (0.4 + 0.6 * Ts / T0) / g
  } else if (Ts <= TS) {
    Sa = SDS / g
  } else {
    Sa = SD1 / (Ts * g)
  }
  const Sv = Sa * g * Ts / (2 * Math.PI)  // m/s
  return { Sv, Sa, T0, TS }
}

// 지반수평변위 → 이음부 신축량 관련
// PGV (최대지반속도) 추정: PGV = Sv (간략법, 국내 기준 사용 시)
export function estimatePGV(Sv) {
  return Sv  // PGV ≈ Sv (m/s)
}

// ─── 내압에 의한 축응력 (분절관) ────────────────────────────
// σ_i = ν × P(D−t) / (2t)    [MPa]
// ν: 포아송비(주철관 = 0.26)
// P: 설계수압 (MPa)
// D: 외경 (mm), t: 관두께 (mm)
export function calcAxialStressInternal(nu, P, D, t) {
  const sigma_i = nu * P * (D - t) / (2 * t)
  return sigma_i  // MPa
}

// ─── 차량하중에 의한 축응력 ──────────────────────────────────
// 단순 추정: σ_o = M_v / Z_pipe
// M_v: 차량하중 휨모멘트 (도로 매설 간략법)
// 여기서는 Boussinesq 영향계수 기반 계산
// h: 토피 (m), P_axle: 표준축중 = 196 kN (DB-24)
// σ_v = (3*P_axle) / (2π*h²) × Kv (응력영향계수)
// 단: 분절관은 이음부로 인해 관체 휨 직접 전달 없음 → 축응력만 고려
// 간략법: σ_o = α_v × Pv(관정) × D × L_eff / Z_gross
// 국내 실무: 관체 자체 축응력 ≈ 0 (이음부 회전으로 흡수), 이음부 처짐각 검토로 대체
// → 차량하중에 의한 관체 축응력 = 0 (분절관)
export function calcAxialStressTraffic() {
  return 0  // 분절관은 이음부 회전으로 흡수
}

// ─── 지진에 의한 축응력 ──────────────────────────────────────
// 응답변위법: 관로 축방향
// αL: 관로 축방향 지반변형률 = Uh / (L/4) = 4Uh/L
// αB: 관로 굽힘 변형률 = π²Uh / L²  (횡방향)
// σ_x = E × (αL + αB)   [MPa]
export function calcAxialStressSeismic(E, Uh, L) {
  const alphaL = 4 * Uh / L          // 축방향 지반변형률
  const alphaB = Math.PI ** 2 * Uh / L ** 2  // 굽힘 변형률 (m^-1이 아니라 무차원)
  // αB는 실제로 m 단위 파장에서 무차원으로 변환 필요
  // σ_x = E × (maxGroundStrain)
  // 실용적으로: σ_L = E × (Uh/Lj) × cosθ (각 이음부 길이 Lj 기준)
  const epsilonL = alphaL   // 관 축방향 변형률
  const sigma_x_L = E * epsilonL  // 축방향 응력 (MPa), E in MPa
  const sigma_x_B = 0  // 분절관 굽힘 → 이음부 각도 변화로 흡수
  return { sigma_x: sigma_x_L + sigma_x_B, alphaL, alphaB, epsilonL }
}

// ─── 이음부 신축량 검토 ───────────────────────────────────────
// u_J: 이음부 1개소당 상대변위 (신축량)
// u_J = Uh × sin(π × Lj / L)  ≈ Uh × (π × Lj / L) for small angle
// Lj: 이음부 간격 (관 1본 길이, m)
export function calcJointDisp(Uh, Lj, L) {
  const ratio = Math.PI * Lj / L
  const u_J = Uh * Math.sin(ratio)  // m
  return { u_J, ratio }
}

// ─── 이음부 허용 신축량 ───────────────────────────────────────
// 주철관 기준: 허용 삽입량 = 표준 삽입량의 50% (일반), 내진형 이음 시 별도
// 국내 실무: 허용 신축량 δ_allow = 소켓 삽입량 × 0.5
// DN별 표준 삽입량 (mm): KS D 4311 기준
const DI_INSERTION = {
  80: 78, 100: 78, 125: 78, 150: 80, 200: 80, 250: 80,
  300: 86, 350: 86, 400: 86, 450: 90, 500: 90, 600: 90,
  700: 95, 800: 95, 900: 100, 1000: 100, 1100: 100, 1200: 100,
}

export function getAllowableJointDisp(DN, isSeismicJoint = false) {
  // 가장 가까운 DN 찾기
  const dns = Object.keys(DI_INSERTION).map(Number)
  const closest = dns.reduce((a, b) => Math.abs(b - DN) < Math.abs(a - DN) ? b : a, dns[0])
  const L_insert = DI_INSERTION[closest] / 1000  // m
  if (isSeismicJoint) return L_insert * 0.8  // 내진형: 80%
  return L_insert * 0.5  // 일반형: 50%
}

// ─── 이음부 허용 회전각 (굽힘방향) ──────────────────────────
// KS D 4311 / 평가요령: 허용 회전각 θ_allow (도)
// DN < 300: 3.5°, 300≤DN≤600: 2.5°, DN>600: 1.5°
export function getAllowableJointAngle(DN) {
  if (DN < 300) return 3.5 * Math.PI / 180  // rad
  if (DN <= 600) return 2.5 * Math.PI / 180
  return 1.5 * Math.PI / 180
}

// 이음부 굽힘각도 (횡방향)
export function calcJointAngle(Uh, Lj, L) {
  // 횡방향 상대변위 = Uh × (1 - cos(π×Lj/L)) ≈ Uh × (π×Lj/L)² / 2
  const theta = (Math.PI * Uh / L) * Math.sin(Math.PI * Lj / L)  // rad
  return theta
}

// ─── 허용 응력 (분절관) ──────────────────────────────────────
// 내진 시 허용응력 = 항복강도 / 안전율 × 허용증가계수
// 덕타일 주철관: σ_y = 300 MPa (최소), 내진 시 안전율 1.5 → 200 MPa
// 인장강도 기준: σ_u = 420 MPa, 내진 시 안전율 2.0 → 210 MPa
// 지배값: min(200, 210) = 200 MPa
export const ALLOW_STRESS_DI = {
  normal: 140,   // MPa (상시: σ_y/안전율 = 300/2.0)
  seismic: 200,  // MPa (내진: σ_y/1.5)
}

// ─── 전체 분절관 본평가 메인 함수 ───────────────────────────
/**
 * @param {object} params
 * @param {number} params.DN       - 관경 (mm)
 * @param {number} params.t        - 관두께 (mm)
 * @param {number} params.D        - 외경 (mm)
 * @param {string} params.grade    - 내진등급 'I' | 'II'
 * @param {string} params.zone     - 지진구역 'I' | 'II'
 * @param {string} params.soilType - 지반종류 'S1'~'S6'
 * @param {number} params.Z        - 지진구역계수
 * @param {number} params.I_seismic - 위험도계수
 * @param {number[]} params.Fa_table - [f1,f2,f3] (soilType별 Fa)
 * @param {number[]} params.Fv_table - [f1,f2,f3] (soilType별 Fv)
 * @param {object[]} params.layers  - [{H, Vs}] 표층지반 층
 * @param {number} params.Vbs       - 기반암 전단파속도 (m/s)
 * @param {number} params.P         - 설계수압 (MPa)
 * @param {number} params.Lj        - 이음부 간격=관 1본 길이 (m), 기본 6m
 * @param {number} params.h_cover   - 토피 (m)
 * @param {number} params.z_pipe    - 지표~관축 거리 (m)
 * @param {boolean} params.isSeismicJoint - 내진형 이음 여부
 * @param {number} params.nu        - 포아송비 (주철관 0.26)
 * @param {number} params.E         - 탄성계수 (MPa, 주철관 170,000)
 */
export function evalSegmented(params) {
  const {
    DN, t, D,
    Z, I_seismic,
    Fa_table, Fv_table,
    layers, Vbs,
    P,
    Lj = 6,
    h_cover, z_pipe,
    isSeismicJoint = false,
    nu = 0.26,
    E = 170000,
  } = params

  // ── Step 1: 설계지반가속도 ──
  const S = calcS(Z, I_seismic)

  // ── Step 2: 증폭계수 보간 ──
  const Fa = interpAmpFactor(Fa_table, S)
  const Fv = interpAmpFactor(Fv_table, S)
  const { SDS, SD1 } = calcDesignSpectrum(S, Fa, Fv)

  // ── Step 3: 표층지반 고유주기 및 비선형 파라미터 ──
  const TG = calcTG(layers)
  const Ts = calcTs(TG)
  const { Vds, vsi } = calcVds(layers, Ts)
  const H_total = layers.reduce((s, l) => s + l.H, 0)

  // ── Step 4: 속도응답스펙트럼 ──
  const { Sv, Sa, T0, TS: TS_sp } = calcSv(Ts, SDS, SD1)

  // ── Step 5: 지반수평변위 ──
  const Uh = calcGroundDisp(Sv, Ts, z_pipe, H_total)  // m

  // ── Step 6: 파장 계산 ──
  const { L, L1, L2, eps } = calcWavelength(Ts, Vds, Vbs)  // m

  // ── Step 7: 내압 축응력 ──
  const sigma_i = calcAxialStressInternal(nu, P, D, t)  // MPa

  // ── Step 8: 차량하중 축응력 ──
  const sigma_o = calcAxialStressTraffic()  // 0

  // ── Step 9: 지진 축응력 ──
  const { sigma_x, alphaL, alphaB, epsilonL } = calcAxialStressSeismic(E, Uh, L)

  // ── Step 10: 조합응력 ──
  const sigma_total = sigma_i + sigma_o + sigma_x
  const sigma_allow = ALLOW_STRESS_DI.seismic  // 200 MPa
  const stressOK = sigma_total <= sigma_allow

  // ── Step 11: 이음부 신축량 ──
  const { u_J } = calcJointDisp(Uh, Lj, L)          // m
  const u_allow = getAllowableJointDisp(DN, isSeismicJoint)  // m
  const dispOK = Math.abs(u_J) <= u_allow

  // ── Step 12: 이음부 굽힘각도 ──
  const theta_J = calcJointAngle(Uh, Lj, L)         // rad
  const theta_allow = getAllowableJointAngle(DN)     // rad
  const angleOK = theta_J <= theta_allow

  const overallOK = stressOK && dispOK && angleOK

  return {
    ok: overallOK,
    // 입력 정리
    S, Fa, Fv, SDS, SD1,
    // 지반
    TG, Ts, Vds, H_total, vsi,
    // 스펙트럼
    Sv, Sa, T0, TS_sp,
    // 변위/파장
    Uh, L, L1, L2, eps,
    // 응력
    sigma_i, sigma_o, sigma_x, sigma_total, sigma_allow, stressOK,
    alphaL, alphaB, epsilonL,
    // 이음부
    u_J: Math.abs(u_J), u_allow, dispOK,
    theta_J, theta_allow, angleOK,
  }
}
