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
import BoussinesqSVG from '../components/diagrams/BoussinesqSVG'
import BeddingConditionSVG from '../components/diagrams/BeddingConditionSVG'
import EValueChartSVG from '../components/diagrams/EValueChartSVG'

const DIAGRAM_TABS = [
  { key: 'cross',   label: '단면도' },
  { key: 'deflect', label: '처짐' },
  { key: 'hoop',    label: '내압' },
  { key: 'bouss',   label: 'DB-24' },
  { key: 'bedding', label: '침상' },
  { key: 'eprime',  label: "E'" },
]

export default function ResultPage() {
  const navigate = useNavigate()
  const { result, inputs, dual } = useStore()
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

  const { verdict, steps, pipeType, Do, tAdopt, tRequired } = result
  const rs = steps as any
  const hoopStep = rs.step1
  const deflStep = pipeType === 'steel' ? rs.step5 : rs.step4

  // 결과 테이블 행 구성
  const verdictItems = Object.entries(verdict)
    .filter(([k]) => k !== 'overallOK') as [string, any][]

  // 지반·토압 파라미터
  const earthStep = pipeType === 'steel' ? rs.step2 : rs.step2
  const groundParams = [
    { label: '토피 H',         value: inputs.H,               unit: 'm' },
    { label: '흙 단위중량 γ',  value: inputs.gammaSoil,       unit: 'kN/m³' },
    { label: '토사하중 We',    value: earthStep?.We,          unit: 'kN/m' },
    { label: '탄성지반반력 E\'', value: inputs.Eprime,         unit: 'kPa' },
    { label: '외경 Do',        value: Do,                     unit: 'mm' },
    { label: '채택 두께 t',    value: tAdopt,                 unit: 'mm' },
  ]

  // 내압 검토
  const pressureRows = pipeType === 'steel' ? [
    { label: '상시 내압응력 σ',   formula: 'Pd·Do/(2t)', value: hoopStep?.sigma_normal, unit: 'MPa', limit: hoopStep?.sigmaA_normal, ok: hoopStep?.ok_normal },
    { label: '수격 내압응력 σ',   formula: 'Psurge·Do/(2t)', value: hoopStep?.sigma_surge, unit: 'MPa', limit: hoopStep?.sigmaA_surge, ok: hoopStep?.ok_surge },
  ] : [
    { label: '내압 후프응력 σ',   formula: 'Pd·Di/(2t)', value: hoopStep?.sigma_hoop, unit: 'MPa', limit: hoopStep?.sigmaA_hoop, ok: hoopStep?.ok },
  ]

  // 링 휨 / 처짐 검토 — 필드명은 각 engine 파일의 실제 반환값 기준
  const structRows = pipeType === 'steel' ? [
    ...(rs.step4 ? [
      { label: '링 휨 응력 σ_b',  formula: 'Kb·Wtotal·Do/t²', value: rs.step4?.sigma_b, unit: 'MPa', limit: rs.step4?.sigmaA_bend, ok: rs.step4?.ok },
    ] : []),
    { label: '처짐율 Δy/Do',      formula: 'Iowa식 (수정)', value: deflStep?.deflectionRatio, unit: '%', limit: deflStep?.maxDeflection, ok: deflStep?.ok },
    ...(rs.step6 ? [
      { label: '좌굴 안전율 FS',  formula: 'AWWA M11', value: rs.step6?.bucklingFS_actual, unit: '', limit: rs.step6?.FS_allow, ok: rs.step6?.ok },
    ] : []),
  ] : [
    ...(rs.step3 ? [
      { label: '링 휨 응력 σ_b',  formula: 'Kb·Wtotal·Do/t²', value: rs.step3?.sigma_b, unit: 'MPa', limit: rs.step3?.sigmaA_bend, ok: rs.step3?.ok },
    ] : []),
    { label: '처짐율 Δy/Do',      formula: 'Iowa식 (DIPRA)', value: deflStep?.deflectionRatio, unit: '%', limit: deflStep?.maxDeflection, ok: deflStep?.ok },
  ]

  // 최소관두께 검토 행 구성
  const minThkRows = pipeType === 'steel' ? [
    { label: '내압 최소두께 (상시)', formula: 'Pd·Do/(2·σA_normal)', value: hoopStep?.tp_normal, unit: 'mm' },
    { label: '내압 최소두께 (수격)', formula: 'Psurge·Do/(2·σA_surge)', value: hoopStep?.tp_surge, unit: 'mm' },
    { label: '취급 최소두께', formula: 'Do/288', value: hoopStep?.tHandling, unit: 'mm' },
    { label: '소요 최소두께 (합계)', formula: 'max(위) + 1.5mm 부식여유', value: tRequired, unit: 'mm' },
    { label: '채택 두께 t', formula: '—', value: tAdopt, unit: 'mm', ok: tAdopt >= tRequired },
  ] : [
    { label: '내압 최소두께 tp_hoop', formula: 'Pd·Do/(2·(σA+Pd))', value: hoopStep?.tp_hoop, unit: 'mm' },
    { label: '외압(링휨) 최소두께 tp_bend', formula: '√(Kb·W·Do/σA_bend)', value: hoopStep?.tp_bend, unit: 'mm' },
    { label: '소요 최소두께', formula: 'max(tp_hoop, tp_bend)', value: tRequired, unit: 'mm' },
    { label: '채택 두께 t', formula: '—', value: tAdopt, unit: 'mm', ok: tAdopt >= tRequired },
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
                ['수격압 Pd\'', `${inputs.Pd} × ${inputs.surgeRatio} = ${(inputs.Pd * inputs.surgeRatio).toFixed(3)} MPa`],
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

        {/* 내압 검토 */}
        <EngPanel title="(a) 내압 검토 — 후프응력">
          <EngTable rows={pressureRows}/>
          {result?.hoopAllowSource && (
            <div style={{ fontSize: '10.5px', color: '#b45309', marginTop: 6, lineHeight: 1.6 }}>
              ※ {result.hoopAllowSource}
            </div>
          )}
        </EngPanel>

        {/* 링 휨 · 처짐 · 좌굴 */}
        <EngPanel title="(b) 링 휨 · 처짐 · 좌굴 검토">
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
                  ⚠ 지지각 {result.beddingCoerced} 은 2004 기준 표에 없어 60°로 보정되었습니다.
                </div>
              )}
            </div>
          )}
          <EngTable rows={structRows}/>
        </EngPanel>

        {/* 주철관 조합응력 검토 (KWW2004) */}
        {result?.combined && (
          <EngPanel title="(b-2) 조합응력 검토 — 상수도시설기준(2004)">
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

        {/* 병기(倂記) 판정 — 두 기준 동시 비교 */}
        {dual && (
          <EngPanel title="(b-2) 기준별 병기 판정 — 구 기준(2004) vs 현행(KDS 2022)">
            <div style={{ marginBottom: 8 }}>
              <span style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 3,
                fontSize: '12px', fontWeight: T.fw.bold, color: '#fff',
                background: dual.verdict === 'PASS' ? '#15803d'
                  : dual.verdict === 'CHECK_BACKFILL' ? '#b45309'
                  : dual.verdict === 'REINFORCE' ? '#b91c1c' : '#6d28d9',
              }}>{dual.verdictLabel}</span>
              <span style={{ marginLeft: 10, fontSize: '11px', color: T.textMuted }}>{dual.verdictNote}</span>
            </div>
            <EngTable rows={[
              {
                label: '구 기준 (2004, E′ 반영)',
                formula: 'σb = (2/(f·Z))·(Wv+Wt)·[…E′…]',
                value: dual.A?.setA?.sigma_b,
                unit: 'MPa',
                limit: dual.A?.setA?.sigmaA_bend,
                ok: dual.A?.setA?.ok_bending,
              },
              {
                label: '현행 KDS (E′ 미반영)',
                formula: 'σb = Kb·Wtotal·Do/t²',
                value: dual.B?.steps?.step4?.sigma_b,
                unit: 'MPa',
                limit: dual.B?.steps?.step4?.sigmaA_bend,
                ok: dual.B?.steps?.step4?.ok,
              },
            ]}/>
            <div style={{ fontSize: '10.5px', color: T.textMuted, marginTop: 6, lineHeight: 1.6 }}>
              ※ 두 기준은 산정식·허용응력이 세트로 다릅니다. 구 기준은 지반 반력(E′)이 응력을 낮추고 허용응력도 높아
              일반적으로 더 관대합니다. 현행 기준 초과·구 기준 만족 시에는 되메움 다짐도(E′) 확보 여부를 확인하십시오.
            </div>
          </EngPanel>
        )}

        {/* 최소관두께 */}
        <EngPanel title="(c) 최소관두께 검토 (참고)">
          <EngTable rows={minThkRows}/>
          <div style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontSans, marginTop: 6, lineHeight: 1.7, padding: '4px 6px', background: T.bgSection, borderRadius: 2 }}>
            {pipeType === 'steel'
              ? '강관: AWWA M11 취급최소두께(Do/288) + 부식여유 1.5mm 포함. 기준: AWWA M11 Eq.3-1 / KS D 3565'
              : '주철관: KS D 4311 기준 Di기반 Barlow 역산(내압) 및 링휨 역산(외압). KS D 4311에 취급최소두께·부식여유 별도 규정 없으므로 해당 항목 미적용.'}
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
          {diagTab === 'bouss' && <BoussinesqSVG currentH={inputs.H}/>}
          {diagTab === 'bedding' && (
            <BeddingConditionSVG selected={pipeType === 'ductile' ? inputs.beddingType : 'Type2'}/>
          )}
          {diagTab === 'eprime' && (
            <EValueChartSVG currentH={inputs.H} currentE={inputs.Eprime} compaction={inputs.compaction}/>
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
