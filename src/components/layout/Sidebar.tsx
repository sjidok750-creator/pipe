import React from 'react'
import { NavLink } from 'react-router-dom'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { to: '/',          label: '홈',       icon: '🏠' },
  { to: '/input',     label: '입력',     icon: '📝' },
  { to: '/result',    label: '결과',     icon: '📊' },
  { to: '/report',    label: '보고서',   icon: '📄' },
  { to: '/reference', label: '기준자료', icon: '📚' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed md:hidden top-0 left-0 h-full w-64 z-50
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: '#003366', color: 'white' }}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/20">
          <span className="font-bold">PipeCheck KDS</span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">✕</button>
        </div>
        <nav className="p-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 text-xs text-white/40">
          KDS 57 00 00 : 2022<br/>
          KS D 3565 / KS D 4311
        </div>
      </aside>
    </>
  )
}
