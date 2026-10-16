import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowUpRight,
  X,
  Minus,
  Maximize2,
  Github,
  Mail,
  ArrowLeft,
  Folder,
  Command,
  Wifi,
} from "lucide-react";
import {
  apps,
  email,
  github,
  linkedin,
  projects,
  type AppId,
} from "../data/projects";
import WindowFrame from "./WindowFrame";
import Terminal from "./Terminal";
import SparxieRain from "./SparxieRain";
const localTime = () =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
interface WindowState {
  exit?: "close" | "minimize";
  id: AppId;
  x: number;
  y: number;
  max: boolean;
  minimized: boolean;
}
const external = { target: "_blank", rel: "noreferrer" };
const appMark = (app: (typeof apps)[number]) => app.id === "outreach"
  ? <ArrowUpRight className="outreach-mark" aria-hidden="true" strokeWidth={1.8} />
  : app.mark;
function ProjectContent({ id }: { id: AppId }) {
  const project = projects.find((p) => p.id === id)!;
  return (
    <article className="project-content">
      <div className="eyebrow">{project.category}</div>
      <h2>{project.title}</h2>
      <p className="project-intro">{project.intro}</p>
      <div className="tags">
        {project.stack.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      {project.image && (
        <img
          className="project-image"
          src={
            new URL(
              `../../assets/screenshots/${project.image}`,
              import.meta.url,
            ).href
          }
          alt={`Интерфейс ${project.title}`}
          loading="lazy"
        />
      )}
      <h3>Как это устроено</h3>
      {project.details.map((d, i) => (
        <p className="detail" key={d}>
          <span>0{i + 1}</span>
          {d}
        </p>
      ))}
      {project.note && <p className="note">{project.note}</p>}
      <div className="project-links">
        {project.links.map((l) => (
          <a key={l.url} href={l.url} {...external}>
            {l.label}
            <ArrowUpRight size={16} />
          </a>
        ))}
      </div>
    </article>
  );
}
function About({ open }: { open: (id: AppId) => void }) {
  return (
    <article className="about-content">
      <div className="eyebrow">АСТАНА, КАЗАХСТАН / OPEN TO WORK</div>
      <div className="about-heading">
        <div className="avatar">YI</div>
        <div>
          <h2>
            Ернар
            <br />
            Ибадулла<span className="accent">.</span>
          </h2>
          <p>Python Backend & AI Integration Engineer</p>
        </div>
      </div>
      <p className="about-lead">
        Соединяю модели, данные
        <br />и реальные рабочие процессы.
      </p>
      <p>
        Разрабатываю Python-приложения, которые связывают локальные языковые
        модели с API, бизнес-данными и настольными интерфейсами. Встраиваю
        проверку данных и контроль человека перед внешними действиями.
      </p>
      <div className="about-grid">
        <div>
          <span className="eyebrow">ОСНОВНОЙ СТЕК</span>
          <p>
            Python · FastAPI · Pydantic
            <br />
            PostgreSQL · SQLite · REST API
          </p>
        </div>
        <div>
          <span className="eyebrow">AI И ИНТЕГРАЦИИ</span>
          <p>
            LM Studio · Whisper · Playwright
            <br />
            n8n · Make · PySide6
          </p>
        </div>
      </div>
      <div className="experience">
        <span className="eyebrow">ОПЫТ</span>
        <p>
          <b>KCOI · Автоматизация ITSM</b>
          <br />
          Классификация и маршрутизация инцидентов, база знаний, релизные
          чек-листы и отчётность.
        </p>
        <p>
          <b>AI-ассистенты и бизнес-интеграции</b>
          <br />
          Связка ассистентов с amoCRM, Google Calendar и платёжными процессами
          через API.
        </p>
      </div>
      <button className="primary" onClick={() => open("contact")}>
        Обсудить задачу <ArrowUpRight size={17} />
      </button>
    </article>
  );
}
function Contact() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <article className="contact-content">
      <span className="status">
        <i />
        Открыт к удалённой работе и фрилансу
      </span>
      <h2>
        Давайте
        <br />
        соберём что-то
        <br />
        <em>полезное.</em>
      </h2>
      <p>
        Python-бэкенды, AI-интеграции
        <br />и внутренние инструменты для бизнеса.
      </p>
      <a className="contact-email" href={`mailto:${email}`}>
        {email}
        <ArrowUpRight size={22} />
      </a>
      <div className="contact-actions">
        <button className="primary" onClick={copy}>
          {copied ? "Адрес скопирован" : "Скопировать email"}
        </button>
        <a
          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`}
          {...external}
        >
          Открыть Gmail ↗
        </a>
      </div>
      <p role="status" className="note">
        {copyError
          ? "Не удалось скопировать. Выделите адрес выше и скопируйте вручную."
          : copied
            ? "Email скопирован в буфер обмена."
            : "Можно скопировать адрес, открыть Gmail или нажать на email для почтовой программы."}
      </p>
      <div className="project-links">
        <a href={github} {...external}>
          <Github size={18} />
          GitHub
        </a>
        <a href={linkedin} {...external}>
          LinkedIn
          <ArrowUpRight size={16} />
        </a>
      </div>
      <p className="note">Астана, Казахстан · Удалённо</p>
    </article>
  );
}
export default function Desktop({
  active,
  onReplay,
}: {
  active: boolean;
  onReplay: () => void;
}) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [time, setTime] = useState(localTime);
  const desktop = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: AppId;
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const open = (id: AppId) => {
    setWindows((w) => {
      const exists = w.find((a) => a.id === id);
      return [
        ...w.filter((a) => a.id !== id),
        exists
          ? { ...exists, minimized: false, exit: undefined }
          : {
              id,
              x: Math.min(
                240 + w.length * 25,
                Math.max(12, window.innerWidth - 720),
              ),
              y: 75 + w.length * 20,
              max: false,
              minimized: false,
            },
      ];
    });
  };
  const close = (id: AppId) =>
    setWindows((w) =>
      w.map((a) => (a.id === id ? { ...a, exit: "close" } : a)),
    );
  const finishExit = (id: AppId) => {
    setWindows((w) =>
      w.flatMap((a) =>
        a.id !== id
          ? [a]
          : a.exit === "minimize"
            ? [{ ...a, minimized: true, exit: undefined }]
            : [],
      ),
    );
    requestAnimationFrame(() =>
      desktop.current
        ?.querySelector<HTMLButtonElement>(`[data-app="${id}"]`)
        ?.focus({ preventScroll: true }),
    );
  };
  useEffect(() => {
    const handler = () => open("contact");
    window.addEventListener("portfolio-contact", handler);
    return () => window.removeEventListener("portfolio-contact", handler);
  }, []);
  const update = (id: AppId, change: Partial<WindowState>) =>
    setWindows((w) => w.map((a) => (a.id === id ? { ...a, ...change } : a)));
  const focus = (id: AppId) =>
    setWindows((w) => [
      ...w.filter((a) => a.id !== id),
      ...w.filter((a) => a.id === id),
    ]);
  useEffect(() => {
    const tick = () => setTime(localTime());
    tick();
    const timer = setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  useEffect(() => {
    const resize = () =>
      setWindows((w) =>
        w.map((a) => ({
          ...a,
          x: Math.max(12, Math.min(a.x, window.innerWidth - 340)),
          y: Math.max(0, Math.min(a.y, window.innerHeight - 160)),
        })),
      );
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const start = (e: PointerEvent<HTMLDivElement>, w: WindowState) => {
    if (
      (e.target as HTMLElement).closest("button") ||
      w.max ||
      window.innerWidth < 700
    )
      return;
    drag.current = {
      id: w.id,
      x: e.clientX,
      y: e.clientY,
      left: w.x,
      top: w.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    update(d.id, {
      x: Math.max(
        0,
        Math.min(window.innerWidth - 120, d.left + e.clientX - d.x),
      ),
      y: Math.max(
        0,
        Math.min(window.innerHeight - 110, d.top + e.clientY - d.y),
      ),
    });
  };
  const keys = (e: KeyboardEvent<HTMLElement>, w: WindowState) => {
    if (e.key === "Escape") {
      close(w.id);
      return;
    }
    if (
      e.altKey &&
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
    ) {
      e.preventDefault();
      update(w.id, {
        x: Math.max(
          0,
          Math.min(
            window.innerWidth - 120,
            w.x +
              (e.key === "ArrowRight" ? 20 : e.key === "ArrowLeft" ? -20 : 0),
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            window.innerHeight - 110,
            w.y + (e.key === "ArrowDown" ? 20 : e.key === "ArrowUp" ? -20 : 0),
          ),
        ),
      });
    }
  };
  return (
    <div className="desktop" ref={desktop}>
      <div className="wallpaper">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="wallpaper-grid" />
      </div>
      <header className="menubar">
        <b>
          <Command size={15} />
          YERNAR <span>OS</span>
        </b>
        <span className="menu-label">Персональное рабочее пространство</span>
        <div className="menu-right">
          <span className="status">
            <i />
            Доступен для проектов
          </span>
          <Wifi size={14} />
          <time
            title={Intl.DateTimeFormat().resolvedOptions().timeZone}
            aria-label="Местное время устройства"
          >
            {time}
          </time>
        </div>
      </header>
      <main
        className="desktop-main"
        id="desktop"
        tabIndex={-1}
        aria-label="Рабочий стол YERNAR OS"
      >
        <div className="desktop-icons">
          {apps.map((app) => (
            <button
              data-app={app.id}
              className="desktop-icon"
              key={app.id}
              onClick={() => open(app.id)}
              aria-label={`Открыть ${app.title}`}
            >
              <span className={`app-icon ${app.color}`}>{appMark(app)}</span>
              <span>{app.title}</span>
            </button>
          ))}
        </div>
        <div className="desktop-greeting">
          <span className="eyebrow">ИНЖЕНЕРИЯ С ЧЕЛОВЕЧЕСКИМ ЛИЦОМ</span>
          <h1>
            Хорошие идеи.
            <br />
            Рабочий <em>код.</em>
          </h1>
          <p>
            Ернар Ибадулла
            <br />
            <span>Python Backend & AI Integration Engineer</span>
          </p>
          <button onClick={() => open("about")}>
            Рад знакомству <ArrowUpRight size={18} />
          </button>
          <button onClick={() => window.dispatchEvent(new Event("summon-sparxie"))}>
            Вызвать объект <ArrowUpRight size={18} />
          </button>
        </div>
        <SparxieRain />
        <div className="desktop-hint">
          <Folder size={16} />
          <span>
            Каждая иконка — часть моей работы.
            <br />
            Откройте любую, чтобы начать.
          </span>
        </div>
        {windows
          .filter((w) => !w.minimized)
          .map((w) => {
            const app = apps.find((a) => a.id === w.id)!;
            return (
              <WindowFrame
                maximized={w.max}
                exiting={!!w.exit}
                onExited={() => finishExit(w.id)}
                role="dialog"
                aria-modal="false"
                aria-label={app.title}
                className={`os-window ${w.max ? "maximized" : ""}`}
                key={w.id}
                style={{ left: w.x, top: w.y, zIndex: 20 + windows.indexOf(w) }}
                onPointerDown={() => focus(w.id)}
                onFocus={() => {
                  if (windows.at(-1)?.id !== w.id) focus(w.id);
                }}
                onKeyDown={(e) => keys(e, w)}
              >
                <div
                  className="window-title"
                  tabIndex={0}
                  aria-label={`${app.title}. Alt и стрелки — переместить, Escape — закрыть`}
                  onPointerDown={(e) => start(e, w)}
                  onPointerMove={move}
                  onPointerUp={() => {
                    drag.current = null;
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                  }}
                >
                  <span className={`tiny-icon ${app.color}`}>{appMark(app)}</span>
                  <b>{app.title}</b>
                  <div className="window-controls">
                    <button
                      aria-label={`Свернуть ${app.title}`}
                      onClick={() => update(w.id, { exit: "minimize" })}
                    >
                      <Minus size={15} />
                    </button>
                    <button
                      aria-label={`Развернуть ${app.title}`}
                      onClick={() => update(w.id, { max: !w.max })}
                    >
                      <Maximize2 size={13} />
                    </button>
                    <button
                      aria-label={`Закрыть ${app.title}`}
                      onClick={() => close(w.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="window-body">
                  {w.id === "about" ? (
                    <About open={open} />
                  ) : w.id === "contact" ? (
                    <Contact />
                  ) : w.id === "terminal" ? (
                    <Terminal open={open} />
                  ) : (
                    <ProjectContent id={w.id} />
                  )}
                </div>
                <div className="window-footer">
                  <span>YERNAR OS / {w.id}</span>
                  <span>Сделано с вниманием к деталям</span>
                </div>
              </WindowFrame>
            );
          })}
      </main>
      <button className="replay" onClick={onReplay}>
        <ArrowLeft size={14} />
        Интро
      </button>
      <nav className="dock" aria-label="Панель приложений">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => open(app.id)}
            aria-label={`${app.title} — панель`}
            title={app.title}
          >
            <span className={`app-icon ${app.color}`}>{appMark(app)}</span>
            <i
              className={windows.some((w) => w.id === app.id) ? "running" : ""}
            />
          </button>
        ))}
        <div className="dock-divider" />
        <button
          className="dock-mail"
          onClick={() => open("contact")}
          aria-label="Написать письмо"
        >
          <Mail size={25} />
        </button>
        <a href={github} {...external} aria-label="GitHub">
          <Github size={25} />
        </a>
      </nav>
      <span className="desktop-version">Y / OS — 2026</span>
    </div>
  );
}
