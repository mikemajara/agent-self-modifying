#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { appendFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const fixtureRoot = await mkdtemp(join(tmpdir(), "eve-selfmod-consumer."));
const appRoot = join(fixtureRoot, "app");
const eve = join(repositoryRoot, "node_modules", ".bin", process.platform === "win32" ? "eve.cmd" : "eve");

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? repositoryRoot,
      env: { ...process.env, CI: "1", ...options.env },
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolveRun({ code: code ?? 1, stdout, stderr }));
  });
}

function staticServer(root) {
  return createServer(async (request, response) => {
    try {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      const file = resolve(root, `.${path}`);
      if (!file.startsWith(`${resolve(root)}/`)) throw new Error("Unsafe path");
      const content = await readFile(file);
      response.writeHead(200, { "content-type": extname(file) === ".json" ? "application/json" : "text/plain" });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
}

const server = staticServer(join(repositoryRoot, "public", "r"));
try {
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  const itemUrl = `http://127.0.0.1:${address.port}/self-modifying-agent.json`;

  assert.equal((await run(eve, ["init", "app"], { cwd: fixtureRoot })).code, 0);
  const agentPath = join(appRoot, "agent", "agent.ts");
  const agentSource = await readFile(agentPath, "utf8");
  await writeFile(agentPath, agentSource.replace(/model:\s*"[^"]+"/, 'model: "openai/gpt-5.4"'));

  const install = await run(join(appRoot, "node_modules", ".bin", process.platform === "win32" ? "eve.cmd" : "eve"), ["add", itemUrl, "--yes"], { cwd: appRoot, capture: true });
  assert.equal(install.code, 0, install.stderr || install.stdout);
  assert.match(install.stdout, /node scripts\/setup-self-modifying-agent\.mjs/);

  const tsc = join(appRoot, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
  assert.equal((await run(tsc, ["--noEmit"], { cwd: appRoot })).code, 0);

  const fixtureEve = join(appRoot, "node_modules", ".bin", process.platform === "win32" ? "eve.cmd" : "eve");
  const info = await run(fixtureEve, ["info", "--json"], { cwd: appRoot, capture: true });
  assert.equal(info.code, 0, info.stderr || info.stdout);
  const jsonStart = info.stdout.indexOf("{");
  assert(jsonStart >= 0, "eve info did not return JSON");
  assert.equal(JSON.parse(info.stdout.slice(jsonStart)).status, "ready");
  assert.equal((await run(fixtureEve, ["build"], { cwd: appRoot })).code, 0);

  const compiledManifest = JSON.parse(
    await readFile(join(appRoot, ".eve", "compile", "compiled-agent-manifest.json"), "utf8"),
  );
  assert(compiledManifest.connections.some((connection) => connection.connectionName === "vercel"));
  assert(compiledManifest.dynamicInstructions.some((instruction) => instruction.slug === "self-modifying-setup"));
  assert(compiledManifest.extensionMounts.some((mount) => mount.namespace === "github"));
  assert(compiledManifest.extensionMounts.some((mount) => mount.namespace === "agentkit"));
  assert(compiledManifest.dynamicTools.some((tool) => tool.slug.includes("github")));

  const vercelConnection = await readFile(join(appRoot, "agent", "connections", "vercel.ts"), "utf8");
  assert.match(vercelConnection, /approval:\s*always\(\)/);
  const setupStatus = await run(process.execPath, ["scripts/setup-self-modifying-agent.mjs", "--status"], { cwd: appRoot, capture: true });
  assert.equal(setupStatus.code, 1);
  assert.match(setupStatus.stdout, /GitHub Connect/);

  const ownedSkill = join(appRoot, "agent", "skills", "self-improvement", "SKILL.md");
  const marker = "\n<!-- consumer-owned verification marker -->\n";
  await appendFile(ownedSkill, marker);
  const reinstall = await run(fixtureEve, ["add", itemUrl, "--yes"], { cwd: appRoot, capture: true });
  assert.equal(reinstall.code, 0, reinstall.stderr || reinstall.stdout);
  assert.match(await readFile(ownedSkill, "utf8"), /consumer-owned verification marker/);

  console.log(`Clean consumer verification passed: ${appRoot}`);
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
  if (!process.env.KEEP_EVE_FIXTURE) await rm(fixtureRoot, { recursive: true, force: true });
}
