import { retentionSeconds } from "./agent-spec.ts";
import { getRedis } from "./redis.ts";
import type { CallerScope } from "./owner.ts";

export type ApplyPhase =
  | "planned"
  | "written"
  | "committed"
  | "preview"
  | "awaiting_production_confirm"
  | "production"
  | "rolled_back"
  | "failed";

export interface ApplyRecord {
  id: string;
  phase: ApplyPhase;
  summary: string;
  paths: string[];
  branch?: string;
  commitSha?: string;
  previewUrl?: string;
  productionUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  ownerUserId: string;
}

function applyKey(scope: CallerScope, id: string): string {
  return `tenant:${scope.tenantId}:agent:default:apply:${id}`;
}

function applyIndexKey(scope: CallerScope): string {
  return `tenant:${scope.tenantId}:agent:default:apply:index`;
}

export async function saveApplyRecord(scope: CallerScope, record: ApplyRecord): Promise<ApplyRecord> {
  const redis = getRedis();
  const ttl = retentionSeconds().audit;
  await redis.set(applyKey(scope, record.id), record, { ex: ttl });
  await redis.lpush(applyIndexKey(scope), record.id);
  await redis.ltrim(applyIndexKey(scope), 0, 199);
  await redis.expire(applyIndexKey(scope), ttl);
  return record;
}

export async function getApplyRecord(
  scope: CallerScope,
  id: string,
): Promise<ApplyRecord | null> {
  return (await getRedis().get<ApplyRecord>(applyKey(scope, id))) ?? null;
}

export function newApplyId(): string {
  return `apply_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
