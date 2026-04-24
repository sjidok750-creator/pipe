// 연속관(강관) 엑셀 예제 검증 스크립트 v3
// 근거: 02-3. 관로내진성능평가.xlsx '하안송수관로 01(01)'
// 수정된 공식: K1=1.5γVds²/g, K2=3.0γVds²/g, Uh=2/π²*Sv*Ts*cos(...)
//             xi=2√2*E*t/τ, εUy=46t/D, εB=a2*(2π²D*Uh/L²), L'=√2*L

function calcGroundStiffness(gamma,Vds,g){
  if(!g)g=9.81
  return {K1:1.5*(gamma*Vds**2)/g, K2:3.0*(gamma*Vds**2)/g}
}
function calcGroundDisp(Sv,Ts,z,H){
  return (2/Math.PI**2)*Sv*Ts*Math.cos(Math.PI*z/(2*H))
}
function calcLambda(K1,K2,E,A,I){
  return {lambda1:Math.sqrt(K1/(E*A)),lambda2:Math.pow(K2/(E*I),0.25)}
}
function calcWavelength(Ts,Vds,Vbs){
  const L1=Vds*Ts, L2=Vbs*Ts
  return {L:2*L1*L2/(L1+L2), L1, L2}
}

function chk(label,actual,expected,unit,tol){
  if(!tol)tol=0.01
  const diff=Math.abs(actual-expected)/(Math.abs(expected)||1)
  const ok=diff<=tol
  console.log('  ['+(ok?'OK':'**FAIL**')+'] '+label+': calc='+actual.toFixed(8)+' | ex='+expected+' '+unit+' | err '+(diff*100).toFixed(2)+'%')
}
function sec(t){console.log('\n=== '+t+' ===')}

sec('하안송수관로 01(01) 강관 — 수정 공식 검증')

const D=1, t=0.008, E=210000*1000, nu=0.3  // m, kN/m2
const A=Math.PI/4*(D**2-(D-2*t)**2)
const I=Math.PI/64*(D**4-(D-2*t)**4)
const Vds=118.81188118811882, Vbs=760, gamma=19, H=12, z=4.5
const Ts=0.404, Sv_ex=0.113  // Excel 값

const {K1,K2}=calcGroundStiffness(gamma,Vds)
chk('K1',K1,41010.55,'kN/m2')
chk('K2',K2,82021.10,'kN/m2')

const {lambda1,lambda2}=calcLambda(K1,K2,E,A,I)
chk('lambda1',lambda1,0.08850389,'m-1')
chk('lambda2',lambda2,0.59737672,'m-1')

const {L}=calcWavelength(Ts,Vds,Vbs)
const Lp=Math.SQRT2*L
chk('L',L,83.02118,'m')
chk("L'",Lp,117.40968,'m')

const alpha1=1/(1+Math.pow(2*Math.PI/(lambda1*Lp),2))
const alpha2=1/(1+Math.pow(2*Math.PI/(lambda2*L),4))
chk('alpha1',alpha1,0.732269,'')
chk('alpha2',alpha2,0.999936,'')

// Uh = 2/π² × Sv × Ts × cos(πz/2H)
const Uh=calcGroundDisp(Sv_ex,Ts,z,H)
chk('Uh',Uh,0.007691949788,'m')

// epsilon_G = π × Uh / L
const epsilon_G=Math.PI*Uh/L
chk('epsilon_G',epsilon_G,0.0002910699744,'')

// xi = 2√2 × E×t / τ
const tau=10, epsilon_Uy=46*t/D  // =0.00368
const xi=2*Math.SQRT2*E*t/tau
const L1=xi*epsilon_Uy
chk('xi',xi,475175.757,'m')
chk('epsilon_Uy',epsilon_Uy,0.00368,'')
chk('L1',L1,1748.647,'m')

// L < L1 → 마찰지배
console.log('  L='+L.toFixed(2)+'m vs L1='+L1.toFixed(1)+'m → '+(L<L1?'마찰지배':'일반식'))
const epsilon_L=L/xi
// epsilon_B = a2 × 2π²×D×Uh/L²
const epsilon_B=alpha2*(2*Math.PI**2*D*Uh/L**2)
const epsilon_x=Math.sqrt(epsilon_L**2+epsilon_B**2)
chk('epsilon_L(마찰)',epsilon_L,0.0001747168,'')
chk('epsilon_B',epsilon_B,2.2027256e-5,'')
chk('epsilon_x',epsilon_x,0.0001761,'')

// 최종 합계
const epsilon_i=nu*1.733e3*(D-t)/(2*t)/E
const epsilon_t=1.2e-5*20
const epsilon_total=Math.abs(epsilon_i)+epsilon_t+epsilon_x
chk('epsilon_i',Math.abs(epsilon_i),0.00015349,'',0.002)
chk('epsilon_t',epsilon_t,0.00024,'')
chk('epsilon_x',epsilon_x,0.00017610,'',0.005)
chk('epsilon_total',epsilon_total,0.0005695941,'',0.005)
console.log('  허용 εUy='+(epsilon_Uy*100).toFixed(3)+'% → OK: '+(epsilon_total<=epsilon_Uy))
console.log('\n[완료] 모든 수정 공식 검증')