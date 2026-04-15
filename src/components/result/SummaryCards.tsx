import React from 'react'

interface VerdictItem {
  label: string
  value: number
  allow: number
  unit: string
  ok: boolean
}

interface Props {
  result: {
    pipeType: string
    DN: number
    Do: number
    tAdopt?: number
    selectedGrade?: string
    pnGrade?: string
    verdict: Record<string, VerdictItem | boolean>
  }
}

export default function SummaryCards({ result }: Props) {
  const { pipeType, DN, Do, tAdopt, selectedGrade, pnGrade, verdict } = result
  const overallOK = verdict.overallOK as boolean

  const items = Object.entries(verdict).filter(([k]) => k !== 'overallOK') as [string, VerdictItem][]

  return (
    <div className="space-y-4">
      {/* 관 정보 */}
      <div className="rounded-lg p-4" style={{ background: '#e8f0fb', border: '1.5px solid #b0c8e8' }}>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-gray-500">관종</span>
            <div className="font-bold text-navy mt-0.5" style={{ color: '#003366' }}>
              {pipeType === 'steel' ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'}
            </div>
          </div>
          <div>
            <span className="text-gray-500">호칭경</span>
            <div className="font-bold mt-0.5" style={{ color: '#003366' }}>DN {DN}</div>
          </div>
          <div>
            <span className="text-gray-500">외경</span>
            <div className="font-bold mt-0.5" style={{ color: '#003366' }}>{Do} mm</div>
          </div>
          <div>
            <span className="text-gray-500">채택 두께/등급</span>
            <div className="font-bold mt-0.5" style={{ color: '#003366' }}>
              {pipeType === 'steel'
                ? `${tAdopt} mm (${pnGrade})`
                : `${tAdopt} mm (${selectedGrade})`}
            </div>
          </div>
        </div>
      </div>

      {/* 항목별 판정 카드 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([key, item]) => (
          <div
            key={key}
            className="rounded-lg p-3 text-center"
            style={{
              background: item.ok ? '#f0faf4' : '#fdf0ef',
              border: `1.5px solid ${item.ok ? '#a8d5b8' : '#f0a8a0'}`,
            }}
          >
            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
            <div className="text-lg font-bold" style={{ color: item.ok ? '#1a7a3c' : '#c0392b' }}>
              {typeof item.value === 'number' ? item.value.toFixed(2) : '-'}
              <span className="text-xs font-normal ml-0.5">{item.unit}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              허용: {typeof item.allow === 'number' ? item.allow.toFixed(2) : '-'}{item.unit}
            </div>
            <span className={item.ok ? 'badge-ok' : 'badge-ng'}>
              {item.ok ? 'OK' : 'NG'}
            </span>
          </div>
        ))}
      </div>

      {/* 종합 판정 */}
      <div
        className="rounded-xl p-4 text-center"
        style={{ background: overallOK ? '#1a7a3c' : '#c0392b' }}
      >
        <div className="text-white text-sm mb-1">종합 구조안전성 판정</div>
        <div className="text-white text-4xl font-black tracking-widest">
          {overallOK ? '✓ OK' : '✗ NG'}
        </div>
        <div className="text-white/70 text-xs mt-1">
          KDS 57 00 00 : 2022 기준
        </div>
      </div>
    </div>
  )
}
