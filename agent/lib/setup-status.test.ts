import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { setupReport } from "./setup-status.ts";

describe("setup-status", () => {
  it("returns checks without secret values", () => {
    const report = setupReport();
    assert.ok(Array.isArray(report.checks));
    assert.ok(report.checks.length >= 5);
    const blob = JSON.stringify(report);
    assert.equal(blob.includes("sk-"), false);
    assert.ok(report.mcpHints.length > 0);
    for (const check of report.checks) {
      assert.ok(check.id);
      assert.equal(typeof check.ok, "boolean");
      assert.ok(check.summary);
    }
  });
});
