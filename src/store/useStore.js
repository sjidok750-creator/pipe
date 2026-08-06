// ============================================================
// Zustand 전역 상태 관리
// ============================================================

import { create } from 'zustand'
import { calcSteelPipe } from '../engine/steelPipe.js'
import { calcDuctileIron } from '../engine/ductileIron.js'
import { STEEL_GRADES, EPRIME_KGFCM2, EARTH_LOAD } from '../engine/constants.js'

// ============================================================
// 근거: 세부지침(안전점검·진단 편) 제11장 상수도 11.5.2 — 단일 경로
// ※ SET_A/SET_B 이원 구조(reviewMode·primaryCode·codeStandard)는 제거되었다.
//   'KDS2022' 경로는 실제로 AWWA M11/ASCE 계열이며 국내 근거가 없다.
// ============================================================
const DEFAULT_INPUTS = {
  pipeType: 'steel',
  DN: 600,
  pnGrade: 'PN10',         // 강관 PN 등급 (사용자 선택)
  diKGrade: 'K9',          // 덕타일 주철관 K등급 (사용자 선택)
  steelGrade: 'SPS400',    // 강관 강종 (fy 결정)
  fyManual: 235,           // 직접입력 시 fy 값
  Pd: 0.60,
  H: 1.50,
  hasTraffic: true,
  // 흙 반력계수 E′ — 세부지침 11-135 제시값 28 kg/cm² 단일
  Eprime_kgfcm2: EPRIME_KGFCM2,
  eprimeManual: false,
  // 흙의 단위중량 γt — 세부지침 11-134 제시값 1.8×10⁻³ kg/cm³
  gammaSoil_kgfcm3: EARTH_LOAD.gamma_t,
  steelBeddingType: 'deg90',   // 강관 지지각 (60/90/120/150°)
  diBeddingType: 'deg90',      // 주철관 지지각 (40/60/90/120/180°)
  gwLevel: 'below',            // = 지침 제시값 Rw 1.0
  // 관 상세검사 실측 최소 관두께 (mm) — 미입력 시 기준 두께 사용 (11-134)
  tMeasured: null,
  // 자연유하 구간 / 가압구간 (11-136)
  pressureZone: 'gravity',     // 'gravity' | 'pumped'
  Psurge: null,                // MPa — 가압구간 수격압
  // 주부재 손상(단면손실) 유무 — 등급 a/b 구분 (11-133 표 11.74)
  hasSectionLoss: false,
  pipeDimManual: false,
  DoManual: 610,
  tManual: 8,
}

/**
 * 구 버전 저장 입력값 → 세부지침 단일 경로 입력값 이관
 * 폐지 필드: reviewMode / primaryCode / codeStandard / steelGradeLegacy
 *            soilClass / compaction / hasLining / beddingType / trafficMethod / wm*
 * 단위 변경: Eprime(kPa) → Eprime_kgfcm2,  gammaSoil(kN/m³) → gammaSoil_kgfcm3
 */
function migrateInputs(saved) {
  if (!saved) return { ...DEFAULT_INPUTS }
  const {
    reviewMode, primaryCode, codeStandard, steelGradeLegacy,
    soilClass, compaction, hasLining, beddingType,
    trafficMethod, wmPm, wmC, wmA, wmTheta,
    surgeRatio, E_pipeManual, E_pipe,
    Eprime, gammaSoil,
    ...rest
  } = saved
  const out = { ...DEFAULT_INPUTS, ...rest }
  // 구 지지각은 지침 표에 없으므로 엔진이 보정한다(강관 deg60 / 주철관 deg40).
  // 폐지 키를 그대로 넘겨 beddingCoerced 경고가 화면에 뜨도록 한다 —
  // 조용히 기본값으로 떨어뜨리면 지지조건이 개선된 것처럼 계산될 수 있다.
  if (beddingType) out.diBeddingType = beddingType
  if (Eprime != null && saved.eprimeManual) {
    // kPa → kg/cm²  (1 kPa = 0.0101972 kg/cm²)
    out.Eprime_kgfcm2 = Eprime * 0.0101972
  }
  if (gammaSoil != null) {
    // kN/m³ → kg/cm³ : 18.0 kN/m³ ↔ 1.8×10⁻³ kg/cm³ (지침 원단위 등가 취급)
    out.gammaSoil_kgfcm3 = gammaSoil / 10 * 0.001
  }
  return out
}

const loadHistory = () => {
  try {
    const raw = localStorage.getItem('pipecheck_history')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const saveHistory = (history) => {
  try {
    localStorage.setItem('pipecheck_history', JSON.stringify(history.slice(0, 20)))
  } catch { /* ignore */ }
}

export const useStore = create((set, get) => ({
  inputs: { ...DEFAULT_INPUTS },
  result: null,
  calcError: null,
  history: loadHistory(),

  setInputs: (partial) => {
    set((state) => ({ inputs: { ...state.inputs, ...partial }, calcError: null }))
  },

  // E′ 수동 입력 해제 시 지침 제시값(28 kg/cm²)으로 복귀
  setEprimeManual: (manual) => {
    set((state) => ({
      inputs: {
        ...state.inputs,
        eprimeManual: manual,
        Eprime_kgfcm2: manual ? state.inputs.Eprime_kgfcm2 : EPRIME_KGFCM2,
      },
    }))
  },

  setPipeDimManual: (manual) => {
    set((state) => ({
      inputs: { ...state.inputs, pipeDimManual: manual },
    }))
  },

  // 세부지침 단일 경로 — 기준 분기 없음
  calcResult: () => {
    const { inputs } = get()
    try {
      const result = inputs.pipeType === 'steel'
        ? calcSteelPipe(inputs)
        : calcDuctileIron(inputs)
      set({ result, calcError: null })
      return result
    } catch (e) {
      set({ result: null, calcError: e.message })
      return null
    }
  },

  saveToHistory: () => {
    const { inputs, result, history } = get()
    if (!result) return
    const entry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('ko-KR'),
      pipeType: inputs.pipeType,
      DN: inputs.DN,
      H: inputs.H,
      Pd: inputs.Pd,
      grade: inputs.pipeType === 'steel' ? inputs.pnGrade : inputs.diKGrade,
      overallOK: result.verdict.overallOK,
      inputs: { ...inputs },
      result,
    }
    const next = [entry, ...history].slice(0, 20)
    saveHistory(next)
    set({ history: next })
  },

  // 저장 이력 불러오기
  // ※ 구 버전(SET_A/SET_B 이원 구조) 저장본은 입력 필드 구성이 다르고
  //   저장된 result 는 폐지된 계산 경로의 산출물이므로 그대로 표시하지 않는다.
  //   입력값만 이관해 세부지침 경로로 재계산한다.
  loadFromHistory: (id) => {
    const { history } = get()
    const entry = history.find((h) => h.id === id)
    if (!entry) return
    const inputs = migrateInputs(entry.inputs)
    set({ inputs, result: null, calcError: null })
    get().calcResult()
  },

  deleteHistory: (id) => {
    const next = get().history.filter((h) => h.id !== id)
    saveHistory(next)
    set({ history: next })
  },

  resetInputs: () => {
    set({ inputs: { ...DEFAULT_INPUTS }, result: null, calcError: null })
  },

}))
