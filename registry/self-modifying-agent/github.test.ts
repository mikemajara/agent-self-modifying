import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mutableRepositoryPath, normalizeRepositoryPath } from "./github.ts";

describe("registry GitHub mutation policy", () => {
  it("allows owned behavior files", () => {
    assert.equal(mutableRepositoryPath("agent/skills/tone/SKILL.md"), true);
    assert.equal(mutableRepositoryPath("agent/instructions/personality.md"), true);
    assert.equal(mutableRepositoryPath("config/personality.md"), true);
  });

  it("protects governance and executable source", () => {
    assert.equal(mutableRepositoryPath("agent/instructions/self-modifying.md"), false);
    assert.equal(mutableRepositoryPath("agent/skills/safety-policy/SKILL.md"), false);
    assert.equal(mutableRepositoryPath("agent/skills/self-improvement/SKILL.md"), false);
    assert.equal(mutableRepositoryPath("agent/tools/escape.ts"), false);
    assert.equal(mutableRepositoryPath("package.json"), false);
  });

  it("rejects traversal and malformed paths", () => {
    assert.equal(normalizeRepositoryPath("../secrets"), undefined);
    assert.equal(normalizeRepositoryPath("agent//instructions.md"), undefined);
  });
});
