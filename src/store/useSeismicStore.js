// ============================================================
// 내진성능 평가 전역 상태 (예비평가 + 상세평가)
// ============================================================
import { create } from 'zustand'
import { evalSegmented } from '../engine/seismicSegmented.js'
import { evalContinuous } from '../engine/seismicContinuous.js'
import {
  SEISMIC_ZONE, RISK_FACTOR, SEISMIC_GRADE,
  AMP_FACTOR, getSeismicityGroup, calcFLEX,
  KIND_INDEX, EARTH_INDEX, SIZE_INDEX,
  CONNECT_INDEX, FACIL_INDEX, MCONE_INDEX,
  getSizeIndex, calcSeismicGroup, deriveVs,
} from '../engine/seismicConstants.js'
import { interpAmpFactor } from '../engine/seismicSegmented.js'

// ── 예비평가 기본값 ──────────────────────────────────────────
const DEFAULT_PRELIM = {
  zone: 'I',
  seismicGrade: 'I',
  isUrban: true,
  soilType: 'S2',
  pipeKind: 'ductile',
  DN: 300,
  thickness: 8.0,
  connectCond: 'normal',
  facilExists: 'yes',
  mcone: 'bolted',
}

// ── 상세평가 기본값 ──────────────────────────────────────────
const DEFAULT_DETAIL = {
  pipeType: 'segmented',   // 'segmented' | 'continuous'
  zone: 'I',
  seismicGrade: 'I',
  soilType: 'S2',
  DN: 300,
  thickness: 8.0,
  D_out: 322,
  P: 0.5,
  hCover: 1.5,
  // 탄성계수 직접 입력
  E_manual: false,         // true: 직접입력, false: 관종 자동
  E_steel: 206000,         // MPa (강관 기본값)
  E_ductile: 170000,       // MPa (덕타일 주철관 기본값)
  // 차량하중 및 지반반력계수
  gammaSoil: 18,            // kN/m³ (흙 단위중량)
  Pm: 0,                   // kN/輪 (후륜 1륜 하중, 0=차량없음)
  Kv: 0,                   // kN/m³ (연직방향 지반반력계수, kvMode='manual'일 때 사용)
  kvMode: 'auto',           // 'auto': N치→E₀→Kv₀→Kv 자동산정 | 'manual': 직접입력
  // 분절관
  Lj: 6,
  isSeismicJoint: false,
  // 연속관
  deltaT: 20,
  D_settle: 0,
  L_settle: 0,
  strainCriterion: 'buckling',  // 'yield' (σ_y/E) | 'buckling' (46t/D, 실무기준)
  // 지반 층 (name, H, N, Vs_manual, isRock, Vs)
  // Vs = Vs_manual ?? (isRock ? 760 : 65.64*N^0.407)
  layers: [
    { name: '매립층',   H: 5,  N: null, Vs_manual: null, isRock: false, Vs: 150 },
    { name: '퇴적층',   H: 10, N: null, Vs_manual: null, isRock: false, Vs: 250 },
    { name: '풍화토층', H: 5,  N: null, Vs_manual: null, isRock: false, Vs: 350 },
  ],
  Vbs: 500,
  // 기반암 깊이 입력 모드
  heightMode: 'sum',        // 'sum': 층 두께 합산(기본) | 'explicit': 직접 입력
  H_bedrock: null,          // m, explicit 모드에서 사용자가 직접 입력하는 기반암 깊이
  fillGapAsLastLayer: true, // explicit 모드에서 층 합계 < H_bedrock 시 최하층 Vs로 공백 보정
}

// ── 예비평가 계산 ────────────────────────────────────────────
function calcPrelim(inp) {
  const { zone, seismicGrade, isUrban, soilType, pipeKind, DN, thickness, connectCond, facilExists, mcone } = inp
  const ratio = DN / thickness
  const FLEX = calcFLEX(ratio)
  const KIND = KIND_INDEX[pipeKind]?.score ?? 1.0
  const EARTH = EARTH_INDEX[soilType]?.score ?? 1.3
  const sizeKey = getSizeIndex(DN)
  const SIZE = SIZE_INDEX[sizeKey]?.score ?? 1.0
  const CONNECT = CONNECT_INDEX[connectCond]?.score ?? 0.8
  const FACIL = FACIL_INDEX[facilExists]?.score ?? 0.8
  const MCONE = MCONE_INDEX[mcone]?.score ?? 0.7
  const VI_sub = KIND + EARTH + SIZE + CONNECT + FACIL + MCONE
  const VI = FLEX * VI_sub
  const seismicityGroup = getSeismicityGroup(zone, isUrban, soilType)
  const seismicGroup = calcSeismicGroup(seismicityGroup, VI)
  const isCritical = seismicGroup === 'critical'

  const gradeInfo = SEISMIC_GRADE[seismicGrade]
  const Z = SEISMIC_ZONE[zone].Z
  const S_collapse = Z * gradeInfo.I_collapse
  const S_func = Z * gradeInfo.I_func

  return {
    ratio, FLEX, KIND, EARTH, SIZE, CONNECT, FACIL, MCONE,
    VI_sub, VI, seismicityGroup, isCritical,
    gradeInfo, Z, S_collapse, S_func,
  }
}

// ── 상세평가 계산 ────────────────────────────────────────────
function calcDetail(inp) {
  const {
    pipeType, zone, seismicGrade, soilType,
    DN, thickness, D_out, P, hCover, Lj, isSeismicJoint,
    deltaT, D_settle, L_settle, strainCriterion, layers, Vbs,
    E_manual, E_steel, E_ductile,
    Pm, Kv, kvMode,
    heightMode, H_bedrock, fillGapAsLastLayer,
  } = inp
  const Z = SEISMIC_ZONE[zone].Z
  const gradeInfo = SEISMIC_GRADE[seismicGrade]
  const I_seismic  = gradeInfo.I_collapse  // 붕괴방지 위험도계수
  const I_func     = gradeInfo.I_func      // 기능수행 위험도계수
  const ampEntry = AMP_FACTOR[soilType]
  const Fa_table = ampEntry?.Fa ?? [1.0, 1.0, 1.0]
  const Fv_table = ampEntry?.Fv ?? [1.0, 1.0, 1.0]
  const z_pipe = hCover + D_out / 1000 / 2

  // 탄성계수: 직접입력(E_manual=true) 시 사용자 입력값, 아니면 관종 기본값
  const E_default_seg  = 170000  // 덕타일 주철관 (MPa)
  const E_default_cont = 206000  // 강관 (MPa)
  const E_use = E_manual
    ? (pipeType === 'segmented' ? (E_ductile ?? E_default_seg) : (E_steel ?? E_default_cont))
    : (pipeType === 'segmented' ? E_default_seg : E_default_cont)
  // ※ E_use는 입력 모드에 따라 결정됨. 자동(auto) 모드면 기본값, 직접입력(manual)이면 E_steel/E_ductile 사용

  let result
  if (pipeType === 'segmented') {
    result = evalSegmented({
      DN, t: thickness, D: D_out,
      Z, I_seismic, Fa_table, Fv_table,
      layers, Vbs, P,
      l_joint: Lj, h_cover: hCover, z_pipe, isSeismicJoint,
      E: E_use,
      Pm: Pm ?? 0, Kv: Kv ?? 0,
      heightMode: heightMode ?? 'sum',
      H_bedrock: H_bedrock ?? null,
      fillGapAsLastLayer: fillGapAsLastLayer !== false,
    })
  } else {
    result = evalContinuous({
      DN, t: thickness, D_out,
      seismicGrade, Z, I_seismic, Fa_table, Fv_table,
      layers, Vbs, P,
      gamma: inp.gammaSoil ?? 18,
      deltaT, D_settle, L_settle, strainCriterion,
      h_cover: hCover, z_pipe,
      E: E_use,
      Pm: Pm ?? 0, Kv: Kv ?? 0, kvMode: kvMode ?? 'auto',
      heightMode: heightMode ?? 'sum',
      H_bedrock: H_bedrock ?? null,
      fillGapAsLastLayer: fillGapAsLastLayer !== false,
    })
  }
  // E_use, I_func를 결과에 포함 — ReportPage에서 기능수행 Sv 별도 계산에 사용
  return { ...result, E_use, Z, I_collapse: I_seismic, I_func }
}

// ── Store ────────────────────────────────────────────────────
export const useSeismicStore = create((set, get) => ({
  // 예비평가
  prelimInputs: { ...DEFAULT_PRELIM },
  prelimResult: null,

  // 상세평가
  detailInputs: { ...DEFAULT_DETAIL },
  detailResult: null,

  // 예비평가 입력 변경
  setPrelimInputs: (partial) => {
    set(state => ({ prelimInputs: { ...state.prelimInputs, ...partial }, prelimResult: null }))
  },

  // 예비평가 계산
  calcPrelim: () => {
    try {
      const result = calcPrelim(get().prelimInputs)
      set({ prelimResult: result })
      return result
    } catch (e) {
      console.error('예비평가 계산 오류:', e)
      return null
    }
  },

  // 상세평가 입력 변경
  setDetailInputs: (partial) => {
    set(state => ({ detailInputs: { ...state.detailInputs, ...partial }, detailResult: null }))
  },

  // 지반 층 업데이트 (Vs 자동 도출 포함)
  setDetailLayers: (layers) => {
    const derived = layers.map(l => ({ ...l, Vs: deriveVs(l) }))
    set(state => ({ detailInputs: { ...state.detailInputs, layers: derived }, detailResult: null }))
  },

  // 상세평가 계산
  calcDetail: () => {
    try {
      const result = calcDetail(get().detailInputs)
      set({ detailResult: result })
      return result
    } catch (e) {
      console.error('상세평가 계산 오류:', e)
      return null
    }
  },

  resetPrelim: () => set({ prelimInputs: { ...DEFAULT_PRELIM }, prelimResult: null }),
  resetDetail: () => set({ detailInputs: { ...DEFAULT_DETAIL }, detailResult: null }),
}))
