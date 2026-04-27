import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeismicStore } from '../../store/useSeismicStore.js'
import {
  SEISMIC_ZONE, SEISMIC_GRADE, SOIL_TYPE,
  KIND_INDEX, CONNECT_INDEX, FACIL_INDEX, MCONE_INDEX,
  calcFLEX,
} from '../../engine/seismicConstants.js'
import {
  EngPanel, EngSection, EngRow, EngInput,
  EngRadio, EngSegment, EngDivider, EngPopover,
} from '../../components/eng/EngLayout'
import { T } from '../../components/eng/tokens'
import { SoilProfileSVG } from '../../components/eng/diagrams/SoilProfileSVG'

export default function SeismicPrelimInputPage() {
  const navigate = useNavigate()
  const { prelimInputs: inp, setPrelimInputs: set, calcPrelim } = useSeismicStore()

  const Z = SEISMIC_ZONE[inp.zone as 'I'|'II'].Z
  const gradeInfo = SEISMIC_GRADE[inp.seismicGrade as 'I'|'II']
  const ratio = inp.DN / inp.thickness
  const FLEX = calcFLEX(ratio)

  function handleCalc() {
    const result = calcPrelim()
    if (result) navigate('/seismic-prelim/result')
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>

      {/* ── 좌측 입력 패널 ─────────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>

        {/* 지진 조건 */}
        <EngPanel title="① 지진 조건">
          <EngRow label="지진구역" popover={
            <EngPopover title="지진구역 (Seismic Zone)">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>KDS 17 10 00 : 2019 §2.1.1</strong><br/>
                  국내 지진위험도에 따라 전국을 2개 구역으로 구분
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>구역</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>Z값</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>해당 지역</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontWeight: 700 }}>Ⅰ</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>0.11</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>서울·인천·경기 일부, 강원·충청·경상·전라·제주 주요지역</td>
                    </tr>
                    <tr style={{ background: '#fafafa' }}>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontWeight: 700 }}>Ⅱ</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>0.07</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>위 이외 지역 (상대적으로 지진 위험 낮음)</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  Z는 재현주기 500년 지반최대가속도를 중력가속도(g)의 배수로 표현한 값.<br/>
                  설계지반가속도 S = Z × I (I: 위험도계수)
                </div>
              </div>
            </EngPopover>
          }>
            <EngRadio
              options={[
                { key: 'I',  label: '구역 Ⅰ  (Z = 0.11)' },
                { key: 'II', label: '구역 Ⅱ  (Z = 0.07)' },
              ]}
              value={inp.zone}
              onChange={v => set({ zone: v })}
            />
          </EngRow>
          <EngRow label="내진등급" popover={
            <EngPopover title="내진등급 (Seismic Performance Grade)">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>KDS 57 17 00 : 2022 §3.1 / KDS 17 10 00 §2.3</strong><br/>
                  시설물의 중요도와 피해 시 파급효과에 따라 결정
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>등급</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>붕괴방지</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>기능수행</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>위험도계수 I</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontWeight: 700 }}>Ⅰ</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center' }}>재현 1000년</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center' }}>재현 100년</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>1.40 / 0.57</td>
                    </tr>
                    <tr style={{ background: '#fafafa' }}>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontWeight: 700 }}>Ⅱ</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center' }}>재현 500년</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center' }}>재현 50년</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>1.00 / 0.40</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  <strong>내진 Ⅰ 등급 해당:</strong> 급수인구 10만명 이상 또는 주요 간선 관로,<br/>
                  재난구호·소방·병원 등 기능수행이 필수적인 시설에 연결된 관로<br/>
                  <strong>내진 Ⅱ 등급:</strong> 위 이외의 일반 배수·급수 관로
                </div>
              </div>
            </EngPopover>
          }>
            <EngSegment
              options={[
                { key: 'I',  label: '내진 Ⅰ 등급', sub: `붕괴 ${gradeInfo.returnPeriod_collapse}년 / 기능 ${gradeInfo.returnPeriod_func}년` },
                { key: 'II', label: '내진 Ⅱ 등급', sub: `붕괴 ${SEISMIC_GRADE['II'].returnPeriod_collapse}년 / 기능 ${SEISMIC_GRADE['II'].returnPeriod_func}년` },
              ]}
              value={inp.seismicGrade}
              onChange={v => set({ seismicGrade: v })}
            />
          </EngRow>
          <EngRow label="도시권역" popover={
            <EngPopover title="도시권역 구분">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 §4.2 (취약도지수 I)</strong><br/>
                  도심 여부에 따라 FLEX 지수의 가중치(KIND 지수)가 달라짐
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>구분</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>KIND 점수</th>
                      <th style={{ padding: '3px 6px', border: '1px solid #ccc' }}>해당 지역</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', fontWeight: 700 }}>도시권역</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>높음</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>특별시·광역시·시 지역 (인구밀집 도심)</td>
                    </tr>
                    <tr style={{ background: '#fafafa' }}>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', fontWeight: 700 }}>기타지역</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>낮음</td>
                      <td style={{ padding: '3px 6px', border: '1px solid #eee' }}>군·읍·면 지역</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#e8f0fb', border: '1px solid #5b9bd5', borderRadius: 2, fontSize: 10 }}>
                  도시권역일수록 지진 피해 시 파급효과가 크기 때문에<br/>
                  취약도지수 산정 시 KIND 가중치를 높게 부여하여<br/>
                  상대적으로 엄격한 내진성능을 요구함
                </div>
              </div>
            </EngPopover>
          }>
            <EngRadio
              options={[
                { key: 'urban', label: '도시권역' },
                { key: 'other', label: '기타지역' },
              ]}
              value={inp.isUrban ? 'urban' : 'other'}
              onChange={v => set({ isUrban: v === 'urban' })}
            />
          </EngRow>
          <EngRow label="지반종류" popover={
            <EngPopover title="지반종류 (Site Class)">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>KDS 17 10 00 : 2019 §2.2 / 표 2.2.1</strong><br/>
                  지표면에서 30m 깊이까지 평균 전단파 속도(Vs,30)로 분류
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>분류</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>Vs,30 (m/s)</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>지반 특성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['SA', '> 1500', '경암 — 기반암 노출'],
                      ['SB', '760 ~ 1500', '보통암'],
                      ['SC', '360 ~ 760', '매우 조밀한 토사 / 연암'],
                      ['SD', '180 ~ 360', '단단한 토사 (보통 퇴적층)'],
                      ['SE', '< 180', '연약한 토사'],
                      ['SF', '—', '부지 고유 특성평가 필요 (액상화 위험 등)'],
                    ].map(([k, vs, desc], i) => (
                      <tr key={k} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', fontWeight: 700, textAlign: 'center', fontFamily: T.fontMono }}>{k}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>{vs}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  지반종류는 지반조사(시추·SPT·현장 Vs 측정) 결과로 결정.<br/>
                  조사 자료 없을 경우 보수적으로 SD 또는 SE 적용 권장.<br/>
                  지반증폭계수(Fa, Fv)가 설계지진력에 직접 영향을 미침.
                </div>
              </div>
            </EngPopover>
          }>
            <EngSegment
              options={Object.keys(SOIL_TYPE).map(k => ({ key: k, label: k }))}
              value={inp.soilType}
              onChange={v => set({ soilType: v })}
            />
          </EngRow>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, marginLeft: 110, fontFamily: T.fontSans }}>
            {SOIL_TYPE[inp.soilType as keyof typeof SOIL_TYPE]?.label}
          </div>

          <EngDivider label="설계지반가속도  S = Z × I" />
          <div style={{
            background: T.bgSection, border: `1px solid ${T.borderLight}`,
            padding: '6px 10px', fontSize: 11, fontFamily: T.fontMono,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>
                <span style={{ color: T.textMuted }}>붕괴방지 ({gradeInfo.returnPeriod_collapse}년) : </span>
                <strong style={{ color: T.textAccent }}>S = {Z} × {gradeInfo.I_collapse} = {(Z * gradeInfo.I_collapse).toFixed(3)} g</strong>
              </div>
              <div>
                <span style={{ color: T.textMuted }}>기능수행 ({gradeInfo.returnPeriod_func}년) : </span>
                <strong style={{ color: T.textAccent }}>S = {Z} × {gradeInfo.I_func} = {(Z * gradeInfo.I_func).toFixed(3)} g</strong>
              </div>
            </div>
          </div>
        </EngPanel>

        {/* 관로 제원 */}
        <EngPanel title="② 관로 제원">
          <EngRow label="관종" popover={
            <EngPopover title="관종별 내진 특성">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 §4.2 (KIND 지수)</strong><br/>
                  관종은 이음부 유연성과 연성을 결정하며 FLEX 지수에 영향을 줌
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>관종</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>이음 특성</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>내진 특성</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['덕타일 주철관', 'KP 메카니컬 조인트', '소켓 이음 신축·굽힘 대응, 내진형 이음 채택 시 성능 우수'],
                      ['강관', '용접 또는 플랜지', '연속체로 거동, 좌굴·피로 검토 필요'],
                      ['콘크리트관', '고무링 이음', '이음부 허용변위 작음, 취성 파괴 위험'],
                      ['PVC관', '고무링 이음', '가요성 높으나 인장강도 낮음, 소구경 적합'],
                    ].map(([k, j, c], i) => (
                      <tr key={k} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', fontWeight: 700 }}>{k}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>{j}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#e8f0fb', border: '1px solid #5b9bd5', borderRadius: 2, fontSize: 10 }}>
                  예비평가에서 관종은 KIND 지수를 통해 취약도지수에 간접 반영됨.<br/>
                  상세평가에서는 관종에 따라 적용 계산방법(분절관/연속관)이 달라짐.
                </div>
              </div>
            </EngPopover>
          }>
            <EngRadio
              options={[
                { key: 'ductile', label: '덕타일 주철관' },
                { key: 'steel',   label: '강관' },
              ]}
              value={inp.pipeKind}
              onChange={v => set({ pipeKind: v })}
            />
          </EngRow>
          <EngRow label="공칭관경 DN" unit="mm" popover={
            <EngPopover title="공칭관경 DN">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 §4.2</strong><br/>
                  FLEX 지수 = D/t 비율로 산정. 관경이 클수록, 두께가 얇을수록 유연성 감소
                </div>
                <div style={{ padding: '4px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 2, fontFamily: T.fontMono, fontSize: 11 }}>
                  FLEX = DN / t<br/>
                  <span style={{ fontSize: 10, color: T.textMuted }}>현재: {ratio.toFixed(1)} → FLEX = {FLEX.toFixed(0)}</span>
                </div>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  FLEX 지수가 클수록 관이 얇고 유연하여<br/>
                  지반변위 추종 능력이 상대적으로 낮음.<br/>
                  예비평가 취약도지수 KIND의 세부지수에 포함됨.
                </div>
              </div>
            </EngPopover>
          }>
            <EngInput value={inp.DN} onChange={v => set({ DN: parseFloat(v)||300 })} min={50} max={3000} step={50} width={100}/>
          </EngRow>
          <EngRow label="관두께 t" unit="mm" popover={
            <EngPopover title="관두께 t">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 §4.2 (FLEX 지수)</strong>
                </div>
                <div style={{ padding: '4px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 2, fontFamily: T.fontMono, fontSize: 11 }}>
                  D/t 비 = {ratio.toFixed(1)}<br/>
                  FLEX 지수 = {FLEX.toFixed(0)}
                </div>
                <div style={{ marginTop: 6, fontSize: 11 }}>
                  <strong>두께 참고 (일반 상수도관)</strong>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginTop: 3 }}>
                    <thead>
                      <tr style={{ background: '#f0f4f8' }}>
                        <th style={{ padding: '2px 4px', border: '1px solid #ccc' }}>관종</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #ccc' }}>DN300</th>
                        <th style={{ padding: '2px 4px', border: '1px solid #ccc' }}>DN600</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '2px 4px', border: '1px solid #eee' }}>덕타일 K9</td>
                        <td style={{ padding: '2px 4px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>8.4 mm</td>
                        <td style={{ padding: '2px 4px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>10.8 mm</td>
                      </tr>
                      <tr style={{ background: '#fafafa' }}>
                        <td style={{ padding: '2px 4px', border: '1px solid #eee' }}>강관 PN10</td>
                        <td style={{ padding: '2px 4px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>7 mm</td>
                        <td style={{ padding: '2px 4px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>9 mm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </EngPopover>
          }>
            <EngInput value={inp.thickness} onChange={v => set({ thickness: parseFloat(v)||8 })} min={1} step={0.5} width={100}/>
            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono }}>
              D/t = {ratio.toFixed(1)}  →  FLEX = {FLEX.toFixed(0)}
            </span>
          </EngRow>
        </EngPanel>

        {/* 취약도지수 세부지수 */}
        <EngPanel title="③ 취약도지수 세부지수">
          <EngRow label="이음부 상태 (CONNECT)" popover={
            <EngPopover title="이음부 상태 지수 CONNECT">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 §4.2.2 표 4.2.3</strong><br/>
                  이음부 내진 대응 능력을 점수화한 지수
                </div>
                <div style={{ fontSize: 11 }}>
                  이음부는 지반변위 시 축방향 신축과 굽힘 변형이 집중되는 지점.<br/>
                  내진형 이음일수록 허용변위가 크고 지진 하중 흡수 능력이 우수함.
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginTop: 6 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>분류</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>이음부 형식</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(CONNECT_INDEX).map(([k, v]: any, i) => (
                      <tr key={k} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', fontWeight: 700 }}>{k}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>{v.label}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>{v.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 2, fontSize: 10 }}>
                  점수가 낮을수록 이음부 내진 성능이 좋은(우수한) 이음 형식임.<br/>
                  취약도지수 VI 산정 시 가중합산에 포함됨.
                </div>
              </div>
            </EngPopover>
          }>
            <EngRadio
              options={Object.entries(CONNECT_INDEX).map(([k, v]) => ({
                key: k, label: `${v.label}  (${v.score})`,
              }))}
              value={inp.connectCond}
              onChange={v => set({ connectCond: v })}
            />
          </EngRow>
          <EngDivider />
          <EngRow label="주요시설물 (FACIL)" popover={
            <EngPopover title="주요시설물 지수 FACIL">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 §4.2.2 표 4.2.4</strong><br/>
                  관로 주변 중요 시설물(도로·교량·건물) 존재 여부
                </div>
                <div style={{ fontSize: 11 }}>
                  주요 시설물 하부를 통과하거나 인접한 경우,<br/>
                  지진 피해 시 파급 효과가 크므로 취약도를 높게 평가함.<br/>
                  도로 하부 횡단 구간, 건물 기초 인근 구간 등이 해당.
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginTop: 6 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>분류</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>내용</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(FACIL_INDEX).map(([k, v]: any, i) => (
                      <tr key={k} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', fontWeight: 700 }}>{k}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>{v.label}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>{v.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </EngPopover>
          }>
            <EngRadio
              options={[
                { key: 'yes', label: '있음 (1.0)' },
                { key: 'no',  label: '없음 (0.8)' },
              ]}
              value={inp.facilExists}
              onChange={v => set({ facilExists: v })}
            />
          </EngRow>
          <EngDivider />
          <EngRow label="이음처리방법 (MCONE)" popover={
            <EngPopover title="이음처리방법 지수 MCONE">
              <div style={{ fontSize: 11, lineHeight: 1.8, fontFamily: T.fontSans }}>
                <div style={{ background: '#e8f4e8', border: '1px solid #6ab04c', padding: '6px 8px', borderRadius: 3, marginBottom: 6 }}>
                  <strong style={{ color: '#2d6a2d' }}>매설관로 내진성능평가 요령 §4.2.2 표 4.2.5</strong><br/>
                  이음부 보강(내진처리) 시공 여부에 관한 지수
                </div>
                <div style={{ fontSize: 11 }}>
                  동일한 이음 형식이라도 내진처리(앵커, 억제이음 등) 여부에 따라<br/>
                  내진 성능이 크게 달라짐. 기존 관로의 이음처리 이력을 확인하여 입력.
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginTop: 6 }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>분류</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>내용</th>
                      <th style={{ padding: '2px 5px', border: '1px solid #ccc' }}>점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(MCONE_INDEX).map(([k, v]: any, i) => (
                      <tr key={k} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', fontWeight: 700 }}>{k}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee' }}>{v.label}</td>
                        <td style={{ padding: '2px 5px', border: '1px solid #eee', textAlign: 'center', fontFamily: T.fontMono }}>{v.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 6, padding: '4px 8px', background: '#e8f0fb', border: '1px solid #5b9bd5', borderRadius: 2, fontSize: 10 }}>
                  CONNECT + FACIL + MCONE 3가지 세부지수를 가중합산하여<br/>
                  최종 취약도지수(VI)를 산정하고 내진성능 그룹(A~E)을 판정함.
                </div>
              </div>
            </EngPopover>
          }>
            <EngRadio
              options={[
                { key: 'rigid',  label: '강결 Rigid (1.0)' },
                { key: 'bolted', label: '볼팅 Bolted (0.7)' },
              ]}
              value={inp.mcone}
              onChange={v => set({ mcone: v })}
            />
          </EngRow>
        </EngPanel>

        {/* 계산 버튼 */}
        <button
          onClick={handleCalc}
          style={{
            width: '100%', padding: '7px 0',
            background: T.bgActive, color: 'white', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            borderRadius: 2, fontFamily: T.fontSans, letterSpacing: 0.3,
          }}
        >
          취약도지수 산정 및 그룹 판정  ▶
        </button>
      </div>

      {/* ── 우측 삽도 패널 ─────────────────────────────── */}
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>
        <EngPanel title="지반분류 단면도  (KDS 17 10 00)">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <SoilProfileSVG soilType={inp.soilType} pipeDepth={1.5}/>
          </div>
          {/* 지반분류 설명표 */}
          <EngDivider label="지반종류 분류 기준"/>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontSans }}>
            <thead>
              <tr style={{ background: T.bgSection }}>
                <th style={{ padding: '3px 6px', textAlign: 'center', border: `1px solid ${T.border}`, width: 40 }}>분류</th>
                <th style={{ padding: '3px 6px', textAlign: 'left',   border: `1px solid ${T.border}` }}>지반 특성</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SOIL_TYPE).map(([k, v], i) => (
                <tr key={k} style={{ background: k === inp.soilType ? '#dce8f5' : (i % 2 === 0 ? T.bgRowAlt : T.bgRow) }}>
                  <td style={{ padding: '3px 6px', textAlign: 'center', border: `1px solid ${T.borderLight}`, fontWeight: 700, color: k === inp.soilType ? T.bgActive : T.textPrimary, fontFamily: T.fontMono }}>
                    {k}
                  </td>
                  <td style={{ padding: '3px 6px', border: `1px solid ${T.borderLight}`, fontSize: 10 }}>
                    {v.label.replace(`${k} — `, '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </EngPanel>
      </div>
    </div>
  )
}
