// 매설관로 응답변위법 개념도 — 평가요령 부록 C 그림 C.1
// 지진파 전파에 의한 매설관로 강제변위 및 변형률 발생 원리
import React from 'react'
import { T } from '../tokens'

export function BuriedPipeResponseSVG({
  Uh = 0.02, L = 200, width = 320, height = 180,
}: {
  Uh?: number; L?: number; width?: number; height?: number
}) {
  const W = width, H = height

  // ── 레이아웃 ─────────────────────────────────────────────────
  const lx = 18, rx = W - 14
  const pipeY = H * 0.44
  const amp = H * 0.185
  const plotW = rx - lx

  // ── 사인파 좌표 (1주기) ───────────────────────────────────────
  const N = 200
  const pts = Array.from({ length: N }, (_, i) => {
    const frac = i / (N - 1)
    return [lx + frac * plotW, pipeY + amp * Math.sin(frac * 2 * Math.PI)] as [number, number]
  })
  const ptsStr = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  const xZero = lx
  const xCrest = lx + plotW * 0.25
  const xMid   = lx + plotW * 0.5
  const xEnd   = lx + plotW

  // ── 압축/인장 채움 영역 ───────────────────────────────────────
  const half1 = Array.from({ length: N / 2 }, (_, i) => {
    const frac = (i / (N / 2 - 1)) * 0.5
    return `${(lx + frac * plotW).toFixed(1)},${(pipeY + amp * Math.sin(frac * 2 * Math.PI)).toFixed(1)}`
  })
  const zone1 = `${lx},${pipeY} ${half1.join(' ')} ${lx + plotW * 0.5},${pipeY}`

  const half2 = Array.from({ length: N / 2 }, (_, i) => {
    const frac = 0.5 + (i / (N / 2 - 1)) * 0.5
    return `${(lx + frac * plotW).toFixed(1)},${(pipeY + amp * Math.sin(frac * 2 * Math.PI)).toFixed(1)}`
  })
  const zone2 = `${lx + plotW * 0.5},${pipeY} ${half2.join(' ')} ${xEnd},${pipeY}`

  const mkId  = `ar-bprs-${W}`
  const mkIdR = `ar-bprs-r-${W}`

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <marker id={mkId} markerWidth="6" markerHeight="5" refX="5.5" refY="2.5" orient="auto">
          <polygon points="0,0 6,2.5 0,5" fill="#555" />
        </marker>
        <marker id={mkIdR} markerWidth="6" markerHeight="5" refX="0.5" refY="2.5" orient="auto-start-reverse">
          <polygon points="0,0 6,2.5 0,5" fill="#555" />
        </marker>
      </defs>

      {/* 지반 배경 */}
      <rect x={lx} y={pipeY - amp - 14} width={plotW} height={amp * 2 + 28}
        fill="#f5f0e8" rx="2" opacity="0.55" />
      <text x={lx + 3} y={pipeY - amp - 5}
        fontSize="7.5" fill="#999" fontFamily={T.fontSans}>매설 지반</text>

      {/* 압축 / 인장 채움 */}
      <polygon points={zone1} fill="#d6e8ff" opacity="0.6" />
      <polygon points={zone2} fill="#ffe0cc" opacity="0.6" />

      {/* 기준 중심선 (미변형) */}
      <line x1={lx} y1={pipeY} x2={xEnd} y2={pipeY}
        stroke="#b0b8c4" strokeWidth="1.0" strokeDasharray="6 3" />

      {/* 관로 변형 곡선 */}
      <polyline points={ptsStr} fill="none" stroke={T.bgActive} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* 관로 끝 마개 */}
      {[xZero, xEnd].map(x => (
        <rect key={x} x={x - 2} y={pipeY - 5} width={4} height={10}
          fill={T.bgActive} rx="1" />
      ))}

      {/* Uh 치수선 */}
      <line x1={xCrest} y1={pipeY} x2={xCrest} y2={pipeY - amp}
        stroke="#c0392b" strokeWidth="1.0" strokeDasharray="3 2" opacity="0.7" />
      <line x1={xCrest - 7} y1={pipeY}        x2={xCrest + 7} y2={pipeY}        stroke="#c0392b" strokeWidth="1.0" />
      <line x1={xCrest - 7} y1={pipeY - amp}  x2={xCrest + 7} y2={pipeY - amp}  stroke="#c0392b" strokeWidth="1.0" />
      <text x={xCrest + 7} y={pipeY - amp / 2 + 3}
        fontSize="9" fontWeight="700" fill="#c0392b" fontFamily={T.fontMono}>Uh</text>

      {/* L 치수선 */}
      {(() => {
        const dimY = pipeY + amp + 9
        return (
          <g>
            <line x1={lx} y1={dimY} x2={xEnd} y2={dimY} stroke="#555" strokeWidth="0.9"
              markerStart={`url(#${mkIdR})`} markerEnd={`url(#${mkId})`} />
            <line x1={lx}   y1={dimY - 4} x2={lx}   y2={dimY + 4} stroke="#555" strokeWidth="0.9" />
            <line x1={xEnd} y1={dimY - 4} x2={xEnd} y2={dimY + 4} stroke="#555" strokeWidth="0.9" />
            <text x={lx + plotW / 2} y={dimY + 9}
              textAnchor="middle" fontSize="8.5" fill="#333" fontFamily={T.fontMono}>
              L = {L.toFixed(0)} m (지진파장)
            </text>
          </g>
        )
      })()}

      {/* ε_B 마커 (마루) */}
      <circle cx={xCrest} cy={pipeY - amp} r="4.5" fill="none"
        stroke="#1a3a5c" strokeWidth="1.5" />
      <text x={xCrest} y={pipeY - amp - 9}
        textAnchor="middle" fontSize="8.5" fontWeight="700"
        fill="#1a3a5c" fontFamily={T.fontMono}>ε_B max</text>

      {/* ε_L 마커 (영교점) */}
      <circle cx={xMid} cy={pipeY} r="3.5" fill="#c0392b" opacity="0.85" />
      <text x={xMid} y={pipeY - 7}
        textAnchor="middle" fontSize="8.5" fontWeight="700"
        fill="#c0392b" fontFamily={T.fontMono}>ε_L max</text>

      {/* 압축 / 인장 레이블 */}
      <text x={lx + plotW * 0.13} y={pipeY - amp * 0.3}
        textAnchor="middle" fontSize="8" fontWeight="700"
        fill="#1a5c99" fontFamily={T.fontSans}>압축</text>
      <text x={lx + plotW * 0.65} y={pipeY + amp * 0.38 + 4}
        textAnchor="middle" fontSize="8" fontWeight="700"
        fill="#b04000" fontFamily={T.fontSans}>인장</text>

      {/* 지진파 방향 */}
      <text x={W / 2} y={9}
        textAnchor="middle" fontSize="8" fill="#666" fontFamily={T.fontSans}>
        ← 지진파 전파 방향 (S파) →
      </text>

      {/* 하단 수식 */}
      <text x={lx} y={H - 2}
        fontSize="8" fill="#444" fontFamily={T.fontMono}>ε_L = 4Uh/L</text>
      <text x={W / 2 + 8} y={H - 2}
        fontSize="8" fill="#444" fontFamily={T.fontMono}>ε_B = π²·D·Uh/(2L²)</text>
    </svg>
  )
}

// ── 이음부 신축량 개념도 ────────────────────────────────────────
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
      <rect x="10" y="26" width="85" height="22" rx="1"
        fill="#e8ecf0" stroke="#666" strokeWidth="1"/>
      <rect x="93" y="20" width="18" height="34" rx="1"
        fill={ok ? '#dceef5' : '#fde8e8'} stroke={ok ? T.bgActive : '#c0392b'} strokeWidth="1.5"/>
      <text x="102" y="41" textAnchor="middle" fontSize="7" fill="#333" fontFamily={T.fontSans}>이음</text>
      <rect x="109" y="26" width="85" height="22" rx="1"
        fill="#e8ecf0" stroke="#666" strokeWidth="1"/>
      <defs>
        <marker id="arU-jd" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 Z" fill="#c0392b"/>
        </marker>
      </defs>
      <line x1="102" y1="14" x2={102 + Math.min(scale * 30, 50)} y2="14"
        stroke="#c0392b" strokeWidth="1.2" markerEnd="url(#arU-jd)"/>
      <text x="102" y="11" fontSize="8" fill="#c0392b" fontFamily={T.fontMono}>
        u_J = {u_J_mm.toFixed(1)} mm
      </text>
      <text x="10" y="68" fontSize="8" fill="#555" fontFamily={T.fontSans}>허용 신축량</text>
      <rect x="80" y="61" width="120" height="9" rx="1" fill="#e0e0e0"/>
      <rect x="80" y="61" width={Math.min(scale * 92, 120)} height="9" rx="1"
        fill={ok ? T.bgActive : '#c0392b'} opacity="0.8"/>
      <line x1="172" y1="58" x2="172" y2="74" stroke="#555" strokeWidth="0.8" strokeDasharray="2 1"/>
      <text x="175" y="72" fontSize="7" fill="#555" fontFamily={T.fontMono}>{u_allow_mm.toFixed(0)} mm</text>
      <text x="200" y="66" fontSize="9" fill={ok ? T.bgActive : '#c0392b'} fontWeight="700">
        {ok ? 'O.K.' : 'N.G.'}
      </text>
      <text x="52" y={H - 4} fontSize="8" fill="#888" fontFamily={T.fontSans}>
        관 1본 = {Lj} m
      </text>
    </svg>
  )
}
