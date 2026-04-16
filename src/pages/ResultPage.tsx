import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import SummaryCards from '../components/result/SummaryCards'
import StepCalcAccordion from '../components/result/StepCalcAccordion'
import CrossSectionSVG from '../components/diagrams/CrossSectionSVG'
import DeflectionSVG from '../components/diagrams/DeflectionSVG'
import HoopStressSVG from '../components/diagrams/HoopStressSVG'
import SafetyGaugeSVG from '../components/diagrams/SafetyGaugeSVG'
import BoussinesqSVG from '../components/diagrams/BoussinesqSVG'
import BeddingConditionSVG from '../components/diagrams/BeddingConditionSVG'
import EValueChartSVG from '../components/diagrams/EValueChartSVG'

const DIAGRAM_TABS = [
  { key: 'cross',   label: '단면도' },
  { key: 'deflect', label: '처짐' },
  { key: 'hoop',    label: '내압' },
  { key: 'bouss',   label: 'DB-24' },
  { key: 'bedding', label: '침상' },
  { key: 'eprime',  label: "E' 선도" },
]

export default function ResultPage() {
  const navigate = useNavigate()
  const { result, inputs } = useStore()
  const [diagTab, setDiagTab] = useState('cross')

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-gray-400 text-lg">계산 결과가 없습니다.</div>
        <button
          onClick={() => navigate('/structural/input')}
          className="px-6 py-2 rounded-lg text-white font-bold"
          style={{ background: '#003366' }}
        >
          입력 화면으로
        </button>
      </div>
    )
  }

  const { verdict, steps, pipeType, Do, tAdopt } = result

  const gaugeItems = Object.entries(verdict)
    .filter(([k]) => k !== 'overallOK')
    .map(([k, v]: [string, any]) => ({
      ...v,
      higherIsBetter: k === 'buckling',
    }))

  // 강관: step1=내압, step4=링휨, step5=처짐, step6=좌굴
  // 덕타일: step1=내압, step3=링휨, step4=처짐
  const hoopStep  = steps.step1 as any
  const deflStep  = pipeType === 'steel' ? (steps.step5 as any) : (steps.step4 as any)

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── 좌측: 삽도 영역 (40%) ── */}
        <div className="lg:w-2/5 space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden"
               style={{ border: '1.5px solid #dde8f5' }}>
            {/* 탭 */}
            <div className="flex overflow-x-auto" style={{ background: '#f0f7ff', borderBottom: '1px solid #dde8f5' }}>
              {DIAGRAM_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDiagTab(key)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                    diagTab === key ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={diagTab === key ? { background: '#003366' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 삽도 */}
            <div className="p-4">
              {diagTab === 'cross' && (
                <CrossSectionSVG
                  Do={Do}
                  H={inputs.H}
                  t={tAdopt}
                  hasTraffic={inputs.hasTraffic}
                  gwLevel={inputs.gwLevel}
                />
              )}
              {diagTab === 'deflect' && (
                <DeflectionSVG
                  deflectionRatio={deflStep?.deflectionRatio ?? 0}
                  maxDeflection={deflStep?.maxDeflection ?? 5}
                  Do={Do}
                />
              )}
              {diagTab === 'hoop' && (
                <HoopStressSVG
                  sigma={pipeType === 'steel' ? (hoopStep?.sigma_normal ?? 0) : (hoopStep?.sigma_hoop ?? 0)}
                  sigmaA={pipeType === 'steel' ? (hoopStep?.sigmaA_normal ?? 0) : (hoopStep?.sigmaA_hoop ?? 0)}
                  Pd={inputs.Pd}
                  Do={Do}
                  t={tAdopt}
                />
              )}
              {diagTab === 'bouss' && (
                <BoussinesqSVG currentH={inputs.H}/>
              )}
              {diagTab === 'bedding' && (
                <BeddingConditionSVG selected={inputs.beddingType}/>
              )}
              {diagTab === 'eprime' && (
                <EValueChartSVG
                  currentH={inputs.H}
                  currentE={inputs.Eprime}
                  compaction={inputs.compaction}
                />
              )}
            </div>
          </div>

          {/* 안전율 게이지 */}
          <div className="bg-white rounded-xl shadow-sm p-4" style={{ border: '1.5px solid #dde8f5' }}>
            <div className="text-sm font-bold mb-3" style={{ color: '#003366' }}>안전율 게이지</div>
            <SafetyGaugeSVG items={gaugeItems}/>
          </div>
        </div>

        {/* ── 우측: 결과 영역 (60%) ── */}
        <div className="lg:w-3/5 space-y-4">
          {/* 판정 요약 */}
          <div className="bg-white rounded-xl shadow-sm p-5" style={{ border: '1.5px solid #dde8f5' }}>
            <div className="text-sm font-bold mb-3" style={{ color: '#003366' }}>구조안전성 판정 결과</div>
            <SummaryCards result={result}/>
          </div>

          {/* 단계별 계산 아코디언 */}
          <div className="bg-white rounded-xl shadow-sm p-5" style={{ border: '1.5px solid #dde8f5' }}>
            <div className="text-sm font-bold mb-3" style={{ color: '#003366' }}>단계별 계산 과정</div>
            <StepCalcAccordion steps={steps} pipeType={pipeType}/>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/structural/input')}
              className="flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-colors"
              style={{ borderColor: '#003366', color: '#003366' }}
            >
              조건 재입력
            </button>
            <button
              onClick={() => navigate('/structural/report')}
              className="flex-1 py-3 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: '#003366' }}
            >
              PDF 보고서 출력
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
