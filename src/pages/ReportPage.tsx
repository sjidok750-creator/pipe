import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { T } from '../components/eng/tokens'
import { Frac, Sub, Sup, FormulaBlock, FormulaRow, ResultBlock, OKBadge, G } from '../components/report/MathElements'
import WIcon from '../components/WIcon'

// ── 인라인 스타일 상수 ──────────────────────────────────────
const TABLE: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 10.5, marginBottom: 4 }
const TH: React.CSSProperties = { padding: '2px 6px', fontSize: 10.5, fontWeight: 700, color: '#2C2118', borderBottom: '1px solid #C8C3BC', textAlign: 'left', background: '#EDEBE6' }
const TD: React.CSSProperties = { padding: '2px 6px', borderBottom: '1px solid #E0DDD7', verticalAlign: 'middle', fontSize: 10.5 }
const SUB: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#2C2118', borderLeft: '3px solid #CC6B3D', paddingLeft: 6, marginTop: 8, marginBottom: 3, breakAfter: 'avoid', pageBreakAfter: 'avoid', breakInside: 'avoid', pageBreakInside: 'avoid' }
const NOTE: React.CSSProperties = { fontSize: 9.5, color: '#777', fontStyle: 'italic', marginTop: 3, marginBottom: 6 }

// ── 계산 과정 행 컴포넌트 ────────────────────────────────────
function CalcRow({ label, expr, result, unit, indent = false }: {
  label: string; expr: string; result: string | number; unit?: string; indent?: boolean
}) {
  const val = typeof result === 'number' ? result.toFixed(4) : result
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3, paddingLeft: indent ? 16 : 0, fontSize: 10.5 }}>
      <span style={{ width: 180, flexShrink: 0, color: '#444', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#555', flex: 1 }}>{expr}</span>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#CC6B3D', whiteSpace: 'nowrap' }}>= {val}{unit ? ' ' + unit : ''}</span>
    </div>
  )
}

// ── 구분선 ───────────────────────────────────────────────────
function HR() {
  return <div style={{ borderTop: '1px solid #E0DDD7', margin: '6px 0' }} />
}

export default function ReportPage() {
  const navigate = useNavigate()
  const { result, inputs } = useStore()

  if (!result) {
    return (
      <div style={{ padding: 24, fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
        계산 결과가 없습니다.
        <button onClick={() => navigate('/structural/input')}
          style={{ marginLeft: 12, padding: '4px 12px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2 }}>
          입력 페이지로
        </button>
      </div>
    )
  }

  const { verdict, steps, pipeType, Do, tAdopt, tRequired, fy: resultFy, steelGrade: resultSteelGrade } = result
  const fy = resultFy ?? 235
  const rs = steps as any
  const today = new Date().toLocaleDateString('ko-KR')
  const F = T.fontSans
  const mono: React.CSSProperties = { fontFamily: T.fontMono }

  // ── step 참조 ──
  const s1 = rs.step1   // 내압
  const s2 = rs.step2   // 토압(강관) / 토압+차량하중(주철관)
  const s3 = rs.step3   // 차량하중(강관) / 링휨(주철관)
  const s4 = pipeType === 'steel' ? rs.step4 : rs.step3  // 링휨
  const s5 = pipeType === 'steel' ? rs.step5 : rs.step4  // 처짐
  const s6 = pipeType === 'steel' ? rs.step6 : null       // 좌굴(강관만)
  // 차량하중 데이터: 강관=step3, 주철관=step2
  const sTraffic = pipeType === 'steel' ? s3 : s2

  const verdictItems = Object.entries(verdict).filter(([k]) => k !== 'overallOK') as [string, any][]

  const rh: React.CSSProperties = {
    background: T.bgSection, padding: '3px 10px', fontWeight: 700, fontSize: 12,
    color: T.textAccent, borderLeft: `3px solid ${T.bgActive}`, margin: '10px 0 5px',
    fontFamily: F,
    breakAfter: 'avoid', pageBreakAfter: 'avoid',
    breakInside: 'avoid', pageBreakInside: 'avoid',
  }

  return (
    <div className="report-wrapper" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <button onClick={() => navigate('/structural/report/print')}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: T.bgActive, color: 'white', border: 'none', borderRadius: 2, fontFamily: F }}>
          인쇄 / PDF 저장
        </button>
        <button onClick={() => navigate('/structural/result')}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.border}`, borderRadius: 2, fontFamily: F }}>
          결과 페이지로
        </button>
      </div>

      <div className="report-body" style={{ background: 'white', padding: '16px 20px', fontFamily: F, fontSize: 11, lineHeight: 1.45 }}>

        {/* ── 표지 헤더 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: `2.5px solid ${T.bgActive}`, paddingBottom: 10, marginBottom: 12 }}>
          <WIcon size={54} id="rpt-struct" radius={10} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8.5, color: T.textDisabled, letterSpacing: 0.3, marginBottom: 3, fontFamily: T.fontMono }}>
              KDS 57 10 00 : 2022 · 상수도 시설 설계기준 — 관로
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.bgActive, lineHeight: 1.2, marginBottom: 4, fontFamily: F }}>
              매설관로 구조안전성 검토서
            </div>
            <div style={{ fontSize: 9.5, color: T.textMuted }}>
              {pipeType === 'steel' ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: T.bgActive, letterSpacing: 1, marginBottom: 5 }}>
              STEP-PIPE
            </div>
            <div style={{ fontSize: 9, color: T.textDisabled, fontFamily: T.fontMono }}>작성일</div>
            <div style={{ fontSize: 9.5, color: T.textMuted, fontFamily: T.fontMono, fontWeight: 600 }}>{today}</div>
          </div>
        </div>

        {/* ── 1. 검토 개요 ── */}
        <div style={rh}>1. 검토 개요</div>
        <table style={TABLE}><tbody>
          {([
            ['적용기준', 'KDS 57 10 00 : 2022 상수도 시설 설계기준'],
            ['검토방법', pipeType === 'steel'
              ? '허용응력법(내압) / 수정Iowa식(처짐) / DIPRA링휨 / AWWA M11 외압좌굴'
              : '허용응력법(내압) / DIPRA링휨 / 수정Iowa식(처짐)'],
            ['관종', pipeType === 'steel' ? `도복장강관 (KS D 3565)  fy = ${fy} MPa` : '덕타일 주철관 (KS D 4311)  fu = 420 MPa'],
            ...(pipeType === 'steel' && resultSteelGrade ? [['강종', `${resultSteelGrade}  /  fy = ${fy} MPa`] as [string,string]] : []),
            ...(result.pipeDimManual
              ? [['관 제원', `Do = ${Do} mm,  t = ${tAdopt} mm  [직접입력]`]]
              : [['공칭관경 / 외경', `DN ${result.DN}  /  Do = ${Do} mm`],
                 ['채택 두께', `t = ${tAdopt} mm  (${pipeType === 'steel' ? result.pnGrade : result.selectedGrade})`]]
            ),
          ] as [string,string][]).map(([k,v],i) => (
            <tr key={i} style={{ background: i%2===0 ? T.bgRowAlt : T.bgRow }}>
              <td style={{ ...TD, width: 160, fontWeight: 700 }}>{k}</td>
              <td style={TD}>{v}</td>
            </tr>
          ))}
        </tbody></table>

        {/* ── 2. 관로 제원 및 설계 하중 ── */}
        <div style={rh}>2. 관로 제원 및 설계 하중</div>
        <table style={TABLE}><tbody>
          {([
            ['설계 운전압력 Pd', `${inputs.Pd} MPa`],
            ['수격압 설계압력 Pd\'', `Pd × ${inputs.surgeRatio} = ${(inputs.Pd * inputs.surgeRatio).toFixed(3)} MPa`],
            ['관정 매설깊이 H', `${inputs.H} m`],
            ['흙 단위중량 γ', `${inputs.gammaSoil} kN/m³`],
            ['차량하중', inputs.hasTraffic ? 'DB-24 적용 (KDS 24 12 20)' : '미적용'],
            ...(pipeType === 'steel' ? [['모르타르 라이닝', inputs.hasLining ? '적용 (허용처짐 3%)' : '미적용 (허용처짐 5%)'] as [string,string]] : []),
            ['토질 등급 / 다짐도', `${inputs.soilClass} / ${inputs.soilClass !== 'loose' ? inputs.compaction+'%' : '연약지반'}`],
            ["탄성지반반력 E'", `${inputs.Eprime} kPa`],
            ['침상 조건', pipeType === 'steel' ? (inputs.steelBeddingType ?? '-') : (inputs.beddingType ?? '-')],
            ['지하수위', inputs.gwLevel],
          ] as [string,string][]).map(([k,v],i) => (
            <tr key={i} style={{ background: i%2===0 ? T.bgRowAlt : T.bgRow }}>
              <td style={{ ...TD, width: 160, fontWeight: 700 }}>{k}</td>
              <td style={TD}>{v}</td>
            </tr>
          ))}
        </tbody></table>

        {/* ══════════════════════════════════════════════════════
            3. 계산 수식 및 과정
        ══════════════════════════════════════════════════════ */}
        <div style={{ ...rh, marginTop: 16 }} className="page-break-before">3. 계산 수식 및 과정</div>

        {/* ── 3.1 하중 산정 ── */}
        <div style={SUB}>3.1 하중 산정</div>

        {/* 토피하중 */}
        <FormulaBlock>
          <FormulaRow>
            <strong>① 토피하중 (Prism Load)</strong>&nbsp;&nbsp;
            W<Sub>e</Sub> = γ<Sub>s</Sub> × H × D<Sub>o</Sub>
            &nbsp;[KDS 57 10 00 §3.3]
          </FormulaRow>
        </FormulaBlock>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 10.5 }}>
          <CalcRow label="흙 단위중량 γs" expr="" result={inputs.gammaSoil} unit="kN/m³"/>
          <CalcRow label="매설깊이 H" expr="" result={inputs.H} unit="m"/>
          <CalcRow label="외경 Do" expr="" result={Do} unit="mm"/>
          <HR/>
          <CalcRow label="토피하중 We"
            expr={`${inputs.gammaSoil} × ${inputs.H} × ${Do}/1000`}
            result={s2?.We ?? 0} unit="kN/m"/>
        </div>

        {/* 차량하중 */}
        {inputs.hasTraffic && (
          <>
            <FormulaBlock>
              <FormulaRow>
                <strong>② 차량하중 (DB-24 Boussinesq)</strong>&nbsp;&nbsp;
                W<Sub>L</Sub> = P<Sub>L</Sub> × I<Sub>F</Sub> × D<Sub>o</Sub>
                &nbsp;[KDS 24 12 20]
              </FormulaRow>
            </FormulaBlock>
            <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 10.5 }}>
              <CalcRow label="매설깊이 H" expr="" result={inputs.H} unit="m"/>
              <CalcRow label="Boussinesq 분산압 PLraw" expr="DB-24 테이블 보간" result={sTraffic?.PLraw ?? 0} unit="kPa"/>
              <CalcRow label="충격계수 IF" expr="H에 따른 테이블값" result={sTraffic?.IF ?? 1} unit=""/>
              <CalcRow label="설계 차량하중 PL" expr={`PLraw × IF = ${(sTraffic?.PLraw ?? 0).toFixed(3)} × ${(sTraffic?.IF ?? 1).toFixed(2)}`} result={sTraffic?.PL ?? 0} unit="kPa"/>
              <HR/>
              <CalcRow label="차량하중 WL"
                expr={`PL × Do/1000 = ${(sTraffic?.PL ?? 0).toFixed(3)} × ${Do}/1000`}
                result={sTraffic?.WL ?? 0} unit="kN/m"/>
            </div>
          </>
        )}

        {/* 합계 */}
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 10.5 }}>
          <CalcRow label="합계 하중 Wtotal"
            expr={`We + WL = ${(s2?.We ?? 0).toFixed(3)} + ${(sTraffic?.WL ?? 0).toFixed(3)}`}
            result={sTraffic?.Wtotal ?? (s2?.We ?? 0)} unit="kN/m"/>
          <CalcRow label="단위압력 Ptotal"
            expr={`Wtotal / (Do/1000)`}
            result={sTraffic?.Ptotal ?? ((s2?.We ?? 0) / (Do/1000))} unit="kPa"/>
        </div>

        {/* ── 3.2 내압 검토 ── */}
        <div style={SUB}>3.2 내압 검토 (후프응력, Barlow 공식)</div>
        <FormulaBlock>
          {pipeType === 'steel' ? (
            <>
              <FormulaRow>
                <strong>강관 Barlow 공식</strong>&nbsp;[KDS 57 10 00 §3.2 / AWWA M11 Eq.3-1]
              </FormulaRow>
              <FormulaRow>
                {G.sigma}<Sub>h</Sub> = <Frac top={<>P<Sub>d</Sub> × D<Sub>o</Sub></>} bot="2t"/> (상시)&nbsp;,&nbsp;
                {G.sigma}<Sub>a,n</Sub> = 0.50 × f<Sub>y</Sub> = 0.50 × {fy} = {(0.50*fy).toFixed(2)} MPa
              </FormulaRow>
              <FormulaRow>
                {G.sigma}<Sub>h,surge</Sub> = <Frac top={<>P<Sub>d</Sub>' × D<Sub>o</Sub></>} bot="2t"/> (수격)&nbsp;,&nbsp;
                {G.sigma}<Sub>a,s</Sub> = 0.75 × f<Sub>y</Sub> = 0.75 × {fy} = {(0.75*fy).toFixed(2)} MPa
              </FormulaRow>
            </>
          ) : (
            <>
              <FormulaRow>
                <strong>주철관 Di기반 Barlow 공식</strong>&nbsp;[KS D 4311 / DIPRA §2.1]
              </FormulaRow>
              <FormulaRow>
                {G.sigma}<Sub>h</Sub> = <Frac top={<>P<Sub>d</Sub> × D<Sub>i</Sub></>} bot="2t"/>&nbsp;,&nbsp;
                D<Sub>i</Sub> = D<Sub>o</Sub> − 2t
              </FormulaRow>
              <FormulaRow>
                {G.sigma}<Sub>a,hoop</Sub> = f<Sub>u</Sub>/3 = 420/3 = 140 MPa
              </FormulaRow>
            </>
          )}
        </FormulaBlock>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 10.5 }}>
          <CalcRow label="설계수압 Pd" expr="" result={inputs.Pd} unit="MPa"/>
          {pipeType === 'steel' && <CalcRow label="수격압 Pd'" expr={`Pd × ${inputs.surgeRatio} = ${inputs.Pd} × ${inputs.surgeRatio}`} result={inputs.Pd * inputs.surgeRatio} unit="MPa"/>}
          <CalcRow label="외경 Do" expr="" result={Do} unit="mm"/>
          <CalcRow label="채택 두께 t" expr="" result={tAdopt} unit="mm"/>
          {pipeType === 'ductile' && <CalcRow label="내경 Di" expr={`Do − 2t = ${Do} − 2×${tAdopt}`} result={s1?.Di ?? Do - 2*tAdopt} unit="mm"/>}
          <HR/>
          {pipeType === 'steel' ? (
            <>
              <CalcRow label="상시 후프응력 σh"
                expr={`Pd × Do / (2t) = ${inputs.Pd} × ${Do} / (2 × ${tAdopt})`}
                result={s1?.sigma_normal ?? 0} unit="MPa"/>
              <CalcRow label="허용응력 σa,n" expr={`0.50 × ${fy}`} result={s1?.sigmaA_normal ?? (0.50*fy)} unit="MPa"/>
              <CalcRow label="판정" expr={`${(s1?.sigma_normal??0).toFixed(3)} ≤ ${(s1?.sigmaA_normal??117.5).toFixed(3)}`} result={s1?.ok_normal ? 'O.K.' : 'N.G.'} unit=""/>
              <HR/>
              <CalcRow label="수격 후프응력 σh,surge"
                expr={`Pd' × Do / (2t) = ${(inputs.Pd*inputs.surgeRatio).toFixed(3)} × ${Do} / (2 × ${tAdopt})`}
                result={s1?.sigma_surge ?? 0} unit="MPa"/>
              <CalcRow label="허용응력 σa,s" expr="0.75 × 235" result={s1?.sigmaA_surge ?? 176.25} unit="MPa"/>
              <CalcRow label="판정" expr={`${(s1?.sigma_surge??0).toFixed(3)} ≤ ${(s1?.sigmaA_surge??176.25).toFixed(3)}`} result={s1?.ok_surge ? 'O.K.' : 'N.G.'} unit=""/>
            </>
          ) : (
            <>
              <CalcRow label="후프응력 σh"
                expr={`Pd × Di / (2t) = ${inputs.Pd} × ${(s1?.Di ?? Do-2*tAdopt).toFixed(1)} / (2 × ${tAdopt})`}
                result={s1?.sigma_hoop ?? 0} unit="MPa"/>
              <CalcRow label="허용응력 σa" expr="fu/3 = 420/3" result={s1?.sigmaA_hoop ?? 140} unit="MPa"/>
              <CalcRow label="판정" expr={`${(s1?.sigma_hoop??0).toFixed(3)} ≤ ${(s1?.sigmaA_hoop??140).toFixed(3)}`} result={s1?.ok ? 'O.K.' : 'N.G.'} unit=""/>
            </>
          )}
        </div>

        {/* ── 3.3 링 휨응력 검토 ── */}
        <div style={SUB}>3.3 링 휨응력 검토</div>
        <FormulaBlock>
          <FormulaRow>
            <strong>DIPRA 링휨 공식</strong>&nbsp;[{pipeType === 'steel' ? 'KDS 57 10 00 §3.4 / AWWA M11 §5.3' : 'DIPRA §2.3 / KDS 57 10 00 §3.4'}]
          </FormulaRow>
          <FormulaRow>
            {G.sigma}<Sub>b</Sub> = K<Sub>b</Sub> × <Frac top={<>W<Sub>total</Sub> × D<Sub>o</Sub></>} bot={<>t{G.sq}</>}/>
            &nbsp;&nbsp;(단위: kN/m × mm / mm² = MPa)
          </FormulaRow>
          <FormulaRow>
            {G.sigma}<Sub>a,b</Sub> = {pipeType === 'steel' ? `0.50 × fy = 0.50 × ${fy} = ${(0.50*fy).toFixed(2)} MPa` : '0.50 × fu = 0.50 × 420 = 210 MPa'}
          </FormulaRow>
        </FormulaBlock>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 10.5 }}>
          <CalcRow label="침상계수 Kb" expr={`${pipeType === 'steel' ? inputs.steelBeddingType : inputs.beddingType} 기준`} result={s4?.Kb_steel ?? s4?.Kb ?? 0} unit=""/>
          <CalcRow label="합계 하중 Wtotal" expr="토피하중 + 차량하중" result={s4?.Wtotal ?? 0} unit="kN/m"/>
          <CalcRow label="외경 Do" expr="" result={Do} unit="mm"/>
          <CalcRow label="채택 두께 t" expr="" result={tAdopt} unit="mm"/>
          <HR/>
          <CalcRow label="링 휨응력 σb"
            expr={`Kb × Wtotal × Do / t² = ${(s4?.Kb_steel ?? s4?.Kb ?? 0).toFixed(3)} × ${(s4?.Wtotal??0).toFixed(3)} × ${Do} / ${tAdopt}²`}
            result={s4?.sigma_b ?? 0} unit="MPa"/>
          <CalcRow label="허용응력 σa,b" expr={pipeType === 'steel' ? `0.50 × ${fy}` : "0.50 × 420"} result={s4?.sigmaA_bend ?? 0} unit="MPa"/>
          <CalcRow label="판정" expr={`${(s4?.sigma_b??0).toFixed(3)} ≤ ${(s4?.sigmaA_bend??0).toFixed(3)}`} result={s4?.ok ? 'O.K.' : 'N.G.'} unit=""/>
        </div>

        {/* ── 3.4 처짐 검토 ── */}
        <div style={SUB}>3.4 처짐 검토 (수정 Iowa식)</div>
        <FormulaBlock>
          <FormulaRow>
            <strong>수정 Iowa 공식</strong>&nbsp;[{pipeType === 'steel' ? 'AWWA M11 Eq.5-4 / KDS 57 10 00 §3.5' : 'AWWA C150 / DIPRA §2.4'}]
          </FormulaRow>
          <FormulaRow>
            <Frac top={<>{G.Delta}y</>} bot="D"/> =&nbsp;
            <Frac
              top={<>{pipeType === 'steel' ? <>{G.times}D<Sub>L</Sub></> : null} × K<Sub>{pipeType === 'steel' ? 'x' : 'd'}</Sub> × P<Sub>total</Sub></>}
              bot={<><Frac top="EI" bot={<>r{G.cb}</>}/> + 0.061 E'</>}
            />
            &nbsp;× 100 (%)
          </FormulaRow>
          <FormulaRow>
            r = (D<Sub>o</Sub> − t) / 2,&nbsp;&nbsp;
            I = t{G.cb} / 12,&nbsp;&nbsp;
            EI = E<Sub>pipe</Sub> × I
          </FormulaRow>
        </FormulaBlock>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 10.5 }}>
          {pipeType === 'steel' && <CalcRow label="처짐 지연계수 DL" expr="(Deflection Lag Factor, 강관)" result={s5?.DL ?? 1.5} unit=""/>}
          <CalcRow label={`처짐계수 K${pipeType === 'steel' ? 'x' : 'd'}`} expr="침상조건 기준" result={s5?.K ?? s5?.Kd ?? 0} unit=""/>
          <CalcRow label="단위압력 Ptotal" expr="Wtotal / (Do/1000)" result={s5?.Ptotal ?? 0} unit="kPa"/>
          <HR/>
          <CalcRow label="관 반경 r" expr={`(Do − t)/2 = (${Do} − ${tAdopt})/2  [m]`} result={s5?.r ?? 0} unit="m"/>
          <CalcRow label="단면2차모멘트 I" expr={`t³/12 = (${tAdopt}/1000)³/12  [m⁴/m]`} result={s5?.I ?? 0} unit="m⁴/m"/>
          <CalcRow label="관체 탄성계수 E" expr={pipeType === 'steel' ? 'Es = 206,000 MPa' : 'Edi = 170,000 MPa'} result={pipeType === 'steel' ? 206000 : 170000} unit="MPa"/>
          <CalcRow label="EI" expr={`E × 1000 × I  [kN·m²/m]`} result={s5?.EI ?? 0} unit="kN·m²/m"/>
          <CalcRow label="EI/r³" expr={`EI / r³`} result={s5?.EI_r3 ?? 0} unit="kN/m²"/>
          <CalcRow label="분모 (EI/r³ + 0.061E')" expr={`${(s5?.EI_r3??0).toFixed(2)} + 0.061 × ${inputs.Eprime}`} result={s5?.denominator ?? 0} unit="kN/m²"/>
          <HR/>
          {pipeType === 'steel' ? (
            <CalcRow label="처짐율 Δy/D"
              expr={`DL × Kx × Ptotal / 분모 × 100 = ${(s5?.DL??1.5)} × ${(s5?.K??0).toFixed(3)} × ${(s5?.Ptotal??0).toFixed(2)} / ${(s5?.denominator??1).toFixed(2)} × 100`}
              result={s5?.deflectionRatio ?? 0} unit="%"/>
          ) : (
            <CalcRow label="처짐율 Δy/D"
              expr={`Kd × Ptotal / 분모 × 100 = ${(s5?.Kd??0).toFixed(3)} × ${(s5?.Ptotal??0).toFixed(2)} / ${(s5?.denominator??1).toFixed(2)} × 100`}
              result={s5?.deflectionRatio ?? 0} unit="%"/>
          )}
          <CalcRow label="허용 처짐율" expr={pipeType === 'steel' ? (inputs.hasLining ? '라이닝 적용' : '라이닝 없음') : 'DIPRA 기준'} result={s5?.maxDeflection ?? 3} unit="%"/>
          <CalcRow label="판정" expr={`${(s5?.deflectionRatio??0).toFixed(3)} ≤ ${s5?.maxDeflection ?? 3}`} result={s5?.ok ? 'O.K.' : 'N.G.'} unit=""/>
        </div>

        {/* ── 3.5 외압 좌굴 (강관만) ── */}
        {pipeType === 'steel' && s6 && (
          <>
            <div style={SUB}>3.5 외압 좌굴 검토 (강관 전용)</div>
            <FormulaBlock>
              <FormulaRow>
                <strong>AWWA M11 Eq.5-5</strong>&nbsp;[KDS 57 10 00 §3.6]
              </FormulaRow>
              <FormulaRow>
                P<Sub>cr</Sub> = <Frac top="1" bot="FS"/> ×&nbsp;
                {G.sqrt}(32 × R<Sub>w</Sub> × B' × E' × <Frac top="EI" bot={<>D<Sub>o</Sub>{G.cb}</>}/>)
                &nbsp;&nbsp;(FS = {s6.FS_allow ?? 2.5})
              </FormulaRow>
              <FormulaRow>
                B' = <Frac top="1" bot={<>1 + 4e<Sup>−0.065H/D</Sup></>}/>&nbsp;(탄성토지지계수)
              </FormulaRow>
            </FormulaBlock>
            <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 10.5 }}>
              <CalcRow label="지하수위 Rw" expr={`gwLevel = ${inputs.gwLevel}`} result={s6.Rw ?? 1} unit=""/>
              <CalcRow label="H/Do" expr={`H / (Do/1000) = ${inputs.H} / ${(Do/1000).toFixed(3)}`} result={s6.HoverDo ?? 0} unit=""/>
              <CalcRow label="탄성토지지계수 B'" expr={`1 / (1 + 4×e^(−0.065 × ${(s6.HoverDo??0).toFixed(2)}))`} result={s6.Bprime ?? 0} unit=""/>
              <CalcRow label="탄성지반반력 E'" expr="" result={inputs.Eprime} unit="kPa"/>
              <CalcRow label="EI/Do³" expr={`EI / (Do/1000)³`} result={s6.EI_Do3 ?? 0} unit="kN/m²"/>
              <HR/>
              <CalcRow label="허용 좌굴압력 Pcr"
                expr={`(1/${s6.FS_allow??2.5}) × √(32 × ${(s6.Rw??1).toFixed(2)} × ${(s6.Bprime??0).toFixed(4)} × ${inputs.Eprime} × ${(s6.EI_Do3??0).toFixed(2)})`}
                result={s6.Pcr ?? 0} unit="kPa"/>
              <CalcRow label="외압 Ptotal" expr="= 합계 하중 단위압력" result={s6.Pe_ext ?? 0} unit="kPa"/>
              <HR/>
              <CalcRow label="좌굴 안전율 FS"
                expr={`Pcr / Pe_ext = ${(s6.Pcr??0).toFixed(2)} / ${(s6.Pe_ext??0).toFixed(2)}`}
                result={s6.bucklingFS_actual ?? 0} unit=""/>
              <CalcRow label="허용 안전율" expr="" result={s6.FS_allow ?? 2.5} unit=""/>
              <CalcRow label="판정" expr={`${(s6.bucklingFS_actual??0).toFixed(3)} ≥ ${s6.FS_allow??2.5}`} result={s6.ok ? 'O.K.' : 'N.G.'} unit=""/>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            4. 구조안전성 검토 결과
        ══════════════════════════════════════════════════════ */}
        <div style={rh} className="page-break-before">4. 구조안전성 검토 결과</div>
        <table style={{ ...TABLE, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.bgSection }}>
              <th style={TH}>검토 항목</th>
              <th style={{ ...TH, textAlign: 'right' }}>계산값</th>
              <th style={{ ...TH, textAlign: 'right' }}>허용값</th>
              <th style={{ ...TH, textAlign: 'center', width: 60 }}>판정</th>
            </tr>
          </thead>
          <tbody>
            {verdictItems.map(([k, item], i) => (
              <tr key={k} style={{ background: i%2===0 ? T.bgRowAlt : T.bgRow }}>
                <td style={TD}>{item.label}</td>
                <td style={{ ...TD, textAlign: 'right', ...mono, fontWeight: 700 }}>
                  {typeof item.value === 'number' ? item.value.toFixed(3) : item.value} {item.unit}
                </td>
                <td style={{ ...TD, textAlign: 'right', ...mono, color: T.textMuted }}>
                  {typeof item.allow === 'number' ? item.allow.toFixed(3) : (item.allow ?? '—')} {item.allow !== undefined && item.allow !== null ? item.unit : ''}
                </td>
                <td style={{ ...TD, textAlign: 'center' }}><OKBadge ok={item.ok}/></td>
              </tr>
            ))}
            <tr style={{ background: verdict.overallOK ? '#f0faf4' : '#fff0f0', borderTop: `2px solid ${verdict.overallOK ? '#a3d9b5' : '#f5b3b3'}` }}>
              <td style={{ ...TD, fontWeight: 700 }} colSpan={3}>종합 판정</td>
              <td style={{ ...TD, textAlign: 'center', fontWeight: 700, color: verdict.overallOK ? '#1a6b3a' : '#c0392b' }}>
                {verdict.overallOK ? 'O.K.' : 'N.G.'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══════════════════════════════════════════════════════
            5. 최소관두께 검토 (참고)
        ══════════════════════════════════════════════════════ */}
        <div style={rh}>5. 최소관두께 검토 (참고)</div>
        <div style={NOTE}>
          {pipeType === 'steel'
            ? '강관: 내압(Barlow), 취급(Do/288) 중 최댓값 + 부식여유 1.5mm. 기준: KDS 57 10 00 §3.2 / AWWA M11'
            : '주철관: KS D 4311 Di기반 Barlow 역산(내압) + 링휨 역산(외압) 중 최댓값. KS D 4311에 취급두께·부식여유 별도 규정 없음.'}
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 10.5 }}>
          {pipeType === 'steel' ? (
            <>
              <CalcRow label="내압 최소두께 (상시)"
                expr={`Pd × Do / (2 × σa,n) = ${inputs.Pd} × ${Do} / (2 × ${(s1?.sigmaA_normal??117.5).toFixed(1)})`}
                result={s1?.tp_normal ?? 0} unit="mm"/>
              <CalcRow label="내압 최소두께 (수격)"
                expr={`Pd' × Do / (2 × σa,s) = ${(inputs.Pd*inputs.surgeRatio).toFixed(3)} × ${Do} / (2 × ${(s1?.sigmaA_surge??176.25).toFixed(1)})`}
                result={s1?.tp_surge ?? 0} unit="mm"/>
              <CalcRow label="취급 최소두께"
                expr={`Do / 288 = ${Do} / 288`}
                result={s1?.tHandling ?? 0} unit="mm"/>
              <HR/>
              <CalcRow label="소요 최소두께"
                expr={`max(위 3가지) + 부식여유 1.5mm`}
                result={tRequired ?? 0} unit="mm"/>
            </>
          ) : (
            <>
              <CalcRow label="내압 최소두께 tp_hoop"
                expr={`Pd × Do / (2 × (σa + Pd)) = ${inputs.Pd} × ${Do} / (2 × (${(s1?.sigmaA_hoop??140).toFixed(1)} + ${inputs.Pd}))`}
                result={s1?.tp_hoop ?? 0} unit="mm"/>
              <CalcRow label="외압(링휨) 최소두께 tp_bend"
                expr={`√(Kb × Wtotal × Do / σa,b) = √(${(s4?.Kb??0).toFixed(3)} × ${(s4?.Wtotal??0).toFixed(3)} × ${Do} / ${(s4?.sigmaA_bend??210).toFixed(1)})`}
                result={s1?.tp_bend ?? 0} unit="mm"/>
              <HR/>
              <CalcRow label="소요 최소두께"
                expr={`max(tp_hoop, tp_bend)`}
                result={tRequired ?? 0} unit="mm"/>
            </>
          )}
          <HR/>
          <CalcRow label="채택 두께 t" expr=""
            result={`${tAdopt} ${(tAdopt >= (tRequired ?? 0)) ? '≥' : '<'} ${(tRequired??0).toFixed(2)}mm  →  ${(tAdopt >= (tRequired ?? 0)) ? 'O.K.' : 'N.G.'}`}
            unit=""/>
        </div>

        {/* ── 6. 검토 의견 ── */}
        <div style={rh}>6. 검토 의견</div>
        <div style={{ fontSize: 11, lineHeight: 2, fontFamily: F, padding: '6px 0' }}>
          {verdict.overallOK
            ? `본 관로는 KDS 57 10 00 : 2022 기준에 의한 구조안전성 검토 결과 모든 검토항목에서 허용기준을 만족한다. ${result.pipeDimManual ? `D₀=${Do}mm, t=${tAdopt}mm [직접입력]` : `DN ${result.DN} (D₀=${Do}mm, t=${tAdopt}mm)`} ${pipeType === 'steel' ? '강관' : '덕타일 주철관'}은 설계 하중 조건에 대하여 구조적으로 안전한 것으로 판단한다.`
            : `본 관로는 KDS 57 10 00 : 2022 기준에 의한 구조안전성 검토 결과 일부 검토항목에서 허용기준을 초과한다. 관경·관두께·침상조건 등을 재검토하거나 보강 방안을 강구하여야 한다.`}
        </div>

        {/* 각주 */}
        <div style={{ marginTop: 20, borderTop: `1px solid ${T.borderLight}`, paddingTop: 8, fontSize: 9.5, color: T.textMuted, fontFamily: F, lineHeight: 1.9 }}>
          ※ 토피하중: Prism Load  We = γs × H × Do  [KDS 57 10 00 §3.3]<br/>
          ※ 차량하중: DB-24 + AASHTO Boussinesq 분산 + 충격계수 IF  [KDS 24 12 20]<br/>
          ※ 내압: 허용응력법 (상시 σa = 0.50fy, 수격 σa = 0.75fy)  [KDS 57 10 00 §3.2]<br/>
          ※ 링휨·처짐: DIPRA링휨 + 수정Iowa처짐  [KDS 57 10 00 §3.4~3.5 / AWWA M11]<br/>
          ※ 외압좌굴: Modified AWWA M11 (강관 전용, FS = 2.5)  [KDS 57 10 00 §3.6]
        </div>
      </div>
    </div>
  )
}
