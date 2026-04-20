import type { FlowSpec } from '../FlowChartTypes'

// ============================================================
// 강관(도복장강관) 구조안전성 검토 흐름도
// 기준: KDS 57 10 00 : 2022 / AWWA M11
// 캔버스: 780 × 1010
// ============================================================

export const steelFlow: FlowSpec = {
  title: '강관(도복장강관) 구조안전성 검토 흐름도  —  KDS 57 10 00 : 2022',
  width: 780,
  height: 1010,
  legend: true,

  nodes: [
    // ── 시작 ────────────────────────────────────────────────
    {
      id: 'start', kind: 'terminal',
      x: 390, y: 46, w: 300, h: 34,
      title: '강관 구조안전성 검토 시작',
      codeRef: 'KDS 57 10 00',
    },

    // ── 입력 (4열) ──────────────────────────────────────────
    {
      id: 'in_pipe', kind: 'input',
      x: 94, y: 130, w: 152, h: 46,
      title: '① 관 제원',
      sub: 'DN · Do · t · 강종(fy)',
      codeRef: 'KS D 3565',
    },
    {
      id: 'in_press', kind: 'input',
      x: 291, y: 130, w: 152, h: 46,
      title: '② 내압 조건',
      sub: 'Pd · ksurge',
      codeRef: '§3.2',
    },
    {
      id: 'in_soil', kind: 'input',
      x: 488, y: 130, w: 152, h: 46,
      title: '③ 지반·하중',
      sub: 'H · γs · 토질 · E\'',
      codeRef: 'AWWA M11',
    },
    {
      id: 'in_other', kind: 'input',
      x: 685, y: 130, w: 152, h: 46,
      title: '④ 부가 조건',
      sub: '침상각 · 라이닝 · GWL',
      codeRef: '§3.4',
    },

    // ── 하중 산정 ────────────────────────────────────────────
    {
      id: 's1a', kind: 'process',
      x: 193, y: 232, w: 172, h: 50,
      title: '① 토압 산정 (Prism Load)',
      sub: 'We = γs · H · Do',
      codeRef: 'AWWA M11 §5.2',
    },
    {
      id: 's1b', kind: 'process',
      x: 571, y: 232, w: 192, h: 50,
      title: '② 차량하중 (Boussinesq)',
      sub: 'WL = PL · IF · Do',
      codeRef: 'DB-24 KDS 24 12 20',
    },
    {
      id: 's1c', kind: 'process',
      x: 390, y: 326, w: 240, h: 42,
      title: '총하중 집계',
      sub: 'Wtotal = We + WL  [kN/m]',
    },

    // ── 병렬 구조검토 (4열) ──────────────────────────────────
    {
      id: 's2', kind: 'process',
      x: 94, y: 422, w: 152, h: 54,
      title: '③ 내압 검토',
      sub: 'σ = Pd·Do / (2t)',
      codeRef: 'KDS §3.2',
    },
    {
      id: 's3', kind: 'process',
      x: 269, y: 422, w: 152, h: 54,
      title: '④ 링 휨응력',
      sub: 'σb = Kb·W·Do / t²',
      codeRef: 'KDS §3.4',
    },
    {
      id: 's4', kind: 'process',
      x: 506, y: 422, w: 152, h: 54,
      title: '⑤ 처짐 검토',
      sub: 'Δy/Do = DL·Kx·W/…',
      codeRef: 'KDS §3.5',
    },
    {
      id: 's5', kind: 'process',
      x: 685, y: 422, w: 152, h: 54,
      title: '⑥ 좌굴 검토',
      sub: 'qa = (1/FS)·√(…)',
      codeRef: 'KDS §3.6',
    },

    // ── 판정 다이아몬드 ──────────────────────────────────────
    {
      id: 'd2', kind: 'decision',
      x: 94, y: 522, w: 136, h: 42,
      title: 'σ ≤ σ_allow ?',
    },
    {
      id: 'd3', kind: 'decision',
      x: 269, y: 522, w: 136, h: 42,
      title: 'σb ≤ σba ?',
    },
    {
      id: 'd4', kind: 'decision',
      x: 506, y: 522, w: 136, h: 42,
      title: 'Δy ≤ 허용 ?',
    },
    {
      id: 'd5', kind: 'decision',
      x: 685, y: 522, w: 136, h: 42,
      title: 'FS ≥ 2.5 ?',
    },

    // ── 최소관두께 ────────────────────────────────────────────
    {
      id: 's6', kind: 'process',
      x: 390, y: 638, w: 280, h: 54,
      title: '⑦ 최소 소요두께 역산',
      sub: 't_req = max(t_p, t_surge, t_H) + CA',
      codeRef: 'KDS §3.3',
    },
    {
      id: 'd6', kind: 'decision',
      x: 390, y: 742, w: 210, h: 42,
      title: 't_채택 ≥ t_required ?',
    },

    // ── 최종 결과 ────────────────────────────────────────────
    {
      id: 'ng_out', kind: 'output',
      x: 148, y: 860, w: 208, h: 54,
      title: '재설계 필요  (N.G.)',
      sub: '두께 증가 / 침상·다짐 조건 개선',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 632, y: 860, w: 208, h: 54,
      title: '구조적으로 안전  (O.K.)',
      sub: '전 항목 허용값 이내',
      emphasis: 'ok',
    },

    // ── 종료 ────────────────────────────────────────────────
    {
      id: 'end', kind: 'terminal',
      x: 390, y: 968, w: 300, h: 34,
      title: '검토 종료 / 보고서 출력',
    },
  ],

  edges: [
    // ── 시작 → 입력 팬아웃 (Y=88 버스바) ──────────────────
    { from: 'start', to: 'in_pipe',  toSide: 'top', viaY: 88 },
    { from: 'start', to: 'in_press', toSide: 'top', viaY: 88 },
    { from: 'start', to: 'in_soil',  toSide: 'top', viaY: 88 },
    { from: 'start', to: 'in_other', toSide: 'top', viaY: 88 },

    // ── 입력 → 하중 ────────────────────────────────────────
    { from: 'in_pipe',  to: 's1a', fromSide: 'bottom', toSide: 'top' },
    { from: 'in_soil',  to: 's1a', fromSide: 'bottom', toSide: 'right' },
    { from: 'in_soil',  to: 's1b', fromSide: 'bottom', toSide: 'left' },
    { from: 'in_other', to: 's1b', fromSide: 'bottom', toSide: 'top' },

    // ── 내압 조건 → 내압 검토 (점선, Pd 입력) ──────────────
    {
      from: 'in_press', to: 's2',
      fromSide: 'bottom', toSide: 'top',
      kind: 'dashed', label: 'Pd',
      labelDx: 4, labelDy: 16,
    },

    // ── 하중 → 집계 ────────────────────────────────────────
    { from: 's1a', to: 's1c', fromSide: 'bottom', toSide: 'left' },
    { from: 's1b', to: 's1c', fromSide: 'bottom', toSide: 'right' },

    // ── 집계 → 검토 팬아웃 (Y=385 버스바) ──────────────────
    { from: 's1c', to: 's2', fromSide: 'bottom', toSide: 'top', viaY: 385 },
    { from: 's1c', to: 's3', fromSide: 'bottom', toSide: 'top', viaY: 385 },
    { from: 's1c', to: 's4', fromSide: 'bottom', toSide: 'top', viaY: 385 },
    { from: 's1c', to: 's5', fromSide: 'bottom', toSide: 'top', viaY: 385 },

    // ── 검토 → 판정 ────────────────────────────────────────
    { from: 's2', to: 'd2' },
    { from: 's3', to: 'd3' },
    { from: 's4', to: 'd4' },
    { from: 's5', to: 'd5' },

    // ── 판정 OK → 최소두께 (Y=600 OK 버스바) ───────────────
    {
      from: 'd2', to: 's6',
      fromSide: 'bottom', toSide: 'top',
      color: 'ok', label: 'OK',
      viaY: 600, labelDx: 3, labelDy: 13,
    },
    { from: 'd3', to: 's6', fromSide: 'bottom', toSide: 'top', color: 'ok', viaY: 600 },
    { from: 'd4', to: 's6', fromSide: 'bottom', toSide: 'top', color: 'ok', viaY: 600 },
    { from: 'd5', to: 's6', fromSide: 'bottom', toSide: 'top', color: 'ok', viaY: 600 },

    // ── 판정 NG → N.G. 출력 (X=22 좌측 채널) ───────────────
    {
      from: 'd2', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed', label: 'NG',
      viaX: 22, labelDx: 4, labelDy: -5,
    },
    { from: 'd3', to: 'ng_out', fromSide: 'left', toSide: 'left', color: 'ng', kind: 'dashed', viaX: 22 },
    { from: 'd4', to: 'ng_out', fromSide: 'left', toSide: 'left', color: 'ng', kind: 'dashed', viaX: 22 },
    { from: 'd5', to: 'ng_out', fromSide: 'left', toSide: 'left', color: 'ng', kind: 'dashed', viaX: 22 },

    // ── 최소두께 → 판정 ─────────────────────────────────────
    { from: 's6', to: 'd6' },

    // ── 두께 판정 OK → O.K. 출력 ───────────────────────────
    {
      from: 'd6', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 632, labelDx: 6, labelDy: -4,
    },

    // ── 두께 판정 NG → N.G. 출력 ───────────────────────────
    {
      from: 'd6', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 22, labelDx: 4, labelDy: -5,
    },

    // ── 결과 → 종료 ─────────────────────────────────────────
    { from: 'ok_out', to: 'end', fromSide: 'bottom', toSide: 'right', viaY: 940 },
    { from: 'ng_out', to: 'end', fromSide: 'bottom', toSide: 'left',  viaY: 940 },
  ],
}
