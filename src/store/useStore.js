// ============================================================
// Zustand 전역 상태 관리
// ============================================================

import { create } from 'zustand'
import { calcSteelPipe } from '../engine/steelPipe.js'
import { calcDuctileIron } from '../engine/ductileIron.js'
import { E_PRIME } from '../engine/constants.js'

const DEFAULT_INPUTS = {
  pipeType: 'steel',
  DN: 600,
  Pd: 0.60,
  surgeRatio: 1.5,
  H: 1.50,
  hasTraffic: true,
  hasLining: true,
  soilClass: 'SC1',
  compaction: 85,
  Eprime: 2700,      // 자동계산 or 수동입력
  beddingType: 'Type2',
  gwLevel: 'below',
  gammaSoil: 18.0,
  eprimeManual: false,  // true: 수동입력, false: 자동계산
}

function getAutoEprime(soilClass, compaction) {
  const table = E_PRIME[soilClass]
  if (!table) return 300
  if (table.default !== undefined) return table.default
  // 가장 가까운 다짐도 선택
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
  if (compaction <= keys[0]) return table[keys[0]]
  if (compaction >= keys[keys.length - 1]) return table[keys[keys.length - 1]]
  // 보간
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
  // ── 입력값
  inputs: { ...DEFAULT_INPUTS },

  // ── 계산 결과
  result: null,

  // ── 에러
  calcError: null,

  // ── 이력
  history: loadHistory(),

  // ── 액션: 입력값 부분 업데이트
  setInputs: (partial) => {
    set((state) => {
      const next = { ...state.inputs, ...partial }

      // soilClass / compaction 변경 시 E' 자동 갱신
      if (!next.eprimeManual) {
        next.Eprime = getAutoEprime(next.soilClass, next.compaction)
      }

      return { inputs: next, calcError: null }
    })
  },

  // ── E' 수동 입력 토글
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

  // ── 계산 실행
  calcResult: () => {
    const { inputs } = get()
    try {
      let result
      if (inputs.pipeType === 'steel') {
        result = calcSteelPipe(inputs)
      } else {
        result = calcDuctileIron(inputs)
      }
      set({ result, calcError: null })
      return result
    } catch (e) {
      set({ result: null, calcError: e.message })
      return null
    }
  },

  // ── 이력 저장
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
      overallOK: result.verdict.overallOK,
      inputs: { ...inputs },
      result,
    }
    const next = [entry, ...history].slice(0, 20)
    saveHistory(next)
    set({ history: next })
  },

  // ── 이력에서 불러오기
  loadFromHistory: (id) => {
    const { history } = get()
    const entry = history.find((h) => h.id === id)
    if (entry) {
      set({ inputs: entry.inputs, result: entry.result, calcError: null })
    }
  },

  // ── 이력 삭제
  deleteHistory: (id) => {
    const next = get().history.filter((h) => h.id !== id)
    saveHistory(next)
    set({ history: next })
  },

  // ── 초기화
  resetInputs: () => {
    set({ inputs: { ...DEFAULT_INPUTS }, result: null, calcError: null })
  },

  // ── E' 자동계산 유틸 (외부 접근용)
  getAutoEprime,
}))
