import React from 'react'
import { useProjectStore } from '../../store/useProjectStore.js'

/**
 * 보고서 표제 블록 — 설계보고서 부록(구조·내진계산서) 양식.
 * 프로그램 브랜딩 없이 문서 제목 + 표제표(사업명·시설물명·적용기준·작성일)만 표기한다.
 */
export default function ReportTitleBlock({ standard, title, subtitle }: {
  standard: string
  title: string
  subtitle?: string
}) {
  const projectName = useProjectStore(s => (s as any).projectName) || '—'
  const facilityName = useProjectStore(s => (s as any).activeFacilityName) || '—'
  const today = new Date().toLocaleDateString('ko-KR')

  const td: React.CSSProperties = {
    border: '1px solid #555', padding: '3px 8px', fontSize: 10.5, color: '#111',
  }
  const th: React.CSSProperties = {
    ...td, width: 76, background: '#F2F0EC', fontWeight: 700, textAlign: 'center',
    letterSpacing: 2,
  }

  return (
    <div className="keep-together" style={{ marginBottom: 14 }}>
      {/* 이중 괘선 + 중앙 제목 */}
      <div style={{ borderTop: '3px double #222', borderBottom: '3px double #222', padding: '12px 8px 10px', textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#111', letterSpacing: 3, lineHeight: 1.3 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10.5, color: '#444', marginTop: 4, letterSpacing: 0.5 }}>{subtitle}</div>
        )}
      </div>
      {/* 표제표 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={th}>사업명</td>
            <td style={td}>{projectName}</td>
            <td style={{ ...th, width: 66 }}>작성일</td>
            <td style={{ ...td, width: 120, textAlign: 'center' }}>{today}</td>
          </tr>
          <tr>
            <td style={th}>시설물명</td>
            <td style={td}>{facilityName}</td>
            <td style={{ ...th, width: 66 }}>구분</td>
            <td style={{ ...td, width: 120, textAlign: 'center' }}>구조·내진계산서</td>
          </tr>
          <tr>
            <td style={th}>적용기준</td>
            <td style={td} colSpan={3}>{standard}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
