import { retentionSeconds } from "./agent-spec.ts";
import { getRedis, hasRedisConfig } from "./redis.ts";
import type { CallerScope } from "./owner.ts";

const OVERLAY_KEY_SUFFIX = "dynamic_instructions";

function overlayKey(scope: CallerScope): string {
  return `tenant:${scope.tenantId}:agent:default:user:${scope.userId}:${OVERLAY_KEY_SUFFIX}`;
}

export interface DynamicInstructionsOverlay {
  markdown: string;
  updatedAt: string;
  reason?: string;
  version: number;
}

export async function getDynamicInstructions(
  scope: CallerScope,
): Promise<DynamicInstructionsOverlay | null> {
  if (!hasRedisConfig()) return null;
  return (await getRedis().get<DynamicInstructionsOverlay>(overlayKey(scope))) ?? null;
}

export async function setDynamicInstructions(
  scope: CallerScope,
  input: { markdown: string; reason?: string },
): Promise<DynamicInstructionsOverlay> {
  if (input.markdown.length > 8000) {
    throw new Error("Dynamic instructions overlay exceeds 8000 characters.");
  }
  const redis = getRedis();
  const prev = await getDynamicInstructions(scope);
  const next: DynamicInstructionsOverlay = {
    markdown: input.markdown,
    reason: input.reason,
    updatedAt: new Date().toISOString(),
    version: (prev?.version ?? 0) + 1,
  };
  // No TTL: overlay is durable until cleared (Level-2 shortcut). Audit separately if needed.
  await redis.set(overlayKey(scope), next);
  await redis.set(
    `${overlayKey(scope)}:provenance:v${next.version}`,
    { ...next, previous: prev?.markdown },
    { ex: retentionSeconds().provenance },
  );
  return next;
}

export async function clearDynamicInstructions(
  scope: CallerScope,
): Promise<{ cleared: boolean }> {
  const redis = getRedis();
  const existing = await getDynamicInstructions(scope);
  if (!existing) return { cleared: false };
  await redis.del(overlayKey(scope));
  return { cleared: true };
}
