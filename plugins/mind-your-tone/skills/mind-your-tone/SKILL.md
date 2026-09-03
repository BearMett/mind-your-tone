---
name: mind-your-tone
description: Show local prompt-rudeness scores or publish a masked result to the Mind Your Tone leaderboard.
---

# Mind Your Tone

Use `${CLAUDE_PLUGIN_ROOT}/scripts/mind-your-tone.py`.

- For the latest result, run `preview`; for recent results, run `history`.
- Never read the SQLite database directly. These commands intentionally omit raw prompts.
- Publishing is two steps: run `publish [id]` first and show the user the exact JSON preview. Stop if masking missed sensitive text.
- Only after the user explicitly approves that preview, run `publish --confirm [id]`.
- Never request, print, or commit tokens. Login is not required; the client performs a small proof of work.
