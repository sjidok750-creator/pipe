import type { FlowSpec } from '../FlowChartTypes'

// ============================================================
// 덕타일 주철관 구조안전성 검토 흐름도
// 기준: KDS 57 10 00 : 2022 / DIPRA / KS D 4311
// 캔버스: 560 × 800  (컴팩트 재설계)
// ============================================================

export const ductileFlow: FlowSpec = {
  title: '덕타일 주철관 구조안전성 검토 흐름도  —  KDS 57 10 00 : 2022 / DIPRA',
  width: 560,
  height: 800,
  legend: true,

  nodes: [
    // ── 시작 ───────────────────────────────────────────────
    {
      id: 'start', kind: 'terminal',
      x: 280, y: 36, w: 300, h: 32,
      title: '주철관 구조안전성 검토 시작',
      codeRef: 'KDS 57 10 00',
    },

    // ── 입력 집계 ──────────────────────────────────────────
    {
      id: 'inputs', kind: 'input',
      x: 280, y: 106, w: 380, h: 44,
      title: '입력 파라미터',
      sub: 'DN · Do · K등급 · fu  |  Pd · H · γs · E′  |  침상 Type · GWL',
      codeRef: 'KS D 4311 / DIPRA',
    },

    // ── 하중 산정 ──────────────────────────────────────────
    {
      id: 's1a', kind: 'process',
      x: 155, y: 196, w: 190, h: 44,
      title: '① 토압  We (Prism Load)',
      sub: 'We = γs · H · Do',
      codeRef: 'DIPRA §3.2',
    },
    {
      id: 's1b', kind: 'process',
      x: 405, y: 196, w: 190, h: 44,
      title: '② 차량하중  WL (Boussinesq)',
      sub: 'WL = PL · IF · Do',
      codeRef: 'DB-24',
    },
    {
      id: 's1c', kind: 'process',
      x: 280, y: 278, w: 260, h: 36,
      title: '총하중  Wtotal = We + WL  [kN/m]',
    },

    // ── 3가지 구조검토 ────────────────────────────────────
    {
      id: 's2', kind: 'process',
      x: 118, y: 362, w: 170, h: 46,
      title: '③ 내압 검토 (Barlow)',
      sub: 'σ = Pd·(Do−t) / (2t)',
      codeRef: 'DIPRA §4',
    },
    {
      id: 's3', kind: 'process',
      x: 280, y: 362, w: 170, h: 46,
      title: '④ 링 휨응력',
      sub: 'σb = Kb · W · Do / t²',
      codeRef: 'DIPRA §5',
    },
    {
      id: 's4', kind: 'process',
      x: 442, y: 362, w: 170, h: 46,
      title: '⑤ 처짐 (Iowa)',
      sub: 'Δy/Do = DL·Kd·W/…',
      codeRef: 'DIPRA §6',
    },

    // ── 전체 합격 판정 ─────────────────────────────────────
    {
      id: 'd_all', kind: 'decision',
      x: 280, y: 454, w: 220, h: 44,
      title: '전 항목  σ, σb, Δy 합격?',
    },

    // ── 최소 소요두께 역산 ─────────────────────────────────
    {
      id: 's5', kind: 'process',
      x: 280, y: 540, w: 290, h: 46,
      title: '⑥ 최소 소요두께 역산',
      sub: 't_req = Pd·Do/(2σ_a) + 서비스 여유',
      codeRef: 'DIPRA §7',
    },
    {
      id: 'd5', kind: 'decision',
      x: 280, y: 622, w: 220, h: 40,
      title: 't_K등급 ≥ t_required ?',
    },

    // ── 결과 ──────────────────────────────────────────────
    {
      id: 'ng_out', kind: 'output',
      x: 118, y: 700, w: 180, h: 46,
      title: '재설계 필요  (N.G.)',
      sub: 'K등급 상향 / 침상 개선',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 442, y: 700, w: 180, h: 46,
      title: '구조적으로 안전  (O.K.)',
      sub: '전 항목 허용값 이내',
      emphasis: 'ok',
    },

    // ── 종료 ──────────────────────────────────────────────
    {
      id: 'end', kind: 'terminal',
      x: 280, y: 770, w: 280, h: 30,
      title: '검토 종료 / 보고서 출력',
    },
  ],

  edges: [
    // 시작 → 입력
    { from: 'start', to: 'inputs' },

    // 입력 → 하중 산정
    { from: 'inputs', to: 's1a', fromSide: 'bottom', toSide: 'top' },
    { from: 'inputs', to: 's1b', fromSide: 'bottom', toSide: 'top' },

    // 하중 → 집계
    { from: 's1a', to: 's1c', fromSide: 'bottom', toSide: 'left' },
    { from: 's1b', to: 's1c', fromSide: 'bottom', toSide: 'right' },

    // 집계 → 검토 3항목
    { from: 's1c', to: 's2', fromSide: 'bottom', toSide: 'top' },
    { from: 's1c', to: 's3', fromSide: 'bottom', toSide: 'top' },
    { from: 's1c', to: 's4', fromSide: 'bottom', toSide: 'top' },

    // 검토 3항목 → 합격 판정
    { from: 's2', to: 'd_all', fromSide: 'bottom', toSide: 'top' },
    { from: 's3', to: 'd_all', fromSide: 'bottom', toSide: 'top' },
    { from: 's4', to: 'd_all', fromSide: 'bottom', toSide: 'top' },

    // 합격 → 두께 역산
    {
      from: 'd_all', to: 's5',
      fromSide: 'bottom', toSide: 'top',
      color: 'ok', label: 'O.K.',
      labelDx: 6, labelDy: -4,
    },
    // 불합격 → N.G. 출력
    {
      from: 'd_all', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 28, labelDx: 4, labelDy: -5,
    },

    // 두께 판정
    { from: 's5', to: 'd5' },
    {
      from: 'd5', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 442, labelDx: 6, labelDy: -4,
    },
    {
      from: 'd5', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 28, labelDx: 4, labelDy: -5,
    },

    // 결과 → 종료
    { from: 'ok_out', to: 'end', fromSide: 'bottom', toSide: 'right', viaY: 760 },
    { from: 'ng_out', to: 'end', fromSide: 'bottom', toSide: 'left',  viaY: 760 },
  ],
}
