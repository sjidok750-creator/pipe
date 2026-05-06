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

// PIPER 아이콘 (인라인 SVG — 조준경+심박수)
function PiperIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 배경 */}
      <rect width="100" height="100" rx="20" fill="#f5f0e8"/>
      {/* 외곽 원 (점선) */}
      <circle cx="50" cy="50" r="36" stroke="#1a1a1a" strokeWidth="2.2" strokeDasharray="3,3"/>
      {/* 중간 원 */}
      <circle cx="50" cy="50" r="24" stroke="#1a1a1a" strokeWidth="2"/>
      {/* 수평선 */}
      <line x1="10" y1="50" x2="90" y2="50" stroke="#e05a3a" strokeWidth="2.5"/>
      {/* 심박수 파형 */}
      <polyline points="18,50 28,50 33,38 37,62 41,38 46,50 54,50 58,42 63,50 82,50"
        stroke="#e05a3a" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round"/>
      {/* 중앙 점 */}
      <circle cx="50" cy="50" r="3.5" fill="#1a1a1a"/>
      {/* 상하 조준선 */}
      <line x1="50" y1="10" x2="50" y2="22" stroke="#1a1a1a" strokeWidth="2"/>
      <line x1="50" y1="78" x2="50" y2="90" stroke="#1a1a1a" strokeWidth="2"/>
    </svg>
  )
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()

  return (
    <header style={{ background: '#1a1a1a' }} className="text-white shadow-lg">
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
          <PiperIcon size={32} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 20,
              fontWeight: 900,
              color: 'white',
              letterSpacing: 3,
            }}>PIPER</span>
            <span style={{
              fontSize: 8,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: 1.2,
              fontFamily: 'sans-serif',
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
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto text-xs text-white/40 hidden md:block" style={{ fontFamily: 'sans-serif' }}>
          KDS 57 00 00 : 2022
        </div>
      </div>
    </header>
  )
}
