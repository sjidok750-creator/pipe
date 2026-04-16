import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import {
  SEISMIC_ZONE, SEISMIC_GRADE, SOIL_TYPE,
  KIND_INDEX, CONNECT_INDEX, FACIL_INDEX, MCONE_INDEX,
  calcFLEX,
} from '../../engine/seismicConstants.js'
import {
  EngPanel, EngSection, EngRow, EngInput,
  EngRadio, EngSegment, EngDivider,
} from '../../components/eng/EngLayout'
import { T } from '../../components/eng/tokens'
import { SoilProfileSVG } from '../../components/eng/diagrams/SoilProfileSVG'

export default function SeismicPrelimInputPage() {
  const navigate = useNavigate()
  const { prelimInputs: inp, setPrelimInputs: set, calcPrelim } = useSeismicStore()

  const Z = SEISMIC_ZONE[inp.zone as 'I'|'II'].Z
  const gradeInfo = SEISMIC_GRADE[inp.seismicGrade as 'I'|'II']
  const ratio = inp.DN / inp.thickness
  const FLEX = calcFLEX(ratio)

  function handleCalc() {
    const result = calcPrelim()
    if (result) navigate('/seismic-prelim/result')
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* ── 좌측 입력 패널 ─────────────────────────────── */}
      <div style={{ flex: '0 0 420px', minWidth: 360 }}>

        {/* 지진 조건 */}
        <EngPanel title="① 지진 조건">
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
                { key: 'I',  label: '내진 Ⅰ 등급', sub: `붕괴방지 ${gradeInfo.returnPeriod_collapse}년 / 기능수행 ${gradeInfo.returnPeriod_func}년` },
                { key: 'II', label: '내진 Ⅱ 등급', sub: `붕괴방지 ${SEISMIC_GRADE['II'].returnPeriod_collapse}년 / 기능수행 ${SEISMIC_GRADE['II'].returnPeriod_func}년` },
              ]}
              value={inp.seismicGrade}
              onChange={v => set({ seismicGrade: v })}
            />
          </EngRow>
          <EngRow label="도시권역">
            <EngRadio
              options={[
                { key: 'urban', label: '도시권역' },
                { key: 'other', label: '기타지역' },
              ]}
              value={inp.isUrban ? 'urban' : 'other'}
              onChange={v => set({ isUrban: v === 'urban' })}
            />
          </EngRow>
          <EngRow label="지반종류">
            <EngSegment
              options={Object.keys(SOIL_TYPE).map(k => ({ key: k, label: k }))}
              value={inp.soilType}
              onChange={v => set({ soilType: v })}
            />
          </EngRow>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, marginLeft: 110, fontFamily: T.fontSans }}>
            {SOIL_TYPE[inp.soilType as keyof typeof SOIL_TYPE]?.label}
          </div>

          <EngDivider label="설계지반가속도  S = Z × I" />
          <div style={{
            background: T.bgSection, border: `1px solid ${T.borderLight}`,
            padding: '6px 10px', fontSize: 11, fontFamily: T.fontMono,
          }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <span style={{ color: T.textMuted }}>붕괴방지 ({gradeInfo.returnPeriod_collapse}년) : </span>
                <strong style={{ color: T.textAccent }}>S = {Z} × {gradeInfo.I_collapse} = {(Z * gradeInfo.I_collapse).toFixed(3)} g</strong>
              </div>
              <div>
                <span style={{ color: T.textMuted }}>기능수행 ({gradeInfo.returnPeriod_func}년) : </span>
                <strong style={{ color: T.textAccent }}>S = {Z} × {gradeInfo.I_func} = {(Z * gradeInfo.I_func).toFixed(3)} g</strong>
              </div>
            </div>
          </div>
        </EngPanel>

        {/* 관로 제원 */}
        <EngPanel title="② 관로 제원">
          <EngRow label="관종">
            <EngRadio
              options={[
                { key: 'ductile',  label: '덕타일 주철관' },
                { key: 'steel',    label: '강관' },
                { key: 'concrete', label: '콘크리트관' },
                { key: 'pvc',      label: 'PVC관' },
              ]}
              value={inp.pipeKind}
              onChange={v => set({ pipeKind: v })}
            />
          </EngRow>
          <EngRow label="공칭관경 DN" unit="mm">
            <EngInput value={inp.DN} onChange={v => set({ DN: parseFloat(v)||300 })} min={50} max={3000} step={50} width={100}/>
          </EngRow>
          <EngRow label="관두께 t" unit="mm">
            <EngInput value={inp.thickness} onChange={v => set({ thickness: parseFloat(v)||8 })} min={1} step={0.5} width={100}/>
            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono }}>
              D/t = {ratio.toFixed(1)}  →  FLEX = {FLEX.toFixed(0)}
            </span>
          </EngRow>
        </EngPanel>

        {/* 취약도지수 세부지수 */}
        <EngPanel title="③ 취약도지수 세부지수">
          <EngRow label="이음부 상태 (CONNECT)">
            <EngRadio
              options={Object.entries(CONNECT_INDEX).map(([k, v]) => ({
                key: k, label: `${v.label}  (${v.score})`,
              }))}
              value={inp.connectCond}
              onChange={v => set({ connectCond: v })}
            />
          </EngRow>
          <EngDivider />
          <EngRow label="주요시설물 (FACIL)">
            <EngRadio
              options={Object.entries(FACIL_INDEX).map(([k, v]) => ({
                key: k, label: `${v.label}  (${v.score})`,
              }))}
              value={inp.facilExists}
              onChange={v => set({ facilExists: v })}
            />
          </EngRow>
          <EngDivider />
          <EngRow label="이음처리방법 (MCONE)">
            <EngRadio
              options={Object.entries(MCONE_INDEX).map(([k, v]) => ({
                key: k, label: `${v.label}  (${v.score})`,
              }))}
              value={inp.mcone}
              onChange={v => set({ mcone: v })}
            />
          </EngRow>
        </EngPanel>

        {/* 계산 버튼 */}
        <button
          onClick={handleCalc}
          style={{
            width: '100%', padding: '7px 0',
            background: T.bgActive, color: 'white', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            borderRadius: 2, fontFamily: T.fontSans, letterSpacing: 0.3,
          }}
        >
          취약도지수 산정 및 그룹 판정  ▶
        </button>
      </div>

      {/* ── 우측 삽도 패널 ─────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <EngPanel title="지반분류 단면도  (KDS 17 10 00)">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <SoilProfileSVG soilType={inp.soilType} pipeDepth={1.5}/>
          </div>
          {/* 지반분류 설명표 */}
          <EngDivider label="지반종류 분류 기준"/>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontSans }}>
            <thead>
              <tr style={{ background: T.bgSection }}>
                <th style={{ padding: '3px 6px', textAlign: 'center', border: `1px solid ${T.border}`, width: 40 }}>분류</th>
                <th style={{ padding: '3px 6px', textAlign: 'left',   border: `1px solid ${T.border}` }}>지반 특성</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SOIL_TYPE).map(([k, v], i) => (
                <tr key={k} style={{ background: k === inp.soilType ? '#dce8f5' : (i % 2 === 0 ? T.bgRowAlt : T.bgRow) }}>
                  <td style={{ padding: '3px 6px', textAlign: 'center', border: `1px solid ${T.borderLight}`, fontWeight: 700, color: k === inp.soilType ? T.bgActive : T.textPrimary, fontFamily: T.fontMono }}>
                    {k}
                  </td>
                  <td style={{ padding: '3px 6px', border: `1px solid ${T.borderLight}`, fontSize: 10 }}>
                    {v.label.replace(`${k} — `, '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </EngPanel>
      </div>
    </div>
  )
}
