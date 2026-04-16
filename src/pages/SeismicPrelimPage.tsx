import React, { useState, useMemo } from 'react'
import {
  SEISMIC_ZONE, RISK_FACTOR, SEISMIC_GRADE, SOIL_TYPE, AMP_FACTOR,
  getSeismicityGroup,
  calcFLEX,
  KIND_INDEX, EARTH_INDEX, SIZE_INDEX, CONNECT_INDEX, FACIL_INDEX, MCONE_INDEX,
  getSizeIndex,
  calcSeismicGroup,
} from '../engine/seismicConstants.js'

// ── 디자인 토큰 ──────────────────────────────────────────────
const C = {
  teal:   '#0d9488',   // 포인트: 틸
  tealD:  '#0f766e',
  tealL:  '#ccfbf1',
  amber:  '#d97706',
  amberL: '#fef3c7',
  slate:  '#334155',
  slateL: '#f1f5f9',
  ink:    '#0f172a',
  muted:  '#64748b',
  border: '#e2e8f0',
  red:    '#ef4444',
  redL:   '#fee2e2',
  green:  '#16a34a',
  greenL: '#dcfce7',
  bg:     '#f8fafc',
}

// ── 관로 단면 SVG — 지반 위에 매설된 모습 ───────────────────
function BuriedPipeSVG({ soilType, DN, t }: { soilType: string; DN: number; t: number }) {
  const soilColors: Record<string, string> = {
    S1: '#a0856a', S2: '#c4a882', S3: '#d4b896',
    S4: '#b8c4a0', S5: '#c8d4a0', S6: '#d0c8a0',
  }
  const soilColor = soilColors[soilType] || '#c4a882'
  const r = 38, cx = 80, cy = 80
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {/* 지반 */}
      <rect x="0" y="60" width="160" height="100" fill={soilColor} opacity="0.35" rx="0"/>
      {/* 지표면 */}
      <line x1="0" y1="60" x2="160" y2="60" stroke={C.slate} strokeWidth="1.5" strokeDasharray="4 3"/>
      {/* 지반 해칭 */}
      {[0,10,20,30,40].map(i => (
        <line key={i} x1={i*4} y1="62" x2={i*4-8} y2="72" stroke={soilColor} strokeWidth="1" opacity="0.6"/>
      ))}
      {/* 관 외면 */}
      <circle cx={cx} cy={cy} r={r} fill="white" stroke={C.teal} strokeWidth="2.5"/>
      {/* 관 내면 */}
      <circle cx={cx} cy={cy} r={r - 8} fill={C.tealL} stroke={C.teal} strokeWidth="1.5"/>
      {/* 관 두께 치수선 */}
      <line x1={cx+r-8} y1={cy} x2={cx+r} y2={cy} stroke={C.amber} strokeWidth="1"/>
      <text x={cx+r+4} y={cy+4} fontSize="8" fill={C.amber} fontFamily="JetBrains Mono, monospace">t</text>
      {/* DN 치수선 */}
      <line x1={cx-(r-8)} y1={cy+50} x2={cx+(r-8)} y2={cy+50} stroke={C.slate} strokeWidth="0.8" markerEnd="url(#arr)"/>
      <text x={cx} y={cy+58} fontSize="8" fill={C.slate} textAnchor="middle" fontFamily="JetBrains Mono, monospace">DN</text>
      {/* 토피 h */}
      <line x1="148" y1="60" x2="148" y2={cy-r} stroke={C.amber} strokeWidth="1" strokeDasharray="2 2"/>
      <text x="152" y="52" fontSize="7" fill={C.amber} fontFamily="JetBrains Mono, monospace">h</text>
      {/* 지반종류 라벨 */}
      <text x="6" y="78" fontSize="8" fill={C.slate} fontFamily="sans-serif" opacity="0.7">{soilType}</text>
    </svg>
  )
}

// ── 지진파 진행도 SVG ────────────────────────────────────────
function SeismicWaveSVG({ seismicityGroup }: { seismicityGroup: number }) {
  const color = seismicityGroup === 1 ? C.red : C.teal
  const amp = seismicityGroup === 1 ? 22 : 12
  const pts = Array.from({ length: 61 }, (_, i) => {
    const x = 10 + i * 2.3
    const y = 40 + Math.sin((i / 60) * Math.PI * 4) * amp * Math.exp(-i / 40)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width="160" height="80" viewBox="0 0 160 80">
      <line x1="10" y1="40" x2="150" y2="40" stroke={C.border} strokeWidth="1"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="10" y="74" fontSize="8" fill={color} fontFamily="sans-serif">
        {seismicityGroup === 1 ? '1그룹 — 중점고려' : '2그룹 — 관찰대상'}
      </text>
    </svg>
  )
}

// ── VI 레이더/막대 시각화 ────────────────────────────────────
function VIGauge({ VI }: { VI: number }) {
  const max = 120
  const pct = Math.min(VI / max, 1)
  const angle = pct * 180
  const r = 54, cx = 80, cy = 70
  const rad = (a: number) => (a - 180) * Math.PI / 180
  const x1 = cx + r * Math.cos(rad(0))
  const y1 = cy + r * Math.sin(rad(0))
  const x2 = cx + r * Math.cos(rad(angle))
  const y2 = cy + r * Math.sin(rad(angle))
  const largeArc = angle > 180 ? 1 : 0
  const color = VI >= 40 ? C.red : VI >= 25 ? C.amber : C.teal

  return (
    <svg width="160" height="90" viewBox="0 0 160 90">
      {/* 배경 호 */}
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke={C.border} strokeWidth="10" strokeLinecap="round"/>
      {/* 구역 색 */}
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(rad(60))} ${cy+r*Math.sin(rad(60))}`}
        fill="none" stroke={C.tealL} strokeWidth="10" opacity="0.8"/>
      <path d={`M ${cx+r*Math.cos(rad(60))} ${cy+r*Math.sin(rad(60))} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(rad(120))} ${cy+r*Math.sin(rad(120))}`}
        fill="none" stroke={C.amberL} strokeWidth="10" opacity="0.8"/>
      <path d={`M ${cx+r*Math.cos(rad(120))} ${cy+r*Math.sin(rad(120))} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke={C.redL} strokeWidth="10" opacity="0.8"/>
      {/* 값 호 */}
      {pct > 0 && (
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/>
      )}
      {/* 수치 */}
      <text x={cx} y={cy+4} textAnchor="middle" fontSize="22" fontWeight="700"
        fill={color} fontFamily="JetBrains Mono, monospace">{VI.toFixed(0)}</text>
      <text x={cx} y={cy+18} textAnchor="middle" fontSize="9" fill={C.muted}>취약도지수 VI</text>
      {/* 경계 라벨 */}
      <text x="12" y={cy+14} fontSize="8" fill={C.muted}>0</text>
      <text x={cx-4} y="14" fontSize="8" fill={C.muted}>40</text>
      <text x="134" y={cy+14} fontSize="8" fill={C.muted}>{max}</text>
    </svg>
  )
}

// ── 세부지수 플로차트형 시각화 ───────────────────────────────
function IndexBreakdown({
  FLEX, KIND, EARTH, SIZE, CONNECT, FACIL, MCONE, VI,
}: {
  FLEX: number; KIND: number; EARTH: number; SIZE: number;
  CONNECT: number; FACIL: number; MCONE: number; VI: number;
}) {
  const subTotal = KIND + EARTH + SIZE + CONNECT + FACIL + MCONE
  const items = [
    { key: 'KIND',    val: KIND,    label: '관종', max: 1.0 },
    { key: 'EARTH',   val: EARTH,   label: '지반상태', max: 2.0 },
    { key: 'SIZE',    val: SIZE,    label: '관경', max: 1.0 },
    { key: 'CONNECT', val: CONNECT, label: '이음부 상태', max: 1.0 },
    { key: 'FACIL',   val: FACIL,   label: '주요시설', max: 1.0 },
    { key: 'MCONE',   val: MCONE,   label: '이음처리', max: 1.0 },
  ]
  return (
    <svg width="100%" viewBox="0 0 540 180" style={{ display: 'block' }}>
      {/* FLEX 박스 */}
      <rect x="10" y="60" width="80" height="60" rx="8" fill={C.tealL} stroke={C.teal} strokeWidth="1.5"/>
      <text x="50" y="84" textAnchor="middle" fontSize="11" fill={C.tealD} fontWeight="700">FLEX</text>
      <text x="50" y="100" textAnchor="middle" fontSize="20" fill={C.tealD} fontWeight="700" fontFamily="JetBrains Mono, monospace">{FLEX.toFixed(0)}</text>
      <text x="50" y="114" textAnchor="middle" fontSize="9" fill={C.muted}>유연도지수</text>
      {/* × 기호 */}
      <text x="100" y="94" textAnchor="middle" fontSize="18" fill={C.slate} fontWeight="300">×</text>
      {/* ( 괄호 */}
      <text x="108" y="98" fontSize="28" fill={C.muted} fontWeight="200">(</text>
      {/* 세부지수 막대들 */}
      {items.map((it, i) => {
        const x = 122 + i * 68
        const barH = Math.round((it.val / 2.0) * 48)
        const barY = 112 - barH
        const isMax = it.val >= it.max
        const col = isMax ? C.amber : C.teal
        return (
          <g key={it.key}>
            <rect x={x+4} y={barY} width="34" height={barH} rx="3" fill={col} opacity="0.25"/>
            <rect x={x+4} y={barY} width="34" height={barH} rx="3" fill={col} opacity="0.6"/>
            <text x={x+21} y="126" textAnchor="middle" fontSize="8" fill={C.slate}>{it.label}</text>
            <text x={x+21} y={barY-4} textAnchor="middle" fontSize="9" fill={col} fontWeight="700" fontFamily="JetBrains Mono, monospace">{it.val.toFixed(1)}</text>
            {i < items.length - 1 && (
              <text x={x+55} y="98" fontSize="11" fill={C.muted}>+</text>
            )}
          </g>
        )
      })}
      {/* ) 괄호 */}
      <text x="530" y="98" fontSize="28" fill={C.muted} fontWeight="200">)</text>
      {/* = VI */}
      <text x="270" y="168" textAnchor="middle" fontSize="11" fill={C.muted}>= FLEX × ({subTotal.toFixed(1)}) = </text>
      <text x="380" y="168" fontSize="14" fill={VI >= 40 ? C.red : C.tealD} fontWeight="700" fontFamily="JetBrains Mono, monospace">{VI.toFixed(1)}</text>
    </svg>
  )
}

// ── 판정 흐름도 SVG ─────────────────────────────────────────
function DecisionFlowSVG({
  seismicityGroup, VI, isCritical,
}: { seismicityGroup: number; VI: number; isCritical: boolean }) {
  return (
    <svg width="100%" viewBox="0 0 480 110" style={{ display: 'block' }}>
      {/* 박스 1: 지진도 그룹 */}
      <rect x="10" y="30" width="110" height="50" rx="8" fill={seismicityGroup===1 ? '#fef3c7' : C.slateL} stroke={seismicityGroup===1 ? C.amber : C.border} strokeWidth="1.5"/>
      <text x="65" y="52" textAnchor="middle" fontSize="10" fill={C.slate} fontWeight="700">지진도 그룹</text>
      <text x="65" y="68" textAnchor="middle" fontSize="16" fill={seismicityGroup===1 ? C.amber : C.muted} fontWeight="700" fontFamily="JetBrains Mono, monospace">{seismicityGroup}그룹</text>
      {/* 화살표 */}
      <line x1="122" y1="55" x2="160" y2="55" stroke={C.slate} strokeWidth="1.2" markerEnd="url(#arh)"/>
      <defs>
        <marker id="arh" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill={C.slate}/>
        </marker>
      </defs>
      {/* 박스 2: VI */}
      <rect x="162" y="30" width="110" height="50" rx="8" fill={VI>=40 ? '#fee2e2' : C.slateL} stroke={VI>=40 ? C.red : C.border} strokeWidth="1.5"/>
      <text x="217" y="52" textAnchor="middle" fontSize="10" fill={C.slate} fontWeight="700">취약도지수</text>
      <text x="217" y="68" textAnchor="middle" fontSize="16" fill={VI>=40 ? C.red : C.muted} fontWeight="700" fontFamily="JetBrains Mono, monospace">VI={VI.toFixed(0)}</text>
      {/* 화살표 */}
      <line x1="274" y1="55" x2="312" y2="55" stroke={C.slate} strokeWidth="1.2" markerEnd="url(#arh)"/>
      {/* 조건 다이아몬드 */}
      <polygon points="330,35 370,55 330,75 290,55" fill="white" stroke={C.slate} strokeWidth="1.5"/>
      <text x="330" y="52" textAnchor="middle" fontSize="8" fill={C.slate}>1그룹</text>
      <text x="330" y="63" textAnchor="middle" fontSize="8" fill={C.slate}>VI≥40?</text>
      {/* Yes 화살표 → 중요 */}
      <line x1="372" y1="55" x2="400" y2="55" stroke={isCritical ? C.red : C.border} strokeWidth="1.5" markerEnd="url(#arh)"/>
      <rect x="400" y="32" width="72" height="46" rx="8" fill={isCritical ? C.redL : C.slateL} stroke={isCritical ? C.red : C.border} strokeWidth={isCritical ? 2 : 1}/>
      <text x="436" y="51" textAnchor="middle" fontSize="9" fill={isCritical ? C.red : C.muted} fontWeight="700">중요상수도</text>
      <text x="436" y="64" textAnchor="middle" fontSize="8" fill={isCritical ? C.red : C.muted}>(상세평가)</text>
      <text x="386" y="51" textAnchor="middle" fontSize="8" fill={C.muted}>Yes</text>
      {/* No 화살표 → 유보 */}
      <line x1="330" y1="75" x2="330" y2="105" stroke={!isCritical ? C.teal : C.border} strokeWidth="1.2"/>
      <text x="344" y="96" fontSize="8" fill={C.muted}>No</text>
      <text x="330" y="105" textAnchor="middle" fontSize="9" fill={!isCritical ? C.tealD : C.muted} fontWeight="700">유보상수도</text>
    </svg>
  )
}

// ── UI 컴포넌트 ──────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
      border: active ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
      background: active ? C.teal : 'white',
      color: active ? 'white' : C.slate,
      fontWeight: active ? 700 : 400,
      fontFamily: 'JetBrains Mono, monospace',
      transition: 'all .15s',
    }}>{children}</button>
  )
}
function F({ label: lb, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ flex: wide ? '1 1 100%' : '1 1 200px', minWidth: 180 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>{lb}</div>
      {children}
    </div>
  )
}
function NumInput({ value, onChange, min, max, step }: { value: string; onChange: (v: string) => void; min?: number; max?: number; step?: number }) {
  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)} min={min} max={max} step={step}
      style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', background: 'white', outline: 'none' }}/>
  )
}

// ──────────────────────────────────────────────────────────────
export default function SeismicPrelimPage() {
  const [zone, setZone] = useState<'I'|'II'>('I')
  const [seismicGrade, setSeismicGrade] = useState<'I'|'II'>('I')
  const [isUrban, setIsUrban] = useState(true)
  const [soilType, setSoilType] = useState('S2')
  const [pipeKind, setPipeKind] = useState('ductile')
  const [DN, setDN] = useState('300')
  const [thickness, setThickness] = useState('8.0')
  const [connectCond, setConnectCond] = useState('normal')
  const [facilExists, setFacilExists] = useState('yes')
  const [mcone, setMcone] = useState('bolted')
  const [calc, setCalc] = useState(false)

  const r = useMemo(() => {
    const dn = parseFloat(DN)||300, t = parseFloat(thickness)||8
    const ratio = dn/t
    const FLEX = calcFLEX(ratio)
    const KIND = KIND_INDEX[pipeKind as keyof typeof KIND_INDEX]?.score ?? 1.0
    const EARTH = (EARTH_INDEX as any)[soilType]?.score ?? 1.3
    const sizeKey = getSizeIndex(dn)
    const SIZE = SIZE_INDEX[sizeKey as keyof typeof SIZE_INDEX]?.score ?? 1.0
    const CONNECT = CONNECT_INDEX[connectCond as keyof typeof CONNECT_INDEX]?.score ?? 0.8
    const FACIL = FACIL_INDEX[facilExists as keyof typeof FACIL_INDEX]?.score ?? 0.8
    const MCONE = MCONE_INDEX[mcone as keyof typeof MCONE_INDEX]?.score ?? 0.7
    const VI_sub = KIND+EARTH+SIZE+CONNECT+FACIL+MCONE
    const VI = FLEX * VI_sub
    const seismicityGroup = getSeismicityGroup(zone, isUrban, soilType)
    const seismicGroup = calcSeismicGroup(seismicityGroup, VI)
    return { ratio, FLEX, KIND, EARTH, SIZE, CONNECT, FACIL, MCONE, VI_sub, VI, seismicityGroup, isCritical: seismicGroup==='critical' }
  }, [zone, isUrban, soilType, pipeKind, DN, thickness, connectCond, facilExists, mcone])

  const Z = SEISMIC_ZONE[zone].Z
  const gradeInfo = SEISMIC_GRADE[seismicGrade]
  const I_collapse = gradeInfo.I_collapse   // 붕괴방지수준 위험도계수
  const I_func = gradeInfo.I_func           // 기능수행수준 위험도계수
  const S_collapse = +(Z * I_collapse).toFixed(3)
  const S_func = +(Z * I_func).toFixed(3)

  // 섹션 카드 공통 스타일
  const section = (accent = C.teal) => ({
    background: 'white', borderRadius: 12,
    border: `1px solid ${C.border}`,
    overflow: 'hidden' as const, marginBottom: 16,
  })
  const sh = (accent = C.teal) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 20px',
    background: accent, color: 'white',
    fontSize: 13, fontWeight: 700, letterSpacing: 0.3,
  })
  const sb = { padding: '18px 20px' }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: 'Pretendard, sans-serif' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.ink} 0%, #1e3a5f 60%, #0d4a3a 100%)`,
        borderRadius: 14, padding: '28px 32px', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* 배경 격자 */}
        <svg style={{ position:'absolute', inset:0, opacity:.06 }} width="100%" height="100%">
          {Array.from({length:12},(_,i)=><line key={i} x1={i*80} y1="0" x2={i*80} y2="200" stroke="white" strokeWidth="1"/>)}
          {Array.from({length:6},(_,i)=><line key={i} x1="0" y1={i*40} x2="900" y2={i*40} stroke="white" strokeWidth="1"/>)}
        </svg>
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
            <span style={{ background: C.teal, color:'white', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, letterSpacing:.5 }}>KDS 57 17 00</span>
            <span style={{ background:'rgba(255,255,255,.12)', color:'rgba(255,255,255,.7)', fontSize:10, padding:'2px 8px', borderRadius:4 }}>내진성능 평가요령 부록 A</span>
          </div>
          <div style={{ color:'white', fontSize:22, fontWeight:800, letterSpacing:-.3 }}>내진성능 예비평가</div>
          <div style={{ color:'rgba(255,255,255,.5)', fontSize:13, marginTop:4 }}>
            매설관로 취약도지수(VI) 산정 → 내진성능 그룹 판정 (상세평가 필요 여부)
          </div>
        </div>
      </div>

      {/* ── STEP 1: 지진조건 ────────────────────────────────── */}
      <div style={section()}>
        <div style={sh()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/>
            <text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">1</text>
          </svg>
          지진조건 설정
        </div>
        <div style={sb}>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {/* 왼쪽: 입력 */}
            <div style={{ flex:'1 1 340px' }}>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:14 }}>
                <F label="지진구역">
                  <div style={{ display:'flex', gap:6 }}>
                    <Chip active={zone==='I'} onClick={()=>setZone('I')}>구역 Ⅰ · Z=0.11</Chip>
                    <Chip active={zone==='II'} onClick={()=>setZone('II')}>구역 Ⅱ · Z=0.07</Chip>
                  </div>
                </F>
                <F label="내진등급">
                  <div style={{ display:'flex', gap:6 }}>
                    <Chip active={seismicGrade==='I'} onClick={()=>setSeismicGrade('I')}>
                      내진Ⅰ등급
                    </Chip>
                    <Chip active={seismicGrade==='II'} onClick={()=>setSeismicGrade('II')}>
                      내진Ⅱ등급
                    </Chip>
                  </div>
                </F>
                <F label="권역">
                  <div style={{ display:'flex', gap:6 }}>
                    <Chip active={isUrban} onClick={()=>setIsUrban(true)}>도시권역</Chip>
                    <Chip active={!isUrban} onClick={()=>setIsUrban(false)}>기타지역</Chip>
                  </div>
                </F>
              </div>
              <F label="지반종류" wide>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {Object.keys(SOIL_TYPE).map(k=>(
                    <Chip key={k} active={soilType===k} onClick={()=>setSoilType(k)}>{k}</Chip>
                  ))}
                </div>
                <div style={{ marginTop:6, fontSize:11, color:C.muted, lineHeight:1.5 }}>
                  {SOIL_TYPE[soilType as keyof typeof SOIL_TYPE]?.label}
                </div>
              </F>
              {/* 설계가속도 — 두 수준 모두 표시 */}
              <div style={{ marginTop:14, background:C.tealL, borderRadius:8, padding:'10px 14px' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                  <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                    <path d="M4 20 L8 12 L12 16 L17 6 L22 13 L25 10" stroke={C.tealD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ fontSize:11, color:C.tealD, fontWeight:700 }}>
                    {gradeInfo.label} — 설계지반가속도
                  </div>
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:10, color:C.muted }}>붕괴방지수준 (재현주기 {gradeInfo.returnPeriod_collapse}년, I={I_collapse})</div>
                    <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:15, fontWeight:700, color:C.tealD }}>
                      S = {Z} × {I_collapse} = {S_collapse.toFixed(3)} g
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.muted }}>기능수행수준 (재현주기 {gradeInfo.returnPeriod_func}년, I={I_func})</div>
                    <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:15, fontWeight:700, color:C.tealD }}>
                      S = {Z} × {I_func} = {S_func.toFixed(3)} g
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 오른쪽: 삽도 */}
            <div style={{ flex:'0 0 160px', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginBottom:2 }}>지반분류 모식도</div>
              <BuriedPipeSVG soilType={soilType} DN={parseFloat(DN)||300} t={parseFloat(thickness)||8}/>
              <div style={{ fontSize:10, color:C.muted }}>지반종류 {soilType}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 2: 관로 정보 ───────────────────────────────── */}
      <div style={section('#1e4d7a')}>
        <div style={sh('#1e4d7a')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/>
            <text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">2</text>
          </svg>
          관로 기본정보
        </div>
        <div style={sb}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <F label="관종" wide>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[['ductile','덕타일 주철관'],['steel','강관'],['concrete','콘크리트관'],['pvc','PVC관']].map(([k,lbl])=>(
                  <Chip key={k} active={pipeKind===k} onClick={()=>setPipeKind(k)}>{lbl}</Chip>
                ))}
              </div>
            </F>
            <F label="공칭관경 DN (mm)">
              <NumInput value={DN} onChange={setDN} min={50} max={3000} step={50}/>
            </F>
            <F label="관두께 t (mm)">
              <NumInput value={thickness} onChange={setThickness} min={1} step={0.5}/>
              <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>
                D/t = {(parseFloat(DN)/parseFloat(thickness)||0).toFixed(1)} → <strong>FLEX = {calcFLEX(parseFloat(DN)/parseFloat(thickness)||0).toFixed(0)}</strong>
              </div>
            </F>
            <F label="이음부 상태 (CONNECT)">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(CONNECT_INDEX).map(([k,v])=>(
                  <Chip key={k} active={connectCond===k} onClick={()=>setConnectCond(k)}>{v.label} · {v.score}</Chip>
                ))}
              </div>
            </F>
            <F label="주요시설물 (FACIL)">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(FACIL_INDEX).map(([k,v])=>(
                  <Chip key={k} active={facilExists===k} onClick={()=>setFacilExists(k)}>{v.label} · {v.score}</Chip>
                ))}
              </div>
            </F>
            <F label="이음처리방법 (MCONE)">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(MCONE_INDEX).map(([k,v])=>(
                  <Chip key={k} active={mcone===k} onClick={()=>setMcone(k)}>{v.label} · {v.score}</Chip>
                ))}
              </div>
            </F>
          </div>
        </div>
      </div>

      {/* ── 계산 버튼 ───────────────────────────────────────── */}
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <button onClick={()=>setCalc(true)} style={{
          background: `linear-gradient(135deg, ${C.teal}, ${C.tealD})`,
          color:'white', border:'none', borderRadius:10,
          padding:'13px 52px', fontSize:15, fontWeight:700, cursor:'pointer',
          boxShadow:`0 4px 16px ${C.teal}55`, letterSpacing:.4,
        }}>
          취약도지수 산정 및 그룹 판정
        </button>
      </div>

      {/* ── STEP 3: 결과 ────────────────────────────────────── */}
      {calc && (
        <>
          {/* VI 분해 시각화 */}
          <div style={section()}>
            <div style={sh()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/>
                <text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">3</text>
              </svg>
              취약도지수(VI) 산정 — VI = FLEX × (KIND + EARTH + SIZE + CONNECT + FACIL + MCONE)
            </div>
            <div style={sb}>
              <IndexBreakdown
                FLEX={r.FLEX} KIND={r.KIND} EARTH={r.EARTH} SIZE={r.SIZE}
                CONNECT={r.CONNECT} FACIL={r.FACIL} MCONE={r.MCONE} VI={r.VI}
              />
              {/* 수치 테이블 */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:16 }}>
                {[
                  { k:'FLEX', v:r.FLEX, desc:`D/t=${r.ratio.toFixed(1)}` },
                  { k:'KIND', v:r.KIND, desc:KIND_INDEX[pipeKind as keyof typeof KIND_INDEX]?.label??'' },
                  { k:'EARTH', v:r.EARTH, desc:(EARTH_INDEX as any)[soilType]?.label??'' },
                  { k:'SIZE', v:r.SIZE, desc:SIZE_INDEX[getSizeIndex(parseFloat(DN)) as keyof typeof SIZE_INDEX]?.label??'' },
                  { k:'CONNECT', v:r.CONNECT, desc:CONNECT_INDEX[connectCond as keyof typeof CONNECT_INDEX]?.label??'' },
                  { k:'FACIL', v:r.FACIL, desc:FACIL_INDEX[facilExists as keyof typeof FACIL_INDEX]?.label??'' },
                  { k:'MCONE', v:r.MCONE, desc:MCONE_INDEX[mcone as keyof typeof MCONE_INDEX]?.label??'' },
                ].map(({ k, v, desc }) => (
                  <div key={k} style={{ flex:'1 1 100px', background:C.slateL, borderRadius:8, padding:'8px 12px', minWidth:90 }}>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:700 }}>{k}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:C.tealD, fontFamily:'JetBrains Mono, monospace' }}>{v.toFixed(1)}</div>
                    <div style={{ fontSize:9, color:C.muted, marginTop:2, lineHeight:1.3 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 판정 */}
          <div style={section()}>
            <div style={sh(r.isCritical ? '#b91c1c' : C.tealD)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5"/>
                <text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">4</text>
              </svg>
              내진성능 그룹 판정
            </div>
            <div style={sb}>
              <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start' }}>
                {/* 게이지 */}
                <div style={{ flex:'0 0 160px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:4, fontWeight:600 }}>취약도지수 게이지</div>
                  <VIGauge VI={r.VI}/>
                  <div style={{ fontSize:11, color:r.VI>=40?C.red:C.tealD, fontWeight:700, marginTop:4 }}>
                    {r.VI>=40 ? '위험 (VI≥40)' : r.VI>=25 ? '주의 (VI≥25)' : '양호 (VI<25)'}
                  </div>
                </div>
                {/* 판정 흐름도 */}
                <div style={{ flex:'1 1 280px' }}>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:6, fontWeight:600 }}>판정 흐름도</div>
                  <DecisionFlowSVG seismicityGroup={r.seismicityGroup} VI={r.VI} isCritical={r.isCritical}/>
                  <SeismicWaveSVG seismicityGroup={r.seismicityGroup}/>
                </div>
                {/* 판정 결과 텍스트 */}
                <div style={{ flex:'1 1 200px' }}>
                  <div style={{
                    borderRadius:10, padding:'16px 18px',
                    border:`2px solid ${r.isCritical ? C.red : C.teal}`,
                    background: r.isCritical ? C.redL : C.tealL,
                  }}>
                    <div style={{ fontSize:11, color:r.isCritical?C.red:C.tealD, fontWeight:600, marginBottom:4 }}>최종 판정</div>
                    <div style={{ fontSize:17, fontWeight:800, color:r.isCritical?C.red:C.tealD, marginBottom:8 }}>
                      {r.isCritical ? '내진성능 중요상수도' : '내진성능 유보상수도'}
                    </div>
                    <div style={{ fontSize:11, color:C.slate, lineHeight:1.8 }}>
                      지진도 <strong>{r.seismicityGroup}그룹</strong> /{' '}
                      VI = <strong style={{ fontFamily:'JetBrains Mono, monospace' }}>{r.VI.toFixed(1)}</strong>
                      {r.isCritical
                        ? <><br/>1그룹 + VI≥40 → <strong style={{color:C.red}}>상세평가 필요</strong></>
                        : <><br/>조건 미충족 → <strong style={{color:C.tealD}}>관찰대상</strong></>}
                    </div>
                    {r.isCritical && (
                      <div style={{ marginTop:10, fontSize:11, color:C.red, fontWeight:600, background:'white', borderRadius:6, padding:'7px 10px' }}>
                        ⚠ 내진성능 상세평가 탭에서<br/>응답변위법 정밀 검토를 진행하십시오.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 기준 각주 */}
              <div style={{ marginTop:16, padding:'10px 14px', background:C.slateL, borderRadius:8, fontSize:11, color:C.muted, lineHeight:1.8, borderLeft:`3px solid ${C.teal}` }}>
                <strong>적용기준</strong> 기존시설물(상수도) 내진성능 평가요령 부록 A / 해설표 3.4.1<br/>
                <strong>판정기준</strong> 지진도 1그룹 AND VI ≥ 40 → 중요상수도 → 상세평가 대상
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
