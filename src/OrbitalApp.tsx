import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Orbit } from 'lucide-react';
import Desktop from './desktop/Desktop';
import { useExperience } from './horizon/store';
import './horizon/fonts.css';
import './styles/orbital.css';

const Horizon = lazy(() => import('./horizon/HorizonExperience'));
const Studio = lazy(() => import('./Studio'));
type View = 'portfolio' | 'observatory' | 'studio';
function route(): View {
  if (/^#products(?:\/|$)/.test(location.hash)) return 'portfolio';
  if (location.hash.startsWith('#observatory')) return 'observatory';
  if (location.hash.startsWith('#studio')) return 'studio';
  if (new URLSearchParams(location.search).has('studio')) return 'studio';
  return 'portfolio';
}
class WorldBoundary extends Component<{ children: ReactNode; onReturn: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="world-fallback" role="status">3D-сцена недоступна. <button onClick={this.props.onReturn}>Вернуться к проектам ↗</button></div> : this.props.children; }
}

export default function OrbitalApp() {
  const [view, setView] = useState<View>(route);
  const chapter = useExperience(s => s.chapter);
  const error = useExperience(s => s.error);
  const lastChapter = useRef(0);
  const previousView = useRef<View | null>(null);
  const navigate = useCallback((next: View) => {
    if (next === 'observatory') useExperience.getState().setChapter(lastChapter.current);
    const query = new URLSearchParams(location.search);
    if (query.has('studio')) {
      query.delete('studio');
      history.replaceState(null, '', location.pathname + (query.size ? `?${query}` : '') + location.hash);
    }
    setView(next);
    location.hash = next === 'portfolio' ? 'desktop' : next === 'observatory' ? `observatory/${lastChapter.current + 1}` : 'studio';
  }, []);

  useEffect(() => {
    const sync = () => {
      const next = route();
      if (next === 'observatory') {
        const n = Number(location.hash.split('/')[1]);
        useExperience.getState().setChapter(Number.isInteger(n) && n >= 1 && n <= 5 ? n - 1 : 0);
      }
      setView(next);
    };
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); };
  }, []);

  useEffect(() => {
    const state = useExperience.getState();
    if (view === 'portfolio') {
      if (previousView.current === 'observatory') lastChapter.current = state.chapter;
      state.setChapter(0);
      state.set({ portfolio: true, intro: false, free: false, panel: false, poi: null, info: false, hidden: false, audio: false });
    } else if (view === 'observatory') {
      state.set({ portfolio: false, intro: false, hidden: false });
    } else {
      state.set({ audio: false, ready: false });
    }
    document.title = view === 'observatory' ? 'EVENT HORIZON · YERNAR OS' : 'YERNAR OS · Orbital portfolio';
    document.body.classList.toggle('orbital-page', view !== 'studio');
    if (view !== 'studio') window.scrollTo({ top: 0, behavior: 'instant' });
    const timer = window.setTimeout(() => {
      const target = view === 'portfolio' ? document.getElementById('orbital-desktop') : document.querySelector<HTMLButtonElement>('.return-to-portfolio');
      target?.focus({ preventScroll: true });
    }, 450);
    previousView.current = view;
    return () => { clearTimeout(timer); document.body.classList.remove('orbital-page'); };
  }, [view]);

  useEffect(() => {
    if (view === 'observatory' && route() === 'observatory') {
      history.replaceState(null, '', `#observatory/${chapter + 1}`);
    }
  }, [chapter, view]);

  return <div className={`orbital-app view-${view} ${view === 'studio' ? 'legacy-ui' : ''}`} data-view={view}>
    {view !== 'studio' && <div className="orbital-world"><WorldBoundary onReturn={() => navigate('portfolio')}><Suspense fallback={<div className="world-loading">Y / OS <span>ESTABLISHING ORBIT</span></div>}><Horizon active={view === 'observatory'} onReturn={() => navigate('portfolio')} /></Suspense></WorldBoundary></div>}
    {view !== 'studio' && <div className="orbital-workspace legacy-ui" inert={view !== 'portfolio'} aria-hidden={view !== 'portfolio'}>
      <Desktop active={view === 'portfolio'} orbital onReplay={() => navigate('studio')} onObservatory={() => navigate('observatory')} />
      {error && view === 'portfolio' && <span className="world-unavailable" role="status">3D недоступно · проекты доступны</span>}
    </div>}
    {view === 'studio' && <div className="studio-host"><Suspense fallback={<div className="world-loading">ENTERING THE STUDIO</div>}><Studio onObservatory={() => navigate('observatory')} /></Suspense></div>}
    {view === 'studio' && <button className="studio-return" onClick={() => navigate('portfolio')}><ArrowLeft size={15}/> На орбиту <Orbit size={16}/></button>}
    <a className="orbital-skip" href="#desktop" onClick={e => { e.preventDefault(); navigate('portfolio'); }}>К проектам <ArrowUpRight size={15}/></a>
    <span className="sr-only" aria-live="polite">{view === 'observatory' ? 'Обсерватория EVENT HORIZON' : view === 'studio' ? 'Кинематографическая студия' : 'Рабочий стол портфолио'}</span>
  </div>;
}
