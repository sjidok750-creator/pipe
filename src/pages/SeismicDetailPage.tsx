import React, { useState, useMemo } from 'react'
import {
  SEISMIC_ZONE, RISK_FACTOR, SOIL_TYPE, AMP_FACTOR,
} from '../engine/seismicConstants.js'
import { evalSegmented, interpAmpFactor } from '../engine/seismicSegmented.js'
import { evalContinuous } from '../engine/seismicContinuous.js'

// ── 디자인 토큰 ──────────────────────────────────────────────
const C = {
  indigo:  '#4f46e5',
  indigoD: '#3730a3',
  indigoL: '#eef2ff',
  teal:    '#0d9488',
  tealD:   '#0f766e',
  tealL:   '#ccfbf1',
  amber:   '#d97706',
  amberL:  '#fef3c7',
  slate:   '#334155',
  slateL:  '#f1f5f9',
  ink:     '#0f172a',
  muted:   '#64748b',
  border:  '#e2e8f0',
  red:     '#ef4444',
  redL:    '#fee2e2',
  green:   '#16a34a',
  greenL:  '#dcfce7',
}

// ── 공통 UI ──────────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 13px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
      border: active ? `2px solid ${C.indigo}` : `1.5px solid ${C.border}`,
      background: active ? C.indigo : 'white',
      color: active ? 'white' : C.slate,
      fontWeight: active ? 700 : 400,
      fontFamily: 'JetBrains Mono, monospace',
      transition: 'all .15s',
    }}>{children}</button>
  )
}
function F({ label: lb, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ flex: wide ? '1 1 100%' : '1 1 180px', minWidth: 160 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: .4 }}>{lb}</div>
      {children}
    </div>
  )
}
function NI({ value, onChange, min, max, step }: { value: string; onChange: (v: string) => void; min?: number; max?: number; step?: number }) {
  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)} min={min} max={max} step={step}
      style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', background: 'white', outline: 'none' }} />
  )
}

// ── 응답스펙트럼 SVG (삽도) ──────────────────────────────────
function ResponseSpectrumSVG({ SDS, SD1, T0, TS, Ts }: { SDS: number; SD1: number; T0: number; TS: number; Ts: number }) {
  // 그래프 영역: x=40~220, y=10~110 → T: 0~2s, Sa: 0~SDS*1.3
  const W = 240, H = 130, px = 40, py = 10, gw = 180, gh = 100
  const maxT = 2.0, maxSa = SDS * 1.4
  const tx = (t: number) => px + (t / maxT) * gw
  const ty = (sa: number) => py + gh - (sa / maxSa) * gh

  // 스펙트럼 곡선 점들
  const pts: string[] = []
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * maxT
    let sa
    if (t < 0.001) sa = SDS * 0.4
    else if (t <= T0) sa = SDS * (0.4 + 0.6 * t / T0)
    else if (t <= TS) sa = SDS
    else sa = SD1 / t
    pts.push(`${tx(t).toFixed(1)},${ty(sa).toFixed(1)}`)
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* 격자 */}
      {[0, .5, 1, 1.5, 2].map(t => (
        <line key={t} x1={tx(t)} y1={py} x2={tx(t)} y2={py + gh} stroke={C.border} strokeWidth="0.6"/>
      ))}
      {[0, .25, .5, .75, 1].map(f => {
        const sa = f * maxSa
        return <line key={f} x1={px} y1={ty(sa)} x2={px + gw} y2={ty(sa)} stroke={C.border} strokeWidth="0.6"/>
      })}
      {/* 채운 영역 */}
      <polygon points={`${px},${py+gh} ${pts.join(' ')} ${px+gw},${py+gh}`} fill={C.indigoL} opacity="0.7"/>
      {/* 곡선 */}
      <polyline points={pts.join(' ')} fill="none" stroke={C.indigo} strokeWidth="2"/>
      {/* Ts 수직선 */}
      <line x1={tx(Ts)} y1={py} x2={tx(Ts)} y2={py+gh} stroke={C.teal} strokeWidth="1.5" strokeDasharray="4 2"/>
      <text x={tx(Ts)+2} y={py+8} fontSize="8" fill={C.tealD} fontFamily="JetBrains Mono, monospace">Ts={Ts.toFixed(2)}s</text>
      {/* 축 */}
      <line x1={px} y1={py+gh} x2={px+gw+5} y2={py+gh} stroke={C.slate} strokeWidth="1.2"/>
      <line x1={px} y1={py} x2={px} y2={py+gh+5} stroke={C.slate} strokeWidth="1.2"/>
      {/* 축 라벨 */}
      <text x={px+gw/2} y={py+gh+14} textAnchor="middle" fontSize="8" fill={C.muted}>T (초)</text>
      <text x={px-8} y={py+gh/2} textAnchor="middle" fontSize="8" fill={C.muted} transform={`rotate(-90, ${px-8}, ${py+gh/2})`}>Sa (g)</text>
      {/* 눈금 */}
      {[0, .5, 1, 1.5, 2].map(t => (
        <text key={t} x={tx(t)} y={py+gh+9} textAnchor="middle" fontSize="7" fill={C.muted}>{t}</text>
      ))}
      <text x={px-3} y={py+4} textAnchor="end" fontSize="7" fill={C.muted}>{maxSa.toFixed(2)}</text>
      <text x={px-3} y={py+gh+3} textAnchor="end" fontSize="7" fill={C.muted}>0</text>
      {/* SDS 라벨 */}
      <text x={px+gw+4} y={ty(SDS)+3} fontSize="7" fill={C.indigo}>SDS</text>
    </svg>
  )
}

// ── 지반변위 분포 SVG ─────────────────────────────────────────
function GroundDispSVG({ Uh, L, z_pipe, H_total }: { Uh: number; L: number; z_pipe: number; H_total: number }) {
  const W = 200, H = 140
  // 관 위치
  const pct = z_pipe / H_total
  const pipeY = 20 + pct * 80
  // 코사인 분포: Uh × cos(π×z/(2×H))
  const pts: string[] = []
  for (let i = 0; i <= 40; i++) {
    const z = (i / 40) * H_total
    const u = Uh * Math.cos(Math.PI * z / (2 * H_total))
    const y = 20 + (z / H_total) * 80
    const x = 60 + (u / Uh) * 50
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* 지표면 */}
      <line x1="20" y1="20" x2="160" y2="20" stroke={C.slate} strokeWidth="1.5"/>
      <text x="24" y="17" fontSize="8" fill={C.muted}>지표면</text>
      {/* 기반암 */}
      <line x1="20" y1="100" x2="160" y2="100" stroke={C.slate} strokeWidth="2"/>
      <text x="24" y="109" fontSize="8" fill={C.muted}>기반암</text>
      {/* 지반 채색 */}
      <rect x="20" y="20" width="40" height="80" fill="#d4b896" opacity="0.2" rx="2"/>
      {/* 변위 분포 채우기 */}
      <polygon points={`60,20 ${pts.join(' ')} 60,100`} fill={C.indigoL} opacity="0.6"/>
      <polyline points={pts.join(' ')} fill="none" stroke={C.indigo} strokeWidth="2"/>
      {/* 관축 위치 */}
      <circle cx={60 + (Uh * Math.cos(Math.PI * z_pipe / (2 * H_total)) / Uh) * 50} cy={pipeY} r="5"
        fill={C.teal} stroke="white" strokeWidth="1.5"/>
      <text x="115" y={pipeY + 3} fontSize="8" fill={C.tealD} fontFamily="JetBrains Mono, monospace">
        Uh={Uh.toFixed(4)}m
      </text>
      {/* 축 */}
      <line x1="60" y1="15" x2="60" y2="105" stroke={C.slate} strokeWidth="0.8"/>
      <text x="60" y="118" textAnchor="middle" fontSize="8" fill={C.muted}>지반수평변위 분포</text>
      {/* H_total */}
      <line x1="24" y1="20" x2="24" y2="100" stroke={C.amber} strokeWidth="0.8"/>
      <text x="14" y="62" fontSize="7" fill={C.amber}>H</text>
    </svg>
  )
}

// ── 파장 개념도 SVG ──────────────────────────────────────────
function WavelengthSVG({ L, Uh }: { L: number; Uh: number }) {
  const W = 240, H = 100
  const amp = 28
  const pts = Array.from({ length: 101 }, (_, i) => {
    const x = 20 + (i / 100) * 200
    const y = 50 + Math.sin((i / 100) * Math.PI * 2) * amp
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* 파 */}
      <polyline points={pts} fill="none" stroke={C.indigo} strokeWidth="2"/>
      {/* 파장 치수선 */}
      <line x1="20" y1="85" x2="220" y2="85" stroke={C.slate} strokeWidth="0.8"/>
      <line x1="20" y1="80" x2="20" y2="90" stroke={C.slate} strokeWidth="1"/>
      <line x1="220" y1="80" x2="220" y2="90" stroke={C.slate} strokeWidth="1"/>
      <text x="120" y="95" textAnchor="middle" fontSize="9" fill={C.slate} fontFamily="JetBrains Mono, monospace">
        L = {L.toFixed(1)} m
      </text>
      {/* 진폭 치수선 */}
      <line x1="6" y1="22" x2="6" y2="50" stroke={C.amber} strokeWidth="0.8"/>
      <text x="14" y="36" fontSize="8" fill={C.amber} fontFamily="JetBrains Mono, monospace">Uh</text>
      {/* 관로 선 */}
      <line x1="20" y1="50" x2="220" y2="50" stroke={C.teal} strokeWidth="1" strokeDasharray="4 3"/>
      <text x="12" y="53" fontSize="7" fill={C.tealD}>관축</text>
    </svg>
  )
}

// ── 분절관 이음부 변위 SVG ───────────────────────────────────
function JointDispSVG({ u_J, u_allow, Lj }: { u_J: number; u_allow: number; Lj: number }) {
  const W = 200, H = 90
  const ok = u_J <= u_allow
  const pct = Math.min(u_J / u_allow, 1.4)
  const barW = pct * 100
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* 관 본체 1 */}
      <rect x="10" y="28" width="65" height="24" rx="3" fill="#e2e8f0" stroke={C.slate} strokeWidth="1.2"/>
      {/* 이음부 */}
      <rect x="74" y="22" width="12" height="36" rx="2" fill={ok ? C.tealL : C.redL} stroke={ok ? C.teal : C.red} strokeWidth="1.5"/>
      {/* 관 본체 2 */}
      <rect x="84" y="28" width="65" height="24" rx="3" fill="#e2e8f0" stroke={C.slate} strokeWidth="1.2"/>
      {/* 이음부 신축량 화살표 */}
      <line x1="80" y1="14" x2={80 + u_J * 1000 * 2} y2="14" stroke={C.amber} strokeWidth="1.5" markerEnd="url(#arAmb)"/>
      <defs>
        <marker id="arAmb" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 Z" fill={C.amber}/>
        </marker>
      </defs>
      <text x="80" y="10" fontSize="8" fill={C.amber} fontFamily="JetBrains Mono, monospace">u_J={( u_J*1000).toFixed(1)}mm</text>
      {/* 허용 막대 */}
      <rect x="10" y="68" width="100" height="8" rx="3" fill={C.border}/>
      <rect x="10" y="68" width={Math.min(barW, 100)} height="8" rx="3" fill={ok ? C.teal : C.red}/>
      <line x1="110" y1="64" x2="110" y2="80" stroke={C.slate} strokeWidth="1" strokeDasharray="2 2"/>
      <text x="10" y="84" fontSize="8" fill={C.muted}>0</text>
      <text x="107" y="84" fontSize="8" fill={C.muted}>{(u_allow*1000).toFixed(0)}mm</text>
      <text x="155" y="76" fontSize="8" fill={ok ? C.tealD : C.red} fontWeight="700">{ok ? '✔ OK' : '✘ NG'}</text>
    </svg>
  )
}

// ── 연속관 변형률 스택 SVG ───────────────────────────────────
function StrainStackSVG({
  eps_i, eps_t, eps_d, eps_eq, eps_total, eps_allow,
}: { eps_i: number; eps_t: number; eps_d: number; eps_eq: number; eps_total: number; eps_allow: number }) {
  const max = Math.max(eps_allow * 1.3, eps_total * 1.1)
  const W = 200, H = 130
  const items = [
    { label: 'ε_i', val: Math.abs(eps_i), color: '#818cf8' },
    { label: 'ε_t', val: Math.abs(eps_t), color: C.amber },
    { label: 'ε_d', val: Math.abs(eps_d), color: '#fb923c' },
    { label: 'ε_eq', val: Math.abs(eps_eq), color: C.red },
  ]
  const scale = (v: number) => (v / max) * 100
  let cumX = 20
  const ok = eps_total <= eps_allow
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* 스택 바 */}
      {items.map((it, i) => {
        const bw = scale(it.val)
        const x = cumX
        cumX += bw
        return (
          <g key={it.label}>
            <rect x={x} y="30" width={bw} height="28" fill={it.color} opacity="0.8" rx={i===0?3:0}/>
            {bw > 14 && (
              <text x={x + bw / 2} y="48" textAnchor="middle" fontSize="8" fill="white" fontWeight="700">{it.label}</text>
            )}
          </g>
        )
      })}
      {/* 허용값 선 */}
      <line x1={20 + scale(eps_allow)} y1="24" x2={20 + scale(eps_allow)} y2="64"
        stroke={ok ? C.tealD : C.red} strokeWidth="1.8" strokeDasharray="4 2"/>
      <text x={20 + scale(eps_allow) + 2} y="22" fontSize="8" fill={ok ? C.tealD : C.red}>허용값</text>
      {/* 합계 라벨 */}
      <text x="20" y="76" fontSize="9" fill={C.slate} fontWeight="600">합계 ε_total =</text>
      <text x="110" y="76" fontSize="10" fill={ok ? C.tealD : C.red} fontWeight="700" fontFamily="JetBrains Mono, monospace">
        {eps_total.toExponential(3)}
      </text>
      <text x="20" y="90" fontSize="9" fill={C.muted}>허용 ε_allow =</text>
      <text x="110" y="90" fontSize="10" fill={C.slate} fontFamily="JetBrains Mono, monospace">
        {eps_allow.toExponential(3)}
      </text>
      {/* 범례 */}
      {items.map((it, i) => (
        <g key={it.label}>
          <rect x={20 + i * 44} y="102" width="10" height="8" rx="2" fill={it.color} opacity="0.8"/>
          <text x={32 + i * 44} y="110" fontSize="8" fill={C.muted}>{it.label}</text>
        </g>
      ))}
      <text x="20" y="126" fontSize="10" fill={ok ? C.tealD : C.red} fontWeight="700">
        {ok ? '✔ 국부좌굴 안전' : '✘ 보강 필요'}
      </text>
    </svg>
  )
}

// ── OK/NG 배지 ───────────────────────────────────────────────
function Badge({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13,
      background: ok ? C.greenL : C.redL,
      color: ok ? C.green : C.red,
      border: `1.5px solid ${ok ? '#a3d9b5' : '#fca5a5'}`,
    }}>
      {ok ? '✔ OK' : '✘ NG'}
    </span>
  )
}

// ── 결과 행 ─────────────────────────────────────────────────
function RR({ name, val, unit, lim, limLabel, ok }: {
  name: string; val: number; unit: string; lim?: number; limLabel?: string; ok?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13,
    }}>
      <div style={{ flex: '0 0 230px', color: C.slate, fontWeight: 600 }}>{name}</div>
      <div style={{ flex: '0 0 130px', fontFamily: 'JetBrains Mono, monospace', color: C.indigo, fontWeight: 700 }}>
        {isFinite(val) ? (Math.abs(val) < 0.0001 && val !== 0 ? val.toExponential(3) : val.toFixed(4)) : '—'}
        <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}> {unit}</span>
      </div>
      {lim !== undefined && (
        <>
          <div style={{ flex: '0 0 130px', fontFamily: 'JetBrains Mono, monospace', color: C.muted }}>
            ≤ {Math.abs(lim) < 0.0001 ? lim.toExponential(3) : lim.toFixed(4)}
            <span style={{ fontSize: 11 }}> {unit}</span>
          </div>
          <div style={{ flex: '0 0 60px' }}>{ok !== undefined ? <Badge ok={ok} /> : null}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{limLabel}</div>
        </>
      )}
    </div>
  )
}

// ── 지반층 입력 ──────────────────────────────────────────────
function LayerInput({ layers, setLayers }: { layers: { H: number; Vs: number }[]; setLayers: (l: { H: number; Vs: number }[]) => void }) {
  const add = () => setLayers([...layers, { H: 5, Vs: 200 }])
  const rm = (i: number) => setLayers(layers.filter((_, j) => j !== i))
  const upd = (i: number, k: 'H' | 'Vs', v: string) => {
    const n = [...layers]; n[i] = { ...n[i], [k]: parseFloat(v) || 0 }; setLayers(n)
  }
  const totalH = layers.reduce((s, l) => s + l.H, 0)
  // 지반 단면 SVG
  const segH = totalH > 0 ? layers.map(l => (l.H / totalH) * 90) : layers.map(() => 20)
  const soilPalette = ['#d4c4a8', '#c4b896', '#b0c8a0', '#a8b4c0', '#c0a8c0', '#b0b0b0']
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* 단면 삽도 */}
      <svg width="56" height="120" viewBox="0 0 56 120" style={{ flexShrink: 0 }}>
        <line x1="4" y1="8" x2="52" y2="8" stroke={C.slate} strokeWidth="1.5"/>
        <text x="28" y="6" textAnchor="middle" fontSize="6" fill={C.muted}>지표면</text>
        {(() => {
          let y = 10; return layers.map((l, i) => {
            const h = segH[i]; const el = (
              <g key={i}>
                <rect x="4" y={y} width="48" height={h} fill={soilPalette[i % 6]} opacity="0.6"/>
                <text x="28" y={y + h / 2 + 3} textAnchor="middle" fontSize="7" fill="#555" fontFamily="JetBrains Mono, monospace">L{i + 1}</text>
                <line x1="4" y1={y + h} x2="52" y2={y + h} stroke="white" strokeWidth="0.6"/>
              </g>
            ); y += h; return el
          })
        })()}
        <rect x="4" y="104" width="48" height="14" fill="#888" opacity="0.4"/>
        <text x="28" y="113" textAnchor="middle" fontSize="6" fill="#555">기반암</text>
      </svg>
      {/* 입력 폼 */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 4 }}>
          <span style={{ width: 24 }}>층</span>
          <span style={{ width: 80 }}>H (m)</span>
          <span style={{ width: 90 }}>Vs (m/s)</span>
        </div>
        {layers.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
            <span style={{ width: 24, fontSize: 11, color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>L{i + 1}</span>
            <input style={{ width: 80, border: `1.5px solid ${C.border}`, borderRadius: 5, padding: '5px 7px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', background: 'white', outline: 'none' }}
              type="number" value={l.H} onChange={e => upd(i, 'H', e.target.value)} min={0.1} step={0.5} />
            <input style={{ width: 90, border: `1.5px solid ${C.border}`, borderRadius: 5, padding: '5px 7px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', background: 'white', outline: 'none' }}
              type="number" value={l.Vs} onChange={e => upd(i, 'Vs', e.target.value)} min={50} step={10} />
            {layers.length > 1 && (
              <button onClick={() => rm(i)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: 'white', color: C.muted, cursor: 'pointer' }}>×</button>
            )}
          </div>
        ))}
        <button onClick={add} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: `1.5px solid ${C.border}`, background: 'white', color: C.indigo, cursor: 'pointer', fontWeight: 600 }}>+ 층 추가</button>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>H_total = {totalH.toFixed(1)} m</div>
      </div>
    </div>
  )
}

// ── 카드 헬퍼 ───────────────────────────────────────────────
const sec: React.CSSProperties = { background: 'white', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 16 }
const sh = (col: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 20px', background: col, color: 'white',
  fontSize: 13, fontWeight: 700, letterSpacing: 0.3,
})
const sb: React.CSSProperties = { padding: '18px 20px' }

// ──────────────────────────────────────────────────────────────
export default function SeismicDetailPage() {
  const [pipeType, setPipeType] = useState<'segmented' | 'continuous'>('segmented')
  const [zone, setZone] = useState<'I' | 'II'>('I')
  const [seismicGrade, setSeismicGrade] = useState<'I' | 'II'>('I')
  const [soilType, setSoilType] = useState('S2')
  const [DN, setDN] = useState('300')
  const [thickness, setThickness] = useState('8.0')
  const [Dout, setDout] = useState('322')
  const [P, setP] = useState('0.5')
  const [hCover, setHCover] = useState('1.5')
  const [Lj, setLj] = useState('6')
  const [isSeismicJoint, setIsSeismicJoint] = useState(false)
  const [deltaT, setDeltaT] = useState('20')
  const [Dsettle, setDsettle] = useState('0')
  const [Lsettle, setLsettle] = useState('0')
  const [layers, setLayers] = useState([{ H: 5, Vs: 150 }, { H: 10, Vs: 250 }, { H: 5, Vs: 350 }])
  const [Vbs, setVbs] = useState('500')
  const [showResult, setShowResult] = useState(false)

  const ampEntry = (AMP_FACTOR as any)[soilType]
  const S_val = SEISMIC_ZONE[zone].Z * RISK_FACTOR[seismicGrade === 'I' ? 1000 : 500]

  const result = useMemo(() => {
    if (!showResult) return null
    const Z = SEISMIC_ZONE[zone].Z
    const I_seismic = RISK_FACTOR[seismicGrade === 'I' ? 1000 : 500]
    const dn = parseFloat(DN), t = parseFloat(thickness)
    const D_out = parseFloat(Dout), p = parseFloat(P)
    const z_pipe = parseFloat(hCover) + D_out / 1000 / 2
    const Fa_table = ampEntry?.Fa ?? [1.0, 1.0, 1.0]
    const Fv_table = ampEntry?.Fv ?? [1.0, 1.0, 1.0]
    const vbs = parseFloat(Vbs)
    if (pipeType === 'segmented') {
      return evalSegmented({ DN: dn, t, D: D_out, Z, I_seismic, Fa_table, Fv_table, layers, Vbs: vbs, P: p, Lj: parseFloat(Lj), h_cover: parseFloat(hCover), z_pipe, isSeismicJoint })
    } else {
      return evalContinuous({ DN: dn, t, D_out, seismicGrade, Z, I_seismic, Fa_table, Fv_table, layers, Vbs: vbs, P: p, deltaT: parseFloat(deltaT), D_settle: parseFloat(Dsettle), L_settle: parseFloat(Lsettle), h_cover: parseFloat(hCover), z_pipe })
    }
  }, [showResult, pipeType, zone, seismicGrade, soilType, DN, thickness, Dout, P, hCover, Lj, isSeismicJoint, deltaT, Dsettle, Lsettle, layers, Vbs])

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', fontFamily: 'Pretendard, sans-serif' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.ink} 0%, #1a1060 55%, #0a3a60 100%)`,
        borderRadius: 14, padding: '28px 32px', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <svg style={{ position: 'absolute', inset: 0, opacity: .05 }} width="100%" height="100%">
          {Array.from({ length: 8 }, (_, i) => <line key={i} x1={i * 120} y1="0" x2={i * 120 - 60} y2="200" stroke="white" strokeWidth="1"/>)}
        </svg>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span style={{ background: C.indigo, color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>KDS 57 17 00</span>
            <span style={{ background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>내진성능 평가요령 부록 C — 응답변위법</span>
          </div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 800, letterSpacing: -.3 }}>내진성능 상세평가</div>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, marginTop: 4 }}>
            분절관(주철관) 이음부 검토 / 연속관(강관) 축변형률·조합응력 검토
          </div>
        </div>
      </div>

      {/* ── STEP 1: 관종 및 지진조건 ────────────────────────── */}
      <div style={sec}>
        <div style={sh(C.indigo)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">1</text></svg>
          관종 및 지진조건
        </div>
        <div style={sb}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
            <F label="관종 (계산방법 결정)" wide>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setPipeType('segmented')} style={{
                  flex: '1 1 200px', padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                  border: pipeType === 'segmented' ? `2px solid ${C.indigo}` : `1.5px solid ${C.border}`,
                  background: pipeType === 'segmented' ? C.indigoL : 'white', textAlign: 'left',
                }}>
                  <div style={{ fontWeight: 700, color: C.indigoD, fontSize: 13 }}>분절관 (덕타일 주철관)</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>이음부 신축량 · 굽힘각도 검토</div>
                </button>
                <button onClick={() => setPipeType('continuous')} style={{
                  flex: '1 1 200px', padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                  border: pipeType === 'continuous' ? `2px solid ${C.indigo}` : `1.5px solid ${C.border}`,
                  background: pipeType === 'continuous' ? C.indigoL : 'white', textAlign: 'left',
                }}>
                  <div style={{ fontWeight: 700, color: C.indigoD, fontSize: 13 }}>연속관 (강관)</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>축변형률 · 국부좌굴 · Von Mises 검토</div>
                </button>
              </div>
            </F>
            <F label="지진구역">
              <div style={{ display: 'flex', gap: 6 }}>
                <Chip active={zone === 'I'} onClick={() => setZone('I')}>구역 Ⅰ · Z=0.11</Chip>
                <Chip active={zone === 'II'} onClick={() => setZone('II')}>구역 Ⅱ · Z=0.07</Chip>
              </div>
            </F>
            <F label="내진등급">
              <div style={{ display: 'flex', gap: 6 }}>
                <Chip active={seismicGrade === 'I'} onClick={() => setSeismicGrade('I')}>내진Ⅰ등급 · 1000년</Chip>
                <Chip active={seismicGrade === 'II'} onClick={() => setSeismicGrade('II')}>내진Ⅱ등급 · 500년</Chip>
              </div>
            </F>
            <F label="지반종류" wide>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.keys(SOIL_TYPE).map(k => <Chip key={k} active={soilType === k} onClick={() => setSoilType(k)}>{k}</Chip>)}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                {SOIL_TYPE[soilType as keyof typeof SOIL_TYPE]?.label}
                {ampEntry ? `  |  Fa/Fv 테이블 적용` : '  — S1: 부지 고유특성 평가 필요'}
              </div>
            </F>
          </div>
          <div style={{ background: C.indigoL, borderRadius: 8, padding: '10px 16px', fontSize: 13, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span>설계지반가속도 <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: C.indigoD }}>S = {S_val.toFixed(3)} g</strong></span>
            <span style={{ color: C.muted }}>Z={SEISMIC_ZONE[zone].Z}  ×  I={RISK_FACTOR[seismicGrade === 'I' ? 1000 : 500]}</span>
          </div>
        </div>
      </div>

      {/* ── STEP 2: 관로 제원 ───────────────────────────────── */}
      <div style={sec}>
        <div style={sh('#1e4d7a')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">2</text></svg>
          관로 제원
        </div>
        <div style={sb}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
            <F label="공칭관경 DN (mm)"><NI value={DN} onChange={setDN} min={50} max={3000} step={50}/></F>
            <F label="관두께 t (mm)"><NI value={thickness} onChange={setThickness} min={1} step={0.5}/></F>
            <F label="외경 D_out (mm)"><NI value={Dout} onChange={setDout} min={50} step={1}/></F>
            <F label="설계수압 P (MPa)"><NI value={P} onChange={setP} min={0.01} step={0.05}/></F>
            <F label="토피 h (m)"><NI value={hCover} onChange={setHCover} min={0.3} step={0.1}/></F>
          </div>
          {pipeType === 'segmented' && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <F label="관 1본 길이 Lj (m)"><NI value={Lj} onChange={setLj} min={1} step={0.5}/></F>
              <F label="이음 종류">
                <div style={{ display: 'flex', gap: 6 }}>
                  <Chip active={!isSeismicJoint} onClick={() => setIsSeismicJoint(false)}>일반형</Chip>
                  <Chip active={isSeismicJoint} onClick={() => setIsSeismicJoint(true)}>내진형</Chip>
                </div>
              </F>
            </div>
          )}
          {pipeType === 'continuous' && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <F label="온도변화 ΔT (°C)"><NI value={deltaT} onChange={setDeltaT} step={1}/></F>
              <F label="부등침하량 δ (m)"><NI value={Dsettle} onChange={setDsettle} min={0} step={0.01}/></F>
              <F label="침하구간 길이 (m)"><NI value={Lsettle} onChange={setLsettle} min={0} step={1}/></F>
            </div>
          )}
        </div>
      </div>

      {/* ── STEP 3: 지반 조건 ───────────────────────────────── */}
      <div style={sec}>
        <div style={sh('#234d80')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">3</text></svg>
          표층지반 조건
        </div>
        <div style={sb}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 10 }}>층별 지반 구성 (상부 → 하부)</div>
              <LayerInput layers={layers} setLayers={setLayers}/>
            </div>
            <div style={{ flex: '0 0 180px' }}>
              <F label="기반암 전단파속도 Vbs (m/s)">
                <NI value={Vbs} onChange={setVbs} min={200} step={50}/>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
                  Vbs ≥ 300 → 보정계수 ε = 1.0<br/>
                  Vbs &lt; 300 → ε = 0.85
                </div>
              </F>
            </div>
          </div>
        </div>
      </div>

      {/* ── 계산 버튼 ───────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <button onClick={() => setShowResult(true)} style={{
          background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoD})`,
          color: 'white', border: 'none', borderRadius: 10,
          padding: '13px 52px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: `0 4px 16px ${C.indigo}44`,
        }}>
          내진성능 상세평가 계산
        </button>
      </div>

      {/* ── STEP 4: 지반 해석 결과 + 삽도 ──────────────────── */}
      {showResult && result && (
        <>
          <div style={sec}>
            <div style={sh(C.indigoD)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">4</text></svg>
              지반 해석 결과 — 응답스펙트럼 / 지반변위 / 파장
            </div>
            <div style={sb}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {/* 삽도 3개 */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 4 }}>설계응답스펙트럼</div>
                    <ResponseSpectrumSVG
                      SDS={result.SDS} SD1={result.SD1}
                      T0={result.T0} TS={result.TS_sp} Ts={result.Ts}/>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 4 }}>지반수평변위 분포</div>
                    <GroundDispSVG
                      Uh={result.Uh} L={result.L}
                      z_pipe={parseFloat(hCover) + parseFloat(Dout) / 1000 / 2}
                      H_total={result.H_total}/>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 4 }}>지진파장 개념도</div>
                    <WavelengthSVG L={result.L} Uh={result.Uh}/>
                  </div>
                </div>
              </div>
              {/* 파라미터 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  ['설계가속도 S', result.S.toFixed(3), 'g'],
                  ['증폭계수 Fa', result.Fa.toFixed(2), ''],
                  ['증폭계수 Fv', result.Fv.toFixed(2), ''],
                  ['SDS', result.SDS.toFixed(3), 'g'],
                  ['SD1', result.SD1.toFixed(3), 'g'],
                  ['TG (지반고유주기)', result.TG.toFixed(3), 's'],
                  ['Ts (설계고유주기)', result.Ts.toFixed(3), 's'],
                  ['Vds', result.Vds.toFixed(1), 'm/s'],
                  ['Sv', result.Sv.toFixed(4), 'm/s'],
                  ['Uh (지반변위)', result.Uh.toFixed(4), 'm'],
                  ['L (파장)', result.L.toFixed(2), 'm'],
                  ['보정계수 ε', result.eps.toFixed(2), ''],
                ].map(([lbl, val, unit]) => (
                  <div key={lbl} style={{ background: C.indigoL, borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: C.muted }}>{lbl}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: C.indigoD }}>
                      {val} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 분절관 결과 ───────────────────────────────── */}
          {pipeType === 'segmented' && (
            <div style={sec}>
              <div style={sh('#1a5c7a')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">5</text></svg>
                분절관 내진 검토
              </div>
              <div style={sb}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 380px' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: C.slate, marginBottom: 8 }}>(a) 관체 축응력 검토</div>
                    <RR name="내압 축응력 σ_i = ν·P(D−t)/(2t)" val={(result as any).sigma_i} unit="MPa"/>
                    <RR name="차량하중 축응력 σ_o" val={(result as any).sigma_o} unit="MPa"/>
                    <RR name="지진 축응력 σ_x = E·ε_L" val={(result as any).sigma_x} unit="MPa"/>
                    <RR name="조합 축응력 σ_total" val={(result as any).sigma_total} unit="MPa"
                      lim={(result as any).sigma_allow} limLabel="허용응력 (내진, 덕타일 주철관)" ok={(result as any).stressOK}/>
                    <div style={{ marginTop: 16, fontWeight: 700, fontSize: 12, color: C.slate, marginBottom: 8 }}>(b) 이음부 신축량 검토</div>
                    <RR name="이음부 상대변위 |u_J|" val={(result as any).u_J} unit="m"
                      lim={(result as any).u_allow} limLabel={`허용 신축량 (DN${DN}, ${isSeismicJoint ? '내진형' : '일반형'})`} ok={(result as any).dispOK}/>
                    <div style={{ marginTop: 16, fontWeight: 700, fontSize: 12, color: C.slate, marginBottom: 8 }}>(c) 이음부 굽힘각도 검토</div>
                    <RR name="이음부 굽힘각 θ_J" val={(result as any).theta_J * 180 / Math.PI} unit="°"
                      lim={(result as any).theta_allow * 180 / Math.PI} limLabel={`허용 굽힘각 (DN${DN})`} ok={(result as any).angleOK}/>
                  </div>
                  {/* 이음부 변위 삽도 */}
                  <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>이음부 신축량 검토</div>
                    <JointDispSVG
                      u_J={(result as any).u_J}
                      u_allow={(result as any).u_allow}
                      Lj={parseFloat(Lj)}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 연속관 결과 ───────────────────────────────── */}
          {pipeType === 'continuous' && (
            <div style={sec}>
              <div style={sh('#1a5c7a')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">5</text></svg>
                연속관 내진 검토
              </div>
              <div style={sb}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 380px' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: C.slate, marginBottom: 8 }}>(a) 축변형률 검토 — 국부좌굴 한계</div>
                    <RR name="내압 축변형률 ε_i" val={(result as any).epsilon_i} unit=""/>
                    <RR name="차량 축변형률 ε_o" val={(result as any).epsilon_o} unit=""/>
                    <RR name="온도 축변형률 ε_t = α·ΔT" val={(result as any).epsilon_t} unit=""/>
                    <RR name="부등침하 변형률 ε_d" val={(result as any).epsilon_d} unit=""/>
                    <RR name="지진 변형률 ε_eq (축방향)" val={(result as any).epsilon_eq_L} unit=""/>
                    <RR name="지진 변형률 ε_eq (굽힘)" val={(result as any).epsilon_eq_B} unit=""/>
                    <RR name="합산 변형률 ε_total" val={(result as any).epsilon_total} unit=""
                      lim={(result as any).epsilon_allow} limLabel="허용변형률 (AWWA M11 국부좌굴)" ok={(result as any).strainOK}/>
                    <div style={{ marginTop: 16, fontWeight: 700, fontSize: 12, color: C.slate, marginBottom: 8 }}>(b) 조합응력 — Von Mises 검토</div>
                    <RR name="후프응력 σ_θ = P(D−t)/(2t)" val={(result as any).sigma_theta} unit="MPa"/>
                    <RR name="축방향 합성응력 σ_x" val={(result as any).sigma_x_total} unit="MPa"/>
                    <RR name="Von Mises 등가응력 σ_vm" val={(result as any).sigma_vm} unit="MPa"
                      lim={(result as any).sigma_allow} limLabel={`허용응력 (내진${seismicGrade}등급)`} ok={(result as any).stressOK}/>
                  </div>
                  {/* 변형률 스택 삽도 */}
                  <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>축변형률 성분 분해</div>
                    <StrainStackSVG
                      eps_i={(result as any).epsilon_i}
                      eps_t={(result as any).epsilon_t}
                      eps_d={(result as any).epsilon_d}
                      eps_eq={(result as any).epsilon_eq}
                      eps_total={(result as any).epsilon_total}
                      eps_allow={(result as any).epsilon_allow}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 최종 판정 ─────────────────────────────────── */}
          <div style={{
            borderRadius: 12, padding: '22px 26px', marginBottom: 16,
            border: `2px solid ${result.ok ? C.teal : C.red}`,
            background: result.ok
              ? `linear-gradient(135deg, ${C.tealL}, white)`
              : `linear-gradient(135deg, ${C.redL}, white)`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: result.ok ? C.tealD : C.red, fontWeight: 600, marginBottom: 4 }}>최종 판정</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: result.ok ? C.tealD : C.red }}>
                  {result.ok ? '내진성능 확보 — 안전' : '내진성능 부족 — 보강 필요'}
                </div>
                <div style={{ fontSize: 13, color: C.slate, marginTop: 10, lineHeight: 2 }}>
                  {pipeType === 'segmented' ? (
                    <>
                      축응력: {(result as any).stressOK ? '✔ OK' : '✘ NG'} ({((result as any).sigma_total).toFixed(2)} / {(result as any).sigma_allow} MPa){'  ·  '}
                      신축량: {(result as any).dispOK ? '✔ OK' : '✘ NG'} ({((result as any).u_J * 1000).toFixed(1)} / {((result as any).u_allow * 1000).toFixed(1)} mm){'  ·  '}
                      굽힘각: {(result as any).angleOK ? '✔ OK' : '✘ NG'}
                    </>
                  ) : (
                    <>
                      축변형률: {(result as any).strainOK ? '✔ OK' : '✘ NG'} ({(result as any).epsilon_total.toExponential(3)} / {(result as any).epsilon_allow.toExponential(3)}){'  ·  '}
                      조합응력: {(result as any).stressOK ? '✔ OK' : '✘ NG'} ({(result as any).sigma_vm.toFixed(1)} / {(result as any).sigma_allow.toFixed(1)} MPa)
                    </>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 40, lineHeight: 1 }}>{result.ok ? '✔' : '✘'}</div>
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,.7)', borderRadius: 8, fontSize: 11, color: C.muted, lineHeight: 1.8, borderLeft: `3px solid ${result.ok ? C.teal : C.red}` }}>
              <strong>적용기준</strong> 기존시설물(상수도) 내진성능 평가요령 부록 C — 매설관로 내진성능 본평가 (응답변위법)<br/>
              KDS 57 17 00 : 2022 상수도 내진설계기준 / KDS 17 10 00 : 2022 내진설계 일반
            </div>
          </div>
        </>
      )}
    </div>
  )
}
