// 매설관로 응답변위법 개념도 — 평가요령 부록 C 그림 C.1
import React from 'react'
import { T } from '../tokens'

export function BuriedPipeResponseSVG({
  Uh = 0.02, L = 200, width = 320, height = 130,
}: {
  Uh?: number; L?: number; width?: number; height?: number
}) {
  const W = width, H = height
  const gx = 24, gy = 20, gw = W - 48, gh = 60

  // 지반변위 사인파 (파장 L 기준)
  const groundPts = Array.from({ length: 81 }, (_, i) => {
    const x = gx + (i / 80) * gw
    const u = Math.sin((i / 80) * Math.PI * 2) * 14   // 진폭 px
    return `${x.toFixed(1)},${(gy + gh / 2 + u).toFixed(1)}`
  }).join(' ')

  // 관로 — 약간 위상 차이
  const pipePts = Array.from({ length: 81 }, (_, i) => {
    const x = gx + (i / 80) * gw
    const u = Math.sin((i / 80) * Math.PI * 2 - 0.3) * 10
    return `${x.toFixed(1)},${(gy + gh / 2 + u).toFixed(1)}`
  }).join(' ')

  // 파장 치수선
  const arrowY = gy + gh + 14
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* 지반 배경 */}
      <rect x={gx} y={gy} width={gw} height={gh} fill="#f0ece4" stroke="#ccc" strokeWidth="0.5"/>

      {/* 지반변위 파 (지반) */}
      <polyline points={groundPts} fill="none" stroke="#999" strokeWidth="1.2" strokeDasharray="4 2"/>

      {/* 관로 */}
      <polyline points={pipePts} fill="none" stroke={T.bgActive} strokeWidth="2"/>

      {/* 지반변위 화살표 (중간 지점) */}
      {[0.25, 0.75].map(frac => {
        const xi = Math.round(frac * 80)
        const xPos = gx + frac * gw
        const groundY = gy + gh / 2 + Math.sin(frac * Math.PI * 2) * 14
        const pipeY = gy + gh / 2 + Math.sin(frac * Math.PI * 2 - 0.3) * 10
        const dy = groundY - pipeY
        return (
          <g key={frac}>
            <line x1={xPos} y1={pipeY} x2={xPos} y2={groundY}
              stroke="#c0392b" strokeWidth="0.8" strokeDasharray="2 1.5"/>
            <circle cx={xPos} cy={groundY} r="2.5" fill="#999" stroke="none"/>
          </g>
        )
      })}

      {/* Uh 레이블 */}
      <text x={gx + gw * 0.27} y={gy + gh / 2 + 28} fontSize="8" fill="#c0392b"
        fontFamily={T.fontMono}>Uh</text>

      {/* 범례 */}
      <line x1={gx} y1={H - 20} x2={gx + 18} y2={H - 20} stroke="#999" strokeWidth="1.2" strokeDasharray="4 2"/>
      <text x={gx + 22} y={H - 17} fontSize="8" fill="#555" fontFamily={T.fontSans}>지반변위</text>
      <line x1={gx + 70} y1={H - 20} x2={gx + 88} y2={H - 20} stroke={T.bgActive} strokeWidth="2"/>
      <text x={gx + 92} y={H - 17} fontSize="8" fill="#555" fontFamily={T.fontSans}>관로변위</text>

      {/* 파장 치수선 */}
      <defs>
        <marker id="arL" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 Z" fill="#555"/>
        </marker>
        <marker id="arR" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto-start-reverse">
          <path d="M0,0 L0,5 L5,2.5 Z" fill="#555"/>
        </marker>
      </defs>
      <line x1={gx} y1={arrowY} x2={gx + gw} y2={arrowY}
        stroke="#555" strokeWidth="0.8" markerStart="url(#arR)" markerEnd="url(#arL)"/>
      <line x1={gx} y1={arrowY - 4} x2={gx} y2={arrowY + 4} stroke="#555" strokeWidth="0.8"/>
      <line x1={gx + gw} y1={arrowY - 4} x2={gx + gw} y2={arrowY + 4} stroke="#555" strokeWidth="0.8"/>
      <text x={gx + gw / 2} y={arrowY + 10} textAnchor="middle" fontSize="9" fill="#333"
        fontFamily={T.fontMono}>L = {L.toFixed(0)} m  (지진파장)</text>
    </svg>
  )
}

// 이음부 신축량 개념도
export function JointDisplacementSVG({
  u_J_mm, u_allow_mm, Lj = 6,
}: {
  u_J_mm: number; u_allow_mm: number; Lj?: number
}) {
  const W = 260, H = 90
  const ok = u_J_mm <= u_allow_mm
  const scale = Math.min(u_J_mm / u_allow_mm, 1.3)

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* 관체 1 */}
      <rect x="10" y="26" width="85" height="22" rx="1"
        fill="#e8ecf0" stroke="#666" strokeWidth="1"/>
      {/* 소켓(이음부) */}
      <rect x="93" y="20" width="18" height="34" rx="1"
        fill={ok ? '#dceef5' : '#fde8e8'} stroke={ok ? T.bgActive : '#c0392b'} strokeWidth="1.5"/>
      <text x="102" y="41" textAnchor="middle" fontSize="7" fill="#333" fontFamily={T.fontSans}>이음</text>
      {/* 관체 2 */}
      <rect x="109" y="26" width="85" height="22" rx="1"
        fill="#e8ecf0" stroke="#666" strokeWidth="1"/>

      {/* 신축량 화살표 */}
      <defs>
        <marker id="arU" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 Z" fill="#c0392b"/>
        </marker>
      </defs>
      <line x1="102" y1="14" x2={102 + Math.min(scale * 30, 50)} y2="14"
        stroke="#c0392b" strokeWidth="1.2" markerEnd="url(#arU)"/>
      <text x="102" y="11" fontSize="8" fill="#c0392b" fontFamily={T.fontMono}>
        u_J = {u_J_mm.toFixed(1)} mm
      </text>

      {/* 허용값 게이지 바 */}
      <text x="10" y="68" fontSize="8" fill="#555" fontFamily={T.fontSans}>허용 신축량</text>
      <rect x="80" y="61" width="120" height="9" rx="1" fill="#e0e0e0"/>
      <rect x="80" y="61" width={Math.min(scale * 92, 120)} height="9" rx="1"
        fill={ok ? T.bgActive : '#c0392b'} opacity="0.8"/>
      <line x1="172" y1="58" x2="172" y2="74" stroke="#555" strokeWidth="0.8" strokeDasharray="2 1"/>
      <text x="175" y="72" fontSize="7" fill="#555" fontFamily={T.fontMono}>{u_allow_mm.toFixed(0)} mm</text>
      <text x="200" y="66" fontSize="9" fill={ok ? T.bgActive : '#c0392b'} fontWeight="700">
        {ok ? 'O.K.' : 'N.G.'}
      </text>

      {/* Lj 라벨 */}
      <text x="52" y={H - 4} fontSize="8" fill="#888" fontFamily={T.fontSans}>
        관 1본 = {Lj} m
      </text>
    </svg>
  )
}
