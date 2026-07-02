// ============================================================
// 구조안전성 검토 — HWPX(.hwpx) 생성 (아래한글 native 수식 포함)
// ============================================================
import { HwpxBuilder, downloadHwpx } from './hwpxCore.js'
import { fmtNum } from '../format'

const f = (v, u) => (v == null ? '—' : `${fmtNum(v)}${u ? ' ' + u : ''}`)
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

  const b = new HwpxBuilder()
  b.coverTitle('매설관로 구조안전성 검토서',
    isSteel ? '도복장강관 (KS D 3565) · KDS 57 10 00 : 2022' : '덕타일 주철관 (KS D 4311) · KDS 57 10 00 : 2022')
  b.infoTable([
    ['사업명', projectName || '—'],
    ['시설물명', facilityName || '—'],
    ['적용기준', 'KDS 57 10 00 : 2022 상수도 시설 설계기준 — 관로'],
    ['작성일', new Date().toLocaleDateString('ko-KR')],
  ])

  // 1. 검토 개요
  b.heading('1. 검토 개요')
  b.table({
    weights: [1, 3],
    rows: [
      [{ text: '관종', bold: true }, isSteel ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'],
      [{ text: '검토방법', bold: true }, isSteel
        ? '허용응력법(내압)/DIPRA 링휨/수정 Iowa 처짐/AWWA M11 외압좌굴'
        : '허용응력법(내압)/DIPRA 링휨/수정 Iowa 처짐'],
      [{ text: '공칭관경/외경', bold: true }, result.pipeDimManual ? `Do = ${Do} mm (직접입력)` : `DN ${result.DN} / Do = ${Do} mm`],
      [{ text: '채택 두께', bold: true }, `t = ${tAdopt} mm`],
      [{ text: '강도', bold: true }, isSteel ? `fy = ${fy} MPa` : 'fu = 420 MPa'],
    ],
  })
  b.spacer()

  // 2. 설계 하중
  b.heading('2. 관로 제원 및 설계 하중')
  b.table({
    weights: [1, 3],
    rows: [
      [{ text: '설계 운전압력 Pd', bold: true }, `${inputs.Pd} MPa`],
      [{ text: '관정 매설깊이 H', bold: true }, `${inputs.H} m`],
      [{ text: '흙 단위중량 γs', bold: true }, `${inputs.gammaSoil} kN/m³`],
      [{ text: "탄성지반반력 E'", bold: true }, `${inputs.Eprime} kPa`],
      [{ text: '차량하중', bold: true }, hasTraffic ? 'DB-24 적용 (KDS 24 12 20)' : '미적용'],
    ],
  })
  b.spacer()

  // 3. 하중 산정
  b.heading('3. 설계 하중 산정')
  b.equation('토피하중', 'W _{e} = gamma _{s} times H times D _{o}')
  if (hasTraffic) b.equation('차량하중', 'W _{L} = P _{L} times I _{F} times D _{o}')
  b.table({
    headers: ['항목', '값'],
    weights: [3, 1],
    rows: [
      ['토피하중 We', { text: f(s2?.We, 'kN/m'), align: 'right' }],
      ...(hasTraffic ? [['차량하중 WL', { text: f(sTraffic?.WL, 'kN/m'), align: 'right' }]] : []),
      [{ text: '합계 하중 Wtotal', bold: true }, { text: f(sTraffic?.Wtotal ?? s2?.We, 'kN/m'), align: 'right', bold: true }],
      ['단위압력 Ptotal', { text: f(sTraffic?.Ptotal ?? (s2?.We / (Do / 1000)), 'kPa'), align: 'right' }],
    ],
  })
  b.spacer()

  // 4. 내압
  b.heading('4. 내압 검토 (Barlow)')
  if (isSteel) {
    b.equation('후프응력', 'sigma _{h} = {P _{d} D _{o}} over {2 t}')
    b.equation('허용응력', 'sigma _{a,n} = 0.5 f _{y} , ~~ sigma _{a,s} = 0.75 f _{y}')
    b.table({
      headers: ['항목', '계산값', '허용값', '판정'], weights: [2, 1, 1, 1],
      rows: [
        ['상시 후프응력 σh', { text: f(s1?.sigma_normal, 'MPa'), align: 'right' }, { text: f(s1?.sigmaA_normal, 'MPa'), align: 'right' }, { text: ok(s1?.ok_normal), align: 'center' }],
        ['수격 후프응력 σh,s', { text: f(s1?.sigma_surge, 'MPa'), align: 'right' }, { text: f(s1?.sigmaA_surge, 'MPa'), align: 'right' }, { text: ok(s1?.ok_surge), align: 'center' }],
      ],
    })
  } else {
    b.equation('후프응력', 'sigma _{h} = {P _{d} D _{i}} over {2 t} , ~~ D _{i} = D _{o} - 2 t')
    b.equation('허용응력', 'sigma _{a} = {f _{u}} over {3} = 140 rm MPa')
    b.table({
      headers: ['항목', '계산값', '허용값', '판정'], weights: [2, 1, 1, 1],
      rows: [['후프응력 σh', { text: f(s1?.sigma_hoop, 'MPa'), align: 'right' }, { text: f(s1?.sigmaA_hoop, 'MPa'), align: 'right' }, { text: ok(s1?.ok), align: 'center' }]],
    })
  }
  b.spacer()

  // 5. 링 휨
  b.heading('5. 링 휨응력 검토 (DIPRA)')
  b.equation('링 휨응력', 'sigma _{b} = K _{b} {W _{total} D _{o}} over {t ^{2}}')
  b.table({
    headers: ['항목', '계산값', '허용값', '판정'], weights: [2, 1, 1, 1],
    rows: [['링 휨응력 σb', { text: f(s4?.sigma_b, 'MPa'), align: 'right' }, { text: f(s4?.sigmaA_bend, 'MPa'), align: 'right' }, { text: ok(s4?.ok), align: 'center' }]],
  })
  b.spacer()

  // 6. 처짐
  b.heading('6. 처짐 검토 (수정 Iowa)')
  b.equation('처짐율', isSteel
    ? "{DELTA y} over {D} = {D _{L} K _{x} P _{total}} over {{EI} over {r ^{3}} + 0.061 E '} times 100"
    : "{DELTA y} over {D} = {K _{d} P _{total}} over {{EI} over {r ^{3}} + 0.061 E '} times 100")
  b.table({
    headers: ['항목', '계산값', '허용값', '판정'], weights: [2, 1, 1, 1],
    rows: [['처짐율 Δy/D', { text: f(s5?.deflectionRatio, '%'), align: 'right' }, { text: f(s5?.maxDeflection, '%'), align: 'right' }, { text: ok(s5?.ok), align: 'center' }]],
  })
  b.spacer()

  // 7. 좌굴 (강관)
  if (isSteel && s6) {
    b.heading('7. 외압 좌굴 검토 (AWWA M11)')
    b.equation('좌굴압력', "P _{cr} = {1} over {FS} sqrt {32 R _{w} B ' E ' {EI} over {D _{o} ^{3}}}")
    b.equation('탄성토지지계수', "B ' = {1} over {1 + 4 e ^{-0.065 H / D}}")
    b.table({
      headers: ['항목', '계산값', '허용값', '판정'], weights: [2, 1, 1, 1],
      rows: [['좌굴 안전율 FS', { text: fmtNum(s6.bucklingFS_actual), align: 'right' }, { text: fmtNum(s6.FS_allow ?? 2.5), align: 'right' }, { text: ok(s6.ok), align: 'center' }]],
    })
    b.spacer()
  }

  // 종합 판정
  b.heading('종합 판정')
  const verdictItems = Object.entries(result.verdict).filter(([k]) => k !== 'overallOK')
  b.table({
    headers: ['검토 항목', '계산값', '허용값', '판정'], weights: [2, 1, 1, 1],
    rows: [
      ...verdictItems.map(([, it]) => [
        it.label,
        { text: `${typeof it.value === 'number' ? fmtNum(it.value) : it.value} ${it.unit ?? ''}`, align: 'right' },
        { text: it.allow != null ? `${typeof it.allow === 'number' ? fmtNum(it.allow) : it.allow} ${it.unit ?? ''}` : '—', align: 'right' },
        { text: ok(it.ok), align: 'center' },
      ]),
      [{ text: '종합 판정', bold: true, shade: true }, { text: '', shade: true }, { text: '', shade: true }, { text: ok(result.verdict.overallOK), align: 'center', bold: true, shade: true }],
    ],
  })

  const dn = result.pipeDimManual ? `D${Do}` : `DN${result.DN}`
  await downloadHwpx(b, `구조안전성검토_${dn}_${new Date().toISOString().slice(0, 10)}.hwpx`,
    { title: '매설관로 구조안전성 검토서' })
}
