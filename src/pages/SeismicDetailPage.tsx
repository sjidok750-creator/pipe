import React, { useState, useMemo } from 'react'
import {
  SEISMIC_ZONE, RISK_FACTOR, SEISMIC_GRADE, SOIL_TYPE, AMP_FACTOR,
} from '../engine/seismicConstants.js'
import { evalSegmented } from '../engine/seismicSegmented.js'
import { evalContinuous } from '../engine/seismicContinuous.js'
import { interpAmpFactor } from '../engine/seismicSegmented.js'

// ── 스타일 헬퍼 ──────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff',
  border: '1.5px solid #dde8f5',
  borderRadius: 12,
  overflow: 'hidden',
  marginBottom: 20,
}
const sectionHeader = (color = '#003366'): React.CSSProperties => ({
  background: color,
  color: '#fff',
  padding: '14px 24px',
  fontWeight: 700,
  fontSize: 15,
})
const body: React.CSSProperties = { padding: '20px 24px' }
const lbl: React.CSSProperties = { fontSize: 12, color: '#5a6a8a', marginBottom: 4, fontWeight: 600 }
const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #b0c8e8',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, monospace',
  outline: 'none',
  background: '#f8faff',
}
const btnGroup: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
function Btn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 16px', borderRadius: 8,
      border: active ? '2px solid #003366' : '1.5px solid #b0c8e8',
      background: active ? '#003366' : '#f8faff',
      color: active ? '#fff' : '#334',
      fontWeight: active ? 700 : 400, fontSize: 13, cursor: 'pointer',
      fontFamily: 'JetBrains Mono, monospace',
    }}>{children}</button>
  )
}
function Field({ label: lb, children, flex }: { label: string; children: React.ReactNode; flex?: string }) {
  return (
    <div style={{ flex: flex ?? '1 1 calc(50% - 8px)', minWidth: 200, marginBottom: 16 }}>
      <div style={lbl}>{lb}</div>
      {children}
    </div>
  )
}
function Badge({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13,
      background: ok ? '#e6f7ed' : '#fff0f0',
      color: ok ? '#1a7a3a' : '#c0392b',
      border: `1.5px solid ${ok ? '#a3d9b5' : '#f5b3b3'}`,
    }}>{ok ? 'OK' : 'NG'}</span>
  )
}

// 결과 행
function ResultRow({ name, value, unit, limit, limitLabel, ok }:
  { name: string; value: number; unit: string; limit?: number; limitLabel?: string; ok?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
      borderBottom: '1px solid #eef2f8', fontSize: 13,
    }}>
      <div style={{ width: 220, color: '#334', fontWeight: 600 }}>{name}</div>
      <div style={{ width: 130, fontFamily: 'JetBrains Mono, monospace', color: '#003366', fontWeight: 700 }}>
        {isFinite(value) ? value.toFixed(4) : '—'} <span style={{ color: '#7a8a9a', fontWeight: 400 }}>{unit}</span>
      </div>
      {limit !== undefined && (
        <>
          <div style={{ width: 130, fontFamily: 'JetBrains Mono, monospace', color: '#666' }}>
            ≤ {limit.toFixed(4)} <span style={{ color: '#9a9aaa' }}>{unit}</span>
          </div>
          <div style={{ width: 100 }}>{ok !== undefined ? <Badge ok={ok} /> : null}</div>
          <div style={{ fontSize: 11, color: '#7a8a9a' }}>{limitLabel}</div>
        </>
      )}
    </div>
  )
}

// 지반 층 입력 컴포넌트
function LayerInput({ layers, setLayers }: {
  layers: { H: number; Vs: number }[];
  setLayers: (l: { H: number; Vs: number }[]) => void;
}) {
  const add = () => setLayers([...layers, { H: 5, Vs: 200 }])
  const remove = (i: number) => setLayers(layers.filter((_, j) => j !== i))
  const update = (i: number, key: 'H' | 'Vs', v: string) => {
    const next = [...layers]
    next[i] = { ...next[i], [key]: parseFloat(v) || 0 }
    setLayers(next)
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#5a6a8a', fontWeight: 700 }}>
        <span style={{ width: 40 }}>층</span>
        <span style={{ width: 120 }}>두께 H (m)</span>
        <span style={{ width: 140 }}>전단파속도 Vs (m/s)</span>
      </div>
      {layers.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
          <span style={{ width: 40, fontSize: 13, color: '#7a8a9a' }}>L{i + 1}</span>
          <input style={{ ...inputStyle, width: 120 }} type="number" value={l.H} onChange={e => update(i, 'H', e.target.value)} min={0.1} step={0.5} />
          <input style={{ ...inputStyle, width: 140 }} type="number" value={l.Vs} onChange={e => update(i, 'Vs', e.target.value)} min={50} step={10} />
          {layers.length > 1 && (
            <button onClick={() => remove(i)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #f5b3b3', background: '#fff0f0', color: '#c0392b', cursor: 'pointer', fontSize: 12 }}>삭제</button>
          )}
        </div>
      ))}
      <button onClick={add} style={{ padding: '6px 16px', borderRadius: 8, border: '1.5px solid #b0c8e8', background: '#f8faff', color: '#003366', cursor: 'pointer', fontSize: 13 }}>+ 층 추가</button>
      <div style={{ fontSize: 11, color: '#7a8a9a', marginTop: 6 }}>
        총 두께 H_total = {layers.reduce((s, l) => s + l.H, 0).toFixed(1)} m
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
export default function SeismicDetailPage() {
  // 관종 선택
  const [pipeType, setPipeType] = useState<'segmented' | 'continuous'>('segmented')

  // 공통: 지진 조건
  const [zone, setZone] = useState<'I' | 'II'>('I')
  const [seismicGrade, setSeismicGrade] = useState<'I' | 'II'>('I')
  const [soilType, setSoilType] = useState('S2')

  // 공통: 관로 제원
  const [DN, setDN] = useState('300')
  const [thickness, setThickness] = useState('8.0')
  const [Dout, setDout] = useState('322')  // mm
  const [P, setP] = useState('0.5')        // MPa
  const [hCover, setHCover] = useState('1.5')  // m

  // 분절관 추가 입력
  const [Lj, setLj] = useState('6')          // m (1본 길이)
  const [isSeismicJoint, setIsSeismicJoint] = useState(false)

  // 연속관 추가 입력
  const [deltaT, setDeltaT] = useState('20')      // °C
  const [Dsettle, setDsettle] = useState('0')     // m
  const [Lsettle, setLsettle] = useState('0')     // m

  // 지반 층 입력
  const [layers, setLayers] = useState([
    { H: 5, Vs: 150 },
    { H: 10, Vs: 250 },
    { H: 5, Vs: 350 },
  ])
  const [Vbs, setVbs] = useState('500')  // 기반암 Vs

  const [showResult, setShowResult] = useState(false)

  // 증폭계수 (S1은 테이블 없음)
  const ampEntry = (AMP_FACTOR as any)[soilType]
  const S = SEISMIC_ZONE[zone].Z * RISK_FACTOR[seismicGrade === 'I' ? 1000 : 500]
  const Fa_num = ampEntry ? interpAmpFactor(ampEntry.Fa, S) : 1.0
  const Fv_num = ampEntry ? interpAmpFactor(ampEntry.Fv, S) : 1.0

  const result = useMemo(() => {
    if (!showResult) return null
    const Z = SEISMIC_ZONE[zone].Z
    const I_seismic = RISK_FACTOR[seismicGrade === 'I' ? 1000 : 500]
    const dn = parseFloat(DN)
    const t = parseFloat(thickness)
    const D_out = parseFloat(Dout)
    const p = parseFloat(P)
    const z_pipe = parseFloat(hCover) + D_out / 1000 / 2
    const Fa_table = ampEntry?.Fa ?? [1.0, 1.0, 1.0]
    const Fv_table = ampEntry?.Fv ?? [1.0, 1.0, 1.0]
    const vbs = parseFloat(Vbs)

    if (pipeType === 'segmented') {
      return evalSegmented({
        DN: dn, t, D: D_out,
        Z, I_seismic,
        Fa_table, Fv_table,
        layers, Vbs: vbs,
        P: p,
        Lj: parseFloat(Lj),
        h_cover: parseFloat(hCover),
        z_pipe,
        isSeismicJoint,
      })
    } else {
      return evalContinuous({
        DN: dn, t, D_out,
        seismicGrade,
        Z, I_seismic,
        Fa_table, Fv_table,
        layers, Vbs: vbs,
        P: p,
        deltaT: parseFloat(deltaT),
        D_settle: parseFloat(Dsettle),
        L_settle: parseFloat(Lsettle),
        h_cover: parseFloat(hCover),
        z_pipe,
      })
    }
  }, [showResult, pipeType, zone, seismicGrade, soilType, DN, thickness, Dout, P, hCover, Lj, isSeismicJoint, deltaT, Dsettle, Lsettle, layers, Vbs])

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={card}>
        <div style={{ background: '#003366', padding: '24px 32px' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>
            KDS 57 17 00 : 2022 / 기존시설물(상수도) 내진성능 평가요령 부록 C
          </div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>내진성능 상세평가</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>
            응답변위법 — 분절관(주철관) / 연속관(강관)
          </div>
        </div>
      </div>

      {/* SECTION 1: 관종 및 지진 조건 */}
      <div style={card}>
        <div style={sectionHeader()}>① 관종 및 지진조건</div>
        <div style={body}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Field label="관종 선택 (계산 방법 결정)" flex="1 1 100%">
              <div style={btnGroup}>
                <Btn active={pipeType === 'segmented'} onClick={() => setPipeType('segmented')}>
                  분절관 (덕타일 주철관) — 이음부 신축량 / 회전각 검토
                </Btn>
                <Btn active={pipeType === 'continuous'} onClick={() => setPipeType('continuous')}>
                  연속관 (강관) — 축변형률 / 국부좌굴 검토
                </Btn>
              </div>
            </Field>
            <Field label="지진구역">
              <div style={btnGroup}>
                <Btn active={zone === 'I'} onClick={() => setZone('I')}>구역 Ⅰ (Z=0.11)</Btn>
                <Btn active={zone === 'II'} onClick={() => setZone('II')}>구역 Ⅱ (Z=0.07)</Btn>
              </div>
            </Field>
            <Field label="내진등급">
              <div style={btnGroup}>
                <Btn active={seismicGrade === 'I'} onClick={() => setSeismicGrade('I')}>
                  내진Ⅰ등급 (재현주기 1000년)
                </Btn>
                <Btn active={seismicGrade === 'II'} onClick={() => setSeismicGrade('II')}>
                  내진Ⅱ등급 (재현주기 500년)
                </Btn>
              </div>
            </Field>
            <Field label="지반종류" flex="1 1 100%">
              <div style={btnGroup}>
                {Object.keys(SOIL_TYPE).map(k => (
                  <Btn key={k} active={soilType === k} onClick={() => setSoilType(k)}>{k}</Btn>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#7a8a9a', marginTop: 4 }}>
                {SOIL_TYPE[soilType as keyof typeof SOIL_TYPE]?.label}
                {ampEntry
                  ? `  |  Fa = ${Fa_num.toFixed(2)},  Fv = ${Fv_num.toFixed(2)}`
                  : '  |  S1: 증폭계수 테이블 적용 불가 (부지고유특성 평가 필요)'}
              </div>
            </Field>
          </div>
          <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
            설계지반가속도 S = Z × I =
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#003366', marginLeft: 6 }}>
              {(SEISMIC_ZONE[zone].Z * RISK_FACTOR[seismicGrade === 'I' ? 1000 : 500]).toFixed(3)} g
            </span>
            {'  (Z='}{SEISMIC_ZONE[zone].Z}{', I='}{RISK_FACTOR[seismicGrade === 'I' ? 1000 : 500]}{')'}
          </div>
        </div>
      </div>

      {/* SECTION 2: 관로 제원 */}
      <div style={card}>
        <div style={sectionHeader('#1a4a7a')}>② 관로 제원</div>
        <div style={body}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Field label="공칭관경 DN (mm)">
              <input style={inputStyle} type="number" value={DN} onChange={e => setDN(e.target.value)} min={50} max={3000} step={50} />
            </Field>
            <Field label="관두께 t (mm)">
              <input style={inputStyle} type="number" value={thickness} onChange={e => setThickness(e.target.value)} min={1} step={0.5} />
            </Field>
            <Field label="외경 D_out (mm)">
              <input style={inputStyle} type="number" value={Dout} onChange={e => setDout(e.target.value)} min={50} step={1} />
            </Field>
            <Field label="설계수압 P (MPa)">
              <input style={inputStyle} type="number" value={P} onChange={e => setP(e.target.value)} min={0.01} step={0.05} />
            </Field>
            <Field label="토피 h (m)">
              <input style={inputStyle} type="number" value={hCover} onChange={e => setHCover(e.target.value)} min={0.3} step={0.1} />
            </Field>

            {/* 분절관 추가 입력 */}
            {pipeType === 'segmented' && (
              <>
                <Field label="관 1본 길이 Lj (m)">
                  <input style={inputStyle} type="number" value={Lj} onChange={e => setLj(e.target.value)} min={1} step={0.5} />
                </Field>
                <Field label="이음 종류">
                  <div style={btnGroup}>
                    <Btn active={!isSeismicJoint} onClick={() => setIsSeismicJoint(false)}>일반형 이음</Btn>
                    <Btn active={isSeismicJoint} onClick={() => setIsSeismicJoint(true)}>내진형 이음</Btn>
                  </div>
                </Field>
              </>
            )}

            {/* 연속관 추가 입력 */}
            {pipeType === 'continuous' && (
              <>
                <Field label="온도변화 ΔT (°C)">
                  <input style={inputStyle} type="number" value={deltaT} onChange={e => setDeltaT(e.target.value)} step={1} />
                </Field>
                <Field label="부등침하량 δ (m)">
                  <input style={inputStyle} type="number" value={Dsettle} onChange={e => setDsettle(e.target.value)} min={0} step={0.01} />
                </Field>
                <Field label="침하구간 길이 L_settle (m)">
                  <input style={inputStyle} type="number" value={Lsettle} onChange={e => setLsettle(e.target.value)} min={0} step={1} />
                </Field>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: 지반 조건 */}
      <div style={card}>
        <div style={sectionHeader('#234d80')}>③ 표층지반 조건 입력</div>
        <div style={body}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#003366', marginBottom: 10 }}>
                표층지반 층별 구성 (상부 → 하부)
              </div>
              <LayerInput layers={layers} setLayers={setLayers} />
            </div>
            <div style={{ flex: '0 0 200px' }}>
              <div style={{ ...lbl }}>기반암 전단파속도 Vbs (m/s)</div>
              <input style={inputStyle} type="number" value={Vbs} onChange={e => setVbs(e.target.value)} min={200} step={50} />
              <div style={{ fontSize: 11, color: '#7a8a9a', marginTop: 6 }}>
                Vbs ≥ 300 → 보정계수 ε=1.0<br/>
                Vbs &lt; 300 → ε=0.85
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 계산 버튼 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <button
          onClick={() => setShowResult(true)}
          style={{
            background: '#003366', color: '#fff', border: 'none',
            borderRadius: 10, padding: '14px 48px',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}
        >
          내진성능 상세평가 계산
        </button>
      </div>

      {/* SECTION 4: 결과 */}
      {showResult && result && (
        <>
          {/* 지반 해석 결과 */}
          <div style={card}>
            <div style={sectionHeader('#0a3058')}>④ 지반 해석 결과</div>
            <div style={body}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: '설계지반가속도 S', value: result.S.toFixed(3), unit: 'g' },
                  { label: '증폭계수 Fa', value: result.Fa.toFixed(2), unit: '' },
                  { label: '증폭계수 Fv', value: result.Fv.toFixed(2), unit: '' },
                  { label: 'SDS (단주기 설계스펙트럼)', value: result.SDS.toFixed(3), unit: 'g' },
                  { label: 'SD1 (1초 설계스펙트럼)', value: result.SD1.toFixed(3), unit: 'g' },
                  { label: 'TG (지반 고유주기)', value: result.TG.toFixed(3), unit: 's' },
                  { label: 'Ts (설계 고유주기)', value: result.Ts.toFixed(3), unit: 's' },
                  { label: 'Vds (비선형 등가 전단파속도)', value: result.Vds.toFixed(1), unit: 'm/s' },
                  { label: 'Sv (속도응답스펙트럼)', value: result.Sv.toFixed(4), unit: 'm/s' },
                  { label: 'Uh (지반수평변위)', value: result.Uh.toFixed(4), unit: 'm' },
                  { label: 'L (지진파장)', value: result.L.toFixed(2), unit: 'm' },
                  { label: '보정계수 ε', value: result.eps.toFixed(2), unit: '' },
                ].map(({ label, value, unit }) => (
                  <div key={label} style={{ background: '#f8faff', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#5a6a8a', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#003366' }}>
                      {value} <span style={{ fontSize: 12, color: '#7a8a9a' }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 분절관 결과 */}
          {pipeType === 'segmented' && (
            <div style={card}>
              <div style={sectionHeader('#1a4a7a')}>⑤ 분절관 내진 검토 결과</div>
              <div style={body}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#003366', marginBottom: 10 }}>
                    (a) 관체 축응력 검토
                  </div>
                  <ResultRow name="내압 축응력 σ_i" value={(result as any).sigma_i} unit="MPa" />
                  <ResultRow name="차량하중 축응력 σ_o" value={(result as any).sigma_o} unit="MPa" />
                  <ResultRow name="지진 축응력 σ_x" value={(result as any).sigma_x} unit="MPa" />
                  <ResultRow
                    name="조합 축응력 σ_total"
                    value={(result as any).sigma_total}
                    unit="MPa"
                    limit={(result as any).sigma_allow}
                    limitLabel="내진 허용응력 (덕타일 주철관)"
                    ok={(result as any).stressOK}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#003366', marginBottom: 10 }}>
                    (b) 이음부 신축량 검토
                  </div>
                  <ResultRow name="이음부 축방향 상대변위 u_J" value={(result as any).u_J} unit="m" />
                  <ResultRow
                    name="|u_J|"
                    value={(result as any).u_J}
                    unit="m"
                    limit={(result as any).u_allow}
                    limitLabel={`허용 신축량 (DN${DN}, ${isSeismicJoint ? '내진형' : '일반형'})`}
                    ok={(result as any).dispOK}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#003366', marginBottom: 10 }}>
                    (c) 이음부 굽힘각도 검토
                  </div>
                  <ResultRow name="이음부 굽힘각 θ_J" value={(result as any).theta_J * 180 / Math.PI} unit="°" />
                  <ResultRow
                    name="θ_J"
                    value={(result as any).theta_J * 180 / Math.PI}
                    unit="°"
                    limit={(result as any).theta_allow * 180 / Math.PI}
                    limitLabel={`허용 굽힘각 (DN${DN})`}
                    ok={(result as any).angleOK}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 연속관 결과 */}
          {pipeType === 'continuous' && (
            <div style={card}>
              <div style={sectionHeader('#1a4a7a')}>⑤ 연속관 내진 검토 결과</div>
              <div style={body}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#003366', marginBottom: 10 }}>
                    (a) 축변형률 검토 (국부좌굴 한계)
                  </div>
                  <ResultRow name="내압 축변형률 ε_i" value={(result as any).epsilon_i} unit="" />
                  <ResultRow name="차량 축변형률 ε_o" value={(result as any).epsilon_o} unit="" />
                  <ResultRow name="온도 축변형률 ε_t" value={(result as any).epsilon_t} unit="" />
                  <ResultRow name="부등침하 축변형률 ε_d" value={(result as any).epsilon_d} unit="" />
                  <ResultRow name="지진 축변형률 ε_eq (축방향)" value={(result as any).epsilon_eq_L} unit="" />
                  <ResultRow name="지진 축변형률 ε_eq (굽힘)" value={(result as any).epsilon_eq_B} unit="" />
                  <ResultRow
                    name="합산 축변형률 ε_total"
                    value={(result as any).epsilon_total}
                    unit=""
                    limit={(result as any).epsilon_allow}
                    limitLabel="허용변형률 (국부좌굴, AWWA M11)"
                    ok={(result as any).strainOK}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#003366', marginBottom: 10 }}>
                    (b) 조합응력 검토 (Von Mises)
                  </div>
                  <ResultRow name="후프응력 σ_θ" value={(result as any).sigma_theta} unit="MPa" />
                  <ResultRow name="축방향 합성응력 σ_x" value={(result as any).sigma_x_total} unit="MPa" />
                  <ResultRow
                    name="Von Mises 등가응력 σ_vm"
                    value={(result as any).sigma_vm}
                    unit="MPa"
                    limit={(result as any).sigma_allow}
                    limitLabel={`허용응력 (SS400, 내진${seismicGrade}등급)`}
                    ok={(result as any).stressOK}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 최종 판정 */}
          <div style={{
            ...card,
            border: `2px solid ${result.ok ? '#3aab6a' : '#e05c3a'}`,
            background: result.ok ? '#f3fff8' : '#fff6f3',
          }}>
            <div style={{ padding: '20px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: result.ok ? '#1a7a3a' : '#c0392b' }}>
                  {result.ok ? '내진성능 확보 — 안전' : '내진성능 부족 — 보강 필요'}
                </div>
                <Badge ok={result.ok} />
              </div>
              {pipeType === 'segmented' ? (
                <div style={{ fontSize: 13, color: '#445', lineHeight: 1.9 }}>
                  축응력: {(result as any).stressOK ? '✔ OK' : '✘ NG'} ({((result as any).sigma_total).toFixed(2)} / {(result as any).sigma_allow} MPa){'  '}
                  신축량: {(result as any).dispOK ? '✔ OK' : '✘ NG'} ({((result as any).u_J * 1000).toFixed(1)} / {((result as any).u_allow * 1000).toFixed(1)} mm){'  '}
                  굽힘각: {(result as any).angleOK ? '✔ OK' : '✘ NG'} ({((result as any).theta_J * 180 / Math.PI).toFixed(3)} / {((result as any).theta_allow * 180 / Math.PI).toFixed(1)}°)
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#445', lineHeight: 1.9 }}>
                  축변형률: {(result as any).strainOK ? '✔ OK' : '✘ NG'} ({(result as any).epsilon_total.toFixed(5)} / {(result as any).epsilon_allow.toFixed(5)}){'  '}
                  조합응력: {(result as any).stressOK ? '✔ OK' : '✘ NG'} ({(result as any).sigma_vm.toFixed(1)} / {(result as any).sigma_allow.toFixed(1)} MPa)
                </div>
              )}
              <div style={{ marginTop: 14, padding: '10px 16px', background: '#f8faff', borderRadius: 8, fontSize: 11, color: '#5a6a8a', lineHeight: 1.8 }}>
                <strong>적용기준:</strong> 기존시설물(상수도) 내진성능 평가요령 부록 C — 매설관로 내진성능 본평가 (응답변위법)<br/>
                KDS 57 17 00 : 2022 상수도 내진설계기준 / KDS 17 10 00 : 2022 내진설계 일반
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
