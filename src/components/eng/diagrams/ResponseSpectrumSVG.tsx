// 설계속도응답스펙트럼 — KDS 17 10 00 그림 2.1.2
// Y축: 의사속도 Sv = Sa × T × g / (2π) [m/s]
import React from 'react'
import { T } from '../tokens'

const G = 9.81
const PI2 = 2 * Math.PI

function saAt(t: number, sds: number, sd1: number, t0: number, ts: number, tl: number): number {
  if (t < 0.001) return sds * 0.4
  if (t <= t0) return sds * (0.4 + 0.6 * t / t0)
  if (t <= ts) return sds
  if (t <= tl) return sd1 / t
  return sd1 * tl / (t * t)
}

function svAt(t: number, sds: number, sd1: number, t0: number, ts: number, tl: number): number {
  if (t < 0.001) t = 0.001
  return saAt(t, sds, sd1, t0, ts, tl) * t * G / PI2
}

function niceStep(range: number, n = 5): number {
  const raw = range / n
  const candidates = [0.005, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3]
  return candidates.find(v => v >= raw) ?? raw
}

export function ResponseSpectrumSVG({
  SDS, SD1, T0, TS, TL = 3.0,
  SDS_func, SD1_func,
  Ts,
  width = 260, height = 170,
}: {
  SDS: number; SD1: number; T0: number; TS: number; TL?: number; Ts: number
  SDS_func?: number; SD1_func?: number
  width?: number; height?: number
}) {
  const px = 46, py = 16, gw = width - px - 14, gh = height - py - 38

  // Sv 피크 (속도일정구간 = TS ~ TL)
  const SvPeak = SD1 * G / PI2
  const SvPeak_f = (SD1_func != null) ? SD1_func * G / PI2 : null
  const hasFunc = SDS_func != null && SD1_func != null && SvPeak_f != null

  const maxSv = Math.max(SvPeak, SvPeak_f ?? 0) * 1.40
  const step = niceStep(maxSv)
  const maxT = 4.0

  const tx = (t: number) => px + (t / maxT) * gw
  const ty = (sv: number) => py + gh - (sv / maxSv) * gh

  // 곡선 폴리라인 데이터
  function buildPts(sds: number, sd1: number): string {
    return Array.from({ length: 200 }, (_, i) => {
      const t = (i / 199) * maxT
      const sv = svAt(t, sds, sd1, T0, TS, TL)
      return `${tx(t).toFixed(1)},${ty(sv).toFixed(1)}`
    }).join(' ')
  }
  const ptsC = buildPts(SDS, SD1)
  const ptsF = hasFunc ? buildPts(SDS_func!, SD1_func!) : null

  // Y축 눈금
  const yTicks: number[] = []
  for (let v = 0; v <= maxSv + step * 0.01; v += step) yTicks.push(parseFloat(v.toFixed(4)))

  // T축 눈금
  const tTicks = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]

  const ySvC = ty(SvPeak)
  const ySvF = SvPeak_f != null ? ty(SvPeak_f) : null

  // 피크 레이블 X: 플래토 좌측 30% 지점 (범례·TS선과 겹침 방지)
  // 레이블 폭 ~90px을 고려하여 우상단 범례(gw-114)와도 겹치지 않도록
  const xLabelStart = tx(TS) + 8
  const xLabelMid   = tx(TS + (TL - TS) * 0.28)
  // 레이블이 우상단 범례 영역(px+gw-114)을 침범할 경우 중앙으로 후퇴
  const xLabel = (xLabelStart + 95 > px + gw - 114) ? xLabelMid : xLabelStart

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>

      {/* ── 격자선 ── */}
      {yTicks.map(v => (
        <line key={v} x1={px} y1={ty(v)} x2={px + gw} y2={ty(v)}
          stroke="#e4e8ee" strokeWidth="0.7" />
      ))}
      {tTicks.map(t => (
        <line key={t} x1={tx(t)} y1={py} x2={tx(t)} y2={py + gh}
          stroke="#e4e8ee" strokeWidth="0.7" />
      ))}

      {/* ── 피크 Sv 수평 참조선 ── */}
      <line x1={px} y1={ySvC} x2={px + gw} y2={ySvC}
        stroke={T.bgActive} strokeWidth="0.8" strokeDasharray="5 3" opacity="0.45" />
      {ySvF != null && (
        <line x1={px} y1={ySvF} x2={px + gw} y2={ySvF}
          stroke="#2e7d32" strokeWidth="0.8" strokeDasharray="5 3" opacity="0.45" />
      )}

      {/* ── 채움 영역 ── */}
      {ptsF && (
        <polygon points={`${px},${py + gh} ${ptsF} ${tx(maxT)},${py + gh}`}
          fill="#d4edda" opacity="0.35" />
      )}
      <polygon points={`${px},${py + gh} ${ptsC} ${tx(maxT)},${py + gh}`}
        fill="#dce8f5" opacity="0.40" />

      {/* ── 기능수행 곡선 ── */}
      {ptsF && (
        <polyline points={ptsF} fill="none"
          stroke="#2e7d32" strokeWidth="1.5" strokeDasharray="6 3" />
      )}

      {/* ── 붕괴방지 곡선 ── */}
      <polyline points={ptsC} fill="none" stroke={T.bgActive} strokeWidth="2.2" />

      {/* ── TS / TL 구분선 ── */}
      {[{ t: TS, label: 'Ts' }, { t: TL, label: 'TL' }].map(({ t, label }) => (
        <g key={label}>
          <line x1={tx(t)} y1={py} x2={tx(t)} y2={py + gh}
            stroke="#aaa" strokeWidth="0.9" strokeDasharray="3 2" />
          <text x={tx(t)} y={py + gh + 12}
            textAnchor="middle" fontSize="7.5" fill="#888" fontFamily={T.fontMono}>
            {label}
          </text>
        </g>
      ))}

      {/* ── Tg (관로·지반 고유주기) ── */}
      {Ts > 0 && Ts <= maxT && (
        <g>
          <line x1={tx(Ts)} y1={py} x2={tx(Ts)} y2={py + gh}
            stroke="#c0392b" strokeWidth="1.3" strokeDasharray="4 2" />
          <text x={tx(Ts) + 3} y={py + 10}
            fontSize="7.5" fill="#c0392b" fontFamily={T.fontMono}>
            Tg={Ts.toFixed(2)}
          </text>
        </g>
      )}

      {/* ── 피크 Sv 값 레이블 (굵고 크게) ── */}
      <text x={xLabel} y={ySvC - 3}
        fontSize="10" fontWeight="700" fill={T.bgActive} fontFamily={T.fontMono}>
        {SvPeak.toFixed(4)} m/s
      </text>
      {ySvF != null && SvPeak_f != null && (
        <text x={xLabel} y={ySvF - 3}
          fontSize="10" fontWeight="700" fill="#2e7d32" fontFamily={T.fontMono}>
          {SvPeak_f.toFixed(4)} m/s
        </text>
      )}

      {/* ── 범례 (우상단) ── */}
      {ptsF && (
        <g transform={`translate(${px + gw - 114},${py + 4})`}>
          <rect x={0} y={0} width={114} height={32} rx={2}
            fill="white" stroke="#ddd" strokeWidth="0.8" opacity="0.95" />
          <line x1="4" y1="10" x2="20" y2="10" stroke={T.bgActive} strokeWidth="2" />
          <text x="24" y="13" fontSize="7.5" fill="#333" fontFamily={T.fontSans}>붕괴방지수준</text>
          <line x1="4" y1="24" x2="20" y2="24" stroke="#2e7d32" strokeWidth="1.5" strokeDasharray="5 3" />
          <text x="24" y="27" fontSize="7.5" fill="#333" fontFamily={T.fontSans}>기능수행수준</text>
        </g>
      )}

      {/* ── 축 ── */}
      <line x1={px} y1={py + gh} x2={px + gw + 8} y2={py + gh} stroke="#333" strokeWidth="1.3" />
      <line x1={px} y1={py - 2} x2={px} y2={py + gh + 4} stroke="#333" strokeWidth="1.3" />

      {/* ── T축 눈금·라벨 ── */}
      {tTicks.map(t => (
        <g key={t}>
          <line x1={tx(t)} y1={py + gh} x2={tx(t)} y2={py + gh + 4} stroke="#555" strokeWidth="0.8" />
          <text x={tx(t)} y={py + gh + 14}
            textAnchor="middle" fontSize="8" fill="#555" fontFamily={T.fontSans}>
            {t % 1 === 0 ? t.toFixed(0) : t.toFixed(1)}
          </text>
        </g>
      ))}

      {/* ── Y축 눈금·라벨 ── */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={px - 4} y1={ty(v)} x2={px} y2={ty(v)} stroke="#555" strokeWidth="0.8" />
          <text x={px - 6} y={ty(v) + 3.5}
            textAnchor="end" fontSize="7.5" fill="#555" fontFamily={T.fontSans}>
            {v === 0 ? '0' : v.toFixed(2)}
          </text>
        </g>
      ))}

      {/* ── 축 제목 ── */}
      <text x={px + gw / 2} y={height - 2}
        textAnchor="middle" fontSize="9.5" fill="#444" fontFamily={T.fontSans}>
        주기 T (초)
      </text>
      <text x="8" y={py + gh / 2} textAnchor="middle" fontSize="9.5" fill="#444"
        fontFamily={T.fontSans} transform={`rotate(-90, 8, ${py + gh / 2})`}>
        Sv (m/s)
      </text>
    </svg>
  )
}
