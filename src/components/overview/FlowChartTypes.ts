export type NodeKind =
  | 'input'       // 입력 파라미터 박스 (배경색 구분)
  | 'process'     // 계산 단계 (둥근 모서리)
  | 'decision'    // 판정 분기 (마름모)
  | 'terminal'    // 시작/종료 (캡슐형)
  | 'output'      // 결과 박스 (이중 테두리)
  | 'subprocess'  // 하위 루틴 (측면 세로줄)

export type EdgeKind = 'solid' | 'dashed'
export type EdgeColor = 'default' | 'ok' | 'ng'

export interface NodeSpec {
  id: string
  kind: NodeKind
  x: number          // 노드 중심 X (px)
  y: number          // 노드 중심 Y (px)
  w?: number         // 기본 160
  h?: number         // 기본 50
  title: string
  sub?: string       // 2번째 줄 (공식 등)
  sub2?: string      // 3번째 줄
  codeRef?: string   // 우하단 KDS/AWWA 태그
  emphasis?: 'ok' | 'ng' | 'info'
}

export interface EdgeSpec {
  from: string
  to: string
  label?: string
  kind?: EdgeKind
  color?: EdgeColor
  fromSide?: 'bottom' | 'top' | 'left' | 'right'
  toSide?: 'top' | 'bottom' | 'left' | 'right'
  viaX?: number      // 경유 X 좌표 (horizontal → vertical → horizontal)
  viaY?: number      // 경유 Y 좌표 (vertical → horizontal → vertical)
  labelDx?: number
  labelDy?: number
}

export interface FlowSpec {
  title: string
  width: number
  height: number
  nodes: NodeSpec[]
  edges: EdgeSpec[]
  legend?: boolean
}
