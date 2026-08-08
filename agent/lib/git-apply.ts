import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { assertPathAllowed } from "./allowlist.ts";
import { loadAgentSpec, repoRoot } from "./agent-spec.ts";

const execFileAsync = promisify(execFile);

export async function writeAllowlistedFile(input: {
  path: string;
  content: string;
}): Promise<{ path: string; bytes: number }> {
  const path = assertPathAllowed(input.path);
  const abs = join(repoRoot(), path);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, input.content, "utf8");
  return { path, bytes: Buffer.byteLength(input.content, "utf8") };
}

export async function readAllowlistedFile(pathInput: string): Promise<{ path: string; content: string }> {
  const path = assertPathAllowed(pathInput);
  const content = await readFile(join(repoRoot(), path), "utf8");
  return { path, content };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "change";
}

export async function createAgentBranchCommit(input: {
  summary: string;
  paths: string[];
}): Promise<{ branch: string; commitSha: string; paths: string[] }> {
  const paths = input.paths.map((p) => assertPathAllowed(p));
  const prefix = loadAgentSpec().mutation.branchPrefix;
  const branch = `${prefix}${slugify(input.summary)}-${Date.now().toString(36)}`;
  const cwd = repoRoot();

  await execFileAsync("git", ["checkout", "-b", branch], { cwd });
  await execFileAsync("git", ["add", "--", ...paths], { cwd });
  await execFileAsync(
    "git",
    ["commit", "-m", `agent: ${input.summary}`],
    {
      cwd,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME ?? "self-modifying-agent",
        GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL ?? "agent@localhost",
        GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME ?? "self-modifying-agent",
        GIT_COMMITTER_EMAIL: process.env.GIT_COMMITTER_EMAIL ?? "agent@localhost",
      },
    },
  );
  const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd });
  return { branch, commitSha: stdout.trim(), paths };
}

export async function pushAgentBranch(branch: string): Promise<{ remote: string; branch: string }> {
  const cwd = repoRoot();
  // Prefer a fine-scoped GitHub App token in GITHUB_TOKEN / GH_TOKEN when available.
  await execFileAsync("git", ["push", "-u", "origin", branch], { cwd });
  return { remote: "origin", branch };
}
