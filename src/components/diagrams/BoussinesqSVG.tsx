import React from 'react'
import { DB24_PRESSURE } from '../../engine/constants.js'

interface Props {
  currentH: number
}

export default function BoussinesqSVG({ currentH = 1.5 }: Props) {
  const W = 380
  const HH = 280
  const topY = 30
  const scaleY = 35  // px per meter

  const depths = Object.keys(DB24_PRESSURE).map(Number).sort((a, b) => a - b)
  const maxPL = 80
  const maxX = 160  // px

  // 보간 함수
  function getPL(H: number) {
    const keys = depths
    if (H <= keys[0]) return (DB24_PRESSURE as any)[keys[0]].PL * (DB24_PRESSURE as any)[keys[0]].IF
    if (H >= keys[keys.length - 1]) return (DB24_PRESSURE as any)[keys[keys.length - 1]].PL
    for (let i = 0; i < keys.length - 1; i++) {
      if (H >= keys[i] && H <= keys[i + 1]) {
        const r = (H - keys[i]) / (keys[i + 1] - keys[i])
        const p0 = (DB24_PRESSURE as any)[keys[i]]
        const p1 = (DB24_PRESSURE as any)[keys[i + 1]]
        return (p0.PL * p0.IF) + r * ((p1.PL * p1.IF) - (p0.PL * p0.IF))
      }
    }
    return 0
  }

  const currentPL = getPL(currentH)
  const curY = topY + currentH * scaleY
  const curX = (currentPL / maxPL) * maxX

  // 분산 원추 경로
  const coneTopX = W / 2 - 20
  const coneTopY = topY
  const maxDepth = Math.max(...depths) + 0.5
  const coneBottomY = topY + maxDepth * scaleY

  return (
    <svg width={W} height={HH} viewBox={`0 0 ${W} ${HH}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <pattern id="soil2" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#c8a96e"/>
          <circle cx="2" cy="2" r="0.8" fill="#8b6914" opacity="0.5"/>
        </pattern>
        <marker id="arrowR" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill="#c0392b"/>
        </marker>
      </defs>

      <rect width={W} height={HH} fill="#f8faff" rx="8"/>
      <text x={W/2} y={16} textAnchor="middle" fontSize="12" fontWeight="700" fill="#003366">
        DB-24 응력분산 원추도
      </text>

      {/* 토사 배경 */}
      <rect x={40} y={topY} width={W - 80} height={HH - topY - 15} fill="url(#soil2)" rx="4"/>

      {/* 지표면 */}
      <line x1={40} y1={topY} x2={W - 40} y2={topY} stroke="#555" strokeWidth="2.5"/>

      {/* DB-24 트럭 */}
      <g transform={`translate(${W/2 - 35}, ${topY - 32})`}>
        <rect x="8" y="12" width="48" height="16" fill="#2c3e50" rx="2"/>
        <rect x="0" y="16" width="14" height="12" fill="#34495e" rx="1"/>
        <circle cx="14" cy="28" r="4" fill="#1a1a1a"/>
        <circle cx="42" cy="28" r="4" fill="#1a1a1a"/>
        <circle cx="54" cy="28" r="4" fill="#1a1a1a"/>
        <text x="32" y="23" fontSize="7" fill="white" textAnchor="middle" fontWeight="600">DB-24</text>
      </g>

      {/* 분산 원추 */}
      <path
        d={`M ${coneTopX} ${coneTopY} L ${coneTopX - 80} ${coneBottomY} M ${coneTopX} ${coneTopY} L ${coneTopX + 80} ${coneBottomY}`}
        stroke="#e67e22" strokeWidth="1.5" strokeDasharray="5,3" fill="none"/>

      {/* 각 깊이별 등가압력 선 */}
      {depths.slice(0, 7).map((d) => {
        const pl = (DB24_PRESSURE as any)[d].PL * (DB24_PRESSURE as any)[d].IF
        const y = topY + d * scaleY
        const barW = (pl / maxPL) * maxX
        return (
          <g key={d}>
            <line x1={coneTopX} y1={y} x2={coneTopX - barW} y2={y}
                  stroke="#1a7abf" strokeWidth="1.5" opacity="0.6"/>
            <text x={coneTopX - barW - 3} y={y + 4} textAnchor="end" fontSize="7.5" fill="#1a7abf">
              {pl.toFixed(0)}kPa
            </text>
            <text x={coneTopX + 6} y={y + 4} fontSize="7.5" fill="#555">H={d}m</text>
          </g>
        )
      })}

      {/* 현재 H 강조 */}
      {currentH <= 4.0 && (
        <g>
          <line x1={coneTopX} y1={curY} x2={coneTopX - curX} y2={curY}
                stroke="#c0392b" strokeWidth="2.5" strokeDasharray="6,2"/>
          <circle cx={coneTopX - curX} cy={curY} r="5" fill="#c0392b"/>
          <text x={coneTopX - curX - 6} y={curY - 6} textAnchor="end" fontSize="9" fill="#c0392b" fontWeight="700">
            PL={currentPL.toFixed(1)} kPa (H={currentH}m)
          </text>
        </g>
      )}
    </svg>
  )
}
