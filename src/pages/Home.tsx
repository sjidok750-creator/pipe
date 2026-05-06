import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore.js'
import { useStore } from '../store/useStore.js'
import { useSeismicStore } from '../store/useSeismicStore.js'
import { getSession } from '../lib/startup.js'
import { T } from '../components/eng/tokens'
import type { ProjectMeta, Facility } from '../lib/projectRepo.js'
import { projectRepo } from '../lib/projectRepo.js'

const MODULE_LABEL: Record<string, string> = {
  structural:    '구조',
  seismicPrelim: '예비',
  seismicDetail: '상세',
}
const MODULE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  structural:    { bg: '#EEF3FF', text: '#1B3A66', border: '#ADC6E5' },
  seismicPrelim: { bg: '#FFF7E6', text: '#7A4800', border: '#F5CC80' },
  seismicDetail: { bg: '#F0FDF4', text: '#1A5C35', border: '#86EFAC' },
}
const MODULE_PATH: Record<string, string> = {
  structural:    '/structural/input',
  seismicPrelim: '/seismic-prelim/input',
  seismicDetail: '/seismic-detail/input',
}

function PiperIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', flexShrink: 0 }}>
      <rect width="100" height="100" rx="18" fill="#F4EFE6"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#1F1B17" strokeWidth="3.5"/>
      <circle cx="50" cy="50" r="22" fill="none" stroke="#1F1B17" strokeWidth="1.2" strokeDasharray="1.2 1.6"/>
      <path d="M 8 50 L 28 50 L 33 50 L 36 38 L 40 62 L 44 32 L 48 68 L 52 44 L 56 56 L 60 50 L 92 50"
        fill="none" stroke="#D97757" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="50" cy="50" r="2" fill="#1F1B17"/>
    </svg>
  )
}

function ModuleBadge({ id }: { id: string }) {
  const c = MODULE_COLOR[id] ?? { bg: '#F5F5F5', text: '#555', border: '#DDD' }
  return (
    <span style={{
      fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {MODULE_LABEL[id] ?? id}
    </span>
  )
}

function IconNew() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="11" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="12.5" y1="3.5" x2="12.5" y2="6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="4.5" y1="6" x2="8.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4.5" y1="8.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
function IconOpen() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 5.5C1.5 4.67 2.17 4 3 4H6.5L8 5.5H13C13.83 5.5 14.5 6.17 14.5 7V12C14.5 12.83 13.83 13.5 13 13.5H3C2.17 13.5 1.5 12.83 1.5 12V5.5Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  )
}

// ── 임시 작업본 카드 ─────────────────────────────────────────
function SessionCard() {
  const navigate = useNavigate()
  const { projectName, enabledModules, activeFacilityName, discardSession, saveFacilityToFile } = useProjectStore()

  const session = getSession()
  if (!session) return null

  const hasData = session.structural?.inputs || session.seismicPrelim?.inputs || session.seismicDetail?.inputs
  if (!hasData) return null

  const firstPath = enabledModules.length > 0
    ? MODULE_PATH[enabledModules[0]] ?? '/'
    : '/structural/input'

  return (
    <div style={{
      background: '#FEF7F3',
      border: `1.5px solid ${T.borderFocus}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative',
    }}>
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: T.bgActive, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: T.bgActive, fontWeight: 700, marginBottom: 2, letterSpacing: 0.3 }}>
          ● 임시 작업본
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {projectName || '새 프로젝트'}
        </div>
        {activeFacilityName && (
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{activeFacilityName}</div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {enabledModules.map((m: string) => <ModuleBadge key={m} id={m} />)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        <button
          onClick={() => navigate(firstPath)}
          style={{
            padding: '7px 14px', borderRadius: 7,
            background: T.bgActive, color: 'white',
            border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
            minHeight: 34, touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        >
          계속하기 →
        </button>
        <button
          onClick={() => saveFacilityToFile()}
          style={{
            padding: '7px 14px', borderRadius: 7,
            background: 'white', color: T.bgActive,
            border: `1.5px solid ${T.bgActive}`,
            fontSize: 11, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
            minHeight: 32, touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        >
          📄 파일로 저장
        </button>
      </div>

      <button
        onClick={() => { if (window.confirm('진행 중인 작업을 삭제하시겠습니까?')) discardSession() }}
        title="작업 삭제"
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 22, height: 22, borderRadius: '50%',
          border: `1px solid ${T.border}`, background: 'white',
          color: T.textMuted, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, cursor: 'pointer', touchAction: 'manipulation',
        }}
      >×</button>
    </div>
  )
}

// ── 시설물 행 ────────────────────────────────────────────────
function FacilityRow({
  facility, projectId, enabledModules, onOpen, onSave, onDelete,
}: {
  facility: Facility
  projectId: string
  enabledModules: string[]
  onOpen: () => void
  onSave: () => void
  onDelete: () => void
}) {
  const date = new Date(facility.updatedAt).toLocaleString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px 8px 28px',
      background: T.bgApp,
      borderLeft: `2px solid ${T.borderLight}`,
      marginLeft: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 3 }}>
          {facility.name}
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 2 }}>
          {enabledModules.map(m => <ModuleBadge key={m} id={m} />)}
        </div>
        <div style={{ fontSize: 10, color: T.textDisabled, fontFamily: T.fontMono }}>
          저장됨 {date}
          {facility.fileName && <span style={{ marginLeft: 6 }}>· 📄 {facility.fileName}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <button
          onClick={onOpen}
          style={{
            padding: '5px 12px', borderRadius: 6,
            background: T.bgActive, color: 'white',
            border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', minHeight: 30,
            touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        >열기</button>
        <button
          onClick={onSave}
          title="파일로 저장"
          style={{
            padding: '5px 10px', borderRadius: 6,
            border: `1px solid ${T.borderLight}`, background: 'none',
            fontSize: 11, color: T.textMuted, cursor: 'pointer',
            minHeight: 30, touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        >📄 저장</button>
        <button
          onClick={onDelete}
          style={{
            padding: '5px 10px', borderRadius: 6,
            border: '1px solid #fcc', background: 'none',
            fontSize: 11, color: '#c0392b', cursor: 'pointer',
            minHeight: 30, touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        >삭제</button>
      </div>
    </div>
  )
}

// ── 프로젝트 카드 (펼침/접힘) ────────────────────────────────
function ProjectCard({ meta }: { meta: ProjectMeta }) {
  const navigate = useNavigate()
  const { open, deleteProject, exportJSON, addFacility, saveProjectToFolder } = useProjectStore()
  const [expanded, setExpanded] = useState(true)
  const [addingName, setAddingName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const project = projectRepo.get(meta.id)
  const facilities = project?.facilities ?? []

  const handleOpenFacility = async (facilityId: string) => {
    await open(meta.id, facilityId)
    const first = meta.enabledModules[0]
    navigate(first ? MODULE_PATH[first] ?? '/' : '/structural/input')
  }

  const handleSaveFacility = async (facilityId: string) => {
    await open(meta.id, facilityId)
    const { saveFacilityToFile } = useProjectStore.getState()
    await saveFacilityToFile()
  }

  const handleAddFacility = async () => {
    const name = addingName.trim() || `시설물 ${String(facilities.length + 1).padStart(3, '0')}`
    await open(meta.id)
    await addFacility(name)
    const first = meta.enabledModules[0]
    navigate(first ? MODULE_PATH[first] ?? '/' : '/structural/input')
  }

  const date = new Date(meta.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

  return (
    <div style={{
      background: T.bgPanel,
      border: `1px solid ${T.borderLight}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* 프로젝트 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        cursor: 'pointer',
        borderBottom: expanded ? `1px solid ${T.borderLight}` : 'none',
      }} onClick={() => setExpanded(v => !v)}>
        <span style={{ fontSize: 13, color: T.textMuted, flexShrink: 0 }}>
          {expanded ? '▾' : '▸'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 2 }}>
            {meta.name}
          </div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {meta.enabledModules.map(m => <ModuleBadge key={m} id={m} />)}
            <span style={{ fontSize: 10, color: T.textDisabled, fontFamily: T.fontMono, marginLeft: 4, alignSelf: 'center' }}>
              {facilities.length}개 시설물 · {date}
            </span>
          </div>
        </div>

        {/* 프로젝트 액션 */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => saveProjectToFolder()}
            title="프로젝트 전체 저장 (폴더)"
            style={{
              padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${T.borderLight}`, background: 'none',
              fontSize: 11, color: T.textMuted, cursor: 'pointer',
              minHeight: 30, touchAction: 'manipulation', fontFamily: T.fontSans,
            }}
          >📁 프로젝트 저장</button>
          <button
            onClick={() => { if (window.confirm(`"${meta.name}" 프로젝트를 삭제하시겠습니까?`)) deleteProject(meta.id) }}
            style={{
              padding: '5px 10px', borderRadius: 6,
              border: '1px solid #fcc', background: 'none',
              fontSize: 11, color: '#c0392b', cursor: 'pointer',
              minHeight: 30, touchAction: 'manipulation', fontFamily: T.fontSans,
            }}
          >삭제</button>
        </div>
      </div>

      {/* 시설물 목록 */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '6px 0' }}>
          {facilities.map(f => (
            <FacilityRow
              key={f.id}
              facility={f}
              projectId={meta.id}
              enabledModules={meta.enabledModules}
              onOpen={() => handleOpenFacility(f.id)}
              onSave={() => handleSaveFacility(f.id)}
              onDelete={() => {
                if (window.confirm(`"${f.name}" 시설물을 삭제하시겠습니까?`)) {
                  const { deleteFacility } = useProjectStore.getState()
                  deleteFacility(meta.id, f.id)
                }
              }}
            />
          ))}

          {/* 시설물 추가 */}
          <div style={{ padding: '6px 12px 6px 28px', marginLeft: 12 }}>
            {showAdd ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  autoFocus
                  placeholder={`시설물 ${String(facilities.length + 1).padStart(3, '0')}`}
                  value={addingName}
                  onChange={e => setAddingName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddFacility(); if (e.key === 'Escape') setShowAdd(false) }}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6,
                    border: `1.5px solid ${T.bgActive}`, fontSize: 12,
                    fontFamily: T.fontSans, outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddFacility}
                  style={{
                    padding: '6px 12px', borderRadius: 6,
                    background: T.bgActive, color: 'white',
                    border: 'none', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: T.fontSans,
                  }}
                >추가</button>
                <button
                  onClick={() => setShowAdd(false)}
                  style={{
                    padding: '6px 10px', borderRadius: 6,
                    border: `1px solid ${T.borderLight}`, background: 'none',
                    fontSize: 12, color: T.textMuted, cursor: 'pointer', fontFamily: T.fontSans,
                  }}
                >취소</button>
              </div>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  padding: '5px 12px', borderRadius: 6,
                  border: `1px dashed ${T.borderLight}`, background: 'none',
                  fontSize: 11, color: T.textMuted, cursor: 'pointer',
                  fontFamily: T.fontSans, touchAction: 'manipulation',
                }}
              >+ 시설물 추가</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { projects, openNewModal, importJSON } = useProjectStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const id = await importJSON(file) as string
      const proj = projects.find((p: ProjectMeta) => p.id === id)
      const first = proj?.enabledModules[0]
      navigate(first ? MODULE_PATH[first] ?? '/' : '/structural/input')
    } catch (err: any) {
      alert(err.message ?? '파일을 불러올 수 없습니다.')
    }
    e.target.value = ''
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* 앱 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #1C1917 0%, #252119 50%, #2D2520 100%)',
        borderRadius: 12, padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 18,
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <PiperIcon size={72} />
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700, color: '#FAF7F1', letterSpacing: '-0.6px', lineHeight: 1 }}>PIPER</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(250,247,241,0.42)', marginBottom: 8, letterSpacing: 0.2 }}>
            Pipeline Inspection &amp; Performance Evaluation Reviewer
          </div>
          <div style={{ fontSize: 10, color: 'rgba(250,247,241,0.45)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, letterSpacing: 0.2 }}>
            KDS 57 00 00 : 2022 — 매설관로 구조·내진 안전성 자동 검토
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {['KDS 57 10 00', 'KDS 57 17 00', 'KS D 3565', 'KS D 4311', 'DB-24', 'AWWA M11', 'DIPRA'].map(b => (
              <span key={b} style={{
                fontSize: 9.5, padding: '2px 7px', borderRadius: 3,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(173,198,229,0.25)',
                color: 'rgba(255,255,255,0.55)', fontFamily: T.fontMono, letterSpacing: 0.3,
              }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 액션 툴바 */}
      <div style={{
        display: 'flex', gap: 8, background: T.bgPanel,
        border: `1px solid ${T.borderLight}`, borderRadius: 10, padding: '10px 14px',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontSans, marginRight: 4 }}>평가 시작:</span>
        <button
          onClick={openNewModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 7,
            background: T.bgActive, color: 'white',
            border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', minHeight: 36,
            touchAction: 'manipulation', fontFamily: T.fontSans, boxShadow: T.shadow1,
          }}
        ><IconNew /> 새 평가</button>

        <div style={{ width: 1, height: 24, background: T.borderLight, margin: '0 2px' }} />

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 7,
            background: T.bgPanelAlt, border: `1px solid ${T.border}`,
            color: T.textLabel, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', minHeight: 36,
            touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        ><IconOpen /> 파일 열기</button>

        <input ref={fileInputRef} type="file" accept=".json,.piper.json" style={{ display: 'none' }} onChange={handleImport} />
        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textDisabled, fontFamily: T.fontSans }}>.piper.json</span>
      </div>

      {/* 임시 작업본 */}
      <SessionCard />

      {/* 저장된 프로젝트 */}
      {projects.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, padding: '4px 2px 6px', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            저장된 프로젝트
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects.map((meta: ProjectMeta) => (
              <ProjectCard key={meta.id} meta={meta} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
