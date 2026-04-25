import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import {
  KIND_INDEX, EARTH_INDEX, SIZE_INDEX,
  CONNECT_INDEX, FACIL_INDEX, MCONE_INDEX,
  SEISMIC_ZONE, SEISMIC_GRADE, getSizeIndex,
} from '../../engine/seismicConstants.js'
import { T } from '../../components/eng/tokens'
import { Frac, Sub, FormulaBlock, FormulaRow, ResultBlock, OKBadge, G } from '../../components/report/MathElements'

export default function SeismicPrelimReportPage() {
  const navigate = useNavigate()
  const { prelimInputs: inp, prelimResult: r } = useSeismicStore()

  if (!r) {
    return (
      <div style={{ padding: 24, fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
        계산 결과가 없습니다. 입력 후 계산을 실행하십시오.
        <button onClick={() => navigate('/seismic-prelim/input')}
          style={{ marginLeft: 12, padding: '4px 12px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2 }}>
          입력 페이지로
        </button>
      </div>
    )
  }

  const Z = SEISMIC_ZONE[inp.zone as 'I' | 'II'].Z
  const gradeInfo = SEISMIC_GRADE[inp.seismicGrade as 'I' | 'II']
  const sizeKey = getSizeIndex(inp.DN)
  const today = new Date().toLocaleDateString('ko-KR')

  const F = T.fontSans

  return (
    <div className="report-wrapper" style={{ maxWidth: 820, margin: '0 auto' }}>

      {/* 인쇄 버튼 */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2, fontFamily: F }}>
          인쇄 / PDF 저장
        </button>
        <button onClick={() => navigate('/seismic-prelim/result')}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.border}`, borderRadius: 2, fontFamily: F }}>
          결과 페이지로
        </button>
      </div>

      {/* 보고서 본문 */}
      <div className="report-body" style={{ background: 'white', border: `1px solid ${T.border}`, padding: '28px 36px', fontFamily: F, fontSize: 11 }}>

        {/* ── 표지 ── */}
        <div className="keep-together" style={{ textAlign: 'center', marginBottom: 28, borderBottom: `2px solid ${T.bgActive}`, paddingBottom: 18 }}>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6 }}>KDS 57 17 00 : 2022 상수도 내진설계기준</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: T.bgActive, marginBottom: 4, fontFamily: F }}>
            매설관로 내진성능 예비평가 검토서
          </div>
          <div style={{ fontSize: 10.5, color: T.textMuted }}>작성일 : {today}</div>
        </div>

        {/* ── 1. 평가 개요 ── */}
        <div style={RH}>1. 평가 개요</div>
        <table style={TABLE}>
          <tbody>
            {([
              ['적용기준', 'KDS 57 17 00 : 2022 상수도 내진설계기준 / 기존시설물(상수도) 내진성능 평가요령'],
              ['평가방법', '내진성능 우선순위 평가 (취약도지수 VI 산정 방법, 부록 A)'],
              ['지진구역', `구역 ${inp.zone}  (지진구역계수 Z = ${Z})`],
              ['내진등급', gradeInfo.label],
              ['권역', inp.isUrban ? '도시권역' : '기타지역'],
              ['지반종류', inp.soilType],
            ] as [string, string][]).map(([k, v], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={{ ...TD, width: 180, fontWeight: 700 }}>{k}</td>
                <td style={TD}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── 2. 관로 제원 ── */}
        <div style={RH}>2. 관로 제원</div>
        <table style={TABLE}>
          <tbody>
            {([
              ['관종', KIND_INDEX[inp.pipeKind as keyof typeof KIND_INDEX]?.label ?? inp.pipeKind],
              ['공칭관경 DN', `${inp.DN} mm`],
              ['관두께 t', `${inp.thickness} mm`],
            ] as [string, string][]).map(([k, v], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={{ ...TD, width: 180, fontWeight: 700 }}>{k}</td>
                <td style={TD}>{v}</td>
              </tr>
            ))}
            <tr style={{ background: T.bgRowAlt }}>
              <td style={{ ...TD, width: 180, fontWeight: 700 }}>D/t 비율 및 유연도지수</td>
              <td style={TD}>
                D/t = {r.ratio.toFixed(1)}&nbsp;→&nbsp;
                FLEX = <strong>{r.FLEX.toFixed(0)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 3. 유연도지수 산정 ── */}
        <div style={RH}>3. 유연도지수 (FLEX) 산정</div>
        <FormulaBlock>
          <FormulaRow>
            FLEX = f&nbsp;(D/t) &nbsp;—&nbsp; 관경두께비에 의한 단계별 지수값 적용
          </FormulaRow>
          <FormulaRow>
            D/t = {inp.DN} / {inp.thickness} = {r.ratio.toFixed(1)}&nbsp;→&nbsp;
            <strong>FLEX = {r.FLEX.toFixed(0)}</strong>
          </FormulaRow>
        </FormulaBlock>

        {/* ── 4. 취약도지수 (VI) 산정 ── */}
        <div style={RH}>4. 취약도지수 (VI) 산정</div>
        <FormulaBlock>
          <FormulaRow>
            VI = FLEX {G.times} (KIND + EARTH + SIZE + CONNECT + FACIL + MCONE)
          </FormulaRow>
          <FormulaRow>
            &nbsp;= {r.FLEX.toFixed(0)} {G.times} ({r.KIND.toFixed(1)} + {r.EARTH.toFixed(1)} + {r.SIZE.toFixed(1)} + {r.CONNECT.toFixed(1)} + {r.FACIL.toFixed(1)} + {r.MCONE.toFixed(1)})
          </FormulaRow>
          <FormulaRow>
            &nbsp;= {r.FLEX.toFixed(0)} {G.times} {r.VI_sub.toFixed(1)} = <strong>{r.VI.toFixed(1)}</strong>
          </FormulaRow>
        </FormulaBlock>

        <table style={TABLE}>
          <thead>
            <tr style={{ background: '#1a3a5c' }}>
              <th style={TH}>지수 항목</th>
              <th style={TH}>산정 기준</th>
              <th style={{ ...TH, textAlign: 'right', width: 70 }}>지수값</th>
            </tr>
          </thead>
          <tbody>
            {([
              ['FLEX — 유연도지수', `D/t = ${r.ratio.toFixed(1)} → FLEX = ${r.FLEX.toFixed(0)}`, r.FLEX],
              ['KIND — 관종 지수', KIND_INDEX[inp.pipeKind as keyof typeof KIND_INDEX]?.label ?? '', r.KIND],
              ['EARTH — 지반상태 지수', (EARTH_INDEX as any)[inp.soilType]?.label ?? '', r.EARTH],
              ['SIZE — 관경 지수', SIZE_INDEX[sizeKey as keyof typeof SIZE_INDEX]?.label ?? '', r.SIZE],
              ['CONNECT — 이음부 상태', CONNECT_INDEX[inp.connectCond as keyof typeof CONNECT_INDEX]?.label ?? '', r.CONNECT],
              ['FACIL — 주요시설물', FACIL_INDEX[inp.facilExists as keyof typeof FACIL_INDEX]?.label ?? '', r.FACIL],
              ['MCONE — 이음처리방법', MCONE_INDEX[inp.mcone as keyof typeof MCONE_INDEX]?.label ?? '', r.MCONE],
            ] as [string, string, number][]).map(([label, desc, val], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={TD}>
                  <strong>{label.split('—')[0]}</strong>—{label.split('—')[1]}
                </td>
                <td style={{ ...TD, color: T.textMuted, fontSize: 10 }}>{desc}</td>
                <td style={{ ...TD, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700 }}>{val.toFixed(1)}</td>
              </tr>
            ))}
            <tr style={{ background: '#eef2f8', fontWeight: 700 }}>
              <td style={TD} colSpan={2}>세부지수 합계 (KIND + EARTH + SIZE + CONNECT + FACIL + MCONE)</td>
              <td style={{ ...TD, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700 }}>{r.VI_sub.toFixed(1)}</td>
            </tr>
            <tr style={{ background: T.bgActive }}>
              <td style={{ ...TD, color: 'white', fontWeight: 700 }} colSpan={2}>
                VI = {r.FLEX.toFixed(0)} {G.times} {r.VI_sub.toFixed(1)}
              </td>
              <td style={{ ...TD, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: 'white', fontSize: 14 }}>
                {r.VI.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 5. 내진성능 그룹 판정 ── */}
        <div style={RH} className="page-break-before">5. 내진성능 그룹 판정</div>
        <table style={TABLE}>
          <tbody>
            {([
              ['지진도 그룹', `${r.seismicityGroup}그룹  (${r.seismicityGroup === 1 ? '중점고려지역' : '관찰대상지역'})`],
              ['취약도지수 VI', `${r.VI.toFixed(1)}  (${r.VI >= 40 ? 'VI ≥ 40' : 'VI < 40'})`],
              ['최종 판정', r.isCritical ? '내진성능 중요상수도  →  상세평가 필요' : '내진성능 유보상수도  →  관찰 대상'],
            ] as [string, string][]).map(([k, v], i) => (
              <tr key={i} style={{ background: i === 2 ? (r.isCritical ? '#fff0f0' : '#f0faf4') : (i % 2 === 0 ? T.bgRowAlt : T.bgRow) }}>
                <td style={{ ...TD, width: 180, fontWeight: 700 }}>{k}</td>
                <td style={{ ...TD, fontWeight: i === 2 ? 700 : 400, color: i === 2 ? (r.isCritical ? '#c0392b' : '#1a6b3a') : T.textPrimary }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── 6. 검토 의견 ── */}
        <div style={RH}>6. 검토 의견</div>
        <div style={{ fontSize: 11, color: T.textPrimary, lineHeight: 2.1, fontFamily: F, padding: '6px 0' }}>
          {r.isCritical
            ? `본 관로는 지진도 ${r.seismicityGroup}그룹에 위치하며 취약도지수 VI = ${r.VI.toFixed(1)} ≥ 40으로 내진성능 중요상수도에 해당한다. KDS 57 17 00에 의거하여 응답변위법에 의한 내진성능 상세평가를 실시하여야 한다.`
            : `본 관로는 지진도 ${r.seismicityGroup}그룹에 위치하며 취약도지수 VI = ${r.VI.toFixed(1)}으로 내진성능 유보상수도에 해당한다. 현 단계에서는 상세평가 없이 관찰 대상으로 분류하며, 향후 정밀 안전점검 시 재검토할 수 있다.`}
        </div>

        {/* 각주 */}
        <div style={{ marginTop: 28, borderTop: `1px solid ${T.borderLight}`, paddingTop: 8, fontSize: 9.5, color: T.textMuted, fontFamily: F, lineHeight: 1.9 }}>
          ※ 적용기준: 기존시설물(상수도) 내진성능 평가요령 부록 A — 내진성능 우선순위 평가<br/>
          ※ 취약도지수 산정: 해설표 3.4.2 (FLEX {G.times} 세부지수 합)<br/>
          ※ 그룹 판정: 해설표 3.4.1 (지진도 그룹) {G.times} VI 기준
        </div>
      </div>
    </div>
  )
}

const TABLE: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 10.5, marginBottom: 6 }
const TH: React.CSSProperties = { padding: '4px 8px', fontSize: 10.5, fontWeight: 700, color: 'white', borderBottom: '1px solid #bbb', textAlign: 'left' }
const TD: React.CSSProperties = { padding: '4px 8px', borderBottom: '1px solid #ddd', verticalAlign: 'middle', fontSize: 10.5 }
const RH: React.CSSProperties = {
  background: '#eef2f8', padding: '4px 10px', fontWeight: 700, fontSize: 11.5,
  color: '#1a3a5c', borderLeft: '3px solid #1a3a5c', margin: '14px 0 6px',
}
