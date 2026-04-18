import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import { SEISMIC_ZONE, SEISMIC_GRADE } from '../../engine/seismicConstants.js'

// ── 스타일 상수 ─────────────────────────────────────────────────
const PAGE_STYLE: React.CSSProperties = {
  fontFamily: '"Malgun Gothic", "나눔고딕", "Noto Sans KR", sans-serif',
  fontSize: 11,
  lineHeight: 1.7,
  color: '#111',
  background: 'white',
  padding: '28px 36px',
  maxWidth: 780,
  margin: '0 auto',
  border: '1px solid #ccc',
}
const SEC_TITLE: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#1a3a5c',
  borderBottom: '2px solid #1a3a5c', paddingBottom: 3, marginTop: 22, marginBottom: 10,
}
const SUB_TITLE: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 700, color: '#1a3a5c',
  borderLeft: '3px solid #1a3a5c', paddingLeft: 6, marginTop: 14, marginBottom: 6,
}
const TABLE: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: 10.5, marginBottom: 8,
}
const TH: React.CSSProperties = {
  background: '#1a3a5c', color: 'white', padding: '4px 7px',
  fontWeight: 700, border: '1px solid #999', textAlign: 'center',
}
const TD: React.CSSProperties = {
  padding: '3px 7px', border: '1px solid #bbb', verticalAlign: 'middle',
}
const TDB: React.CSSProperties = { ...TD, fontWeight: 700 }
const TDR: React.CSSProperties = { ...TD, textAlign: 'right', fontFamily: 'Consolas, monospace' }
const TDC: React.CSSProperties = { ...TD, textAlign: 'center' }

// ── 수식 박스 ────────────────────────────────────────────────────
function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#f8f9fb', border: '1px solid #c8d4e0',
      padding: '8px 14px', margin: '6px 0 8px',
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: 10.5,
      lineHeight: 1.8, borderLeft: '3px solid #1a3a5c',
    }}>
      {children}
    </div>
  )
}

// ── 결과 박스 ────────────────────────────────────────────────────
function ResultBox({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <div style={{
      background: ok === undefined ? '#f5f8ff' : ok ? '#f0faf4' : '#fff0f0',
      border: `1px solid ${ok === undefined ? '#c0d0e8' : ok ? '#a3d9b5' : '#f5b3b3'}`,
      padding: '6px 14px', margin: '4px 0',
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: 10.5,
      borderLeft: `3px solid ${ok === undefined ? '#1a3a5c' : ok ? '#1a6b3a' : '#c0392b'}`,
    }}>
      {children}
    </div>
  )
}

// ── O.K. / N.G. 뱃지 ────────────────────────────────────────────
function Badge({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', fontSize: 10.5,
      fontWeight: 700, borderRadius: 2,
      background: ok ? '#f0faf4' : '#fff0f0',
      color: ok ? '#1a6b3a' : '#c0392b',
      border: `1px solid ${ok ? '#a3d9b5' : '#f5b3b3'}`,
    }}>
      {ok ? 'O.K.' : 'N.G.'}
    </span>
  )
}

// ── 지반 조건 삽도 (그림 C.1.1 / C.2.1 형태) ─────────────────
function SoilProfileFigure({ layers, pipeDepth, title }: {
  layers: { H: number; Vs: number }[]
  pipeDepth: number
  title: string
}) {
  const W = 320, H = 200
  const margin = { l: 80, r: 20, t: 30, b: 20 }
  const drawW = W - margin.l - margin.r
  const drawH = H - margin.t - margin.b
  const totalH = layers.reduce((s, l) => s + l.H, 0) + 5
  const scale = drawH / totalH

  let curY = margin.t
  const layerRects: JSX.Element[] = []
  const layerLabels: JSX.Element[] = []

  layers.forEach((layer, i) => {
    const lh = layer.H * scale
    const colors = ['#d8e8c0', '#c8d8b0', '#b8c8a0', '#a8b890', '#98a880']
    layerRects.push(
      <rect key={i} x={margin.l} y={curY} width={drawW} height={lh}
        fill={colors[i % colors.length]} stroke="#888" strokeWidth="0.8"/>
    )
    // 층 라벨
    if (lh > 14) {
      layerLabels.push(
        <text key={`lbl${i}`} x={margin.l + drawW / 2} y={curY + lh / 2 + 3}
          textAnchor="middle" fontSize="9" fill="#333">
          Layer {i + 1}: H={layer.H}m, Vs={layer.Vs}m/s
        </text>
      )
    }
    // 깊이 눈금
    layerLabels.push(
      <text key={`d${i}`} x={margin.l - 4} y={curY + 3} textAnchor="end" fontSize="8" fill="#555">
        {layers.slice(0, i).reduce((s, l) => s + l.H, 0).toFixed(1)}m
      </text>
    )
    curY += lh
  })

  // 기반암
  const bedrockY = curY
  layerRects.push(
    <rect key="rock" x={margin.l} y={bedrockY} width={drawW} height={drawH - (bedrockY - margin.t)}
      fill="#b0a090" stroke="#888" strokeWidth="0.8"/>
  )
  for (let i = 0; i < 8; i++) {
    layerRects.push(
      <line key={`hatch${i}`} x1={margin.l + i * 30} y1={bedrockY + 2}
        x2={margin.l + i * 30 + 18} y2={bedrockY + drawH - bedrockY + margin.t - 4}
        stroke="#777" strokeWidth="0.6" opacity="0.6"/>
    )
  }

  // 관로 위치
  const pipeY = margin.t + pipeDepth * scale
  const pipeR = 8

  return (
    <div style={{ textAlign: 'center', margin: '8px 0' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'inline-block', border: '1px solid #ccc' }}>
        {/* 제목 */}
        <text x={W / 2} y={16} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1a3a5c">{title}</text>

        {/* 지표면 */}
        <line x1={margin.l} y1={margin.t} x2={margin.l + drawW} y2={margin.t}
          stroke="#333" strokeWidth="1.5"/>
        {[0, 8, 16, 24, 32, 40].map(i => (
          <line key={i} x1={margin.l + i * 4} y1={margin.t}
            x2={margin.l + i * 4 - 6} y2={margin.t - 6}
            stroke="#555" strokeWidth="0.8"/>
        ))}
        <text x={margin.l + 2} y={margin.t - 2} fontSize="8" fill="#555">지표면</text>

        {/* 층 */}
        {layerRects}
        {layerLabels}

        {/* 기반암 라벨 */}
        <text x={margin.l + drawW / 2} y={H - 10} textAnchor="middle" fontSize="9" fill="#333">
          기반암 (Vbs)
        </text>

        {/* 깊이 축 */}
        <line x1={margin.l} y1={margin.t} x2={margin.l} y2={H - margin.b}
          stroke="#555" strokeWidth="1"/>

        {/* 관로 */}
        <circle cx={margin.l + drawW * 0.5} cy={pipeY} r={pipeR}
          fill="white" stroke="#1a3a5c" strokeWidth="1.5"/>
        <circle cx={margin.l + drawW * 0.5} cy={pipeY} r={pipeR - 3}
          fill="#dce8f5" stroke="#1a3a5c" strokeWidth="0.8"/>

        {/* 토피 치수선 */}
        <line x1={margin.l + drawW * 0.85} y1={margin.t} x2={margin.l + drawW * 0.85} y2={pipeY - pipeR}
          stroke="#c0392b" strokeWidth="0.8" strokeDasharray="3 2"/>
        <text x={margin.l + drawW * 0.87} y={(margin.t + pipeY) / 2}
          fontSize="8" fill="#c0392b">
          h
        </text>

        {/* Vs 축 */}
        <text x={W - 10} y={margin.t + 10} textAnchor="end" fontSize="8" fill="#555">Vs (m/s)</text>
      </svg>
      <div style={{ fontSize: 9.5, color: '#555', marginTop: 3 }}>{title}</div>
    </div>
  )
}

// ── 메인 보고서 ─────────────────────────────────────────────────
export default function SeismicDetailReportPage() {
  const navigate = useNavigate()
  const { detailInputs: inp, detailResult: r } = useSeismicStore()

  if (!r) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif', fontSize: 13, color: '#666' }}>
        계산 결과가 없습니다.
        <button onClick={() => navigate('/seismic-detail/input')}
          style={{ marginLeft: 12, padding: '4px 12px', fontSize: 12, cursor: 'pointer', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 2 }}>
          입력 페이지로
        </button>
      </div>
    )
  }

  const isSegmented = inp.pipeType === 'segmented'
  const rs = r as any
  const Z = SEISMIC_ZONE[inp.zone as 'I' | 'II'].Z
  const gradeInfo = SEISMIC_GRADE[inp.seismicGrade as 'I' | 'II']
  const today = new Date().toLocaleDateString('ko-KR')

  // 포아송비
  const nu = isSegmented ? 0.26 : 0.30
  const E_MPa = isSegmented ? 170000 : 206000
  const E_kN = E_MPa * 1000  // kN/m² (×10³)

  // 관 치수 (m 단위)
  const D_m = inp.D_out / 1000
  const t_m = inp.thickness / 1000

  // 충격계수
  const h = inp.hCover
  const IF = h < 1.5 ? 0.5 : h <= 6.5 ? (0.65 - 0.1 * h) : 0

  // 관로 면적, 단면 2차 모멘트
  const A_m2 = Math.PI * ((D_m / 2) ** 2 - ((D_m - 2 * t_m) / 2) ** 2)
  const I_m4 = Math.PI / 64 * (D_m ** 4 - (D_m - 2 * t_m) ** 4)
  const Z_m3 = I_m4 / (D_m / 2)

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* 인쇄 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 2 }}>
          인쇄 / PDF 저장
        </button>
        <button onClick={() => navigate('/seismic-detail/result')}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: 'white', color: '#1a3a5c', border: '1px solid #aaa', borderRadius: 2 }}>
          결과 페이지로
        </button>
      </div>

      <div style={PAGE_STYLE} id="report-area">
        {/* ── 표지 ── */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #1a3a5c', paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>
            기존시설물(상수도) 내진성능 평가요령 부록 C — 매설관로 내진성능 본평가
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1a3a5c', marginBottom: 4 }}>
            {isSegmented ? 'C.1 분절관 내진성능 본평가 검토서' : 'C.2 연속강관 내진성능 본평가 검토서'}
          </div>
          <div style={{ fontSize: 10.5, color: '#555' }}>
            {isSegmented
              ? '덕타일 주철관 (KS D 4311 수도용 원심력 덕타일주철관 2종관)'
              : '상수도용 도복장강관 (KS D 3565)'}
            &nbsp;|&nbsp; 작성일: {today}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────── */}
        {/* C.x.1 지반조건 및 관로 사양                            */}
        {/* ─────────────────────────────────────────────────────── */}
        <div style={SEC_TITLE}>{isSegmented ? 'C.1.1' : 'C.2.1'} 지반조건 및 관로 사양</div>

        <div style={SUB_TITLE}>가. 지반조건</div>
        <SoilProfileFigure
          layers={inp.layers}
          pipeDepth={inp.hCover + D_m / 2}
          title={isSegmented ? '<그림 C.1.1> 지반조건' : '<그림 C.2.1> 지반조건'}
        />
        <table style={TABLE}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 30 }}>층번</th>
              <th style={{ ...TH, width: 100 }}>층 두께 H<sub>i</sub> (m)</th>
              <th style={{ ...TH, width: 120 }}>전단파속도 V<sub>si</sub> (m/s)</th>
              <th style={{ ...TH }}>H<sub>i</sub>/V<sub>si</sub> (s)</th>
            </tr>
          </thead>
          <tbody>
            {inp.layers.map((l, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f8f8f8' : 'white' }}>
                <td style={TDC}>{i + 1}</td>
                <td style={TDC}>{l.H.toFixed(1)}</td>
                <td style={TDC}>{l.Vs.toFixed(0)}</td>
                <td style={TDC}>{(l.H / l.Vs).toFixed(4)}</td>
              </tr>
            ))}
            <tr style={{ background: '#eef2f8', fontWeight: 700 }}>
              <td style={TDC} colSpan={1}>합계</td>
              <td style={TDC}>Σ H<sub>i</sub> = {inp.layers.reduce((s, l) => s + l.H, 0).toFixed(1)} m</td>
              <td style={TDC}></td>
              <td style={TDC}>Σ H<sub>i</sub>/V<sub>si</sub> = {inp.layers.reduce((s, l) => s + l.H / l.Vs, 0).toFixed(4)} s</td>
            </tr>
          </tbody>
        </table>

        <div style={SUB_TITLE}>나. {isSegmented ? '덕타일 주철관' : '강관'}의 사양</div>
        <table style={TABLE}>
          <tbody>
            <tr style={{ background: '#f8f8f8' }}>
              <td style={{ ...TDB, width: 200 }}>종류</td>
              <td style={TD}>{isSegmented
                ? '수도용 원심력 덕타일주철관 (KS D 4311 2종관)'
                : '상수도용 도복장강관 (KS D 3565)'}</td>
            </tr>
            <tr>
              <td style={TDB}>관경 (외경) D</td>
              <td style={TD}>{D_m.toFixed(3)} m &nbsp;(DN {inp.DN})</td>
            </tr>
            <tr style={{ background: '#f8f8f8' }}>
              <td style={TDB}>관두께 t</td>
              <td style={TD}>{t_m.toFixed(4)} m &nbsp;({inp.thickness} mm)</td>
            </tr>
            {isSegmented && (
              <tr>
                <td style={TDB}>관 1본 길이 L<sub>j</sub></td>
                <td style={TD}>{inp.Lj} m</td>
              </tr>
            )}
            <tr style={{ background: '#f8f8f8' }}>
              <td style={TDB}>탄성계수 E</td>
              <td style={TD}>{E_MPa.toLocaleString()} MPa &nbsp;= {(E_MPa / 1000).toFixed(0)} × 10³ kN/m²</td>
            </tr>
            <tr>
              <td style={TDB}>포아송비 ν</td>
              <td style={TD}>{nu}</td>
            </tr>
          </tbody>
        </table>

        <div style={SUB_TITLE}>다. 매설조건 및 설계하중</div>
        <table style={TABLE}>
          <tbody>
            <tr style={{ background: '#f8f8f8' }}>
              <td style={{ ...TDB, width: 200 }}>흙두께 (토피) h</td>
              <td style={TD}>{inp.hCover.toFixed(2)} m</td>
            </tr>
            <tr>
              <td style={TDB}>설계내압 P</td>
              <td style={TD}>{inp.P} MPa &nbsp;= {(inp.P * 1000).toFixed(0)} kN/m²</td>
            </tr>
            <tr style={{ background: '#f8f8f8' }}>
              <td style={TDB}>지진구역 / 내진등급</td>
              <td style={TD}>구역 {inp.zone} (Z = {Z}) &nbsp;/ {gradeInfo.label}</td>
            </tr>
            <tr>
              <td style={TDB}>지반종류</td>
              <td style={TD}>{inp.soilType}</td>
            </tr>
            {!isSegmented && (
              <>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TDB}>온도변화 ΔT</td>
                  <td style={TD}>{inp.deltaT} °C</td>
                </tr>
                <tr>
                  <td style={TDB}>부등침하량 δ</td>
                  <td style={TD}>{inp.D_settle} m</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <div style={SUB_TITLE}>라. 지반분류</div>
        <div style={{ fontSize: 10.5, lineHeight: 2, paddingLeft: 8 }}>
          {(() => {
            const H_total = inp.layers.reduce((s, l) => s + l.H, 0)
            const Vs_avg = H_total / inp.layers.reduce((s, l) => s + l.H / l.Vs, 0)
            return (
              <>
                기반암 깊이가 {H_total.toFixed(1)} m이고, 토층평균전단파속도가 {Vs_avg.toFixed(0)} m/s로&nbsp;
                {inp.soilType} 지반으로 분류된다.
              </>
            )
          })()}
        </div>

        {/* ─────────────────────────────────────────────────────── */}
        {/* C.x.2 지반 해석 (표층지반 고유주기, 속도응답스펙트럼) */}
        {/* ─────────────────────────────────────────────────────── */}
        <div style={SEC_TITLE}>{isSegmented ? 'C.1.2' : 'C.2.2'} {isSegmented ? '관체에 발생하는 응력' : '상시하중에 의한 관체에 발생하는 변형률'}</div>

        {/* 공통: 지진 전에 먼저 상시하중 (내압) 계산 표시 */}
        <div style={SUB_TITLE}>가. 내압에 의한 {isSegmented ? '축응력 (σᵢ)' : '축변형률 (εᵢ)'}</div>

        {isSegmented ? (
          <>
            <FormulaBox>
              σᵢ = ν × P × (D − t) / (2t)<br/>
              여기서, ν : 포아송비 ({nu})<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;P : 내압 ({inp.P} MPa = {(inp.P * 1000).toFixed(0)} kN/m²)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D : 외경 ({D_m.toFixed(3)} m)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;t : 관두께 ({t_m.toFixed(4)} m)
            </FormulaBox>
            <ResultBox ok>
              ∴ σᵢ = {nu} × {(inp.P * 1000).toFixed(0)} × ({D_m.toFixed(3)} − {t_m.toFixed(4)}) / (2 × {t_m.toFixed(4)})<br/>
              &nbsp;&nbsp;&nbsp;= <strong>{rs.sigma_i?.toFixed(2)} MPa</strong>
            </ResultBox>
          </>
        ) : (
          <>
            <FormulaBox>
              εᵢ = −ν × σ_θ / E = −ν × P(D−t) / (2tE)<br/>
              여기서, ν : 포아송비 ({nu})<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;P : 내압 ({inp.P} MPa)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D : 외경 ({D_m.toFixed(3)} m), t = {t_m.toFixed(4)} m<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;E : 탄성계수 ({(E_MPa / 1000).toFixed(0)} × 10³ MPa)
            </FormulaBox>
            <ResultBox ok>
              σ_θ = P(D−t)/(2t) = {inp.P} × ({D_m.toFixed(3)}−{t_m.toFixed(4)}) / (2×{t_m.toFixed(4)}) = <strong>{rs.sigma_theta?.toFixed(2)} MPa</strong><br/>
              ∴ εᵢ = −{nu} × {rs.sigma_theta?.toFixed(2)} / {(E_MPa).toLocaleString()} = <strong>{rs.epsilon_i?.toExponential(4)}</strong>
            </ResultBox>
          </>
        )}

        <div style={SUB_TITLE}>나. 차량하중에 의한 {isSegmented ? '축응력 (σ_o)' : '축변형률 (ε_o)'}</div>
        <div style={{ fontSize: 10.5, paddingLeft: 8, lineHeight: 1.9 }}>
          {isSegmented
            ? '분절관은 이음부 회전변형에 의해 차량하중이 흡수되므로 관체 축응력 산정에서 제외한다.'
            : '도로 매설의 경우 축방향 차량하중 성분은 무시한다.'}
        </div>
        <ResultBox>
          {isSegmented ? '∴ σ_o = 0 (분절관 — 이음부 흡수)' : '∴ ε_o = 0'}
        </ResultBox>

        {!isSegmented && (
          <>
            <div style={SUB_TITLE}>다. 온도변화에 의한 축변형률 (ε_t)</div>
            <FormulaBox>
              ε_t = α_T × ΔT<br/>
              여기서, α_T : 선팽창계수 (1.2 × 10⁻⁵ /°C)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ΔT : 온도변화 ({inp.deltaT} °C)
            </FormulaBox>
            <ResultBox ok>
              ∴ ε_t = 1.2 × 10⁻⁵ × {inp.deltaT} = <strong>{rs.epsilon_t?.toExponential(4)}</strong>
            </ResultBox>

            <div style={SUB_TITLE}>라. 부등침하에 의한 축변형률 (ε_d)</div>
            {inp.D_settle > 0 && inp.L_settle > 0 ? (
              <>
                <FormulaBox>
                  ε_d = δ / (2 × L_settle)<br/>
                  여기서, δ : 부등침하량 ({inp.D_settle} m)<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;L_settle : 침하구간 ({inp.L_settle} m)
                </FormulaBox>
                <ResultBox ok>
                  ∴ ε_d = {inp.D_settle} / (2 × {inp.L_settle}) = <strong>{rs.epsilon_d?.toExponential(4)}</strong>
                </ResultBox>
              </>
            ) : (
              <ResultBox>
                ∴ ε_d = 0 (부등침하 없음 — δ = 0)
              </ResultBox>
            )}
          </>
        )}

        {/* 지진 축응력/변형률 — 공통 지반 해석 */}
        <div style={SUB_TITLE}>{isSegmented ? '다. 지진시의 축응력 (σ_x)' : '마. 지진에 의한 축변형률'}</div>
        <div style={{ fontSize: 10.5, paddingLeft: 8, lineHeight: 1.9, marginBottom: 4 }}>
          지진시 축응력은 기능수행수준과 붕괴방지수준에 동일한 절차로 진행되므로,
          지진력이 낮은 기능수행수준은 붕괴방지수준을 만족하는 경우 동일하게 만족하는 것으로 간주한다.
        </div>

        {/* ① 표층지반 설계고유주기 */}
        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#1a3a5c' }}>
          ① 표층지반의 설계고유주기 (T_s) 산정
        </div>
        <FormulaBox>
          T_G = 4 × Σ(Hᵢ/Vsᵢ) = 4 × {inp.layers.reduce((s, l) => s + l.H / l.Vs, 0).toFixed(4)} = {rs.TG?.toFixed(3)} s<br/>
          T_s = 1.25 × T_G = 1.25 × {rs.TG?.toFixed(3)} = <strong>{rs.Ts?.toFixed(3)} s</strong><br/>
          <br/>
          표층지반 특성치 계산:<br/>
          {inp.layers.map((l, i) => (
            `  Layer ${i + 1}: Hᵢ = ${l.H.toFixed(1)} m, Vsᵢ = ${l.Vs} m/s → Hᵢ/Vsᵢ = ${(l.H / l.Vs).toFixed(4)} s\n`
          )).join('')}
          Σ(Hᵢ/Vsᵢ) = {inp.layers.reduce((s, l) => s + l.H / l.Vs, 0).toFixed(4)} s
        </FormulaBox>

        {/* ② 기반면 설계속도응답스펙트럼 */}
        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#1a3a5c' }}>
          ② 기반면에서의 설계속도응답스펙트럼 (S_v) 산정
        </div>
        <FormulaBox>
          설계지반가속도: S = Z × I = {Z} × {(rs.S / Z)?.toFixed(2)} = <strong>{rs.S?.toFixed(3)} g</strong><br/>
          증폭계수: Fa = {rs.Fa?.toFixed(2)},  Fv = {rs.Fv?.toFixed(2)}<br/>
          설계스펙트럼: SDS = Fa × S × 2.5 = {rs.Fa?.toFixed(2)} × {rs.S?.toFixed(3)} × 2.5 = {rs.SDS?.toFixed(3)} g<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SD1 = Fv × S = {rs.Fv?.toFixed(2)} × {rs.S?.toFixed(3)} = {rs.SD1?.toFixed(3)} g<br/>
          T_s = {rs.Ts?.toFixed(3)} s 에서의 속도응답스펙트럼:<br/>
          Sv = SD1 × g / (2π) = {rs.SD1?.toFixed(3)} × 9.81 / (2π) = <strong>{rs.Sv?.toFixed(4)} m/s</strong>
        </FormulaBox>

        {/* ③ 관축위치 지반변위 */}
        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#1a3a5c' }}>
          ③ 관축위치의 지반변위 (U_h) 산정
        </div>
        <FormulaBox>
          U_h = (2/π²) × Sv × Ts × cos(π × z_pipe / (2 × H_total))<br/>
          여기서, Sv = {rs.Sv?.toFixed(4)} m/s,  Ts = {rs.Ts?.toFixed(3)} s<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;z_pipe = {(inp.hCover + D_m / 2).toFixed(2)} m (관축까지 거리)<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;H_total = {inp.layers.reduce((s, l) => s + l.H, 0).toFixed(1)} m (표층지반 두께)
        </FormulaBox>
        <ResultBox ok>
          ∴ U_h = <strong>{rs.Uh?.toFixed(4)} m</strong>
        </ResultBox>

        {/* ④ 지진시 파장 */}
        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#1a3a5c' }}>
          ④ 지진시 파장 (L) 산정
        </div>
        <FormulaBox>
          V_ds = 비선형성을 고려한 표층지반 평균전단파속도 = {rs.Vds?.toFixed(1)} m/s<br/>
          보정계수 ε = {inp.Vbs >= 300 ? '1.0' : '0.85'} (기반암 Vbs = {inp.Vbs} m/s {inp.Vbs >= 300 ? '≥' : '<'} 300 m/s)<br/>
          <br/>
          L₁ = Vds × Ts = {rs.Vds?.toFixed(1)} × {rs.Ts?.toFixed(3)} = {rs.L1?.toFixed(2)} m<br/>
          L₂ = Vbs × Ts = {inp.Vbs} × {rs.Ts?.toFixed(3)} = {rs.L2?.toFixed(2)} m<br/>
          L = ε × 2L₁L₂ / (L₁ + L₂) = {inp.Vbs >= 300 ? '1.0' : '0.85'} × 2 × {rs.L1?.toFixed(2)} × {rs.L2?.toFixed(2)} / ({rs.L1?.toFixed(2)} + {rs.L2?.toFixed(2)})
        </FormulaBox>
        <ResultBox ok>
          ∴ L = <strong>{rs.L?.toFixed(2)} m</strong>
        </ResultBox>

        {/* ⑤ 관체 응력/변형률 계산 */}
        {isSegmented ? (
          <>
            {/* 분절관: 축응력 계산 */}
            <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#1a3a5c' }}>
              ⑤ 지진시 축응력 (σ_x) 계산
            </div>
            <FormulaBox>
              지반 강성계수: K1 = {rs.K1?.toFixed(1)} kN/m², K2 = {rs.K2?.toFixed(1)} kN/m²<br/>
              보정계수: α1 = {rs.alpha1?.toFixed(4)}, α2 = {rs.alpha2?.toFixed(4)}<br/>
              <br/>
              축방향 응력: σ_L = α1 × (π×Uh/L) × E<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;= {rs.alpha1?.toFixed(4)} × (π × {rs.Uh?.toFixed(4)} / {rs.L?.toFixed(2)}) × {(E_MPa * 1000).toFixed(0)}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;= {rs.sigma_L?.toFixed(2)} MPa<br/>
              굽힘 응력: σ_B = α2 × (2π²×D×Uh/L²) × E = {rs.sigma_B?.toFixed(2)} MPa<br/>
              <br/>
              보정계수: ξ1 = {rs.xi1?.toFixed(4)}, ξ2 = {rs.xi2?.toFixed(4)}<br/>
              σ'_L = ξ1 × σ_L = {rs.xi1?.toFixed(4)} × {rs.sigma_L?.toFixed(2)} = {rs.sigma_L_prime?.toFixed(2)} MPa<br/>
              σ'_B = ξ2 × σ_B = {rs.xi2?.toFixed(4)} × {rs.sigma_B?.toFixed(2)} = {rs.sigma_B_prime?.toFixed(2)} MPa<br/>
              <br/>
              합성: σ_x = √(σ'_L² + σ'_B²) = √({rs.sigma_L_prime?.toFixed(2)}² + {rs.sigma_B_prime?.toFixed(2)}²)
            </FormulaBox>
            <ResultBox ok>
              ∴ σ_x = <strong>{rs.sigma_x?.toFixed(2)} MPa</strong>
            </ResultBox>
          </>
        ) : (
          <>
            {/* 연속관: 지진 축변형률 */}
            <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#1a3a5c' }}>
              ⑤ 지진에 의한 축변형률 (ε_eq) 계산
            </div>
            <FormulaBox>
              축방향 지반변형률 (축방향): ε_L = 4U_h/L = 4 × {rs.Uh?.toFixed(4)} / {rs.L?.toFixed(2)} = {rs.epsilon_eq_L?.toExponential(4)}<br/>
              굽힘 변형률: ε_B = π² × D / (2L²) × U_h<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= π² × {D_m.toFixed(3)} / (2 × {rs.L?.toFixed(2)}²) × {rs.Uh?.toFixed(4)}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {rs.epsilon_eq_B?.toExponential(4)}<br/>
              합성: ε_eq = ε_L + ε_B = {rs.epsilon_eq_L?.toExponential(4)} + {rs.epsilon_eq_B?.toExponential(4)}
            </FormulaBox>
            <ResultBox ok>
              ∴ ε_eq = <strong>{rs.epsilon_eq?.toExponential(4)}</strong>
            </ResultBox>
          </>
        )}

        {/* ─────────────────────────────────────────────────────── */}
        {/* 내진안전성 조사 표                                      */}
        {/* ─────────────────────────────────────────────────────── */}
        {isSegmented ? (
          <>
            {/* 분절관: C.1.2 라. 관체응력 내진안전성 */}
            <div style={SEC_TITLE}>C.1.2 라. 관체응력에 의한 내진안전성의 조사</div>
            <div style={{ fontSize: 10.5, lineHeight: 1.9, marginBottom: 6 }}>
              상시하중에 의한 발생응력과 지진시의 발생응력을 합산하고 이것이 허용응력 이하인지 조사한다.
            </div>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 200 }} colSpan={2}>항목</th>
                  <th style={{ ...TH, width: 140 }}>단위: MPa</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={{ ...TDB, paddingLeft: 14 }} rowSpan={3}>상시하중에<br/>의한 응력</td>
                  <td style={TD}>설계내압 σᵢ</td>
                  <td style={TDR}>{rs.sigma_i?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={TD}>차량하중 σ_o</td>
                  <td style={TDR}>0.00</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>지진 σ_x</td>
                  <td style={TDR}>{rs.sigma_x?.toFixed(2)}</td>
                </tr>
                <tr style={{ background: '#eef2f8' }}>
                  <td style={{ ...TDB }} colSpan={2}>축응력 합계 σ_total</td>
                  <td style={{ ...TDR, fontWeight: 700, fontSize: 12 }}>{rs.sigma_total?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>허용응력 σ_allow (내진 시, σ_y / 1.5 = 300 / 1.5)</td>
                  <td style={TDR}>{rs.sigma_allow?.toFixed(2)}</td>
                </tr>
                <tr style={{ background: rs.stressOK ? '#f0faf4' : '#fff0f0' }}>
                  <td style={TDB} colSpan={2}>
                    축응력합계 = {rs.sigma_total?.toFixed(2)} MPa &nbsp;
                    {rs.stressOK ? '<' : '>'} &nbsp;
                    허용응력 = {rs.sigma_allow?.toFixed(2)} MPa 이므로
                  </td>
                  <td style={{ ...TDC }}>
                    <Badge ok={rs.stressOK}/>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* C.1.3 이음부 신축량 */}
            <div style={SEC_TITLE}>C.1.3 이음새의 신축량</div>

            <div style={SUB_TITLE}>가. 내압에 의한 이음새 신축량 (eᵢ)</div>
            <FormulaBox>
              eᵢ = σᵢ × L_j / E<br/>
              여기서, σᵢ = {rs.sigma_i?.toFixed(2)} MPa,  L_j = {inp.Lj} m,  E = {(E_MPa / 1000).toFixed(0)} × 10³ MPa
            </FormulaBox>
            <ResultBox ok>
              ∴ eᵢ = {rs.sigma_i?.toFixed(2)} × {inp.Lj} / ({(E_MPa).toLocaleString()}) = <strong>{(rs.sigma_i * inp.Lj / E_MPa)?.toFixed(6)} m</strong>
            </ResultBox>

            <div style={SUB_TITLE}>나. 차량하중에 의한 이음새 신축량 (e_o)</div>
            <ResultBox>∴ e_o = 0 (분절관 — 차량하중 축응력 = 0)</ResultBox>

            <div style={SUB_TITLE}>다. 온도변화에 의한 이음새 신축량 (e_t)</div>
            <FormulaBox>
              e_t = α_T × ΔT × L_j<br/>
              여기서, α_T = 1.2 × 10⁻⁵ /°C,  ΔT = {inp.deltaT ?? 20} °C,  L_j = {inp.Lj} m
            </FormulaBox>
            <ResultBox ok>
              ∴ e_t = 1.2×10⁻⁵ × {inp.deltaT ?? 20} × {inp.Lj} = <strong>{(1.2e-5 * (inp.deltaT ?? 20) * inp.Lj).toFixed(6)} m</strong>
            </ResultBox>

            <div style={SUB_TITLE}>라. 지진시의 이음새 신축량 (|u_J|)</div>
            <FormulaBox>
              u_J = U_h × sin(π × L_j / L)<br/>
              여기서, U_h = {rs.Uh?.toFixed(4)} m,  L_j = {inp.Lj} m,  L = {rs.L?.toFixed(2)} m<br/>
              π × L_j / L = π × {inp.Lj} / {rs.L?.toFixed(2)} = {(Math.PI * inp.Lj / rs.L)?.toFixed(4)} rad
            </FormulaBox>
            <ResultBox ok={rs.dispOK}>
              ∴ |u_J| = {rs.Uh?.toFixed(4)} × sin({(Math.PI * inp.Lj / rs.L)?.toFixed(4)}) = <strong>{(rs.u_J * 1000)?.toFixed(2)} mm</strong>
            </ResultBox>

            <div style={SUB_TITLE}>마. 이음부의 신축량에 의한 내진안전성 조사</div>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 200 }} colSpan={2}>항목</th>
                  <th style={{ ...TH, width: 140 }}>단위: m</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={{ ...TDB, paddingLeft: 14 }} rowSpan={4}>상시하중에<br/>의한 신축량</td>
                  <td style={TD}>설계내압 eᵢ</td>
                  <td style={TDR}>{(rs.sigma_i * inp.Lj / E_MPa)?.toFixed(6)}</td>
                </tr>
                <tr>
                  <td style={TD}>차량하중 e_o</td>
                  <td style={TDR}>0.000000</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>온도효과 (ΔT = {inp.deltaT ?? 20}°C) e_t</td>
                  <td style={TDR}>{(1.2e-5 * (inp.deltaT ?? 20) * inp.Lj)?.toFixed(6)}</td>
                </tr>
                <tr>
                  <td style={TD}>부등침하 e_d</td>
                  <td style={TDR}>0.000000</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>지진 |u_J|</td>
                  <td style={TDB}></td>
                  <td style={TDR}>{rs.u_J?.toFixed(6)}</td>
                </tr>
                <tr style={{ background: '#eef2f8' }}>
                  <td style={TDB} colSpan={2}>이음부 신축량 합계</td>
                  <td style={{ ...TDR, fontWeight: 700, fontSize: 12 }}>
                    {(rs.sigma_i * inp.Lj / E_MPa + 1.2e-5 * (inp.deltaT ?? 20) * inp.Lj + rs.u_J)?.toFixed(6)}
                  </td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>허용 신축량 u_allow &nbsp;({inp.isSeismicJoint ? '내진형 이음 × 80%' : '일반형 이음 × 50%'})</td>
                  <td style={TDR}>{rs.u_allow?.toFixed(4)}</td>
                </tr>
                <tr style={{ background: rs.dispOK ? '#f0faf4' : '#fff0f0' }}>
                  <td style={TDB} colSpan={2}>
                    이음부신축량합계 = {(rs.sigma_i * inp.Lj / E_MPa + 1.2e-5 * (inp.deltaT ?? 20) * inp.Lj + rs.u_J)?.toFixed(6)} m
                    &nbsp;{rs.dispOK ? '<' : '>'}&nbsp;
                    허용신축량 = {rs.u_allow?.toFixed(4)} m 이므로
                  </td>
                  <td style={TDC}><Badge ok={rs.dispOK}/></td>
                </tr>
              </tbody>
            </table>

            {/* C.1.3 이음부 굽힘각 */}
            <div style={SEC_TITLE}>C.1.3 이음부 굽힘각도 (θ_J)</div>
            <FormulaBox>
              θ_J = (π × U_h / L) × sin(π × L_j / L)<br/>
              = (π × {rs.Uh?.toFixed(4)} / {rs.L?.toFixed(2)}) × sin(π × {inp.Lj} / {rs.L?.toFixed(2)})<br/>
              허용 굽힘각 θ_allow: DN {inp.DN} → {inp.DN < 300 ? '3.5°' : inp.DN <= 600 ? '2.5°' : '1.5°'}
            </FormulaBox>
            <ResultBox ok={rs.angleOK}>
              ∴ θ_J = <strong>{(rs.theta_J * 180 / Math.PI)?.toFixed(4)} °</strong>
              &nbsp;{rs.angleOK ? '<' : '>'}&nbsp;
              θ_allow = {(rs.theta_allow * 180 / Math.PI)?.toFixed(2)} °
              &nbsp;&nbsp;<Badge ok={rs.angleOK}/>
            </ResultBox>
          </>
        ) : (
          <>
            {/* 연속관: C.2.3 축변형률 내진안전성 */}
            <div style={SEC_TITLE}>C.2.3 축변형률에 의한 내진안전성의 조사</div>
            <div style={{ fontSize: 10.5, lineHeight: 1.9, marginBottom: 6 }}>
              상시하중에 의한 축변형률과 지진시의 축변형률을 합산하고 이것이 허용변형률 이하인지 조사한다.
            </div>

            <div style={SUB_TITLE}>허용변형률 (항복점 변형률 = 국부좌굴 개시변형률)</div>
            <FormulaBox>
              ε_allow = σ_y / E = {rs.sigma_y} / {E_MPa.toLocaleString()}<br/>
              = <strong>{rs.epsilon_allow?.toExponential(4)}</strong> ({(rs.epsilon_allow * 100)?.toFixed(4)} %)
            </FormulaBox>

            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 200 }} colSpan={2}>항목</th>
                  <th style={{ ...TH, width: 140 }}>단위: %</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={{ ...TDB, paddingLeft: 14 }} rowSpan={4}>상시하중에<br/>의한 축변형률</td>
                  <td style={TD}>설계내압 εᵢ</td>
                  <td style={TDR}>{(Math.abs(rs.epsilon_i) * 100)?.toFixed(4)}</td>
                </tr>
                <tr>
                  <td style={TD}>차량하중 ε_o</td>
                  <td style={TDR}>0.0000</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>온도효과 (ΔT = {inp.deltaT}°C) ε_t</td>
                  <td style={TDR}>{(Math.abs(rs.epsilon_t) * 100)?.toFixed(4)}</td>
                </tr>
                <tr>
                  <td style={TD}>부등침하 ε_d</td>
                  <td style={TDR}>{(Math.abs(rs.epsilon_d) * 100)?.toFixed(4)}</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TDB} colSpan={2}>지진 ε_eq</td>
                  <td style={TDR}>{(Math.abs(rs.epsilon_eq) * 100)?.toFixed(4)}</td>
                </tr>
                <tr style={{ background: '#eef2f8' }}>
                  <td style={TDB} colSpan={2}>축변형률 합계 ε_total</td>
                  <td style={{ ...TDR, fontWeight: 700, fontSize: 12 }}>{(rs.epsilon_total * 100)?.toFixed(4)}</td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>허용변형률 ε_allow (국부좌굴 개시변형률)</td>
                  <td style={TDR}>{(rs.epsilon_allow * 100)?.toFixed(4)}</td>
                </tr>
                <tr style={{ background: rs.strainOK ? '#f0faf4' : '#fff0f0' }}>
                  <td style={TDB} colSpan={2}>
                    축변형률합계 = {(rs.epsilon_total * 100)?.toFixed(4)} %
                    &nbsp;{rs.strainOK ? '<' : '>'}&nbsp;
                    허용변형률 = {(rs.epsilon_allow * 100)?.toFixed(4)} % 이므로
                  </td>
                  <td style={TDC}><Badge ok={rs.strainOK}/></td>
                </tr>
              </tbody>
            </table>

            {/* Von Mises 조합응력 */}
            <div style={SEC_TITLE}>C.2.4 Von Mises 조합응력 검토</div>
            <FormulaBox>
              후프응력: σ_θ = P(D−t)/(2t) = {inp.P} × ({D_m.toFixed(3)}−{t_m.toFixed(4)}) / (2×{t_m.toFixed(4)}) = {rs.sigma_theta?.toFixed(2)} MPa<br/>
              축응력:   σ_x = ν×σ_θ + E×(ε_t + ε_d + ε_eq)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {nu}×{rs.sigma_theta?.toFixed(2)} + {(E_MPa / 1000).toFixed(0)}×10³ × ({rs.epsilon_t?.toExponential(3)} + {rs.epsilon_d?.toExponential(3)} + {rs.epsilon_eq?.toExponential(3)})<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {rs.sigma_x_total?.toFixed(2)} MPa<br/>
              Von Mises: σ_vm = √(σ_θ² + σ_x² − σ_θ×σ_x)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= √({rs.sigma_theta?.toFixed(2)}² + {rs.sigma_x_total?.toFixed(2)}² − {rs.sigma_theta?.toFixed(2)}×{rs.sigma_x_total?.toFixed(2)})
            </FormulaBox>
            <ResultBox ok={rs.stressOK}>
              ∴ σ_vm = <strong>{rs.sigma_vm?.toFixed(2)} MPa</strong>
              &nbsp;{rs.stressOK ? '<' : '>'}&nbsp;
              σ_allow = {rs.sigma_allow?.toFixed(1)} MPa &nbsp;&nbsp;
              <Badge ok={rs.stressOK}/>
            </ResultBox>

            <table style={{ ...TABLE, marginTop: 10 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 200 }} colSpan={2}>항목</th>
                  <th style={{ ...TH, width: 140 }}>단위: MPa</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TDB} colSpan={2}>후프응력 σ_θ</td>
                  <td style={TDR}>{rs.sigma_theta?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>축방향 합성응력 σ_x</td>
                  <td style={TDR}>{rs.sigma_x_total?.toFixed(2)}</td>
                </tr>
                <tr style={{ background: '#eef2f8' }}>
                  <td style={TDB} colSpan={2}>Von Mises 등가응력 σ_vm</td>
                  <td style={{ ...TDR, fontWeight: 700, fontSize: 12 }}>{rs.sigma_vm?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>허용응력 σ_allow (σ_y × {inp.seismicGrade === 'I' ? '0.9' : '0.95'}, σ_y = {rs.sigma_y} MPa)</td>
                  <td style={TDR}>{rs.sigma_allow?.toFixed(1)}</td>
                </tr>
                <tr style={{ background: rs.stressOK ? '#f0faf4' : '#fff0f0' }}>
                  <td style={TDB} colSpan={2}>
                    σ_vm = {rs.sigma_vm?.toFixed(2)} MPa &nbsp;{rs.stressOK ? '<' : '>'}&nbsp; σ_allow = {rs.sigma_allow?.toFixed(1)} MPa 이므로
                  </td>
                  <td style={TDC}><Badge ok={rs.stressOK}/></td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* ─────────────────────────────────────────────────────── */}
        {/* 최종 종합 판정                                          */}
        {/* ─────────────────────────────────────────────────────── */}
        <div style={SEC_TITLE}>종합 내진안전성 판정</div>
        <table style={TABLE}>
          <thead>
            <tr>
              <th style={TH}>검토 항목</th>
              <th style={{ ...TH, width: 120 }}>계산값</th>
              <th style={{ ...TH, width: 120 }}>허용값</th>
              <th style={{ ...TH, width: 70 }}>판정</th>
            </tr>
          </thead>
          <tbody>
            {isSegmented ? (
              <>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>관체 축응력 σ_total</td>
                  <td style={TDR}>{rs.sigma_total?.toFixed(2)} MPa</td>
                  <td style={TDR}>{rs.sigma_allow?.toFixed(2)} MPa</td>
                  <td style={TDC}><Badge ok={rs.stressOK}/></td>
                </tr>
                <tr>
                  <td style={TD}>이음부 신축량 |u_J|</td>
                  <td style={TDR}>{(rs.u_J * 1000)?.toFixed(2)} mm</td>
                  <td style={TDR}>{(rs.u_allow * 1000)?.toFixed(1)} mm</td>
                  <td style={TDC}><Badge ok={rs.dispOK}/></td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>이음부 굽힘각 θ_J</td>
                  <td style={TDR}>{(rs.theta_J * 180 / Math.PI)?.toFixed(4)} °</td>
                  <td style={TDR}>{(rs.theta_allow * 180 / Math.PI)?.toFixed(2)} °</td>
                  <td style={TDC}><Badge ok={rs.angleOK}/></td>
                </tr>
              </>
            ) : (
              <>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>축변형률 합계 ε_total</td>
                  <td style={TDR}>{rs.epsilon_total?.toExponential(4)}</td>
                  <td style={TDR}>{rs.epsilon_allow?.toExponential(4)}</td>
                  <td style={TDC}><Badge ok={rs.strainOK}/></td>
                </tr>
                <tr>
                  <td style={TD}>Von Mises 응력 σ_vm</td>
                  <td style={TDR}>{rs.sigma_vm?.toFixed(2)} MPa</td>
                  <td style={TDR}>{rs.sigma_allow?.toFixed(1)} MPa</td>
                  <td style={TDC}><Badge ok={rs.stressOK}/></td>
                </tr>
              </>
            )}
            <tr style={{ background: r.ok ? '#f0faf4' : '#fff0f0', borderTop: `2px solid ${r.ok ? '#a3d9b5' : '#f5b3b3'}` }}>
              <td style={{ ...TDB, fontSize: 12 }} colSpan={3}>종합 판정</td>
              <td style={{ ...TDC, fontWeight: 900, fontSize: 13, color: r.ok ? '#1a6b3a' : '#c0392b' }}>
                {r.ok ? 'O.K.' : 'N.G.'}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: 10.5, lineHeight: 2, padding: '8px 0', marginTop: 4 }}>
          {r.ok
            ? `본 관로는 응답변위법에 의한 내진성능 본평가 결과 모든 검토항목에서 허용기준을 만족한다. 내진안전성이 확보된 것으로 판단한다.`
            : `본 관로는 응답변위법에 의한 내진성능 본평가 결과 일부 검토항목에서 허용기준을 초과한다. 내진 보강공법을 검토하여야 한다.`}
        </div>

        {/* 각주 */}
        <div style={{ marginTop: 24, borderTop: '1px solid #ccc', paddingTop: 8, fontSize: 9.5, color: '#666', lineHeight: 1.8 }}>
          ※ 적용기준: 기존시설물(상수도) 내진성능 평가요령 부록 C — 매설관로 내진성능 본평가 (응답변위법)<br/>
          ※ KDS 57 17 00 : 2022 상수도 내진설계기준  /  KDS 17 10 00 : 2022 내진설계 일반기준
        </div>
      </div>
    </div>
  )
}
