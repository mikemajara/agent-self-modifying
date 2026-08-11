# Self-modifying agent template

User-owned [eve](https://eve.dev) agent template. **You** clone it, connect **your** GitHub / Vercel / Upstash / Telegram / model access, deploy, then chat. The agent remembers durable facts and, when you ask, can edit allowlisted files, commit to an `agent/*` branch, open a Vercel preview, and promote production after you confirm.

This repository does **not** ship credentials. Empty env placeholders only.

## Main bot features

- Chat through a user-owned Telegram bot, the included web UI, or the eve terminal UI.
- Remember, list, update, and forget durable facts stored in Upstash Redis.
- Keep memory isolated by tenant and user, with retention limits and provenance.
- Update a dynamic instruction overlay for reversible behavior changes without a rebuild.
- Modify allowlisted skills, Markdown instructions, and configuration files on request.
- Commit repository changes to isolated `agent/*` branches instead of protected `main`.
- Run checks and create a Vercel preview before presenting a production confirmation.
- Require the linked Telegram owner to approve production promotion.
- Reject mutation and deployment requests from unauthorized Telegram users.
- Keep credentials in the trusted runtime rather than exposing them to the model.

## Deploy your copy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmikemajara%2Fagent-self-modifying&project-name=self-modifying-agent&repository-name=self-modifying-agent)

The button creates a repository in your Git provider and imports it as a Vercel project. It deploys the application shell, but it cannot create your Telegram bot or safely supply your account credentials. Complete the post-deployment setup below before treating the agent as ready.

You can also use GitHub's **Use this template** button or clone the repository manually:

For a fresh local project, run the initializer directly from GitHub (inspect the [script](scripts/create-agent.sh) first if desired):

```bash
curl -fsSL https://raw.githubusercontent.com/mikemajara/agent-self-modifying/main/scripts/create-agent.sh \
  | bash -s -- my-agent
```

Pin a tag or branch with `--ref <git-ref>`, or skip dependency installation with `--skip-install`. This route does not require publishing anything to npm.

Alternatively, clone the repository manually:

```bash
git clone https://github.com/mikemajara/agent-self-modifying.git
cd agent-self-modifying
npm install
cp .env.example .env.local
npm run setup
```

In a terminal, `npm run setup` is an interactive and resumable wizard. It can launch the official Vercel login/link and Upstash provisioning prompts, collect the Telegram bot configuration with hidden token entry, generate the webhook secret, and optionally sync Telegram values to the linked Vercel project. Use `npm run setup:check` when you only want diagnostics.

## Post-deployment setup

The cloner owns and pays for every connected account. Do not paste tokens into agent chat; enter them in Vercel's encrypted environment-variable settings or your local `.env.local`.

1. In the new Vercel project, add an Upstash Redis integration and connect it to the project. Confirm that `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are available to Production and Preview.
2. Create a bot with Telegram's [@BotFather](https://t.me/BotFather). Add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET_TOKEN`, and your numeric `TELEGRAM_OWNER_USER_ID` to the Vercel project.
3. Confirm the project can use Vercel AI Gateway through Vercel OIDC. Override `AGENT_MODEL` only if you want a model other than the AgentSpec default.
4. Redeploy after adding the environment variables.
5. Register the Telegram webhook against the production deployment as shown below.
6. Clone your generated repository locally, run `vercel link`, then `vercel env pull .env.local` and `npm run setup`. Configure narrowly scoped GitHub/deployment credentials before enabling the repository self-apply tools.

For a local-first setup, ask an AI coding agent (or MCP-backed tools) to complete the same setup against **your** logins:

1. `vercel login` → `vercel link`
2. Provision Upstash via Vercel integration → `vercel env pull`
3. Create a Telegram bot (BotFather) → set token, webhook secret, and your `TELEGRAM_OWNER_USER_ID`
4. Deploy → register Telegram webhook to `/eve/v1/telegram`
5. Chat and try a self-mod

Run locally with `npm run dev:eve` for the eve server and terminal UI, or `npm run dev` for the Next.js web chat.

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

The initial Deploy Button does not grant the deployed model arbitrary GitHub or Vercel credentials. Repository mutation and promotion require separately configured, least-privilege capabilities; production remains owner-confirmed.

See `agent.spec.json` for the versioned AgentSpec (identity, model, channels, memory retention, mutation policy).

## Docs

- Product intent / plan: `.backlog/`
- Security: [`docs/THREAT-MODEL.md`](docs/THREAT-MODEL.md)
- Level-2 overlay: [`docs/DYNAMIC-INSTRUCTIONS.md`](docs/DYNAMIC-INSTRUCTIONS.md)
- Distribution, ownership, and updates: [`docs/DISTRIBUTION-AND-UPDATES.md`](docs/DISTRIBUTION-AND-UPDATES.md)

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run setup` | Resumable interactive Vercel, Upstash, and Telegram setup wizard |
| `npm run setup:check` | Non-interactive env checks, typecheck, and tests |
| `npm run setup:json` | Machine-readable setup diagnosis for agents/MCP |
| `npm run dev:eve` | Local eve server + TUI |
| `npm run dev` | Next.js web chat |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit tests |
| `npm run build:eve` | eve production build |

## Security checks

GitHub Actions runs Gitleaks against full Git history on pushes to `main` and on every pull request. Run a local full-history scan before publishing changes that may contain credentials:

```bash
docker run --rm -v "$PWD:/repo:ro" zricethezav/gitleaks:v8.30.1 git /repo --verbose
```
