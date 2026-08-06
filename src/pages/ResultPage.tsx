import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import {
  EngPanel, EngTable, EngParamGrid, EngStatusBar, EngDivider,
} from '../components/eng/EngLayout'
import { T } from '../components/eng/tokens'
import CrossSectionSVG from '../components/diagrams/CrossSectionSVG'
import DeflectionSVG from '../components/diagrams/DeflectionSVG'
import HoopStressSVG from '../components/diagrams/HoopStressSVG'
import SafetyGaugeSVG from '../components/diagrams/SafetyGaugeSVG'
import BeddingConditionSVG from '../components/diagrams/BeddingConditionSVG'

const DIAGRAM_TABS = [
  { key: 'cross',   label: '단면도' },
  { key: 'deflect', label: '처짐' },
  { key: 'hoop',    label: '내압' },
  { key: 'bedding', label: '침상' },
]

export default function ResultPage() {
  const navigate = useNavigate()
  const { result, inputs } = useStore()
  const [diagTab, setDiagTab] = useState('cross')

  if (!result) {
    return (
      <div style={{ padding: 24, fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
        입력 탭에서 계산을 먼저 실행하십시오.
        <button onClick={() => navigate('/structural/input')}
          style={{ marginLeft: 12, padding: '4px 12px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2 }}>
          입력 페이지로
        </button>
      </div>
    )
  }

  const { verdict, steps, pipeType, Do, tAdopt } = result as any
  const rs = steps as any
  const hoopStep = rs.step1
  const deflStep = pipeType === 'steel' ? rs.step4 : null   // 강관: 변형률

  // 결과 테이블 행 구성
  const verdictItems = Object.entries(verdict)
    .filter(([k]) => k !== 'overallOK') as [string, any][]

  // 지반·토압 파라미터 — 세부지침 11-134 (원단위 cm, kg/cm²)
  const earthStep = rs.step2
  const groundParams = [
    { label: '토피 H',            value: inputs.H,                    unit: 'm' },
    { label: '흙의 단위중량 γt',  value: earthStep?.gammaSoil_kgfcm3, unit: 'kg/cm³' },
    { label: '굴착부 폭 B',       value: earthStep?.B_cm,             unit: 'cm' },
    { label: '상부 토압 Wv',      value: earthStep?.Wv ?? earthStep?.Wf, unit: 'kg/cm²' },
    { label: '노면하중 Wt',       value: earthStep?.Wt,               unit: 'kg/cm²' },
    ...(pipeType === 'steel'
      ? [{ label: "흙 반력계수 E′", value: rs.step3?.Ep, unit: 'kg/cm²' }] : []),
    { label: '외경 D',            value: Do,                          unit: 'mm' },
    { label: '적용 두께 t',       value: tAdopt,                      unit: 'mm' },
  ]

  // 내압 검토
  const pressureRows = pipeType === 'steel' ? [
    { label: '내압응력 σt (정수압·상시)', formula: 'P·D/(2t)', value: hoopStep?.sigma_t_static, unit: 'MPa', limit: hoopStep?.sigmaA_static, ok: hoopStep?.ok_static },
    ...(hoopStep?.isPumped ? [
      { label: '내압응력 σt′ (수격압·일시)', formula: 'P′·D/(2t)', value: hoopStep?.sigma_t_surge, unit: 'MPa', limit: hoopStep?.sigmaA_surge, ok: hoopStep?.ok_surge },
    ] : []),
  ] : [
    { label: '정수압 인장응력 σts', formula: 'P·D/(2t)',  value: hoopStep?.sigma_ts, unit: 'MPa' },
    { label: '수격압 인장응력 σtd', formula: 'P′·D/(2t)', value: hoopStep?.sigma_td, unit: 'MPa' },
  ]


  // 링 휨 / 처짐 검토 — 필드명은 각 engine 파일의 실제 반환값 기준
  const structRows = pipeType === 'steel' ? [
    { label: '외압 휨응력 σb', formula: '세부지침 11-135 (다)',
      value: rs.step3?.sigma_b, unit: 'MPa', limit: rs.step3?.sigmaA_bend, ok: rs.step3?.ok },
    { label: '관체 변형률 ε', formula: '세부지침 11-136 (라)',
      value: deflStep?.deflectionRatio, unit: '%', limit: deflStep?.maxDeflection, ok: deflStep?.ok },
    ...(rs.step5 ? [
      { label: '좌굴하중 W ≤ qa', formula: '세부지침 11-136 (마)',
        value: rs.step5?.Wtotal, unit: 'kg/cm²', limit: rs.step5?.qa, ok: rs.step5?.ok },
    ] : []),
  ] : [
    { label: '외압 휨응력 σb', formula: '6(Kf·Wf + Kt·Wt)R²/t²',
      value: rs.step3?.sigma_b, unit: 'MPa' },
    { label: '조합 인장응력', formula: '2.5σts + 2.0σtd + 1.4σb < S',
      value: rs.step4?.demand, unit: 'MPa', limit: rs.step4?.S, ok: rs.step4?.ok },
  ]

  // 관두께 적용규칙 — 세부지침 11-134 ②
  //   "관 상세검사에서 측정된 구간별 최소 관두께와 관경별 기준 관두께 중 작은 값"
  const minThkRows = [
    { label: '기준 관두께 t_std', formula: pipeType === 'steel' ? 'STWW 400 기준' : 'K등급 기준',
      value: (result as any).tStandard, unit: 'mm' },
    { label: '실측 최소 관두께 t_msr', formula: '관 상세검사',
      value: (result as any).tMeasured, unit: 'mm' },
    { label: '적용 관두께 t', formula: 'min(t_std, t_msr)',
      value: tAdopt, unit: 'mm' },
  ]

  const gaugeItems = verdictItems.map(([k, v]) => ({ ...v, higherIsBetter: k === 'buckling' }))

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* ── 좌측: 검토 결과 ───────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>

        {/* 관 기본 정보 */}
        <EngPanel title="채택 관 제원">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: T.fontSans }}>
            <tbody>
              {[
                ['관종', pipeType === 'steel' ? '강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'],
                ...(result.pipeDimManual
                  ? [['외경 Do / 두께 t', `${Do} mm  /  ${tAdopt} mm  [직접입력]`]]
                  : [
                      ['공칭관경 DN', `${result.DN} mm`],
                      ['외경 Do', `${Do} mm`],
                      ['채택 두께 t', `${tAdopt} mm  (${pipeType === 'steel' ? result.pnGrade : result.selectedGrade})`],
                    ]
                ),
                ...(pipeType === 'steel' && result.fy
                  ? [['강종 / 항복강도 fy', `${result.steelGrade}  /  fy = ${result.fy} MPa`]]
                  : []
                ),
                ['설계수압 Pd', `${inputs.Pd} MPa`],
                ['압력 구간', (result as any).pressureZone === 'pumped'
                  ? `가압구간 — 수격압 P′ = ${(hoopStep?.Psurge ?? 0).toFixed(3)} MPa`
                  : '자연유하 구간 — 정수압 적용'],
              ].map(([k, v], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                  <td style={{ padding: '4px 8px', width: 130, fontWeight: 700, color: T.textLabel, borderBottom: `1px solid ${T.borderLight}` }}>{k}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.fontMono, fontSize: '11px', color: T.textNumber, borderBottom: `1px solid ${T.borderLight}` }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </EngPanel>

        {/* 지반 해석 파라미터 */}
        <EngPanel title="지반·하중 파라미터">
          <EngParamGrid params={groundParams.map(p => ({
            label: p.label,
            value: typeof p.value === 'number' ? p.value : (p.value ?? '-'),
            unit: p.unit,
          }))}/>
        </EngPanel>

        {/* Ⅰ. 현행 KDS 기준 적합성 검토 */}
        {result?.kdsCompliance && (
          <EngPanel title="Ⅰ. 기준 적합성 검토 — 현행 KDS 57 10 00 : 2022">
            <div style={{ fontSize: '10.5px', color: T.textMuted, background: T.bgRowAlt,
              padding: '6px 8px', borderRadius: 3, marginBottom: 8, lineHeight: 1.6 }}>
              현행 KDS는 관두께를 계산으로 규정하지 않고 <strong>KS·KWWA 인증 압력관 사용</strong>으로
              갈음합니다(해설편 p.543). 아래는 KDS가 조항으로 정량 규정하는 항목입니다.
            </div>
            <EngTable rows={[
              ...(result.kdsCompliance.items.cover.applicable ? [{
                label: '매설깊이 H',
                formula: result.kdsCompliance.items.cover.basis,
                value: result.kdsCompliance.items.cover.H,
                unit: 'm',
                limit: result.kdsCompliance.items.cover.H_min,
                ok: result.kdsCompliance.items.cover.ok,
              }] : []),
              {
                label: '최대사용압력 (수격 포함)',
                formula: `Pd × ${result.kdsCompliance.items.grade.surgeRatio}`,
                value: result.kdsCompliance.items.grade.Pmax,
                unit: 'MPa',
                limit: result.kdsCompliance.items.grade.maxAllow,
                ok: result.kdsCompliance.items.grade.ok,
              },
            ]}/>
            <div style={{ fontSize: '10.5px', color: T.textMuted, marginTop: 6, lineHeight: 1.7 }}>
              {result.kdsCompliance.items.cover.applicable ? (
                <>※ 매설깊이 — {result.kdsCompliance.items.cover.basis} [{result.kdsCompliance.items.cover.ref}]<br/></>
              ) : (
                <>※ {result.kdsCompliance.items.cover.note} [{result.kdsCompliance.items.cover.ref}]<br/></>
              )}
              {result.kdsCompliance.items.cover.note && result.kdsCompliance.items.cover.applicable && (
                <span style={{ color: '#b45309' }}>※ {result.kdsCompliance.items.cover.note}<br/></span>
              )}
              ※ 소요 압력등급 <strong style={{ color: T.textAccent }}>
                {result.kdsCompliance.items.grade.requiredGrade ?? '—'}
              </strong> (최대허용압력 {result.kdsCompliance.items.grade.maxAllow ?? '—'} MPa)
              · 여유 {result.kdsCompliance.items.grade.margin?.toFixed(3) ?? '—'} MPa
              [{result.kdsCompliance.items.grade.ref}]<br/>
              ※ 허용응력은 압력등급을 정하는 단계에 이미 반영되어 있습니다(해설편 p.215 — KS B 1501).
            </div>
          </EngPanel>
        )}

        {/* 내압 검토 */}
        <EngPanel title="Ⅱ-(a) 구조 검토: 내압 — 후프응력">
          <EngTable rows={pressureRows}/>
          {result?.hoopAllowSource && (
            <div style={{ fontSize: '10.5px', color: '#b45309', marginTop: 6, lineHeight: 1.6 }}>
              ※ {result.hoopAllowSource}
            </div>
          )}
        </EngPanel>

        {/* 링 휨 · 처짐 · 좌굴 */}
        <EngPanel title="Ⅱ-(b) 구조 검토: 링 휨 · 처짐 · 좌굴">
          {(result?.appliedCodeLabel || result?.allowSource) && (
            <div style={{
              fontSize: '10.5px', color: T.textMuted, background: T.bgRowAlt,
              padding: '6px 8px', borderRadius: 3, marginBottom: 8, lineHeight: 1.6,
            }}>
              <div><strong style={{ color: T.textAccent }}>적용 기준</strong> · {result.appliedCodeLabel}</div>
              {result.appliedFormula && <div style={{ fontFamily: 'monospace', fontSize: '10px' }}>{result.appliedFormula}</div>}
              {result.allowSource && <div><strong>허용응력 근거</strong> · {result.allowSource}</div>}
              {result.allowIsFallback && (
                <div style={{ color: '#b45309' }}>⚠ 미확인 강종 — 보수적 기본값이 적용되었습니다.</div>
              )}
              {result.beddingCoerced && (
                <div style={{ color: '#b45309' }}>
                  ⚠ 지지각 {result.beddingCoerced} 은 세부지침 {pipeType === 'steel' ? '11-135' : '11-137'} 표에 없어 {pipeType === 'steel' ? '60°' : '40°(가장 보수적인 값)'}로 보정되었습니다.
                </div>
              )}
            </div>
          )}
          <EngTable rows={structRows}/>
        </EngPanel>

        {/* 주철관 조합응력 검토 (KWW2004) */}
        {result?.combined && (
          <EngPanel title="Ⅱ-(c) 구조 검토: 조합응력 — 상수도시설기준(2004)">
            <EngTable rows={[
              { label: '인장응력 σts (정수압)', formula: 'Ps·d/(2t)',  value: result.combined.sigma_ts, unit: 'MPa' },
              { label: '인장응력 σtd (수격압)', formula: 'Pd·d/(2t)',  value: result.combined.sigma_td, unit: 'MPa' },
              { label: '휨응력 σb',            formula: '6·Kb·P·R²/t²', value: result.combined.sigma_b,  unit: 'MPa' },
              {
                label: '조합응력 (좌변)',
                formula: '2.5σts + 2.0σtd + 1.4σb',
                value: result.combined.demand,
                unit: 'MPa',
                limit: result.combined.S,
                ok: result.combined.ok,
              },
            ]}/>
            <div style={{ fontSize: '10.5px', color: T.textMuted, marginTop: 6, lineHeight: 1.6 }}>
              ※ S = {result.combined.S} MPa (GCD400 인장강도, KS D 4311) · 이용률 {(result.combined.utilization * 100).toFixed(1)}%<br/>
              ※ 안전율 — 정수압 2.5 / 수격압 2.0 / 토압·노면하중 2.0 (굽힘은 인장환산 0.7 적용 → 1.4)<br/>
              ※ 본 검토는 조합응력 전제이며, 단독 허용치로 환산해 사용하지 마십시오.
            </div>
          </EngPanel>
        )}

        {/* 안전성평가 등급 — 세부지침 11-133 [표 11.74] */}
        <EngPanel title="안전성평가 (세부지침 11-133 [표 11.74])">
          <div style={{ marginBottom: 8 }}>
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 3,
              fontSize: '15px', fontWeight: T.fw.bold, color: '#fff',
              background: (result as any).safetyGrade?.grade === 'a' ? '#15803d'
                : (result as any).safetyGrade?.grade === 'b' ? '#4d7c0f'
                : (result as any).safetyGrade?.grade === 'c' ? '#b45309'
                : (result as any).safetyGrade?.grade === 'd' ? '#c2410c' : '#b91c1c',
            }}>{((result as any).safetyGrade?.grade ?? '—').toUpperCase()}</span>
            <span style={{ marginLeft: 10, fontSize: '12px', color: T.textMuted }}>
              평가점수 {(result as any).safetyGrade?.score ?? '—'} / 5
            </span>
          </div>
          <EngTable rows={[
            { label: '안전율 SF', formula: '허용응력 / 발생응력 (최솟값)',
              value: (result as any).SF, unit: '' },
          ]}/>
          <div style={{ fontSize: '10.5px', color: T.textMuted, marginTop: 6, lineHeight: 1.6 }}>
            ※ {(result as any).safetyGrade?.desc ?? ''}<br/>
            ※ 주부재 손상(단면손실): <strong>{(result as any).hasSectionLoss ? '있음' : '없음'}</strong>
            {' '}— 등급 a/b 구분에 사용됩니다.<br/>
            ※ 허용응력설계법 기준. 검토항목 중 가장 불리한 값으로 등급을 판정합니다.
          </div>
        </EngPanel>

        {/* 최소관두께 */}
        <EngPanel title="(c) 관두께 적용">
          <EngTable rows={minThkRows}/>
          <div style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, marginTop: 6, lineHeight: 1.7, padding: '4px 6px', background: T.bgSection, borderRadius: 2 }}>
            관두께는 관 상세검사에서 측정된 구간별 최소 관두께와 관경별 기준 관두께 가운데
            작은 값을 적용한다. [세부지침 11-134]
            {!(result as any).hasMeasured && ' — 실측값 미입력으로 기준 두께를 적용했습니다.'}
          </div>
        </EngPanel>

        {/* 최종 판정 */}
        <EngStatusBar
          ok={verdict.overallOK as boolean}
          message={verdict.overallOK
            ? '구조안전성 확보 — 모든 검토항목 O.K.'
            : '구조안전성 부족 — N.G. 항목 확인 필요'}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => navigate('/structural/input')}
            style={{ flex: 1, padding: '6px 0', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.border}`, borderRadius: 2, fontFamily: T.fontSans }}>
            ◀  입력 수정
          </button>
          <button onClick={() => navigate('/structural/report')}
            style={{ flex: 1, padding: '6px 0', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2, fontFamily: T.fontSans, fontWeight: 700 }}>
            보고서 작성  ▶
          </button>
        </div>
      </div>

      {/* ── 우측: 삽도 ───────────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>

        {/* 삽도 탭 */}
        <div style={{ display: 'flex', marginBottom: 0, border: `1px solid ${T.border}`, borderBottom: 'none', borderRadius: '2px 2px 0 0', overflow: 'hidden' }}>
          {DIAGRAM_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setDiagTab(key)}
              style={{
                flex: 1, padding: '4px 4px', fontSize: '10px', cursor: 'pointer',
                background: diagTab === key ? T.bgActive : T.bgSection,
                color: diagTab === key ? 'white' : T.textAccent,
                border: 'none', fontFamily: T.fontSans, fontWeight: diagTab === key ? 700 : 400,
                whiteSpace: 'nowrap',
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ border: `1px solid ${T.border}`, borderRadius: '0 0 2px 2px', background: 'white', padding: 8, marginBottom: 8 }}>
          {diagTab === 'cross' && (
            <CrossSectionSVG Do={Do} H={inputs.H} t={tAdopt} hasTraffic={inputs.hasTraffic} gwLevel={inputs.gwLevel}/>
          )}
          {diagTab === 'deflect' && (
            <DeflectionSVG
              deflectionRatio={deflStep?.deflectionRatio ?? 0}
              maxDeflection={deflStep?.maxDeflection ?? 5}
              Do={Do}
            />
          )}
          {diagTab === 'hoop' && (
            <HoopStressSVG
              sigma={pipeType === 'steel' ? (hoopStep?.sigma_normal ?? 0) : (hoopStep?.sigma_hoop ?? 0)}
              sigmaA={pipeType === 'steel' ? (hoopStep?.sigmaA_normal ?? 0) : (hoopStep?.sigmaA_hoop ?? 0)}
              Pd={inputs.Pd}
              Do={Do}
              t={tAdopt}
            />
          )}
          {diagTab === 'bedding' && (
            <BeddingConditionSVG selected={(inputs as any).diBeddingType ?? 'deg90'}/>
          )}
        </div>

        {/* 안전율 게이지 */}
        <EngPanel title="안전율 게이지">
          <SafetyGaugeSVG items={gaugeItems}/>
        </EngPanel>

        {/* 항목별 판정 카드 */}
        <EngPanel title="항목별 판정">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: T.fontSans }}>
            <thead>
              <tr style={{ background: T.bgSection }}>
                <th style={th}>검토 항목</th>
                <th style={{ ...th, textAlign: 'right' }}>계산값</th>
                <th style={{ ...th, textAlign: 'right' }}>허용값</th>
                <th style={{ ...th, textAlign: 'center', width: 52 }}>판정</th>
              </tr>
            </thead>
            <tbody>
              {verdictItems.map(([k, item], i) => (
                <tr key={k} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                  <td style={td}>{item.label}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: T.fontMono, color: T.textNumber, fontWeight: 700 }}>
                    {typeof item.value === 'number' ? item.value.toFixed(3) : item.value} {item.unit}
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: T.fontMono, color: T.textMuted }}>
                    {typeof item.allow === 'number' ? item.allow.toFixed(3) : item.allow} {item.unit}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '1px 6px',
                      background: item.ok ? T.bgOK : T.bgNG,
                      color: item.ok ? T.textOK : T.textNG,
                      border: `1px solid ${item.ok ? '#a3d9b5' : '#f5b3b3'}`,
                      borderRadius: 2,
                    }}>
                      {item.ok ? 'O.K.' : 'N.G.'}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ background: verdict.overallOK ? '#f0faf4' : '#fff0f0', borderTop: `2px solid ${verdict.overallOK ? '#a3d9b5' : '#f5b3b3'}` }}>
                <td style={{ ...td, fontWeight: 700 }} colSpan={3}>종합 판정</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: verdict.overallOK ? T.textOK : T.textNG }}>
                  {verdict.overallOK ? 'O.K.' : 'N.G.'}
                </td>
              </tr>
            </tbody>
          </table>
        </EngPanel>
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '4px 6px', fontSize: 11, fontWeight: 700, color: T.textAccent, borderBottom: `1px solid ${T.border}`, textAlign: 'left' }
const td: React.CSSProperties = { padding: '4px 6px', borderBottom: `1px solid ${T.borderLight}`, verticalAlign: 'middle', fontSize: 11 }
