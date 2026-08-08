import { loadAgentSpec, retentionSeconds } from "./agent-spec.ts";
import { getRedis } from "./redis.ts";
import type { CallerScope } from "./owner.ts";

export interface MemoryEntry {
  key: string;
  value: string;
  reason?: string;
  updatedAt: string;
  version: number;
}

export interface MemoryDocument {
  version: number;
  updatedAt: string;
  entries: Record<string, MemoryEntry>;
}

function scopePrefix(scope: CallerScope): string {
  return `tenant:${scope.tenantId}:agent:default:user:${scope.userId}`;
}

function memoryKey(scope: CallerScope): string {
  return `${scopePrefix(scope)}:memory`;
}

function provenanceKey(scope: CallerScope, entryKey: string, version: number): string {
  return `${scopePrefix(scope)}:provenance:${entryKey}:v${version}`;
}

function emptyDoc(): MemoryDocument {
  return { version: 0, updatedAt: new Date(0).toISOString(), entries: {} };
}

export async function readMemory(scope: CallerScope): Promise<MemoryDocument> {
  const redis = getRedis();
  const doc = await redis.get<MemoryDocument>(memoryKey(scope));
  return doc ?? emptyDoc();
}

export async function listMemories(
  scope: CallerScope,
  options: { limit?: number } = {},
): Promise<MemoryEntry[]> {
  const doc = await readMemory(scope);
  const limit = options.limit ?? 50;
  return Object.values(doc.entries)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export async function remember(
  scope: CallerScope,
  input: { key: string; value: string; reason?: string },
): Promise<MemoryEntry> {
  const spec = loadAgentSpec();
  if (input.value.length > spec.memory.maxValueChars) {
    throw new Error(`Memory value exceeds ${spec.memory.maxValueChars} characters.`);
  }

  const redis = getRedis();
  const key = memoryKey(scope);
  const ttl = retentionSeconds();

  for (let attempt = 0; attempt < 5; attempt++) {
    const current = (await redis.get<MemoryDocument>(key)) ?? emptyDoc();
    if (Object.keys(current.entries).length >= spec.memory.maxDurableEntries && !current.entries[input.key]) {
      throw new Error(
        `Durable memory is full (${spec.memory.maxDurableEntries} entries). Forget something first.`,
      );
    }

    const prev = current.entries[input.key];
    const nextVersion = (prev?.version ?? 0) + 1;
    const entry: MemoryEntry = {
      key: input.key,
      value: input.value,
      reason: input.reason,
      updatedAt: new Date().toISOString(),
      version: nextVersion,
    };

    const next: MemoryDocument = {
      version: current.version + 1,
      updatedAt: entry.updatedAt,
      entries: { ...current.entries, [input.key]: entry },
    };

    const ok = await redis.set(key, next, current.version > 0 ? { xx: true } : { nx: true });

    // Upstash SET with xx/nx returns null on conflict; without conditions returns "OK".
    // For CAS we re-read version: if another writer won, retry.
    const after = await redis.get<MemoryDocument>(key);
    if (after && after.version === next.version && after.entries[input.key]?.version === nextVersion) {
      await redis.set(provenanceKey(scope, input.key, nextVersion), {
        ...entry,
        previousValue: prev?.value,
      }, { ex: ttl.provenance });
      return entry;
    }

    // Fallback CAS using watch-like compare of version field via Lua would be better;
    // retry loop handles concurrent writers for V1.
    if (ok === "OK" || after?.version === next.version) {
      await redis.set(provenanceKey(scope, input.key, nextVersion), {
        ...entry,
        previousValue: prev?.value,
      }, { ex: ttl.provenance });
      return entry;
    }
  }

  throw new Error("Memory write conflict after retries. Try again.");
}

export async function forget(
  scope: CallerScope,
  entryKey: string,
): Promise<{ forgotten: boolean; key: string }> {
  const redis = getRedis();
  const key = memoryKey(scope);
  const ttl = retentionSeconds();

  for (let attempt = 0; attempt < 5; attempt++) {
    const current = (await redis.get<MemoryDocument>(key)) ?? emptyDoc();
    if (!current.entries[entryKey]) {
      return { forgotten: false, key: entryKey };
    }

    const { [entryKey]: removed, ...rest } = current.entries;
    const next: MemoryDocument = {
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
      entries: rest,
    };

    await redis.set(key, next);
    const after = await redis.get<MemoryDocument>(key);
    if (after && after.version === next.version && !after.entries[entryKey]) {
      await redis.set(
        `${scopePrefix(scope)}:tombstone:${entryKey}:${removed.version}`,
        { ...removed, forgottenAt: next.updatedAt },
        { ex: ttl.tombstone },
      );
      return { forgotten: true, key: entryKey };
    }
  }

  throw new Error("Memory forget conflict after retries. Try again.");
}

export function renderMemoryMarkdown(doc: MemoryDocument): string {
  const lines = ["# MEMORY.md", "", `version: ${doc.version}`, `updatedAt: ${doc.updatedAt}`, ""];
  const entries = Object.values(doc.entries).sort((a, b) => a.key.localeCompare(b.key));
  if (entries.length === 0) {
    lines.push("_No durable memories yet._");
    return lines.join("\n");
  }
  for (const entry of entries) {
    lines.push(`## ${entry.key}`);
    lines.push("");
    lines.push(entry.value);
    lines.push("");
    lines.push(`- version: ${entry.version}`);
    lines.push(`- updatedAt: ${entry.updatedAt}`);
    if (entry.reason) lines.push(`- reason: ${entry.reason}`);
    lines.push("");
  }
  return lines.join("\n");
}
