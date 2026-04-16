// 설계응답스펙트럼 — KDS 17 10 00 그림 2.1.2
import React from 'react'
import { T } from '../tokens'

export function ResponseSpectrumSVG({
  SDS, SD1, T0, TS, Ts,
  width = 240, height = 160,
}: {
  SDS: number; SD1: number; T0: number; TS: number; Ts: number
  width?: number; height?: number
}) {
  const px = 38, py = 10, gw = width - px - 14, gh = height - py - 30
  const maxT = Math.max(2.0, Ts * 1.5)
  const maxSa = SDS * 1.35
  const tx = (t: number) => px + (t / maxT) * gw
  const ty = (sa: number) => py + gh - (sa / maxSa) * gh

  // 스펙트럼 곡선 점
  const pts: string[] = []
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * maxT
    let sa: number
    if (t < 0.001) sa = SDS * 0.4
    else if (t <= T0) sa = SDS * (0.4 + 0.6 * t / T0)
    else if (t <= TS) sa = SDS
    else sa = SD1 / t
    pts.push(`${tx(t).toFixed(1)},${ty(sa).toFixed(1)}`)
  }

  // 격자 T 눈금
  const tTicks = [0, 0.5, 1.0, 1.5, 2.0].filter(t => t <= maxT + 0.01)
  const saTicks = [0, 0.25, 0.5, 0.75, 1.0].map(f => f * maxSa)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {/* 격자선 */}
      {tTicks.map(t => (
        <line key={t} x1={tx(t)} y1={py} x2={tx(t)} y2={py + gh}
          stroke="#e0e0e0" strokeWidth="0.8"/>
      ))}
      {saTicks.map((sa, i) => (
        <line key={i} x1={px} y1={ty(sa)} x2={px + gw} y2={ty(sa)}
          stroke="#e0e0e0" strokeWidth="0.8"/>
      ))}

      {/* 채운 영역 */}
      <polygon
        points={`${px},${py + gh} ${pts.join(' ')} ${px + gw},${py + gh}`}
        fill="#dce8f5" opacity="0.6"/>

      {/* 스펙트럼 곡선 */}
      <polyline points={pts.join(' ')} fill="none" stroke={T.bgActive} strokeWidth="1.8"/>

      {/* T0, TS 수직선 */}
      <line x1={tx(T0)} y1={py} x2={tx(T0)} y2={py + gh}
        stroke="#888" strokeWidth="0.8" strokeDasharray="3 2"/>
      <line x1={tx(TS)} y1={py} x2={tx(TS)} y2={py + gh}
        stroke="#888" strokeWidth="0.8" strokeDasharray="3 2"/>
      <text x={tx(T0)} y={py + gh + 10} textAnchor="middle" fontSize="8" fill="#555">T₀</text>
      <text x={tx(TS)} y={py + gh + 10} textAnchor="middle" fontSize="8" fill="#555">Tₛ</text>

      {/* Ts (관로 고유주기) */}
      {Ts > 0 && Ts <= maxT && (
        <>
          <line x1={tx(Ts)} y1={py} x2={tx(Ts)} y2={py + gh}
            stroke="#c0392b" strokeWidth="1" strokeDasharray="4 2"/>
          <text x={tx(Ts) + 2} y={py + 10} fontSize="8" fill="#c0392b"
            fontFamily={T.fontMono}>Ts</text>
        </>
      )}

      {/* SDS 수평선 */}
      <line x1={px} y1={ty(SDS)} x2={px + gw} y2={ty(SDS)}
        stroke="#888" strokeWidth="0.6" strokeDasharray="3 2"/>
      <text x={px - 2} y={ty(SDS) + 3} textAnchor="end" fontSize="8" fill="#555">SDS</text>

      {/* 축 */}
      <line x1={px} y1={py + gh} x2={px + gw + 6} y2={py + gh} stroke="#333" strokeWidth="1"/>
      <line x1={px} y1={py} x2={px} y2={py + gh + 5} stroke="#333" strokeWidth="1"/>

      {/* 축 라벨 */}
      <text x={px + gw / 2} y={height - 4} textAnchor="middle" fontSize="9" fill="#444"
        fontFamily={T.fontSans}>주기 T (초)</text>
      <text x="8" y={py + gh / 2} textAnchor="middle" fontSize="9" fill="#444"
        fontFamily={T.fontSans} transform={`rotate(-90, 8, ${py + gh / 2})`}>Sa (g)</text>

      {/* T 눈금값 */}
      {tTicks.map(t => (
        <text key={t} x={tx(t)} y={py + gh + 10} textAnchor="middle" fontSize="8" fill="#666">{t}</text>
      ))}
      {/* Sa 눈금값 */}
      <text x={px - 2} y={py + 4} textAnchor="end" fontSize="7" fill="#666">{maxSa.toFixed(2)}</text>
      <text x={px - 2} y={py + gh + 3} textAnchor="end" fontSize="7" fill="#666">0</text>
    </svg>
  )
}
