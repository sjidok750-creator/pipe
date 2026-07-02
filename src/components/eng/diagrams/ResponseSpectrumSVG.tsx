// 암반 기반면 속도응답스펙트럼 Sv — 매설관 내진 계산용
// 근거: 평가요령 해설식(5.3.6), KDS 17 10 00 암반(S1) 표준설계응답스펙트럼
// - 암반 기준 (Fa=Fv=1.0): T_A=0.06s, T_B=0.3s
// - Sas = S×2.8 (암반 단주기 스펙트럼 가속도, g배수)
// - T ≤ T_A: Sa = S×(1+30T)             → T_A에서 2.8S 도달
// - T_A ≤ T ≤ T_B: Sa = 2.8×S           → Sv 선형 증가
// - T > T_B: Sa = 0.84×S/T              → Sv = 0.84×S×g/(2π)×C_D 일정 (플래토)
// - 감쇠보정계수: C_D = (6.42/(1.42+ξ))^0.48, 붕괴방지ξ=20%→0.5605, 기능수행ξ=10%→0.7585
// - 피크 Sv(감쇠보정후) = Sas×g×T_B/(2π)×C_D 가 Uh 산정에 직접 사용됨
import React from 'react'
import { T } from '../tokens'

const G = 9.81
const PI2 = 2 * Math.PI
const T_A = 0.06   // 암반 단주기 전이주기
const T_B = 0.3    // 암반 장주기 전이주기

// 암반 기반 Sa 계산 (Fa=Fv=1.0, 감쇠보정 전) — KDS 17 10 00
function saRock(t: number, Sas: number): number {
  const S = Sas / 2.8
  if (t < 0.001) t = 0.001
  if (t <= T_A) return S * (1 + 30 * t)
  if (t <= T_B) return Sas
  return 0.84 * S / t
}

// 암반 기반 Sv 계산 (감쇠보정 후)
function svRock(t: number, Sas: number, eta: number): number {
  if (t < 0.001) t = 0.001
  return saRock(t, Sas) * t * G / PI2 * eta
}

function niceStep(range: number, n = 5): number {
  const raw = range / n
  const candidates = [0.005, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3]
  return candidates.find(v => v >= raw) ?? raw
}

export function ResponseSpectrumSVG({
  // S = Z×I (붕괴방지), Sas_func: 기능수행용 Sas
  Sas, eta_collapse, Sas_func, eta_func,
  // 표층지반 응답주기 (관 위치 Sv 산정 기준점)
  Ts,
  // 실제 사용된 Sv (감쇠보정 후, Ts 위치)
  Sv_used, Sv_used_func,
  width = 260, height = 170,
}: {
  Sas: number; eta_collapse: number
  Sas_func?: number; eta_func?: number
  Ts: number
  Sv_used?: number; Sv_used_func?: number
  width?: number; height?: number
}) {
  const px = 46, py = 16, gw = width - px - 14, gh = height - py - 38

  const hasFunc = Sas_func != null && eta_func != null

  // Sv 플래토 (감쇠보정 후) — T_B 이후 일정값
  const SvPlat_c = Sas * G * T_B / PI2 * eta_collapse
  const SvPlat_f = hasFunc ? Sas_func! * G * T_B / PI2 * eta_func! : null

  const maxSv = Math.max(SvPlat_c, SvPlat_f ?? 0) * 1.40
  const step = niceStep(maxSv)
  const maxT = 4.0

  const tx = (t: number) => px + (t / maxT) * gw
  const ty = (sv: number) => py + gh - (sv / maxSv) * gh

  // 곡선 폴리라인
  function buildPts(sas: number, eta: number): string {
    return Array.from({ length: 300 }, (_, i) => {
      const t = (i / 299) * maxT
      const sv = svRock(t, sas, eta)
      return `${tx(t).toFixed(1)},${ty(sv).toFixed(1)}`
    }).join(' ')
  }
  const ptsC = buildPts(Sas, eta_collapse)
  const ptsF = hasFunc ? buildPts(Sas_func!, eta_func!) : null

  // Y축 눈금
  const yTicks: number[] = []
  for (let v = 0; v <= maxSv + step * 0.01; v += step) yTicks.push(parseFloat(v.toFixed(4)))

  const tTicks = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]

  const ySvC = ty(SvPlat_c)
  const ySvF = SvPlat_f != null ? ty(SvPlat_f) : null

  // Sv_used 점 위치 (Ts에서의 실제 사용값)
  const ySvUsed   = Sv_used   != null ? ty(Sv_used)   : null
  const ySvUsedF  = Sv_used_func != null ? ty(Sv_used_func) : null

  // 플래토 레이블 X — 플래토 시작(T_B) 직후
  const xLabelStart = tx(T_B) + 8
  const xLabelMid   = tx(T_B + (maxT - T_B) * 0.25)
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

      {/* ── Sv 플래토 수평 참조선 ── */}
      <line x1={px} y1={ySvC} x2={px + gw} y2={ySvC}
        stroke={T.bgActive} strokeWidth="0.8" strokeDasharray="5 3" opacity="0.4" />
      {ySvF != null && (
        <line x1={px} y1={ySvF} x2={px + gw} y2={ySvF}
          stroke="#2e7d32" strokeWidth="0.8" strokeDasharray="5 3" opacity="0.4" />
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

      {/* ── T_B 전이주기선 (암반 기준, 속도일정구간 시작) ── */}
      <g>
        <line x1={tx(T_B)} y1={py} x2={tx(T_B)} y2={py + gh}
          stroke="#aaa" strokeWidth="0.9" strokeDasharray="3 2" />
        <text x={tx(T_B)} y={py + gh + 24}
          textAnchor="middle" fontSize="7.5" fill="#888" fontFamily={T.fontMono}>
          T_B
        </text>
      </g>

      {/* ── Ts (표층지반 응답주기 = 1.25×TG) ── */}
      {Ts > 0 && Ts <= maxT && (
        <g>
          <line x1={tx(Ts)} y1={py} x2={tx(Ts)} y2={py + gh}
            stroke="#c0392b" strokeWidth="1.3" strokeDasharray="4 2" />
          <text x={tx(Ts) + 3} y={py + 10}
            fontSize="7.5" fill="#c0392b" fontFamily={T.fontMono}>
            Ts={Ts.toFixed(2)}s
          </text>
        </g>
      )}

      {/* ── Sv 사용값 포인트 (Ts 위치) ── */}
      {ySvUsed != null && Ts <= maxT && (
        <g>
          <circle cx={tx(Ts)} cy={ySvUsed} r="3.5"
            fill={T.bgActive} stroke="white" strokeWidth="1" />
          <text x={tx(Ts) + 6} y={ySvUsed + 15}
            fontSize="9" fontWeight="700" fill={T.bgActive} fontFamily={T.fontMono}>
            Sv={Sv_used!.toFixed(4)}
          </text>
        </g>
      )}
      {ySvUsedF != null && Sv_used_func != null && Ts <= maxT && (
        <circle cx={tx(Ts)} cy={ySvUsedF} r="3"
          fill="#2e7d32" stroke="white" strokeWidth="1" />
      )}

      {/* ── 플래토 Sv 레이블 ── */}
      <text x={xLabel} y={ySvC - 3}
        fontSize="10" fontWeight="700" fill={T.bgActive} fontFamily={T.fontMono}>
        {SvPlat_c.toFixed(4)} m/s
      </text>
      {ySvF != null && SvPlat_f != null && (
        <text x={xLabel} y={ySvF - 3}
          fontSize="10" fontWeight="700" fill="#2e7d32" fontFamily={T.fontMono}>
          {SvPlat_f.toFixed(4)} m/s
        </text>
      )}

      {/* ── 범례 ── */}
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
        textAnchor="middle" fontSize="10" fill="#444" fontFamily={T.fontSans}>
        주기 T (초)
      </text>
      <text x="8" y={py + gh / 2} textAnchor="middle" fontSize="10" fill="#444"
        fontFamily={T.fontSans} transform={`rotate(-90, 8, ${py + gh / 2})`}>
        Sv (m/s)
      </text>
    </svg>
  )
}
