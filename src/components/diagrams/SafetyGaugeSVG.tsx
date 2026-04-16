import React from 'react'

interface GaugeItem {
  label: string
  value: number
  allow: number
  unit: string
  ok: boolean
  higherIsBetter?: boolean  // true: 값이 클수록 좋음 (좌굴 안전율)
}

interface Props {
  items: GaugeItem[]
}

function SingleGauge({ label, value, allow, unit, ok, higherIsBetter = false }: GaugeItem) {
  const W = 140
  const HH = 110
  const cx = W / 2
  const cy = 68
  const R = 48
  const strokeW = 14

  // 바늘 각도 계산
  // higherIsBetter: value/allow 비율이 1이면 중간, 2이면 오른쪽
  // lowerIsBetter: value/allow 비율이 0이면 왼쪽, 1이면 중간
  let ratio: number
  if (higherIsBetter) {
    ratio = Math.min(value / allow, 2) / 2  // 0 ~ 1 (1.0이 중간)
  } else {
    ratio = Math.min(value / allow, 1.5) / 1.5
  }

  // 반원: -180° ~ 0° → ratio: 0~1
  const needleAngle = -180 + ratio * 180  // degrees
  const rad = needleAngle * (Math.PI / 180)
  const nx = cx + (R - strokeW - 6) * Math.cos(rad)
  const ny = cy + (R - strokeW - 6) * Math.sin(rad)

  // 위험/주의/안전 영역
  const color = ok ? '#1a7a3c' : '#c0392b'
  const gaugeColor = higherIsBetter
    ? (value >= allow * 1.5 ? '#1a7a3c' : value >= allow ? '#1a7a3c' : value >= allow * 0.8 ? '#e67e22' : '#c0392b')
    : (value <= allow * 0.7 ? '#1a7a3c' : value <= allow * 0.9 ? '#e67e22' : '#c0392b')

  // 원호 경로 생성 (반원)
  function arcPath(startDeg: number, endDeg: number, r: number) {
    const s = startDeg * Math.PI / 180
    const e = endDeg   * Math.PI / 180
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`
  }

  return (
    <svg width={W} height={HH} viewBox={`0 0 ${W} ${HH}`}>
      {/* 배경 */}
      <rect width={W} height={HH} fill="white" rx="8" stroke="#e0e8f0" strokeWidth="1"/>

      {/* 게이지 배경 (회색) */}
      <path d={arcPath(-180, 0, R)} fill="none" stroke="#e0e0e0" strokeWidth={strokeW}
            strokeLinecap="round"/>

      {/* 안전 구역 (초록) */}
      <path d={arcPath(-180, higherIsBetter ? -60 : -60, R)} fill="none"
            stroke="#1a7a3c" strokeWidth={strokeW} strokeLinecap="round" opacity="0.8"/>
      {/* 주의 구역 (주황) */}
      <path d={arcPath(higherIsBetter ? -60 : -60, higherIsBetter ? -30 : -20, R)} fill="none"
            stroke="#e67e22" strokeWidth={strokeW} opacity="0.8"/>
      {/* 위험 구역 (빨강) */}
      <path d={arcPath(higherIsBetter ? -30 : -20, 0, R)} fill="none"
            stroke="#c0392b" strokeWidth={strokeW} strokeLinecap="round" opacity="0.8"/>

      {/* 현재값 호 */}
      <path d={arcPath(-180, needleAngle, R)} fill="none"
            stroke={gaugeColor} strokeWidth={strokeW - 4} opacity="0.3"/>

      {/* 바늘 */}
      <line x1={cx} y1={cy} x2={nx} y2={ny}
            stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="5" fill="#333"/>

      {/* 라벨 */}
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
        {typeof value === 'number' ? value.toFixed(2) : '-'}{unit}
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fontSize="8" fill="#777">
        허용 {allow.toFixed(2)}{unit}
      </text>

      {/* 항목명 */}
      <text x={cx} y={13} textAnchor="middle" fontSize="9" fontWeight="600" fill="#003366">
        {label}
      </text>

      {/* OK/NG */}
      <rect x={cx - 16} y={HH - 20} width={32} height={14} rx="7" fill={color}/>
      <text x={cx} y={HH - 9} textAnchor="middle" fontSize="9" fill="white" fontWeight="700">
        {ok ? 'OK' : 'NG'}
      </text>
    </svg>
  )
}

export default function SafetyGaugeSVG({ items }: Props) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {items.map((item) => (
        <SingleGauge key={item.label} {...item}/>
      ))}
    </div>
  )
}
