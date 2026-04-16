import React from 'react'

export default function SeismicPrelimPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1.5px solid #dde8f5' }}>
        {/* 헤더 */}
        <div style={{ background: '#003366', padding: '24px 32px' }}>
          <div className="text-white/70 text-xs mb-1">KDS 57 17 00 : 2022 상수도 내진설계기준</div>
          <div className="text-white text-xl font-bold">내진성능 예비평가</div>
          <div className="text-white/60 text-sm mt-1">
            Seismic Preliminary Evaluation — 기능수행수준 / 즉시복구수준
          </div>
        </div>

        {/* 준비 중 내용 */}
        <div className="p-12 flex flex-col items-center justify-center text-center gap-6">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0f7ff', border: '2px solid #b0c8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L36 32H4L20 4Z" stroke="#003366" strokeWidth="2" fill="none"/>
              <line x1="20" y1="15" x2="20" y2="24" stroke="#003366" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="20" cy="28" r="1.5" fill="#003366"/>
            </svg>
          </div>

          <div>
            <div className="text-lg font-bold mb-2" style={{ color: '#003366' }}>
              개발 예정
            </div>
            <div className="text-sm text-gray-500 leading-relaxed max-w-md">
              내진성능 예비평가 기능은 현재 개발 중입니다.<br/>
              KDS 57 17 00 기준에 따른 관로 내진성능 예비평가를 제공할 예정입니다.
            </div>
          </div>

          <div className="w-full max-w-md rounded-lg p-4 text-left text-sm space-y-2"
               style={{ background: '#f8faff', border: '1px solid #dde8f5' }}>
            <div className="font-semibold mb-3" style={{ color: '#003366' }}>구현 예정 항목</div>
            {[
              '내진등급 및 성능목표 설정 (기능수행 / 즉시복구)',
              '지반분류 및 설계지반운동 산정',
              '매설관로 지진 피해 예비평가 (PGV 기반)',
              '관로 취약성 지수 산정',
              '예비평가 결과 — 상세평가 필요 여부 판단',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span style={{ color: '#003366', fontWeight: 700, flexShrink: 0 }}>□</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
