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

  const { verdict, steps, pipeType, Do, tAdopt } = result
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

  // 링 휨 / 처짐 검토
  const structRows = pipeType === 'steel' ? [
    ...(rs.step4 ? [
      { label: '링 휨 응력 σ_b',  formula: 'E·Do·Δy/(2·I)', value: rs.step4?.sigma_b, unit: 'MPa', limit: rs.step4?.sigmaA_b, ok: rs.step4?.ok },
    ] : []),
    { label: '처짐율 Δy/Do',      formula: 'Iowa식 (수정)', value: deflStep?.deflectionRatio, unit: '%', limit: deflStep?.maxDeflection, ok: deflStep?.ok },
    ...(rs.step6 ? [
      { label: '좌굴 안전율 FS',  formula: 'AWWA M11', value: rs.step6?.FS, unit: '',   limit: rs.step6?.FSAllow, ok: rs.step6?.ok },
    ] : []),
  ] : [
    ...(rs.step3 ? [
      { label: '링 휨 응력 σ_b',  formula: 'E·Do·Δy/(2I)', value: rs.step3?.sigma_b, unit: 'MPa', limit: rs.step3?.sigmaA_b, ok: rs.step3?.ok },
    ] : []),
    { label: '처짐율 Δy/Do',      formula: 'Iowa식 (DIPRA)', value: deflStep?.deflectionRatio, unit: '%', limit: deflStep?.maxDeflection, ok: deflStep?.ok },
  ]

  const gaugeItems = verdictItems.map(([k, v]) => ({ ...v, higherIsBetter: k === 'buckling' }))

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* ── 좌측: 검토 결과 ───────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>

        {/* 관 기본 정보 */}
        <EngPanel title="채택 관 제원">
          <EngParamGrid params={[
            { label: '관종', value: pipeType === 'steel' ? '강관 (KS D 3565)' : '덕타일주철관 (KS D 4311)' },
            ...(result.pipeDimManual
              ? [{ label: '관 제원', value: `Do=${Do}mm  t=${tAdopt}mm  [직접입력]` }]
              : [
                  { label: 'DN', value: `${result.DN} mm` },
                  { label: '외경 Do', value: `${Do} mm` },
                  { label: '채택 두께 t', value: `${tAdopt} mm` },
                ]
            ),
            { label: '설계수압 Pd', value: `${inputs.Pd} MPa` },
            { label: '수격 배율', value: `×${inputs.surgeRatio}` },
          ]}/>
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
        </EngPanel>

        {/* 링 휨 · 처짐 · 좌굴 */}
        <EngPanel title="(b) 링 휨 · 처짐 · 좌굴 검토">
          <EngTable rows={structRows}/>
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
            style={{ flex: 1, padding: '6px 0', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.borderDark}`, borderRadius: 2, fontFamily: T.fontSans }}>
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
