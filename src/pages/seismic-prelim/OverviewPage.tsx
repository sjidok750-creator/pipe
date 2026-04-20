import React from 'react'
import { T } from '../../components/eng/tokens'
import { EngPanel, EngSection } from '../../components/eng/EngLayout'
import FlowChartSVG from '../../components/overview/FlowChartSVG'
import { seismicPrelimFlow } from '../../components/overview/flows/seismicPrelimFlow'

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
  { step: '성능 목표 확인',       kds: 'KDS 57 17 00 §1.5',  ref: '—',                        limit: '기능수행 / 즉시복구' },
  { step: '지진구역 계수 Z',      kds: 'KDS 17 10 00 §2.1',  ref: '—',                        limit: 'I = 0.11g,  II = 0.07g' },
  { step: '중요도계수 I',          kds: 'KDS 57 17 00',       ref: '—',                        limit: '특 = 1.5,  Ⅰ = 1.2,  Ⅱ = 1.0' },
  { step: '지반종류 / 증폭계수',   kds: 'KDS 17 10 00 §4',   ref: '—',                        limit: 'S1~S6,  Fa / Fv 적용' },
  { step: '유연도지수 FLEX',       kds: '평가요령 §B.2',      ref: 'Table B-1',                limit: 'D/t 비율에 따른 4단계 분류' },
  { step: '관종지수 KIND',         kds: '평가요령 §B.2',      ref: 'Table B-2',                limit: '강관(용접)=0.3,  DIP=0.6,  PVC=1.0' },
  { step: '지반지수 EARTH',        kds: '평가요령 §B.2',      ref: 'Table B-3',                limit: 'S1=1.0,  S3/S4=1.5,  S5/S6=2.0' },
  { step: '크기지수 SIZE',         kds: '평가요령 §B.2',      ref: 'Table B-4',                limit: '소형<500=1.0,  중형=0.8,  대형=0.5' },
  { step: '이음지수 CONNECT',      kds: '평가요령 §B.2',      ref: 'Table B-5',                limit: '불량=1.0,  보통=0.8,  양호=0.5' },
  { step: '취약도지수 VI 산정',    kds: '평가요령 식(B.1)',   ref: '—',                        limit: 'VI = FLEX × (KIND+EARTH+…)' },
  { step: '지진도 그룹 결정',      kds: '평가요령 Table B-7', ref: '해설표 3.4.1',             limit: '1그룹 / 2그룹' },
  { step: '상세평가 필요 여부',    kds: '평가요령 §B.3',      ref: '—',                        limit: '1그룹 & VI ≥ 40 → 상세평가' },
]

const inputRows = [
  { cat: '지진 조건',  params: '지진구역 I/II,  내진등급 특/Ⅰ/Ⅱ,  도시/기타',    ref: 'KDS 17 10 00 §2' },
  { cat: '지반 조건',  params: '지반종류 S1~S6',                                    ref: 'KDS 17 10 00 §4' },
  { cat: '관로 제원',  params: '관종,  DN (mm),  t (mm)',                           ref: 'KS D 3565/4311' },
  { cat: '취약도 지수', params: 'CONNECT · FACIL · MCONE 각 등급',                 ref: '요령 Table B-5~7' },
]

const outputRows = [
  { item: 'FLEX',      desc: '유연도지수' },
  { item: 'VI',        desc: '취약도지수 (= FLEX × ΣSubIndex)' },
  { item: '지진도 그룹', desc: '1그룹 / 2그룹' },
  { item: '상세평가 필요 여부', desc: '중요상수도 / 유보상수도' },
  { item: '종합판정',  desc: 'O.K. (상세 불필요) / 상세평가 이행' },
]

export default function SeismicPrelimOverviewPage() {
  return (
    <div style={{ fontFamily: T.fontSans }}>

      {/* ── ① 검토 목적 및 적용 범위 ── */}
      <EngPanel title="① 검토 목적 및 적용 범위">
        <div style={{ fontSize: 11.5, lineHeight: 1.7, color: T.textLabel }}>
          <b>목적</b>: KDS 57 17 00 : 2022 및 「기존시설물(상수도) 내진성능 평가요령」 부록 B에 따라
          상수도 매설관로의 취약도지수(VI)를 산정하고, 상세평가 수행 필요 여부를 판정한다.<br />
          <b>적용 범위</b>: 매설 상수도 관로 전체 (관종·규격 무관). 신설 및 기존 시설물 모두 적용 가능.<br />
          <b>판정 기준</b>: 지진도 1그룹 & VI ≥ 40 → 중요상수도 (상세평가 필요);
          그 외 → 유보상수도 (관찰 대상).<br />
          <b>주의</b>: 예비평가 통과 시에도 액상화 우려 지반, 교량횡단부, 내진특등급은 상세평가를 권장한다.
        </div>
      </EngPanel>

      {/* ── ② 검토 흐름도 ── */}
      <EngPanel title="② 검토 흐름도 (Flow Chart)">
        <FlowChartSVG spec={seismicPrelimFlow} />
      </EngPanel>

      {/* ── ③ 입력·산출물 매트릭스 ── */}
      <EngPanel title="③ 입력 파라미터 / 산출물 매트릭스">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          <div>
            <EngSection title="산출물 (검토 결과)" />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>항목</th>
                  <th style={th}>설명</th>
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
              <th style={{ ...th, width: '22%' }}>단계 / 지수</th>
              <th style={{ ...th, width: '24%' }}>주 기준</th>
              <th style={{ ...th, width: '24%' }}>부 기준</th>
              <th style={{ ...th, width: '30%' }}>허용값 / 분류 기준</th>
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
            <li><b>간이 판정</b>: 예비평가는 지수 기반 스크리닝으로, 부재 단면 응력 계산을 수행하지 않는다.</li>
            <li><b>VI 임계값 40</b>: KDS 57 17 00 기준. 지자체 방침에 따라 보수적 적용 가능.</li>
            <li><b>액상화·사면</b>: 예비평가 범위 외 — 해당 시 상세평가 의무 권장.</li>
            <li><b>특수 구조물</b>: 교량 횡단관, 특등급 관로는 상세평가로 직행 적용.</li>
            <li><b>세부지수</b>: CONNECT · FACIL · MCONE은 현장조사 결과 기반으로 입력. 불확실 시 보수적 선택.</li>
          </ul>
        </div>
      </EngPanel>
    </div>
  )
}
