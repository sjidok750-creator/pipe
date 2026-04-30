import sys, math
sys.stdout.reconfigure(encoding='utf-8')

# Current tables
XI1_TABLE = {
  0.01: [[0,0],[25,0.005],[50,0.010],[75,0.015],[90,0.0187],[100,0.020],[150,0.030],[200,0.040],[300,0.058],[400,0.075],[500,0.090]],
  0.02: [[0,0],[25,0.006],[50,0.012],[75,0.018],[100,0.023],[150,0.040],[200,0.065],[300,0.115],[400,0.160],[500,0.200]],
  0.04: [[0,0],[20,0.250],[30,0.420],[50,0.620],[75,0.820],[100,0.920],[125,0.970],[150,0.990],[200,0.998],[300,1.000],[500,1.000]],
  0.06: [[0,0],[10,0.230],[20,0.480],[30,0.670],[50,0.870],[75,0.960],[100,0.990],[150,1.000],[500,1.000]],
  0.10: [[0,0],[10,0.400],[20,0.680],[30,0.860],[40,0.940],[50,0.970],[70,0.992],[100,1.000],[500,1.000]],
  0.20: [[0,0],[5,0.380],[10,0.650],[15,0.840],[20,0.930],[30,0.980],[40,0.995],[60,1.000],[500,1.000]],
}
XI2_TABLE = {
  0.01: [[0,0],[50,0.080],[100,0.170],[150,0.255],[200,0.330],[300,0.460],[400,0.565],[500,0.650]],
  0.02: [[0,0],[25,0.090],[50,0.240],[75,0.510],[100,0.790],[125,0.990],[150,1.060],[175,1.075],[200,1.070],[250,1.040],[300,1.020],[400,1.005],[500,1.000]],
  0.04: [[0,0],[10,0.130],[20,0.410],[30,0.710],[40,0.920],[50,1.030],[60,1.070],[75,1.080],[100,1.060],[125,1.030],[150,1.015],[200,1.005],[300,1.000],[500,1.000]],
  0.06: [[0,0],[10,0.440],[20,0.840],[30,1.010],[40,1.060],[50,1.070],[60,1.060],[75,1.040],[100,1.015],[150,1.005],[200,1.000],[500,1.000]],
  0.10: [[0,0],[5,0.350],[10,0.740],[15,0.960],[20,1.040],[25,1.060],[30,1.050],[40,1.025],[50,1.010],[75,1.002],[100,1.000],[500,1.000]],
  0.20: [[0,0],[3,0.330],[5,0.630],[8,0.920],[10,1.020],[12,1.055],[15,1.060],[20,1.040],[30,1.015],[50,1.003],[100,1.000],[500,1.000]],
}

def interp1d(pts, x):
    if x <= pts[0][0]: return pts[0][1]
    if x >= pts[-1][0]: return pts[-1][1]
    for i in range(len(pts)-1):
        if pts[i][0] <= x <= pts[i+1][0]:
            t = (x - pts[i][0]) / (pts[i+1][0] - pts[i][0])
            return pts[i][1] + t * (pts[i+1][1] - pts[i][1])
    return pts[-1][1]

def interp_xi(table, lam, nu):
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
    if xi_lo > 0 and xi_hi > 0:
        return max(0, math.exp(math.log(xi_lo) + t * (math.log(xi_hi) - math.log(xi_lo))))
    return max(0, xi_lo + t * (xi_hi - xi_lo))

# Example values from page 163
lam1Lp = 16.818
nu_prime = 0.019
lam2L = 107.979
nu_val = 0.028

xi1 = interp_xi(XI1_TABLE, lam1Lp, nu_prime)
xi2 = interp_xi(XI2_TABLE, lam2L, nu_val)

print(f"ξ1: lam1L'={lam1Lp}, ν'={nu_prime} → app={xi1:.4f}, reference=0.015")
print(f"ξ2: lam2L={lam2L}, ν={nu_val} → app={xi2:.4f}, reference=0.149")
print()

# Check intermediate values to understand curve shape
print("=== ξ1 table at ν'=0.02, various x ===")
for x in [0, 10, 16.818, 25, 50, 100, 200, 300]:
    v = interp1d(XI1_TABLE[0.02], x)
    print(f"  x={x:6.1f}: ξ1={v:.4f}")

print()
print("=== ξ2 table interpolated at ν=0.028, various x ===")
for x in [0, 50, 75, 100, 107.979, 125, 150, 200]:
    v = interp_xi(XI2_TABLE, x, 0.028)
    print(f"  x={x:6.1f}: ξ2={v:.4f}")

print()
print("=== ξ2 at ν=0.02, ν=0.04 individually (x=108) ===")
v02 = interp1d(XI2_TABLE[0.02], 107.979)
v04 = interp1d(XI2_TABLE[0.04], 107.979)
print(f"  ν=0.02 → {v02:.4f}")
print(f"  ν=0.04 → {v04:.4f}")
t = (math.log(0.028) - math.log(0.02)) / (math.log(0.04) - math.log(0.02))
print(f"  log-interp t={t:.3f}")
print(f"  log-interp result: {math.exp(math.log(v02) + t*(math.log(v04)-math.log(v02))):.4f}")
