import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore.js'
import { T } from '../components/eng/tokens'
import type { ProjectMeta } from '../lib/projectRepo.js'
import { projectRepo } from '../lib/projectRepo.js'

const MODULE_LABEL: Record<string, string> = { structural: '구조', seismicPrelim: '예비', seismicDetail: '상세' }

export default function AdminPage() {
  const { projects, deleteProject } = useProjectStore()
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : projects

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
        <Link to="/" style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none', fontFamily: T.fontSans }}>← 홈</Link>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: T.fontSans }}>프로젝트 관리</span>
        <span style={{ fontSize: 11, color: T.textDisabled, fontFamily: T.fontMono, marginLeft: 4 }}>
          총 {projects.length}개
        </span>
      </div>

      {/* 검색 */}
      <input
        autoFocus
        placeholder="프로젝트명 검색..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 14px', borderRadius: 8,
          border: `1.5px solid ${T.border}`, fontSize: 13,
          fontFamily: T.fontSans, outline: 'none',
        }}
      />

      {/* 프로젝트 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 && (
          <div style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '32px 0' }}>
            {query ? '검색 결과 없음' : '저장된 프로젝트가 없습니다'}
          </div>
        )}
        {filtered.map((meta: ProjectMeta) => {
          const project = projectRepo.get(meta.id)
          const facilityCount = project?.facilities.length ?? 0
          const date = new Date(meta.updatedAt).toLocaleString('ko-KR', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })

          return (
            <div key={meta.id} style={{
              background: T.bgPanel,
              border: `1px solid ${T.borderLight}`,
              borderRadius: 8, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>{meta.name}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 3 }}>
                  {meta.enabledModules.map(m => (
                    <span key={m} style={{
                      fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: 600,
                      background: '#F0F4FF', color: '#1B3A66', border: '1px solid #ADC6E5',
                    }}>{MODULE_LABEL[m] ?? m}</span>
                  ))}
                  <span style={{ fontSize: 10, color: T.textDisabled, fontFamily: T.fontMono, alignSelf: 'center', marginLeft: 2 }}>
                    {facilityCount}개 시설물
                  </span>
                </div>
                <div style={{ fontSize: 10, color: T.textDisabled, fontFamily: T.fontMono }}>
                  최종 수정: {date}
                </div>
                {/* 시설물 목록 */}
                {(project?.facilities ?? []).length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(project?.facilities ?? []).map(f => (
                      <div key={f.id} style={{ fontSize: 11, color: T.textMuted, paddingLeft: 10, borderLeft: `2px solid ${T.borderLight}` }}>
                        {f.name}
                        {f.fileName && <span style={{ marginLeft: 6, color: T.textDisabled, fontFamily: T.fontMono }}>📄 {f.fileName}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (window.confirm(`"${meta.name}" 프로젝트와 모든 시설물 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`))
                    deleteProject(meta.id)
                }}
                style={{
                  padding: '6px 14px', borderRadius: 6,
                  border: '1.5px solid #f5a5a5', background: '#fff8f8',
                  fontSize: 12, color: '#c0392b', cursor: 'pointer',
                  fontFamily: T.fontSans, fontWeight: 600, flexShrink: 0,
                }}
              >삭제</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
