import React, { useState } from 'react'
import { useProjectStore } from '../store/useProjectStore.js'
import {
  FACILITY_META_FIELDS, PROJECT_META_FIELDS, emptyProjectMeta, emptyFacilityMeta,
  collectReportFacilities, structuralView, seismicView, segLabel, safetyAssessment, f,
} from '../lib/report/projectReport.js'
import { exportFinalReportHwpx } from '../lib/hwpx/finalReportHwpx.js'
import { exportAppendixHwpx } from '../lib/hwpx/appendixHwpx.js'
import { EngPanel, EngDivider } from '../components/eng/EngLayout'
import { T } from '../components/eng/tokens'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '3px 6px', fontSize: 11, fontFamily: T.fontSans,
  border: `1px solid ${T.border}`, borderRadius: 2, background: 'white', color: T.textPrimary,
}
const th: React.CSSProperties = {
  padding: '4px 6px', border: `1px solid ${T.borderLight}`, background: T.bgSection,
  fontSize: 11, fontWeight: 700, fontFamily: T.fontSans, textAlign: 'left', whiteSpace: 'nowrap',
}
const td: React.CSSProperties = {
  padding: '3px 6px', border: `1px solid ${T.borderLight}`, fontSize: 11, fontFamily: T.fontSans,
}
const btn = (primary?: boolean): React.CSSProperties => ({
  padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 2,
  fontFamily: T.fontSans, border: primary ? 'none' : `1px solid ${T.border}`,
  background: primary ? T.bgActive : 'white', color: primary ? 'white' : T.textAccent,
})

export default function ProjectReportPage() {
  const {
    projectId, getSavedProject, save,
    setFacilityReportMeta, setProjectReportMeta,
  } = useProjectStore()

  // tick — 메타 수정 후 저장본을 다시 읽기 위한 갱신 트리거
  const [tick, setTick] = useState(0)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  void tick
  const project = projectId ? getSavedProject(projectId) : null
  const pMeta = { ...emptyProjectMeta(), ...(project?.meta?.reportMeta ?? {}) }
  const facs = project ? collectReportFacilities(project) : []

  function patchProject(key: string, value: string) {
    if (!projectId) return
    setProjectReportMeta(projectId, { [key]: value })
    setTick(t => t + 1)
  }
  function patchFacility(facilityId: string, key: string, value: string) {
    if (!projectId) return
    setFacilityReportMeta(projectId, facilityId, { [key]: value })
    setTick(t => t + 1)
  }

  async function runExport(kind: 'final' | 'appendix') {
    if (!project) return
    setBusy(kind); setMsg('')
    try {
      await save()                                   // 현재 편집 중인 시설물 반영
      const fresh = getSavedProject(projectId)
      const meta = { ...emptyProjectMeta(), ...(fresh?.meta?.reportMeta ?? {}) }
      const name = kind === 'final'
        ? await exportFinalReportHwpx({ project: fresh, projectMeta: meta })
        : await exportAppendixHwpx({ project: fresh, projectMeta: meta })
      setMsg(`${name} 내려받기 완료`)
      setTick(t => t + 1)
    } catch (e) {
      setMsg(`내보내기 실패: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy('')
    }
  }

  if (!project) {
    return (
      <div style={{ padding: 24, fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
        열려 있는 프로젝트가 없습니다. 상단 [+ 프로젝트]에서 프로젝트를 만들거나 열어 주십시오.
      </div>
    )
  }

  const sa = safetyAssessment(facs)

  return (
    <div style={{ fontFamily: T.fontSans }}>

      {/* ① 내보내기 */}
      <EngPanel title="① 최종 보고서 내보내기 (한글 .hwpx)">
        <div style={{ fontSize: 12, lineHeight: 1.7, color: T.textLabel, marginBottom: 10 }}>
          프로젝트에 등록된 <b>{facs.length}개 시설물(관로 구간)</b>의 계산 결과를 모아
          「제{pMeta.chapterNo}장 안전성 및 내진성능평가 결과」와 「부록 상세 계산서」를 생성합니다.<br />
          서식 견본: <code>templates/제3장 안전성 및 내진성능평가 결과.hwpx</code> ·{' '}
          <code>templates/부록 - 구조안전성 및 내진성능평가 상세계산서.hwpx</code>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={btn(true)} disabled={!!busy} onClick={() => runExport('final')}>
            {busy === 'final' ? '생성 중…' : `제${pMeta.chapterNo}장 최종보고서 (.hwpx)`}
          </button>
          <button style={btn()} disabled={!!busy} onClick={() => runExport('appendix')}>
            {busy === 'appendix' ? '생성 중…' : '부록 상세 계산서 (.hwpx)'}
          </button>
          {msg && <span style={{ fontSize: 11, color: msg.includes('실패') ? '#c0392b' : '#1a6b3a' }}>{msg}</span>}
        </div>
      </EngPanel>

      {/* ② 시설물 계산 상태 */}
      <EngPanel title="② 수록 대상 시설물 및 계산 상태">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>시설물</th>
              <th style={th}>계통 / 구간</th>
              <th style={th}>구조안전성</th>
              <th style={th}>예비평가</th>
              <th style={th}>상세평가</th>
            </tr>
          </thead>
          <tbody>
            {facs.map(fx => {
              const sv = structuralView(fx), dv = seismicView(fx)
              const cell = (okv: boolean, txt: string) => (
                <td style={{ ...td, color: okv ? '#1a6b3a' : T.textMuted, fontFamily: T.fontMono }}>{okv ? txt : '미산정'}</td>
              )
              return (
                <tr key={fx.id}>
                  <td style={{ ...td, fontWeight: 700 }}>{fx.name}</td>
                  <td style={td}>{fx.m.system || '—'} {segLabel(fx.m)}</td>
                  {cell(!!sv, `SF ${f(sv?.SF, 2)} / 등급 ${sv?.grade ?? '—'}`)}
                  {cell(!!fx.p, `VI ${f(fx.p?.VI, 1)}`)}
                  {cell(!!dv, `Σε/εa ${f(dv?.ratio, 3)}`)}
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 8, fontSize: 11, color: T.textMuted }}>
          안전성평가 (세부지침 11-133 표 11.74) : {sa.text}
        </div>
      </EngPanel>

      {/* ③ 보고서 표제 정보 */}
      <EngPanel title="③ 보고서 표제 정보">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {PROJECT_META_FIELDS.map(fd => (
              <tr key={fd.key}>
                <td style={{ ...th, width: 130 }}>{fd.label}</td>
                <td style={td}>
                  <input
                    style={inputStyle}
                    placeholder={fd.ph}
                    defaultValue={pMeta[fd.key as keyof typeof pMeta] ?? ''}
                    onBlur={e => patchProject(fd.key, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 6, fontSize: 10, color: T.textMuted }}>
          ※ 입력하지 않은 항목은 보고서에 <b>—</b> 로 인쇄됩니다 (임의 값으로 채우지 않습니다).
        </div>
      </EngPanel>

      {/* ④ 시설물별 보고서 서술정보 */}
      <EngPanel title="④ 시설물별 보고서 서술정보 (측점·연장·주상도 등)">
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>
          계산으로 산출되지 않는 조사·현황 정보입니다. 입력값은 프로젝트에 저장되어 보고서 표에 그대로 인쇄됩니다.
        </div>
        {facs.map((fx, i) => (
          <div key={fx.id} style={{ marginBottom: 14 }}>
            <EngDivider label={`${i + 1}. ${fx.name}`} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 6 }}>
              {FACILITY_META_FIELDS.map(fd => (
                <label key={fd.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, color: T.textLabel, fontWeight: 600 }}>{fd.label}</span>
                  <input
                    style={inputStyle}
                    placeholder={fd.ph}
                    defaultValue={{ ...emptyFacilityMeta(), ...fx.m }[fd.key] ?? ''}
                    onBlur={e => patchFacility(fx.id, fd.key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
        {!facs.length && (
          <div style={{ fontSize: 12, color: T.textMuted }}>
            등록된 시설물이 없습니다. 프로젝트에 관로 구간(시설물)을 추가하십시오.
          </div>
        )}
      </EngPanel>

      <div style={{ fontSize: 10, color: T.textMuted, padding: '0 4px 12px' }}>
        근거 : 세부지침 11-133 ~ 11-138 (구조검토·안전성평가) / 기존시설물(상수도) 내진성능 평가요령 (내진성능평가).
        표 번호·절 구성은 서식 견본과 동일한 체계를 따릅니다.
      </div>
    </div>
  )
}
