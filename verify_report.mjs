// 최종보고서(제3장) · 부록 HWPX 생성 검증 스크립트
// 서식 견본: templates/제3장 안전성 및 내진성능평가 결과.hwpx
//            templates/부록 - 구조안전성 및 내진성능평가 상세계산서.hwpx
// 실제 3개 관로구간(인천 송수관로 조건)으로 계산 → 두 문서를 생성하고
// 절 구성·표 구성·병합 격자·수식 개체를 점검한다.

import fs from 'node:fs'
import { calcSteelPipe } from './src/engine/steelPipe.js'
import { useSeismicStore } from './src/store/useSeismicStore.js'
import { buildFinalReport } from './src/lib/hwpx/finalReportHwpx.js'
import { buildAppendix } from './src/lib/hwpx/appendixHwpx.js'
import { buildHwpxZip } from './src/lib/hwpx/hwpxCore.js'
import { EPRIME_KGFCM2, EARTH_LOAD } from './src/engine/constants.js'

let fail = 0
const chk = (label, cond, extra = '') => {
  if (!cond) fail++
  console.log(`  [${cond ? 'OK' : '**FAIL**'}] ${label}${extra ? ' — ' + extra : ''}`)
}
const sec = t => console.log('\n' + '='.repeat(66) + '\n' + t + '\n' + '='.repeat(66))

// ── 대상 3개 구간 (견본 보고서와 같은 조건) ───────────────
const SEGMENTS = [
  { name: '송수 01', DN: 500, Do: 508.0, t: 5.6, H: 6.00, Pd: 0.60,
    meta: { system: '송수 01', segment: '01-4', subSegment: '12', station: '2+987.93 ~ 4+026.42',
      lengthM: '1,038.49', position: '밸브실 #7 상류', pipeMark: 'PEP', steelGrade: 'STWW 400',
      thickBase: '6.0', thickMeas: '5.6 (밸브실 #4)', operation: '자연유하', burial: '차도부 (DB-24)',
      boring: 'Y-4', gwlDepth: '19.60', soilVs: '289.4', soilThick: '21.0',
      liquefaction: '① 지하수위 상부  ④ Vs ≥ 200 m/s' } },
  { name: '송수 02', DN: 900, Do: 914.0, t: 8.0, H: 4.30, Pd: 0.60,
    meta: { system: '송수 02', segment: '02-2', subSegment: '08', station: '0+711.53 ~ 1+033.90',
      lengthM: '322.37', pipeMark: 'PEP', steelGrade: 'STWW 400', thickBase: '8.0', thickMeas: '8.1',
      boring: 'Y-42', gwlDepth: '12.50', soilVs: '282.6', soilThick: '16.5',
      liquefaction: '① 지하수위 상부  ④ Vs ≥ 200 m/s' } },
  { name: '송수 03', DN: 800, Do: 813.0, t: 7.4, H: 4.10, Pd: 0.60,
    meta: { system: '송수 03', segment: '03-1', subSegment: '02', station: '0+001.83 ~ 0+048.18',
      lengthM: '46.35', pipeMark: 'PEP', steelGrade: 'STWW 400', thickBase: '8.0', thickMeas: '7.4',
      boring: 'NX-4', gwlDepth: '2.00', soilVs: '261.7', soilThick: '6.7',
      liquefaction: '④ Vs ≥ 200 m/s' } },
]

function buildFacility(seg, i) {
  // ① 구조안전성
  const sInputs = {
    pipeType: 'steel', DN: seg.DN, pnGrade: 'PN10', steelGrade: 'SPS400', fyManual: 235,
    Pd: seg.Pd, H: seg.H, hasTraffic: true,
    Eprime_kgfcm2: EPRIME_KGFCM2, eprimeManual: false,
    gammaSoil_kgfcm3: EARTH_LOAD.gamma_t,
    steelBeddingType: 'deg90', diBeddingType: 'deg90', gwLevel: 'below',
    tMeasured: seg.t, pressureZone: 'gravity', Psurge: null, hasSectionLoss: false,
    pipeDimManual: true, DoManual: seg.Do, tManual: seg.t,
  }
  const sResult = calcSteelPipe(sInputs)

  // ② 내진 예비평가
  const st = useSeismicStore.getState()
  st.resetPrelim()
  st.setPrelimInputs({ zone: 'I', seismicGrade: 'I', isUrban: true, soilType: 'S2',
    pipeKind: 'steel', DN: seg.DN, thickness: seg.t, connectCond: 'normal', facilExists: 'yes', mcone: 'rigid' })
  const pInputs = { ...useSeismicStore.getState().prelimInputs }
  const pResult = useSeismicStore.getState().calcPrelim()

  // ③ 내진 상세평가 (연속관)
  st.seedDetailDefaults('continuous')
  useSeismicStore.getState().setDetailInputs({
    DN: seg.DN, thickness: seg.t, D_out: seg.Do, hCover: seg.H, P: seg.Pd, soilType: 'S2',
  })
  const dInputs = { ...useSeismicStore.getState().detailInputs }
  const dResult = useSeismicStore.getState().calcDetail()

  return {
    id: `fac-${i}`, name: seg.name, reportMeta: seg.meta,
    modules: {
      structural:    { inputs: sInputs, result: sResult },
      seismicPrelim: { inputs: pInputs, result: pResult },
      seismicDetail: { inputs: dInputs, result: dResult },
    },
  }
}

sec('1. 3개 관로구간 계산')
const facilities = SEGMENTS.map(buildFacility)
facilities.forEach(fc => {
  const s = fc.modules.structural.result
  const p = fc.modules.seismicPrelim.result
  const d = fc.modules.seismicDetail.result
  console.log(`  ${fc.name}: σb = ${s.steps.step3.sigma_b.toFixed(2)} MPa, SF = ${s.SF.toFixed(2)},`
    + ` 등급 ${s.safetyGrade?.grade} / VI = ${p.VI.toFixed(1)} (FLEX ${p.FLEX}) / Σε = ${(d.epsilon_total * 100).toFixed(4)} %`)
  chk(`${fc.name} 구조·예비·상세 결과 생성`, !!s && !!p && !!d)
})

const project = {
  meta: {
    id: 'test', name: '검증 프로젝트', enabledModules: ['structural', 'seismicPrelim', 'seismicDetail'],
    reportMeta: {
      projectTitle: '2026년 ○○송수관로 정밀안전진단 및 내진성능평가 용역',
      facilityName: '○○광역시 송수관로 3개 구간',
      chapterNo: '3', tablePrefix: '2.3',
      pipeKindText: '수도용 도복장 강관(PEP, 용접이음)',
    },
  },
  facilities,
}
const pm = project.meta.reportMeta

// ── 생성 ────────────────────────────────────────────────
sec('2. HWPX 생성')
const outDir = 'out_report'
fs.mkdirSync(outDir, { recursive: true })
const docs = []
for (const [label, built] of [
  ['최종보고서', buildFinalReport({ project, projectMeta: pm })],
  ['부록', buildAppendix({ project, projectMeta: pm })],
]) {
  const zip = buildHwpxZip(built.builder, { title: built.title })
  const buf = await zip.generateAsync({ type: 'nodebuffer', compressionOptions: { level: 6 } })
  const path = `${outDir}/${built.name}`
  fs.writeFileSync(path, buf)
  console.log(`  ${label}: ${built.name}  (${(buf.length / 1024).toFixed(0)} KB)`)
  docs.push({ label, path, xml: built.builder.buildSection0() })
}

// ── 점검 ────────────────────────────────────────────────
sec('3. 본문 XML 구조 점검')
for (const doc of docs) {
  const x = doc.xml
  console.log(`\n  [${doc.label}]`)
  chk('XML 선언 + 섹션 종료 태그', x.startsWith('<?xml') && x.trim().endsWith('</hs:sec>'))
  const open = (x.match(/<hp:p\s/g) || []).length
  const close = (x.match(/<\/hp:p>/g) || []).length
  chk('문단 여닫이 짝 일치', open === close, `${open} / ${close}`)
  const tOpen = (x.match(/<hp:tbl\s/g) || []).length
  const tClose = (x.match(/<\/hp:tbl>/g) || []).length
  chk('표 여닫이 짝 일치', tOpen === tClose, `표 ${tOpen}개`)
  chk('수식 개체 포함', (x.match(/<hp:equation\s/g) || []).length > 0,
    `${(x.match(/<hp:equation\s/g) || []).length}개`)
  // 병합 격자 검증: 표마다 (덮인 칸 포함) 칸 수 = rowCnt × colCnt
  let gridOK = true, detail = ''
  for (const m of x.matchAll(/<hp:tbl [^>]*rowCnt="(\d+)" colCnt="(\d+)"[\s\S]*?<\/hp:tbl>/g)) {
    const rowCnt = +m[1], colCnt = +m[2]
    let cells = 0
    for (const sp of m[0].matchAll(/<hp:cellSpan colSpan="(\d+)" rowSpan="(\d+)"\/>/g)) cells += (+sp[1]) * (+sp[2])
    if (cells !== rowCnt * colCnt) { gridOK = false; detail = `${cells} ≠ ${rowCnt}×${colCnt}` }
  }
  chk('병합 격자 빈칸 없음 (Σ colSpan×rowSpan = 행×열)', gridOK, detail)
  chk('빈 문단 연속 없음', !/<hp:t><\/hp:t><\/hp:run><\/hp:p><hp:p[^>]*><hp:run charPrIDRef="0"><hp:t><\/hp:t>/.test(x))
  chk('값 누락 표시(—) 과다 아님', (x.match(/—/g) || []).length < 60,
    `${(x.match(/—/g) || []).length}개`)
}

sec('4. 서식 견본 대비 절·표 구성')
const mainXml = docs[0].xml
for (const want of ['3.1 개 요', '3.2 관로 구조안전성 검토', '3.3 관로 내진성능 평가', '3.4 안전성 평가',
  '&lt;표 2.3.1&gt;', '&lt;표 2.3.5&gt;', '&lt;표 2.3.8&gt;', '&lt;표 2.3.14&gt;',
  '&lt;표 2.3.17&gt;', '&lt;표 2.3.19&gt;', '&lt;표 2.3.20&gt;']) {
  chk(`제3장 : ${want.replace(/&lt;|&gt;/g, m => (m === '&lt;' ? '<' : '>'))}`, mainXml.includes(want))
}
const apxXml = docs[1].xml
for (const want of ['A.1  적용 기준 및 산정식', 'A.2  관로구간별 구조안전성 계산서',
  'B.1  내진성능 우선순위 평가 (취약도지수) 계산서', 'B.2  내진성능 본평가 산정식',
  'B.3  구간별 내진성능 본평가 계산서', 'A.2.1', 'A.2.3', 'B.3.1', 'B.3.3']) {
  chk(`부록 : ${want}`, apxXml.includes(want))
}

console.log('\n' + '='.repeat(66))
if (fail === 0) console.log(`=== 전체 검증 통과 ===  (생성 파일: ${outDir}/)`)
else { console.log(`=== ${fail}건 실패 ===`); process.exitCode = 1 }
console.log('='.repeat(66))
