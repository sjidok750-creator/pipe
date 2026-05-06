// 차량하중 분포도 — 보고서 스타일 [그림 4.3.3-1] (캡션 제외)
// 좌: 정면도(단면)  우: 평면도
import React from 'react'

export function VehicleLoadSVG({
  width = 480,
  height = 210,
}: {
  width?: number
  height?: number
}) {
  const W = width
  const H = height

  // ── 패널 분할 ────────────────────────────────────────────────
  const divX  = Math.round(W * 0.50)
  const leftW = divX - 4
  const rightX = divX + 4
  const rightW = W - rightX

  const BG   = '#f4f4f4'   // 연회색 배경
  const LINE = '#333'
  const DASH = '#555'
  const DIM  = '#333'
  const LOAD = '#333'      // 하중 화살표
  const HATCH= '#888'

  // ══════════════════════════════════════════════════════════════
  // 좌측 — 정면도
  // ══════════════════════════════════════════════════════════════
  const lRoadY  = 62
  const lH_px   = 86
  const lPipeR  = 13
  const lCX     = Math.round(leftW * 0.48)

  const la_half   = 16
  const lTireL    = lCX - la_half
  const lTireR    = lCX + la_half

  const lPipeCrownY  = lRoadY + lH_px
  const lPipeCenterY = lPipeCrownY + lPipeR
  const lPipeInvertY = lPipeCenterY + lPipeR

  // tan45° → spread = h_px
  const lSpread  = lH_px
  const lDistL   = lTireL - lSpread
  const lDistR   = lTireR + lSpread

  // 포장 해칭 (도로면 위)
  const hatchTop: React.ReactNode[] = []
  for (let x = -8; x < leftW + 8; x += 10) {
    hatchTop.push(
      <line key={x}
        x1={x} y1={lRoadY} x2={Math.max(0, x - 10)} y2={lRoadY - 10}
        stroke={HATCH} strokeWidth={0.9} clipPath="url(#lv-clip-top)" />
    )
  }

  // 관 하부 해칭
  const hatchBot: React.ReactNode[] = []
  for (let x = -8; x < leftW + 8; x += 10) {
    hatchBot.push(
      <line key={x}
        x1={x} y1={lPipeInvertY + 2}
        x2={Math.max(0, x - 10)} y2={lPipeInvertY + 12}
        stroke={HATCH} strokeWidth={0.9} clipPath="url(#lv-clip-bot)" />
    )
  }

  // Wm 분포 화살표 (관 상단)
  const nArrL = 9
  const wmArrows: React.ReactNode[] = []
  for (let i = 0; i < nArrL; i++) {
    const ax = lDistL + (lDistR - lDistL) * (i + 0.5) / nArrL
    wmArrows.push(
      <line key={i}
        x1={ax} y1={lPipeCrownY - 14}
        x2={ax} y2={lPipeCrownY - 2}
        stroke={LOAD} strokeWidth={1.3}
        markerEnd="url(#lv-dn)" />
    )
  }

  // ══════════════════════════════════════════════════════════════
  // 우측 — 평면도
  // ══════════════════════════════════════════════════════════════
  const rTopY  = 28
  const rBotY  = H - 16
  const rMidY  = (rTopY + rBotY) / 2
  const rSpacing = Math.round((rBotY - rTopY) / 3.8)

  // 관 중심 Y (3개)
  const rPipeYs = [rMidY - rSpacing, rMidY, rMidY + rSpacing]
  const rRx = Math.round(rightW * 0.36)  // 타원 가로 반경
  const rRy = Math.round(rSpacing * 0.38) // 타원 세로 반경
  const rCX = rightX + Math.round(rightW / 2)

  // C 치수선 좌우
  const rCL = rightX + 10
  const rCR = rightX + rightW - 10

  // 하중 화살표 (위에서 아래, 상단 도로면 ~ 첫번째 관 상단)
  const nArrR = 6
  const rArrTopY = rTopY + 4
  const rArrBotY = rPipeYs[0] - rRy - 3
  const rArrows: React.ReactNode[] = []
  for (let i = 0; i < nArrR; i++) {
    const ax = rCL + (rCR - rCL) * (i + 0.5) / nArrR
    rArrows.push(
      <line key={i}
        x1={ax} y1={rArrTopY}
        x2={ax} y2={rArrBotY}
        stroke={LOAD} strokeWidth={1.3}
        markerEnd="url(#lv-dn)" />
    )
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif", background: BG }}>
      <defs>
        {/* 아래 화살표 */}
        <marker id="lv-dn" markerWidth="5" markerHeight="5" refX="2.5" refY="5" orient="auto">
          <polygon points="0,0 5,0 2.5,5" fill={LOAD} />
        </marker>
        {/* 치수 양방향 */}
        <marker id="lv-dim" markerWidth="6" markerHeight="5" refX="0.5" refY="2.5" orient="auto-start-reverse">
          <polygon points="0,0 6,2.5 0,5" fill={DIM} />
        </marker>
        {/* 오른쪽 화살표 */}
        <marker id="lv-rt" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0,0 5,2.5 0,5" fill={LOAD} />
        </marker>
        {/* 해칭 clip */}
        <clipPath id="lv-clip-top">
          <rect x={0} y={0} width={leftW} height={lRoadY} />
        </clipPath>
        <clipPath id="lv-clip-bot">
          <rect x={0} y={lPipeInvertY + 2} width={leftW} height={H} />
        </clipPath>
      </defs>

      {/* ══════════════════════════════════════════════════════════
          좌측 정면도
          ══════════════════════════════════════════════════════════ */}

      {/* 포장 해칭 */}
      {hatchTop}
      {/* 도로 표면선 */}
      <line x1={0} y1={lRoadY} x2={leftW} y2={lRoadY} stroke={LINE} strokeWidth={1.8} />

      {/* 타이어 (원형) */}
      <circle cx={lCX} cy={lRoadY - 13} r={12}
        fill={BG} stroke={LINE} strokeWidth={1.5} />

      {/* Pm 화살표 (타이어 위 → 타이어 상단) */}
      <line x1={lCX} y1={lRoadY - 44}
            x2={lCX} y2={lRoadY - 25}
        stroke={LOAD} strokeWidth={1.8}
        markerEnd="url(#lv-dn)" />

      {/* a 치수선 (타이어 접지폭, 도로면) */}
      <line x1={lTireL} y1={lRoadY + 8}
            x2={lTireR} y2={lRoadY + 8}
        stroke={DIM} strokeWidth={0.9}
        markerStart="url(#lv-dim)" markerEnd="url(#lv-dim)" />
      <line x1={lTireL} y1={lRoadY + 4} x2={lTireL} y2={lRoadY + 12} stroke={DIM} strokeWidth={0.8} />
      <line x1={lTireR} y1={lRoadY + 4} x2={lTireR} y2={lRoadY + 12} stroke={DIM} strokeWidth={0.8} />
      <text x={lCX} y={lRoadY + 20}
        fontSize={10} fill={DIM} textAnchor="middle" fontStyle="italic">a</text>

      {/* 45° 분포선 (점선) */}
      <line x1={lTireL} y1={lRoadY} x2={lDistL} y2={lPipeCrownY}
        stroke={DASH} strokeWidth={1.1} strokeDasharray="5,3" />
      <line x1={lTireR} y1={lRoadY} x2={lDistR} y2={lPipeCrownY}
        stroke={DASH} strokeWidth={1.1} strokeDasharray="5,3" />

      {/* θ 각도 호 */}
      <path d={`M ${lTireR},${lRoadY + 20} A 20,20 0 0 1 ${lTireR + 20 * Math.sin(Math.PI / 4)},${lRoadY + 20 * (1 - Math.cos(Math.PI / 4))}`}
        fill="none" stroke={DIM} strokeWidth={0.9} />
      <text x={lTireR + 12} y={lRoadY + 24}
        fontSize={9} fill={DIM} fontStyle="italic">θ</text>

      {/* h 치수선 (우측) */}
      {(() => {
        const hx = leftW - 18
        return <>
          <line x1={hx} y1={lRoadY} x2={hx} y2={lPipeCrownY}
            stroke={DIM} strokeWidth={0.9}
            markerStart="url(#lv-dim)" markerEnd="url(#lv-dim)" />
          <line x1={hx - 5} y1={lRoadY}      x2={hx + 5} y2={lRoadY}      stroke={DIM} strokeWidth={0.8} />
          <line x1={hx - 5} y1={lPipeCrownY} x2={hx + 5} y2={lPipeCrownY} stroke={DIM} strokeWidth={0.8} />
          <text x={hx + 8} y={(lRoadY + lPipeCrownY) / 2}
            fontSize={11} fill={DIM} fontStyle="italic" dominantBaseline="middle">h</text>
        </>
      })()}

      {/* Wm 분포 화살표 */}
      {wmArrows}

      {/* 관 하부 해칭 */}
      <line x1={0} y1={lPipeInvertY + 2} x2={leftW} y2={lPipeInvertY + 2} stroke={LINE} strokeWidth={1.5} />
      {hatchBot}

      {/* a+2h·tanθ 치수선 (하단) */}
      <line x1={lDistL} y1={lPipeCrownY + 6}
            x2={lDistR} y2={lPipeCrownY + 6}
        stroke={DIM} strokeWidth={0.9}
        markerStart="url(#lv-dim)" markerEnd="url(#lv-dim)" />
      <line x1={lDistL} y1={lPipeCrownY + 2} x2={lDistL} y2={lPipeCrownY + 10} stroke={DIM} strokeWidth={0.8} />
      <line x1={lDistR} y1={lPipeCrownY + 2} x2={lDistR} y2={lPipeCrownY + 10} stroke={DIM} strokeWidth={0.8} />
      <text x={(lDistL + lDistR) / 2} y={lPipeCrownY + 22}
        fontSize={9} fill={DIM} textAnchor="middle">a+2h·tan θ</text>

      {/* 관 단면 (원 2겹) */}
      <circle cx={lCX} cy={lPipeCenterY} r={lPipeR + 3}
        fill={BG} stroke={LINE} strokeWidth={1.5} />
      <circle cx={lCX} cy={lPipeCenterY} r={lPipeR - 3}
        fill={BG} stroke={LINE} strokeWidth={0.9} />

      {/* ══════════════════════════════════════════════════════════
          우측 평면도
          ══════════════════════════════════════════════════════════ */}

      {/* 상단 해칭 경계 */}
      {Array.from({ length: Math.ceil(rightW / 10) + 2 }, (_, i) => (
        <line key={'ht' + i}
          x1={rightX + i * 10} y1={rTopY}
          x2={rightX + i * 10 - 10} y2={rTopY - 10}
          stroke={HATCH} strokeWidth={0.9} />
      ))}
      <line x1={rightX} y1={rTopY} x2={rightX + rightW} y2={rTopY} stroke={LINE} strokeWidth={1.8} />

      {/* 하단 해칭 경계 */}
      {Array.from({ length: Math.ceil(rightW / 10) + 2 }, (_, i) => (
        <line key={'hb' + i}
          x1={rightX + i * 10} y1={rBotY}
          x2={rightX + i * 10 - 10} y2={rBotY + 10}
          stroke={HATCH} strokeWidth={0.9} />
      ))}
      <line x1={rightX} y1={rBotY} x2={rightX + rightW} y2={rBotY} stroke={LINE} strokeWidth={1.8} />

      {/* C 치수선 (상단) */}
      <line x1={rCL} y1={rTopY - 14} x2={rCR} y2={rTopY - 14}
        stroke={DIM} strokeWidth={0.9}
        markerStart="url(#lv-dim)" markerEnd="url(#lv-dim)" />
      <line x1={rCL} y1={rTopY - 18} x2={rCL} y2={rTopY - 10} stroke={DIM} strokeWidth={0.8} />
      <line x1={rCR} y1={rTopY - 18} x2={rCR} y2={rTopY - 10} stroke={DIM} strokeWidth={0.8} />
      <text x={(rCL + rCR) / 2} y={rTopY - 20}
        fontSize={12} fill={DIM} textAnchor="middle" fontStyle="italic" fontWeight="bold">C</text>

      {/* 하중 화살표 (위→아래) */}
      {rArrows}

      {/* 관 (평면도 — 세로 긴 타원) */}
      {rPipeYs.map((py, idx) => (
        <g key={idx}>
          {/* 관 외곽 */}
          <ellipse cx={rCX} cy={py} rx={rRx} ry={rRy}
            fill={BG} stroke={LINE} strokeWidth={1.5} />
          {/* 관 내경 (점선) */}
          <ellipse cx={rCX} cy={py} rx={rRx - 6} ry={rRy - 4}
            fill={BG} stroke={LINE} strokeWidth={0.8} strokeDasharray="4,3" />
          {/* 중심선 (수평 점선) */}
          <line x1={rightX + 2} y1={py} x2={rightX + rightW - 2} y2={py}
            stroke={DASH} strokeWidth={0.7} strokeDasharray="8,4,2,4" />
        </g>
      ))}
    </svg>
  )
}
