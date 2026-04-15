import React from 'react'

interface Props {
  sigma: number   // MPa 현재 응력
  sigmaA: number  // MPa 허용응력
  Pd: number      // MPa 내압
  Do: number      // mm
  t: number       // mm
  label?: string
}

export default function HoopStressSVG({ sigma = 30.5, sigmaA = 117.5, Pd = 0.6, Do = 610, t = 8, label = '상시' }: Props) {
  const W = 380
  const HH = 280
  const cx = W / 2
  const cy = 135
  const R = 85
  const innerR = R - 18

  const ok = sigma <= sigmaA
  const color = ok ? '#1a7a3c' : '#c0392b'

  // 방사형 내압 화살표 8개
  const arrowCount = 8
  const arrowLen = 22

  return (
    <svg width={W} height={HH} viewBox={`0 0 ${W} ${HH}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <marker id="arrowBlue" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill="#1a7abf"/>
        </marker>
        <marker id="arrowRed" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill="#c0392b"/>
        </marker>
        <radialGradient id="waterGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4fb3d8" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#1a7abf" stopOpacity="0.3"/>
        </radialGradient>
      </defs>

      <rect width={W} height={HH} fill="#f8faff" rx="8"/>
      <text x={cx} y={18} textAnchor="middle" fontSize="12" fontWeight="700" fill="#003366">
        내압 Hoop Stress 방향도
      </text>

      {/* 관 단면 */}
      <circle cx={cx} cy={cy} r={R} fill="#dce8f5" stroke="#003366" strokeWidth="3"/>
      <circle cx={cx} cy={cy} r={innerR} fill="url(#waterGrad)" stroke="#003366" strokeWidth="1.5"/>

      {/* 내압 방사형 화살표 */}
      {Array.from({ length: arrowCount }).map((_, i) => {
        const angle = (i * 360) / arrowCount * (Math.PI / 180)
        const x1 = cx + Math.cos(angle) * (innerR - arrowLen - 4)
        const y1 = cy + Math.sin(angle) * (innerR - arrowLen - 4)
        const x2 = cx + Math.cos(angle) * (innerR - 4)
        const y2 = cy + Math.sin(angle) * (innerR - 4)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#1a7abf" strokeWidth="2" markerEnd="url(#arrowBlue)"/>
        )
      })}

      {/* 내압 라벨 */}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill="#003366" fontWeight="600">
        Pd = {Pd} MPa
      </text>

      {/* 원주방향 응력 화살표 (수평) */}
      <line x1={cx - R - 35} y1={cy} x2={cx - R - 10} y2={cy}
            stroke="#c0392b" strokeWidth="2.5" markerEnd="url(#arrowRed)"/>
      <line x1={cx + R + 35} y1={cy} x2={cx + R + 10} y2={cy}
            stroke="#c0392b" strokeWidth="2.5" markerStart="url(#arrowRed)"
            style={{ markerStart: 'none' }}/>
      {/* 오른쪽 화살표 반전 */}
      <line x1={cx + R + 10} y1={cy} x2={cx + R + 35} y2={cy}
            stroke="#c0392b" strokeWidth="2.5" markerEnd="url(#arrowRed)"/>

      <text x={cx - R - 40} y={cy - 8} textAnchor="middle" fontSize="9" fill="#c0392b">σ_hoop</text>
      <text x={cx + R + 40} y={cy - 8} textAnchor="middle" fontSize="9" fill="#c0392b">σ_hoop</text>

      {/* 수식 라벨 */}
      <g transform={`translate(${cx - 90}, ${cy + R + 10})`}>
        <rect x="0" y="0" width="180" height="52" rx="4"
              fill="#fffbf0" stroke="#e8c840" strokeWidth="1.5"/>
        <text x="90" y="16" textAnchor="middle" fontSize="9" fill="#003366">
          σ = P × D / (2t)
        </text>
        <text x="90" y="30" textAnchor="middle" fontSize="9" fill="#555">
          = {Pd}×{Do}/{(2*t).toFixed(0)} = {sigma.toFixed(1)} MPa
        </text>
        <text x="90" y="44" textAnchor="middle" fontSize="9" fill={color} fontWeight="700">
          허용: {sigmaA.toFixed(1)} MPa → {ok ? 'OK' : 'NG'}
        </text>
      </g>

      {/* 범례 */}
      <g transform={`translate(8, ${cy - 20})`}>
        <line x1="0" y1="8" x2="20" y2="8" stroke="#1a7abf" strokeWidth="2" markerEnd="url(#arrowBlue)"/>
        <text x="24" y="12" fontSize="8" fill="#555">내압</text>
        <line x1="0" y1="22" x2="20" y2="22" stroke="#c0392b" strokeWidth="2"/>
        <text x="24" y="26" fontSize="8" fill="#555">원주응력</text>
      </g>
    </svg>
  )
}
