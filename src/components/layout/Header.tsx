import React from 'react'
import { Link, useLocation } from 'react-router-dom'

interface HeaderProps {
  onMenuClick: () => void
}

const NAV_ITEMS = [
  { to: '/',          label: '홈' },
  { to: '/input',     label: '입력' },
  { to: '/result',    label: '결과' },
  { to: '/report',    label: '보고서' },
  { to: '/reference', label: '기준자료' },
]

// 원본 HTML에서 추출한 정확한 SVG 요소
function PiperIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}>
      <rect width="100" height="100" rx="18" fill="#F4EFE6"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#1F1B17" strokeWidth="3.5"/>
      <circle cx="50" cy="50" r="22" fill="none" stroke="#1F1B17" strokeWidth="1.2" strokeDasharray="1.2 1.6"/>
      <path d="M 8 50 L 28 50 L 33 50 L 36 38 L 40 62 L 44 32 L 48 68 L 52 44 L 56 56 L 60 50 L 92 50"
        fill="none" stroke="#D97757" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="50" cy="50" r="2" fill="#1F1B17"/>
    </svg>
  )
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()

  return (
    <header style={{ background: '#1F1B17' }} className="text-white shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* 모바일 햄버거 */}
        <button
          className="md:hidden p-2 rounded hover:bg-white/10"
          onClick={onMenuClick}
          aria-label="메뉴 열기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3" width="20" height="2" rx="1"/>
            <rect y="9" width="20" height="2" rx="1"/>
            <rect y="15" width="20" height="2" rx="1"/>
          </svg>
        </button>

        {/* 로고 */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <PiperIcon size={30} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, gap: 1 }}>
            <span style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#FAF7F1',
              letterSpacing: '-0.4px',
            }}>PIPER</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 7.5,
              fontWeight: 500,
              color: 'rgba(250,247,241,0.40)',
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
            }}>Pipeline Inspection &amp; Performance Evaluation Reviewer</span>
          </div>
        </Link>

        {/* 데스크탑 네비 */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {NAV_ITEMS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === to
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto text-xs hidden md:block"
          style={{ color: 'rgba(250,247,241,0.30)', fontFamily: "'JetBrains Mono', monospace" }}>
          KDS 57 00 00 : 2022
        </div>
      </div>
    </header>
  )
}
