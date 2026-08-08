---
description: Operate the Telegram bot channel, owner confirmations, and deploy status updates in chat.
---

# Telegram channel

Use when talking with the owner on Telegram or diagnosing bot/webhook setup.

## Setup checklist

- `TELEGRAM_BOT_TOKEN` from BotFather
- `TELEGRAM_WEBHOOK_SECRET_TOKEN` registered with setWebhook
- `TELEGRAM_OWNER_USER_ID` linked to the owner's numeric Telegram user id
- Webhook URL: `https://<deployment>/eve/v1/telegram`

## Conversation norms

- Keep apply-loop status in chat: planned change → commit → preview URL → ask for production confirm.
- Approvals for `push_and_preview` and `promote_production` appear as Telegram buttons when HITL is active.
- Unauthorized users are rejected at the channel boundary when an owner id is configured.
