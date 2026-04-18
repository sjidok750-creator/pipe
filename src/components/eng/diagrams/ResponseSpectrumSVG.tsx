// 설계응답스펙트럼 — KDS 17 10 00 그림 2.1.2
// 성능유지(기능수행)와 붕괴방지 두 곡선을 함께 그림
import React from 'react'
import { T } from '../tokens'

interface SpectrumData {
  SDS: number
  SD1: number
  T0: number  // T_A (암반 단주기 전이)
  TS: number  // T_B (암반 장주기 전이)
}

export function ResponseSpectrumSVG({
  // 붕괴방지 (collapse)
  SDS, SD1, T0, TS,
  // 기능수행 (functional) — 선택적
  SDS_func, SD1_func,
  // 관로 고유주기
  Ts,
  width = 260, height = 170,
}: {
  SDS: number; SD1: number; T0: number; TS: number; Ts: number
  SDS_func?: number; SD1_func?: number
  width?: number; height?: number
}) {
  const px = 44, py = 14, gw = width - px - 18, gh = height - py - 38

  const maxSa_all = Math.max(SDS, SDS_func ?? 0) * 1.35
  const maxT = Math.max(2.0, Ts * 1.6, TS * 2.5)

  const tx = (t: number) => px + (t / maxT) * gw
  const ty = (sa: number) => py + gh - (sa / maxSa_all) * gh

  // 스펙트럼 곡선 점 생성
  function buildCurve(sds: number, sd1: number, t0: number, ts_sp: number): string {
    const pts: string[] = []
    for (let i = 0; i <= 160; i++) {
      const t = (i / 160) * maxT
      let sa: number
      if (t < 0.001) sa = sds * 0.4
      else if (t <= t0) sa = sds * (0.4 + 0.6 * t / t0)
      else if (t <= ts_sp) sa = sds
      else sa = sd1 / t
      pts.push(`${tx(t).toFixed(1)},${ty(sa).toFixed(1)}`)
    }
    return pts.join(' ')
  }

  const ptsCollapse = buildCurve(SDS, SD1, T0, TS)
  const ptsFunc = (SDS_func != null && SD1_func != null)
    ? buildCurve(SDS_func, SD1_func, T0, TS)
    : null

  // T 눈금
  const tTicks = [0, 0.5, 1.0, 1.5, 2.0].filter(t => t <= maxT + 0.01)

  const xT0 = tx(T0)
  const xTS = tx(TS)
  const xTs = tx(Ts)
  const minGap = 18

  const showT0Label = Math.abs(xT0 - xTS) >= minGap
  const showTsLabel = Ts > 0 && Ts <= maxT

  // Ts 위치의 스펙트럼 값 (붕괴방지 기준)
  const Sa_at_Ts = Ts <= 0 ? 0
    : Ts <= T0 ? SDS * (0.4 + 0.6 * Ts / T0)
    : Ts <= TS ? SDS
    : SD1 / Ts

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>

      {/* 격자선 */}
      {tTicks.map(t => (
        <line key={t} x1={tx(t)} y1={py} x2={tx(t)} y2={py + gh}
          stroke="#e8e8e8" strokeWidth="0.7" />
      ))}
      <line x1={px} y1={ty(SDS)} x2={px + gw} y2={ty(SDS)}
        stroke="#c0c0c0" strokeWidth="0.6" strokeDasharray="3 2" />

      {/* 기능수행 채운 영역 (연한 초록) */}
      {ptsFunc && (
        <polygon
          points={`${px},${py + gh} ${ptsFunc} ${tx(maxT)},${py + gh}`}
          fill="#d4edda" opacity="0.5" />
      )}

      {/* 붕괴방지 채운 영역 (연한 파랑) */}
      <polygon
        points={`${px},${py + gh} ${ptsCollapse} ${tx(maxT)},${py + gh}`}
        fill="#dce8f5" opacity="0.5" />

      {/* 기능수행 곡선 (초록 점선) */}
      {ptsFunc && (
        <polyline points={ptsFunc} fill="none"
          stroke="#2e7d32" strokeWidth="1.4" strokeDasharray="5 3" />
      )}

      {/* 붕괴방지 곡선 (진한 네이비) */}
      <polyline points={ptsCollapse} fill="none"
        stroke={T.bgActive} strokeWidth="2.0" />

      {/* T0 수직선 */}
      <line x1={xT0} y1={py} x2={xT0} y2={py + gh}
        stroke="#999" strokeWidth="0.8" strokeDasharray="3 2" />
      {showT0Label && (
        <text x={xT0} y={py + gh + 13} textAnchor="middle" fontSize="8" fill="#555">T₀</text>
      )}

      {/* TS 수직선 */}
      <line x1={xTS} y1={py} x2={xTS} y2={py + gh}
        stroke="#999" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x={xTS} y={py + gh + 13} textAnchor="middle" fontSize="8" fill="#555">Tₛ</text>

      {/* Ts (관로 고유주기) — 빨간 점선 */}
      {showTsLabel && (
        <>
          <line x1={xTs} y1={py} x2={xTs} y2={py + gh}
            stroke="#c0392b" strokeWidth="1.2" strokeDasharray="4 2" />
          {/* Ts 수평선 → Sa 교점 */}
          <line x1={px} y1={ty(Sa_at_Ts)} x2={xTs} y2={ty(Sa_at_Ts)}
            stroke="#c0392b" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6" />
          {/* Ts 라벨 */}
          <text
            x={xTs + 3}
            y={Math.abs(xTs - xTS) < minGap ? py + gh - 6 : py + 11}
            fontSize="8" fill="#c0392b" fontFamily={T.fontMono}>Ts</text>
        </>
      )}

      {/* SDS 라벨 */}
      <text x={px - 3} y={ty(SDS) + 3} textAnchor="end" fontSize="7.5" fill="#666">SDS</text>
      {ptsFunc && SDS_func != null && (
        <text x={px - 3} y={ty(SDS_func) + 3} textAnchor="end" fontSize="7" fill="#2e7d32">SDS'</text>
      )}

      {/* 범례 */}
      {ptsFunc && (
        <g transform={`translate(${px + gw - 120}, ${py + 4})`}>
          <rect x="0" y="0" width="120" height="32" fill="white" stroke="#ddd" strokeWidth="0.8" rx="2" opacity="0.9"/>
          <line x1="4" y1="10" x2="20" y2="10" stroke={T.bgActive} strokeWidth="2"/>
          <text x="24" y="13" fontSize="8" fill="#333">붕괴방지수준</text>
          <line x1="4" y1="24" x2="20" y2="24" stroke="#2e7d32" strokeWidth="1.4" strokeDasharray="5 3"/>
          <text x="24" y="27" fontSize="8" fill="#333">기능수행수준</text>
        </g>
      )}

      {/* 축 */}
      <line x1={px} y1={py + gh} x2={px + gw + 8} y2={py + gh} stroke="#333" strokeWidth="1.2" />
      <line x1={px} y1={py} x2={px} y2={py + gh + 4} stroke="#333" strokeWidth="1.2" />

      {/* 축 라벨 */}
      <text x={px + gw / 2} y={height - 2} textAnchor="middle" fontSize="9.5" fill="#444"
        fontFamily={T.fontSans}>주기 T (초)</text>
      <text x="9" y={py + gh / 2} textAnchor="middle" fontSize="9.5" fill="#444"
        fontFamily={T.fontSans} transform={`rotate(-90, 9, ${py + gh / 2})`}>Sa (g)</text>

      {/* T 눈금값 */}
      {tTicks.map(t => (
        <text key={t} x={tx(t)} y={py + gh + 13} textAnchor="middle" fontSize="7.5" fill="#777">{t}</text>
      ))}

      {/* Sa 눈금 */}
      <text x={px - 3} y={py + 4} textAnchor="end" fontSize="7" fill="#777">{maxSa_all.toFixed(2)}</text>
      <text x={px - 3} y={py + gh + 3} textAnchor="end" fontSize="7" fill="#777">0</text>
    </svg>
  )
}
