import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import {
  STEEL_DN_LIST, DI_DN_LIST, E_PRIME, BEDDING,
  STEEL_BEDDING, GW_LEVEL_OPTIONS,
  STEEL_THICKNESS, DI_THICKNESS,
  STEEL_PN_GRADES, DI_K_GRADES,
} from '../engine/constants.js'
import { validateInputs } from '../engine/validator.js'

const SOIL_CLASSES = [
  { value: 'SC1', label: 'SC1 — 조립토 (자갈, 모래)' },
  { value: 'SC2', label: 'SC2 — 혼합토' },
  { value: 'SC3', label: 'SC3 — 세립토 (점토, 실트)' },
  { value: 'loose', label: '연약지반' },
]
const COMPACTION_LIST = [80, 85, 90]

export default function InputPage() {
  const navigate = useNavigate()
  const { inputs, setInputs, setEprimeManual, calcResult, saveToHistory } = useStore()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: unknown) => {
    setInputs({ [field]: value } as any)
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  const dnList = inputs.pipeType === 'steel' ? STEEL_DN_LIST : DI_DN_LIST
  const thicknessRow = inputs.pipeType === 'steel'
    ? STEEL_THICKNESS[inputs.DN]
    : DI_THICKNESS[inputs.DN]

  const goStep2 = () => {
    const gradeField = inputs.pipeType === 'steel' ? 'pnGrade' : 'diKGrade'
    const { errors: errs } = validateInputs(inputs)
    const step1Fields = ['DN', 'Pd', 'H', 'surgeRatio', gradeField]
    const step1Errors: Record<string, string> = {}
    step1Fields.forEach((f) => { if (errs[f]) step1Errors[f] = errs[f] })
    if (Object.keys(step1Errors).length > 0) { setErrors(step1Errors); return }
    setStep(2)
  }

  const handleCalc = () => {
    const { valid, errors: errs } = validateInputs(inputs)
    if (!valid) { setErrors(errs); return }
    const result = calcResult()
    if (result) {
      saveToHistory()
      navigate('/structural/result')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 스텝 인디케이터 */}
      <div className="flex items-center mb-6">
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <button
              onClick={() => s < step && setStep(s)}
              className={`flex items-center gap-2 ${s < step ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s ? 'text-white' : 'text-gray-400 bg-gray-200'
                }`}
                style={{ background: step >= s ? '#003366' : undefined }}
              >
                {s}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${step >= s ? 'text-navy' : 'text-gray-400'}`}
                style={{ color: step >= s ? '#003366' : undefined }}
              >
                {s === 1 ? '관로 기본 조건' : '지반·시공 조건'}
              </span>
            </button>
            {s < 2 && (
              <div
                className={`flex-1 h-1 mx-3 rounded ${step > s ? '' : 'bg-gray-200'}`}
                style={{ background: step > s ? '#003366' : undefined }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6" style={{ border: '1.5px solid #b0c8e8' }}>
        {step === 1 ? (
          /* ── STEP 1: 관로 기본 조건 ── */
          <div className="space-y-6">
            <h2 className="text-lg font-bold" style={{ color: '#003366' }}>
              Step 1 — 관로 기본 조건
            </h2>

            {/* 관종 선택 */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#003366' }}>관종</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'steel',   label: '도복장강관',     sub: 'KS D 3565', icon: '⚙' },
                  { value: 'ductile', label: '덕타일 주철관', sub: 'KS D 4311', icon: '🔩' },
                ].map(({ value, label, sub, icon }) => (
                  <button
                    key={value}
                    onClick={() => {
                      handleChange('pipeType', value)
                      const list = value === 'steel' ? STEEL_DN_LIST : DI_DN_LIST
                      if (!list.includes(inputs.DN)) handleChange('DN', list[5] || list[0])
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      inputs.pipeType === value ? 'border-2' : 'border-gray-200 hover:border-blue-200'
                    }`}
                    style={inputs.pipeType === value ? { borderColor: '#003366', background: '#e8f0fb' } : {}}
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="font-bold text-sm" style={{ color: '#003366' }}>{label}</div>
                    <div className="text-xs text-gray-500">{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 호칭 관경 */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>
                호칭 관경 DN (mm)
              </label>
              <select
                className={`w-full border rounded-lg px-3 py-2.5 text-sm ${errors.DN ? 'border-red-400' : 'border-gray-300'}`}
                value={inputs.DN}
                onChange={(e) => handleChange('DN', Number(e.target.value))}
              >
                {dnList.map((dn) => <option key={dn} value={dn}>DN {dn}</option>)}
              </select>
              {errors.DN && <p className="text-red-500 text-xs mt-1">{errors.DN}</p>}
            </div>

            {/* 두께/등급 선택 — 핵심: 주어진 규격으로 검토 */}
            {inputs.pipeType === 'steel' ? (
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>
                  PN 등급 선택 — 채택 두께
                  <span className="font-normal text-gray-400 ml-2 text-xs">(KS D 3565 표준 두께)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STEEL_PN_GRADES.map((grade) => {
                    const t = thicknessRow?.[grade]
                    return (
                      <button
                        key={grade}
                        onClick={() => handleChange('pnGrade', grade)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          inputs.pnGrade === grade ? '' : 'border-gray-200 hover:border-blue-200'
                        }`}
                        style={inputs.pnGrade === grade ? { borderColor: '#003366', background: '#e8f0fb' } : {}}
                      >
                        <div className="font-bold text-sm" style={{ color: '#003366' }}>{grade}</div>
                        <div className="text-lg font-black mt-0.5" style={{ color: inputs.pnGrade === grade ? '#003366' : '#555' }}>
                          {t ?? '-'} <span className="text-xs font-normal">mm</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {errors.pnGrade && <p className="text-red-500 text-xs mt-1">{errors.pnGrade}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  외경 Do = {thicknessRow?.Do ?? '-'} mm
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>
                  K 등급 선택 — 채택 두께
                  <span className="font-normal text-gray-400 ml-2 text-xs">(KS D 4311 표준 두께 / K9 이상 일반 사용)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DI_K_GRADES.map((grade) => {
                    const t = thicknessRow?.[grade]
                    return (
                      <button
                        key={grade}
                        onClick={() => handleChange('diKGrade', grade)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          inputs.diKGrade === grade ? '' : 'border-gray-200 hover:border-blue-200'
                        }`}
                        style={inputs.diKGrade === grade ? { borderColor: '#003366', background: '#e8f0fb' } : {}}
                      >
                        <div className="font-bold text-sm" style={{ color: '#003366' }}>{grade}</div>
                        <div className="text-lg font-black mt-0.5" style={{ color: inputs.diKGrade === grade ? '#003366' : '#555' }}>
                          {t ?? '-'} <span className="text-xs font-normal">mm</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {errors.diKGrade && <p className="text-red-500 text-xs mt-1">{errors.diKGrade}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  외경 Do = {thicknessRow?.Do ?? '-'} mm
                </p>
              </div>
            )}

            {/* 설계 운전압력 / 수격압 배율 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>
                  설계 운전압력 Pd (MPa)
                </label>
                <input
                  type="number" step="0.01" min="0" max="3"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm ${errors.Pd ? 'border-red-400' : 'border-gray-300'}`}
                  value={inputs.Pd}
                  onChange={(e) => handleChange('Pd', Number(e.target.value))}
                />
                {errors.Pd && <p className="text-red-500 text-xs mt-1">{errors.Pd}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>
                  수격압 배율
                </label>
                <input
                  type="number" step="0.1" min="1" max="3"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm ${errors.surgeRatio ? 'border-red-400' : 'border-gray-300'}`}
                  value={inputs.surgeRatio}
                  onChange={(e) => handleChange('surgeRatio', Number(e.target.value))}
                />
                {errors.surgeRatio && <p className="text-red-500 text-xs mt-1">{errors.surgeRatio}</p>}
              </div>
            </div>

            {/* 매설깊이 */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>
                관정 매설깊이 H (m)
              </label>
              <input
                type="number" step="0.1" min="0.5" max="20"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm ${errors.H ? 'border-red-400' : 'border-gray-300'}`}
                value={inputs.H}
                onChange={(e) => handleChange('H', Number(e.target.value))}
              />
              {errors.H && <p className="text-red-500 text-xs mt-1">{errors.H}</p>}
            </div>

            {/* 라이닝 (강관만) */}
            {inputs.pipeType === 'steel' && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#f0f7ff' }}>
                <input
                  type="checkbox" id="lining"
                  checked={inputs.hasLining}
                  onChange={(e) => handleChange('hasLining', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="lining" className="text-sm font-medium" style={{ color: '#003366' }}>
                  시멘트 모르타르 라이닝 적용
                  <span className="text-gray-400 font-normal ml-2">(허용 처짐율: 라이닝=3%, 무라이닝=5%)</span>
                </label>
              </div>
            )}

            {/* 차량하중 */}
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#f0f7ff' }}>
              <input
                type="checkbox" id="traffic"
                checked={inputs.hasTraffic}
                onChange={(e) => handleChange('hasTraffic', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="traffic" className="text-sm font-medium" style={{ color: '#003366' }}>
                DB-24 차량하중 적용
                <span className="text-gray-400 font-normal ml-2">(도로 하부 매설)</span>
              </label>
            </div>

            <button
              onClick={goStep2}
              className="w-full py-3 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: '#003366' }}
            >
              다음 단계 →
            </button>
          </div>
        ) : (
          /* ── STEP 2: 지반·시공 조건 ── */
          <div className="space-y-6">
            <h2 className="text-lg font-bold" style={{ color: '#003366' }}>
              Step 2 — 지반·시공 조건
            </h2>

            {/* 토질 등급 */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>토질 등급</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                value={inputs.soilClass}
                onChange={(e) => handleChange('soilClass', e.target.value)}
              >
                {SOIL_CLASSES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* 다짐도 */}
            {inputs.soilClass !== 'loose' && (
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>다짐도 (%)</label>
                <div className="flex gap-2">
                  {COMPACTION_LIST.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleChange('compaction', c)}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        inputs.compaction === c ? 'text-white' : 'border-gray-200 text-gray-600'
                      }`}
                      style={inputs.compaction === c ? { background: '#003366', borderColor: '#003366' } : {}}
                    >
                      {c}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* E' 값 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold" style={{ color: '#003366' }}>
                  탄성지반 반력계수 E' (kPa)
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.eprimeManual}
                    onChange={(e) => setEprimeManual(e.target.checked)}
                  />
                  수동 입력
                </label>
              </div>
              <input
                type="number" min="100" max="20000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                value={inputs.Eprime}
                readOnly={!inputs.eprimeManual}
                style={!inputs.eprimeManual ? { background: '#f0f4f8', cursor: 'not-allowed' } : {}}
                onChange={(e) => inputs.eprimeManual && handleChange('Eprime', Number(e.target.value))}
              />
              <p className="text-xs text-gray-400 mt-1">
                {inputs.eprimeManual
                  ? '수동 입력 모드'
                  : `AWWA M11 Table 5-3 자동계산 (${inputs.soilClass}, ${inputs.compaction}%)`}
              </p>
              {errors.Eprime && <p className="text-red-500 text-xs mt-1">{errors.Eprime}</p>}
            </div>

            {/* 기초지지각 (강관) */}
            {inputs.pipeType === 'steel' && (
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>
                  기초지지각 — 침상 조건
                  <span className="font-normal text-gray-400 ml-2 text-xs">(AWWA M11 Table 5-1 / KDS 57 10 00 §3.4)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STEEL_BEDDING as Record<string, { Kb: number; Kx: number; label: string }>).map(([type, { label, Kb, Kx }]) => (
                    <button
                      key={type}
                      onClick={() => handleChange('steelBeddingType', type)}
                      className={`p-3 rounded-lg border-2 text-left text-xs transition-all ${
                        inputs.steelBeddingType === type ? '' : 'border-gray-200 hover:border-blue-200'
                      }`}
                      style={inputs.steelBeddingType === type ? { borderColor: '#003366', background: '#e8f0fb' } : {}}
                    >
                      <div className="font-bold mb-0.5" style={{ color: '#003366' }}>{label.split('—')[0].trim()}</div>
                      <div className="text-gray-500 leading-tight">{label.split('—')[1]?.trim()}</div>
                      <div className="text-gray-400 mt-1">Kb={Kb} / Kx={Kx}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 침상 조건 (덕타일만) */}
            {inputs.pipeType === 'ductile' && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#003366' }}>
                  침상 조건 (DIPRA)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(BEDDING as Record<string, { label: string; Kb: number; Kd: number }>).map(([type, { label, Kb, Kd }]) => (
                    <button
                      key={type}
                      onClick={() => handleChange('beddingType', type)}
                      className={`p-3 rounded-lg border-2 text-left text-xs transition-all ${
                        inputs.beddingType === type ? '' : 'border-gray-200 hover:border-blue-200'
                      }`}
                      style={inputs.beddingType === type ? { borderColor: '#003366', background: '#e8f0fb' } : {}}
                    >
                      <div className="font-bold mb-0.5" style={{ color: '#003366' }}>{type}</div>
                      <div className="text-gray-500">{label.split('—')[1]?.trim()}</div>
                      <div className="text-gray-400 mt-1">Kb={Kb} / Kd={Kd}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 지하수위 */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>
                지하수위
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                value={inputs.gwLevel}
                onChange={(e) => handleChange('gwLevel', e.target.value)}
              >
                {GW_LEVEL_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* 흙 단위중량 */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#003366' }}>
                흙 단위중량 γ (kN/m³)
              </label>
              <input
                type="number" step="0.1" min="10" max="25"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm ${errors.gammaSoil ? 'border-red-400' : 'border-gray-300'}`}
                value={inputs.gammaSoil}
                onChange={(e) => handleChange('gammaSoil', Number(e.target.value))}
              />
              {errors.gammaSoil && <p className="text-red-500 text-xs mt-1">{errors.gammaSoil}</p>}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-colors"
                style={{ borderColor: '#003366', color: '#003366' }}
              >
                ← 이전
              </button>
              <button
                onClick={handleCalc}
                className="flex-1 py-3 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: '#003366' }}
              >
                검토 실행 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 입력 조건 요약 */}
      <div className="mt-4 p-4 rounded-lg text-sm" style={{ background: '#f8faff', border: '1px solid #dde8f5' }}>
        <div className="font-semibold mb-2" style={{ color: '#003366' }}>현재 입력 조건</div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <span>{inputs.pipeType === 'steel' ? '강관' : '주철관'}</span>
          <span>DN {inputs.DN}</span>
          <span>
            {inputs.pipeType === 'steel'
              ? `${inputs.pnGrade} (t=${thicknessRow?.[inputs.pnGrade] ?? '-'}mm)`
              : `${inputs.diKGrade} (t=${thicknessRow?.[inputs.diKGrade] ?? '-'}mm)`}
          </span>
          <span>Pd={inputs.Pd} MPa</span>
          <span>H={inputs.H} m</span>
          <span>{inputs.soilClass}</span>
          <span>E'={inputs.Eprime} kPa</span>
          {inputs.hasTraffic && <span className="text-blue-600">DB-24</span>}
        </div>
      </div>
    </div>
  )
}
