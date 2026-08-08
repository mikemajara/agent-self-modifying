import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const agentSpecSchema = z.object({
  specVersion: z.string(),
  templateVersion: z.string(),
  identity: z.object({
    name: z.string(),
    purpose: z.string(),
    instructions: z.string(),
  }),
  model: z.object({
    id: z.string(),
  }),
  channels: z.object({
    telegram: z.boolean(),
    web: z.boolean(),
    tui: z.boolean(),
  }),
  memory: z.object({
    sessionTtlDays: z.number().positive(),
    provenanceTtlDays: z.number().positive(),
    auditTtlDays: z.number().positive(),
    tombstoneTtlDays: z.number().positive(),
    maxDurableEntries: z.number().int().positive(),
    maxValueChars: z.number().int().positive(),
    sensitiveCategories: z.array(z.string()),
  }),
  mutation: z.object({
    allowlist: z.array(z.string()).min(1),
    denylist: z.array(z.string()),
    requireProductionConfirm: z.literal(true),
    branchPrefix: z.string().min(1),
  }),
  featureFlags: z.object({
    markdownAutoApply: z.boolean(),
    redisSearch: z.boolean(),
  }),
});

export type AgentSpec = z.infer<typeof agentSpecSchema>;

function findRepoRoot(): string {
  const candidates = [
    process.cwd(),
    join(dirname(fileURLToPath(import.meta.url)), "../.."),
  ];

  for (const start of candidates) {
    let dir = start;
    for (let i = 0; i < 8; i++) {
      if (existsSync(join(dir, "agent.spec.json")) && existsSync(join(dir, "package.json"))) {
        return dir;
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  throw new Error("Could not locate agent.spec.json from the project root.");
}

let cachedRoot: string | undefined;
let cached: AgentSpec | undefined;

export function repoRoot(): string {
  cachedRoot ??= findRepoRoot();
  return cachedRoot;
}

export function loadAgentSpec(): AgentSpec {
  if (cached) return cached;
  const raw = JSON.parse(readFileSync(join(repoRoot(), "agent.spec.json"), "utf8"));
  cached = agentSpecSchema.parse(raw);
  return cached;
}

export function daysToSeconds(days: number): number {
  return Math.floor(days * 24 * 60 * 60);
}

export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function retentionSeconds() {
  const spec = loadAgentSpec();
  return {
    session: daysToSeconds(envInt("MEMORY_SESSION_TTL_DAYS", spec.memory.sessionTtlDays)),
    provenance: daysToSeconds(
      envInt("MEMORY_PROVENANCE_TTL_DAYS", spec.memory.provenanceTtlDays),
    ),
    audit: daysToSeconds(envInt("MEMORY_AUDIT_TTL_DAYS", spec.memory.auditTtlDays)),
    tombstone: daysToSeconds(
      envInt("MEMORY_TOMBSTONE_TTL_DAYS", spec.memory.tombstoneTtlDays),
    ),
  };
}
