import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { chapters, defaults, useExperience } from '../store';
import type { Quality } from '../store';
import { blackHoleFragment, fullscreenVertex, gradeFragment, dustVertex, dustFragment } from './shaders';

const presets: Record<Quality, { steps: number; maxDpr: number; pixels: number; dust: number; bloom: number }> = {
  LOW: { steps: 80, maxDpr: .85, pixels: 650_000, dust: 150, bloom: .18 },
  HIGH: { steps: 112, maxDpr: 1.15, pixels: 1_450_000, dust: 480, bloom: .28 },
  CINEMATIC: { steps: 164, maxDpr: 1.65, pixels: 2_600_000, dust: 900, bloom: .34 },
};

const damp = (a: number, b: number, lambda: number, dt: number) => THREE.MathUtils.damp(a, b, lambda, dt);

export default function Scene() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    useExperience.getState().set({error:null,ready:false});
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    } catch {
      useExperience.getState().set({ error: 'WebGL 2 is unavailable. Enable hardware acceleration in your browser and reload.' });
      return;
    }
    renderer.setClearColor(0x000000);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive black hole. Move to look around, drag in explore mode, scroll to zoom.');
    renderer.domElement.setAttribute('role', 'img');
    const world = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCenter: { value: new THREE.Vector2(.62, .54) },
      uCamera: { value: new THREE.Vector3(0, 4.5, 22) },
      uForward: { value: new THREE.Vector3(0, 0, -1) },
      uRight: { value: new THREE.Vector3(1, 0, 0) },
      uUp: { value: new THREE.Vector3(0, 1, 0) },
      uTime: { value: 0 }, uMass: { value: 1 }, uSpin: { value: .72 },
      uIntensity: { value: 1 }, uReveal: { value: 0 }, uBeyond: { value: 0 },
      uGravity: { value: 0 }, uLens: { value: 2.05 }, uSteps: { value: 112 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: fullscreenVertex, fragmentShader: blackHoleFragment, uniforms, depthWrite: false, depthTest: false });
    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(quadGeometry, material);
    quad.frustumCulled = false;
    world.add(quad);

    // One instanced draw call for all foreground motes.
    const dustGeometry = new THREE.InstancedBufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0], 3));
    dustGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1], 2));
    dustGeometry.setIndex([0,1,2,0,2,3]);
    const positions = new Float32Array(1800 * 3), seeds = new Float32Array(1800);
    let seed = 5791;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 1800; i++) {
      positions[i*3] = (random()-.5)*70;
      positions[i*3+1] = (random()-.5)*45;
      positions[i*3+2] = (random()-.5)*60;
      seeds[i] = random();
    }
    dustGeometry.setAttribute('aPosition', new THREE.InstancedBufferAttribute(positions, 3));
    dustGeometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    const pointerUniform = { value: new THREE.Vector2() };
    const dustMaterial = new THREE.ShaderMaterial({
      vertexShader: dustVertex, fragmentShader: dustFragment,
      uniforms: { ...uniforms, uPointer: pointerUniform }, transparent: true,
      depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Mesh(dustGeometry, dustMaterial);
    dust.frustumCulled = false;
    dust.renderOrder = 1;
    world.add(dust);

    const hdrTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false });
    const composer = new EffectComposer(renderer, hdrTarget);
    const renderPass = new RenderPass(world, camera);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .28, .48, 1.25);
    const grade = new ShaderPass({
      vertexShader: fullscreenVertex, fragmentShader: gradeFragment,
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uExposure: { value: 1.12 }, uFade: { value: 0 }, uBeyond: uniforms.uBeyond },
    });
    composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(grade);
    const pointer = new THREE.Vector2(), smoothedPointer = new THREE.Vector2();
    const worldUp = new THREE.Vector3(0,1,0), temporaryRight = new THREE.Vector3();
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const rendererInfo = gl.getExtension('WEBGL_debug_renderer_info');
    container.dataset.gpu = rendererInfo ? gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) : 'WebGL 2';
    const gpuTimer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    let pendingQuery: WebGLQuery | null = null, gpuMs = 0, profileCounter = 0;
    const gpuSamples: number[]=[];
    let width = 1, height = 1, dpr = 1, quality = useExperience.getState().quality;
    let adaptiveScale = 1;
    let introTime = 0, simulationTime = 0, lastTime = 0, frame = 0, disposed = false, contextLost = false;
    let distance = 26, tilt = .20, azimuth = 0, freeAzimuth = 0, freeTilt = .2;
    let previousFree = false, previousChapter = 0;
    let dragging = false, previousX = 0, previousY = 0;
    let fpsElapsed = 0, fpsFrames = 0, warmup = 0, stableWindows = 0, lastAdapt = 0;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motionQuery.matches;
    const onMotion = () => { reduced = motionQuery.matches; };
    motionQuery.addEventListener('change', onMotion);
    let touchDistance = 0;
    const touches = new Map<number, THREE.Vector2>();
    function resize() {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      const preset = presets[quality];
      dpr = Math.min(window.devicePixelRatio || 1, preset.maxDpr, Math.sqrt(preset.pixels/(width*height))) * adaptiveScale;
      dpr = Math.min(Math.sqrt(preset.pixels/(width*height)),Math.max(.35,dpr));
      renderer.setPixelRatio(dpr); renderer.setSize(width,height);
      composer.setPixelRatio(dpr); composer.setSize(width,height);
      uniforms.uResolution.value.set(width*dpr,height*dpr);
      uniforms.uCenter.value.set(width < 720 ? .5 : .62, width < 720 ? .61 : .54);
      uniforms.uLens.value = width < 720 ? 1.65 : 2.05;
      uniforms.uSteps.value = preset.steps;
      dustGeometry.instanceCount = preset.dust;
      bloom.strength = preset.bloom;
      gpuSamples.length=0;gpuMs=0;
      useExperience.getState().set({ dpr: Math.round(dpr*100)/100 });
    }
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const isUI = (target: EventTarget | null) => target instanceof Element && !!target.closest('button,a,input,aside,[role="dialog"]');
    function onPointerMove(event: PointerEvent) {
      if (isUI(event.target) && !dragging) return;
      pointer.set(event.clientX/width*2-1, -(event.clientY/height*2-1));
      if (touches.has(event.pointerId)) {
        touches.set(event.pointerId,new THREE.Vector2(event.clientX,event.clientY));
        if (touches.size === 2) {
          const points = [...touches.values()];
          const nextDistance = points[0].distanceTo(points[1]);
          if (touchDistance > 0) {
            const s = useExperience.getState();
            s.setParameter('distance', THREE.MathUtils.clamp(s.distance+(touchDistance-nextDistance)*.035,7,35));
          }
          touchDistance = nextDistance;
          return;
        }
      }
      if (dragging && useExperience.getState().free) {
        freeAzimuth -= (event.clientX-previousX)*.004;
        freeTilt = THREE.MathUtils.clamp(freeTilt+(event.clientY-previousY)*.003,-1.25,1.25);
      }
      previousX = event.clientX; previousY = event.clientY;
    }
    function onPointerDown(event: PointerEvent) {
      if (useExperience.getState().portfolio || isUI(event.target)) return;
      touches.set(event.pointerId,new THREE.Vector2(event.clientX,event.clientY));
      dragging = true; previousX=event.clientX; previousY=event.clientY;
      if (event.target === renderer.domElement) renderer.domElement.setPointerCapture(event.pointerId);
    }
    function onPointerUp(event: PointerEvent) {
      touches.delete(event.pointerId); touchDistance=0;
      dragging=touches.size>0;
    }
    function onWheel(event: WheelEvent) {
      if (useExperience.getState().portfolio || isUI(event.target)) return;
      event.preventDefault();
      const s=useExperience.getState();
      s.setParameter('distance',THREE.MathUtils.clamp(s.distance+event.deltaY*.012,7,35));
    }
    function onLost(event: Event) {
      event.preventDefault(); contextLost=true;
      useExperience.getState().set({error:'The graphics context was interrupted. Restore the experience to continue.'});
    }
    function onRestored() { window.location.reload(); }
    renderer.domElement.addEventListener('webglcontextlost',onLost);
    renderer.domElement.addEventListener('webglcontextrestored',onRestored);
    window.addEventListener('pointermove',onPointerMove);
    window.addEventListener('pointerdown',onPointerDown);
    window.addEventListener('pointerup',onPointerUp);
    window.addEventListener('pointercancel',onPointerUp);
    container.addEventListener('wheel',onWheel,{passive:false});
    function visibility() { lastTime=0; fpsFrames=0; fpsElapsed=0; }
    document.addEventListener('visibilitychange',visibility);

    renderer.debug.onShaderError = (_gl, _program, _vertex, _fragment) => {
      console.error('EVENT HORIZON shader compilation failed');
      useExperience.getState().set({error:'The graphics driver could not compile the scene. Try a current browser with hardware acceleration.'});
    };

    function animate(now: number) {
      if (disposed) return;
      frame=requestAnimationFrame(animate);
      if (document.hidden || contextLost) { lastTime=0; return; }
      const rawDt = lastTime ? (now-lastTime)/1000 : 1/60;
      const dt=Math.min(rawDt,.06);
      lastTime=now;
      const s=useExperience.getState();
      uniforms.uCenter.value.x=damp(uniforms.uCenter.value.x,width<720?.5:s.portfolio?.69:.62,2,dt);
      uniforms.uCenter.value.y=damp(uniforms.uCenter.value.y,width<720?(s.portfolio?.70:.61):.54,2,dt);
      if (s.quality!==quality) { quality=s.quality; adaptiveScale=1; stableWindows=0; resize(); }
      if (!s.ready) s.set({ready:true});
      introTime += Math.min(rawDt,1);
      if (s.intro && (introTime>11 || reduced)) s.set({intro:false});
      const revealTarget=s.intro ? THREE.MathUtils.smoothstep(introTime,1.3,8) : 1;
      uniforms.uReveal.value=damp(uniforms.uReveal.value,revealTarget,2,dt);
      grade.uniforms.uFade.value=damp(grade.uniforms.uFade.value,s.intro?THREE.MathUtils.smoothstep(introTime,0,3):1,2,dt);
      const emission = s.portfolio ? defaults : s;
      if(s.portfolio || !s.paused) simulationTime+=dt*emission.timeScale*(reduced?.25:1);
      uniforms.uTime.value=simulationTime;
      grade.uniforms.uTime.value=simulationTime;
      uniforms.uMass.value=damp(uniforms.uMass.value,emission.mass,2.5,dt);
      uniforms.uSpin.value=damp(uniforms.uSpin.value,emission.spin,2.5,dt);
      uniforms.uIntensity.value=damp(uniforms.uIntensity.value,emission.intensity,2.5,dt);
      uniforms.uBeyond.value=damp(uniforms.uBeyond.value,s.chapter===4?1:0,1.1,dt);
      uniforms.uGravity.value=damp(uniforms.uGravity.value,s.chapter===2?1:0,1.2,dt);
      grade.uniforms.uExposure.value=damp(grade.uniforms.uExposure.value,emission.exposure,2.5,dt);
      if(s.free&&!previousFree) {freeAzimuth=azimuth;freeTilt=tilt;}
      if(s.chapter!==previousChapter) {freeAzimuth=chapters[s.chapter].azimuth;freeTilt=chapters[s.chapter].tilt;}
      previousFree=s.free;previousChapter=s.chapter;
      const chapter=chapters[s.chapter];
      smoothedPointer.lerp(pointer,1-Math.exp(-dt*2));
      pointerUniform.value.copy(smoothedPointer);
      const parallax=reduced?0:1;
      const targetAzimuth=s.free?freeAzimuth:chapter.azimuth+smoothedPointer.x*.045*parallax;
      const targetTilt=s.free?freeTilt:chapter.tilt+smoothedPointer.y*.026*parallax;
      azimuth=damp(azimuth,targetAzimuth,2.2,dt);
      tilt=damp(tilt,targetTilt,2.2,dt);
      distance=damp(distance,s.distance+(s.intro?(1-uniforms.uReveal.value)*5:0),1.6,dt);
      uniforms.uCamera.value.set(Math.sin(azimuth)*Math.cos(tilt)*distance,Math.sin(tilt)*distance,Math.cos(azimuth)*Math.cos(tilt)*distance);
      uniforms.uForward.value.copy(uniforms.uCamera.value).negate().normalize();
      uniforms.uRight.value.crossVectors(uniforms.uForward.value,worldUp).normalize();
      uniforms.uUp.value.crossVectors(uniforms.uRight.value,uniforms.uForward.value).normalize();
      // A slight camera roll gives the horizontal disk a restrained diagonal.
      const roll = s.free ? .02 : -.085;
      const right = temporaryRight.copy(uniforms.uRight.value);
      uniforms.uRight.value.multiplyScalar(Math.cos(roll)).addScaledVector(uniforms.uUp.value,Math.sin(roll));
      uniforms.uUp.value.multiplyScalar(Math.cos(roll)).addScaledVector(right,-Math.sin(roll));
      if (pendingQuery && gl.getQueryParameter(pendingQuery, gl.QUERY_RESULT_AVAILABLE)) {
        if (!gl.getParameter(gpuTimer.GPU_DISJOINT_EXT)) {
          const sample=gl.getQueryParameter(pendingQuery, gl.QUERY_RESULT)/1e6;
          gpuSamples.push(sample);
          if(gpuSamples.length>24) gpuSamples.shift();
          const sorted=[...gpuSamples].sort((a,b)=>a-b);
          gpuMs=sorted[Math.floor(sorted.length/2)];
          container.dataset.gpuMs = gpuMs.toFixed(2);
          container.dataset.gpuSamples=String(gpuSamples.length);
          container.dataset.gpuRange=`${sorted[0].toFixed(2)}–${sorted[sorted.length-1].toFixed(2)}`;
        }
        gl.deleteQuery(pendingQuery); pendingQuery = null;
      }
      const measure = !!gpuTimer && !pendingQuery && profileCounter++ % 30 === 0;
      if (measure) { pendingQuery=gl.createQuery(); gl.beginQuery(gpuTimer.TIME_ELAPSED_EXT,pendingQuery); }
      const cpuStart=performance.now();
      renderer.info.autoReset=false; renderer.info.reset();
      composer.render(dt);
      container.dataset.cpuMs=(performance.now()-cpuStart).toFixed(2);
      if (measure) gl.endQuery(gpuTimer.TIME_ELAPSED_EXT);
      warmup+=Math.min(rawDt,1);
      fpsElapsed+=rawDt; fpsFrames++;
      if(fpsElapsed>=2) {
        const fps=Math.round(fpsFrames/fpsElapsed);
        s.set({fps,gpuMs});
        container.dataset.fps=String(fps);
        container.dataset.quality=quality;
        container.dataset.time=simulationTime.toFixed(3);
        container.dataset.drawCalls=String(renderer.info.render.calls);
        container.dataset.textures=String(renderer.info.memory.textures);
        container.dataset.camera=`${azimuth.toFixed(3)},${tilt.toFixed(3)},${distance.toFixed(3)}`;
        container.dataset.parameters=JSON.stringify({
          mass:uniforms.uMass.value,spin:uniforms.uSpin.value,
          intensity:uniforms.uIntensity.value,timeScale:s.timeScale,
          distance,exposure:grade.uniforms.uExposure.value,beyond:uniforms.uBeyond.value,
        });
        // A covered/minimized window can be scheduled at 1 Hz despite a fast GPU.
        // GPU timing avoids downgrading quality because of browser throttling.
        const performanceFps = gpuMs>0 ? Math.min(60,1000/gpuMs) : fps;
        if(warmup>6&&now-lastAdapt>6000) {
          if(performanceFps<38&&adaptiveScale>.66) {
            adaptiveScale=Math.max(.65,adaptiveScale-.12);resize();lastAdapt=now;stableWindows=0;
          } else if(performanceFps<29&&s.autoQuality&&quality!=='LOW') {
            s.setQuality(quality==='CINEMATIC'?'HIGH':'LOW',true);lastAdapt=now;stableWindows=0;
          } else if(performanceFps>=55) {
            stableWindows++;
            if(stableWindows>=3) {
              if(adaptiveScale<.98) {adaptiveScale=Math.min(1,adaptiveScale+.08);resize();lastAdapt=now;}
              else if(s.autoQuality&&quality==='LOW') {s.setQuality('HIGH',true);lastAdapt=now;}
              // Cinematic is explicit: stable 60fps doesn't measure spare GPU time.
              stableWindows=0;
            }
          } else stableWindows=0;
        }
        fpsElapsed=0;fpsFrames=0;
      }
    }
    frame=requestAnimationFrame(animate);
    return () => {
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();
      window.removeEventListener('pointermove',onPointerMove);
      window.removeEventListener('pointerdown',onPointerDown);
      window.removeEventListener('pointerup',onPointerUp);
      window.removeEventListener('pointercancel',onPointerUp);
      container.removeEventListener('wheel',onWheel);
      document.removeEventListener('visibilitychange',visibility);
      motionQuery.removeEventListener('change',onMotion);
      renderer.domElement.removeEventListener('webglcontextlost',onLost);
      renderer.domElement.removeEventListener('webglcontextrestored',onRestored);
      quadGeometry.dispose();material.dispose();dustGeometry.dispose();dustMaterial.dispose();
      bloom.dispose();grade.dispose();renderPass.dispose();composer.dispose();
      if(pendingQuery) gl.deleteQuery(pendingQuery);
      renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    };
  }, []);
  return <div className="scene" ref={host} data-testid="webgl-scene" />;
}
