import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import {
  STEEL_DN_LIST, DI_DN_LIST, DI_BEDDING,
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


export default function InputPage() {
  const navigate = useNavigate()
  const { inputs, setInputs, setEprimeManual, setPipeDimManual, calcResult, saveToHistory } = useStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [diagTab, setDiagTab] = useState<'section' | 'bedding' | 'eprime'>('section')
  const [showManualFy, setShowManualFy] = useState(false)
  const [kgfPipeInput, setKgfPipeInput] = useState('')
  const [kgfEprimeInput, setKgfEprimeInput] = useState('')

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
          <EngRow label="적용 기준">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <div style={{ fontSize: '11.5px', fontWeight: T.fw.bold, color: T.textAccent }}>
                시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서
              </div>
              <div style={{ fontSize: '11px', color: T.textMuted, lineHeight: 1.6 }}>
                제11장 상수도 11.5.2 안전성평가 기준 (11-132 ~ 11-138)<br/>
                토압: H≤2.0m 연직토압 / H&gt;2.0m Marston (B = 2D+100 cm)<br/>
                {inputs.pipeType === 'steel'
                  ? <>링휨식에 흙 반력계수 E′ 포함 · 지지각 60·90·120·150°<br/>
                      허용응력 — 상시 140 MPa / 일시 210 MPa (STWW 400)</>
                  : <>조합응력 판정: 2.5σts + 2.0σtd + 1.4σb &lt; S (=420 MPa, GCD400)<br/>
                      σb = 6(Kf·Wf + Kt·Wt)R²/t² · 지지각 40·60·90·120·180°</>}
              </div>
              <div style={{ fontSize: '10.5px', color: T.textMuted, background: T.bgRowAlt, padding: '6px 8px', borderRadius: 3, lineHeight: 1.5 }}>
                ※ 관로의 안전성검토 식은「상수도시설기준, 환경부」에 제시된 식의 사용을 원칙으로 합니다. [11-133]<br/>
                ※ 현행 KDS 57 계열에는 매설관 구조계산 규정이 없어 근거로 사용하지 않습니다.
              </div>
            </div>
          </EngRow>

          <EngRow label="관종">
            <EngSegment
              options={[
                { key: 'steel',   label: '도복장강관 (강관)',  sub: 'KS D 3565' },
                { key: 'ductile', label: '덕타일 주철관',       sub: 'KS D 4311' },
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
                <strong>수도용 도복장강관 (KS D 3565)</strong><br/>
                내압 · 외압 휨응력 · 변형률 · 좌굴하중 검토 (세부지침 11-134~136).<br/>
                허용응력: 상시 140 MPa / 일시 210 MPa (STWW 400 기준, 강종별 분기 없음).<br/>
                좌굴 설계계수 FS = 2.5 (H/D≥2) / 3.0 (H/D&lt;2).
              </div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                <strong>수도용 덕타일 주철관 (KS D 4311)</strong><br/>
                인장강도 S = 420 MPa (GCD400). 복합 인장응력으로 단일 판정 (세부지침 11-137).<br/>
                2.5·σts + 2.0·σtd + 1.4·σb &lt; S — 내압·외압을 분리하지 않고 조합합니다.<br/>
                ※ 세부지침에 DCIP 변형(편평률) 허용기준은 없습니다.
              </div>
            </EngPopover>
          </EngRow>
          {inputs.pipeType === 'steel' && (
            <EngRow label="강종 (fy)">
              {/* column wrapper — 버튼행 + 설명행 세로 배치 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                {/* 1행: 강종 버튼 + 설명 버튼 (같은 라인) */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {STEEL_GRADES.map((g: any) => {
                    const active = inputs.steelGrade === g.key
                    return (
                      <button key={g.key} onClick={() => handleChange('steelGrade', g.key)}
                        style={{
                          flex: 1, padding: '3px 4px', fontSize: '11px', cursor: 'pointer', borderRadius: 2,
                          border: `1px solid ${active ? T.bgActive : T.border}`,
                          background: active ? T.bgActive : T.bgPanel,
                          color: active ? T.textOnDark : T.textPrimary,
                          fontFamily: T.fontSans, lineHeight: 1.35, textAlign: 'center',
                        }}>
                        <span style={{ fontWeight: 700 }}>{g.label.split(' ')[0]}</span>
                        <span style={{ fontSize: '10px', fontFamily: T.fontMono, display: 'block' }}>fy={g.fy}</span>
                      </button>
                    )
                  })}
                  <EngPopover>
                    <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>강관 강종 및 항복강도 fy</div>
                    <p style={{ marginTop: 0 }}>fy(항복강도)는 허용응력 산정의 기준값입니다. 강종에 따라 fy가 다르며, 잘못 선택하면 내압·링휨 판정이 달라집니다.</p>
                    <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                      <strong>허용응력 — 세부지침 11-134 [해설 표 11.5.1]</strong><br/>
                      상시(토압·차량하중·정수압): 140 MPa (1,400 kgf/㎠, STWW 400)<br/>
                      일시(동수압+수격압): 210 MPa (2,100 kgf/㎠, 상시의 150%)<br/>
                      <span style={{ color: '#b45309' }}>※ 강종별 분기 없음 — fy는 허용응력 산정에 사용되지 않습니다.</span>
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
                </div>
                {/* 2행: 강종 설명 텍스트 + 직접입력 버튼 */}
                {(() => {
                  const g = (STEEL_GRADES as any[]).find((x: any) => x.key === inputs.steelGrade)
                  const fyVal = showManualFy ? (inputs.fyManual ?? 235) : (g?.fy ?? 235)
                  const fuVal = g ? Math.round(fyVal / g.fy * g.fu) : 400
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {showManualFy
                            ? `직접입력 — fy = ${fyVal} MPa, fu = ${fuVal} MPa`
                            : g ? `${g.label} — fy = ${g.fy} MPa, fu = ${g.fu} MPa` : ''}
                        </span>
                        <button
                          onClick={() => {
                            const next = !showManualFy
                            setShowManualFy(next)
                            if (next) handleChange('steelGrade', 'MANUAL')
                            else handleChange('steelGrade', 'SPS400')
                          }}
                          style={{
                            padding: '1px 7px', fontSize: '10px', cursor: 'pointer', borderRadius: 2,
                            border: `1px solid ${showManualFy ? T.bgActive : T.border}`,
                            background: showManualFy ? T.bgActive : T.bgPanel,
                            color: showManualFy ? T.textOnDark : T.textMuted,
                            fontFamily: T.fontSans, whiteSpace: 'nowrap', flexShrink: 0,
                          }}>
                          직접입력
                        </button>
                      </div>
                      {showManualFy && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '10px', color: T.textLabel, fontFamily: T.fontSans, whiteSpace: 'nowrap' }}>fy =</span>
                          <EngInput value={inputs.fyManual ?? 235}
                            onChange={v => handleChange('fyManual', parseFloat(v) || 235)}
                            min={200} max={600} step={5} width={72} compact/>
                          <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans }}>MPa</span>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </EngRow>
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
                  <strong>주철관 판정 — 세부지침 11-137 조합응력</strong><br/>
                  2.5·σts + 2.0·σtd + 1.4·σb &lt; S&nbsp; (S = 420 MPa, GCD400 기준 인장강도)<br/>
                  σts = P·D/(2t) 정수압 &nbsp;|&nbsp; σtd = P′·D/(2t) 수격압<br/>
                  σb = 6(Kf·Wf + Kt·Wt)R²/t² 외압 휨응력<br/>
                  → 강관과 달리 <em>내압·외압을 분리하지 않고 조합</em>하여 단일 판정한다.
                </div>
                <div style={{ background: '#fff8f0', borderLeft: '3px solid #e8a020', padding: '8px 10px', borderRadius: 2, fontSize: 11, lineHeight: 1.6 }}>
                  <strong>단독 허용치로 환산하지 말 것</strong><br/>
                  S/1.4 = 300 MPa 는 GCD400 항복강도와 같아 여유가 없으며,
                  조합검토를 전제로 한 값이다. 개별 응력에 단독 허용치를 적용하면 위험측이 된다.<br/>
                  ※ 지지각별 계수 Kf(40°~180°)와 Kt = 0.011 은 <strong>관저 기준</strong>이다.
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
              <EngRow label={inputs.pipeType === 'steel' ? 'PN 등급' : 'K 등급'} popover={
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
                    <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>K 등급 — KS D 4311</div>
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
              }>
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  {grades.map(g => {
                    const t = thicknessRow?.[g]
                    const active = (inputs.pipeType === 'steel' ? inputs.pnGrade : inputs.diKGrade) === g
                    return (
                      <button key={g} onClick={() => handleChange(inputs.pipeType === 'steel' ? 'pnGrade' : 'diKGrade', g)}
                        style={{
                          flex: 1, padding: '2px 4px', fontSize: '11px', cursor: 'pointer',
                          border: `1px solid ${active ? T.bgActive : T.border}`,
                          background: active ? T.bgActive : T.bgPanel,
                          color: active ? T.textOnDark : T.textPrimary,
                          fontFamily: T.fontSans, borderRadius: 2, textAlign: 'center',
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
            </>
          )}

          <EngDivider label="관 탄성계수" />
          <EngRow label="탄성계수 E" unit="MPa" popover={
            <EngPopover title="관 탄성계수 E — 세부지침 11-135">
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>탄성계수 E가 사용되는 계산 항목</strong><br/>
                외압 휨응력·변형률: E·I 및 0.061·E′·R³ 항에 직접 반영<br/>
                좌굴하중: qa = (1/FS)·√(32·Rw·B′·E′·EI/D³)<br/>
                <span style={{ color: '#b45309' }}>※ 세부지침 11-135 제시값은 E = 2.1×10⁶ kg/cm² 입니다.</span>
              </div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>관종별 기본값 (KDS 57 / KS 규격)</strong><br/>
                강관 (KS D 3565): E = 206,000 MPa = 2.06×10⁶ kgf/cm²<br/>
                덕타일 주철관 (KS D 4311): E = 170,000 MPa = 1.70×10⁶ kgf/cm²
              </div>
              <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                <strong>kgf/cm² 단위 입력 시 환산</strong><br/>
                1 kgf/cm² = 0.09807 MPa<br/>
                예: 2,100,000 kgf/cm² → 205,947 MPa ≈ 206,000 MPa<br/>
                아래 kgf/cm² 입력란에 값을 넣으면 자동 환산됩니다.
              </div>
            </EngPopover>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <EngInput
                  value={inputs.E_pipeManual ? (inputs.E_pipe ?? (inputs.pipeType === 'steel' ? 206000 : 170000)) : (inputs.pipeType === 'steel' ? 206000 : 170000)}
                  onChange={v => inputs.E_pipeManual && handleChange('E_pipe', parseFloat(v) || (inputs.pipeType === 'steel' ? 206000 : 170000))}
                  disabled={!inputs.E_pipeManual}
                  min={50000} max={300000} step={1000} width={110}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!inputs.E_pipeManual}
                    onChange={e => {
                      const manual = e.target.checked
                      handleChange('E_pipeManual', manual)
                      if (!manual) { handleChange('E_pipe', null); setKgfPipeInput('') }
                      else handleChange('E_pipe', inputs.pipeType === 'steel' ? 206000 : 170000)
                    }}
                    style={{ width: 12, height: 12, accentColor: T.bgActive }}/>
                  <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans }}>직접입력</span>
                </label>
              </div>
              {inputs.E_pipeManual && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    placeholder="kgf/cm² 입력 → MPa 자동환산"
                    value={kgfPipeInput}
                    onChange={e => {
                      const raw = e.target.value
                      setKgfPipeInput(raw)
                      const kgf = parseFloat(raw)
                      if (!isNaN(kgf) && kgf > 0) {
                        handleChange('E_pipe', Math.round(kgf * 0.09807))
                      }
                    }}
                    style={{
                      width: 170, height: T.inputH, border: `1px solid ${T.border}`,
                      borderRadius: T.radiusSm, fontSize: '11px', fontFamily: T.fontMono,
                      padding: '0 6px', background: '#fffef0', color: T.textPrimary,
                    }}
                  />
                  <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans }}>kgf/cm²</span>
                  {kgfPipeInput && !isNaN(parseFloat(kgfPipeInput)) && (
                    <span style={{ fontSize: '10px', color: T.textOK, fontFamily: T.fontMono }}>
                      → {Math.round(parseFloat(kgfPipeInput) * 0.09807).toLocaleString()} MPa
                    </span>
                  )}
                </div>
              )}
              <div style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans }}>
                {inputs.E_pipeManual
                  ? `직접입력 모드 — 현재값: ${(inputs.E_pipe ?? (inputs.pipeType === 'steel' ? 206000 : 170000)).toLocaleString()} MPa`
                  : `자동 (관종 기본값: ${inputs.pipeType === 'steel' ? '206,000' : '170,000'} MPa)`}
              </div>
            </div>
          </EngRow>

          <EngDivider label="설계 하중 조건" />
          <EngRow label="설계 운전압력 Pd" unit="MPa">
            <EngInput value={inputs.Pd} onChange={v => handleChange('Pd', parseFloat(v) || 0)} min={0} max={3} step={0.05} width={90}/>
            {errors.Pd && <span style={{ fontSize: '10px', color: T.textNG }}>{errors.Pd}</span>}
            <EngPopover>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>
                내압 입력 — 세부지침 11-134 / 11-136
              </div>
              <p style={{ marginTop: 0 }}>
                <strong>정수압 P</strong>를 입력하고, 가압구간인 경우 <strong>수격압 P′</strong>(정수압 이상
                상승압력)를 추가로 입력합니다.
              </p>
              <div style={{ background: '#f0f4f8', borderLeft: `3px solid ${T.bgActive}`, padding: '8px 10px', marginBottom: 10, borderRadius: 2 }}>
                <strong>내압에 의한 관의 응력 (11-134)</strong><br/>
                σt = P·D / (2t)<br/>
                허용기준 — 상시(정수압) 140 MPa / 일시(동수압+수격압) 210 MPa<br/>
                <span style={{ color: '#b45309' }}>※ 내압 작용의 경우 외부 하중(노면하중, 토압 등)이
                없는 조건으로 계산합니다. 토압과 합산하지 않습니다.</span>
              </div>
              <div style={{ background: '#f0f4f8', borderLeft: `3px solid ${T.bgActive}`, padding: '8px 10px', marginBottom: 10, borderRadius: 2 }}>
                <strong>구간 구분 (11-136)</strong><br/>
                자연유하 구간 → 정수압 적용<br/>
                가압 구간 → 수격압(정수압 이상 상승압력) 적용
              </div>
              <div style={{ background: '#fff8f0', borderLeft: `3px solid #e8a020`, padding: '8px 10px', borderRadius: 2 }}>
                <strong>덕타일 주철관은 조합 판정</strong><br/>
                주철관은 내압·외압을 분리하지 않고 조합합니다 (11-137):<br/>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', display: 'block', marginTop: 4 }}>
                  2.5·σts + 2.0·σtd + 1.4·σb &lt; S (=420 MPa)
                </span>
              </div>
            </EngPopover>
          </EngRow>
          <EngRow label="압력 구간">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <EngSegment
                options={[
                  { key: 'gravity', label: '자연유하 구간', sub: '정수압' },
                  { key: 'pumped',  label: '가압 구간',     sub: '수격압' },
                ]}
                value={(inputs as any).pressureZone ?? 'gravity'}
                onChange={v => handleChange('pressureZone', v)}
              />
              <div style={{ fontSize: '10.5px', color: T.textMuted, lineHeight: 1.5 }}>
                자연유하 구간에서는 정수압을 적용하고 가압구간에서는 수격압(정수압 이상 상승압력)을
                적용합니다. [세부지침 11-136]
              </div>
            </div>
          </EngRow>

          {((inputs as any).pressureZone ?? 'gravity') === 'pumped' && (
            <EngRow label="수격압 P′" unit="MPa">
              <EngInput
                value={(inputs as any).Psurge ?? ''}
                onChange={v => handleChange('Psurge', v === '' ? null : (parseFloat(v) || 0))}
                min={0} max={5} step={0.05} width={90}/>
              <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, marginLeft: 4 }}>
                미입력 시 정수압 × 1.5 적용 · 허용 210 MPa (일시)
              </span>
            </EngRow>
          )}

          <EngRow label="관정 매설깊이 H" unit="m">
            <EngInput value={inputs.H} onChange={v => handleChange('H', parseFloat(v) || 1)} min={0.5} max={20} step={0.1} width={90}/>
            {errors.H && <span style={{ fontSize: '10px', color: T.textNG }}>{errors.H}</span>}
            <EngPopover>
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>관정 매설깊이 H — 세부지침 11-134</div>
              <p style={{ marginTop: 0 }}>관 상단(관정)부터 지표면까지의 깊이입니다. 토압 및 차량하중 계산의 핵심 변수입니다.</p>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>상부 토압 (세부지침 11-134)</strong><br/>
                H ≤ 2.0m : Wv = γt · H (연직 토압)<br/>
                H &gt; 2.0m : Wv = Cd · γt · B (흙의 Arching 효과 + Marston 토압계수)<br/>
                굴착부 폭 B = 2D + 100 [cm]
              </div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>노면하중 (세부지침 11-134)</strong><br/>
                인접하는 후륜의 단축하중과 그 분포 각(Kögler θ=45°)을 고려하여 계산.<br/>
                매설깊이가 깊을수록 분산 면적이 커져 하중이 감소합니다.<br/>
                충격계수는 H &gt; 6.5m 에서 0 이 됩니다.
              </div>
              <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                <strong>설계 최소 매설깊이 (KDS 57 10 00 §4.1.6)</strong><br/>
                관경 900mm 이하: H ≥ 1.2m &nbsp;|&nbsp; 관경 1,000mm 이상: H ≥ 1.5m<br/>
                ※ 매설깊이 규정은 기준 적합성 검토 축이며, 구조계산과는 별개입니다.<br/>
                이 앱 입력 하한: 0.5m
              </div>
            </EngPopover>
          </EngRow>

          <EngDivider label="부가 하중 조건" />
          <EngRow label="차량하중" popover={
            <EngPopover title="노면하중 산정 — 세부지침 11-134" width={450}>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>인접 후륜의 단축하중 + 분포각 (Kögler)</strong><br/>
                <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>
                  Wt = 2nP(1+i) / {'{'}[nL+(n−1)C+b+2H·tanθ]·(a+2H·tanθ){'}'}
                </span><br/>
                <span style={{ fontSize: 10, color: T.textMuted }}>
                  P = 9,600kg (DB-24) · n = 2 · L = 175cm · C = 100cm<br/>
                  b = 50cm · a = 20cm · θ = 45° (Kögler 분산각)
                </span>
              </div>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 6, borderRadius: T.radiusSm }}>
                <strong>충격계수 i</strong><br/>
                <span style={{ fontSize: 10, color: T.textMuted }}>
                  H &lt; 1.5 → 0.5 / 1.5 &lt; H &lt; 6.5 → 0.65 − 0.10H / 6.5 &lt; H → <strong>0</strong>
                </span><br/>
                <span style={{ fontSize: 10, color: '#b45309' }}>
                  ※ H &gt; 6.5m 에서 0 입니다. 기존 엑셀(02-1)은 0.5를 반환하는 오류가 있었습니다.
                </span>
              </div>
              {/* 하중분포 개념도 */}
              <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusMd, overflow: 'hidden', marginBottom: 8 }}>
                <img src="/pipe/vl.png" alt="차량하중 분포도" style={{ width: '100%', display: 'block' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontSize: 10, color: T.textMuted, fontFamily: T.fontMono, marginBottom: 8, paddingLeft: 4 }}>
                <span><strong style={{ color: T.textLabel }}>Pm</strong> — 후륜 1륜당 하중 (kN)</span>
                <span><strong style={{ color: T.textLabel }}>a</strong> — 타이어 접지폭 (m)</span>
                <span><strong style={{ color: T.textLabel }}>h</strong> — 관정 토피 깊이 (m)</span>
                <span><strong style={{ color: T.textLabel }}>C</strong> — 차량 점유폭 (m, 관축방향)</span>
                <span><strong style={{ color: T.textLabel }}>θ</strong> — 하중분포각 (°, 통상 45°)</span>
                <span><strong style={{ color: T.textLabel }}>D</strong> — 관 외경 (m)</span>
              </div>
              <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                도로 하부: 적용 (H &lt; 3.0m 구간은 반드시)<br/>
                농지·공원: 미적용 가능
              </div>
            </EngPopover>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={inputs.hasTraffic}
                  onChange={e => handleChange('hasTraffic', e.target.checked)}
                  style={{ width: 13, height: 13, accentColor: T.bgActive }}/>
                <span style={{ fontSize: '12px', color: T.textLabel, fontFamily: T.fontSans }}>적용</span>
                <span style={{ fontSize: '10px', color: T.textMuted }}>(도로 하부 매설 시)</span>
              </label>
              {inputs.hasTraffic && (
                <div style={{ fontSize: '10.5px', color: T.textMuted, paddingLeft: 4, lineHeight: 1.5 }}>
                  Wt = 2nP(1+i) / {'{'}[nL+(n−1)C+b+2H·tanθ]·(a+2H·tanθ){'}'}<br/>
                  P = 9,600kg (DB-24) · L = 175cm · C = 100cm · b = 50cm · a = 20cm · θ = 45°<br/>
                  충격계수 i : H&lt;1.5 → 0.5 / 1.5&lt;H&lt;6.5 → 0.65−0.10H / 6.5&lt;H → 0
                </div>
              )}
            </div>
          </EngRow>
          <EngRow label="실측 최소 관두께" unit="mm">
            <EngInput
              value={(inputs as any).tMeasured ?? ''}
              onChange={v => handleChange('tMeasured', v === '' ? null : (parseFloat(v) || 0))}
              min={0} max={100} step={0.1} width={90}/>
            <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, marginLeft: 4 }}>
              관 상세검사값 · 미입력 시 기준 두께 적용
            </span>
          </EngRow>
          <div style={{ fontSize: '10.5px', color: T.textMuted, padding: '4px 10px 8px', lineHeight: 1.5 }}>
            ※ 관두께는 관 상세검사에서 측정된 구간별 최소 관두께와 관경별 기준 관두께 가운데
            <strong> 작은 값</strong>을 적용합니다. [세부지침 11-134]
          </div>

          <EngRow label="주부재 손상(단면손실)">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!(inputs as any).hasSectionLoss}
                onChange={e => handleChange('hasSectionLoss', e.target.checked)}
                style={{ width: 13, height: 13, accentColor: T.bgActive }}/>
              <span style={{ fontSize: '12px', color: T.textLabel, fontFamily: T.fontSans }}>있음</span>
              <span style={{ fontSize: '10px', color: T.textMuted }}>
                (안전성평가 등급 a/b 구분 — 세부지침 11-133 [표 11.74])
              </span>
            </label>
          </EngRow>
        </EngPanel>

        {/* ② 지반·시공 조건 */}
        <EngPanel title="② 지반·시공 조건">
          <EngRow label="흙의 단위중량 γt" unit="kg/cm³">
            <EngInput
              value={(inputs as any).gammaSoil_kgfcm3}
              onChange={v => handleChange('gammaSoil_kgfcm3', parseFloat(v) || 0)}
              min={0.001} max={0.0025} step={0.0001} width={110}/>
            <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, marginLeft: 4 }}>
              세부지침 11-134 제시값 1.8×10⁻³
            </span>
          </EngRow>

          {inputs.pipeType === 'steel' && (
            <EngRow label="흙 반력계수 E′" unit="kg/cm²">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EngInput
                    value={(inputs as any).Eprime_kgfcm2}
                    onChange={v => (inputs as any).eprimeManual && handleChange('Eprime_kgfcm2', parseFloat(v) || 0)}
                    min={1} max={200} step={1} width={90}
                    disabled={!(inputs as any).eprimeManual}/>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!(inputs as any).eprimeManual}
                      onChange={e => setEprimeManual(e.target.checked)}
                      style={{ width: 13, height: 13, accentColor: T.bgActive }}/>
                    <span style={{ fontSize: '11px', color: T.textLabel, fontFamily: T.fontSans }}>직접 입력</span>
                  </label>
                </div>
                <div style={{ fontSize: '10.5px', color: T.textMuted, lineHeight: 1.5 }}>
                  세부지침 11-135는 E′를 <strong>28 kg/cm² 단일값</strong>으로 제시합니다.
                  토질·다짐도별 세분값이 필요한 경우에만 직접 입력하고, 근거를 보고서에 명시하십시오.
                </div>
              </div>
            </EngRow>
          )}

          <EngDivider label={inputs.pipeType === 'steel' ? '기초지지각 (강관 · 세부지침 11-135)' : '기초지지각 (주철관 · 세부지침 11-137)'} />
          <div style={{ marginBottom: 6 }}>
            <EngPopover>
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>
                {inputs.pipeType === 'steel' ? '기초지지각 — 세부지침 11-135 (Kb, Kx)' : '기초지지각 — 세부지침 11-137 (Kf, Kt · 관저 기준)'}
              </div>
              {inputs.pipeType === 'steel' ? (<>
                <p style={{ marginTop: 0 }}>강관의 기초지지각은 관 하부 지반이 관을 지지하는 각도입니다. Kb(링휨계수), Kx(처짐계수)에 영향을 미칩니다.</p>
                <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                  <strong>deg90 (90° 지지)</strong>: Kb=0.157, Kx=0.096 — 일반 모래·쇄석 기초 (표준)<br/>
                  <strong>deg120 (120° 지지)</strong>: Kb=0.138, Kx=0.089 — 중간높이까지 다짐<br/>
                  <strong>deg150 (150° 지지)</strong>: Kb=0.128, Kx=0.085 — 상부까지 다짐 (최우수)<br/>
                  지지각이 클수록 하중 분산 유리 → Kb·Kx 감소 → 응력·처짐 감소
                </div>
                <div style={{ background: T.bgWarn, borderLeft: `3px solid ${T.textWarn}`, padding: '8px 10px', borderRadius: T.radiusSm }}>
                  <strong>실무 적용 기준 (KDS 57 10 00)</strong><br/>
                  표준 시공: deg90 (모래 되메움)<br/>
                  고압·대구경: deg120 이상 적용 권장<br/>
                  최상급 다짐 기초: deg150
                </div>
              </>) : (<>
                <p style={{ marginTop: 0 }}>덕타일 주철관의 지지각별 계수는 관저(管底) 기준입니다. Kf(휨모멘트계수)는 40°~180°로 제시되며, Kt = 0.011 단일값입니다.</p>
                <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                  <strong>Type 1</strong>: Kb=0.294, Kd=0.110 — 평기초·다짐 없음 (지지각 0°)<br/>
                  <strong>Type 2</strong>: Kb=0.235, Kd=0.108 — 모래기초 약간 다짐 (지지각 30°, 표준)<br/>
                  <strong>Type 3</strong>: Kb=0.189, Kd=0.103 — 모래·쇄석 균일다짐 (지지각 60°)<br/>
                  <strong>Type 4</strong>: Kb=0.157, Kd=0.096 — 모래·쇄석 다짐 (지지각 90°)
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
                      flex: '1 1 calc(50% - 4px)', minWidth: 0, maxWidth: 'calc(50% - 2px)', padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
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
              {Object.entries(DI_BEDDING as Record<string, { label: string; Kf: number; Kt: number }>).map(([type, { label, Kf, Kt }]) => {
                const active = (inputs as any).diBeddingType === type
                return (
                  <button key={type} onClick={() => handleChange('diBeddingType', type)}
                    style={{
                      flex: '1 1 calc(50% - 4px)', minWidth: 0, maxWidth: 'calc(50% - 2px)', padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
                      border: `1px solid ${active ? T.bgActive : T.border}`,
                      background: active ? T.bgActive : T.bgPanel,
                      color: active ? T.textOnDark : T.textPrimary,
                      textAlign: 'left', borderRadius: 2,
                    }}>
                    <div style={{ fontWeight: 700, fontFamily: T.fontSans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label.split('—')[0]?.trim()}</div>
                    <div style={{ fontSize: '10px', opacity: 0.8, fontFamily: T.fontMono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Kf={Kf} Kt={Kt}
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
              <div style={{ fontWeight: T.fw.bold, fontSize: T.fs.base, marginBottom: 8, color: T.textAccent, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 6 }}>지하수위 — 좌굴 검토 부력계수 Rw</div>
              <p style={{ marginTop: 0 }}>세부지침 11-136은 부력계수 Rw = 1.0 을 제시합니다. 아래 표는 지하수위가 높은 구간을 안전측으로 평가하기 위한 선택적 보정값이며, 기본값(관저 이하)에서는 지침값과 동일합니다. 주철관 검토에는 영향 없음.</p>
              <div style={{ background: T.bgInfo, borderLeft: `3px solid ${T.textLink}`, padding: '8px 10px', marginBottom: 8, borderRadius: T.radiusSm }}>
                <strong>Rw (부력계수) — 세부지침 11-136 제시값 1.0</strong><br/>
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
        </EngPanel>

        {/* 입력 요약 */}
        <div style={{ marginTop: 4, padding: '5px 10px', background: T.bgSection, fontSize: T.fs.xs, color: T.textMuted, fontFamily: T.fontMono, borderRadius: T.radiusSm }}>
          {inputs.pipeType === 'steel' ? '강관' : '주철관'}
          {'  '}{inputs.pipeDimManual
            ? `Do=${effectiveDo}mm  t=${effectiveT}mm  [직접입력]`
            : `DN${inputs.DN}  ${inputs.pipeType === 'steel' ? inputs.pnGrade : inputs.diKGrade}  t=${effectiveT}mm`}
          {'  '} Pd={inputs.Pd}MPa  H={inputs.H}m
          {inputs.pipeType === 'steel' ? `  E′=${(inputs as any).Eprime_kgfcm2}kg/cm²` : ''}
          {inputs.hasTraffic ? '  차량하중' : ''}
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
              selected={(inputs as any).diBeddingType ?? 'deg90'}
            />
          )}
        </div>

        {/* 적용 기준 참고 */}
        <EngPanel title="적용 기준">
          <div style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.fontSans, lineHeight: 1.9 }}>
            <strong style={{ color: T.textAccent }}>적용 산정식 근거</strong><br/>
            <span style={{ color: '#b45309' }}>※ KDS 57 10 00은 관로 구조계산식·허용응력을 규정하지 않음
            (§3 = "재료 — 내용 없음"). 아래는 실제 적용 근거임</span><br/>
            내압 검토:  AWWA M11 Eq.3-1 / KS D 3565  (상시 fy×0.50, 수격 fy×0.75 — 안전율 2.0 관행)<br/>
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
