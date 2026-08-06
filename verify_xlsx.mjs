// 엑셀(02-1. 구조적 안전성 검토.xlsx) 대조 검증 — 임시 스크립트
// 엑셀 실데이터: DN1000, t=8mm, 정수압 0.7MPa, 지지각 90°, E′=70, 차량대수 n
// 앱은 세부지침 원문값(E′=28, B=2D+100, D=내경)을 쓰므로 값 차이는 예상된 것이며,
// 이 스크립트는 "차이의 원인이 무엇인지"를 항목별로 분해해 보여준다.
import { calcSteelPipe } from './src/engine/steelPipe.js'
import { calcEarthLoad, calcTrafficLoad } from './src/engine/earthLoad.js'
import { EARTH_LOAD } from './src/engine/constants.js'

const f = (v, d = 4) => (v == null || !Number.isFinite(v) ? '—' : v.toFixed(d))

// 엑셀 시트에서 읽은 4개 구간
const XL = [
  { sec: '01(01)', H: 4.0,        n: 8, Wv: 0.4367173, Wt: 0.0793716, i: 0.25,
    sb: 72.953098, eps: 0.0098714, qa: 2.8475325, W: 0.5160889 },
  { sec: '01(02)', H: 2.6,        n: 2, Wv: 0.3343743, Wt: 0.0969063, i: 0.39,
    sb: 60.964800, eps: 0.0082492, qa: 2.8475325, W: 0.4312806 },
  { sec: '01(03)', H: 2.29999995, n: 2, Wv: 0.3068329, Wt: 0.1183333, i: 0.42,
    sb: 60.100478, eps: 0.0081323, qa: 2.8475325, W: 0.4251662 },
  { sec: '01(04)', H: 1.70000005, n: 2, Wv: 0.3060000, Wt: 0.1879365, i: 0.48,
    sb: 69.821686, eps: 0.0094477, qa: 2.8475325, W: 0.4939365 },
]
const Do = 1000, t = 8, Pd = 0.7

console.log('='.repeat(78))
console.log('엑셀 02-1 대조 — DN1000  t=8mm  P=0.7MPa  지지각 90°')
console.log('='.repeat(78))

console.log('\n【1】 엑셀이 앱과 일치하는 항목 (지침 원문 준수 확인)')
console.log('-'.repeat(78))
console.log('  · 토압식      : H≤2m 연직 / H>2m Marston, Cd=[1−e^(−2kμ′H/B)]/(2kμ′)   일치')
console.log('  · kμ′         : (1−sin30°)/(1+sin30°) × tan30° = ' + f(EARTH_LOAD.kmu, 5) + '            일치')
console.log('  · γt          : 1800 kgf/m³ = 1.8×10⁻³ kg/cm³                        일치')
console.log('  · 링휨식      : 2/(f·z)·W·[Kb R²EI+(0.06146Kb−0.08303Kx)E′R⁵]/[EI+0.061E′R³]')
console.log('  · 링휨 계수   : 엑셀 W14 수식이 0.06146 / 0.08303 사용            ★ 일치')
console.log('  · 분모 계수   : 엑셀 링휨 분모는 0.061 (변형식 분모는 0.06146)')
console.log('  · 허용응력    : 140 MPa 고정 (강종 분기 없음)                       일치')
console.log('  · 허용 변형률 : 5% 단일 (라이닝 분기 없음)                          일치')
console.log('  · 좌굴식      : qa=(1/FS)·√(32·Rw·B′·E′·EI/D³), Rw=1.0             일치')
console.log('  · 차량하중    : P=9600, L=175, C=100, b=50, a=20, θ=45°            일치')
console.log('  · 형상계수 f  : 1.5,  E = 2.1×10⁶ kg/cm²                            일치')

console.log('\n【2】 엑셀의 오류 — 지침 원문과 어긋남')
console.log('-'.repeat(78))
console.log('  ① 굴착폭 B : 엑셀 J14 = F14/10+40 = D/10+40 → 140cm')
console.log('     지침 11-134 : B = 2D + 100 (cm) → 2×100+100 = 300cm')
console.log('     → 엑셀 B가 절반 이하. Marston 구간에서 토압을 과소평가(위험측).')
console.log('  ② E′ = 70 kg/cm² : 지침 11-135 제시값은 28 kg/cm² (단일값)')
console.log('     → E′가 크면 지반이 더 버티는 것으로 계산되어 σb 과소평가(위험측).')
console.log('  ③ 충격계수 i : 엑셀 IF(H>6.5, 0.5, ...) → H>6.5 에서 0.5 반환')
console.log('     지침 11-134 표 : 6.5 < H → 0.  (H=4.0 등 현 데이터는 미해당)')
console.log('  ④ 좌굴 설계계수 FS : 엑셀 IF(H > D/1000, 2.5, 3) — H와 D(m)를 비교')
console.log('     지침 11-136 : H/D ≥ 2 → 2.5 / H/D < 2 → 3.0  (H/D 비율이어야 함)')
console.log('     → 엑셀은 H=1.7m > 1.0m 이라 2.5 적용. 지침대로면 H/D=1.7 < 2 → 3.0.')
console.log('  ⑤ 기초계수 B′ : 엑셀 AG14 = 0.15+0.041*(AF14) — AF14는 FS(2.5)')
console.log('     지침 11-136 : B′ = 0.15 + 0.041·(H/D)  ← FS가 아니라 H/D')
console.log('     → 엑셀은 전 구간 B′=0.2525 고정. 명백한 셀 참조 오류.')
console.log('  ⑥ 내압 D : 엑셀 J5 = (I5*G5)/(2*H5) 에서 G5=관경(외경 1000)')
console.log('     지침 11-134 : D는 관 내경. → 엑셀이 내압응력 과대평가(안전측이나 부정확)')

console.log('\n【3】 항목별 수치 대조')
console.log('-'.repeat(78))
console.log('구간      H(m)   항목          엑셀          앱(지침)      비고')
console.log('-'.repeat(78))

for (const x of XL) {
  const r = calcSteelPipe({
    Pd, H: x.H, pipeDimManual: true, DoManual: Do, tManual: t,
    steelBeddingType: 'deg90', hasTraffic: true,
  })
  const s2 = r.steps.step2, s3 = r.steps.step3, s4 = r.steps.step4, s5 = r.steps.step5

  // 엑셀 조건(B=D/10+40, E′=70)을 앱 엔진에 그대로 넣어 재현 가능한지 확인
  const appEprime70 = calcSteelPipe({
    Pd, H: x.H, pipeDimManual: true, DoManual: Do, tManual: t,
    steelBeddingType: 'deg90', hasTraffic: true, Eprime_kgfcm2: 70,
  })

  console.log(`${x.sec}  ${String(x.H).padEnd(6)} 굴착폭 B      ${f(140,1).padEnd(13)} ${f(s2.B_cm,1).padEnd(13)} 엑셀 D/10+40 / 앱 2D+100`)
  console.log(`               상부토압 Wv   ${f(x.Wv).padEnd(13)} ${f(s2.Wv).padEnd(13)} ${s2.earthMethod}`)
  console.log(`               노면하중 Wt   ${f(x.Wt).padEnd(13)} ${f(s2.Wt).padEnd(13)} ${x.n !== 2 ? `엑셀 차량대수 n=${x.n}` : 'n=2 동일'}`)
  console.log(`               충격계수 i    ${f(x.i,3).padEnd(13)} ${f(s2.impactFactor,3).padEnd(13)}`)
  console.log(`               휨응력 σb     ${f(x.sb,3).padEnd(13)} ${f(s3.sigma_b,3).padEnd(13)} E′ 70→28 및 B 차이`)
  console.log(`               변형률 ε(%)   ${f(x.eps*100,4).padEnd(13)} ${f(s4.deflectionRatio,4).padEnd(13)}`)
  console.log(`               좌굴 qa       ${f(x.qa).padEnd(13)} ${f(s5.qa).padEnd(13)} FS=${s5.FS} B′=${f(s5.Bprime,4)}`)
  console.log(`               (E′=70 적용)  ${''.padEnd(13)} σb ${f(appEprime70.steps.step3.sigma_b,3)}`)
  console.log('-'.repeat(78))
}

console.log('\n【4】 엑셀 조건을 그대로 앱에 넣었을 때 재현 여부')
console.log('-'.repeat(78))
console.log('엑셀 B=140cm 는 지침식과 다르므로 앱에서 직접 재현 불가.')
console.log('아래는 토압을 엑셀값으로 고정하고 링휨식만 대조한 결과다.')
console.log('-'.repeat(78))
for (const x of XL) {
  // 엑셀과 동일 조건: R=D/2(외경 기준, 엑셀 T14=F14/2/10), E′=70, W=엑셀값
  const R = Do / 2 / 10, I = (t/10)**3/12, Z = (t/10)**2/6, E = 2.1e6, Ep = 70, Kb = 0.157, Kx = 0.096
  const W = x.Wv + x.Wt
  const num = Kb*R**2*E*I + (0.06146*Kb - 0.08303*Kx)*Ep*R**5
  const den = E*I + 0.061*Ep*R**3
  const sbk = (2/(1.5*Z))*W*num/den
  const sb = sbk*0.098067
  const d = Math.abs(sb - x.sb)
  console.log(`${x.sec}  σb 재현 ${f(sb,4)} MPa  vs 엑셀 ${f(x.sb,4)}  차이 ${f(d,6)} ${d < 1e-3 ? '✔ 식 동일' : '✘'}`)
}

console.log('\n' + '='.repeat(78))
console.log('결론: 링휨·토압·좌굴 "식" 자체는 엑셀과 앱이 동일하다.')
console.log('      값 차이는 전부 상수(B, E′)와 엑셀의 셀 참조 오류에서 비롯된다.')
console.log('='.repeat(78))
