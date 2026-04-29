import React from 'react'
import { T } from '../components/eng/tokens'
import { EngPanel, EngSection, EngSegment } from '../components/eng/EngLayout'
import FlowChartSVG from '../components/overview/FlowChartSVG'
import { steelFlow }   from '../components/overview/flows/steelFlow'
import { ductileFlow } from '../components/overview/flows/ductileFlow'
import { useStore } from '../store/useStore.js'

// ── 기준 테이블 공통 스타일 ──────────────────────────────────
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

// ── 강관 설계기준 ────────────────────────────────────────────
const steelCriteria = [
  { step: 'S1 — 토압 (Prism Load)',   kds: 'KDS 57 10 00 §3.3', ref: 'AWWA M11 §5.2',          limit: '하중 산정 (안전측 가정)' },
  { step: 'S1 — 차량하중 (DB-24)',     kds: 'KDS 24 12 20',      ref: 'Boussinesq 분산 / AASHTO', limit: 'IF 충격계수 적용' },
  { step: 'S2 — 내압 (Barlow)',        kds: 'KDS 57 10 00 §3.2', ref: 'AWWA M11 Eq.3-1',         limit: 'σ_a = 0.50·fy (상시),  0.75·fy (수격)' },
  { step: 'S3 — 링 휨응력',            kds: 'KDS 57 10 00 §3.4', ref: 'AWWA M11 §5.3 / DIPRA',   limit: 'σ_ba = 0.50·fy' },
  { step: 'S4 — 처짐 (수정 Iowa)',     kds: 'KDS 57 10 00 §3.5', ref: 'AWWA M11 Eq.5-4',         limit: '3.0% (라이닝 有),  5.0% (라이닝 無)' },
  { step: 'S5 — 좌굴 ⟨강관만⟩',       kds: 'KDS 57 10 00 §3.6', ref: 'AWWA M11 Eq.5-7',         limit: 'FS ≥ 2.5' },
  { step: 'S6 — 최소관두께',           kds: 'KDS 57 10 00 §3.3', ref: 'KS D 3565 / AWWA M11 Ch.4', limit: 't_채택 ≥ t_req + CA (부식여유)' },
  { step: '재료 — 강종별 fy',          kds: 'KS D 3565',         ref: '—',                        limit: 'SGP: 175,  SPS400: 235,  SPS490: 315 MPa' },
  { step: '침상계수 Kb / Kx',          kds: '—',                 ref: 'AWWA M11 Table 5-5',       limit: '침상각 60°/90°/120°/180°' },
  { step: '탄성지반반력계수 E\'',      kds: '—',                 ref: 'AWWA M11 Table 5-3',       limit: '토질 × 다짐도별 SI 환산' },
]

// ── 주철관 설계기준 ──────────────────────────────────────────
const ductileCriteria = [
  { step: 'S1 — 토압 (Prism Load)',   kds: 'KDS 57 10 00 §3.3', ref: 'DIPRA §3.2',     limit: '하중 산정 (Prism Load 가정)' },
  { step: 'S1 — 차량하중 (DB-24)',     kds: 'KDS 24 12 20',      ref: 'DB-24',          limit: 'IF 충격계수 적용' },
  { step: 'S2 — 내압 (Barlow, Di 기반)', kds: 'KDS 57 10 00 §3.2', ref: 'DIPRA §4',    limit: 'σ_a = fu/3 = 140 MPa (안전율 3.0)' },
  { step: 'S3 — 링 휨응력',            kds: 'KDS 57 10 00 §3.4', ref: 'DIPRA §5',       limit: 'σ_ba = 0.5·fu = 210 MPa' },
  { step: 'S4 — 처짐 (Iowa)',          kds: 'KDS 57 10 00 §3.5', ref: 'DIPRA §6',       limit: 'Δy/Do ≤ 3.0%' },
  { step: 'S5 — 최소두께',             kds: 'KDS 57 10 00 §3.3', ref: 'KS D 4311 K등급표 / DIPRA §7', limit: 't_class ≥ t_req + 서비스여유' },
  { step: '재료 — 인장강도',           kds: 'KS D 4311',         ref: 'ISO 2531',       limit: 'fu = 420 MPa 고정' },
  { step: '침상계수 Kb / Kd',          kds: '—',                 ref: 'DIPRA Table 5-1', limit: 'Type 1~5 침상 조건' },
  { step: '탄성지반반력계수 E\'',      kds: '—',                 ref: 'AWWA M11 Table 5-3', limit: '토질 × 다짐도별 SI 환산' },
]

// ── 입력/산출 매트릭스 (강관) ────────────────────────────────
const steelInputs = [
  { cat: '관 제원', params: 'DN, Do (mm), t (mm), 강종 (fy)', ref: 'KS D 3565' },
  { cat: '내압',   params: 'Pd (MPa), 수격계수 ksurge',       ref: 'KDS §3.2' },
  { cat: '하중',   params: 'H (m), 차량하중 유무 (DB-24)',     ref: 'KDS 24 12 20' },
  { cat: '지반',   params: 'γs (kN/m³), 토질분류, 다짐도',    ref: 'AWWA M11 §5.3' },
  { cat: '이음',   params: 'E\' (MPa), 침상각, 라이닝, GWL',  ref: 'AWWA M11 §5.3' },
]
const steelOutputs = [
  { item: 'We / WL', desc: '토피·차량 하중 (kN/m)' },
  { item: 'σ_hoop', desc: '후프응력 vs 0.50·fy' },
  { item: 'σ_b',    desc: '링 휨응력 vs 0.50·fy' },
  { item: 'Δy/Do',  desc: '처짐률 vs 3.0% / 5.0%' },
  { item: 'FS_buck', desc: '좌굴 안전율 vs 2.5' },
  { item: 't_req',   desc: '소요 최소두께 역산' },
  { item: '종합판정', desc: 'O.K. / N.G.' },
]

// ── 입력/산출 매트릭스 (주철관) ─────────────────────────────
const ductileInputs = [
  { cat: '관 제원', params: 'DN, Do (mm), K등급, fu=420 MPa',  ref: 'KS D 4311' },
  { cat: '내압',   params: 'Pd (MPa), ksurge',                ref: 'KDS §3.2' },
  { cat: '하중',   params: 'H (m), 차량하중 유무',              ref: 'KDS 24 12 20' },
  { cat: '지반',   params: 'γs, 토질, 다짐도, E\'',            ref: 'DIPRA Ch.3' },
  { cat: '이음',   params: '침상 Type 1~5, GWL',               ref: 'DIPRA Table 3-1' },
]
const ductileOutputs = [
  { item: 'We / WL', desc: '토피·차량 하중 (kN/m)' },
  { item: 'σ (Di기반)', desc: '후프응력 vs fu/3=140 MPa' },
  { item: 'σ_b',    desc: '링 휨응력 vs 0.5fu=210 MPa' },
  { item: 'Δy/Do',  desc: '처짐률 vs 3.0%' },
  { item: 't_req',  desc: '소요 최소두께 역산' },
  { item: '종합판정', desc: 'O.K. / N.G.' },
]

export default function StructuralOverviewPage() {
  const { inputs, setInputs } = useStore()
  const isSteel = inputs.pipeType !== 'ductile'
  const flow     = isSteel ? steelFlow   : ductileFlow
  const criteria = isSteel ? steelCriteria : ductileCriteria
  const inputRows  = isSteel ? steelInputs  : ductileInputs
  const outputRows = isSteel ? steelOutputs : ductileOutputs

  return (
    <div style={{ fontFamily: T.fontSans }}>

      {/* ── ① 검토 목적 및 적용 범위 ── */}
      <EngPanel title="① 검토 목적 및 적용 범위">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, color: T.textLabel }}>현재 관종:</span>
          <EngSegment
            options={[
              { key: 'steel',   label: '도복장강관',    sub: '6단계' },
              { key: 'ductile', label: '덕타일 주철관', sub: '5단계' },
            ]}
            value={inputs.pipeType}
            onChange={v => setInputs({ pipeType: v } as Parameters<typeof setInputs>[0])}
          />
        </div>

        {isSteel ? (
          <div style={{ fontSize: 11.5, lineHeight: 1.7, color: T.textLabel }}>
            <b>목적</b>: 매설 도복장강관(KS D 3565)의 내압·토압·차량하중에 대한 구조적 안전성을 KDS 57 10 00 : 2022 기준으로 검토하고 소요 관두께를 산정한다.<br />
            <b>적용 범위</b>: DN 80 ~ DN 3000 (PN 계열), 토피 0.3 ~ 10.0 m, DB-24 차량하중.<br />
            <b>검토 항목</b>: 내압 (후프응력) → 링 휨응력 → 처짐 → 외압 좌굴 → 최소관두께 역산.<br />
            <b>검토 제외</b>: 수격압 상세해석 (ksurge 계수로 간략 반영), 용접부 피로·수온변화·잔류응력, 횡방향 지반변형 (내진평가 모듈 별도).
          </div>
        ) : (
          <div style={{ fontSize: 11.5, lineHeight: 1.7, color: T.textLabel }}>
            <b>목적</b>: 매설 덕타일 주철관(KS D 4311)의 내압·토압·차량하중에 대한 구조적 안전성을 KDS 57 10 00 : 2022 / DIPRA 기준으로 검토한다.<br />
            <b>적용 범위</b>: DN 80 ~ DN 2600 (K-7 / K-9 / K-10 / K-12 등급), 토피 0.3 ~ 10.0 m.<br />
            <b>검토 항목</b>: 내압 (Barlow, Di 기반) → 링 휨응력 → 처짐 (Iowa 식) → 최소관두께 역산.<br />
            <b>검토 제외</b>: 외압 좌굴 (주철관은 지배하지 않음), 접합부 이탈력 (Tyton·기계식 별도 검토 필요).
          </div>
        )}
      </EngPanel>

      {/* ── ② 검토 흐름도 ── */}
      <EngPanel title="② 검토 흐름도 (Flow Chart)">
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

          {/* 산출물 */}
          <div>
            <EngSection title="산출물 (검토 결과)" />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>기호</th>
                  <th style={th}>설명 / 판정 기준</th>
                </tr>
              </thead>
              <tbody>
                {outputRows.map((r, i) => (
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
              <th style={{ ...th, width: '22%' }}>단계</th>
              <th style={{ ...th, width: '24%' }}>주 기준 (KDS)</th>
              <th style={{ ...th, width: '26%' }}>부 기준</th>
              <th style={{ ...th, width: '28%' }}>허용값 / 판정 기준</th>
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
          {isSteel ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><b>Prism Load 가정</b>: 흙 아치효과(silo effect) 미고려 — 안전측.</li>
              <li><b>차량하중</b>: Boussinesq 분산, 도로와 관 직각 매설 가정. 사각 매설 시 별도 보정 필요.</li>
              <li><b>E′ 균일 가정</b>: 측방 지지 등방성, 반경방향 E′ 일정 가정.</li>
              <li><b>부식여유(CA)</b>: 내·외면 라이닝 유무 무관 2.0 mm 일괄 적용.</li>
              <li><b>수격압</b>: ksurge 계수로 간략화. 정밀 수격해석(MOC) 시 별도 모듈 필요.</li>
              <li><b>온도·잔류응력</b>: 미포함 (취급·설치 하중만 반영).</li>
            </ul>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><b>Prism Load 가정</b>: 흙 아치효과 미고려 — 안전측.</li>
              <li><b>좌굴 검토 제외</b>: 덕타일 주철관은 고두께 비(t/Do)로 인해 외압 좌굴이 지배하지 않음.</li>
              <li><b>접합부 이탈</b>: Tyton·기계식 이음의 이탈 저항력 검토는 본 모듈 범위 외.</li>
              <li><b>인장강도 기준</b>: fu = 420 MPa 고정 (KS D 4311, ISO 2531).</li>
              <li><b>침상 조건</b>: DIPRA Type 1~5 분류 적용. 현장 변형 시 Type 재분류 필요.</li>
            </ul>
          )}
        </div>
      </EngPanel>
    </div>
  )
}
