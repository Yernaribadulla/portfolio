# Yernar Ibadulla | AI Integration and Backend Engineer

I build AI-powered backend systems, multimodal applications and business automations that connect LLMs with real APIs, user workflows and operational data.

My strongest area is reliable AI integration: structured outputs, validation, fallback handling, local models, browser automation and human-controlled actions.

## Featured Projects

| Project | What it demonstrates | Stack |
| --- | --- | --- |
| [AI-Hunter](https://github.com/Yernaribadulla/AI-Hunter) | Local-first vacancy analysis and supervised application workflow | Python, Playwright, Pydantic, LM Studio |
| [Outreach Agent](https://github.com/Yernaribadulla/outreach-agent) | Evidence-first B2B discovery, website research and lead qualification | Python, SQLite, OpenStreetMap, local LLM |
| [VoxBridge](https://github.com/Yernaribadulla/voxbridge) | Real-time local voice translation for Windows | Python, faster-whisper, PySide6, LM Studio |

### Project Previews

AI-Hunter vacancy collection and supervised application workflow:

![AI-Hunter vacancy collection and supervised application workflow](assets/screenshots/ai-hunter-workflow.png)

Outreach Agent dashboard with researched leads, source data and AI analysis results:

![Outreach Agent dashboard showing researched leads](assets/screenshots/outreach-agent-dashboard.png)

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

AI-Hunter is a local-first HeadHunter vacancy discovery and supervised application assistant. It collects vacancies with Playwright, analyzes them through a local LLM, validates structured results and applies deterministic safety rules before any final application action.

The workflow is: vacancy collection, normalization, deduplication, local LLM analysis, Pydantic validation, safety decision, cover-letter validation and human-confirmed browser submission. It supports persistent JSONL state, Russian and English cover letters and duplicate protection. It does not bypass CAPTCHA or anti-bot protection.

The repository includes tests, safety documentation and setup instructions. A full run requires Windows, a configured browser session and a compatible local model through LM Studio.

Technologies: Python, Playwright, Pydantic, LM Studio, Qwen, JSONL and PySide6.

### GitHub

https://github.com/Yernaribadulla/AI-Hunter

## Outreach Agent

Outreach Agent is a local-first sales intelligence platform for company discovery, website research, qualification and personalized outreach preparation.

Its pipeline combines discovery, entity resolution, website auditing, source provenance, local LLM analysis, lead qualification and human-reviewed outreach drafts. It distinguishes CONFIRMED, INFERRED, UNKNOWN and NOT_DETECTED states, prevents duplicate recipients and keeps real sending disabled by default.

The MVP focuses on reliable research and preparation. It is intentionally conservative when information is missing and does not present inferred facts as confirmed data.

Technologies: Python, SQLite, OpenStreetMap, Nominatim, Overpass, LM Studio, HTML, CSS, JavaScript and Git.

### GitHub

https://github.com/Yernaribadulla/outreach-agent

## VoxBridge

VoxBridge is a Windows desktop voice translator for gaming, calls and bilingual conversations. It captures system audio, recognizes English speech locally, translates it into Russian and displays the result in an always-on-top overlay. Mouse 5 switches priority to microphone input and translates Russian speech into English.

The application combines WASAPI and SoundCard capture, energy-based segmentation, faster-whisper recognition, a route-priority state machine, local LM Studio translation and a PySide6 overlay. Audio and transcripts are not saved or uploaded by the application.

The project requires Windows, compatible audio devices and local speech-recognition and translation models. Actual latency depends on the selected models and hardware.

Technologies: Python, PySide6, SoundCard, WASAPI, faster-whisper, CTranslate2, LM Studio, OpenAI-compatible APIs and Windows desktop integration.

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

ITSM process automation during my tenure at KCOI. I designed the incident classification and routing logic, contributed to the knowledge base and release checklists, and automated reporting and operational workflows. Internal operational tracking showed approximately 15–20 minutes for initial routing, around 30% fewer repeated requests and SLA compliance above 95% during the measured period. These results describe the workflows I helped implement, not a claim that I independently delivered the entire ITSM platform.

QR-based customer feedback and analytics systems with Google Sheets, employee-level attribution and external-platform conversion tracking.

## Open to Collaboration

I am interested in remote or freelance work involving Python backend development, AI integrations, local LLM applications, workflow automation, API integrations and internal business tools.

## Engineering Evidence

The individual repositories contain the implementation details, setup instructions, tests, safety notes and known limitations for each project. The portfolio README intentionally stays concise; architecture diagrams, configuration examples and failure-handling details belong in the relevant project documentation.

When evaluating these projects, the most relevant evidence includes structured validation, deterministic safety rules, duplicate protection, provenance tracking, persistent state, supervised actions and explicit handling of malformed or unavailable data.

## Other Projects

DENTARA dental clinic experience: https://yernaribadulla.github.io/Dentist_rus_commercial/

Shtil Cafe QR feedback and analytics platform: https://github.com/Yernaribadulla/AdminFeedback

## Contact

Email: yernaribadulla@gmail.com

LinkedIn: https://www.linkedin.com/in/%D0%B5%D1%80%D0%BD%D0%B0%D1%80-%D0%B8%D0%B1%D0%B0%D0%B4%D1%83%D0%BB%D0%BB%D0%B0-a66050420/
