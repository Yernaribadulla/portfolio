import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import Desktop from "./desktop/Desktop";
gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);
const LiquidBlob = lazy(() => import("./scene/LiquidBlob"));
const CinematicScene = lazy(() => import("./scene/CinematicScene"));
class SceneBoundary extends Component<
  { children: ReactNode; onFail: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
export default function App() {
  const [simple, setSimple] = useState(
    () =>
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      new URLSearchParams(location.search).has("lite") ||
      location.hash === "#desktop" ||
      !hasWebGL(),
  );
  const [ready, setReady] = useState(false),
    [active, setActive] = useState(simple || location.hash === "#desktop");
  const progress = useRef(active ? 1 : 0),
    docked = useRef(false),
    exiting = useRef(false),
    section = useRef<HTMLDivElement>(null),
    surface = useRef<HTMLDivElement>(null),
    intro = useRef<HTMLDivElement>(null),
    bar = useRef<HTMLDivElement>(null),
    trigger = useRef<ScrollTrigger | null>(null);
  const fail = useCallback(() => {
    setSimple(true);
    setActive(true);
    progress.current = 1;
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const enter = useCallback(() => {
    exiting.current=false;
    if (trigger.current) {
      window.scrollTo({
        top: Math.ceil(trigger.current.end),
        behavior: "instant",
      });
      ScrollTrigger.update();
      trigger.current.getTween()?.progress(1);
      trigger.current.animation?.progress(1);
    } else {
      progress.current = 1;
      setActive(true);
      window.scrollTo({
        top: section.current?.offsetTop ?? 0,
        behavior: "instant",
      });
    }
    history.replaceState(null, "", "#desktop");
    requestAnimationFrame(() =>
      document.getElementById("desktop")?.focus({ preventScroll: true }),
    );
  }, []);
  const replay = () => {
    docked.current = false;
    exiting.current = true;
    if (simple) {
      setSimple(false);
      setReady(false);
    }
    history.replaceState(
      null,
      "",
      location.pathname + location.search.replace(/[?&]lite(?:=[^&]*)?/, ""),
    );
    window.scrollTo({ top: 0, behavior: "instant" });
    progress.current = 0;
    setActive(false);
  };
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      if (media.matches) fail();
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [fail]);
  useEffect(() => {
    if (simple) return;
    const timer = setTimeout(() => {
      if (!ready) fail();
    }, 20000);
    return () => clearTimeout(timer);
  }, [simple, ready, fail]);
  useEffect(() => {
    if (simple || !section.current) return;
    const state = { p: 0 };
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * 4.5,
          pin: true,
          scrub: 0.85,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar.current)
              bar.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
      timeline.to(state, {
        p: 1,
        duration: 1,
        ease: "none",
        onUpdate: () => {
          if (docked.current) return;
          progress.current = state.p;
          section.current?.style.setProperty('--aura-opacity',String(Math.max(0,1-state.p/.32)));
          section.current?.style.setProperty('--skip-opacity', String(Math.max(0, Math.min(1,1-(state.p-.64)/.2))));
          const skip=section.current?.querySelector<HTMLButtonElement>('.skip-intro');
          if(skip)skip.inert=state.p>=.84;
          if(state.p<.985)exiting.current=false;
          if(state.p>.998 && !exiting.current){
            docked.current=true;
            progress.current=1;
            window.scrollTo({top:trigger.current?.end ?? scrollY,behavior:"instant"});
          }
          section.current?.style.setProperty(
            "--chrome-opacity",
            String(Math.max(0, 1 - (state.p - 0.75) / 0.17)),
          );
          window.dispatchEvent(new Event("cinematic-progress"));
          setActive(docked.current);
          if (intro.current)
            intro.current.style.opacity = String(
              Math.max(0, 1 - state.p / 0.4),
            );
        },
      });
      trigger.current = timeline.scrollTrigger!;
    }, section);
    if (location.hash === "#desktop") requestAnimationFrame(enter);
    const hash = () => {
      if (location.hash === "#desktop") enter();
    };
    window.addEventListener("hashchange", hash);
    let resizeFrame=0;
    const resize=()=>{
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(()=>{
        ScrollTrigger.refresh();
        if(docked.current){
          window.scrollTo({top:trigger.current?.end ?? scrollY,behavior:'instant'});
          window.dispatchEvent(new Event('cinematic-progress'));
        }
      });
    };
    window.addEventListener('resize',resize);
    return () => {
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize',resize);
      window.removeEventListener("hashchange", hash);
      ctx.revert();
      trigger.current = null;
    };
  }, [simple, enter]);
  useEffect(() => {
    if (simple && surface.current) {
      setActive(true);
      window.scrollTo({top:0,behavior:"instant"});
      surface.current.style.transform = "none";
      surface.current.style.opacity = "1";
      surface.current.style.width = "100%";
      surface.current.style.height = "100%";
    }
  }, [simple]);
  useEffect(() => {
    if (!active || simple) return;
    let last = performance.now(), armed = false, upward = 0;
    const entered = last;
    const release = () => {
      docked.current = false;
      exiting.current = true;
      setActive(false);
      history.replaceState(null, "", location.pathname + location.search);
      requestAnimationFrame(() => {
        const end = trigger.current?.end ?? scrollY;
        window.scrollTo({top:end - innerHeight * .35,behavior:"instant"});
        ScrollTrigger.update();
      });
    };
    const wheel = (event: WheelEvent) => {
      if ((event.target as Element)?.closest('.os-window, input, textarea')) return;
      event.preventDefault();
      const now = performance.now();
      if (now-entered > 700 && now-last > 180) {armed=true; upward=0;}
      last=now;
      if (!armed) return;
      upward=event.deltaY<0 ? upward + Math.abs(event.deltaY)*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1) : 0;
      if (upward>=90) release();
    };
    let touchY=0;
    const touchStart=(event:TouchEvent)=>{touchY=event.touches[0].clientY;};
    const touchMove=(event:TouchEvent)=>{
      if ((event.target as Element)?.closest('.os-window, input, textarea')) return;
      event.preventDefault();
      if(performance.now()-entered>700 && event.touches[0].clientY-touchY>75)release();
    };
    const key=(event:KeyboardEvent)=>{
      if((event.target as Element)?.closest('.os-window,input,textarea,button,a'))return;
      if(event.key==='ArrowUp'||event.key==='PageUp'){event.preventDefault();if(performance.now()-entered>700)release();}
    };
    window.addEventListener('wheel',wheel,{passive:false});
    window.addEventListener('touchstart',touchStart,{passive:true});
    window.addEventListener('touchmove',touchMove,{passive:false});
    window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('wheel',wheel);window.removeEventListener('touchstart',touchStart);window.removeEventListener('touchmove',touchMove);window.removeEventListener('keydown',key);};
  },[active,simple]);
  return (
    <>
      <a
        className="skip-link"
        href="#desktop"
        onClick={(e) => {
          e.preventDefault();
          enter();
        }}
      >
        Перейти к портфолио
      </a>
      <section
        className={`experience-stage ${active ? "is-active" : ""} ${simple ? "is-simple" : ""}`}
        ref={section}
        aria-label="YERNAR OS"
        data-scene-ready={ready||simple}
        onPointerMove={e=>{if(!active){const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty("--pointer-x",`${(e.clientX-r.left)/r.width*20-10}px`);e.currentTarget.style.setProperty("--pointer-y",`${(e.clientY-r.top)/r.height*20-10}px`);}}}
      >
        {!simple && (
          <div className="scene" aria-hidden="true">
            <SceneBoundary onFail={fail}>
              <Suspense fallback={null}>
                <CinematicScene
                  progress={progress}
                  surface={surface}
                  onReady={onReady}
                  onFail={fail}
                />
              </Suspense>
            </SceneBoundary>
          </div>
        )}
        <div
          className="desktop-surface"
          ref={surface}
          inert={!active}
          aria-hidden={!active}
        >
          <Desktop active={active} onReplay={replay} />
        </div>
        {!active && (
          <>
            <Suspense fallback={null}><LiquidBlob progress={progress}/></Suspense>
            <header className="intro-header">
              <a
                href="#desktop"
                onClick={(e) => {
                  e.preventDefault();
                  enter();
                }}
                className="brand"
              >
                YERNAR<span>OS</span>
                <i>®</i>
              </a>
              <span className="intro-header-label">
                ПЕРСОНАЛЬНОЕ РАБОЧЕЕ ПРОСТРАНСТВО
              </span>
              <button className="skip-intro" onClick={enter}>
                Пропустить интро
                <ArrowUpRight size={15} />
              </button>
            </header>
            <div className="intro-copy" ref={intro}>
              <div className="eyebrow">
                <span className="dot" />
                PYTHON BACKEND & AI INTEGRATION
              </div>
              <h1>
                За каждым интерфейсом —<br />
                <em>чья-то мысль.</em>
              </h1>
              <p>Моя начинается здесь.</p>
            </div>
            <div className="intro-bottom">
              <span>
                ЕРНАР ИБАДУЛЛА
                <br />
                <small>АСТАНА, КАЗАХСТАН</small>
              </span>
            </div>
          </>
        )}
        <div className="scroll-progress" ref={bar} />
      </section>
      <footer className="page-footer" hidden={active}>
        <span>Ернар Ибадулла · Python & AI</span>
        <a
          href="#desktop"
          onClick={(e) => {
            e.preventDefault();
            enter();
            window.dispatchEvent(new Event("portfolio-contact"));
          }}
        >
          Связаться ↗
        </a>
        <a
          href="#desktop"
          onClick={(e) => {
            e.preventDefault();
            enter();
          }}
        >
          Вернуться к рабочему столу ↑
        </a>
      </footer>
    </>
  );
}
