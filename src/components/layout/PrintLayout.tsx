import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const NAVY = '#1B3A66'

interface PrintLayoutProps {
  children: React.ReactNode
  backPath: string
}

export default function PrintLayout({ children, backPath }: PrintLayoutProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ background: 'white', minHeight: '100vh' }}>
      {/* 인쇄 전용 상단 바 — 인쇄 시 자동 숨김 */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#f0f4f8', borderBottom: '1px solid #d0d8e4',
        padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '5px 18px', fontSize: 12, cursor: 'pointer',
            background: NAVY, color: 'white', border: 'none', borderRadius: 2,
          }}
        >
          인쇄 / PDF 저장
        </button>
        <button
          onClick={() => navigate(backPath)}
          style={{
            padding: '5px 14px', fontSize: 12, cursor: 'pointer',
            background: 'white', color: NAVY, border: '1px solid #aab', borderRadius: 2,
          }}
        >
          ← 돌아가기
        </button>
        <span style={{ fontSize: 10.5, color: '#666', marginLeft: 8 }}>
          브라우저 인쇄 대화상자에서 &quot;머리글/바닥글&quot;을 해제하면 더 깔끔합니다
        </span>
      </div>

      {/* 보고서 본문 */}
      {children}
    </div>
  )
}
