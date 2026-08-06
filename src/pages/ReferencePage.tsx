import React, { useState } from 'react'
import { STEEL_THICKNESS, DI_THICKNESS, DI_BEDDING, STEEL_BEDDING, TRAFFIC, EARTH_LOAD } from '../engine/constants.js'

const TAB_LIST = [
  { key: 'kds', label: 'KDS 기준체계' },
  { key: 'allow', label: '허용응력' },
  { key: 'steel', label: '강관 두께표' },
  { key: 'ductile', label: '주철관 두께표' },
  { key: 'db24', label: '작용 하중 상수' },
  { key: 'eprime', label: '강관 지지각 계수' },
  { key: 'bedding', label: '주철관 지지각 계수' },
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
              <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>강관 허용응력 — 상수도시설기준(2004) 참고표-4.2.5</h2>
              <div style={{ background: '#fff8f0', borderLeft: '3px solid #e8a020', padding: '8px 10px', marginBottom: 10, borderRadius: 2, fontSize: 11, lineHeight: 1.6 }}>
                ※ 원문 인쇄 p.175 〈참고표-4.2.5〉 <strong>허용응력</strong> — 내압(1항)·외압(2항) 검토
                뒤에 3항으로 놓인 <strong>공용 단일표</strong>이므로 내압·링휨에 동일하게 적용합니다.<br/>
                ※ 현행 KDS 57 10 00에는 <strong>링휨 검토·허용응력 규정이 없습니다</strong>
                (§3 = &quot;재료 — 내용 없음&quot;, 해설편 1,363쪽에 &quot;링휨&quot; 0회).
                관두께는 <strong>KS·KWWA 인증 압력관 사용</strong>으로 갈음합니다(해설편 p.543).<br/>
                ※ 종전 0.50×fy(=117.5) · 0.75×fy(=176.3)는 어느 기준 문서에도 근거가 없어
                <strong> 폐지</strong>되었습니다. 수격압은 압력등급 적합성(최대사용압력)으로 검토합니다.
              </div>
              <table className="w-full text-sm">
                <thead><tr style={{ background: '#003366', color: 'white' }}>
                  <th className="p-3 text-left">항목</th>
                  <th className="p-3 text-center">종류의 번호</th>
                  <th className="p-3 text-center">구분</th>
                  <th className="p-3 text-center">허용응력 (MPa)</th>
                </tr></thead>
                <tbody>
                  {[
                    ['내압 (Hoop)', 'STWW400 / SS400 / SM400', '고정값', '140'],
                    ['링 휨응력', 'STWW400 / SS400 / SM400', '고정값', '140'],
                    ['〃 (STWW370)', 'STWW370', '고정값', '125'],
                    ['〃 (STWW290)', 'STWW290', '고정값', '100'],
                    ['좌굴 안전율', '—', '—', 'F.S. ≥ 2.5'],
                    ['허용 변형률 (모르타르)', '—', '—', '3.0%'],
                    ['허용 변형률 (도장)', '—', '—', '5.0%'],
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

        {/* 작용 하중 상수 */}
        {tab === 'db24' && (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>작용 하중 상수 — 세부지침 11-134</h2>
            <p className="text-xs text-gray-500 mb-3">
              상부 토압 및 노면하중 산정 상수 (원단위 cm, kg, kg/cm²)
            </p>
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#003366', color: 'white' }}>
                <th className="p-3 text-center">항목</th>
                <th className="p-3 text-center">기호</th>
                <th className="p-3 text-center">값</th>
                <th className="p-3 text-left">비고</th>
              </tr></thead>
              <tbody>
                {[
                  ['흙의 단위중량', 'γt', `${EARTH_LOAD.gamma_t}`, 'kg/cm³'],
                  ['내부마찰각', "φ′ = φ", `${EARTH_LOAD.phi_deg}°`, "k = (1−sinφ)/(1+sinφ), μ′ = tanφ′"],
                  ['토압계수', "kμ′", EARTH_LOAD.kmu.toFixed(5), 'φ=30°에서 유도'],
                  ['굴착부 폭', 'B', '2D + 100', 'cm — 강관 정부에서의 굴착부 폭'],
                  ['연직/Marston 경계', 'H', `${EARTH_LOAD.H_limit_m} m`, 'H ≤ 2.0m 연직토압 / 초과 Marston'],
                  ['후륜하중', 'P', `${TRAFFIC.P}`, 'kg (DB-24)'],
                  ['점유폭 차량 대수', 'n', `${TRAFFIC.n}`, ''],
                  ['후륜 중심간격', 'L', `${TRAFFIC.L_cm}`, 'cm'],
                  ['인접차량 후륜 중심간격', 'C', `${TRAFFIC.C_cm}`, 'cm'],
                  ['차륜 접지폭', 'b', `${TRAFFIC.b_cm}`, 'cm'],
                  ['차륜폭', 'a', `${TRAFFIC.a_cm}`, 'cm'],
                  ['Kögler 분산각', 'θ', `${TRAFFIC.theta}°`, ''],
                ].map(([nm, sym, val, note], i) => (
                  <tr key={nm} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                    <td className="p-3">{nm}</td>
                    <td className="p-3 text-center font-mono font-bold">{sym}</td>
                    <td className="p-3 text-center font-mono" style={{ color: '#003366' }}>{val}</td>
                    <td className="p-3 text-xs text-gray-600">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 p-3 rounded text-xs text-gray-600" style={{ background: '#f0f4f0', border: '1px solid #b0c8b0' }}>
              충격계수 i : H &lt; 1.5 → 0.5 / 1.5 &lt; H &lt; 6.5 → 0.65 − 0.10H / 6.5 &lt; H → 0<br/>
              ※ B = 2D + 100 의 단위는 cm 입니다 (원문 수식군 전체가 cm 계).
            </div>
          </div>
        )}

        {/* 강관 지지각별 계수 */}
        {tab === 'eprime' && (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>강관 기초지지각별 계수 — 세부지침 11-135</h2>
            <p className="text-xs text-gray-500 mb-3">
              외압에 의한 관체의 원주방향 휨응력 산정 계수 · 흙 반력계수 E′ = 28 kg/cm² (단일값)
            </p>
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#003366', color: 'white' }}>
                <th className="p-3 text-center">지지각</th>
                <th className="p-3 text-center">Kb (휨)</th>
                <th className="p-3 text-center">Kx (변형)</th>
                <th className="p-3 text-center">0.061Kb − 0.083Kx</th>
              </tr></thead>
              <tbody>
                {Object.entries(STEEL_BEDDING).map(([type, { label, Kb, Kx }]: any, i) => (
                  <tr key={type} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                    <td className="p-3 text-center font-bold">{label.split('—')[0]?.trim()}</td>
                    <td className="p-3 text-center font-mono">{Kb}</td>
                    <td className="p-3 text-center font-mono">{Kx}</td>
                    <td className="p-3 text-center font-mono" style={{ color: '#003366' }}>
                      {(0.061 * Kb - 0.083 * Kx).toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 p-3 rounded text-xs text-gray-600" style={{ background: '#f0f4f0', border: '1px solid #b0c8b0' }}>
              지침 표에 존재하는 60·90·120·150° 만 사용 가능합니다.<br/>
              관체 탄성계수 E = 2.1×10⁶ kg/cm² · 소성단면계수 f = 1.5 · R = D/2 + t
            </div>
          </div>
        )}

        {/* 주철관 지지각별 계수 */}
        {tab === 'bedding' && (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: '#003366' }}>덕타일 주철관 지지각별 계수 — 세부지침 11-137</h2>
            <p className="text-xs text-gray-500 mb-3">관저 기준 · σb = 6(Kf·Wf + Kt·Wt)R² / t²</p>
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#003366', color: 'white' }}>
                <th className="p-3 text-center">지지각</th>
                <th className="p-3 text-center">Kf</th>
                <th className="p-3 text-center">Kt</th>
              </tr></thead>
              <tbody>
                {Object.entries(DI_BEDDING).map(([type, { label, Kf, Kt }]: any, i) => (
                  <tr key={type} style={{ background: i % 2 === 0 ? '#f5f8ff' : 'white' }}>
                    <td className="p-3 text-center font-bold">{label.split('—')[0]?.trim()}</td>
                    <td className="p-3 text-center font-mono">{Kf}</td>
                    <td className="p-3 text-center font-mono">{Kt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 p-3 rounded text-xs text-gray-600" style={{ background: '#f0f4f0', border: '1px solid #b0c8b0' }}>
              판정: 2.5·σts + 2.0·σtd + 1.4·σb &lt; S (S = 420 MPa, GCD400 인장강도)<br/>
              ※ 90° = 0.160 — 2004 스캔본의 1640×10⁻⁶ 표기는 오식이며 지침값이 정본입니다.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
