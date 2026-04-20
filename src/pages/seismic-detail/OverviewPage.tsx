import React from 'react'
import { T } from '../../components/eng/tokens'
import { EngPanel, EngSection } from '../../components/eng/EngLayout'
import FlowChartSVG from '../../components/overview/FlowChartSVG'
import { seismicDetailFlow } from '../../components/overview/flows/seismicDetailFlow'
import { useSeismicStore } from '../../store/useSeismicStore.js'

const th: React.CSSProperties = {
  padding: '5px 8px', fontSize: 11, fontWeight: 700,
  color: T.textAccent, background: T.bgSection,
  border: `1px solid ${T.border}`, textAlign: 'left',
  fontFamily: T.fontSans,
}
const td: React.CSSProperties = {
  padding: '4px 8px', fontSize: 11,
  border: `1px solid ${T.borderLight}`,
  fontFamily: T.fontSans, verticalAlign: 'top',
}
const tdMono: React.CSSProperties = {
  ...td, fontFamily: T.fontMono, fontSize: 10.5, color: T.textNumber,
}

const criteria = [
  { step: '지반고유주기 Tg',          kds: 'KDS 17 10 00 §4',  ref: '평가요령 식(C.1)',    limit: 'Tg = 4·Σ(Hi/VSi)' },
  { step: '탄성응답스펙트럼 Sv',       kds: 'KDS 17 10 00 §6',  ref: '—',                   limit: 'SDS·SD1·Ts·Vds 산정' },
  { step: '지반변위 Uh / 파장 L',      kds: '평가요령 부록 C',  ref: '식(C.2~C.5)',         limit: 'L = Vds·Ts,  Uh = (2/π²)·Sv·Ts' },
  { step: '[연속관] 축변형률 ε_L',     kds: '해설 식(5.3.43)', ref: '—',                    limit: 'ε_L = 4Uh/L (P파 지배)' },
  { step: '[연속관] 굽힘변형률 ε_B',   kds: '해설 식(5.3.44)', ref: '—',                    limit: 'ε_B = π²·D·Uh / (2L²)' },
  { step: '[연속관] 추가 변형률',       kds: '§5.3',            ref: '—',                    limit: 'ε_i (내압) + ε_t (온도) + ε_d (침하)' },
  { step: '[연속관] 허용변형률',        kds: '평가요령 §C.4',   ref: '—',                    limit: 'Lv1: 1%,  Lv2: 3% (강관)' },
  { step: '[분절관] 이음부 신축량 u_J', kds: '해설 식(5.3.48)', ref: '—',                    limit: '|u_J| ≤ u_allow (제조사 기준)' },
  { step: '[분절관] 굽힘각 θ_J',       kds: '해설 식(5.3.49)', ref: '—',                    limit: 'θ_J ≤ θ_allow (내진형 3°)' },
  { step: '취약부 검토',               kds: '평가요령 §C.6',   ref: '—',                    limit: '밸브실·교차부·분기·경사지' },
  { step: '액상화 검토 (필요시)',       kds: 'KDS 17 10 00 §8', ref: '—',                    limit: 'PL ≥ 15 → 부력·침하 추가 검토' },
]

const inputRows = [
  { cat: '지반 조건',   params: '층별 두께 H, 전단파속도 Vs, 기반암 Vbs',     ref: 'KDS 17 10 00 §4' },
  { cat: '설계지진',   params: 'Z (지진구역), Fa/Fv, 내진등급 I',            ref: 'KDS 17 10 00 §5' },
  { cat: '관로 제원',  params: '관종 (연속/분절), DN, t, E, ν',              ref: 'KS D 3565/4311' },
  { cat: '이음부',     params: '이음형식, 이음길이 Lj, 허용 u_allow/θ_allow', ref: '요령 §C.2 / 제조사' },
  { cat: '추가 조건',  params: '온도변화 ΔT, 부등침하 δ/L_settle',           ref: '§5.3' },
]

const outputRows_cont = [
  { item: 'ε_L, ε_B',   desc: '축·굽힘 지진 변형률' },
  { item: 'ε_total',    desc: '합성변형률 (지진+내압+온도+침하)' },
  { item: 'ε_allow',    desc: '허용변형률 (항복/국부좌굴)' },
  { item: 'σ_vm',       desc: 'Von Mises 등가응력' },
  { item: '판정',       desc: 'O.K. / N.G.' },
]
const outputRows_seg = [
  { item: 'Uh, L',      desc: '지반변위, 지진파장' },
  { item: '|u_J|',      desc: '이음부 신축량 (mm)' },
  { item: 'θ_J',        desc: '이음부 굽힘각 (°)' },
  { item: 'u_allow / θ_allow', desc: '허용 신축량·각도' },
  { item: '판정',       desc: 'O.K. / N.G.' },
]

// 현재 관종에 따라 해당 분기 노드를 강조
function buildHighlightedFlow(pipeKind: string) {
  const highlighted = pipeKind === 'continuous'
    ? ['c1', 'c2', 'c3']
    : pipeKind === 'segmented'
    ? ['seg1', 'seg2', 'seg3']
    : []

  return {
    ...seismicDetailFlow,
    nodes: seismicDetailFlow.nodes.map(n =>
      highlighted.includes(n.id) ? { ...n, emphasis: 'info' as const } : n
    ),
  }
}

export default function SeismicDetailOverviewPage() {
  const { detailInputs } = useSeismicStore()
  const pipeKind = detailInputs?.pipeKind ?? ''
  const flow = buildHighlightedFlow(pipeKind)

  return (
    <div style={{ fontFamily: T.fontSans }}>

      {/* ── ① 검토 목적 및 적용 범위 ── */}
      <EngPanel title="① 검토 목적 및 적용 범위">
        <div style={{ fontSize: 11.5, lineHeight: 1.7, color: T.textLabel }}>
          <b>목적</b>: KDS 57 17 00 : 2022 및 「매설관로 내진성능평가 요령」 부록 C에 따른
          <b> 응답변위법</b>으로 매설관로의 지진 시 응력·변형을 계산하여 내진성능을 검토한다.<br />
          <b>해석 방법</b>: 표층 지반의 지진 응답(변위) 산정 → 관로에 강제 변위 재하 → 단면력 검토.<br />
          <b>적용 범위</b>:
          (1) <b>연속관</b> — 강관 용접이음 / 플랜지이음;
          (2) <b>분절관</b> — 덕타일 주철관 기계식이음 / 고무링 소켓이음.<br />
          <b>성능목표</b>: 붕괴방지 수준 (기능수행은 별도 보정 계수 적용).<br />
          <b>주의</b>: 본 모듈은 직선관 구간에 대한 표준 해석임. 곡관·관경 급변부·교량횡단은 별도 검토 필요.
        </div>
      </EngPanel>

      {/* ── ② 검토 흐름도 ── */}
      <EngPanel title="② 검토 흐름도 (Flow Chart)">
        {pipeKind && (
          <div style={{
            display: 'inline-block', padding: '3px 10px', marginBottom: 6,
            background: '#e8f0ff', border: '1px solid #3060c0',
            borderRadius: 3, fontSize: 10.5, color: '#1a3060', fontWeight: 600,
            fontFamily: T.fontMono,
          }}>
            현재 선택: {pipeKind === 'continuous' ? '연속관 (파란색 강조)' : '분절관 (파란색 강조)'}
          </div>
        )}
        <FlowChartSVG spec={flow} />
      </EngPanel>

      {/* ── ③ 입력·산출물 매트릭스 ── */}
      <EngPanel title="③ 입력 파라미터 / 산출물 매트릭스">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* 입력 */}
          <div>
            <EngSection title="입력 파라미터" />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>분류</th>
                  <th style={th}>파라미터</th>
                  <th style={th}>근거</th>
                </tr>
              </thead>
              <tbody>
                {inputRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                    <td style={{ ...td, fontWeight: 600 }}>{r.cat}</td>
                    <td style={tdMono}>{r.params}</td>
                    <td style={{ ...td, fontSize: 10, color: T.textMuted }}>{r.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 산출물 - 2가지 관종 */}
          <div>
            <EngSection title="산출물 — 연속관 (강관 용접이음)" />
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
              <thead>
                <tr>
                  <th style={th}>기호</th>
                  <th style={th}>설명</th>
                </tr>
              </thead>
              <tbody>
                {outputRows_cont.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                    <td style={tdMono}>{r.item}</td>
                    <td style={td}>{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <EngSection title="산출물 — 분절관 (기계식이음)" />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>기호</th>
                  <th style={th}>설명</th>
                </tr>
              </thead>
              <tbody>
                {outputRows_seg.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                    <td style={tdMono}>{r.item}</td>
                    <td style={td}>{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </EngPanel>

      {/* ── ④ 적용 설계기준 ── */}
      <EngPanel title="④ 적용 설계기준 (단계별)">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '24%' }}>단계</th>
              <th style={{ ...th, width: '22%' }}>주 기준</th>
              <th style={{ ...th, width: '20%' }}>수식 근거</th>
              <th style={{ ...th, width: '34%' }}>허용값 / 판정 기준</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
                <td style={{ ...td, fontWeight: 600 }}>{r.step}</td>
                <td style={tdMono}>{r.kds}</td>
                <td style={{ ...td, fontSize: 10, color: T.textMuted }}>{r.ref}</td>
                <td style={{ ...td, color: T.textAccent }}>{r.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </EngPanel>

      {/* ── ⑤ 검토 한계 및 가정 ── */}
      <EngPanel title="⑤ 검토 한계 및 가정 사항">
        <div style={{ fontSize: 11, lineHeight: 1.85, color: T.textLabel }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li><b>1D 선형 해석</b>: 관축 방향 응답만 고려. 횡방향 지반 반력 및 관-지반 비선형 상호작용 미포함.</li>
            <li><b>지반 등가선형화</b>: 지반 비선형성은 등가 전단파속도(Vds)로 간략화.</li>
            <li><b>온도·잔류응력</b>: ΔT 및 δ_settle 입력 필요. 미입력 시 지진 성분만 검토됨.</li>
            <li><b>이음부 허용값</b>: 제조사 사양서 기준. 미확인 시 KP 메카니컬 ±10 mm / 3° 적용.</li>
            <li><b>액상화</b>: PL ≥ 15인 경우 별도 부력·수평변위 검토 필요 (본 모듈 미포함).</li>
            <li><b>성능수준</b>: 붕괴방지 기준. 기능수행(즉시복구) 성능은 보정 계수 별도 적용.</li>
          </ul>
        </div>
      </EngPanel>
    </div>
  )
}
