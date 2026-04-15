import React, { useState } from 'react'
import FormulaBlock from './FormulaBlock'

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
  return v.toFixed(4)
}

// 각 step별 계산 과정 텍스트 생성
function buildCalcLines(stepKey: string, step: StepData, pipeType: string): string[] {
  const lines: string[] = []

  if (stepKey === 'step1' && pipeType === 'steel') {
    const s = step as any
    lines.push(`σ_a (상시) = 0.50 × fy = 0.50 × 235 = ${s.sigmaA_normal?.toFixed(1)} MPa`)
    lines.push(`σ_a (수격) = 0.75 × fy = 0.75 × 235 = ${s.sigmaA_surge?.toFixed(1)} MPa`)
    lines.push(`Pd (수격) = ${s.Pd} × ${s.surgeRatio} = ${s.Psurge?.toFixed(3)} MPa`)
    lines.push(`t_p (상시) = ${s.Pd} × ${s.Do} / (2 × ${s.sigmaA_normal?.toFixed(1)}) = ${s.tp_normal?.toFixed(2)} mm`)
    lines.push(`t_p (수격) = ${s.Psurge?.toFixed(3)} × ${s.Do} / (2 × ${s.sigmaA_surge?.toFixed(1)}) = ${s.tp_surge?.toFixed(2)} mm`)
    lines.push(`t_handling = Do / 288 = ${s.Do} / 288 = ${s.tHandling?.toFixed(2)} mm`)
    lines.push(`t_calc = max(${s.tp_normal?.toFixed(2)}, ${s.tp_surge?.toFixed(2)}, ${s.tHandling?.toFixed(2)}) = ${s.tCalc?.toFixed(2)} mm`)
    lines.push(`t_required = t_calc + 부식여유 = ${s.tCalc?.toFixed(2)} + 1.5 = ${s.tRequired?.toFixed(2)} mm`)
    lines.push(`─── 채택: KS D 3565 ${s.pnGrade} → t = ${s.tAdopt} mm ───`)
    lines.push(`σ (상시) = ${s.Pd} × ${s.Do} / (2 × ${s.tAdopt}) = ${s.sigma_normal?.toFixed(2)} MPa ≤ ${s.sigmaA_normal?.toFixed(1)} MPa → ${s.ok_normal ? 'OK' : 'NG'}`)
    lines.push(`σ (수격) = ${s.Psurge?.toFixed(3)} × ${s.Do} / (2 × ${s.tAdopt}) = ${s.sigma_surge?.toFixed(2)} MPa ≤ ${s.sigmaA_surge?.toFixed(1)} MPa → ${s.ok_surge ? 'OK' : 'NG'}`)
  } else if (stepKey === 'step1' && pipeType === 'ductile') {
    const s = step as any
    lines.push(`σ_a (내압) = fu / 3 = 420 / 3 = ${s.sigmaA_hoop?.toFixed(1)} MPa`)
    lines.push(`Di = Do - 2t = ${s.Do} - 2×${s.tAdopt} = ${s.Di?.toFixed(1)} mm`)
    lines.push(`σ_hoop = Pd × Di / (2t) = ${s.Pd} × ${s.Di?.toFixed(1)} / (2×${s.tAdopt}) = ${s.sigma_hoop?.toFixed(2)} MPa`)
    lines.push(`→ 채택 등급: ${s.selectedGrade} (t = ${s.tAdopt} mm), σ = ${s.sigma_hoop?.toFixed(2)} ≤ ${s.sigmaA_hoop?.toFixed(1)} MPa → ${s.ok ? 'OK' : 'NG'}`)
  } else if (stepKey === 'step2') {
    const s = step as any
    lines.push(`We = γs × H × Do = ${s.gammaSoil} × ${s.H?.toFixed(2)} × ${(s.Do/1000)?.toFixed(3)} = ${s.We?.toFixed(3)} kN/m`)
    if (s.PLraw !== undefined) {
      lines.push(`DB-24 PL(기준) = ${s.PLraw?.toFixed(1)} kPa, 충격계수 IF = ${s.IF?.toFixed(2)}`)
      lines.push(`PL (IF 포함) = ${s.PLraw?.toFixed(1)} × ${s.IF?.toFixed(2)} = ${s.PL?.toFixed(2)} kPa`)
      lines.push(`WL = PL × Do = ${s.PL?.toFixed(2)} × ${(s.Do/1000)?.toFixed(3)} = ${s.WL?.toFixed(3)} kN/m`)
      lines.push(`W_total = We + WL = ${s.We?.toFixed(3)} + ${s.WL?.toFixed(3)} = ${s.Wtotal?.toFixed(3)} kN/m`)
      lines.push(`P_total = W_total / Do = ${s.Wtotal?.toFixed(3)} / ${(s.Do/1000)?.toFixed(3)} = ${s.Ptotal?.toFixed(2)} kPa`)
    }
  } else if (stepKey === 'step3' && pipeType === 'steel') {
    const s = step as any
    lines.push(`DB-24 기준압력 = ${s.PLraw?.toFixed(1)} kPa (H=${s.H?.toFixed(2)}m 보간)`)
    lines.push(`충격계수 IF = ${s.IF?.toFixed(2)}`)
    lines.push(`PL (충격 포함) = ${s.PL?.toFixed(2)} kPa`)
    lines.push(`WL = ${s.WL?.toFixed(3)} kN/m`)
    lines.push(`W_total = We + WL = ${s.Wtotal?.toFixed(3)} kN/m`)
    lines.push(`P_total = W_total / Do(m) = ${s.Ptotal?.toFixed(2)} kPa`)
  } else if (stepKey === 'step3' && pipeType === 'ductile') {
    const s = step as any
    lines.push(`Kb = ${s.Kb} (침상조건 계수)`)
    lines.push(`σ_b = Kb × W_total × Do / t²`)
    lines.push(`     = ${s.Kb} × ${s.Wtotal?.toFixed(3)} × ${s.Do} / ${(s.tAdopt**2)?.toFixed(0)}`)
    lines.push(`     = ${s.sigma_b?.toFixed(2)} MPa ≤ ${s.sigmaA_bend?.toFixed(1)} MPa → ${s.ok ? 'OK' : 'NG'}`)
  } else if (stepKey === 'step4' && pipeType === 'steel') {
    const s = step as any
    lines.push(`DL = ${s.DL} (처짐 지연계수), K = ${s.K} (침상계수)`)
    lines.push(`r = (Do - t) / 2 = ${s.r?.toFixed(4)} m`)
    lines.push(`I = t³ / 12 = ${s.I?.toExponential(3)} m⁴/m`)
    lines.push(`EI = Es × I = ${s.EI?.toFixed(2)} kN·m²/m`)
    lines.push(`EI/r³ = ${s.EI_r3?.toFixed(2)} kPa`)
    lines.push(`분모 = EI/r³ + 0.061×E' = ${s.EI_r3?.toFixed(2)} + 0.061×${s.Eprime} = ${s.denominator?.toFixed(2)} kPa`)
    lines.push(`ΔD/D = DL×K×Ptotal / 분모 = ${s.DL}×${s.K}×${s.Ptotal?.toFixed(2)} / ${s.denominator?.toFixed(2)}`)
    lines.push(`     = ${s.deflectionRatio?.toFixed(3)}% ≤ ${s.maxDeflection}% → ${s.ok ? 'OK' : 'NG'}`)
  } else if ((stepKey === 'step4' && pipeType === 'ductile')) {
    const s = step as any
    lines.push(`Kd = ${s.Kd} (침상조건 처짐계수)`)
    lines.push(`r = (Do - t) / 2 = ${s.r?.toFixed(4)} m`)
    lines.push(`I = t³ / 12 = ${s.I?.toExponential(3)} m⁴/m`)
    lines.push(`EI = Edi × I = ${s.EI?.toFixed(2)} kN·m²/m`)
    lines.push(`EI/r³ = ${s.EI_r3?.toFixed(2)} kPa`)
    lines.push(`분모 = ${s.EI_r3?.toFixed(2)} + 0.061×${s.Eprime} = ${s.denominator?.toFixed(2)} kPa`)
    lines.push(`ΔD/D = Kd×Ptotal / 분모 = ${s.Kd}×${s.Ptotal?.toFixed(2)} / ${s.denominator?.toFixed(2)}`)
    lines.push(`     = ${s.deflectionRatio?.toFixed(3)}% ≤ ${s.maxDeflection}% → ${s.ok ? 'OK' : 'NG'}`)
  } else if (stepKey === 'step5') {
    const s = step as any
    lines.push(`지하수위 계수 Rw = ${s.Rw}`)
    lines.push(`H/Do = ${s.H?.toFixed(2)} / ${s.Do_m?.toFixed(3)} = ${s.HoverDo?.toFixed(2)}`)
    lines.push(`B' = 1/(1+4×e^(-0.065×H/Do)) = ${s.Bprime?.toFixed(4)}`)
    lines.push(`EI/Do³ = ${s.EI_Do3?.toFixed(2)} kPa`)
    lines.push(`Pcr = (1/FS)×√(32×Rw×B'×E'×EI/Do³)`)
    lines.push(`    = (1/${s.FS_allow})×√(32×${s.Rw}×${s.Bprime?.toFixed(4)}×${s.Eprime}×${s.EI_Do3?.toFixed(2)})`)
    lines.push(`    = ${s.Pcr?.toFixed(2)} kPa`)
    lines.push(`외압 Pe = ${s.Pe_ext?.toFixed(2)} kPa`)
    lines.push(`F.S. = Pcr / Pe = ${s.Pcr?.toFixed(2)} / ${s.Pe_ext?.toFixed(2)} = ${s.bucklingFS_actual?.toFixed(3)} ≥ ${s.FS_allow} → ${s.ok ? 'OK' : 'NG'}`)
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
