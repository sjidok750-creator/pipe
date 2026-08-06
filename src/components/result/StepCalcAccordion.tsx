import React, { useState } from 'react'
import FormulaBlock from './FormulaBlock'
import { fmtNum as fmtSmart } from '../../lib/format'

interface StepData {
  title: string
  ref: string
  formula: string
  ok?: boolean
  [key: string]: unknown
}

interface Props {
  steps: Record<string, StepData>
  pipeType: string
}

function fmtNum(v: unknown): string {
  if (typeof v !== 'number') return String(v)
  return fmtSmart(v)
}

// 각 step별 계산 과정 텍스트 생성
// 근거: 세부지침 제11장 11.5.2 (11-134 ~ 11-137), 원단위 cm / kg / kg/cm²
function buildCalcLines(stepKey: string, step: StepData, pipeType: string): string[] {
  const lines: string[] = []
  const s = step as any
  const isSteel = pipeType === 'steel'

  if (stepKey === 'step1') {
    lines.push(`─── 관두께 적용 (세부지침 11-134) ───`)
    lines.push(`기준 관두께 t_std = ${fmtNum(s.tStandard)} mm`)
    lines.push(s.tMeasured != null
      ? `실측 최소 관두께 t_msr = ${fmtNum(s.tMeasured)} mm`
      : `실측 최소 관두께 — 미입력 (기준 두께 적용)`)
    lines.push(`적용 관두께 t = min(t_std, t_msr) = ${fmtNum(s.tAdopt)} mm`)
    lines.push(``)
    if (isSteel) {
      lines.push(`─── 내압에 의한 관의 응력 (외부 하중 없는 조건) ───`)
      lines.push(`σt = P·D/(2t) = ${fmtNum(s.Pd)} × ${fmtNum(s.Do ?? '')} / (2 × ${fmtNum(s.tAdopt)})`)
      lines.push(`   = ${fmtNum(s.sigma_t_static)} MPa ≤ ${fmtNum(s.sigmaA_static)} MPa (상시) → ${s.ok_static ? 'OK' : 'NG'}`)
      if (s.isPumped) {
        lines.push(``)
        lines.push(`수격압 P′ = ${fmtNum(s.Psurge)} MPa (가압구간 — 정수압 이상 상승압력)`)
        lines.push(`σt′ = P′·D/(2t) = ${fmtNum(s.sigma_t_surge)} MPa ≤ ${fmtNum(s.sigmaA_surge)} MPa (일시) → ${s.ok_surge ? 'OK' : 'NG'}`)
      } else {
        lines.push(`※ 자연유하 구간 — 정수압만 적용 (세부지침 11-136)`)
      }
    } else {
      lines.push(`─── 내압에 의한 인장응력 (세부지침 11-137) ───`)
      lines.push(`정수압 σts = P·D/(2t) = ${fmtNum(s.sigma_ts)} MPa`)
      lines.push(s.isPumped
        ? `수격압 σtd = P′·D/(2t) = ${fmtNum(s.sigma_td)} MPa  (P′ − P = ${fmtNum(s.Pdelta)} MPa)`
        : `수격압 σtd = 0 (자연유하 구간)`)
    }

  } else if (stepKey === 'step2') {
    lines.push(`─── 상부 토압 (세부지침 11-134) ───`)
    lines.push(`γt = ${fmtNum(s.gammaSoil_kgfcm3)} kg/cm³,  H = ${fmtNum(s.H)} m = ${fmtNum((s.H ?? 0) * 100)} cm`)
    lines.push(`굴착부 폭 B = 2D + 100 = ${fmtNum(s.B_cm)} cm`)
    lines.push(`kμ′ = ${fmtNum(s.kmu)}  (φ′ = φ = 30°)`)
    if (s.earthMethod === 'marston') {
      lines.push(`H > 2.0m → Marston 적용`)
      lines.push(`Cd = [1 − e^(−2kμ′H/B)] / (2kμ′) = ${fmtNum(s.Cd)}`)
      lines.push(`Wv = Cd × γt × B = ${fmtNum(s.Cd)} × ${fmtNum(s.gammaSoil_kgfcm3)} × ${fmtNum(s.B_cm)}`)
    } else {
      lines.push(`H ≤ 2.0m → 연직 토압 적용`)
      lines.push(`Wv = γt × H`)
    }
    lines.push(`   = ${fmtNum(s.Wv ?? s.Wf)} kg/cm²`)
    lines.push(``)
    if (s.hasTraffic) {
      lines.push(`─── 노면하중 (세부지침 11-134) ───`)
      lines.push(`충격계수 i = ${fmtNum(s.impactFactor)}  (H<1.5→0.5 / 1.5~6.5→0.65−0.10H / >6.5→0)`)
      lines.push(`Wt = 2nP(1+i) / {[nL+(n−1)C+b+2H·tanθ]·(a+2H·tanθ)}`)
      lines.push(`   = ${fmtNum(s.Wt)} kg/cm²`)
    } else {
      lines.push(`노면하중 Wt = 0 (미적용)`)
    }
    lines.push(``)
    lines.push(`합계 하중 W = Wv + Wt = ${fmtNum(s.Wtotal ?? ((s.Wf ?? 0) + (s.Wt ?? 0)))} kg/cm²`)

  } else if (stepKey === 'step3' && isSteel) {
    lines.push(`─── 외압에 의한 원주방향 휨응력 (세부지침 11-135) ───`)
    lines.push(`※ 외압 검토는 관 내부 수압이 없는 조건 (11-134)`)
    lines.push(`지지각 ${s.beddingLabel ?? ''} → Kb = ${fmtNum(s.Kb)}, Kx = ${fmtNum(s.Kx)}`)
    lines.push(`R = D/2 + t = ${fmtNum(s.R)} cm,  I = t³/12 = ${fmtNum(s.I)} cm³,  z = t²/6 = ${fmtNum(s.Z)} cm²`)
    lines.push(`E = ${fmtNum(s.E)} kg/cm²,  E′ = ${fmtNum(s.Ep)} kg/cm²,  f = ${fmtNum(s.f)}`)
    lines.push(`σb = 2/(f·z) × W × [Kb·R²·E·I + (0.061Kb − 0.083Kx)·E′·R⁵] / [E·I + 0.061·E′·R³]`)
    lines.push(`   = ${fmtNum(s.sigma_b_kgf)} kg/cm² = ${fmtNum(s.sigma_b)} MPa`)
    lines.push(`   ≤ ${fmtNum(s.sigmaA_bend)} MPa → ${s.ok ? 'OK' : 'NG'}   (SF = ${fmtNum(s.SF)})`)

  } else if (stepKey === 'step3' && !isSteel) {
    lines.push(`─── 외압에 의한 휨응력 (세부지침 11-137) ───`)
    lines.push(`지지각 ${s.beddingLabel ?? ''} → Kf = ${fmtNum(s.Kf)}, Kt = ${fmtNum(s.Kt)}`)
    lines.push(`R = D/2 = ${fmtNum(s.R_cm)} cm,  t = ${fmtNum(s.t_cm)} cm`)
    lines.push(`σb = 6(Kf·Wf + Kt·Wt)·R² / t²`)
    lines.push(`   = 6 × (${fmtNum(s.Kf)}×${fmtNum(s.Wf)} + ${fmtNum(s.Kt)}×${fmtNum(s.Wt)}) × ${fmtNum(s.R_cm)}² / ${fmtNum(s.t_cm)}²`)
    lines.push(`   = ${fmtNum(s.sigma_b_kgf)} kg/cm² = ${fmtNum(s.sigma_b)} MPa`)

  } else if (stepKey === 'step4' && isSteel) {
    lines.push(`─── 외압에 의한 원주방향 변형률 (세부지침 11-136) ───`)
    lines.push(`ε = 2·Kx·(Wv+Wt)·R⁴ / [E·I + 0.061·E′·R³] × (1/D) × 100`)
    lines.push(`변형량 Δx = ${fmtNum(s.deltaX)} cm`)
    lines.push(`ε = ${fmtNum(s.deflectionRatio)} % < ${fmtNum(s.maxDeflection)} % → ${s.ok ? 'OK' : 'NG'}`)
    lines.push(`※ 허용 변형량 = 관경의 5% 미만 (라이닝 구분 없음)`)

  } else if (stepKey === 'step4' && !isSteel) {
    lines.push(`─── 조합응력 검토 (세부지침 11-137) ───`)
    lines.push(`2.5·σts = 2.5 × ${fmtNum(s.sigma_ts)} = ${fmtNum((s.sigma_ts ?? 0) * 2.5)} MPa`)
    lines.push(`2.0·σtd = 2.0 × ${fmtNum(s.sigma_td)} = ${fmtNum((s.sigma_td ?? 0) * 2.0)} MPa`)
    lines.push(`1.4·σb  = 1.4 × ${fmtNum(s.sigma_b)} = ${fmtNum((s.sigma_b ?? 0) * 1.4)} MPa`)
    lines.push(`합계 = ${fmtNum(s.demand)} MPa < S = ${fmtNum(s.S)} MPa → ${s.ok ? 'OK' : 'NG'}`)
    lines.push(`이용률 = ${fmtNum((s.utilization ?? 0) * 100)} %,  SF = ${fmtNum(s.SF)}`)

  } else if (stepKey === 'step5' && isSteel) {
    lines.push(`─── 외압에 의한 좌굴하중 (세부지침 11-136) ───`)
    lines.push(`H/D = ${fmtNum(s.HoverD)}`)
    lines.push(`설계계수 FS = ${fmtNum(s.FS)}  (H/D ≥ 2 → 2.5 / H/D < 2 → 3.0)`)
    lines.push(`부력계수 Rw = ${fmtNum(s.Rw)}${s.rwIsGuideline ? '  (세부지침 제시값)' : '  ※ 지침 제시값(1.0) 아닌 안전측 보정'}`)
    lines.push(`기초계수 B′ = 0.15 + 0.041(H/D) = ${fmtNum(s.Bprime)}`)
    lines.push(`qa = (1/FS)·√(32·Rw·B′·E′·EI/D³) = ${fmtNum(s.qa)} kg/cm²`)
    lines.push(`작용 하중 W = ${fmtNum(s.Wtotal)} kg/cm² ≤ ${fmtNum(s.qa)} → ${s.ok ? 'OK' : 'NG'}`)
  }

  return lines
}

export default function StepCalcAccordion({ steps, pipeType }: Props) {
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set(['step1']))

  const toggle = (key: string) => {
    setOpenSteps((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {Object.entries(steps).map(([key, step]) => {
        const isOpen = openSteps.has(key)
        const calcLines = buildCalcLines(key, step, pipeType)
        const ok = step.ok

        return (
          <div key={key} className="rounded-lg overflow-hidden border"
               style={{ borderColor: ok === false ? '#f0a8a0' : ok === true ? '#a8d5b8' : '#dde8f5' }}>
            {/* 헤더 */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
              style={{ background: isOpen ? '#f0f7ff' : '#f8faff', borderLeft: '3px solid #003366' }}
              onClick={() => toggle(key)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: '#003366', color: 'white' }}>
                  {key.toUpperCase()}
                </span>
                <span className="text-sm font-semibold" style={{ color: '#003366' }}>{step.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {ok !== undefined && (
                  <span className={ok ? 'badge-ok' : 'badge-ng'}>{ok ? 'OK' : 'NG'}</span>
                )}
                <span style={{ color: '#003366', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* 내용 */}
            {isOpen && (
              <div className="px-4 pb-4 pt-3 space-y-3" style={{ background: '#fdfdff' }}>
                {/* 근거 */}
                <div className="text-xs text-gray-400 bg-gray-50 rounded px-2 py-1">
                  근거: {step.ref}
                </div>

                {/* 공식 */}
                <div className="rounded px-4 py-3" style={{ background: '#fffbf0', border: '1.5px solid #e8c840' }}>
                  <div className="text-xs text-gray-500 mb-1">적용 공식</div>
                  <FormulaBlock formula={step.formula}/>
                </div>

                {/* 계산 과정 */}
                <div className="rounded px-4 py-3" style={{ background: '#fafafa', border: '1px solid #ddd' }}>
                  <div className="text-xs text-gray-500 mb-2">계산 과정</div>
                  <div className="space-y-1">
                    {calcLines.map((line, i) => (
                      <div key={i} className="calc-mono text-xs" style={{ color: '#222' }}>
                        {line.startsWith('───') ? (
                          <div className="font-bold text-navy py-0.5" style={{ color: '#003366' }}>
                            {line}
                          </div>
                        ) : (
                          line
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
