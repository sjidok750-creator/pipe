// 차량하중 분포각 개념도 — 내진성능 평가요령 부록C 해설식(5.3.3)
// Wm = 2·Pm·D / (C·(a+2h·tanθ)) × (1+i)
import React from 'react'
import { T } from '../tokens'

export function VehicleLoadSVG({
  width = 380, height = 215,
}: {
  width?: number
  height?: number
}) {
  const W = width, H = height

  // ── 레이아웃 상수 ────────────────────────────────────────────
  const roadY   = 54
  const tireH   = 18   // 타이어 높이 (도로 위)
  const h_px    = 104  // 토피 h 시각적 높이
  const pipeR   = 15
  const cx      = Math.round(W * 0.487)  // 관 중심 X

  const a_half      = 20   // 반접지폭 (시각적)
  const tireLeft    = cx - a_half
  const tireRight   = cx + a_half

  const pipeCrownY  = roadY + h_px
  const pipeCenterY = pipeCrownY + pipeR
  const pipeInvertY = pipeCenterY + pipeR

  // θ=45° → spread = h_px
  const spread   = h_px
  const distLeft  = tireLeft - spread
  const distRight = tireRight + spread

  // ── 색상 ────────────────────────────────────────────────────
  const clrLoad = '#c45520'   // 하중 (주황)
  const clrDim  = '#2a5280'   // 치수선 (파랑)
  const clrPipe = '#2a6ab0'   // 관 (파랑)
  const clrSoil = '#b8a888'   // 지반 (황갈)
  const clrRoad = '#444'      // 도로선
  const clrAngle= '#607080'   // 각도

  // ── 포장 사선 (도로면 위) ────────────────────────────────────
  const paveLines: React.ReactNode[] = []
  for (let x = -10; x < W + 10; x += 14) {
    paveLines.push(
      <line key={x}
        x1={x} y1={roadY}
        x2={Math.max(0, x - 12)} y2={roadY - 12}
        stroke="#999" strokeWidth={0.9} />,
    )
  }

  // ── Wm 하중 화살표 (관 상단) ────────────────────────────────
  const wmArrows: React.ReactNode[] = []
  const nArr = 8
  for (let i = 0; i < nArr; i++) {
    const ax = distLeft + (distRight - distLeft) * (i + 0.5) / nArr
    wmArrows.push(
      <line key={i}
        x1={ax} y1={pipeCrownY - 13}
        x2={ax} y2={pipeCrownY - 1}
        stroke={clrLoad} strokeWidth={1.6}
        markerEnd="url(#arr-load-d)" />,
    )
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', fontFamily: 'sans-serif' }}>
      <defs>
        {/* 하중 화살표 (아래방향) */}
        <marker id="arr-load-d" markerWidth="6" markerHeight="5" refX="3" refY="5" orient="auto">
          <polygon points="0,0 6,0 3,5" fill={clrLoad} />
        </marker>
        {/* 치수선 화살표 (양방향 공용 — auto-start-reverse 사용) */}
        <marker id="arr-dim" markerWidth="6" markerHeight="5" refX="0.5" refY="2.5" orient="auto-start-reverse">
          <polygon points="0,0 6,2.5 0,5" fill={clrDim} />
        </marker>
        {/* 지반 해칭 패턴 */}
        <pattern id="soil-hatch" patternUnits="userSpaceOnUse" width="10" height="10">
          <line x1="0" y1="10" x2="10" y2="0" stroke={clrSoil} strokeWidth={1} />
        </pattern>
        {/* 분포 영역 패턴 */}
        <pattern id="load-zone" patternUnits="userSpaceOnUse" width="8" height="8">
          <line x1="0" y1="0" x2="8" y2="8" stroke={clrLoad} strokeWidth={0.5} strokeOpacity="0.35" />
        </pattern>
      </defs>

      {/* ── 지반 토층 배경 ─────────────────────────────────── */}
      <rect x={0} y={roadY} width={W} height={pipeCrownY - roadY}
        fill="url(#soil-hatch)" opacity={0.5} />
      <rect x={0} y={pipeInvertY} width={W} height={H - pipeInvertY}
        fill="url(#soil-hatch)" opacity={0.5} />

      {/* ── 하중 분포 영역 (사다리꼴) ─────────────────────── */}
      <polygon
        points={`${tireLeft},${roadY} ${tireRight},${roadY} ${distRight},${pipeCrownY} ${distLeft},${pipeCrownY}`}
        fill="url(#load-zone)" />
      <polygon
        points={`${tireLeft},${roadY} ${tireRight},${roadY} ${distRight},${pipeCrownY} ${distLeft},${pipeCrownY}`}
        fill={clrLoad} fillOpacity={0.07}
        stroke={clrLoad} strokeWidth={1.3} strokeDasharray="5,3" />

      {/* ── 도로 포장 사선 ─────────────────────────────────── */}
      {paveLines}
      {/* 도로 표면선 */}
      <line x1={0} y1={roadY} x2={W} y2={roadY} stroke={clrRoad} strokeWidth={2} />

      {/* ── 타이어 (도로면 위) ─────────────────────────────── */}
      {/* 외곽 */}
      <rect x={tireLeft} y={roadY - tireH} width={a_half * 2} height={tireH}
        rx={4} fill="#222" />
      {/* 트레드 표현 */}
      <rect x={tireLeft + 3} y={roadY - tireH + 2} width={a_half * 2 - 6} height={tireH - 5}
        rx={2} fill="#444" />
      {/* 접지면 강조 */}
      <rect x={tireLeft} y={roadY - 4} width={a_half * 2} height={4}
        fill="#111" />

      {/* ── Pm 하중 화살표 ─────────────────────────────────── */}
      <line
        x1={cx} y1={roadY - tireH - 26}
        x2={cx} y2={roadY - tireH - 1}
        stroke={clrLoad} strokeWidth={2.8}
        markerEnd="url(#arr-load-d)" />
      <text x={cx + 6} y={roadY - tireH - 14}
        fontSize={13} fill={clrLoad} fontWeight="bold" dominantBaseline="middle">Pm</text>

      {/* ── a 접지폭 치수선 ────────────────────────────────── */}
      {/* 수평 치수선 (타이어 위) */}
      <line x1={tireLeft} y1={roadY - tireH - 12}
            x2={tireRight} y2={roadY - tireH - 12}
        stroke={clrDim} strokeWidth={1}
        markerStart="url(#arr-dim)" markerEnd="url(#arr-dim)" />
      {/* 끝선 */}
      <line x1={tireLeft}  y1={roadY - tireH - 16} x2={tireLeft}  y2={roadY - tireH - 8} stroke={clrDim} strokeWidth={0.8} />
      <line x1={tireRight} y1={roadY - tireH - 16} x2={tireRight} y2={roadY - tireH - 8} stroke={clrDim} strokeWidth={0.8} />
      <text x={cx} y={roadY - tireH - 22}
        fontSize={10} fill={clrDim} textAnchor="middle" fontStyle="italic">a</text>

      {/* ── 45° 분포각 호 + 레이블 ─────────────────────────── */}
      {/* 수직 기준선 */}
      <line x1={tireRight} y1={roadY} x2={tireRight} y2={roadY + 36}
        stroke={clrAngle} strokeWidth={0.9} strokeDasharray="3,2" />
      {/* 45° 호 */}
      <path
        d={`M ${tireRight},${roadY + 30} A 30,30 0 0 1 ${tireRight + 30 * Math.sin(Math.PI / 4)},${roadY + 30 * Math.cos(Math.PI / 4)}`}
        fill="none" stroke={clrAngle} strokeWidth={1.1} />
      <text x={tireRight + 16} y={roadY + 28}
        fontSize={9.5} fill={clrAngle}>θ = 45°</text>

      {/* ── h 토피 치수선 (우측) ───────────────────────────── */}
      <line x1={W - 32} y1={roadY}      x2={W - 32} y2={pipeCrownY}
        stroke={clrDim} strokeWidth={1}
        markerStart="url(#arr-dim)" markerEnd="url(#arr-dim)" />
      {/* 끝선 */}
      <line x1={W - 38} y1={roadY}      x2={W - 26} y2={roadY}      stroke={clrDim} strokeWidth={0.8} />
      <line x1={W - 38} y1={pipeCrownY} x2={W - 26} y2={pipeCrownY} stroke={clrDim} strokeWidth={0.8} />
      <text x={W - 20} y={(roadY + pipeCrownY) / 2 - 6}
        fontSize={11} fill={clrDim} fontStyle="italic" dominantBaseline="middle">h</text>
      <text x={W - 20} y={(roadY + pipeCrownY) / 2 + 8}
        fontSize={8} fill={clrDim} dominantBaseline="middle">(토피)</text>

      {/* ── 분포선 (45°) ───────────────────────────────────── */}
      <line x1={tireLeft}  y1={roadY} x2={distLeft}  y2={pipeCrownY} stroke="#999" strokeWidth={1.3} />
      <line x1={tireRight} y1={roadY} x2={distRight} y2={pipeCrownY} stroke="#999" strokeWidth={1.3} />

      {/* ── Wm 분포하중 화살표 ─────────────────────────────── */}
      {wmArrows}
      <text x={distLeft + 4} y={pipeCrownY - 17}
        fontSize={10} fill={clrLoad} fontWeight="bold">Wm [kN/m]</text>

      {/* ── 관저면 분포폭 치수선 ───────────────────────────── */}
      <line x1={distLeft} y1={pipeCrownY + 5} x2={distRight} y2={pipeCrownY + 5}
        stroke={clrDim} strokeWidth={1}
        markerStart="url(#arr-dim)" markerEnd="url(#arr-dim)" />
      <line x1={distLeft}  y1={pipeCrownY + 1} x2={distLeft}  y2={pipeCrownY + 9} stroke={clrDim} strokeWidth={0.8} />
      <line x1={distRight} y1={pipeCrownY + 1} x2={distRight} y2={pipeCrownY + 9} stroke={clrDim} strokeWidth={0.8} />
      <text x={(distLeft + distRight) / 2} y={pipeCrownY + 20}
        fontSize={9.5} fill={clrDim} textAnchor="middle">
        a + 2h · tan θ
      </text>

      {/* ── 파이프 단면 ────────────────────────────────────── */}
      {/* 파이프 외곽 */}
      <ellipse cx={cx} cy={pipeCenterY} rx={52} ry={pipeR}
        fill="#d6ecfa" stroke={clrPipe} strokeWidth={2} />
      {/* 관벽 표현 */}
      <ellipse cx={cx} cy={pipeCenterY} rx={45} ry={pipeR - 4}
        fill="#c0e0f4" stroke={clrPipe} strokeWidth={0.7} strokeDasharray="3,2" />
      {/* 내공 (유수부) */}
      <ellipse cx={cx} cy={pipeCenterY} rx={38} ry={pipeR - 7}
        fill="#eaf6fd" stroke="none" />

      {/* ── 관 레이블 ─────────────────────────────────────── */}
      <text x={cx} y={pipeCenterY + 1}
        fontSize={9} fill={clrPipe} textAnchor="middle" dominantBaseline="middle"
        fontWeight="bold">D</text>

      {/* ── C 차량점유폭 안내 (하단 노트) ─────────────────── */}
      <rect x={2} y={H - 22} width={W - 4} height={20}
        fill={T.bgPanelAlt ?? '#f5f5f5'} rx={3} />
      <text x={8} y={H - 9} fontSize={8.5} fill="#555">
        C (차량 점유폭): 관축 방향의 하중 분포 폭 (기본 3.0 m) — 평면도 기준
      </text>
    </svg>
  )
}
