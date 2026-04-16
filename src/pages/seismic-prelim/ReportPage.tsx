import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import {
  KIND_INDEX, EARTH_INDEX, SIZE_INDEX,
  CONNECT_INDEX, FACIL_INDEX, MCONE_INDEX,
  SEISMIC_ZONE, SEISMIC_GRADE, getSizeIndex,
} from '../../engine/seismicConstants.js'
import { T } from '../../components/eng/tokens'

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

  const Z = SEISMIC_ZONE[inp.zone as 'I'|'II'].Z
  const gradeInfo = SEISMIC_GRADE[inp.seismicGrade as 'I'|'II']
  const sizeKey = getSizeIndex(inp.DN)
  const today = new Date().toLocaleDateString('ko-KR')

  const rs = { fontFamily: T.fontSans, fontSize: 12, lineHeight: 2 }
  const rh: React.CSSProperties = { background: T.bgSection, padding: '4px 10px', fontWeight: 700, fontSize: 12, color: T.textAccent, borderLeft: `3px solid ${T.bgActive}`, margin: '16px 0 6px' }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>

      {/* 인쇄 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2, fontFamily: T.fontSans }}>
          인쇄 / PDF 저장
        </button>
        <button onClick={() => navigate('/seismic-prelim/result')}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.borderDark}`, borderRadius: 2, fontFamily: T.fontSans }}>
          결과 페이지로
        </button>
      </div>

      {/* 보고서 본문 */}
      <div style={{ background: 'white', border: `1px solid ${T.border}`, padding: '32px 40px' }} id="print-area">

        {/* 표지 */}
        <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: `2px solid ${T.bgActive}`, paddingBottom: 20 }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>KDS 57 17 00 : 2022 상수도 내진설계기준</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.bgActive, marginBottom: 4, fontFamily: T.fontSans }}>
            매설관로 내진성능 예비평가 검토서
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>작성일 : {today}</div>
        </div>

        {/* 1. 평가 개요 */}
        <div style={rh}>1. 평가 개요</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.fontSans }}>
          <tbody>
            {[
              ['적용기준', 'KDS 57 17 00 : 2022 상수도 내진설계기준 / 기존시설물(상수도) 내진성능 평가요령'],
              ['평가방법', '내진성능 우선순위 평가 (취약도지수 VI 산정 방법, 부록 A)'],
              ['지진구역', `구역 ${inp.zone}  (지진구역계수 Z = ${Z})`],
              ['내진등급', gradeInfo.label],
              ['권역',    inp.isUrban ? '도시권역' : '기타지역'],
              ['지반종류', `${inp.soilType}  — ${SEISMIC_ZONE[inp.zone as 'I'|'II'] ? '' : ''}${inp.soilType}`],
            ].map(([k, v], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={{ ...rpTd, width: 160, fontWeight: 700 }}>{k}</td>
                <td style={rpTd}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 2. 관로 제원 */}
        <div style={rh}>2. 관로 제원</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.fontSans }}>
          <tbody>
            {[
              ['관종',    KIND_INDEX[inp.pipeKind as keyof typeof KIND_INDEX]?.label ?? inp.pipeKind],
              ['공칭관경 DN', `${inp.DN} mm`],
              ['관두께 t', `${inp.thickness} mm`],
              ['D/t 비율', `${r.ratio.toFixed(1)}  →  유연도지수 FLEX = ${r.FLEX.toFixed(0)}`],
            ].map(([k, v], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={{ ...rpTd, width: 160, fontWeight: 700 }}>{k}</td>
                <td style={rpTd}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 3. 취약도지수 산정 */}
        <div style={rh}>3. 취약도지수 (VI) 산정</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, fontFamily: T.fontSans }}>
          VI = FLEX × (KIND + EARTH + SIZE + CONNECT + FACIL + MCONE)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.fontSans }}>
          <thead>
            <tr style={{ background: T.bgSection }}>
              <th style={rpTh}>지수 항목</th>
              <th style={rpTh}>산정 기준</th>
              <th style={{ ...rpTh, textAlign: 'right', width: 70 }}>지수값</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['FLEX — 유연도지수', `D/t = ${r.ratio.toFixed(1)} → FLEX = ${r.FLEX.toFixed(0)}`, r.FLEX],
              ['KIND — 관종 지수', KIND_INDEX[inp.pipeKind as keyof typeof KIND_INDEX]?.label ?? '', r.KIND],
              ['EARTH — 지반상태 지수', (EARTH_INDEX as any)[inp.soilType]?.label ?? '', r.EARTH],
              ['SIZE — 관경 지수', SIZE_INDEX[sizeKey as keyof typeof SIZE_INDEX]?.label ?? '', r.SIZE],
              ['CONNECT — 이음부 상태', CONNECT_INDEX[inp.connectCond as keyof typeof CONNECT_INDEX]?.label ?? '', r.CONNECT],
              ['FACIL — 주요시설물', FACIL_INDEX[inp.facilExists as keyof typeof FACIL_INDEX]?.label ?? '', r.FACIL],
              ['MCONE — 이음처리방법', MCONE_INDEX[inp.mcone as keyof typeof MCONE_INDEX]?.label ?? '', r.MCONE],
            ].map(([label, desc, val], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={rpTd}><strong>{(label as string).split('—')[0]}</strong>— {(label as string).split('—')[1]}</td>
                <td style={{ ...rpTd, color: T.textMuted, fontSize: 11 }}>{desc as string}</td>
                <td style={{ ...rpTd, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700 }}>{(val as number).toFixed(1)}</td>
              </tr>
            ))}
            <tr style={{ background: '#eef2f8', fontWeight: 700 }}>
              <td style={rpTd} colSpan={2}>세부지수 합계</td>
              <td style={{ ...rpTd, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700 }}>{r.VI_sub.toFixed(1)}</td>
            </tr>
            <tr style={{ background: T.bgActive }}>
              <td style={{ ...rpTd, color: 'white', fontWeight: 700 }} colSpan={2}>
                취약도지수  VI = {r.FLEX.toFixed(0)} × {r.VI_sub.toFixed(1)}
              </td>
              <td style={{ ...rpTd, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: 'white', fontSize: 15 }}>
                {r.VI.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. 판정 */}
        <div style={rh}>4. 내진성능 그룹 판정</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.fontSans }}>
          <tbody>
            {[
              ['지진도 그룹', `${r.seismicityGroup}그룹  (${r.seismicityGroup === 1 ? '중점고려지역' : '관찰대상지역'})`],
              ['취약도지수 VI', `${r.VI.toFixed(1)}  (${r.VI >= 40 ? 'VI ≥ 40' : 'VI < 40'})`],
              ['최종 판정', r.isCritical ? '내진성능 중요상수도  →  상세평가 필요' : '내진성능 유보상수도  →  관찰 대상'],
            ].map(([k, v], i) => (
              <tr key={i} style={{ background: i === 2 ? (r.isCritical ? '#fff0f0' : '#f0faf4') : (i % 2 === 0 ? T.bgRowAlt : T.bgRow) }}>
                <td style={{ ...rpTd, width: 160, fontWeight: 700 }}>{k}</td>
                <td style={{ ...rpTd, fontWeight: i === 2 ? 700 : 400, color: i === 2 ? (r.isCritical ? '#c0392b' : '#1a6b3a') : T.textPrimary }}>{v as string}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 5. 검토 의견 */}
        <div style={rh}>5. 검토 의견</div>
        <div style={{ fontSize: 12, color: T.textPrimary, lineHeight: 2, fontFamily: T.fontSans, padding: '8px 0' }}>
          {r.isCritical
            ? `본 관로는 지진도 ${r.seismicityGroup}그룹에 위치하며 취약도지수 VI = ${r.VI.toFixed(1)} ≥ 40으로 내진성능 중요상수도에 해당한다. KDS 57 17 00에 의거하여 응답변위법에 의한 내진성능 상세평가를 실시하여야 한다.`
            : `본 관로는 지진도 ${r.seismicityGroup}그룹에 위치하며 취약도지수 VI = ${r.VI.toFixed(1)}으로 내진성능 유보상수도에 해당한다. 현 단계에서는 상세평가 없이 관찰 대상으로 분류하며, 향후 정밀 안전점검 시 재검토할 수 있다.`}
        </div>

        {/* 적용기준 각주 */}
        <div style={{ marginTop: 32, borderTop: `1px solid ${T.borderLight}`, paddingTop: 10, fontSize: 10, color: T.textMuted, fontFamily: T.fontSans, lineHeight: 1.8 }}>
          ※ 적용기준: 기존시설물(상수도) 내진성능 평가요령 부록 A — 내진성능 우선순위 평가<br/>
          ※ 취약도지수 산정: 해설표 3.4.2 (FLEX × 세부지수 합)<br/>
          ※ 그룹 판정: 해설표 3.4.1 (지진도 그룹) × VI 기준
        </div>
      </div>
    </div>
  )
}

const rpTh: React.CSSProperties = { padding: '4px 8px', fontSize: 11, fontWeight: 700, color: T.textAccent, borderBottom: `1px solid ${T.border}`, textAlign: 'left' }
const rpTd: React.CSSProperties = { padding: '5px 8px', borderBottom: `1px solid ${T.borderLight}`, verticalAlign: 'middle', fontSize: 12 }
