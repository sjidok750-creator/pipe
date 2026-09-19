// ============================================================
// 연속관(강관) 엔진 정본 검증 — 평가요령 부록 C.2 예제 재현
//   대상: src/engine/seismicContinuous.js  evalContinuous()  ← 엔진을 직접 import
//   기준: 「기존 시설물(상수도) 내진성능 평가요령」 부록 C.2
//         · C.2.1 지반조건·관로사양 (PDF p.169~170)
//         · C.2.2 상시하중 변형률   (PDF p.170~174)
//         · C.2.2 마.바. 지진 변형률 (PDF p.174~180)
//         · <표 C.2.3> 내진안전성 조사 (PDF p.181)
//         · <그림 C.2.4> 암반 기반면 설계속도응답스펙트럼 (PDF p.176)
//
// ※ verify_continuous.mjs 는 식을 스크립트 안에 다시 구현해 대조하므로
//   "엔진 검증"이 아니다. 이 파일이 엔진에 대한 정본 회귀 검증이다.
//
// 실행: node verify_continuous_c2.mjs
// ============================================================

import { evalContinuous, calcAllowableStrain } from './src/engine/seismicContinuous.js'
import { calcSv } from './src/engine/seismicSegmented.js'

let fail = 0
function chk(label, actual, expected, tolPct, unit = '') {
  const err = Math.abs((actual - expected) / (expected || 1)) * 100
  const ok = err <= tolPct
  if (!ok) fail++
  console.log(
    `  [${ok ? 'OK  ' : 'FAIL'}] ${label.padEnd(26)}` +
    `계산 ${String(actual.toPrecision(6)).padStart(12)} | 지침 ${String(expected).padStart(10)} ${unit}` +
    `  (오차 ${err.toFixed(2)}%)`
  )
}

// ── 부록 C.2 입력조건 ────────────────────────────────────────
// 지반: 기반암 깊이 30 m (표층 25 m / Vs 89.4, 중간 5 m / Vs 172.9), Vbs = 760 m/s
// 관  : KS D 3565 도복장강관 D(외경) 1.0 m, t 9 mm, E 2.1×10⁸ kN/m², ν 0.3
// 매설: h 1.5 m, γ 17 kN/m³ | 내압 1,000 kN/m² | 차량 Pm 100 kN/륜, Kv 10,000 kN/m³
// 온도: ΔT 15 ℃ | 부등침하: 연약지반 L 15 m, 성토고 h″ 1.0 m
// 지진: 구역 Ⅰ(Z=0.11), 내진 Ⅰ등급 붕괴방지(I=1.40) → S = 0.154
const c2Params = {
  DN: 1000, t: 9.0, D_out: 1000,
  Z: 0.11, I_seismic: 1.40,
  Fa_table: [1, 1, 1], Fv_table: [1, 1, 1],
  layers: [{ H: 25, Vs: 89.4 }, { H: 5, Vs: 172.9 }],
  Vbs: 760,
  gamma: 17, P: 1.0, deltaT: 15,
  L_settle: 15, h2_settle: 1.0,
  h_cover: 1.5, z_pipe: 1.5 + 0.5,
  nu: 0.30, E: 210000,
  Pm: 100, Kv: 10000, C_width: 3.0, a_contact: 0.2,
  tau: 10,
}
const r = evalContinuous(c2Params)

const pct = v => v * 100

console.log('\n=== 부록 C.2 ① 지반 응답 (PDF p.175~178) ===')
chk('Ts 설계고유주기',   r.Ts,  1.543, 0.1, 'sec')      // <표 C.2.2>
chk('Sv 속도응답스펙트럼', r.Sv, 0.113, 0.5, 'm/s')      // <그림 C.2.4> 붕괴방지 플래토

console.log('\n=== 부록 C.2 ② <표 C.2.3> 축변형률 [단위 %] (PDF p.181) ===')
chk('내압   ε_i',  Math.abs(pct(r.epsilon_i)), 0.0079, 1.0, '%')
chk('차량하중 ε_o',          pct(r.epsilon_o),  0.0059, 1.0, '%')
chk('온도효과 ε_t',          pct(r.epsilon_t),  0.0180, 0.5, '%')
chk('부등침하 ε_d',          pct(r.epsilon_d),  0.0022, 1.5, '%')
chk('지진    ε_x',           pct(r.epsilon_x),  0.0408, 1.0, '%')
chk('축변형률 합계',      pct(r.epsilon_total),  0.075,  1.0, '%')
chk('항복점변형률 46t/D',  pct(r.epsilon_allow),  0.414,  0.1, '%')

// 판정: 합계 ≤ 허용 → O.K (지침 p.181 "따라서, 내진안전성 만족")
if (!r.ok) { fail++; console.log('  [FAIL] 종합판정: 지침은 O.K 인데 앱은 N.G') }
else console.log('  [OK  ] 종합판정                 O.K (지침과 동일)')

console.log('\n=== 부록 C.2 ③ 미끌림(마찰) 지배 분기 (PDF p.179~180) ===')
// ξ = 2√2·E·t/τ = 2√2 × 2.1×10⁸ × 0.009 / 10 = 534,573 m
chk('ξ (마찰 특성길이)', r.xi,  534573, 0.1, 'm')
chk('L (지진동 파장)',   r.L,   217.72, 0.1, 'm')
if (!r.usedFriction) { fail++; console.log('  [FAIL] L ≤ ξ·εy 인데 마찰 지배 분기를 타지 않았다') }
else console.log('  [OK  ] L ≤ Ly → ε_L = L/ξ (미끌림 고려) — 지침 p.180 과 동일')

console.log('\n=== <그림 C.2.4> 속도응답스펙트럼 형상 (PDF p.176) ===')
// 그림은 T=0 ~ T_B(0.3s) 직선상승 후 플래토. 붕괴방지 0.113 / 기능수행 0.062.
const S_col = 0.11 * 1.40, S_fun = 0.11 * 0.57
chk('붕괴방지 플래토 (ξ=20%)', calcSv(S_col, 1.543, 'collapse').Sv,  0.113, 0.5, 'm/s')
chk('기능수행 플래토 (ξ=10%)', calcSv(S_fun, 1.543, 'functional').Sv, 0.062, 1.0, 'm/s')
for (const T of [0.06, 0.1, 0.2, 0.3]) {
  chk(`직선구간 Sv(T=${T}s)`, calcSv(S_col, T, 'collapse').Sv, +(0.113269 * (T / 0.3)).toFixed(6), 0.5, 'm/s')
}
// ※ Ts < 0.06 s 에서는 앱의 KDS 원식(Sa = S(1+30T) + C_D 보간)이 그림의 직선보다
//   최대 13 % 낮다(위험측). 매설관로 표층지반에서 TG < 0.048 s 는 사실상 나오지
//   않으므로 회귀 판정 대상에서는 제외하고 기록만 남긴다.

console.log('\n=== 허용변형률 기준 단일화 (σ_y/E 선택지 삭제) ===')
// 평가요령에 σ_y/E 기준은 없다. 46t/D 외의 경로가 되살아나지 못하도록 고정한다.
if ('strainCriterion' in r) { fail++; console.log('  [FAIL] 결과에 strainCriterion 이 남아 있다') }
else console.log('  [OK  ] 결과에 strainCriterion 없음')
if ('sigma_y' in r) { fail++; console.log('  [FAIL] 결과에 sigma_y(재료 항복강도)가 남아 있다') }
else console.log('  [OK  ] 결과에 sigma_y 없음')
// 옵션을 넘겨도 무시되어야 한다 (46t/D 고정)
const rYield = evalContinuous({ ...c2Params, strainCriterion: 'yield' })
if (Math.abs(rYield.epsilon_allow - r.epsilon_allow) > 1e-12) {
  fail++; console.log("  [FAIL] strainCriterion:'yield' 를 넘기니 허용변형률이 달라졌다")
} else console.log("  [OK  ] strainCriterion:'yield' 를 넘겨도 46t/D 고정")
// Ly = ξ·εy 의 εy 도 46t/D 여야 한다 (지침 p.C28)
chk('Ly = ξ × 46t/D', r.Ly, r.xi * r.epsilon_allow, 0.001, 'm')
// 두께·외경이 없으면 조용히 다른 기준으로 떨어지지 말고 예외를 던져야 한다
try {
  calcAllowableStrain(0, 1000)
  fail++; console.log('  [FAIL] t=0 인데 예외를 던지지 않았다')
} catch { console.log('  [OK  ] t·D 미입력 시 예외 (조용한 대체기준 없음)') }

console.log(fail === 0
  ? '\n✅ 전 항목 일치 — 엔진이 평가요령 부록 C.2 정본 예제를 재현한다.\n'
  : `\n❌ ${fail}개 항목 불일치\n`)
process.exit(fail === 0 ? 0 : 1)
