import { loadAgentSpec } from "./agent-spec.ts";

/** Normalize to POSIX-style relative paths without leading ./ or /. */
export function normalizeRepoPath(input: string): string {
  const cleaned = input.replaceAll("\\", "/").replace(/^\.\/+/, "").replace(/^\/+/, "");
  if (!cleaned || cleaned.includes("\0")) {
    throw new Error("Invalid path.");
  }
  const parts: string[] = [];
  for (const part of cleaned.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      throw new Error("Path traversal is not allowed.");
    }
    parts.push(part);
  }
  return parts.join("/");
}

function matchGlob(path: string, pattern: string): boolean {
  let i = 0;
  let re = "^";
  while (i < pattern.length) {
    if (pattern.startsWith("**/", i)) {
      re += "(?:.*/)?";
      i += 3;
      continue;
    }
    if (pattern.startsWith("**", i)) {
      re += ".*";
      i += 2;
      continue;
    }
    if (pattern[i] === "*") {
      re += "[^/]*";
      i += 1;
      continue;
    }
    const ch = pattern[i]!;
    if ("+.^${}()|[]\\".includes(ch)) {
      re += `\\${ch}`;
    } else {
      re += ch;
    }
    i += 1;
  }
  re += "$";
  return new RegExp(re).test(path);
}

export function isPathAllowed(inputPath: string): { allowed: boolean; path: string; reason?: string } {
  const path = normalizeRepoPath(inputPath);
  const { mutation } = loadAgentSpec();

  for (const deny of mutation.denylist) {
    if (matchGlob(path, deny)) {
      return { allowed: false, path, reason: `Path is denylisted (${deny}).` };
    }
  }

  for (const allow of mutation.allowlist) {
    if (matchGlob(path, allow)) {
      return { allowed: true, path };
    }
  }

  return {
    allowed: false,
    path,
    reason: "Path is outside the V1 mutable allowlist (skills, instructions.md, config).",
  };
}

export function assertPathAllowed(inputPath: string): string {
  const result = isPathAllowed(inputPath);
  if (!result.allowed) {
    throw new Error(result.reason ?? "Path not allowed.");
  }
  return result.path;
}

export function listAllowlist(): string[] {
  return [...loadAgentSpec().mutation.allowlist];
}
