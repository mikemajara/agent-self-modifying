# Self-modifying agent template

User-owned [eve](https://eve.dev) agent template. **You** clone it, connect **your** GitHub / Vercel / Upstash / Telegram / model access, deploy, then chat. The agent remembers durable facts and, when you ask, can edit allowlisted files, commit to an `agent/*` branch, open a Vercel preview, and promote production after you confirm.

This repository does **not** ship credentials. Empty env placeholders only.

## Quick start (you own the accounts)

```bash
npm install
cp .env.example .env.local
npm run setup          # checks what's missing; does not create cloud resources for you
npm run dev:eve        # or ask a coding agent / MCP to walk setup
```

Preferred path: ask an AI coding agent (or MCP-backed tools) to complete setup against **your** logins:

1. `vercel login` → `vercel link`
2. Provision Upstash via Vercel integration → `vercel env pull`
3. Create a Telegram bot (BotFather) → set token, webhook secret, and your `TELEGRAM_OWNER_USER_ID`
4. Deploy → register Telegram webhook to `/eve/v1/telegram`
5. Chat and try a self-mod

### Telegram webhook (after deploy)

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://YOUR_DOMAIN/eve/v1/telegram","secret_token":"'"$TELEGRAM_WEBHOOK_SECRET_TOKEN"'","allowed_updates":["message","callback_query"]}'
```

## Apply loop

```text
ask in chat → write allowlisted files → commit on agent/* → push + preview (approve)
  → confirm preview → promote production (approve)
```

**Allowlist:** `agent/skills/**`, `agent/instructions/**/*.md`, `config/**`.  
**Denied:** tools, lib, channels, instruction `.ts` modules, package manifests, CI.

See `agent.spec.json` for the versioned AgentSpec (identity, model, channels, memory retention, mutation policy).

## Docs

- Product intent / plan: `.backlog/`
- Security: [`docs/THREAT-MODEL.md`](docs/THREAT-MODEL.md)
- Level-2 overlay: [`docs/DYNAMIC-INSTRUCTIONS.md`](docs/DYNAMIC-INSTRUCTIONS.md)

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run setup` | Env checks, typecheck, tests |
| `npm run setup:json` | Machine-readable setup diagnosis for agents/MCP |
| `npm run dev:eve` | Local eve server + TUI |
| `npm run dev` | Next.js web chat |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit tests |
| `npm run build:eve` | eve production build |
