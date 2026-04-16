import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import { SEISMIC_ZONE, SEISMIC_GRADE, SOIL_TYPE, AMP_FACTOR } from '../../engine/seismicConstants.js'
import { interpAmpFactor } from '../../engine/seismicSegmented.js'
import {
  EngPanel, EngSection, EngRow, EngInput,
  EngRadio, EngSegment, EngDivider, EngValue,
} from '../../components/eng/EngLayout'
import { T } from '../../components/eng/tokens'
import { ResponseSpectrumSVG } from '../../components/eng/diagrams/ResponseSpectrumSVG'
import { BuriedPipeResponseSVG } from '../../components/eng/diagrams/BuriedPipeResponseSVG'
import { calcS, calcDesignSpectrum, calcSv } from '../../engine/seismicSegmented.js'
import { calcTG, calcTs, calcVds, calcWavelength } from '../../engine/seismicConstants.js'

// 지반층 입력 컴포넌트
function LayerEditor({ layers, setLayers }: {
  layers: { H: number; Vs: number }[]
  setLayers: (l: { H: number; Vs: number }[]) => void
}) {
  const add = () => setLayers([...layers, { H: 5, Vs: 200 }])
  const rm = (i: number) => setLayers(layers.filter((_, j) => j !== i))
  const upd = (i: number, k: 'H' | 'Vs', v: string) => {
    const n = [...layers]; n[i] = { ...n[i], [k]: parseFloat(v) || 0 }; setLayers(n)
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, fontSize: 10, color: T.textMuted, fontWeight: 700, marginBottom: 3, fontFamily: T.fontSans }}>
        <span style={{ width: 24 }}>층</span>
        <span style={{ width: 80 }}>두께 H (m)</span>
        <span style={{ width: 90 }}>Vs (m/s)</span>
      </div>
      {layers.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 3, alignItems: 'center' }}>
          <span style={{ width: 24, fontSize: 11, color: T.textMuted, fontFamily: T.fontMono }}>L{i + 1}</span>
          <input type="number" value={l.H} onChange={e => upd(i, 'H', e.target.value)} min={0.1} step={0.5}
            style={{ width: 80, height: T.inputH, border: `1px solid ${T.borderDark}`, padding: '0 4px', fontSize: 12, fontFamily: T.fontMono, textAlign: 'right' }}/>
          <input type="number" value={l.Vs} onChange={e => upd(i, 'Vs', e.target.value)} min={50} step={10}
            style={{ width: 90, height: T.inputH, border: `1px solid ${T.borderDark}`, padding: '0 4px', fontSize: 12, fontFamily: T.fontMono, textAlign: 'right' }}/>
          {layers.length > 1 && (
            <button onClick={() => rm(i)} style={{ fontSize: 10, padding: '1px 6px', cursor: 'pointer', border: `1px solid ${T.border}`, background: 'white', color: T.textMuted }}>×</button>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
        <button onClick={add} style={{ fontSize: 11, padding: '2px 10px', cursor: 'pointer', border: `1px solid ${T.borderDark}`, background: 'white', color: T.textAccent, fontFamily: T.fontSans }}>
          + 층 추가
        </button>
        <span style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono }}>
          H_total = {layers.reduce((s, l) => s + l.H, 0).toFixed(1)} m
        </span>
      </div>
    </div>
  )
}

export default function SeismicDetailInputPage() {
  const navigate = useNavigate()
  const { detailInputs: inp, setDetailInputs: set, setDetailLayers, calcDetail } = useSeismicStore()

  const Z = SEISMIC_ZONE[inp.zone as 'I'|'II'].Z
  const I_seismic = inp.seismicGrade === 'I' ? 1.40 : 1.00
  const S = Z * I_seismic
  const ampEntry = (AMP_FACTOR as any)[inp.soilType]

  // 실시간 스펙트럼 파라미터 (삽도용)
  let specParams = { SDS: 0, SD1: 0, T0: 0, TS: 0, Ts: 0 }
  try {
    const Fa_t = ampEntry?.Fa ?? [1.0, 1.0, 1.0]
    const Fv_t = ampEntry?.Fv ?? [1.0, 1.0, 1.0]
    const Fa = interpAmpFactor(Fa_t, S)
    const Fv = interpAmpFactor(Fv_t, S)
    const { SDS, SD1 } = calcDesignSpectrum(S, Fa, Fv)
    const TG = calcTG(inp.layers)
    const Ts = calcTs(TG)
    const { Sv, T0, TS } = calcSv(Ts, SDS, SD1)
    const { Vds } = calcVds(inp.layers, Ts)
    const { L } = calcWavelength(Ts, Vds, inp.Vbs)
    specParams = { SDS, SD1, T0, TS, Ts }
  } catch {}

  function handleCalc() {
    const result = calcDetail()
    if (result) navigate('/seismic-detail/result')
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* ── 좌측: 입력 ───────────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>

        {/* 관종 및 지진조건 */}
        <EngPanel title="① 관종 및 지진조건">
          <EngRow label="관종 (계산방법)">
            <EngSegment
              options={[
                { key: 'segmented',  label: '분절관 (덕타일 주철관)', sub: '이음부 신축량·굽힘각 검토' },
                { key: 'continuous', label: '연속관 (강관)',           sub: '축변형률·국부좌굴 검토' },
              ]}
              value={inp.pipeType}
              onChange={v => set({ pipeType: v })}
            />
          </EngRow>
          <EngDivider />
          <EngRow label="지진구역">
            <EngRadio
              options={[
                { key: 'I',  label: '구역 Ⅰ  (Z = 0.11)' },
                { key: 'II', label: '구역 Ⅱ  (Z = 0.07)' },
              ]}
              value={inp.zone}
              onChange={v => set({ zone: v })}
            />
          </EngRow>
          <EngRow label="내진등급">
            <EngSegment
              options={[
                { key: 'I',  label: '내진 Ⅰ 등급', sub: '붕괴방지 1000년 / 기능수행 100년' },
                { key: 'II', label: '내진 Ⅱ 등급', sub: '붕괴방지 500년 / 기능수행 50년' },
              ]}
              value={inp.seismicGrade}
              onChange={v => set({ seismicGrade: v })}
            />
          </EngRow>
          <EngRow label="지반종류">
            <EngSegment
              options={Object.keys(SOIL_TYPE).map(k => ({ key: k, label: k }))}
              value={inp.soilType}
              onChange={v => set({ soilType: v })}
            />
          </EngRow>
          <div style={{ fontSize: 10, color: T.textMuted, marginLeft: 110, marginTop: 2, fontFamily: T.fontSans }}>
            {SOIL_TYPE[inp.soilType as keyof typeof SOIL_TYPE]?.label}
            {ampEntry ? '' : '  ※ 부지 고유특성 평가 필요'}
          </div>
          <EngDivider label="설계지반가속도" />
          <EngRow label="">
            <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textAccent }}>
              S = Z × I = {Z} × {I_seismic} = <strong>{S.toFixed(3)} g</strong>
              {'  '}(위험도계수 I = {I_seismic})
            </span>
          </EngRow>
        </EngPanel>

        {/* 관로 제원 */}
        <EngPanel title="② 관로 제원">
          <EngRow label="공칭관경 DN" unit="mm">
            <EngInput value={inp.DN} onChange={v => set({ DN: parseFloat(v)||300 })} min={50} max={3000} step={50} width={90}/>
          </EngRow>
          <EngRow label="관두께 t" unit="mm">
            <EngInput value={inp.thickness} onChange={v => set({ thickness: parseFloat(v)||8 })} min={1} step={0.5} width={90}/>
          </EngRow>
          <EngRow label="외경 D_out" unit="mm">
            <EngInput value={inp.D_out} onChange={v => set({ D_out: parseFloat(v)||322 })} min={50} step={1} width={90}/>
          </EngRow>
          <EngRow label="설계수압 P" unit="MPa">
            <EngInput value={inp.P} onChange={v => set({ P: parseFloat(v)||0.5 })} min={0.01} step={0.05} width={90}/>
          </EngRow>
          <EngRow label="토피 h" unit="m">
            <EngInput value={inp.hCover} onChange={v => set({ hCover: parseFloat(v)||1.5 })} min={0.3} step={0.1} width={90}/>
          </EngRow>

          {/* 분절관 추가 입력 */}
          {inp.pipeType === 'segmented' && (
            <>
              <EngDivider label="분절관 이음부 조건"/>
              <EngRow label="관 1본 길이 Lj" unit="m">
                <EngInput value={inp.Lj} onChange={v => set({ Lj: parseFloat(v)||6 })} min={1} step={0.5} width={90}/>
              </EngRow>
              <EngRow label="이음 종류">
                <EngRadio
                  options={[
                    { key: 'normal',  label: '일반형 이음' },
                    { key: 'seismic', label: '내진형 이음' },
                  ]}
                  value={inp.isSeismicJoint ? 'seismic' : 'normal'}
                  onChange={v => set({ isSeismicJoint: v === 'seismic' })}
                />
              </EngRow>
            </>
          )}

          {/* 연속관 추가 입력 */}
          {inp.pipeType === 'continuous' && (
            <>
              <EngDivider label="연속관 하중 조건"/>
              <EngRow label="온도변화 ΔT" unit="°C">
                <EngInput value={inp.deltaT} onChange={v => set({ deltaT: parseFloat(v)||20 })} step={1} width={90}/>
              </EngRow>
              <EngRow label="부등침하량 δ" unit="m">
                <EngInput value={inp.D_settle} onChange={v => set({ D_settle: parseFloat(v)||0 })} min={0} step={0.01} width={90}/>
              </EngRow>
              <EngRow label="침하구간 길이" unit="m">
                <EngInput value={inp.L_settle} onChange={v => set({ L_settle: parseFloat(v)||0 })} min={0} step={1} width={90}/>
              </EngRow>
            </>
          )}
        </EngPanel>

        {/* 지반 조건 */}
        <EngPanel title="③ 표층지반 조건">
          <div style={{ marginBottom: 6 }}>
            <LayerEditor layers={inp.layers} setLayers={setDetailLayers}/>
          </div>
          <EngDivider />
          <EngRow label="기반암 Vs (Vbs)" unit="m/s">
            <EngInput value={inp.Vbs} onChange={v => set({ Vbs: parseFloat(v)||500 })} min={200} step={50} width={90}/>
            <span style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono }}>
              {inp.Vbs >= 300 ? 'ε=1.0' : 'ε=0.85'}
            </span>
          </EngRow>
        </EngPanel>

        {/* 계산 버튼 */}
        <button onClick={handleCalc} style={{
          width: '100%', padding: '7px 0',
          background: T.bgActive, color: 'white', border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          borderRadius: 2, fontFamily: T.fontSans,
        }}>
          내진성능 상세평가 계산  ▶
        </button>
      </div>

      {/* ── 우측: 삽도 ───────────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>
        {/* 설계응답스펙트럼 */}
        <EngPanel title="설계응답스펙트럼  (KDS 17 10 00 그림 2.1.2)">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <ResponseSpectrumSVG
              SDS={specParams.SDS} SD1={specParams.SD1}
              T0={specParams.T0} TS={specParams.TS} Ts={specParams.Ts}
              width={280} height={160}
            />
          </div>
          <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono, lineHeight: 1.8, marginTop: 4 }}>
            SDS = Fa·S·2.5 = {specParams.SDS.toFixed(3)} g{'  '}|{'  '}
            SD1 = Fv·S = {specParams.SD1.toFixed(3)} g{'  '}|{'  '}
            Ts = {specParams.Ts.toFixed(3)} s
          </div>
        </EngPanel>

        {/* 응답변위법 개념도 */}
        <EngPanel title="매설관로 응답변위법 개념도  (평가요령 부록 C)">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <BuriedPipeResponseSVG width={300} height={120}/>
          </div>
          <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontSans, lineHeight: 1.7, marginTop: 4 }}>
            지반변위(실선) → 관로 변형(점선) → 이음부/관체 응력 산정<br/>
            축방향 변형률: ε_L = 4U_h / L<br/>
            굽힘 변형률: ε_B = π²·D / (2L²) · U_h
          </div>
        </EngPanel>
      </div>
    </div>
  )
}
