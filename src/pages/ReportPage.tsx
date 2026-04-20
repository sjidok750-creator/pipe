import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { T } from '../components/eng/tokens'
import { Frac, Sub, Sup, FormulaBlock, FormulaRow, ResultBlock, OKBadge, G } from '../components/report/MathElements'

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

  const rh: React.CSSProperties = {
    background: T.bgSection, padding: '4px 10px', fontWeight: 700, fontSize: 12,
    color: T.textAccent, borderLeft: `3px solid ${T.bgActive}`, margin: '14px 0 6px',
    fontFamily: T.fontSans,
  }
  const secBreak: React.CSSProperties = {
    ...rh, marginTop: 0,
  }

  const verdictItems = Object.entries(verdict).filter(([k]) => k !== 'overallOK') as [string, any][]

  const mono: React.CSSProperties = { fontFamily: T.fontMono }
  const F = T.fontSans

  return (
    <div className="report-wrapper" style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* 인쇄 버튼 — 인쇄 시 숨김 */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2, fontFamily: F }}>
          인쇄 / PDF 저장
        </button>
        <button onClick={() => navigate('/structural/result')}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.borderDark}`, borderRadius: 2, fontFamily: F }}>
          결과 페이지로
        </button>
      </div>

      <div className="report-body" style={{ background: 'white', border: `1px solid ${T.border}`, padding: '28px 36px', fontFamily: F, fontSize: 11 }}>

        {/* ── 표지 ── */}
        <div className="keep-together" style={{ textAlign: 'center', marginBottom: 24, borderBottom: `2px solid ${T.bgActive}`, paddingBottom: 16 }}>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>KDS 57 10 00 : 2022 상수도 시설 설계기준 — 관로</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: T.bgActive, marginBottom: 4, fontFamily: F }}>
            매설관로 구조안전성 검토서
          </div>
          <div style={{ fontSize: 10.5, color: T.textMuted }}>
            {pipeType === 'steel' ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'}
            &nbsp;|&nbsp;작성일: {today}
          </div>
        </div>

        {/* ── 1. 검토 개요 ── */}
        <div style={rh}>1. 검토 개요</div>
        <table style={TABLE}>
          <tbody>
            {([
              ['적용기준', 'KDS 57 10 00 : 2022 상수도 시설 설계기준 / KS D 3565 / KS D 4311'],
              ['검토방법', '허용응력법 (내압) / 수정Iowa식 (처짐·링휨) / AWWA M11 (외압좌굴)'],
              ['관종',    pipeType === 'steel' ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'],
              ...(result.pipeDimManual
                ? [['관 제원', `Do=${Do}mm  t=${tAdopt}mm  [직접입력]`]]
                : [['공칭관경', `DN ${result.DN} mm`], ['외경 D\u2080', `${Do} mm`], ['채택 두께 t', `${tAdopt} mm`]]
              ),
            ] as [string, string][]).map(([k, v], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={{ ...TD, width: 180, fontWeight: 700 }}>{k}</td>
                <td style={TD}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── 2. 설계 하중 및 관로 제원 ── */}
        <div style={rh}>2. 관로 제원 및 설계 하중</div>
        <table style={TABLE}>
          <tbody>
            {([
              ['설계 운전압력 P\u2091', `${inputs.Pd} MPa`],
              ['수격압 배율', `${G.times} ${inputs.surgeRatio}  →  P\u2091' = ${(inputs.Pd * inputs.surgeRatio).toFixed(3)} MPa`],
              ['관정 매설깊이 H', `${inputs.H} m`],
              ['차량하중', inputs.hasTraffic ? 'DB-24 적용' : '미적용'],
              ...(pipeType === 'steel' ? [["모르타르 라이닝", inputs.hasLining ? '적용 (허용처짐 3%)' : '미적용 (허용처짐 5%)'] as [string,string]] : []),
              ['토질 등급', inputs.soilClass],
              ['다짐도', inputs.soilClass !== 'loose' ? `${inputs.compaction}%` : '연약지반'],
              ["탄성지반반력 E'", `${inputs.Eprime} kPa`],
              ['흙 단위중량 γ', `${inputs.gammaSoil} kN/m³`],
              ['침상 조건', pipeType === 'steel' ? (inputs.steelBeddingType ?? '-') : (inputs.beddingType ?? '-')],
              ['지하수위', inputs.gwLevel],
            ] as [string, string][]).map(([k, v], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={{ ...TD, width: 180, fontWeight: 700 }}>{k}</td>
                <td style={TD}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── 3. 계산 수식 및 과정 ── */}
        <div style={{ ...rh, ...{ marginTop: 16 } }} className="page-break-before">3. 계산 수식 및 과정</div>

        {/* 3-1. 내압 검토 */}
        <div style={SUB}>3.1 내압 검토 (후프응력)</div>
        <FormulaBlock>
          {pipeType === 'steel' ? (
            <>
              <FormulaRow>
                {G.sigma}<Sub>h</Sub> = <Frac top={<>P{G.cdot}D<Sub>i</Sub></>} bot="2t" /> (상시)&nbsp;,&nbsp;
                {G.sigma}<Sub>allow,n</Sub> = 0.50 × f<Sub>y</Sub>
              </FormulaRow>
              <FormulaRow>
                {G.sigma}<Sub>h,surge</Sub> = <Frac top={<>P' {G.cdot} D<Sub>i</Sub></>} bot="2t" /> (수격)&nbsp;,&nbsp;
                {G.sigma}<Sub>allow,s</Sub> = 0.75 × f<Sub>y</Sub>
              </FormulaRow>
            </>
          ) : (
            <FormulaRow>
              {G.sigma}<Sub>h</Sub> = <Frac top={<>P{G.cdot}(D<Sub>o</Sub>−t)</>} bot="2t" />&nbsp;,&nbsp;
              {G.sigma}<Sub>allow</Sub> = <Frac top="f\u2091" bot="S" /> (S = 안전율)
            </FormulaRow>
          )}
        </FormulaBlock>
        <ResultBlock ok={pipeType === 'steel' ? (hoopStep?.ok_normal && hoopStep?.ok_surge) : hoopStep?.ok}>
          <FormulaRow>
            {pipeType === 'steel' ? (
              <>{G.sigma}<Sub>h</Sub> = <strong>{hoopStep?.sigma_normal?.toFixed(2)} MPa</strong>
              &nbsp;{G.le}&nbsp;{G.sigma}<Sub>allow</Sub> = {hoopStep?.sigmaA_normal?.toFixed(1)} MPa</>
            ) : (
              <>{G.sigma}<Sub>h</Sub> = <strong>{hoopStep?.sigma_hoop?.toFixed(2)} MPa</strong>
              &nbsp;{G.le}&nbsp;{G.sigma}<Sub>allow</Sub> = {hoopStep?.sigmaA_hoop?.toFixed(1)} MPa</>
            )}
            &nbsp;&nbsp;<OKBadge ok={pipeType === 'steel' ? (hoopStep?.ok_normal && hoopStep?.ok_surge) : hoopStep?.ok} />
          </FormulaRow>
          {pipeType === 'steel' && hoopStep?.sigma_surge !== undefined && (
            <FormulaRow>
              수격: {G.sigma}<Sub>h,surge</Sub> = <strong>{hoopStep?.sigma_surge?.toFixed(2)} MPa</strong>
              &nbsp;{G.le}&nbsp;{hoopStep?.sigmaA_surge?.toFixed(1)} MPa
              &nbsp;&nbsp;<OKBadge ok={hoopStep?.ok_surge} />
            </FormulaRow>
          )}
        </ResultBlock>

        {/* 3-2. 링 처짐 */}
        <div style={SUB}>3.2 링 처짐 (수정 Iowa식)</div>
        <FormulaBlock>
          <FormulaRow>
            <Frac top={<>{G.Delta}y</>} bot="D" /> =&nbsp;
            <Frac top={<>D<Sub>L</Sub> {G.cdot} K<Sub>b</Sub> {G.cdot} W<Sub>c</Sub> {G.cdot} r{G.cb}</>} bot={<>EI + 0.061 E' r{G.cb}</>} />
            &nbsp;{G.le}&nbsp;
            {pipeType === 'steel' && inputs.hasLining ? '3%' : pipeType === 'steel' ? '5%' : '3%'}
          </FormulaRow>
          <FormulaRow>여기서, W<Sub>c</Sub> : 토피하중 (kN/m{G.sq}), E' : 탄성지반반력 ({inputs.Eprime} kPa)</FormulaRow>
        </FormulaBlock>
        {deflStep && (
          <ResultBlock ok={deflStep?.ok}>
            <FormulaRow>
              {G.Delta}y/D = <strong>{(deflStep?.deflRatio * 100)?.toFixed(3)} %</strong>
              &nbsp;{G.le}&nbsp;{deflStep?.allowRatio * 100} %
              &nbsp;&nbsp;<OKBadge ok={deflStep?.ok} />
            </FormulaRow>
          </ResultBlock>
        )}

        {/* 3-3. 링 휨응력 */}
        <div style={SUB}>3.3 링 휨응력</div>
        <FormulaBlock>
          <FormulaRow>
            {G.sigma}<Sub>b</Sub> = <Frac top={<>3E {G.cdot} t</>} bot={<>D{G.sq}</>} /> {G.cdot}&nbsp;
            <Frac top={<>{G.Delta}y</>} bot="D" />
          </FormulaRow>
        </FormulaBlock>

        {/* 3-4. 외압 좌굴 (강관) */}
        {pipeType === 'steel' && (
          <>
            <div style={SUB}>3.4 외압 좌굴 (강관)</div>
            <FormulaBlock>
              <FormulaRow>
                P<Sub>cr</Sub> = <Frac top={<>2E</>} bot={<>(1−{G.nu}{G.sq})</>} /> {G.cdot}&nbsp;
                <Frac top={<>(t/D)<Sup>3</Sup></>} bot="1" />
                &nbsp;→&nbsp; 안전율 FS = 2.5
              </FormulaRow>
            </FormulaBlock>
          </>
        )}

        {/* ── 4. 구조안전성 검토 결과 ── */}
        <div style={rh} className="page-break-before">4. 구조안전성 검토 결과</div>
        <table style={{ ...TABLE, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.bgSection }}>
              <th style={TH}>검토 항목</th>
              <th style={{ ...TH, textAlign: 'right' }}>계산값</th>
              <th style={{ ...TH, textAlign: 'right' }}>허용값</th>
              <th style={{ ...TH, textAlign: 'center', width: 60 }}>판정</th>
            </tr>
          </thead>
          <tbody>
            {verdictItems.map(([k, item], i) => (
              <tr key={k} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={TD}>{item.label}</td>
                <td style={{ ...TD, textAlign: 'right', ...mono, fontWeight: 700 }}>
                  {typeof item.value === 'number' ? item.value.toFixed(3) : item.value} {item.unit}
                </td>
                <td style={{ ...TD, textAlign: 'right', ...mono, color: T.textMuted }}>
                  {typeof item.allow === 'number' ? item.allow.toFixed(3) : item.allow} {item.unit}
                </td>
                <td style={{ ...TD, textAlign: 'center' }}>
                  <OKBadge ok={item.ok} />
                </td>
              </tr>
            ))}
            {pipeType === 'steel' && hoopStep?.sigma_surge !== undefined && (
              <tr style={{ background: T.bgRow }}>
                <td style={TD}>내압 (수격)</td>
                <td style={{ ...TD, textAlign: 'right', ...mono, fontWeight: 700 }}>
                  {hoopStep?.sigma_surge?.toFixed(2)} MPa
                </td>
                <td style={{ ...TD, textAlign: 'right', ...mono, color: T.textMuted }}>
                  {hoopStep?.sigmaA_surge?.toFixed(1)} MPa
                </td>
                <td style={{ ...TD, textAlign: 'center' }}>
                  <OKBadge ok={hoopStep?.ok_surge} />
                </td>
              </tr>
            )}
            <tr style={{ background: verdict.overallOK ? '#f0faf4' : '#fff0f0', borderTop: `2px solid ${verdict.overallOK ? '#a3d9b5' : '#f5b3b3'}` }}>
              <td style={{ ...TD, fontWeight: 700 }} colSpan={3}>종합 판정</td>
              <td style={{ ...TD, textAlign: 'center', fontWeight: 700, color: verdict.overallOK ? '#1a6b3a' : '#c0392b' }}>
                {verdict.overallOK ? 'O.K.' : 'N.G.'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 5. 검토 의견 ── */}
        <div style={rh}>5. 검토 의견</div>
        <div style={{ fontSize: 11, lineHeight: 2, fontFamily: F, padding: '6px 0' }}>
          {verdict.overallOK
            ? `본 관로는 KDS 57 10 00 : 2022 기준에 의한 구조안전성 검토 결과 모든 검토항목에서 허용기준을 만족한다. ${result.pipeDimManual ? `D\u2080=${Do}mm, t=${tAdopt}mm [직접입력]` : `DN ${result.DN} (D\u2080=${Do}mm, t=${tAdopt}mm)`} ${pipeType === 'steel' ? '강관' : '덕타일 주철관'}은 설계 하중 조건에 대하여 구조적으로 안전한 것으로 판단한다.`
            : `본 관로는 KDS 57 10 00 : 2022 기준에 의한 구조안전성 검토 결과 일부 검토항목에서 허용기준을 초과한다. 관경·관두께·침상조건 등을 재검토하거나 보강 방안을 강구하여야 한다.`}
        </div>

        {/* 각주 */}
        <div style={{ marginTop: 24, borderTop: `1px solid ${T.borderLight}`, paddingTop: 8, fontSize: 9.5, color: T.textMuted, fontFamily: F, lineHeight: 1.9 }}>
          ※ 내압 검토: 허용응력법 (상시 {G.sigma}<Sub>a</Sub> = 0.50f<Sub>y</Sub>, 수격 {G.sigma}<Sub>a</Sub> = 0.75f<Sub>y</Sub>) [KDS 57 10 00 §3.3]<br/>
          ※ 링 휨·처짐: 수정Iowa식&nbsp;
          {G.Delta}y = D<Sub>L</Sub>{G.cdot}K<Sub>b</Sub>{G.cdot}W<Sub>c</Sub>{G.cdot}r{G.cb} / (EI + 0.061E'r{G.cb})&nbsp;[AWWA M11 / KDS 57 10 00 §3.4]<br/>
          ※ 외압 좌굴: Modified AWWA M11 (강관 전용, 안전율 FS=2.5)<br/>
          ※ 차량하중: AASHTO Boussinesq 이론 + DB-24 표준하중 (충격계수 IF 적용)
        </div>
      </div>
    </div>
  )
}

const TABLE: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 10.5, marginBottom: 4 }
const TH: React.CSSProperties = { padding: '4px 8px', fontSize: 10.5, fontWeight: 700, color: '#1a3a5c', borderBottom: '1px solid #bbb', textAlign: 'left', background: '#eef2f8' }
const TD: React.CSSProperties = { padding: '4px 8px', borderBottom: '1px solid #ddd', verticalAlign: 'middle', fontSize: 10.5 }
const SUB: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#1a3a5c', borderLeft: '3px solid #1a3a5c', paddingLeft: 6, marginTop: 12, marginBottom: 4 }
