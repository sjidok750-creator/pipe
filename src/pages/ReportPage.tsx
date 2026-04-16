import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { T } from '../components/eng/tokens'

export default function ReportPage() {
  const navigate = useNavigate()
  const { result, inputs } = useStore()

  if (!result) {
    return (
      <div style={{ padding: 24, fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
        계산 결과가 없습니다.
        <button onClick={() => navigate('/structural/input')}
          style={{ marginLeft: 12, padding: '4px 12px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2 }}>
          입력 페이지로
        </button>
      </div>
    )
  }

  const { verdict, steps, pipeType, Do, tAdopt } = result
  const rs = steps as any
  const today = new Date().toLocaleDateString('ko-KR')

  const hoopStep = rs.step1
  const deflStep = pipeType === 'steel' ? rs.step5 : rs.step4
  const earthStep = rs.step2

  const rh: React.CSSProperties = {
    background: T.bgSection, padding: '4px 10px', fontWeight: 700, fontSize: 12,
    color: T.textAccent, borderLeft: `3px solid ${T.bgActive}`, margin: '16px 0 6px',
    fontFamily: T.fontSans,
  }

  const paramRows = (pairs: [string, string][]) => pairs.map(([k, v], i) => (
    <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
      <td style={{ ...rpTd, width: 180, fontWeight: 700 }}>{k}</td>
      <td style={rpTd}>{v}</td>
    </tr>
  ))

  // 검토 항목 행
  const verdictItems = Object.entries(verdict).filter(([k]) => k !== 'overallOK') as [string, any][]

  // 내압 결과
  const pressureLabel = pipeType === 'steel' ? '내압 (상시)' : '내압 (후프응력)'
  const pressureValue = pipeType === 'steel'
    ? `${hoopStep?.sigma_normal?.toFixed(2)} MPa`
    : `${hoopStep?.sigma_hoop?.toFixed(2)} MPa`
  const pressureAllow = pipeType === 'steel'
    ? `${hoopStep?.sigmaA_normal?.toFixed(1)} MPa`
    : `${hoopStep?.sigmaA_hoop?.toFixed(1)} MPa`
  const pressureOK = pipeType === 'steel' ? (hoopStep?.ok_normal && hoopStep?.ok_surge) : hoopStep?.ok

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2, fontFamily: T.fontSans }}>
          인쇄 / PDF 저장
        </button>
        <button onClick={() => navigate('/structural/result')}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.borderDark}`, borderRadius: 2, fontFamily: T.fontSans }}>
          결과 페이지로
        </button>
      </div>

      <div style={{ background: 'white', border: `1px solid ${T.border}`, padding: '32px 40px' }}>
        {/* 표지 */}
        <div style={{ textAlign: 'center', marginBottom: 28, borderBottom: `2px solid ${T.bgActive}`, paddingBottom: 18 }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>KDS 57 10 00 : 2022 상수도 시설 설계기준 — 관로</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: T.bgActive, marginBottom: 4, fontFamily: T.fontSans }}>
            매설관로 구조안전성 검토서
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>
            {pipeType === 'steel' ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'}
            &nbsp;|&nbsp;작성일: {today}
          </div>
        </div>

        {/* 1. 평가 개요 */}
        <div style={rh}>1. 검토 개요</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
          <tbody>
            {paramRows([
              ['적용기준', 'KDS 57 10 00 : 2022 상수도 시설 설계기준 / KS D 3565 / KS D 4311'],
              ['검토방법', '허용응력법 (내압) / 수정Iowa식 (처짐·링휨) / AWWA M11 (외압좌굴)'],
              ['관종',    pipeType === 'steel' ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'],
              ['공칭관경', `DN ${result.DN} mm`],
              ['외경 Do', `${Do} mm`],
              ['채택 두께 t', `${tAdopt} mm`],
            ])}
          </tbody>
        </table>

        {/* 2. 관로 제원 및 입력값 */}
        <div style={rh}>2. 관로 제원 및 설계 하중</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
          <tbody>
            {paramRows([
              ['설계 운전압력 Pd', `${inputs.Pd} MPa`],
              ['수격압 배율',      `× ${inputs.surgeRatio}  →  Pd' = ${(inputs.Pd * inputs.surgeRatio).toFixed(3)} MPa`],
              ['관정 매설깊이 H', `${inputs.H} m`],
              ['차량하중',         inputs.hasTraffic ? 'DB-24 적용' : '미적용'],
              ...(pipeType === 'steel' ? [['모르타르 라이닝', inputs.hasLining ? '적용 (허용처짐 3%)' : '미적용 (허용처짐 5%)'] as [string, string]] : []),
              ['토질 등급',        inputs.soilClass],
              ['다짐도',           inputs.soilClass !== 'loose' ? `${inputs.compaction}%` : '연약지반'],
              ['탄성지반반력 E\'', `${inputs.Eprime} kPa`],
              ['흙 단위중량 γ',   `${inputs.gammaSoil} kN/m³`],
              ['침상 조건',        pipeType === 'steel'
                ? (inputs.steelBeddingType ?? '-')
                : (inputs.beddingType ?? '-')],
              ['지하수위',         inputs.gwLevel],
            ])}
          </tbody>
        </table>

        {/* 3. 계산 결과 */}
        <div style={rh}>3. 구조안전성 검토 결과</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.fontSans }}>
          <thead>
            <tr style={{ background: T.bgSection }}>
              <th style={rpTh}>검토 항목</th>
              <th style={{ ...rpTh, textAlign: 'right' }}>계산값</th>
              <th style={{ ...rpTh, textAlign: 'right' }}>허용값</th>
              <th style={{ ...rpTh, textAlign: 'center', width: 60 }}>판정</th>
            </tr>
          </thead>
          <tbody>
            {verdictItems.map(([k, item], i) => (
              <tr key={k} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={rpTd}>{item.label}</td>
                <td style={{ ...rpTd, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700 }}>
                  {typeof item.value === 'number' ? item.value.toFixed(3) : item.value} {item.unit}
                </td>
                <td style={{ ...rpTd, textAlign: 'right', fontFamily: T.fontMono, color: T.textMuted }}>
                  {typeof item.allow === 'number' ? item.allow.toFixed(3) : item.allow} {item.unit}
                </td>
                <td style={{ ...rpTd, textAlign: 'center' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '1px 6px',
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
            {pipeType === 'steel' && hoopStep?.sigma_surge !== undefined && (
              <tr style={{ background: T.bgRow }}>
                <td style={rpTd}>내압 (수격)</td>
                <td style={{ ...rpTd, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700 }}>
                  {hoopStep?.sigma_surge?.toFixed(2)} MPa
                </td>
                <td style={{ ...rpTd, textAlign: 'right', fontFamily: T.fontMono, color: T.textMuted }}>
                  {hoopStep?.sigmaA_surge?.toFixed(1)} MPa
                </td>
                <td style={{ ...rpTd, textAlign: 'center' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '1px 6px',
                    background: hoopStep?.ok_surge ? T.bgOK : T.bgNG,
                    color: hoopStep?.ok_surge ? T.textOK : T.textNG,
                    border: `1px solid ${hoopStep?.ok_surge ? '#a3d9b5' : '#f5b3b3'}`,
                    borderRadius: 2,
                  }}>
                    {hoopStep?.ok_surge ? 'O.K.' : 'N.G.'}
                  </span>
                </td>
              </tr>
            )}
            <tr style={{ background: verdict.overallOK ? '#f0faf4' : '#fff0f0', borderTop: `2px solid ${verdict.overallOK ? '#a3d9b5' : '#f5b3b3'}` }}>
              <td style={{ ...rpTd, fontWeight: 700 }} colSpan={3}>종합 판정</td>
              <td style={{ ...rpTd, textAlign: 'center', fontWeight: 700, color: verdict.overallOK ? T.textOK : T.textNG }}>
                {verdict.overallOK ? 'O.K.' : 'N.G.'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. 검토 의견 */}
        <div style={rh}>4. 검토 의견</div>
        <div style={{ fontSize: 12, lineHeight: 2, fontFamily: T.fontSans, padding: '8px 0' }}>
          {verdict.overallOK
            ? `본 관로는 KDS 57 10 00 : 2022 기준에 의한 구조안전성 검토 결과 모든 검토항목에서 허용기준을 만족한다. DN ${result.DN} (Do=${Do}mm, t=${tAdopt}mm) ${pipeType === 'steel' ? '강관' : '덕타일 주철관'}은 설계 하중 조건에 대하여 구조적으로 안전한 것으로 판단한다.`
            : `본 관로는 KDS 57 10 00 : 2022 기준에 의한 구조안전성 검토 결과 일부 검토항목에서 허용기준을 초과한다. 관경·관두께·침상조건 등을 재검토하거나 보강 방안을 강구하여야 한다.`}
        </div>

        <div style={{ marginTop: 28, borderTop: `1px solid ${T.borderLight}`, paddingTop: 10, fontSize: 10, color: T.textMuted, fontFamily: T.fontSans, lineHeight: 1.8 }}>
          ※ 내압 검토: 허용응력법  (상시 σ_a = 0.50fy, 수격 σ_a = 0.75fy)  [KDS 57 10 00 §3.3]<br/>
          ※ 링 휨·처짐: 수정Iowa식  Δy = Dl·Kb·Wc·r³ / (EI + 0.061E'r³)  [AWWA M11 / KDS 57 10 00 §3.4]<br/>
          ※ 외압 좌굴: Modified AWWA M11  (강관 전용, 안전율 FS=2.5)<br/>
          ※ 차량하중: AASHTO Boussinesq 이론 + DB-24 표준하중  (충격계수 IF 적용)
        </div>
      </div>
    </div>
  )
}

const rpTh: React.CSSProperties = { padding: '4px 8px', fontSize: 11, fontWeight: 700, color: T.textAccent, borderBottom: `1px solid ${T.border}`, textAlign: 'left' }
const rpTd: React.CSSProperties = { padding: '5px 8px', borderBottom: `1px solid ${T.borderLight}`, verticalAlign: 'middle', fontSize: 12 }
