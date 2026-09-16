// 예비평가 유연도지수 FLEX 검증 스크립트
// 근거: 기존 시설물(상수도) 내진성능 평가요령
//       · 해설표 3.4.2  — FLEX 지수표 (5이하 10.0 / 5이상20미만 8.0 / 20이상 6.0)
//       · 해설식(5.4.6) — Wang(1993) 유연도비 F
//       · 부록 A.1.3    — 덕타일 주철관 DN900 예제 (F = 7.85 → FLEX = 8.0, VI = 52.8 > 40)
//       · 부록 그림 A.1.2 — 1그룹 & VI > 40 → 내진성능 중요상수도
//
// 확인 목적: FLEX 인자가 D/t 가 아니라 유연도비 F 임을 회귀 고정한다.

import {
  calcFLEX, calcWangFlexibilityRatio, calcIpPerUnitWidth,
  calcPipeFlexibilityRatio, calcEmFromN, calcSeismicGroup,
  PRELIM_PIPE_ELASTIC, PRELIM_GROUND_DEFAULT,
} from './src/engine/seismicConstants.js'

let fail = 0
function chk(label, actual, expected, tol = 1e-9) {
  const ok = Math.abs(actual - expected) <= tol
  if (!ok) fail++
  console.log(`  [${ok ? 'OK' : '**FAIL**'}] ${label}: ${actual} (기대 ${expected})`)
}
function chkRel(label, actual, expected, relTol = 0.005) {
  const err = Math.abs(actual - expected) / (Math.abs(expected) || 1)
  const ok = err <= relTol
  if (!ok) fail++
  console.log(`  [${ok ? 'OK' : '**FAIL**'}] ${label}: ${actual.toFixed(4)} (기대 ${expected}, 오차 ${(err * 100).toFixed(2)}%)`)
}
function sec(t) {
  console.log('\n' + '='.repeat(66) + '\n' + t + '\n' + '='.repeat(66))
}

// ──────────────────────────────────────────────────────────────
sec('1. 부록 A.1.3 예제 재현 — 덕타일 주철관 DN900 / t = 13mm')
// 부록 A.1.3: E(지반) = 26.0 MPa, E₁(구조물) = 200 GPa,
//             ν₁(구조물) = 0.177, ν(지반) = 0.33, R = 0.45 m, t = 0.013 m
//             F = 2E(1-ν₁²)R³ / {E₁(1+ν)t³} = 7.85
const A = calcPipeFlexibilityRatio({
  DN_mm: 900, t_mm: 13,
  Em_MPa: 26.0, nu_m: 0.33,
  Ep_MPa: 200000, nu_p: 0.177,
})
chk('R (구조물의 반경, m)', A.R, 0.45)
chk('t (구조물의 두께, m)', A.t, 0.013)
chkRel('F (유연도비)', A.F, 7.85, 0.002)
chk('FLEX (5이상 20미만)', calcFLEX(A.F), 8.0)

console.log('\n  ※ 종전 구현(D/t 대입)과의 대조')
const dt = 900 / 13
console.log(`     D/t = ${dt.toFixed(1)}  →  구 방식 FLEX = ${dt < 5 ? 10 : dt < 20 ? 8 : 6}  (부록 A.1.3 의 8.0 과 불일치)`)
chk('구 방식이 틀렸음을 확인 (D/t → 6.0 ≠ 8.0)', dt >= 20 ? 6 : 0, 6)

sec('2. 부록 A.1.3 위험도 평가 재현 — VI = 52.8 > 40 → 중요상수도')
const VI_sub = 1.0 + 2.0 + 0.8 + 0.8 + 1.0 + 1.0   // KIND+EARTH+SIZE+CONNECT+FACIL+MCONE
const VI = calcFLEX(A.F) * VI_sub
chkRel('VI', VI, 52.8, 1e-6)
chk('1그룹 & VI > 40 → critical', calcSeismicGroup(1, VI) === 'critical' ? 1 : 0, 1)
console.log(`     구 방식(FLEX=6.0)이었다면 VI = ${(6 * VI_sub).toFixed(1)} → ${calcSeismicGroup(1, 6 * VI_sub)}`)

sec('3. 두 표기의 등가성 — Ip = t³/12 대입')
// 해설식(5.4.6)  F = Em(1-νp²)R³ / {6·Ep·Ip·(1+νm)}
// 부록 A.1.3     F = 2Em(1-νp²)R³ / {Ep(1+νm)t³}
const t_m = 0.013, R_m = 0.45, Em = 26.0, Ep = 200000, nu_m = 0.33, nu_p = 0.177
const F_eq546 = calcWangFlexibilityRatio({ Em, nu_m, Ep, nu_p, R: R_m, Ip: calcIpPerUnitWidth(t_m) })
const F_appA  = 2 * Em * (1 - nu_p ** 2) * R_m ** 3 / (Ep * (1 + nu_m) * t_m ** 3)
chk('Ip = t³/12', calcIpPerUnitWidth(t_m), t_m ** 3 / 12)
chkRel('해설식(5.4.6) ≡ 부록 A.1.3 표기', F_eq546, F_appA, 1e-12)

sec('4. 회귀 케이스 — DN/t = 89~113 구간에서 F ≈ 19 → FLEX = 8.0')
// 인천 송수관로 조건대(강관 DN1200 / t = 12.5mm, 부록 A.1.3 지반값)
const B = calcPipeFlexibilityRatio({
  DN_mm: 1200, t_mm: 12.5,
  Em_MPa: PRELIM_GROUND_DEFAULT.Em_MPa, nu_m: PRELIM_GROUND_DEFAULT.nu_m,
  Ep_MPa: PRELIM_PIPE_ELASTIC.steel.Ep, nu_p: PRELIM_PIPE_ELASTIC.steel.nu_p,
})
const dtB = 1200 / 12.5
console.log(`     D/t = ${dtB.toFixed(1)}  (89 ~ 113 구간)`)
chk('D/t 가 89~113 구간에 있음', dtB >= 89 && dtB <= 113 ? 1 : 0, 1)
chkRel('F', B.F, 18.74, 0.01)
chk('F 가 5 이상 20 미만', B.F >= 5 && B.F < 20 ? 1 : 0, 1)
chk('FLEX', calcFLEX(B.F), 8.0)
console.log(`     구 방식(D/t = ${dtB.toFixed(1)} ≥ 20) 이었다면 FLEX = 6.0 — 수정 전/후 차이 확인`)

console.log('\n  VI 판정 역전 확인 (세부지수 합 = 5.4 인 경우)')
const sub = 5.4
chk('구 방식 VI = 6.0 × 5.4 = 32.4 → 유보', calcSeismicGroup(1, 6.0 * sub) === 'deferred' ? 1 : 0, 1)
chk('현 방식 VI = 8.0 × 5.4 = 43.2 → 중요', calcSeismicGroup(1, 8.0 * sub) === 'critical' ? 1 : 0, 1)

sec('5. FLEX 구간 경계 — 해설표 3.4.2')
chk('F = 0     → 10.0', calcFLEX(0), 10.0)
chk('F = 4.999 → 10.0', calcFLEX(4.999), 10.0)
chk('F = 5     →  8.0', calcFLEX(5), 8.0)
chk('F = 7.85  →  8.0', calcFLEX(7.85), 8.0)
chk('F = 19.999→  8.0', calcFLEX(19.999), 8.0)
chk('F = 20    →  6.0', calcFLEX(20), 6.0)
chk('F = 100   →  6.0', calcFLEX(100), 6.0)

let threw = false
try { calcFLEX(NaN) } catch { threw = true }
chk('F = NaN → 예외 (조용히 6.0 으로 떨어지지 않음)', threw ? 1 : 0, 1)
threw = false
try { calcFLEX(undefined) } catch { threw = true }
chk('F = undefined → 예외', threw ? 1 : 0, 1)

sec('6. VI 판정 경계 — 해설그림 3.4.1 / 부록 그림 A.1.2 는 "VI > 40"')
chk('VI = 39.9 & 1그룹 → 유보', calcSeismicGroup(1, 39.9) === 'deferred' ? 1 : 0, 1)
chk('VI = 40.0 & 1그룹 → 유보 (초과 아님)', calcSeismicGroup(1, 40.0) === 'deferred' ? 1 : 0, 1)
chk('VI = 40.1 & 1그룹 → 중요', calcSeismicGroup(1, 40.1) === 'critical' ? 1 : 0, 1)
chk('VI = 52.8 & 2그룹 → 유보', calcSeismicGroup(2, 52.8) === 'deferred' ? 1 : 0, 1)

sec('7. 지반 탄성계수 Em — N치 환산 (E₀ = 2800N, calcKvFromN 과 동일 관계식)')
chk('N = 10 → E₀ = 28,000 kN/m²', calcEmFromN(10).E0_kNm2, 28000)
chk('N = 10 → Em = 28.0 MPa', calcEmFromN(10).Em_MPa, 28.0)
chkRel('부록 A.1.3 의 Em = 26.0 MPa 에 대응하는 N치', 26.0 / 2.8, 9.286, 0.001)
chk('N = 0 → null', calcEmFromN(0) === null ? 1 : 0, 1)

sec('8. 무효 입력 방어 — 두께 0 등에서 F 가 Infinity 로 새지 않음')
chk('t = 0 → F null', calcPipeFlexibilityRatio({ DN_mm: 900, t_mm: 0, Em_MPa: 26, nu_m: 0.33, Ep_MPa: 200000, nu_p: 0.177 }).F === null ? 1 : 0, 1)
chk('Em = 0 → F null', calcWangFlexibilityRatio({ Em: 0, nu_m: 0.33, Ep: 200000, nu_p: 0.177, R: 0.45, Ip: 1e-7 }) === null ? 1 : 0, 1)

console.log('\n' + '='.repeat(66))
if (fail === 0) console.log('=== 전체 검증 통과 ===')
else { console.log(`=== ${fail}건 실패 ===`); process.exitCode = 1 }
console.log('='.repeat(66))
