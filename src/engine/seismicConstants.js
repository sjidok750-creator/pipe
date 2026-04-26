// ============================================================
// 내진성능 평가 기준 상수
// 근거: KDS 57 17 00 / KDS 17 10 00 / 기존시설물(상수도) 내진성능 평가요령
// ============================================================

// 지진구역계수 Z (평균재현주기 500년, KDS 17 10 00)
export const SEISMIC_ZONE = {
  I:  { Z: 0.11, label: '지진구역 Ⅰ (서울, 인천, 대전, 부산, 대구, 울산, 광주, 세종, 경기, 강원남부, 충북, 충남, 경북, 경남, 전북, 전남)' },
  II: { Z: 0.07, label: '지진구역 Ⅱ (강원북부, 제주)' },
}

// 위험도계수 I (평균재현주기별)
export const RISK_FACTOR = {
  50:   0.40,
  100:  0.57,
  200:  0.73,
  500:  1.00,
  1000: 1.40,
  2400: 2.00,
}

// 내진등급 (KDS 57 17 00)
// 등급Ⅰ: 붕괴방지 재현주기 1000년, 등급Ⅱ: 500년
export const SEISMIC_GRADE = {
  I:  { label: '내진Ⅰ등급', returnPeriod_collapse: 1000, I_collapse: 1.40, returnPeriod_func: 100, I_func: 0.57 },
  II: { label: '내진Ⅱ등급', returnPeriod_collapse: 500,  I_collapse: 1.00, returnPeriod_func:  50, I_func: 0.40 },
}

// 지반 종류 (KDS 17 10 00)
export const SOIL_TYPE = {
  S1: { label: 'S1 — 암반지반 (기반암 깊이 < 1m)',                       H_max: 1,   Vs_min: null, S_a: 1.0, S_v: 1.0 },
  S2: { label: 'S2 — 얕고 단단한 지반 (1~20m, Vs ≥ 260m/s)',           H_max: 20,  Vs_min: 260,  S_a: null, S_v: null },
  S3: { label: 'S3 — 얕고 연약한 지반 (1~20m, Vs < 260m/s)',            H_max: 20,  Vs_min: 0,    S_a: null, S_v: null },
  S4: { label: 'S4 — 깊고 단단한 지반 (> 20m, Vs ≥ 180m/s)',           H_max: 999, Vs_min: 180,  S_a: null, S_v: null },
  S5: { label: 'S5 — 깊고 연약한 지반 (> 20m, Vs < 180m/s)',            H_max: 999, Vs_min: 0,    S_a: null, S_v: null },
  S6: { label: 'S6 — 부지 고유 특성평가 필요 지반',                      H_max: 999, Vs_min: 0,    S_a: null, S_v: null },
}

// 지반증폭계수 Fa, Fv (KDS 17 10 00 해설표 2.1.10)
// 지반종류별, S(유효수평지반가속도)에 따른 증폭계수
// [S≤0.1, S=0.2, S=0.3]
export const AMP_FACTOR = {
  S2: { Fa: [1.4, 1.4, 1.3], Fv: [1.5, 1.4, 1.3] },
  S3: { Fa: [1.7, 1.5, 1.3], Fv: [1.7, 1.6, 1.5] },
  S4: { Fa: [1.6, 1.4, 1.2], Fv: [2.2, 2.0, 1.8] },
  S5: { Fa: [1.8, 1.3, 1.3], Fv: [3.0, 2.7, 2.4] },
}

// 지진도 등급 결정 기준 (해설표 3.4.1)
// 지진구역 × 도시권역 × 지반종류 → 1그룹 or 2그룹
// 1그룹: 중점고려지역, 2그룹: 관찰대상지역
export function getSeismicityGroup(zone, isUrban, soilType) {
  // 지반 연약도: S5,S6 = 연약지반급
  const softSoils = ['S5', 'S6']
  const hardSoils = ['S1', 'S2', 'S4']
  // medSoils: S3
  if (zone === 'I') {
    if (isUrban) return 1
    // 기타지역
    if (softSoils.includes(soilType)) return 1
    return 1  // 지진구역I는 대부분 1그룹
  } else {
    // 지진구역II
    if (isUrban && softSoils.includes(soilType)) return 1
    if (isUrban) return 2
    return 2  // 지진구역II 기타지역
  }
}

// ── 매설관로 취약도지수 기준 ──────────────────────────────

// 유연도지수 FLEX (D/t 비율) → 계산값으로 결정
export function calcFLEX(ratio) {
  if (ratio < 5)  return 10.0
  if (ratio < 20) return 8.0
  return 6.0
}

// 관종 지수 KIND
export const KIND_INDEX = {
  steel:    { score: 1.0, label: '강관 및 주철관' },
  ductile:  { score: 1.0, label: '강관 및 주철관' },
  concrete: { score: 0.8, label: '콘크리트관 / 시멘트관' },
  pvc:      { score: 0.5, label: '경질 염화비닐관' },
}

// 지반상태 지수 EARTH
export const EARTH_INDEX = {
  S5: { score: 2.0, label: '연약지반 및 지층변화 심한 지반 (S5,S6)' },
  S6: { score: 2.0, label: '연약지반 및 지층변화 심한 지반 (S5,S6)' },
  S3: { score: 1.5, label: '연약한 지반 (S3,S4)' },
  S4: { score: 1.5, label: '연약한 지반 (S3,S4)' },
  S2: { score: 1.3, label: '단단한 지반 (S2,S4 단단)' },
  S1: { score: 1.0, label: '강성 지반 (S1)' },
}

// 관경 지수 SIZE
export const SIZE_INDEX = {
  small:  { score: 1.0, label: '소형 (DN < 500mm)' },
  medium: { score: 0.8, label: '중형 (500 ≤ DN ≤ 1500mm)' },
  large:  { score: 0.5, label: '대형 (DN > 1500mm)' },
}

export function getSizeIndex(DN) {
  if (DN < 500)        return 'small'
  if (DN <= 1500)      return 'medium'
  return 'large'
}

// 이음부 상태 지수 CONNECT
export const CONNECT_INDEX = {
  poor:   { score: 1.0, label: '불량' },
  normal: { score: 0.8, label: '보통' },
  good:   { score: 0.5, label: '양호' },
}

// 주요시설물 존재 여부 지수 FACIL
export const FACIL_INDEX = {
  yes: { score: 1.0, label: '있음 (밸브 등 주요 시설물 존재)' },
  no:  { score: 0.8, label: '없음' },
}

// 이음부 처리방법 지수 MCONE
export const MCONE_INDEX = {
  rigid:  { score: 1.0, label: '강결 (Rigid Joint)' },
  bolted: { score: 0.7, label: '볼팅 (Bolted Joint)' },
}

// 내진그룹 결정 — 매설관로 (해설그림 3.4.1)
// 1그룹 && VI > 40 → 중요, 그외 → 유보
export function calcSeismicGroup(seismicityGroup, VI) {
  if (seismicityGroup === 1 && VI >= 40) return 'critical'   // 내진성능 중요상수도
  return 'deferred'                                           // 내진성능 유보상수도
}

// ── N치 → Vs 변환 (Sun et al. 2013) ──────────────────────────
// 엑셀 공식: Vs = 65.64 × N^0.407 (m/s), 암반층은 760 m/s 고정
export const ROCK_LAYER_NAMES = ['연암층', '경암층', '보통암층', '기반암층', '풍화암층']

export function calcVsFromN(N) {
  if (!N || N <= 0) return null
  return Math.round(65.64 * Math.pow(N, 0.407) * 100) / 100
}

// 레이어 Vs 도출: Vs_manual 우선 → 암반 760 → N치 공식
export function deriveVs(layer) {
  if (layer.Vs_manual != null && layer.Vs_manual > 0) return layer.Vs_manual
  if (layer.isRock || ROCK_LAYER_NAMES.includes(layer.name)) return 760
  const fromN = calcVsFromN(layer.N)
  return fromN ?? layer.Vs ?? 200
}

// ── 본평가 공통 지반 파라미터 ──────────────────────────────

// 표층지반 특성치 TG 계산
// layers: [{H: 두께(m), Vs: 현장 전단파속도(m/s)}]
export function calcTG(layers) {
  return 4 * layers.reduce((sum, l) => sum + l.H / l.Vs, 0)
}

// 비선형성 고려 Ts (KDS 17 10 00)
export function calcTs(TG) {
  return 1.25 * TG  // 보수적 적용 (Ts = 1.25 TG)
}

// 비선형 고려 표층지반 평균 전단파속도 Vds (m/s)
// layers: [{H, Vs}]
// 지침 해설표 5.3.1: 비선형 보정계수 C = 0.8 (Vs < 360 m/s), C = 1.0 (Vs ≥ 360 m/s)
export function calcVds(layers, Ts) {
  const totalH = layers.reduce((sum, l) => sum + l.H, 0)
  const vsi = layers.map(l => {
    const C = l.Vs < 360 ? 0.8 : 1.0  // 해설표 5.3.1 비선형 보정계수
    return C * l.Vs
  })
  // 비선형 고려 평균 Vds = totalH / Σ(Hi/Vsi_nl)
  const Vds = totalH / layers.reduce((sum, l, i) => sum + l.H / vsi[i], 0)
  return { Vds, vsi }
}

// 파장 L 계산 (기반암 전단파속도 Vbs, Ts, Vds)
export function calcWavelength(Ts, Vds, Vbs) {
  const eps = Vbs >= 300 ? 1.0 : 0.85  // 보정계수 (VBS≥300m/s → 1.0)
  const L1 = Vds * Ts
  const L2 = Vbs * Ts
  const L = eps * (2 * L1 * L2) / (L1 + L2)
  return { L, L1, L2, eps }
}

// 관축위치 지반수평변위 Uh
// 해설식(5.3.5): Uh = (2/π²) × Sv × Ts × cos(πz/(2H))
// Sv: 속도응답스펙트럼(m/s), Ts: 표층 설계고유주기, z: 지표~관축 거리(m), H_total: 표층 두께(m)
export function calcGroundDisp(Sv, Ts, z, H_total) {
  const Uh = (2 / Math.PI ** 2) * Sv * Ts * Math.cos(Math.PI * z / (2 * H_total))
  return Uh
}

// ── 기반암 깊이 해석 ───────────────────────────────────────
// heightMode='sum'      : H_effective = Σ layer.H  (현행 동작, 기본값)
// heightMode='explicit' : H_effective = H_bedrock  (직접 입력)
// 반환: { H_effective, H_sum, gap, warnings[] }
export function resolveHEffective({ layers, heightMode = 'sum', H_bedrock = null }) {
  const H_sum = layers.reduce((s, l) => s + l.H, 0)
  const warnings = []

  if (heightMode === 'explicit' && H_bedrock != null && H_bedrock > 0) {
    if (H_sum > H_bedrock + 0.1) {
      warnings.push(
        `지반층 합계 ${H_sum.toFixed(1)} m > 기반암 깊이 ${H_bedrock.toFixed(1)} m — ` +
        `기반암층이 지반층에 포함된 것으로 보입니다. 지반층에서 제외하세요.`
      )
    }
    return { H_effective: H_bedrock, H_sum, gap: H_bedrock - H_sum, warnings }
  }

  return { H_effective: H_sum, H_sum, gap: 0, warnings }
}

// explicit 모드에서 층 합계 < H_bedrock 일 때, 최하층 Vs로 공백층을 보정하여
// TG / Vds 계산에 사용할 레이어 배열 반환 (원본 layers는 불변)
export function resolveLayersForTGVds({ layers, H_effective, fillGap = true }) {
  if (!fillGap || layers.length === 0) return layers
  const H_sum = layers.reduce((s, l) => s + l.H, 0)
  const gap = H_effective - H_sum
  if (gap > 0.1) {
    const last = layers[layers.length - 1]
    return [...layers, { ...last, H: gap }]
  }
  return layers
}

// 지반 강성계수
// 해설식(5.3.19): K1 = 1.5 × γ/g × Vds²  (축방향)
// 해설식(5.3.20): K2 = 3.0 × γ/g × Vds²  (축직교방향)
export function calcGroundStiffness(gamma_kNm3, Vds, g = 9.81) {
  const K1 = 1.5 * (gamma_kNm3 * Vds ** 2) / g  // 축방향
  const K2 = 3.0 * (gamma_kNm3 * Vds ** 2) / g  // 축직교방향
  return { K1, K2 }
}

// ── 충격계수 (이음새 신축량/변형률 계산 공통) ──────────────
// 해설표 5.3.4
export function getImpactFactor(h) {
  if (h < 1.5) return 0.5
  if (h <= 6.5) return 0.65 - 0.1 * h
  return 0.0
}

// ── 차량하중 Wm 산정 (분절관/연속관 공통) ───────────────────
// 해설식(5.3.3): Wm = 2×Pm×a / ((a+2h×tanθ)×(b+2h×tanθ)) × (1+i)
// Pm: 후륜 1륜당 하중(kN), b: 차량점유폭(m), a: 접지폭(m)
// h: 토피(m), θ: 하중분포각(기본 35°), i: 충격계수
export function calcWm(Pm, b_width, a_contact, h, theta_deg = 35) {
  const theta = theta_deg * Math.PI / 180
  const i = getImpactFactor(h)
  const Wm = (2 * Pm * a_contact)
    / ((a_contact + 2 * h * Math.tan(theta)) * (b_width + 2 * h * Math.tan(theta)))
    * (1 + i)
  return { Wm, i }
}

// ── 지반변형률 ε_G (연속관/분절관 공통) ─────────────────────
// 해설식(5.3.46): ε_G = π × Uh / L
export function calcGroundStrain(Uh, L) {
  return Math.PI * Uh / L
}

// ── λ1, λ2 산정 (연속관/분절관 공통) ────────────────────────
// 해설식(5.3.19): λ1 = √(K1 / (E×A))
// 해설식(5.3.20) / (5.3.50): λ2 = ⁴√(K2 / (E×I))
// K1, K2 [kN/m²], E [kN/m²], A [m²], I [m⁴]
export function calcLambda(K1, K2, E_kN, A, I) {
  const lambda1 = Math.sqrt(K1 / (E_kN * A))
  const lambda2 = Math.pow(K2 / (E_kN * I), 0.25)
  return { lambda1, lambda2 }
}

// ── 보정계수 α1, α2 ──────────────────────────────────────────
// 해설식(5.3.17)/(5.3.47): α1 = 1 / (1 + (2π/(λ1×L'))²)
// 해설식(5.3.18)/(5.3.48): α2 = 1 / (1 + (2π/(λ2×L))⁴)
// 분절관: L' = 2L   (해설식 5.3.21)
// 연속관: L' = √2·L (해설식 5.3.51)
export function calcAlpha(lambda1, lambda2, L, pipeType = 'segmented') {
  const Lprime = pipeType === 'continuous'
    ? Math.SQRT2 * L   // 해설식 5.3.51: L' = √2·L (연속관)
    : 2 * L             // 해설식 5.3.21: L' = 2L   (분절관)
  const alpha1 = 1 / (1 + Math.pow(2 * Math.PI / (lambda1 * Lprime), 2))
  const alpha2 = 1 / (1 + Math.pow(2 * Math.PI / (lambda2 * L), 4))
  return { alpha1, alpha2, Lprime }
}

// ── 연직방향 지반반력계수 Kv 자동산정 ────────────────────────
// 관 매설 깊이(토피 hCover)에 해당하는 지층의 전단파속도 Vs로부터 산정.
// 산정식: Kv ≈ 0.09 × Vs²  [kN/m³]
//   - 동적 전단탄성계수 G_dyn = ρ×Vs² (ρ≈1.8 t/m³)
//   - 정적 변형계수 E_s ≈ G_dyn/10 (동/정 비 보정 ~10)
//   - Winkler 지반반력계수 Kv ≈ E_s / (D×0.5) → 단순화 → 0.09×Vs²
// 이 식을 지반종류별 표준 Vs 대입 시 기존 참고표 (500~25,000 kN/m³)와 일치.
//
// 우선순위: ① 관 매설층 Vs_manual → ② 암반층(760m/s) → ③ N치→Vs 변환
//          → ④ 기존 Vs → ⑤ 지반종류 표 fallback
//
// @param {Array}  layers   - 지반층 배열 [{name,H,N,Vs_manual,isRock,Vs}]
// @param {number} hCover   - 토피 (관 상단~지표, m)
// @param {string} soilType - 지반종류 (S1~S6), fallback용
// @returns {{ Kv: number|null, Vs: number|null, method: string, layerName: string|null }}
// forceMethod: 'auto' (N우선→Vs→표) | 'N' (N치→Vs 변환만) | 'Vs' (직접 Vs만)
export function calcKv(layers, hCover, soilType, forceMethod = 'auto') {
  // 관 상단이 포함되는 층 탐색
  let depth = 0
  let target = null
  for (const l of layers) {
    depth += l.H
    if (depth >= hCover) { target = l; break }
  }
  if (!target && layers.length > 0) target = layers[layers.length - 1]

  const isRockLayer = t => t && (t.isRock || ROCK_LAYER_NAMES.includes(t.name))
  const toKv = vs => Math.max(100, Math.round(0.09 * vs * vs / 100) * 100)

  // ── N치 기반 (N→Vs 공식 경유) ──────────────────────────────
  if (forceMethod === 'N' || forceMethod === 'auto') {
    const N = target?.N
    if (N && N > 0) {
      const Vs = calcVsFromN(N)
      if (Vs) return { Kv: toKv(Vs), Vs, N, method: 'N', layerName: target.name }
    }
    if (forceMethod === 'N') return { Kv: null, Vs: null, N: null, method: 'N', layerName: target?.name ?? null, error: 'N값 없음' }
  }

  // ── Vs 직접 기반 ───────────────────────────────────────────
  if (forceMethod === 'Vs' || forceMethod === 'auto') {
    let Vs = null
    if (target?.Vs_manual > 0) Vs = target.Vs_manual
    else if (isRockLayer(target)) Vs = 760
    else Vs = (target?.Vs > 0 ? target.Vs : null)
    if (Vs) return { Kv: toKv(Vs), Vs, N: target?.N ?? null, method: 'Vs', layerName: target?.name ?? null }
    if (forceMethod === 'Vs') return { Kv: null, Vs: null, N: null, method: 'Vs', layerName: target?.name ?? null, error: 'Vs 없음' }
  }

  // ── fallback: 지반종류 표 ────────────────────────────────
  const KV_SOIL = { S1: 200000, S2: 100000, S3: 20000, S4: 6000, S5: 1500, S6: null }
  return { Kv: KV_SOIL[soilType] ?? null, Vs: null, N: null, method: 'soilClass', layerName: null }
}
