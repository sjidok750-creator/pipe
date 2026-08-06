import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { T } from '../components/eng/tokens'
import { Frac, Sub, Sup, FormulaBlock, FormulaRow, ResultBlock, OKBadge, G } from '../components/report/MathElements'
import ReportTitleBlock from '../components/report/ReportTitleBlock'
import { useProjectStore } from '../store/useProjectStore.js'
import { exportStructuralXlsx } from '../lib/xlsx/structuralXlsx.js'
import { exportStructuralHwpx } from '../lib/hwpx/structuralHwpx.js'
import { fmtNum } from '../lib/format'

// ── 인라인 스타일 상수 (설계보고서 부록 양식: 전체 괘선·모노크롬) ──
const TABLE: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 6 }
const TH: React.CSSProperties = { padding: '2px 6px', fontSize: 11, fontWeight: 700, color: '#111', border: '1px solid #888', textAlign: 'left', background: '#F2F0EC' }
const TD: React.CSSProperties = { padding: '2px 6px', border: '1px solid #AAA', verticalAlign: 'middle', fontSize: 11 }
const SUB: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#111', borderLeft: '3px solid #555', paddingLeft: 6, marginTop: 8, marginBottom: 3, breakAfter: 'avoid', pageBreakAfter: 'avoid', breakInside: 'avoid', pageBreakInside: 'avoid' }
const NOTE: React.CSSProperties = { fontSize: 10, color: '#777', fontStyle: 'italic', marginTop: 3, marginBottom: 6 }

// ── 계산 과정 행 컴포넌트 ────────────────────────────────────
function CalcRow({ label, expr, result, unit, indent = false }: {
  label: string; expr: string; result: string | number; unit?: string; indent?: boolean
}) {
  const val = fmtNum(result)
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3, paddingLeft: indent ? 16 : 0, fontSize: 11 }}>
      <span style={{ width: 180, flexShrink: 0, color: '#444', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#555', flex: 1 }}>{expr}</span>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>= {val}{unit ? ' ' + unit : ''}</span>
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
  const projectName = useProjectStore((s: any) => s.projectName)
  const facilityName = useProjectStore((s: any) => s.activeFacilityName)

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

  const { verdict, steps, pipeType, Do, tAdopt } = result as any
  const fy = resultFy ?? 235
  const rs = steps as any
  const F = T.fontSans
  const mono: React.CSSProperties = { fontFamily: T.fontMono }

  // ── step 참조 ──
  const s1 = rs.step1   // 내압
  const s2 = rs.step2   // 토압(강관) / 토압+차량하중(주철관)
  const s3 = rs.step3   // 차량하중(강관) / 링휨(주철관)
  const s3b = rs.step3                                    // 휨응력
  const s4 = rs.step4                                     // 강관: 변형률 / 주철관: 조합응력
  const s5 = pipeType === 'steel' ? rs.step5 : null       // 좌굴(강관만)
  // 차량하중 데이터: 강관=step3, 주철관=step2
  const sTraffic = pipeType === 'steel' ? s3 : s2

  const verdictItems = Object.entries(verdict).filter(([k]) => k !== 'overallOK') as [string, any][]

  const rh: React.CSSProperties = {
    background: '#F2F0EC', padding: '3px 10px', fontWeight: 700, fontSize: 12,
    color: '#111', borderLeft: '3px solid #333', margin: '12px 0 5px',
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
        <button onClick={() => { exportStructuralXlsx({ inputs, result, projectName, facilityName }).catch((e: any) => alert('엑셀 생성 실패: ' + (e?.message ?? e))) }}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: '#1a6b3a', color: 'white', border: 'none', borderRadius: 2, fontFamily: F }}>
          엑셀(.xlsx) 다운로드
        </button>
        <button onClick={() => { exportStructuralHwpx({ inputs, result, projectName, facilityName }).catch((e: any) => alert('한글 생성 실패: ' + (e?.message ?? e))) }}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: '#1B3A66', color: 'white', border: 'none', borderRadius: 2, fontFamily: F }}>
          한글(.hwpx) 다운로드
        </button>
        <button onClick={() => navigate('/structural/result')}
          style={{ padding: '5px 16px', fontSize: 12, cursor: 'pointer', background: 'white', color: T.textAccent, border: `1px solid ${T.border}`, borderRadius: 2, fontFamily: F }}>
          결과 페이지로
        </button>
      </div>

      <div className="report-body" style={{ background: 'white', padding: '16px 20px', fontFamily: F, fontSize: 11, lineHeight: 1.45 }}>

        {/* ── 표제부 ── */}
        <ReportTitleBlock
          standard="KDS 57 10 00 : 2022 상수도 시설 설계기준 — 관로"
          title="매설관로 구조안전성 검토서"
          subtitle={pipeType === 'steel' ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'}
        />

        {/* ── 1. 검토 개요 ── */}
        <div style={rh}>1. 검토 개요</div>
        <table style={TABLE}><tbody>
          {([
            ['적용기준', 'KDS 57 10 00 : 2022 상수도 시설 설계기준'],
            ['검토방법', pipeType === 'steel'
              ? '허용응력설계법 — 내압 / 외압 휨응력 / 변형률 / 좌굴하중'
              : '허용응력설계법 — 복합 인장응력 (2.5σts + 2.0σtd + 1.4σb < S)'],
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
            ['압력 구간', (result as any).pressureZone === 'pumped'
              ? `가압구간 — 수격압 P′ = ${(s1?.Psurge ?? 0).toFixed(3)} MPa`
              : '자연유하 구간 — 정수압 적용'],
            ['관정 매설깊이 H', `${inputs.H} m`],
            ['흙의 단위중량 γt', `${s2?.gammaSoil_kgfcm3 ?? 0.0018} kg/cm³`],
            ['굴착부 폭 B', `2D + 100 = ${(s2?.B_cm ?? 0).toFixed(1)} cm`],
            ['차량하중', inputs.hasTraffic ? '적용 — DB-24, Kögler 분산각 45°' : '미적용'],
            ...((result as any).hasMeasured ? [['실측 최소 관두께', `${(result as any).tMeasured} mm (관 상세검사)`] as [string,string]] : []),
            ['적용 관두께', `${tAdopt} mm — ${(result as any).thicknessGoverned === 'measured' ? '실측 최소값' : '기준 두께'} 적용`],
            ['토질 등급 / 다짐도', `${inputs.soilClass} / ${inputs.soilClass !== 'loose' ? inputs.compaction+'%' : '연약지반'}`],
            ...(pipeType === 'steel' ? [["흙 반력계수 E′", `${(s3b?.Ep ?? 28)} kg/cm²`] as [string,string]] : []),
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
        <div style={{ ...rh, marginTop: 16 }}>3. 계산 수식 및 과정</div>

        {/* ── 3.1 작용 하중 (외압) ── */}
        <div style={SUB}>3.1 작용 하중 (외압) — 세부지침 11-134</div>

        <FormulaBlock>
          <FormulaRow>
            <strong>① 상부 토압</strong>&nbsp;&nbsp;
            W<Sub>v</Sub> = γ<Sub>t</Sub> · H&nbsp;(H ≤ 2.0m)&nbsp;&nbsp;|&nbsp;&nbsp;
            W<Sub>v</Sub> = C<Sub>d</Sub> · γ<Sub>t</Sub> · B&nbsp;(H &gt; 2.0m)
          </FormulaRow>
          <FormulaRow>
            C<Sub>d</Sub> = [1 − e<Sup>(−2kμ′H/B)</Sup>] / (2kμ′),&nbsp;&nbsp;
            k = (1−sinφ)/(1+sinφ),&nbsp; μ′ = tanφ′,&nbsp; φ′ = φ = 30°
          </FormulaRow>
        </FormulaBlock>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
          <CalcRow label="흙의 단위중량 γt" expr="" result={s2?.gammaSoil_kgfcm3 ?? 0} unit="kg/cm³"/>
          <CalcRow label="매설깊이 H" expr={`${inputs.H} m`} result={(inputs.H ?? 0) * 100} unit="cm"/>
          <CalcRow label="굴착부 폭 B" expr={`2D + 100 = 2×${(Do / 10).toFixed(1)} + 100`} result={s2?.B_cm ?? 0} unit="cm"/>
          <CalcRow label="토압계수 kμ′" expr="φ′ = φ = 30°" result={s2?.kmu ?? 0} unit=""/>
          {s2?.earthMethod === 'marston' && (
            <CalcRow label="Marston 토압계수 Cd" expr="[1 − e^(−2kμ′H/B)] / (2kμ′)" result={s2?.Cd ?? 0} unit=""/>
          )}
          <HR/>
          <CalcRow label="상부 토압 Wv"
            expr={s2?.earthMethod === 'marston' ? 'Cd × γt × B  (H > 2.0m)' : 'γt × H  (H ≤ 2.0m)'}
            result={s2?.Wv ?? s2?.Wf ?? 0} unit="kg/cm²"/>
        </div>

        {inputs.hasTraffic && (
          <>
            <FormulaBlock>
              <FormulaRow>
                <strong>② 노면하중</strong>&nbsp;&nbsp;
                W<Sub>t</Sub> = 2nP(1+i) / {'{'}[nL + (n−1)C + b + 2H·tanθ]·(a + 2H·tanθ){'}'}
              </FormulaRow>
            </FormulaBlock>
            <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
              <CalcRow label="후륜하중 P" expr="DB-24" result={9600} unit="kg"/>
              <CalcRow label="후륜 중심간격 L / 인접차량 C" expr="" result="175 / 100" unit="cm"/>
              <CalcRow label="차륜 접지폭 b / 차륜폭 a" expr="" result="50 / 20" unit="cm"/>
              <CalcRow label="충격계수 i" expr="H&lt;1.5→0.5 / 1.5~6.5→0.65−0.10H / &gt;6.5→0" result={s2?.impactFactor ?? 0} unit=""/>
              <HR/>
              <CalcRow label="노면하중 Wt" expr="위 식" result={s2?.Wt ?? 0} unit="kg/cm²"/>
            </div>
          </>
        )}
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
          <CalcRow label="합계 하중 W" expr="Wv + Wt"
            result={s2?.Wtotal ?? ((s2?.Wf ?? 0) + (s2?.Wt ?? 0))} unit="kg/cm²"/>
        </div>

        {/* ── 3.2 내압 ── */}
        <div style={SUB}>3.2 내압에 의한 관의 응력 — 세부지침 {pipeType === 'steel' ? '11-134' : '11-137'}</div>
        <div style={NOTE}>
          ※ 내압 작용의 경우 외부 하중(노면하중, 토압 등)이 없는 조건으로 한다. [세부지침 11-134]
        </div>
        <FormulaBlock>
          <FormulaRow>
            {pipeType === 'steel'
              ? <>σ<Sub>t</Sub> = P · D / (2t)</>
              : <>σ<Sub>ts</Sub> = P · D / (2t),&nbsp;&nbsp;σ<Sub>td</Sub> = P′ · D / (2t)</>}
          </FormulaRow>
        </FormulaBlock>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
          <CalcRow label="정수압 P" expr="" result={inputs.Pd} unit="MPa"/>
          {pipeType === 'ductile' && <CalcRow label="내경 D" expr={`Do − 2t = ${Do} − 2×${tAdopt}`} result={(result as any).Di ?? 0} unit="mm"/>}
          {pipeType === 'steel' ? (
            <>
              <CalcRow label="내압응력 σt" expr={`P × D / (2t) = ${inputs.Pd} × ${Do} / (2 × ${tAdopt})`} result={s1?.sigma_t_static ?? 0} unit="MPa"/>
              <CalcRow label="허용응력 (상시)" expr="세부지침 11-134 [해설 표 11.5.1]" result={s1?.sigmaA_static ?? 140} unit="MPa"/>
              <CalcRow label="판정" expr={`${(s1?.sigma_t_static ?? 0).toFixed(3)} ≤ ${(s1?.sigmaA_static ?? 140).toFixed(1)}`} result={s1?.ok_static ? 'O.K.' : 'N.G.'} unit=""/>
              {s1?.isPumped && (
                <>
                  <HR/>
                  <CalcRow label="수격압 P′" expr="정수압 이상 상승압력" result={s1?.Psurge ?? 0} unit="MPa"/>
                  <CalcRow label="내압응력 σt′ (일시)" expr="P′ × D / (2t)" result={s1?.sigma_t_surge ?? 0} unit="MPa"/>
                  <CalcRow label="허용응력 (일시)" expr="상시 허용응력의 150%" result={s1?.sigmaA_surge ?? 210} unit="MPa"/>
                  <CalcRow label="판정" expr={`${(s1?.sigma_t_surge ?? 0).toFixed(3)} ≤ ${(s1?.sigmaA_surge ?? 210).toFixed(1)}`} result={s1?.ok_surge ? 'O.K.' : 'N.G.'} unit=""/>
                </>
              )}
            </>
          ) : (
            <>
              <CalcRow label="정수압 인장응력 σts" expr="P × D / (2t)" result={s1?.sigma_ts ?? 0} unit="MPa"/>
              <CalcRow label="수격압 인장응력 σtd"
                expr={(result as any).pressureZone === 'pumped' ? "(P′ − P) × D / (2t)" : '자연유하 구간 — 미적용'}
                result={s1?.sigma_td ?? 0} unit="MPa"/>
            </>
          )}
        </div>

        {/* ── 3.3 외압 휨응력 ── */}
        <div style={SUB}>3.3 외압에 의한 {pipeType === 'steel' ? '원주방향 ' : ''}휨응력 — 세부지침 {pipeType === 'steel' ? '11-135' : '11-137'}</div>
        {pipeType === 'steel' && (
          <div style={NOTE}>
            ※ 외압 작용의 경우 관 내부의 수압이 없는 조건으로 한다. [세부지침 11-134]
          </div>
        )}
        <FormulaBlock>
          <FormulaRow>
            {pipeType === 'steel' ? (
              <>σ<Sub>b</Sub> = (2 / f·z) · (W<Sub>v</Sub>+W<Sub>t</Sub>) ·
                [K<Sub>b</Sub>R²EI + (0.061K<Sub>b</Sub> − 0.083K<Sub>x</Sub>)E′R⁵] / [EI + 0.061E′R³]</>
            ) : (
              <>σ<Sub>b</Sub> = 6(K<Sub>f</Sub>·W<Sub>f</Sub> + K<Sub>t</Sub>·W<Sub>t</Sub>)R² / t²</>
            )}
          </FormulaRow>
          {pipeType === 'steel' && (
            <FormulaRow>
              f = 1.5,&nbsp; z = t²/6,&nbsp; I = t³/12,&nbsp; R = D/2 + t
            </FormulaRow>
          )}
        </FormulaBlock>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
          <CalcRow label="기초지지각" expr={s3b?.beddingLabel ?? ''} result="" unit=""/>
          {pipeType === 'steel' ? (
            <>
              <CalcRow label="휨모멘트계수 Kb / 변형계수 Kx" expr="" result={`${s3b?.Kb ?? 0} / ${s3b?.Kx ?? 0}`} unit=""/>
              <CalcRow label="관 반경 R" expr={`D/2 + t = ${(Do / 20).toFixed(2)} + ${(tAdopt / 10).toFixed(2)}`} result={s3b?.R ?? 0} unit="cm"/>
              <CalcRow label="단면2차모멘트 I / 단면계수 z" expr="t³/12 / t²/6" result={`${(s3b?.I ?? 0).toFixed(4)} / ${(s3b?.Z ?? 0).toFixed(4)}`} unit="cm³ / cm²"/>
              <CalcRow label="탄성계수 E / 흙 반력계수 E′" expr="세부지침 11-135" result={`2.1×10⁶ / ${s3b?.Ep ?? 28}`} unit="kg/cm²"/>
              <HR/>
              <CalcRow label="휨응력 σb" expr="위 식" result={s3b?.sigma_b_kgf ?? 0} unit="kg/cm²"/>
              <CalcRow label="휨응력 σb" expr="× 0.0980665" result={s3b?.sigma_b ?? 0} unit="MPa"/>
              <CalcRow label="허용응력" expr="세부지침 11-134 [해설 표 11.5.1]" result={s3b?.sigmaA_bend ?? 140} unit="MPa"/>
              <CalcRow label="판정" expr={`${(s3b?.sigma_b ?? 0).toFixed(3)} ≤ ${(s3b?.sigmaA_bend ?? 140).toFixed(1)}`} result={s3b?.ok ? 'O.K.' : 'N.G.'} unit=""/>
            </>
          ) : (
            <>
              <CalcRow label="계수 Kf / Kt" expr="관저 기준" result={`${s3b?.Kf ?? 0} / ${s3b?.Kt ?? 0}`} unit=""/>
              <CalcRow label="관 반경 R" expr="D/2" result={s3b?.R_cm ?? 0} unit="cm"/>
              <HR/>
              <CalcRow label="휨응력 σb" expr="6(Kf·Wf + Kt·Wt)R² / t²" result={s3b?.sigma_b_kgf ?? 0} unit="kg/cm²"/>
              <CalcRow label="휨응력 σb" expr="× 0.0980665" result={s3b?.sigma_b ?? 0} unit="MPa"/>
            </>
          )}
        </div>

        {/* ── 3.4 변형률(강관) / 조합응력(주철관) ── */}
        {pipeType === 'steel' ? (
          <>
            <div style={SUB}>3.4 외압에 의한 원주방향 변형률 — 세부지침 11-136</div>
            <FormulaBlock>
              <FormulaRow>
                ε = 2K<Sub>x</Sub>(W<Sub>v</Sub>+W<Sub>t</Sub>)R⁴ / [EI + 0.061E′R³] × (1/D) × 100&nbsp;(%)
              </FormulaRow>
            </FormulaBlock>
            <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
              <CalcRow label="변형량 Δx" expr="2Kx·W·R⁴ / (EI + 0.061E′R³)" result={s4?.deltaX ?? 0} unit="cm"/>
              <CalcRow label="변형률 ε" expr="Δx / D × 100" result={s4?.deflectionRatio ?? 0} unit="%"/>
              <CalcRow label="허용 변형률" expr="관경의 5% 미만 (라이닝 무관)" result={s4?.maxDeflection ?? 5} unit="%"/>
              <CalcRow label="판정" expr={`${(s4?.deflectionRatio ?? 0).toFixed(3)} < ${(s4?.maxDeflection ?? 5).toFixed(1)}`} result={s4?.ok ? 'O.K.' : 'N.G.'} unit=""/>
            </div>

            <div style={SUB}>3.5 외압에 의한 좌굴하중 — 세부지침 11-136</div>
            <FormulaBlock>
              <FormulaRow>
                q<Sub>a</Sub> = (1/FS) · [32 R<Sub>w</Sub> B′ E′ · EI/D³]<Sup>1/2</Sup>
              </FormulaRow>
              <FormulaRow>
                B′ = 0.15 + 0.041(H/D),&nbsp;&nbsp;FS = 2.5 (H/D ≥ 2) / 3.0 (H/D &lt; 2)
              </FormulaRow>
            </FormulaBlock>
            <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
              <CalcRow label="H/D" expr={`${((inputs.H ?? 0) * 100).toFixed(1)} / ${(Do / 10).toFixed(1)}`} result={s5?.HoverD ?? 0} unit=""/>
              <CalcRow label="설계계수 FS" expr={(s5?.HoverD ?? 0) >= 2 ? 'H/D ≥ 2' : 'H/D < 2'} result={s5?.FS ?? 2.5} unit=""/>
              <CalcRow label="부력계수 Rw"
                expr={s5?.rwIsGuideline ? '세부지침 제시값' : `지하수위 ${inputs.gwLevel} — 안전측 보정`}
                result={s5?.Rw ?? 1} unit=""/>
              <CalcRow label="기초계수 B′" expr={`0.15 + 0.041 × ${(s5?.HoverD ?? 0).toFixed(3)}`} result={s5?.Bprime ?? 0} unit=""/>
              <HR/>
              <CalcRow label="허용 좌굴하중 qa" expr="(1/FS)·√(32·Rw·B′·E′·EI/D³)" result={s5?.qa ?? 0} unit="kg/cm²"/>
              <CalcRow label="작용 하중 W" expr="Wv + Wt" result={s5?.Wtotal ?? 0} unit="kg/cm²"/>
              <CalcRow label="판정" expr={`${(s5?.Wtotal ?? 0).toFixed(4)} ≤ ${(s5?.qa ?? 0).toFixed(4)}`} result={s5?.ok ? 'O.K.' : 'N.G.'} unit=""/>
            </div>
          </>
        ) : (
          <>
            <div style={SUB}>3.4 조합응력 검토 — 세부지침 11-137</div>
            <div style={NOTE}>
              ※ 내압 및 외압에 의한 발생 복합 인장응력이 관재의 기준 인장강도를 만족하여야 한다.
            </div>
            <FormulaBlock>
              <FormulaRow>
                2.5 σ<Sub>ts</Sub> + 2.0 σ<Sub>td</Sub> + 1.4 σ<Sub>b</Sub> &lt; S
              </FormulaRow>
            </FormulaBlock>
            <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
              <CalcRow label="2.5 × σts" expr={`2.5 × ${(s4?.sigma_ts ?? 0).toFixed(3)}`} result={(s4?.sigma_ts ?? 0) * 2.5} unit="MPa"/>
              <CalcRow label="2.0 × σtd" expr={`2.0 × ${(s4?.sigma_td ?? 0).toFixed(3)}`} result={(s4?.sigma_td ?? 0) * 2.0} unit="MPa"/>
              <CalcRow label="1.4 × σb" expr={`1.4 × ${(s4?.sigma_b ?? 0).toFixed(3)}`} result={(s4?.sigma_b ?? 0) * 1.4} unit="MPa"/>
              <HR/>
              <CalcRow label="조합 인장응력" expr="합계" result={s4?.demand ?? 0} unit="MPa"/>
              <CalcRow label="기준 인장강도 S" expr="GCD400 (KS D 4311)" result={s4?.S ?? 420} unit="MPa"/>
              <CalcRow label="판정" expr={`${(s4?.demand ?? 0).toFixed(3)} < ${s4?.S ?? 420}  (이용률 ${((s4?.utilization ?? 0) * 100).toFixed(1)}%)`} result={s4?.ok ? 'O.K.' : 'N.G.'} unit=""/>
            </div>
          </>
        )}

        <div style={rh}>4. 구조안전성 검토 결과</div>
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
        <div style={rh}>5. 관두께 적용 및 안전성평가</div>
        <div style={NOTE}>
          관두께는 관 상세검사에서 측정된 구간별 최소 관두께와 관경별 기준 관두께 가운데
          작은 값을 적용한다. [세부지침 11-134]
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
          <CalcRow label="기준 관두께 t_std" expr={pipeType === 'steel' ? 'STWW 400 기준' : 'K등급 기준'} result={(result as any).tStandard ?? 0} unit="mm"/>
          <CalcRow label="실측 최소 관두께 t_msr"
            expr={(result as any).hasMeasured ? '관 상세검사' : '미입력 — 기준 두께 적용'}
            result={(result as any).tMeasured ?? '—'} unit={(result as any).hasMeasured ? 'mm' : ''}/>
          <HR/>
          <CalcRow label="적용 관두께 t" expr="min(t_std, t_msr)" result={tAdopt} unit="mm"/>
        </div>

        <div style={NOTE}>
          ※ 허용응력설계법 : SF = 허용응력 / 발생응력  [세부지침 11-133 표 11.74]
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #dde8f5', borderRadius: 2, padding: '8px 12px', marginBottom: 6, fontSize: 11 }}>
          <CalcRow label="안전율 SF" expr="검토항목 중 최솟값" result={(result as any).SF ?? 0} unit=""/>
          <CalcRow label="주부재 손상(단면손실)" expr="등급 a/b 구분" result={(result as any).hasSectionLoss ? '있음' : '없음'} unit=""/>
          <HR/>
          <CalcRow label="안전성평가 기준" expr={(result as any).safetyGrade?.desc ?? ''} result={(result as any).safetyGrade?.grade ?? '—'} unit=""/>
          <CalcRow label="평가 점수" expr="" result={(result as any).safetyGrade?.score ?? '—'} unit=""/>
        </div>

        {/* 각주 */}
        <div style={{ marginTop: 20, borderTop: `1px solid ${T.borderLight}`, paddingTop: 8, fontSize: 10, color: T.textMuted, fontFamily: F, lineHeight: 1.9 }}>
          ※ 적용 기준: {(result as any).appliedCodeLabel}<br/>
          ※ 허용기준 근거: {(result as any).allowSource}<br/>
          ※ 관로의 안전성검토 식은「상수도시설기준, 환경부」에 제시된 식의 사용을 원칙으로 한다. [세부지침 11-133]<br/>
          ※ 구조안전성 계산은 구조적으로 가장 불리한 상황을 반영하기 위해, 외압 작용의 경우 관 내부의
          수압이 없는 조건으로 하고 내압 작용의 경우 외부 하중이 없는 조건으로 한다. [세부지침 11-134]<br/>
          ※ 전 과정을 지침 원단위계(cm, kg, kg/cm²)로 계산하고 응력만 MPa로 환산하였다.
        </div>
      </div>
    </div>
  )
}
