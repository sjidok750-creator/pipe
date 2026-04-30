import sys, math
sys.stdout.reconfigure(encoding='utf-8')

_XI1_K  = 0.9517
_XI1_U0 = 2.878

_XI2_TABLE = {
  0.01: [[0,0],[100,0.001],[200,0.020],[300,0.120],[350,0.280],[400,0.500],[450,0.750],[500,0.920],[550,1.020],[600,1.055],[650,1.065],[700,1.058],[800,1.030],[1000,1.010],[1400,1.003],[2000,1.000]],
  0.02: [[0,0],[50,0.001],[75,0.004],[100,0.019],[108,0.027],[120,0.048],[140,0.115],[160,0.245],[180,0.460],[200,0.680],[220,0.880],[240,0.995],[250,1.052],[265,1.068],[280,1.072],[300,1.065],[350,1.035],[400,1.015],[500,1.005],[700,1.000]],
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
            tt = (x - pts[i][0]) / (pts[i+1][0] - pts[i][0])
            return pts[i][1] + tt * (pts[i+1][1] - pts[i][1])
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
    return min(1.0, max(0, 0.5*(1+math.tanh(_XI1_K*(math.log(u)-math.log(_XI1_U0))))))

def calc_xi2(lam2L, nu_val):
    return max(0, interp_xi2(_XI2_TABLE, lam2L, nu_val))

print("="*60)
print("부록C 예제 C.1 전체 계산 재현")
print("="*60)

# 입력값 (Page 161 / 163)
Uh = 0.0351   # m, 관축위치 수평변위진폭
L  = 217.72   # m, 파장
D  = 0.9      # m, 외경
E_MPa = 160000  # MPa, 덕타일 주철관
E_kN  = E_MPa * 1000  # kN/m² = 1.6e8
A  = 0.033    # m², 단면적 (Page 161: 0.033m²)
I  = 3.25e-3  # m⁴, 단면2차모멘트
l  = 6.0      # m, 관 1본 길이
K1 = 15740    # kN/m² (예제값)
K2 = 31480    # kN/m² (예제값)

# λ1, λ2
lambda1 = math.sqrt(K1 / (E_kN * A))
lambda2 = (K2 / (E_kN * I))**0.25
print(f"λ1 = {lambda1:.4e} m⁻¹  (ref: 5.46e-2)")
print(f"λ2 = {lambda2:.4e} m⁻¹  (ref: 4.96e-1)")

# L', ν', ν
Lprime = math.sqrt(2) * L
nu_prime = l / Lprime
nu_val   = l / L
lam1Lp = lambda1 * Lprime
lam2L  = lambda2 * L
print(f"L' = √2×{L} = {Lprime:.2f} m  (ref: 307.90)")
print(f"ν' = l/L' = 6/{Lprime:.2f} = {nu_prime:.4f}  (ref: 0.019)")
print(f"ν  = l/L  = 6/{L} = {nu_val:.4f}  (ref: 0.028)")
print(f"λ1L' = {lam1Lp:.4f}  (ref: 16.818)")
print(f"λ2L  = {lam2L:.4f}  (ref: 107.979)")

# α1, α2
alpha1 = 1 / (1 + (2*math.pi / (lambda1*Lprime))**2)
alpha2 = 1 / (1 + (2*math.pi / (lambda2*L))**4)
print(f"α1 = {alpha1:.4f}  (ref: 0.878)")
print(f"α2 = {alpha2:.4f}  (ref: 1.0)")

# ξ1, ξ2
xi1 = calc_xi1(lam1Lp, nu_prime)
xi2 = calc_xi2(lam2L, nu_val)
print(f"ξ1 = {xi1:.4f}  (ref: 0.015)")
print(f"ξ2 = {xi2:.4f}  (ref: 0.149)")

# σ_L, σ_B
sigma_L = alpha1 * (math.pi * Uh / L) * E_kN
sigma_B = alpha2 * (2*math.pi**2 * D * Uh / L**2) * E_kN
sigma_L_prime = xi1 * sigma_L
sigma_B_prime = xi2 * sigma_B
sigma_x = math.sqrt(sigma_L_prime**2 + sigma_B_prime**2)

print(f"σ_L = {sigma_L:.1f} kN/m²  (ref: 71193)")
print(f"σ_B = {sigma_B:.1f} kN/m²  (ref: 2107)")
print(f"σ'_L = {sigma_L_prime:.1f} kN/m²  (ref: 1068)")
print(f"σ'_B = {sigma_B_prime:.1f} kN/m²  (ref: 314)")
print(f"σ_x = {sigma_x:.1f} kN/m² = {sigma_x/1000:.4f} MPa  (ref: 1113 kN/m² = 1.113 MPa)")
print(f"오차: {abs(sigma_x-1113)/1113*100:.1f}%")
