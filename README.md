# Self-modifying agent template

User-owned [eve](https://eve.dev) agent you can chat with on **Telegram** (default), web chat, or the eve TUI. It remembers durable facts in **Upstash Redis**, and when you ask it to change itself it edits allowlisted files, commits to an `agent/*` branch, opens a **Vercel preview**, and promotes **production** only after you confirm.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run setup
npm run dev:eve
```

### Telegram

1. Create a bot with BotFather; set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET_TOKEN`, `TELEGRAM_OWNER_USER_ID`.
2. Deploy to Vercel, then:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://YOUR_DOMAIN/eve/v1/telegram","secret_token":"'"$TELEGRAM_WEBHOOK_SECRET_TOKEN"'","allowed_updates":["message","callback_query"]}'
```

### Memory + Vercel

Prefer linking Vercel and provisioning Upstash via the Vercel integration, then `vercel env pull`.

## Apply loop

```text
ask in chat → write allowlisted files → commit on agent/* → push + preview (approve)
  → confirm preview → promote production (approve)
```

**Allowlist:** `agent/skills/**`, `agent/instructions/**/*.md`, `config/**`.  
**Denied:** tools, lib, channels, instruction `.ts` modules, package manifests, CI.

See `agent.spec.json` for the versioned AgentSpec (identity, model, channels, memory retention, mutation policy).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run setup` | Env checks, typecheck, tests |
| `npm run dev:eve` | Local eve server + TUI |
| `npm run dev` | Next.js web chat |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit tests |
| `npm run build:eve` | eve production build |

## Docs / backlog

Product intent and phased plan live in `.backlog/`.
