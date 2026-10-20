import{a as e,n as t,t as n}from"./jsx-runtime-Wy9s6hX0.js";import{i as r,n as i,r as a}from"./index-32U4nGQv.js";import{A as o,E as s,Et as c,Ft as l,Ht as u,Q as d,Rt as f,S as p,Tt as ee,dt as te,et as m,f as ne,k as h,l as g,n as re,p as _,pt as ie,q as ae,tt as oe,zt as v}from"./three.module-BJLcsQT3.js";var y=e(t(),1),b={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},x=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},se=new te(-1,1,1,-1,0,1),S=new class extends g{constructor(){super(),this.setAttribute(`position`,new p([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new p([0,2,0,0,2,0],2))}},C=class{constructor(e){this._mesh=new m(S,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,se)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},ce=class extends x{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof c?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=l.clone(e.uniforms),this.material=new c({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new C(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},w=class extends x{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},le=class extends x{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},ue=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new f);this._width=n.width,this._height=n.height,t=new u(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:s}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new ce(b),this.copyPass.material.blending=0,this.clock=new ne}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}w!==void 0&&(r instanceof w?n=!0:r instanceof le&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new f);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},de=class extends x{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new _}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},fe={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new _(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`},pe=class e extends x{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new f(256,256):new f(e.x,e.y),this.clearColor=new _(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new u(i,a,{type:s}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new u(i,a,{type:s});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new u(i,a,{type:s});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),a=Math.round(a/2)}let o=fe;this.highPassUniforms=l.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new c({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let d=[6,10,14,18,22];i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(d[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new f(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let p=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=p,this.bloomTintColors=[new v(1,1,1),new v(1,1,1),new v(1,1,1),new v(1,1,1),new v(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=l.clone(b.uniforms),this.blendMaterial=new c({uniforms:this.copyUniforms,vertexShader:b.vertexShader,fragmentShader:b.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new _,this._oldClearAlpha=1,this._basic=new oe,this._fsQuad=new C(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new f(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);return new c({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new f(.5,.5)},direction:{value:new f(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {

					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

					for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

						float x = float( i );
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * w;

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new c({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};pe.BlurDirectionX=new f(1,0),pe.BlurDirectionY=new f(0,1);var me=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`,he=`
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
}`,ge=`
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
}`,_e=`
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
}`,ve=`
varying vec2 vUv;
varying float vAlpha;
varying float vSeed;
void main(){
  float d=length(vUv-.5)*2.0;
  float a=exp(-d*d*5.0)*vAlpha;
  gl_FragColor=vec4(mix(vec3(.28,.43,.57),vec3(.8,.57,.32),vSeed),a);
}`,ye=n(),be={LOW:{steps:80,maxDpr:.85,pixels:65e4,dust:150,bloom:.18},HIGH:{steps:112,maxDpr:1.15,pixels:145e4,dust:480,bloom:.28},CINEMATIC:{steps:164,maxDpr:1.65,pixels:26e5,dust:900,bloom:.34}},T=(e,t,n,r)=>d.damp(e,t,n,r);function E(){let e=(0,y.useRef)(null);return(0,y.useEffect)(()=>{if(!e.current)return;let t=e.current;r.getState().set({error:null,ready:!1});let n;try{n=new re({antialias:!1,alpha:!1,powerPreference:`high-performance`,preserveDrawingBuffer:!1})}catch{r.getState().set({error:`WebGL 2 is unavailable. Enable hardware acceleration in your browser and reload.`});return}n.setClearColor(0),n.outputColorSpace=ae,n.toneMapping=0,t.appendChild(n.domElement),n.domElement.setAttribute(`aria-label`,`Interactive black hole. Move to look around, drag in explore mode, scroll to zoom.`),n.domElement.setAttribute(`role`,`img`);let l=new ee,ne=new te(-1,1,1,-1,0,1),g={uResolution:{value:new f(1,1)},uCenter:{value:new f(.62,.54)},uCamera:{value:new v(0,4.5,22)},uForward:{value:new v(0,0,-1)},uRight:{value:new v(1,0,0)},uUp:{value:new v(0,1,0)},uTime:{value:0},uMass:{value:1},uSpin:{value:.72},uIntensity:{value:1},uReveal:{value:0},uBeyond:{value:0},uGravity:{value:0},uLens:{value:2.05},uSteps:{value:112}},_=new c({vertexShader:me,fragmentShader:he,uniforms:g,depthWrite:!1,depthTest:!1}),oe=new ie(2,2),y=new m(oe,_);y.frustumCulled=!1,l.add(y);let b=new o;b.setAttribute(`position`,new p([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0],3)),b.setAttribute(`uv`,new p([0,0,1,0,1,1,0,1],2)),b.setIndex([0,1,2,0,2,3]);let x=new Float32Array(5400),se=new Float32Array(1800),S=5791,C=()=>(S=S*16807%2147483647,S/2147483647);for(let e=0;e<1800;e++)x[e*3]=(C()-.5)*70,x[e*3+1]=(C()-.5)*45,x[e*3+2]=(C()-.5)*60,se[e]=C();b.setAttribute(`aPosition`,new h(x,3)),b.setAttribute(`aSeed`,new h(se,1));let w={value:new f},le=new c({vertexShader:_e,fragmentShader:ve,uniforms:{...g,uPointer:w},transparent:!0,depthTest:!1,depthWrite:!1,blending:2}),fe=new m(b,le);fe.frustumCulled=!1,fe.renderOrder=1,l.add(fe);let ye=new u(1,1,{type:s,depthBuffer:!1,stencilBuffer:!1}),E=new ue(n,ye),xe=new de(l,ne),Se=new pe(new f(1,1),.28,.48,1.25),D=new ce({vertexShader:me,fragmentShader:ge,uniforms:{tDiffuse:{value:null},uTime:{value:0},uExposure:{value:1.12},uFade:{value:0},uBeyond:g.uBeyond}});E.addPass(xe),E.addPass(Se),E.addPass(D);let Ce=new f,O=new f,we=new v(0,1,0),Te=new v,k=n.getContext(),Ee=k.getExtension(`WEBGL_debug_renderer_info`);t.dataset.gpu=Ee?k.getParameter(Ee.UNMASKED_RENDERER_WEBGL):`WebGL 2`;let A=k.getExtension(`EXT_disjoint_timer_query_webgl2`),j=null,M=0,De=0,N=[],P=1,F=1,I=1,L=r.getState().quality,R=1,z=0,B=0,V=0,Oe=0,ke=!1,Ae=!1,H=26,U=.2,W=0,G=0,K=.2,je=!1,Me=0,Ne=!1,Pe=0,Fe=0,q=0,Ie=0,Le=0,J=0,Y=0,Re=window.matchMedia(`(prefers-reduced-motion: reduce)`),ze=Re.matches,Be=()=>{ze=Re.matches};Re.addEventListener(`change`,Be);let X=0,Z=new Map;function Q(){let e=t.getBoundingClientRect();P=Math.max(1,e.width),F=Math.max(1,e.height);let i=be[L];I=Math.min(window.devicePixelRatio||1,i.maxDpr,Math.sqrt(i.pixels/(P*F)))*R,I=Math.min(Math.sqrt(i.pixels/(P*F)),Math.max(.35,I)),n.setPixelRatio(I),n.setSize(P,F),E.setPixelRatio(I),E.setSize(P,F),g.uResolution.value.set(P*I,F*I),g.uCenter.value.set(P<720?.5:.62,P<720?.61:.54),g.uLens.value=P<720?1.65:2.05,g.uSteps.value=i.steps,b.instanceCount=i.dust,Se.strength=i.bloom,N.length=0,M=0,r.getState().set({dpr:Math.round(I*100)/100})}let Ve=new ResizeObserver(Q);Ve.observe(t),Q();let He=e=>e instanceof Element&&!!e.closest(`button,a,input,aside,[role="dialog"]`);function Ue(e){if(!He(e.target)||Ne){if(Ce.set(e.clientX/P*2-1,-(e.clientY/F*2-1)),Z.has(e.pointerId)&&(Z.set(e.pointerId,new f(e.clientX,e.clientY)),Z.size===2)){let e=[...Z.values()],t=e[0].distanceTo(e[1]);if(X>0){let e=r.getState();e.setParameter(`distance`,d.clamp(e.distance+(X-t)*.035,7,35))}X=t}else Ne&&r.getState().free&&(G-=(e.clientX-Pe)*.004,K=d.clamp(K+(e.clientY-Fe)*.003,-1.25,1.25)),Pe=e.clientX,Fe=e.clientY}}function We(e){r.getState().portfolio||He(e.target)||(Z.set(e.pointerId,new f(e.clientX,e.clientY)),Ne=!0,Pe=e.clientX,Fe=e.clientY,e.target===n.domElement&&n.domElement.setPointerCapture(e.pointerId))}function $(e){Z.delete(e.pointerId),X=0,Ne=Z.size>0}function Ge(e){if(r.getState().portfolio||He(e.target))return;e.preventDefault();let t=r.getState();t.setParameter(`distance`,d.clamp(t.distance+e.deltaY*.012,7,35))}function Ke(e){e.preventDefault(),Ae=!0,r.getState().set({error:`The graphics context was interrupted. Restore the experience to continue.`})}function qe(){window.location.reload()}n.domElement.addEventListener(`webglcontextlost`,Ke),n.domElement.addEventListener(`webglcontextrestored`,qe),window.addEventListener(`pointermove`,Ue),window.addEventListener(`pointerdown`,We),window.addEventListener(`pointerup`,$),window.addEventListener(`pointercancel`,$),t.addEventListener(`wheel`,Ge,{passive:!1});function Je(){V=0,Ie=0,q=0}document.addEventListener(`visibilitychange`,Je),n.debug.onShaderError=(e,t,n,i)=>{console.error(`EVENT HORIZON shader compilation failed`),r.getState().set({error:`The graphics driver could not compile the scene. Try a current browser with hardware acceleration.`})};function Ye(e){if(ke)return;if(Oe=requestAnimationFrame(Ye),document.hidden||Ae){V=0;return}let o=V?(e-V)/1e3:1/60,s=Math.min(o,.06);V=e;let c=r.getState();g.uCenter.value.x=T(g.uCenter.value.x,P<720?.5:c.portfolio?.69:.62,2,s),g.uCenter.value.y=T(g.uCenter.value.y,P<720?c.portfolio?.7:.61:.54,2,s),c.quality!==L&&(L=c.quality,R=1,J=0,Q()),c.ready||c.set({ready:!0}),z+=Math.min(o,1),c.intro&&(z>11||ze)&&c.set({intro:!1});let l=c.intro?d.smoothstep(z,1.3,8):1;g.uReveal.value=T(g.uReveal.value,l,2,s),D.uniforms.uFade.value=T(D.uniforms.uFade.value,c.intro?d.smoothstep(z,0,3):1,2,s);let u=c.portfolio?a:c;(c.portfolio||!c.paused)&&(B+=s*u.timeScale*(ze?.25:1)),g.uTime.value=B,D.uniforms.uTime.value=B,g.uMass.value=T(g.uMass.value,u.mass,2.5,s),g.uSpin.value=T(g.uSpin.value,u.spin,2.5,s),g.uIntensity.value=T(g.uIntensity.value,u.intensity,2.5,s),g.uBeyond.value=T(g.uBeyond.value,+(c.chapter===4),1.1,s),g.uGravity.value=T(g.uGravity.value,+(c.chapter===2),1.2,s),D.uniforms.uExposure.value=T(D.uniforms.uExposure.value,u.exposure,2.5,s),c.free&&!je&&(G=W,K=U),c.chapter!==Me&&(G=i[c.chapter].azimuth,K=i[c.chapter].tilt),je=c.free,Me=c.chapter;let f=i[c.chapter];O.lerp(Ce,1-Math.exp(-s*2)),w.value.copy(O);let p=+!ze,ee=c.free?G:f.azimuth+O.x*.045*p,te=c.free?K:f.tilt+O.y*.026*p;W=T(W,ee,2.2,s),U=T(U,te,2.2,s),H=T(H,c.distance+(c.intro?(1-g.uReveal.value)*5:0),1.6,s),g.uCamera.value.set(Math.sin(W)*Math.cos(U)*H,Math.sin(U)*H,Math.cos(W)*Math.cos(U)*H),g.uForward.value.copy(g.uCamera.value).negate().normalize(),g.uRight.value.crossVectors(g.uForward.value,we).normalize(),g.uUp.value.crossVectors(g.uRight.value,g.uForward.value).normalize();let m=c.free?.02:-.085,ne=Te.copy(g.uRight.value);if(g.uRight.value.multiplyScalar(Math.cos(m)).addScaledVector(g.uUp.value,Math.sin(m)),g.uUp.value.multiplyScalar(Math.cos(m)).addScaledVector(ne,-Math.sin(m)),j&&k.getQueryParameter(j,k.QUERY_RESULT_AVAILABLE)){if(!k.getParameter(A.GPU_DISJOINT_EXT)){let e=k.getQueryParameter(j,k.QUERY_RESULT)/1e6;N.push(e),N.length>24&&N.shift();let n=[...N].sort((e,t)=>e-t);M=n[Math.floor(n.length/2)],t.dataset.gpuMs=M.toFixed(2),t.dataset.gpuSamples=String(N.length),t.dataset.gpuRange=`${n[0].toFixed(2)}–${n[n.length-1].toFixed(2)}`}k.deleteQuery(j),j=null}let h=!!A&&!j&&De++%30==0;h&&(j=k.createQuery(),k.beginQuery(A.TIME_ELAPSED_EXT,j));let re=performance.now();if(n.info.autoReset=!1,n.info.reset(),E.render(s),t.dataset.cpuMs=(performance.now()-re).toFixed(2),h&&k.endQuery(A.TIME_ELAPSED_EXT),Le+=Math.min(o,1),q+=o,Ie++,q>=2){let r=Math.round(Ie/q);c.set({fps:r,gpuMs:M}),t.dataset.fps=String(r),t.dataset.quality=L,t.dataset.time=B.toFixed(3),t.dataset.drawCalls=String(n.info.render.calls),t.dataset.textures=String(n.info.memory.textures),t.dataset.camera=`${W.toFixed(3)},${U.toFixed(3)},${H.toFixed(3)}`,t.dataset.parameters=JSON.stringify({mass:g.uMass.value,spin:g.uSpin.value,intensity:g.uIntensity.value,timeScale:c.timeScale,distance:H,exposure:D.uniforms.uExposure.value,beyond:g.uBeyond.value});let i=M>0?Math.min(60,1e3/M):r;Le>6&&e-Y>6e3&&(i<38&&R>.66?(R=Math.max(.65,R-.12),Q(),Y=e,J=0):i<29&&c.autoQuality&&L!==`LOW`?(c.setQuality(L===`CINEMATIC`?`HIGH`:`LOW`,!0),Y=e,J=0):i>=55?(J++,J>=3&&(R<.98?(R=Math.min(1,R+.08),Q(),Y=e):c.autoQuality&&L===`LOW`&&(c.setQuality(`HIGH`,!0),Y=e),J=0)):J=0),q=0,Ie=0}}return Oe=requestAnimationFrame(Ye),()=>{ke=!0,cancelAnimationFrame(Oe),Ve.disconnect(),window.removeEventListener(`pointermove`,Ue),window.removeEventListener(`pointerdown`,We),window.removeEventListener(`pointerup`,$),window.removeEventListener(`pointercancel`,$),t.removeEventListener(`wheel`,Ge),document.removeEventListener(`visibilitychange`,Je),Re.removeEventListener(`change`,Be),n.domElement.removeEventListener(`webglcontextlost`,Ke),n.domElement.removeEventListener(`webglcontextrestored`,qe),oe.dispose(),_.dispose(),b.dispose(),le.dispose(),Se.dispose(),D.dispose(),xe.dispose(),E.dispose(),j&&k.deleteQuery(j),n.dispose(),n.forceContextLoss(),n.domElement.remove()}},[]),(0,ye.jsx)(`div`,{className:`scene`,ref:e,"data-testid":`webgl-scene`})}export{E as default};