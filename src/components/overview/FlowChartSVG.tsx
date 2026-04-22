import React from 'react'
import { T } from '../eng/tokens'
import type { FlowSpec, NodeSpec, EdgeSpec } from './FlowChartTypes'

// ── 화살표 마커 + 필터 ──────────────────────────────────────
function Markers() {
  return (
    <defs>
      <marker id="fc-ar"   markerWidth="8" markerHeight="6" refX="7.5" refY="3" orient="auto">
        <polygon points="0,0.5 7.5,3 0,5.5" fill="#6a7a8a"/>
      </marker>
      <marker id="fc-arOK" markerWidth="8" markerHeight="6" refX="7.5" refY="3" orient="auto">
        <polygon points="0,0.5 7.5,3 0,5.5" fill={T.textOK}/>
      </marker>
      <marker id="fc-arNG" markerWidth="8" markerHeight="6" refX="7.5" refY="3" orient="auto">
        <polygon points="0,0.5 7.5,3 0,5.5" fill={T.textNG}/>
      </marker>
      <filter id="fc-shadow" x="-10%" y="-10%" width="120%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,30,60,0.10)"/>
      </filter>
    </defs>
  )
}

// ── 노드 접속점 좌표 ────────────────────────────────────────
function getPt(node: NodeSpec, side: string): [number, number] {
  const w = node.w ?? 160
  const h = node.h ?? 50
  switch (side) {
    case 'top':    return [node.x, node.y - h / 2]
    case 'bottom': return [node.x, node.y + h / 2]
    case 'left':   return [node.x - w / 2, node.y]
    case 'right':  return [node.x + w / 2, node.y]
    default:       return [node.x, node.y]
  }
}

// ── SVG 경로 문자열 생성 ───────────────────────────────────
const CR = 6

function buildPath(
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
  viaX?: number,
  viaY?: number,
): string {
  if (viaX !== undefined && viaY === undefined) {
    const sAV = viaX >= ax ? 1 : -1
    const sVY = by >= ay ? 1 : -1
    const sVB = bx >= viaX ? 1 : -1
    const r1 = Math.min(CR, Math.abs(viaX - ax) / 2, Math.abs(by - ay) / 2)
    const r2 = Math.min(CR, Math.abs(bx - viaX) / 2, Math.abs(by - ay) / 2)
    if (r1 < 1 || r2 < 1) return `M ${ax} ${ay} L ${viaX} ${ay} L ${viaX} ${by} L ${bx} ${by}`
    return (
      `M ${ax} ${ay}` +
      ` L ${viaX - sAV * r1} ${ay}` +
      ` Q ${viaX} ${ay} ${viaX} ${ay + sVY * r1}` +
      ` L ${viaX} ${by - sVY * r2}` +
      ` Q ${viaX} ${by} ${viaX + sVB * r2} ${by}` +
      ` L ${bx} ${by}`
    )
  }
  if (viaY !== undefined && viaX === undefined) {
    const sAV = viaY >= ay ? 1 : -1
    const sVX = bx >= ax ? 1 : -1
    const sVB = by >= viaY ? 1 : -1
    const r1 = Math.min(CR, Math.abs(viaY - ay) / 2, Math.abs(bx - ax) / 2)
    const r2 = Math.min(CR, Math.abs(bx - ax) / 2, Math.abs(by - viaY) / 2)
    if (r1 < 1 || r2 < 1) return `M ${ax} ${ay} L ${ax} ${viaY} L ${bx} ${viaY} L ${bx} ${by}`
    return (
      `M ${ax} ${ay}` +
      ` L ${ax} ${viaY - sAV * r1}` +
      ` Q ${ax} ${viaY} ${ax + sVX * r1} ${viaY}` +
      ` L ${bx - sVX * r2} ${viaY}` +
      ` Q ${bx} ${viaY} ${bx} ${viaY + sVB * r2}` +
      ` L ${bx} ${by}`
    )
  }
  if (Math.abs(ax - bx) < 2) {
    return `M ${ax} ${ay} L ${bx} ${by}`
  }
  const midY = (ay + by) / 2
  const sY1 = midY >= ay ? 1 : -1
  const sX  = bx >= ax ? 1 : -1
  const sY2 = by >= midY ? 1 : -1
  const r1 = Math.min(CR, Math.abs(midY - ay) / 2, Math.abs(bx - ax) / 2)
  const r2 = Math.min(CR, Math.abs(bx - ax) / 2, Math.abs(by - midY) / 2)
  return (
    `M ${ax} ${ay}` +
    ` L ${ax} ${midY - sY1 * r1}` +
    ` Q ${ax} ${midY} ${ax + sX * r1} ${midY}` +
    ` L ${bx - sX * r2} ${midY}` +
    ` Q ${bx} ${midY} ${bx} ${midY + sY2 * r2}` +
    ` L ${bx} ${by}`
  )
}

// ── 노드 색상 ──────────────────────────────────────────────
function nodeColors(node: NodeSpec): { fill: string; stroke: string; text: string } {
  if (node.emphasis === 'ok')   return { fill: T.bgOK,    stroke: T.textOK,    text: T.textOK }
  if (node.emphasis === 'ng')   return { fill: T.bgNG,    stroke: T.textNG,    text: T.textNG }
  if (node.emphasis === 'info') return { fill: '#e8f0ff', stroke: '#3060c0',   text: '#1a3060' }
  switch (node.kind) {
    case 'terminal':   return { fill: T.bgHeader,  stroke: T.bgHeader,  text: 'white' }
    case 'input':      return { fill: '#edf2f8',   stroke: '#9aaccb',   text: T.textLabel }
    case 'decision':   return { fill: T.bgWarn,    stroke: '#c8900a',   text: '#5a4000' }
    case 'output':     return { fill: T.bgPanel,   stroke: T.bgActive,  text: T.textAccent }
    case 'subprocess': return { fill: '#f0f4ff',   stroke: '#6080c0',   text: T.textPrimary }
    default:           return { fill: '#f4f7fb',   stroke: T.bgActive,  text: T.textPrimary }
  }
}

// ── 개별 노드 렌더링 (foreignObject로 텍스트 자동 줄바꿈) ──
function FlowNode({ node }: { node: NodeSpec }) {
  const W = node.w ?? 160
  const H = node.h ?? 50
  const lx = node.x - W / 2
  const ty = node.y - H / 2
  const { fill, stroke, text } = nodeColors(node)

  // 도형
  let shape: React.ReactNode
  switch (node.kind) {
    case 'terminal':
      shape = (
        <rect x={lx} y={ty} width={W} height={H} rx={H / 2}
          fill={fill} stroke={stroke} strokeWidth={1.8}
          filter="url(#fc-shadow)" />
      )
      break
    case 'decision': {
      const pts = `${node.x},${ty} ${lx + W},${node.y} ${node.x},${ty + H} ${lx},${node.y}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1.6} filter="url(#fc-shadow)" />
      break
    }
    case 'output':
      shape = (
        <g filter="url(#fc-shadow)">
          <rect x={lx} y={ty} width={W} height={H} rx={3} fill={fill} stroke={stroke} strokeWidth={1.8} />
          <rect x={lx + 3} y={ty + 3} width={W - 6} height={H - 6} rx={1} fill="none" stroke={stroke} strokeWidth={0.7} />
        </g>
      )
      break
    case 'subprocess':
      shape = (
        <g filter="url(#fc-shadow)">
          <rect x={lx} y={ty} width={W} height={H} rx={3} fill={fill} stroke={stroke} strokeWidth={1.6} />
          <line x1={lx + 10} y1={ty} x2={lx + 10} y2={ty + H} stroke={stroke} strokeWidth={1} />
          <line x1={lx + W - 10} y1={ty} x2={lx + W - 10} y2={ty + H} stroke={stroke} strokeWidth={1} />
        </g>
      )
      break
    default:
      shape = (
        <rect x={lx} y={ty} width={W} height={H}
          rx={node.kind === 'process' ? 5 : 3}
          fill={fill} stroke={stroke} strokeWidth={1.6}
          filter="url(#fc-shadow)" />
      )
  }

  // decision 노드는 대각선 모양이라 foreignObject 영역이 작으므로 별도 처리
  const isDecision = node.kind === 'decision'
  const foPad = isDecision ? 20 : (node.kind === 'terminal' ? 16 : 8)
  const foW = W - foPad * 2
  const foX = lx + foPad
  // codeRef 태그 높이 예약
  const codeH = node.codeRef ? 14 : 0
  const foH = H - codeH - (isDecision ? 10 : 4)
  const foY = ty + (isDecision ? 5 : 2)

  const titleSize  = node.kind === 'terminal' ? 10.5 : 10
  const subSize    = 8

  return (
    <g>
      {shape}

      {/* foreignObject: HTML 텍스트 자동 줄바꿈 */}
      <foreignObject x={foX} y={foY} width={foW} height={foH}>
        <div
          // @ts-ignore
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <div style={{
            fontSize: titleSize,
            fontWeight: 700,
            color: text,
            fontFamily: T.fontSans,
            textAlign: 'center',
            lineHeight: 1.25,
            wordBreak: 'keep-all',
            overflowWrap: 'break-word',
          }}>
            {node.title}
          </div>
          {node.sub && (
            <div style={{
              fontSize: subSize,
              color: node.kind === 'terminal' ? 'rgba(255,255,255,0.75)' : T.textMuted,
              fontFamily: T.fontMono,
              textAlign: 'center',
              lineHeight: 1.2,
              marginTop: 2,
              wordBreak: 'break-all',
              overflowWrap: 'break-word',
            }}>
              {node.sub}
            </div>
          )}
          {node.sub2 && (
            <div style={{
              fontSize: subSize,
              color: T.textMuted,
              fontFamily: T.fontMono,
              textAlign: 'center',
              lineHeight: 1.2,
              marginTop: 1,
              wordBreak: 'break-all',
              overflowWrap: 'break-word',
            }}>
              {node.sub2}
            </div>
          )}
        </div>
      </foreignObject>

      {/* KDS 기준 태그 (우하단) */}
      {node.codeRef && (
        <>
          <rect
            x={lx + W - Math.min(node.codeRef.length * 5.8 + 6, 96)}
            y={ty + H - 14}
            width={Math.min(node.codeRef.length * 5.8 + 6, 96)}
            height={13}
            rx={2} fill={T.bgHeader} opacity={0.88}
          />
          <text
            x={lx + W - 3} y={ty + H - 4}
            textAnchor="end" fontSize={7}
            fill="white" fontFamily={T.fontMono}
          >
            {node.codeRef}
          </text>
        </>
      )}
    </g>
  )
}

// ── 엣지 렌더링 ────────────────────────────────────────────
function FlowEdge({ edge, nodeMap }: { edge: EdgeSpec; nodeMap: Map<string, NodeSpec> }) {
  const from = nodeMap.get(edge.from)
  const to   = nodeMap.get(edge.to)
  if (!from || !to) return null

  const fromPt = getPt(from, edge.fromSide ?? 'bottom')
  const toPt   = getPt(to,   edge.toSide   ?? 'top')
  const d = buildPath(fromPt, toPt, edge.viaX, edge.viaY)

  const colorMap = { default: '#6a7a8a', ok: T.textOK, ng: T.textNG }
  const color  = colorMap[edge.color ?? 'default']
  const marker = edge.color === 'ok' ? 'url(#fc-arOK)' : edge.color === 'ng' ? 'url(#fc-arNG)' : 'url(#fc-ar)'
  const dash   = edge.kind === 'dashed' ? '5,3' : undefined

  const lx = fromPt[0] + (edge.labelDx ?? 4)
  const ly = fromPt[1] + (edge.labelDy ?? 13)

  return (
    <>
      <path
        d={d} stroke={color}
        strokeWidth={edge.color === 'ok' || edge.color === 'ng' ? 1.7 : 1.4}
        fill="none" strokeDasharray={dash}
        strokeLinecap="round" strokeLinejoin="round"
        markerEnd={marker}
      />
      {edge.label && (
        <text x={lx} y={ly} fontSize={9} fontWeight={700} fill={color} fontFamily={T.fontMono}>
          {edge.label}
        </text>
      )}
    </>
  )
}

// ── 범례 ───────────────────────────────────────────────────
const LEGEND_ITEMS = [
  { color: '#edf2f8', stroke: '#9aaccb', label: '입력 파라미터' },
  { color: '#f4f7fb', stroke: T.bgActive, label: '계산 단계' },
  { color: T.bgWarn,  stroke: '#c8900a', label: '판정 분기' },
  { color: T.bgOK,    stroke: T.textOK,  label: 'O.K.' },
  { color: T.bgNG,    stroke: T.textNG,  label: 'N.G.' },
]

function FlowLegend() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '5px 12px',
      background: '#f7f9fb',
      border: `1px solid ${T.borderLight}`,
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.textAccent, fontFamily: T.fontSans }}>범례</span>
      {LEGEND_ITEMS.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 14, height: 10, borderRadius: 2, flexShrink: 0,
            background: item.color, border: `1.5px solid ${item.stroke}`,
          }} />
          <span style={{ fontSize: 10, color: T.textLabel, fontFamily: T.fontSans, whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── 메인 FlowChartSVG ──────────────────────────────────────
export default function FlowChartSVG({ spec }: { spec: FlowSpec }) {
  const { width: W, height: H, nodes, edges } = spec
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="auto"
        preserveAspectRatio="xMidYMid meet"
        style={{
          fontFamily: T.fontSans,
          background: '#fafbfc',
          border: `1px solid ${T.borderLight}`,
          borderRadius: spec.legend ? '4px 4px 0 0' : 4,
          display: 'block',
        }}
      >
        <Markers />
        <rect x={0} y={0} width={W} height={H} fill="#fafbfc" />

        {/* 제목 */}
        <text
          x={W / 2} y={18}
          textAnchor="middle" fontSize={10.5} fontWeight={700}
          fill={T.textAccent} fontFamily={T.fontSans} letterSpacing={0.2}
        >
          {spec.title}
        </text>

        {edges.map((e, i) => <FlowEdge key={i} edge={e} nodeMap={nodeMap} />)}
        {nodes.map(n => <FlowNode key={n.id} node={n} />)}
      </svg>
      {spec.legend && <FlowLegend />}
    </div>
  )
}
