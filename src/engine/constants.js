// ============================================================
// PipeCheck KDS — 계산 기준 상수 테이블
// KDS 57 00 00 : 2022 / KS D 3565 / KS D 4311 / AWWA M11
// ============================================================

// 관종별 재료 상수
export const PIPE_MATERIAL = {
  steel: {
    fy: 235,                    // MPa — SS400급 항복강도 (KS D 3565)
    Es: 206000,                 // MPa — 강관 탄성계수
    allowRatio_normal: 0.50,    // 상시운전 허용응력 비율
    allowRatio_surge: 0.75,     // 수격압 허용응력 비율
    corrosionAllowance: 1.5,    // mm — 부식여유 (PE피복 적용 시)
    handlingDivisor: 288,       // t_handling = Do / 288
    maxDeflection_plain: 5.0,   // % — 라이닝 없음
    maxDeflection_lined: 3.0,   // % — 시멘트 모르타르 라이닝
    bucklingFS: 2.5,            // 좌굴 안전율
  },
  ductile: {
    fu: 420,                    // MPa — GCD400급 인장강도 (KS D 4311)
    Edi: 166000,                // MPa — 덕타일 주철관 탄성계수
    allowRatio_hoop: 1 / 3,     // 내압 허용응력 = fu/3
    allowRatio_bending: 0.50,   // 링 휨 허용응력 = 0.5*fu
    maxDeflection: 3.0,         // %
  },
}

// KS D 4311 DN별 K등급 두께 테이블 (주요 관경)
// DN: { Do(mm외경), K7, K9, K10, K12 } — 단위 mm
export const DI_THICKNESS = {
  100:  { Do: 118,  K7: 4.5, K9: 5.0, K10: 5.3,  K12: 6.1  },
  150:  { Do: 170,  K7: 4.8, K9: 5.5, K10: 5.8,  K12: 6.7  },
  200:  { Do: 222,  K7: 5.0, K9: 5.7, K10: 6.1,  K12: 7.0  },
  250:  { Do: 274,  K7: 5.2, K9: 5.9, K10: 6.3,  K12: 7.2  },
  300:  { Do: 326,  K7: 5.3, K9: 6.3, K10: 6.8,  K12: 7.8  },
  350:  { Do: 378,  K7: 5.5, K9: 6.5, K10: 7.0,  K12: 8.0  },
  400:  { Do: 429,  K7: 5.7, K9: 6.7, K10: 7.2,  K12: 8.3  },
  450:  { Do: 480,  K7: 5.9, K9: 6.9, K10: 7.4,  K12: 8.5  },
  500:  { Do: 532,  K7: 6.1, K9: 7.1, K10: 7.6,  K12: 8.8  },
  600:  { Do: 635,  K7: 6.3, K9: 7.5, K10: 8.0,  K12: 9.2  },
  700:  { Do: 738,  K7: 6.6, K9: 7.8, K10: 8.4,  K12: 9.6  },
  800:  { Do: 842,  K7: 7.0, K9: 8.2, K10: 8.9,  K12: 10.2 },
  900:  { Do: 945,  K7: 7.3, K9: 8.6, K10: 9.3,  K12: 10.7 },
  1000: { Do: 1048, K7: 7.7, K9: 9.0, K10: 9.7,  K12: 11.2 },
}

// KS D 3565 강관 표준 두께 테이블 (Do mm, PN등급별 t mm)
// DN: { Do, PN6, PN10, PN16 }
export const STEEL_THICKNESS = {
  100:  { Do: 114.3,  PN6: 3.5,  PN10: 4.5,  PN16: 6.0  },
  150:  { Do: 165.2,  PN6: 4.0,  PN10: 5.0,  PN16: 7.0  },
  200:  { Do: 216.3,  PN6: 4.5,  PN10: 6.0,  PN16: 8.0  },
  250:  { Do: 267.4,  PN6: 5.0,  PN10: 6.0,  PN16: 9.0  },
  300:  { Do: 318.5,  PN6: 5.5,  PN10: 6.0,  PN16: 9.5  },
  350:  { Do: 355.6,  PN6: 5.5,  PN10: 6.0,  PN16: 10.0 },
  400:  { Do: 406.4,  PN6: 6.0,  PN10: 6.0,  PN16: 11.0 },
  450:  { Do: 457.2,  PN6: 6.0,  PN10: 7.0,  PN16: 12.0 },
  500:  { Do: 508.0,  PN6: 6.0,  PN10: 7.0,  PN16: 12.0 },
  600:  { Do: 610.0,  PN6: 6.0,  PN10: 8.0,  PN16: 14.0 },
  700:  { Do: 711.0,  PN6: 7.0,  PN10: 9.0,  PN16: 16.0 },
  800:  { Do: 813.0,  PN6: 8.0,  PN10: 10.0, PN16: 18.0 },
  900:  { Do: 914.0,  PN6: 8.0,  PN10: 11.0, PN16: 19.0 },
  1000: { Do: 1016.0, PN6: 9.0,  PN10: 12.0, PN16: 20.0 },
  1200: { Do: 1220.0, PN6: 10.0, PN10: 14.0, PN16: 22.0 },
  1500: { Do: 1524.0, PN6: 12.0, PN10: 16.0, PN16: 26.0 },
}

// KS D 3565 PN등급 목록
export const STEEL_PN_GRADES = ['PN6', 'PN10', 'PN16']

// KS D 4311 K등급 목록 (K7: 특수용도, K9 이상 일반)
export const DI_K_GRADES = ['K7', 'K9', 'K10', 'K12']

// E' 값 테이블 (kPa) — AWWA M11 Table 5-3 SI 환산
export const E_PRIME = {
  SC1:   { 80: 1400, 85: 2700, 90: 6900 },  // 조립토 (자갈, 모래)
  SC2:   { 80: 700,  85: 2000, 90: 4800 },  // 혼합토
  SC3:   { 85: 700,  90: 1400 },            // 세립토 (점토, 실트)
  loose: { default: 300 },                  // 연약지반
}

// DB-24 차량하중 등가 수직압력 (kPa) — 매설깊이별 Boussinesq 적분값
// 충격계수(IF) 포함 전 순수 압력 PL
export const DB24_PRESSURE = {
  // H(m): { PL(kPa before IF), IF }
  0.6: { PL: 61.2, IF: 1.30 },
  0.9: { PL: 38.4, IF: 1.30 },
  1.2: { PL: 21.6, IF: 1.15 },
  1.5: { PL: 14.4, IF: 1.15 },
  1.8: { PL: 10.1, IF: 1.00 },
  2.1: { PL: 7.5,  IF: 1.00 },
  2.4: { PL: 6.0,  IF: 1.00 },
  3.0: { PL: 3.8,  IF: 1.00 },
  3.6: { PL: 2.5,  IF: 1.00 },
  4.0: { PL: 1.8,  IF: 1.00 },
}

// 침상 조건 계수 (DIPRA) — 덕타일 주철관
export const BEDDING = {
  Type1: { Kb: 0.294, Kd: 0.110, label: 'Type 1 — 쇄석기초 (0°)' },
  Type2: { Kb: 0.235, Kd: 0.108, label: 'Type 2 — 모래 다짐 120°' },
  Type3: { Kb: 0.189, Kd: 0.090, label: 'Type 3 — 모래 전면 180°' },
  Type4: { Kb: 0.157, Kd: 0.083, label: 'Type 4 — 콘크리트 전면지지' },
}

// 강관 기초지지각별 Kb 계수 (AWWA M11 Table 5-1 / KDS 57 10 00)
// 기초지지각: 관 하부 지지 범위 (°)
// Kb: 휨응력 계수, Kx: 처짐계수
export const STEEL_BEDDING = {
  deg0:   { Kb: 0.294, Kx: 0.110, label: '0° — 점토기초 (기초다짐 없음)' },
  deg30:  { Kb: 0.235, Kx: 0.108, label: '30° — 모래·쇄석 약간 다짐' },
  deg60:  { Kb: 0.189, Kx: 0.090, label: '60° — 모래·쇄석 균일다짐' },
  deg90:  { Kb: 0.157, Kx: 0.083, label: '90° — 모래·쇄석 1/4높이 다짐 (일반)' },
  deg120: { Kb: 0.128, Kx: 0.069, label: '120° — 모래·쇄석 중간높이 다짐' },
  deg180: { Kb: 0.090, Kx: 0.053, label: '180° — 콘크리트 전면지지 (최우수)' },
}

// 지하수위 옵션
export const GW_LEVEL_OPTIONS = [
  { value: 'below',   label: '관저 이하 (지하수 없음)' },
  { value: 'bottom',  label: '관저 위치' },
  { value: 'center',  label: '관 중심' },
  { value: 'top',     label: '관정' },
  { value: 'surface', label: '지표면' },
]

// 지하수위별 Rw 계수 (AWWA M11)
export const GW_RW = {
  below:   1.00,
  bottom:  0.90,
  center:  0.70,
  top:     0.50,
  surface: 0.33,
}

// 강관 DN 목록
export const STEEL_DN_LIST = [100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1200, 1500]

// 주철관 DN 목록
export const DI_DN_LIST = [100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000]

// KDS 기준 출처 라벨
export const REFERENCES = {
  earthLoad:    'KDS 57 10 00 §3.1 / AWWA M11 Ch.5',
  trafficLoad:  'KDS 24 12 20 (DB-24) / Boussinesq',
  hoopStress:   'KDS 57 10 00 / AWWA M11 Eq.3-1',
  deflection:   'AWWA M11 Eq.5-4 (Modified Iowa)',
  buckling:     'AWWA M11 Eq.5-5',
  diHoop:       'KS D 4311 / DIPRA §2.1',
  diBending:    'DIPRA §2.3',
  diDeflection: 'AWWA C150 / DIPRA §2.4',
}
