import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { maskText, validateEntry, verifyProof } from "../api/rankings.js";

test("validates and scores a ranking entry", () => {
  const result = validateEntry({
    id: "turn-0001", displayName: "BearMett", promptPreview: "이것도 아직 안 됐어?",
    source: "codex", receiverScore: 80, judgeScore: 65,
  });
  assert.equal(result.value.score, 73);
  assert.equal(result.value.displayName, "BearMett");
});

test("rejects invalid scores and sources", () => {
  const base = { id: "turn-0001", displayName: "x", promptPreview: "x", receiverScore: 1, judgeScore: 1 };
  assert.match(validateEntry({ ...base, source: "other" }).error, /source/);
  assert.match(validateEntry({ ...base, source: "codex", receiverScore: 101 }).error, /scores/);
});

test("masks sensitive text and verifies recent proof of work", () => {
  assert.equal(maskText("kim@example.com /Users/kim/secret token=abc"), "[EMAIL] [HOME]/secret token=[SECRET]");
  const id = "turn-0001";
  const timestamp = 1_800_000_000;
  let nonce = 0;
  while (!createHash("sha256").update(`${id}:${timestamp}:${nonce}`).digest("hex").startsWith("0000")) nonce++;
  assert.equal(verifyProof(id, { timestamp, nonce }, timestamp * 1000), true);
  assert.equal(verifyProof(id, { timestamp, nonce }, (timestamp + 301) * 1000), false);
});
