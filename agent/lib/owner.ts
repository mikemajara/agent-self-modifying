import type { SessionContext } from "eve/context";

export interface CallerScope {
  tenantId: string;
  userId: string;
  isOwner: boolean;
  channel?: string;
}

function attrString(
  attributes: Readonly<Record<string, string | readonly string[]>> | undefined,
  key: string,
): string | undefined {
  const value = attributes?.[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

export function resolveCaller(ctx: SessionContext): CallerScope | null {
  const caller = ctx.session.auth.current;
  if (!caller || caller.principalType !== "user") return null;

  const tenantId =
    attrString(caller.attributes, "tenantId") ??
    process.env.AGENT_TENANT_ID ??
    "default";
  const isOwner = attrString(caller.attributes, "isOwner") === "true";
  const channel = attrString(caller.attributes, "channel");

  return {
    tenantId,
    userId: caller.principalId,
    isOwner,
    channel,
  };
}

export function requireCaller(ctx: SessionContext): CallerScope {
  const scope = resolveCaller(ctx);
  if (!scope) {
    throw new Error("An authenticated user is required.");
  }
  return scope;
}

export function requireOwner(ctx: SessionContext): CallerScope {
  const scope = requireCaller(ctx);
  if (!scope.isOwner) {
    throw new Error(
      "Only the linked owner may use mutation, Git, or deploy tools. Unauthorized callers are denied.",
    );
  }
  return scope;
}

export function telegramOwnerUserId(): string | undefined {
  const id = process.env.TELEGRAM_OWNER_USER_ID?.trim();
  return id || undefined;
}
