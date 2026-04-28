// ============================================================
// Zustand 전역 상태 관리
// ============================================================

import { create } from 'zustand'
import { calcSteelPipe } from '../engine/steelPipe.js'
import { calcDuctileIron } from '../engine/ductileIron.js'
import { calcSteelPipeLegacy } from '../engine/steelPipe_legacy.js'
import { calcDuctileIronLegacy } from '../engine/ductileIron_legacy.js'
import { E_PRIME, STEEL_GRADES } from '../engine/constants.js'

const DEFAULT_INPUTS = {
  designStandard: '2025', // '2025' | '2004'
  excavationWidth: null,  // 2004 전용: 굴착폭 B (m), null이면 Do+0.6m 자동
  shapeFactor: 1.5,       // 2004 전용: 형상계수 f (Spangler 링휨식)
  deflectionLag: 1.5,     // 2004 전용: 처짐 지연계수 DL (1.0~1.5)
  legacyTrafficLoad: 0,   // 2004 전용: 노면하중 등분포 환산값 Wt (kN/m)
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
      let result
      if (inputs.designStandard === '2004') {
        if (inputs.pipeType === 'steel') {
          result = calcSteelPipeLegacy(inputs)
        } else {
          result = calcDuctileIronLegacy(inputs)
        }
      } else {
        if (inputs.pipeType === 'steel') {
          result = calcSteelPipe(inputs)
        } else {
          result = calcDuctileIron(inputs)
        }
      }
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

  loadFromHistory: (id) => {
    const { history } = get()
    const entry = history.find((h) => h.id === id)
    if (entry) {
      set({ inputs: entry.inputs, result: entry.result, calcError: null })
    }
  },

  deleteHistory: (id) => {
    const next = get().history.filter((h) => h.id !== id)
    saveHistory(next)
    set({ history: next })
  },

  resetInputs: () => {
    set({ inputs: { ...DEFAULT_INPUTS }, result: null, calcError: null })
  },

  getAutoEprime,
}))
