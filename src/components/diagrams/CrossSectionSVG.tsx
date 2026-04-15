import React from 'react'

interface Props {
  Do: number       // mm
  H: number        // m (관정 매설깊이)
  t: number        // mm (관 두께)
  hasTraffic: boolean
  gwLevel: string  // 'below'|'bottom'|'center'|'top'|'surface'
  pavingDepth?: number  // m, 포장두께 기본 0.15
}

export default function CrossSectionSVG({
  Do = 610, H = 1.5, t = 8, hasTraffic = true,
  gwLevel = 'below', pavingDepth = 0.15
}: Props) {
  const W = 400
  const HH = 340
  const margin = 40

  // 도면 내 축척 계산
  const totalDepth = H + Do / 1000 + 0.5  // 여유
  const drawH = HH - margin * 2
  const scale = drawH / totalDepth  // px/m

  const topY = margin + 20  // 지표면 Y
  const paveH = pavingDepth * scale
  const paveY = topY + paveH
  const pipeTopY = topY + H * scale
  const pipeDoY = (Do / 1000) * scale
  const pipeCY = pipeTopY + pipeDoY / 2
  const pipeCX = W / 2
  const pipeR = pipeDoY / 2
  const pipeInnerR = pipeR - (t / 1000) * scale

  // 지하수위 Y
  const gwYMap: Record<string, number> = {
    below:   pipeTopY + pipeDoY + 30,
    bottom:  pipeTopY + pipeDoY,
    center:  pipeCY,
    top:     pipeTopY,
    surface: topY,
  }
  const gwY = gwYMap[gwLevel] ?? HH

  return (
    <svg width={W} height={HH} viewBox={`0 0 ${W} ${HH}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        {/* 토사 해칭 */}
        <pattern id="soil" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="#c8a96e"/>
          <circle cx="3" cy="3" r="1" fill="#8b6914" opacity="0.5"/>
          <circle cx="7" cy="7" r="1" fill="#8b6914" opacity="0.5"/>
        </pattern>
        {/* 포장 해칭 */}
        <pattern id="asphalt" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#555"/>
          <line x1="0" y1="4" x2="8" y2="4" stroke="#333" strokeWidth="0.5"/>
        </pattern>
        {/* 화살표 마커 */}
        <marker id="arrowDown" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
          <path d="M0,0 L3,6 L6,0" fill="#e67e22"/>
        </marker>
        <marker id="arrowDimEnd" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
          <path d="M0,3 L6,0 L6,6 Z" fill="#003366"/>
        </marker>
        <marker id="arrowDimStart" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto-start-reverse">
          <path d="M6,3 L0,0 L0,6 Z" fill="#003366"/>
        </marker>
      </defs>

      {/* 배경 */}
      <rect width={W} height={HH} fill="#f8faff" rx="8"/>

      {/* 제목 */}
      <text x={W/2} y={18} textAnchor="middle" fontSize="12" fontWeight="700" fill="#003366">
        매설 단면도
      </text>

      {/* 토사층 */}
      <rect x={margin} y={topY} width={W - margin*2} height={HH - topY - margin/2}
            fill="url(#soil)" rx="2"/>

      {/* 포장층 */}
      {hasTraffic && (
        <rect x={margin} y={topY} width={W - margin*2} height={paveH}
              fill="url(#asphalt)" rx="2"/>
      )}

      {/* 지표선 */}
      <line x1={margin} y1={topY} x2={W - margin} y2={topY}
            stroke="#555" strokeWidth="2.5"/>
      <text x={margin} y={topY - 5} fontSize="9" fill="#555">지표면</text>

      {/* DB-24 트럭 아이콘 */}
      {hasTraffic && (
        <g transform={`translate(${W/2 - 40}, ${topY - 38})`}>
          {/* 트럭 몸체 */}
          <rect x="10" y="15" width="55" height="18" fill="#2c3e50" rx="3"/>
          <rect x="0" y="20" width="18" height="13" fill="#34495e" rx="2"/>
          {/* 바퀴 */}
          <circle cx="18" cy="33" r="5" fill="#1a1a1a"/>
          <circle cx="48" cy="33" r="5" fill="#1a1a1a"/>
          <circle cx="62" cy="33" r="5" fill="#1a1a1a"/>
          {/* DB-24 라벨 */}
          <text x="32" y="28" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">DB-24</text>
        </g>
      )}

      {/* 차량하중 화살표 */}
      {hasTraffic && (
        <>
          <line x1={pipeCX - pipeR} y1={topY} x2={pipeCX - pipeR} y2={pipeTopY - 5}
                stroke="#e67e22" strokeWidth="1.5" strokeDasharray="3,2"/>
          <line x1={pipeCX + pipeR} y1={topY} x2={pipeCX + pipeR} y2={pipeTopY - 5}
                stroke="#e67e22" strokeWidth="1.5" strokeDasharray="3,2"/>
          <text x={pipeCX} y={pipeTopY - 8} textAnchor="middle" fontSize="8" fill="#e67e22">
            Prism 범위
          </text>
        </>
      )}

      {/* 토압 화살표 (Prism Load) */}
      {[0.2, 0.4, 0.6, 0.8].map((fr) => {
        const ax = pipeCX - pipeR + fr * pipeR * 2
        return (
          <line key={fr}
                x1={ax} y1={topY + 10} x2={ax} y2={pipeTopY - 2}
                stroke="#e67e22" strokeWidth="1.5" markerEnd="url(#arrowDown)"/>
        )
      })}

      {/* 관 외원 (토사 위) */}
      <circle cx={pipeCX} cy={pipeCY} r={pipeR}
              fill="#dce8f5" stroke="#003366" strokeWidth="2.5"/>
      {/* 관 내원 */}
      <circle cx={pipeCX} cy={pipeCY} r={pipeInnerR}
              fill="#a8d8ea" stroke="#003366" strokeWidth="1"/>
      {/* 관 두께 라벨 */}
      <text x={pipeCX + pipeR + 5} y={pipeCY + 4} fontSize="9" fill="#003366">
        t={t}mm
      </text>

      {/* 물 (내부) */}
      <circle cx={pipeCX} cy={pipeCY} r={pipeInnerR - 2}
              fill="#4fb3d8" opacity="0.4"/>
      <text x={pipeCX} y={pipeCY + 4} textAnchor="middle" fontSize="10" fill="#003366" fontWeight="600">
        ∅DN
      </text>

      {/* 지하수위선 */}
      {gwLevel !== 'below' && gwY < HH - 20 && (
        <g>
          <line x1={margin} y1={gwY} x2={W - margin} y2={gwY}
                stroke="#1a7abf" strokeWidth="1.5" strokeDasharray="6,3"/>
          <text x={margin + 2} y={gwY - 3} fontSize="8" fill="#1a7abf">수위 (G.W.L)</text>
          {/* 물결 표시 */}
          <path d={`M${margin},${gwY + 4} Q${margin+20},${gwY+1} ${margin+40},${gwY+4} Q${margin+60},${gwY+7} ${margin+80},${gwY+4}`}
                stroke="#1a7abf" strokeWidth="1" fill="none"/>
        </g>
      )}

      {/* 치수선: H */}
      <g>
        <line x1={margin - 18} y1={topY} x2={margin - 18} y2={pipeTopY}
              stroke="#003366" strokeWidth="1"
              markerStart="url(#arrowDimStart)" markerEnd="url(#arrowDimEnd)"/>
        <text x={margin - 22} y={(topY + pipeTopY) / 2 + 4}
              textAnchor="middle" fontSize="9" fill="#003366"
              transform={`rotate(-90, ${margin-22}, ${(topY+pipeTopY)/2})`}>
          H={H.toFixed(2)}m
        </text>
      </g>

      {/* 치수선: Do */}
      <g>
        <line x1={pipeCX - pipeR} y1={pipeCY + pipeR + 12}
              x2={pipeCX + pipeR} y2={pipeCY + pipeR + 12}
              stroke="#003366" strokeWidth="1"
              markerStart="url(#arrowDimStart)" markerEnd="url(#arrowDimEnd)"/>
        <text x={pipeCX} y={pipeCY + pipeR + 24}
              textAnchor="middle" fontSize="9" fill="#003366">
          Do={Do}mm
        </text>
      </g>

      {/* 범례 */}
      <g transform={`translate(${W - margin - 90}, ${topY + 10})`}>
        <rect x="0" y="0" width="88" height="58" fill="white" opacity="0.85" rx="4" stroke="#ccc"/>
        <rect x="6" y="8" width="12" height="10" fill="url(#asphalt)" rx="1"/>
        <text x="22" y="17" fontSize="8" fill="#333">아스콘 포장층</text>
        <rect x="6" y="22" width="12" height="10" fill="url(#soil)" rx="1"/>
        <text x="22" y="31" fontSize="8" fill="#333">토사층</text>
        <rect x="6" y="36" width="12" height="10" fill="#dce8f5" stroke="#003366" strokeWidth="1" rx="1"/>
        <text x="22" y="45" fontSize="8" fill="#333">매설관</text>
      </g>
    </svg>
  )
}
