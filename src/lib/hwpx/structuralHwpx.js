// ============================================================
// 구조안전성 검토 — HWPX(.hwpx) 생성
// PIPER PDF 출력물과 동일 구성: 검토개요 / 제원·하중 / 계산 수식 및 과정
// (수식박스 + 계산행) / 종합판정 / 최소관두께 / 각주
// 수식은 native 한글 수식 객체로 삽입 (한글 수식편집기에서 편집 가능)
// ============================================================
import { HwpxBuilder, downloadHwpx } from './hwpxCore.js'
import { fmtNum } from '../format'

const f = v => (v == null ? '—' : fmtNum(v))
const ok = b => (b ? 'O.K.' : 'N.G.')

export async function exportStructuralHwpx({ inputs, result, projectName, facilityName }) {
  const isSteel = result.pipeType === 'steel'
  const rs = result.steps
  const s1 = rs.step1
  const s2 = rs.step2
  const sTraffic = isSteel ? rs.step3 : rs.step2
  const s4 = isSteel ? rs.step4 : rs.step3
  const s5 = isSteel ? rs.step5 : rs.step4
  const s6 = isSteel ? rs.step6 : null
  const fy = result.fy ?? 235
  const Do = result.Do, tAdopt = result.tAdopt
  const hasTraffic = !!inputs.hasTraffic
  const isWm = (sTraffic?.trafficMethod ?? 'boussinesq') === 'wm'

  const b = new HwpxBuilder()

  // ── 표제부 ──
  b.coverTitle('매설관로 구조안전성 검토서',
    isSteel ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)')
  b.infoTable([
    ['사업명', projectName || '—'],
    ['시설물명', facilityName || '—'],
    ['적용기준', 'KDS 57 10 00 : 2022 상수도 시설 설계기준 — 관로'],
    ['작성일', new Date().toLocaleDateString('ko-KR')],
  ])

  // ── 1. 검토 개요 ──
  b.heading('1. 검토 개요')
  b.table({
    weights: [1.2, 3.8],
    rows: ([
      ['적용기준', 'KDS 57 10 00 : 2022 상수도 시설 설계기준'],
      ['검토방법', isSteel
        ? '허용응력법(내압) / 수정Iowa식(처짐) / DIPRA링휨 / AWWA M11 외압좌굴'
        : '허용응력법(내압) / DIPRA링휨 / 수정Iowa식(처짐)'],
      ['관종', isSteel ? `도복장강관 (KS D 3565)  fy = ${fy} MPa` : '덕타일 주철관 (KS D 4311)  fu = 420 MPa'],
      ...(isSteel && result.steelGrade ? [['강종', `${result.steelGrade} / fy = ${fy} MPa`]] : []),
      ...(result.pipeDimManual
        ? [['관 제원', `Do = ${Do} mm, t = ${tAdopt} mm [직접입력]`]]
        : [['공칭관경 / 외경', `DN ${result.DN} / Do = ${Do} mm`],
           ['채택 두께', `t = ${tAdopt} mm (${isSteel ? result.pnGrade : result.selectedGrade})`]]),
    ]).map(([k, v]) => [{ text: k, char: 'smallBold', shade: true }, { text: v, small: true }]),
  })
  b.spacer()

  // ── 2. 관로 제원 및 설계 하중 ──
  b.heading('2. 관로 제원 및 설계 하중')
  b.table({
    weights: [1.2, 3.8],
    rows: ([
      ['설계 운전압력 Pd', `${inputs.Pd} MPa`],
      ...(isSteel ? [['최대사용압력 (수격 포함)', `Pd × ${inputs.surgeRatio} = ${(inputs.Pd * inputs.surgeRatio).toFixed(3)} MPa  [압력등급 검토용]`]] : []),
      ['관정 매설깊이 H', `${inputs.H} m`],
      ['흙 단위중량 γ', `${inputs.gammaSoil} kN/m³`],
      ['차량하중', hasTraffic ? (isWm ? 'Wm 직접계산 (부록C 해설식 5.3.3)' : 'DB-24 적용 (KDS 24 12 20)') : '미적용'],
      ...(isSteel ? [['모르타르 라이닝', inputs.hasLining ? '적용 (허용처짐 3%)' : '미적용 (허용처짐 5%)']] : []),
      ["탄성지반반력 E'", `${inputs.Eprime} kPa`],
      ['침상 조건', isSteel ? (inputs.steelBeddingType ?? '-') : (inputs.beddingType ?? '-')],
      ...(isSteel ? [['지하수위', String(inputs.gwLevel ?? '-')]] : []),
    ]).map(([k, v]) => [{ text: k, char: 'smallBold', shade: true }, { text: v, small: true }]),
  })
  b.spacer()

  // ── 3. 계산 수식 및 과정 ──
  b.heading('3. 계산 수식 및 과정')

  // 3.1 하중 산정
  b.sub('3.1 하중 산정')
  b.eqBox([{ label: '① 토피하중 (Prism Load)', eq: 'W _{e} = gamma _{s} times H times D _{o}', text: '  [AWWA M11 Ch.5]' }])
  b.calcRows([
    { label: '흙 단위중량 γs', expr: '', value: `${inputs.gammaSoil} kN/m³` },
    { label: '매설깊이 H', expr: '', value: `${inputs.H} m` },
    { label: '외경 Do', expr: '', value: `${Do} mm` },
    { label: '토피하중 We', expr: `${inputs.gammaSoil} × ${inputs.H} × ${Do}/1000`, value: `${f(s2?.We)} kN/m` },
  ])
  if (hasTraffic) {
    b.eqBox([{ label: '② 차량하중', eq: isWm
      ? 'W _{m} = {2 P _{m} D _{o}} over {C ( a + 2 H tan 45 ^{circ} )} ( 1 + i )'
      : 'W _{L} = P _{L} times I _{F} times D _{o}',
      text: isWm ? '  [부록C 해설식 5.3.3]' : '  [KDS 24 12 20]' }])
    b.calcRows(isWm ? [
      { label: '충격계수 i', expr: 'H에 따른 해설표 5.3.4', value: f(sTraffic?.IF) },
      { label: '차량하중 Wm', expr: '2·Pm·Do/(C(a+2H·tan45°))·(1+i)', value: `${f(sTraffic?.WL)} kN/m` },
    ] : [
      { label: 'Boussinesq 분산압 PLraw', expr: 'DB-24 테이블 보간', value: `${f(sTraffic?.PLraw)} kPa` },
      { label: '충격계수 IF', expr: 'H에 따른 테이블값', value: f(sTraffic?.IF) },
      { label: '설계 차량압력 PL', expr: `PLraw × IF = ${f(sTraffic?.PLraw)} × ${f(sTraffic?.IF)}`, value: `${f(sTraffic?.PL)} kPa` },
      { label: '차량하중 WL', expr: `PL × Do/1000 = ${f(sTraffic?.PL)} × ${Do}/1000`, value: `${f(sTraffic?.WL)} kN/m` },
    ])
  }
  b.calcRows([
    { label: '합계 하중 Wtotal', expr: `We + WL = ${f(s2?.We)} + ${f(sTraffic?.WL ?? 0)}`, value: `${f(sTraffic?.Wtotal ?? s2?.We)} kN/m` },
    { label: '단위압력 Ptotal', expr: 'Wtotal / (Do/1000)', value: `${f(sTraffic?.Ptotal ?? ((s2?.We ?? 0) / (Do / 1000)))} kPa` },
  ])

  // 3.2 내압 검토
  b.sub(`3.2 내압 검토 (후프응력, Barlow 공식)`)
  if (isSteel) {
    b.eqBox([
      { label: '강관 Barlow 공식', text: '[AWWA M11 Eq.3-1 / KS D 3565]' },
      { eq: 'sigma _{h} = {P _{d} times D _{o}} over {2 t} ~ rm { ( 상시 ) } , ~~ sigma _{a,n} = 0.50 f _{y}' },
    ])
    b.calcRows([
      { label: '설계수압 Pd', expr: '', value: `${inputs.Pd} MPa` },
      { label: '상시 후프응력 σh', expr: `Pd × Do / (2t) = ${inputs.Pd} × ${Do} / (2 × ${tAdopt})`, value: `${f(s1?.sigma_normal)} MPa` },
      { label: '허용응력 σa', expr: '참고표-4.2.5', value: `${f(s1?.sigmaA_normal)} MPa` },
      { label: '판정', expr: `${f(s1?.sigma_normal)} ≤ ${f(s1?.sigmaA_normal)}`, value: ok(s1?.ok_normal) },
    ])
  } else {
    b.eqBox([
      { label: '주철관 Di기반 Barlow 공식', text: '[KS D 4311 / DIPRA §2.1]' },
      { eq: 'sigma _{h} = {P _{d} times D _{i}} over {2 t} , ~~ D _{i} = D _{o} - 2 t , ~~ sigma _{a} = {f _{u}} over {3} = 140 rm MPa' },
    ])
    b.calcRows([
      { label: '내경 Di', expr: `Do − 2t = ${Do} − 2×${tAdopt}`, value: `${f(s1?.Di ?? Do - 2 * tAdopt)} mm` },
      { label: '후프응력 σh', expr: `Pd × Di / (2t)`, value: `${f(s1?.sigma_hoop)} MPa` },
      { label: '허용응력 σa', expr: 'fu/3 = 420/3', value: `${f(s1?.sigmaA_hoop)} MPa` },
      { label: '판정', expr: `${f(s1?.sigma_hoop)} ≤ ${f(s1?.sigmaA_hoop)}`, value: ok(s1?.ok) },
    ])
  }

  // 3.3 링 휨응력
  b.sub('3.3 링 휨응력 검토')
  b.eqBox([
    { label: '링휨 공식', text: `[${isSteel ? 'AWWA M11 §5.3' : 'DIPRA / AWWA C150'}]` },
    { eq: `sigma _{b} = K _{b} times {W _{total} times D _{o}} over {t ^{2}} , ~~ sigma _{a,b} = 0.50 f _{${isSteel ? 'y' : 'u'}}`, text: '  (단위: kN/m × mm / mm² = MPa)' },
  ])
  b.calcRows([
    { label: '침상계수 Kb', expr: `${isSteel ? (inputs.steelBeddingType ?? '') : (inputs.beddingType ?? '')} 기준`, value: f(s4?.Kb_steel ?? s4?.Kb) },
    { label: '합계 하중 Wtotal', expr: '토피하중 + 차량하중', value: `${f(s4?.Wtotal)} kN/m` },
    { label: '링 휨응력 σb', expr: `Kb × Wtotal × Do / t² = ${f(s4?.Kb_steel ?? s4?.Kb)} × ${f(s4?.Wtotal)} × ${Do} / ${tAdopt}²`, value: `${f(s4?.sigma_b)} MPa` },
    { label: '허용응력 σa,b', expr: isSteel ? `0.50 × ${fy}` : '0.50 × 420', value: `${f(s4?.sigmaA_bend)} MPa` },
    { label: '판정', expr: `${f(s4?.sigma_b)} ≤ ${f(s4?.sigmaA_bend)}`, value: ok(s4?.ok) },
  ])

  // 3.4 처짐
  b.sub('3.4 처짐 검토 (수정 Iowa식)')
  b.eqBox([
    { label: '수정 Iowa 공식', text: `[${isSteel ? 'AWWA M11 Eq.5-4' : 'AWWA C150'}]` },
    { eq: isSteel
      ? "{DELTA y} over {D} = {D _{L} times K _{x} times P _{total}} over {{EI} over {r ^{3}} + 0.061 E '} times 100 ~ ( % )"
      : "{DELTA y} over {D} = {K _{d} times P _{total}} over {{EI} over {r ^{3}} + 0.061 E '} times 100 ~ ( % )" },
    { eq: 'r = {D _{o} - t} over {2} , ~~ I = {t ^{3}} over {12} , ~~ EI = E _{pipe} times I' },
  ])
  b.calcRows([
    ...(isSteel ? [{ label: '처짐 지연계수 DL', expr: '(Deflection Lag Factor)', value: f(s5?.DL ?? 1.5) }] : []),
    { label: `처짐계수 K${isSteel ? 'x' : 'd'}`, expr: '침상조건 기준', value: f(s5?.K ?? s5?.Kd) },
    { label: '관 반경 r', expr: `(Do − t)/2 = (${Do} − ${tAdopt})/2 [m]`, value: `${f(s5?.r)} m` },
    { label: '단면2차모멘트 I', expr: `t³/12 = (${tAdopt}/1000)³/12`, value: `${s5?.I != null ? s5.I.toExponential(3) : '—'} m⁴/m` },
    { label: '관체 탄성계수 E', expr: isSteel ? 'Es = 206,000 MPa' : 'Edi = 160,000 MPa', value: `${isSteel ? '206,000' : '160,000'} MPa` },
    { label: 'EI', expr: 'E × 1000 × I [kN·m²/m]', value: `${f(s5?.EI)} kN·m²/m` },
    { label: "분모 (EI/r³ + 0.061E')", expr: `${f(s5?.EI_r3)} + 0.061 × ${inputs.Eprime}`, value: `${f(s5?.denominator)} kN/m²` },
    { label: '처짐율 Δy/D', expr: isSteel
      ? `DL × Kx × Ptotal / 분모 × 100`
      : `Kd × Ptotal / 분모 × 100`, value: `${f(s5?.deflectionRatio)} %` },
    { label: '허용 처짐율', expr: isSteel ? (inputs.hasLining ? '라이닝 적용' : '라이닝 없음') : 'DIPRA 기준', value: `${f(s5?.maxDeflection)} %` },
    { label: '판정', expr: `${f(s5?.deflectionRatio)} ≤ ${f(s5?.maxDeflection)}`, value: ok(s5?.ok) },
  ])

  // 3.5 좌굴 (강관)
  if (isSteel && s6) {
    b.sub('3.5 외압 좌굴 검토 (강관 전용)')
    b.eqBox([
      { label: 'AWWA M11 Eq.5-5', text: '[AWWA M11 좌굴식]' },
      { eq: "P _{cr} = {1} over {FS} sqrt {32 R _{w} B ' E ' {EI} over {D _{o} ^{3}}} ~~ ( FS = " + (s6.FS_allow ?? 2.5) + ' )' },
      { eq: "B ' = {1} over {1 + 4 e ^{-0.065 H / D}} ~ rm { ( 탄성토지지계수 ) }" },
    ])
    b.calcRows([
      { label: '지하수위 Rw', expr: `gwLevel = ${inputs.gwLevel}`, value: f(s6.Rw) },
      { label: 'H/Do', expr: `${inputs.H} / ${(Do / 1000).toFixed(3)}`, value: f(s6.HoverDo) },
      { label: "탄성토지지계수 B'", expr: `1 / (1 + 4e^(−0.065 × ${f(s6.HoverDo)}))`, value: f(s6.Bprime) },
      { label: 'EI/Do³', expr: 'EI / (Do/1000)³', value: `${f(s6.EI_Do3)} kN/m²` },
      { label: '이론 좌굴압력 Pcr,th', expr: `√(32 × ${f(s6.Rw)} × ${f(s6.Bprime)} × ${inputs.Eprime} × ${f(s6.EI_Do3)})`, value: `${f(s6.Pcr_theory)} kPa` },
      { label: '허용 좌굴압력 Pcr', expr: `Pcr,th / FS = ${f(s6.Pcr_theory)} / ${s6.FS_allow ?? 2.5}`, value: `${f(s6.Pcr)} kPa` },
      { label: '외압 Ptotal', expr: '= 합계 하중 단위압력', value: `${f(s6.Pe_ext)} kPa` },
      { label: '좌굴 안전율 FS', expr: `Pcr,th / Pe = ${f(s6.Pcr_theory)} / ${f(s6.Pe_ext)}`, value: f(s6.bucklingFS_actual) },
      { label: '판정', expr: `FS ${f(s6.bucklingFS_actual)} ≥ ${s6.FS_allow ?? 2.5}`, value: ok(s6.ok) },
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

  // ── 5. 최소관두께 (참고) ──
  b.heading('5. 최소관두께 검토 (참고)')
  b.note(isSteel
    ? '강관: 내압(Barlow), 취급(Do/288) 중 최댓값. 부식여유는 필요 시 별도 가산. 기준: AWWA M11 Eq.3-1 / KS D 3565'
    : '주철관: KS D 4311 Di기반 Barlow 역산(내압) + 링휨 역산(외압) 중 최댓값.')
  b.calcRows(isSteel ? [
    { label: '내압 최소두께 (상시)', expr: `Pd × Do / (2 × σa,n)`, value: `${f(s1?.tp_normal)} mm` },
    { label: '취급 최소두께', expr: `Do / 288 = ${Do} / 288`, value: `${f(s1?.tHandling)} mm` },
    { label: '소요 최소두께', expr: 'max(위 3가지) ※ 부식여유 별도 고려', value: `${f(result.tRequired)} mm` },
    { label: '채택 두께 t', expr: `${tAdopt} ${tAdopt >= (result.tRequired ?? 0) ? '≥' : '<'} ${f(result.tRequired)} mm`, value: ok(tAdopt >= (result.tRequired ?? 0)) },
  ] : [
    { label: '내압 최소두께', expr: 'Pd × Do / (2 × (σa + Pd))', value: `${f(s1?.tp_hoop)} mm` },
    { label: '외압(링휨) 최소두께', expr: '√(Kb × Wtotal × Do / σa,b)', value: `${f(s1?.tp_bend)} mm` },
    { label: '소요 최소두께', expr: 'max(tp_hoop, tp_bend)', value: `${f(result.tRequired)} mm` },
    { label: '채택 두께 t', expr: `${tAdopt} ${tAdopt >= (result.tRequired ?? 0) ? '≥' : '<'} ${f(result.tRequired)} mm`, value: ok(tAdopt >= (result.tRequired ?? 0)) },
  ])
  b.spacer()

  // ── 각주 ──
  b.note('※ 토피하중: Prism Load We = γs × H × Do [AWWA M11 Ch.5]')
  b.note('※ 차량하중: DB-24 + AASHTO Boussinesq 분산 + 충격계수 IF [KDS 24 12 20]')
  // Ⅰ. 현행 KDS 기준 적합성
  if (result?.kdsCompliance) {
    const kc = result.kdsCompliance
    const cv = kc.items.cover, gr = kc.items.grade
    b.note('※ [Ⅰ] 기준 적합성 검토 — 현행 KDS 57 10 00 : 2022')
    if (cv.applicable) {
      b.note(`   · 매설깊이 H = ${cv.H} m ≥ ${cv.H_min} m (${cv.basis}) [${cv.ref}] → ${cv.ok ? 'O.K.' : 'N.G.'}`)
    } else {
      b.note(`   · 매설깊이 — ${cv.note} [${cv.ref}]`)
    }
    b.note(`   · 최대사용압력 ${gr.Pmax.toFixed(3)} MPa ≤ ${gr.requiredGrade ?? '—'} 최대허용 ${gr.maxAllow ?? '—'} MPa [${gr.ref}] → ${gr.ok ? 'O.K.' : 'N.G.'}`)
    b.note('   ※ 현행 KDS는 관두께를 계산으로 규정하지 않고 KS·KWWA 인증 압력관 사용으로 갈음함 (해설편 p.543)')
  }
  if (result?.hoopAllowSource) b.note(`※ 내압 허용응력 근거: ${result.hoopAllowSource}`)
  b.note(`※ 적용 설계기준: ${result?.appliedCodeLabel ?? 'KDS 57 10 00 : 2022 / AWWA M11'}`)
  if (result?.appliedFormula) b.note(`※ 링휨 적용식: ${result.appliedFormula}`)
  if (result?.allowSource)    b.note(`※ 링휨 허용응력 근거: ${result.allowSource}`)
  b.note('※ 내압: 허용응력법 — σa는 상수도시설기준(2004) 참고표-4.2.5 강종별 고정값 [산정식: AWWA M11 Eq.3-1 / KS D 3565]')
  b.note('※ 링휨·처짐: DIPRA링휨 + 수정Iowa처짐 [DIPRA·AWWA C150 / AWWA M11 Eq.5-4]')
  if (isSteel) b.note('※ 외압좌굴: Modified AWWA M11 (강관 전용, FS = 2.5) [AWWA M11 좌굴식]')

  const dn = result.pipeDimManual ? `D${Do}` : `DN${result.DN}`
  await downloadHwpx(b, `구조안전성검토_${dn}_${new Date().toISOString().slice(0, 10)}.hwpx`,
    { title: '매설관로 구조안전성 검토서' })
}
