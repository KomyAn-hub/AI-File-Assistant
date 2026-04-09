# Cloudflare Worker Proxy

Shields the Anthropic API key from the browser. The key lives here (server-side) — it never appears in the JS bundle or DevTools.

## Deploy (one time, ~3 min)

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Go to proxy directory
cd proxy

# 4. Set your Anthropic key as a secret (never committed to git)
wrangler secret put ANTHROPIC_API_KEY
# → paste your key when prompted

# 5. Deploy
wrangler deploy

# Output: https://ai-file-assistant-proxy.YOUR_SUBDOMAIN.workers.dev
```

## After deploy

Copy the Worker URL and set it in the frontend:

```bash
# .env (local)
VITE_PROXY_URL=https://ai-file-assistant-proxy.YOUR_SUBDOMAIN.workers.dev/api/classify

# GitHub Secrets (for Pages deploy)
# Repo → Settings → Secrets → Actions → New secret
# Name: VITE_PROXY_URL
# Value: https://ai-file-assistant-proxy.YOUR_SUBDOMAIN.workers.dev/api/classify
```

## Test

```bash
curl -X POST https://ai-file-assistant-proxy.YOUR_SUBDOMAIN.workers.dev/api/classify \
  -H "Content-Type: application/json" \
  -d '{"filename":"marketing_q2.docx","content":"campaign audience brand"}'
```

## Local dev

```bash
wrangler dev   # starts proxy on http://localhost:8787
# then set VITE_PROXY_URL=http://localhost:8787/api/classify in .env
```

## Security

- ANTHROPIC_API_KEY is a Cloudflare secret — not in code, not in git
- Worker validates origin (only your GitHub Pages domain + localhost)
- No API key = offline keyword classifier (fully functional for demo)
