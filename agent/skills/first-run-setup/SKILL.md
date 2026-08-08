---
description: Guide the cloner through first-run setup of their own Vercel, Upstash, Telegram, and model credentials via CLI/MCP—never paste secrets into chat.
---

# First-run setup (cloner-owned credentials)

Use when the repo was just cloned, `setup_status` reports gaps, or the owner asks how to deploy/configure.

## Principles

1. **The cloner owns all credentials.** This template ships no secrets.
2. Call `setup_status` first. Follow its `nextActions` in order.
3. **Never** ask the user to paste tokens, private keys, or webhook secrets into the chat. Direct them to `.env.local`, `vercel env add`, or an interactive CLI.
4. Prefer a coding agent with shell access and any available **MCP** (Vercel, GitHub) to run setup on their machine.

## Recommended flow

1. `setup_status`
2. Ensure Node 24 + `cp .env.example .env.local`
3. `npx vercel login` → `npx vercel link`
4. `npx vercel integration add upstash` → `npx vercel env pull .env.local`
5. Telegram: BotFather → write `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET_TOKEN`, `TELEGRAM_OWNER_USER_ID` into env (editor / `vercel env add`)
6. `npm run setup` then `npm run build:eve` / deploy (`npx vercel deploy --prod` or project dashboard)
7. Register webhook to `https://<deployment>/eve/v1/telegram` with the same secret
8. Owner messages the bot and tries memory + a small allowlisted self-mod

## After setup

Load `self-improvement` / `safety-policy` for apply-loop work. Use `set_dynamic_instructions` only for Level-2 overlay text that should apply without a rebuild; repo skill changes still go through the commit → preview → confirm path.
