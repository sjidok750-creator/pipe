import sys, math
sys.stdout.reconfigure(encoding='utf-8')

# 실제 ν값: 0.0276 (ref에서 0.028로 반올림)
# t = log(0.0276/0.02)/log(0.04/0.02)
t = (math.log(0.0276) - math.log(0.02)) / (math.log(0.04) - math.log(0.02))
print(f"실제 ν=0.0276에서 t = {t:.4f}")

xi2_04 = 1.055  # x=108에서 ν=0.04값
xi2_ref = 0.149  # 참조값

# 역산: 필요한 ν=0.02 값
log_a = (math.log(xi2_ref) - t*math.log(xi2_04)) / (1 - t)
xi2_02_needed = math.exp(log_a)
print(f"필요한 ξ2(ν=0.02, x=108) = {xi2_02_needed:.6f}")

# 검증
result = math.exp(math.log(xi2_02_needed) + t*(math.log(xi2_04)-math.log(xi2_02_needed)))
print(f"검증: {result:.4f} (ref=0.149)")

# 현재 ν=0.028 보간 x=108에서 0.1359가 나오는 원인:
# ν=0.0276이 ν=0.028보다 작으므로 약간 낮음이 정상
# 하지만 ν=0.02 테이블값 조정으로 맞출 수 있음

# 새로운 ν=0.02, x=108 목표값
print(f"\n현재 테이블: ξ2_02(x=108) = 0.0235")
print(f"필요한 테이블: ξ2_02(x=108) = {xi2_02_needed:.5f}")
print(f"조정 비율: {xi2_02_needed/0.0235:.3f}x")

# 테이블에서 x=108 부근 포인트 조정
# 기존: [100, 0.016], [108, 0.0235]
# 신규: [100, 0.016*(비율)], [108, xi2_02_needed]
ratio = xi2_02_needed / 0.0235
new_100 = 0.016 * ratio
print(f"\n새 포인트: [100, {new_100:.5f}], [108, {xi2_02_needed:.5f}]")

# 하지만 이 값들은 그래프에서 실제로 읽히는 값이어야 함
# 그래프에서 ν=0.02 곡선이 x=108에서 0.040이면:
# t=0.411, xi2_04=1.055 → interp = exp(log(0.040)+0.411*(log(1.055)-log(0.040)))
#   = exp(-3.219 + 0.411*3.276) = exp(-3.219+1.346) = exp(-1.873) = 0.154 ✓
print(f"\n만약 ξ2_02(x=108) = 0.040이면:")
v = 0.040
res = math.exp(math.log(v) + t*(math.log(xi2_04)-math.log(v)))
print(f"  보간 결과: {res:.4f} (ref=0.149)")

print(f"\n만약 ξ2_02(x=108) = 0.045이면:")
v = 0.045
res = math.exp(math.log(v) + t*(math.log(xi2_04)-math.log(v)))
print(f"  보간 결과: {res:.4f}")

print(f"\n만약 ξ2_02(x=108) = 0.050이면:")
v = 0.050
res = math.exp(math.log(v) + t*(math.log(xi2_04)-math.log(v)))
print(f"  보간 결과: {res:.4f}")
