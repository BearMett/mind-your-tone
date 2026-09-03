import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const script = resolve("plugins/mind-your-tone/scripts/mind-your-tone.py");

test("hook scores a courteous insult and unlocks fixed titles", () => {
  const home = mkdtempSync(join(tmpdir(), "mind-your-tone-"));
  const env = { ...process.env, MIND_YOUR_TONE_HOME: home, CODEX_THREAD_ID: "test" };
  try {
    const hook = execFileSync("python3", [script, "hook"], {
      env, input: JSON.stringify({ prompt: "정말 대단하시네요. 다시 제대로 해주시겠어요?", session_id: "test" }), encoding: "utf8",
    });
    const output = JSON.parse(hook);
    assert.equal(output.hookSpecificOutput.hookEventName, "UserPromptSubmit");
    const id = output.hookSpecificOutput.additionalContext.match(/[0-9a-f-]{36}/)?.[0];
    assert.ok(id);
    const result = execFileSync(script, ["score", id, "95", "95", "courteous"], { env, encoding: "utf8" });
    assert.match(result, /Tone Score — 95 · 극존칭 폭군/);
    assert.match(result, /존댓말 암살자/);
    assert.match(result, /공개 후보/);
    const collection = execFileSync(script, ["collection"], { env, encoding: "utf8" });
    assert.match(collection, /극존칭 폭군/);
    const control = execFileSync("python3", [script, "hook"], { env, input: '{"prompt":"공유해줘"}', encoding: "utf8" });
    assert.equal(control, "");
  } finally {
    rmSync(home, { recursive: true });
  }
});
