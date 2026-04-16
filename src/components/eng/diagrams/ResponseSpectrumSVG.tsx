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
  const px = 42, py = 12, gw = width - px - 16, gh = height - py - 34
  const maxT = Math.max(2.0, Ts * 1.5, TS * 2)
  const maxSa = SDS * 1.35
  const tx = (t: number) => px + (t / maxT) * gw
  const ty = (sa: number) => py + gh - (sa / maxSa) * gh

  // 스펙트럼 곡선 점
  const pts: string[] = []
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * maxT
    let sa: number
    if (t < 0.001) sa = SDS * 0.4
    else if (t <= T0) sa = SDS * (0.4 + 0.6 * t / T0)
    else if (t <= TS) sa = SDS
    else sa = SD1 / t
    pts.push(`${tx(t).toFixed(1)},${ty(sa).toFixed(1)}`)
  }

  // T 눈금
  const tTicks = [0, 0.5, 1.0, 1.5, 2.0].filter(t => t <= maxT + 0.01)

  // T0/TS 라벨 충돌 방지: 너무 가까우면 한 쪽 생략
  const xT0 = tx(T0)
  const xTS = tx(TS)
  const xTs = tx(Ts)
  const minGap = 20  // px
  const showT0Label = Math.abs(xT0 - xTS) >= minGap
  const showTsLabel = Ts > 0 && Ts <= maxT && Math.abs(xTs - xTS) >= minGap && Math.abs(xTs - xT0) >= minGap

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {/* 격자선 */}
      {tTicks.map(t => (
        <line key={t} x1={tx(t)} y1={py} x2={tx(t)} y2={py + gh}
          stroke="#e0e0e0" strokeWidth="0.8"/>
      ))}

      {/* 채운 영역 */}
      <polygon
        points={`${px},${py + gh} ${pts.join(' ')} ${px + gw},${py + gh}`}
        fill="#dce8f5" opacity="0.5"/>

      {/* 스펙트럼 곡선 */}
      <polyline points={pts.join(' ')} fill="none" stroke={T.bgActive} strokeWidth="1.8"/>

      {/* SDS 수평선 */}
      <line x1={px} y1={ty(SDS)} x2={px + gw} y2={ty(SDS)}
        stroke="#aaa" strokeWidth="0.6" strokeDasharray="3 2"/>

      {/* T0 수직선 */}
      <line x1={xT0} y1={py} x2={xT0} y2={py + gh}
        stroke="#888" strokeWidth="0.8" strokeDasharray="3 2"/>
      {showT0Label && (
        <text x={xT0} y={py + gh + 12} textAnchor="middle" fontSize="8" fill="#555">T₀</text>
      )}

      {/* TS 수직선 */}
      <line x1={xTS} y1={py} x2={xTS} y2={py + gh}
        stroke="#888" strokeWidth="0.8" strokeDasharray="3 2"/>
      <text x={xTS} y={py + gh + 12} textAnchor="middle" fontSize="8" fill="#555">Tₛ</text>

      {/* Ts (관로 고유주기) — 빨간 점선 */}
      {showTsLabel && (
        <>
          <line x1={xTs} y1={py} x2={xTs} y2={py + gh}
            stroke="#c0392b" strokeWidth="1" strokeDasharray="4 2"/>
          <text x={xTs + 2} y={py + 10} fontSize="8" fill="#c0392b" fontFamily={T.fontMono}>Ts</text>
        </>
      )}
      {/* Ts가 TS 가까이 있을 때 위쪽에 표시 */}
      {!showTsLabel && Ts > 0 && Ts <= maxT && (
        <>
          <line x1={xTs} y1={py} x2={xTs} y2={py + gh}
            stroke="#c0392b" strokeWidth="1" strokeDasharray="4 2"/>
          <text x={xTs + 2} y={py + gh - 4} fontSize="8" fill="#c0392b" fontFamily={T.fontMono}>Ts</text>
        </>
      )}

      {/* SDS 라벨 */}
      <text x={px - 2} y={ty(SDS) + 3} textAnchor="end" fontSize="7" fill="#666">SDS</text>

      {/* 축 */}
      <line x1={px} y1={py + gh} x2={px + gw + 6} y2={py + gh} stroke="#333" strokeWidth="1"/>
      <line x1={px} y1={py} x2={px} y2={py + gh + 4} stroke="#333" strokeWidth="1"/>

      {/* 축 라벨 */}
      <text x={px + gw / 2} y={height - 2} textAnchor="middle" fontSize="9" fill="#444"
        fontFamily={T.fontSans}>주기 T (초)</text>
      <text x="8" y={py + gh / 2} textAnchor="middle" fontSize="9" fill="#444"
        fontFamily={T.fontSans} transform={`rotate(-90, 8, ${py + gh / 2})`}>Sa (g)</text>

      {/* T 눈금값 */}
      {tTicks.map(t => (
        <text key={t} x={tx(t)} y={py + gh + 12} textAnchor="middle" fontSize="7.5" fill="#777">{t}</text>
      ))}
      {/* Sa 눈금 */}
      <text x={px - 2} y={py + 4} textAnchor="end" fontSize="7" fill="#777">{maxSa.toFixed(2)}</text>
      <text x={px - 2} y={py + gh + 3} textAnchor="end" fontSize="7" fill="#777">0</text>
    </svg>
  )
}
