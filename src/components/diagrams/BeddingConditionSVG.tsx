import React from 'react'
import { DI_BEDDING } from '../../engine/constants.js'

interface Props {
  selected: string  // 'deg40'|'deg60'|'deg90'|'deg120'|'deg180'
}

// 세부지침 11-137 덕타일 주철관 지지각별 계수 (관저 기준)
const TYPES = ['deg40', 'deg60', 'deg90', 'deg120', 'deg180'] as const
const ANGLES: Record<string, number> = {
  deg40: 40, deg60: 60, deg90: 90, deg120: 120, deg180: 180
}
const LABELS: Record<string, string[]> = {
  deg40:  ['관저 지지', '40°'],
  deg60:  ['관저 지지', '60°'],
  deg90:  ['관저 지지', '90°'],
  deg120: ['관저 지지', '120°'],
  deg180: ['관저 지지', '180°'],
}

function TypeDiagram({ type, selected }: { type: string; selected: string }) {
  const cx = 45
  const cy = 52
  const R = 28
  const angle = ANGLES[type]
  const isSelected = type === selected
  const { Kf, Kt } = (DI_BEDDING as any)[type]

  // 침상 호 경로
  function beddingArc(angleDeg: number) {
    if (angleDeg <= 0) return null
    const halfA = (angleDeg / 2) * (Math.PI / 180)
    // 좌측 시작, 우측 끝 (아래쪽 호)
    const x1 = cx - R * Math.sin(halfA)
    const y1 = cy + R * Math.cos(halfA)
    const x2 = cx + R * Math.sin(halfA)
    const y2 = y1
    const sweepFlag = angleDeg >= 180 ? 1 : 1
    const largeArc = angleDeg > 180 ? 1 : 0
    // 관 바닥 호 (하부)
    const startAngle = Math.PI / 2 + halfA  // 왼쪽
    const endAngle   = Math.PI / 2 - halfA  // 오른쪽
    const sx = cx + R * Math.cos(startAngle)
    const sy = cy + R * Math.sin(startAngle)
    const ex = cx + R * Math.cos(endAngle)
    const ey = cy + R * Math.sin(endAngle)
    return `M ${sx} ${sy} A ${R} ${R} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}`
  }

  const arcPath = beddingArc(angle)

  return (
    <g>
      {/* 배경 */}
      <rect x="0" y="0" width="90" height="100" rx="6"
            fill={isSelected ? '#e8f0fb' : '#fafafa'}
            stroke={isSelected ? '#003366' : '#ccc'}
            strokeWidth={isSelected ? 2 : 1}/>

      {/* 타입 라벨 */}
      <text x="45" y="13" textAnchor="middle" fontSize="9" fontWeight="700"
            fill={isSelected ? '#003366' : '#555'}>
        {type}
      </text>

      {/* 지반선 */}
      <line x1="5" y1={cy + R + 6} x2="85" y2={cy + R + 6} stroke="#8b6914" strokeWidth="1.5"/>

      {/* 침상 채우기 */}
      {angle > 0 && arcPath && (
        <path d={`${arcPath} L ${cx} ${cy + R + 6} Z`}
              fill={type === 'Type4' ? '#b0b0b0' : '#d4b896'} opacity="0.8"/>
      )}
      {angle === 0 && (
        <rect x="5" y={cy + R} width="80" height="8" fill="#d4b896"/>
      )}

      {/* 관 원 */}
      <circle cx={cx} cy={cy} r={R} fill="#dce8f5" stroke="#003366" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={R - 5} fill="white" stroke="#003366" strokeWidth="0.8"/>

      {/* 침상 각도 호 표시 */}
      {angle > 0 && arcPath && (
        <path d={arcPath} fill="none" stroke="#e67e22" strokeWidth="2.5"/>
      )}

      {/* 계수 표시 */}
      <text x="45" y="87" textAnchor="middle" fontSize="7.5" fill="#003366">
        Kf={Kf} Kt={Kt}
      </text>

      {/* 설명 */}
      <text x="45" y="97" textAnchor="middle" fontSize="7" fill="#555">
        {LABELS[type]?.[0]}
      </text>
    </g>
  )
}

export default function BeddingConditionSVG({ selected = 'Type2' }: Props) {
  const W = 400
  const HH = 160

  return (
    <svg width={W} height={HH} viewBox={`0 0 ${W} ${HH}`} style={{ width: '100%', height: 'auto' }}>
      <rect width={W} height={HH} fill="#f8faff" rx="8"/>
      <text x={W/2} y={16} textAnchor="middle" fontSize="12" fontWeight="700" fill="#003366">
        침상 조건 비교
      </text>
      {TYPES.map((type, i) => (
        <g key={type} transform={`translate(${10 + i * 97}, 24)`}>
          <TypeDiagram type={type} selected={selected}/>
        </g>
      ))}
    </svg>
  )
}
