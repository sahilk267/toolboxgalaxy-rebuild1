# Games Upgrade Phase — Review and Release Notes

**Source branch:** `feat/games-upgrade-phase`
**Review PR:** https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/21
**Target branch:** `feat/browser-ai-background-remover`
**Scope:** Games only. Do not modify Hostinger, the main branch, or unrelated tools in this PR.
**Status:** Ready for Review, **not merged** or independently deployed. All five required GitHub workflows passed on the full implementation candidate; verify green checks again on the newest HEAD after final documentation and timer-precision changes.

## What was implemented

### Puzzle Games (13)
- Six rule-based games in `LogicPuzzle.tsx` — Mini Sudoku, Queens, Tango, Patches, Zip and Wend — now reset the elapsed clock when a board is restarted and exclude time spent in hidden tabs.
- Seven additional games — Strands, Hive, Connections, Wordle, Mini Crossword, Chess Puzzles and Nonogram — use one shared active-play timer with hidden-tab pause semantics. Hive's victory modal pauses its timer.
- The original verified daily puzzle banks, challenge rules, scoring and completion flags are preserved; no silent overwrite of daily score/streak data.
- Logic Lab now exposes all 13 puzzle modules (including previously omitted Mini Crossword), search and word/number/spatial category filters.

### Real Logic Lab Practice Generator (3 game families)
- Seeded, reproducible local puzzles for Mini Sudoku, Queens and Tango using **symmetry transformations of verified uniquely solvable authored editions**, not speculative random clue layouts.
- Calm, Standard, Dense settings choose corresponding existing edition difficulty; seeded transformations preserve the rules.
- Sudoku randomizes digits, swaps complete row bands/column stacks and positions within permitted 2x3 boxes. Transposition is explicitly prohibited because it would change box geometry.
- Queens rotates/mirrors board regions, maintaining column/row uniqueness and non-touching crowns.
- Tango rotates/mirrors clue board, rotates/mirrors relation endpoints, and can invert moon/sun while keeping equality constraints; relation clues are shown to the player.
- Interactive 6x6 board, keyboard actions, Sudoku keypad, undo (last 50), verified hint reveals, reset and rule/conflict status. Practice is entirely browser-local and **does not earn daily streak completion**.
- Seed constraints: ASCII letters, numbers, hyphen/underscore, 1–64 characters. Replaying the same kind, difficulty and seed yields the same board.

### Arcade/3D Games (4)
- **Orbit Dash:** prevent accidental run start from mouse hover, do not hijack browser shortcuts in text fields, clear held movement keys after window focus loss, sanitize corrupt saved high scores, stop Babylon render loop in hidden tabs, show visible WebGL initialization failure message.
- **Diep Tank Arena:** suspend active simulation when browser tab is hidden, clear mouse/keyboard/touch states and safely resume only if it was playing.
- **Surviv Battle Royale:** same simulation suspension, plus stop high-DPI canvas requestAnimationFrame entirely in hidden tabs; preserve end-of-match stop guard.
- **Krunker Voxel FPS:** hidden tabs suspend match clock, bot updates, collision/damage and weapon physics; resume resets performance time anchor so there is no catch-up simulation burst. Keyboard/mouse flags cleared on blur.

## Automated verification
- Full `npm run check` includes existing game banks/solvers and `scripts/verify-game-practice.ts` (72 real generated puzzle boards, unique-solution and clock assertions). Implementation candidate passed **2,153 assertions across 72 generated fields**, TypeScript and production build: https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42997527028.
- `.github/workflows/games-upgrade-browser.yml` launches the actual production bundle in Chromium. The full implementation candidate passed **58 Chromium assertions** for practice, keyboard, undo, hints, seed, search, all 13 puzzle routes and four arcade entry routes: https://github.com/sahilk267/toolboxgalaxy-rebuild1/actions/runs/42997527175.
- Existing CI and advanced tools browser workflows continue running on the PR.
- A successful browser route launch is **not** evidence that every gameplay mechanic, puzzle ending, GPU feature or touch input was exercised.

## Out-of-scope and release risks
- Hostinger/deployment, production verification, and manual/real-device testing are intentionally excluded by the user's instruction.
- Firefox, Safari, actual mobile touch, iPhone/Android graphics, low-end GPU frame rate and cross-device session restoration remain unverified.
- Gameplay AI/collision algorithms in Diep/Surviv/Krunker are not redesigned unless a reproducible engine defect is found. The improvements focus on measurable lifecycle fairness and UI behavior.
- Any future `main` synchronization (older PR #15) requires separate controlled review. Avoid blindly replacing game/Excel source branches.

## Review checklist
1. All required full CI and Games Chromium jobs must succeed on **final HEAD**, not an older commit.
2. Compare PR's changed files against this scope; preserve old daily banks/rules/URLs.
3. Keep the change as a PR until the user explicitly approves merge.
