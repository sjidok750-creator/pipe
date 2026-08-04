// ============================================================
// Zustand 전역 상태 관리
// ============================================================

import { create } from 'zustand'
import { calcSteelPipe, calcSteelPipeDual } from '../engine/steelPipe.js'
import { calcDuctileIron, calcDuctileIronDual } from '../engine/ductileIron.js'
import { E_PRIME, STEEL_GRADES } from '../engine/constants.js'

const DEFAULT_INPUTS = {
  // 검토 방식 — 'KWW2004'(2004 단독) | 'KDS2022'(AWWA 단독) | 'BOTH'(병기)
  // BOTH 선택 시 primaryCode 가 정식 판정 기준이 되고 다른 쪽은 참고값으로 표시된다.
  // ※ 기존 저장 프로젝트는 이 필드가 없으므로 KDS2022 단독으로 처리됨 (회귀 방지)
  reviewMode: 'KDS2022',
  primaryCode: 'KWW2004',   // BOTH 모드에서 정식 판정에 쓸 기준
  codeStandard: 'KDS2022',  // 실제 계산에 넘기는 기준 (reviewMode에서 파생)
  steelGradeLegacy: 'STWW400',   // KWW2004 모드 강종 (참고표-4.2.5)
  pipeType: 'steel',
  DN: 600,
  pnGrade: 'PN10',         // 강관 PN 등급 (사용자 선택)
  diKGrade: 'K9',          // 덕타일 주철관 K등급 (사용자 선택)
  steelGrade: 'SPS400',    // 강관 강종 (fy 결정)
  fyManual: 235,           // 직접입력 시 fy 값
  Pd: 0.60,
  surgeRatio: 1.5,
  H: 1.50,
  hasTraffic: true,
  trafficMethod: 'boussinesq', // 'boussinesq' | 'wm'
  wmPm: 100,                   // 후륜 1륜당 하중 (kN)
  wmC: 3.0,                    // 차량 점유 폭 (m)
  wmA: 0.2,                    // 접지 폭 (m)
  wmTheta: 45,                 // 하중분포각 (°)
  hasLining: true,
  soilClass: 'SC1',
  compaction: 85,
  Eprime: 2700,
  beddingType: 'Type2',
  steelBeddingType: 'deg90',
  gwLevel: 'below',
  gammaSoil: 18.0,
  eprimeManual: false,
  E_pipeManual: false,
  E_pipe: null,          // null이면 관종 기본값 사용
  pipeDimManual: false,
  DoManual: 610,
  tManual: 8,
}

function getAutoEprime(soilClass, compaction) {
  const table = E_PRIME[soilClass]
  if (!table) return 300
  if (table.default !== undefined) return table.default
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
  if (compaction <= keys[0]) return table[keys[0]]
  if (compaction >= keys[keys.length - 1]) return table[keys[keys.length - 1]]
  for (let i = 0; i < keys.length - 1; i++) {
    if (compaction >= keys[i] && compaction <= keys[i + 1]) {
      const r = (compaction - keys[i]) / (keys[i + 1] - keys[i])
      return Math.round(table[keys[i]] + r * (table[keys[i + 1]] - table[keys[i]]))
    }
  }
  return table[keys[keys.length - 1]]
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
  dual: null,
  calcError: null,
  history: loadHistory(),

  setInputs: (partial) => {
    set((state) => {
      const next = { ...state.inputs, ...partial }
      if (!next.eprimeManual) {
        next.Eprime = getAutoEprime(next.soilClass, next.compaction)
      }
      return { inputs: next, calcError: null }
    })
  },

  setEprimeManual: (manual) => {
    set((state) => ({
      inputs: {
        ...state.inputs,
        eprimeManual: manual,
        Eprime: manual
          ? state.inputs.Eprime
          : getAutoEprime(state.inputs.soilClass, state.inputs.compaction),
      },
    }))
  },

  setPipeDimManual: (manual) => {
    set((state) => ({
      inputs: { ...state.inputs, pipeDimManual: manual },
    }))
  },

  calcResult: () => {
    const { inputs } = get()
    try {
      // 검토 방식 → 실제 계산 기준 파생
      //   KWW2004 / KDS2022 : 해당 기준 단독
      //   BOTH               : 두 기준 모두 계산, primaryCode 가 정식 판정
      const mode = inputs.reviewMode ?? inputs.codeStandard ?? 'KDS2022'
      const primary = mode === 'BOTH' ? (inputs.primaryCode ?? 'KWW2004') : mode
      const calcInputs = { ...inputs, codeStandard: primary }

      let result
      let dual = null
      if (inputs.pipeType === 'steel') {
        result = calcSteelPipe(calcInputs)
        // 병기 모드에서만 두 기준 동시 계산 (강관 한정)
        if (mode === 'BOTH') {
          try { dual = calcSteelPipeDual({ ...calcInputs, primaryCode: primary }) } catch { dual = null }
        }
      } else {
        result = calcDuctileIron(calcInputs)
        // 주철관도 동일 구조 — 병행 모드에서 두 기준 동시 계산
        if (mode === 'BOTH') {
          try { dual = calcDuctileIronDual({ ...calcInputs, primaryCode: primary }) } catch { dual = null }
        }
      }
      set({ result, dual, reviewMode: mode, primaryCode: primary, calcError: null })
      return result
    } catch (e) {
      set({ result: null, dual: null, calcError: e.message })
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

  loadFromHistory: (id) => {
    const { history } = get()
    const entry = history.find((h) => h.id === id)
    if (entry) {
      // 이전 dual 결과가 남지 않도록 초기화 후, 병행 모드였으면 재계산
      let dual = null
      const em = entry.inputs?.reviewMode
      if (em === 'BOTH') {
        const pc = entry.inputs?.primaryCode ?? 'KWW2004'
        const ci = { ...entry.inputs, codeStandard: pc, primaryCode: pc }
        try {
          dual = entry.inputs.pipeType === 'steel'
            ? calcSteelPipeDual(ci) : calcDuctileIronDual(ci)
        } catch { dual = null }
      }
      set({ inputs: entry.inputs, result: entry.result, dual, calcError: null })
    }
  },

  deleteHistory: (id) => {
    const next = get().history.filter((h) => h.id !== id)
    saveHistory(next)
    set({ history: next })
  },

  resetInputs: () => {
    set({ inputs: { ...DEFAULT_INPUTS }, result: null, dual: null, calcError: null })
  },

  getAutoEprime,
}))
