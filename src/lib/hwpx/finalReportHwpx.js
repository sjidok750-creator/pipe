// ============================================================
// 최종보고서 「제3장 안전성 및 내진성능평가 결과」 HWPX 생성
//   서식 견본: templates/제3장 안전성 및 내진성능평가 결과.hwpx
//   근거     : 세부지침 11-133 ~ 11-138 / 기존시설물(상수도) 내진성능 평가요령
//   ※ 표 번호는 견본과 동일한 <표 p.1> ~ <표 p.20> 체계를 유지한다 (p = 표 번호 접두).
// ============================================================
import { HwpxBuilder, downloadHwpx } from './hwpxCore.js'
import {
  collectReportFacilities, structuralView, seismicView, segLabel,
  rowsInner, rowsOuter, rowsDeflBuckling, rowsStructuralSummary,
  rowsPrelim, rowsLiquefaction, rowsSeismicPoints, rowsSeismicResult,
  rowsSeismicSummary, rowsFacilityGrade, safetyAssessment,
  f, fInt, meta, DASH,
} from '../report/projectReport.js'
import { SEISMIC_ZONE, SOIL_TYPE } from '../../engine/seismicConstants.js'

const C = t => ({ text: t, align: 'center' })
const R = t => ({ text: t, align: 'right' })
const H = (t, colSpan, rowSpan) => ({ text: t, colSpan, rowSpan, align: 'center' })

export function buildFinalReport({ project, projectMeta }) {
  const pm = projectMeta ?? {}
  const P = pm.tablePrefix || '2.3'
  const CH = pm.chapterNo || '3'
  const T = n => `<표 ${P}.${n}>`
  const facs = collectReportFacilities(project)
  const b = new HwpxBuilder()

  // ── 표제 ────────────────────────────────────────────────
  b.coverTitle(`제${CH}장 안전성 및 내진성능평가 결과`, pm.projectTitle || '')
  b.infoTable([
    ['용역명', pm.projectTitle || DASH],
    ['개별시설물명', pm.facilityName || DASH],
    ['대상 관로', facs.map(x => `${meta(x.m, 'system')} ${segLabel(x.m)}`).join(' / ') || DASH],
    ['관종', pm.pipeKindText || DASH],
    ['작성일', new Date().toLocaleDateString('ko-KR')],
  ])

  // ── 3.1 개요 ────────────────────────────────────────────
  b.heading(`${CH}.1 개 요`)
  b.para(pm.overview || (
    '관로시설은 현장조사 및 시험 결과 등을 분석한 내용을 토대로 관로 안전 취약조건에 대해서 '
    + '매설관로의 구조안전성을 검토하고 내진성능평가를 수행하였다. '
    + `대상 관로는 ${facs.length}개 구간이며, 관종은 ${pm.pipeKindText || '수도용 도복장 강관(PEP, 용접이음)'} 이다.`))
  b.para('구조안전성 검토는 [시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서] '
    + '제11장 상수도 11.5.2에 제시된 산정식·허용기준 및 [표 11.74] 안전성평가기준을 적용하였으며, '
    + '내진성능평가는 [기존 시설물(상수도) 내진성능 평가요령]에 따라 수행하였다.')
  b.spacer()

  // ── 3.2 관로 구조안전성 검토 ────────────────────────────
  b.heading(`${CH}.2 관로 구조안전성 검토`)
  b.para('관로 구조안전성 검토는 관련 자료와 현장조사 결과 등을 근거하여 관 재질을 비롯하여 관경, 관두께, '
    + '관내수압, 기초지반의 상태, 차량하중, 토압 등의 항목이 적용된다.')
  b.para('내·외압에 대한 내하력은 내압의 경우 관로에 작용할 수 있는 최대정수압과 동수압 및 수격압을 고려하여 '
    + '적용하고, 외압의 경우 관로 종단도와 현장조사에 의해 확인된 매설깊이를 검토하여 적용한다.')
  b.spacer()

  b.subheading(`${CH}.2.1 ${pm.pipeKindText || '수도용 도복장 강관'}`)
  b.para('발생응력에 대한 허용기준은 세부지침 11-134 [해설 표 11.5.1]에 따라 상시하중(토압, 차량하중, 정수압)의 '
    + '경우 140 MPa(STWW 400) 이내, 일시하중(동수압 + 수격압)의 경우 210 MPa 이내를 적용한다.')
  b.spacer()

  b.sub('가. 구조안전성 산정 개요')
  b.para('외압 작용의 경우 관 내부의 수압이 없는 조건으로, 내압 작용의 경우 외부하중이 없는 조건으로 검토한다 '
    + '[세부지침 11-134 ②]. 관두께는 기준두께와 실측 최소두께 중 작은 값을 적용한다.')
  b.tableWithCaption(`${T(1)} ${pm.pipeKindText || '수도용 도복장 강관'}의 구조 안전성 허용기준`, {
    headerRows: [[H('구 분'), H('검토 항목'), H('작용 하중'), H('허용 기준'), H('하중 조건')]],
    rows: [
      [{ text: '내 압', align: 'center', rowSpan: 2 }, C('휨응력'), C('정수압'), C('140 MPa'), C('상시')],
      [C('휨응력'), C('동수압 + 수격압'), C('210 MPa'), C('일시')],
      [{ text: '외 압', align: 'center', rowSpan: 3 }, C('휨응력'), C('토압 + 차량하중'), C('140 MPa'), C('상시')],
      [C('관체 변형량'), C('토압 + 차량하중'), C('관경의 5 % 미만'), C('상시')],
      [C('좌굴하중'), C('토압 + 차량하중'), C('허용하중 qa ≥ 발생 외압 W'), C('상시')],
    ],
    weights: [1, 1.2, 1.6, 1.8, 0.9],
  })
  b.note('※ 근거 : 세부지침 11-134 [해설 표 11.5.1]')
  b.spacer()
  b.para(`산정식과 안전율의 정의는 산정근거와 함께 [부록 A.1]에 수록하였으며, 본 장에서는 단면별 적용조건과 산정 결과를 제시한다.`)
  b.spacer()

  // 나. 검토 단면
  b.sub('나. 구조안전성 검토 단면 선정')
  b.note(`※ ${T(2)} 관로구간별 현황 및 검토단면 선정은 구간분할·실측 조사자료를 근거로 별도 작성한다.`)
  b.tableWithCaption(`${T(3)} 구조안전성 검토 단면 현황`, {
    headerRows: [[
      H('관로 계통'), H('관로 구간'), H('세부 구간'), H('측점 (Sta.No)'), H('연장 (m)'),
      H('호칭경 (mm)'), H('기준두께 (mm)'), H('실측 최소 (mm)'), H('적용 두께 (mm)'), H('토피고 (m)'),
    ]],
    rows: facs.map(fx => {
      const v = structuralView(fx)
      return [
        C(meta(fx.m, 'system')), C(meta(fx.m, 'segment')), C(meta(fx.m, 'subSegment')),
        C(meta(fx.m, 'station')), R(meta(fx.m, 'lengthM')),
        R(fInt(v?.DN)), R(meta(fx.m, 'thickBase')), R(meta(fx.m, 'thickMeas')),
        R(f(v?.t, 1)), R(f(v?.H, 2)),
      ]
    }),
    weights: [1, 0.9, 0.8, 2, 1, 1, 1, 1.2, 1, 0.9],
  })
  b.spacer()

  b.tableWithCaption(`${T(4)} 구조안전성 검토 적용 하중 및 지반 조건`, {
    headerRows: [[H('구 분'), H('기 호'), H('단 위'), H('적 용 값'), H('적 용 근 거')]],
    rows: [
      ['강관 탄성계수', C('E'), C('kg/cm²'), R('2.1 × 10⁶'), '세부지침 11-135'],
      ['흙의 반력계수', C('E′'), C('kg/cm²'), R('28'), '세부지침 11-135·11-136'],
      ['흙의 단위중량', C('γt'), C('kg/cm³'), R('1.8 × 10⁻³'), '세부지침 11-134'],
      ['토압계수', C('kμ′'), C('-'), R('0.19245  (φ′ = φ = 30°)'), '세부지침 11-134'],
      ['굴착부 폭', C('B'), C('cm'), R('2D + 100  (D : 관 외경)'), '세부지침 11-134'],
      ['형상계수 (소성단면계수)', C('f'), C('-'), R('1.5'), '세부지침 11-135'],
      ['차량하중 (후륜 1륜)', C('P'), C('kg/륜'), R('9,600  (DB-24)'), '세부지침 11-134'],
      ['차량 제원', C('L/C/b/a'), C('cm'), R('175 / 100 / 50 / 20'), '세부지침 11-134'],
      ['하중 분포각', C('θ'), C('°'), R('45'), '세부지침 11-134'],
      ['좌굴 설계계수', C('FS'), C('-'), R('2.5 (H/D ≥ 2), 3.0 (H/D < 2)'), '세부지침 11-136'],
      ['허용응력 (상시 / 일시)', C('σa / σa′'), C('MPa'), R('140 / 210'), '세부지침 11-134 표 11.5.1'],
      ['허용 변형량', C('εa'), C('%'), R('관경(내경)의 5 미만'), '세부지침 11-134 표 11.5.1'],
    ],
    weights: [2, 1, 0.9, 2.4, 2],
  })
  b.spacer()

  // 다. 산정 결과
  b.sub('다. 구조안전성 산정 결과')
  b.tableWithCaption(`${T(5)} 내압에 의한 원주방향 응력 및 안전율 계산 결과`, {
    headerRows: [[
      H('관로 계통'), H('관로 구간'), H('세부 구간'), H('측점 (Sta.No)'), H('호칭경 (mm)'), H('관두께 (mm)'),
      H('설계압력 (MPa) 상시/일시'), H('발생 응력 (MPa) 상시/일시'), H('허용응력 (MPa) 상시/일시'),
      H('안전율 (SF) 상시/일시'), H('만족 여부'),
    ]],
    rows: rowsInner(facs).map(r => r.map((v, i) => (i >= 4 ? R(v) : C(v)))),
    weights: [1, 0.9, 0.8, 2, 1, 1, 1.4, 1.4, 1.3, 1.2, 1],
  })
  b.spacer()

  b.tableWithCaption(`${T(6)} 외압에 의한 원주방향 응력 및 안전율 계산 결과`, {
    headerRows: [[
      H('관로 계통'), H('관로 구간'), H('세부 구간'), H('측점 (Sta.No)'), H('관경 (mm)'), H('관두께 (mm)'),
      H('토피고 (m)'), H('토압 Wv (kg/cm²)'), H('차량하중 Wt (kg/cm²)'), H('총 연직하중 (kg/cm²)'),
      H('외압 휨응력 (MPa)'), H('허용응력 (MPa)'), H('안전율 (SF)'), H('만족 여부'),
    ]],
    rows: rowsOuter(facs).map(r => r.map((v, i) => (i >= 4 ? R(v) : C(v)))),
    weights: [1, 0.9, 0.8, 1.9, 0.9, 0.9, 0.9, 1.2, 1.2, 1.2, 1.1, 1, 0.9, 0.9],
  })
  b.spacer()

  b.tableWithCaption(`${T(7)} 관체 변형률 및 좌굴하중 안전성 검토 결과`, {
    headerRows: [
      [H('관로 계통', 1, 2), H('관로 구간', 1, 2), H('세부 구간', 1, 2), H('측점 (Sta.No)', 1, 2),
        H('관체 변형률 (편평률)', 4, 1), H('외압에 의한 좌굴 검토', 6, 1)],
      [H('Δx (cm)'), H('변형률 (%)'), H('허용 (%)'), H('만족 여부'),
        H('설계계수 (FS)'), H('기초계수 (B′)'), H('허용 좌굴하중 qa (kg/cm²)'), H('발생 외압 W (kg/cm²)'), H('안전율 (SF)'), H('만족 여부')],
    ],
    rows: rowsDeflBuckling(facs).map(r => r.map((v, i) => (i >= 4 ? R(v) : C(v)))),
    weights: [1, 0.9, 0.8, 1.9, 0.9, 0.9, 0.8, 0.9, 0.9, 0.9, 1.2, 1.2, 0.9, 0.9],
  })
  b.spacer()

  b.tableWithCaption(`${T(8)} 대상 관로 구조 안전성 검토 안전율 산정 결과`, {
    headerRows: [
      [H('관로 계통', 1, 2), H('구간 (세부)', 1, 2), H('위치 (Sta.No)', 1, 2), H('관경 (mm)', 1, 2),
        H('내압 작용', 2, 1), H('외압 작용', 7, 1), H('안전성 검토', 1, 2)],
      [H('발생 응력 (MPa)'), H('S.F'), H('발생 휨응력 (MPa)'), H('S.F'), H('발생 변형률 (%)'), H('S.F'),
        H('허용 좌굴 qa (kg/cm²)'), H('발생 외압 W (kg/cm²)'), H('S.F')],
    ],
    rows: rowsStructuralSummary(facs).map(r => r.map((v, i) => (i >= 3 && i <= 12 ? R(v) : C(v)))),
    weights: [1, 1, 1.8, 0.8, 1.1, 0.7, 1.1, 0.7, 1.1, 0.7, 1.2, 1.2, 0.7, 1.2],
  })
  b.spacer()

  // 결과 서술 (계산결과에서 자동 생성)
  const govs = facs.map(fx => structuralView(fx)).filter(Boolean)
  if (govs.length) {
    const allOk = govs.every(v => v.okAll)
    const sfB = govs.map(v => v.SF_b).filter(Number.isFinite)
    b.para(`○ 관로 구조안전성 검토 결과, ${govs.length}개 검토단면 ${allOk ? '모두' : '중 일부'}에서 `
      + '내압(정수압 및 수격압)과 외압(토압 + 노면하중)에 대한 발생응력·변형률·좌굴하중이 '
      + `세부지침 11-134 [해설 표 11.5.1]의 허용기준 ${allOk ? '이내로 산정되어 구조 안전성을 유지하고 있는 것으로 파악된다.' : '을 초과하는 항목이 확인되었다.'}`)
    if (sfB.length) {
      b.para(`○ 외압에 의한 휨응력의 안전율은 ${f(Math.min(...sfB), 2)} ~ ${f(Math.max(...sfB), 2)} 로 산정되었다.`)
    }
  }
  b.spacer()

  // ── 3.3 관로 내진성능 평가 ──────────────────────────────
  b.heading(`${CH}.3 관로 내진성능 평가`)
  b.subheading(`${CH}.3.1 내진성능 우선순위 평가`)
  b.para('매설관로의 취약도지수(VI)는 평가요령 해설식(3.4.1)에 따라 산정하며, 유연도지수(FLEX)는 '
    + '단면에 대한 유연도비 F 로부터 해설표 3.4.2를 적용하여 결정한다 [평가요령 부록 A.1.3].')
  b.equation('취약도지수', 'VI = FLEX _{지수} times ( KIND _{지수} + EARTH _{지수} + SIZE _{지수} + CONNECT _{지수} + FACIL _{지수} + MCONE _{지수} )')
  b.equation('유연도비', 'F = {2 E _{m} ( 1 - nu _{p} ^{2} ) R ^{3}} over {E _{p} ( 1 + nu _{m} ) t ^{3}}')
  b.note('※ F 5 이하 → FLEX 10.0 / 5 이상 20 미만 → 8.0 / 20 이상 → 6.0 [평가요령 해설표 3.4.2]')
  b.spacer()

  // 기준표 (고정) — 지진구역 / 지반분류 / 지진도 등급
  b.tableWithCaption(`${T(9)} 지진구역 구분표`, {
    headerRows: [[H('지진구역'), H('행정구역'), H('지진구역계수 Z')]],
    rows: [
      [C('Ⅰ'), SEISMIC_ZONE.I.label.replace(/^지진구역 Ⅰ \(|\)$/g, ''), C(String(SEISMIC_ZONE.I.Z))],
      [C('Ⅱ'), SEISMIC_ZONE.II.label.replace(/^지진구역 Ⅱ \(|\)$/g, ''), C(String(SEISMIC_ZONE.II.Z))],
    ],
    weights: [1, 6, 1.4],
  })
  b.note('※ 근거 : KDS 17 10 00 : 2019 §2.1.1 (평균재현주기 500년)')
  b.spacer()

  b.tableWithCaption(`${T(10)} 지반분류 체계`, {
    headerRows: [[H('지반 종류'), H('지반 특성'), H('기반암 깊이 H (m)'), H('전단파속도 Vs (m/s)')]],
    rows: Object.entries(SOIL_TYPE).map(([k, v]) => [
      C(k), v.label.replace(/^S\d — /, ''),
      C(k === 'S1' ? '< 1' : k === 'S2' || k === 'S3' ? '1 ~ 20' : k === 'S6' ? '부지고유' : '> 20'),
      C(v.Vs_min == null ? '—' : (k === 'S3' ? '< 260' : k === 'S5' ? '< 180' : `≥ ${v.Vs_min}`)),
    ]),
    weights: [1, 4, 1.6, 1.8],
  })
  b.note('※ 근거 : KDS 17 10 00 : 2019 §4 (지반분류)')
  b.spacer()

  b.tableWithCaption(`${T(11)} 지진도 등급 기준 [평가요령 해설표 3.4.1]`, {
    headerRows: [
      [H('지진구역', 1, 2), H('도시권역 구분', 1, 2), H('지반 분류', 4, 1)],
      [H('S1'), H('S2 · S4'), H('S3 · S5'), H('S6')],
    ],
    rows: [
      [{ text: 'Ⅰ', align: 'center', rowSpan: 2 }, C('도시지역'), C('1그룹'), C('1그룹'), C('1그룹'), C('1그룹')],
      [C('기타지역'), C('1그룹'), C('1그룹'), C('1그룹'), C('1그룹')],
      [{ text: 'Ⅱ', align: 'center', rowSpan: 2 }, C('도시지역'), C('2그룹'), C('2그룹'), C('1그룹'), C('1그룹')],
      [C('기타지역'), C('2그룹'), C('2그룹'), C('2그룹'), C('2그룹')],
    ],
    weights: [1, 1.6, 1, 1.2, 1.2, 1],
  })
  b.note('※ 1그룹 = 중점고려지역, 2그룹 = 관찰대상지역')
  b.spacer()

  // 채택 지반 조건 — 상세평가 입력(지층)에서 산정
  b.tableWithCaption(`${T(13)} 관로 계통별 적용(채택) 지반 조건`, {
    headerRows: [[
      H('관로 계통'), H('적용 시추주상도'), H('토층두께 H (m)'), H('평균 전단파속도 Vds (m/s)'),
      H('지반 종류'), H('지반 고유주기 TG (s)'), H('비선형 Ts (s)'),
    ]],
    rows: facs.map(fx => [
      C(meta(fx.m, 'system')), C(meta(fx.m, 'boring')),
      R(f(fx.d?.H_effective, 1)), R(f(fx.d?.Vds, 1)),
      C(fx.dIn?.soilType ?? DASH), R(f(fx.d?.TG, 3)), R(f(fx.d?.Ts, 3)),
    ]),
    weights: [1.2, 1.4, 1.2, 1.8, 1, 1.5, 1.2],
  })
  b.note(`※ ${T(12)} 시추주상도 판독결과는 지반조사 자료를 근거로 별도 작성한다 (본 프로그램 산정 대상 아님).`)
  b.spacer()

  b.tableWithCaption(`${T(14)} 관로 내진성능 우선순위평가 결과표`, {
    headerRows: [
      [H('관로 계통', 1, 2), H('관로 구간', 1, 2), H('관종', 1, 2), H('관경 (mm)', 1, 2),
        H('내진성능 예비평가', 6, 1), H('내진 그룹 결정', 1, 2)],
      [H('지진도 평가'), H('FLEX'), H('KIND'), H('EARTH'), H('SIZE / CONNECT / FACIL / MCONE'), H('취약도지수 VI')],
    ],
    rows: rowsPrelim(facs).map(r => r.map((v, i) => (i === 3 || (i >= 5 && i <= 9) ? R(v) : C(v)))),
    weights: [1, 1, 1.3, 0.9, 1.1, 0.8, 0.8, 0.9, 2.1, 1.1, 1.7],
  })
  const prelims = facs.map(fx => fx.p).filter(Boolean)
  if (prelims.length) {
    const vis = prelims.map(r => r.VI)
    const crit = prelims.filter(r => r.isCritical).length
    b.para(`○ 내진성능 우선순위 평가 결과, 취약도지수 VI 는 ${f(Math.min(...vis), 1)} ~ ${f(Math.max(...vis), 1)} 로 `
      + `산정되었으며 ${crit}개 계통이 판정기준 40 을 초과하여 [내진성능 중요상수도]로 분류된다 [평가요령 부록 그림 A.1.2].`)
  }
  b.spacer()

  // 3.3.2 액상화
  b.subheading(`${CH}.3.2 액상화 평가`)
  b.tableWithCaption(`${T(15)} 관로구간별 액상화 예비평가 생략조건 검토 결과`, {
    headerRows: [[
      H('관로 계통'), H('적용 시추주상도'), H('지하수위 (GL.−m)'), H('관 매설심도 z (m)'),
      H('토층두께 (m)'), H('토층 평균 Vs (m/s)'), H('지반 종류'), H('생략조건 충족 내용'), H('액상화 예비평가'),
    ]],
    rows: rowsLiquefaction(facs).map(r => r.map((v, i) => (i >= 2 && i <= 5 ? R(v) : C(v)))),
    weights: [1.3, 1.2, 1.2, 1.2, 1, 1.2, 0.9, 2.4, 1.1],
  })
  b.note('※ 생략조건 : ① 지하수위가 관 매설심도보다 깊은 경우  ④ 토층 평균 전단파속도 Vs ≥ 200 m/s')
  b.spacer()

  // 3.3.3 본평가
  b.subheading(`${CH}.3.3 내진성능 본평가`)
  b.para('연속관(용접이음 강관)의 내진성능은 응답변위법에 의한 일시적 지반변위에 대하여 축방향 변형률로 검토하며, '
    + '허용 변형률은 국부좌굴 개시변형률을 적용한다.')
  b.equation('허용 변형률', 'epsilon _{a} = {46 t} over {D}')
  b.para('하중조건별 축 변형률(내압·온도변화·차량하중·부등침하·지진시)의 산정식과 응답변위법의 '
    + '단계별 산정절차는 산정근거와 함께 [부록 B.2]에 수록하였다.')
  b.spacer()

  b.tableWithCaption(`${T(16)} 내진성능 본평가 지점 현황표`, {
    headerRows: [[
      H('관로 계통'), H('관로 구간 (세부)'), H('위 치 (Sta.No)'), H('관종'), H('관경 (mm)'),
      H('관두께 (mm)'), H('매설 깊이 (m)'), H('관축깊이 z (m)'), H('최대정수압 (MPa)'), H('지반 종류'),
    ]],
    rows: rowsSeismicPoints(facs).map(r => r.map((v, i) => (i >= 4 && i <= 8 ? R(v) : C(v)))),
    weights: [1, 1.2, 2, 0.8, 0.9, 1, 1.1, 1.1, 1.2, 0.9],
  })
  b.spacer()

  b.tableWithCaption(`${T(17)} 내진성능 본평가 결과표`, {
    headerRows: [
      [H('관로 계통', 1, 2), H('관로 구간 (세부)', 1, 2), H('위 치 (Sta.No)', 1, 2),
        H('발생 축방향 변형률 (%)', 6, 1), H('허용 변형률 (%)', 1, 2), H('내진성 검토', 1, 2)],
      [H('내압'), H('차량 하중'), H('온도 변화'), H('부등 침하'), H('지진시'), H('계')],
    ],
    rows: rowsSeismicResult(facs).map(r => r.map((v, i) => (i >= 3 && i <= 9 ? R(v) : C(v)))),
    weights: [1, 1.2, 1.9, 0.9, 1, 1, 1, 0.9, 0.9, 1.1, 1],
  })
  b.spacer()

  // 3.3.4 결과
  b.subheading(`${CH}.3.4 내진성능평가 결과`)
  b.tableWithCaption(`${T(18)} 관로 내진성능평가 결과표`, {
    headerRows: [
      [H('관로 계통', 1, 2), H('관로 구간 (세부)', 1, 2), H('관종', 1, 2), H('관경 (mm)', 1, 2),
        H('우선순위 평가', 2, 1), H('본평가', 3, 1)],
      [H('취약도지수 VI'), H('내진그룹 분류'), H('평가지점 (Sta.No)'), H('변형률비 (Σε/εa)'), H('검토')],
    ],
    rows: rowsSeismicSummary(facs).map(r => r.map((v, i) => (i === 3 || i === 4 || i === 7 ? R(v) : C(v)))),
    weights: [1, 1.2, 0.9, 0.9, 1.2, 1.8, 1.9, 1.2, 1],
  })
  b.spacer()

  // ── 3.4 안전성 평가 ─────────────────────────────────────
  b.heading(`${CH}.4 안전성 평가`)
  b.tableWithCaption(`${T(19)} 관로의 안전성평가 기준 [세부지침 11-133 표 11.74]`, {
    headerRows: [[H('평가결과'), H('평가점수'), H('평가 기준'), H('비 고')]],
    rows: [
      [C('a'), C('5'), '안전율(SF)이 1.0 이상이고 주부재에 손상이 없는 경우', { text: '▪ 강도설계법\n▪ 허용응력설계법', rowSpan: 5 }],
      [C('b'), C('4'), '안전율(SF)이 1.0 이상이고 주부재에 손상(단면 손실)이 있는 경우'],
      [C('c'), C('3'), '안전율(SF)이 0.9 이상 ~ 1.0 미만'],
      [C('d'), C('2'), '안전율(SF)이 0.75 이상 ~ 0.9 미만'],
      [C('e'), C('1'), '안전율(SF)이 0.75 미만'],
    ],
    weights: [0.8, 0.8, 4, 1.6],
  })
  b.spacer()

  const sa = safetyAssessment(facs)
  b.tableWithCaption(`${T(20)} 개별시설물 안전성평가표`, {
    headerRows: [[H('평가항목'), H('안전율 (SF)'), H('평가결과'), H('평가점수'), H('비 고')]],
    rows: [
      [{ text: '개별시설물명', bold: true }, { text: pm.facilityName || DASH, colSpan: 4 }],
      [{ text: '개별시설물규모', bold: true }, { text: pm.pipeKindText || DASH, colSpan: 4 }],
      ...rowsFacilityGrade(facs).map(r => r.map((v, i) => (i >= 1 && i <= 3 ? C(v) : v))),
      [{ text: '안전성평가 결과', bold: true }, { text: sa.text, colSpan: 4 }],
    ],
    weights: [2, 1, 1, 1, 2.4],
  })
  b.note('※ 안전성평가 기준 : 세부지침 11-133 [표 11.74]')

  const name = `제${CH}장 안전성 및 내진성능평가 결과.hwpx`
  return { builder: b, name, title: `제${CH}장 안전성 및 내진성능평가 결과` }
}

export async function exportFinalReportHwpx(args) {
  const { builder, name, title } = buildFinalReport(args)
  await downloadHwpx(builder, name, { title })
  return name
}
