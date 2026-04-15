import React from 'react'

interface Props {
  deflectionRatio: number  // % (현재 처짐율)
  maxDeflection: number    // % (허용 처짐율)
  Do: number               // mm
}

export default function DeflectionSVG({ deflectionRatio = 2.07, maxDeflection = 3.0, Do = 610 }: Props) {
  const W = 400
  const HH = 280
  const cx1 = 110
  const cx2 = 300
  const cy = 130
  const R = 75

  const ratio = deflectionRatio / 100
  // 처짐량 과장 표현 (실제값 × 10 배율)
  const exaggeration = 8
  const dV = R * ratio * exaggeration  // 수직 단축
  const dH = R * ratio * exaggeration * 0.5  // 수평 팽창

  const rxDefl = R + dH
  const ryDefl = R - dV

  // 색상 결정
  const pct = deflectionRatio / maxDeflection
  const color = pct >= 1.0 ? '#c0392b' : pct >= 0.8 ? '#e67e22' : '#1a7a3c'
  const status = pct >= 1.0 ? 'NG' : pct >= 0.8 ? '주의' : 'OK'

  return (
    <svg width={W} height={HH} viewBox={`0 0 ${W} ${HH}`} style={{ width: '100%', height: 'auto' }}>
      <rect width={W} height={HH} fill="#f8faff" rx="8"/>

      {/* 제목 */}
      <text x={W/2} y={18} textAnchor="middle" fontSize="12" fontWeight="700" fill="#003366">
        처짐 변형 개념도
      </text>

      {/* ── 좌: 원형 (하중 전) ── */}
      <text x={cx1} y={cy - R - 14} textAnchor="middle" fontSize="10" fill="#555" fontWeight="600">
        하중 전
      </text>
      <circle cx={cx1} cy={cy} r={R} fill="#dce8f5" stroke="#003366" strokeWidth="2"/>
      <line x1={cx1 - R} y1={cy} x2={cx1 + R} y2={cy} stroke="#003366" strokeWidth="1" strokeDasharray="4,2"/>
      <line x1={cx1} y1={cy - R} x2={cx1} y2={cy + R} stroke="#003366" strokeWidth="1" strokeDasharray="4,2"/>
      <text x={cx1} y={cy + 5} textAnchor="middle" fontSize="10" fill="#003366">∅{Do}</text>

      {/* 화살표 (하중) */}
      <g>
        {[-30, 0, 30].map((dx) => (
          <line key={dx}
                x1={cx1 + dx} y1={cy - R - 25} x2={cx1 + dx} y2={cy - R - 5}
                stroke="#e67e22" strokeWidth="2"
                markerEnd="url(#arrowOrangeD)"/>
        ))}
      </g>

      {/* ── 우: 타원 (하중 후) ── */}
      <text x={cx2} y={cy - R - 14} textAnchor="middle" fontSize="10" fill="#555" fontWeight="600">
        하중 후
      </text>
      <ellipse cx={cx2} cy={cy} rx={rxDefl} ry={ryDefl}
               fill="#fde8d8" stroke={color} strokeWidth="2.5"/>
      {/* 원래 형상 점선 */}
      <circle cx={cx2} cy={cy} r={R} fill="none" stroke="#003366" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.4"/>

      {/* ΔD 치수 표기 */}
      <line x1={cx2 + rxDefl + 12} y1={cy - ryDefl} x2={cx2 + rxDefl + 12} y2={cy - R}
            stroke="#c0392b" strokeWidth="1.5"/>
      <text x={cx2 + rxDefl + 22} y={(cy - ryDefl + cy - R) / 2 + 4}
            fontSize="9" fill="#c0392b">ΔD</text>

      {/* 수직 단축 화살표 */}
      <line x1={cx2} y1={cy - ryDefl} x2={cx2} y2={cy - R}
            stroke="#c0392b" strokeWidth="1.5" strokeDasharray="3,2"/>

      {/* 마커 */}
      <defs>
        <marker id="arrowOrangeD" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
          <path d="M0,0 L3,6 L6,0" fill="#e67e22"/>
        </marker>
      </defs>

      {/* 처짐율 게이지 바 */}
      <g transform={`translate(30, ${cy + R + 20})`}>
        <text x={0} y={12} fontSize="10" fill="#555">처짐율 ΔD/D</text>
        <rect x={0} y={18} width={340} height={14} rx="7" fill="#e0e0e0"/>
        <rect x={0} y={18}
              width={Math.min(340, (deflectionRatio / maxDeflection) * 340)}
              height={14} rx="7" fill={color}/>
        <text x={170} y={29} textAnchor="middle" fontSize="9" fill="white" fontWeight="700">
          {deflectionRatio.toFixed(2)}% / {maxDeflection}%
        </text>
        {/* 허용값 마커 */}
        <line x1={340} y1={16} x2={340} y2={34} stroke="#003366" strokeWidth="2"/>
        <text x={340} y={42} textAnchor="middle" fontSize="8" fill="#003366">허용</text>
        {/* 판정 */}
        <rect x={300} y={46} width={40} height={18} rx="9" fill={color}/>
        <text x={320} y={59} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">{status}</text>
      </g>
    </svg>
  )
}
