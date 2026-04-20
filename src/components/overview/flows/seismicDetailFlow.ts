import type { FlowSpec } from '../FlowChartTypes'

// ============================================================
// 내진성능 상세평가 흐름도 (응답변위법)
// 기준: KDS 57 17 00 : 2022 / 매설관로 내진성능평가 요령 부록 C
// 캔버스: 900 × 1180
// ============================================================

export const seismicDetailFlow: FlowSpec = {
  title: '내진성능 상세평가 흐름도  —  KDS 57 17 00 : 2022 / 평가요령 부록 C (응답변위법)',
  width: 900,
  height: 1180,
  legend: true,

  nodes: [
    // ── 시작 ────────────────────────────────────────────────
    {
      id: 'start', kind: 'terminal',
      x: 450, y: 46, w: 320, h: 34,
      title: '내진성능 상세평가 시작  (응답변위법)',
      codeRef: 'KDS 57 17 00',
    },

    // ── 입력 (4열) ──────────────────────────────────────────
    {
      id: 'in_ground', kind: 'input',
      x: 148, y: 130, w: 165, h: 46,
      title: '지반 조건',
      sub: '층별 H · Vs · 기반암 Vbs',
      codeRef: 'KDS 17 10 00 §4',
    },
    {
      id: 'in_earthq', kind: 'input',
      x: 370, y: 130, w: 165, h: 46,
      title: '설계지진',
      sub: 'Z · Fa/Fv · 내진등급 I',
      codeRef: 'KDS 17 10 00 §5',
    },
    {
      id: 'in_pipe', kind: 'input',
      x: 595, y: 130, w: 165, h: 46,
      title: '관로 제원',
      sub: '관종 · DN · t · E · ν',
      codeRef: 'KS D 3565/4311',
    },
    {
      id: 'in_joint', kind: 'input',
      x: 790, y: 130, w: 165, h: 46,
      title: '이음부 조건',
      sub: '연속/분절 · Lj · u_allow',
      codeRef: '요령 §C.2',
    },

    // ── 지반 응답 해석 ────────────────────────────────────────
    {
      id: 'g1', kind: 'process',
      x: 196, y: 228, w: 172, h: 52,
      title: '지반고유주기 Tg 산정',
      sub: 'Tg = 4 · Σ(Hi / VSi)',
      codeRef: '요령 식(C.1)',
    },
    {
      id: 'g2', kind: 'process',
      x: 450, y: 228, w: 172, h: 52,
      title: '탄성응답스펙트럼 Sv',
      sub: 'SDS · SD1 · Ts · Vds 산정',
      codeRef: 'KDS 17 10 00 §6',
    },
    {
      id: 'g3', kind: 'process',
      x: 708, y: 228, w: 172, h: 52,
      title: '지반변위 Uh · 파장 L',
      sub: 'L = Vds·Ts · Uh = (2/π²)·Sv·Ts',
      codeRef: '요령 식(C.2~C.5)',
    },

    // ── 지반 응답 집계 ────────────────────────────────────────
    {
      id: 'g_merge', kind: 'process',
      x: 450, y: 330, w: 280, h: 48,
      title: '지반 응답 파라미터 집계',
      sub: 'Fa · Fv · SDS · SD1 · Uh · L · Vds',
      codeRef: '평가요령 부록 C',
    },

    // ── 관종 분기 판정 ────────────────────────────────────────
    {
      id: 'd_type', kind: 'decision',
      x: 450, y: 428, w: 220, h: 46,
      title: '관종 분류?',
      sub: '용접이음 vs 기계식이음',
    },

    // ── [좌] 연속관 (강관 용접이음) ──────────────────────────
    {
      id: 'c1', kind: 'subprocess',
      x: 196, y: 530, w: 180, h: 54,
      title: '[연속관] 축·굽힘 변형률',
      sub: 'ε_L = (4Uh/L) · ε_B = π²D·Uh/2L²',
      codeRef: '식(5.3.43~44)',
      emphasis: 'info',
    },
    {
      id: 'c2', kind: 'process',
      x: 196, y: 634, w: 180, h: 54,
      title: '추가 변형률 합산',
      sub: 'ε_i(내압) + ε_t(온도) + ε_d(침하)',
      codeRef: '§5.3',
    },
    {
      id: 'c3', kind: 'decision',
      x: 196, y: 734, w: 168, h: 44,
      title: 'ε_total ≤ ε_allow ?',
    },

    // ── [우] 분절관 (덕타일 주철관 기계이음) ────────────────
    {
      id: 'seg1', kind: 'subprocess',
      x: 708, y: 530, w: 180, h: 54,
      title: '[분절관] 이음부 신축량',
      sub: 'u_J = (2/π) · L · ε_G',
      codeRef: '식(5.3.48)',
      emphasis: 'info',
    },
    {
      id: 'seg2', kind: 'process',
      x: 708, y: 634, w: 180, h: 54,
      title: '굽힘각 θ_J 산정',
      sub: 'θ_J = (π·D/L) · ε_G',
      codeRef: '식(5.3.49)',
    },
    {
      id: 'seg3', kind: 'decision',
      x: 708, y: 734, w: 168, h: 44,
      title: 'u_J, θ_J ≤ 허용?',
    },

    // ── 공통 취약부 검토 ─────────────────────────────────────
    {
      id: 'vul', kind: 'process',
      x: 450, y: 838, w: 260, h: 52,
      title: '취약부 검토',
      sub: '밸브실 · 교차부 · 분기 · 교량횡단',
      codeRef: '요령 §C.6',
    },
    {
      id: 'd_all', kind: 'decision',
      x: 450, y: 940, w: 220, h: 46,
      title: '전 항목 합격?',
    },

    // ── 최종 결과 ────────────────────────────────────────────
    {
      id: 'ok_out', kind: 'output',
      x: 680, y: 1048, w: 210, h: 54,
      title: '내진성능 확보  (O.K.)',
      sub: '붕괴방지 성능목표 달성',
      emphasis: 'ok',
    },
    {
      id: 'ng_out', kind: 'output',
      x: 220, y: 1048, w: 210, h: 54,
      title: '내진보강 필요  (N.G.)',
      sub: '관종 변경 / 가요이음 / 지반개량',
      emphasis: 'ng',
    },

    // ── 종료 ────────────────────────────────────────────────
    {
      id: 'end', kind: 'terminal',
      x: 450, y: 1148, w: 310, h: 34,
      title: '상세평가 종료 / 보고서 출력',
    },
  ],

  edges: [
    // ── 시작 → 입력 팬아웃 ─────────────────────────────────
    { from: 'start', to: 'in_ground', toSide: 'top', viaY: 88 },
    { from: 'start', to: 'in_earthq', toSide: 'top', viaY: 88 },
    { from: 'start', to: 'in_pipe',   toSide: 'top', viaY: 88 },
    { from: 'start', to: 'in_joint',  toSide: 'top', viaY: 88 },

    // ── 입력 → 지반 응답 ──────────────────────────────────
    { from: 'in_ground', to: 'g1', fromSide: 'bottom', toSide: 'top' },
    { from: 'in_earthq', to: 'g2', fromSide: 'bottom', toSide: 'top' },
    // g3: 지반 + 지진 공동 입력
    { from: 'in_ground', to: 'g3', fromSide: 'bottom', toSide: 'top', viaY: 172 },
    { from: 'in_earthq', to: 'g3', fromSide: 'bottom', toSide: 'top', viaY: 172 },

    // ── 지반응답 → 집계 (Y=296 버스바) ─────────────────────
    { from: 'g1', to: 'g_merge', fromSide: 'bottom', toSide: 'top', viaY: 296 },
    { from: 'g2', to: 'g_merge', fromSide: 'bottom', toSide: 'top', viaY: 296 },
    { from: 'g3', to: 'g_merge', fromSide: 'bottom', toSide: 'top', viaY: 296 },

    // ── 관로 조건 → 집계 (보조 점선) ───────────────────────
    {
      from: 'in_pipe', to: 'g_merge',
      fromSide: 'bottom', toSide: 'top',
      kind: 'dashed', viaX: 595,
    },

    // ── 집계 → 관종 분기 ────────────────────────────────────
    { from: 'g_merge', to: 'd_type' },

    // ── 이음 조건 → 분기 판정 ──────────────────────────────
    {
      from: 'in_joint', to: 'd_type',
      fromSide: 'bottom', toSide: 'top',
      kind: 'dashed', viaX: 820,
    },

    // ── 분기 → 각 해석 방법 ─────────────────────────────────
    {
      from: 'd_type', to: 'c1',
      fromSide: 'left', toSide: 'top',
      label: '연속관', labelDx: 4, labelDy: -4,
    },
    {
      from: 'd_type', to: 'seg1',
      fromSide: 'right', toSide: 'top',
      label: '분절관', labelDx: 4, labelDy: -4,
    },

    // ── 연속관 브랜치 ────────────────────────────────────────
    { from: 'c1', to: 'c2' },
    { from: 'c2', to: 'c3' },

    // ── 분절관 브랜치 ────────────────────────────────────────
    { from: 'seg1', to: 'seg2' },
    { from: 'seg2', to: 'seg3' },

    // ── 각 브랜치 OK → 취약부 검토 (Y=800 수렴) ────────────
    {
      from: 'c3', to: 'vul',
      fromSide: 'bottom', toSide: 'left',
      color: 'ok', label: 'OK',
      viaY: 800, labelDx: 3, labelDy: 13,
    },
    {
      from: 'seg3', to: 'vul',
      fromSide: 'bottom', toSide: 'right',
      color: 'ok',
      viaY: 800,
    },

    // ── 각 브랜치 NG → N.G. 출력 (X=22 좌측 채널) ──────────
    {
      from: 'c3', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed', label: 'NG',
      viaX: 22, labelDx: 4, labelDy: -5,
    },
    {
      from: 'seg3', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed',
      viaX: 22,
    },

    // ── 취약부 → 최종 판정 ──────────────────────────────────
    { from: 'vul', to: 'd_all' },

    // ── 최종 판정 → 결과 ────────────────────────────────────
    {
      from: 'd_all', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 680, labelDx: 6, labelDy: -4,
    },
    {
      from: 'd_all', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 22, labelDx: 4, labelDy: -5,
    },

    // ── 결과 → 종료 ─────────────────────────────────────────
    { from: 'ok_out', to: 'end', fromSide: 'bottom', toSide: 'right', viaY: 1122 },
    { from: 'ng_out', to: 'end', fromSide: 'bottom', toSide: 'left',  viaY: 1122 },
  ],
}
