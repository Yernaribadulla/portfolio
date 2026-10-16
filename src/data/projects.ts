export type AppId =
  | "about"
  | "ai-hunter"
  | "outreach"
  | "voxbridge"
  | "shtil"
  | "terminal"
  | "contact";
export interface Project {
  id: AppId;
  title: string;
  category: string;
  intro: string;
  stack: string[];
  details: string[];
  links: { label: string; url: string }[];
  image?: string;
  note?: string;
}
export const github = "https://github.com/Yernaribadulla";
export const email = "yernaribadulla@gmail.com";
export const linkedin =
  "https://www.linkedin.com/in/%D0%B5%D1%80%D0%BD%D0%B0%D1%80-%D0%B8%D0%B1%D0%B0%D0%B4%D1%83%D0%BB%D0%BB%D0%B0-a66050420/";
export const projects: Project[] = [
  {
    id: "ai-hunter",
    title: "AI-Hunter",
    category: "AI / АВТОМАТИЗАЦИЯ",
    intro: "От поиска вакансии до осознанного отклика.",
    stack: ["Python", "Playwright", "Pydantic", "LM Studio", "PySide6"],
    details: [
      "Сбор и дедупликация вакансий HeadHunter через постоянную браузерную сессию Playwright.",
      "Ответы локальной модели проходят проверку Pydantic. Python-правила проверяют зарплату, опыт, язык и возможность отклика.",
      "История сохраняется в JSONL. В режиме подтверждения отправка останавливается для проверки человеком.",
    ],
    links: [
      { label: "Исходный код", url: github + "/AI-Hunter" },
      {
        label: "Политика решений",
        url: github + "/AI-Hunter/blob/main/safety.py",
      },
    ],
    image: "ai-hunter-workflow.png",
    note: "Скриншот показывает раннюю версию интерфейса. Описание основано на README портфолио.",
  },
  {
    id: "outreach",
    title: "Outreach Agent",
    category: "AI / B2B ИССЛЕДОВАНИЯ",
    intro: "Сначала факты. Затем решение о контакте.",
    stack: ["Python", "SQLite", "LM Studio", "JavaScript"],
    details: [
      "Локальный конвейер связывает поиск компаний, аудит сайтов и источники с квалификацией и подготовкой черновиков.",
      "Сохраняет URL доказательств и различает подтверждённые, предполагаемые, неизвестные и не обнаруженные сигналы.",
      "Детерминированные проверки оценивают соответствие бизнеса, доказательства, контакты и уверенность модели.",
      "Задания и черновики хранятся в SQLite. Согласование отделено от отправки: по умолчанию используется симуляция.",
    ],
    links: [
      {
        label: "Python-приложение",
        url: github + "/outreach-agent/tree/master/outreach-agent",
      },
      {
        label: "Архитектура",
        url: github + "/outreach-agent/blob/master/docs/architecture.md",
      },
    ],
    image: "outreach-agent-dashboard.png",
    note: "Скриншот ранней версии. В репозитории также есть отдельный сайт DENTARA.",
  },
  {
    id: "voxbridge",
    title: "VoxBridge",
    category: "DESKTOP / РЕЧЬ",
    intro: "Локальное распознавание. Перевод поверх рабочего окна.",
    stack: ["Python", "PySide6", "faster-whisper", "CTranslate2", "WASAPI"],
    details: [
      "Windows-оверлей захватывает английский системный звук и показывает русские субтитры. Mouse 5 отдаёт приоритет микрофону для ответа с русского на английский.",
      "Одна многоязычная модель Whisper обслуживает оба аудиомаршрута. Очереди ограничены, устаревшие результаты отбрасываются.",
      "Аудио и транскрипты остаются в памяти. Перевод выполняется через настроенный endpoint LM Studio.",
    ],
    links: [
      { label: "Исходный код", url: github + "/voxbridge" },
      {
        label: "Очереди и приоритеты",
        url: github + "/voxbridge/blob/main/app/core/jobs.py",
      },
    ],
    note: "Приложение выводит субтитры, но не синтезирует речь. Задержка зависит от оборудования.",
  },
  {
    id: "shtil",
    title: "Штиль",
    category: "БИЗНЕС / ОБРАТНАЯ СВЯЗЬ",
    intro: "Обратная связь гостей, которую удобно разбирать.",
    stack: ["JavaScript", "Google Sheets", "Apps Script", "WebGL"],
    details: [
      "Два связанных интерфейса для кафе в Актау: экран с персональными QR-кодами сотрудников и панель анализа отзывов.",
      "Мобильная форма оценки, фильтры сотрудников и периодов, динамика рейтинга и поиск по отзывам.",
      "Демо работают на примерах данных: не записывают отзывы и не загружают рабочие Google Sheets.",
    ],
    links: [
      {
        label: "QR-демо ↗",
        url: "https://yernaribadulla.github.io/qrcode2/?demo=1",
      },
      {
        label: "Аналитика ↗",
        url: "https://yernaribadulla.github.io/AdminFeedback/?demo=1",
      },
      { label: "Исходный код", url: github + "/qrcode2" },
    ],
  },
];
export const apps: { id: AppId; title: string; mark: string; color: string }[] =
  [
    { id: "about", title: "Обо мне", mark: "YI", color: "cream" },
    { id: "ai-hunter", title: "AI-Hunter", mark: "⌖", color: "lime" },
    { id: "outreach", title: "Outreach Agent", mark: "", color: "blue" },
    { id: "voxbridge", title: "VoxBridge", mark: "≋", color: "purple" },
    { id: "shtil", title: "Штиль", mark: "≈", color: "teal" },
    { id: "terminal", title: "Терминал", mark: ">_", color: "dark" },
    { id: "contact", title: "Контакты", mark: "@", color: "orange" },
  ];
