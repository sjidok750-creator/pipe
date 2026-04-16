import React, { useState, useMemo } from 'react'
import {
  SEISMIC_ZONE, RISK_FACTOR, SEISMIC_GRADE, SOIL_TYPE, AMP_FACTOR,
  getSeismicityGroup,
  calcFLEX,
  KIND_INDEX, EARTH_INDEX, SIZE_INDEX, CONNECT_INDEX, FACIL_INDEX, MCONE_INDEX,
  getSizeIndex,
  calcSeismicGroup,
} from '../engine/seismicConstants.js'

// ── 스타일 헬퍼 ──────────────────────────────────────────────
const card = {
  background: '#fff',
  border: '1.5px solid #dde8f5',
  borderRadius: 12,
  overflow: 'hidden',
  marginBottom: 20,
}
const sectionHeader = (color = '#003366') => ({
  background: color,
  color: '#fff',
  padding: '14px 24px',
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: 0.3,
})
const body = { padding: '20px 24px' }
const label = { fontSize: 12, color: '#5a6a8a', marginBottom: 4, fontWeight: 600 }
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
const btnGroup = { display: 'flex', gap: 8, flexWrap: 'wrap' as const }
function Btn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 16px',
        borderRadius: 8,
        border: active ? '2px solid #003366' : '1.5px solid #b0c8e8',
        background: active ? '#003366' : '#f8faff',
        color: active ? '#fff' : '#334',
        fontWeight: active ? 700 : 400,
        fontSize: 13,
        cursor: 'pointer',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {children}
    </button>
  )
}

function Row({ label: lbl, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
      <div>
        <div style={label}>{lbl}</div>
        {children}
      </div>
    </div>
  )
}

function Field({ label: lbl, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ flex: full ? '1 1 100%' : '1 1 calc(50% - 8px)', minWidth: 200, marginBottom: 12 }}>
      <div style={label}>{lbl}</div>
      {children}
    </div>
  )
}

// ── 지수 행 ──────────────────────────────────────────────────
function IndexRow({ name, score, label: lbl, max }: { name: string; score: number; label: string; max: number }) {
  const pct = (score / max) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 70, fontSize: 12, color: '#5a6a8a', fontWeight: 700 }}>{name}</div>
      <div style={{ flex: 1, background: '#e8f0fb', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: '#003366', height: '100%', borderRadius: 6, transition: 'width 0.4s' }} />
      </div>
      <div style={{ width: 36, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#003366', fontFamily: 'JetBrains Mono, monospace' }}>
        {score.toFixed(1)}
      </div>
      <div style={{ width: 220, fontSize: 11, color: '#6a7a9a' }}>{lbl}</div>
    </div>
  )
}

// ── 판정 배지 ────────────────────────────────────────────────
function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 14px',
      borderRadius: 20,
      background: ok ? '#e6f7ed' : '#fff0f0',
      color: ok ? '#1a7a3a' : '#c0392b',
      fontWeight: 700,
      fontSize: 13,
      border: `1.5px solid ${ok ? '#a3d9b5' : '#f5b3b3'}`,
    }}>{children}</span>
  )
}

// ─────────────────────────────────────────────────────────────
export default function SeismicPrelimPage() {
  // 기본 정보
  const [zone, setZone] = useState<'I' | 'II'>('I')
  const [isUrban, setIsUrban] = useState(true)
  const [soilType, setSoilType] = useState<string>('S2')
  // 관로 정보
  const [pipeKind, setPipeKind] = useState<string>('ductile')
  const [DN, setDN] = useState<string>('300')
  const [thickness, setThickness] = useState<string>('8.0')
  const [connectCond, setConnectCond] = useState<string>('normal')
  const [facilExists, setFacilExists] = useState<string>('yes')
  const [mcone, setMcone] = useState<string>('bolted')
  const [showResult, setShowResult] = useState(false)

  const result = useMemo(() => {
    const dn = parseFloat(DN) || 300
    const t = parseFloat(thickness) || 8
    const ratio = dn / t
    const FLEX = calcFLEX(ratio)
    const KIND = KIND_INDEX[pipeKind as keyof typeof KIND_INDEX]?.score ?? 1.0
    const EARTH = (EARTH_INDEX as any)[soilType]?.score ?? 1.3
    const sizeKey = getSizeIndex(dn)
    const SIZE = SIZE_INDEX[sizeKey as keyof typeof SIZE_INDEX]?.score ?? 1.0
    const CONNECT = CONNECT_INDEX[connectCond as keyof typeof CONNECT_INDEX]?.score ?? 0.8
    const FACIL = FACIL_INDEX[facilExists as keyof typeof FACIL_INDEX]?.score ?? 0.8
    const MCONE = MCONE_INDEX[mcone as keyof typeof MCONE_INDEX]?.score ?? 0.7

    const VI_sub = KIND + EARTH + SIZE + CONNECT + FACIL + MCONE
    const VI = FLEX * VI_sub

    const seismicityGroup = getSeismicityGroup(zone, isUrban, soilType)
    const seismicGroup = calcSeismicGroup(seismicityGroup, VI)

    return {
      ratio, FLEX, KIND, EARTH, SIZE, CONNECT, FACIL, MCONE,
      VI_sub, VI, seismicityGroup, seismicGroup,
      isCritical: seismicGroup === 'critical',
    }
  }, [zone, isUrban, soilType, pipeKind, DN, thickness, connectCond, facilExists, mcone])

  const Z = SEISMIC_ZONE[zone].Z

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ background: '#003366', padding: '24px 32px' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>
            KDS 57 17 00 : 2022 상수도 내진설계기준 / 기존시설물(상수도) 내진성능 평가요령
          </div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
            내진성능 예비평가
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>
            매설관로 취약도지수(VI) 산정 → 내진성능 그룹 판정
          </div>
        </div>
      </div>

      {/* SECTION 1: 지진조건 */}
      <div style={card}>
        <div style={sectionHeader()}>① 지진조건 설정</div>
        <div style={body}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Field label="지진구역">
              <div style={btnGroup}>
                <Btn active={zone === 'I'} onClick={() => setZone('I')}>구역 Ⅰ (Z=0.11)</Btn>
                <Btn active={zone === 'II'} onClick={() => setZone('II')}>구역 Ⅱ (Z=0.07)</Btn>
              </div>
              <div style={{ fontSize: 11, color: '#7a8a9a', marginTop: 6 }}>
                {SEISMIC_ZONE[zone].label}
              </div>
            </Field>
            <Field label="도시권역 여부">
              <div style={btnGroup}>
                <Btn active={isUrban} onClick={() => setIsUrban(true)}>도시권역</Btn>
                <Btn active={!isUrban} onClick={() => setIsUrban(false)}>기타지역</Btn>
              </div>
            </Field>
            <Field label="지반종류" full>
              <div style={btnGroup}>
                {Object.entries(SOIL_TYPE).map(([key, v]) => (
                  <Btn key={key} active={soilType === key} onClick={() => setSoilType(key)}>
                    {key}
                  </Btn>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#7a8a9a', marginTop: 6 }}>
                {SOIL_TYPE[soilType as keyof typeof SOIL_TYPE]?.label}
              </div>
            </Field>
          </div>

          {/* 지진구역계수 요약 */}
          <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '12px 16px', marginTop: 8, fontSize: 13 }}>
            <span style={{ color: '#003366', fontWeight: 700 }}>설계지반가속도 (재현주기 500년)</span>
            {'  '}S = Z × I = {Z} × 1.00 =
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#003366', marginLeft: 6 }}>
              {Z.toFixed(3)} g
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: 관로 정보 */}
      <div style={card}>
        <div style={sectionHeader('#1a4a7a')}>② 관로 기본정보</div>
        <div style={body}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Field label="관종">
              <div style={btnGroup}>
                <Btn active={pipeKind === 'ductile'} onClick={() => setPipeKind('ductile')}>덕타일 주철관</Btn>
                <Btn active={pipeKind === 'steel'} onClick={() => setPipeKind('steel')}>강관</Btn>
                <Btn active={pipeKind === 'concrete'} onClick={() => setPipeKind('concrete')}>콘크리트관</Btn>
                <Btn active={pipeKind === 'pvc'} onClick={() => setPipeKind('pvc')}>PVC관</Btn>
              </div>
            </Field>
            <Field label="공칭관경 DN (mm)">
              <input style={inputStyle} type="number" value={DN}
                onChange={e => setDN(e.target.value)} min={50} max={3000} step={50} />
            </Field>
            <Field label="관두께 t (mm)">
              <input style={inputStyle} type="number" value={thickness}
                onChange={e => setThickness(e.target.value)} min={1} max={100} step={0.5} />
              <div style={{ fontSize: 11, color: '#7a8a9a', marginTop: 4 }}>
                D/t 비율 = {(parseFloat(DN) / parseFloat(thickness) || 0).toFixed(1)}
                → FLEX = {calcFLEX(parseFloat(DN) / parseFloat(thickness) || 0).toFixed(1)}
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* SECTION 3: 취약도지수 지수별 선택 */}
      <div style={card}>
        <div style={sectionHeader('#234d80')}>③ 취약도지수 입력 — 세부지수 선택</div>
        <div style={body}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Field label="이음부 상태 (CONNECT)">
              <div style={btnGroup}>
                {Object.entries(CONNECT_INDEX).map(([k, v]) => (
                  <Btn key={k} active={connectCond === k} onClick={() => setConnectCond(k)}>
                    {v.label} ({v.score})
                  </Btn>
                ))}
              </div>
            </Field>
            <Field label="주요시설물 (FACIL)">
              <div style={btnGroup}>
                {Object.entries(FACIL_INDEX).map(([k, v]) => (
                  <Btn key={k} active={facilExists === k} onClick={() => setFacilExists(k)}>
                    {v.label} ({v.score})
                  </Btn>
                ))}
              </div>
            </Field>
            <Field label="이음처리방법 (MCONE)">
              <div style={btnGroup}>
                {Object.entries(MCONE_INDEX).map(([k, v]) => (
                  <Btn key={k} active={mcone === k} onClick={() => setMcone(k)}>
                    {v.label} ({v.score})
                  </Btn>
                ))}
              </div>
            </Field>
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
            letterSpacing: 0.5,
          }}
        >
          취약도지수 산정 및 그룹 판정
        </button>
      </div>

      {/* SECTION 4: 결과 */}
      {showResult && (
        <div style={card}>
          <div style={sectionHeader('#0a3058')}>④ 평가 결과</div>
          <div style={body}>
            {/* 지진도 그룹 */}
            <div style={{
              background: '#f0f7ff', borderRadius: 10, padding: '16px 20px',
              marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#5a6a8a', marginBottom: 4 }}>지진도 그룹 (KDS 57 17 00 해설표 3.4.1)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#003366' }}>
                  {result.seismicityGroup}그룹 — {result.seismicityGroup === 1 ? '중점고려지역' : '관찰대상지역'}
                </div>
                <div style={{ fontSize: 12, color: '#7a8a9a', marginTop: 4 }}>
                  지진구역 {zone} / {isUrban ? '도시권역' : '기타지역'} / 지반 {soilType}
                </div>
              </div>
              <Badge ok={result.seismicityGroup === 2}>
                {result.seismicityGroup}그룹
              </Badge>
            </div>

            {/* 취약도지수 분해 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#003366', marginBottom: 12 }}>
                취약도지수 분해 VI = FLEX × (KIND + EARTH + SIZE + CONNECT + FACIL + MCONE)
              </div>
              <IndexRow name="FLEX" score={result.FLEX} label={`유연도지수 (D/t = ${(parseFloat(DN)/parseFloat(thickness)||0).toFixed(1)})`} max={10} />
              <div style={{ borderTop: '1px dashed #ccd8ef', margin: '8px 0 12px' }} />
              <IndexRow name="KIND" score={result.KIND} label={KIND_INDEX[pipeKind as keyof typeof KIND_INDEX]?.label ?? ''} max={2} />
              <IndexRow name="EARTH" score={result.EARTH} label={(EARTH_INDEX as any)[soilType]?.label ?? ''} max={2} />
              <IndexRow name="SIZE" score={result.SIZE} label={SIZE_INDEX[getSizeIndex(parseFloat(DN)) as keyof typeof SIZE_INDEX]?.label ?? ''} max={2} />
              <IndexRow name="CONNECT" score={result.CONNECT} label={CONNECT_INDEX[connectCond as keyof typeof CONNECT_INDEX]?.label ?? ''} max={2} />
              <IndexRow name="FACIL" score={result.FACIL} label={FACIL_INDEX[facilExists as keyof typeof FACIL_INDEX]?.label ?? ''} max={2} />
              <IndexRow name="MCONE" score={result.MCONE} label={MCONE_INDEX[mcone as keyof typeof MCONE_INDEX]?.label ?? ''} max={2} />
            </div>

            {/* VI 합산 */}
            <div style={{ background: '#e8f0fb', borderRadius: 8, padding: '14px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#5a6a8a' }}>세부지수 합계</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15 }}>
                    KIND+EARTH+SIZE+CONNECT+FACIL+MCONE = {result.VI_sub.toFixed(1)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#5a6a8a' }}>취약도지수 VI</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: '#003366' }}>
                    {result.VI.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 11, color: '#7a8a9a' }}>{result.FLEX.toFixed(1)} × {result.VI_sub.toFixed(1)}</div>
                </div>
              </div>
            </div>

            {/* 최종 판정 */}
            <div style={{
              borderRadius: 12,
              border: `2px solid ${result.isCritical ? '#e05c3a' : '#3aab6a'}`,
              background: result.isCritical ? '#fff6f3' : '#f3fff8',
              padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: result.isCritical ? '#c0392b' : '#1a7a3a' }}>
                  {result.isCritical ? '내진성능 중요상수도' : '내진성능 유보상수도'}
                </div>
                <Badge ok={!result.isCritical}>
                  {result.isCritical ? '상세평가 필요' : '관찰대상'}
                </Badge>
              </div>
              <div style={{ fontSize: 13, color: '#445', lineHeight: 1.8 }}>
                <strong>판정 기준:</strong> 지진도 {result.seismicityGroup}그룹,
                VI = {result.VI.toFixed(1)}
                {result.seismicityGroup === 1 && result.VI >= 40
                  ? ' ≥ 40 → 중점고려지역에서 VI ≥ 40이므로 상세평가 필요'
                  : result.seismicityGroup === 1 && result.VI < 40
                    ? ' < 40 → 중점고려지역이나 VI < 40이므로 유보'
                    : ' → 관찰대상 지역 (지진구역 Ⅱ 또는 기타지역)'
                }
              </div>
              {result.isCritical && (
                <div style={{ marginTop: 12, padding: '10px 16px', background: '#fff0eb', borderRadius: 8, fontSize: 13, color: '#8a3020' }}>
                  ⚠ 본 평가결과 상세평가 대상에 해당합니다. <strong>내진성능 상세평가</strong> 탭에서 응답변위법에 의한 정밀 검토를 진행하십시오.
                </div>
              )}
            </div>

            {/* 기준 요약 */}
            <div style={{ marginTop: 20, background: '#f8faff', borderRadius: 8, padding: '14px 18px', fontSize: 12, color: '#5a6a8a', lineHeight: 1.8 }}>
              <strong>적용기준:</strong> 기존시설물(상수도) 내진성능 평가요령 부록 A — 내진성능 우선순위 평가<br/>
              <strong>취약도지수 기준:</strong> VI ≥ 40 (지진도 1그룹) → 내진성능 중요상수도 → 상세평가 필요<br/>
              <strong>지진도 그룹:</strong> 해설표 3.4.1 (지진구역 × 도시권역 × 지반종류)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
