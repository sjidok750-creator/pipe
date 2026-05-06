import React from 'react'
import { T } from '../eng/tokens'

interface GaugeItem {
  label: string
  value: number
  allow: number
  unit: string
  ok: boolean
  higherIsBetter?: boolean
}

interface Props {
  items: GaugeItem[]
}

// DCR 값에 따른 색상
function rColor(r: number): string {
  if (r <= 0.70) return '#2d8659'   // 안전 — 차분한 녹색
  if (r <= 0.90) return '#c19a2b'   // 주의 — 앰버
  if (r <= 1.00) return '#d97a2e'   // 경고 — 오렌지
  return '#b8392f'                   // 위험 — 빨강
}

function DCRRow({ label, value, allow, unit, ok, higherIsBetter = false }: GaugeItem) {
  const MAX_RATIO = 1.2   // 트랙 기준 최대 (1.0이 83.3% 위치)
  const LIMIT_PCT = (1.0 / MAX_RATIO) * 100  // 83.3%

  const r = higherIsBetter
    ? (allow > 0 ? allow / value : 0)   // 좌굴: allow/value (클수록 안전)
    : (allow > 0 ? value / allow : 0)   // 응력 등: value/allow

  const barPct = Math.min(r, MAX_RATIO) / MAX_RATIO * 100
  const color = rColor(r)

  const fmt = (v: number) => {
    if (v === undefined || v === null || isNaN(v)) return '-'
    return Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(2)
  }

  const valueStr = higherIsBetter
    ? `FS ${fmt(value)} / ${fmt(allow)}`
    : `${fmt(value)} / ${fmt(allow)}${unit ? ' ' + unit : ''}`

  const rStr = r.toFixed(2)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 30,
      padding: '0 2px',
    }}>
      {/* 라벨 — 고정폭 */}
      <div style={{
        width: 128,
        flexShrink: 0,
        fontSize: 11,
        color: T.textLabel,
        fontFamily: T.fontSans,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {label}
      </div>

      {/* 바 트랙 — flex 1 */}
      <div style={{ flex: 1, position: 'relative', height: 16 }}>
        {/* 트랙 배경 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: '#eef1f4',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          {/* 채움 바 */}
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: `${barPct}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
        {/* 1.0 한계선 */}
        <div style={{
          position: 'absolute',
          left: `${LIMIT_PCT}%`,
          top: -2, bottom: -2,
          width: 1.5,
          background: '#444',
          borderLeft: '1.5px dashed #444',
          pointerEvents: 'none',
        }} />
        {/* 비율 숫자 (바 위) */}
        <div style={{
          position: 'absolute',
          left: `${Math.min(barPct, 92)}%`,
          top: '50%',
          transform: 'translate(-100%, -50%)',
          fontSize: 9,
          fontFamily: T.fontMono,
          color: barPct > 20 ? 'white' : color,
          fontWeight: 700,
          paddingRight: 3,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {rStr}
        </div>
      </div>

      {/* 값/허용 — 고정폭, 우정렬 */}
      <div style={{
        width: 118,
        flexShrink: 0,
        fontSize: 10.5,
        fontFamily: T.fontMono,
        color: T.textMuted,
        textAlign: 'right',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {valueStr}
      </div>

      {/* OK/NG 뱃지 — 고정폭 */}
      <div style={{
        width: 36,
        flexShrink: 0,
        height: 18,
        borderRadius: 9,
        background: ok ? '#2d8659' : '#b8392f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9.5,
        fontWeight: 700,
        color: 'white',
        fontFamily: T.fontSans,
        letterSpacing: 0.3,
      }}>
        {ok ? 'OK' : 'NG'}
      </div>
    </div>
  )
}

export default function SafetyGaugeSVG({ items }: Props) {
  if (!items || items.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '4px 0' }}>
      {/* 범례 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 4,
        borderBottom: `1px solid ${T.borderLight}`,
        marginBottom: 2,
      }}>
        <div style={{ width: 128, flexShrink: 0, fontSize: 9.5, color: T.textMuted, fontFamily: T.fontSans }}>항목</div>
        <div style={{ flex: 1, position: 'relative', fontSize: 9, color: T.textMuted, fontFamily: T.fontSans }}>
          <span style={{ position: 'absolute', left: 0 }}>0</span>
          <span style={{
            position: 'absolute',
            left: `${(1.0 / 1.2) * 100}%`,
            transform: 'translateX(-50%)',
            color: '#444',
            fontWeight: 600,
          }}>허용한계</span>
          <span style={{ position: 'absolute', right: 0 }}>1.2</span>
        </div>
        <div style={{ width: 118, flexShrink: 0, fontSize: 9.5, color: T.textMuted, fontFamily: T.fontSans, textAlign: 'right' }}>실제 / 허용</div>
        <div style={{ width: 36, flexShrink: 0 }} />
      </div>

      {items.map((item) => (
        <DCRRow key={item.label} {...item} />
      ))}

      {/* 범례 색상 설명 */}
      <div style={{
        display: 'flex',
        gap: 14,
        paddingTop: 6,
        marginTop: 2,
        borderTop: `1px solid ${T.borderLight}`,
        justifyContent: 'flex-end',
      }}>
        {[
          { color: '#2d8659', label: '안전 (< 0.70)' },
          { color: '#c19a2b', label: '주의 (0.70–0.90)' },
          { color: '#d97a2e', label: '경고 (0.90–1.00)' },
          { color: '#b8392f', label: '위험 (> 1.00)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: T.textMuted, fontFamily: T.fontSans, whiteSpace: 'nowrap' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
