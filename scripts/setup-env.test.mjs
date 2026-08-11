import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { updateEnvFile } from "./setup-env.mjs";

describe("setup env file", () => {
  it("updates placeholders, preserves other content, and restricts permissions", () => {
    const directory = mkdtempSync(join(tmpdir(), "agent-setup-env-"));
    const path = join(directory, ".env.local");
    writeFileSync(path, "# Keep me\nTOKEN=\nOTHER=value\n", { mode: 0o644 });

    updateEnvFile(path, { TOKEN: "secret value", NEW_VALUE: "safe-value" });

    const text = readFileSync(path, "utf8");
    assert.match(text, /^# Keep me$/m);
    assert.match(text, /^TOKEN="secret value"$/m);
    assert.match(text, /^OTHER=value$/m);
    assert.match(text, /^NEW_VALUE=safe-value$/m);
    assert.equal(statSync(path).mode & 0o777, 0o600);
  });
});
