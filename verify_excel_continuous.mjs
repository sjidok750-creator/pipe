// 연속관(용접강관) 3자 대조 검증 — 지침 / 실무 계산서 / 앱
//
// 왜 필요한가: 앱 출력물(견본 보고서)과 앱을 대조하는 것은 자기참조라 공통 오류를
//   절대 잡지 못한다. 앱 **밖에서 만들어진** 두 기준으로 대조해야 한다.
//     A. 평가요령 부록 C.2 연속강관 예제 (지침 정본, 인쇄된 숫자)
//     B. 02-3. 관로내진성능평가.xlsx '하안송수관로 01(01)' (실무 계산서, 타사 작성)
//   ※ 기존 verify_continuous.mjs 는 엔진을 import 하지 않고 수식을 재구현해 비교하므로
//     엔진 검증이 아니다. 이 스크립트는 실제 엔진(evalContinuous)을 호출한다.
import { evalContinuous } from './src/engine/seismicContinuous.js'
import { SEISMIC_ZONE, SEISMIC_GRADE, AMP_FACTOR } from './src/engine/seismicConstants.js'

let fail = 0
const pct = v => Math.abs(v) * 100
function row(label, app, ref, unit = '', tol = 0.005) {
  const ok = ref == null || Math.abs(app - ref) <= Math.abs(ref) * tol + 1e-12
  if (!ok) fail++
  const err = ref == null || ref === 0 ? '' : ((app - ref) / ref * 100).toFixed(2) + '%'
  console.log(`  ${ok ? ' ' : '✗'} ${label.padEnd(30)} ${String(app).padStart(14)} ${String(ref ?? '-').padStart(14)} ${unit.padEnd(8)} ${err}`)
}
const head = (t, c1 = '앱', c2 = '기준') => {
  console.log(`\n${t}`)
  console.log(`    ${'항목'.padEnd(28)} ${c1.padStart(14)} ${c2.padStart(14)} ${'단위'.padEnd(8)} 차이`)
  console.log('  ' + '─'.repeat(78))
}
const sec = t => console.log('\n' + '═'.repeat(82) + '\n' + t + '\n' + '═'.repeat(82))
const f = (v, d) => Number(Number(v).toFixed(d))

// ══════════════════════════════════════════════════════════
sec('A. 평가요령 부록 C.2 연속강관 예제 (지침 정본)')
// 조건: D 1.0m(외경), t 0.009m, h 1.5m, γ 17 kN/m³, P 1000 kN/m², Pm 100 kN/輪,
//       ΔT 15℃, 부등침하 L 15m·h″ 1.0m, 지반 25m(Vs 89.4)+5m(Vs 172.9), 기반암 760, S5
const A = evalContinuous({
  DN: 1000, t: 9.0, D_out: 1000,
  Z: SEISMIC_ZONE.I.Z, I_seismic: SEISMIC_GRADE.I.I_collapse,
  Fa_table: AMP_FACTOR.S5.Fa, Fv_table: AMP_FACTOR.S5.Fv,
  layers: [{ name: '표층', H: 25, Vs: 89.4 }, { name: '중간층', H: 5, Vs: 172.9 }],
  Vbs: 760, P: 1.0, gamma: 17, deltaT: 15,
  D_settle: 0, L_settle: 15, h2_settle: 1.0,
  h_cover: 1.5, z_pipe: 2.0, E: 210000, Pm: 100, Kv: 10000,
})
head('  <표 C.2.3> 축변형률에 의한 내진안전성의 조사', '앱', '지침 인쇄값')
row('εi  설계내압',   f(pct(A.epsilon_i), 4), 0.0079, '%', 0.02)
row('εo  차량하중',   f(pct(A.epsilon_o), 4), 0.0059, '%', 0.02)
row('εt  온도효과',   f(pct(A.epsilon_t), 4), 0.0180, '%')
row('εd  부등침하',   f(pct(A.epsilon_d), 4), 0.0022, '%', 0.05)
row('εx  지진',       f(pct(A.epsilon_x), 4), 0.0408, '%', 0.02)
row('Σε  축변형률 합계', f(pct(A.epsilon_total), 4), 0.075, '%', 0.01)
row('εy  = 46t/D',    f(pct(A.epsilon_allow), 4), 0.414, '%')
row('Uh  지반 수평변위', f(A.Uh, 4), 0.0351, 'm', 0.01)
row('L   지진동 파장',  f(A.L, 2), 217.72, 'm')
console.log(`\n  판정 : Σε ${pct(A.epsilon_total).toFixed(3)} % ≤ εy ${pct(A.epsilon_allow).toFixed(3)} % → ${A.strainOK ? 'O.K' : 'N.G'}  (지침 O.K)`)
if (!A.strainOK) fail++

// ══════════════════════════════════════════════════════════
sec('B. 실무 계산서 02-3 「하안송수관로 01(01)」 Sta. 4+15.0 (타사 작성)')
// 조건: D 1000mm(외경), t 8mm, l 6m, E 210,000 MPa, P 1.733 MPa, h 4m, z 4.5m,
//       γ 19 kN/m³, ΔT 20℃, 차량하중 없음(Pm 0), 연약지반 0, 기반암 12m,
//       지층 매립 6.5m(Vs 102.65) + 퇴적 1.1m(314.57) + 풍화토 4.4m(314.57), Vbs 760 → S3
const B = evalContinuous({
  DN: 1000, t: 8.0, D_out: 1000,
  Z: SEISMIC_ZONE.I.Z, I_seismic: SEISMIC_GRADE.I.I_collapse,
  Fa_table: AMP_FACTOR.S3.Fa, Fv_table: AMP_FACTOR.S3.Fv,
  layers: [
    { name: '매립층',   H: 6.5, Vs: 102.65 },
    { name: '퇴적층',   H: 1.1, Vs: 314.57 },
    { name: '풍화토층', H: 4.4, Vs: 314.57 },
  ],
  Vbs: 760, P: 1.733, gamma: 19, deltaT: 20,
  D_settle: 0, L_settle: 0, h2_settle: 0,
  h_cover: 4.0, z_pipe: 4.5, E: 210000, Pm: 0, Kv: 100,
})
head('  ① 지반 응답', '앱', '엑셀')
row('Vds 비선형 평균 Vs', f(B.Vds, 3), 118.812, 'm/s')
row('TG  표층 고유주기',  f(B.TG, 3), 0.323, 'sec')
row('Ts  설계 고유주기',  f(B.Ts, 3), 0.404, 'sec')
row('Sv  속도응답스펙트럼', f(B.Sv, 3), 0.113, 'm/s', 0.01)
row('Uh  지반 수평변위',  f(B.Uh, 6), 0.0076919, 'm', 0.01)
row('L1  = Ts·Vds',      f(B.L1, 3), 48.000, 'm')
row('L2  = Ts·Vbs',      f(B.L2, 3), 307.040, 'm')
row('L   지진동 파장',    f(B.L, 4), 83.0212, 'm')
row('Lʹ  = √2·L',        f(B.Lprime, 3), 117.410, 'm')

head('  ② 관·지반 강성', '앱', '엑셀')
row('K2  지반 강성계수', f(B.K2, 1), 82021.1, 'kN/m²', 0.01)
row('λ1',                f(B.lambda1, 6), 0.0885039, '1/m', 0.01)

head('  ③ 축방향 변형률', '앱', '엑셀')
row('εG  지반 변형률',  f(pct(B.epsilon_G), 6), f(pct(2.9106997e-4), 6), '%', 0.01)
row('εL  축방향(마찰)', f(pct(B.epsilon_L), 6), f(pct(1.7471679e-4), 6), '%', 0.01)
row('εB  휨',           f(pct(B.epsilon_B), 6), f(pct(2.2027256e-5), 6), '%', 0.01)
row('εx  지진 합성',    f(pct(B.epsilon_x), 6), f(pct(1.7609984e-4), 6), '%', 0.01)
row('ξ   마찰 파라미터', f(B.xi, 1), 475175.8, 'm', 0.01)
row('Ly  = ξ·εy',       f(B.Ly, 1), 1748.6, 'm', 0.01)

head('  ④ 판정표 (엑셀 327행)', '앱', '엑셀')
row('εi  설계내압',   f(pct(B.epsilon_i), 6), 0.015349, '%', 0.01)
row('εo  차량하중',   f(pct(B.epsilon_o), 6), 0, '%')
row('εt  온도효과',   f(pct(B.epsilon_t), 6), 0.024, '%')
row('εd  부등침하',   f(pct(B.epsilon_d), 6), 0, '%')
row('εx  지진',       f(pct(B.epsilon_x), 6), 0.017610, '%', 0.01)
row('Σε  합계',       f(pct(B.epsilon_total), 6), 0.056959, '%', 0.01)
row('εUy = 46t/D',    f(pct(B.epsilon_allow), 6), 0.368, '%')
console.log(`\n  판정 : Σε ${pct(B.epsilon_total).toFixed(4)} % ≤ εUy ${pct(B.epsilon_allow).toFixed(3)} % → ${B.strainOK ? 'O.K' : 'N.G'}  (엑셀 O.K)`)
if (!B.strainOK) fail++
console.log(`  마찰 지배 여부 : 앱 usedFriction = ${B.usedFriction}  (엑셀 L=83.02 < Ly=1748.6 → εL = L/ξ 적용)`)

// ══════════════════════════════════════════════════════════
sec('C. 판정 체계 대조')
const banned = ['sigma_vm', 'sigma_x_total', 'stressOK', 'sigma_allow']
const leftover = banned.filter(k => k in B)
console.log(`  지침 부록 표 C.2.3  : 판정 = Σε ≤ 46t/D (단일)        · 응력 판정 없음`)
console.log(`  실무 엑셀 332행     : =IF(Σε <= 46t/D,"O.K","N.G")     · 응력 판정 행 없음`)
console.log(`  앱                  : ok = strainOK (${B.ok === B.strainOK ? '단일' : '복합 ← 불일치'})            · 응력 필드 ${leftover.length ? leftover.join(',') : '없음'}`)
if (B.ok !== B.strainOK) fail++
if (leftover.length) fail++

console.log('\n' + '═'.repeat(82))
console.log(fail === 0 ? '=== 3자 대조 전체 일치 ===' : `=== ${fail}건 불일치 ===`)
console.log('═'.repeat(82))
if (fail) process.exitCode = 1
