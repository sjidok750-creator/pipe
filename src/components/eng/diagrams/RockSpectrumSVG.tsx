// 암반 기반면 설계속도응답스펙트럼 — 평가요령 부록C 그림 C.1.3/C.2.4
// 보고서와 동일한 방식: Fa=Fv=1.0 (암반), 감쇠보정계수 η 적용
import React from 'react'
import { T } from '../tokens'

const NAVY = T.bgActive
const G = 9.81
const T_A = 0.06
const T_B = 0.30

function svAt(t: number, S: number, eta: number): number {
  if (t <= 0) return 0
  const Sas = S * 2.5
  if (t <= T_A) return Sas * (0.4 + 0.6 * t / T_A) * G * t / (2 * Math.PI) * eta
  if (t <= T_B) return Sas * G * t / (2 * Math.PI) * eta
  return Sas * G * T_B / (2 * Math.PI) * eta  // plateau 상수
}

export function RockSpectrumSVG({
  S_collapse, S_func,
  Ts,
  width = 380, height = 200,
}: {
  S_collapse: number  // Z × I_collapse
  S_func: number      // Z × I_func
  Ts: number          // 표층 지반 응답주기 (1.25 × TG)
  width?: number
  height?: number
}) {
  const ml = 48, mr = 14, mt = 26, mb = 38
  const gW = width - ml - mr
  const gH = height - mt - mb
  const T_MAX = 3.0

  // 붕괴방지 ξ=20%, 기능수행 ξ=10%
  const eta_c = Math.sqrt(10 / (5 + 20))   // ≈ 0.632
  const eta_f = Math.sqrt(10 / (5 + 10))   // ≈ 0.816

  const plat_c = S_collapse * 2.5 * G * T_B / (2 * Math.PI) * eta_c
  const plat_f = S_func     * 2.5 * G * T_B / (2 * Math.PI) * eta_f

  const SV_MAX = (plat_c || 0.001) * 1.40

  const tx = (t: number) => ml + (t / T_MAX) * gW
  const ty = (sv: number) => mt + gH - Math.min(sv / SV_MAX, 1.05) * gH

  // 곡선 포인트
  const makePts = (S: number, eta: number) => {
    const ts = [0, 0.01, 0.02, 0.03, 0.04, 0.05, T_A,
      ...Array.from({ length: 12 }, (_, i) => T_A + (T_B - T_A) * (i + 1) / 13),
      T_B, T_B + 0.01, 0.5, 1.0, 1.5, 2.0, 2.5, T_MAX]
    return ts.map(t => `${tx(t).toFixed(1)},${ty(svAt(t, S, eta)).toFixed(1)}`).join(' ')
  }

  // Y축 눈금
  const rawStep = plat_c / 3
  const steps = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5]
  const yStep = steps.find(v => v >= rawStep) ?? rawStep
  const yTicks = Array.from({ length: 7 }, (_, i) => i * yStep).filter(v => v <= SV_MAX * 1.05)

  const tTicks = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]

  const pyC = ty(plat_c)
  const pyF = ty(plat_f)
  const svAtTs_c = svAt(Ts, S_collapse, eta_c)
  const svAtTs_f = svAt(Ts, S_func, eta_f)

  const hasTs = Ts > 0 && Ts <= T_MAX

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>

      {/* 제목 */}
      <text x={ml + gW / 2} y={mt - 10} textAnchor="middle"
        fontSize={9} fontWeight="bold" fill={NAVY} fontFamily={T.fontSans}>
        암반 기반면 설계속도응답스펙트럼
      </text>

      {/* 격자선 */}
      {yTicks.map((v, i) => (
        <line key={`gy${i}`} x1={ml} y1={ty(v)} x2={ml + gW} y2={ty(v)}
          stroke="#e8edf2" strokeWidth={0.8} />
      ))}
      {tTicks.map((t, i) => (
        <line key={`gx${i}`} x1={tx(t)} y1={mt} x2={tx(t)} y2={mt + gH}
          stroke="#e8edf2" strokeWidth={0.8} />
      ))}

      {/* plateau 수평 참조선 */}
      <line x1={tx(T_B)} y1={pyC} x2={tx(T_MAX)} y2={pyC}
        stroke={NAVY} strokeWidth={0.6} strokeDasharray="3,3" opacity={0.35} />
      <line x1={tx(T_B)} y1={pyF} x2={tx(T_MAX)} y2={pyF}
        stroke="#2e7d32" strokeWidth={0.6} strokeDasharray="3,3" opacity={0.35} />

      {/* 채움 */}
      <polygon
        points={`${tx(0)},${ty(0)} ${makePts(S_func, eta_f)} ${tx(T_MAX)},${ty(0)}`}
        fill="#d4edda" opacity={0.30} />
      <polygon
        points={`${tx(0)},${ty(0)} ${makePts(S_collapse, eta_c)} ${tx(T_MAX)},${ty(0)}`}
        fill="#dce8f5" opacity={0.35} />

      {/* 기능수행 곡선 (점선) */}
      <polyline points={makePts(S_func, eta_f)} fill="none"
        stroke="#2e7d32" strokeWidth={1.5} strokeDasharray="6,3" />

      {/* 붕괴방지 곡선 (실선) */}
      <polyline points={makePts(S_collapse, eta_c)} fill="none"
        stroke={NAVY} strokeWidth={2.2} />

      {/* T_A, T_B 구분선 */}
      {[{ t: T_A, lbl: 'T_A' }, { t: T_B, lbl: 'T_B' }].map(({ t, lbl }) => (
        <g key={lbl}>
          <line x1={tx(t)} y1={mt} x2={tx(t)} y2={mt + gH}
            stroke="#aaa" strokeWidth={0.9} strokeDasharray="3,2" />
          <text x={tx(t)} y={mt + gH + 22} textAnchor="middle"
            fontSize={7} fill="#888" fontFamily={T.fontMono}>{lbl}</text>
        </g>
      ))}

      {/* Ts 수직선 — 실제 계산에 사용되는 주기 */}
      {hasTs && (
        <g>
          <line x1={tx(Ts)} y1={mt} x2={tx(Ts)} y2={mt + gH}
            stroke="#c0392b" strokeWidth={1.4} strokeDasharray="4,2" />
          <text x={tx(Ts) + 3} y={mt + 10}
            fontSize={7.5} fill="#c0392b" fontFamily={T.fontMono}>
            Ts={Ts.toFixed(2)}s
          </text>
          {/* Ts에서의 Sv 값 점 */}
          <circle cx={tx(Ts)} cy={ty(svAtTs_c)} r={3}
            fill={NAVY} opacity={0.85} />
          <circle cx={tx(Ts)} cy={ty(svAtTs_f)} r={2.5}
            fill="#2e7d32" opacity={0.85} />
        </g>
      )}

      {/* plateau 값 레이블 */}
      <text x={tx(T_MAX) - 2} y={pyC - 4} textAnchor="end"
        fontSize={8} fontWeight="bold" fill={NAVY} fontFamily={T.fontMono}>
        {plat_c.toFixed(4)} m/s
      </text>
      <text x={tx(T_MAX) - 2} y={pyF + 11} textAnchor="end"
        fontSize={8} fill="#2e7d32" fontFamily={T.fontMono}>
        {plat_f.toFixed(4)} m/s
      </text>

      {/* 범례 */}
      <g transform={`translate(${ml + gW - 118}, ${mt + 4})`}>
        <rect x={0} y={0} width={118} height={34} rx={2}
          fill="white" stroke="#ddd" strokeWidth={0.8} opacity={0.95} />
        <line x1={4} y1={10} x2={20} y2={10} stroke={NAVY} strokeWidth={2.2} />
        <text x={24} y={13} fontSize={7.5} fill="#333" fontFamily={T.fontSans}>붕괴방지 (ξ=20%)</text>
        <line x1={4} y1={24} x2={20} y2={24} stroke="#2e7d32" strokeWidth={1.5} strokeDasharray="6,3" />
        <text x={24} y={27} fontSize={7.5} fill="#333" fontFamily={T.fontSans}>기능수행 (ξ=10%)</text>
      </g>

      {/* 축 */}
      <line x1={ml} y1={mt} x2={ml} y2={mt + gH + 4} stroke="#333" strokeWidth={1.3} />
      <line x1={ml} y1={mt + gH} x2={ml + gW + 8} y2={mt + gH} stroke="#333" strokeWidth={1.3} />

      {/* T축 눈금·레이블 */}
      {tTicks.map(t => (
        <g key={t}>
          <line x1={tx(t)} y1={mt + gH} x2={tx(t)} y2={mt + gH + 4} stroke="#555" strokeWidth={0.8} />
          <text x={tx(t)} y={mt + gH + 13} textAnchor="middle"
            fontSize={8} fill="#555" fontFamily={T.fontSans}>
            {t.toFixed(t % 1 === 0 ? 0 : 1)}
          </text>
        </g>
      ))}

      {/* Y축 눈금·레이블 */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={ml - 4} y1={ty(v)} x2={ml} y2={ty(v)} stroke="#555" strokeWidth={0.8} />
          <text x={ml - 6} y={ty(v) + 3.5} textAnchor="end"
            fontSize={7.5} fill="#555" fontFamily={T.fontMono}>
            {v === 0 ? '0' : v.toFixed(3)}
          </text>
        </g>
      ))}

      {/* 축 제목 */}
      <text x={ml + gW / 2} y={height - 3} textAnchor="middle"
        fontSize={9.5} fill="#444" fontFamily={T.fontSans}>주기 T (초)</text>
      <text x={9} y={mt + gH / 2} textAnchor="middle"
        fontSize={9.5} fill="#444" fontFamily={T.fontSans}
        transform={`rotate(-90, 9, ${mt + gH / 2})`}>Sv (m/s)</text>
    </svg>
  )
}
