import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import {
  EngPanel, EngDivider, EngTable, EngParamGrid, EngStatusBar,
} from '../../components/eng/EngLayout'
import { T } from '../../components/eng/tokens'
import { ResponseSpectrumSVG } from '../../components/eng/diagrams/ResponseSpectrumSVG'
import { JointDisplacementSVG } from '../../components/eng/diagrams/BuriedPipeResponseSVG'

export default function SeismicDetailResultPage() {
  const navigate = useNavigate()
  const { detailInputs: inp, detailResult: r } = useSeismicStore()

  if (!r) {
    return (
      <div style={{ padding: 24, fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
        입력 탭에서 계산을 먼저 실행하십시오.
        <button onClick={() => navigate('/seismic-detail/input')}
          style={{ marginLeft: 12, padding: '4px 12px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2 }}>
          입력 페이지로
        </button>
      </div>
    )
  }

  const isSegmented = inp.pipeType === 'segmented'
  const rs = r as any

  // 지반 해석 파라미터
  const groundParams = [
    { label: '설계지반가속도 S',   value: rs.S,    unit: 'g' },
    { label: '증폭계수 Fa',        value: rs.Fa,   unit: '' },
    { label: '증폭계수 Fv',        value: rs.Fv,   unit: '' },
    { label: 'SDS',               value: rs.SDS,  unit: 'g' },
    { label: 'SD1',               value: rs.SD1,  unit: 'g' },
    { label: 'TG (지반고유주기)', value: rs.TG,   unit: 's' },
    { label: 'Ts (설계고유주기)', value: rs.Ts,   unit: 's' },
    { label: 'Vds (등가전단파속도)', value: rs.Vds, unit: 'm/s' },
    { label: 'Sv (속도응답스펙트럼)', value: rs.Sv, unit: 'm/s' },
    { label: 'Uh (지반수평변위)', value: rs.Uh,   unit: 'm' },
    { label: 'L (지진파장)',       value: rs.L,    unit: 'm' },
    { label: '보정계수 ε',         value: rs.eps,  unit: '' },
  ]

  // 분절관 검토 행
  const segRows = isSegmented ? [
    { label: '내압 축응력 σ_i', formula: 'ν·P(D−t)/(2t)', value: rs.sigma_i, unit: 'MPa' },
    { label: '차량 축응력 σ_o', formula: '분절관: 이음부 흡수 = 0', value: rs.sigma_o, unit: 'MPa' },
    { label: '지진 축응력 σ_x', formula: 'E·ε_L = E·(4Uh/L)', value: rs.sigma_x, unit: 'MPa' },
    { label: '조합 축응력 σ_total', formula: 'σ_i + σ_o + σ_x', value: rs.sigma_total, unit: 'MPa', limit: rs.sigma_allow, ok: rs.stressOK },
  ] : []

  const segJointRows = isSegmented ? [
    { label: '이음부 신축량 |u_J|', formula: 'Uh·sin(π·Lj/L)', value: rs.u_J * 1000, unit: 'mm', limit: rs.u_allow * 1000, ok: rs.dispOK },
    { label: '이음부 굽힘각 θ_J', formula: '(π·Uh/L)·sin(π·Lj/L)', value: rs.theta_J * 180 / Math.PI, unit: '°', limit: rs.theta_allow * 180 / Math.PI, ok: rs.angleOK },
  ] : []

  // 연속관 검토 행
  const contStrainRows = !isSegmented ? [
    { label: '내압 축변형률 ε_i',  formula: '−ν·σ_θ/E', value: rs.epsilon_i, unit: '' },
    { label: '차량 축변형률 ε_o',  formula: '= 0 (도로매설 축방향)', value: rs.epsilon_o, unit: '' },
    { label: '온도 축변형률 ε_t',  formula: 'α_T·ΔT', value: rs.epsilon_t, unit: '' },
    { label: '부등침하 변형률 ε_d', formula: 'δ/(2·L_settle)', value: rs.epsilon_d, unit: '' },
    { label: '지진 변형률 ε_eq(축방향)', formula: '4Uh/L', value: rs.epsilon_eq_L, unit: '' },
    { label: '지진 변형률 ε_eq(굽힘)',  formula: 'π²·D/(2L²)·Uh', value: rs.epsilon_eq_B, unit: '' },
    { label: '합산 변형률 ε_total', formula: '|ε_i|+|ε_o|+|ε_t|+|ε_d|+|ε_eq|', value: rs.epsilon_total, unit: '', limit: rs.epsilon_allow, ok: rs.strainOK },
  ] : []

  const contStressRows = !isSegmented ? [
    { label: '후프응력 σ_θ', formula: 'P(D−t)/(2t)', value: rs.sigma_theta, unit: 'MPa' },
    { label: '축방향 합성응력 σ_x', formula: 'ν·σ_θ + E·(ε_t+ε_d+ε_eq)', value: rs.sigma_x_total, unit: 'MPa' },
    { label: 'Von Mises 등가응력 σ_vm', formula: '√(σ_θ²+σ_x²−σ_θ·σ_x)', value: rs.sigma_vm, unit: 'MPa', limit: rs.sigma_allow, ok: rs.stressOK },
  ] : []

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* ── 좌측: 결과 ───────────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>

        {/* 지반 해석 결과 */}
        <EngPanel title="지반 해석 결과 — 응답스펙트럼 / 지반변위 / 파장">
          <EngParamGrid params={groundParams}/>
        </EngPanel>

        {/* 분절관 결과 */}
        {isSegmented && (
          <>
            <EngPanel title="(a) 관체 축응력 검토  (분절관 — 덕타일 주철관)">
              <EngTable rows={segRows}/>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, fontFamily: T.fontSans }}>
                허용응력 = {rs.sigma_allow} MPa  (내진 시, 덕타일 주철관 σ_y/1.5 = 300/1.5)
              </div>
            </EngPanel>
            <EngPanel title="(b) 이음부 신축량 / 굽힘각도 검토  (분절관)">
              <EngTable rows={segJointRows}/>
            </EngPanel>
          </>
        )}

        {/* 연속관 결과 */}
        {!isSegmented && (
          <>
            <EngPanel title="(a) 축변형률 검토 — 국부좌굴 한계  (연속관 — 강관)">
              <EngTable rows={contStrainRows}/>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, fontFamily: T.fontSans }}>
                허용변형률 = 0.5·t/D = {rs.epsilon_allow?.toExponential(3)}  (AWWA M11 국부좌굴)
              </div>
            </EngPanel>
            <EngPanel title="(b) 조합응력 검토 — Von Mises  (연속관)">
              <EngTable rows={contStressRows}/>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, fontFamily: T.fontSans }}>
                항복강도 σ_y = {rs.sigma_y} MPa  |  허용응력 = {rs.sigma_allow?.toFixed(1)} MPa  (내진등급 {inp.seismicGrade}등급)
              </div>
            </EngPanel>
          </>
        )}

        {/* 최종 판정 */}
        <EngStatusBar
          ok={r.ok}
          message={r.ok
            ? '내진성능 확보 — 모든 검토항목 O.K.'
            : '내진성능 부족 — 보강공법 검토 필요'}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => navigate('/seismic-detail/input')}
            style={{ flex: 1, padding: '6px 0', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.borderDark}`, borderRadius: 2, fontFamily: T.fontSans }}>
            ◀  입력 수정
          </button>
          <button onClick={() => navigate('/seismic-detail/report')}
            style={{ flex: 1, padding: '6px 0', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2, fontFamily: T.fontSans, fontWeight: 700 }}>
            보고서 작성  ▶
          </button>
        </div>
      </div>

      {/* ── 우측: 삽도 ───────────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>
        <EngPanel title="설계응답스펙트럼">
          <ResponseSpectrumSVG
            SDS={rs.SDS} SD1={rs.SD1}
            T0={rs.T0} TS={rs.TS_sp} Ts={rs.Ts}
            width={260} height={155}
          />
        </EngPanel>

        {isSegmented && (
          <EngPanel title="이음부 신축량 검토 개념도">
            <JointDisplacementSVG
              u_J_mm={rs.u_J * 1000}
              u_allow_mm={rs.u_allow * 1000}
              Lj={inp.Lj}
            />
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6, fontFamily: T.fontSans, lineHeight: 1.7 }}>
              이음부 상대변위 u_J = Uh·sin(π·Lj/L)<br/>
              허용 신축량 = 소켓 삽입량 × {inp.isSeismicJoint ? '80% (내진형)' : '50% (일반형)'}
            </div>
          </EngPanel>
        )}

        {!isSegmented && (
          <EngPanel title="축변형률 성분 구성">
            {/* 단순 막대표 */}
            <div style={{ fontSize: 11, fontFamily: T.fontSans, marginBottom: 6, color: T.textAccent, fontWeight: 700 }}>
              ε_total = {rs.epsilon_total?.toExponential(3)}  /  허용 {rs.epsilon_allow?.toExponential(3)}
            </div>
            {[
              { label: 'ε_i (내압)', val: Math.abs(rs.epsilon_i) },
              { label: 'ε_t (온도)', val: Math.abs(rs.epsilon_t) },
              { label: 'ε_d (침하)', val: Math.abs(rs.epsilon_d) },
              { label: 'ε_eq (지진)', val: Math.abs(rs.epsilon_eq) },
            ].map((it, i) => {
              const pct = rs.epsilon_allow > 0 ? Math.min(it.val / rs.epsilon_allow * 100, 120) : 0
              return (
                <div key={i} style={{ marginBottom: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textLabel, marginBottom: 2, fontFamily: T.fontSans }}>
                    <span>{it.label}</span>
                    <span style={{ fontFamily: T.fontMono }}>{it.val.toExponential(2)}</span>
                  </div>
                  <div style={{ height: 8, background: '#e0e0e0', borderRadius: 1 }}>
                    <div style={{ height: 8, width: `${pct}%`, background: T.bgActive, borderRadius: 1, opacity: 0.8 }}/>
                  </div>
                </div>
              )
            })}
            <div style={{ height: 1, background: T.borderDark, margin: '4px 0' }}/>
            <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontSans }}>
              허용값 = {rs.epsilon_allow?.toExponential(3)}  (국부좌굴 한계, AWWA M11)
            </div>
          </EngPanel>
        )}
      </div>
    </div>
  )
}
