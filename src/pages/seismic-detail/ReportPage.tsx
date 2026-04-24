import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import { SEISMIC_ZONE, SEISMIC_GRADE } from '../../engine/seismicConstants.js'
import {
  Frac, Sub, Sup, Sqrt, FormulaBlock, FormulaRow, ResultBlock, OKBadge, G,
} from '../../components/report/MathElements'

// ── 스타일 상수 ─────────────────────────────────────────────────
const NAVY = '#1a3a5c'
const F_BODY = '"Malgun Gothic", "나눔고딕", "Noto Sans KR", sans-serif'
const F_MONO = 'Consolas, "Courier New", monospace'

const SEC_TITLE: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 700, color: NAVY,
  borderBottom: `2px solid ${NAVY}`, paddingBottom: 3, marginTop: 20, marginBottom: 8,
}
const SUB_TITLE: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: NAVY,
  borderLeft: `3px solid ${NAVY}`, paddingLeft: 6, marginTop: 12, marginBottom: 4,
}
const TABLE: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 6 }
const TH: React.CSSProperties = { background: NAVY, color: 'white', padding: '4px 7px', fontWeight: 700, border: '1px solid #999', textAlign: 'center' }
const TD: React.CSSProperties = { padding: '3px 7px', border: '1px solid #bbb', verticalAlign: 'middle', fontSize: 10 }
const TDB: React.CSSProperties = { ...TD, fontWeight: 700 }
const TDR: React.CSSProperties = { ...TD, textAlign: 'right', fontFamily: F_MONO }
const TDC: React.CSSProperties = { ...TD, textAlign: 'center' }

// ── 지반 단면도 ─────────────────────────────────────────────────
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
        fill={colors[i % colors.length]} stroke="#888" strokeWidth="0.8" />
    )
    if (lh > 14) {
      layerLabels.push(
        <text key={`lbl${i}`} x={margin.l + drawW / 2} y={curY + lh / 2 + 3}
          textAnchor="middle" fontSize="9" fill="#333">
          Layer {i + 1}: H={layer.H}m, Vs={layer.Vs}m/s
        </text>
      )
    }
    layerLabels.push(
      <text key={`d${i}`} x={margin.l - 4} y={curY + 3} textAnchor="end" fontSize="8" fill="#555">
        {layers.slice(0, i).reduce((s, l) => s + l.H, 0).toFixed(1)}m
      </text>
    )
    curY += lh
  })

  const bedrockY = curY
  layerRects.push(
    <rect key="rock" x={margin.l} y={bedrockY} width={drawW} height={drawH - (bedrockY - margin.t)}
      fill="#b0a090" stroke="#888" strokeWidth="0.8" />
  )
  for (let i = 0; i < 8; i++) {
    layerRects.push(
      <line key={`hatch${i}`} x1={margin.l + i * 30} y1={bedrockY + 2}
        x2={margin.l + i * 30 + 18} y2={bedrockY + drawH - bedrockY + margin.t - 4}
        stroke="#777" strokeWidth="0.6" opacity="0.6" />
    )
  }

  const pipeY = margin.t + pipeDepth * scale
  const pipeR = 8

  return (
    <div style={{ textAlign: 'center', margin: '8px 0' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'inline-block', border: '1px solid #ccc' }}>
        <text x={W / 2} y={16} textAnchor="middle" fontSize="10" fontWeight="700" fill={NAVY}>{title}</text>
        <line x1={margin.l} y1={margin.t} x2={margin.l + drawW} y2={margin.t} stroke="#333" strokeWidth="1.5" />
        {[0, 8, 16, 24, 32, 40].map(i => (
          <line key={i} x1={margin.l + i * 4} y1={margin.t} x2={margin.l + i * 4 - 6} y2={margin.t - 6} stroke="#555" strokeWidth="0.8" />
        ))}
        <text x={margin.l + 2} y={margin.t - 2} fontSize="8" fill="#555">지표면</text>
        {layerRects}
        {layerLabels}
        <text x={margin.l + drawW / 2} y={H - 10} textAnchor="middle" fontSize="9" fill="#333">기반암 (V<tspan dy="3" fontSize="7">bs</tspan>)</text>
        <line x1={margin.l} y1={margin.t} x2={margin.l} y2={H - margin.b} stroke="#555" strokeWidth="1" />
        <circle cx={margin.l + drawW * 0.5} cy={pipeY} r={pipeR} fill="white" stroke={NAVY} strokeWidth="1.5" />
        <circle cx={margin.l + drawW * 0.5} cy={pipeY} r={pipeR - 3} fill="#dce8f5" stroke={NAVY} strokeWidth="0.8" />
        <line x1={margin.l + drawW * 0.85} y1={margin.t} x2={margin.l + drawW * 0.85} y2={pipeY - pipeR}
          stroke="#c0392b" strokeWidth="0.8" strokeDasharray="3 2" />
        <text x={margin.l + drawW * 0.87} y={(margin.t + pipeY) / 2} fontSize="8" fill="#c0392b">h</text>
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
      <div style={{ padding: 24, fontFamily: F_BODY, fontSize: 13, color: '#666' }}>
        계산 결과가 없습니다.
        <button onClick={() => navigate('/seismic-detail/input')}
          style={{ marginLeft: 12, padding: '4px 12px', fontSize: 12, cursor: 'pointer', background: NAVY, color: 'white', border: 'none', borderRadius: 2 }}>
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

  const nu = isSegmented ? 0.26 : 0.30
  const E_MPa = rs.E_use ?? (isSegmented ? 170000 : 206000)

  const D_m = inp.D_out / 1000
  const t_m = inp.thickness / 1000

  const H_total = inp.layers.reduce((s, l) => s + l.H, 0)
  const sumHV = inp.layers.reduce((s, l) => s + l.H / l.Vs, 0)
  const Vs_avg = H_total / sumHV

  const e_i_val = rs.sigma_i * inp.Lj / E_MPa
  const e_t_val = 1.2e-5 * (inp.deltaT ?? 20) * inp.Lj
  const piLjL = Math.PI * inp.Lj / (rs.L ?? 1)
  const eps_label = inp.Vbs >= 300 ? '1.0' : '0.85'

  return (
    <div className="report-wrapper" style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* 인쇄 버튼 */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <button onClick={() => window.print()}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: NAVY, color: 'white', border: 'none', borderRadius: 2 }}>
          인쇄 / PDF 저장
        </button>
        <button onClick={() => navigate('/seismic-detail/result')}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: 'white', color: NAVY, border: '1px solid #aaa', borderRadius: 2 }}>
          결과 페이지로
        </button>
      </div>

      <div className="report-body" style={{ background: 'white', border: '1px solid #ccc', padding: '28px 36px', fontFamily: F_BODY, fontSize: 11, lineHeight: 1.7, color: '#111' }}>

        {/* ── 표지 ── */}
        <div className="keep-together" style={{ textAlign: 'center', borderBottom: `2px solid ${NAVY}`, paddingBottom: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>
            기존시설물(상수도) 내진성능 평가요령 부록 C — 매설관로 내진성능 본평가
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: NAVY, marginBottom: 4 }}>
            {isSegmented ? 'C.1 분절관 내진성능 본평가 검토서' : 'C.2 연속강관 내진성능 본평가 검토서'}
          </div>
          <div style={{ fontSize: 10.5, color: '#555' }}>
            {isSegmented
              ? '덕타일 주철관 (KS D 4311 수도용 원심력 덕타일주철관 2종관)'
              : '상수도용 도복장강관 (KS D 3565)'}
            &nbsp;|&nbsp;작성일: {today}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* C.x.1 지반조건 및 관로 사양                    */}
        {/* ═══════════════════════════════════════════════ */}
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
              <th style={TH}>층 두께 H<sub>i</sub> (m)</th>
              <th style={TH}>전단파속도 V<sub>si</sub> (m/s)</th>
              <th style={TH}>H<sub>i</sub>/V<sub>si</sub> (s)</th>
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
              <td style={TDC}>합계</td>
              <td style={TDC}>{G.Sigma}H<sub>i</sub> = {H_total.toFixed(1)} m</td>
              <td style={TDC}></td>
              <td style={TDC}>{G.Sigma}H<sub>i</sub>/V<sub>si</sub> = {sumHV.toFixed(4)} s</td>
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
              <td style={TD}>{E_MPa.toLocaleString()} MPa&nbsp;= {(E_MPa / 1000).toFixed(0)} {G.times} 10<sup>3</sup> kN/m<sup>2</sup></td>
            </tr>
            <tr>
              <td style={TDB}>포아송비 {G.nu}</td>
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
              <td style={TD}>{inp.P} MPa&nbsp;= {(inp.P * 1000).toFixed(0)} kN/m<sup>2</sup></td>
            </tr>
            <tr style={{ background: '#f8f8f8' }}>
              <td style={TDB}>지진구역 / 내진등급</td>
              <td style={TD}>구역 {inp.zone} (Z = {Z}) / {gradeInfo.label}</td>
            </tr>
            <tr>
              <td style={TDB}>지반종류</td>
              <td style={TD}>{inp.soilType}</td>
            </tr>
            {!isSegmented && (
              <>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TDB}>온도변화 {G.Delta}T</td>
                  <td style={TD}>{inp.deltaT} {G.deg}C</td>
                </tr>
                <tr>
                  <td style={TDB}>부등침하량 {G.delta}</td>
                  <td style={TD}>{inp.D_settle} m</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <div style={SUB_TITLE}>라. 지반분류</div>
        <div style={{ fontSize: 10.5, lineHeight: 2, paddingLeft: 8 }}>
          기반암 깊이가 {H_total.toFixed(1)} m이고, 토층평균전단파속도가 {Vs_avg.toFixed(0)} m/s로&nbsp;
          {inp.soilType} 지반으로 분류된다.
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* C.x.2 상시하중에 의한 발생 응력/변형률          */}
        {/* ═══════════════════════════════════════════════ */}
        <div style={SEC_TITLE} className="page-break-before">
          {isSegmented ? 'C.1.2' : 'C.2.2'}&nbsp;
          {isSegmented ? '관체에 발생하는 응력' : '상시하중에 의한 관체에 발생하는 변형률'}
        </div>

        {/* 가. 내압 */}
        <div style={SUB_TITLE}>
          가. 내압에 의한 {isSegmented ? <>축응력 ({G.sigma}<Sub>i</Sub>)</> : <>{G.epsilon}<Sub>i</Sub></>}
        </div>
        {isSegmented ? (
          <>
            <FormulaBlock>
              <FormulaRow>
                {G.sigma}<Sub>i</Sub> = {G.nu} {G.times}&nbsp;
                <Frac top={<>P {G.cdot} (D − t)</>} bot="2t" />
              </FormulaRow>
              <FormulaRow>
                여기서,&nbsp; {G.nu} = {nu},&nbsp; P = {inp.P} MPa,&nbsp;
                D = {D_m.toFixed(3)} m,&nbsp; t = {t_m.toFixed(4)} m
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok>
              <FormulaRow>
                {G.sigma}<Sub>i</Sub> = {nu} {G.times}&nbsp;
                <Frac top={<>{(inp.P * 1000).toFixed(0)} {G.times} ({D_m.toFixed(3)} − {t_m.toFixed(4)})</>} bot={<>2 {G.times} {t_m.toFixed(4)}</>} />
                &nbsp;=&nbsp;<strong>{rs.sigma_i?.toFixed(2)} MPa</strong>
              </FormulaRow>
            </ResultBlock>
          </>
        ) : (
          <>
            <FormulaBlock>
              <FormulaRow>
                {G.sigma}<Sub>{G.theta}</Sub> =&nbsp;
                <Frac top={<>P(D − t)</>} bot="2t" />&nbsp;,&nbsp;
                {G.epsilon}<Sub>i</Sub> = −{G.nu} {G.times}&nbsp;
                <Frac top={<>{G.sigma}<Sub>{G.theta}</Sub></>} bot="E" />
              </FormulaRow>
              <FormulaRow>
                여기서,&nbsp; {G.nu} = {nu},&nbsp; P = {inp.P} MPa,&nbsp;
                D = {D_m.toFixed(3)} m,&nbsp; t = {t_m.toFixed(4)} m,&nbsp;
                E = {E_MPa.toLocaleString()} MPa
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok>
              <FormulaRow>
                {G.sigma}<Sub>{G.theta}</Sub> =&nbsp;
                <Frac top={<>{inp.P} {G.times} ({D_m.toFixed(3)}−{t_m.toFixed(4)})</>} bot={<>2 {G.times} {t_m.toFixed(4)}</>} />
                &nbsp;=&nbsp;<strong>{rs.sigma_theta?.toFixed(2)} MPa</strong>
              </FormulaRow>
              <FormulaRow>
                {G.epsilon}<Sub>i</Sub> = −{nu} {G.times}&nbsp;
                <Frac top={rs.sigma_theta?.toFixed(2)} bot={E_MPa.toLocaleString()} />
                &nbsp;=&nbsp;<strong>{rs.epsilon_i?.toExponential(4)}</strong>
              </FormulaRow>
            </ResultBlock>
          </>
        )}

        {/* 나. 차량하중 */}
        <div style={SUB_TITLE}>
          나. 차량하중에 의한 {isSegmented ? <>{G.sigma}<Sub>o</Sub></> : <>{G.epsilon}<Sub>o</Sub></>}
        </div>
        <div style={{ fontSize: 10.5, paddingLeft: 8, lineHeight: 2 }}>
          {isSegmented
            ? '분절관은 이음부 회전변형에 의해 차량하중이 흡수되므로 관체 축응력 산정에서 제외한다.'
            : '도로 매설의 경우 축방향 차량하중 성분은 무시한다.'}
        </div>
        <ResultBlock>
          {isSegmented
            ? <FormulaRow>{G.sigma}<Sub>o</Sub> = 0 (분절관 — 이음부 흡수)</FormulaRow>
            : <FormulaRow>{G.epsilon}<Sub>o</Sub> = 0</FormulaRow>}
        </ResultBlock>

        {/* 다. 온도 (연속관만) */}
        {!isSegmented && (
          <>
            <div style={SUB_TITLE}>다. 온도변화에 의한 축변형률 ({G.epsilon}<Sub>t</Sub>)</div>
            <FormulaBlock>
              <FormulaRow>
                {G.epsilon}<Sub>t</Sub> = {G.alpha}<Sub>T</Sub> {G.times} {G.Delta}T
              </FormulaRow>
              <FormulaRow>
                여기서,&nbsp; {G.alpha}<Sub>T</Sub> = 1.2 {G.times} 10<sup>−5</sup> /°C,&nbsp;
                {G.Delta}T = {inp.deltaT} °C
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok>
              <FormulaRow>
                {G.epsilon}<Sub>t</Sub> = 1.2 {G.times} 10<sup>−5</sup> {G.times} {inp.deltaT} =&nbsp;
                <strong>{rs.epsilon_t?.toExponential(4)}</strong>
              </FormulaRow>
            </ResultBlock>

            <div style={SUB_TITLE}>라. 부등침하에 의한 축변형률 ({G.epsilon}<Sub>d</Sub>)</div>
            {inp.D_settle > 0 && inp.L_settle > 0 ? (
              <>
                <FormulaBlock>
                  <FormulaRow>
                    {G.epsilon}<Sub>d</Sub> =&nbsp;
                    <Frac top={G.delta} bot={<>2 {G.times} L<Sub>settle</Sub></>} />
                  </FormulaRow>
                  <FormulaRow>
                    여기서,&nbsp; {G.delta} = {inp.D_settle} m,&nbsp;
                    L<Sub>settle</Sub> = {inp.L_settle} m
                  </FormulaRow>
                </FormulaBlock>
                <ResultBlock ok>
                  <FormulaRow>
                    {G.epsilon}<Sub>d</Sub> =&nbsp;
                    <Frac top={inp.D_settle} bot={<>2 {G.times} {inp.L_settle}</>} />
                    &nbsp;=&nbsp;<strong>{rs.epsilon_d?.toExponential(4)}</strong>
                  </FormulaRow>
                </ResultBlock>
              </>
            ) : (
              <ResultBlock>
                <FormulaRow>{G.epsilon}<Sub>d</Sub> = 0 (부등침하 없음 — {G.delta} = 0)</FormulaRow>
              </ResultBlock>
            )}
          </>
        )}

        {/* 지진 축응력/변형률 */}
        <div style={SUB_TITLE}>
          {isSegmented ? '다.' : '마.'} 지진시의 {isSegmented ? <>축응력 ({G.sigma}<Sub>x</Sub>)</> : '축변형률'}
        </div>
        <div style={{ fontSize: 10.5, paddingLeft: 8, lineHeight: 2, marginBottom: 4 }}>
          지진시 축응력은 기능수행수준과 붕괴방지수준에 동일한 절차로 진행되므로,
          지진력이 낮은 기능수행수준은 붕괴방지수준을 만족하는 경우 동일하게 만족하는 것으로 간주한다.
        </div>

        {/* ① 표층지반 고유주기 */}
        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4, color: NAVY }}>
          ① 표층지반의 설계고유주기 (T<sub>s</sub>) 산정
        </div>
        <FormulaBlock>
          <FormulaRow>
            T<Sub>G</Sub> = 4 {G.times}&nbsp;
            {G.Sigma}<Sub>i</Sub>&nbsp;
            <Frac top={<>H<Sub>i</Sub></>} bot={<>V<Sub>si</Sub></>} />
            &nbsp;= 4 {G.times} {sumHV.toFixed(4)} = {rs.TG?.toFixed(3)} s
          </FormulaRow>
          <FormulaRow>
            T<Sub>s</Sub> = 1.25 {G.times} T<Sub>G</Sub> = 1.25 {G.times} {rs.TG?.toFixed(3)} =&nbsp;
            <strong>{rs.Ts?.toFixed(3)} s</strong>
          </FormulaRow>
        </FormulaBlock>

        {/* ② 속도응답스펙트럼 */}
        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4, color: NAVY }}>
          ② 기반면에서의 설계속도응답스펙트럼 (S<sub>v</sub>) 산정
        </div>
        <FormulaBlock>
          <FormulaRow>
            설계지반가속도: S = Z {G.times} I = {Z} {G.times} {(rs.S / Z)?.toFixed(2)} =&nbsp;
            <strong>{rs.S?.toFixed(3)} g</strong>
          </FormulaRow>
          <FormulaRow>
            증폭계수: F<Sub>a</Sub> = {rs.Fa?.toFixed(2)},&nbsp; F<Sub>v</Sub> = {rs.Fv?.toFixed(2)}
          </FormulaRow>
          <FormulaRow>
            S<Sub>DS</Sub> = F<Sub>a</Sub> {G.times} S {G.times} 2.5 = {rs.Fa?.toFixed(2)} {G.times} {rs.S?.toFixed(3)} {G.times} 2.5 = {rs.SDS?.toFixed(3)} g
          </FormulaRow>
          <FormulaRow>
            S<Sub>D1</Sub> = F<Sub>v</Sub> {G.times} S = {rs.Fv?.toFixed(2)} {G.times} {rs.S?.toFixed(3)} = {rs.SD1?.toFixed(3)} g
          </FormulaRow>
          <FormulaRow>
            S<Sub>v</Sub> =&nbsp;
            <Frac top={<>S<Sub>D1</Sub> {G.times} g</>} bot={<>2{G.pi}</>} />
            &nbsp;=&nbsp;
            <Frac top={<>{rs.SD1?.toFixed(3)} {G.times} 9.81</>} bot={<>2{G.pi}</>} />
            &nbsp;=&nbsp;<strong>{rs.Sv?.toFixed(4)} m/s</strong>
          </FormulaRow>
        </FormulaBlock>

        {/* ③ 관축위치 지반변위 */}
        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4, color: NAVY }}>
          ③ 관축위치의 지반변위 (U<sub>h</sub>) 산정
        </div>
        <FormulaBlock>
          <FormulaRow>
            U<Sub>h</Sub> =&nbsp;
            <Frac top="2" bot={<>{G.pi}<Sup>2</Sup></>} />
            &nbsp;{G.times} S<Sub>v</Sub> {G.times} T<Sub>s</Sub> {G.times} cos&nbsp;
            <Frac top={<>{G.pi} {G.times} z<Sub>pipe</Sub></>} bot={<>2 {G.times} H<Sub>total</Sub></>} />
          </FormulaRow>
          <FormulaRow>
            여기서,&nbsp; S<Sub>v</Sub> = {rs.Sv?.toFixed(4)} m/s,&nbsp;
            T<Sub>s</Sub> = {rs.Ts?.toFixed(3)} s,&nbsp;
            z<Sub>pipe</Sub> = {(inp.hCover + D_m / 2).toFixed(2)} m,&nbsp;
            H<Sub>total</Sub> = {H_total.toFixed(1)} m
          </FormulaRow>
        </FormulaBlock>
        <ResultBlock ok>
          <FormulaRow>
            U<Sub>h</Sub> =&nbsp;<strong>{rs.Uh?.toFixed(4)} m</strong>
          </FormulaRow>
        </ResultBlock>

        {/* ④ 파장 */}
        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4, color: NAVY }}>
          ④ 지진시 파장 (L) 산정
        </div>
        <FormulaBlock>
          <FormulaRow>
            V<Sub>ds</Sub> (비선형성 고려 표층지반 평균전단파속도) = {rs.Vds?.toFixed(1)} m/s
          </FormulaRow>
          <FormulaRow>
            보정계수 {G.epsilon} = {eps_label}&nbsp;
            (기반암 V<Sub>bs</Sub> = {inp.Vbs} m/s {inp.Vbs >= 300 ? '≥' : '<'} 300 m/s)
          </FormulaRow>
          <FormulaRow>
            L<Sub>1</Sub> = V<Sub>ds</Sub> {G.times} T<Sub>s</Sub> = {rs.Vds?.toFixed(1)} {G.times} {rs.Ts?.toFixed(3)} = {rs.L1?.toFixed(2)} m
          </FormulaRow>
          <FormulaRow>
            L<Sub>2</Sub> = V<Sub>bs</Sub> {G.times} T<Sub>s</Sub> = {inp.Vbs} {G.times} {rs.Ts?.toFixed(3)} = {rs.L2?.toFixed(2)} m
          </FormulaRow>
          <FormulaRow>
            L = {G.epsilon} {G.times}&nbsp;
            <Frac top={<>2 L<Sub>1</Sub> L<Sub>2</Sub></>} bot={<>L<Sub>1</Sub> + L<Sub>2</Sub></>} />
            &nbsp;= {eps_label} {G.times}&nbsp;
            <Frac top={<>2 {G.times} {rs.L1?.toFixed(2)} {G.times} {rs.L2?.toFixed(2)}</>} bot={<>{rs.L1?.toFixed(2)} + {rs.L2?.toFixed(2)}</>} />
          </FormulaRow>
        </FormulaBlock>
        <ResultBlock ok>
          <FormulaRow>L = <strong>{rs.L?.toFixed(2)} m</strong></FormulaRow>
        </ResultBlock>

        {/* ⑤ 관체 응력/변형률 */}
        {isSegmented ? (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4, color: NAVY }}>
              ⑤ 지진시 축응력 ({G.sigma}<sub>x</sub>) 계산
            </div>
            <FormulaBlock>
              <FormulaRow>
                지반 강성계수: K<Sub>1</Sub> = {rs.K1?.toFixed(1)} kN/m<Sup>2</Sup>,&nbsp;
                K<Sub>2</Sub> = {rs.K2?.toFixed(1)} kN/m<Sup>2</Sup>
              </FormulaRow>
              <FormulaRow>
                보정계수: {G.alpha}<Sub>1</Sub> = {rs.alpha1?.toFixed(4)},&nbsp;
                {G.alpha}<Sub>2</Sub> = {rs.alpha2?.toFixed(4)}
              </FormulaRow>
              <FormulaRow>
                {G.sigma}<Sub>L</Sub> = {G.alpha}<Sub>1</Sub> {G.times}&nbsp;
                <Frac top={<>{G.pi} {G.times} U<Sub>h</Sub></>} bot="L" />
                &nbsp;{G.times} E = {rs.alpha1?.toFixed(4)} {G.times}&nbsp;
                <Frac top={<>{G.pi} {G.times} {rs.Uh?.toFixed(4)}</>} bot={rs.L?.toFixed(2)} />
                &nbsp;{G.times} {E_MPa.toLocaleString()} = {rs.sigma_L?.toFixed(2)} MPa
              </FormulaRow>
              <FormulaRow>
                {G.sigma}<Sub>B</Sub> = {G.alpha}<Sub>2</Sub> {G.times}&nbsp;
                <Frac top={<>2{G.pi}<Sup>2</Sup> D U<Sub>h</Sub></>} bot={<>L<Sup>2</Sup></>} />
                &nbsp;{G.times} E = {rs.sigma_B?.toFixed(2)} MPa
              </FormulaRow>
              <FormulaRow>
                보정계수: {G.xi}<Sub>1</Sub> = {rs.xi1?.toFixed(4)},&nbsp;
                {G.xi}<Sub>2</Sub> = {rs.xi2?.toFixed(4)}
              </FormulaRow>
              <FormulaRow>
                {G.sigma}'<Sub>L</Sub> = {G.xi}<Sub>1</Sub> {G.times} {G.sigma}<Sub>L</Sub> = {rs.xi1?.toFixed(4)} {G.times} {rs.sigma_L?.toFixed(2)} = {rs.sigma_L_prime?.toFixed(2)} MPa
              </FormulaRow>
              <FormulaRow>
                {G.sigma}'<Sub>B</Sub> = {G.xi}<Sub>2</Sub> {G.times} {G.sigma}<Sub>B</Sub> = {rs.xi2?.toFixed(4)} {G.times} {rs.sigma_B?.toFixed(2)} = {rs.sigma_B_prime?.toFixed(2)} MPa
              </FormulaRow>
              <FormulaRow>
                {G.sigma}<Sub>x</Sub> =&nbsp;
                <Sqrt>
                  {G.sigma}'<Sub>L</Sub><Sup>2</Sup> + {G.sigma}'<Sub>B</Sub><Sup>2</Sup>
                </Sqrt>
                &nbsp;=&nbsp;
                <Sqrt>
                  {rs.sigma_L_prime?.toFixed(2)}<Sup>2</Sup> + {rs.sigma_B_prime?.toFixed(2)}<Sup>2</Sup>
                </Sqrt>
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok>
              <FormulaRow>
                {G.sigma}<Sub>x</Sub> = <strong>{rs.sigma_x?.toFixed(2)} MPa</strong>
              </FormulaRow>
            </ResultBlock>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4, color: NAVY }}>
              ⑤ 지진에 의한 축변형률 ({G.epsilon}<sub>eq</sub>) 계산
            </div>
            <FormulaBlock>
              <FormulaRow>
                축방향 지반변형률: {G.epsilon}<Sub>L</Sub> =&nbsp;
                <Frac top={<>4 U<Sub>h</Sub></>} bot="L" />
                &nbsp;=&nbsp;
                <Frac top={<>4 {G.times} {rs.Uh?.toFixed(4)}</>} bot={rs.L?.toFixed(2)} />
                &nbsp;= {rs.epsilon_eq_L?.toExponential(4)}
              </FormulaRow>
              <FormulaRow>
                굽힘 변형률: {G.epsilon}<Sub>B</Sub> =&nbsp;
                <Frac top={<>{G.pi}<Sup>2</Sup> D U<Sub>h</Sub></>} bot={<>2 L<Sup>2</Sup></>} />
                &nbsp;=&nbsp;
                <Frac top={<>{G.pi}<Sup>2</Sup> {G.times} {D_m.toFixed(3)} {G.times} {rs.Uh?.toFixed(4)}</>} bot={<>2 {G.times} {rs.L?.toFixed(2)}<Sup>2</Sup></>} />
                &nbsp;= {rs.epsilon_eq_B?.toExponential(4)}
              </FormulaRow>
              <FormulaRow>
                {G.epsilon}<Sub>eq</Sub> = {G.epsilon}<Sub>L</Sub> + {G.epsilon}<Sub>B</Sub> = {rs.epsilon_eq_L?.toExponential(4)} + {rs.epsilon_eq_B?.toExponential(4)}
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok>
              <FormulaRow>
                {G.epsilon}<Sub>eq</Sub> = <strong>{rs.epsilon_eq?.toExponential(4)}</strong>
              </FormulaRow>
            </ResultBlock>
          </>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* 분절관: 관체응력 내진안전성                       */}
        {/* ═══════════════════════════════════════════════ */}
        {isSegmented ? (
          <>
            <div style={SEC_TITLE} className="page-break-before">C.1.2 라. 관체응력에 의한 내진안전성의 조사</div>
            <div style={{ fontSize: 10.5, lineHeight: 2, marginBottom: 6 }}>
              상시하중에 의한 발생응력과 지진시의 발생응력을 합산하고 이것이 허용응력 이하인지 조사한다.
            </div>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 200 }} colSpan={2}>항목</th>
                  <th style={TH}>단위: MPa</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={{ ...TDB, paddingLeft: 14 }} rowSpan={3}>상시하중에<br />의한 응력</td>
                  <td style={TD}>설계내압 {G.sigma}<Sub>i</Sub></td>
                  <td style={TDR}>{rs.sigma_i?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={TD}>차량하중 {G.sigma}<Sub>o</Sub></td>
                  <td style={TDR}>0.00</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>지진 {G.sigma}<Sub>x</Sub></td>
                  <td style={TDR}>{rs.sigma_x?.toFixed(2)}</td>
                </tr>
                <tr style={{ background: '#eef2f8' }}>
                  <td style={TDB} colSpan={2}>축응력 합계 {G.sigma}<Sub>total</Sub></td>
                  <td style={{ ...TDR, fontWeight: 700, fontSize: 12 }}>{rs.sigma_total?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>
                    허용응력 {G.sigma}<Sub>allow</Sub>&nbsp;(내진 시, {G.sigma}<Sub>y</Sub>/1.5 = 300/1.5)
                  </td>
                  <td style={TDR}>{rs.sigma_allow?.toFixed(2)}</td>
                </tr>
                <tr style={{ background: rs.stressOK ? '#f0faf4' : '#fff0f0' }}>
                  <td style={TDB} colSpan={2}>
                    {G.sigma}<Sub>total</Sub> = {rs.sigma_total?.toFixed(2)} MPa&nbsp;
                    {rs.stressOK ? G.le : G.ge}&nbsp;
                    {G.sigma}<Sub>allow</Sub> = {rs.sigma_allow?.toFixed(2)} MPa 이므로
                  </td>
                  <td style={TDC}><OKBadge ok={rs.stressOK} /></td>
                </tr>
              </tbody>
            </table>

            {/* C.1.3 이음새 신축량 */}
            <div style={SEC_TITLE}>C.1.3 이음새의 신축량</div>

            <div style={SUB_TITLE}>가. 내압에 의한 이음새 신축량 (e<Sub>i</Sub>)</div>
            <FormulaBlock>
              <FormulaRow>
                e<Sub>i</Sub> =&nbsp;
                <Frac top={<>{G.sigma}<Sub>i</Sub> {G.times} L<Sub>j</Sub></>} bot="E" />
                &nbsp;=&nbsp;
                <Frac top={<>{rs.sigma_i?.toFixed(2)} {G.times} {inp.Lj}</>} bot={E_MPa.toLocaleString()} />
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok>
              <FormulaRow>
                e<Sub>i</Sub> = <strong>{e_i_val?.toFixed(6)} m</strong>
              </FormulaRow>
            </ResultBlock>

            <div style={SUB_TITLE}>나. 차량하중에 의한 이음새 신축량 (e<Sub>o</Sub>)</div>
            <ResultBlock>
              <FormulaRow>e<Sub>o</Sub> = 0 (분절관 — 차량하중 축응력 = 0)</FormulaRow>
            </ResultBlock>

            <div style={SUB_TITLE}>다. 온도변화에 의한 이음새 신축량 (e<Sub>t</Sub>)</div>
            <FormulaBlock>
              <FormulaRow>
                e<Sub>t</Sub> = {G.alpha}<Sub>T</Sub> {G.times} {G.Delta}T {G.times} L<Sub>j</Sub>
                &nbsp;=&nbsp;
                1.2 {G.times} 10<Sup>−5</Sup> {G.times} {inp.deltaT ?? 20} {G.times} {inp.Lj}
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok>
              <FormulaRow>
                e<Sub>t</Sub> = <strong>{e_t_val.toFixed(6)} m</strong>
              </FormulaRow>
            </ResultBlock>

            <div style={SUB_TITLE}>라. 지진시의 이음새 신축량 (|u<Sub>J</Sub>|)</div>
            <FormulaBlock>
              <FormulaRow>
                지침 해설식(5.3.28~5.3.35): |u<Sub>J</Sub>| = u<Sub>0</Sub> {G.times} ū<Sub>J</Sub>
              </FormulaRow>
              <FormulaRow>
                u<Sub>0</Sub> = {G.alpha}<Sub>1</Sub> {G.times} U<Sub>a</Sub>,&nbsp;
                U<Sub>a</Sub> =&nbsp;
                <Frac top="1" bot="2" />
                &nbsp;{G.times} U<Sub>h</Sub>&nbsp;
                (해설식 5.3.29~5.3.30)
              </FormulaRow>
              <FormulaRow>
                {G.beta}<Sub>1</Sub> =&nbsp;
                <Sqrt>
                  <Frac top={<>K<Sub>1</Sub> {G.times} L<Sub>j</Sub></>} bot={<>E {G.times} A</>} />
                </Sqrt>
                &nbsp;= {rs.beta1?.toFixed(4)},&nbsp;&nbsp;
                {G.gamma}<Sub>1</Sub> =&nbsp;
                <Frac top={<>{G.pi} {G.times} L<Sub>j</Sub></>} bot={<>2 {G.times} L'</>} />
                &nbsp;= {rs.gamma1?.toFixed(4)}&nbsp; (L' = 2L)
              </FormulaRow>
              <FormulaRow>
                ū<Sub>J</Sub> =&nbsp;
                <Frac top={<>sinh({G.beta}<Sub>1</Sub>{G.gamma}<Sub>1</Sub>) − sin({G.beta}<Sub>1</Sub>{G.gamma}<Sub>1</Sub>)</>} bot={<>cosh({G.beta}<Sub>1</Sub>{G.gamma}<Sub>1</Sub>) + cos({G.beta}<Sub>1</Sub>{G.gamma}<Sub>1</Sub>)</>} />
                &nbsp;= {rs.uJ_bar?.toFixed(6)}
              </FormulaRow>
              <FormulaRow>
                여기서,&nbsp; {G.alpha}<Sub>1</Sub> = {rs.alpha1?.toFixed(4)},&nbsp;
                U<Sub>h</Sub> = {rs.Uh?.toFixed(4)} m,&nbsp;
                L<Sub>j</Sub> = {inp.Lj} m,&nbsp; L = {rs.L?.toFixed(2)} m
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok={rs.dispOK}>
              <FormulaRow>
                |u<Sub>J</Sub>| = {rs.u0?.toFixed(6)} {G.times} {rs.uJ_bar?.toFixed(6)} =&nbsp;
                <strong>{(rs.u_J * 1000)?.toFixed(2)} mm</strong>
              </FormulaRow>
            </ResultBlock>

            <div style={SUB_TITLE}>마. 이음부의 신축량에 의한 내진안전성 조사</div>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 200 }} colSpan={2}>항목</th>
                  <th style={TH}>단위: m</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={{ ...TDB, paddingLeft: 14 }} rowSpan={4}>상시하중에<br />의한 신축량</td>
                  <td style={TD}>설계내압 e<Sub>i</Sub></td>
                  <td style={TDR}>{e_i_val?.toFixed(6)}</td>
                </tr>
                <tr>
                  <td style={TD}>차량하중 e<Sub>o</Sub></td>
                  <td style={TDR}>0.000000</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>온도효과 ({G.Delta}T = {inp.deltaT ?? 20}°C) e<Sub>t</Sub></td>
                  <td style={TDR}>{e_t_val?.toFixed(6)}</td>
                </tr>
                <tr>
                  <td style={TD}>부등침하 e<Sub>d</Sub></td>
                  <td style={TDR}>0.000000</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TDB} colSpan={2}>지진 |u<Sub>J</Sub>|</td>
                  <td style={TDR}>{rs.u_J?.toFixed(6)}</td>
                </tr>
                <tr style={{ background: '#eef2f8' }}>
                  <td style={TDB} colSpan={2}>이음부 신축량 합계</td>
                  <td style={{ ...TDR, fontWeight: 700, fontSize: 12 }}>
                    {(e_i_val + e_t_val + rs.u_J)?.toFixed(6)}
                  </td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>
                    허용 신축량 u<Sub>allow</Sub>&nbsp;
                    ({inp.isSeismicJoint ? '내진형 이음 × 80%' : '일반형 이음 × 50%'})
                  </td>
                  <td style={TDR}>{rs.u_allow?.toFixed(4)}</td>
                </tr>
                <tr style={{ background: rs.dispOK ? '#f0faf4' : '#fff0f0' }}>
                  <td style={TDB} colSpan={2}>
                    신축량합계 = {(e_i_val + e_t_val + rs.u_J)?.toFixed(6)} m&nbsp;
                    {rs.dispOK ? G.le : G.ge}&nbsp;
                    u<Sub>allow</Sub> = {rs.u_allow?.toFixed(4)} m 이므로
                  </td>
                  <td style={TDC}><OKBadge ok={rs.dispOK} /></td>
                </tr>
              </tbody>
            </table>

            {/* C.1.4 이음부 굽힘각 */}
            <div style={SEC_TITLE} className="page-break-before">C.1.4 이음부 굽힘각도 ({G.theta}<Sub>J</Sub>)</div>
            <FormulaBlock>
              <FormulaRow>
                {G.theta}<Sub>J</Sub> =&nbsp;
                <Frac top={<>{G.pi} {G.times} U<Sub>h</Sub></>} bot="L" />
                &nbsp;{G.times} sin&nbsp;
                <Frac top={<>{G.pi} {G.times} L<Sub>j</Sub></>} bot="L" />
              </FormulaRow>
              <FormulaRow>
                = &nbsp;
                <Frac top={<>{G.pi} {G.times} {rs.Uh?.toFixed(4)}</>} bot={rs.L?.toFixed(2)} />
                &nbsp;{G.times} sin&nbsp;
                <Frac top={<>{G.pi} {G.times} {inp.Lj}</>} bot={rs.L?.toFixed(2)} />
              </FormulaRow>
              <FormulaRow>
                허용 굽힘각 {G.theta}<Sub>allow</Sub>:&nbsp;
                DN {inp.DN} → {inp.DN < 300 ? '3.5°' : inp.DN <= 600 ? '2.5°' : '1.5°'}
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok={rs.angleOK}>
              <FormulaRow>
                {G.theta}<Sub>J</Sub> = <strong>{(rs.theta_J * 180 / Math.PI)?.toFixed(4)} {G.deg}</strong>
                &nbsp;{rs.angleOK ? G.le : G.ge}&nbsp;
                {G.theta}<Sub>allow</Sub> = {(rs.theta_allow * 180 / Math.PI)?.toFixed(2)} {G.deg}
                &nbsp;&nbsp;<OKBadge ok={rs.angleOK} />
              </FormulaRow>
            </ResultBlock>
          </>
        ) : (
          <>
            {/* 연속관: 축변형률 내진안전성 */}
            <div style={SEC_TITLE} className="page-break-before">C.2.3 축변형률에 의한 내진안전성의 조사</div>
            <div style={{ fontSize: 10.5, lineHeight: 2, marginBottom: 6 }}>
              상시하중에 의한 축변형률과 지진시의 축변형률을 합산하고 이것이 허용변형률 이하인지 조사한다.
            </div>

            <div style={SUB_TITLE}>
              허용변형률 ({rs.strainCriterion === 'buckling'
                ? '국부좌굴 한계변형률, ASCE/KDS 해설'
                : '항복점 변형률 = 국부좌굴 개시변형률, 지침 부록C'})
            </div>
            <FormulaBlock>
              <FormulaRow>
                {rs.strainCriterion === 'buckling' ? (
                  <>
                    {G.epsilon}<Sub>allow</Sub> =&nbsp;
                    <Frac top="46t" bot="D" />
                    &nbsp;=&nbsp;
                    <Frac top={`46 × ${inp.thickness}`} bot={inp.D_out} />
                    &nbsp;=&nbsp;<strong>{rs.epsilon_allow?.toExponential(4)}</strong>&nbsp;
                    ({(rs.epsilon_allow * 100)?.toFixed(4)} %)
                  </>
                ) : (
                  <>
                    {G.epsilon}<Sub>allow</Sub> =&nbsp;
                    <Frac top={<>{G.sigma}<Sub>y</Sub></>} bot="E" />
                    &nbsp;=&nbsp;
                    <Frac top={rs.sigma_y} bot={E_MPa.toLocaleString()} />
                    &nbsp;=&nbsp;<strong>{rs.epsilon_allow?.toExponential(4)}</strong>&nbsp;
                    ({(rs.epsilon_allow * 100)?.toFixed(4)} %)
                  </>
                )}
              </FormulaRow>
            </FormulaBlock>

            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 200 }} colSpan={2}>항목</th>
                  <th style={TH}>단위: %</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={{ ...TDB, paddingLeft: 14 }} rowSpan={4}>상시하중에<br />의한 축변형률</td>
                  <td style={TD}>설계내압 {G.epsilon}<Sub>i</Sub></td>
                  <td style={TDR}>{(Math.abs(rs.epsilon_i) * 100)?.toFixed(4)}</td>
                </tr>
                <tr>
                  <td style={TD}>차량하중 {G.epsilon}<Sub>o</Sub></td>
                  <td style={TDR}>0.0000</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>온도효과 ({G.Delta}T = {inp.deltaT}°C) {G.epsilon}<Sub>t</Sub></td>
                  <td style={TDR}>{(Math.abs(rs.epsilon_t) * 100)?.toFixed(4)}</td>
                </tr>
                <tr>
                  <td style={TD}>부등침하 {G.epsilon}<Sub>d</Sub></td>
                  <td style={TDR}>{(Math.abs(rs.epsilon_d) * 100)?.toFixed(4)}</td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TDB} colSpan={2}>지진 {G.epsilon}<Sub>eq</Sub></td>
                  <td style={TDR}>{(Math.abs(rs.epsilon_eq) * 100)?.toFixed(4)}</td>
                </tr>
                <tr style={{ background: '#eef2f8' }}>
                  <td style={TDB} colSpan={2}>축변형률 합계 {G.epsilon}<Sub>total</Sub></td>
                  <td style={{ ...TDR, fontWeight: 700, fontSize: 12 }}>{(rs.epsilon_total * 100)?.toFixed(4)}</td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>허용변형률 {G.epsilon}<Sub>allow</Sub> ({rs.strainCriterion === 'buckling' ? '46t/D, ASCE/KDS' : 'σ_y/E, 부록C'})</td>
                  <td style={TDR}>{(rs.epsilon_allow * 100)?.toFixed(4)}</td>
                </tr>
                <tr style={{ background: rs.strainOK ? '#f0faf4' : '#fff0f0' }}>
                  <td style={TDB} colSpan={2}>
                    {G.epsilon}<Sub>total</Sub> = {(rs.epsilon_total * 100)?.toFixed(4)} %&nbsp;
                    {rs.strainOK ? G.le : G.ge}&nbsp;
                    {G.epsilon}<Sub>allow</Sub> = {(rs.epsilon_allow * 100)?.toFixed(4)} % 이므로
                  </td>
                  <td style={TDC}><OKBadge ok={rs.strainOK} /></td>
                </tr>
              </tbody>
            </table>

            {/* Von Mises */}
            <div style={SEC_TITLE}>C.2.4 Von Mises 조합응력 검토</div>
            <FormulaBlock>
              <FormulaRow>
                후프응력: {G.sigma}<Sub>{G.theta}</Sub> =&nbsp;
                <Frac top={<>P(D − t)</>} bot="2t" />
                &nbsp;=&nbsp;
                <Frac top={<>{inp.P} {G.times} ({D_m.toFixed(3)} − {t_m.toFixed(4)})</>} bot={<>2 {G.times} {t_m.toFixed(4)}</>} />
                &nbsp;= {rs.sigma_theta?.toFixed(2)} MPa
              </FormulaRow>
              <FormulaRow>
                축응력: {G.sigma}<Sub>x</Sub> = {G.nu}{G.sigma}<Sub>{G.theta}</Sub> + E({G.epsilon}<Sub>t</Sub> + {G.epsilon}<Sub>d</Sub> + {G.epsilon}<Sub>eq</Sub>)
              </FormulaRow>
              <FormulaRow indent={1}>
                = {nu} {G.times} {rs.sigma_theta?.toFixed(2)} + {(E_MPa / 1000).toFixed(0)} {G.times} 10<Sup>3</Sup>&nbsp;
                {G.times} ({rs.epsilon_t?.toExponential(3)} + {rs.epsilon_d?.toExponential(3)} + {rs.epsilon_eq?.toExponential(3)})
                &nbsp;= {rs.sigma_x_total?.toFixed(2)} MPa
              </FormulaRow>
              <FormulaRow>
                Von Mises: {G.sigma}<Sub>vm</Sub> =&nbsp;
                <Sqrt>
                  {G.sigma}<Sub>{G.theta}</Sub><Sup>2</Sup> + {G.sigma}<Sub>x</Sub><Sup>2</Sup> − {G.sigma}<Sub>{G.theta}</Sub>{G.sigma}<Sub>x</Sub>
                </Sqrt>
              </FormulaRow>
              <FormulaRow indent={1}>
                =&nbsp;
                <Sqrt>
                  {rs.sigma_theta?.toFixed(2)}<Sup>2</Sup> + {rs.sigma_x_total?.toFixed(2)}<Sup>2</Sup> − {rs.sigma_theta?.toFixed(2)} {G.times} {rs.sigma_x_total?.toFixed(2)}
                </Sqrt>
              </FormulaRow>
            </FormulaBlock>
            <ResultBlock ok={rs.stressOK}>
              <FormulaRow>
                {G.sigma}<Sub>vm</Sub> = <strong>{rs.sigma_vm?.toFixed(2)} MPa</strong>
                &nbsp;{rs.stressOK ? G.le : G.ge}&nbsp;
                {G.sigma}<Sub>allow</Sub> = {rs.sigma_allow?.toFixed(1)} MPa&nbsp;&nbsp;
                <OKBadge ok={rs.stressOK} />
              </FormulaRow>
            </ResultBlock>

            <table style={{ ...TABLE, marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 200 }} colSpan={2}>항목</th>
                  <th style={TH}>단위: MPa</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TDB} colSpan={2}>후프응력 {G.sigma}<Sub>{G.theta}</Sub></td>
                  <td style={TDR}>{rs.sigma_theta?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>축방향 합성응력 {G.sigma}<Sub>x</Sub></td>
                  <td style={TDR}>{rs.sigma_x_total?.toFixed(2)}</td>
                </tr>
                <tr style={{ background: '#eef2f8' }}>
                  <td style={TDB} colSpan={2}>Von Mises 등가응력 {G.sigma}<Sub>vm</Sub></td>
                  <td style={{ ...TDR, fontWeight: 700, fontSize: 12 }}>{rs.sigma_vm?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={TDB} colSpan={2}>
                    허용응력 {G.sigma}<Sub>allow</Sub>&nbsp;
                    ({G.sigma}<Sub>y</Sub> {G.times} {inp.seismicGrade === 'I' ? '0.9' : '0.95'},&nbsp;
                    {G.sigma}<Sub>y</Sub> = {rs.sigma_y} MPa)
                  </td>
                  <td style={TDR}>{rs.sigma_allow?.toFixed(1)}</td>
                </tr>
                <tr style={{ background: rs.stressOK ? '#f0faf4' : '#fff0f0' }}>
                  <td style={TDB} colSpan={2}>
                    {G.sigma}<Sub>vm</Sub> = {rs.sigma_vm?.toFixed(2)} MPa&nbsp;
                    {rs.stressOK ? G.le : G.ge}&nbsp;
                    {G.sigma}<Sub>allow</Sub> = {rs.sigma_allow?.toFixed(1)} MPa 이므로
                  </td>
                  <td style={TDC}><OKBadge ok={rs.stressOK} /></td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* 종합 판정                                       */}
        {/* ═══════════════════════════════════════════════ */}
        <div style={SEC_TITLE} className="page-break-before">종합 내진안전성 판정</div>
        <table style={TABLE}>
          <thead>
            <tr>
              <th style={TH}>검토 항목</th>
              <th style={{ ...TH, width: 130 }}>계산값</th>
              <th style={{ ...TH, width: 130 }}>허용값</th>
              <th style={{ ...TH, width: 70 }}>판정</th>
            </tr>
          </thead>
          <tbody>
            {isSegmented ? (
              <>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>관체 축응력 {G.sigma}<Sub>total</Sub></td>
                  <td style={TDR}>{rs.sigma_total?.toFixed(2)} MPa</td>
                  <td style={TDR}>{rs.sigma_allow?.toFixed(2)} MPa</td>
                  <td style={TDC}><OKBadge ok={rs.stressOK} /></td>
                </tr>
                <tr>
                  <td style={TD}>이음부 신축량 |u<Sub>J</Sub>|</td>
                  <td style={TDR}>{(rs.u_J * 1000)?.toFixed(2)} mm</td>
                  <td style={TDR}>{(rs.u_allow * 1000)?.toFixed(1)} mm</td>
                  <td style={TDC}><OKBadge ok={rs.dispOK} /></td>
                </tr>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>이음부 굽힘각 {G.theta}<Sub>J</Sub></td>
                  <td style={TDR}>{(rs.theta_J * 180 / Math.PI)?.toFixed(4)} {G.deg}</td>
                  <td style={TDR}>{(rs.theta_allow * 180 / Math.PI)?.toFixed(2)} {G.deg}</td>
                  <td style={TDC}><OKBadge ok={rs.angleOK} /></td>
                </tr>
              </>
            ) : (
              <>
                <tr style={{ background: '#f8f8f8' }}>
                  <td style={TD}>축변형률 합계 {G.epsilon}<Sub>total</Sub></td>
                  <td style={TDR}>{rs.epsilon_total?.toExponential(4)}</td>
                  <td style={TDR}>{rs.epsilon_allow?.toExponential(4)}</td>
                  <td style={TDC}><OKBadge ok={rs.strainOK} /></td>
                </tr>
                <tr>
                  <td style={TD}>Von Mises 응력 {G.sigma}<Sub>vm</Sub></td>
                  <td style={TDR}>{rs.sigma_vm?.toFixed(2)} MPa</td>
                  <td style={TDR}>{rs.sigma_allow?.toFixed(1)} MPa</td>
                  <td style={TDC}><OKBadge ok={rs.stressOK} /></td>
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

        <div style={{ fontSize: 10.5, lineHeight: 2, padding: '6px 0', marginTop: 4 }}>
          {r.ok
            ? '본 관로는 응답변위법에 의한 내진성능 본평가 결과 모든 검토항목에서 허용기준을 만족한다. 내진안전성이 확보된 것으로 판단한다.'
            : '본 관로는 응답변위법에 의한 내진성능 본평가 결과 일부 검토항목에서 허용기준을 초과한다. 내진 보강공법을 검토하여야 한다.'}
        </div>

        {/* 각주 */}
        <div style={{ marginTop: 20, borderTop: '1px solid #ccc', paddingTop: 8, fontSize: 9.5, color: '#666', lineHeight: 1.9 }}>
          ※ 적용기준: 기존시설물(상수도) 내진성능 평가요령 부록 C — 매설관로 내진성능 본평가 (응답변위법)<br />
          ※ KDS 57 17 00 : 2022 상수도 내진설계기준 / KDS 17 10 00 : 2022 내진설계 일반기준
        </div>
      </div>
    </div>
  )
}
