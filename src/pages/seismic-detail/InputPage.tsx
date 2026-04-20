import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import { SEISMIC_ZONE, SEISMIC_GRADE, SOIL_TYPE, AMP_FACTOR } from '../../engine/seismicConstants.js'
import { interpAmpFactor } from '../../engine/seismicSegmented.js'
import {
  EngPanel, EngSection, EngRow, EngInput,
  EngRadio, EngSegment, EngDivider, EngValue, EngPopover,
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

  // 실시간 스펙트럼 파라미터 (삽도용) — 붕괴방지
  let specParams = { SDS: 0, SD1: 0, T0: 0, TS: 0, Ts: 0 }
  let specFunc: { SDS_func?: number; SD1_func?: number } = {}
  try {
    const Fa_t = ampEntry?.Fa ?? [1.0, 1.0, 1.0]
    const Fv_t = ampEntry?.Fv ?? [1.0, 1.0, 1.0]
    const Fa = interpAmpFactor(Fa_t, S)
    const Fv = interpAmpFactor(Fv_t, S)
    const { SDS, SD1 } = calcDesignSpectrum(S, Fa, Fv)
    const TG = calcTG(inp.layers)
    const Ts = calcTs(TG)
    const { Vds } = calcVds(inp.layers, Ts)
    const { L } = calcWavelength(Ts, Vds, inp.Vbs)
    // KDS 17 10 00 그림 2.1.2: T₀ = 0.2×SD1/SDS, Tₛ = SD1/SDS
    const T0_design = SDS > 0 ? 0.2 * SD1 / SDS : 0.06
    const TS_design = SDS > 0 ? SD1 / SDS : 0.3
    specParams = { SDS, SD1, T0: T0_design, TS: TS_design, Ts }
    // 기능수행 스펙트럼
    const I_func = inp.seismicGrade === 'I' ? 0.57 : 0.40
    const S_func = Z * I_func
    const Fa_f = interpAmpFactor(Fa_t, S_func)
    const Fv_f = interpAmpFactor(Fv_t, S_func)
    const { SDS: SDS_f, SD1: SD1_f } = calcDesignSpectrum(S_func, Fa_f, Fv_f)
    specFunc = { SDS_func: SDS_f, SD1_func: SD1_f }
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
          <EngRow label="관종 (계산방법)" popover={
            <EngPopover title="관종 및 계산방법 선택">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>KDS 57 17 00 : 2022 §4.2 / 매설관로 내진성능평가 요령 부록 C</strong><br/>
                  관종에 따라 이음부 거동이 달라지므로 계산방법이 구분됨
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>방법</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>대상 관종</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>검토 항목</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', fontWeight: 700 }}>분절관</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>덕타일 주철관, 고무링 이음</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>이음부 신축량 Δ, 굽힘각 θ 검토</td>
                    </tr>
                    <tr style={{ background: '#fafafa' }}>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', fontWeight: 700 }}>연속관</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>강관 (용접이음), 플랜지 이음</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>관체 축변형률 ε 검토 (항복 또는 국부좌굴)</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  <strong>분절관 계산 근거:</strong> 응답변위법 — 지반변위를 파장으로 나누어<br/>
                  이음부 1개소당 신축량·굽힘각 산정 후 허용값 비교<br/>
                  <strong>연속관 계산 근거:</strong> 지반변위에 의한 관체 축변형률 산정 후<br/>
                  항복변형률(σ_y/E) 또는 국부좌굴 한계(46t/D)와 비교
                </div>
              </div>
            </EngPopover>
          }>
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
          <EngRow label="지진구역" popover={
            <EngPopover title="지진구역 (Seismic Zone)">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>KDS 17 10 00 : 2019 §2.1.1</strong><br/>
                  국내 지진위험도에 따라 전국을 2개 구역으로 구분
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>구역</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>Z값</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>해당 지역</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontWeight: 700 }}>Ⅰ</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>0.11</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>서울·인천·경기 일부, 강원·충청·경상·전라·제주 주요지역</td>
                    </tr>
                    <tr style={{ background: '#fafafa' }}>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontWeight: 700 }}>Ⅱ</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>0.07</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>위 이외 지역</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  설계지반가속도 S = Z × I (I: 위험도계수)<br/>
                  상세평가에서 S는 설계응답스펙트럼 SDS, SD1 산정의 기초값
                </div>
              </div>
            </EngPopover>
          }>
            <EngRadio
              options={[
                { key: 'I',  label: '구역 Ⅰ  (Z = 0.11)' },
                { key: 'II', label: '구역 Ⅱ  (Z = 0.07)' },
              ]}
              value={inp.zone}
              onChange={v => set({ zone: v })}
            />
          </EngRow>
          <EngRow label="내진등급" popover={
            <EngPopover title="내진등급 (Seismic Performance Grade)">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>KDS 57 17 00 : 2022 §3.1 / KDS 17 10 00 §2.3</strong>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>등급</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>붕괴방지</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>기능수행</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>위험도계수 I</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontWeight: 700 }}>Ⅰ</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center' }}>재현 1000년</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center' }}>재현 100년</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>1.40 / 0.57</td>
                    </tr>
                    <tr style={{ background: '#fafafa' }}>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontWeight: 700 }}>Ⅱ</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center' }}>재현 500년</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center' }}>재현 50년</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>1.00 / 0.40</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  위험도계수 I는 붕괴방지/기능수행 수준에 각각 적용.<br/>
                  내진 Ⅰ 등급: 급수인구 10만명 이상 또는 주요 간선 관로
                </div>
              </div>
            </EngPopover>
          }>
            <EngSegment
              options={[
                { key: 'I',  label: '내진 Ⅰ 등급', sub: '붕괴방지 1000년 / 기능수행 100년' },
                { key: 'II', label: '내진 Ⅱ 등급', sub: '붕괴방지 500년 / 기능수행 50년' },
              ]}
              value={inp.seismicGrade}
              onChange={v => set({ seismicGrade: v })}
            />
          </EngRow>
          <EngRow label="지반종류" popover={
            <EngPopover title="지반종류 (Site Class)">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>KDS 17 10 00 : 2019 §2.2 / 표 2.2.1</strong><br/>
                  지표면에서 30m 깊이까지 평균 전단파 속도(Vs,30)로 분류
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>분류</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>Vs,30 (m/s)</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>지반 특성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['SA', '> 1500', '경암'],
                      ['SB', '760 ~ 1500', '보통암'],
                      ['SC', '360 ~ 760', '매우 조밀한 토사 / 연암'],
                      ['SD', '180 ~ 360', '단단한 토사'],
                      ['SE', '< 180', '연약한 토사'],
                      ['SF', '—', '부지 고유 특성평가 필요'],
                    ].map(([k, vs, desc], i) => (
                      <tr key={k} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', fontWeight: 700, textAlign: 'center', fontFamily: T.fontMono }}>{k}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>{vs}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#e8f0fb', border: '1px solid #5b9bd5', borderRadius: 2, fontSize: 10 }}>
                  상세평가에서 지반종류는 지반증폭계수(Fa, Fv) 결정에 사용되며<br/>
                  설계응답스펙트럼 SDS = Fa × S × 2.5, SD1 = Fv × S 산정에 직접 영향.<br/>
                  아래 ③ 표층지반조건 입력값과 일치하도록 입력 권장.
                </div>
              </div>
            </EngPopover>
          }>
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
          <EngRow label="공칭관경 DN" unit="mm" popover={
            <EngPopover title="공칭관경 DN">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2</strong>
                </div>
                <div style={{ fontSize: 11 }}>
                  공칭관경(nominal diameter)으로 계산에는 외경 D_out와 두께 t를 사용.<br/>
                  아래 외경 D_out 및 관두께 t와 일관성 있게 입력할 것.
                </div>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  분절관: DN은 이음부 허용변위량 기준 테이블 검색에 사용됨<br/>
                  연속관: 주로 D/t 비로 국부좌굴 한계변형률(46t/D) 산정에 사용
                </div>
              </div>
            </EngPopover>
          }>
            <EngInput value={inp.DN} onChange={v => set({ DN: parseFloat(v)||300 })} min={50} max={3000} step={50} width={90}/>
          </EngRow>
          <EngRow label="관두께 t" unit="mm" popover={
            <EngPopover title="관두께 t">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2.3</strong>
                </div>
                <div style={{ fontSize: 11 }}>
                  <strong>연속관(강관)에서 중요:</strong><br/>
                  국부좌굴 한계변형률 = 46 × t / D_out<br/>
                  t/D 비가 클수록(두꺼울수록) 좌굴에 유리
                </div>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 2, fontFamily: T.fontMono, fontSize: 11 }}>
                  현재: t = {inp.thickness} mm, D_out = {inp.D_out} mm<br/>
                  46·t/D = {(46 * inp.thickness / inp.D_out * 0.01).toFixed(4)} (소수)
                </div>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  구조안전성 검토 시 채택한 두께와 동일한 값 입력 권장
                </div>
              </div>
            </EngPopover>
          }>
            <EngInput value={inp.thickness} onChange={v => set({ thickness: parseFloat(v)||8 })} min={1} step={0.5} width={90}/>
          </EngRow>
          <EngRow label="외경 D_out" unit="mm" popover={
            <EngPopover title="외경 D_out (Outer Diameter)">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2</strong>
                </div>
                <div style={{ fontSize: 11 }}>
                  계산에 사용되는 실제 외경(공칭관경 ≠ 외경).<br/>
                  내경 Di = D_out − 2t로 산정됨.
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginTop: 6 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>관종</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>DN300</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>DN400</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>DN600</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>덕타일 주철관</td>
                      <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>326</td>
                      <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>429</td>
                      <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>635</td>
                    </tr>
                    <tr style={{ background: '#fafafa' }}>
                      <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>강관 (KS D 3565)</td>
                      <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>318.5</td>
                      <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>406.4</td>
                      <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>609.6</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </EngPopover>
          }>
            <EngInput value={inp.D_out} onChange={v => set({ D_out: parseFloat(v)||322 })} min={50} step={1} width={90}/>
          </EngRow>
          <EngRow label="설계수압 P" unit="MPa" popover={
            <EngPopover title="설계수압 P">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2.3</strong>
                </div>
                <div style={{ fontSize: 11 }}>
                  내진 상세평가에서 설계수압은 관체 허용변형률 산정 시<br/>
                  내압에 의한 원주방향 응력 성분 제거에 사용됨.<br/>
                  구조안전성 검토의 설계운전압력 Pd와 동일한 값 사용.
                </div>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  1 kgf/cm² = 0.098 MPa ≈ 0.1 MPa<br/>
                  예: 6 kgf/cm² → 0.588 MPa → 0.60 MPa 입력
                </div>
              </div>
            </EngPopover>
          }>
            <EngInput value={inp.P} onChange={v => set({ P: parseFloat(v)||0.5 })} min={0.01} step={0.05} width={90}/>
          </EngRow>
          <EngRow label="토피 h" unit="m" popover={
            <EngPopover title="토피 h (매설 깊이)">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2</strong>
                </div>
                <div style={{ fontSize: 11 }}>
                  관 상단에서 지표면까지의 거리.<br/>
                  지반변위 산정 시 깊이에 따른 감소 효과가 반영됨.<br/>
                  상수도 관로의 일반적인 토피: 1.0 ~ 1.5 m
                </div>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  도로 하부 횡단 구간: 1.2 m 이상 (도로 점용 기준)<br/>
                  한랭지 등 동결심도 이하로 매설 시 그 깊이 적용
                </div>
              </div>
            </EngPopover>
          }>
            <EngInput value={inp.hCover} onChange={v => set({ hCover: parseFloat(v)||1.5 })} min={0.3} step={0.1} width={90}/>
          </EngRow>

          {/* 분절관 추가 입력 */}
          {inp.pipeType === 'segmented' && (
            <>
              <EngDivider label="분절관 이음부 조건"/>
              <EngRow label="관 1본 길이 Lj" unit="m" popover={
                <EngPopover title="관 1본 길이 Lj">
                  <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                    <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                      <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2.2</strong><br/>
                      이음부 1개소당 신축량·굽힘각 계산의 핵심 입력값
                    </div>
                    <div style={{ padding: '4px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 2, fontFamily: T.fontMono, fontSize: 11 }}>
                      이음부 신축량 Δ = ε_L × Lj<br/>
                      굽힘각 θ = (π²·D / L²) × U_h × Lj
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11 }}>
                      <strong>일반적인 관 1본 길이</strong>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginTop: 3 }}>
                        <thead>
                          <tr style={{ background: '#f0f4f8' }}>
                            <th style={{ padding: '2px 4px', border: '1px solid #ccc' }}>관종</th>
                            <th style={{ padding: '2px 4px', border: '1px solid #ccc' }}>표준 길이</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '2px 4px', border: '1px solid #eee' }}>덕타일 주철관 (KS D 4311)</td>
                            <td style={{ padding: '2px 4px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>6 m</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                      Lj가 길수록 이음부 1개소당 신축량이 증가하므로<br/>
                      이음부 허용 신축량을 초과할 위험이 높아짐.
                    </div>
                  </div>
                </EngPopover>
              }>
                <EngInput value={inp.Lj} onChange={v => set({ Lj: parseFloat(v)||6 })} min={1} step={0.5} width={90}/>
              </EngRow>
              <EngRow label="이음 종류" popover={
                <EngPopover title="이음 종류 (Joint Type)">
                  <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                    <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                      <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C 표 C.2.2</strong><br/>
                      이음 종류에 따라 허용 신축량과 굽힘각이 다름
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#f0f4f8' }}>
                          <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>이음 종류</th>
                          <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>허용 신축량</th>
                          <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>허용 굽힘각</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', fontWeight: 700 }}>일반형</td>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>소 (약 10~20 mm)</td>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>소 (약 2°)</td>
                        </tr>
                        <tr style={{ background: '#fafafa' }}>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', fontWeight: 700 }}>내진형</td>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>대 (약 50~100 mm)</td>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>대 (약 5°)</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: 6, padding: '4px 8px', background: '#e8f0fb', border: '1px solid #5b9bd5', borderRadius: 2, fontSize: 10 }}>
                      내진형 이음(NS 이음, SII 이음 등)은 이탈방지 링과<br/>
                      신축구조를 결합하여 지진 시 대변위에 대응 가능.<br/>
                      실제 허용값은 제조사 카탈로그 또는 KS D 4311 부록 참조.
                    </div>
                  </div>
                </EngPopover>
              }>
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
              <EngRow label="온도변화 ΔT" unit="°C" popover={
                <EngPopover title="온도변화 ΔT">
                  <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                    <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                      <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2.3</strong><br/>
                      관로 시공 온도와 운용 온도 차이에 의한 열변형률 산정
                    </div>
                    <div style={{ padding: '4px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 2, fontFamily: T.fontMono, fontSize: 11 }}>
                      ε_T = α × ΔT<br/>
                      α (강관 열팽창계수) = 1.2 × 10⁻⁵ /°C
                    </div>
                    <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                      지진 하중과 온도 하중은 동시 작용으로 가정하여 변형률 합산.<br/>
                      시공 온도를 알 수 없으면 보수적으로 20°C 적용 권장.
                    </div>
                  </div>
                </EngPopover>
              }>
                <EngInput value={inp.deltaT} onChange={v => set({ deltaT: parseFloat(v)||20 })} step={1} width={90}/>
              </EngRow>
              <EngRow label="부등침하량 δ" unit="m" popover={
                <EngPopover title="부등침하량 δ">
                  <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                    <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                      <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2.3</strong>
                    </div>
                    <div style={{ fontSize: 11 }}>
                      지반 부등침하 또는 지진에 의한 국부 침하 예상량.<br/>
                      지반조사 결과 또는 인근 구조물 침하 실측값 사용.<br/>
                      연약 지반 구간, 성토-절토 경계부에서 특히 중요.
                    </div>
                    <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                      부등침하가 없는 경우 δ = 0 입력.
                    </div>
                  </div>
                </EngPopover>
              }>
                <EngInput value={inp.D_settle} onChange={v => set({ D_settle: parseFloat(v)||0 })} min={0} step={0.01} width={90}/>
              </EngRow>
              <EngRow label="침하구간 길이" unit="m" popover={
                <EngPopover title="침하구간 길이 L_settle">
                  <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                    <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                      <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2.3</strong>
                    </div>
                    <div style={{ padding: '4px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 2, fontFamily: T.fontMono, fontSize: 11 }}>
                      굽힘변형률 ε_B = π² · D_out / (2 · L²) · δ
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11 }}>
                      부등침하 δ가 발생하는 구간의 길이 L.<br/>
                      L이 짧을수록 굽힘변형률이 급격히 증가하므로<br/>
                      실측 또는 지반조사 결과를 기반으로 보수적 추정 권장.
                    </div>
                  </div>
                </EngPopover>
              }>
                <EngInput value={inp.L_settle} onChange={v => set({ L_settle: parseFloat(v)||0 })} min={0} step={1} width={90}/>
              </EngRow>
              <EngDivider label="허용변형률 기준"/>
              <EngRow label="판정 기준" popover={
                <EngPopover title="허용변형률 판정 기준">
                  <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                    <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                      <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C 표 C.2.3</strong><br/>
                      연속관(강관)의 축방향 변형률 허용 기준 선택
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#f0f4f8' }}>
                          <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>기준</th>
                          <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>식</th>
                          <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>특성</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', fontWeight: 700 }}>σ_y / E</td>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', fontFamily: T.fontMono }}>fy / Es</td>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>항복점 변형률<br/>SS400: 235/206000 = 0.114%<br/>보수적 기준</td>
                        </tr>
                        <tr style={{ background: '#fafafa' }}>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', fontWeight: 700 }}>46·t / D</td>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee', fontFamily: T.fontMono }}>46 × t / D</td>
                          <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>국부좌굴 한계<br/>ASCE / KDS 해설<br/>σ_y/E 대비 약 3배 이상 크며<br/>실무에서 널리 사용</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                      붕괴방지 수준에서 항복을 허용하는 경우 46t/D 기준 적용 가능.<br/>
                      기능수행 수준에서는 항복(σ_y/E) 이하 유지가 원칙.
                    </div>
                  </div>
                </EngPopover>
              }>
                <EngRadio
                  options={[
                    { key: 'yield',    label: 'σ_y / E  (항복점 변형률)' },
                    { key: 'buckling', label: '46·t / D  (국부좌굴 한계)' },
                  ]}
                  value={inp.strainCriterion ?? 'yield'}
                  onChange={v => set({ strainCriterion: v })}
                />
              </EngRow>
              <div style={{ marginLeft: 110, marginTop: 2, padding: '4px 8px', background: '#f8f9fa', border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 10, color: T.textMuted, fontFamily: T.fontSans, lineHeight: 1.7 }}>
                {(inp.strainCriterion ?? 'yield') === 'yield'
                  ? <>
                      <strong>σ_y/E</strong> — 지침 부록C 표 C.2.3 (항복점 변형률 = 국부좌굴 개시변형률)<br/>
                      SS400 기준: 235/206000 = 0.114% — <em>보수적 기준</em>
                    </>
                  : <>
                      <strong>46t/D</strong> — ASCE Guidelines for Seismic Design of Oil &amp; Gas Pipeline / KDS 해설<br/>
                      t/D 비율 기반 국부좌굴 한계변형률 — σ_y/E 대비 약 3.3배 큰 값<br/>
                      <em>실무 프로젝트에서 널리 사용</em>
                    </>
                }
              </div>
            </>
          )}
        </EngPanel>

        {/* 지반 조건 */}
        <EngPanel title="③ 표층지반 조건">
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, fontFamily: T.fontSans }}>지반층 입력</span>
              <EngPopover title="지반층 H / Vs 입력">
                <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                  <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                    <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2.1</strong><br/>
                    지반 고유주기 TG 및 지반 전파속도 Vds 산정에 사용
                  </div>
                  <div style={{ fontSize: 11 }}>
                    각 지반층의 두께(H)와 전단파 속도(Vs)를 상부층부터 입력.<br/>
                    지반조사 시험(PS 검층, SPT 상관식) 결과 사용.
                  </div>
                  <div style={{ padding: '4px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 2, fontFamily: T.fontMono, fontSize: 11, marginTop: 6 }}>
                    TG = 4 × Σ(Hi / Vsi)  (고유주기)<br/>
                    Vds = Σ(Hi) / Σ(Hi/Vsi)  (평균 전단파 속도)
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginTop: 6 }}>
                    <thead>
                      <tr style={{ background: '#f0f4f8' }}>
                        <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>지반 상태</th>
                        <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>Vs 범위 (m/s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['연약 점토 (N < 4)', '< 100'],
                        ['연약 모래 (N = 5~10)', '100 ~ 150'],
                        ['보통 모래 (N = 10~30)', '150 ~ 250'],
                        ['조밀한 모래/자갈 (N > 30)', '250 ~ 400'],
                        ['연암 / 풍화암', '300 ~ 700'],
                      ].map(([d, vs], i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>{d}</td>
                          <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>{vs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                    지반조사 자료 없는 경우: 지반종류(SA~SE)에 상응하는<br/>
                    대표 Vs값(KDS 17 10 00 표 2.2.1) 사용 가능.
                  </div>
                </div>
              </EngPopover>
            </div>
            <LayerEditor layers={inp.layers} setLayers={setDetailLayers}/>
          </div>
          <EngDivider />
          <EngRow label="기반암 Vs (Vbs)" unit="m/s" popover={
            <EngPopover title="기반암 전단파 속도 Vbs">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 부록 C §C.2.1</strong><br/>
                  지반 전파속도 보정계수 ε 결정에 사용
                </div>
                <div style={{ padding: '4px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 2, fontFamily: T.fontMono, fontSize: 11 }}>
                  Vbs ≥ 300 m/s → ε = 1.0<br/>
                  Vbs &lt; 300 m/s → ε = 0.85
                </div>
                <div style={{ marginTop: 6, fontSize: 11 }}>
                  ε는 지진파가 기반암에서 표층지반으로 전파될 때<br/>
                  지반 내 전파 속도와 지진파 입력 속도의 비율 보정계수.<br/>
                  기반암이 단단할수록(Vs 높을수록) ε = 1.0 적용.
                </div>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  일반적인 기반암(연암 이상): Vbs = 500 ~ 800 m/s<br/>
                  지반조사 자료 없는 경우 Vbs = 500 m/s 권장
                </div>
              </div>
            </EngPopover>
          }>
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
              SDS_func={specFunc.SDS_func} SD1_func={specFunc.SD1_func}
              width={380} height={200}
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
