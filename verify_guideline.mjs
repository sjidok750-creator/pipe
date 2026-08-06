// 세부지침 전환 회귀·통합 검증 — 임시 스크립트 (검증 후 삭제)
// 근거: 세부지침 제11장 11.5.2 (11-133 ~ 11-137) / 작업지시 §6
import { calcEarthLoad, calcTrafficLoad } from './src/engine/earthLoad.js'
import { calcSteelPipe } from './src/engine/steelPipe.js'
import { calcDuctileIron } from './src/engine/ductileIron.js'
import { EARTH_LOAD, STEEL_ALLOW, STEEL_BEDDING, RING_BENDING, resolveSafetyGrade } from './src/engine/constants.js'

let fail = 0
const chk = (cond, msg) => { if (!cond) { fail++; console.log('  !! NG —', msg) } }

console.log('═'.repeat(66))
console.log('1. 토압 상수 유도')
console.log('═'.repeat(66))
console.log(`kmu = ${EARTH_LOAD.kmu.toFixed(5)} (기대 0.19245)  k=${EARTH_LOAD.k.toFixed(5)} mu=${EARTH_LOAD.mu.toFixed(5)}`)
chk(Math.abs(EARTH_LOAD.kmu - 0.19245) < 1e-5, 'kmu 불일치')

console.log('\n' + '═'.repeat(66))
console.log('2. 상부 토압 회귀 (작업지시 §6)')
console.log('═'.repeat(66))
for (const c of [
  { DN: 500,  Do: 508.0,  H: 1.5, B: 200, exp: 0.270 },
  { DN: 500,  Do: 508.0,  H: 5.0, B: 200, exp: 0.578 },
  { DN: 1500, Do: 1524.0, H: 5.0, B: 400, exp: 0.715 },
]) {
  const r = calcEarthLoad({ H: c.H, Do: c.Do })
  const err = Math.abs(r.Wv - c.exp) / c.exp * 100
  console.log(`DN${c.DN} H=${c.H}m  B=${r.B_cm.toFixed(1)}cm(기대~${c.B})  Cd=${r.Cd.toFixed(4)}  ` +
    `Wv=${r.Wv.toFixed(4)} (기대 ${c.exp})  오차 ${err.toFixed(2)}%  [${r.method}]`)
  chk(err < 1.0, `DN${c.DN} H${c.H} 토압 오차 ${err.toFixed(2)}%`)
}

console.log('\n[충격계수] H>6.5 → 0 이어야 함 (엑셀 0.5 버그 회귀 금지)')
const iRows = [1.0, 1.5, 3.0, 6.0, 6.5, 8.0].map(H => `H=${H}:${calcTrafficLoad({ H }).i.toFixed(3)}`)
console.log('  ' + iRows.join('  '))
chk(calcTrafficLoad({ H: 8.0 }).i === 0, 'H>6.5 에서 i≠0')

console.log('\n' + '═'.repeat(66))
console.log('3. 강관 통합 계산 (DN600 PN10, H=1.5m, P=0.6MPa)')
console.log('═'.repeat(66))
const st = calcSteelPipe({ DN: 600, Pd: 0.60, H: 1.5, pnGrade: 'PN10', steelBeddingType: 'deg90' })
console.log(`적용 두께 t = ${st.tAdopt} mm (${st.thicknessGoverned})`)
console.log(`내압  σt = ${st.steps.step1.sigma_t_static.toFixed(2)} MPa ≤ ${STEEL_ALLOW.normal} → ${st.steps.step1.ok_static ? 'OK' : 'NG'}`)
console.log(`하중  Wv = ${st.steps.step2.Wv.toFixed(4)}  Wt = ${st.steps.step2.Wt.toFixed(4)}  W = ${st.steps.step2.Wtotal.toFixed(4)} kg/cm² [${st.steps.step2.earthMethod}]`)
console.log(`휨    σb = ${st.steps.step3.sigma_b.toFixed(2)} MPa ≤ ${STEEL_ALLOW.normal} → ${st.steps.step3.ok ? 'OK' : 'NG'}`)
console.log(`변형  ε  = ${st.steps.step4.deflectionRatio.toFixed(4)} % < 5 → ${st.steps.step4.ok ? 'OK' : 'NG'}`)
console.log(`좌굴  W = ${st.steps.step5.Wtotal.toFixed(4)} ≤ qa = ${st.steps.step5.qa.toFixed(4)} kg/cm² → ${st.steps.step5.ok ? 'OK' : 'NG'}`)
console.log(`      H/D=${st.steps.step5.HoverD.toFixed(3)} FS=${st.steps.step5.FS} B′=${st.steps.step5.Bprime.toFixed(4)} Rw=${st.steps.step5.Rw}`)
console.log(`SF = ${st.SF.toFixed(3)} → 등급 ${st.safetyGrade.grade} (${st.safetyGrade.score}점)`)
console.log(`종합 판정: ${st.verdict.overallOK ? 'O.K.' : 'N.G.'}`)
chk(Number.isFinite(st.SF) && st.SF > 0, '강관 SF 비정상')
chk(st.safetyGrade != null, '강관 등급 미산출')
chk(st.steps.step5.FS === 2.5, `H/D=${st.steps.step5.HoverD.toFixed(2)}(≥2) 인데 FS=${st.steps.step5.FS} (기대 2.5)`)

// 좌굴 설계계수 분기 — H/D < 2 (얕은 매설·대구경). 기존 2.5 고정은 이 구간에서 위험측이었다.
const stShallow = calcSteelPipe({ DN: 1500, Pd: 0.60, H: 1.5, pnGrade: 'PN16' })
console.log(`\n[좌굴 FS 분기] DN1500 H=1.5m → H/D=${stShallow.steps.step5.HoverD.toFixed(3)} FS=${stShallow.steps.step5.FS} (기대 3.0)`)
chk(stShallow.steps.step5.FS === 3.0, `H/D<2 인데 FS=${stShallow.steps.step5.FS} (기대 3.0)`)

console.log('\n[관두께 적용규칙] 실측 4.0mm 입력 시')
const stM = calcSteelPipe({ DN: 600, Pd: 0.60, H: 1.5, pnGrade: 'PN10', tMeasured: 4.0 })
console.log(`  기준 ${stM.tStandard} / 실측 ${stM.tMeasured} → 적용 ${stM.tAdopt} mm (${stM.thicknessGoverned})`)
chk(stM.tAdopt === 4.0 && stM.thicknessGoverned === 'measured', '실측 최소두께 미적용')

console.log('\n[가압구간] 수격압 1.2 MPa')
const stP = calcSteelPipe({ DN: 600, Pd: 0.60, H: 1.5, pnGrade: 'PN10', pressureZone: 'pumped', Psurge: 1.2 })
console.log(`  σt′ = ${stP.steps.step1.sigma_t_surge.toFixed(2)} MPa ≤ ${STEEL_ALLOW.surge} → ${stP.steps.step1.ok_surge ? 'OK' : 'NG'}`)
chk(stP.steps.step1.sigma_t_surge > 0, '수격압 응력 미산출')

console.log('\n' + '═'.repeat(66))
console.log('4. 주철관 통합 계산 (DN600 K9, H=1.5m, P=0.6MPa)')
console.log('═'.repeat(66))
const di = calcDuctileIron({ DN: 600, Pd: 0.60, H: 1.5, diKGrade: 'K9', diBeddingType: 'deg90' })
console.log(`적용 두께 t = ${di.tAdopt} mm, 내경 ${di.Di} mm`)
console.log(`σts = ${di.combined.sigma_ts.toFixed(2)}  σtd = ${di.combined.sigma_td.toFixed(2)}  σb = ${di.combined.sigma_b.toFixed(2)} MPa`)
console.log(`조합 = 2.5×${di.combined.sigma_ts.toFixed(2)} + 2.0×${di.combined.sigma_td.toFixed(2)} + 1.4×${di.combined.sigma_b.toFixed(2)}`)
console.log(`     = ${di.combined.demand.toFixed(2)} MPa < ${di.combined.S} → ${di.combined.ok ? 'OK' : 'NG'} (이용률 ${(di.combined.utilization * 100).toFixed(1)}%)`)
console.log(`SF = ${di.SF.toFixed(3)} → 등급 ${di.safetyGrade.grade} (${di.safetyGrade.score}점)`)
chk(Math.abs(di.combined.demand - (2.5 * di.combined.sigma_ts + 2.0 * di.combined.sigma_td + 1.4 * di.combined.sigma_b)) < 1e-9, '조합식 불일치')
chk(di.steps.step3.Kf === 0.160, `Kf(90°)=${di.steps.step3.Kf} (기대 0.160)`)
chk(di.steps.step3.Kt === 0.011, `Kt=${di.steps.step3.Kt} (기대 0.011)`)

console.log('\n' + '═'.repeat(66))
console.log('5. 안전성평가 등급 경계 (11-133 [표 11.74])')
console.log('═'.repeat(66))
for (const [SF, dmg, exp] of [[1.5, false, 'a'], [1.0, false, 'a'], [1.5, true, 'b'],
                              [0.95, false, 'c'], [0.9, false, 'c'],
                              [0.8, false, 'd'], [0.75, false, 'd'], [0.5, false, 'e']]) {
  const g = resolveSafetyGrade(SF, dmg)
  const okk = g.grade === exp
  if (!okk) fail++
  console.log(`  SF=${SF} 손상=${dmg ? 'Y' : 'N'} → ${g.grade} (기대 ${exp}) ${okk ? '' : '!! NG'}`)
}


console.log('\n' + '='.repeat(66))
console.log('6. 링휨 계수 - 지침 11-135 표 4열(0.061Kb-0.083Kx) 대조')
console.log('='.repeat(66))
console.log('원문 표기는 0.061/0.083 이나 이는 반올림 표시이며,')
console.log('표에 인쇄된 계산값은 0.06146/0.08303 으로 산출되어 있다.')
const TAB4 = { deg60: 0.00307, deg90: 0.00171, deg120: 0.00107, deg150: 0.00082 }
let e1 = 0, e2 = 0
for (const [k, tab] of Object.entries(TAB4)) {
  const { Kb, Kx } = STEEL_BEDDING[k]
  const v1 = 0.061 * Kb - 0.083 * Kx
  const v2 = RING_BENDING.a * Kb - RING_BENDING.b * Kx
  e1 += Math.abs(v1 - tab); e2 += Math.abs(v2 - tab)
  console.log(`  ${k.padEnd(6)} 표 ${tab.toFixed(5)}  0.061/0.083 ${v1.toFixed(5)}  적용값 ${v2.toFixed(5)}`)
}
console.log(`  절대오차 합계: 0.061/0.083 = ${e1.toFixed(6)}  /  적용값 = ${e2.toFixed(6)}`)
chk(e2 < e1, `링휨 계수가 표와 덜 정합 (적용 ${e2.toFixed(6)} > 0.061/0.083 ${e1.toFixed(6)})`)
chk(RING_BENDING.aDen === 0.061, '분모 계수는 원문 표기값 0.061 이어야 함')

console.log('\n' + '='.repeat(66))
console.log('7. D = 관 내경 (지침 EQ4/EQ10 정의부)')
console.log('='.repeat(66))
const stD = calcSteelPipe({ DN: 600, Pd: 0.60, H: 1.5, pnGrade: 'PN10' })
const DiExp = stD.Do - 2 * stD.tAdopt
console.log(`  Do=${stD.Do} t=${stD.tAdopt} -> Di=${stD.Di} (기대 ${DiExp})`)
console.log(`  sigma_t = P*Di/(2t) = ${stD.steps.step1.sigma_t_static.toFixed(3)} MPa`)
chk(stD.Di === DiExp, '내경 계산 오류')
chk(Math.abs(stD.steps.step1.sigma_t_static - (0.6 * DiExp) / (2 * stD.tAdopt)) < 1e-9, 'sigma_t 가 내경 기준이 아님')
const Rexp = (DiExp / 10) / 2 + stD.tAdopt / 10
console.log(`  R = Di/2 + t = ${stD.steps.step3.R.toFixed(3)} cm (기대 ${Rexp.toFixed(3)} = 외반경 ${(stD.Do / 20).toFixed(3)})`)
chk(Math.abs(stD.steps.step3.R - Rexp) < 1e-9, 'R 정의 불일치')
chk(Math.abs(stD.steps.step3.R - stD.Do / 20) < 1e-9, 'R 이 외반경과 불일치 - 관 벽 바깥에 놓임')

console.log('\n' + '='.repeat(66))
console.log('8. 등급/판정 정합 - 변형률 초과 시 등급이 a로 나오면 안 됨')
console.log('='.repeat(66))
const stBad = calcSteelPipe({ Pd: 0.10, H: 6.0, pipeDimManual: true, DoManual: 1524, tManual: 4 })
console.log(`  eps = ${stBad.steps.step4.deflectionRatio.toFixed(3)}% (허용 5%) -> ${stBad.steps.step4.ok ? 'OK' : 'NG'}`)
console.log(`  종합 판정 ${stBad.verdict.overallOK ? 'O.K.' : 'N.G.'} / SF ${stBad.SF.toFixed(3)} -> 등급 ${stBad.safetyGrade.grade}`)
if (!stBad.verdict.overallOK) {
  chk(stBad.safetyGrade.grade !== 'a' && stBad.safetyGrade.grade !== 'b',
      `종합 N.G. 인데 등급 ${stBad.safetyGrade.grade} - 보고서에 모순 인쇄됨`)
} else {
  console.log('  (이 조건에서는 전 항목 만족 - 등급 모순 검사 해당 없음)')
}

console.log('\n' + '='.repeat(66))
console.log('9. 주철관 지지각 보정 - 구 Type 키는 가장 보수적인 40°로')
console.log('='.repeat(66))
const diOld = calcDuctileIron({ DN: 600, Pd: 0.60, H: 1.5, diKGrade: 'K9', diBeddingType: 'Type2' })
console.log(`  입력 Type2 -> 적용 ${diOld.steps.step3.diBeddingType} (Kf=${diOld.steps.step3.Kf}), 경고=${diOld.beddingCoerced}`)
chk(diOld.steps.step3.Kf === 0.281, `구 Type 키가 Kf=${diOld.steps.step3.Kf} 로 보정됨 (기대 0.281 = 가장 보수적)`)
chk(diOld.beddingCoerced === 'Type2', '보정 사실이 결과에 표시되지 않음')

console.log('\n' + '═'.repeat(66))
console.log(fail === 0 ? '=== 전체 검증 통과 ===' : `=== 검증 실패 ${fail}건 ===`)
console.log('═'.repeat(66))
process.exit(fail ? 1 : 0)
