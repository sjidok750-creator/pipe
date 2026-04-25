import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore.js'
import { useStore } from '../store/useStore.js'
import { useSeismicStore } from '../store/useSeismicStore.js'
import { getSession } from '../lib/startup.js'
import type { ProjectMeta } from '../lib/projectRepo.js'

const PIXEL_FONT = "'Press Start 2P', monospace"

const MODULE_LABEL: Record<string, string> = {
  structural:   '구조',
  seismicPrelim: '예비',
  seismicDetail: '상세',
}
const MODULE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  structural:   { bg: '#eef6ff', text: '#003366', border: '#b0ccee' },
  seismicPrelim: { bg: '#fff7e6', text: '#7a4800', border: '#f5cc80' },
  seismicDetail: { bg: '#f0fdf4', text: '#1a5c35', border: '#86efac' },
}
const MODULE_PATH: Record<string, string> = {
  structural:   '/structural/input',
  seismicPrelim: '/seismic-prelim/input',
  seismicDetail: '/seismic-detail/input',
}

function ModuleBadge({ id }: { id: string }) {
  const c = MODULE_COLOR[id] ?? { bg: '#f5f5f5', text: '#555', border: '#ddd' }
  return (
    <span style={{
      fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {MODULE_LABEL[id] ?? id}
    </span>
  )
}

function SessionCard() {
  const navigate = useNavigate()
  const { projectName, enabledModules } = useProjectStore()
  const hasStructural = useStore(s => !!s.result)
  const hasPrelim = useSeismicStore(s => !!s.prelimResult)
  const hasDetail = useSeismicStore(s => !!s.detailResult)

  const session = getSession()
  if (!session) return null

  // Check whether session has any meaningful data
  const hasData =
    session.structural?.inputs ||
    session.seismicPrelim?.inputs ||
    session.seismicDetail?.inputs

  if (!hasData) return null

  const displayName = projectName || '이전 작업 (미저장)'
  const modules = enabledModules.length > 0
    ? enabledModules
    : ['structural', 'seismicPrelim', 'seismicDetail'].filter(m => {
        if (m === 'structural') return hasStructural
        if (m === 'seismicPrelim') return hasPrelim
        if (m === 'seismicDetail') return hasDetail
        return false
      })

  const firstPath = modules.length > 0
    ? MODULE_PATH[modules[0]] ?? '/'
    : '/structural/input'

  return (
    <div style={{
      background: '#f0f6ff', borderRadius: 10, padding: '14px 16px',
      border: '1.5px solid #b0ccee',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: '#5580aa', fontWeight: 600, marginBottom: 4 }}>
          ● 진행 중인 작업
        </div>
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#003366',
          marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayName}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {modules.map(m => <ModuleBadge key={m} id={m} />)}
          {modules.length === 0 && (
            <span style={{ fontSize: 11, color: '#aaa' }}>모듈 미선택</span>
          )}
        </div>
      </div>
      <button
        onClick={() => navigate(firstPath)}
        style={{
          padding: '10px 18px', borderRadius: 8,
          background: '#003366', color: 'white',
          border: 'none', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
          minHeight: 42, touchAction: 'manipulation',
        }}
      >
        계속하기 →
      </button>
    </div>
  )
}

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
      background: 'white', borderRadius: 10, padding: '13px 15px',
      border: '1.5px solid #dde8f5',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Colour accent bar */}
      <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 3, background: '#003366', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#003366',
          marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {meta.name}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 5 }}>
          {meta.enabledModules.map(m => <ModuleBadge key={m} id={m} />)}
        </div>
        <div style={{ fontSize: 10, color: '#aaa' }}>{date}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        <button
          onClick={handleLoad}
          style={{
            padding: '7px 14px', borderRadius: 6,
            background: '#003366', color: 'white',
            border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', minHeight: 34, minWidth: 72,
            touchAction: 'manipulation',
          }}
        >
          불러오기
        </button>
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={() => exportJSON(meta.id)}
            title="JSON 내보내기"
            style={{
              flex: 1, padding: '5px 0', borderRadius: 6,
              border: '1px solid #dde8f5', background: 'none',
              fontSize: 11, color: '#5580aa', cursor: 'pointer',
              minHeight: 30, touchAction: 'manipulation',
            }}
          >
            내보내기
          </button>
          <button
            onClick={() => { if (confirm(`"${meta.name}" 삭제하시겠습니까?`)) deleteProject(meta.id) }}
            title="삭제"
            style={{
              padding: '5px 8px', borderRadius: 6,
              border: '1px solid #fcc', background: 'none',
              fontSize: 11, color: '#c0392b', cursor: 'pointer',
              minHeight: 30, touchAction: 'manipulation',
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { projects, openNewModal, importJSON } = useProjectStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const id = await importJSON(file) as string
      const project = projects.find(p => p.id === id)
      const first = project?.enabledModules[0]
      navigate(first ? MODULE_PATH[first] ?? '/' : '/structural/input')
    } catch (err: any) {
      alert(err.message ?? '파일을 불러올 수 없습니다.')
    }
    e.target.value = ''
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── 앱 타이틀 헤더 ── */}
      <div style={{
        background: 'linear-gradient(135deg, #05082a 0%, #0f2640 60%, #1a3a5c)',
        borderRadius: 10, padding: '16px 22px',
        display: 'flex', alignItems: 'center', gap: 18,
        border: '1px solid #1a3a6a',
      }}>
        <svg width="36" height="18" viewBox="0 0 80 40" style={{ flexShrink: 0, imageRendering: 'pixelated' }}>
          <rect x="0" y="10" width="80" height="20" fill="#1a3a6a" />
          <rect x="0" y="10" width="80" height="4" fill="#3a6aaa" />
          <rect x="0" y="26" width="80" height="4" fill="#0a1a3a" />
          <rect x="4" y="14" width="72" height="12" fill="#0d2040" />
          <rect x="30" y="6" width="20" height="28" fill="#2a4a7a" />
          <rect x="30" y="6" width="20" height="4" fill="#4a7aaa" />
          <rect x="30" y="30" width="20" height="4" fill="#0a1a3a" />
        </svg>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 5 }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 15, color: '#ffe600', letterSpacing: 2 }}>STEP-</span>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 15, color: '#4af', letterSpacing: 2 }}>PIPE</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: "'Noto Sans KR', sans-serif" }}>
            KDS 57 00 00 : 2022 기반 매설관로 구조·내진 안전성 자동 검토
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>
            강관(KS D 3565) / 덕타일 주철관(KS D 4311) | DB-24 | AWWA M11 / DIPRA
          </div>
        </div>
      </div>

      {/* ── 진행 중인 세션 ── */}
      <SessionCard />

      {/* ── 새 평가 시작 버튼 ── */}
      <button
        onClick={openNewModal}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 10,
          border: '2px dashed #b0ccee', background: '#fafcff',
          fontSize: 14, fontWeight: 700, color: '#003366',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          minHeight: 52, touchAction: 'manipulation',
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> 새 평가 시작
      </button>

      {/* ── 적용 기준 뱃지 ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {[
          'KDS 57 10 00 : 2022', 'KDS 57 17 00 : 2022',
          'KS D 3565 (강관)', 'KS D 4311 (주철관)',
          'DB-24 차량하중', 'AWWA M11', 'DIPRA',
        ].map(badge => (
          <span key={badge} style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 20,
            background: '#003366', color: 'white', fontWeight: 500,
          }}>
            {badge}
          </span>
        ))}
      </div>

      {/* ── 저장된 프로젝트 ── */}
      {projects.length > 0 && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#003366',
            padding: '0 2px 7px', letterSpacing: 0.5,
          }}>
            저장된 프로젝트
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {projects.map(meta => (
              <ProjectCard key={meta.id} meta={meta} />
            ))}
          </div>
        </div>
      )}

      {/* ── JSON 가져오기 ── */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.steppipe.json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8,
            border: '1px solid #dde8f5', background: 'white',
            fontSize: 12, color: '#5580aa', cursor: 'pointer',
            minHeight: 40, touchAction: 'manipulation',
          }}
        >
          ↑ .steppipe.json 파일 가져오기
        </button>
      </div>
    </div>
  )
}
