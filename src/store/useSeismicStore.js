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
  getSizeIndex, calcSeismicGroup,
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
  // 분절관
  Lj: 6,
  isSeismicJoint: false,
  // 연속관
  deltaT: 20,
  D_settle: 0,
  L_settle: 0,
  strainCriterion: 'yield',  // 'yield' (σ_y/E) | 'buckling' (46t/D)
  // 지반 층
  layers: [
    { H: 5, Vs: 150 },
    { H: 10, Vs: 250 },
    { H: 5, Vs: 350 },
  ],
  Vbs: 500,
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
  } = inp
  const Z = SEISMIC_ZONE[zone].Z
  const I_seismic = RISK_FACTOR[seismicGrade === 'I' ? 1000 : 500]
  const ampEntry = AMP_FACTOR[soilType]
  const Fa_table = ampEntry?.Fa ?? [1.0, 1.0, 1.0]
  const Fv_table = ampEntry?.Fv ?? [1.0, 1.0, 1.0]
  const z_pipe = hCover + D_out / 1000 / 2

  if (pipeType === 'segmented') {
    return evalSegmented({
      DN, t: thickness, D: D_out,
      Z, I_seismic, Fa_table, Fv_table,
      layers, Vbs, P,
      Lj, h_cover: hCover, z_pipe, isSeismicJoint,
    })
  } else {
    return evalContinuous({
      DN, t: thickness, D_out,
      seismicGrade, Z, I_seismic, Fa_table, Fv_table,
      layers, Vbs, P,
      deltaT, D_settle, L_settle, strainCriterion,
      h_cover: hCover, z_pipe,
    })
  }
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

  // 지반 층 업데이트
  setDetailLayers: (layers) => {
    set(state => ({ detailInputs: { ...state.detailInputs, layers }, detailResult: null }))
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
