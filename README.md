# Yernar Ibadulla | AI Integration and Backend Engineer

I build AI-powered backend systems, multimodal applications and business automations that connect LLMs with real APIs, user workflows and operational data.

My strongest area is reliable AI integration: structured outputs, validation, fallback handling, local models, browser automation and human-controlled actions.

## Featured Projects

| Project | What it demonstrates | Stack |
| --- | --- | --- |
| [AI-Hunter](https://github.com/Yernaribadulla/AI-Hunter) | Local-first vacancy analysis and supervised application workflow | Python, Playwright, Pydantic, LM Studio |
| [Outreach Agent](https://github.com/Yernaribadulla/outreach-agent) | Evidence-first B2B discovery, website research and lead qualification | Python, SQLite, OpenStreetMap, local LLM |
| [VoxBridge](https://github.com/Yernaribadulla/voxbridge) | Real-time local voice translation for Windows | Python, faster-whisper, PySide6, LM Studio |

## Engineering Focus

Python backend development, FastAPI, REST APIs, webhooks, LLM integration, Function Calling, local-first AI, browser automation, CRM and calendar integrations, workflow automation and desktop applications.

## How I Build AI Systems

### Problem

Businesses need AI features that work with real APIs, user sessions, databases, calendars, CRMs and existing operational processes.

### Solution

I design and implement reliable Python backends, LLM workflows and automation systems with structured outputs, validation, error handling, fallback scenarios and human review where needed.

### Architecture

Typical solutions combine a Python or FastAPI backend, an OpenAI-compatible LLM interface, structured validation with Pydantic, REST APIs, webhooks, browser automation, external services and a frontend connected through stable contracts.

### Technologies

Python, FastAPI, REST APIs, webhooks, Pydantic, SQLite, PostgreSQL, React, TypeScript, JavaScript, Playwright, LM Studio, Qwen, Function Calling, n8n, Make, amoCRM API, Google Calendar API, Robokassa, OpenStreetMap, Nominatim and Overpass.

### Result

The systems I build reduce repetitive manual work, connect fragmented business processes and make AI features safer to operate in real workflows.

## Engineering Principles

I treat an LLM as one component of a software system, not as the source of truth. Important decisions are supported by schemas, deterministic rules, provenance, deduplication, retries, explicit states and human review.

The projects below are portfolio and prototype work at different levels of maturity. Their READMEs describe current functionality, setup requirements and known limitations rather than presenting unfinished features as production capabilities.

## AI-Hunter

### Problem

Job search requires repeated vacancy discovery, requirement matching, cover-letter writing and application tracking.

### Solution

AI-Hunter is a local-first HeadHunter vacancy discovery and supervised application assistant. It collects vacancies with Playwright, analyzes them through a local LLM, validates structured results and applies deterministic safety rules before any final application action.

### Architecture

Discovery queries → Playwright collection → normalization and deduplication → local LLM analysis → Pydantic validation → deterministic safety decision → cover-letter validation → supervised application workflow → persistent JSONL state.

### Technologies

Python, Playwright, Pydantic, LM Studio, Qwen, JSONL, PySide6 and browser automation.

### Result

The system supports local analysis, role scoring, Russian and English cover letters, duplicate protection, persistent state and confirmation-first applications. It does not bypass CAPTCHA or anti-bot protection.

### Evidence and limitations

The repository includes tests, safety documentation and a reproducible local workflow. Running the full application requires Windows, a configured browser session and a compatible local LLM through LM Studio.

### GitHub

https://github.com/Yernaribadulla/AI-Hunter

## Outreach Agent

### Problem

B2B outreach requires finding relevant businesses, researching their digital presence, identifying useful opportunities and writing messages based on evidence.

### Solution

Outreach Agent is a local-first sales intelligence platform for company discovery, website research, qualification and personalized outreach preparation.

### Architecture

Discovery → entity resolution → website audit → evidence and provenance → local LLM analysis → qualification → outreach draft → human review.

### Technologies

Python, SQLite, OpenStreetMap, Nominatim, Overpass, LM Studio, local LLMs, HTML, CSS, JavaScript and Git.

### Result

The platform preserves source provenance, distinguishes CONFIRMED, INFERRED, UNKNOWN and NOT_DETECTED states, prevents duplicate recipients and keeps real sending disabled by default until human review.

### Evidence and limitations

The MVP focuses on reliable research and outreach preparation. It is intentionally conservative when information is missing and does not claim that an inferred fact is confirmed.

### GitHub

https://github.com/Yernaribadulla/outreach-agent

## VoxBridge

### Problem

Gamers and bilingual users need fast two-way voice translation during live conversations without sending audio to a remote service.

### Solution

VoxBridge is a Windows desktop voice translator that captures speaker loopback, recognizes English speech, translates it to Russian and displays both languages in an always-on-top overlay. Holding Mouse 5 switches the route to microphone input and translates Russian speech to English.

### Architecture

WASAPI and SoundCard capture → energy-based segmentation → multilingual faster-whisper → route-priority state machine → local LM Studio translation → Qt overlay and push-to-talk controls.

### Technologies

Python, PySide6, SoundCard, WASAPI, faster-whisper, CTranslate2, LM Studio, OpenAI-compatible APIs, global hotkeys and Windows desktop integration.

### Result

VoxBridge provides local audio processing, shared multilingual speech recognition, Mouse 5 route priority, stale-result rejection, an always-on-top overlay and explicit controls for pause, visibility and settings. Audio and transcripts are not saved or uploaded by the application.

### Evidence and limitations

The project is designed for Windows and depends on compatible audio devices, local speech-recognition models and sufficient CPU/GPU resources. Translation latency and recognition quality depend on the selected model and hardware.

### GitHub

https://github.com/Yernaribadulla/voxbridge

## ComfyUI and Visual AI Workflows

I also work with ComfyUI for local image generation, image processing and visual experimentation. I use node-based workflows to test models, conditioning, upscaling and image pipeline variations alongside software projects.

### Selected visual work

![ComfyUI visual experiment](assets/Sparkle_00002_.png)

## Selected Delivery Experience

In addition to portfolio projects, I have built and maintained AI and automation systems for real workflows, including:

Python and FastAPI multimodal applications with local Qwen models and React/TypeScript frontends.

AI assistants connected to amoCRM, Google Calendar, payment systems and automation platforms such as Make, n8n and NextBot.

ITSM process automation that reduced initial incident response time to 15–20 minutes, reduced repeated requests by 30% and improved SLA compliance to more than 95%.

QR-based customer feedback and analytics systems with Google Sheets, employee-level attribution and external-platform conversion tracking.

## Open to Collaboration

I am interested in remote or freelance work involving Python backend development, AI integrations, local LLM applications, workflow automation, API integrations and internal business tools.

## Other Projects

DENTARA dental clinic experience: https://yernaribadulla.github.io/Dentist_rus_commercial/

Shtil Cafe QR feedback and analytics platform: https://github.com/Yernaribadulla/AdminFeedback

## Contact

Email: yernaribadulla@gmail.com

LinkedIn: https://www.linkedin.com/in/%D0%B5%D1%80%D0%BD%D0%B0%D1%80-%D0%B8%D0%B1%D0%B0%D0%B4%D1%83%D0%BB%D0%BB%D0%B0-a66050420/
