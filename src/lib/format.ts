// ============================================================
// 숫자 표시 포맷터 — 유효숫자 기반 공학 표기
// 원칙: 유효숫자 4자리, 무의미한 뒷자리 0 제거, 천단위 콤마
//   1.5000 m   → 1.5 m
//   610.0000 mm → 610 mm
//   22.8750 MPa → 22.88 MPa
//   0.096821    → 0.09682
//   142307.8    → 142,300
// ============================================================

export function fmtNum(v: number | string | null | undefined, sig = 4): string {
  if (v == null) return '—'
  if (typeof v === 'string') return v
  if (!isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  // 과대/과소값은 지수 표기 (유효 3자리)
  if (a >= 1e7 || a < 1e-4) return v.toExponential(3)
  const r = Number(v.toPrecision(sig))
  return r.toLocaleString('en-US', { maximumFractionDigits: 10 })
}
