// 공학 프로그램 스타일 공통 레이아웃 컴포넌트
import React, { useState, useRef, useEffect } from 'react'
import { T } from './tokens'

// ── 패널 (헤더 바 + 흰 본문) ────────────────────────────────
export function EngPanel({
  title, children, style, bodyStyle,
}: {
  title: string
  children: React.ReactNode
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}) {
  return (
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 8,
      ...style,
    }}>
      <div style={{
        background: T.bgHeader,
        color: T.textActive,
        fontSize: T.fontSzHeader,
        fontWeight: 700,
        padding: '4px 10px',
        lineHeight: '20px',
        letterSpacing: 0.3,
        fontFamily: T.fontSans,
      }}>
        {title}
      </div>
      <div style={{
        background: T.bgPanel,
        padding: T.panelP,
        ...bodyStyle,
      }}>
        {children}
      </div>
    </div>
  )
}

// ── 서브 섹션 헤더 (패널 내부 구분) ─────────────────────────
export function EngSection({ title }: { title: string }) {
  return (
    <div style={{
      background: T.bgSection,
      color: T.textAccent,
      fontSize: '11px',
      fontWeight: 700,
      padding: '3px 8px',
      marginBottom: 6,
      marginTop: 10,
      borderLeft: `3px solid ${T.bgActive}`,
      fontFamily: T.fontSans,
    }}>
      {title}
    </div>
  )
}

// ── 구분선 ───────────────────────────────────────────────────
export function EngDivider({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 6px' }}>
      {label && (
        <span style={{ fontSize: '10px', color: T.textMuted, whiteSpace: 'nowrap', fontFamily: T.fontSans }}>{label}</span>
      )}
      <div style={{ flex: 1, height: 1, background: T.borderLight }} />
    </div>
  )
}

// ── 2컬럼 그리드 행 (라벨 + 컨트롤) ────────────────────────
export function EngRow({
  label, children, labelWidth = 110, unit,
}: {
  label: string
  children: React.ReactNode
  labelWidth?: number
  unit?: string
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      minHeight: T.rowH,
      marginBottom: 3,
    }}>
      <div style={{
        width: labelWidth,
        flexShrink: 0,
        fontSize: T.fontSzLabel,
        color: T.textLabel,
        fontWeight: 600,
        fontFamily: T.fontSans,
        paddingRight: 6,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {children}
        {unit && (
          <span style={{ fontSize: '11px', color: T.textMuted, whiteSpace: 'nowrap', marginLeft: 2 }}>{unit}</span>
        )}
      </div>
    </div>
  )
}

// ── 숫자 입력 ────────────────────────────────────────────────
export function EngInput({
  value, onChange, min, max, step, width = 90, disabled,
}: {
  value: string | number
  onChange?: (v: string) => void
  min?: number; max?: number; step?: number
  width?: number
  disabled?: boolean
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      min={min} max={max} step={step}
      disabled={disabled}
      style={{
        width,
        height: T.inputH,
        border: `1px solid ${disabled ? T.borderLight : T.borderDark}`,
        borderRadius: 0,
        padding: '0 5px',
        fontSize: T.fontSzInput,
        fontFamily: T.fontMono,
        background: disabled ? T.bgRow : T.bgInput,
        color: T.textPrimary,
        outline: 'none',
        textAlign: 'right',
      }}
    />
  )
}

// ── 텍스트 표시 (읽기전용 숫자) ─────────────────────────────
export function EngValue({
  value, unit, width = 90, color,
}: {
  value: string | number
  unit?: string
  width?: number
  color?: string
}) {
  return (
    <span style={{
      display: 'inline-block',
      width,
      height: T.inputH,
      border: `1px solid ${T.borderLight}`,
      background: T.bgRow,
      padding: '0 5px',
      fontSize: T.fontSzInput,
      fontFamily: T.fontMono,
      color: color ?? T.textNumber,
      lineHeight: T.inputH,
      textAlign: 'right',
    }}>
      {typeof value === 'number' ? value.toFixed(3) : value}
      {unit && <span style={{ fontSize: '10px', color: T.textMuted, marginLeft: 2 }}>{unit}</span>}
    </span>
  )
}

// ── 라디오 그룹 ──────────────────────────────────────────────
export function EngRadio({
  options, value, onChange, row = true,
}: {
  options: { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
  row?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: row ? 'row' : 'column', gap: row ? 8 : 4 }}>
      {options.map(opt => {
        const active = opt.key === value
        return (
          <label key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              cursor: 'pointer', userSelect: 'none',
            }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 13, height: 13, borderRadius: '50%',
              border: `1.5px solid ${active ? T.bgActive : T.borderDark}`,
              background: active ? T.bgActive : T.bgPanel,
              flexShrink: 0,
            }}>
              {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />}
            </span>
            <span style={{
              fontSize: '12px',
              color: active ? T.textAccent : T.textPrimary,
              fontWeight: active ? 700 : 400,
              fontFamily: T.fontSans,
            }}>{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}

// ── 버튼형 라디오 (세그먼트 컨트롤) ─────────────────────────
export function EngSegment({
  options, value, onChange,
}: {
  options: { key: string; label: string; sub?: string }[]
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${T.borderDark}`, borderRadius: 2, overflow: 'hidden' }}>
      {options.map((opt, i) => {
        const active = opt.key === value
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              flex: 1,
              padding: '3px 8px',
              borderTop: 'none',
              borderBottom: 'none',
              borderLeft: 'none',
              borderRight: i < options.length - 1 ? `1px solid ${T.borderDark}` : 'none',
              background: active ? T.bgActive : T.bgPanel,
              color: active ? T.textActive : T.textPrimary,
              fontSize: '11px',
              fontWeight: active ? 700 : 400,
              cursor: 'pointer',
              fontFamily: T.fontSans,
              lineHeight: '18px',
            }}
          >
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</div>
            {opt.sub && <div style={{ fontSize: '9px', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.sub}</div>}
          </button>
        )
      })}
    </div>
  )
}

// ── 결과 테이블 ──────────────────────────────────────────────
export function EngTable({
  rows,
}: {
  rows: {
    label: string
    formula?: string
    value: string | number
    unit?: string
    limit?: string | number
    ok?: boolean
  }[]
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: T.fontSans }}>
      <thead>
        <tr style={{ background: T.bgSection }}>
          <th style={{ ...thStyle, width: '38%', textAlign: 'left' }}>항목</th>
          <th style={{ ...thStyle, width: '28%', textAlign: 'right' }}>계산값</th>
          <th style={{ ...thStyle, width: '20%', textAlign: 'right' }}>허용값</th>
          <th style={{ ...thStyle, width: '14%', textAlign: 'center' }}>판정</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? T.bgRowAlt : T.bgRow }}>
            <td style={{ ...tdStyle }}>
              <div style={{ fontWeight: 600, color: T.textLabel }}>{row.label}</div>
              {row.formula && <div style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontMono }}>{row.formula}</div>}
            </td>
            <td style={{ ...tdStyle, textAlign: 'right', fontFamily: T.fontMono, color: T.textNumber, fontWeight: 600 }}>
              {typeof row.value === 'number'
                ? (Math.abs(row.value) < 0.001 && row.value !== 0
                  ? row.value.toExponential(3)
                  : row.value.toFixed(4))
                : row.value}
              {row.unit && <span style={{ fontSize: '10px', color: T.textMuted, marginLeft: 3 }}>{row.unit}</span>}
            </td>
            <td style={{ ...tdStyle, textAlign: 'right', fontFamily: T.fontMono, color: T.textMuted }}>
              {row.limit !== undefined
                ? (typeof row.limit === 'number'
                  ? (Math.abs(row.limit) < 0.001 ? row.limit.toExponential(3) : row.limit.toFixed(4))
                  : row.limit)
                : '—'}
              {row.limit !== undefined && row.unit && <span style={{ fontSize: '10px', marginLeft: 2 }}>{row.unit}</span>}
            </td>
            <td style={{ ...tdStyle, textAlign: 'center' }}>
              {row.ok !== undefined && (
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '1px 6px',
                  background: row.ok ? T.bgOK : T.bgNG,
                  color: row.ok ? T.textOK : T.textNG,
                  border: `1px solid ${row.ok ? '#a3d9b5' : '#f5b3b3'}`,
                  borderRadius: 2,
                }}>
                  {row.ok ? 'O.K.' : 'N.G.'}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const thStyle: React.CSSProperties = {
  padding: '4px 6px',
  fontSize: '11px',
  fontWeight: 700,
  color: T.textAccent,
  borderBottom: `1px solid ${T.border}`,
}
const tdStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderBottom: `1px solid ${T.borderLight}`,
  verticalAlign: 'middle',
}

// ── 파라미터 그리드 (결과 수치 표시) ─────────────────────────
export function EngParamGrid({
  params,
}: {
  params: { label: string; value: string | number; unit?: string }[]
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
      gap: '1px',
      border: `1px solid ${T.border}`,
      background: T.border,
    }}>
      {params.map((p, i) => (
        <div key={i} style={{
          background: i % 2 === 0 ? T.bgRowAlt : T.bgRow,
          padding: '4px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: '11px', color: T.textLabel, fontFamily: T.fontSans }}>{p.label}</span>
          <span style={{ fontSize: '12px', fontFamily: T.fontMono, color: T.textNumber, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {typeof p.value === 'number'
              ? (Math.abs(p.value) < 0.0001 && p.value !== 0 ? p.value.toExponential(3) : p.value.toFixed(4))
              : p.value}
            {p.unit && <span style={{ fontSize: '10px', color: T.textMuted, marginLeft: 2 }}>{p.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── 정보 팝오버 (ⓘ 버튼 클릭 → 패널) ──────────────────────
export function EngPopover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleClick = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const panelW = 480
      const left = Math.min(r.left, window.innerWidth - panelW - 12)
      setPos({ top: r.bottom + 6, left: Math.max(8, left) })
    }
    setOpen(v => !v)
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={handleClick}
        title="설명 보기"
        style={{
          width: 18, height: 18, borderRadius: '50%',
          border: `1px solid ${T.bgActive}`,
          background: open ? T.bgActive : T.bgPanel,
          color: open ? 'white' : T.bgActive,
          fontSize: '11px', fontWeight: 700, lineHeight: '16px',
          cursor: 'pointer', padding: 0,
          fontFamily: T.fontSans,
          flexShrink: 0,
        }}
      >
        ⓘ
      </button>
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            background: 'white',
            border: `1px solid ${T.borderDark}`,
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            padding: '14px 16px',
            width: 480,
            maxHeight: '70vh',
            overflowY: 'auto',
            fontSize: '12px',
            lineHeight: 1.75,
            color: T.textPrimary,
            fontFamily: T.fontSans,
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ── 상태 바 (계산 전/후) ─────────────────────────────────────
export function EngStatusBar({ ok, message }: { ok?: boolean; message: string }) {
  const bg = ok === undefined ? '#e8edf2' : ok ? T.bgOK : T.bgNG
  const color = ok === undefined ? T.textAccent : ok ? T.textOK : T.textNG
  return (
    <div style={{
      background: bg, color, fontWeight: 700,
      fontSize: '12px', padding: '5px 12px',
      border: `1px solid ${ok === undefined ? T.border : ok ? '#a3d9b5' : '#f5b3b3'}`,
      borderRadius: 2, marginTop: 8,
      fontFamily: T.fontSans,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {ok !== undefined && <span>{ok ? '▶ O.K.' : '▶ N.G.'}</span>}
      <span style={{ fontWeight: ok !== undefined ? 400 : 700 }}>{message}</span>
    </div>
  )
}
