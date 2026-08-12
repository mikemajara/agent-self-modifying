# Distribution and updates

## Decision

Distribute this capability as an eve registry item. Do not distribute it as a GitHub template, Deploy Button, curl-to-bash initializer, `npx create` package, or cloned starter.

The user begins with an ordinary eve project and adds this integration with `eve add`. The core item composes official eve capabilities and copies the governed self-modification source into the user's repository. UI and external channels are separate items so a user can choose Eve Web, Telegram, Slack, or no additional surface.

## Why this boundary

An independent template has no durable upstream relationship. Every generated repository immediately becomes a fork that needs bespoke migrations. A monolithic runtime extension has the opposite problem: it hides behavior that users should be able to inspect and customize.

The registry splits ownership by change type:

| Layer | Owner | Update path |
| --- | --- | --- |
| eve runtime and official integrations | eve/package publisher | dependency update through the consumer's lockfile |
| Channel adapters, skills, and policy | consuming user after installation | rerun the relevant `eve add`, review, then optionally overwrite or port changes |
| Accounts, secrets, deployment, and app-specific configuration | consuming user | explicit local/provider action |
| Registry manifest and released defaults | this repository | reviewed registry release |

This is the shadcn-style “copy, inspect, and own” contract. No installed source changes underneath a user.

## Installation behavior verified locally

Eve 0.31.3 accepts third-party registry items by HTTP(S) URL. For unpublished development, build `public/r` and serve it on localhost; plain filesystem paths are currently interpreted as official-registry item names.

A clean-install smoke test confirmed that the item:

- resolves the official Upstash AgentKit and Vercel dependencies, plus the official GitHub Tools package;
- creates the custom Telegram, instruction, and skill files;
- declares the expected environment variables; and
- passes TypeScript checking in a clean eve project.

Reinstalling without `--overwrite` skipped existing files and preserved an intentional local edit. This is the default update behavior we want.

Eve 0.31.3 does not execute official dependency setup flows transitively when they are referenced by a third-party parent item. The registry therefore installs environment declarations and integration source, while provider authorization and team/project selection remain explicit follow-up steps. We must not recreate those flows in a custom installer.

The GitHub tools mount is Connect-backed by default. Consumers create and attach the
connector with `vercel connect create github --name self-modifying-agent` and
`vercel connect attach github/self-modifying-agent --yes`; Vercel owns the GitHub App
credentials and issues short-lived runtime tokens. A static `GITHUB_TOKEN` is only an
explicit fallback, not the default setup path.

## Update policy

Every release should include generated registry JSON and a concise change classification:

- **Package-only:** update upstream package versions through the consuming package manager.
- **Copied-source update:** rerun `eve add`, inspect the released source/diff, and decide whether to port or overwrite.
- **Configuration migration:** document the environment or mount change; never infer account or team selection.
- **Data migration:** back up, preview, run idempotently, and record completion before production.
- **Security release:** state affected files and safe manual remediation for locally diverged installations.

The registry must not silently overwrite files, merge identities, choose a GitHub/Vercel team, alter protected branches, or promote production.

The Web UI is intentionally not a transitive dependency of the core item. Add Eve's official Web item directly (or initialize with `eve init --channel-web-nextjs`) so Eve runs its setup flow and patches the consuming project's Next.js scripts.

The Eve TUI can operate against a deployed consumer without a local agent runtime:

```bash
eve dev https://your-agent.vercel.app
```

This is a remote client for the deployment's `/eve/v1/*` routes. Vercel OIDC or Deployment Protection may require `/vc:login`; browser clients need a separate production auth policy. Do not confuse this with `eve dev` run without a URL, which starts a local server and local TUI.

## Shared identity and memory

Shared memory across Telegram and web requires a stable authenticated principal that maps both interfaces to one owner. Storage and identity primitives belong in a maintained extension; channel-specific authentication adapters remain inspectable registry-installed source.

Upstash AgentKit defaults `userId` to `auth.current.principalId`, then the initiator principal, then the Eve session id. Default Telegram, Slack, web, and TUI principals therefore produce separate memory namespaces. Sharing one Redis database or one extension mount is not sufficient.

For the single-owner case, each channel adapter must authenticate its external user and project it to a canonical internal owner identity. The memory resolver consumes only that verified identity and fails closed when it is absent. Long-term memories and searchable chat history may then span surfaces, while live session history stays separate. Never set one global memory id while allowing untrusted callers onto any channel: that would expose the owner's memory to them.

An adoption flow should therefore be: update the extension, install/review the adapter change, configure identity linking, run an idempotent migration and evals, inspect a preview, then explicitly promote. Two identities or memory namespaces must never be silently merged.

## Development and release

1. Edit `registry.json` and `registry/self-modifying-agent/**`.
2. Validate and build with the shadcn registry CLI.
3. Serve `public/r` on localhost and install the item into a clean eve project by URL.
4. Typecheck, run evals, test cancellation/resume, and verify reinstall preserves a local edit.
5. Commit both source and generated JSON.
6. After merge, consumers install from the stable hosted/raw URL.

The repository can later gain a custom registry domain or catalog, but that is a transport/discovery improvement—not a change to the ownership model.
