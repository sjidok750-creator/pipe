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

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()

  return (
    <header style={{ background: '#003366' }} className="text-white shadow-lg">
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
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="white" strokeWidth="2"/>
            <circle cx="14" cy="14" r="8" stroke="white" strokeWidth="2"/>
            <path d="M6 14 H22 M14 6 V22" stroke="white" strokeWidth="1.5" opacity="0.5"/>
          </svg>
          <span>PipeCheck KDS</span>
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

        <div className="ml-auto text-xs text-white/50 hidden md:block">
          KDS 57 00 00 : 2022
        </div>
      </div>
    </header>
  )
}
