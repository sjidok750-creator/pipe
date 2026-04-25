import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore.js'
import { useStore } from '../store/useStore.js'
import { useSeismicStore } from '../store/useSeismicStore.js'
import { getSession } from '../lib/startup.js'
import { T } from '../components/eng/tokens'
import type { ProjectMeta } from '../lib/projectRepo.js'

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

// ── 앱 아이콘 — 관로 단면도 스타일 ─────────────────────────────
function AppIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      {/* 배경 */}
      <rect width="48" height="48" rx="11" fill="#0B1E36" />
      {/* 관 외경 — 두꺼운 링 */}
      <circle cx="24" cy="24" r="15" fill="none" stroke="#ADC6E5" strokeWidth="6" />
      {/* 관 내경 — 점선 */}
      <circle cx="24" cy="24" r="7.5" fill="none" stroke="#3A6FB0" strokeWidth="1.2" strokeDasharray="2.5 2" />
      {/* 중심 십자 */}
      <line x1="20" y1="24" x2="28" y2="24" stroke="#5599DD" strokeWidth="1.2" />
      <line x1="24" y1="20" x2="24" y2="28" stroke="#5599DD" strokeWidth="1.2" />
      {/* 우상단 KDS 마크 점 */}
      <circle cx="36" cy="12" r="3" fill="#FFE600" />
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

// ── 진행 중인 세션 카드 ──────────────────────────────────────
function SessionCard() {
  const navigate = useNavigate()
  const { projectName, enabledModules, discardSession } = useProjectStore()
  const hasStructural = useStore(s => !!s.result)
  const hasPrelim = useSeismicStore(s => !!s.prelimResult)
  const hasDetail = useSeismicStore(s => !!s.detailResult)

  const session = getSession()
  if (!session) return null

  const hasData =
    session.structural?.inputs ||
    session.seismicPrelim?.inputs ||
    session.seismicDetail?.inputs
  if (!hasData) return null

  const displayName = projectName || '이전 작업 (미저장)'
  const modules = enabledModules.length > 0
    ? enabledModules
    : ['structural', 'seismicPrelim', 'seismicDetail'].filter(m => {
        if (m === 'structural')    return hasStructural
        if (m === 'seismicPrelim') return hasPrelim
        if (m === 'seismicDetail') return hasDetail
        return false
      })

  const firstPath = modules.length > 0
    ? MODULE_PATH[modules[0]] ?? '/'
    : '/structural/input'

  return (
    <div style={{
      background: '#EEF4FF',
      border: `1.5px solid ${T.borderFocus}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative',
    }}>
      {/* 왼쪽 액센트 바 */}
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: T.bgActive, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: T.bgActive, fontWeight: 700, marginBottom: 3, letterSpacing: 0.3 }}>
          ● 진행 중인 작업
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700, color: T.textPrimary,
          marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayName}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {modules.map(m => <ModuleBadge key={m} id={m} />)}
        </div>
      </div>

      <button
        onClick={() => navigate(firstPath)}
        style={{
          padding: '9px 18px', borderRadius: 7,
          background: T.bgActive, color: 'white',
          border: 'none', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
          minHeight: 40, touchAction: 'manipulation',
          fontFamily: T.fontSans,
        }}
      >
        계속하기 →
      </button>

      {/* 세션 삭제 버튼 */}
      <button
        onClick={() => { if (window.confirm('진행 중인 작업을 삭제하시겠습니까?')) discardSession() }}
        title="작업 삭제"
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 22, height: 22, borderRadius: '50%',
          border: `1px solid ${T.border}`, background: 'white',
          color: T.textMuted, fontSize: 13, lineHeight: '20px',
          textAlign: 'center', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, touchAction: 'manipulation',
        }}
      >
        ×
      </button>
    </div>
  )
}

// ── 저장된 프로젝트 카드 ─────────────────────────────────────
function ProjectCard({ meta }: { meta: ProjectMeta }) {
  const navigate = useNavigate()
  const { open, deleteProject, exportJSON } = useProjectStore()

  const handleLoad = async () => {
    await open(meta.id)
    const first = meta.enabledModules[0]
    navigate(first ? MODULE_PATH[first] ?? '/' : '/structural/input')
  }

  const date = new Date(meta.updatedAt).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{
      background: T.bgPanel,
      border: `1px solid ${T.borderLight}`,
      borderRadius: 8,
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
      transition: 'border-color 120ms',
    }}>
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: T.bgActive, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: T.textPrimary,
          marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {meta.name}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 3 }}>
          {meta.enabledModules.map(m => <ModuleBadge key={m} id={m} />)}
        </div>
        <div style={{ fontSize: 10, color: T.textDisabled, fontFamily: T.fontMono }}>{date}</div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <button
          onClick={handleLoad}
          style={{
            padding: '6px 14px', borderRadius: 6,
            background: T.bgActive, color: 'white',
            border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', minHeight: 32,
            touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        >
          열기
        </button>
        <button
          onClick={() => exportJSON(meta.id)}
          title="JSON 내보내기"
          style={{
            padding: '6px 10px', borderRadius: 6,
            border: `1px solid ${T.borderLight}`, background: 'none',
            fontSize: 11, color: T.textMuted, cursor: 'pointer',
            minHeight: 32, touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        >
          내보내기
        </button>
        <button
          onClick={() => { if (window.confirm(`"${meta.name}" 삭제하시겠습니까?`)) deleteProject(meta.id) }}
          title="삭제"
          style={{
            padding: '6px 10px', borderRadius: 6,
            border: '1px solid #fcc', background: 'none',
            fontSize: 11, color: '#c0392b', cursor: 'pointer',
            minHeight: 32, touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

// ── 아이콘 SVG (액션 버튼용) ────────────────────────────────
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

// ── 메인 ────────────────────────────────────────────────────
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

      {/* ── 앱 헤더 카드 ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1E36 0%, #13294B 55%, #1B3A66 100%)',
        borderRadius: 12, padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 18,
        border: '1px solid rgba(173,198,229,0.15)',
      }}>
        <AppIcon size={52} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 5 }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#FFE600', letterSpacing: 2 }}>STEP-</span>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#44AAFF', letterSpacing: 2 }}>PIPE</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: T.fontSans, marginBottom: 6 }}>
            KDS 57 00 00 : 2022 — 매설관로 구조·내진 안전성 자동 검토
          </div>
          {/* 기준 뱃지 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {['KDS 57 10 00', 'KDS 57 17 00', 'KS D 3565', 'KS D 4311', 'DB-24', 'AWWA M11', 'DIPRA'].map(b => (
              <span key={b} style={{
                fontSize: 9.5, padding: '2px 7px', borderRadius: 3,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(173,198,229,0.25)',
                color: 'rgba(255,255,255,0.55)',
                fontFamily: T.fontMono, letterSpacing: 0.3,
              }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 액션 툴바 ── */}
      <div style={{
        display: 'flex', gap: 8,
        background: T.bgPanel,
        border: `1px solid ${T.borderLight}`,
        borderRadius: 10, padding: '10px 14px',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontSans, marginRight: 4, letterSpacing: 0.2 }}>
          평가 시작:
        </span>
        {/* 새 평가 */}
        <button
          onClick={openNewModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 7,
            background: T.bgActive, color: 'white',
            border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', minHeight: 36,
            touchAction: 'manipulation', fontFamily: T.fontSans,
            boxShadow: T.shadow1,
          }}
        >
          <IconNew /> 새 평가
        </button>

        {/* 파일 구분선 */}
        <div style={{ width: 1, height: 24, background: T.borderLight, margin: '0 2px' }} />

        {/* 파일 열기 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 7,
            background: T.bgPanelAlt,
            border: `1px solid ${T.border}`,
            color: T.textLabel, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', minHeight: 36,
            touchAction: 'manipulation', fontFamily: T.fontSans,
          }}
        >
          <IconOpen /> 파일 열기
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.steppipe.json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />

        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textDisabled, fontFamily: T.fontSans }}>
          .steppipe.json
        </span>
      </div>

      {/* ── 진행 중인 세션 ── */}
      <SessionCard />

      {/* ── 저장된 프로젝트 ── */}
      {projects.length > 0 && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: T.textMuted,
            padding: '4px 2px 6px', letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            저장된 프로젝트
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {projects.map((meta: ProjectMeta) => (
              <ProjectCard key={meta.id} meta={meta} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
