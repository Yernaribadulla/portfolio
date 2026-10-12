# Yernar Ibadulla | AI Integration and Backend Portfolio

I build AI-powered backend systems, multimodal applications and business automations that connect local and hosted LLMs with real operational workflows.

## AI Integration and Backend Development

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

### GitHub

https://github.com/Yernaribadulla/voxbridge

## ComfyUI and Visual AI Workflows

I also work with ComfyUI for local image generation, image processing and visual experimentation. I use node-based workflows to test models, conditioning, upscaling and image pipeline variations alongside software projects.

### Selected visual work

![ComfyUI visual experiment](assets/Sparkle_00002_.png)

## Other Projects

DENTARA dental clinic experience: https://yernaribadulla.github.io/Dentist_rus_commercial/

Shtil Cafe QR feedback and analytics platform: https://github.com/Yernaribadulla/AdminFeedback

## Contact

Email: yernaribadulla@gmail.com

LinkedIn: https://www.linkedin.com/in/%D0%B5%D1%80%D0%BD%D0%B0%D1%80-%D0%B8%D0%B1%D0%B0%D0%B4%D1%83%D0%BB%D0%BB%D0%B0-a66050420/
