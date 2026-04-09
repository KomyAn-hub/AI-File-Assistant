# AI File Assistant

<div align="center">

**SortIT + RemindIT — Unified File Intelligence Agent for Microsoft Teams**

*Ideathon 2026 · Microsoft Teams Integration · Powered by Claude AI*

[![Deploy to GitHub Pages](https://github.com/KomyAn-hub/AI-File-Assistant/actions/workflows/deploy.yml/badge.svg)](https://github.com/KomyAn-hub/AI-File-Assistant/actions)

</div>

---

## English

### What it does

AI File Assistant is an intelligent agent that runs inside Microsoft Teams and solves a real enterprise pain: files end up in the wrong folders, and people waste hours searching for them.

It combines two capabilities:

| Module | Description |
|---|---|
| **SortIT** | Analyzes every file by name, content, and metadata — then suggests or automatically moves it to the correct SharePoint folder |
| **RemindIT** | Monitors documents a user is working on and sends a Teams notification if the file stays misplaced |

### Key features

- **Drag & Drop** — drop any file; FileReader extracts the name and first 500 characters for instant classification
- **Analyzing animation** — multi-step status labels ("Consulting Claude AI...", "Extracting metadata...") make the AI visible
- **Suggestion mode** — non-intrusive: shows a recommendation card, user decides
- **Auto-organize mode** — 3-second visual countdown with a Cancel button before the file moves
- **Folder tree** — SharePoint structure highlights the destination path on every classification
- **Teams Adaptive Card** — clicking "Remind me later" opens a mock Teams card (#6264A7) with Move Now / Dismiss
- **AI feedback loop** — thumbs up / thumbs down after a move simulates the self-learning cycle

### Security: API key is never in the browser

The Anthropic API key is stored in a **Cloudflare Worker** (server-side secret). The frontend calls `/api/classify` on the Worker — the key never appears in the JS bundle or DevTools. Without a proxy configured, the app falls back to the fast offline keyword classifier (fully functional for demo purposes).

```
Browser → POST /api/classify → Cloudflare Worker → Anthropic API
                                     ↑
                              Key lives here only
```

See [`proxy/README.md`](proxy/README.md) for the 3-minute deploy guide.

### Quick start (local)

```bash
git clone https://github.com/KomyAn-hub/AI-File-Assistant
cd AI-File-Assistant
npm install
cp .env.example .env
npm run dev   # → http://localhost:3000
```

The app works out of the box without any API key — the offline keyword classifier handles all 8 categories instantly.

### Enable Claude AI (optional)

1. Deploy the Cloudflare Worker (see `proxy/README.md`, ~3 min)
2. Set `VITE_PROXY_URL` in `.env` to your Worker URL
3. Restart `npm run dev`

### Deploy to GitHub Pages

Push to `main` → GitHub Actions builds and deploys automatically.

For AI classification on the deployed version, add one GitHub Secret:

```
Repo → Settings → Secrets and variables → Actions → New repository secret
Name:  VITE_PROXY_URL
Value: https://ai-file-assistant-proxy.YOUR_SUBDOMAIN.workers.dev/api/classify
```

### Architecture

```
Frontend (React 18 + TypeScript + Vite)
  └── src/App.tsx              All UI, drag-drop, state, modals
  └── src/lib/classifier.ts   classifyOffline() + classifyWithAI()
  └── src/lib/types.ts         TypeScript interfaces

Proxy (Cloudflare Worker)
  └── proxy/worker.js          Forwards /api/classify to Anthropic
  └── proxy/wrangler.toml      Deployment config

CI/CD
  └── .github/workflows/deploy.yml   GitHub Pages auto-deploy
```

### Classification categories

Legal · Marketing · Finance · Strategy · Reports · Sales · HR · Engineering · General

### Tech stack

React 18 · TypeScript · Vite · Cloudflare Workers · Anthropic Claude API · GitHub Actions · Microsoft Teams (simulated)

---

## Українська

### Що це таке

AI File Assistant — це інтелектуальний агент, що працює всередині Microsoft Teams і вирішує реальну проблему підприємств: файли потрапляють не в ті папки, і люди витрачають години на їх пошук.

Поєднує два модулі:

| Модуль | Опис |
|---|---|
| **SortIT** | Аналізує кожен файл за назвою, вмістом і метаданими — пропонує або автоматично переміщує в правильну папку SharePoint |
| **RemindIT** | Моніторить документи, з якими працює користувач, і надсилає сповіщення Teams, якщо файл лежить не там |

### Ключові функції

- **Drag & Drop** — перетягни будь-який файл; FileReader зчитує назву і перші 500 символів для класифікації
- **Анімація аналізу** — покрокові статуси ("Consulting Claude AI...", "Extracting metadata...") роблять роботу AI видимою
- **Suggestion mode** — ненав'язливий: показує картку з рекомендацією, ти вирішуєш
- **Auto-organize mode** — 3-секундний відлік із кнопкою Cancel перед переміщенням
- **Дерево папок** — структура SharePoint підсвічує шлях призначення при кожній класифікації
- **Teams Adaptive Card** — "Remind me later" відкриває мок-картку Teams (#6264A7) з кнопками Move Now / Dismiss
- **Зворотний зв'язок AI** — 👍/👎 після переміщення імітує цикл самонавчання

### Безпека: API ключ ніколи не потрапляє в браузер

Ключ Anthropic зберігається у **Cloudflare Worker** (серверний секрет). Фронтенд надсилає запит на `/api/classify` до Worker — ключ ніколи не з'являється в JS-бандлі або DevTools. Без налаштованого проксі застосунок автоматично використовує офлайн-класифікатор за ключовими словами (повністю функціональний для демо).

```
Браузер → POST /api/classify → Cloudflare Worker → Anthropic API
                                        ↑
                               Ключ знаходиться тільки тут
```

Дивись [`proxy/README.md`](proxy/README.md) для інструкції з деплою (~3 хвилини).

### Швидкий старт (локально)

```bash
git clone https://github.com/KomyAn-hub/AI-File-Assistant
cd AI-File-Assistant
npm install
cp .env.example .env
npm run dev   # → http://localhost:3000
```

Застосунок працює без API ключа — офлайн-класифікатор обробляє всі 8 категорій миттєво.

### Увімкнути Claude AI (опційно)

1. Задеплой Cloudflare Worker (дивись `proxy/README.md`, ~3 хв)
2. Встав URL Worker у `VITE_PROXY_URL` в `.env`
3. Перезапусти `npm run dev`

### Деплой на GitHub Pages

Пуш у `main` → GitHub Actions збирає і деплоїть автоматично.

Для AI-класифікації на задеплоєній версії додай один GitHub Secret:

```
Repo → Settings → Secrets and variables → Actions → New repository secret
Name:  VITE_PROXY_URL
Value: https://ai-file-assistant-proxy.YOUR_SUBDOMAIN.workers.dev/api/classify
```

### Структура проєкту

```
src/
├── App.tsx              Весь UI, drag-drop, стани, модалки
├── main.tsx             React entry point
└── lib/
    ├── classifier.ts    classifyOffline() + classifyWithAI() через проксі
    └── types.ts         TypeScript інтерфейси

proxy/
├── worker.js            Cloudflare Worker — проксі до Anthropic
├── wrangler.toml        Конфіг деплою
└── README.md            Інструкція деплою

.github/
└── workflows/
    └── deploy.yml       Авто-деплой на GitHub Pages
```

### Категорії класифікації

Legal · Marketing · Finance · Strategy · Reports · Sales · HR · Engineering · General

### Стек

React 18 · TypeScript · Vite · Cloudflare Workers · Anthropic Claude API · GitHub Actions · Microsoft Teams (симульовано)

---

## Live demo

`https://komyan-hub.github.io/AI-File-Assistant/`

## License

MIT
