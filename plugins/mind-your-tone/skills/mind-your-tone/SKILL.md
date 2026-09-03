---
name: mind-your-tone
description: Show Tone Scores and unlocked titles, or publish a scored prompt to the Mind Your Tone leaderboard.
---

# Mind Your Tone

Use the tools from the `mind_your_tone` MCP server.

- For the latest scored result, call `preview`; for recent results, call `history`; for unlocked titles, call `collection`.
- Never read the SQLite database directly. These commands intentionally omit raw prompts.
- Never reveal `receiverScore` or `judgeScore`; show only the combined Tone Score, tone title, and public prompt preview.
- When the user clearly asks to publish, share, or post their latest prompt to the leaderboard, in any wording, call `publish` with `confirmed: true`. With no id, it selects the latest scored prompt.
- When the user asks to change how they appear on the leaderboard, call `set_name`.
- If publishing stops because sensitive values were masked, show the exact preview and ask once. After approval, call `publish` with `confirmed: true` and `confirmSensitive: true`.
- Do not ask for a second confirmation when the first publish succeeds.
- Never request, print, or commit tokens. Login is not required; the client performs a small proof of work.
