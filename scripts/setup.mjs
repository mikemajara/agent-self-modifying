#!/usr/bin/env node
/**
 * Idempotent setup helper for the self-modifying agent template.
 * Diagnoses cloner-owned credentials; never prints secret values.
 * Use --json for coding agents / MCP automation.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const jsonMode = process.argv.includes("--json");

function log(msg) {
  if (!jsonMode) console.log(`› ${msg}`);
}

function warn(msg) {
  if (!jsonMode) console.warn(`! ${msg}`);
}

function ensureEnvExampleCopied() {
  const dest = resolve(root, ".env.local");
  const src = resolve(root, ".env.example");
  if (!existsSync(dest) && existsSync(src)) {
    writeFileSync(dest, readFileSync(src));
    log("Created .env.local from .env.example");
  }
}

function run(cmd, args) {
  log(`${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: jsonMode ? "pipe" : "inherit",
    shell: false,
  });
  return result.status === 0;
}

ensureEnvExampleCopied();

const setupStatusUrl = pathToFileURL(resolve(root, "agent/lib/setup-status.ts")).href;
const { setupReport } = await import(setupStatusUrl);
const report = setupReport();

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const check of report.checks) {
    if (check.ok) log(`${check.id}: ${check.summary}`);
    else warn(`${check.id}: ${check.summary}`);
    for (const action of check.nextActions) log(`  → ${action}`);
  }
  log(report.guidance);
  for (const hint of report.mcpHints) log(hint);
}

if (!jsonMode) {
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
}

if (!report.ready) {
  process.exitCode = process.exitCode || 1;
}

if (!jsonMode) {
  log(
    "Setup finished diagnosing. Complete missing nextActions on your accounts (or via a coding agent/MCP), then deploy and register the Telegram webhook.",
  );
}
