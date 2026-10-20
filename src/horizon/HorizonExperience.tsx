import './horizon.css';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Crosshair, Expand, Eye, Headphones, Info, Maximize, Minimize, Pause, Play, RotateCcw, SlidersHorizontal, Volume2, VolumeX, X } from 'lucide-react';
import gsap from 'gsap';
import { AmbientEngine } from './audio/AmbientEngine';
import { chapters, useExperience } from './store';
import type { Parameter, PointOfInterest, Quality } from './store';

const Scene = lazy(() => import('./scene/Scene'));

function OrbitMark({ small = false }: { small?: boolean }) {
  return <svg className={small ? 'orbit-mark small' : 'orbit-mark'} viewBox="0 0 52 52" fill="none" aria-hidden="true">
    <circle cx="26" cy="26" r="12" stroke="currentColor" strokeWidth="1.1" />
    <ellipse cx="26" cy="26" rx="25" ry="7" stroke="currentColor" strokeWidth="1.1" transform="rotate(-35 26 26)" />
    <path d="M17 18a12 12 0 0 1 19 15" stroke="currentColor" strokeWidth="2" />
  </svg>;
}

const parameters: { key: Parameter; label: string; min: number; max: number; step: number; format: (value: number) => string }[] = [
  { key: 'mass', label: 'Mass', min: .65, max: 1.65, step: .01, format: v => `${(v*4.3).toFixed(2)} × 10⁶ M☉` },
  { key: 'spin', label: 'Spin', min: 0, max: .99, step: .01, format: v => `${v.toFixed(2)} a*` },
  { key: 'intensity', label: 'Accretion intensity', min: .1, max: 2.5, step: .01, format: v => `${v.toFixed(2)} ×` },
  { key: 'timeScale', label: 'Time scale', min: 0, max: 3, step: .05, format: v => `${v.toFixed(2)} ×` },
  { key: 'distance', label: 'Camera distance', min: 7, max: 35, step: .1, format: v => `${v.toFixed(1)} r₀` },
  { key: 'exposure', label: 'Exposure', min: .3, max: 2.5, step: .01, format: v => `${v.toFixed(2)} ×` },
];
const pointDetails = {
  horizon: { index: '01', title: 'The event horizon', subtitle: 'A BOUNDARY IN SPACETIME', body: 'No outward path leads back from this boundary. The larger dark silhouette you see is the black hole’s shadow: light captured along curved trajectories.', foot: 'Horizon r = rₛ · Distant shadow ≈ 2.60 rₛ' },
  disk: { index: '02', title: 'The accretion disk', subtitle: 'MATTER BECOMES LIGHT', body: 'Hot gas spirals around the black hole. The side moving toward you is brighter through Doppler beaming. The arch above the shadow is the far side, bent into view by gravity.', foot: 'Differential rotation · Procedural plasma' },
  photon: { index: '03', title: 'The photon sphere', subtitle: 'LIGHT ON THE EDGE', body: 'Light can orbit at 1.5 Schwarzschild radii, but these orbits are unstable. Rays that linger here form narrow, magnified images near the shadow’s edge.', foot: 'Photon sphere r = 1.50 rₛ' },
};

function ControlPanel() {
  const s = useExperience();
  return <aside className={`control-panel ${s.panel ? 'is-open' : ''}`} aria-label="Simulation controls" inert={!s.panel}>
    <div className="panel-heading"><span className="mono">OBSERVATORY / CONTROLS</span><button className="icon-button" onClick={() => s.set({panel:false})} aria-label="Close controls"><X size={17}/></button></div>
    <h2>Shape the unknown<span>.</span></h2>
    <p className="panel-intro">Change the conditions. Watch spacetime respond.</p>
    <div className="parameters">
      {parameters.map(p => <label className="parameter" key={p.key}>
        <span className="parameter-label">{p.label}<output>{p.format(s[p.key])}</output></span>
        <input type="range" aria-label={p.label} min={p.min} max={p.max} step={p.step} value={s[p.key]} onChange={e => s.setParameter(p.key,Number(e.target.value))} style={{'--fill':`${(s[p.key]-p.min)/(p.max-p.min)*100}%`} as React.CSSProperties}/>
      </label>)}
    </div>
    <div className="quality-heading"><span className="mono">RENDER QUALITY</span><button className={`auto-button ${s.autoQuality?'active':''}`} onClick={() => s.set({autoQuality:!s.autoQuality})} aria-pressed={s.autoQuality}>AUTO {s.autoQuality && <Check size={11}/>}</button></div>
    <div className="quality-select">{(['LOW','HIGH','CINEMATIC'] as Quality[]).map(q => <button key={q} className={s.quality===q?'selected':''} onClick={() => s.setQuality(q)} aria-pressed={s.quality===q}>{q}</button>)}</div>
    <div className="performance mono"><span><i className="status-dot"/>{s.fps || '—'} FPS</span><span>DPR {s.dpr.toFixed(2)}</span><span>{s.gpuMs>0?`GPU ${s.gpuMs.toFixed(1)} MS`:'WEBGL 2'}</span></div>
    <div className="control-actions"><button className="text-button" onClick={s.reset}><RotateCcw size={13}/> Reset simulation</button><button className="text-button" onClick={() => s.set({info:true})}><Info size={13}/> The model</button></div>
    <p className="model-note">Schwarzschild light paths. Artistic spin & emission.<br/>Mass is illustrative; this is not observational data.</p>
  </aside>;
}

function ModelDialog() {
  const s=useExperience();
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog=ref.current;
    if(s.info&&!dialog?.open) dialog?.showModal();
    else if(!s.info&&dialog?.open) dialog.close();
  },[s.info]);
  return <dialog ref={ref} className="model-dialog" aria-labelledby="model-heading" onCancel={() => s.set({info:false})} onClick={e => {if(e.target===e.currentTarget)s.set({info:false});}}>
    <div className="dialog-content">
      <div className="panel-heading"><span className="mono">FIELD NOTES / 001</span><button className="icon-button" aria-label="Close field notes" onClick={() => s.set({info:false})}><X size={19}/></button></div>
      <OrbitMark/>
      <h2 id="model-heading">An encounter.<br/>Not a measurement.</h2>
      <p>EVENT HORIZON is an interactive interpretation of a black hole, inspired by Sagittarius A*. Light follows numerically integrated paths in a Schwarzschild spacetime. The shadow, lensing and multiple views of the disk arise from these curved rays.</p>
      <p>The plasma, colour, density and sound are art directed. Spin changes disk motion and emission, but does not implement a Kerr metric or frame dragging. Finite ray steps approximate the finest photon rings.</p>
      <p className="hypothesis-note">CHAPTER 05 — BEYOND is explicitly hypothetical. The geometric tunnel is an artistic epilogue, not a prediction of what lies inside a black hole.</p>
      <div className="key-guide"><span><kbd>1</kbd>–<kbd>5</kbd> Chapters</span><span><kbd>Space</kbd> Freeze time</span><span><kbd>F</kbd> Free orbit</span><span><kbd>H</kbd> Hide interface</span><span><kbd>←</kbd><kbd>→</kbd> Journey</span><span><kbd>Esc</kbd> Close panel</span></div>
      <div className="source-links"><a href="https://arxiv.org/abs/1103.0585" target="_blank" rel="noreferrer">Geodesic model <ArrowUpRight size={13}/></a><a href="https://ebruneton.github.io/black_hole_shader/" target="_blank" rel="noreferrer">Further reading <ArrowUpRight size={13}/></a></div>
      <p className="mono credits">ORIGINAL PROCEDURAL VISUALS & SOUND · BUILT FOR THE BROWSER</p>
    </div>
  </dialog>;
}

export default function HorizonExperience({ active, onReturn }: { active: boolean; onReturn: () => void }) {
  const s=useExperience();
  const [audioError,setAudioError]=useState('');
  const [fullscreen,setFullscreen]=useState(false);
  const engine=useRef<AmbientEngine|null>(null);
  const hero=useRef<HTMLDivElement>(null);
  const chapter=chapters[s.chapter];

  useEffect(() => {
    if (!active) return;
    engine.current=new AmbientEngine();
    const unsubscribe=useExperience.subscribe(state => engine.current?.update({distance:state.distance,chapter:state.chapter,spin:state.spin,timeScale:state.timeScale,paused:state.paused}));
    const visibility=() => {
      if(!engine.current) return;
      if(document.hidden) void engine.current.setEnabled(false);
      else if(useExperience.getState().audio) void engine.current.enable().catch(() => useExperience.getState().set({audio:false}));
    };
    const fullscreenChange=() => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('visibilitychange',visibility);
    document.addEventListener('fullscreenchange',fullscreenChange);
    return () => {unsubscribe();engine.current?.dispose();document.removeEventListener('visibilitychange',visibility);document.removeEventListener('fullscreenchange',fullscreenChange);};
  },[active]);

  useEffect(() => {
    if (!active) return;
    const onKey=(e:KeyboardEvent) => {
      const state=useExperience.getState();
      if(e.key==='Escape') {state.set({panel:false,info:false,poi:null,hidden:false});return;}
      if(e.target instanceof HTMLElement && (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)) return;
      if(state.info) return;
      if(e.code==='Space') {
        if(e.target instanceof HTMLElement && ['BUTTON','A'].includes(e.target.tagName)) return;
        e.preventDefault();state.set({paused:!state.paused,intro:false});
      }
      if(e.key.toLowerCase()==='f') state.set({free:!state.free,intro:false});
      if(e.key.toLowerCase()==='h') state.set({hidden:!state.hidden});
      if(e.key==='ArrowRight') state.setChapter(state.chapter+1);
      if(e.key==='ArrowLeft') state.setChapter(state.chapter-1);
      if(/^[1-5]$/.test(e.key)) state.setChapter(Number(e.key)-1);
    };
    window.addEventListener('keydown',onKey);
    return () => window.removeEventListener('keydown',onKey);
  },[active]);

  useEffect(() => {
    if(!active || s.intro || !hero.current) return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const context=gsap.context(() => {
      gsap.fromTo('.hero-animate',{opacity:0,y:reduced?0:18},{opacity:1,y:0,duration:reduced?.15:1.15,stagger:reduced?0:.07,ease:'power3.out',overwrite:true});
    },hero);
    return () => context.revert();
  },[s.chapter,s.intro,active]);

  async function toggleAudio() {
    if(!engine.current) return;
    try {
      const enabled=!useExperience.getState().audio;
      await engine.current.setEnabled(enabled);
      useExperience.getState().set({audio:enabled});
      setAudioError('');
    } catch {setAudioError('Audio could not start. Click to try again.');}
  }
  async function toggleFullscreen() {
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Optional browser capability; experience remains usable. */ }
  }
  function selectPoint(poi:PointOfInterest) {s.set({poi:s.poi===poi?null:poi});}

  return <div className={`horizon-root ${active ? "observatory-active" : "portfolio-background"}`} lang="en"><main aria-hidden={!active} className={`experience ${s.intro?'is-intro':''} ${s.hidden?'is-hidden':''} ${s.free?'is-exploring':''} ${s.panel?'panel-open':''} chapter-${s.chapter+1}`}>
    <Suspense fallback={<div className="loading mono">INITIALIZING OBSERVATORY <span/></div>}><Scene/></Suspense>
    <div className="edge-shade" aria-hidden="true"/>
    <div className="frame-corner top-left" aria-hidden="true"/><div className="frame-corner bottom-right" aria-hidden="true"/>
    {s.intro && <div className="intro">
      <div className={`intro-message ${s.ready?'loaded':''}`}><span className="mono">AN EXPEDITION INTO THE UNKNOWN</span><h2>EVENT HORIZON</h2><span className="intro-line"/></div>
      <div className="intro-footer"><button className="text-button" onClick={toggleAudio}><Headphones size={15}/>{s.audio?'SOUND ENABLED':'ENABLE SOUND'}</button><span className="mono">BEST EXPERIENCED WITH HEADPHONES</span><button className="text-button" onClick={() => s.set({intro:false})}>SKIP INTRO <ArrowRight size={16}/></button></div>
    </div>}
    <div className="hud" inert={!active||s.intro||s.hidden} aria-hidden={!active||s.intro||s.hidden}>
      <header className="header">
        <button className="brand" aria-label="Return to the void" onClick={() => {s.reset();s.set({intro:false});}}><OrbitMark/><span>EVENT<br/>HORIZON</span><sup>+</sup></button>
        <button className="header-caption mono return-to-portfolio" onClick={onReturn} aria-label="Вернуться к портфолио">← YERNAR OS<br/><span>RETURN TO PORTFOLIO</span></button>
        <div className="header-right"><span className="live-label mono"><i className="status-dot"/> LIVE RENDER</span><button className={`sound-button ${s.audio?'active':''}`} aria-label={s.audio?'Mute sound':'Enable sound'} aria-pressed={s.audio} onClick={toggleAudio}>{s.audio?<Volume2 size={16}/>:<VolumeX size={16}/>}<span>SOUND {s.audio?'ON':'OFF'}</span><div className="sound-bars" aria-hidden="true"><i/><i/><i/><i/><i/></div></button><button className="icon-button about-button" aria-label="About the experience" onClick={() => s.set({info:true})}><Info size={17}/></button></div>
      </header>
      <div className="observation mono"><span className="tiny-cross">+</span><span>OBSERVATION / 001<br/><b>{s.chapter===4?'UNMAPPED SPACE':'GALACTIC CENTER'}</b></span><span className="observation-coordinates">RA 17h 45m 40s<br/>DEC −29° 00′ 28″</span></div>
      <div className="hero" ref={hero} key={s.chapter} aria-live="polite">
        <div className="eyebrow hero-animate"><span className="amber-dash"/><span>{chapter.eyebrow}</span></div>
        <h1 className="hero-animate">{chapter.title[0]}<br/><span>{chapter.title[1]}</span><em>0{s.chapter+1}</em></h1>
        <p className="hero-description hero-animate">{chapter.description}</p>
        <div className="hero-buttons hero-animate"><button className="journey-button" onClick={() => s.setChapter(s.chapter===4?0:s.chapter+1)}>{s.chapter===0?'BEGIN THE JOURNEY':s.chapter===4?'RETURN TO THE VOID':'CONTINUE THE JOURNEY'}<ArrowRight size={18}/></button><button className={`explore-button ${s.free?'active':''}`} aria-pressed={s.free} onClick={() => s.set({free:!s.free})}><Crosshair size={15}/>{s.free?'EXIT FREE ORBIT':'FREE EXPLORE'}</button></div>
      </div>
      <div className="object-coordinate mono" aria-hidden="true"><span>SIMULATION A*</span><i/><span>{s.chapter===4?'SIGNAL / UNKNOWN':`${(s.mass*4.3).toFixed(2)} × 10⁶ M☉`}</span></div>
      {s.chapter!==4 && <div className="points-of-interest" aria-label="Points of interest">
        <button className={`poi poi-horizon ${s.poi==='horizon'?'active':''}`} onClick={() => selectPoint('horizon')} aria-label="Inspect the event horizon"><span className="poi-target">+</span><span className="poi-label">EVENT HORIZON<i/></span></button>
        <button className={`poi poi-disk ${s.poi==='disk'?'active':''}`} onClick={() => selectPoint('disk')} aria-label="Inspect the accretion disk"><span className="poi-target">+</span><span className="poi-label">ACCRETION DISK<i/></span></button>
        <button className={`poi poi-photon ${s.poi==='photon'?'active':''}`} onClick={() => selectPoint('photon')} aria-label="Inspect the photon sphere"><span className="poi-target">+</span><span className="poi-label">PHOTON SPHERE<i/></span></button>
      </div>}
      {s.poi && <div className="poi-card" role="region" aria-label={pointDetails[s.poi].title}>
        <div className="panel-heading mono"><span>FIELD NOTE / {pointDetails[s.poi].index}</span><button className="icon-button" onClick={() => s.set({poi:null})} aria-label="Close point of interest"><X size={16}/></button></div>
        <h2>{pointDetails[s.poi].title}</h2><span className="mono poi-subtitle">{pointDetails[s.poi].subtitle}</span><p>{pointDetails[s.poi].body}</p><footer className="mono">{pointDetails[s.poi].foot}</footer>
      </div>}
      <div className="right-rail mono"><span>EST. 2026</span><span>TRANSMISSION {s.chapter===4?'LOST':'ACTIVE'}</span><span className="rail-line"/></div>
      <div className="scene-toolbar">
        <div className="toolbar-group"><button className={s.paused?'active':''} onClick={() => s.set({paused:!s.paused})} aria-label={s.paused?'Resume time':'Freeze time'} aria-pressed={s.paused}>{s.paused?<Play size={14}/>:<Pause size={14}/>}<span>{s.paused?'RESUME TIME':'FREEZE TIME'}</span></button><button className={s.panel?'active':''} onClick={() => s.set({panel:!s.panel})} aria-label="Open simulation controls" aria-expanded={s.panel}><SlidersHorizontal size={15}/><span>CONTROLS</span></button></div>
        <div className="toolbar-group"><button className="icon-only" onClick={() => s.set({hidden:true})} aria-label="Hide interface"><Eye size={16}/></button><button className="icon-only" onClick={toggleFullscreen} aria-label={fullscreen?'Exit fullscreen':'Enter fullscreen'}>{fullscreen?<Minimize size={16}/>:<Maximize size={16}/>}</button></div>
      </div>
      <footer className="footer">
        <div className="footer-meta mono"><span><span className="tiny-cross">+</span> {chapter.kicker}</span><span className="navigation-hint"><ArrowDown size={12}/> SCROLL TO APPROACH <span className="hint-separator">/</span> {s.free?'DRAG TO ORBIT':'MOVE TO LOOK AROUND'}</span></div>
        <nav className="chapter-nav" aria-label="Journey chapters">
          {chapters.map((c,i) => <button key={c.name} aria-label={`0${i+1} ${c.name}`} className={`chapter-button ${s.chapter===i?'current':''} ${s.chapter>i?'visited':''}`} onClick={() => s.setChapter(i)} aria-current={s.chapter===i?'step':undefined}><span className="chapter-number">0{i+1}</span><span className="chapter-title">{c.name}</span>{s.chapter===i?<span className="chapter-dot"/>:<span className="chapter-line"/>}</button>)}
        </nav>
        <div className="bottom-line mono"><span>REAL-TIME WEBGL EXPERIENCE</span><span>{chapter.metric}</span><span>{s.autoQuality?'AUTO / ':''}{s.quality}<i className="status-dot"/>{s.fps>0?`${s.fps} FPS`:'CALIBRATING'}</span></div>
      </footer>
      <ControlPanel/>
    </div>
    {s.free && !s.hidden && <div className="orbit-hint mono"><Expand size={13}/> FREE ORBIT · DRAG TO ROTATE · SCROLL / PINCH TO ZOOM</div>}
    {s.hidden && <button className="restore-ui" onClick={() => s.set({hidden:false})}><Eye size={15}/> SHOW INTERFACE <kbd>H</kbd></button>}
    <div className="mobile-chapter-controls"><button aria-label="Previous chapter" disabled={s.chapter===0} onClick={() => s.setChapter(s.chapter-1)}><ChevronLeft size={18}/></button><span className="mono">0{s.chapter+1} / 05</span><button aria-label="Next chapter" disabled={s.chapter===4} onClick={() => s.setChapter(s.chapter+1)}><ChevronRight size={18}/></button></div>
    {s.chapter===4 && !s.intro && <span className="speculative-badge mono">SPECULATIVE VISUALIZATION</span>}
    {audioError && <button className="audio-error" onClick={toggleAudio} role="status">{audioError}</button>}
    {active && s.error && <div className="error-screen" role="alert"><OrbitMark/><h2>Signal interrupted.</h2><p>{s.error}</p><button className="journey-button" onClick={() => window.location.reload()}>RESTORE EXPERIENCE <RotateCcw size={16}/></button></div>}
    {active && <ModelDialog/>}
    {active && (s.hidden || s.error) && <button className="emergency-return return-to-portfolio" onClick={onReturn}>← Вернуться к портфолио</button>}
  </main></div>;
}
