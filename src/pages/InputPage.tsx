import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import {
  STEEL_DN_LIST, DI_DN_LIST, E_PRIME, BEDDING,
  STEEL_BEDDING, GW_LEVEL_OPTIONS,
  STEEL_THICKNESS, DI_THICKNESS,
  STEEL_PN_GRADES, DI_K_GRADES,
} from '../engine/constants.js'
import { validateInputs } from '../engine/validator.js'
import {
  EngPanel, EngSection, EngRow, EngInput,
  EngRadio, EngSegment, EngDivider, EngValue,
} from '../components/eng/EngLayout'
import { T } from '../components/eng/tokens'
import CrossSectionSVG from '../components/diagrams/CrossSectionSVG'
import BeddingConditionSVG from '../components/diagrams/BeddingConditionSVG'
import EValueChartSVG from '../components/diagrams/EValueChartSVG'

const SOIL_CLASSES = [
  { key: 'SC1',   label: 'SC1',   sub: '자갈·모래' },
  { key: 'SC2',   label: 'SC2',   sub: '혼합토' },
  { key: 'SC3',   label: 'SC3',   sub: '점토·실트' },
  { key: 'loose', label: '연약',  sub: '연약지반' },
]

export default function InputPage() {
  const navigate = useNavigate()
  const { inputs, setInputs, setEprimeManual, calcResult, saveToHistory } = useStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [diagTab, setDiagTab] = useState<'section' | 'bedding' | 'eprime'>('section')

  const handleChange = (field: string, value: unknown) => {
    setInputs({ [field]: value } as any)
    setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  const dnList = inputs.pipeType === 'steel' ? STEEL_DN_LIST : DI_DN_LIST
  const thicknessRow = inputs.pipeType === 'steel'
    ? STEEL_THICKNESS[inputs.DN]
    : DI_THICKNESS[inputs.DN]

  const handleCalc = () => {
    const { valid, errors: errs } = validateInputs(inputs)
    if (!valid) { setErrors(errs); return }
    const result = calcResult()
    if (result) {
      saveToHistory()
      navigate('/structural/result')
    }
  }

  const gradeField = inputs.pipeType === 'steel' ? inputs.pnGrade : inputs.diKGrade
  const grades = inputs.pipeType === 'steel' ? STEEL_PN_GRADES : DI_K_GRADES

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* ── 좌측: 입력 ───────────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>

        {/* ① 관종 및 기본조건 */}
        <EngPanel title="① 관종 및 설계 조건">
          <EngRow label="관종">
            <EngSegment
              options={[
                { key: 'steel',   label: '도복장강관 (강관)',  sub: 'KS D 3565 · 내압·링휨·처짐·좌굴' },
                { key: 'ductile', label: '덕타일 주철관',       sub: 'KS D 4311 · 내압·링휨·처짐' },
              ]}
              value={inputs.pipeType}
              onChange={v => {
                handleChange('pipeType', v)
                const list = v === 'steel' ? STEEL_DN_LIST : DI_DN_LIST
                if (!list.includes(inputs.DN)) handleChange('DN', list[5] ?? list[0])
              }}
            />
          </EngRow>
          <EngDivider />
          <EngRow label="공칭관경 DN" unit="mm">
            <select
              value={inputs.DN}
              onChange={e => handleChange('DN', Number(e.target.value))}
              style={{
                height: T.inputH, border: `1px solid ${T.borderDark}`, borderRadius: 0,
                fontSize: T.fontSzInput, fontFamily: T.fontMono, padding: '0 4px',
                background: T.bgInput, color: T.textPrimary, width: 100,
              }}
            >
              {dnList.map(dn => <option key={dn} value={dn}>DN {dn}</option>)}
            </select>
            <span style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono, marginLeft: 4 }}>
              Do = {thicknessRow?.Do ?? '-'} mm
            </span>
          </EngRow>

          {/* PN/K 등급 */}
          <EngRow label={inputs.pipeType === 'steel' ? 'PN 등급' : 'K 등급'}>
            <div style={{ display: 'flex', gap: 4 }}>
              {grades.map(g => {
                const t = thicknessRow?.[g]
                const active = (inputs.pipeType === 'steel' ? inputs.pnGrade : inputs.diKGrade) === g
                return (
                  <button key={g} onClick={() => handleChange(inputs.pipeType === 'steel' ? 'pnGrade' : 'diKGrade', g)}
                    style={{
                      padding: '2px 10px', fontSize: '11px', cursor: 'pointer',
                      border: `1px solid ${active ? T.bgActive : T.borderDark}`,
                      background: active ? T.bgActive : T.bgPanel,
                      color: active ? T.textActive : T.textPrimary,
                      fontFamily: T.fontSans, borderRadius: 2,
                    }}>
                    <div style={{ fontWeight: 700 }}>{g}</div>
                    <div style={{ fontSize: '10px', fontFamily: T.fontMono }}>{t ?? '-'} mm</div>
                  </button>
                )
              })}
            </div>
            {(errors.pnGrade || errors.diKGrade) && (
              <span style={{ fontSize: '10px', color: T.textNG, marginLeft: 4 }}>필수 선택</span>
            )}
          </EngRow>

          <EngDivider label="설계 하중 조건" />
          <EngRow label="설계 운전압력 Pd" unit="MPa">
            <EngInput value={inputs.Pd} onChange={v => handleChange('Pd', parseFloat(v) || 0)} min={0} max={3} step={0.05} width={90}/>
            {errors.Pd && <span style={{ fontSize: '10px', color: T.textNG }}>{errors.Pd}</span>}
          </EngRow>
          <EngRow label="수격압 배율">
            <EngInput value={inputs.surgeRatio} onChange={v => handleChange('surgeRatio', parseFloat(v) || 1)} min={1} max={3} step={0.1} width={90}/>
            <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, marginLeft: 4 }}>
              설계압 Pd' = Pd × 배율
            </span>
          </EngRow>
          <EngRow label="관정 매설깊이 H" unit="m">
            <EngInput value={inputs.H} onChange={v => handleChange('H', parseFloat(v) || 1)} min={0.5} max={20} step={0.1} width={90}/>
            {errors.H && <span style={{ fontSize: '10px', color: T.textNG }}>{errors.H}</span>}
          </EngRow>

          <EngDivider label="부가 하중 조건" />
          <EngRow label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={inputs.hasTraffic}
                onChange={e => handleChange('hasTraffic', e.target.checked)}
                style={{ width: 13, height: 13, accentColor: T.bgActive }}/>
              <span style={{ fontSize: '12px', color: T.textLabel, fontFamily: T.fontSans }}>
                DB-24 차량하중 적용
              </span>
              <span style={{ fontSize: '10px', color: T.textMuted }}>(도로 하부 매설)</span>
            </label>
          </EngRow>
          {inputs.pipeType === 'steel' && (
            <EngRow label="">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={inputs.hasLining}
                  onChange={e => handleChange('hasLining', e.target.checked)}
                  style={{ width: 13, height: 13, accentColor: T.bgActive }}/>
                <span style={{ fontSize: '12px', color: T.textLabel, fontFamily: T.fontSans }}>
                  시멘트 모르타르 라이닝
                </span>
                <span style={{ fontSize: '10px', color: T.textMuted }}>(허용처짐 3%, 무라이닝 5%)</span>
              </label>
            </EngRow>
          )}
        </EngPanel>

        {/* ② 지반·시공 조건 */}
        <EngPanel title="② 지반·시공 조건">
          <EngRow label="토질 등급">
            <EngSegment
              options={SOIL_CLASSES}
              value={inputs.soilClass}
              onChange={v => handleChange('soilClass', v)}
            />
          </EngRow>

          {inputs.soilClass !== 'loose' && (
            <EngRow label="다짐도">
              <div style={{ display: 'flex', gap: 4 }}>
                {[80, 85, 90].map(c => (
                  <button key={c} onClick={() => handleChange('compaction', c)}
                    style={{
                      padding: '2px 14px', fontSize: '12px', cursor: 'pointer',
                      border: `1px solid ${inputs.compaction === c ? T.bgActive : T.borderDark}`,
                      background: inputs.compaction === c ? T.bgActive : T.bgPanel,
                      color: inputs.compaction === c ? T.textActive : T.textPrimary,
                      fontFamily: T.fontMono, borderRadius: 2, fontWeight: inputs.compaction === c ? 700 : 400,
                    }}>
                    {c}%
                  </button>
                ))}
              </div>
            </EngRow>
          )}

          <EngRow label="탄성지반반력 E'" unit="kPa">
            <EngInput value={inputs.Eprime}
              onChange={v => inputs.eprimeManual && handleChange('Eprime', Number(v))}
              disabled={!inputs.eprimeManual} min={100} max={20000} width={100}/>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginLeft: 6 }}>
              <input type="checkbox" checked={inputs.eprimeManual}
                onChange={e => setEprimeManual(e.target.checked)}
                style={{ width: 12, height: 12, accentColor: T.bgActive }}/>
              <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans }}>수동입력</span>
            </label>
          </EngRow>
          <div style={{ marginLeft: 116, fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, marginBottom: 4 }}>
            {inputs.eprimeManual ? '수동 입력 모드' : `AWWA M11 자동계산 (${inputs.soilClass}, ${inputs.compaction}%)`}
          </div>

          <EngDivider label={inputs.pipeType === 'steel' ? '기초지지각 (강관 침상조건)' : '침상 조건 (DIPRA)'} />

          {inputs.pipeType === 'steel' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(STEEL_BEDDING as Record<string, { Kb: number; Kx: number; label: string }>).map(([type, { label, Kb, Kx }]) => {
                const active = inputs.steelBeddingType === type
                return (
                  <button key={type} onClick={() => handleChange('steelBeddingType', type)}
                    style={{
                      flex: '1 1 calc(50% - 4px)', padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
                      border: `1px solid ${active ? T.bgActive : T.borderDark}`,
                      background: active ? T.bgActive : T.bgPanel,
                      color: active ? T.textActive : T.textPrimary,
                      textAlign: 'left', borderRadius: 2,
                    }}>
                    <div style={{ fontWeight: 700, fontFamily: T.fontSans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label.split('—')[0].trim()}</div>
                    <div style={{ fontSize: '10px', opacity: 0.8, fontFamily: T.fontMono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label.split('—')[1]?.trim()}  Kb={Kb} Kx={Kx}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(BEDDING as Record<string, { label: string; Kb: number; Kd: number }>).map(([type, { label, Kb, Kd }]) => {
                const active = inputs.beddingType === type
                return (
                  <button key={type} onClick={() => handleChange('beddingType', type)}
                    style={{
                      flex: '1 1 calc(50% - 4px)', padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
                      border: `1px solid ${active ? T.bgActive : T.borderDark}`,
                      background: active ? T.bgActive : T.bgPanel,
                      color: active ? T.textActive : T.textPrimary,
                      textAlign: 'left', borderRadius: 2,
                    }}>
                    <div style={{ fontWeight: 700, fontFamily: T.fontSans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{type}</div>
                    <div style={{ fontSize: '10px', opacity: 0.8, fontFamily: T.fontMono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label.split('—')[1]?.trim()}  Kb={Kb} Kd={Kd}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <EngDivider />
          <EngRow label="지하수위">
            <select value={inputs.gwLevel} onChange={e => handleChange('gwLevel', e.target.value)}
              style={{
                height: T.inputH, border: `1px solid ${T.borderDark}`, borderRadius: 0,
                fontSize: T.fontSzInput, fontFamily: T.fontSans, padding: '0 4px',
                background: T.bgInput, color: T.textPrimary, width: 180,
              }}>
              {GW_LEVEL_OPTIONS.map(({ value, label }: any) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </EngRow>
          <EngRow label="흙 단위중량 γ" unit="kN/m³">
            <EngInput value={inputs.gammaSoil} onChange={v => handleChange('gammaSoil', parseFloat(v) || 18)}
              min={10} max={25} step={0.5} width={90}/>
          </EngRow>
        </EngPanel>

        {/* 계산 버튼 */}
        <button onClick={handleCalc} style={{
          width: '100%', padding: '7px 0',
          background: T.bgActive, color: 'white', border: 'none',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          borderRadius: 2, fontFamily: T.fontSans,
        }}>
          구조안전성 검토 계산  ▶
        </button>

        {/* 입력 요약 */}
        <div style={{ marginTop: 6, padding: '6px 10px', background: T.bgSection, fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono, borderRadius: 2 }}>
          {inputs.pipeType === 'steel' ? '강관' : '주철관'}  DN{inputs.DN}
          {'  '}{inputs.pipeType === 'steel' ? inputs.pnGrade : inputs.diKGrade}
          {'  '} t={thicknessRow?.[gradeField] ?? '-'}mm
          {'  '} Pd={inputs.Pd}MPa  H={inputs.H}m
          {'  '} E'={inputs.Eprime}kPa
          {inputs.hasTraffic ? '  DB-24' : ''}
        </div>
      </div>

      {/* ── 우측: 삽도 ───────────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>

        {/* 삽도 탭 */}
        <div style={{ display: 'flex', marginBottom: 0, border: `1px solid ${T.border}`, borderBottom: 'none', borderRadius: '2px 2px 0 0', overflow: 'hidden' }}>
          {([
            { key: 'section', label: '매설 단면도' },
            { key: 'bedding', label: '침상 조건' },
            { key: 'eprime',  label: "E' 탄성계수" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setDiagTab(key)}
              style={{
                flex: 1, padding: '4px 6px', fontSize: '11px', cursor: 'pointer',
                background: diagTab === key ? T.bgActive : T.bgSection,
                color: diagTab === key ? 'white' : T.textAccent,
                border: 'none', fontFamily: T.fontSans, fontWeight: diagTab === key ? 700 : 400,
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ border: `1px solid ${T.border}`, borderRadius: '0 0 2px 2px', background: 'white', padding: '8px' }}>
          {diagTab === 'section' && (
            <CrossSectionSVG
              Do={thicknessRow?.Do ?? 610}
              H={inputs.H}
              t={thicknessRow?.[gradeField] ?? 8}
              hasTraffic={inputs.hasTraffic}
              gwLevel={inputs.gwLevel}
            />
          )}
          {diagTab === 'bedding' && (
            <BeddingConditionSVG
              selected={inputs.pipeType === 'ductile' ? inputs.beddingType : 'Type2'}
            />
          )}
          {diagTab === 'eprime' && (
            <EValueChartSVG
              currentH={inputs.H}
              currentE={inputs.Eprime}
              compaction={inputs.compaction}
            />
          )}
        </div>

        {/* 적용 기준 참고 */}
        <EngPanel title="적용 기준">
          <div style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.fontSans, lineHeight: 1.9 }}>
            <strong style={{ color: T.textAccent }}>KDS 57 10 00 : 2022</strong>  상수도 시설 설계기준 — 관로<br/>
            내압 검토:  허용응력법  (상시 fy×0.50, 수격 fy×0.75)<br/>
            링 휨 검토:  Iowa 공식  (Spangler-Watkins 방법)<br/>
            처짐 검토:  수정 Iowa 방식  (Del = Dl·Kb·Wc·Do³/EI+0.061E'Do³)<br/>
            외압 좌굴:  Modified AWWA M11  (강관 전용, FS=2.5)<br/>
            차량하중:  AASHTO Boussinesq + DB-24 표준하중<br/>
            침상계수:  AWWA M11 Table 5-1  /  DIPRA Method (주철관)
          </div>
        </EngPanel>
      </div>
    </div>
  )
}
