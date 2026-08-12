# eve registry source

This project uses the eve framework. Before writing code, read the relevant guide
from the installed eve package docs at `node_modules/eve/docs/` (or https://eve.dev/docs).

## Product boundary

This repository is a GitHub-hosted eve registry, not an application template. The
core `self-modifying-agent` item adds durable memory, GitHub/Vercel capabilities,
and governed self-modification policy to an existing eve project. Web, Telegram,
and Slack are optional channel items.

The governed loop is: owner request → allowlisted file edit → `agent/*` commit →
checks and Vercel preview → explicit owner confirmation → production.

See `README.md`, `docs/DISTRIBUTION-AND-UPDATES.md`, and `.backlog/` for policy,
installation, remote TUI use, update behavior, and the current plan.

## Consumer setup

For a Web-enabled consumer, initialize Web first and then install the raw registry
item:

```bash
npx eve init my-agent --channel-web-nextjs
cd my-agent
npx eve add https://raw.githubusercontent.com/mikemajara/agent-self-modifying/main/public/r/self-modifying-agent.json
```

For a headless consumer, use `npx eve init my-agent` instead. Add the official Web
item directly to an existing project with `npx eve add channel/web`; if its package
manager reports a dependency conflict, use the Web-enabled init path above.

To use the terminal UI against a deployed agent rather than starting a local one:

```bash
npx eve dev https://your-agent.vercel.app
```

The remote session calls the deployment's `/eve/v1/*` API. If Vercel Deployment
Protection or OIDC requires credentials, use `/vc:login` from the TUI. A deployed
browser needs an application auth policy; the scaffolded `placeholderAuth()` is
not production browser authentication.

The current reproducible verification baseline is Eve `0.31.3`; check the installed
Eve changelog before upgrading because official extension hook contracts can change.

The GitHub extension supports Vercel Connect but does not assume a connector exists.
From the linked consumer, choose the Vercel team/project and run
`vercel connect create github --name <connector-name>` followed by
`vercel connect attach github/<connector-name> --yes`, complete the browser
authorization, set `GITHUB_CONNECTOR=github/<connector-name>` in `.env.local` and the
Vercel environment, and redeploy. Do not fall back to asking users for tokens unless
they explicitly choose a static-token mount.

Before implementing an integration yourself, use `eve registry search <query>` /
`eve add <item>`.
