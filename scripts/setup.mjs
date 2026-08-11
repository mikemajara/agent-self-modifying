#!/usr/bin/env node
/**
 * Resumable setup wizard for the self-modifying agent template.
 * JSON/non-interactive modes only diagnose and never mutate external accounts.
 */
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";
import { updateEnvFile } from "./setup-env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");
const jsonMode = process.argv.includes("--json");
const checkMode = process.argv.includes("--check") || process.argv.includes("--non-interactive");
const interactive = !jsonMode && !checkMode && Boolean(process.stdin.isTTY && process.stdout.isTTY);

function log(message = "") {
  if (!jsonMode) console.log(message ? `› ${message}` : "");
}

function warn(message) {
  if (!jsonMode) console.warn(`! ${message}`);
}

function ensureEnvExampleCopied() {
  const source = resolve(root, ".env.example");
  if (!existsSync(envPath) && existsSync(source)) {
    writeFileSync(envPath, readFileSync(source), { mode: 0o600 });
    log("Created .env.local from .env.example");
  }
  if (existsSync(envPath)) chmodSync(envPath, 0o600);
}

function run(command, args, options = {}) {
  log(`Running ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: options.input == null ? "inherit" : ["pipe", "inherit", "inherit"],
    input: options.input == null ? undefined : `${options.input}\n`,
    shell: false,
  });
  if (result.status !== 0) warn(`${command} ${args[0] ?? ""} did not complete successfully.`);
  return result.status === 0;
}

function runQuiet(command, args) {
  return spawnSync(command, args, { cwd: root, stdio: "ignore", shell: false }).status === 0;
}

function runVercel(args, options) {
  return run("npx", ["vercel", ...args], options);
}

function getCheck(report, id) {
  return report.checks.find((check) => check.id === id);
}

function printReport(report) {
  for (const check of report.checks) {
    if (check.ok) log(`${check.id}: ${check.summary}`);
    else warn(`${check.id}: ${check.summary}`);
    for (const action of check.nextActions) log(`  → ${action}`);
  }
}

async function ask(question, defaultValue = "") {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await readline.question(`${question}${suffix}: `)).trim();
    return answer || defaultValue;
  } finally {
    readline.close();
  }
}

async function confirm(question, defaultYes = true) {
  const answer = (await ask(question, defaultYes ? "Y/n" : "y/N")).toLowerCase();
  if (answer === "y/n") return true;
  if (answer === "y" || answer === "yes") return true;
  if (answer === "n" || answer === "no") return false;
  return defaultYes;
}

async function askSecret(question) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    return ask(question);
  }

  process.stdout.write(`${question}: `);
  const wasRaw = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolveSecret, rejectSecret) => {
    let value = "";

    function finish(error) {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(Boolean(wasRaw));
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) rejectSecret(error);
      else resolveSecret(value.trim());
    }

    function onData(chunk) {
      const text = chunk.toString("utf8");
      for (const character of text) {
        if (character === "\u0003") {
          finish(new Error("Setup cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    }

    process.stdin.on("data", onData);
  });
}

function validateTelegramToken(value) {
  return /^\d+:[A-Za-z0-9_-]+$/.test(value);
}

async function configureVercel(report) {
  const needsVercel = !getCheck(report, "vercel_link")?.ok || !getCheck(report, "upstash")?.ok;
  if (!needsVercel || !(await confirm("Configure Vercel and Upstash now?"))) return;

  if (!runQuiet("npx", ["vercel", "whoami"])) {
    if (!runVercel(["login"])) return;
  }

  if (!existsSync(resolve(root, ".vercel/project.json")) && !runVercel(["link"])) return;

  if (!getCheck(report, "upstash")?.ok) {
    log("Vercel will now ask you to provision or connect an Upstash resource.");
    if (!runVercel(["integration", "add", "upstash/upstash-kv"])) {
      warn("You can resume later with: npx vercel integration add upstash/upstash-kv");
      return;
    }
  }

  runVercel(["env", "pull", ".env.local", "--yes"]);
}

async function collectTelegramValues(report) {
  const missingTelegram = ["telegram_bot", "telegram_owner", "telegram_webhook_secret"].some(
    (id) => !getCheck(report, id)?.ok,
  );
  if (!missingTelegram || !(await confirm("Configure Telegram now?"))) return null;

  log("Open https://t.me/BotFather, send /newbot, and follow its prompts.");
  const updates = {};

  if (!getCheck(report, "telegram_bot")?.ok) {
    let token = "";
    while (!validateTelegramToken(token)) {
      token = await askSecret("Telegram bot token (input hidden)");
      if (!validateTelegramToken(token)) warn("That does not look like a Telegram bot token.");
    }
    updates.TELEGRAM_BOT_TOKEN = token;

    let username = (await ask("Telegram bot username (without @)")).replace(/^@/, "");
    while (!/^[A-Za-z0-9_]{5,}$/.test(username)) {
      warn("Enter the bot username shown by BotFather, without @.");
      username = (await ask("Telegram bot username (without @)")).replace(/^@/, "");
    }
    updates.TELEGRAM_BOT_USERNAME = username;
  }

  if (!getCheck(report, "telegram_owner")?.ok) {
    log("Use https://t.me/userinfobot if you do not know your numeric Telegram user ID.");
    let ownerId = await ask("Your numeric Telegram user ID");
    while (!/^\d+$/.test(ownerId)) {
      warn("Telegram user IDs contain digits only.");
      ownerId = await ask("Your numeric Telegram user ID");
    }
    updates.TELEGRAM_OWNER_USER_ID = ownerId;
  }

  if (!getCheck(report, "telegram_webhook_secret")?.ok) {
    updates.TELEGRAM_WEBHOOK_SECRET_TOKEN = randomBytes(32).toString("base64url");
    log("Generated a Telegram webhook secret.");
  }

  updateEnvFile(envPath, updates);
  log("Saved Telegram configuration to .env.local with owner-only file permissions.");
  return updates;
}

async function syncTelegramToVercel(updates) {
  if (!updates || Object.keys(updates).length === 0) return;
  if (!existsSync(resolve(root, ".vercel/project.json"))) {
    warn("Vercel is not linked, so Telegram values were saved locally only.");
    return;
  }
  if (!(await confirm("Also save these Telegram values to the linked Vercel project?"))) return;

  for (const [name, value] of Object.entries(updates)) {
    const sensitive = name === "TELEGRAM_BOT_TOKEN" || name === "TELEGRAM_WEBHOOK_SECRET_TOKEN";
    const environments = sensitive ? "production,preview" : "production,preview,development";
    const args = ["env", "add", name, environments, "--force", sensitive ? "--sensitive" : "--no-sensitive"];
    if (!runVercel(args, { input: value })) {
      warn(`Could not save ${name} to Vercel; rerun setup to resume.`);
      return;
    }
  }
}

async function runChecks() {
  log("Running typecheck...");
  const typecheckOk = run("npm", ["run", "typecheck"]);
  log(typecheckOk ? "Typecheck ok." : "Typecheck failed.");

  log("Running unit tests...");
  const testsOk = run("npm", ["test"]);
  log(testsOk ? "Tests ok." : "Tests failed.");
  return typecheckOk && testsOk;
}

ensureEnvExampleCopied();

const setupStatusUrl = pathToFileURL(resolve(root, "agent/lib/setup-status.ts")).href;
const { setupReport } = await import(setupStatusUrl);
let report = setupReport();

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
  if (!report.ready) process.exitCode = 1;
} else {
  printReport(report);

  if (interactive && !report.ready) {
    log();
    log("Interactive setup will pause for official account and provider prompts. It is safe to rerun.");
    await configureVercel(report);
    report = setupReport();
    const telegramUpdates = await collectTelegramValues(report);
    await syncTelegramToVercel(telegramUpdates);
    report = setupReport();
    log();
    log("Setup status after the wizard:");
    printReport(report);
  } else if (!interactive && !checkMode) {
    warn("No interactive terminal detected; showing diagnostics only. Run `npm run setup` in a terminal for the wizard.");
  }

  const checksOk = await runChecks();
  if (!checksOk || !report.ready) process.exitCode = 1;

  if (report.ready) {
    log("Setup is complete. Deploy, register the Telegram webhook, then chat as the linked owner.");
  } else {
    log("Setup is incomplete. Rerun `npm run setup` to resume, or use `npm run setup:json` from an agent/CI.");
  }
}
