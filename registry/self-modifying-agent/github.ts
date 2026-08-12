import githubTools from "@github-tools/eve-extension";

const connector = process.env.GITHUB_CONNECTOR?.trim();
const repository = process.env.GITHUB_REPOSITORY?.trim();
const [owner, repo, extra] = repository?.split("/") ?? [];
const repositoryContext = owner && repo && !extra ? { owner, repo } : undefined;

const mutablePrefixes = ["agent/skills/", "agent/instructions/", "config/"];
const protectedPaths = new Set([
  "agent/instructions/self-modifying.md",
  "agent/skills/safety-policy/SKILL.md",
  "agent/skills/self-improvement/SKILL.md",
]);

export function normalizeRepositoryPath(input: string): string | undefined {
  const normalized = input.replaceAll("\\", "/").replace(/^\.\/+/, "").replace(/^\/+/, "");
  if (!normalized || normalized.includes("\0")) return undefined;
  const parts = normalized.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return undefined;
  return parts.join("/");
}

export function mutableRepositoryPath(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const path = normalizeRepositoryPath(input);
  if (!path || protectedPaths.has(path)) return false;
  if (path.startsWith("agent/instructions/") && !path.endsWith(".md")) return false;
  return mutablePrefixes.some((prefix) => path.startsWith(prefix));
}

function inputRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function deny(reason: string) {
  return { type: "denied" as const, reason };
}

function requireConfiguredRepository(input: Record<string, unknown>) {
  if (!repositoryContext) {
    return deny("GITHUB_REPOSITORY must be configured before repository mutation.");
  }
  if (input.owner !== repositoryContext.owner || input.repo !== repositoryContext.repo) {
    return deny(`Mutation is restricted to ${repositoryContext.owner}/${repositoryContext.repo}.`);
  }
  return undefined;
}

function requireAgentBranch(value: unknown) {
  return typeof value === "string" && value.startsWith("agent/")
    ? undefined
    : deny("Self-modification writes must target an agent/* branch.");
}

export default githubTools({
  ...(connector ? { connector } : {}),
  ...(repositoryContext ? { context: repositoryContext } : {}),
  preset: ["pr-author", "code-review", "ci-ops"],
  exclude: ["triggerWorkflow", "cancelWorkflowRun", "rerunWorkflowRun"],
  overrides: {
    createBranch: {
      approval: ({ toolInput }) => {
        const input = inputRecord(toolInput);
        return requireConfiguredRepository(input) ?? requireAgentBranch(input.branch) ?? "user-approval";
      },
    },
    createOrUpdateFile: {
      approval: ({ toolInput }) => {
        const input = inputRecord(toolInput);
        return requireConfiguredRepository(input)
          ?? requireAgentBranch(input.branch)
          ?? (mutableRepositoryPath(input.path)
            ? "user-approval"
            : deny("The requested path is outside the mutable allowlist or is governance-owned."));
      },
    },
    createPullRequest: {
      approval: ({ toolInput }) => {
        const input = inputRecord(toolInput);
        return requireConfiguredRepository(input) ?? requireAgentBranch(input.head) ?? "user-approval";
      },
    },
  },
});
