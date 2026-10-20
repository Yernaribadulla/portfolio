export const fullscreenVertex = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// Original implementation. Spatial Schwarzschild null geodesics, integrated
// with velocity Verlet. Spin changes the emission model, not the metric.
export const blackHoleFragment = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform vec3 uCamera;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uTime;
uniform float uMass;
uniform float uSpin;
uniform float uIntensity;
uniform float uReveal;
uniform float uBeyond;
uniform float uGravity;
uniform float uLens;
uniform int uSteps;

#define PI 3.14159265359

float hash13(vec3 p) {
  p = fract(p * .1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash13(i), hash13(i+vec3(1,0,0)),f.x),
                 mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),
                 mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p) {
  return .54*noise(p) + .27*noise(p*2.03+7.1) + .135*noise(p*4.11+13.7);
}
vec3 sky(vec3 rd) {
  // A procedural celestial sphere; the escaped, deflected ray chooses the sky.
  vec3 d = normalize(rd + uCamera*.0007);
  vec3 color = vec3(.0016,.0021,.0032);
  float galactic = exp(-pow(abs(d.y*.85+d.x*.25+.15)*4.8, 2.0));
  float cloud = fbm(d*8.0+vec3(1.0,6.0,2.0));
  color += mix(vec3(.018,.014,.012),vec3(.013,.024,.031), cloud)
    * pow(cloud,2.4)*galactic;
  for(int layer=0;layer<3;layer++) {
    float scale = 125.0 + float(layer)*103.0;
    vec3 p = d*scale;
    vec3 cell = floor(p);
    vec3 local = fract(p)-.5;
    float h = hash13(cell+float(layer)*9.3);
    vec3 offset = vec3(hash13(cell+2.7),hash13(cell+9.2),hash13(cell+4.8))-.5;
    float r = length(local-offset*.65);
    float width = max(.042,scale/uResolution.y*.46);
    float star = exp(-r*r/(width*width))*step(.992-float(layer)*.001,h);
    vec3 tint = mix(vec3(.58,.73,1.0),vec3(1.0,.78,.48),hash13(cell+7.1));
    color += star*tint*(.15+pow(h,18.0)*.62);
  }
  return color;
}

vec3 diskEmission(vec3 p, vec3 tangent, float rs, out float opacity) {
  float radius = length(p.xz)/rs;
  float inner = mix(3.15,2.45,uSpin);
  float outer = 9.5;
  float edge = smoothstep(inner,inner+.42,radius)*(1.0-smoothstep(7.0,outer,radius));
  if(edge<.0001) { opacity=0.0; return vec3(0); }
  float phi = atan(p.z,p.x);
  float orbital = uTime*(.18+uSpin*.46)/pow(radius*.36,1.5);
  float angle = phi-orbital;
  vec3 plasmaCoord = vec3(cos(angle)*radius*2.1,sin(angle)*radius*2.1,radius*1.2);
  float turbulence = fbm(plasmaCoord+vec3(0,0,uTime*.025));
  float fine = noise(vec3(radius*17.0+2.0*turbulence,angle*5.0,uTime*.1));
  float bands = .5+.5*sin(radius*34.0+turbulence*10.0+sin(angle*4.0+radius*3.0)*1.6);
  float filaments = pow(.5+.5*sin(radius*13.0-angle*2.0+turbulence*7.0),3.0);
  float density = (.22+.62*turbulence+.26*bands+.18*filaments+.12*fine)*edge;
  vec3 orbitDirection = normalize(vec3(-p.z,0,p.x));
  float beta = min(.48,sqrt(.5/max(radius-1.0,.1)))*(.65+.35*uSpin);
  float cosine = dot(orbitDirection,-normalize(tangent));
  float doppler = sqrt(1.0-beta*beta)/(1.0-beta*cosine);
  float gravityRedshift = sqrt(max(.1,1.0-1.0/radius));
  float temperature = pow(inner/radius,.65)*doppler*gravityRedshift;
  vec3 amber = vec3(1.0,.25,.045);
  vec3 ivory = vec3(1.0,.85,.59);
  vec3 hot = mix(amber,ivory,smoothstep(.38,1.1,temperature));
  float energy = 1.85*pow(inner/radius,1.8)*pow(doppler,2.1);
  opacity = clamp(density*.76,0.0,.9);
  return hot*energy*density*uIntensity;
}

vec3 acceleration(vec3 p,float l2,float rs) {
  float r2=dot(p,p);
  return -1.5*rs*l2*p/(r2*r2*sqrt(r2));
}

vec3 beyondSpace(vec3 rd) {
  // A sphere-traced, twisted corridor of nested wireframes. An artistic
  // epilogue, explicitly not an interior Schwarzschild/Kerr solution.
  vec3 direction=normalize(vec3(dot(rd,uRight),dot(rd,uUp),dot(rd,uForward)));
  vec3 origin=vec3(uCamera.xy/length(uCamera)*.65,uTime*.65+length(uCamera)*.14);
  vec3 color=vec3(.001,.003,.005);
  float t=.05;
  for(int i=0;i<78;i++){
    vec3 p=origin+direction*t;
    float angle=p.z*(.09+uSpin*.12)+uTime*.018;
    p.xy=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p.xy;
    float size=1.25*uMass+.12*sin(p.z*.55);
    float zCell=mod(p.z+.6,1.2)-.6;
    float square=max(abs(p.x),abs(p.y));
    float frame=length(vec2(square-size,zCell))-.017;
    float rails=length(abs(p.xy)-vec2(size))-.012;
    float d=min(frame,rails);
    vec3 tint=mix(vec3(.13,.47,.68),vec3(1.0,.43,.13),.5+.5*sin(p.z*.26));
    color+=tint*exp(-abs(d)*24.0)*.013*uIntensity*exp(-t*.035);
    if(d<.009){
      color+=tint*(1.8+.6*sin(p.z*.7))*uIntensity*exp(-t*.025);
      break;
    }
    t+=clamp(d*.65,.015,.8);
    if(t>42.0) break;
  }
  color+=vec3(.015,.038,.06)*exp(-length(direction.xy)*5.0);
  return color;
}

void main(){
  vec2 uv=(vUv-uCenter)*2.0;
  uv.x*=uResolution.x/uResolution.y;
  vec3 ro=uCamera;
  vec3 rd=normalize(uForward*uLens+uv.x*uRight+uv.y*uUp);
  if(uBeyond>.999) {
    gl_FragColor=vec4(beyondSpace(rd)+sky(rd)*.18,1.0);
    return;
  }
  float rs=uMass;
  float r0=length(ro);
  vec3 er=ro/r0;
  float f=1.0-rs/r0;
  vec3 velocity=sqrt(max(.01,f))*dot(rd,er)*er+rd-dot(rd,er)*er;
  vec3 angular=cross(ro,velocity);
  float l2=dot(angular,angular);
  vec3 p=ro;
  vec3 color=vec3(0);
  float transmission=1.0;
  float captured=0.0;
  float escaped=0.0;
  float orbitGlow=0.0;
  float travel=0.0;
  float quality=float(uSteps)/112.0;
  for(int i=0;i<176;i++){
    if(i>=uSteps) break;
    float r=length(p);
    if(r<rs*1.015) { captured=1.0; break; }
    if(r>max(30.0,r0+2.0)&&dot(p,velocity)>0.0) { escaped=1.0; break; }
    // Resolve the critical region and thin plane; long empty steps outside.
    float stepSize=clamp((r-rs)*.17,.045*rs,2.8)/quality;
    float planeDistance=abs(p.y)/(abs(velocity.y)+.02);
    if(length(p.xz)<rs*10.0&&length(p.xz)>rs*2.2)
      stepSize=min(stepSize,max(.07*rs,planeDistance*.7));
    vec3 a=acceleration(p,l2,rs);
    vec3 next=p+velocity*stepSize+.5*a*stepSize*stepSize;
    vec3 nextVelocity=velocity+.5*(a+acceleration(next,l2,rs))*stepSize;
    if(p.y*next.y<0.0){
      float t=p.y/(p.y-next.y);
      vec3 hit=mix(p,next,t);
      float opacity;
      vec3 emission=diskEmission(hit,mix(velocity,nextVelocity,t),rs,opacity);
      color+=transmission*emission;
      transmission*=1.0-opacity;
    }
    float radius=length(p.xz)/rs;
    float height=abs(p.y)/rs;
    if(radius>2.4&&radius<10.0&&height<.65){
      float edge=smoothstep(2.4,3.2,radius)*(1.0-smoothstep(6.0,10.0,radius));
      float volume=exp(-height*height/0.045)*edge*.055*stepSize/rs;
      float wisps=noise(vec3(p.x*.75,p.z*.75,uTime*.08));
      color+=transmission*vec3(1.0,.32,.08)*volume*(.4+wisps)*uIntensity;
    }
    // Longer path length near the photon sphere creates a restrained ring.
    orbitGlow+=exp(-pow((r/rs-1.52)*6.0,2.0))*stepSize/rs;
    p=next; velocity=nextVelocity; travel+=stepSize;
  }
  color+=vec3(1.0,.49,.18)*min(max(orbitGlow-.6,0.0)*.055,.5)*uIntensity;
  vec3 background=sky(normalize(velocity));
  // Unresolved critical rays keep integrated emission but cannot invent sky.
  color+=transmission*background*escaped*(1.0-captured);
  // In gravity chapter, a dim moving meridian makes the lens readable.
  float meridian=pow(.5+.5*sin(atan(velocity.z,velocity.x)*32.0+uTime*.08),80.0);
  color+=uGravity*vec3(.10,.25,.31)*meridian*.075*escaped;
  float reveal=smoothstep(.05,.9,uReveal);
  color=mix(sky(rd)*smoothstep(0.0,.3,uReveal),color,reveal);
  if(uBeyond>.001){
    vec3 dream=beyondSpace(rd);
    color=mix(color,dream+sky(rd)*.3,uBeyond);
  }
  gl_FragColor=vec4(color,1.0);
}`;

export const gradeFragment = /* glsl */`
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uExposure;
uniform float uFade;
uniform float uBeyond;
varying vec2 vUv;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
void main(){
  vec2 uv=vUv;
  vec2 offset=(uv-.5)*.0012*uBeyond;
  vec3 c=texture2D(tDiffuse,uv).rgb;
  if(uBeyond>.01){
    c.r=texture2D(tDiffuse,uv+offset).r;
    c.b=texture2D(tDiffuse,uv-offset).b;
  }
  c=aces(c*uExposure);
  c=pow(c,vec3(1.0/2.2));
  float vignette=1.0-.27*pow(length((uv-.5)*vec2(1.1,.8)),1.5);
  c*=vignette;
  float grain=fract(sin(dot(uv*vec2(1571.0,1129.0),vec2(12.9898,78.233))+floor(uTime*24.0))*43758.5453)-.5;
  c+=grain*.009;
  gl_FragColor=vec4(max(c,vec3(0))*uFade,1.0);
}`;

export const dustVertex = /* glsl */`
attribute vec3 aPosition;
attribute float aSeed;
uniform vec3 uCamera;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec2 uCenter;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uLens;
uniform float uReveal;
uniform float uBeyond;
varying vec2 vUv;
varying float vAlpha;
varying float vSeed;
void main(){
  vUv=uv; vSeed=aSeed;
  vec3 p=aPosition;
  p.x+=sin(uTime*.035+aSeed*18.0)*.9;
  p.y+=cos(uTime*.023+aSeed*12.0)*.55;
  p.xy+=uPointer*(.12+aSeed*.25);
  vec3 relative=p-uCamera;
  float depth=dot(relative,uForward);
  vec2 screen=vec2(dot(relative,uRight),dot(relative,uUp))*uLens/max(.1,depth);
  screen.x/=uResolution.x/uResolution.y;
  screen+=(uCenter-.5)*2.0;
  float size=(.7+aSeed*1.7)*2.0/uResolution.y;
  screen+=position.xy*size*clamp(22.0/max(depth,1.0),.3,2.0);
  gl_Position=vec4(screen,0,1);
  vAlpha=step(1.0,depth)*(.1+aSeed*.35)*uReveal*(1.0-uBeyond);
  // Dust is a foreground layer; do not place sprites over the central shadow.
  vAlpha*=smoothstep(.16,.23,length((screen-(uCenter-.5)*2.0)*vec2(uResolution.x/uResolution.y,1)));
}`;

export const dustFragment = /* glsl */`
varying vec2 vUv;
varying float vAlpha;
varying float vSeed;
void main(){
  float d=length(vUv-.5)*2.0;
  float a=exp(-d*d*5.0)*vAlpha;
  gl_FragColor=vec4(mix(vec3(.28,.43,.57),vec3(.8,.57,.32),vSeed),a);
}`;
