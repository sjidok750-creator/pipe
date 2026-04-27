import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import {
  STEEL_DN_LIST, DI_DN_LIST, E_PRIME, BEDDING,
  STEEL_BEDDING, GW_LEVEL_OPTIONS,
  STEEL_THICKNESS, DI_THICKNESS,
  STEEL_PN_GRADES, DI_K_GRADES, STEEL_GRADES,
} from '../engine/constants.js'
import { validateInputs } from '../engine/validator.js'
import {
  EngPanel, EngSection, EngRow, EngInput,
  EngRadio, EngSegment, EngDivider, EngValue, EngPopover,
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
  const { inputs, setInputs, setEprimeManual, setPipeDimManual, calcResult, saveToHistory } = useStore()
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

  const effectiveDo = inputs.pipeDimManual ? inputs.DoManual : (thicknessRow?.Do ?? 610)
  const effectiveT  = inputs.pipeDimManual ? inputs.tManual  : (thicknessRow?.[inputs.pipeType === 'steel' ? inputs.pnGrade : inputs.diKGrade] ?? 8)

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
            <EngPopover>
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>관종 선택 — KS D 3565 / KS D 4311</div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>도복장강관 (KS D 3565)</strong><br/>
                항복강도 fy = 235 MPa (SGP 기준). 내압·링휨·처짐·외압좌굴 6단계 검토.<br/>
                KDS 57 10 00 §3.2~§3.6 적용. 좌굴 안전율 FS = 2.5 (AWWA M11).
              </div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                <strong>덕타일 주철관 (KS D 4311)</strong><br/>
                인장강도 fu = 420 MPa. 내압·링휨·처짐 4단계 검토 (좌굴 검토 해당 없음).<br/>
                DIPRA Method 적용. 허용응력: 내압 fu/3 = 140 MPa, 링휨 0.5×fu = 210 MPa.
              </div>
            </EngPopover>
          </EngRow>
          {inputs.pipeType === 'steel' && (
            <EngRow label="강종 (fy)">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {STEEL_GRADES.map((g: any) => {
                  const active = inputs.steelGrade === g.key
                  return (
                    <button key={g.key} onClick={() => handleChange('steelGrade', g.key)}
                      style={{
                        padding: '2px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: 2,
                        border: `1px solid ${active ? T.bgActive : T.border}`,
                        background: active ? T.bgActive : T.bgPanel,
                        color: active ? T.textOnDark : T.textPrimary,
                        fontFamily: T.fontSans,
                      }}>
                      <div style={{ fontWeight: 700 }}>{g.label.split(' ')[0]}</div>
                      <div style={{ fontSize: '10px', fontFamily: T.fontMono }}>fy={g.key === 'MANUAL' ? '입력' : g.fy} MPa</div>
                    </button>
                  )
                })}
              </div>
              <EngPopover>
                <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>강관 강종 및 항복강도 fy</div>
                <p style={{ marginTop: 0 }}>fy(항복강도)는 허용응력 산정의 기준값입니다. 강종에 따라 fy가 다르며, 잘못 선택하면 내압·링휨 판정이 달라집니다.</p>
                <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                  <strong>KDS 57 10 00 §3.2 허용응력</strong><br/>
                  상시: σa = 0.50 × fy &nbsp;|&nbsp; 수격: σa = 0.75 × fy<br/>
                  fy가 높을수록 허용응력 증가 → 동일 두께에서 더 높은 압력 허용
                </div>
                <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                  <strong>주요 강종 (KS D 3565)</strong><br/>
                  SGP (KS D 3507): fy = 245 MPa — 일반 배관용<br/>
                  SPS400 (KS D 3565): fy = 235 MPa — 상수도용 표준<br/>
                  SPS490 (KS D 3565): fy = 315 MPa — 고강도 대구경용<br/>
                  STPG38 (KS D 3562): fy = 215 MPa — 압력배관용
                </div>
                <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                  <strong>직접입력</strong><br/>
                  제조사 밀시트(Mill Sheet) 또는 강도시험 결과값이 있는 경우 사용.<br/>
                  KDS에서는 공인 시험값 사용 가능.
                </div>
              </EngPopover>
            </EngRow>
          )}
          {inputs.pipeType === 'steel' && inputs.steelGrade === 'MANUAL' && (
            <EngRow label="fy 직접입력" unit="MPa">
              <EngInput value={inputs.fyManual ?? 235}
                onChange={v => handleChange('fyManual', parseFloat(v) || 235)}
                min={200} max={600} step={5} width={90}/>
              <span style={{ fontSize: '10px', color: T.textMuted, marginLeft: 4 }}>200~600 MPa</span>
            </EngRow>
          )}
          {inputs.pipeType === 'steel' && inputs.steelGrade && inputs.steelGrade !== 'MANUAL' && (
            <div style={{ marginLeft: 116, fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, marginBottom: 4 }}>
              {(() => { const g = (STEEL_GRADES as any[]).find((x:any) => x.key === inputs.steelGrade); return g ? `${g.label} — fy = ${g.fy} MPa, fu = ${g.fu} MPa (${g.note})` : '' })()}
            </div>
          )}

          {inputs.pipeType === 'ductile' && (
            <EngRow label="재료 강도">
              <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textNumber, whiteSpace: 'nowrap' }}>
                fu = 420 MPa &nbsp;<span style={{ color: T.textMuted, fontSize: 10, fontFamily: T.fontSans }}>(KS D 4311 §4 고정값)</span>
              </span>
              <EngPopover>
                <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>
                  덕타일 주철관 — 항복강도 fy 선택이 없는 이유
                </div>
                <div style={{ background: '#f0f4f8', borderLeft: '3px solid #1a5c99', padding: '8px 10px', marginBottom: 8, borderRadius: 2, fontSize: 11, lineHeight: 1.6 }}>
                  <strong>KS D 4311 : 2021 §4 기계적 성질</strong><br/>
                  "구상흑연주철관의 최소 인장강도(fu)는 420 N/mm² 이상, 최소 항복강도는 300 N/mm² 이상으로 한다."<br/>
                  → KS 규격이 강도값을 단일 고정값으로 지정하므로 강종별 선택이 불필요하다.
                </div>
                <div style={{ background: '#f0f4f8', borderLeft: '3px solid #1a5c99', padding: '8px 10px', marginBottom: 8, borderRadius: 2, fontSize: 11, lineHeight: 1.6 }}>
                  <strong>KDS 57 10 00 : 2022 §3.2 주철관 허용응력</strong><br/>
                  "덕타일 주철관의 허용인장응력은 인장강도(fu)에 안전계수를 적용하여 산정한다:<br/>
                  상시 σ_a = fu / 3 = 140 MPa,&nbsp; 링휨 σ_a = 0.5 × fu = 210 MPa"<br/>
                  → 강관과 달리 <em>항복강도가 아닌 인장강도(fu) 기반</em> 안전계수법을 적용한다.
                </div>
                <div style={{ background: '#f0f4f8', borderLeft: '3px solid #1a5c99', padding: '8px 10px', marginBottom: 8, borderRadius: 2, fontSize: 11, lineHeight: 1.6 }}>
                  <strong>DIPRA Design Manual §3 (Pressure Design)</strong><br/>
                  "Allowable working pressure: P_a = 2t·S_a / D,&nbsp; where S_a = f_t / 3.0"<br/>
                  (f_t = tensile strength = 420 MPa)<br/>
                  → DIPRA(미국 덕타일주철관연구협회)도 fu 기반 안전계수 체계를 채택. fy는 설계 허용응력 산정에 사용되지 않는다.
                </div>
                <div style={{ background: '#fff8f0', borderLeft: '3px solid #e8a020', padding: '8px 10px', borderRadius: 2, fontSize: 11, lineHeight: 1.6 }}>
                  <strong>강관과의 허용응력 체계 비교</strong><br/>
                  강관 (KDS §3.2): σ_a = 0.50 × fy → <em>항복</em> 기준 (연성파괴 방지)<br/>
                  주철관 (KDS §3.2): σ_a = fu / 3 → <em>인장강도</em> 기준 (취성파괴 안전계수)<br/>
                  주철 계열은 fy/fu 비가 상대적으로 작고 연성이 제한되므로, 취성파괴에 대한 보수적 여유를 확보하기 위해 fu 기반 설계가 더 적합하다.
                </div>
              </EngPopover>
            </EngRow>
          )}

          <EngDivider />
          <EngRow label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!inputs.pipeDimManual}
                onChange={e => setPipeDimManual(e.target.checked)}
                style={{ width: 13, height: 13, accentColor: T.bgActive }}/>
              <span style={{ fontSize: '12px', color: T.textLabel, fontFamily: T.fontSans }}>
                관경·두께 직접 입력
              </span>
              <span style={{ fontSize: '10px', color: T.textMuted }}>(비규격 또는 실측치)</span>
            </label>
          </EngRow>

          {inputs.pipeDimManual ? (
            <>
              <EngRow label="외경 Do" unit="mm">
                <EngInput value={inputs.DoManual ?? 610} onChange={v => handleChange('DoManual', parseFloat(v) || 0)} min={50} max={4000} step={1} width={100}/>
                {errors.DoManual && <span style={{ fontSize: '10px', color: T.textNG, marginLeft: 4 }}>{errors.DoManual}</span>}
              </EngRow>
              <EngRow label="두께 t" unit="mm">
                <EngInput value={inputs.tManual ?? 8} onChange={v => handleChange('tManual', parseFloat(v) || 0)} min={1} max={100} step={0.5} width={100}/>
                {errors.tManual && <span style={{ fontSize: '10px', color: T.textNG, marginLeft: 4 }}>{errors.tManual}</span>}
              </EngRow>
            </>
          ) : (
            <>
              <EngRow label="공칭관경 DN" unit="mm">
                <select
                  value={inputs.DN}
                  onChange={e => handleChange('DN', Number(e.target.value))}
                  style={{
                    height: T.inputH, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                    fontSize: T.fontSzInput, fontFamily: T.fontMono, padding: '0 4px',
                    background: T.bgInput, color: T.textPrimary, width: 100,
                  }}
                >
                  {dnList.map(dn => <option key={dn} value={dn}>DN {dn}</option>)}
                </select>
                <span style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono, marginLeft: 4 }}>
                  Do = {thicknessRow?.Do ?? '-'} mm
                </span>
                <EngPopover>
                  <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>공칭관경 (DN) — KS D 3565 / KS D 4311</div>
                  <p style={{ marginTop: 0 }}>DN(Diameter Nominal)은 관의 호칭 지름입니다. 실제 외경(Do)은 DN과 다릅니다.</p>
                  <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                    <strong>강관 (KS D 3565)</strong> — DN 범위: 80~3000mm<br/>
                    외경은 KS 규격 고정값. PN 등급(압력급)에 따라 두께 결정.
                  </div>
                  <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                    <strong>주철관 (KS D 4311)</strong> — DN 범위: 80~2600mm<br/>
                    외경은 KS 규격 고정값. K 등급에 따라 두께 결정.
                  </div>
                  <div style={{ marginTop: 8, color: '#666', fontSize: 11 }}>
                    비규격 관경은 상단 "관경·두께 직접 입력" 체크박스로 Do·t를 직접 입력하십시오.
                  </div>
                </EngPopover>
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
                          border: `1px solid ${active ? T.bgActive : T.border}`,
                          background: active ? T.bgActive : T.bgPanel,
                          color: active ? T.textOnDark : T.textPrimary,
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
                <EngPopover>
                  {inputs.pipeType === 'steel' ? (<>
                    <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>PN 등급 (압력 등급) — KS D 3565</div>
                    <p style={{ marginTop: 0 }}>PN(Pressure Nominal) 등급은 관의 최고허용압력 기준 분류입니다. 등급이 높을수록 두께가 두꺼워집니다.</p>
                    <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                      <strong>등급별 허용압력 (KS D 3565)</strong><br/>
                      PN6 = 0.6 MPa / PN10 = 1.0 MPa / PN16 = 1.6 MPa<br/>
                      단, KDS에서는 PN 등급을 직접 설계압력 제한으로 사용하지 않습니다.<br/>
                      내압 검토는 Barlow 공식으로 실제 응력 계산 후 허용응력 비교로 판정합니다.
                    </div>
                    <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                      <strong>실무 선택 기준:</strong><br/>
                      설계수압(Pd)이 결정되면, 내압 검토가 O.K.가 되는 최소 PN 등급을 선택합니다.<br/>
                      계산 버튼 클릭 후 결과에서 내압 항목이 N.G.이면 상위 등급으로 변경하십시오.
                    </div>
                  </>) : (<>
                    <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>K 등급 — KS D 4311 / DIPRA</div>
                    <p style={{ marginTop: 0 }}>K 등급은 주철관의 두께 분류 기준입니다. 숫자가 클수록 두께가 두껍습니다.</p>
                    <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                      <strong>K 등급 두께 산정식 (KS D 4311)</strong><br/>
                      t = K × (Do/1000)^0.5 + e (mm) 형태로 규정되어 있습니다.<br/>
                      K7, K9, K10, K12 등 숫자가 높을수록 벽두께 증가.
                    </div>
                    <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                      <strong>실무 선택 기준:</strong><br/>
                      내압·링휨·처짐 검토가 모두 O.K.가 되는 최소 K 등급을 선택합니다.<br/>
                      일반 상수도: K9 이상 / 고압 또는 깊은 매설: K10~K12 검토.
                    </div>
                  </>)}
                </EngPopover>
              </EngRow>
            </>
          )}

          <EngDivider label="설계 하중 조건" />
          <EngRow label="설계 운전압력 Pd" unit="MPa">
            <EngInput value={inputs.Pd} onChange={v => handleChange('Pd', parseFloat(v) || 0)} min={0} max={3} step={0.05} width={90}/>
            {errors.Pd && <span style={{ fontSize: '10px', color: T.textNG }}>{errors.Pd}</span>}
            <EngPopover>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>
                설계수압 입력 방식 — 현행 KDS 2022 기준
              </div>
              <p style={{ marginTop: 0 }}>
                이 앱은 <strong>설계 운전압력 Pd</strong>와 <strong>수격압 배율</strong> 두 값만으로 내압을 설계합니다.
                수격 포함 최대압력은 <strong>Pd' = Pd × 배율</strong>로 산정됩니다.
              </p>
              <div style={{ background: '#f0f4f8', borderLeft: `3px solid ${T.bgActive}`, padding: '8px 10px', marginBottom: 10, borderRadius: 2 }}>
                <strong>KDS 57 10 00 : 2022 (현행 기준)</strong><br/>
                § 3.2 상시 하중: σ = Pd·D/(2t) ≤ 0.50 fy (강관) / fu/3 (주철관)<br/>
                § 3.2 수격 포함: σ = (Pd × 배율)·D/(2t) ≤ 0.75 fy (강관)<br/>
                배율 1.5는 일반적인 수격압 수준 (±50%)에 해당하며, 수격 해석이 없을 때의 보수적 기본값입니다.
              </div>
              <div style={{ background: '#fff8f0', borderLeft: `3px solid #e8a020`, padding: '8px 10px', marginBottom: 10, borderRadius: 2 }}>
                <strong>구 기준 (상수도 시설기준 2004) 방식과의 차이</strong><br/>
                구 기준에서는 <strong>정수압(Ps), 동수압(Pd), 수격압(Ps + Pd)을 각각 별도 하중으로 입력</strong>하고, 이를 조합한 복합 검토식을 적용했습니다:<br/>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', display: 'block', marginTop: 4 }}>
                  2.5·σ_ts + 2.0·σ_td + 1.4·σ_b &lt; 420 MPa
                </span>
                이 방식은 응력 종류별 안전계수를 달리 적용하는 구조로, 현행 KDS의 허용응력법과 개념적으로 다릅니다.
              </div>
              <div style={{ background: '#f4fff4', borderLeft: `3px solid #4caf50`, padding: '8px 10px', marginBottom: 10, borderRadius: 2 }}>
                <strong>이 앱이 KDS 2022 방식을 채택한 이유</strong><br/>
                현행 발주 기준인 KDS 57 10 00 : 2022가 Pd/수격 분리 입력 + 허용응력 비교 방식을 채택하고 있으며,
                AWWA M11 (강관), DIPRA Method (주철관) 등 국제 표준과도 동일한 체계입니다.
                결과 보고서에도 KDS 2022 기준 적용을 명시합니다.
              </div>
              <div style={{ color: T.textMuted, fontSize: '11px' }}>
                <strong>판단 기준:</strong><br/>
                · 수격 해석 결과가 있는 경우 → 해석값으로 Pd' 역산 후 배율 입력<br/>
                · 수격 해석 없는 경우 → 배율 1.5 (KDS 기본), 보수적으로 2.0까지 적용 가능<br/>
                · 정수두만 작용하는 계통 → 배율 1.0 (수격 없음)
              </div>
            </EngPopover>
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
            <EngPopover>
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>관정 매설깊이 H — KDS 57 10 00 §3.3</div>
              <p style={{ marginTop: 0 }}>관 상단(관정)부터 지표면까지의 깊이입니다. 토압 및 차량하중 계산의 핵심 변수입니다.</p>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>토압 산정 (Prism Load — KDS 57 10 00 §3.3)</strong><br/>
                We = γ × H × Do [kN/m]<br/>
                이 앱은 항상 Prism Load를 사용합니다. 구기준(2004)의 Marston 공식과 달리 매설깊이에 관계없이 동일 식을 적용합니다. KDS 2022가 채택한 방식입니다.
              </div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>차량하중 (DB-24 — KDS 24 12 20)</strong><br/>
                H &lt; 0.6m: 차량하중 집중 → 적용 필수<br/>
                H = 1.5m 이상: Boussinesq 분산으로 차량하중 감소<br/>
                H ≥ 3m: 차량하중이 사실상 무시 수준
              </div>
              <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                <strong>설계 최소 매설깊이 (KDS 57 10 00)</strong><br/>
                도로 하부: H ≥ 1.2m 권장 (차량하중 완충)<br/>
                농지·비도로: H ≥ 0.8m<br/>
                이 앱 입력 하한: 0.5m
              </div>
            </EngPopover>
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
            <EngPopover>
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>토질 등급 (SC 분류) — AWWA M11 / KDS 57 10 00</div>
              <p style={{ marginTop: 0 }}>토질 등급은 되메움 재료의 특성에 따른 분류로, 탄성지반반력 E'를 결정하는 핵심 변수입니다.</p>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>SC1 — 자갈·모래 (조립토)</strong><br/>
                깨끗한 자갈, 모래자갈, 조립모래. E' = 2700~14000 kPa (다짐도에 따라 변동)<br/>
                배수 양호, 내부마찰각 높음. 되메움 재료로 가장 우수.
              </div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>SC2 — 혼합토 (실트질 모래)</strong><br/>
                실트·점토 함유 모래, 모래질 실트. E' = 1400~6900 kPa<br/>
                다짐에 민감. 다짐 불량 시 E' 급감.
              </div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>SC3 — 점토·실트 (세립토)</strong><br/>
                고소성 점토, 실트. E' = 700~2800 kPa<br/>
                다짐 효과 제한적. 처짐 불리. 되메움 재료로 부적합.
              </div>
              <div style={{ background: '#fff0f0', borderLeft: '3px solid #e05050', padding: '8px 10px', borderRadius: 2 }}>
                <strong>연약 — 연약지반</strong><br/>
                유기질토, 이탄, 연약점토. E' = 300 kPa (고정)<br/>
                다짐 개선 불가. 지반 치환 또는 특수 시공 필요.
              </div>
            </EngPopover>
          </EngRow>

          {inputs.soilClass !== 'loose' && (
            <EngRow label="다짐도">
              <div style={{ display: 'flex', gap: 4 }}>
                {[80, 85, 90].map(c => (
                  <button key={c} onClick={() => handleChange('compaction', c)}
                    style={{
                      padding: '2px 14px', fontSize: '12px', cursor: 'pointer',
                      border: `1px solid ${inputs.compaction === c ? T.bgActive : T.border}`,
                      background: inputs.compaction === c ? T.bgActive : T.bgPanel,
                      color: inputs.compaction === c ? T.textOnDark : T.textPrimary,
                      fontFamily: T.fontMono, borderRadius: 2, fontWeight: inputs.compaction === c ? 700 : 400,
                    }}>
                    {c}%
                  </button>
                ))}
              </div>
              <EngPopover>
                <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>다짐도 — AWWA M11 Table 5-2</div>
                <p style={{ marginTop: 0 }}>되메움 토사의 다짐 정도입니다. E' 값에 직접 영향을 미치며, 처짐·좌굴 계산의 핵심 입력값입니다.</p>
                <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                  <strong>프록터 다짐도 기준 (Modified Proctor)</strong><br/>
                  85%: 일반적인 상수도관 매설 시공 기준 (KDS 권장)<br/>
                  90%: 도로 하부 고다짐 구간 / 중요 노선<br/>
                  80%: 최소 기준 (불량 시공 시 처짐·좌굴 위험)
                </div>
                <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                  <strong>다짐도에 따른 E' 변화 (SC1 예시)</strong><br/>
                  80% → 2,700 kPa / 85% → 6,900 kPa / 90% → 14,000 kPa<br/>
                  다짐도가 낮으면 E'가 급감하여 처짐·좌굴 불리. 현장 다짐 관리가 중요합니다.
                </div>
              </EngPopover>
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
            <EngPopover>
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>탄성지반반력 E' — KDS 57 10 00 §3.5 / AWWA M11</div>
              <p style={{ marginTop: 0 }}>E'(Modulus of Soil Reaction)는 관 주변 지반의 탄성 저항 특성을 나타내는 설계 정수입니다. 처짐·좌굴 계산에서 지반 지지력을 표현합니다.</p>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>수정 Iowa 처짐 공식에서의 역할</strong><br/>
                Δy/D = (DL·K·Ptotal) / (EI/r³ + 0.061·E')<br/>
                E'가 클수록 처짐 감소. 지반 지지력 과대평가 시 처짐 과소 계산 위험.
              </div>
              <div style={{ background: '#f4fff4', borderLeft: '3px solid #4caf50', padding: '8px 10px', marginBottom: 8, borderRadius: 2 }}>
                <strong>KDS 57 10 00 : 2022 (국내 현행 기준)</strong><br/>
                KDS는 E' 값을 <strong>"지반조사 결과를 바탕으로 설계자가 결정"</strong>하도록 위임합니다.<br/>
                기준에서는 사용 가능한 범위(300~14,000 kPa)만 제시하며, 구체적 값 결정은 설계자 판단입니다.<br/>
                AWWA M11 테이블을 참고 자료로 인용하지만 강제하지 않습니다.<br/>
                <span style={{ color: '#2a7a3a' }}>→ 지반조사 보고서가 있다면 수동입력이 KDS 취지에 더 부합합니다.</span>
              </div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>AWWA M11 참고값 (토질 등급 × 다짐도 → E' 확정)</strong><br/>
                AWWA M11은 토질 등급·다짐도 조합으로 E' 값을 테이블에서 결정합니다.<br/>
                지반조사 결과가 없을 때 사용하는 실무적 기본값입니다.<br/>
                SC1/90% = 14,000 kPa &nbsp;|&nbsp; SC1/85% = 6,900 kPa &nbsp;|&nbsp; SC1/80% = 2,700 kPa<br/>
                SC2/85% = 2,000 kPa &nbsp;|&nbsp; SC3/85% = 700 kPa &nbsp;|&nbsp; 연약 = 300 kPa
              </div>
              <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                <strong>입력 방법 선택 기준</strong><br/>
                · <strong>자동 (AWWA M11 테이블)</strong>: 지반조사 미실시 또는 예비 검토 단계<br/>
                · <strong>수동 입력 권장</strong>: 지반조사 결과(탄성계수, 변형계수) 보유 시 → KDS 취지에 부합<br/>
                · 보수적 설계: AWWA 자동값의 50~70% 적용 가능 (불확실성 반영)
              </div>
            </EngPopover>
          </EngRow>
          <div style={{ marginLeft: 116, fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, marginBottom: 4 }}>
            {inputs.eprimeManual
              ? '수동 입력 모드 — KDS 57 10 00: 지반조사 결과 기반 입력 권장'
              : `AWWA M11 Table 참고값 자동적용 (${inputs.soilClass}, ${inputs.compaction}%) — 지반조사 결과 있으면 수동입력 권장`}
          </div>

          <EngDivider label={inputs.pipeType === 'steel' ? '기초지지각 (강관 침상조건)' : '침상 조건 (DIPRA)'} />
          <div style={{ marginBottom: 6 }}>
            <EngPopover>
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>
                {inputs.pipeType === 'steel' ? '기초지지각 — AWWA M11 Table 5-1' : '침상 조건 (Bedding Type) — DIPRA Method'}
              </div>
              {inputs.pipeType === 'steel' ? (<>
                <p style={{ marginTop: 0 }}>강관의 기초지지각은 관 하부 지반이 관을 지지하는 각도입니다. Kb(링휨계수), Kx(처짐계수)에 영향을 미칩니다.</p>
                <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                  <strong>deg90 (90° 지지)</strong>: Kb=0.235, Kx=0.108 — 일반 모래 기초<br/>
                  <strong>deg120 (120° 지지)</strong>: Kb=0.189, Kx=0.090 — 자갈 기초<br/>
                  <strong>deg150 (150° 지지)</strong>: Kb=0.157, Kx=0.075 — 콘크리트 기초<br/>
                  지지각이 클수록 하중 분산 유리 → Kb·Kx 감소 → 응력·처짐 감소
                </div>
                <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                  <strong>실무 적용 기준 (KDS 57 10 00)</strong><br/>
                  표준 시공: deg90 (모래 되메움)<br/>
                  고압·대구경: deg120 이상 적용 권장<br/>
                  콘크리트 기초: deg150
                </div>
              </>) : (<>
                <p style={{ marginTop: 0 }}>DIPRA Method의 침상 조건(Bedding Type)은 덕타일 주철관의 기초 처리 방식입니다. Kb(링휨계수), Kd(처짐계수)에 영향을 미칩니다.</p>
                <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                  <strong>Type 1</strong>: Kb=0.235, Kd=0.108 — 관바닥 모양 맞춤 굴착<br/>
                  <strong>Type 2</strong>: Kb=0.150, Kd=0.090 — 일반 평탄 굴착 (표준)<br/>
                  <strong>Type 3</strong>: Kb=0.110, Kd=0.083 — 모래·자갈 쿠션 기초<br/>
                  <strong>Type 4</strong>: Kb=0.085, Kd=0.075 — 콘크리트 기초
                </div>
                <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                  <strong>실무 적용</strong><br/>
                  일반 상수도 매설: Type 2 (표준)<br/>
                  연약지반·고하중 구간: Type 3~4 권장
                </div>
              </>)}
            </EngPopover>
          </div>

          {inputs.pipeType === 'steel' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(STEEL_BEDDING as Record<string, { Kb: number; Kx: number; label: string }>).map(([type, { label, Kb, Kx }]) => {
                const active = inputs.steelBeddingType === type
                return (
                  <button key={type} onClick={() => handleChange('steelBeddingType', type)}
                    style={{
                      flex: '1 1 calc(50% - 4px)', padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
                      border: `1px solid ${active ? T.bgActive : T.border}`,
                      background: active ? T.bgActive : T.bgPanel,
                      color: active ? T.textOnDark : T.textPrimary,
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
                      border: `1px solid ${active ? T.bgActive : T.border}`,
                      background: active ? T.bgActive : T.bgPanel,
                      color: active ? T.textOnDark : T.textPrimary,
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
                height: T.inputH, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                fontSize: T.fontSzInput, fontFamily: T.fontSans, padding: '0 4px',
                background: T.bgInput, color: T.textPrimary, width: 180,
              }}>
              {GW_LEVEL_OPTIONS.map(({ value, label }: any) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <EngPopover>
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>지하수위 — AWWA M11 (강관 좌굴 검토)</div>
              <p style={{ marginTop: 0 }}>지하수위는 강관의 외압 좌굴 검토(AWWA M11 Eq.5-5)에서 부력수압계수 Rw 산정에 사용됩니다. 주철관 검토에는 영향 없음.</p>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>Rw (부력수압계수) — AWWA M11</strong><br/>
                지하수위 관정 이하: Rw = 1.0 (수압 없음 — 보수적)<br/>
                지하수위 관정~관저: Rw = 0.5~1.0 (부분 수압)<br/>
                지하수위 관저 이상: Rw = 0.5 (최대 부력)
              </div>
              <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                <strong>좌굴 공식에서의 역할</strong><br/>
                Pcr = (1/FS)·√(32·Rw·B'·E'·EI/Do³)<br/>
                Rw가 작을수록 허용 외압이 감소 → 좌굴 안전율 불리.<br/>
                지하수위가 높은 현장에서는 반드시 보수적으로 입력.
              </div>
            </EngPopover>
          </EngRow>
          <EngRow label="흙 단위중량 γ" unit="kN/m³">
            <EngInput value={inputs.gammaSoil} onChange={v => handleChange('gammaSoil', parseFloat(v) || 18)}
              min={10} max={25} step={0.5} width={90}/>
            <EngPopover>
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>흙 단위중량 γ — KDS 57 10 00 §3.3</div>
              <p style={{ marginTop: 0 }}>관 위에 작용하는 토압(Prism Load) 산정에 직접 사용됩니다. We = γ × H × Do</p>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>일반적인 흙 단위중량 기준값</strong><br/>
                모래·자갈 (건조~습윤): 16~18 kN/m³<br/>
                일반 점성토: 17~19 kN/m³<br/>
                포화토 (지하수위 이하): 18~20 kN/m³<br/>
                기본값 18 kN/m³ (KDS 상수도 설계 일반값)
              </div>
              <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                <strong>지하수위 고려</strong><br/>
                지하수위가 관정보다 높은 경우, 포화단위중량(약 18~20 kN/m³)을 사용하거나 수중단위중량(γ_sub = γ_sat - γ_w ≈ 8~10 kN/m³)을 별도 검토하는 것이 정확합니다. 이 앱은 단일 γ값을 전체 구간에 적용합니다.
              </div>
            </EngPopover>
          </EngRow>
        </EngPanel>

        {/* 입력 요약 */}
        <div style={{ marginTop: 4, padding: '5px 10px', background: T.bgSection, fontSize: T.fs.xs, color: T.textMuted, fontFamily: T.fontMono, borderRadius: T.radiusSm }}>
          {inputs.pipeType === 'steel' ? '강관' : '주철관'}
          {'  '}{inputs.pipeDimManual
            ? `Do=${effectiveDo}mm  t=${effectiveT}mm  [직접입력]`
            : `DN${inputs.DN}  ${inputs.pipeType === 'steel' ? inputs.pnGrade : inputs.diKGrade}  t=${effectiveT}mm`}
          {'  '} Pd={inputs.Pd}MPa  H={inputs.H}m
          {'  '} E'={inputs.Eprime}kPa
          {inputs.hasTraffic ? '  DB-24' : ''}
        </div>

        {/* 계산 버튼 — sticky */}
        <div style={{
          position: 'sticky', bottom: 0, zIndex: 10,
          background: T.bgApp, paddingTop: 6, paddingBottom: 4,
          borderTop: `1px solid ${T.borderLight}`, marginTop: 6,
        }}>
          <button onClick={handleCalc} style={{
            width: '100%', padding: '10px 0',
            background: T.bgActive, color: T.textOnDark, border: 'none',
            fontSize: T.fs.base, fontWeight: T.fw.bold, cursor: 'pointer',
            borderRadius: T.radiusMd, fontFamily: T.fontSans,
            minHeight: 44, touchAction: 'manipulation',
            boxShadow: T.shadow2,
          }}>
            구조안전성 검토 계산  ▶
          </button>
        </div>
      </div>

      {/* ── 우측: 삽도 (sticky) ──────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0, position: 'sticky', top: 8, alignSelf: 'flex-start' }}>

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
              Do={effectiveDo}
              H={inputs.H}
              t={effectiveT}
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
