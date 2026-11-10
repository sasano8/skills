import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, lstatSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { syncReferences } from "../sync-references.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "shared-references-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const plugin = join(root, "plugins", "sample");
  const skill = join(plugin, "skills", "sample-task");
  mkdirSync(skill, { recursive: true });
  writeFileSync(join(plugin, "reference.md"), "# Shared rules\n");
  writeFileSync(join(skill, "SKILL.md"), "Instructions\n");
  return { root, plugin, skill };
}

test("replaces legacy links without changing the source; repeat runs are stable", (t) => {
  const { root, plugin, skill } = fixture(t);
  const destination = join(skill, "reference.md");
  symlinkSync("../../reference.md", destination);
  assert.equal(syncReferences(root).length, 1);
  assert.ok(lstatSync(destination).isFile());
  assert.equal(readFileSync(join(plugin, "reference.md"), "utf8"), "# Shared rules\n");
  assert.match(readFileSync(destination, "utf8"), /Do not edit this copy/);
  assert.deepEqual(syncReferences(root), []);
  assert.deepEqual(syncReferences(root, { check: true }), []);
});

test("check detects missing, edited and stale copies without repairing them", (t) => {
  const { root, plugin, skill } = fixture(t);
  const destination = join(skill, "reference.md");
  assert.equal(syncReferences(root, { check: true }).length, 1);
  syncReferences(root);
  writeFileSync(destination, "Local edit\n");
  assert.equal(syncReferences(root, { check: true }).length, 1);
  assert.equal(readFileSync(destination, "utf8"), "Local edit\n");
  syncReferences(root);
  writeFileSync(join(plugin, "reference.md"), "# Updated rules\n");
  assert.equal(syncReferences(root, { check: true }).length, 1);
  assert.doesNotMatch(readFileSync(destination, "utf8"), /Updated rules/);
  syncReferences(root);
  assert.match(readFileSync(destination, "utf8"), /Updated rules/);
});

test("unrelated links abort before any copies are written", (t) => {
  const { root, plugin, skill } = fixture(t);
  writeFileSync(join(root, "unrelated.md"), "Keep me\n");
  symlinkSync(join(root, "unrelated.md"), join(skill, "reference.md"));
  const other = join(plugin, "skills", "another-task");
  mkdirSync(other);
  writeFileSync(join(other, "SKILL.md"), "Instructions\n");
  assert.throws(() => syncReferences(root), /unrelated symlink/);
  assert.equal(readFileSync(join(root, "unrelated.md"), "utf8"), "Keep me\n");
  assert.throws(() => lstatSync(join(other, "reference.md")), { code: "ENOENT" });
});

test("CLI check fails on stale copies and works outside the repository directory", (t) => {
  const { root } = fixture(t);
  const script = join(root, "sync-references.mjs");
  writeFileSync(script, readFileSync(new URL("../sync-references.mjs", import.meta.url)));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], {
    cwd: tmpdir(), encoding: "utf8",
  });
  const stale = run("--check");
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Run make sync-references/);
  assert.equal(run().status, 0);
  assert.equal(run("--check").status, 0);
  assert.equal(run("--unknown").status, 1);
});
