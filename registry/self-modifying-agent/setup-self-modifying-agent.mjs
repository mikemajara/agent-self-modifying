#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const envPath = join(root, ".env.local");
const args = new Set(process.argv.slice(2));

function readLocalEnvironment() {
  if (!existsSync(envPath)) return {};
  const values = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

export function setupStatus(environment) {
  const missing = [];
  if (!environment.GITHUB_CONNECTOR?.trim()) missing.push("GitHub Connect");
  if (!/^[-\w.]+\/[-\w.]+$/.test(environment.GITHUB_REPOSITORY?.trim() ?? "")) {
    missing.push("GitHub repository scope");
  }
  if (!environment.UPSTASH_REDIS_REST_URL?.trim() || !environment.UPSTASH_REDIS_REST_TOKEN?.trim()) {
    missing.push("Upstash memory");
  }
  if (environment.SELF_MODIFYING_SETUP_VERSION !== "1") missing.push("setup verification");
  return { complete: missing.length === 0, missing };
}

function upsertLocalEnvironment(updates) {
  const previous = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const keys = new Set(Object.keys(updates));
  const kept = previous.split(/\r?\n/).filter((line) => {
    const key = /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1];
    return !key || !keys.has(key);
  });
  while (kept.at(-1) === "") kept.pop();
  const next = [...kept, ...Object.entries(updates).map(([key, value]) => `${key}=${value}`), ""].join("\n");
  writeFileSync(envPath, next, { encoding: "utf8", mode: 0o600 });
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: options.input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
    input: options.input,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${commandArgs.join(" ")} failed.`);
}

function localBinary(name) {
  const suffix = process.platform === "win32" ? ".cmd" : "";
  const candidate = join(root, "node_modules", ".bin", `${name}${suffix}`);
  return existsSync(candidate) ? candidate : name;
}

function repositoryFromRemote() {
  const result = spawnSync("git", ["remote", "get-url", "origin"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) return undefined;
  const match = /(?:github\.com[/:])([^/]+)\/([^/]+?)(?:\.git)?\s*$/.exec(result.stdout);
  return match ? `${match[1]}/${match[2]}` : undefined;
}

async function readSecret(prompt) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("Secret input requires an interactive terminal.");
  }
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let value = "";
  try {
    for await (const chunk of process.stdin) {
      const text = chunk.toString("utf8");
      for (const character of text) {
        if (character === "\u0003") throw new Error("Setup cancelled.");
        if (character === "\r" || character === "\n") {
          process.stdout.write("\n");
          return value;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    }
  } finally {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
  return value;
}

function setVercelEnvironment(name, value, sensitive = false) {
  const commandArgs = ["env", "add", name, "production,preview,development", "--force", "--yes"];
  if (sensitive) commandArgs.push("--sensitive");
  run(localBinary("vercel"), commandArgs, { input: `${value}\n` });
}

async function main() {
  if (!existsSync(join(root, "package.json")) || !existsSync(join(root, "agent"))) {
    throw new Error("Run this command from the root of the consuming Eve project.");
  }

  const initial = { ...process.env, ...readLocalEnvironment() };
  if (args.has("--status")) {
    const status = setupStatus(initial);
    console.log(status.complete ? "Self-modification setup is complete." : `Missing: ${status.missing.join(", ")}`);
    process.exitCode = status.complete ? 0 : 1;
    return;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Interactive setup requires a terminal. Use --status for a non-interactive check.");
  }

  console.log("Self-modifying agent setup\n");
  console.log("Eve will first link this project and configure the Vercel MCP connection.");
  run(localBinary("eve"), ["add", "connection/vercel", "--skip-install"]);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const defaultRepository = initial.GITHUB_REPOSITORY || repositoryFromRemote() || "";
  const repository = (await rl.question(`GitHub repository (owner/repo)${defaultRepository ? ` [${defaultRepository}]` : ""}: `)).trim()
    || defaultRepository;
  if (!/^[-\w.]+\/[-\w.]+$/.test(repository)) throw new Error("A GitHub owner/repository value is required.");

  let connector = initial.GITHUB_CONNECTOR?.trim();
  if (!connector) {
    const defaultName = basename(root).replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const name = (await rl.question(`New GitHub connector name [${defaultName}]: `)).trim() || defaultName;
    console.log("Vercel will open the GitHub authorization flow in your browser.");
    run(localBinary("vercel"), ["connect", "create", "github", "--name", name]);
    connector = `github/${name}`;
  }
  run(localBinary("vercel"), ["connect", "attach", connector, "--yes"]);

  console.log("\nCreate or select an Upstash Redis database, then copy its REST values from https://console.upstash.com/redis");
  const redisUrl = initial.UPSTASH_REDIS_REST_URL?.trim()
    || (await rl.question("UPSTASH_REDIS_REST_URL: ")).trim();
  rl.close();
  const redisToken = initial.UPSTASH_REDIS_REST_TOKEN?.trim()
    || (await readSecret("UPSTASH_REDIS_REST_TOKEN (input hidden): ")).trim();
  if (!redisUrl || !redisToken) throw new Error("Both Upstash REST values are required.");

  const updates = {
    GITHUB_CONNECTOR: connector,
    GITHUB_REPOSITORY: repository,
    UPSTASH_REDIS_REST_URL: redisUrl,
    UPSTASH_REDIS_REST_TOKEN: redisToken,
    SELF_MODIFYING_SETUP_VERSION: "1",
  };
  upsertLocalEnvironment(updates);

  console.log("\nSyncing configuration to the linked Vercel project...");
  setVercelEnvironment("GITHUB_CONNECTOR", connector);
  setVercelEnvironment("GITHUB_REPOSITORY", repository);
  setVercelEnvironment("UPSTASH_REDIS_REST_URL", redisUrl, true);
  setVercelEnvironment("UPSTASH_REDIS_REST_TOKEN", redisToken, true);
  setVercelEnvironment("SELF_MODIFYING_SETUP_VERSION", "1");

  console.log("\nSetup complete. Run `npx eve dev` and start a new session.");
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
