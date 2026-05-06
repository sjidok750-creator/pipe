// 차량하중 분포도 — 기준서 [그림 4.3.3-1] 재현
// 좌: 정면도(단면) — Pm → 45°분포 → a+2h·tanθ → 관단면
// 우: 평면도 — C(점유폭) → 관축방향 하중 분포
import React from 'react'

export function VehicleLoadSVG({
  width = 480,
  height = 220,
}: {
  width?: number
  height?: number
}) {
  const W = width
  const H = height

  // ── 좌/우 패널 분할 ─────────────────────────────────────────
  const divX   = Math.round(W * 0.52)   // 구분선 X
  const leftW  = divX - 6
  const rightW = W - divX - 4
  const rightX = divX + 6               // 우측 패널 시작

  // ── 색상 ────────────────────────────────────────────────────
  const C_LOAD  = '#555'      // 하중 화살표 — 회색 (기준서 스타일)
  const C_DIM   = '#222'      // 치수선
  const C_LINE  = '#222'      // 외곽선
  const C_DASH  = '#555'      // 점선
  const C_HATCH = '#888'      // 해칭

  // ══════════════════════════════════════════════════════════════
  // 좌측 — 정면도 (단면)
  // ══════════════════════════════════════════════════════════════
  const lRoadY   = 58          // 도로면 Y
  const lH_px    = 90          // 토피 시각적 높이
  const lPipeR   = 14          // 관 반경 (단면)
  const lCX      = Math.round(leftW * 0.50)  // 관 중심 X (좌 패널 기준)

  const la_half    = 18         // 접지폭 a/2
  const lTireL     = lCX - la_half
  const lTireR     = lCX + la_half
  const lTireH     = 16         // 타이어 높이

  const lPipeCrownY  = lRoadY + lH_px
  const lPipeCenterY = lPipeCrownY + lPipeR
  const lPipeInvertY = lPipeCenterY + lPipeR

  // θ=45° → spread = lH_px
  const lSpread   = lH_px
  const lDistL    = lTireL - lSpread
  const lDistR    = lTireR + lSpread

  // 포장 해칭 (도로면 위 좌측)
  const hatchLinesL: React.ReactNode[] = []
  for (let x = -8; x < leftW + 8; x += 10) {
    hatchLinesL.push(
      <line key={x}
        x1={x} y1={lRoadY}
        x2={Math.max(0, x - 10)} y2={lRoadY - 10}
        stroke={C_HATCH} strokeWidth={0.9} />
    )
  }

  // 관 하부 해칭
  const hatchLinesLB: React.ReactNode[] = []
  for (let x = -8; x < leftW + 8; x += 10) {
    hatchLinesLB.push(
      <line key={x}
        x1={x} y1={lPipeInvertY + 2}
        x2={Math.max(0, x - 10)} y2={lPipeInvertY + 12}
        stroke={C_HATCH} strokeWidth={0.9} />
    )
  }

  // Wm 하중 화살표 (관 상단)
  const wmArrowsL: React.ReactNode[] = []
  const nArrL = 7
  for (let i = 0; i < nArrL; i++) {
    const ax = lDistL + (lDistR - lDistL) * (i + 0.5) / nArrL
    wmArrowsL.push(
      <line key={i}
        x1={ax} y1={lPipeCrownY - 16}
        x2={ax} y2={lPipeCrownY - 2}
        stroke={C_LOAD} strokeWidth={1.4}
        markerEnd="url(#lv-arr-down)" />
    )
  }

  // ══════════════════════════════════════════════════════════════
  // 우측 — 평면도
  // ══════════════════════════════════════════════════════════════
  const rTopY   = 30           // 상단 도로 경계
  const rBotY   = H - 30       // 하단 도로 경계
  const rMidY   = (rTopY + rBotY) / 2
  const rPipeSpacing = 32      // 관 간격 (평면)
  const rPipeR  = 11           // 평면도 관 반경

  // 관 중심들 (평면 — 3개)
  const rPipes  = [-rPipeSpacing, 0, rPipeSpacing].map(dy => rMidY + dy)

  // C 치수선 위치
  const rCLeft  = rightX + 18
  const rCRight = rightX + rightW - 18

  // 하중 화살표 (위에서 아래로 — 관 상단에 분포)
  const wmArrowsR: React.ReactNode[] = []
  const nArrR = 5
  const rArrTop = rTopY + 4
  const rArrBot = rMidY - rPipeR - 2  // 첫 번째 관 상단까지
  for (let i = 0; i < nArrR; i++) {
    const ax = rCLeft + (rCRight - rCLeft) * (i + 0.5) / nArrR
    wmArrowsR.push(
      <line key={i}
        x1={ax} y1={rArrTop}
        x2={ax} y2={rArrBot}
        stroke={C_LOAD} strokeWidth={1.4}
        markerEnd="url(#lv-arr-down)" />
    )
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', fontFamily: "'JetBrains Mono', 'Malgun Gothic', sans-serif", background: '#fff' }}>
      <defs>
        {/* 아래 화살표 */}
        <marker id="lv-arr-down" markerWidth="5" markerHeight="5" refX="2.5" refY="5" orient="auto">
          <polygon points="0,0 5,0 2.5,5" fill={C_LOAD} />
        </marker>
        {/* 치수 양방향 화살표 */}
        <marker id="lv-dim" markerWidth="6" markerHeight="5" refX="0.5" refY="2.5" orient="auto-start-reverse">
          <polygon points="0,0 6,2.5 0,5" fill={C_DIM} />
        </marker>
        {/* 위 화살표 (Pm) */}
        <marker id="lv-arr-up" markerWidth="5" markerHeight="5" refX="2.5" refY="0" orient="auto">
          <polygon points="0,5 5,5 2.5,0" fill={C_LOAD} />
        </marker>
      </defs>

      {/* ══════════════════════════════════════════════════════════
          좌측 패널 — 정면도
          ══════════════════════════════════════════════════════════ */}

      {/* 도로면 위 해칭 */}
      {hatchLinesL}
      {/* 도로 표면선 */}
      <line x1={0} y1={lRoadY} x2={leftW} y2={lRoadY} stroke={C_LINE} strokeWidth={1.8} />

      {/* 타이어 (동그라미 — 기준서 스타일) */}
      <circle cx={lCX} cy={lRoadY - 12} r={11}
        fill="#eee" stroke={C_LINE} strokeWidth={1.4} />

      {/* Pm 하중 화살표 (타이어 위) */}
      <line x1={lCX} y1={lRoadY - 38}
            x2={lCX} y2={lRoadY - 23}
        stroke={C_LOAD} strokeWidth={1.8}
        markerEnd="url(#lv-arr-down)" />

      {/* a 치수선 (타이어 하단 접지폭) */}
      <line x1={lTireL} y1={lRoadY - 2}
            x2={lTireR} y2={lRoadY - 2}
        stroke={C_DIM} strokeWidth={0.9}
        markerStart="url(#lv-dim)" markerEnd="url(#lv-dim)" />
      <text x={lCX} y={lRoadY + 10}
        fontSize={9} fill={C_DIM} textAnchor="middle" fontStyle="italic">a</text>

      {/* 45° 분포선 (점선) */}
      <line x1={lTireL} y1={lRoadY} x2={lDistL} y2={lPipeCrownY}
        stroke={C_DASH} strokeWidth={1} strokeDasharray="4,3" />
      <line x1={lTireR} y1={lRoadY} x2={lDistR} y2={lPipeCrownY}
        stroke={C_DASH} strokeWidth={1} strokeDasharray="4,3" />

      {/* θ 각도 표시 */}
      <path d={`M ${lTireR},${lRoadY + 22} A 22,22 0 0 1 ${lTireR + 22 * Math.sin(Math.PI / 4)},${lRoadY + 22 * (1 - Math.cos(Math.PI / 4))}`}
        fill="none" stroke={C_DIM} strokeWidth={0.9} />
      <text x={lTireR + 14} y={lRoadY + 22}
        fontSize={9} fill={C_DIM} fontStyle="italic">θ</text>

      {/* h 치수선 (우측) */}
      <line x1={leftW - 20} y1={lRoadY} x2={leftW - 20} y2={lPipeCrownY}
        stroke={C_DIM} strokeWidth={0.9}
        markerStart="url(#lv-dim)" markerEnd="url(#lv-dim)" />
      <line x1={leftW - 25} y1={lRoadY}      x2={leftW - 15} y2={lRoadY}      stroke={C_DIM} strokeWidth={0.8} />
      <line x1={leftW - 25} y1={lPipeCrownY} x2={leftW - 15} y2={lPipeCrownY} stroke={C_DIM} strokeWidth={0.8} />
      <text x={leftW - 10} y={(lRoadY + lPipeCrownY) / 2}
        fontSize={10} fill={C_DIM} fontStyle="italic" dominantBaseline="middle">h</text>

      {/* Wm 분포하중 화살표 */}
      {wmArrowsL}

      {/* 관 하부 해칭 (관 아래) */}
      <line x1={0} y1={lPipeInvertY + 2} x2={leftW} y2={lPipeInvertY + 2} stroke={C_LINE} strokeWidth={1.2} />
      {hatchLinesLB}

      {/* a+2h·tanθ 치수선 (하단) */}
      <line x1={lDistL} y1={lPipeCrownY + 6} x2={lDistR} y2={lPipeCrownY + 6}
        stroke={C_DIM} strokeWidth={0.9}
        markerStart="url(#lv-dim)" markerEnd="url(#lv-dim)" />
      <line x1={lDistL}  y1={lPipeCrownY + 2} x2={lDistL}  y2={lPipeCrownY + 10} stroke={C_DIM} strokeWidth={0.8} />
      <line x1={lDistR}  y1={lPipeCrownY + 2} x2={lDistR}  y2={lPipeCrownY + 10} stroke={C_DIM} strokeWidth={0.8} />
      <text x={(lDistL + lDistR) / 2} y={lPipeCrownY + 22}
        fontSize={9} fill={C_DIM} textAnchor="middle" fontStyle="italic">
        a+2h·tan θ
      </text>

      {/* 관 단면 (원) */}
      <circle cx={lCX} cy={lPipeCenterY} r={lPipeR + 3}
        fill="#f0f0f0" stroke={C_LINE} strokeWidth={1.6} />
      <circle cx={lCX} cy={lPipeCenterY} r={lPipeR - 3}
        fill="white" stroke={C_LINE} strokeWidth={0.8} />

      {/* ══════════════════════════════════════════════════════════
          우측 패널 — 평면도
          ══════════════════════════════════════════════════════════ */}

      {/* 구분 수직선 */}
      <line x1={divX} y1={10} x2={divX} y2={H - 10}
        stroke="#ccc" strokeWidth={0.8} strokeDasharray="4,3" />

      {/* 도로 경계 (상/하 — 해칭) */}
      {/* 상단 해칭 */}
      {Array.from({ length: Math.ceil(rightW / 10) + 2 }, (_, i) => (
        <line key={'ht' + i}
          x1={rightX + i * 10} y1={rTopY}
          x2={rightX + i * 10 - 10} y2={rTopY - 10}
          stroke={C_HATCH} strokeWidth={0.9} />
      ))}
      <line x1={rightX} y1={rTopY} x2={rightX + rightW} y2={rTopY} stroke={C_LINE} strokeWidth={1.6} />

      {/* 하단 해칭 */}
      {Array.from({ length: Math.ceil(rightW / 10) + 2 }, (_, i) => (
        <line key={'hb' + i}
          x1={rightX + i * 10} y1={rBotY}
          x2={rightX + i * 10 - 10} y2={rBotY + 10}
          stroke={C_HATCH} strokeWidth={0.9} />
      ))}
      <line x1={rightX} y1={rBotY} x2={rightX + rightW} y2={rBotY} stroke={C_LINE} strokeWidth={1.6} />

      {/* C 치수선 (상단) */}
      <line x1={rCLeft} y1={rTopY - 14} x2={rCRight} y2={rTopY - 14}
        stroke={C_DIM} strokeWidth={0.9}
        markerStart="url(#lv-dim)" markerEnd="url(#lv-dim)" />
      <line x1={rCLeft}  y1={rTopY - 18} x2={rCLeft}  y2={rTopY - 10} stroke={C_DIM} strokeWidth={0.8} />
      <line x1={rCRight} y1={rTopY - 18} x2={rCRight} y2={rTopY - 10} stroke={C_DIM} strokeWidth={0.8} />
      <text x={(rCLeft + rCRight) / 2} y={rTopY - 20}
        fontSize={11} fill={C_DIM} textAnchor="middle" fontStyle="italic" fontWeight="bold">C</text>

      {/* 관 (평면도 — 타원/원통) */}
      {rPipes.map((py, idx) => (
        <g key={idx}>
          {/* 관 외곽 (타원) */}
          <ellipse cx={(rCLeft + rCRight) / 2} cy={py} rx={(rCRight - rCLeft) / 2 - 2} ry={rPipeR}
            fill="#f0f0f0" stroke={C_LINE} strokeWidth={1.4} />
          {/* 관 내경 (점선) */}
          <ellipse cx={(rCLeft + rCRight) / 2} cy={py} rx={(rCRight - rCLeft) / 2 - 8} ry={rPipeR - 4}
            fill="white" stroke={C_LINE} strokeWidth={0.8} strokeDasharray="4,3" />
          {/* 관축 중심선 */}
          <line x1={rightX + 4} y1={py} x2={rightX + rightW - 4} y2={py}
            stroke={C_DASH} strokeWidth={0.8} strokeDasharray="8,4,2,4" />
        </g>
      ))}

      {/* 하중 화살표 (위에서 아래로 — 오른쪽 기준) */}
      {wmArrowsR}

      {/* ── 캡션 ── */}
      <text x={W / 2} y={H - 5}
        fontSize={9.5} fill="#333" textAnchor="middle">
        [그림 4.3.3-1]  차량하중 분포도
      </text>
    </svg>
  )
}
