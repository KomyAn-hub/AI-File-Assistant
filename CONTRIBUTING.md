# Contributing to AI File Assistant

## Local setup

```bash
git clone https://github.com/KomyAn-hub/AI-File-Assistant
cd AI-File-Assistant
npm install
cp .env.example .env
npm run dev   # → http://localhost:3000
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_PROXY_URL` | No | URL of the Cloudflare Worker proxy. Without it, the app uses the offline keyword classifier. **Never put an API key here.** |

The Anthropic API key lives in the Cloudflare Worker as a secret — not in `.env`, not in GitHub Secrets, not in the bundle.

## Enable Claude AI locally

1. Install Wrangler: `npm install -g wrangler`
2. `cd proxy && wrangler dev` — starts the proxy on `http://localhost:8787`
3. Set in `.env`: `VITE_PROXY_URL=http://localhost:8787/api/classify`
4. Set the key in the local Worker: `wrangler secret put ANTHROPIC_API_KEY`
5. Restart `npm run dev`

## Project structure

```
src/
├── App.tsx              Main component — UI, drag-drop, all state
├── main.tsx             React entry point
└── lib/
    ├── classifier.ts    classifyOffline() + classifyWithAI() via proxy
    └── types.ts         FileRecord, AppMode, ClassificationResult

proxy/
├── worker.js            Cloudflare Worker (server-side API proxy)
├── wrangler.toml        Worker config
└── README.md            Deploy instructions

.github/
└── workflows/
    └── deploy.yml       GitHub Pages CI/CD
```

## Feature overview

| Feature | File | Lines |
|---|---|---|
| Drag & Drop | App.tsx | ~228–266 |
| Analyzing animation | App.tsx | ~44–57 |
| Auto-mode countdown | App.tsx | ~59–82 |
| Folder tree highlight | App.tsx | ~84–129 |
| Teams Adaptive Card | App.tsx | ~133–226 |
| AI feedback loop | App.tsx | ~376–398 |
| Offline classifier | lib/classifier.ts | 21–44 |
| AI via proxy | lib/classifier.ts | 46–75 |

## Security rules (do not break these)

- Never add `ANTHROPIC_API_KEY` to `.env`, `deploy.yml`, or any frontend file
- `VITE_PROXY_URL` is the only frontend env var related to AI — it is a URL, not a secret
- The Worker validates `Origin` headers — only the GitHub Pages domain and localhost are allowed
- No real Microsoft Graph API calls — all SharePoint actions are simulated

## Deployment

Push to `main` → GitHub Actions builds and deploys to GitHub Pages automatically.

For the AI feature on the deployed version, add one GitHub Secret:
- Name: `VITE_PROXY_URL`
- Value: your deployed Cloudflare Worker URL

## Constraints (by design for Ideathon demo)

- No real backend — `useState` only, no FastAPI / Node.js / databases
- No real Microsoft Graph API — SharePoint actions are simulated with success messages
- Fixed 860px width — simulates the Teams tab window
