import React from 'react'
import { T } from '../eng/tokens'
import type { FlowSpec, NodeSpec, EdgeSpec } from './FlowChartTypes'

// ── 화살표 마커 3종 ─────────────────────────────────────────
function Markers() {
  return (
    <defs>
      <marker id="fc-ar"   markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
        <polygon points="0,0 9,3.5 0,7" fill="#777"/>
      </marker>
      <marker id="fc-arOK" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
        <polygon points="0,0 9,3.5 0,7" fill={T.textOK}/>
      </marker>
      <marker id="fc-arNG" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
        <polygon points="0,0 9,3.5 0,7" fill={T.textNG}/>
      </marker>
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

// ── SVG 경로 문자열 생성 ────────────────────────────────────
function buildPath(
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
  viaX?: number,
  viaY?: number,
): string {
  if (viaX !== undefined && viaY === undefined) {
    // horizontal → vertical → horizontal
    return `M ${ax} ${ay} L ${viaX} ${ay} L ${viaX} ${by} L ${bx} ${by}`
  }
  if (viaY !== undefined && viaX === undefined) {
    // vertical → horizontal → vertical
    return `M ${ax} ${ay} L ${ax} ${viaY} L ${bx} ${viaY} L ${bx} ${by}`
  }
  if (Math.abs(ax - bx) < 3) {
    return `M ${ax} ${ay} L ${bx} ${by}`
  }
  const midY = (ay + by) / 2
  return `M ${ax} ${ay} L ${ax} ${midY} L ${bx} ${midY} L ${bx} ${by}`
}

// ── 노드 색상 결정 ──────────────────────────────────────────
function nodeColors(node: NodeSpec): { fill: string; stroke: string; text: string } {
  if (node.emphasis === 'ok')   return { fill: T.bgOK,      stroke: T.textOK,      text: T.textOK }
  if (node.emphasis === 'ng')   return { fill: T.bgNG,      stroke: T.textNG,      text: T.textNG }
  if (node.emphasis === 'info') return { fill: '#e8f0ff',   stroke: '#3060c0',     text: '#1a3060' }
  switch (node.kind) {
    case 'terminal':   return { fill: T.bgHeader,   stroke: T.bgHeader,    text: 'white' }
    case 'input':      return { fill: '#edf2f8',    stroke: '#9aaccb',     text: T.textLabel }
    case 'decision':   return { fill: T.bgWarn,     stroke: '#c8900a',     text: '#5a4000' }
    case 'output':     return { fill: T.bgPanel,    stroke: T.bgActive,    text: T.textAccent }
    case 'subprocess': return { fill: '#f0f4ff',    stroke: '#6080c0',     text: T.textPrimary }
    default:           return { fill: '#f4f7fb',    stroke: T.bgActive,    text: T.textPrimary }
  }
}

// ── 개별 노드 렌더링 ────────────────────────────────────────
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
          fill={fill} stroke={stroke} strokeWidth={1.6} />
      )
      break
    case 'decision': {
      const pts = `${node.x},${ty} ${lx + W},${node.y} ${node.x},${ty + H} ${lx},${node.y}`
      shape = <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1.6} />
      break
    }
    case 'output':
      shape = (
        <>
          <rect x={lx} y={ty} width={W} height={H} fill={fill} stroke={stroke} strokeWidth={1.6} />
          <rect x={lx + 3} y={ty + 3} width={W - 6} height={H - 6} fill="none" stroke={stroke} strokeWidth={0.8} />
        </>
      )
      break
    case 'subprocess':
      shape = (
        <>
          <rect x={lx} y={ty} width={W} height={H} rx={2} fill={fill} stroke={stroke} strokeWidth={1.6} />
          <line x1={lx + 10} y1={ty} x2={lx + 10} y2={ty + H} stroke={stroke} strokeWidth={1} />
          <line x1={lx + W - 10} y1={ty} x2={lx + W - 10} y2={ty + H} stroke={stroke} strokeWidth={1} />
        </>
      )
      break
    default: // process, input
      shape = (
        <rect x={lx} y={ty} width={W} height={H}
          rx={node.kind === 'process' ? 5 : 2}
          fill={fill} stroke={stroke} strokeWidth={1.5} />
      )
  }

  // 텍스트 Y 위치
  const hasSub  = !!node.sub
  const hasSub2 = !!node.sub2
  let titleY: number
  if (hasSub && hasSub2) titleY = node.y - 12
  else if (hasSub)       titleY = node.y - 7
  else                   titleY = node.y + 4

  return (
    <g>
      {shape}

      {/* 타이틀 */}
      <text
        x={node.x} y={titleY}
        textAnchor="middle"
        fontSize={node.kind === 'terminal' ? 11.5 : 11}
        fontWeight={700}
        fill={text}
        fontFamily={T.fontSans}
      >
        {node.title}
      </text>

      {/* 수식/서브텍스트 */}
      {hasSub && (
        <text
          x={node.x} y={node.y + (hasSub2 ? 4 : 8)}
          textAnchor="middle" fontSize={8.5}
          fill={node.kind === 'terminal' ? 'rgba(255,255,255,0.8)' : T.textMuted}
          fontFamily={T.fontMono}
        >
          {node.sub}
        </text>
      )}
      {hasSub2 && (
        <text
          x={node.x} y={node.y + 16}
          textAnchor="middle" fontSize={8.5}
          fill={T.textMuted} fontFamily={T.fontMono}
        >
          {node.sub2}
        </text>
      )}

      {/* KDS 기준 태그 (우하단) */}
      {node.codeRef && (
        <>
          <rect
            x={lx + W - Math.min(node.codeRef.length * 6 + 6, 90)}
            y={ty + H - 13}
            width={Math.min(node.codeRef.length * 6 + 6, 90)}
            height={12}
            rx={2} fill={T.bgHeader} opacity={0.9}
          />
          <text
            x={lx + W - 3} y={ty + H - 4}
            textAnchor="end" fontSize={7.5}
            fill="white" fontFamily={T.fontMono}
          >
            {node.codeRef}
          </text>
        </>
      )}
    </g>
  )
}

// ── 엣지 (연결선) 렌더링 ────────────────────────────────────
function FlowEdge({
  edge,
  nodeMap,
}: {
  edge: EdgeSpec
  nodeMap: Map<string, NodeSpec>
}) {
  const from = nodeMap.get(edge.from)
  const to   = nodeMap.get(edge.to)
  if (!from || !to) return null

  const fromPt = getPt(from, edge.fromSide ?? 'bottom')
  const toPt   = getPt(to,   edge.toSide   ?? 'top')

  const d = buildPath(fromPt, toPt, edge.viaX, edge.viaY)

  const colorMap = { default: '#666', ok: T.textOK, ng: T.textNG }
  const color  = colorMap[edge.color ?? 'default']
  const marker = edge.color === 'ok' ? 'url(#fc-arOK)' : edge.color === 'ng' ? 'url(#fc-arNG)' : 'url(#fc-ar)'
  const dash   = edge.kind === 'dashed' ? '5,3' : undefined

  // 라벨 위치: fromPt 근처
  const lx = fromPt[0] + (edge.labelDx ?? 4)
  const ly = fromPt[1] + (edge.labelDy ?? 13)

  return (
    <>
      <path
        d={d}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
        strokeDasharray={dash}
        markerEnd={marker}
      />
      {edge.label && (
        <text
          x={lx} y={ly}
          fontSize={9.5}
          fontWeight={700}
          fill={color}
          fontFamily={T.fontMono}
        >
          {edge.label}
        </text>
      )}
    </>
  )
}

// ── 범례 ────────────────────────────────────────────────────
function Legend({ x, y }: { x: number; y: number }) {
  const items = [
    { color: '#edf2f8', stroke: '#9aaccb', label: '입력 파라미터' },
    { color: '#f4f7fb', stroke: T.bgActive, label: '계산 단계' },
    { color: T.bgWarn,  stroke: '#c8900a', label: '판정 분기' },
    { color: T.bgOK,    stroke: T.textOK,  label: 'O.K.' },
    { color: T.bgNG,    stroke: T.textNG,  label: 'N.G.' },
  ]
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={0} y={0} width={128} height={items.length * 16 + 10} rx={3}
        fill="white" stroke={T.border} strokeWidth={1} opacity={0.92} />
      <text x={64} y={13} textAnchor="middle" fontSize={9} fontWeight={700}
        fill={T.textAccent} fontFamily={T.fontSans}>범 례</text>
      {items.map((item, i) => (
        <g key={i} transform={`translate(6, ${18 + i * 16})`}>
          <rect x={0} y={0} width={14} height={11} rx={2}
            fill={item.color} stroke={item.stroke} strokeWidth={1} />
          <text x={20} y={9.5} fontSize={8.5} fill={T.textLabel} fontFamily={T.fontSans}>
            {item.label}
          </text>
        </g>
      ))}
    </g>
  )
}

// ── 메인 FlowChartSVG 컴포넌트 ─────────────────────────────
export default function FlowChartSVG({ spec }: { spec: FlowSpec }) {
  const { width: W, height: H, nodes, edges } = spec
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="auto"
        preserveAspectRatio="xMidYMid meet"
        style={{
          fontFamily: T.fontSans,
          background: '#fafbfc',
          border: `1px solid ${T.borderLight}`,
          borderRadius: 4,
          display: 'block',
          maxHeight: 960,
        }}
      >
        <Markers />

        {/* 배경 그리드 (선택) */}
        <rect x={0} y={0} width={W} height={H} fill="#fafbfc" />

        {/* 제목 */}
        <text
          x={W / 2} y={22}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          fill={T.textAccent}
          fontFamily={T.fontSans}
          letterSpacing={0.3}
        >
          {spec.title}
        </text>

        {/* 엣지 (노드 아래에 그려짐) */}
        {edges.map((e, i) => (
          <FlowEdge key={i} edge={e} nodeMap={nodeMap} />
        ))}

        {/* 노드 */}
        {nodes.map(n => (
          <FlowNode key={n.id} node={n} />
        ))}

        {/* 범례 */}
        {spec.legend && (
          <Legend x={W - 140} y={H - 110} />
        )}
      </svg>
    </div>
  )
}
