import sys, math
sys.stdout.reconfigure(encoding='utf-8')

# ═══ 수정 후 코드와 동일 로직 ═══

_XI1_K  = 0.9517
_XI1_U0 = 2.878

_XI2_TABLE = {
  0.01: [[0,0],[100,0.024],[200,0.170],[300,0.510],[350,0.850],[400,0.990],[450,1.050],[500,1.060],[600,1.050],[700,1.020],[900,1.005],[1200,1.000]],
  0.02: [[0,0],[50,0.004],[100,0.024],[130,0.120],[150,0.300],[175,0.600],[200,0.870],[225,1.000],[250,1.065],[275,1.070],[300,1.060],[350,1.030],[400,1.015],[500,1.005],[700,1.000]],
  0.04: [[0,0],[20,0.050],[30,0.190],[40,0.430],[50,0.680],[60,0.880],[70,0.990],[78,1.050],[85,1.075],[100,1.055],[125,1.025],[150,1.010],[200,1.003],[300,1.000],[500,1.000]],
  0.06: [[0,0],[15,0.120],[25,0.430],[35,0.760],[45,0.970],[52,1.040],[58,1.070],[65,1.075],[75,1.060],[90,1.030],[120,1.010],[180,1.003],[300,1.000],[500,1.000]],
  0.10: [[0,0],[8,0.140],[15,0.500],[20,0.780],[25,0.940],[30,1.020],[35,1.060],[40,1.070],[50,1.055],[65,1.025],[90,1.010],[150,1.003],[250,1.000],[500,1.000]],
  0.20: [[0,0],[4,0.140],[8,0.500],[12,0.830],[15,0.980],[18,1.040],[22,1.070],[28,1.060],[35,1.030],[50,1.010],[80,1.003],[130,1.000],[500,1.000]],
}

def interp1d(pts, x):
    if x <= pts[0][0]: return pts[0][1]
    if x >= pts[-1][0]: return pts[-1][1]
    for i in range(len(pts)-1):
        if pts[i][0] <= x <= pts[i+1][0]:
            t = (x - pts[i][0]) / (pts[i+1][0] - pts[i][0])
            return pts[i][1] + t * (pts[i+1][1] - pts[i][1])
    return pts[-1][1]

def interp_xi2(table, lam, nu):
    nu_keys = sorted(table.keys())
    nu_cl = max(nu_keys[0], min(nu_keys[-1], nu))
    lo, hi = nu_keys[0], nu_keys[-1]
    for i in range(len(nu_keys)-1):
        if nu_keys[i] <= nu_cl <= nu_keys[i+1]:
            lo, hi = nu_keys[i], nu_keys[i+1]
            break
    xi_lo = interp1d(table[lo], lam)
    if lo == hi: return max(0, xi_lo)
    xi_hi = interp1d(table[hi], lam)
    t = (math.log(nu_cl) - math.log(lo)) / (math.log(hi) - math.log(lo))
    if xi_lo > 0.001 and xi_hi > 0.001:
        return max(0, math.exp(math.log(xi_lo) + t*(math.log(xi_hi) - math.log(xi_lo))))
    return max(0, xi_lo + t*(xi_hi - xi_lo))

def calc_xi1(lam1Lp, nu_prime):
    u = nu_prime * lam1Lp
    if u <= 0: return 0
    return min(1.0, max(0, 0.5 * (1 + math.tanh(_XI1_K * (math.log(u) - math.log(_XI1_U0))))))

def calc_xi2(lam2L, nu_val):
    return max(0, interp_xi2(_XI2_TABLE, lam2L, nu_val))

print("="*60)
print("앵커 검증 (부록C 예제 C.1)")
print("="*60)
xi1 = calc_xi1(16.818, 0.019)
xi2 = calc_xi2(107.979, 0.028)
print(f"ξ1: λ1L'=16.818, ν'=0.019 → {xi1:.4f}  (ref=0.015, err={abs(xi1-0.015)/0.015*100:.1f}%)")
print(f"ξ2: λ2L=107.979, ν=0.028  → {xi2:.4f}  (ref=0.149, err={abs(xi2-0.149)/0.149*100:.1f}%)")

# 최종 σx 계산 검증
print()
print("="*60)
print("부록C 예제 σx 검증")
print("="*60)
Uh = 0.0351  # m
L = 217.72   # m
D = 0.9      # m
E_kN = 1.6e5 # kN/m²
alpha1 = 0.878
alpha2 = 1.0

sigma_L = alpha1 * (math.pi * Uh / L) * E_kN
sigma_B = alpha2 * (2 * math.pi**2 * D * Uh / L**2) * E_kN
sigma_L_prime = xi1 * sigma_L
sigma_B_prime = xi2 * sigma_B
sigma_x = math.sqrt(sigma_L_prime**2 + sigma_B_prime**2)

print(f"σ_L = {sigma_L:.1f} kN/m² = {sigma_L/1000:.4f} MPa")
print(f"σ_B = {sigma_B:.1f} kN/m² = {sigma_B/1000:.4f} MPa")
print(f"σ'_L = ξ1×σ_L = {sigma_L_prime:.1f} kN/m² = {sigma_L_prime/1000:.4f} MPa  (ref=1068 kN/m²)")
print(f"σ'_B = ξ2×σ_B = {sigma_B_prime:.1f} kN/m² = {sigma_B_prime/1000:.4f} MPa  (ref=314 kN/m²)")
print(f"σ_x = √(σ'L²+σ'B²) = {sigma_x:.1f} kN/m² = {sigma_x/1000:.4f} MPa  (ref=1113 kN/m² = 1.113 MPa)")
print()
err = abs(sigma_x - 1113) / 1113 * 100
print(f"σ_x 오차: {err:.1f}%")

print()
print("="*60)
print("ξ2 테이블 모양 확인 (각 ν별 피크 위치)")
print("="*60)
for nu in [0.01, 0.02, 0.04, 0.06, 0.10, 0.20]:
    pts = _XI2_TABLE[nu]
    peak_x = max(pts, key=lambda p: p[1])
    print(f"ν={nu:.2f}: 피크 x={peak_x[0]}, ξ2_peak={peak_x[1]:.3f}, π/ν={math.pi/nu:.1f}")
