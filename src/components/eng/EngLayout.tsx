// 공학 프로그램 스타일 공통 레이아웃 컴포넌트 — Design System v2
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { T } from './tokens'

// ══════════════════════════════════════════════════════════════
// useNumberField — 숫자 입력 훅 (커서 끊김 없이 자유롭게 타이핑)
// ══════════════════════════════════════════════════════════════
export function useNumberField(
  storedValue: number | null | undefined,
  onCommit: (n: number | null) => void,
  opts: { min?: number; max?: number; decimals?: number } = {}
) {
  const [draft, setDraft] = useState<string>(
    storedValue == null ? '' : String(storedValue)
  )
  const [focused, setFocused] = useState(false)

  // 포커스가 없을 때만 스토어 값으로 동기화
  useEffect(() => {
    if (!focused) {
      setDraft(storedValue == null ? '' : String(storedValue))
    }
  }, [storedValue, focused])

  const commit = () => {
    setFocused(false)
    if (draft.trim() === '' || draft === '-' || draft === '.') {
      onCommit(null)
      return
    }
    let n = parseFloat(draft)
    if (Number.isNaN(n)) { onCommit(null); return }
    if (opts.min != null) n = Math.max(opts.min, n)
    if (opts.max != null) n = Math.min(opts.max, n)
    if (opts.decimals != null) n = +n.toFixed(opts.decimals)
    onCommit(n)
    setDraft(String(n))
  }

  return {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      if (/^-?\d*\.?\d*$/.test(v) || v === '') setDraft(v)
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true)
      e.target.select()  // 탭 탭 시 전체 선택
    },
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      if (e.key === 'Escape') {
        setDraft(storedValue == null ? '' : String(storedValue))
        ;(e.target as HTMLInputElement).blur()
      }
    },
    inputMode: 'decimal' as const,
  }
}

// ══════════════════════════════════════════════════════════════
// EngPanel — 헤더 바 + 흰 본문 카드
// ══════════════════════════════════════════════════════════════
export function EngPanel({
  title, children, style, bodyStyle, collapsible = false, defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: T.radiusMd,
      overflow: 'hidden',
      boxShadow: T.shadow1,
      marginBottom: 8,
      ...style,
    }}>
      <div
        onClick={collapsible ? () => setOpen(v => !v) : undefined}
        style={{
          background: T.bgHeader,
          color: T.textOnDark,
          fontSize: T.fs.md,
          fontWeight: T.fw.semibold,
          fontFamily: T.fontSans,
          padding: '7px 12px',
          lineHeight: '22px',
          letterSpacing: 0.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <span>{title}</span>
        {collapsible && (
          <span style={{ fontSize: T.fs.xs, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
        )}
      </div>
      {(!collapsible || open) && (
        <div style={{
          background: T.bgPanel,
          padding: T.panelP,
          ...bodyStyle,
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EngSection — 패널 내부 섹션 구분
// ══════════════════════════════════════════════════════════════
export function EngSection({ title }: { title: string }) {
  return (
    <div style={{
      background: T.bgSection,
      color: T.textAccent,
      fontSize: T.fs.sm,
      fontWeight: T.fw.semibold,
      fontFamily: T.fontSans,
      padding: '4px 10px',
      marginBottom: 8,
      marginTop: 12,
      borderLeft: `3px solid ${T.bgActive}`,
      borderRadius: `0 ${T.radiusSm}px ${T.radiusSm}px 0`,
    }}>
      {title}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EngDivider — 구분선
// ══════════════════════════════════════════════════════════════
export function EngDivider({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 8px' }}>
      {label && (
        <span style={{ fontSize: T.fs.xs, color: T.textMuted, whiteSpace: 'nowrap', fontFamily: T.fontSans }}>
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: T.borderLight }} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EngRow — 라벨 + 입력 2컬럼 행
// ══════════════════════════════════════════════════════════════
export function EngRow({
  label, children, labelWidth = 116, unit, popover,
}: {
  label: string
  children: React.ReactNode
  labelWidth?: number
  unit?: string
  popover?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      minHeight: T.rowH,
      marginBottom: 4,
      gap: 0,
    }}>
      <div style={{
        width: labelWidth,
        flexShrink: 0,
        fontSize: T.fs.sm,
        color: T.textLabel,
        fontWeight: T.fw.medium,
        fontFamily: T.fontSans,
        lineHeight: T.lh.normal,
        paddingRight: 8,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
        {children}
        {unit && (
          <span style={{ fontSize: T.fs.xs, color: T.textMuted, whiteSpace: 'nowrap' }}>{unit}</span>
        )}
        {popover && <span style={{ marginLeft: 2 }}>{popover}</span>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EngInput — 숫자 입력칸 (로컬 draft 상태 — 지우기·재입력 자유)
// ══════════════════════════════════════════════════════════════
export function EngInput({
  value, onChange, min, max, step, width = 96, disabled, compact,
}: {
  value: string | number
  onChange?: (v: string) => void
  min?: number; max?: number; step?: number
  width?: number
  disabled?: boolean
  compact?: boolean
}) {
  const [draft, setDraft] = useState<string>(String(value ?? ''))
  const [hasError, setHasError] = useState(false)
  const [focused, setFocused] = useState(false)

  // 외부 값(store) 변경 시 포커스 없을 때만 draft 동기화
  useEffect(() => {
    if (!focused) {
      setDraft(String(value ?? ''))
      setHasError(false)
    }
  }, [value, focused])

  const h = compact ? T.inputHCompact : T.inputH

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setDraft(v)
    if (v.trim() === '' || isNaN(parseFloat(v))) {
      setHasError(true)
    } else {
      setHasError(false)
      onChange?.(v)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false)
    if (hasError || draft.trim() === '' || isNaN(parseFloat(draft))) {
      setDraft(String(value ?? ''))
      setHasError(false)
      e.target.style.borderColor = disabled ? T.borderLight : T.border
    } else {
      e.target.style.borderColor = disabled ? T.borderLight : T.border
    }
    e.target.style.boxShadow = T.shadow0
  }

  const borderCol = hasError ? '#ef4444' : T.border

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, verticalAlign: 'top' }}>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={handleChange}
        disabled={disabled}
        style={{
          width,
          height: h,
          border: `1px solid ${disabled ? T.borderLight : borderCol}`,
          borderRadius: T.radiusSm,
          padding: '0 8px',
          fontSize: T.fs.base,
          fontFamily: T.fontMono,
          background: disabled ? T.bgInputDisabled : T.bgInput,
          color: disabled ? T.textDisabled : hasError ? '#ef4444' : T.textPrimary,
          outline: 'none',
          textAlign: 'right',
          boxSizing: 'border-box',
          touchAction: 'manipulation',
          transition: `border-color 120ms, box-shadow 120ms`,
        }}
        onFocus={e => {
          setFocused(true)
          e.target.style.borderColor = hasError ? '#ef4444' : T.borderFocus
          e.target.style.boxShadow = hasError ? '0 0 0 2px rgba(239,68,68,0.15)' : T.shadowFocus
          e.target.select()
        }}
        onBlur={handleBlur}
      />
      {hasError && (
        <span style={{ fontSize: 9, color: '#ef4444', fontFamily: T.fontSans, whiteSpace: 'nowrap', lineHeight: 1 }}>
          숫자를 입력하세요
        </span>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EngValue — 읽기전용 계산값 표시
// ══════════════════════════════════════════════════════════════
export function EngValue({
  value, unit, width = 96, color, compact,
}: {
  value: string | number
  unit?: string
  width?: number
  color?: string
  compact?: boolean
}) {
  const h = compact ? T.inputHCompact : T.inputH
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 3,
      width,
      height: h,
      border: `1px solid ${T.borderLight}`,
      borderRadius: T.radiusSm,
      background: T.bgPanelAlt,
      padding: '0 8px',
      fontSize: T.fs.base,
      fontFamily: T.fontMono,
      color: color ?? T.textNumber,
      boxSizing: 'border-box',
    }}>
      <span>{typeof value === 'number' ? value.toFixed(3) : value}</span>
      {unit && <span style={{ fontSize: T.fs.xs, color: T.textMuted }}>{unit}</span>}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════
// EngRadio — 라디오 버튼 그룹
// ══════════════════════════════════════════════════════════════
export function EngRadio({
  options, value, onChange, row = true,
}: {
  options: { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
  row?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: row ? 'row' : 'column', gap: row ? 12 : 6 }}>
      {options.map(opt => {
        const active = opt.key === value
        return (
          <label
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', userSelect: 'none',
              minHeight: 36, touchAction: 'manipulation',
            }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${active ? T.bgActive : T.border}`,
              background: active ? T.bgActive : T.bgPanel,
              transition: 'border-color 120ms, background 120ms',
            }}>
              {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.textOnDark }} />}
            </span>
            <span style={{
              fontSize: T.fs.base,
              color: active ? T.textAccent : T.textLabel,
              fontWeight: active ? T.fw.semibold : T.fw.regular,
              fontFamily: T.fontSans,
            }}>
              {opt.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EngSegment — 세그먼트 컨트롤 (버튼형 라디오)
// ══════════════════════════════════════════════════════════════
export function EngSegment({
  options, value, onChange,
}: {
  options: { key: string; label: string; sub?: string }[]
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div style={{
      display: 'flex',
      flex: 1,
      minWidth: 0,
      border: `1px solid ${T.border}`,
      borderRadius: T.radiusSm,
      overflow: 'hidden',
    }}>
      {options.map((opt, i) => {
        const active = opt.key === value
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              flex: 1,
              padding: '5px 10px',
              minHeight: T.buttonH,
              borderTop: 'none', borderBottom: 'none', borderLeft: 'none',
              borderRight: i < options.length - 1 ? `1px solid ${T.border}` : 'none',
              background: active ? T.bgActive : T.bgPanel,
              color: active ? T.textOnDark : T.textLabel,
              fontSize: T.fs.sm,
              fontWeight: active ? T.fw.semibold : T.fw.regular,
              fontFamily: T.fontSans,
              cursor: 'pointer',
              transition: 'background 120ms, color 120ms',
              touchAction: 'manipulation',
            }}
          >
            {opt.sub && (
              <div style={{ fontSize: T.fs.xs, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {opt.sub}
              </div>
            )}
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</div>
          </button>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EngTable — 결과 테이블
// ══════════════════════════════════════════════════════════════
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
    <table style={{
      width: '100%', borderCollapse: 'collapse',
      fontSize: T.fs.sm, fontFamily: T.fontSans,
      borderRadius: T.radiusMd, overflow: 'hidden',
    }}>
      <thead>
        <tr style={{ background: T.bgSection }}>
          <th style={{ ...thS, width: '38%', textAlign: 'left' }}>항목</th>
          <th style={{ ...thS, width: '28%', textAlign: 'right' }}>계산값</th>
          <th style={{ ...thS, width: '20%', textAlign: 'right' }}>허용값</th>
          <th style={{ ...thS, width: '14%', textAlign: 'center' }}>판정</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            style={{ background: i % 2 === 0 ? T.bgPanel : T.bgRow }}
          >
            <td style={{ ...tdS }}>
              <div style={{ fontWeight: T.fw.medium, color: T.textLabel }}>{row.label}</div>
              {row.formula && (
                <div style={{ fontSize: T.fs.xs, color: T.textMuted, fontFamily: T.fontMono, marginTop: 1 }}>
                  {row.formula}
                </div>
              )}
            </td>
            <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, color: T.textNumber, fontWeight: T.fw.semibold }}>
              {typeof row.value === 'number'
                ? (Math.abs(row.value) < 0.001 && row.value !== 0 ? row.value.toExponential(3) : row.value.toFixed(4))
                : row.value}
              {row.unit && <span style={{ fontSize: T.fs.xs, color: T.textMuted, marginLeft: 3 }}>{row.unit}</span>}
            </td>
            <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, color: T.textMuted }}>
              {row.limit !== undefined
                ? (typeof row.limit === 'number'
                  ? (Math.abs(row.limit) < 0.001 ? row.limit.toExponential(3) : row.limit.toFixed(4))
                  : row.limit)
                : '—'}
              {row.limit !== undefined && row.unit && <span style={{ fontSize: T.fs.xs, marginLeft: 2 }}>{row.unit}</span>}
            </td>
            <td style={{ ...tdS, textAlign: 'center' }}>
              {row.ok !== undefined && (
                <span style={{
                  fontSize: T.fs.xs, fontWeight: T.fw.bold,
                  padding: '2px 8px', borderRadius: T.radiusSm,
                  background: row.ok ? T.bgOK : T.bgNG,
                  color: row.ok ? T.textOK : T.textNG,
                  border: `1px solid ${row.ok ? T.borderOK : T.borderNG}`,
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

const thS: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: T.fs.xs,
  fontWeight: T.fw.bold,
  color: T.textAccent,
  borderBottom: `1px solid ${T.border}`,
}
const tdS: React.CSSProperties = {
  padding: '5px 8px',
  borderBottom: `1px solid ${T.borderLight}`,
  verticalAlign: 'middle',
}

// ══════════════════════════════════════════════════════════════
// EngParamGrid — 파라미터 그리드
// ══════════════════════════════════════════════════════════════
export function EngParamGrid({
  params,
}: {
  params: { label: string; value: string | number; unit?: string }[]
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(176px, 1fr))',
      gap: '1px',
      border: `1px solid ${T.border}`,
      borderRadius: T.radiusMd,
      background: T.border,
      overflow: 'hidden',
    }}>
      {params.map((p, i) => (
        <div key={i} style={{
          background: i % 2 === 0 ? T.bgPanel : T.bgRow,
          padding: '5px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: T.fs.xs, color: T.textLabel, fontFamily: T.fontSans }}>{p.label}</span>
          <span style={{ fontSize: T.fs.sm, fontFamily: T.fontMono, color: T.textNumber, fontWeight: T.fw.semibold, whiteSpace: 'nowrap' }}>
            {typeof p.value === 'number'
              ? (Math.abs(p.value) < 0.0001 && p.value !== 0 ? p.value.toExponential(3) : p.value.toFixed(4))
              : p.value}
            {p.unit && <span style={{ fontSize: T.fs.xs, color: T.textMuted, marginLeft: 3 }}>{p.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EngPopover — 클릭형 설명 패널 (개선: 버튼 스타일 + 360px)
// ══════════════════════════════════════════════════════════════
export function EngPopover({ title, children, width = 360 }: {
  title?: string
  children: React.ReactNode
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false })
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
    const kbHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', kbHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', kbHandler)
    }
  }, [open])

  const handleClick = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const left = Math.min(r.left, window.innerWidth - width - 12)
      const spaceBelow = window.innerHeight - r.bottom - 12
      const openUp = spaceBelow < 300 && r.top > 200
      setPos({ top: openUp ? r.top - 6 : r.bottom + 6, left: Math.max(8, left), openUp })
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
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 8px',
          height: 22,
          borderRadius: T.radiusSm,
          border: `1px solid ${open ? T.bgActive : T.border}`,
          background: open ? T.bgActive : T.bgPanelAlt,
          color: open ? T.textOnDark : T.textMuted,
          fontSize: T.fs.xs,
          fontWeight: T.fw.medium,
          fontFamily: T.fontSans,
          letterSpacing: 0.2,
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
          transition: 'background 120ms, color 120ms, border-color 120ms',
          touchAction: 'manipulation',
        }}
      >
        설명
      </button>
      {open && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            left: pos.left,
            zIndex: 9999,
            background: T.bgPanel,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusMd,
            boxShadow: T.shadow3,
            padding: '14px 16px',
            width,
            maxHeight: 'min(60vh, 480px)',
            overflowY: 'auto',
            fontSize: T.fs.sm,
            lineHeight: T.lh.relaxed,
            color: T.textPrimary,
            fontFamily: T.fontSans,
            ...(pos.openUp
              ? { bottom: window.innerHeight - pos.top, top: 'auto' }
              : { top: pos.top, bottom: 'auto' }),
          }}
        >
          {title && (
            <div style={{
              fontWeight: T.fw.bold, fontSize: T.fs.base,
              marginBottom: 10, color: T.textAccent,
              borderBottom: `1px solid ${T.borderLight}`,
              paddingBottom: 8, fontFamily: T.fontSans,
            }}>
              {title}
            </div>
          )}
          {children}
        </div>,
        document.body
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// EngStatusBar — 계산 결과 상태 바
// ══════════════════════════════════════════════════════════════
export function EngStatusBar({ ok, message }: { ok?: boolean; message: string }) {
  const bg =     ok === undefined ? T.bgSection : ok ? T.bgOK    : T.bgNG
  const color =  ok === undefined ? T.textAccent : ok ? T.textOK  : T.textNG
  const border = ok === undefined ? T.border     : ok ? T.borderOK : T.borderNG
  return (
    <div style={{
      background: bg, color,
      fontWeight: T.fw.semibold,
      fontSize: T.fs.base,
      fontFamily: T.fontSans,
      padding: '7px 14px',
      border: `1px solid ${border}`,
      borderRadius: T.radiusMd,
      marginTop: 10,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {ok !== undefined && <span style={{ fontWeight: T.fw.bold }}>{ok ? '▶ O.K.' : '▶ N.G.'}</span>}
      <span style={{ fontWeight: ok !== undefined ? T.fw.regular : T.fw.semibold }}>{message}</span>
    </div>
  )
}
