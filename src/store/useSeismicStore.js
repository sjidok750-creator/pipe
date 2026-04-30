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
  calcKv,
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

// ── 상세평가 기본값 (부록C 예제값) ──────────────────────────
// 분절관: 부록C.1, 연속관: 부록C.2 기준
const DEFAULT_DETAIL = {
  pipeType: 'segmented',   // 'segmented' | 'continuous'
  zone: 'I',
  seismicGrade: 'I',
  soilType: 'S3',          // 부록C 예제: S3
  DN: 900,                 // 부록C.1: DN900
  thickness: 13.0,         // 부록C.1: t=13mm
  D_out: 916,              // 부록C.1: D=0.9m → 916mm (DN900 덕타일)
  P: 1.0,                  // 부록C: P=1MPa
  hCover: 1.5,             // 부록C: h=1.5m
  // 탄성계수 직접 입력
  E_manual: false,
  E_steel: 206000,
  E_ductile: 170000,
  // 차량하중 및 지반반력계수
  gammaSoil: 18,
  Pm: 100,                 // 부록C: Pm=100kN/輪
  Kv: 10000,               // 부록C.2 연속관: Kv=10000 kN/m³
  kvMethod: 'manual',
  // 분절관
  nu: 0.28,                // 부록C.1: ν=0.28
  Lj: 6,
  isSeismicJoint: false,
  hasSettle: false,
  // 연속관
  deltaT: 15,              // 부록C.2: ΔT=15°C
  D_settle: 0,
  L_settle: 0,
  h2_settle: 0,
  strainCriterion: 'buckling',
  // 지반층: 부록C 예제 (분절관·연속관 동일)
  // 층1: H=30m, Vs=89.4m/s / 층2: H=5m, Vs=172.9m/s
  layers: [
    { name: '표층',   H: 30, N: null, Vs_manual: 89.4,  isRock: false, Vs: 89.4 },
    { name: '중간층', H: 5,  N: null, Vs_manual: 172.9, isRock: false, Vs: 172.9 },
  ],
  Vbs: 500,
  heightMode: 'sum',
  H_bedrock: null,
  fillGapAsLastLayer: true,
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
    hasSettle, deltaT, D_settle, L_settle, h2_settle, strainCriterion, layers, Vbs,
    E_manual, E_steel, E_ductile,
    Pm, Kv, kvMethod, nu,
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

  // Kv 실효값 결정: kvMethod에 따라 자동 산정
  // InputPage에서 "적용" 버튼을 누르지 않아도 계산에 반영되도록 함
  const D_m_kv = D_out / 1000
  let Kv_eff = Kv ?? 0
  if (Pm > 0 && kvMethod !== 'manual') {
    const r = calcKv(layers, hCover, soilType, kvMethod, D_m_kv)
    if (r?.Kv > 0) Kv_eff = r.Kv
  }

  let result
  if (pipeType === 'segmented') {
    result = evalSegmented({
      DN, t: thickness, D: D_out,
      Z, I_seismic, Fa_table, Fv_table,
      layers, Vbs, P,
      gamma: inp.gammaSoil ?? 18,
      nu: nu ?? 0.26,
      l_joint: Lj, h_cover: hCover, z_pipe, isSeismicJoint,
      E: E_use,
      Pm: Pm ?? 0, Kv: Kv_eff,
      // 부등침하: L_settle은 연약지반 전체 구간 길이, l_settle = L/2
      delta_settle: hasSettle ? (D_settle ?? 0) : 0,
      l_settle:     hasSettle ? (L_settle ?? 0) / 2 : 0,
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
      deltaT, D_settle, L_settle, h2_settle: h2_settle ?? 0, strainCriterion,
      h_cover: hCover, z_pipe,
      E: E_use,
      Pm: Pm ?? 0, Kv: Kv_eff,
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
