# Self-modifying agent for eve

An installable [eve](https://eve.dev) registry item for adding a governed self-modification loop to an existing eve agent. It follows the shadcn model: source is copied into the consuming project, users own that source, and later updates are opt-in.

This repository is the registry source and its development fixture. It is not an application template, clone-to-start project, npm initializer, or one-click Vercel deployment.

## Main agent features

- Durable Upstash AgentKit memory.
- Scoped GitHub tools and a Vercel MCP connection from official eve integrations.
- Machine-enforced repository, branch, and mutable-path boundaries for GitHub writes.
- A governed `agent/*` branch → checks → preview → owner-confirmed production workflow.
- Explicit safety instructions for mutation boundaries, secrets, approvals, and rollback.
- Copy-owned source: local customization is preserved unless the user deliberately requests overwrite.
- Optional surfaces: Eve Web, Telegram, Slack, and future channels are installed separately from the core capability.

## Install

Start with a normal eve project, then add the built registry item:

```bash
npx eve init my-agent
cd my-agent
npx eve add https://raw.githubusercontent.com/mikemajara/agent-self-modifying/main/public/r/self-modifying-agent.json
```

The core item composes Upstash AgentKit, GitHub Tools, and the Vercel connection, then adds this project's self-modification policy files. It intentionally does not install a UI or an external chat channel.

Eve 0.31.3 installs third-party item code, packages, and environment declarations transitively, but only official `eve.dev` items may launch trusted setup metadata directly from `eve add`. This item therefore prints one explicit next command after installation:

```bash
node scripts/setup-self-modifying-agent.mjs
```

That local, user-owned script resumes Eve's official Vercel connection setup, launches GitHub Connect authorization, asks for the repository scope, accepts Upstash credentials through the terminal rather than agent chat, and synchronizes configuration to `.env.local` and the linked Vercel project. It does not guess an account, team, project, connector, or repository.

The raw GitHub URL becomes usable after these generated artifacts are merged to `main`. During registry development, use the local loop below.

## Complete onboarding

Run the installed setup command from the consuming project:

```bash
node scripts/setup-self-modifying-agent.mjs
```

The script is idempotent at the configuration layer: rerunning it uses existing local values where possible and resumes the official connection flow. Check without changing anything with:

```bash
node scripts/setup-self-modifying-agent.mjs --status
```

Vercel Connect stores provider authorization and mints short-lived tokens at runtime. No `GITHUB_TOKEN` is needed. GitHub writes are denied in code unless they target the configured `GITHUB_REPOSITORY`, an `agent/*` branch, and an allowed behavior file. Governance-owned instructions and skills remain protected even though they are Markdown.

The installed dynamic setup instruction runs once at `session.started`. An incomplete session proactively reports the missing capabilities and points to the one setup command. A complete session suppresses repeated onboarding. It is an always-on instruction, not a skill the model must remember to load.

After setup, start Eve locally and configure model access through the built-in `/model` flow if it is still missing:

```bash
npx eve dev
```

When the local agent is ready, deploy the consuming project—not this registry—with:

```bash
npx eve deploy
```

## Use the TUI with a deployed agent

The TUI can connect to a running Vercel deployment; it does not require a local checkout of that consumer:

```bash
npx eve dev https://your-agent.vercel.app
```

This sends sessions through the deployment's `/eve/v1/*` HTTP API. If the deployment is protected, use `/vc:login` inside the TUI when prompted. You can also provide a deployment-protection query parameter or the documented `VERCEL_AUTOMATION_BYPASS_SECRET` when appropriate. A remote TUI session is still subject to the deployed channel's auth policy; Eve's scaffolded `placeholderAuth()` permits setup diagnostics but is not browser authentication for production.

## Disposable verification fixtures

Clean-install consumers are created under `/tmp/eve-selfmod-consumer.*` during development and CI. They are disposable and are not distribution artifacts. A persistent end-to-end dogfood agent must be a separate Eve-initialized GitHub repository with its own Vercel project and connectors; this registry repository is never that consumer.

## Optional channels

For a new project, add Eve's official Next.js web UI during initialization:

```bash
npx eve init my-agent --channel-web-nextjs
cd my-agent
npx eve add https://raw.githubusercontent.com/mikemajara/agent-self-modifying/main/public/r/self-modifying-agent.json
```

For an existing plain Eve project, use Eve's official Web item directly:

```bash
npx eve add channel/web
```

The direct Web add runs Eve's channel setup, adds the `app/` UI and `withEve` integration, and configures the Next.js `dev` and `build` scripts. Installing only the self-modifying item intentionally leaves the plain Eve API/TUI surface in place. If your Eve/package-manager version reports a dependency conflict while adding Web, use the fresh-project init command above; it installs Web and the self-modifying capability in a known-good order.

Telegram is deliberately not bundled with the core agent. Install the owner-gated Telegram item only when Telegram is wanted:

```bash
npx eve add https://raw.githubusercontent.com/mikemajara/agent-self-modifying/main/public/r/channel-telegram-owner.json
```

Slack users should install Eve's Slack channel instead. A channel is an edge adapter, not part of the self-modification capability.

The Telegram item is also the future home of webhook and BotFather command lifecycle helpers (`tg:webhook-set`, `tg:webhook-get`, `tg:commands-set`, and related commands). The shadcn registry schema cannot safely merge npm scripts into an existing `package.json`, so those aliases should ultimately come from a small CLI package referenced by the channel item. The channel itself remains registry-installed source because Eve extensions cannot contribute channels.

## Shared memory across surfaces

Mounting one Upstash AgentKit extension does **not** automatically make Telegram, Slack, web, and the TUI the same user. AgentKit defaults its memory `userId` to Eve's authenticated `principalId`. Each channel intentionally issues a different principal, such as `telegram:<id>` or `slack:<workspace>:<id>`, while web and local development use their own identities.

For a single-owner agent, every channel must first authenticate the owner and then map that channel identity to one stable internal owner id. The AgentKit mount should derive `userId` from that verified canonical identity. Missing mappings must fail closed rather than falling back to a channel id or sharing all callers under a constant key.

This gives one owner shared long-term memory and searchable history across separate channel sessions, while conversation state itself remains channel/session-specific. A later multi-user product needs an explicit identity-link table—not a global constant and not a model-supplied user id.

## Update and ownership contract

Running the same `eve add` command again does not silently replace installed files. Eve reports existing files as skipped, including locally modified files. Users can:

- keep their installed source forever;
- inspect a new registry release and port selected changes; or
- rerun with `--overwrite` after reviewing the replacement.

Package-backed upstream capabilities update through the consuming project's dependency lockfile. Copied policy and adapter source updates only when the user chooses. See [Distribution and updates](docs/DISTRIBUTION-AND-UPDATES.md).

## Develop without publishing

```bash
npx shadcn@latest registry validate ./registry.json
npx shadcn@latest build registry.json --output public/r
python3 -m http.server 8765 --bind 127.0.0.1 --directory public/r
```

In another terminal, from a clean eve project:

```bash
npx eve add http://127.0.0.1:8765/self-modifying-agent.json --yes
npm run typecheck # or pnpm typecheck, matching the project
```

Re-run the add command after making a local edit to an installed file to verify that Eve preserves user-owned code. Use `--overwrite` only in a disposable fixture when testing replacement behavior.

## Registry layout

- `registry.json` — source registry manifest and upstream composition.
- `registry/self-modifying-agent/` — core source owned by this integration.
- `registry/channel-telegram-owner/` — optional Telegram channel source.
- `public/r/` — generated, publishable registry JSON.
- `agent/` and the application files — internal reference fixture while capabilities are extracted; they are not the distribution mechanism.
- `.backlog/prds/PRD-eve-agent-registry.md` — canonical product decision and acceptance criteria.

## Checks

```bash
npm run registry:validate
npm run registry:build
npm run typecheck
npm test
```

GitHub Actions also runs Gitleaks against full Git history. This registry ships empty environment-variable declarations only; never commit credentials.

## Security

Installation does not grant arbitrary credentials or authorize production deployment. Each consumer owns its accounts, environment variables, repository permissions, and deployment targets. Repository mutation must remain scoped and production promotion remains owner-confirmed.

See [Threat model](docs/THREAT-MODEL.md) and [Dynamic instructions](docs/DYNAMIC-INSTRUCTIONS.md).
