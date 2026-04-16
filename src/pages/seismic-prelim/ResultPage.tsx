import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import {
  KIND_INDEX, EARTH_INDEX, SIZE_INDEX,
  CONNECT_INDEX, FACIL_INDEX, MCONE_INDEX,
  SEISMIC_ZONE, SEISMIC_GRADE, getSizeIndex,
} from '../../engine/seismicConstants.js'
import {
  EngPanel, EngSection, EngDivider, EngTable, EngParamGrid, EngStatusBar,
} from '../../components/eng/EngLayout'
import { T } from '../../components/eng/tokens'

export default function SeismicPrelimResultPage() {
  const navigate = useNavigate()
  const { prelimInputs: inp, prelimResult: r } = useSeismicStore()

  if (!r) {
    return (
      <div style={{ padding: 24, fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
        입력 탭에서 계산을 먼저 실행하십시오.
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

  // 세부지수 테이블 행
  const indexRows = [
    { label: 'FLEX — 유연도지수', formula: `D/t = ${r.ratio.toFixed(1)}`, value: r.FLEX, unit: '', ok: undefined },
    { label: 'KIND — 관종 지수',   formula: KIND_INDEX[inp.pipeKind as keyof typeof KIND_INDEX]?.label ?? '', value: r.KIND, unit: '' },
    { label: 'EARTH — 지반상태',   formula: (EARTH_INDEX as any)[inp.soilType]?.label ?? '', value: r.EARTH, unit: '' },
    { label: 'SIZE — 관경 지수',   formula: SIZE_INDEX[sizeKey as keyof typeof SIZE_INDEX]?.label ?? '', value: r.SIZE, unit: '' },
    { label: 'CONNECT — 이음부 상태', formula: CONNECT_INDEX[inp.connectCond as keyof typeof CONNECT_INDEX]?.label ?? '', value: r.CONNECT, unit: '' },
    { label: 'FACIL — 주요시설물', formula: FACIL_INDEX[inp.facilExists as keyof typeof FACIL_INDEX]?.label ?? '', value: r.FACIL, unit: '' },
    { label: 'MCONE — 이음처리방법', formula: MCONE_INDEX[inp.mcone as keyof typeof MCONE_INDEX]?.label ?? '', value: r.MCONE, unit: '' },
  ]

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* ── 좌측: 결과 패널 ───────────────────────────── */}
      <div style={{ flex: '0 0 520px' }}>

        {/* 입력 요약 */}
        <EngPanel title="입력 요약">
          <EngParamGrid params={[
            { label: '지진구역', value: `구역 ${inp.zone}  (Z = ${Z})` },
            { label: '내진등급', value: gradeInfo.label },
            { label: '권역',    value: inp.isUrban ? '도시권역' : '기타지역' },
            { label: '지반종류', value: inp.soilType },
            { label: '관종',    value: KIND_INDEX[inp.pipeKind as keyof typeof KIND_INDEX]?.label ?? inp.pipeKind },
            { label: 'DN',      value: inp.DN, unit: 'mm' },
            { label: '관두께 t', value: inp.thickness, unit: 'mm' },
          ]}/>
        </EngPanel>

        {/* 취약도지수 */}
        <EngPanel title="취약도지수 (VI) 산정  —  VI = FLEX × (KIND + EARTH + SIZE + CONNECT + FACIL + MCONE)">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.fontSans }}>
            <thead>
              <tr style={{ background: T.bgSection }}>
                <th style={th}>지수 항목</th>
                <th style={th}>세부 기준</th>
                <th style={{ ...th, textAlign: 'right', width: 60 }}>지수값</th>
              </tr>
            </thead>
            <tbody>
              {indexRows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                  <td style={td}><strong>{row.label.split('—')[0]}</strong>{row.label.includes('—') ? `— ${row.label.split('—')[1]}` : ''}</td>
                  <td style={{ ...td, fontSize: 10, color: T.textMuted }}>{row.formula}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: T.textNumber }}>
                    {(row.value as number).toFixed(1)}
                  </td>
                </tr>
              ))}
              {/* 소계 */}
              <tr style={{ background: '#eef2f8', borderTop: `1px solid ${T.border}` }}>
                <td style={td} colSpan={2}><strong>세부지수 합계  (KIND + EARTH + SIZE + CONNECT + FACIL + MCONE)</strong></td>
                <td style={{ ...td, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: T.textAccent }}>{r.VI_sub.toFixed(1)}</td>
              </tr>
              {/* VI */}
              <tr style={{ background: T.bgActive }}>
                <td style={{ ...td, color: 'white' }} colSpan={2}>
                  <strong>취약도지수  VI = {r.FLEX.toFixed(0)} × {r.VI_sub.toFixed(1)}</strong>
                </td>
                <td style={{ ...td, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: 'white', fontSize: 16 }}>
                  {r.VI.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </EngPanel>

        {/* 지진도 그룹 판정 */}
        <EngPanel title="지진도 그룹 판정  (해설표 3.4.1)">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.fontSans }}>
            <thead>
              <tr style={{ background: T.bgSection }}>
                <th style={th}>판정 항목</th>
                <th style={{ ...th, textAlign: 'right' }}>판정 결과</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: T.bgRowAlt }}>
                <td style={td}>지진구역 / 권역 / 지반종류</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontFamily: T.fontMono }}>
                  구역 {inp.zone} / {inp.isUrban ? '도시' : '기타'} / {inp.soilType}
                </td>
              </tr>
              <tr style={{ background: T.bgRow }}>
                <td style={td}>지진도 그룹</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: r.seismicityGroup === 1 ? '#c0392b' : T.textAccent, fontFamily: T.fontMono }}>
                  {r.seismicityGroup}그룹  ({r.seismicityGroup === 1 ? '중점고려지역' : '관찰대상지역'})
                </td>
              </tr>
              <tr style={{ background: T.bgRowAlt }}>
                <td style={td}>취약도지수 VI</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontFamily: T.fontMono, color: r.VI >= 40 ? '#c0392b' : T.textAccent }}>
                  {r.VI.toFixed(1)}  ({r.VI >= 40 ? 'VI ≥ 40' : 'VI < 40'})
                </td>
              </tr>
              <tr style={{ background: r.isCritical ? '#fff0f0' : '#f0faf4', borderTop: `2px solid ${r.isCritical ? '#f5b3b3' : '#a3d9b5'}` }}>
                <td style={{ ...td, fontWeight: 700 }}>최종 판정</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontSize: 13, color: r.isCritical ? '#c0392b' : '#1a6b3a' }}>
                  {r.isCritical ? '내진성능 중요상수도  →  상세평가 필요' : '내진성능 유보상수도  →  관찰 대상'}
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted, fontFamily: T.fontSans, lineHeight: 1.7 }}>
            판정기준: 지진도 1그룹  AND  VI ≥ 40  →  내진성능 중요상수도  (상세평가 대상)<br/>
            근거: 기존시설물(상수도) 내진성능 평가요령 부록 A  /  해설표 3.4.1
          </div>
        </EngPanel>

        {/* 최종 상태 바 */}
        <EngStatusBar
          ok={!r.isCritical}
          message={r.isCritical
            ? `VI = ${r.VI.toFixed(1)} ≥ 40,  지진도 ${r.seismicityGroup}그룹  →  내진성능 상세평가를 실시하십시오.`
            : `VI = ${r.VI.toFixed(1)},  지진도 ${r.seismicityGroup}그룹  →  관찰 대상 (상세평가 불필요)`}
        />

        {/* 보고서 이동 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => navigate('/seismic-prelim/input')}
            style={{ flex: 1, padding: '6px 0', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.borderDark}`, borderRadius: 2, fontFamily: T.fontSans }}>
            ◀  입력 수정
          </button>
          <button onClick={() => navigate('/seismic-prelim/report')}
            style={{ flex: 1, padding: '6px 0', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2, fontFamily: T.fontSans, fontWeight: 700 }}>
            보고서 작성  ▶
          </button>
        </div>
      </div>

      {/* ── 우측: 판정 기준 참고표 ────────────────────── */}
      <div style={{ flex: 1 }}>
        <EngPanel title="판정 흐름  (평가요령 해설표 3.4.1)">
          {/* 판정 기준표 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontSans }}>
            <thead>
              <tr style={{ background: T.bgSection }}>
                <th style={th}>지진구역</th>
                <th style={th}>권역</th>
                <th style={th}>지반종류</th>
                <th style={{ ...th, textAlign: 'center' }}>그룹</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['구역 Ⅰ', '전체', '전체', '1그룹'],
                ['구역 Ⅱ', '도시권역', 'S5, S6', '1그룹'],
                ['구역 Ⅱ', '도시권역', 'S1~S4', '2그룹'],
                ['구역 Ⅱ', '기타지역', '전체', '2그룹'],
              ].map((row, i) => {
                const isMatch =
                  (i === 0 && inp.zone === 'I') ||
                  (i === 1 && inp.zone === 'II' && inp.isUrban && ['S5','S6'].includes(inp.soilType)) ||
                  (i === 2 && inp.zone === 'II' && inp.isUrban && !['S5','S6'].includes(inp.soilType)) ||
                  (i === 3 && inp.zone === 'II' && !inp.isUrban)
                return (
                  <tr key={i} style={{ background: isMatch ? '#dce8f5' : (i % 2 === 0 ? T.bgRowAlt : T.bgRow) }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ ...td, fontWeight: isMatch ? 700 : 400, color: isMatch && j === 3 ? T.bgActive : T.textPrimary }}>{cell}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>

          <EngDivider label="상세평가 필요 여부 기준"/>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontSans }}>
            <thead>
              <tr style={{ background: T.bgSection }}>
                <th style={th}>지진도 그룹</th>
                <th style={th}>VI 기준</th>
                <th style={{ ...th, textAlign: 'center' }}>판정</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['1그룹', 'VI ≥ 40', '내진성능 중요상수도 (상세평가 필요)'],
                ['1그룹', 'VI < 40', '내진성능 유보상수도'],
                ['2그룹', '전체',    '내진성능 유보상수도'],
              ].map((row, i) => {
                const isMatch =
                  (i === 0 && r.seismicityGroup === 1 && r.VI >= 40) ||
                  (i === 1 && r.seismicityGroup === 1 && r.VI < 40) ||
                  (i === 2 && r.seismicityGroup === 2)
                return (
                  <tr key={i} style={{ background: isMatch ? (r.isCritical ? '#fff0f0' : '#f0faf4') : (i % 2 === 0 ? T.bgRowAlt : T.bgRow) }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ ...td, fontWeight: isMatch ? 700 : 400, color: isMatch && r.isCritical ? '#c0392b' : isMatch ? '#1a6b3a' : T.textPrimary }}>{cell}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </EngPanel>
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '4px 6px', fontSize: 11, fontWeight: 700, color: T.textAccent, borderBottom: `1px solid ${T.border}`, textAlign: 'left' }
const td: React.CSSProperties = { padding: '4px 6px', borderBottom: `1px solid ${T.borderLight}`, verticalAlign: 'middle', fontSize: 11 }
