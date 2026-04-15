import React, { useState } from 'react'
import { STEEL_THICKNESS, DI_THICKNESS, BEDDING, E_PRIME, DB24_PRESSURE } from '../engine/constants.js'

const TAB_LIST = [
  { key: 'kds', label: 'KDS 기준체계' },
  { key: 'allow', label: '허용응력' },
  { key: 'steel', label: '강관 두께표' },
  { key: 'ductile', label: '주철관 두께표' },
  { key: 'db24', label: 'DB-24 하중표' },
  { key: 'eprime', label: "E' 기준표" },
  { key: 'bedding', label: '침상 계수표' },
]

export default function ReferencePage() {
  const [tab, setTab] = useState('kds')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#003366' }}>기준 참조표</h1>
        <p className="text-sm text-gray-500">KDS 57 00 00 : 2022 / KS D 3565 / KS D 4311 / AWWA M11 / DIPRA</p>
      </div>

      {/* 탭 */}
      <div className="flex flex-wrap gap-1 mb-4">
        {TAB_LIST.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'text-white' : 'text-gray-600 bg-white hover:bg-gray-50'
            }`}
            style={tab === key ? { background: '#003366' } : { border: '1px solid #dde8f5' }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6" style={{ border: '1.5px solid #dde8f5' }}>
        {/* KDS 기준체계 */}
        {tab === 'kds' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold" style={{ color: '#003366' }}>KDS 57 기준 체계</h2>
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#003366', color: 'white' }}>
                <th className="p-3 text-left">기준번호</th>
                <th className="p-3 text-left">기준명</th>
                <th className="p-3 text-left">주요 내용</th>
              </tr></thead>
              <tbody>
                {[
                  ['KDS 57 00 00', '상수도 설계기준', '상수도 시설 전반 설계 기준 (2022)'],
                  ['KDS 57 10 00', '상수도관로', '매설관로 구조 설계 기준'],
                  ['KS D 3565', '수도용 도복장강관', '도복장강관 재료·치수·시험 기준'],
                  ['KS D 4311', '수도용 덕타일 주철관', '덕타일 주철관 재료·치수·시험 기준'],
                  ['KDS 24 12 20', '도로교 차량하중', 'DB-24 차량하중 기준'],
                  ['AWWA M11', 'Steel Water Pipe', '강관 설계 매뉴얼 (AWWA)'],
                  ['DIPRA', 'Ductile Iron Pipe', '덕타일 주철관 설계 지침 (DIPRA)'],
                ].map(([code, name, desc], i) => (
                  <tr key={code} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                    <td className="p-3 font-mono font-bold text-xs" style={{ color: '#003366' }}>{code}</td>
                    <td className="p-3">{name}</td>
                    <td className="p-3 text-gray-600 text-xs">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 허용응력 */}
        {tab === 'allow' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>강관 허용응력 (KS D 3565 / AWWA M11)</h2>
              <table className="w-full text-sm">
                <thead><tr style={{ background: '#003366', color: 'white' }}>
                  <th className="p-3 text-left">항목</th>
                  <th className="p-3 text-center">기준강도</th>
                  <th className="p-3 text-center">허용응력 비율</th>
                  <th className="p-3 text-center">허용응력 (MPa)</th>
                </tr></thead>
                <tbody>
                  {[
                    ['상시 운전압력 (Hoop)', 'fy = 235 MPa', '0.50', '117.5'],
                    ['수격압 (Hoop)', 'fy = 235 MPa', '0.75', '176.3'],
                    ['좌굴 안전율', '—', '—', 'F.S. ≥ 2.5'],
                    ['허용 처짐율 (라이닝)', '—', '—', '3.0%'],
                    ['허용 처짐율 (무라이닝)', '—', '—', '5.0%'],
                  ].map(([item, base, ratio, allow], i) => (
                    <tr key={item} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                      <td className="p-3">{item}</td>
                      <td className="p-3 text-center font-mono text-xs">{base}</td>
                      <td className="p-3 text-center">{ratio}</td>
                      <td className="p-3 text-center font-bold" style={{ color: '#003366' }}>{allow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>덕타일 주철관 허용응력 (KS D 4311 / DIPRA)</h2>
              <table className="w-full text-sm">
                <thead><tr style={{ background: '#003366', color: 'white' }}>
                  <th className="p-3 text-left">항목</th>
                  <th className="p-3 text-center">기준강도</th>
                  <th className="p-3 text-center">허용응력 비율</th>
                  <th className="p-3 text-center">허용응력 (MPa)</th>
                </tr></thead>
                <tbody>
                  {[
                    ['내압 Hoop응력', 'fu = 420 MPa', '1/3', '140.0'],
                    ['링 휨응력', 'fu = 420 MPa', '0.50', '210.0'],
                    ['허용 처짐율', '—', '—', '3.0%'],
                  ].map(([item, base, ratio, allow], i) => (
                    <tr key={item} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                      <td className="p-3">{item}</td>
                      <td className="p-3 text-center font-mono text-xs">{base}</td>
                      <td className="p-3 text-center">{ratio}</td>
                      <td className="p-3 text-center font-bold" style={{ color: '#003366' }}>{allow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 강관 두께표 */}
        {tab === 'steel' && (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>KS D 3565 강관 표준 두께 (mm)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ background: '#003366', color: 'white' }}>
                  <th className="p-2 text-center">DN</th>
                  <th className="p-2 text-center">Do (mm)</th>
                  <th className="p-2 text-center">PN6</th>
                  <th className="p-2 text-center">PN10</th>
                  <th className="p-2 text-center">PN16</th>
                </tr></thead>
                <tbody>
                  {Object.entries(STEEL_THICKNESS).map(([dn, row]: any, i) => (
                    <tr key={dn} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                      <td className="p-2 text-center font-bold">{dn}</td>
                      <td className="p-2 text-center">{row.Do}</td>
                      <td className="p-2 text-center">{row.PN6}</td>
                      <td className="p-2 text-center">{row.PN10}</td>
                      <td className="p-2 text-center">{row.PN16}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 주철관 두께표 */}
        {tab === 'ductile' && (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>KS D 4311 덕타일 주철관 K등급 두께 (mm)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ background: '#003366', color: 'white' }}>
                  <th className="p-2 text-center">DN</th>
                  <th className="p-2 text-center">Do (mm)</th>
                  <th className="p-2 text-center">K7</th>
                  <th className="p-2 text-center">K9</th>
                  <th className="p-2 text-center">K10</th>
                  <th className="p-2 text-center">K12</th>
                </tr></thead>
                <tbody>
                  {Object.entries(DI_THICKNESS).map(([dn, row]: any, i) => (
                    <tr key={dn} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                      <td className="p-2 text-center font-bold">{dn}</td>
                      <td className="p-2 text-center">{row.Do}</td>
                      <td className="p-2 text-center">{row.K7}</td>
                      <td className="p-2 text-center">{row.K9}</td>
                      <td className="p-2 text-center">{row.K10}</td>
                      <td className="p-2 text-center">{row.K12}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DB-24 하중표 */}
        {tab === 'db24' && (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>DB-24 등가 수직압력 (Boussinesq)</h2>
            <p className="text-xs text-gray-500 mb-3">KDS 24 12 20 (도로교설계기준) — 충격계수 포함</p>
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#003366', color: 'white' }}>
                <th className="p-3 text-center">매설깊이 H (m)</th>
                <th className="p-3 text-center">기준압력 PL (kPa)</th>
                <th className="p-3 text-center">충격계수 IF</th>
                <th className="p-3 text-center">설계압력 PL×IF (kPa)</th>
              </tr></thead>
              <tbody>
                {Object.entries(DB24_PRESSURE).map(([h, { PL, IF }]: any, i) => (
                  <tr key={h} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                    <td className="p-3 text-center font-bold">{h}</td>
                    <td className="p-3 text-center">{PL}</td>
                    <td className="p-3 text-center">{IF}</td>
                    <td className="p-3 text-center font-bold" style={{ color: '#003366' }}>
                      {(PL * IF).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* E' 기준표 */}
        {tab === 'eprime' && (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>E' 선정 기준표 (AWWA M11 Table 5-3 SI환산, kPa)</h2>
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#003366', color: 'white' }}>
                <th className="p-3 text-center">토질 등급</th>
                <th className="p-3 text-center">토질 설명</th>
                <th className="p-3 text-center">다짐도 80%</th>
                <th className="p-3 text-center">다짐도 85%</th>
                <th className="p-3 text-center">다짐도 90%</th>
              </tr></thead>
              <tbody>
                {[
                  ['SC1', '조립토 (자갈, 모래)', '1,400', '2,700', '6,900'],
                  ['SC2', '혼합토 (모래질 점토 등)', '700', '2,000', '4,800'],
                  ['SC3', '세립토 (점토, 실트)', '—', '700', '1,400'],
                  ['연약', '연약지반', '300', '300', '300'],
                ].map(([cls, desc, d80, d85, d90], i) => (
                  <tr key={cls} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                    <td className="p-3 text-center font-bold">{cls}</td>
                    <td className="p-3">{desc}</td>
                    <td className="p-3 text-center">{d80}</td>
                    <td className="p-3 text-center">{d85}</td>
                    <td className="p-3 text-center">{d90}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 침상 계수표 */}
        {tab === 'bedding' && (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>침상 조건 계수표 (DIPRA)</h2>
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#003366', color: 'white' }}>
                <th className="p-3 text-center">침상 조건</th>
                <th className="p-3 text-left">설명</th>
                <th className="p-3 text-center">Kb (휨응력)</th>
                <th className="p-3 text-center">Kd (처짐)</th>
              </tr></thead>
              <tbody>
                {Object.entries(BEDDING).map(([type, { label, Kb, Kd }]: any, i) => (
                  <tr key={type} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                    <td className="p-3 text-center font-bold">{type}</td>
                    <td className="p-3">{label}</td>
                    <td className="p-3 text-center font-mono">{Kb}</td>
                    <td className="p-3 text-center font-mono">{Kd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 p-3 rounded text-xs text-gray-600" style={{ background: '#f0f4f0', border: '1px solid #b0c8b0' }}>
              Kb: 링 휨응력 계산 계수 / Kd: 처짐량 계산 계수 (Modified Iowa Equation)<br/>
              침상 조건이 좋을수록 (Type 4) Kb, Kd 값이 작아지므로 응력 및 처짐이 감소함.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
