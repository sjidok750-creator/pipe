import React from 'react'

interface Props {
  We: number      // kN/m
  H: number       // m
  Do: number      // mm
  gammaSoil: number
}

export default function PrismLoadSVG({ We = 16.47, H = 1.5, Do = 610, gammaSoil = 18.0 }: Props) {
  const W = 380
  const HH = 240

  const scaleH = 120 / H  // px/m
  const scaleDo = 80 / (Do / 1000)  // px/m

  const topY = 40
  const pipeY = topY + H * scaleH
  const pipeR = (Do / 1000) * scaleDo / 2
  const pipeX = W / 2

  const boxW = pipeR * 2
  const boxLeft = pipeX - boxW / 2

  return (
    <svg width={W} height={HH} viewBox={`0 0 ${W} ${HH}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <pattern id="soilP" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#c8a96e"/>
          <circle cx="2" cy="2" r="0.8" fill="#8b6914" opacity="0.4"/>
          <circle cx="6" cy="6" r="0.8" fill="#8b6914" opacity="0.4"/>
        </pattern>
        <marker id="arrowDownP" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
          <path d="M0,0 L3,6 L6,0" fill="#e67e22"/>
        </marker>
      </defs>

      <rect width={W} height={HH} fill="#f8faff" rx="8"/>
      <text x={W/2} y={18} textAnchor="middle" fontSize="12" fontWeight="700" fill="#003366">
        Prism Load 개념도
      </text>

      {/* 토사 배경 */}
      <rect x={40} y={topY} width={W - 80} height={HH - topY - 20} fill="url(#soilP)" rx="4"/>

      {/* 지표면 */}
      <line x1={40} y1={topY} x2={W - 40} y2={topY} stroke="#555" strokeWidth="2.5"/>
      <text x={42} y={topY - 4} fontSize="9" fill="#555">지표면 (G.L.)</text>

      {/* Prism 범위 강조 박스 */}
      <rect x={boxLeft} y={topY} width={boxW} height={H * scaleH}
            fill="#e67e22" opacity="0.2" stroke="#e67e22" strokeWidth="1.5" strokeDasharray="5,3"/>

      {/* 흙 기둥 화살표들 */}
      {[0.2, 0.4, 0.6, 0.8].map((fr) => {
        const ax = boxLeft + fr * boxW
        return (
          <line key={fr}
                x1={ax} y1={topY + 8} x2={ax} y2={pipeY - pipeR - 4}
                stroke="#e67e22" strokeWidth="2" markerEnd="url(#arrowDownP)"/>
        )
      })}

      {/* Prism 범위 라벨 */}
      <text x={boxLeft - 4} y={(topY + pipeY) / 2} textAnchor="end" fontSize="9" fill="#e67e22" fontWeight="600">
        We = {We.toFixed(2)} kN/m
      </text>

      {/* 관 */}
      <circle cx={pipeX} cy={pipeY} r={pipeR} fill="#dce8f5" stroke="#003366" strokeWidth="2"/>
      <circle cx={pipeX} cy={pipeY} r={pipeR * 0.82} fill="#a8d8ea" stroke="#003366" strokeWidth="1"/>

      {/* 수식 박스 */}
      <g transform={`translate(${W/2 - 110}, ${HH - 52})`}>
        <rect x="0" y="0" width="220" height="45" rx="4"
              fill="#fffbf0" stroke="#e8c840" strokeWidth="1.5"/>
        <text x="110" y="16" textAnchor="middle" fontSize="9" fill="#003366" fontWeight="600">
          We = γs × H × Do
        </text>
        <text x="110" y="30" textAnchor="middle" fontSize="9" fill="#555">
          = {gammaSoil} × {H.toFixed(2)} × {(Do/1000).toFixed(3)} = {We.toFixed(2)} kN/m
        </text>
        <text x="110" y="42" textAnchor="middle" fontSize="8" fill="#777">
          근거: ASCE §3.1 / AWWA M11 Ch.5
        </text>
      </g>

      {/* H 치수선 */}
      <line x1={boxLeft - 20} y1={topY} x2={boxLeft - 20} y2={pipeY - pipeR}
            stroke="#003366" strokeWidth="1"/>
      <text x={boxLeft - 24} y={(topY + pipeY - pipeR)/2 + 4}
            textAnchor="middle" fontSize="9" fill="#003366"
            transform={`rotate(-90,${boxLeft - 24},${(topY + pipeY - pipeR)/2})`}>
        H={H.toFixed(2)}m
      </text>

      {/* Do 치수선 */}
      <line x1={pipeX - pipeR} y1={pipeY + pipeR + 12} x2={pipeX + pipeR} y2={pipeY + pipeR + 12}
            stroke="#003366" strokeWidth="1"/>
      <text x={pipeX} y={pipeY + pipeR + 24} textAnchor="middle" fontSize="9" fill="#003366">
        Do = {Do} mm
      </text>
    </svg>
  )
}
