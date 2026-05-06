import React, { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore.js'
import { T } from '../components/eng/tokens'
import type { ProjectMeta, Facility } from '../lib/projectRepo.js'
import { projectRepo } from '../lib/projectRepo.js'

const MODULE_LABEL: Record<string, string> = {
  structural:    '구조',
  seismicPrelim: '예비',
  seismicDetail: '상세',
}
const MODULE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  structural:    { bg: '#EEF3FF', text: '#1B3A66', border: '#C4D6EE' },
  seismicPrelim: { bg: '#FFF4E0', text: '#7A4800', border: '#F5CC80' },
  seismicDetail: { bg: '#EDFAF3', text: '#1A5C35', border: '#86EFAC' },
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
      fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap', fontFamily: T.fontSans, letterSpacing: '0.1px',
    }}>
      {MODULE_LABEL[id] ?? id}
    </span>
  )
}

// ── 프로젝트 열기 모달 ───────────────────────────────────────
function OpenProjectModal({ onClose }: { onClose: () => void }) {
  const { projects, openProject } = useProjectStore()
  const [query, setQuery] = useState('')

  const recent5 = projects.slice(0, 5)
  const filtered = query.trim()
    ? projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : recent5

  const handleSelect = (id: string) => {
    openProject(id)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 16, padding: '24px 22px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 16, fontFamily: T.fontSans }}>프로젝트 열기</div>

        <input
          autoFocus
          placeholder="프로젝트명 검색..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '9px 12px', borderRadius: 8,
            border: `1.5px solid ${T.border}`, fontSize: 13,
            fontFamily: T.fontSans, outline: 'none', marginBottom: 10,
            color: T.textPrimary,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 340, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '24px 0', fontFamily: T.fontSans }}>
              검색 결과 없음
            </div>
          )}
          {filtered.map(p => {
            const project = projectRepo.get(p.id)
            const facilityCount = project?.facilities.length ?? 0
            const date = new Date(p.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                  border: `1px solid ${T.borderLight}`, background: T.bgPanel,
                  cursor: 'pointer', width: '100%',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 4, fontFamily: T.fontSans }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {p.enabledModules.map(m => <ModuleBadge key={m} id={m} />)}
                    <span style={{ fontSize: 10, color: T.textDisabled, fontFamily: T.fontSans, marginLeft: 2 }}>
                      {facilityCount}개 시설물 · {date}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: T.bgActive, fontWeight: 700, flexShrink: 0, fontFamily: T.fontSans }}>열기 →</span>
              </button>
            )
          })}
        </div>

        {!query && projects.length > 5 && (
          <div style={{ fontSize: 11, color: T.textDisabled, textAlign: 'center', marginTop: 10, fontFamily: T.fontSans }}>
            최근 5개 표시 · 검색으로 더 찾기
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 8,
            border: `1px solid ${T.borderLight}`, background: 'none',
            fontSize: 13, color: T.textMuted, cursor: 'pointer', fontFamily: T.fontSans,
          }}
        >취소</button>
      </div>
    </div>
  )
}

// ── 시설물 행 ────────────────────────────────────────────────
function FacilityRow({ facility, enabledModules, onOpen, onSave, onDelete, isFirst }: {
  facility: Facility
  enabledModules: string[]
  onOpen: () => void
  onSave: () => void
  onDelete: () => void
  isFirst: boolean
}) {
  const date = new Date(facility.updatedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 16px',
      borderTop: isFirst ? 'none' : '1px solid #F2EFE9',
    }}>
      {/* 시설물 이름 + 메타 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 5, fontFamily: T.fontSans }}>
          {facility.name}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {enabledModules.map(m => <ModuleBadge key={m} id={m} />)}
          <span style={{ fontSize: 10, color: T.textDisabled, fontFamily: T.fontSans, marginLeft: 2 }}>
            저장됨 {date}
          </span>
          {facility.fileName && (
            <span style={{ fontSize: 10, color: T.textDisabled, fontFamily: T.fontSans }}>· {facility.fileName}</span>
          )}
        </div>
      </div>

      {/* 버튼 그룹 */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={onOpen}
          style={{
            padding: '6px 16px', borderRadius: 7,
            background: T.bgActive, color: 'white',
            border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: T.fontSans,
            letterSpacing: '0.2px', minHeight: 32,
          }}
        >열기</button>
        <button
          onClick={onSave}
          style={{
            padding: '5px 10px', borderRadius: 7,
            border: `1px solid ${T.border}`, background: 'none',
            fontSize: 11, color: T.textMuted, cursor: 'pointer',
            fontFamily: T.fontSans, minHeight: 32, display: 'flex', alignItems: 'center', gap: 3,
          }}
        >
          <svg width="11" height="12" viewBox="0 0 12 14" fill="none"><path d="M2 1h6.5L11 3.5V13H2V1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M4 1v3.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 8h4M4 10.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          저장
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '5px 10px', borderRadius: 7,
            border: '1px solid #EDCAC6', background: 'none',
            fontSize: 11, color: '#B83B2B', cursor: 'pointer',
            fontFamily: T.fontSans, minHeight: 32,
          }}
        >삭제</button>
      </div>
    </div>
  )
}

// ── 열린 프로젝트 카드 ───────────────────────────────────────
function ProjectCard({ meta }: { meta: ProjectMeta }) {
  const navigate = useNavigate()
  const { open, closeProject, addFacility, deleteFacility, saveFacilityToFile, projectId: activeProjectId } = useProjectStore()
  const [showAdd, setShowAdd] = useState(false)
  const [addingName, setAddingName] = useState('')

  const project = projectRepo.get(meta.id)
  const facilities = project?.facilities ?? []
  const date = new Date(meta.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  const isActive = meta.id === activeProjectId

  const handleOpenFacility = async (facilityId: string) => {
    await open(meta.id, facilityId)
    const first = meta.enabledModules[0]
    navigate(first ? MODULE_PATH[first] ?? '/' : '/structural/input')
  }

  const handleSaveFacility = async (facilityId: string) => {
    await open(meta.id, facilityId)
    await saveFacilityToFile()
  }

  const handleAddFacility = async () => {
    const name = addingName.trim() || `시설물 ${String(facilities.length + 1).padStart(3, '0')}`
    await open(meta.id)
    await addFacility(name)
    const first = meta.enabledModules[0]
    navigate(first ? MODULE_PATH[first] ?? '/' : '/structural/input')
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: isActive ? `1.5px solid #CC6B3D` : `1px solid #E6E2DB`,
      borderRadius: 12,
      boxShadow: isActive
        ? '0 2px 16px rgba(204,107,61,0.10), 0 1px 3px rgba(26,21,18,0.05)'
        : '0 1px 4px rgba(26,21,18,0.06)',
      overflow: 'hidden',
    }}>
      {/* 프로젝트 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '13px 16px',
        background: isActive ? '#FEF9F6' : 'white',
      }}>
        {isActive && (
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#CC6B3D', flexShrink: 0, display: 'inline-block',
          }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: T.textPrimary,
            marginBottom: 5, fontFamily: T.fontSans, lineHeight: 1.2,
          }}>{meta.name}</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {meta.enabledModules.map(m => <ModuleBadge key={m} id={m} />)}
            <span style={{
              fontSize: 10, color: T.textDisabled,
              fontFamily: T.fontSans, marginLeft: 2,
            }}>
              {facilities.length}개 시설물 · {date}
            </span>
          </div>
        </div>
        <button
          onClick={() => closeProject(meta.id)}
          style={{
            padding: '4px 12px', borderRadius: 6,
            border: `1px solid #E6E2DB`, background: 'none',
            fontSize: 11, color: T.textMuted, cursor: 'pointer',
            fontFamily: T.fontSans, flexShrink: 0, minHeight: 28,
          }}
        >닫기</button>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: '#F0EDE7' }} />

      {/* 시설물 목록 */}
      <div style={{ padding: '4px 0' }}>
        {facilities.map((f, i) => (
          <FacilityRow
            key={f.id}
            facility={f}
            enabledModules={meta.enabledModules}
            isFirst={i === 0}
            onOpen={() => handleOpenFacility(f.id)}
            onSave={() => handleSaveFacility(f.id)}
            onDelete={() => {
              if (window.confirm(`"${f.name}" 시설물을 삭제하시겠습니까?`))
                deleteFacility(meta.id, f.id)
            }}
          />
        ))}

        {/* 시설물 추가 */}
        <div style={{
          padding: '8px 16px 10px',
          borderTop: facilities.length > 0 ? '1px solid #F2EFE9' : 'none',
        }}>
          {showAdd ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                autoFocus
                placeholder={`시설물 ${String(facilities.length + 1).padStart(3, '0')}`}
                value={addingName}
                onChange={e => setAddingName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddFacility()
                  if (e.key === 'Escape') setShowAdd(false)
                }}
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: 7,
                  border: `1.5px solid ${T.bgActive}`, fontSize: 12,
                  fontFamily: T.fontSans, outline: 'none', color: T.textPrimary,
                }}
              />
              <button
                onClick={handleAddFacility}
                style={{
                  padding: '6px 14px', borderRadius: 7,
                  background: T.bgActive, color: 'white',
                  border: 'none', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: T.fontSans,
                }}
              >추가</button>
              <button
                onClick={() => { setShowAdd(false); setAddingName('') }}
                style={{
                  padding: '6px 10px', borderRadius: 7,
                  border: `1px solid ${T.border}`, background: 'none',
                  fontSize: 12, color: T.textMuted, cursor: 'pointer',
                  fontFamily: T.fontSans,
                }}
              >취소</button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: '5px 12px', borderRadius: 7,
                border: `1px dashed #C8C3BC`, background: 'none',
                fontSize: 11, color: T.textMuted, cursor: 'pointer',
                fontFamily: T.fontSans, display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1, marginTop: -1 }}>+</span> 시설물 추가
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export default function Home() {
  const { projects, openedProjectIds, openNewModal } = useProjectStore()
  const [showOpenModal, setShowOpenModal] = useState(false)

  const openedProjects = useMemo(() =>
    openedProjectIds
      .map(id => projects.find(p => p.id === id))
      .filter(Boolean) as ProjectMeta[],
    [openedProjectIds, projects]
  )

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

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
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(250,247,241,0.42)', marginBottom: 8 }}>
            Pipeline Inspection &amp; Performance Evaluation Reviewer
          </div>
          <div style={{ fontSize: 10, color: 'rgba(250,247,241,0.45)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
            KDS 57 00 00 : 2022 — 매설관로 구조·내진 안전성 자동 검토
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {['KDS 57 10 00', 'KDS 57 17 00', 'KS D 3565', 'KS D 4311', 'DB-24', 'AWWA M11', 'DIPRA'].map(b => (
              <span key={b} style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(173,198,229,0.25)', color: 'rgba(255,255,255,0.55)', fontFamily: T.fontMono }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 액션 툴바 */}
      <div style={{
        display: 'flex', gap: 8, background: 'white',
        border: `1px solid #E6E2DB`,
        borderRadius: 12, padding: '10px 14px',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(26,21,18,0.05)',
      }}>
        {/* 새 평가 */}
        <button
          onClick={openNewModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 8,
            background: T.bgActive, color: 'white',
            border: 'none', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', minHeight: 38, fontFamily: T.fontSans,
            boxShadow: '0 1px 4px rgba(204,107,61,0.25)',
            letterSpacing: '0.1px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><line x1="11" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="12.5" y1="3.5" x2="12.5" y2="6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          새 평가
        </button>

        <div style={{ width: 1, height: 22, background: '#E6E2DB', flexShrink: 0 }} />

        {/* 프로젝트 열기 */}
        <button
          onClick={() => setShowOpenModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 8,
            background: 'white', border: `1px solid #E0DDD7`,
            color: T.textLabel, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', minHeight: 38, fontFamily: T.fontSans,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1.5 5.5C1.5 4.67 2.17 4 3 4H6.5L8 5.5H13C13.83 5.5 14.5 6.17 14.5 7V12C14.5 12.83 13.83 13.5 13 13.5H3C2.17 13.5 1.5 12.83 1.5 12V5.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
          프로젝트 열기
        </button>

        <Link
          to="/admin"
          style={{
            marginLeft: 'auto', fontSize: 10, color: T.textDisabled,
            fontFamily: T.fontSans, textDecoration: 'none',
          }}
        >관리 ⚙</Link>
      </div>

      {/* 열린 프로젝트 목록 */}
      {openedProjects.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {openedProjects.map(meta => (
            <ProjectCard key={meta.id} meta={meta} />
          ))}
        </div>
      )}

      {openedProjects.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px 16px',
          color: T.textDisabled, fontSize: 13, fontFamily: T.fontSans,
          lineHeight: 1.6,
        }}>
          새 평가를 시작하거나 프로젝트를 열어주세요
        </div>
      )}

      {showOpenModal && <OpenProjectModal onClose={() => setShowOpenModal(false)} />}
    </div>
  )
}
