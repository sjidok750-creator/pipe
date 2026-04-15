import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceDot, ResponsiveContainer
} from 'recharts'
import { E_PRIME } from '../../engine/constants.js'

interface Props {
  currentH: number
  currentE: number
  compaction: number
}

// 각 SC등급, 다짐도별 E' 데이터 생성
function buildData(compaction: number) {
  const depths = [0.5, 0.9, 1.2, 1.5, 1.8, 2.4, 3.0, 4.0, 5.0]
  return depths.map((H) => {
    const row: Record<string, number | string> = { H }
    // E'는 깊이와 무관하게 일정 (토질/다짐도만의 함수)
    // 깊이별 가산 없음 — 각 선은 수평이나 차이를 시각화
    const ep = E_PRIME as Record<string, Record<string | number, number> & { default?: number }>

    row['SC1'] = ep.SC1[compaction] ?? ep.SC1[85] ?? 2700
    row['SC2'] = ep.SC2[compaction] ?? ep.SC2[85] ?? 2000
    row['SC3'] = ep.SC3[compaction] ?? ep.SC3[85] ?? 700
    row['연약'] = ep.loose.default ?? 300
    return row
  })
}

export default function EValueChartSVG({ currentH = 1.5, currentE = 2700, compaction = 85 }: Props) {
  const data = buildData(compaction)

  return (
    <div style={{ width: '100%', background: '#f8faff', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: '#003366', marginBottom: 8, textAlign: 'center' }}>
        E' 값 선도 (다짐도 {compaction}%)
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e8f0"/>
          <XAxis dataKey="H" label={{ value: '매설깊이 H (m)', position: 'insideBottom', offset: -5, fontSize: 10 }}
                 tick={{ fontSize: 9 }}/>
          <YAxis label={{ value: "E' (kPa)", angle: -90, position: 'insideLeft', offset: 10, fontSize: 10 }}
                 tick={{ fontSize: 9 }}/>
          <Tooltip formatter={(v: number) => [`${v} kPa`, '']} labelFormatter={(l) => `H = ${l}m`}/>
          <Legend iconType="line" wrapperStyle={{ fontSize: 10 }}/>
          <Line type="monotone" dataKey="SC1" stroke="#003366" strokeWidth={2} dot={false} name="SC1 (조립토)"/>
          <Line type="monotone" dataKey="SC2" stroke="#1a7abf" strokeWidth={2} dot={false} name="SC2 (혼합토)"/>
          <Line type="monotone" dataKey="SC3" stroke="#e67e22" strokeWidth={2} dot={false} name="SC3 (세립토)"/>
          <Line type="monotone" dataKey="연약" stroke="#c0392b" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="연약"/>
          {/* 현재 조건 점 */}
          <ReferenceDot x={currentH} y={currentE} r={6} fill="#c0392b" stroke="white" strokeWidth={2}
                        label={{ value: `E'=${currentE}`, position: 'top', fontSize: 9, fill: '#c0392b' }}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
