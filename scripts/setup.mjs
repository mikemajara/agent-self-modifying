#!/usr/bin/env node
/**
 * Idempotent setup helper for the self-modifying agent template.
 * Guides Vercel auth/link, Upstash env presence, Telegram owner linking, and smoke checks.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function log(msg) {
  console.log(`› ${msg}`);
}

function warn(msg) {
  console.warn(`! ${msg}`);
}

function hasEnv(name) {
  if (process.env[name]) return true;
  for (const file of [".env.local", ".env"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    if (new RegExp(`^${name}=.+`, "m").test(readFileSync(path, "utf8"))) return true;
  }
  return false;
}

function ensureEnvExampleCopied() {
  const dest = resolve(root, ".env.local");
  const src = resolve(root, ".env.example");
  if (!existsSync(dest) && existsSync(src)) {
    writeFileSync(dest, readFileSync(src));
    log("Created .env.local from .env.example");
  }
}

function run(cmd, args, opts = {}) {
  log(`${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    ...opts,
  });
  return result.status === 0;
}

ensureEnvExampleCopied();

log("Checking Node engine (24.x recommended)...");
const major = Number(process.versions.node.split(".")[0]);
if (major < 24) warn(`Node ${process.versions.node} detected; package engines ask for 24.x`);

if (!hasEnv("UPSTASH_REDIS_REST_URL") || !hasEnv("UPSTASH_REDIS_REST_TOKEN")) {
  warn("Upstash Redis env vars missing.");
  log("After `vercel link`, prefer: vercel integration add upstash && vercel env pull");
} else {
  log("Upstash Redis env vars present.");
}

if (!hasEnv("TELEGRAM_BOT_TOKEN")) {
  warn("TELEGRAM_BOT_TOKEN missing. Create a bot with BotFather and paste the token into .env.local");
} else {
  log("Telegram bot token present.");
}

if (!hasEnv("TELEGRAM_OWNER_USER_ID")) {
  warn("TELEGRAM_OWNER_USER_ID missing. Message @userinfobot and set your numeric id.");
} else {
  log("Telegram owner id present.");
}

if (!existsSync(resolve(root, ".vercel/project.json"))) {
  warn("Vercel project not linked yet.");
  log("Run: npx vercel login && npx vercel link");
  log("Then: npx vercel integration add upstash && npx vercel env pull .env.local");
} else {
  log("Vercel project link detected.");
}

log("Running typecheck...");
if (!run("npm", ["run", "typecheck"])) {
  process.exitCode = 1;
  warn("Typecheck failed.");
} else {
  log("Typecheck ok.");
}

log("Running unit tests...");
if (!run("npm", ["test"])) {
  process.exitCode = 1;
  warn("Tests failed.");
} else {
  log("Tests ok.");
}

log("Setup finished. Next: npm run dev:eve  (TUI) or deploy and set Telegram webhook to /eve/v1/telegram");
