import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import { SEISMIC_ZONE, SEISMIC_GRADE } from '../../engine/seismicConstants.js'
import { T } from '../../components/eng/tokens'

export default function SeismicDetailReportPage() {
  const navigate = useNavigate()
  const { detailInputs: inp, detailResult: r } = useSeismicStore()

  if (!r) {
    return (
      <div style={{ padding: 24, fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
        계산 결과가 없습니다.
        <button onClick={() => navigate('/seismic-detail/input')}
          style={{ marginLeft: 12, padding: '4px 12px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2 }}>
          입력 페이지로
        </button>
      </div>
    )
  }

  const isSegmented = inp.pipeType === 'segmented'
  const rs = r as any
  const Z = SEISMIC_ZONE[inp.zone as 'I'|'II'].Z
  const gradeInfo = SEISMIC_GRADE[inp.seismicGrade as 'I'|'II']
  const today = new Date().toLocaleDateString('ko-KR')

  const rh: React.CSSProperties = { background: T.bgSection, padding: '4px 10px', fontWeight: 700, fontSize: 12, color: T.textAccent, borderLeft: `3px solid ${T.bgActive}`, margin: '16px 0 6px', fontFamily: T.fontSans }

  const paramRows = (pairs: [string, string][]) => pairs.map(([k, v], i) => (
    <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
      <td style={{ ...rpTd, width: 180, fontWeight: 700 }}>{k}</td>
      <td style={rpTd}>{v}</td>
    </tr>
  ))

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <button onClick={() => window.print()} style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2, fontFamily: T.fontSans }}>
          인쇄 / PDF 저장
        </button>
        <button onClick={() => navigate('/seismic-detail/result')} style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.borderDark}`, borderRadius: 2, fontFamily: T.fontSans }}>
          결과 페이지로
        </button>
      </div>

      <div style={{ background: 'white', border: `1px solid ${T.border}`, padding: '32px 40px' }}>
        {/* 표지 */}
        <div style={{ textAlign: 'center', marginBottom: 28, borderBottom: `2px solid ${T.bgActive}`, paddingBottom: 18 }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>KDS 57 17 00 : 2022 / 기존시설물(상수도) 내진성능 평가요령 부록 C</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: T.bgActive, marginBottom: 4, fontFamily: T.fontSans }}>
            매설관로 내진성능 상세평가 검토서
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>
            {isSegmented ? '분절관 (덕타일 주철관)  —  응답변위법' : '연속관 (강관)  —  응답변위법'} &nbsp;|&nbsp; 작성일: {today}
          </div>
        </div>

        {/* 1. 개요 */}
        <div style={rh}>1. 평가 개요</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
          <tbody>
            {paramRows([
              ['적용기준', 'KDS 57 17 00 : 2022  /  기존시설물(상수도) 내진성능 평가요령 부록 C'],
              ['평가방법', '응답변위법 (Response Displacement Method)'],
              ['관종', isSegmented ? '분절관 (덕타일 주철관)' : '연속관 (강관)'],
              ['지진구역', `구역 ${inp.zone}  (Z = ${Z})`],
              ['내진등급', gradeInfo.label],
              ['지반종류', inp.soilType],
            ])}
          </tbody>
        </table>

        {/* 2. 입력 제원 */}
        <div style={rh}>2. 관로 제원 및 입력값</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
          <tbody>
            {paramRows([
              ['공칭관경 DN', `${inp.DN} mm`],
              ['관두께 t', `${inp.thickness} mm`],
              ['외경 D_out', `${inp.D_out} mm`],
              ['설계수압 P', `${inp.P} MPa`],
              ['토피 h', `${inp.hCover} m`],
              ...(isSegmented
                ? [['관 1본 길이 Lj', `${inp.Lj} m`], ['이음 종류', inp.isSeismicJoint ? '내진형' : '일반형']] as [string,string][]
                : [['온도변화 ΔT', `${inp.deltaT} °C`], ['부등침하량 δ', `${inp.D_settle} m`]] as [string,string][]),
            ])}
          </tbody>
        </table>

        {/* 3. 지반 해석 결과 */}
        <div style={rh}>3. 지반 해석 결과 (응답변위법)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
          <tbody>
            {paramRows([
              ['설계지반가속도 S', `${rs.S?.toFixed(3)} g  (Z×I)`],
              ['증폭계수 Fa / Fv', `${rs.Fa?.toFixed(2)} / ${rs.Fv?.toFixed(2)}`],
              ['설계스펙트럼 SDS / SD1', `${rs.SDS?.toFixed(3)} g / ${rs.SD1?.toFixed(3)} g`],
              ['지반 고유주기 TG', `${rs.TG?.toFixed(3)} s`],
              ['설계 고유주기 Ts', `${rs.Ts?.toFixed(3)} s`],
              ['등가 전단파속도 Vds', `${rs.Vds?.toFixed(1)} m/s`],
              ['속도응답스펙트럼 Sv', `${rs.Sv?.toFixed(4)} m/s`],
              ['지반수평변위 Uh', `${rs.Uh?.toFixed(4)} m`],
              ['지진파장 L', `${rs.L?.toFixed(2)} m`],
            ])}
          </tbody>
        </table>

        {/* 4. 검토 결과 */}
        <div style={rh}>4. 내진성능 검토 결과</div>
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
            {isSegmented ? [
              ['관체 축응력 σ_total', `${rs.sigma_total?.toFixed(2)} MPa`, `${rs.sigma_allow} MPa`, rs.stressOK],
              ['이음부 신축량 |u_J|', `${(rs.u_J * 1000)?.toFixed(1)} mm`, `${(rs.u_allow * 1000)?.toFixed(0)} mm`, rs.dispOK],
              ['이음부 굽힘각 θ_J', `${(rs.theta_J * 180 / Math.PI)?.toFixed(3)} °`, `${(rs.theta_allow * 180 / Math.PI)?.toFixed(1)} °`, rs.angleOK],
            ] : [
              ['합산 축변형률 ε_total', rs.epsilon_total?.toExponential(3), rs.epsilon_allow?.toExponential(3), rs.strainOK],
              ['Von Mises 응력 σ_vm', `${rs.sigma_vm?.toFixed(2)} MPa`, `${rs.sigma_allow?.toFixed(1)} MPa`, rs.stressOK],
            ].map(([label, val, lim, ok]: any[], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={rpTd}>{label}</td>
                <td style={{ ...rpTd, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700 }}>{val}</td>
                <td style={{ ...rpTd, textAlign: 'right', fontFamily: T.fontMono, color: T.textMuted }}>{lim}</td>
                <td style={{ ...rpTd, textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', background: ok ? T.bgOK : T.bgNG, color: ok ? T.textOK : T.textNG, border: `1px solid ${ok ? '#a3d9b5' : '#f5b3b3'}`, borderRadius: 2 }}>
                    {ok ? 'O.K.' : 'N.G.'}
                  </span>
                </td>
              </tr>
            ))}
            <tr style={{ background: r.ok ? '#f0faf4' : '#fff0f0', borderTop: `2px solid ${r.ok ? '#a3d9b5' : '#f5b3b3'}` }}>
              <td style={{ ...rpTd, fontWeight: 700 }} colSpan={3}>종합 판정</td>
              <td style={{ ...rpTd, textAlign: 'center', fontWeight: 700, color: r.ok ? T.textOK : T.textNG }}>
                {r.ok ? 'O.K.' : 'N.G.'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 5. 검토 의견 */}
        <div style={rh}>5. 검토 의견</div>
        <div style={{ fontSize: 12, lineHeight: 2, fontFamily: T.fontSans, padding: '8px 0' }}>
          {r.ok
            ? `본 관로는 응답변위법에 의한 내진성능 상세평가 결과 모든 검토항목에서 허용기준을 만족한다. 현재 상태에서 내진성능이 확보된 것으로 판단한다.`
            : `본 관로는 응답변위법에 의한 내진성능 상세평가 결과 일부 검토항목에서 허용기준을 초과한다. 내진 보강공법(이음부 교체, 관로 앵커, 플렉시블 조인트 설치 등)을 검토하여야 한다.`}
        </div>

        <div style={{ marginTop: 28, borderTop: `1px solid ${T.borderLight}`, paddingTop: 10, fontSize: 10, color: T.textMuted, fontFamily: T.fontSans, lineHeight: 1.8 }}>
          ※ 적용기준: 기존시설물(상수도) 내진성능 평가요령 부록 C — 매설관로 내진성능 본평가 (응답변위법)<br/>
          ※ KDS 57 17 00 : 2022 상수도 내진설계기준  /  KDS 17 10 00 : 2022 내진설계 일반기준
        </div>
      </div>
    </div>
  )
}

const rpTh: React.CSSProperties = { padding: '4px 8px', fontSize: 11, fontWeight: 700, color: T.textAccent, borderBottom: `1px solid ${T.border}`, textAlign: 'left' }
const rpTd: React.CSSProperties = { padding: '5px 8px', borderBottom: `1px solid ${T.borderLight}`, verticalAlign: 'middle', fontSize: 12 }
