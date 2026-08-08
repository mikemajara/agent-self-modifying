import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hasRedisConfig } from "./redis.ts";
import { repoRoot } from "./agent-spec.ts";

export type SetupCheckId =
  | "node"
  | "env_file"
  | "upstash"
  | "telegram_bot"
  | "telegram_owner"
  | "telegram_webhook_secret"
  | "vercel_link"
  | "model";

export interface SetupCheck {
  id: SetupCheckId;
  ok: boolean;
  /** Safe for model context — never includes secret values. */
  summary: string;
  /** Shell / MCP actions the cloner (or coding agent) should run. */
  nextActions: string[];
}

function envPresent(name: string): boolean {
  if (process.env[name]?.trim()) return true;
  for (const file of [".env.local", ".env"]) {
    const path = join(repoRoot(), file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    if (new RegExp(`^${name}=.+$`, "m").test(text) && !new RegExp(`^${name}=\\s*$`, "m").test(text)) {
      // Treat KEY= as missing; KEY=value as present without reading the value into memory for the summary.
      const match = text.match(new RegExp(`^${name}=(.*)$`, "m"));
      if (match && match[1]!.trim().length > 0) return true;
    }
  }
  return false;
}

export function collectSetupChecks(): SetupCheck[] {
  const root = repoRoot();
  const major = Number(process.versions.node.split(".")[0]);
  const checks: SetupCheck[] = [];

  checks.push({
    id: "node",
    ok: major >= 24,
    summary: major >= 24 ? `Node ${process.versions.node}` : `Node ${process.versions.node} (24.x recommended)`,
    nextActions: major >= 24 ? [] : ["Install Node.js 24.x (nvm use 24 or equivalent)."],
  });

  const envFile = existsSync(join(root, ".env.local")) || existsSync(join(root, ".env"));
  checks.push({
    id: "env_file",
    ok: envFile,
    summary: envFile ? ".env.local or .env present" : "No .env.local yet",
    nextActions: envFile ? [] : ["cp .env.example .env.local"],
  });

  const upstash = hasRedisConfig() || (envPresent("UPSTASH_REDIS_REST_URL") && envPresent("UPSTASH_REDIS_REST_TOKEN"));
  checks.push({
    id: "upstash",
    ok: upstash,
    summary: upstash ? "Upstash Redis env vars present" : "Upstash Redis not configured",
    nextActions: upstash
      ? []
      : [
          "npx vercel login",
          "npx vercel link",
          "npx vercel integration add upstash",
          "npx vercel env pull .env.local",
        ],
  });

  checks.push({
    id: "telegram_bot",
    ok: envPresent("TELEGRAM_BOT_TOKEN"),
    summary: envPresent("TELEGRAM_BOT_TOKEN")
      ? "TELEGRAM_BOT_TOKEN present"
      : "TELEGRAM_BOT_TOKEN missing",
    nextActions: envPresent("TELEGRAM_BOT_TOKEN")
      ? []
      : [
          "Create a bot with Telegram BotFather",
          "Write TELEGRAM_BOT_TOKEN into .env.local via editor or `vercel env add` — do not paste the token into chat",
          "Set TELEGRAM_BOT_USERNAME to the bot username without @",
        ],
  });

  checks.push({
    id: "telegram_owner",
    ok: envPresent("TELEGRAM_OWNER_USER_ID"),
    summary: envPresent("TELEGRAM_OWNER_USER_ID")
      ? "TELEGRAM_OWNER_USER_ID present"
      : "TELEGRAM_OWNER_USER_ID missing",
    nextActions: envPresent("TELEGRAM_OWNER_USER_ID")
      ? []
      : [
          "Message a Telegram user-id bot (e.g. @userinfobot) as the owner",
          "Set TELEGRAM_OWNER_USER_ID in .env.local (numeric id only)",
        ],
  });

  checks.push({
    id: "telegram_webhook_secret",
    ok: envPresent("TELEGRAM_WEBHOOK_SECRET_TOKEN"),
    summary: envPresent("TELEGRAM_WEBHOOK_SECRET_TOKEN")
      ? "TELEGRAM_WEBHOOK_SECRET_TOKEN present"
      : "TELEGRAM_WEBHOOK_SECRET_TOKEN missing",
    nextActions: envPresent("TELEGRAM_WEBHOOK_SECRET_TOKEN")
      ? []
      : [
          "Generate a random webhook secret and set TELEGRAM_WEBHOOK_SECRET_TOKEN in .env.local / Vercel env",
          "After deploy, register setWebhook with that same secret_token",
        ],
  });

  const vercelLinked = existsSync(join(root, ".vercel/project.json"));
  checks.push({
    id: "vercel_link",
    ok: vercelLinked,
    summary: vercelLinked ? "Vercel project linked" : "Vercel project not linked",
    nextActions: vercelLinked ? [] : ["npx vercel login", "npx vercel link"],
  });

  const modelOk =
    envPresent("AGENT_MODEL") ||
    envPresent("AI_GATEWAY_API_KEY") ||
    envPresent("VERCEL_OIDC_TOKEN") ||
    vercelLinked;
  checks.push({
    id: "model",
    ok: modelOk,
    summary: modelOk
      ? "Model path likely available (Gateway/OIDC/link or AGENT_MODEL)"
      : "No AI Gateway / OIDC / AGENT_MODEL signal yet",
    nextActions: modelOk
      ? []
      : [
          "Prefer Vercel AI Gateway via project link + OIDC",
          "Or set AI_GATEWAY_API_KEY / AGENT_MODEL locally without pasting into chat",
        ],
  });

  return checks;
}

export function setupReport() {
  const checks = collectSetupChecks();
  const missing = checks.filter((c) => !c.ok);
  const ready = missing.length === 0;
  return {
    ready,
    missingCount: missing.length,
    checks,
    guidance: ready
      ? "Setup looks complete. Deploy if needed, register the Telegram webhook, then chat as the owner."
      : "Setup incomplete. Use a coding agent or MCP to run nextActions on the cloner's machine. Never paste secret values into model chat.",
    mcpHints: [
      "Prefer shell / Vercel CLI / official integrations over asking the user to paste tokens into chat.",
      "If a Vercel or GitHub MCP is available, use it for link/deploy/env — still keep raw secrets out of prompts.",
      "Write secrets only to .env.local or `vercel env add` (interactive), not into agent memory.",
    ],
  };
}
