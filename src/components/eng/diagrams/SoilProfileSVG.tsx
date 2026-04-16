// 지반분류 단면도 — KDS 17 10 00 기반
import React from 'react'
import { T } from '../tokens'

const SOIL_LAYERS: Record<string, {
  layers: { label: string; h: number; color: string; pattern?: string }[]
  desc: string
}> = {
  S1: {
    desc: '기반암 또는 매우 단단한 암반',
    layers: [
      { label: '기반암 (Vs > 1500 m/s)', h: 80, color: '#b0a090' },
    ],
  },
  S2: {
    desc: '매우 조밀한 토사 또는 연암',
    layers: [
      { label: '조밀한 사질토 / 연암', h: 50, color: '#c8b896' },
      { label: '기반암', h: 30, color: '#b0a090' },
    ],
  },
  S3: {
    desc: '얕고 연약한 지반 (H < 20 m)',
    layers: [
      { label: '연약 점성토', h: 35, color: '#d4c8a0' },
      { label: '조밀한 토사', h: 25, color: '#c8b896' },
      { label: '기반암', h: 20, color: '#b0a090' },
    ],
  },
  S4: {
    desc: '깊고 단단한 지반 (H > 20 m)',
    layers: [
      { label: '단단한 토사 (H > 20 m)', h: 55, color: '#c0b890' },
      { label: '기반암', h: 25, color: '#b0a090' },
    ],
  },
  S5: {
    desc: '깊고 연약한 지반',
    layers: [
      { label: '연약 점성토 (H > 20 m)', h: 55, color: '#d8d0a8' },
      { label: '기반암', h: 25, color: '#b0a090' },
    ],
  },
  S6: {
    desc: '부지 고유 특성 평가 필요',
    layers: [
      { label: '부지 고유 특성 지반', h: 80, color: '#c8c0b0' },
    ],
  },
}

export function SoilProfileSVG({ soilType, pipeDepth = 1.5 }: { soilType: string; pipeDepth?: number }) {
  const info = SOIL_LAYERS[soilType] ?? SOIL_LAYERS['S2']
  const W = 180, H = 160
  const totalLayerH = info.layers.reduce((s, l) => s + l.h, 0)
  const drawH = 120   // 지반 그리기 영역
  const startY = 20   // 지표면 Y

  // 관 위치 (토피 기준, 전체 지반두께에 비례)
  const pipeRelY = Math.min(pipeDepth / 10, 0.35)  // 최대 35%
  const pipeY = startY + pipeRelY * drawH

  let curY = startY
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* 지표면 */}
      <line x1="20" y1={startY} x2={W - 10} y2={startY} stroke="#333" strokeWidth="1.5"/>
      {/* 해칭 (지표면 위) */}
      {[0, 6, 12, 18, 24].map(i => (
        <line key={i} x1={20 + i * 5} y1={startY} x2={20 + i * 5 - 8} y2={startY - 7}
          stroke="#666" strokeWidth="0.8"/>
      ))}
      <text x="22" y={startY - 3} fontSize="8" fill="#555" fontFamily={T.fontSans}>지표면</text>

      {/* 지반 층 */}
      {info.layers.map((layer, i) => {
        const lh = (layer.h / totalLayerH) * drawH
        const y = curY
        curY += lh
        const isLast = i === info.layers.length - 1
        return (
          <g key={i}>
            <rect x="20" y={y} width={W - 30} height={lh}
              fill={layer.color} stroke="#999" strokeWidth="0.5" opacity="0.75"/>
            {/* 지층 해칭 (기반암) */}
            {isLast && Array.from({ length: 8 }, (_, j) => (
              <line key={j} x1={20 + j * 20} y1={y + 2} x2={20 + j * 20 + 12} y2={y + lh - 2}
                stroke="#888" strokeWidth="0.6" opacity="0.5"/>
            ))}
            {/* 지층 라벨 */}
            <text x={W / 2} y={y + lh / 2 + 3} textAnchor="middle"
              fontSize="8" fill="#333" fontFamily={T.fontSans}>
              {layer.label}
            </text>
            {/* 지층 경계선 */}
            {!isLast && <line x1="20" y1={y + lh} x2={W - 10} y2={y + lh}
              stroke="#888" strokeWidth="0.8" strokeDasharray="4 2"/>}
          </g>
        )
      })}

      {/* 관로 단면 */}
      <circle cx={W / 2} cy={pipeY} r="9" fill="white" stroke="#1a3a5c" strokeWidth="1.5"/>
      <circle cx={W / 2} cy={pipeY} r="6" fill="#dce8f5" stroke="#1a3a5c" strokeWidth="1"/>
      {/* 토피 치수선 */}
      <line x1={W - 14} y1={startY} x2={W - 14} y2={pipeY - 9}
        stroke={T.bgActive} strokeWidth="0.8" markerEnd="url(#arr)"/>
      <line x1={W - 18} y1={startY} x2={W - 10} y2={startY} stroke={T.bgActive} strokeWidth="0.8"/>
      <line x1={W - 18} y1={pipeY - 9} x2={W - 10} y2={pipeY - 9} stroke={T.bgActive} strokeWidth="0.8"/>
      <defs>
        <marker id="arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 Z" fill={T.bgActive}/>
        </marker>
      </defs>
      <text x={W - 6} y={(startY + pipeY) / 2 + 3} fontSize="8" fill={T.bgActive}
        fontFamily={T.fontMono} textAnchor="middle"
        transform={`rotate(-90, ${W - 6}, ${(startY + pipeY) / 2})`}>h</text>

      {/* 지반종류 라벨 */}
      <rect x="22" y={startY + drawH + 4} width="30" height="14" rx="1"
        fill={T.bgActive}/>
      <text x="37" y={startY + drawH + 14} textAnchor="middle"
        fontSize="10" fill="white" fontWeight="700" fontFamily={T.fontSans}>{soilType}</text>
      <text x="56" y={startY + drawH + 14} fontSize="8" fill="#555" fontFamily={T.fontSans}>
        {info.desc.length > 18 ? info.desc.slice(0, 18) + '…' : info.desc}
      </text>
    </svg>
  )
}
