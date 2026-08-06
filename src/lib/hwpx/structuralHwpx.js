// ============================================================
// 구조안전성 검토 — HWPX(.hwpx) 생성
// 근거: 「시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서」
//       제11장 상수도 11.5.2 (11-132 ~ 11-138)
// 구성: 검토개요 / 제원·하중 / 계산 수식 및 과정 (수식박스 + 계산행)
//       / 종합판정 / 안전성평가 등급 / 각주
// 수식은 native 한글 수식 객체로 삽입 (한글 수식편집기에서 편집 가능)
//
// ※ 한글문서 작성 표준(CLAUDE.md) 준수:
//   heading() 자동 쪽 나눔 / subheading() 이어쓰기 / 표제목은 표 위
// ============================================================
import { HwpxBuilder, downloadHwpx } from './hwpxCore.js'
import { fmtNum } from '../format'
import {
  STEEL_ALLOW, STEEL_MAX_DEFLECTION, DI_COMBINED,
  EARTH_LOAD, TRAFFIC, GUIDE_LABEL,
} from '../../engine/constants.js'

const f = v => (v == null ? '—' : fmtNum(v))
const ok = b => (b ? 'O.K.' : 'N.G.')

export async function exportStructuralHwpx({ inputs, result, projectName, facilityName }) {
  const isSteel = result.pipeType === 'steel'
  const rs = result.steps
  const s1 = rs.step1
  const s2 = rs.step2
  const s3 = rs.step3
  const s4 = rs.step4
  const s5 = isSteel ? rs.step5 : null
  const Do = result.Do, tAdopt = result.tAdopt
  const hasTraffic = !!inputs.hasTraffic

  const b = new HwpxBuilder()

  // ── 표제부 ──
  b.coverTitle('매설관로 구조안전성 검토서',
    isSteel ? '수도용 도복장강관 (KS D 3565)' : '수도용 덕타일 주철관 (KS D 4311)')
  b.infoTable([
    ['사업명', projectName || '—'],
    ['시설물명', facilityName || '—'],
    ['적용기준', '시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서'],
    ['', '제11장 상수도 11.5.2 안전성평가 기준'],
    ['작성일', new Date().toLocaleDateString('ko-KR')],
  ])

  // ── 1. 검토 개요 ──
  b.heading('1. 검토 개요')
  b.table({
    weights: [1.2, 3.8],
    rows: ([
      ['적용기준', GUIDE_LABEL],
      ['검토방법', isSteel
        ? '허용응력설계법 — 내압 / 외압 휨응력 / 변형률 / 좌굴하중'
        : '허용응력설계법 — 복합 인장응력 (2.5σts + 2.0σtd + 1.4σb < S)'],
      ['관종', isSteel
        ? '수도용 도복장강관 (KS D 3565), STWW 400'
        : `수도용 덕타일 주철관 (KS D 4311), GCD400  S = ${DI_COMBINED.S} MPa`],
      ...(result.pipeDimManual
        ? [['관 제원', `D = ${Do} mm, t = ${tAdopt} mm [직접입력]`]]
        : [['공칭관경 / 외경', `DN ${result.DN} / D = ${Do} mm`],
           ['기준 관두께', `${f(result.tStandard)} mm (${isSteel ? result.pnGrade : result.selectedGrade})`]]),
      ...(result.hasMeasured ? [['실측 최소 관두께', `${f(result.tMeasured)} mm (관 상세검사)`]] : []),
      ['적용 관두께', `t = ${tAdopt} mm — ${result.thicknessGoverned === 'measured'
        ? '실측 최소값 적용' : '기준 두께 적용' + (result.hasMeasured ? '' : ' (실측값 미입력)')}`],
    ]).map(([k, v]) => [{ text: k, char: 'smallBold', shade: true }, { text: v, small: true }]),
  })
  b.note('※ 관두께는 관 상세검사에서 측정된 구간별 최소 관두께와 관경별 기준 관두께 가운데 '
       + '작은 값을 적용한다. [세부지침 11-134]')
  b.spacer()

  // ── 2. 관로 제원 및 작용 하중 ──
  b.heading('2. 관로 제원 및 작용 하중')
  b.table({
    weights: [1.2, 3.8],
    rows: ([
      ['정수압 P', `${inputs.Pd} MPa`],
      ['압력 구간', result.pressureZone === 'pumped'
        ? '가압구간 — 수격압(정수압 이상 상승압력) 적용'
        : '자연유하 구간 — 정수압 적용'],
      ...(result.pressureZone === 'pumped' ? [['수격압 P′', `${f(s1?.Psurge)} MPa`]] : []),
      ['관정 매설깊이 H', `${inputs.H} m`],
      ['흙의 단위중량 γt', `${s2?.gammaSoil_kgfcm3 ?? EARTH_LOAD.gamma_t} kg/cm³`],
      ['내부마찰각 φ′ = φ', `${EARTH_LOAD.phi_deg}°  (kμ′ = ${EARTH_LOAD.kmu.toFixed(5)})`],
      ['굴착부 폭 B', `2D + 100 = ${f(s2?.B_cm)} cm`],
      ['차량하중', hasTraffic ? `적용 — DB-24, Kögler 분산각 ${TRAFFIC.theta}°` : '미적용'],
      ...(isSteel ? [["흙 반력계수 E′", `${f(s3?.Ep)} kg/cm²`]] : []),
      ['기초지지각', s3?.beddingLabel ?? '—'],
      ...(isSteel ? [['부력계수 Rw', `${f(s5?.Rw)}${s5?.rwIsGuideline ? ' (세부지침 제시값)' : ' — 안전측 보정값'}`]] : []),
      ['주부재 손상(단면손실)', result.hasSectionLoss ? '있음' : '없음'],
    ]).map(([k, v]) => [{ text: k, char: 'smallBold', shade: true }, { text: v, small: true }]),
  })
  b.spacer()

  // ── 3. 계산 수식 및 과정 ──
  b.heading('3. 계산 수식 및 과정')

  // 3.1 작용 하중 (외압)
  b.subheading('3.1 작용 하중 (외압) — 세부지침 11-134')
  b.eqBox([
    { label: '① 상부 토압', text: '  [매설깊이에 따라 연직토압 / Marston 분기]' },
    { eq: 'W _{v} = gamma _{t} cdot H ~~~~ ( H <= 2.0 rm m )' },
    { eq: 'W _{v} = C _{d} cdot gamma _{t} cdot B ~~~~ ( H > 2.0 rm m )' },
    { eq: "C _{d} = {1 - e ^{( -2 k mu ' H / B )}} over {2 k mu '}" },
  ])
  b.calcRows([
    { label: '흙의 단위중량 γt', expr: '', value: `${s2?.gammaSoil_kgfcm3 ?? EARTH_LOAD.gamma_t} kg/cm³` },
    { label: '매설깊이 H', expr: '', value: `${inputs.H} m = ${(inputs.H * 100).toFixed(1)} cm` },
    { label: '굴착부 폭 B', expr: `2D + 100 = 2×${(Do / 10).toFixed(1)} + 100`, value: `${f(s2?.B_cm)} cm` },
    { label: "토압계수 kμ′", expr: `k=(1−sinφ)/(1+sinφ), μ′=tanφ′, φ=${EARTH_LOAD.phi_deg}°`, value: f(s2?.kmu) },
    ...(s2?.earthMethod === 'marston'
      ? [{ label: 'Marston 토압계수 Cd', expr: `[1 − e^(−2kμ′H/B)] / (2kμ′)`, value: f(s2?.Cd) }]
      : []),
    { label: '상부 토압 Wv', expr: s2?.earthMethod === 'marston' ? 'Cd × γt × B' : 'γt × H', value: `${f(s2?.[isSteel ? 'Wv' : 'Wf'])} kg/cm²` },
  ])

  if (hasTraffic) {
    b.eqBox([
      { label: '② 노면하중', text: '  [인접 후륜의 단축하중과 분포각 고려]' },
      { eq: 'W _{t} = {2 n P ( 1 + i )} over {LEFT { n L + ( n - 1 ) C + b + 2 H tan theta RIGHT } ( a + 2 H tan theta )}' },
    ])
    b.calcRows([
      { label: '후륜하중 P', expr: 'DB-24', value: `${TRAFFIC.P} kg` },
      { label: '점유폭 차량 대수 n', expr: '', value: `${TRAFFIC.n}` },
      { label: '후륜 중심간격 L', expr: '', value: `${TRAFFIC.L_cm} cm` },
      { label: '인접차량 후륜 중심간격 C', expr: '', value: `${TRAFFIC.C_cm} cm` },
      { label: '차륜 접지폭 b / 차륜폭 a', expr: '', value: `${TRAFFIC.b_cm} / ${TRAFFIC.a_cm} cm` },
      { label: 'Kögler 분산각 θ', expr: '', value: `${TRAFFIC.theta}°` },
      { label: '충격계수 i', expr: 'H<1.5→0.5 / 1.5~6.5→0.65−0.10H / >6.5→0', value: f(s2?.impactFactor) },
      { label: '노면하중 Wt', expr: '2nP(1+i) / {[nL+(n−1)C+b+2H·tanθ]·(a+2H·tanθ)}', value: `${f(s2?.Wt)} kg/cm²` },
    ])
  }
  b.calcRows([
    { label: '합계 하중 W', expr: `Wv + Wt`, value: `${f(isSteel ? s2?.Wtotal : (s2?.Wf ?? 0) + (s2?.Wt ?? 0))} kg/cm²` },
  ])

  if (isSteel) {
    // 3.2 내압
    b.subheading('3.2 내압에 의한 관의 응력 — 세부지침 11-134')
    b.note('※ 내압 작용의 경우 외부 하중(노면하중, 토압 등)이 없는 조건으로 한다. [세부지침 11-134]')
    b.eqBox([
      { label: '내압에 의한 관의 응력' },
      { eq: 'sigma _{t} = {P cdot D} over {2 t}' },
    ])
    b.calcRows([
      { label: '정수압 P', expr: '', value: `${inputs.Pd} MPa` },
      { label: '내압응력 σt', expr: `P × D / (2t) = ${inputs.Pd} × ${Do} / (2 × ${tAdopt})`, value: `${f(s1?.sigma_t_static)} MPa` },
      { label: '허용응력 (상시)', expr: STEEL_ALLOW.source, value: `${STEEL_ALLOW.normal} MPa` },
      { label: '판정', expr: `${f(s1?.sigma_t_static)} ≤ ${STEEL_ALLOW.normal}`, value: ok(s1?.ok_static) },
      ...(s1?.isPumped ? [
        { label: '수격압 P′', expr: '정수압 이상 상승압력', value: `${f(s1?.Psurge)} MPa` },
        { label: "내압응력 σt′ (일시)", expr: `P′ × D / (2t)`, value: `${f(s1?.sigma_t_surge)} MPa` },
        { label: '허용응력 (일시)', expr: '상시 허용응력의 150%', value: `${STEEL_ALLOW.surge} MPa` },
        { label: '판정', expr: `${f(s1?.sigma_t_surge)} ≤ ${STEEL_ALLOW.surge}`, value: ok(s1?.ok_surge) },
      ] : []),
    ])

    // 3.3 외압 휨응력
    b.subheading('3.3 외압에 의한 원주방향 휨응력 — 세부지침 11-135')
    b.note('※ 외압 작용의 경우 관 내부의 수압이 없는 조건으로 한다. [세부지침 11-134]')
    b.eqBox([
      { label: '외압에 의한 관체의 원주방향 휨응력' },
      { eq: "sigma _{b} = {2} over {f z} ( W _{v} + W _{t} ) {K _{b} R ^{2} E I + ( 0.061 K _{b} - 0.083 K _{x} ) E ' R ^{5}} over {E I + 0.061 E ' R ^{3}}" },
      { eq: "f = 1.5 , ~~ z = {t ^{2}} over {6} , ~~ I = {t ^{3}} over {12} , ~~ R = {D} over {2} + t" },
    ])
    b.calcRows([
      { label: '휨모멘트계수 Kb', expr: s3?.beddingLabel ?? '', value: f(s3?.Kb) },
      { label: '변형계수 Kx', expr: '', value: f(s3?.Kx) },
      { label: '관 반경 R', expr: `D/2 + t = ${(Do / 20).toFixed(2)} + ${(tAdopt / 10).toFixed(2)}`, value: `${f(s3?.R)} cm` },
      { label: '단면2차모멘트 I', expr: `t³/12`, value: `${f(s3?.I)} cm³` },
      { label: '단면계수 z', expr: `t²/6`, value: `${f(s3?.Z)} cm²` },
      { label: '관체 탄성계수 E', expr: '세부지침 11-135', value: `2.1×10⁶ kg/cm²` },
      { label: "흙 반력계수 E′", expr: '세부지침 11-135', value: `${f(s3?.Ep)} kg/cm²` },
      { label: '휨응력 σb', expr: '위 식', value: `${f(s3?.sigma_b_kgf)} kg/cm² = ${f(s3?.sigma_b)} MPa` },
      { label: '허용응력', expr: STEEL_ALLOW.source, value: `${STEEL_ALLOW.normal} MPa` },
      { label: '판정', expr: `${f(s3?.sigma_b)} ≤ ${STEEL_ALLOW.normal}`, value: ok(s3?.ok) },
    ])

    // 3.4 변형률
    b.subheading('3.4 외압에 의한 원주방향 변형률 — 세부지침 11-136')
    b.eqBox([
      { label: '외압에 의한 관체의 원주방향 변형률' },
      { eq: "epsilon = {2 K _{x} ( W _{v} + W _{t} ) R ^{4}} over {E I + 0.061 E ' R ^{3}} times {1} over {D} times 100 ~ ( % )" },
    ])
    b.calcRows([
      { label: '변형량 Δx', expr: `2·Kx·W·R⁴ / (EI + 0.061E′R³)`, value: `${f(s4?.deltaX)} cm` },
      { label: '변형률 ε', expr: `Δx / D × 100`, value: `${f(s4?.deflectionRatio)} %` },
      { label: '허용 변형률', expr: '관경의 5% 미만 (라이닝 무관)', value: `${STEEL_MAX_DEFLECTION} %` },
      { label: '판정', expr: `${f(s4?.deflectionRatio)} < ${STEEL_MAX_DEFLECTION}`, value: ok(s4?.ok) },
    ])

    // 3.5 좌굴
    b.subheading('3.5 외압에 의한 좌굴하중 — 세부지침 11-136')
    b.eqBox([
      { label: '외압에 의한 관체의 좌굴하중' },
      { eq: "q _{a} = LEFT ( {1} over {FS} RIGHT ) LEFT ( 32 R _{w} B ' E ' {E I} over {D ^{3}} RIGHT ) ^{{1} over {2}}" },
      { eq: "B ' = 0.15 + 0.041 ( H / D ) , ~~ FS = 2.5 ~ ( H / D >= 2 ) , ~ 3.0 ~ ( H / D < 2 )" },
    ])
    b.calcRows([
      { label: 'H/D', expr: `${(inputs.H * 100).toFixed(1)} / ${(Do / 10).toFixed(1)}`, value: f(s5?.HoverD) },
      { label: '설계계수 FS', expr: s5 && s5.HoverD >= 2 ? 'H/D ≥ 2' : 'H/D < 2', value: f(s5?.FS) },
      { label: '부력계수 Rw', expr: s5?.rwIsGuideline ? '세부지침 제시값' : `지하수위 ${inputs.gwLevel} 보정`, value: f(s5?.Rw) },
      { label: "기초계수 B′", expr: `0.15 + 0.041 × ${f(s5?.HoverD)}`, value: f(s5?.Bprime) },
      { label: '허용 좌굴하중 qa', expr: `(1/FS)·√(32·Rw·B′·E′·EI/D³)`, value: `${f(s5?.qa)} kg/cm²` },
      { label: '작용 하중 W', expr: 'Wv + Wt', value: `${f(s5?.Wtotal)} kg/cm²` },
      { label: '판정', expr: `${f(s5?.Wtotal)} ≤ ${f(s5?.qa)}`, value: ok(s5?.ok) },
    ])
  } else {
    // ── 주철관: 조합응력 ──
    b.subheading('3.2 내압에 의한 인장응력 — 세부지침 11-137')
    b.eqBox([
      { label: '내압에 의한 인장응력' },
      { eq: "sigma _{ts} = {P cdot D} over {2 t} , ~~ sigma _{td} = {P ' cdot D} over {2 t}" },
    ])
    b.calcRows([
      { label: '내경 D', expr: `Do − 2t = ${Do} − 2×${tAdopt}`, value: `${f(result.Di)} mm` },
      { label: '정수압 인장응력 σts', expr: `P × D / (2t)`, value: `${f(s1?.sigma_ts)} MPa` },
      { label: '수격압 인장응력 σtd', expr: result.pressureZone === 'pumped'
        ? `(P′ − P) × D / (2t)` : '자연유하 구간 — 미적용', value: `${f(s1?.sigma_td)} MPa` },
    ])

    b.subheading('3.3 외압에 의한 휨응력 — 세부지침 11-137')
    b.eqBox([
      { label: '외압에 의한 휨응력' },
      { eq: 'sigma _{b} = {6 ( K _{f} times W _{f} + K _{t} times W _{t} ) R ^{2}} over {t ^{2}}' },
    ])
    b.calcRows([
      { label: '휨모멘트계수 Kf', expr: s3?.beddingLabel ?? '', value: f(s3?.Kf) },
      { label: '계수 Kt', expr: '', value: f(s3?.Kt) },
      { label: '관 반경 R', expr: `D/2`, value: `${f(s3?.R_cm)} cm` },
      { label: '휨응력 σb', expr: `6(Kf·Wf + Kt·Wt)R² / t²`, value: `${f(s3?.sigma_b_kgf)} kg/cm² = ${f(s3?.sigma_b)} MPa` },
    ])

    b.subheading('3.4 조합응력 검토 — 세부지침 11-137')
    b.eqBox([
      { label: '복합 인장응력 판정', text: '  [관재의 기준 인장강도를 만족하여야 한다]' },
      { eq: '2.5 sigma _{ts} + 2.0 sigma _{td} + 1.4 sigma _{b} < S' },
    ])
    b.calcRows([
      { label: '2.5 × σts', expr: `2.5 × ${f(s4?.sigma_ts)}`, value: `${f((s4?.sigma_ts ?? 0) * 2.5)} MPa` },
      { label: '2.0 × σtd', expr: `2.0 × ${f(s4?.sigma_td)}`, value: `${f((s4?.sigma_td ?? 0) * 2.0)} MPa` },
      { label: '1.4 × σb', expr: `1.4 × ${f(s4?.sigma_b)}`, value: `${f((s4?.sigma_b ?? 0) * 1.4)} MPa` },
      { label: '조합 인장응력', expr: '합계', value: `${f(s4?.demand)} MPa` },
      { label: '기준 인장강도 S', expr: 'GCD400 (KS D 4311)', value: `${DI_COMBINED.S} MPa` },
      { label: '판정', expr: `${f(s4?.demand)} < ${DI_COMBINED.S}`, value: ok(s4?.ok) },
    ])
  }

  // ── 4. 종합 판정 ──
  b.heading('4. 구조안전성 검토 결과')
  const verdictItems = Object.entries(result.verdict).filter(([k]) => k !== 'overallOK')
  b.table({
    headers: [
      { text: '검토 항목', small: true }, { text: '계산값', small: true },
      { text: '허용값', small: true }, { text: '판정', small: true }],
    weights: [2.2, 1.3, 1.3, 0.8],
    rows: [
      ...verdictItems.map(([, it]) => [
        { text: it.label, small: true },
        { text: `${typeof it.value === 'number' ? fmtNum(it.value) : it.value} ${it.unit ?? ''}`.trim(), char: 'smallBold', align: 'right' },
        { text: it.allow != null ? `${typeof it.allow === 'number' ? fmtNum(it.allow) : it.allow} ${it.unit ?? ''}`.trim() : '—', small: true, align: 'right' },
        { text: ok(it.ok), char: 'smallBold', align: 'center' },
      ]),
      [
        { text: '종합 판정', char: 'smallBold', shade: true },
        { text: '', shade: true }, { text: '', shade: true },
        { text: ok(result.verdict.overallOK), char: 'smallBold', align: 'center', shade: true },
      ],
    ],
  })
  b.spacer()

  // ── 5. 안전성평가 등급 ──
  b.heading('5. 안전성평가')
  b.note('※ 허용응력설계법 : SF = 허용응력 / 발생응력  [세부지침 11-133 표 11.74]')
  b.calcRows([
    { label: '안전율 SF', expr: '검토항목 중 최솟값', value: Number.isFinite(result.SF) ? fmtNum(result.SF) : '—' },
    { label: '주부재 손상(단면손실)', expr: '', value: result.hasSectionLoss ? '있음' : '없음' },
    { label: '안전성평가 기준', expr: result.safetyGrade?.desc ?? '', value: result.safetyGrade?.grade ?? '—' },
    { label: '평가 점수', expr: '', value: String(result.safetyGrade?.score ?? '—') },
  ])
  b.spacer()

  // ── 각주 ──
  b.note(`※ 적용 기준: ${result.appliedCodeLabel}`)
  b.note(`※ 적용식: ${result.appliedFormula}`)
  b.note(`※ 허용기준 근거: ${result.allowSource}`)
  b.note('※ 관로의 안전성검토 식은「상수도시설기준, 환경부」에 제시된 식의 사용을 원칙으로 한다. [세부지침 11-133]')
  b.note('※ 구조안전성 계산은 구조적으로 가장 불리한 상황을 반영하기 위해, 외압 작용의 경우 관 내부의 '
       + '수압이 없는 조건으로 하고 내압 작용의 경우 외부 하중이 없는 조건으로 한다. [세부지침 11-134]')

  // 현행 KDS 기준 적합성 (구조계산과 별개 축)
  if (result?.kdsCompliance) {
    const kc = result.kdsCompliance
    const cv = kc.items.cover, gr = kc.items.grade
    b.note('')
    b.note('※ [참고] 매설깊이·압력등급 기준 적합성 — 현행 KDS 57 10 00 : 2022')
    if (cv.applicable) {
      b.note(`   · 매설깊이 H = ${cv.H} m ≥ ${cv.H_min} m (${cv.basis}) [${cv.ref}] → ${cv.ok ? 'O.K.' : 'N.G.'}`)
    } else {
      b.note(`   · 매설깊이 — ${cv.note} [${cv.ref}]`)
    }
    if (gr?.Pmax != null) {
      b.note(`   · 최대사용압력 ${gr.Pmax.toFixed(3)} MPa ≤ ${gr.requiredGrade ?? '—'} 최대허용 ${gr.maxAllow ?? '—'} MPa [${gr.ref}] → ${gr.ok ? 'O.K.' : 'N.G.'}`)
    }
    b.note('   ※ 현행 KDS 57 계열에는 매설관 구조계산 규정이 없으며, 구조검토 근거는 세부지침에 따른다.')
  }

  const dn = result.pipeDimManual ? `D${Do}` : `DN${result.DN}`
  await downloadHwpx(b, `구조안전성검토_${dn}_${new Date().toISOString().slice(0, 10)}.hwpx`,
    { title: '매설관로 구조안전성 검토서' })
}
