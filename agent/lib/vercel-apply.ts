import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { repoRoot } from "./agent-spec.ts";

const execFileAsync = promisify(execFile);

export async function createPreviewDeployment(branch: string): Promise<{
  previewUrl: string;
  deploymentId?: string;
  note: string;
}> {
  // Uses Vercel CLI when linked. Production promotion is a separate gated tool.
  try {
    const { stdout } = await execFileAsync(
      "npx",
      ["vercel", "deploy", "--yes", "--meta", `agentBranch=${branch}`],
      {
        cwd: repoRoot(),
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    return {
      previewUrl: urlMatch?.[0] ?? "preview-url-not-parsed",
      note: "Preview deploy requested via Vercel CLI.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Preview deploy failed. Ensure the project is linked (vercel link) and authenticated. ${message}`,
    );
  }
}

export async function promoteProduction(): Promise<{
  productionUrl: string;
  note: string;
}> {
  try {
    const { stdout } = await execFileAsync(
      "npx",
      ["vercel", "deploy", "--prod", "--yes"],
      {
        cwd: repoRoot(),
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    return {
      productionUrl: urlMatch?.[0] ?? "production-url-not-parsed",
      note: "Production deploy requested via Vercel CLI after owner confirmation.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Production promote failed. ${message}`);
  }
}
