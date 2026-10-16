import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { apps, email, github, projects, type AppId } from "../data/projects";
const commands = [
  "help",
  "about",
  "projects",
  "contact",
  "skills",
  "whoami",
  "date",
  "ls",
  "pwd",
  "clear",
  "history",
  "open",
];
export default function Terminal({ open }: { open: (id: AppId) => void }) {
  const [lines, setLines] = useState([
    "YERNAR OS / interactive shell",
    "Введите help или нажмите на команду ниже. Tab — дополнить, ↑ ↓ — история.",
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const cursor = useRef(0),
    draft = useRef("");
  const field = useRef<HTMLInputElement>(null),
    log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const parent = log.current?.closest(".window-body");
    if (parent) parent.scrollTop = parent.scrollHeight;
  }, [lines]);
  const run = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const [cmd, ...args] = text.toLowerCase().split(/\s+/);
    setInput("");
    const next = [...history, text].slice(-100);
    setHistory(next);
    cursor.current = next.length;
    draft.current = "";
    let answer = "Команда не найдена. Введите help.";
    switch (cmd) {
      case "clear":
        setLines([]);
        return;
      case "help":
        answer =
          "help              список команд\nprojects / ls     проекты и ссылки\nopen <имя>        открыть приложение\nabout / contact   обо мне / контакты\nskills            стек технологий\nwhoami / pwd      профиль / текущий каталог\ndate              время вашего устройства\nhistory           история команд\nclear             очистить терминал\n\nПример: open ai-hunter. Tab дополняет команды и имена приложений.";
        break;
      case "projects":
      case "ls":
        answer = projects
          .map(
            (p) =>
              `${p.id.padEnd(12)} ${p.title}\n             ${p.links[0].url}`,
          )
          .join("\n\n");
        break;
      case "about":
        open("about");
        answer = "Открыто: Обо мне";
        break;
      case "contact":
        open("contact");
        answer = email + "\n" + github;
        break;
      case "skills":
        answer =
          "Python · FastAPI · Pydantic · REST API\nSQLite · PostgreSQL · Playwright · PySide6\nLM Studio · Qwen · faster-whisper · n8n · Make";
        break;
      case "whoami":
        answer =
          "Ернар Ибадулла\nPython Backend & AI Integration Engineer\nАстана, Казахстан";
        break;
      case "pwd":
        answer = "/home/yernar/portfolio";
        break;
      case "date":
        answer = new Date().toLocaleString(undefined, {
          timeZoneName: "short",
        });
        break;
      case "history":
        answer = next.map((s, i) => `${i + 1}  ${s}`).join("\n");
        break;
      case "open": {
        const name = args.join(" ");
        const app = apps.find(
          (a) => a.id === name || a.title.toLowerCase() === name,
        );
        if (app) {
          open(app.id);
          answer = "Открыто: " + app.title;
        } else answer = "Доступны: " + apps.map((a) => a.id).join(", ");
        break;
      }
    }
    setLines((l) => [...l, `yernar@os ~ $ ${text}`, answer].slice(-200));
  };
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      if (cursor.current === history.length) draft.current = input;
      cursor.current = Math.max(
        0,
        Math.min(
          history.length,
          cursor.current + (e.key === "ArrowUp" ? -1 : 1),
        ),
      );
      setInput(
        cursor.current === history.length
          ? draft.current
          : history[cursor.current],
      );
    }
    if (e.key === "Tab" && !e.shiftKey && input.trim()) {
      const choices = input.startsWith("open ")
        ? apps.map((a) => "open " + a.id)
        : commands;
      const matches = choices.filter((c) => c.startsWith(input.toLowerCase()));
      if (matches.length) {
        e.preventDefault();
        if (matches.length === 1) setInput(matches[0]);
        else setLines((l) => [...l, matches.join("   ")]);
      }
    }
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setLines([]);
    }
    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      setLines((l) => [...l, `yernar@os ~ $ ${input} ^C`]);
      setInput("");
    }
  };
  return (
    <div className="terminal">
      <div ref={log}>
        <pre aria-live="polite">{lines.join("\n\n")}</pre>
      </div>
      <p className="terminal-input-hint" id="terminal-hint">Введите команду в поле ниже и нажмите Enter</p>
      <form className="terminal-command-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
      >
        <label htmlFor="terminal-input">❯</label>
        <input
          ref={field}
          id="terminal-input"
          aria-label="Команда терминала"
          aria-describedby="terminal-hint"
          placeholder="Например: help или open ai-hunter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={key}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" aria-label="Выполнить команду">Enter ↵</button>
      </form>
      <div className="terminal-shortcuts">
        {["help", "projects", "open ai-hunter", "skills", "contact"].map(
          (c) => (
            <button
              key={c}
              onClick={() => {
                run(c);
                field.current?.focus();
              }}
            >
              {c}
            </button>
          ),
        )}
      </div>
      <small>
        Локальная симуляция · без системных команд · Shift+Tab — выйти из поля
      </small>
    </div>
  );
}
