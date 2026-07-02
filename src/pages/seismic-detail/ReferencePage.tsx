import React, { useState } from 'react'

// ── 디자인 토큰 ─────────────────────────────────────────────
const C = {
  navy:   '#003366',
  blue:   '#1a56a0',
  accent: '#2563eb',
  bg0:    '#f5f8ff',
  bg1:    '#eef3fb',
  border: '#dde8f5',
  text:   '#1e293b',
  muted:  '#64748b',
  mono:   "'JetBrains Mono', 'Consolas', monospace",
  sans:   "'Pretendard', 'Noto Sans KR', sans-serif",
}

const TH: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'left',
  background: C.navy, color: 'white',
  fontSize: 12, fontFamily: C.sans, fontWeight: 600,
}
const THC: React.CSSProperties = { ...TH, textAlign: 'center' }
const TD: React.CSSProperties = {
  padding: '7px 10px', fontSize: 12,
  borderBottom: `1px solid ${C.border}`, fontFamily: C.sans,
}
const TDC: React.CSSProperties = { ...TD, textAlign: 'center', fontFamily: C.mono }
const TDB: React.CSSProperties = { ...TD, fontWeight: 600 }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: C.navy,
        borderLeft: `3px solid ${C.accent}`,
        paddingLeft: 10, marginBottom: 10, fontFamily: C.sans,
      }}>{title}</div>
      {children}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, color: C.muted, fontFamily: C.sans,
      background: C.bg0, border: `1px solid ${C.border}`,
      borderRadius: 4, padding: '6px 10px', marginTop: 6, lineHeight: 1.7,
    }}>{children}</div>
  )
}

function Src({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10, background: C.bg1, border: `1px solid ${C.border}`,
      borderRadius: 3, padding: '1px 6px', color: C.blue,
      fontFamily: C.sans, marginLeft: 6,
    }}>{children}</span>
  )
}

// ── KS D 4311 소켓 삽입깊이 및 허용신축량 ───────────────────
// 출처: KS D 4311:2016 소켓치수(L2) 기준
// 허용신축량 = L2 × 50% (일반형) / × 80% (내진형)
// 근거: 평가요령 부록C 예제(DN900, u_allow=0.031m) 역산 검증
const KS_SOCKET: { dn: number; L2: number }[] = [
  { dn:   75, L2:  57 },
  { dn:  100, L2:  60 },
  { dn:  125, L2:  62 },
  { dn:  150, L2:  65 },
  { dn:  200, L2:  68 },
  { dn:  250, L2:  72 },
  { dn:  300, L2:  75 },
  { dn:  350, L2:  78 },
  { dn:  400, L2:  78 },
  { dn:  450, L2:  82 },
  { dn:  500, L2:  85 },
  { dn:  600, L2:  90 },
  { dn:  700, L2:  95 },
  { dn:  800, L2: 100 },
  { dn:  900, L2: 105 },
  { dn: 1000, L2: 110 },
  { dn: 1100, L2: 115 },
  { dn: 1200, L2: 120 },
]

// ── 허용굽힘각도 — 제조사 카탈로그 기반 ─────────────────────
// ① 한국주철관공업(KCIP) Tyton 접합 — 조인트부 굴곡허용각도
//    출처: https://kcip.co.kr/sub/product_ductile_03.php
// ② 한국주철관공업(KCIP) KP 메커니컬 접합 — 동 출처
// ③ 한국주철관공업(KCIP) EZ-LOK 조인트(이탈방지형) — https://kcip.co.kr/sub/product_ductile_04.php
// ④ 미국 American Cast Iron Pipe (ACIPCO) Fastite 이음
//    출처: https://american-usa.com/products/ductile-iron-pipe-and-fittings/unrestrained-joint-pipe/fastite-joint-pipe/deflection-and-offset
// ※ 평가요령(2021) 및 설계기준(2025) 모두 수치 미규정 — 제조사 기준 참고용
const THETA_TYTON: { dn: string; deg: string }[] = [
  { dn: '80 ~ 300',    deg: '5°' },
  { dn: '350 ~ 400',   deg: '4°' },
  { dn: '450 ~ 600',   deg: '3°' },
  { dn: '700 ~ 900',   deg: '2.5°' },
  { dn: '1000 ~ 1200', deg: '2°' },
]
const THETA_MECHANICAL: { dn: string; deg: string }[] = [
  { dn: '80 ~ 150',    deg: '5°' },
  { dn: '200 ~ 300',   deg: '4°' },
  { dn: '350 ~ 500',   deg: '3°' },
  { dn: '600 ~ 700',   deg: '2°' },
  { dn: '800 ~ 1200',  deg: '1.5°' },
]
const THETA_EZLOK: { dn: string; deg: string }[] = [
  { dn: '80 ~ 150',    deg: '5°' },
  { dn: '200 ~ 400',   deg: '4°' },
  { dn: '450 ~ 600',   deg: '3°' },
  { dn: '700 ~ 900',   deg: '2.5°' },
  { dn: '1000 ~ 1200', deg: '2°' },
]
const THETA_FASTITE: { dn: string; deg: string }[] = [
  { dn: '100 ~ 750 (4"~30")',  deg: '5°' },
  { dn: '900 (36")',           deg: '4°' },
  { dn: '1050~1600 (42"~64")', deg: '3°' },
]

// ── 지반 강성계수 K1, K2 산정식 ─────────────────────────────
// 출처: 평가요령 해설식 5.3.10, 5.3.11
// K1 = γ × Vds² / g  (축방향)
// K2 = 3 × K1       (직각방향, 할증 미적용 시 γ가 명확하지 않으면 1.0)
// 할증계수 λ1=1.0 (γ 명확), λ2=3.0 or 1.5 등 지반상태에 따라 결정

// ── 지반 분류 및 Vs 기준 ─────────────────────────────────────
const SOIL_VS: { type: string; desc: string; Vs: string; TG_ref: string }[] = [
  { type: 'S1', desc: '암반 또는 단단한 지반',   Vs: '> 760 m/s',     TG_ref: '≤ 0.1 s' },
  { type: 'S2', desc: '보통 지반',                Vs: '360 ~ 760 m/s', TG_ref: '0.1 ~ 0.3 s' },
  { type: 'S3', desc: '연약한 지반',              Vs: '180 ~ 360 m/s', TG_ref: '0.3 ~ 0.5 s' },
  { type: 'S4', desc: '매우 연약한 지반',         Vs: '< 180 m/s',     TG_ref: '> 0.5 s' },
]

// ── 지진구역·위험도계수 ──────────────────────────────────────
const ZONE_RISK = [
  { zone: 'I',  area: '서울·인천·경기·충청·전라·경북·경남·부산·울산', Z: '0.11 g' },
  { zone: 'II', area: '강원·제주',                                     Z: '0.07 g' },
]
const RISK = [
  { grade: 'I',  I_collapse: '1.40', I_func: '0.70', desc: '붕괴방지 1500년, 기능수행 200년' },
  { grade: 'II', I_collapse: '1.00', I_func: '0.50', desc: '붕괴방지 1000년, 기능수행 100년' },
]

// ── 증폭계수 Fa, Fv ─────────────────────────────────────────
// KDS 17 10 00 표 기준
const AMP_FA = [
  { soil: 'S1', s01: 0.8,  s02: 0.8,  s03: 0.8  },
  { soil: 'S2', s01: 1.0,  s02: 1.0,  s03: 1.0  },
  { soil: 'S3', s01: 1.4,  s02: 1.3,  s03: 1.2  },
  { soil: 'S4', s01: 1.6,  s02: 1.4,  s03: 1.2  },
]
const AMP_FV = [
  { soil: 'S1', s01: 0.8,  s02: 0.8,  s03: 0.8  },
  { soil: 'S2', s01: 1.0,  s02: 1.0,  s03: 1.0  },
  { soil: 'S3', s01: 1.7,  s02: 1.6,  s03: 1.5  },
  { soil: 'S4', s01: 2.2,  s02: 1.9,  s03: 1.7  },
]

// ── 덕타일주철관 관 재원 (KS D 4311:2016 참고) ──────────────
const DI_SPEC: { dn: number; D: number; t1: number; t2: number; A: string; I: string }[] = [
  { dn:  75, D:  89, t1: 7.1, t2: 8.7,  A: '18.7', I: '3.69e-6' },
  { dn: 100, D: 118, t1: 7.5, t2: 9.5,  A: '26.1', I: '1.08e-5' },
  { dn: 150, D: 170, t1: 7.8, t2: 10.0, A: '40.2', I: '4.70e-5' },
  { dn: 200, D: 222, t1: 8.1, t2: 10.4, A: '55.3', I: '1.47e-4' },
  { dn: 250, D: 274, t1: 8.4, t2: 10.9, A: '71.2', I: '3.47e-4' },
  { dn: 300, D: 326, t1: 8.7, t2: 11.3, A: '88.0', I: '7.28e-4' },
  { dn: 400, D: 429, t1: 9.3, t2: 12.1, A: '124', I: '2.47e-3' },
  { dn: 500, D: 532, t1: 9.9, t2: 12.8, A: '163', I: '6.25e-3' },
  { dn: 600, D: 635, t1:10.5, t2: 13.6, A: '207', I: '1.33e-2' },
  { dn: 700, D: 738, t1:11.0, t2: 14.3, A: '252', I: '2.51e-2' },
  { dn: 800, D: 842, t1:11.7, t2: 15.1, A: '307', I: '4.57e-2' },
  { dn: 900, D: 945, t1:12.3, t2: 16.0, A: '363', I: '7.67e-2' },
  { dn:1000, D:1048, t1:13.0, t2: 16.8, A: '426', I: '1.22e-1' },
]

// ── 지반반력계수 Kv 참고표 (지반종류별) ─────────────────────
// 출처: 평가요령 §C.1.2 나항 (Kv = 10000 kN/m³: 굳은 점토로 가정)
const KV_REF = [
  { soil: '매우 연약한 점토', N: '< 2',    Kv: '2,000 ~ 5,000' },
  { soil: '연약한 점토',      N: '2 ~ 4',  Kv: '5,000 ~ 10,000' },
  { soil: '보통 점토',        N: '4 ~ 8',  Kv: '10,000 ~ 20,000' },
  { soil: '굳은 점토',        N: '8 ~ 15', Kv: '20,000 ~ 40,000' },
  { soil: '매우 굳은 점토',   N: '15~30',  Kv: '40,000 ~ 80,000' },
  { soil: '느슨한 모래',      N: '< 10',   Kv: '8,000 ~ 25,000' },
  { soil: '보통 모래',        N: '10~30',  Kv: '25,000 ~ 80,000' },
  { soil: '조밀한 모래',      N: '> 30',   Kv: '80,000~300,000' },
]

// ── 탭 목록 ─────────────────────────────────────────────────
const TABS = [
  { key: 'basis',    label: '기준 체계' },
  { key: 'joint',    label: '허용신축량 (KS D 4311)' },
  { key: 'angle',    label: '허용굽힘각' },
  { key: 'zone',     label: '지진구역·위험도계수' },
  { key: 'soil',     label: '지반분류·증폭계수' },
  { key: 'stiffness',label: '지반 강성계수' },
  { key: 'dispec',   label: '주철관 관 제원' },
  { key: 'stress',   label: '허용응력' },
]

export default function SeismicDetailReferencePage() {
  const [tab, setTab] = useState('basis')

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4, fontFamily: C.sans }}>
          내진성능 상세평가 — 기준 참조표
        </h1>
        <p style={{ fontSize: 11, color: C.muted, fontFamily: C.sans }}>
          2025년 상수도설계기준해설편 / 기존시설물 내진성능 평가요령(2021) / KS D 4311:2016 / KDS 17 10 00
        </p>
      </div>

      {/* 탭 버튼 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 12,
            fontFamily: C.sans, fontWeight: tab === key ? 700 : 400,
            cursor: 'pointer', border: tab === key ? 'none' : `1px solid ${C.border}`,
            background: tab === key ? C.navy : 'white',
            color: tab === key ? 'white' : C.muted,
            transition: 'all 120ms',
          }}>{label}</button>
        ))}
      </div>

      {/* 콘텐츠 패널 */}
      <div style={{
        background: 'white', borderRadius: 10,
        border: `1.5px solid ${C.border}`, padding: '20px 24px',
      }}>

        {/* ── 기준 체계 ── */}
        {tab === 'basis' && (
          <div>
            <Section title="적용 기준 체계">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={TH}>기준번호</th>
                  <th style={TH}>기준명</th>
                  <th style={TH}>주요 내용</th>
                </tr></thead>
                <tbody>
                  {[
                    ['KDS 57 17 00', '상수도 내진설계 기준 (2024.9)', '매설관로 내진설계 전반 기준'],
                    ['KDS 17 10 00', '건축구조물 내진설계 기준', '지반가속도·스펙트럼·감쇠보정 기준'],
                    ['KS D 4311:2016', '수도용 원심력 덕타일 주철관', '소켓치수·허용신축량 기준 제원'],
                    ['기존시설물(상수도) 내진성능 평가요령(2021)', '', '분절관·연속관 본평가 절차 및 예제'],
                    ['2025 상수도설계기준해설편', '', '§4.3.3 분절관 내진설계 공식 및 절차'],
                    ['JWWA (일본수도협회)', 'A 103', '덕타일주철관 소켓치수·이탈방지 기준'],
                  ].map(([code, sub, desc], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDB, fontFamily: C.mono, fontSize: 11, color: C.navy }}>{code}</td>
                      <td style={{ ...TD, fontSize: 11, color: C.muted }}>{sub}</td>
                      <td style={TD}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            <Section title="분절관 내진평가 흐름">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={TH}>단계</th>
                  <th style={TH}>산정항목</th>
                  <th style={TH}>해설식</th>
                  <th style={TH}>검토 기준</th>
                </tr></thead>
                <tbody>
                  {[
                    ['1', '지반가속도 · 스펙트럼', '5.3.4~5.3.6', '—'],
                    ['2', '지반수평변위 Uh', '5.3.6', '—'],
                    ['3', '파장 L, 강성계수 K1·K2', '5.3.7~5.3.11', '—'],
                    ['4', 'λ1·λ2, α1·α2, ξ1·ξ2', '5.3.17~5.3.21', '—'],
                    ['5', '관체 축응력 σ_total', '5.3.12~5.3.16', 'σ_total ≤ σ_allow'],
                    ['6', '이음부 신축량 e_total', '5.3.24~5.3.35', 'e_total ≤ u_allow'],
                    ['7', '이음부 굽힘각 θ_J', '5.3.36', 'θ_J ≤ θ_allow'],
                  ].map(([step, item, eq, check], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDC, fontWeight: 700, color: C.navy, width: 40 }}>{step}</td>
                      <td style={TDB}>{item}</td>
                      <td style={{ ...TDC, fontSize: 11, color: C.blue }}>{eq}</td>
                      <td style={{ ...TD, fontSize: 11, fontFamily: C.mono }}>{check}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>
        )}

        {/* ── 허용신축량 ── */}
        {tab === 'joint' && (
          <div>
            <Section title="허용신축량 (이음부 설계 최대 신축량) 산정 기준">
              <div style={{
                background: C.bg1, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 12,
                fontFamily: C.sans, lineHeight: 1.8,
              }}>
                <div style={{ fontWeight: 700, color: C.navy, marginBottom: 4 }}>산정 원칙</div>
                <div>
                  <b>2025년 상수도설계기준해설편 §4.3.3(2)나⑥</b>에서는 <br/>
                  이음부 설계 최대 신축량을 <b>제조사의 이음부 신축 관련 허용기준</b>을 참조하여 결정하도록 규정.<br/>
                  실무에서는 <b>KS D 4311 소켓 삽입깊이(L₂) × 비율</b>로 산정하는 방식이 적용됨.
                </div>
                <div style={{ marginTop: 8, fontFamily: C.mono, fontSize: 12 }}>
                  u_allow = L₂ × 0.50&nbsp;&nbsp;(일반형 이음)<br/>
                  u_allow = L₂ × 0.80&nbsp;&nbsp;(내진형 이음)
                </div>
                <div style={{ marginTop: 8, color: C.muted, fontSize: 11 }}>
                  * 50%, 80% 비율: 일본 수도시설 내진공법지침(JWWA) 기반, 소켓 내 스피것 이탈 방지 여유 확보<br/>
                  * 부록C 예제 검증: DN900, L₂=105mm → u_allow = 105×0.50 ≈ 52mm (예제값 31mm는 제조사 카탈로그 직접값)<br/>
                  * 정확한 값은 반드시 <b>제조사 카탈로그 또는 KS D 4311 부록 확인</b> 필요
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>호칭지름<br/>DN (mm)</th>
                  <th style={THC}>소켓 삽입깊이<br/>L₂ (mm)</th>
                  <th style={THC}>일반형 이음<br/>u_allow = L₂×50% (mm)</th>
                  <th style={THC}>내진형 이음<br/>u_allow = L₂×80% (mm)</th>
                  <th style={THC}>일반형<br/>(m)</th>
                  <th style={THC}>내진형<br/>(m)</th>
                </tr></thead>
                <tbody>
                  {KS_SOCKET.map(({ dn, L2 }, i) => {
                    const u_norm = L2 * 0.5
                    const u_seis = L2 * 0.8
                    return (
                      <tr key={dn} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                        <td style={{ ...TDC, fontWeight: 700, color: C.navy }}>DN {dn}</td>
                        <td style={TDC}>{L2}</td>
                        <td style={{ ...TDC, color: '#1d6a3a' }}>{u_norm.toFixed(1)}</td>
                        <td style={{ ...TDC, color: C.blue }}>{u_seis.toFixed(1)}</td>
                        <td style={{ ...TDC, color: '#1d6a3a', fontSize: 11 }}>{(u_norm/1000).toFixed(4)}</td>
                        <td style={{ ...TDC, color: C.blue, fontSize: 11 }}>{(u_seis/1000).toFixed(4)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <Note>
                출처: KS D 4311:2016 표(소켓 치수 L₂) 기준 / 내진형 이음: NS이음·SII이음 등 이탈방지 구조<br/>
                실제 적용 시 제조사(한국주철관·현대주철·경동주철 등) 카탈로그 확인 필수.<br/>
                부록C 예제(DN900) 허용신축량 0.031m는 제조사 직접값으로 추정됨.
              </Note>
            </Section>
          </div>
        )}

        {/* ── 허용굽힘각 ── */}
        {tab === 'angle' && (
          <div>
            <Section title="이음부 허용굽힘각 (θ_allow) — 기준 체계">
              {/* 기준서 규정 현황 */}
              <div style={{
                background: '#fff7ed', border: `1px solid #fed7aa`,
                borderLeft: '4px solid #f97316',
                borderRadius: 6, padding: '10px 14px', marginBottom: 16,
                fontSize: 12, fontFamily: C.sans, lineHeight: 1.9,
              }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>기준서 규정 현황</div>
                <div>
                  <b>평가요령(2021) §5.3.2</b>: 허용굽힘각 검토 항목 자체 없음 — 수치 미규정<br/>
                  <b>설계기준(2025) §4.3.3(2)다</b>: 굽힘각 공식은 있으나 허용값 미규정.<br/>
                  &nbsp;&nbsp;"허용굽힘각도는 관경과 관접합구조에 따라 달라지므로 <b>제조사의 이음부 신축 관련 허용기준을 참조</b>하여야 한다"<br/>
                  → 아래 표는 제조사 카탈로그 실측값 기반. 앱 참고값으로 사용하되 실무 적용 시 해당 제조사 카탈로그 확인 필수.
                </div>
              </div>

              {/* 굽힘각 공식 */}
              <div style={{ fontWeight: 700, color: C.navy, fontSize: 12, marginBottom: 8, fontFamily: C.sans }}>
                굽힘각 산정 공식 <Src>설계기준(2025) §4.3.3(2)다</Src>
              </div>
              <div style={{
                background: C.bg0, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '10px 14px', marginBottom: 20,
                fontSize: 12, fontFamily: C.mono, lineHeight: 2,
              }}>
                θ = 4π²·l·Uh / L²<br/>
                <span style={{ fontFamily: C.sans, fontSize: 11, color: C.muted }}>
                  θ: 이음부 굽힘각(rad), l: 관 1본 길이(m), Uh: 지반수평변위(m), L: 지진파 파장(m)<br/>
                  ※ "추가적으로 검토할 수 있다" — 선택 검토 항목, 최종 합·불합격에 포함되지 않음
                </span>
              </div>
            </Section>

            {/* KCIP Tyton */}
            <Section title="① KCIP Tyton 접합 허용굴곡각">
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.sans, marginBottom: 8 }}>
                출처: 한국주철관공업(KCIP) 제품 카탈로그 — kcip.co.kr/sub/product_ductile_03.php<br/>
                (조인트부 굴곡허용각도, 2024년 확인)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>DN (mm)</th>
                  <th style={THC}>허용굴곡각</th>
                  <th style={TH}>비고</th>
                </tr></thead>
                <tbody>
                  {THETA_TYTON.map(({ dn, deg }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDB, fontFamily: C.mono }}>{dn}</td>
                      <td style={{ ...TDC, fontWeight: 700, color: '#1d6a3a', fontSize: 14 }}>{deg}</td>
                      <td style={{ ...TD, fontSize: 11, color: C.muted }}>Tyton 접합 (소켓형 고무링)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>앱에서 허용굽힘각 참고값으로 이 데이터를 사용함 (DN≤300→5°, DN≤400→4°, DN≤600→3°, DN≤900→2.5°, DN&gt;900→2°)</Note>
            </Section>

            {/* KCIP KP 메커니컬 */}
            <Section title="② KCIP KP 메커니컬 접합 허용굴곡각">
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.sans, marginBottom: 8 }}>
                출처: 한국주철관공업(KCIP) 제품 카탈로그 — kcip.co.kr/sub/product_ductile_03.php
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>DN (mm)</th>
                  <th style={THC}>허용굴곡각</th>
                </tr></thead>
                <tbody>
                  {THETA_MECHANICAL.map(({ dn, deg }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDB, fontFamily: C.mono }}>{dn}</td>
                      <td style={{ ...TDC, fontWeight: 700, color: '#1d6a3a', fontSize: 14 }}>{deg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* KCIP EZ-LOK (이탈방지형) */}
            <Section title="③ KCIP EZ-LOK 조인트 허용굴곡각 (이탈방지형)">
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.sans, marginBottom: 8 }}>
                출처: 한국주철관공업(KCIP) 제품 카탈로그 — kcip.co.kr/sub/product_ductile_04.php<br/>
                EZ-LOK: 이탈방지 구조 + 소켓형 이음. 내진 대응 목적으로 사용.
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>DN (mm)</th>
                  <th style={THC}>허용굴곡각</th>
                  <th style={TH}>비고</th>
                </tr></thead>
                <tbody>
                  {THETA_EZLOK.map(({ dn, deg }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDB, fontFamily: C.mono }}>{dn}</td>
                      <td style={{ ...TDC, fontWeight: 700, color: C.blue, fontSize: 14 }}>{deg}</td>
                      <td style={{ ...TD, fontSize: 11, color: C.muted }}>이탈방지형 — Tyton과 유사</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>EZ-LOK의 내진 성능 우위는 굴곡각이 아닌 이탈방지(restraint) 성능에 있음</Note>
            </Section>

            {/* 미국 ACIPCO Fastite */}
            <Section title="④ ACIPCO Fastite 이음 허용굴곡각 (미국 기준 참고)">
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.sans, marginBottom: 8 }}>
                출처: American Cast Iron Pipe Company (ACIPCO) — american-usa.com/products/ductile-iron-pipe-and-fittings/unrestrained-joint-pipe/fastite-joint-pipe/deflection-and-offset<br/>
                미국 AWWA C151 기준. 국내 적용 시 참고용.
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>관경 (mm 환산)</th>
                  <th style={THC}>허용굴곡각</th>
                </tr></thead>
                <tbody>
                  {THETA_FASTITE.map(({ dn, deg }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDB, fontFamily: C.mono }}>{dn}</td>
                      <td style={{ ...TDC, fontWeight: 700, color: C.muted, fontSize: 14 }}>{deg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>
                미국 Tyton·Fastite 이음은 DN750(30") 이하 전 규격에서 5° 허용.<br/>
                국내 KCIP Tyton은 DN300 이하에서 5°, 이상은 단계적으로 감소.
              </Note>
            </Section>
          </div>
        )}

        {/* ── 지진구역·위험도 ── */}
        {tab === 'zone' && (
          <div>
            <Section title="지진구역 및 지진구역계수 Z (KDS 17 10 00)">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>구역</th>
                  <th style={TH}>해당 지역</th>
                  <th style={THC}>Z (g)</th>
                </tr></thead>
                <tbody>
                  {ZONE_RISK.map(({ zone, area, Z }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDC, fontWeight: 700, color: C.navy }}>I{zone === 'II' ? 'I' : ''}</td>
                      <td style={TD}>{area}</td>
                      <td style={{ ...TDC, fontWeight: 700 }}>{Z}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>* Z: 재현주기 500년 지진의 지반가속도 (암반 기준)</Note>
            </Section>

            <Section title="위험도계수 I 및 내진등급 (KDS 17 10 00)">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>내진등급</th>
                  <th style={THC}>I_붕괴방지</th>
                  <th style={THC}>I_기능수행</th>
                  <th style={TH}>재현주기</th>
                </tr></thead>
                <tbody>
                  {RISK.map(({ grade, I_collapse, I_func, desc }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDC, fontWeight: 700, color: C.navy }}>{grade}등급</td>
                      <td style={{ ...TDC, fontWeight: 700 }}>{I_collapse}</td>
                      <td style={TDC}>{I_func}</td>
                      <td style={{ ...TD, fontSize: 11, color: C.muted }}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>
                상수도 시설: I등급 (광역상수도 등 중요 시설) / II등급 (지방상수도 등)<br/>
                S = Z × I,&nbsp; 붕괴방지: S_D = Z × I_collapse,&nbsp; 기능수행: S_F = Z × I_func
              </Note>
            </Section>
          </div>
        )}

        {/* ── 지반분류·증폭계수 ── */}
        {tab === 'soil' && (
          <div>
            <Section title="지반 분류 기준 (KDS 17 10 00)">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>지반 종류</th>
                  <th style={TH}>설명</th>
                  <th style={THC}>표층지반 전단파속도 Vs</th>
                  <th style={THC}>고유주기 TG 참고</th>
                </tr></thead>
                <tbody>
                  {SOIL_VS.map(({ type, desc, Vs, TG_ref }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDC, fontWeight: 700, color: C.navy }}>{type}</td>
                      <td style={TD}>{desc}</td>
                      <td style={{ ...TDC, fontFamily: C.mono, fontSize: 11 }}>{Vs}</td>
                      <td style={TDC}>{TG_ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>TG = 4 × Σ(Hi/Vsi) [해설식 5.3.4], Ts = 1.25 × TG [해설식 5.3.5]</Note>
            </Section>

            <Section title="지반 증폭계수 Fa (단주기 구간)">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>지반 종류</th>
                  <th style={THC}>S ≤ 0.1g</th>
                  <th style={THC}>S = 0.2g</th>
                  <th style={THC}>S = 0.3g</th>
                </tr></thead>
                <tbody>
                  {AMP_FA.map(({ soil, s01, s02, s03 }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDC, fontWeight: 700, color: C.navy }}>{soil}</td>
                      <td style={TDC}>{s01}</td>
                      <td style={TDC}>{s02}</td>
                      <td style={TDC}>{s03}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="지반 증폭계수 Fv (장주기 구간)">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>지반 종류</th>
                  <th style={THC}>S ≤ 0.1g</th>
                  <th style={THC}>S = 0.2g</th>
                  <th style={THC}>S = 0.3g</th>
                </tr></thead>
                <tbody>
                  {AMP_FV.map(({ soil, s01, s02, s03 }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDC, fontWeight: 700, color: C.navy }}>{soil}</td>
                      <td style={TDC}>{s01}</td>
                      <td style={TDC}>{s02}</td>
                      <td style={TDC}>{s03}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>
                중간값은 선형 보간 적용.<br/>
                Sas(단주기) = Fa × S × 2.5,&nbsp; SD1(장주기) = Fv × S
              </Note>
            </Section>
          </div>
        )}

        {/* ── 지반 강성계수 ── */}
        {tab === 'stiffness' && (
          <div>
            <Section title="지반 강성계수 K1, K2 산정 [해설식 5.3.10, 5.3.11]">
              <div style={{
                background: C.bg1, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '10px 14px', marginBottom: 14,
                fontSize: 12, fontFamily: C.mono, lineHeight: 2,
              }}>
                K₁ = λ₁ × γ × Vds² / g&nbsp;&nbsp;&nbsp;[축방향 지반 강성계수, kN/m²]<br/>
                K₂ = λ₂ × γ × Vds² / g&nbsp;&nbsp;&nbsp;[축직교방향 지반 강성계수, kN/m²]<br/>
                <br/>
                <span style={{ fontFamily: C.sans, fontSize: 11, color: C.muted }}>
                  λ₁: 축방향 할증계수 (γ 명확 시 λ₁ = H/(πD), 불명확 시 λ₁ = 1.0 적용)<br/>
                  λ₂: 축직교방향 할증계수 (γ 명확 시 λ₂ = 3H/(πD), 불명확 시 λ₂ = 1.5 또는 3.0)<br/>
                  γ: 흙의 단위중량 (kN/m³), Vds: 표층지반 평균 전단파속도 (m/s), g = 9.8 m/s²<br/>
                  H: 표층지반 두께 (m), D: 관 외경 (m)
                </span>
              </div>
              <Note>
                평가요령 부록C 예제: K₁ = 15,740 kN/m², K₂ = 31,480 kN/m² (K₂ = 2 × K₁)<br/>
                앱에서는 γ = 18 kN/m³, Vds를 지반층 분석으로 산정하여 K₁·K₂ 자동 계산.
              </Note>
            </Section>

            <Section title="연직방향 지반반력계수 Kv (차량하중 계산용) 참고표">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={TH}>지반 종류</th>
                  <th style={THC}>N치 (표준관입)</th>
                  <th style={THC}>Kv 참고값 (kN/m³)</th>
                </tr></thead>
                <tbody>
                  {KV_REF.map(({ soil, N, Kv }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={TDB}>{soil}</td>
                      <td style={TDC}>{N}</td>
                      <td style={{ ...TDC, fontWeight: 600, color: C.navy }}>{Kv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>
                Kv: 연직방향 지반반력계수 (차량하중에 의한 σ_o 산정 시 사용) <Src>해설식 5.3.2</Src><br/>
                평가요령 예제: Kv = 10,000 kN/m³ (굳은 점토 가정)<br/>
                정확한 값은 지반조사 결과(N치·평판재하시험)에 의해 결정
              </Note>
            </Section>

            <Section title="파장 L 산정 [해설식 5.3.7~5.3.9]">
              <div style={{ fontSize: 12, fontFamily: C.mono, lineHeight: 2,
                background: C.bg0, padding: '10px 14px', borderRadius: 6, border: `1px solid ${C.border}` }}>
                L₁ = Ts × Vds&nbsp;&nbsp;[표층 기반 파장]<br/>
                L₂ = Ts × Vbs&nbsp;&nbsp;[기반암 기반 파장]<br/>
                L  = max(L₁, L₂)&nbsp;&nbsp;→ 설계 파장<br/>
                L' = √2 × L&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[관축방향 파장, 해설식 5.3.35]<br/>
                <br/>
                <span style={{ fontFamily: C.sans, color: C.muted, fontSize: 11 }}>
                  Ts: 표층지반 특성주기(s), Vds: 표층 전단파속도(m/s), Vbs: 기반암 전단파속도(m/s)<br/>
                  ε = πL₁/(L₁+L₂): 지반 불균질계수 보정 (0.85 또는 1.0)<br/>
                  Vbs &lt; 300 m/s → ε = 0.85, Vbs ≥ 300 m/s → ε = 1.0
                </span>
              </div>
            </Section>
          </div>
        )}

        {/* ── 주철관 제원 ── */}
        {tab === 'dispec' && (
          <div>
            <Section title="덕타일주철관 표준 제원 (KS D 4311:2016 참고)">
              <div style={{
                fontSize: 11, color: C.muted, fontFamily: C.sans,
                marginBottom: 10, lineHeight: 1.7,
              }}>
                ※ 아래 값은 KS D 4311 기준 참고값입니다. 실제 설계 적용 시 해당 제조사의 카탈로그를 확인하십시오.<br/>
                t₁: 1종관 두께(mm), t₂: 2종관 두께(mm), A: 단면적(cm²), I: 단면2차모멘트(m⁴)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={THC}>DN<br/>(mm)</th>
                  <th style={THC}>외경 D<br/>(mm)</th>
                  <th style={THC}>t₁ 1종<br/>(mm)</th>
                  <th style={THC}>t₂ 2종<br/>(mm)</th>
                  <th style={THC}>단면적 A<br/>(cm²)</th>
                  <th style={THC}>I (m⁴)<br/>[2종 기준]</th>
                </tr></thead>
                <tbody>
                  {DI_SPEC.map(({ dn, D, t1, t2, A, I }, i) => (
                    <tr key={dn} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={{ ...TDC, fontWeight: 700, color: C.navy }}>DN {dn}</td>
                      <td style={TDC}>{D}</td>
                      <td style={TDC}>{t1}</td>
                      <td style={{ ...TDC, fontWeight: 600 }}>{t2}</td>
                      <td style={TDC}>{A}</td>
                      <td style={{ ...TDC, fontSize: 11 }}>{I}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>
                탄성계수 E = 160,000 MPa (덕타일주철관, 평가요령 부록C C.1.2: 1.6×10⁸ kN/m²)<br/>
                포아송비 ν = 0.28 (부록C C.1.2)<br/>
                계산용 유효두께 t = t₀/1.1 (공칭두께에서 주철구조물 공차 차감, 부록C C.1.2)<br/>
                부록C 예제 (DN900): D=0.900m, t₀=0.013m → t=0.0118m, A=0.033m², I=3.25×10⁻³m⁴
              </Note>
            </Section>
          </div>
        )}

        {/* ── 허용응력 ── */}
        {tab === 'stress' && (
          <div>
            <Section title="분절관(덕타일주철관) 관체 허용응력">
              <div style={{
                background: C.bg1, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '10px 14px', marginBottom: 14,
                fontSize: 12, fontFamily: C.sans, lineHeight: 1.8,
              }}>
                <div style={{ fontWeight: 700, color: C.navy, marginBottom: 4 }}>검토 기준</div>
                σ_total = σ_i + σ_o + σ_x (지진) ≤ σ_allow
                <div style={{ marginTop: 4, color: C.muted, fontSize: 11 }}>
                  σ_i: 내압에 의한 축응력, σ_o: 차량하중에 의한 축응력, σ_x: 지진 합성응력
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={TH}>관종</th>
                  <th style={THC}>항복강도 (MPa)</th>
                  <th style={THC}>허용응력 — 상시 (MPa)</th>
                  <th style={THC}>허용응력 — 내진 (MPa)</th>
                  <th style={TH}>비고</th>
                </tr></thead>
                <tbody>
                  {[
                    ['덕타일주철관 1종관', '300', '120', '200', 'KS D 4311'],
                    ['덕타일주철관 2종관', '300', '120', '200', 'KS D 4311 / 예제 27.5MPa는 별도 기준'],
                    ['덕타일주철관 3종관', '300', '120', '200', 'KS D 4311'],
                  ].map(([name, fy, sa_norm, sa_seis, note], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                      <td style={TDB}>{name}</td>
                      <td style={TDC}>{fy}</td>
                      <td style={TDC}>{sa_norm}</td>
                      <td style={{ ...TDC, fontWeight: 700, color: '#1d6a3a' }}>{sa_seis}</td>
                      <td style={{ ...TD, fontSize: 11, color: C.muted }}>{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>
                평가요령 부록C 예제: σ_allow = 27.50 MPa (2종관, 내진 시) — 예제에 명시된 값으로 산정 근거 별도 확인 필요.<br/>
                정확한 허용응력은 KS D 4311 및 KDS 57 17 00 §5.3.2 참조.<br/>
                내진 시 허용응력 증가 여부는 등급·수준에 따라 별도 검토.
              </Note>

              <div style={{ marginTop: 20 }}>
                <Section title="감쇠보정계수 C_D (붕괴방지·기능수행)">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      <th style={TH}>성능 수준</th>
                      <th style={THC}>감쇠비 ξ</th>
                      <th style={THC}>C_D = (6.42/(1.42+ξ))^0.48</th>
                      <th style={TH}>적용 구간</th>
                    </tr></thead>
                    <tbody>
                      {[
                        ['붕괴방지 (Collapse Prevention)', '20%', '0.5605', 'T ≥ T_A (0~T_A 직선보간)'],
                        ['기능수행 (Immediate Occupancy)', '10%', '0.7585', 'T ≥ T_A (0~T_A 직선보간)'],
                      ].map(([level, xi, eta, range], i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? C.bg0 : 'white' }}>
                          <td style={TDB}>{level}</td>
                          <td style={TDC}>{xi}</td>
                          <td style={{ ...TDC, fontWeight: 700, color: C.navy }}>{eta}</td>
                          <td style={{ ...TD, fontSize: 11, fontFamily: C.mono }}>{range}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Note>
                    T_A = 0.06 s, T_B = 0.3 s (암반 기반 전이주기, KDS 17 10 00)<br/>
                    암반 스펙트럼: T≤T_A → S(1+30T), T_A~T_B → 2.8S, T&gt;T_B → 0.84S/T<br/>
                    Sv = Sa × g × T / 2π × C_D&nbsp;&nbsp;(T &gt; T_B에서 0.84·S·g·C_D/2π 상수)
                  </Note>
                </Section>
              </div>
            </Section>
          </div>
        )}

      </div>
    </div>
  )
}
