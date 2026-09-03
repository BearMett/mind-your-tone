---
name: mind-your-tone
description: Show Tone Scores and unlocked titles, or publish a scored prompt to the Mind Your Tone leaderboard.
---

# Mind Your Tone

Use `${CLAUDE_PLUGIN_ROOT}/scripts/mind-your-tone.py`.

- For the latest scored result, run `preview`; for recent results, run `history`; for unlocked titles, run `collection`.
- Never read the SQLite database directly. These commands intentionally omit raw prompts.
- Never reveal `receiverScore` or `judgeScore`; show only the combined Tone Score, tone title, and public prompt preview.
- When the user explicitly says `공유해줘` or otherwise clearly asks to publish, run `publish --confirm [id]`. With no id, it selects the latest scored prompt and ignores the share command itself.
- If publishing stops because sensitive values were masked, show the exact preview and ask once. After approval, run `publish --confirm --confirm-sensitive [id]`.
- Do not ask for a second confirmation when the first publish succeeds.
- Never request, print, or commit tokens. Login is not required; the client performs a small proof of work.
