# Self-modifying agent for eve

An installable [eve](https://eve.dev) registry item for adding a governed self-modification loop to an existing eve agent. It follows the shadcn model: source is copied into the consuming project, users own that source, and later updates are opt-in.

This repository is the registry source and its development fixture. It is not an application template, clone-to-start project, npm initializer, or one-click Vercel deployment.

## Main agent features

- Durable Upstash AgentKit memory.
- Scoped GitHub tools and a Vercel MCP connection from official eve integrations.
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

Today, Eve installs their code, packages, and environment declarations transitively, but Eve 0.31.3 does not run official provider setup flows through a third-party parent item. Account login, Vercel team/project selection, and Telegram bot creation therefore remain explicit provider/eve steps after installation. We should remove that caveat only when Eve supports transitive third-party setup flows.

The raw GitHub URL becomes usable after these generated artifacts are merged to `main`. During registry development, use the local loop below.

## Enable GitHub tools

The core item installs the official GitHub tools extension, but credentials remain owned by the consuming project. Its default mount reads `GITHUB_TOKEN`; an empty declaration is intentional and does not grant repository access.

For local development, set `GITHUB_TOKEN` in the consumer's `.env.local` using a fine-grained GitHub token scoped only to the repositories and operations the agent needs. Do not paste the token into an agent prompt or commit it.

For a Vercel deployment, add the secret interactively to each environment that will run the agent, then redeploy:

```bash
cd /path/to/my-agent
npx vercel env add GITHUB_TOKEN development
npx vercel env add GITHUB_TOKEN preview
npx vercel env add GITHUB_TOKEN production
npx eve deploy
```

The token should have only the required repository permissions (typically repository metadata, contents, pull requests, and issues; add Actions/checks permissions only if those tools are used). Verify presence with `vercel env ls` or a setup diagnostic, never by printing the value.

If you want Vercel Connect-managed GitHub App credentials instead of a PAT, provision a GitHub connector through Vercel Connect and change the consuming project's `agent/extensions/github.ts` mount to `githubTools({ connector: "github/<connector-name>" })`. That connector setup is consumer-owned and is not guessed by this registry.

## Use the TUI with a deployed agent

The TUI can connect to a running Vercel deployment; it does not require a local checkout of that consumer:

```bash
npx eve dev https://your-agent.vercel.app
```

This sends sessions through the deployment's `/eve/v1/*` HTTP API. If the deployment is protected, use `/vc:login` inside the TUI when prompted. You can also provide a deployment-protection query parameter or the documented `VERCEL_AUTOMATION_BYPASS_SECRET` when appropriate. A remote TUI session is still subject to the deployed channel's auth policy; Eve's scaffolded `placeholderAuth()` permits setup diagnostics but is not browser authentication for production.

## Disposable verification fixtures

The test consumers created while developing this registry live outside the repository under `/tmp` and are not distribution artifacts:

- `/tmp/eve-web-init-check` — latest Web-enabled consumer; Web was initialized first and the core registry item was added afterward.
- `/tmp/eve-raw-consumer.wGBqWs/app` — headless raw-registry consumer used for the separate Vercel deployment test (`https://eve-raw-consumer.vercel.app`).
- `/tmp/eve-channel-split.TLf3cP/app` — earlier channel-split deployment fixture.

These directories are disposable and may disappear when `/tmp` is cleaned. The partially failed `/tmp/eve-web-optional-check` fixture is not a supported example. The repository itself is the registry source; consumers should always be recreated with the commands above.

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
