import React from 'react'

/**
 * STEP-PIPE 앱 아이콘 — W on engineering grid
 * id prop: 동일 페이지에 여러 번 렌더링 시 SVG pattern id 충돌 방지용
 */
export default function WIcon({
  size = 200,
  id = 'wi',
  radius,
}: {
  size?: number
  id?: string
  radius?: number
}) {
  const gridId = `grid-${id}`
  const rx = radius !== undefined ? radius : size > 80 ? 42 : size > 40 ? 22 : 11
  const showGrid = size >= 28

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* 배경 */}
      <rect width="200" height="200" rx={rx * (200 / size)} fill="#EDEBE6" />

      {/* 엔지니어링 격자 */}
      {showGrid && (
        <>
          <defs>
            <pattern id={gridId} width="14" height="14" patternUnits="userSpaceOnUse" x="16" y="16">
              <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#C5C0B8" strokeWidth="0.55" />
            </pattern>
          </defs>
          <rect x="16" y="16" width="168" height="168" fill={`url(#${gridId})`} />
        </>
      )}

      {/* W — 네이비 외곽선 */}
      <polyline
        points="26,56 58,144 100,93 142,144 174,56"
        fill="none"
        stroke="#1B3A66"
        strokeWidth="24"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* W — 하늘색 본체 */}
      <polyline
        points="26,56 58,144 100,93 142,144 174,56"
        fill="none"
        stroke="#5BB8E0"
        strokeWidth="15"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
