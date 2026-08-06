// 세부지침 전환 회귀 검증 — 임시 스크립트 (검증 후 삭제)
// 근거: 세부지침 제11장 11-134 (가) / 작업지시 §6
import { calcEarthLoad, calcTrafficLoad } from './src/engine/earthLoad.js'
import { EARTH_LOAD } from './src/engine/constants.js'

console.log('kmu =', EARTH_LOAD.kmu.toFixed(5), '(기대 0.19245)')
console.log('k   =', EARTH_LOAD.k.toFixed(5), ' mu =', EARTH_LOAD.mu.toFixed(5))

const cases = [
  { DN: 500,  Do: 508.0,  H: 1.5, B: 200, exp: 0.270 },
  { DN: 500,  Do: 508.0,  H: 5.0, B: 200, exp: 0.578 },
  { DN: 1500, Do: 1524.0, H: 5.0, B: 400, exp: 0.715 },
]
let allOK = true
console.log('\n[상부 토압 Wv]')
for (const c of cases) {
  const r = calcEarthLoad({ H: c.H, Do: c.Do })
  const err = Math.abs(r.Wv - c.exp) / c.exp * 100
  const ok = err < 1.0
  if (!ok) allOK = false
  console.log(`DN${c.DN} H=${c.H}m  B=${r.B_cm.toFixed(1)}cm(기대~${c.B})  ` +
    `Cd=${r.Cd.toFixed(4)}  Wv=${r.Wv.toFixed(4)} (기대 ${c.exp})  오차 ${err.toFixed(2)}%  ${ok ? 'OK' : 'NG'}  [${r.method}]`)
}

console.log('\n[충격계수 i] — H>6.5 에서 0 이어야 함 (엑셀 0.5 버그 회귀 금지)')
for (const H of [1.0, 1.5, 3.0, 6.0, 6.5, 8.0]) {
  console.log(`  H=${H}m → i=${calcTrafficLoad({ H }).i.toFixed(3)}`)
}
if (calcTrafficLoad({ H: 8.0 }).i !== 0) { allOK = false; console.log('  !! H>6.5 에서 i≠0 — 회귀') }

console.log('\n' + (allOK ? '=== 회귀 검증 통과 ===' : '=== 회귀 검증 실패 ==='))
process.exit(allOK ? 0 : 1)
