// ============================================================
// 내진성능 평가 — HWPX(.hwpx) 생성 (아래한글 native 수식 포함)
// 상세평가(분절관/연속관) + 예비평가
// ============================================================
import { HwpxBuilder, downloadHwpx } from './hwpxCore.js'
import { fmtNum } from '../format'

const f = (v, u) => (v == null ? '—' : `${fmtNum(v)}${u ? ' ' + u : ''}`)
const ok = b => (b ? 'O.K.' : 'N.G.')

// ── 상세평가 ──────────────────────────────────────────────
export async function exportSeismicDetailHwpx({ inp, rs, projectName, facilityName }) {
  const isSeg = inp.pipeType === 'segmented'
  const b = new HwpxBuilder()
  b.coverTitle(
    isSeg ? '매설관로 내진성능 본평가 검토서 (분절관)' : '매설관로 내진성능 본평가 검토서 (연속관)',
    (isSeg ? '덕타일 주철관 (KS D 4311)' : '도복장강관 (KS D 3565)') + ' · 응답변위법 · KDS 57 17 00')
  b.infoTable([
    ['사업명', projectName || '—'],
    ['시설물명', facilityName || '—'],
    ['적용기준', 'KDS 57 17 00 : 2022 / 기존시설물(상수도) 내진성능 평가요령 부록 C'],
    ['작성일', new Date().toLocaleDateString('ko-KR')],
  ])

  // 1. 지진·지반 조건
  b.heading('1. 지진 및 지반 조건')
  b.table({
    weights: [1, 1, 1, 1],
    rows: [
      [{ text: '지진구역계수 Z', bold: true }, f(rs.Z), { text: '위험도계수 I', bold: true }, f(rs.I_collapse)],
      [{ text: '유효지반가속도 S', bold: true }, f(rs.S, 'g'), { text: '표층두께 H', bold: true }, f(rs.H_effective, 'm')],
      [{ text: '지반주기 TG', bold: true }, f(rs.TG, 's'), { text: '설계주기 Ts', bold: true }, f(rs.Ts, 's')],
      [{ text: '평균전단파 VDS', bold: true }, f(rs.Vds, 'm/s'), { text: '기반암 VBS', bold: true }, f(inp.Vbs, 'm/s')],
    ],
  })
  b.spacer()

  // 2. 설계응답스펙트럼·지반변위
  b.heading('2. 설계응답스펙트럼 및 지반변위')
  b.equation('지반 특성주기', 'T _{G} = 4 SIGMA ( H _{i} / Vs _{i} ) , ~~ T _{s} = 1.25 T _{G}')
  b.equation('속도응답스펙트럼', 'S _{v} = S _{a} times g times {T _{s}} over {2 pi} times C _{D}')
  b.equation('수평 지반변위', 'U _{h} = {2} over {pi ^{2}} S _{v} T _{s} cos ( {pi z} over {2 H} )')
  b.equation('설계 파장', 'L = {2 L _{1} L _{2}} over {L _{1} + L _{2}}')
  b.table({
    headers: ['항목', '값'], weights: [3, 1],
    rows: [
      ['속도응답스펙트럼 Sv', { text: f(rs.Sv, 'm/s'), align: 'right' }],
      ['수평 지반변위 Uh', { text: f(rs.Uh, 'm'), align: 'right' }],
      ['설계 파장 L', { text: f(rs.L, 'm'), align: 'right' }],
    ],
  })
  b.spacer()

  if (isSeg) {
    // 3. 관체 응력 (분절관)
    b.heading('3. 관체 응력 검토')
    b.equation('내압 축응력', 'sigma _{i} = nu {P ( D - t )} over {2 t}')
    b.equation('지진 합성응력', "sigma _{x} = sqrt {( xi _{1} sigma _{L} ) ^{2} + ( xi _{2} sigma _{B} ) ^{2}}")
    b.equation('보정계수', 'xi _{1} , xi _{2} : ~ 해석해 (탄성지반 위 자유단 봉/보 모델)')
    b.table({
      headers: ['항목', '계산값', '허용값', '판정'], weights: [2, 1, 1, 1],
      rows: [
        ['내압 축응력 σi', { text: f(rs.sigma_i, 'MPa'), align: 'right' }, { text: '', align: 'right' }, { text: '', align: 'center' }],
        ['지진 합성응력 σx', { text: f(rs.sigma_x, 'MPa'), align: 'right' }, { text: '', align: 'right' }, { text: '', align: 'center' }],
        [{ text: '관체 응력 합계 σtotal', bold: true }, { text: f(rs.sigma_total, 'MPa'), align: 'right', bold: true }, { text: f(rs.sigma_allow, 'MPa'), align: 'right' }, { text: ok(rs.stressOK), align: 'center' }],
      ],
    })
    b.spacer()

    // 4. 이음부 신축량
    b.heading('4. 이음부 신축량 검토')
    b.equation('지진시 신축량', '| u _{J} | = u _{0} times u _{J}^{*} , ~~ u _{0} = a _{1} U _{a}')
    b.table({
      headers: ['항목', '계산값', '허용값', '판정'], weights: [2, 1, 1, 1],
      rows: [
        [{ text: '이음부 신축량 합계 etotal', bold: true }, { text: f((rs.e_total ?? rs.u_J) * 1000, 'mm'), align: 'right', bold: true }, { text: f((rs.e_allow ?? rs.u_allow) * 1000, 'mm'), align: 'right' }, { text: ok(rs.dispOK), align: 'center' }],
      ],
    })
    b.spacer()
  } else {
    // 3. 축변형률 (연속관)
    b.heading('3. 관체 축변형률 검토')
    b.equation('허용변형률', 'epsilon _{a} = {46 t} over {D} ~ [%]')
    b.equation('지반 변형률', 'epsilon _{G} = {pi U _{h}} over {L}')
    b.equation('지진 합성변형률', 'epsilon _{x} = sqrt {epsilon _{L} ^{2} + epsilon _{B} ^{2}}')
    b.table({
      headers: ['항목', '계산값', '허용값', '판정'], weights: [2, 1, 1, 1],
      rows: [
        [{ text: '축변형률 합계 εtotal', bold: true }, { text: f(rs.epsilon_total * 100, '%'), align: 'right', bold: true }, { text: f(rs.epsilon_allow * 100, '%'), align: 'right' }, { text: ok(rs.strainOK), align: 'center' }],
      ],
    })
    b.spacer()
  }

  // 종합 판정
  b.heading('종합 내진안전성 판정')
  b.table({
    headers: ['검토 항목', '판정'], weights: [4, 1],
    rows: [
      ...(isSeg
        ? [['관체 축응력', { text: ok(rs.stressOK), align: 'center' }], ['이음부 신축량', { text: ok(rs.dispOK), align: 'center' }]]
        : [['축변형률 합계', { text: ok(rs.strainOK), align: 'center' }]]),
      [{ text: '종합 판정', bold: true, shade: true }, { text: ok(rs.ok), align: 'center', bold: true, shade: true }],
    ],
  })

  await downloadHwpx(b, `내진본평가_${isSeg ? '분절관' : '연속관'}_DN${inp.DN}_${new Date().toISOString().slice(0, 10)}.hwpx`,
    { title: '매설관로 내진성능 본평가 검토서' })
}

// ── 예비평가 ──────────────────────────────────────────────
export async function exportSeismicPrelimHwpx({ inp, r, indexLabels, projectName, facilityName }) {
  const b = new HwpxBuilder()
  b.coverTitle('매설관로 내진성능 예비평가 검토서',
    '내진성능 우선순위 평가 (취약도지수 VI) · 평가요령 부록 A')
  b.infoTable([
    ['사업명', projectName || '—'],
    ['시설물명', facilityName || '—'],
    ['적용기준', '기존시설물(상수도) 내진성능 평가요령 부록 A'],
    ['작성일', new Date().toLocaleDateString('ko-KR')],
  ])

  b.heading('1. 평가 개요')
  b.table({
    weights: [1, 3],
    rows: [
      [{ text: '지진구역 / 권역', bold: true }, `구역 ${inp.zone} / ${inp.isUrban ? '도시권역' : '기타지역'}`],
      [{ text: '지반종류', bold: true }, inp.soilType],
      [{ text: '공칭관경 / 관두께', bold: true }, `DN ${inp.DN} / t = ${inp.thickness} mm`],
    ],
  })
  b.spacer()

  b.heading('2. 취약도지수 (VI) 산정')
  b.equation('취약도지수', 'VI = FLEX times ( KIND + EARTH + SIZE + CONNECT + FACIL + MCONE )')
  b.table({
    headers: ['지수 항목', '산정 기준', '지수값'], weights: [2, 3, 1],
    rows: [
      ['FLEX — 유연도지수', `D/t = ${r.ratio.toFixed(1)}`, { text: fmtNum(r.FLEX), align: 'right' }],
      ['KIND — 관종', indexLabels?.KIND ?? '', { text: fmtNum(r.KIND), align: 'right' }],
      ['EARTH — 지반상태', indexLabels?.EARTH ?? '', { text: fmtNum(r.EARTH), align: 'right' }],
      ['SIZE — 관경', indexLabels?.SIZE ?? '', { text: fmtNum(r.SIZE), align: 'right' }],
      ['CONNECT — 이음부', indexLabels?.CONNECT ?? '', { text: fmtNum(r.CONNECT), align: 'right' }],
      ['FACIL — 주요시설물', indexLabels?.FACIL ?? '', { text: fmtNum(r.FACIL), align: 'right' }],
      ['MCONE — 이음처리', indexLabels?.MCONE ?? '', { text: fmtNum(r.MCONE), align: 'right' }],
      [{ text: `VI = ${r.FLEX.toFixed(0)} × ${r.VI_sub.toFixed(1)}`, bold: true, shade: true }, { text: '', shade: true }, { text: fmtNum(r.VI), align: 'right', bold: true, shade: true }],
    ],
  })
  b.spacer()

  b.heading('3. 판정')
  b.table({
    weights: [1, 3],
    rows: [
      [{ text: '지진도 그룹', bold: true }, `${r.seismicityGroup}그룹 (${r.seismicityGroup === 1 ? '중점고려지역' : '관찰대상지역'})`],
      [{ text: '취약도지수 VI', bold: true }, `${r.VI.toFixed(1)} (${r.VI >= 40 ? '≥ 40' : '< 40'})`],
      [{ text: '최종 판정', bold: true, shade: true }, { text: r.isCritical ? '내진성능 중요상수도 → 상세평가 필요' : '내진성능 유보상수도 → 관찰 대상', shade: true }],
    ],
  })

  await downloadHwpx(b, `내진예비평가_DN${inp.DN}_${new Date().toISOString().slice(0, 10)}.hwpx`,
    { title: '매설관로 내진성능 예비평가 검토서' })
}
