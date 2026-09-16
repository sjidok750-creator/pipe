// ============================================================
// 최종보고서 「부록 — 구조안전성 및 내진성능평가 상세 계산서」 HWPX 생성
//   서식 견본: templates/부록 - 구조안전성 및 내진성능평가 상세계산서.hwpx
//   구성 : A.1 적용 기준 및 산정식 / A.2 관로구간별 구조안전성 계산서
//          B.1 내진성능 우선순위 평가 계산서 / B.2 본평가 산정식 / B.3 구간별 본평가 계산서
//   근거 : 세부지침 11-134 ~ 11-137 / 기존시설물(상수도) 내진성능 평가요령
// ============================================================
import { HwpxBuilder, downloadHwpx } from './hwpxCore.js'
import {
  collectReportFacilities, structuralView, seismicView, segLabel,
  f, fInt, meta, DASH,
} from '../report/projectReport.js'

const C = t => ({ text: t, align: 'center' })
const R = t => ({ text: t, align: 'right' })
const H = (t, colSpan, rowSpan) => ({ text: t, colSpan, rowSpan, align: 'center' })
const ok = v => (v === true ? 'O.K' : v === false ? 'N.G' : DASH)

/** 시설물 제목 — '송수 01  관로구간 01-4 (세부구간 12)' */
function facTitle(m, idx) {
  const sys = m.system || `시설물 ${idx + 1}`
  const seg = m.segment ? `  관로구간 ${m.segment}` : ''
  const sub = m.subSegment ? ` (세부구간 ${m.subSegment})` : ''
  return `${sys}${seg}${sub}`
}

export function buildAppendix({ project, projectMeta }) {
  const pm = projectMeta ?? {}
  const facs = collectReportFacilities(project)
  const b = new HwpxBuilder()

  b.coverTitle('부      록', '구조안전성 및 내진성능평가 상세 계산서')
  b.infoTable([
    ['용역명', pm.projectTitle || DASH],
    ['개별시설물명', pm.facilityName || DASH],
    ['수록 범위', 'A.1 적용 기준 및 산정식 / A.2 관로구간별 구조안전성 계산서 / '
      + 'B.1 내진성능 우선순위 평가 계산서 / B.2 본평가 산정식 / B.3 구간별 본평가 계산서'],
    ['작성일', new Date().toLocaleDateString('ko-KR')],
  ])

  // ══════════════════════════════════════════════════════
  // A. 구조안전성 검토 계산서
  // ══════════════════════════════════════════════════════
  b.heading('A.  구조안전성 검토 계산서')
  b.subheading('A.1  적용 기준 및 산정식')
  b.para('본 계산서는 [시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서] 제11장 상수도 11.5.2 및 '
    + '[기존 시설물(상수도) 내진성능 평가요령]에 따라 수행한 구조안전성 검토와 내진성능평가의 상세 산정과정을 수록한 것이다. '
    + '계산은 세부지침 원문의 단위계(cm, kg, kg/cm²)로 수행하고 응력만 SI(MPa)로 환산하였다.')
  b.spacer()

  b.sub('○ 작용 하중 (외압) — 상부 토압')
  b.eqBox([
    { label: 'H ≤ 2.0 m', eq: 'W _{v} = gamma _{t} H' },
    { label: 'H > 2.0 m', eq: 'W _{v} = C _{d} gamma _{t} B' },
    { text: '굴착부 폭 B = 2D + 100 (cm, D : 관 외경), 토압계수 kμ′ = {(1−sinφ)/(1+sinφ)}·tanφ′ = 0.19245 (φ′ = φ = 30°)  [세부지침 11-134]' },
  ])
  b.sub('○ 작용 하중 (외압) — 노면하중')
  b.eqBox([
    { label: '노면하중', eq: 'W _{t} = {2 n P ( 1 + i )} over { C ( a + 2 h tan theta ) }' },
    { text: '후륜 1륜 하중 P = 9,600 kg(DB-24), L = 175 cm, C = 100 cm, b = 50 cm, a = 20 cm, θ = 45°  [세부지침 11-134]' },
  ])
  b.tableWithCaption('<표 A.1> 충격계수 (i)', {
    headerRows: [[H('토피 h (m)'), H('충격계수 i')]],
    rows: [[C('h < 1.5'), C('0.5')], [C('1.5 ≤ h ≤ 6.5'), C('0.65 − 0.10 h')], [C('h > 6.5'), C('0')]],
    weights: [1, 1],
  })
  b.note('※ 근거 : 세부지침 11-134')
  b.spacer()

  b.sub('○ 내압에 의한 관의 응력')
  b.eqBox([
    { label: '내압 응력', eq: 'sigma _{t} = {P D} over {2 t}' },
    { text: 'D : 관 내경 (mm), t : 적용 관두께 (mm)  [세부지침 11-134]' },
  ])
  b.sub('○ 외압에 의한 관체의 원주방향 휨응력')
  b.eqBox([
    { label: '휨응력', eq: 'sigma _{b} = {2} over {f Z} W left [ {K _{b} R ^{2} E I + ( 0.061 K _{b} - 0.083 K _{x} ) E\' R ^{5}} over {E I + 0.061 E\' R ^{3}} right ]' },
    { text: 'W = Wv + Wt, f = 1.5, R = D/2 + t, E = 2.1×10⁶ kg/cm², E′ = 28 kg/cm²  [세부지침 11-135]' },
  ])
  b.tableWithCaption('<표 A.2> 기초 유효받침각별 계수 (Kb · Kx)', {
    headerRows: [[H('유효받침각 2α'), H('Kb'), H('Kx'), H('0.061Kb − 0.083Kx')]],
    rows: [
      [C('60°'), C('0.189'), C('0.110'), C('0.00306')],
      [C('90°'), C('0.157'), C('0.096'), C('0.00168')],
      [C('120°'), C('0.138'), C('0.089'), C('0.00109')],
      [C('150°'), C('0.128'), C('0.085'), C('0.00081')],
    ],
    weights: [1.2, 1, 1, 1.6],
  })
  b.note('※ 근거 : 세부지침 11-135. 계수는 표 4열의 인쇄된 계산값과 정합하는 0.06146 / 0.08303 을 적용한다.')
  b.spacer()

  b.sub('○ 외압에 의한 관체의 원주방향 변형률')
  b.eqBox([
    { label: '변형률', eq: 'epsilon = {2 K _{x} W R ^{4}} over {E I + 0.061 E\' R ^{3}} times {1} over {D} times 100' },
    { text: '허용 변형량 : 관경(내경)의 5 % 미만  [세부지침 11-136 / 11-134 표 11.5.1]' },
  ])
  b.sub('○ 외압에 의한 관체의 좌굴하중')
  b.eqBox([
    { label: '허용 좌굴하중', eq: 'q _{a} = {1} over {FS} sqrt {32 R _{w} B\' E\' {E I} over {D ^{3}}}' },
    { text: "B′ = 0.15 + 0.041(H/D), FS = 2.5 (H/D ≥ 2) 또는 3.0 (H/D < 2)  [세부지침 11-136]" },
  ])
  b.spacer()

  b.sub('○ 안전율 (S.F) 의 정의')
  b.para('· 내압 휨응력 : 허용 응력(140 MPa) ÷ 내압 작용시 발생 휨응력(MPa)')
  b.para('· 외압 휨응력 : 허용 응력(140 MPa) ÷ 외압 작용시 발생 휨응력(MPa)')
  b.para('· 외압 변형률 : 허용 변형량(관경의 5 % 미만) ÷ 외압 작용시 발생 변형률(%)')
  b.para('· 좌      굴 : 허용 좌굴하중 qa(kg/cm²) ÷ 발생 외압 W = Wv + Wt(kg/cm²)  →  판정기준 qa ≥ W')
  b.spacer()

  // ── A.2 구간별 계산서 ──────────────────────────────────
  b.heading('A.2  관로구간별 구조안전성 계산서')
  b.tableWithCaption('<표 A.3> 공통 적용값', {
    headerRows: [[H('구      분'), H('기 호'), H('단 위'), H('적    용    값'), H('적 용 근 거')]],
    rows: [
      ['강관 탄성계수', C('E'), C('kg/cm²'), R('2.1 × 10⁶'), '세부지침 11-135'],
      ['흙의 반력계수', C('E′'), C('kg/cm²'), R('28'), '세부지침 11-135·11-136'],
      ['흙의 단위중량', C('γt'), C('kg/cm³'), R('1.8 × 10⁻³'), '세부지침 11-134'],
      ['토압계수', C('kμ′'), C('-'), R('0.19245  (φ′ = φ = 30°)'), '세부지침 11-134'],
      ['굴착부 폭', C('B'), C('cm'), R('2D + 100  (D : 관 외경)'), '세부지침 11-134'],
      ['형상계수', C('f'), C('-'), R('1.5'), '세부지침 11-135'],
      ['차량하중 (후륜 1륜)', C('P'), C('kg/륜'), R('9,600  (DB-24)'), '세부지침 11-134'],
      ['허용응력 (상시 / 일시)', C('σa / σa′'), C('MPa'), R('140 / 210'), '세부지침 11-134 표 11.5.1'],
      ['허용 변형량', C('εa'), C('%'), R('관경(내경)의 5 미만'), '세부지침 11-134 표 11.5.1'],
    ],
    weights: [2, 1, 0.9, 2.4, 2],
  })
  b.spacer()

  facs.forEach((fx, i) => {
    const v = structuralView(fx)
    const m = fx.m
    b.subheading(`A.2.${i + 1}  ${facTitle(m, i)}`)
    b.tableWithCaption(`<표 A.${4 + i}> 검토 제원 — ${facTitle(m, i)}`, {
      headerRows: [[H('구      분'), H('기 호'), H('단 위'), H('적    용    값')]],
      rows: [
        ['관종 / 강종', C('-'), C('-'), `${meta(m, 'pipeMark')} / ${meta(m, 'steelGrade')}`],
        ['검토위치 (측점)', C('-'), C('-'), `${meta(m, 'station')}${m.position ? `   (${m.position})` : ''}`],
        ['검토구간 연장', C('L'), C('m'), R(meta(m, 'lengthM'))],
        ['호칭경', C('DN'), C('mm'), R(fInt(v?.DN))],
        ['관 외경', C('Do'), C('mm'), R(f(v?.Do, 1))],
        ['기준 관두께 / 실측 최소', C('-'), C('mm'), R(`${meta(m, 'thickBase')} / ${meta(m, 'thickMeas')}`)],
        ['적용 관두께', C('t'), C('mm'), R(`${f(v?.t, 1)}   = min ( 기준두께 , 실측 최소두께 )`)],
        ['산정용 관 내경', C('D'), C('mm'), R(`${f(v?.Di, 1)}   = Do − 2t`)],
        ['매설깊이 (토피고)', C('H'), C('m'), R(f(v?.H, 2))],
        ['설계 운전압력 (상시)', C('P'), C('MPa'), R(f(v?.Pd, 2))],
        ['수격압 (일시)', C('P′'), C('MPa'), R(f(v?.Psurge, 2))],
        ['운전방식', C('-'), C('-'), meta(m, 'operation')],
        ['매설현황 / 지하수위', C('-'), C('-'), meta(m, 'burial')],
      ],
      weights: [2, 1, 0.9, 3.4],
    })
    b.spacer()

    if (v) {
      b.sub('○ 내압에 의한 관의 응력')
      b.calcRows([
        { label: '상시 (정수압)', expr: `σt = P·D/(2t) = ${f(v.Pd, 2)} × ${f(v.Di, 1)} / (2 × ${f(v.t, 1)})`, value: `${f(v.sigma_t, 2)} MPa` },
        { label: '판정', expr: `${f(v.sigma_t, 2)} MPa ≤ σa = ${fInt(v.allow_t)} MPa`, value: `${ok(v.ok_t)}  ( S.F = ${f(v.SF_t, 2)} )` },
        ...(v.Psurge != null ? [
          { label: '일시 (수격압)', expr: `σt′ = P′·D/(2t) = ${f(v.Psurge, 2)} × ${f(v.Di, 1)} / (2 × ${f(v.t, 1)})`, value: `${f(v.sigma_ts, 2)} MPa` },
          { label: '판정', expr: `${f(v.sigma_ts, 2)} MPa ≤ σa′ = ${fInt(v.allow_ts)} MPa`, value: `${ok(v.ok_t)}  ( S.F = ${f(v.SF_ts, 2)} )` },
        ] : [
          { label: '일시 (수격압)', expr: '자연유하 구간으로 입력되어 수격압을 산정하지 않음 (입력 : 운전방식)', value: '미적용' },
        ]),
      ])
      b.note('※ 내압 검토는 외부하중(토압·노면하중)이 없는 조건으로 한다 [ 세부지침 11-134 ② ].')
      b.spacer()

      b.sub('○ 외압에 의한 관체의 원주방향 휨응력')
      b.calcRows([
        { label: '상부 토압', expr: `Wv (H = ${f(v.H, 2)} m)`, value: `${f(v.Wv, 5)} kg/cm²` },
        { label: '노면하중', expr: 'Wt (DB-24, Kögler 분산)', value: `${f(v.Wt, 5)} kg/cm²` },
        { label: '총 연직하중', expr: 'W = Wv + Wt', value: `${f(v.Wtotal, 5)} kg/cm²` },
        { label: '휨응력', expr: 'σb = 2/(f·Z)·W·[Kb R²EI + (0.06146Kb − 0.08303Kx)E′R⁵] / [EI + 0.061E′R³]', value: `${f(v.sigma_b, 2)} MPa` },
        { label: '판정', expr: `${f(v.sigma_b, 2)} MPa ≤ σa = ${fInt(v.allow_b)} MPa`, value: `${ok(v.ok_b)}  ( S.F = ${f(v.SF_b, 2)} )` },
      ])
      b.spacer()

      b.sub('○ 외압에 의한 관체의 원주방향 변형률')
      b.calcRows([
        { label: '변형량', expr: 'Δx = 2Kx·W·R⁴ / (EI + 0.061E′R³)', value: `${f(v.deltaX, 4)} cm` },
        { label: '변형률', expr: 'ε = Δx / D × 100', value: `${f(v.eps, 3)} %` },
        { label: '판정', expr: `${f(v.eps, 3)} % < εa = 관경(내경)의 ${f(v.epsA, 1)} %`, value: `${ok(v.ok_eps)}  ( S.F = ${f(v.SF_eps, 2)} )` },
      ])
      b.spacer()

      b.sub('○ 외압에 의한 관체의 좌굴하중')
      b.calcRows([
        { label: '기초계수', expr: `B′ = 0.15 + 0.041(H/D)`, value: f(v.Bprime, 3) },
        { label: '설계계수', expr: 'FS = 2.5 (H/D ≥ 2) / 3.0 (H/D < 2)', value: f(v.FS, 1) },
        { label: '허용 좌굴하중', expr: "qa = (1/FS)·√(32 Rw B′ E′ EI/D³)", value: `${f(v.qa, 4)} kg/cm²` },
        { label: '판정', expr: `qa = ${f(v.qa, 4)} ≥ W = ${f(v.Wtotal, 5)} kg/cm²`, value: `${ok(v.ok_q)}  ( S.F = ${f(v.SF_q, 2)} )` },
      ])
      b.spacer()

      b.tableWithCaption(`<표 A.${4 + facs.length + i}> 검토 결과 요약 — ${facTitle(m, i)}`, {
        headerRows: [[H('검 토 항 목'), H('발  생  값'), H('허  용  값'), H('S.F'), H('판 정')]],
        rows: [
          ['내압 응력 (상시)', R(`σt  = ${f(v.sigma_t, 2)} MPa`), R(`σa  = ${fInt(v.allow_t)} MPa`), C(f(v.SF_t, 2)), C(ok(v.ok_t))],
          v.Psurge != null
            ? ['내압 응력 (일시)', R(`σt′ = ${f(v.sigma_ts, 2)} MPa`), R(`σa′ = ${fInt(v.allow_ts)} MPa`), C(f(v.SF_ts, 2)), C(ok(v.ok_t))]
            : ['내압 응력 (일시)', R('미적용'), R(`σa′ = ${fInt(v.allow_ts) === DASH ? '210' : fInt(v.allow_ts)} MPa`), C(DASH), C('미적용')],
          ['외압 휨응력', R(`σb  = ${f(v.sigma_b, 2)} MPa`), R(`σa  = ${fInt(v.allow_b)} MPa`), C(f(v.SF_b, 2)), C(ok(v.ok_b))],
          ['원주방향 변형률', R(`ε   = ${f(v.eps, 3)} %`), R(`εa  = ${f(v.epsA, 1)} %`), C(f(v.SF_eps, 2)), C(ok(v.ok_eps))],
          ['좌굴 (qa ≥ W)', R(`W   = ${f(v.Wtotal, 5)} kg/cm²`), R(`qa  = ${f(v.qa, 4)} kg/cm²`), C(f(v.SF_q, 2)), C(ok(v.ok_q))],
        ],
        weights: [1.6, 2, 2, 0.8, 0.8],
      })
    } else {
      b.note('※ 구조안전성 계산 결과가 없습니다. 해당 시설물의 구조검토를 먼저 실행하십시오.')
    }
    b.spacer()
  })

  // ══════════════════════════════════════════════════════
  // B. 관로 내진성능평가 계산서
  // ══════════════════════════════════════════════════════
  b.heading('B.  관로 내진성능평가 계산서')
  b.subheading('B.1  내진성능 우선순위 평가 (취약도지수) 계산서')
  b.eqBox([
    { label: '취약도지수', eq: 'VI = FLEX _{지수} times ( KIND _{지수} + EARTH _{지수} + SIZE _{지수} + CONNECT _{지수} + FACIL _{지수} + MCONE _{지수} )' },
    { label: '유연도비', eq: 'F = {2 E _{m} ( 1 - nu _{p} ^{2} ) R ^{3}} over {E _{p} ( 1 + nu _{m} ) t ^{3}}' },
    { text: '유연도지수 FLEX 는 유연도비 F 로부터 결정한다 : F 5 이하 → 10.0 / 5 이상 20 미만 → 8.0 / 20 이상 → 6.0 '
      + '[평가요령 해설표 3.4.2, 부록 A.1.3]' },
  ])
  b.spacer()

  facs.forEach((fx, i) => {
    const r = fx.p, m = fx.m
    b.sub(`○ ${facTitle(m, i)}`)
    if (!r) { b.note('※ 예비평가 결과가 없습니다.'); b.spacer(); return }
    b.calcRows([
      { label: '유연도비 F', expr: `Em = ${f(r.Em_MPa, 1)} MPa, νm = ${r.nu_m}, Ep = ${fInt(r.Ep_MPa)} MPa, νp = ${r.nu_p}, R = ${f(r.R_m, 3)} m, t = ${f(r.t_m, 4)} m`, value: f(r.F, 2) },
      { label: '취약도지수 VI', expr: `FLEX × Σ(세부지수) = ${f(r.FLEX, 1)} × ${f(r.VI_sub, 1)}`, value: f(r.VI, 1) },
      { label: '판정', expr: `지진도 ${r.seismicityGroup}그룹 / VI ${r.VI > 40 ? '>' : '≤'} 40`, value: r.isCritical ? '내진성능 중요상수도' : '내진성능 유보상수도' },
    ])
    b.tableWithCaption(`<표 B.${1 + i}> 취약도 세부지수 — ${facTitle(m, i)}`, {
      headerRows: [[H('취약도 지수'), H('적 용 근 거 및 선택 내용'), H('적용값')]],
      rows: [
        ['FLEX  (유연도)', `유연도비 F = ${f(r.F, 2)}  →  해설표 3.4.2`, C(f(r.FLEX, 1))],
        ['KIND  (관로 종류)', meta(m, 'pipeMark') + ' → 「강관 및 주철관」', C(f(r.KIND, 1))],
        ['EARTH (지반상태)', `지반종류 ${fx.pIn?.soilType ?? DASH}`, C(f(r.EARTH, 1))],
        ['SIZE  (관경)', `DN ${fInt(fx.pIn?.DN)}`, C(f(r.SIZE, 1))],
        ['CONNECT (이음부 상태)', String(fx.pIn?.connectCond ?? DASH), C(f(r.CONNECT, 1))],
        ['FACIL (주요시설물)', String(fx.pIn?.facilExists ?? DASH), C(f(r.FACIL, 1))],
        ['MCONE (이음부 처리)', String(fx.pIn?.mcone ?? DASH), C(f(r.MCONE, 1))],
      ],
      weights: [1.6, 4, 1],
    })
    b.spacer()
  })

  // B.2 산정식
  b.heading('B.2  내진성능 본평가 산정식')
  b.eqBox([
    { label: '내압에 의한 축 변형률', eq: 'epsilon _{i} = - nu {sigma _{theta}} over {E} , ~~ sigma _{theta} = {P ( D - t )} over {2 t}' },
    { label: '온도변화에 의한 축 변형률', eq: 'epsilon _{t} = alpha DELTA T' },
    { label: '차량하중에 의한 축 변형률', eq: 'epsilon _{o} = {sigma _{o}} over {E}' },
    { label: '부등침하에 의한 축 변형률', eq: 'epsilon _{d} = {M} over {Z E}' },
    { label: '지진에 의한 축 변형률', eq: 'epsilon _{x} = sqrt {epsilon _{L} ^{2} + epsilon _{B} ^{2}}' },
    { label: '지반 수평변위 (응답변위법)', eq: 'U _{h} = {2} over {pi ^{2}} S _{v} T _{s} cos ( {pi z} over {2 H} )' },
    { label: '허용 변형률 (국부좌굴)', eq: 'epsilon _{a} = {46 t} over {D}' },
  ])
  b.tableWithCaption('<표 B.0> 충격계수 (i) — 차량하중', {
    headerRows: [[H('토피 h (m)'), H('충격계수 i')]],
    rows: [[C('h < 1.5'), C('0.5')], [C('1.5 ≤ h ≤ 6.5'), C('0.65 − 0.1h')], [C('h > 6.5'), C('0')]],
    weights: [1, 1],
  })
  b.note('※ 근거 : 기존시설물(상수도) 내진성능 평가요령 해설표 5.3.4')
  b.spacer()

  // B.3 구간별 본평가
  b.heading('B.3  구간별 내진성능 본평가 계산서')
  facs.forEach((fx, i) => {
    const v = seismicView(fx), m = fx.m
    b.subheading(`B.3.${i + 1}  ${facTitle(m, i)}`)
    if (!v) { b.note('※ 상세평가 결과가 없습니다.'); b.spacer(); return }
    const d = fx.d
    b.calcRows([
      { label: '표층지반 특성치', expr: `TG = 4Σ(Hi/Vsi),  Ts = 1.25 TG`, value: `TG = ${f(d.TG, 3)} s / Ts = ${f(d.Ts, 3)} s` },
      { label: '속도응답스펙트럼', expr: 'Sv (기반면)', value: `${f(d.Sv, 4)} m/s` },
      { label: '지반 수평변위', expr: `Uh = (2/π²)·Sv·Ts·cos(πz/2H),  z = ${f(v.z, 3)} m`, value: `${f(d.Uh, 5)} m` },
      { label: '설계 파장', expr: 'L = 2L₁L₂/(L₁+L₂)', value: `${f(d.L, 2)} m` },
    ])
    b.tableWithCaption(`<표 B.${1 + facs.length + i}> 축방향 변형률 검토 — ${facTitle(m, i)}`, {
      headerRows: [[H('검 토 항 목'), H('발 생 변형률 (%)'), H('허용 변형률 (%)'), H('변형률비'), H('판 정')]],
      rows: [
        ['내압                εi', R(f(v.ei, 5)), C('-'), C('-'), C('-')],
        ['차량하중            εo', R(f(v.eo, 5)), C('-'), C('-'), C('-')],
        ['온도변화            εt', R(f(v.et, 5)), C('-'), C('-'), C('-')],
        ['부등침하            εd', R(f(v.ed, 5)), C('-'), C('-'), C('-')],
        ['지진시              εx', R(f(v.ex, 5)), C('-'), C('-'), C('-')],
        [{ text: '계                  Σε', bold: true }, R(f(v.total, 5)), R(f(v.allow, 4)), C(f(v.ratio, 3)), C(v.ok ? '만 족' : '불만족')],
      ],
      weights: [2, 1.4, 1.4, 1, 1],
    })
    b.spacer()
  })

  const name = '부록 - 구조안전성 및 내진성능평가 상세 계산서.hwpx'
  return { builder: b, name, title: '부록 - 구조안전성 및 내진성능평가 상세 계산서' }
}

export async function exportAppendixHwpx(args) {
  const { builder, name, title } = buildAppendix(args)
  await downloadHwpx(builder, name, { title })
  return name
}
