/**
 * 보고서 수식 렌더링 유틸리티
 */
import React from 'react'

// ── 분수 ─────────────────────────────────────────────────────
export function Frac({
  top, bot, fontSize,
}: {
  top: React.ReactNode
  bot: React.ReactNode
  fontSize?: string | number
}) {
  return (
    <span className="frac" style={fontSize ? { fontSize } : undefined}>
      <span>{top}</span>
      <span>{bot}</span>
    </span>
  )
}

// ── 위첨자 ────────────────────────────────────────────────────
export function Sup({ children }: { children: React.ReactNode }) {
  return <sup style={{ fontSize: '0.72em', lineHeight: 0, verticalAlign: 'super' }}>{children}</sup>
}

// ── 아래첨자 ──────────────────────────────────────────────────
export function Sub({ children }: { children: React.ReactNode }) {
  return <sub style={{ fontSize: '0.72em', lineHeight: 0, verticalAlign: 'sub' }}>{children}</sub>
}

// ── 제곱근 ────────────────────────────────────────────────────
export function Sqrt({ children, inner }: { children?: React.ReactNode; inner?: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      <span style={{ fontSize: '1.1em', lineHeight: 1, marginRight: 1 }}>√</span>
      <span style={{
        borderTop: '1.2px solid currentColor',
        paddingTop: 1,
        paddingLeft: 1,
        paddingRight: 2,
      }}>
        {inner ?? children}
      </span>
    </span>
  )
}

// ── 수식 한 줄 컨테이너 ───────────────────────────────────────
export function FormulaRow({ children, indent }: { children: React.ReactNode; indent?: number }) {
  return (
    <div className="formula-line" style={{ paddingLeft: indent ? indent * 16 : 0 }}>
      {children}
    </div>
  )
}

// ── 수식 블록 박스 ───────────────────────────────────────────
export function FormulaBlock({
  children, style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      className="formula-box keep-together"
      style={{
        background: '#F9F7F4',
        border: '1px solid #E0DDD7',
        borderLeft: '3px solid #CC6B3D',
        padding: '5px 12px',
        margin: '4px 0 6px',
        fontSize: 10.5,
        lineHeight: 1.55,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── 결과 박스 ─────────────────────────────────────────────────
export function ResultBlock({
  children, ok,
}: {
  children: React.ReactNode
  ok?: boolean
}) {
  const color =
    ok === undefined ? '#CC6B3D' : ok ? '#1a6b3a' : '#c0392b'
  const bg =
    ok === undefined ? '#FEF7F3' : ok ? '#f0faf4' : '#fff0f0'
  const border =
    ok === undefined ? '#FDF0EB' : ok ? '#a3d9b5' : '#f5b3b3'
  return (
    <div
      className="keep-together"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${color}`,
        padding: '4px 12px',
        margin: '3px 0 5px',
        fontSize: 10.5,
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  )
}

// ── 판정 뱃지 ─────────────────────────────────────────────────
export function OKBadge({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      fontSize: 10.5,
      fontWeight: 700,
      borderRadius: 2,
      background: ok ? '#f0faf4' : '#fff0f0',
      color: ok ? '#1a6b3a' : '#c0392b',
      border: `1px solid ${ok ? '#a3d9b5' : '#f5b3b3'}`,
    }}>
      {ok ? 'O.K.' : 'N.G.'}
    </span>
  )
}

// ── 자주 쓰는 그리스/수학 기호 ────────────────────────────────
export const G = {
  sigma:   'σ',
  tau:     'τ',
  epsilon: 'ε',
  alpha:   'α',
  beta:    'β',
  gamma:   'γ',
  delta:   'δ',
  theta:   'θ',
  nu:      'ν',
  pi:      'π',
  mu:      'μ',
  rho:     'ρ',
  omega:   'ω',
  Delta:   'Δ',
  Sigma:   'Σ',
  lambda:  'λ',
  xi:      'ξ',
  le:      '≤',
  ge:      '≥',
  ne:      '≠',
  approx:  '≈',
  times:   '×',
  deg:     '°',
  sq:      '²',
  cb:      '³',
  sqrt:    '√',
  cdot:    '·',
  pm:      '±',
  inf:     '∞',
}
