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
  ...td, fontFamily: T.fontMono, fontSize: 11, color: T.textNumber,
}

// ── 강관 설계기준 ────────────────────────────────────────────
const steelCriteria = [
  { step: 'S1 — 상부 토압',            kds: '세부지침 11-134', ref: '연직토압 / Marston', limit: 'H≤2m: γt·H  |  H>2m: Cd·γt·B  (B = 2D+100 cm)' },
  { step: 'S1 — 노면하중',             kds: '세부지침 11-134', ref: 'Kögler 분산 (DB-24)', limit: '충격계수 i : H<1.5→0.5 / 1.5~6.5→0.65−0.10H / >6.5→0' },
  { step: 'S2 — 내압',                 kds: '세부지침 11-134', ref: 'σt = P·D/(2t), D=내경', limit: '상시 140 MPa  |  일시(수격) 210 MPa' },
  { step: 'S3 — 외압 휨응력',          kds: '세부지침 11-135', ref: "E′ 포함식 (E′=28 kg/cm²)", limit: 'σb ≤ 140 MPa  (STWW 400)' },
  { step: 'S4 — 관체 변형률',          kds: '세부지침 11-136', ref: 'ε = 2Kx·W·R⁴/(EI+0.061E′R³)', limit: '관경의 5% 미만 (라이닝 무관)' },
  { step: 'S5 — 좌굴하중',             kds: '세부지침 11-136', ref: "qa = (1/FS)·√(32RwB′E′EI/D³)", limit: 'W ≤ qa,  FS = 2.5 (H/D≥2) / 3.0 (H/D<2)' },
  { step: '관두께 적용',               kds: '세부지침 11-134', ref: '관 상세검사', limit: 'min(실측 최소 관두께, 기준 관두께)' },
  { step: '안전성평가',                kds: '세부지침 11-133', ref: '[표 11.74]', limit: 'SF = 허용응력/발생응력 → a~e 등급' },
  { step: '지지각 계수 Kb / Kx',       kds: '세부지침 11-135', ref: '지지각별 계수표', limit: '60° / 90° / 120° / 150° 만 사용 가능' },
  { step: "흙 반력계수 E′",            kds: '세부지침 11-135', ref: '지침 제시값', limit: "E′ = 28 kg/cm² (단일값)" },
]

// ── 주철관 설계기준 ──────────────────────────────────────────
const ductileCriteria = [
  { step: 'S1 — 상부 토압 Wf',         kds: '세부지침 11-134', ref: '강관의 계산공식과 동일', limit: 'H≤2m: γt·H  |  H>2m: Cd·γt·B' },
  { step: 'S1 — 노면하중 Wt',          kds: '세부지침 11-134', ref: '강관의 계산공식과 동일', limit: 'Kögler 분산 (DB-24)' },
  { step: 'S2 — 내압 인장응력',        kds: '세부지침 11-137', ref: 'σts = P·D/(2t), σtd = P′·D/(2t)', limit: 'D = 관 내경,  가압구간만 σtd 적용' },
  { step: 'S3 — 외압 휨응력',          kds: '세부지침 11-137', ref: 'σb = 6(Kf·Wf + Kt·Wt)R²/t²', limit: 'E′ 미포함 (강관식과 다름)' },
  { step: 'S4 — 조합응력 판정',        kds: '세부지침 11-137', ref: '복합 인장응력', limit: '2.5σts + 2.0σtd + 1.4σb < S (=420 MPa)' },
  { step: '관두께 적용',               kds: '세부지침 11-137', ref: '관 상세검사', limit: 'min(실측 최소 관두께, 기준 관두께)' },
  { step: '안전성평가',                kds: '세부지침 11-133', ref: '[표 11.74]', limit: 'SF = S/조합응력 → a~e 등급' },
  { step: '재료 — 인장강도',           kds: 'KS D 4311',       ref: 'GCD400', limit: 'S = 420 MPa 고정' },
  { step: '지지각 계수 Kf / Kt',       kds: '세부지침 11-137', ref: '관저 기준 계수표', limit: '40°/60°/90°(0.160)/120°/180°,  Kt = 0.011' },
]

// ── 입력/산출 매트릭스 (강관) ────────────────────────────────
const steelInputs = [
  { cat: '관 제원', params: 'DN, Do (mm), t (mm), 강종 (fy)', ref: 'KS D 3565' },
  { cat: '내압',   params: '정수압 P (MPa), 수격압 P′, 압력구간', ref: '세부지침 11-134 / 11-136' },
  { cat: '하중',   params: 'H (m), 차량하중 유무',              ref: '세부지침 11-134' },
  { cat: '지반',   params: 'γt (kg/cm³), E′ (kg/cm²)',         ref: '세부지침 11-134 / 11-135' },
  { cat: '기타',   params: '지지각, 실측 관두께, 단면손실 유무', ref: '세부지침 11-134 / 11-133' },
]
const steelOutputs = [
  { item: 'Wv / Wt', desc: '상부 토압·노면하중 (kg/cm²)' },
  { item: 'σ_t',    desc: '내압응력 vs 140 MPa (일시 210)' },
  { item: 'σ_b',    desc: '외압 휨응력 vs 140 MPa' },
  { item: 'ε',      desc: '관체 변형률 vs 5% (라이닝 무관)' },
  { item: 'q_a',    desc: '허용 좌굴하중 vs 작용 하중 W' },
  { item: 'SF / 등급', desc: '안전율 → a~e 등급 (표 11.74)' },
  { item: '종합판정', desc: 'O.K. / N.G.' },
]

// ── 입력/산출 매트릭스 (주철관) ─────────────────────────────
const ductileInputs = [
  { cat: '관 제원', params: 'DN, Do (mm), K등급, fu=420 MPa',  ref: 'KS D 4311' },
  { cat: '내압',   params: '정수압 P (MPa), 수격압 P′, 압력구간', ref: '세부지침 11-137' },
  { cat: '하중',   params: 'H (m), 차량하중 유무',              ref: '세부지침 11-134' },
  { cat: '지반',   params: 'γt (kg/cm³)',                      ref: '세부지침 11-134' },
  { cat: '기타',   params: '지지각(관저), 실측 관두께, 단면손실', ref: '세부지침 11-137 / 11-133' },
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
          <span style={{ fontSize: 12, color: T.textLabel }}>현재 관종:</span>
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
          <div style={{ fontSize: 12, lineHeight: 1.7, color: T.textLabel }}>
            <b>목적</b>: 매설 수도용 도복장강관(KS D 3565)의 구조적 안전성을 「시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편)」 제11장 11.5.2 에 따라 검토하고 안전성평가 등급을 산정한다.<br />
            <b>적용 범위</b>: 정밀안전진단 대상 매설관로. DB-24 차량하중.<br />
            <b>검토 항목</b>: 내압 → 작용 하중(외압) → 외압 휨응력 → 관체 변형률 → 좌굴하중 → 안전성평가 등급.<br />
            <b>하중 조합</b>: 외압 검토 시 관 내부 수압 없음 / 내압 검토 시 외부 하중 없음 (11-134 ②).<br />
            <b>검토 제외</b>: 수격압 상세해석(MOC), 용접부 피로·수온변화·잔류응력, 횡방향 지반변형 (내진평가 모듈 별도).
          </div>
        ) : (
          <div style={{ fontSize: 12, lineHeight: 1.7, color: T.textLabel }}>
            <b>목적</b>: 매설 수도용 덕타일 주철관(KS D 4311)의 구조적 안전성을 세부지침 제11장 11.5.2 (2) 에 따라 검토한다.<br />
            <b>적용 범위</b>: 정밀안전진단 대상 매설관로 (K-7 / K-9 / K-10 / K-12 등급).<br />
            <b>판정</b>: 내압·외압에 의한 발생 <b>복합 인장응력</b>이 관재의 기준 인장강도를 만족해야 한다 —<br />
            &nbsp;&nbsp;&nbsp;&nbsp;2.5·σts + 2.0·σtd + 1.4·σb &lt; S (=420 MPa, GCD400).<br />
            <b>검토 제외</b>: 세부지침에 DCIP 변형(편평률)·좌굴 기준 없음. 접합부 이탈력은 본 모듈 범위 외.
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
              <li><b>토압 분기</b>: H≤2m 연직토압 / H&gt;2m Marston(흙 아치효과 반영). 굴착부 폭 B = 2D+100 <b>[cm]</b>.</li>
              <li><b>차량하중</b>: Kögler 분산각 45°, 도로와 관 직각 매설 가정. 사각 매설 시 별도 보정 필요.</li>
              <li><b>E′</b>: 지침 제시값 28 kg/cm² 단일값. 토질·다짐도별 세분값 적용 시 근거를 별도 명시할 것.</li>
              <li><b>부력계수 Rw</b>: 지침 제시값 1.0. 지하수위 선택 시 안전측 보정값이 적용되며 결과에 표시됨.</li>
              <li><b>관두께</b>: 실측 최소값과 기준 두께 중 작은 값. 실측 미입력 시 기준 두께 적용(화면 명시).</li>
              <li><b>수격압</b>: 가압구간에서 입력값 적용. 정밀 수격해석(MOC)은 별도 모듈 필요.</li>
              <li><b>온도·잔류응력</b>: 미포함 (취급·설치 하중만 반영).</li>
            </ul>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><b>토압 분기</b>: 강관의 계산공식과 동일 (H≤2m 연직 / H&gt;2m Marston).</li>
              <li><b>조합 판정</b>: 강관과 달리 내압·외압을 분리하지 않고 조합한다 (지침이 조합식을 규정).</li>
              <li><b>단독 허용치 금지</b>: S/1.4 = 300 MPa 는 GCD400 항복강도와 같아 여유가 없다. 조합검토 전제값이므로 개별 응력에 적용하지 말 것.</li>
              <li><b>지지각 계수</b>: 관저(管底) 기준 Kf(40~180°), Kt = 0.011. 90° = 0.160.</li>
              <li><b>인장강도 기준</b>: S = 420 MPa 고정 (KS D 4311, GCD400).</li>
              <li><b>좌굴·변형 기준</b>: 세부지침에 DCIP 해당 규정 없음 — 미적용.</li>
            </ul>
          )}
        </div>
      </EngPanel>
    </div>
  )
}
