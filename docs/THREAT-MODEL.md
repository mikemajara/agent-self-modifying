# Threat model — self-modifying eve integration

Scope: V1 registry integration (eve + Telegram + Upstash + allowlisted Git/Vercel apply loop).
Assumption: cloners own all cloud credentials; this repo ships no secrets.

## Assets

| Asset | Why it matters |
| --- | --- |
| Model / session context | Prompt injection can steer tools |
| Upstash memory + dynamic instruction overlay | Cross-user leak or poisoned “facts” |
| Allowlisted repo files | Behavior changes after deploy |
| Git push credentials / GitHub App | Malicious commits or branch abuse |
| Vercel deploy credentials | Preview/prod compromise |
| Telegram bot token + webhook secret | Impersonation / unauthorized turns |
| Safety policy + tool implementations | Privilege escalation if writable |

## Trust boundaries

1. **Telegram webhook** — verified with `TELEGRAM_WEBHOOK_SECRET_TOKEN`; owner gated by `TELEGRAM_OWNER_USER_ID`.
2. **Tool runtime** — server-side; env secrets must never be returned to the model.
3. **Mutable paths** — allowlist/denylist in `agent.spec.json`; tools/lib/channels are denylisted.
4. **Production promote** — always requires HITL approval after preview.
5. **Cloner machine / coding agent** — first-run setup may use shell/MCP; secrets go to `.env.local` / Vercel env, not chat.

## Threats and mitigations

| Threat | Severity | Mitigation (V1) |
| --- | --- | --- |
| Prompt injection → secret exfiltration | Critical | No tools that read/print env; setup_status returns presence only; memory forbids credentials |
| Prompt injection → widen allowlist / edit tools | Critical | Path allowlist + denylist; denylisted paths include tools/lib/channels; safety skill |
| Unauthorized Telegram user mutates/deploys | High | Owner id gate at channel; `requireOwner` on mutation/git/deploy tools |
| Webhook forgery | High | Telegram secret-token header verification |
| Cross-tenant memory access | High | Keys scoped by tenant + user; never take tenant/user ids from model input |
| Malicious self-mod on `main` | High | Commits only to `agent/*`; no force-push; production gated |
| Bad preview promoted blindly | High | `push_and_preview` + `promote_production` use `always()` approval |
| Dynamic overlay used as persistent jailbreak | Medium | Injected as untrusted guidance; safety policy wins; owner-only write/clear |
| Cost / deploy abuse loops | Medium | Budgets/rate limits still thin — document cloners set Vercel/Upstash limits; circuit breakers planned |
| Supply chain / eve beta churn | Medium | Pin eve; isolate libs under `agent/lib` |

## Residual risks (accepted for V1 template)

- Git push currently uses ambient `git`/`GITHUB_TOKEN` on the host — cloners should prefer a narrowly scoped GitHub App before production use.
- Web chat still uses eve `placeholderAuth` until the cloner wires real auth.
- Coding-agent setup on the cloner’s machine can access secrets via shell; that is intentional and outside the deployed agent’s tool surface.

## Review triggers

Revisit this model when expanding the allowlist, adding auto-apply, introducing multi-tenant V2, or changing Telegram auth.
