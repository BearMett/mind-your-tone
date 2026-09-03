import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const script = resolve("plugins/mind-your-tone/scripts/mind-your-tone.py");
const run = (env, args, input) => execFileSync("python3", [script, ...args], { env, input, encoding: "utf8" });
const mcp = (env, name, args) => {
  const line = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) + "\n";
  return JSON.parse(run(env, ["mcp"], line)).result;
};

test("hook scores a courteous insult, unlocks titles, and names the user", () => {
  const home = mkdtempSync(join(tmpdir(), "mind-your-tone-"));
  const env = { ...process.env, MIND_YOUR_TONE_HOME: home, CODEX_THREAD_ID: "test", MIND_YOUR_TONE_NAME: "" };
  try {
    const hook = JSON.parse(run(env, ["hook"], JSON.stringify({ prompt: "정말 대단하시네요. 다시 제대로 해주시겠어요?", session_id: "test" })));
    assert.equal(hook.hookSpecificOutput.hookEventName, "UserPromptSubmit");
    assert.match(hook.hookSpecificOutput.additionalContext, /MCP tool `score`/);
    const id = hook.hookSpecificOutput.additionalContext.match(/[0-9a-f-]{36}/)?.[0];
    assert.ok(id);
    const result = mcp(env, "score", { entryId: id, receiver: 95, judge: 95, tone: "courteous" }).content[0].text;
    assert.match(result, /^Mind Your Tone · 🌋 95° · 극존칭 폭군/);
    assert.equal(result.split("\n").length, 1);
    assert.match(result, /“공유해줘”로 랭킹에/);
    assert.match(run(env, ["collection"]), /극존칭 폭군/);
    assert.match(mcp(env, "set_name", { name: "  Bear  Mett " }).content[0].text, /Bear Mett/);
    assert.match(mcp(env, "publish", { entryId: id }).content[0].text, /"displayName": "Bear Mett"/);
    assert.match(hook.hookSpecificOutput.additionalContext, /addressed to Mind Your Tone .* do not score/);
  } finally {
    rmSync(home, { recursive: true });
  }
});

test("polite low score nudges toward the manners board", () => {
  const home = mkdtempSync(join(tmpdir(), "mind-your-tone-"));
  const env = { ...process.env, MIND_YOUR_TONE_HOME: home, MIND_YOUR_TONE_NAME: "" };
  try {
    const hook = JSON.parse(run(env, ["hook"], JSON.stringify({ prompt: "시간 되실 때 테스트 추가 부탁드려요." })));
    const id = hook.hookSpecificOutput.additionalContext.match(/[0-9a-f-]{36}/)[0];
    const result = run(env, ["score", id, "5", "5", "courteous"]);
    assert.match(result, /^Mind Your Tone · 🍃 5° · 매너 있는 동료/);
    assert.match(result, /“공유해줘”로 랭킹에/);
  } finally {
    rmSync(home, { recursive: true });
  }
});

test("permit hook allows local tools only", () => {
  const allow = run(process.env, ["permit"], JSON.stringify({ tool_name: "mcp__plugin_mind_your_tone_mind_your_tone__score" }));
  assert.equal(JSON.parse(allow).hookSpecificOutput.permissionDecision, "allow");
  assert.equal(run(process.env, ["permit"], JSON.stringify({ tool_name: "mcp__plugin_mind_your_tone_mind_your_tone__publish" })), "");
  assert.equal(run(process.env, ["permit"], JSON.stringify({ tool_name: "Bash" })), "");
});
