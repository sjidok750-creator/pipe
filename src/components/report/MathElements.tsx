/**
 * 보고서 수식 렌더링 유틸리티
 *
 * 사용법:
 *   <Frac top="P(D−t)" bot="2t" />          → 분수
 *   σ<Sub>θ</Sub>                            → 아래첨자
 *   σ<Sup>2</Sup>                             → 위첨자
 *   <Sqrt>σ²+τ²</Sqrt>                        → 제곱근
 *   <FormulaRow> ... </FormulaRow>           → 수식 한 줄 (flex, 세로 정렬)
 *   <FormulaBlock> ... </FormulaBlock>       → 수식 블록 박스
 *   <ResultBlock ok={true}> ... </ResultBlock> → 결과 박스
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
export function Sqrt({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      <span style={{ fontSize: '1.1em', lineHeight: 1, marginRight: 1 }}>√</span>
      <span style={{
        borderTop: '1.2px solid currentColor',
        paddingTop: 1,
        paddingLeft: 1,
        paddingRight: 2,
      }}>
        {children}
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
        background: '#f8f9fb',
        border: '1px solid #c8d4e0',
        borderLeft: '3px solid #1a3a5c',
        padding: '8px 14px',
        margin: '5px 0 8px',
        fontSize: 10.5,
        lineHeight: 2.0,
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
    ok === undefined ? '#1a3a5c' : ok ? '#1a6b3a' : '#c0392b'
  const bg =
    ok === undefined ? '#f5f8ff' : ok ? '#f0faf4' : '#fff0f0'
  const border =
    ok === undefined ? '#c0d0e8' : ok ? '#a3d9b5' : '#f5b3b3'
  return (
    <div
      className="keep-together"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${color}`,
        padding: '6px 14px',
        margin: '4px 0',
        fontSize: 10.5,
        lineHeight: 2.0,
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
