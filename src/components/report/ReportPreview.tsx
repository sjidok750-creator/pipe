import React from 'react'
import CrossSectionSVG from '../diagrams/CrossSectionSVG'
import DeflectionSVG from '../diagrams/DeflectionSVG'
import BeddingConditionSVG from '../diagrams/BeddingConditionSVG'

interface Props {
  result: any
  inputs: any
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#003366', color: 'white',
      padding: '6px 12px', borderRadius: 4,
      fontWeight: 700, fontSize: 13, marginTop: 20, marginBottom: 10
    }}>
      {children}
    </div>
  )
}

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#e8f0fb', color: '#003366',
      padding: '4px 10px', borderLeft: '4px solid #003366',
      fontWeight: 600, fontSize: 11, marginTop: 14, marginBottom: 8
    }}>
      {children}
    </div>
  )
}

function InputBox({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #eee' }}>
      <span style={{ fontSize: 10, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 600 }}>{value}{unit ? ' ' + unit : ''}</span>
    </div>
  )
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fffbf0', border: '1.5px solid #e8c840',
      borderRadius: 4, padding: '8px 12px', margin: '6px 0', fontSize: 10
    }}>
      {children}
    </div>
  )
}

function CalcBox({ lines }: { lines: string[] }) {
  return (
    <div style={{
      background: '#fafafa', border: '1px solid #ddd',
      borderRadius: 4, padding: '8px 12px', margin: '4px 0'
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: 'monospace', fontSize: 9.5, marginBottom: 2, color: '#222' }}>
          {l}
        </div>
      ))}
    </div>
  )
}

function ResultBox({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      background: ok ? '#1a7a3c' : '#c0392b',
      color: 'white', borderRadius: 4,
      padding: '6px 12px', margin: '6px 0', fontSize: 10, fontWeight: 600
    }}>
      {children}
    </div>
  )
}

export default function ReportPreview({ result, inputs }: Props) {
  if (!result) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>결과 없음</div>

  const { steps, verdict, pipeType, DN, Do, tAdopt, selectedGrade, pnGrade } = result
  const today = new Date().toLocaleDateString('ko-KR')

  const verdictItems = Object.entries(verdict).filter(([k]) => k !== 'overallOK') as any[]

  return (
    <div id="report-content" style={{
      width: 794, margin: '0 auto',
      fontFamily: "'Noto Sans KR', sans-serif",
      background: 'white', color: '#1a1a2e'
    }}>
      {/* ── 표지 ── */}
      <div style={{
        background: '#003366', color: 'white',
        padding: '60px 50px', minHeight: 280,
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
          KDS 57 00 00 : 2022 상수도설계기준
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
          매설관로 구조안전성 검토 보고서
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 30 }}>
          PipeCheck KDS — Pipe Structural Safety Report
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
          <div>관종: <strong>{pipeType === 'steel' ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'}</strong></div>
          <div>호칭경: <strong>DN {DN}</strong></div>
          <div>설계압력: <strong>Pd = {inputs.Pd} MPa</strong></div>
          <div>매설깊이: <strong>H = {inputs.H} m</strong></div>
          <div>채택두께: <strong>{tAdopt} mm ({pipeType === 'steel' ? pnGrade : selectedGrade})</strong></div>
          <div>종합판정: <strong style={{ color: verdict.overallOK ? '#7dff9e' : '#ff7d7d' }}>
            {verdict.overallOK ? '✓ OK' : '✗ NG'}
          </strong></div>
        </div>

        <div style={{ marginTop: 30, fontSize: 10, opacity: 0.5 }}>
          작성일: {today} | KDS 57 00 00 : 2022 / KS D 3565 / KS D 4311 / AWWA M11
        </div>
      </div>

      <div style={{ padding: '20px 40px' }}>
        {/* ── 1. 계산 조건 ── */}
        <SectionHeader>1. 계산 조건</SectionHeader>

        <SubHeader>1.1 관로 기본 조건</SubHeader>
        <div style={{ background: '#f8faff', border: '1.5px solid #b0c8e8', borderRadius: 4 }}>
          <InputBox label="관종" value={pipeType === 'steel' ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)'}/>
          <InputBox label="호칭 관경 DN" value={DN} unit="mm"/>
          <InputBox label="관 외경 Do" value={Do} unit="mm"/>
          <InputBox label="설계 운전압력 Pd" value={inputs.Pd} unit="MPa"/>
          <InputBox label="수격압 배율" value={inputs.surgeRatio}/>
          <InputBox label="수격압 Pd,surge" value={(inputs.Pd * inputs.surgeRatio).toFixed(3)} unit="MPa"/>
          {pipeType === 'steel' && <InputBox label="라이닝" value={inputs.hasLining ? '시멘트 모르타르 라이닝' : '없음'}/>}
        </div>

        <SubHeader>1.2 매설·지반 조건</SubHeader>
        <div style={{ background: '#f8faff', border: '1.5px solid #b0c8e8', borderRadius: 4 }}>
          <InputBox label="관정 매설깊이 H" value={inputs.H} unit="m"/>
          <InputBox label="차량하중" value={inputs.hasTraffic ? 'DB-24 적용' : '미적용'}/>
          <InputBox label="토질 등급" value={inputs.soilClass}/>
          <InputBox label="다짐도" value={inputs.compaction} unit="%"/>
          <InputBox label="탄성지반반력계수 E'" value={inputs.Eprime} unit="kPa"/>
          <InputBox label="흙 단위중량 γ" value={inputs.gammaSoil} unit="kN/m³"/>
          {pipeType === 'ductile' && <InputBox label="침상 조건" value={inputs.beddingType}/>}
          <InputBox label="지하수위" value={inputs.gwLevel}/>
        </div>

        {/* ── 2. 계산 ── */}
        <SectionHeader>2. 구조안전성 계산</SectionHeader>

        {Object.entries(steps).map(([key, step]: [string, any]) => (
          <div key={key}>
            <SubHeader>STEP {key.replace('step', '')}. {step.title}</SubHeader>
            <div style={{ fontSize: 9, color: '#777', marginBottom: 4 }}>근거: {step.ref}</div>
            <FormulaBox>
              <strong>적용 공식:</strong> {step.formula.replace(/\\/g, '').replace(/\{|\}/g, '')}
            </FormulaBox>
            {/* 주요 계산값 */}
            {key === 'step1' && pipeType === 'steel' && (
              <CalcBox lines={[
                `허용응력 (상시): σ_a = 0.50 × 235 = ${step.sigmaA_normal?.toFixed(1)} MPa`,
                `허용응력 (수격): σ_a = 0.75 × 235 = ${step.sigmaA_surge?.toFixed(1)} MPa`,
                `t_p (상시) = ${step.Pd} × ${step.Do} / (2×${step.sigmaA_normal?.toFixed(1)}) = ${step.tp_normal?.toFixed(2)} mm`,
                `t_p (수격) = ${step.Psurge?.toFixed(3)} × ${step.Do} / (2×${step.sigmaA_surge?.toFixed(1)}) = ${step.tp_surge?.toFixed(2)} mm`,
                `t_handling = ${step.Do} / 288 = ${step.tHandling?.toFixed(2)} mm`,
                `t_required = max(${step.tp_normal?.toFixed(2)}, ${step.tp_surge?.toFixed(2)}, ${step.tHandling?.toFixed(2)}) + 1.5 = ${step.tRequired?.toFixed(2)} mm`,
                `채택: KS D 3565 ${step.pnGrade} → t = ${step.tAdopt} mm`,
                `σ (상시) = ${step.sigma_normal?.toFixed(2)} MPa / 허용 ${step.sigmaA_normal?.toFixed(1)} MPa → ${step.ok_normal ? 'OK' : 'NG'}`,
                `σ (수격) = ${step.sigma_surge?.toFixed(2)} MPa / 허용 ${step.sigmaA_surge?.toFixed(1)} MPa → ${step.ok_surge ? 'OK' : 'NG'}`,
              ]}/>
            )}
            {key === 'step1' && pipeType === 'ductile' && (
              <CalcBox lines={[
                `허용응력: σ_a = 420/3 = ${step.sigmaA_hoop?.toFixed(1)} MPa`,
                `Di = ${step.Do} - 2×${step.tAdopt} = ${step.Di?.toFixed(1)} mm`,
                `σ_hoop = ${step.Pd} × ${step.Di?.toFixed(1)} / (2×${step.tAdopt}) = ${step.sigma_hoop?.toFixed(2)} MPa`,
                `채택: ${step.selectedGrade} (t=${step.tAdopt}mm), 판정: ${step.ok ? 'OK' : 'NG'}`,
              ]}/>
            )}
            {key === 'step2' && (
              <CalcBox lines={[
                `We = ${step.gammaSoil} × ${step.H?.toFixed(2)} × ${(step.Do/1000).toFixed(3)} = ${step.We?.toFixed(3)} kN/m`,
                ...(step.PLraw !== undefined ? [
                  `PL = ${step.PLraw?.toFixed(1)} × IF(${step.IF?.toFixed(2)}) = ${step.PL?.toFixed(2)} kPa`,
                  `WL = ${step.PL?.toFixed(2)} × ${(step.Do/1000).toFixed(3)} = ${step.WL?.toFixed(3)} kN/m`,
                  `W_total = ${step.We?.toFixed(3)} + ${step.WL?.toFixed(3)} = ${step.Wtotal?.toFixed(3)} kN/m`,
                ] : []),
              ]}/>
            )}
            {key === 'step3' && pipeType === 'steel' && (
              <CalcBox lines={[
                `PL(충격포함) = ${step.PL?.toFixed(2)} kPa (H=${inputs.H}m)`,
                `WL = ${step.WL?.toFixed(3)} kN/m, W_total = ${step.Wtotal?.toFixed(3)} kN/m`,
                `P_total = ${step.Ptotal?.toFixed(2)} kPa`,
              ]}/>
            )}
            {key === 'step3' && pipeType === 'ductile' && (
              <CalcBox lines={[
                `Kb = ${step.Kb}`,
                `σ_b = ${step.Kb} × ${step.Wtotal?.toFixed(3)} × ${step.Do} / ${step.tAdopt}² = ${step.sigma_b?.toFixed(2)} MPa`,
                `허용: ${step.sigmaA_bend?.toFixed(1)} MPa → ${step.ok ? 'OK' : 'NG'}`,
              ]}/>
            )}
            {key === 'step4' && (
              <CalcBox lines={[
                `r = ${step.r?.toFixed(4)} m, EI = ${step.EI?.toFixed(2)} kN·m²/m`,
                `분모 = EI/r³ + 0.061×E' = ${step.EI_r3?.toFixed(2)} + ${(0.061*inputs.Eprime).toFixed(2)} = ${step.denominator?.toFixed(2)} kPa`,
                `ΔD/D = ${step.deflectionRatio?.toFixed(3)}% / 허용 ${step.maxDeflection}% → ${step.ok ? 'OK' : 'NG'}`,
              ]}/>
            )}
            {key === 'step5' && (
              <CalcBox lines={[
                `Rw = ${step.Rw}, B' = ${step.Bprime?.toFixed(4)}`,
                `Pcr = ${step.Pcr?.toFixed(2)} kPa`,
                `F.S. = ${step.bucklingFS_actual?.toFixed(3)} / 허용 ${step.FS_allow} → ${step.ok ? 'OK' : 'NG'}`,
              ]}/>
            )}
            {step.ok !== undefined && (
              <ResultBox ok={step.ok}>
                {step.title} 검토: {step.ok ? '✓ OK — 안전' : '✗ NG — 불만족'}
              </ResultBox>
            )}
          </div>
        ))}

        {/* ── 3. 결과 요약 ── */}
        <SectionHeader>3. 결과 요약</SectionHeader>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginTop: 8 }}>
          <thead>
            <tr style={{ background: '#003366', color: 'white' }}>
              <th style={{ padding: '6px 10px', textAlign: 'left' }}>검토 항목</th>
              <th style={{ padding: '6px 10px', textAlign: 'center' }}>계산값</th>
              <th style={{ padding: '6px 10px', textAlign: 'center' }}>허용값</th>
              <th style={{ padding: '6px 10px', textAlign: 'center' }}>단위</th>
              <th style={{ padding: '6px 10px', textAlign: 'center' }}>판정</th>
            </tr>
          </thead>
          <tbody>
            {verdictItems.map(([key, item]: any, i: number) => (
              <tr key={key} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                <td style={{ padding: '5px 10px' }}>{item.label}</td>
                <td style={{ padding: '5px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {item.value?.toFixed(3)}
                </td>
                <td style={{ padding: '5px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {item.allow?.toFixed(3)}
                </td>
                <td style={{ padding: '5px 10px', textAlign: 'center' }}>{item.unit}</td>
                <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                  <span style={{
                    background: item.ok ? '#1a7a3c' : '#c0392b',
                    color: 'white', padding: '2px 8px', borderRadius: 9999, fontSize: 9
                  }}>
                    {item.ok ? 'OK' : 'NG'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{
          background: verdict.overallOK ? '#1a7a3c' : '#c0392b',
          color: 'white', borderRadius: 8,
          padding: '12px 20px', marginTop: 12, textAlign: 'center'
        }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>종합 구조안전성 판정</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>
            {verdict.overallOK ? '✓ 적합 (OK)' : '✗ 부적합 (NG)'}
          </div>
          <div style={{ fontSize: 9, opacity: 0.8, marginTop: 4 }}>KDS 57 00 00 : 2022 기준</div>
        </div>

        {/* ── 4. 삽도 ── */}
        <SectionHeader>4. 참고 삽도</SectionHeader>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#003366', marginBottom: 4 }}>① 매설 단면도</div>
            <CrossSectionSVG Do={Do} H={inputs.H} t={tAdopt}
                             hasTraffic={inputs.hasTraffic} gwLevel={inputs.gwLevel}/>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#003366', marginBottom: 4 }}>② 처짐 변형 개념도</div>
            <DeflectionSVG
              deflectionRatio={(steps.step4 as any)?.deflectionRatio ?? 0}
              maxDeflection={(steps.step4 as any)?.maxDeflection ?? 5}
              Do={Do}
            />
          </div>
        </div>
        {inputs.pipeType === 'ductile' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#003366', marginBottom: 4 }}>③ 침상 조건도</div>
            <BeddingConditionSVG selected={inputs.beddingType}/>
          </div>
        )}

        {/* ── 면책 ── */}
        <div style={{
          marginTop: 30, padding: '8px 12px',
          background: '#fff8e8', borderLeft: '4px solid #f0a500',
          fontSize: 9, color: '#666'
        }}>
          <strong>주의:</strong> 본 보고서는 PipeCheck KDS 앱을 이용하여 자동 계산한 결과입니다.
          설계 최종 결정은 자격을 갖춘 전문 기술사의 검토 및 확인을 통해 이루어져야 합니다.
          적용 기준: KDS 57 00 00 : 2022 / KS D 3565 / KS D 4311 / AWWA M11 / DIPRA.
        </div>

        <div style={{ textAlign: 'center', color: '#aaa', fontSize: 8, marginTop: 16, paddingBottom: 20 }}>
          PipeCheck KDS — Generated {today}
        </div>
      </div>
    </div>
  )
}
