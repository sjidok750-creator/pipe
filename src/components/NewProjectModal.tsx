import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore.js'
import { T } from './eng/tokens'

type ModuleId = 'structural' | 'seismicPrelim' | 'seismicDetail'

const MODULE_OPTIONS: { id: ModuleId; label: string; sub: string; path: string }[] = [
  { id: 'structural',   label: '관로 구조안전성 검토', sub: 'KDS 57 10 00', path: '/structural/input' },
  { id: 'seismicPrelim', label: '내진성능 예비평가',   sub: 'KDS 57 17 00', path: '/seismic-prelim/input' },
  { id: 'seismicDetail', label: '내진성능 상세평가',   sub: 'KDS 57 17 00', path: '/seismic-detail/input' },
]

export default function NewProjectModal() {
  const { isNewModalOpen, closeNewModal, startNew } = useProjectStore()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<ModuleId[]>(['structural'])
  const [name, setName] = useState('')

  if (!isNewModalOpen) return null

  const toggle = (id: ModuleId) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )

  const handleStart = async () => {
    if (selected.length === 0) return
    await startNew(selected, name.trim())
    // Navigate to first selected module
    const first = MODULE_OPTIONS.find(m => selected.includes(m.id))
    navigate(first!.path)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={closeNewModal}
    >
      <div
        style={{
          background: 'white', borderRadius: 14, padding: '28px 24px',
          maxWidth: 420, width: '100%',
          boxShadow: '0 12px 40px rgba(0,30,80,0.22)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <div style={{ fontSize: 17, fontWeight: 700, color: '#003366', marginBottom: 6 }}>
          새 평가 시작
        </div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 22 }}>
          수행할 검토 모듈을 선택하세요. 선택한 항목만 저장·불러오기 대상이 됩니다.
        </div>

        {/* Module toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {MODULE_OPTIONS.map(m => {
            const active = selected.includes(m.id)
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', borderRadius: 10,
                  border: active ? '2px solid #003366' : '2px solid #dde8f5',
                  background: active ? '#f0f6ff' : 'white',
                  cursor: 'pointer', textAlign: 'left',
                  touchAction: 'manipulation',
                  minHeight: 56,
                }}
              >
                {/* Checkbox circle */}
                <div style={{
                  width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                  border: active ? '2px solid #003366' : '2px solid #ccc',
                  background: active ? '#003366' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && (
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                      <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#003366' : '#444' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{m.sub}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Project name */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
            프로젝트 이름 <span style={{ fontWeight: 400, color: '#aaa' }}>(선택)</span>
          </label>
          <input
            type="text"
            placeholder="예: 수지 1공구 하수관 매설"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleStart() }}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px', borderRadius: 8,
              border: '1.5px solid #ccc', fontSize: 13,
              fontFamily: T.fontSans,
              outline: 'none',
              minHeight: 42,
              touchAction: 'manipulation',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={closeNewModal}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 8,
              border: '1.5px solid #ccc', background: 'white',
              fontSize: 13, color: '#666', cursor: 'pointer',
              minHeight: 44, touchAction: 'manipulation',
            }}
          >
            취소
          </button>
          <button
            onClick={handleStart}
            disabled={selected.length === 0}
            style={{
              flex: 2, padding: '11px 0', borderRadius: 8,
              border: 'none',
              background: selected.length > 0 ? '#003366' : '#ccc',
              color: 'white', fontSize: 13, fontWeight: 700,
              cursor: selected.length > 0 ? 'pointer' : 'default',
              minHeight: 44, touchAction: 'manipulation',
            }}
          >
            시작하기 →
          </button>
        </div>
      </div>
    </div>
  )
}
