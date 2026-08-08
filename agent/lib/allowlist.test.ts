import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPathAllowed, normalizeRepoPath } from "./allowlist.ts";

describe("allowlist", () => {
  it("allows skills, instruction markdown, and config", () => {
    assert.equal(isPathAllowed("agent/skills/foo/SKILL.md").allowed, true);
    assert.equal(isPathAllowed("agent/instructions/00-identity.md").allowed, true);
    assert.equal(isPathAllowed("agent/config/personality.md").allowed, false);
    assert.equal(isPathAllowed("config/personality.md").allowed, true);
  });

  it("denies tools, lib, channels, instruction ts, package manifests", () => {
    assert.equal(isPathAllowed("agent/tools/remember.ts").allowed, false);
    assert.equal(isPathAllowed("agent/lib/owner.ts").allowed, false);
    assert.equal(isPathAllowed("agent/channels/telegram.ts").allowed, false);
    assert.equal(isPathAllowed("agent/instructions/memory.ts").allowed, false);
    assert.equal(isPathAllowed("package.json").allowed, false);
  });

  it("rejects path traversal", () => {
    assert.throws(() => normalizeRepoPath("../secrets"));
  });
});
