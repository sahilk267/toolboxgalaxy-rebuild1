# ToolboxGalaxy — Deep Gameplay Playability Audit

**Audit date:** 11 November 2026
**Source:** React/Vite repo, `feat/games-upgrade-phase` after game upgrade PR #21
**Implementation PR:** https://github.com/sahilk267/toolboxgalaxy-rebuild1/pull/22
**Target:** `feat/browser-ai-background-remover` (user's working branch)
**Status:** Development/review candidate. No production merge or Hostinger action.

## Executive findings: why games felt broken

The prior game QA confirmed routes, rules, build and basic control rendering, **not** a guaranteed beginner playtime. The following findings come from actual source inspection rather than assuming a visual route smoke proves gameplay quality.

| Severity | Game | Confirmed original mechanism | Implemented correction |
| --- | --- | --- | --- |
| P0 | Diep Tank Arena | Immediately starts the frame loop, instantiates eight bots with up to **32,000 initial score**, player is randomized around the aggressive central nest; high-score dependency changed the parent's callbacks, causing canvas effect to dispose/recreate the entire game when the high score advanced | Explicit Start/Pause with difficulty, safe outer player placement, three low-level bots scaling to eight, opponent separation, first 8/12/16s fatal-protection by difficulty, **stable callback identity**, no page-reload restart |
| P0 | Surviv Battle Royale | Constructor immediately starts the match with **29 armed bots**, without a human-to-bot minimum separation. Bot detection up to 550 game units, movement 210, firing allowed immediately | Constructor is inert until Start button, bots prefer >=480-unit human clearance, new 8/12/16s player shield, staggered AI think timers, progressive pursuit speed, reduced early weapon cadence, real Pause and in-place restart |
| P0 | Krunker FPS | Three.js combat clock and bot AI run before any pointer-lock user action, while an opaque start overlay hides gameplay. Bots with unobstructed aim **always damage the player** on every visual shot, irrespective of the visual spread. Short 2s spawn protection, bots may spawn at/near the human | Suspend engine until genuine user start and when pointer lock is lost, difficulty choice, smooth bot speed/cadence, actual probability of missing (reduces with movement/range), longer initial and respawn protections, spawn away from live bots, mobile no-lock path |
| P1 | Orbit Dash | Gate spawned immediately, travelled at constant 4.35 units/s from x=8.2 toward player x=-4.6; fixed 2.05s spawn interval and full oscillating gaps from the beginning | First spawn delayed, 8/12/16s grace, first gates slower and closer to center, ramp gate speed/frequency/offset over time, difficulty choice and honest instructions |
| P1 | Puzzle UI | Multiple puzzle screens force `h-screen max-h-screen overflow-hidden`; small touch viewports could clip action buttons, hint panels or number keypad with no way to scroll | Mobile first: `min-h-[100dvh]` and scrolling, preserve single-screen desktop layouts |
| P2 | Puzzle timer | Common logic puzzles used interval-based timer, did not always reset the underlying time anchor on board reset | Reset anchor with board reset, visible-only active time from previous game PR |
| P2 | Logic Lab | Practice and category discovery absent from basic catalog | Previous PR #21 adds three seeded practice puzzles, undo/hints and discovery; included through PR #22 base history |

## Difficulty curve contract

The three options are intentionally nonrandom pressure profiles—not just text labels.

| Difficulty | Initial damage protection | Pressure reaches full target | Audience |
| --- | --- | --- | --- |
| Easy | 16 seconds | ~161 seconds | First-time keyboard/touch players |
| Normal (default) | 12 seconds | ~127 seconds | Casual play with progressive challenge |
| Hard | 8 seconds | ~96 seconds | Returning players |

`client/src/game/playability.ts` is the single source of truth, including safe-spawn geometry, Diep bot count, Krunker bot hit probability, and Orbit gate pace. Ease-in/ease-out pressure grows smoothly after the protected interval. The live game clocks do not advance while the relevant game's tab is hidden or manually paused.

**Important:** early protection means no lethal incoming damage while it is active; it is not an immortal mode for the whole match. After the grace period, player movement, skill, enemies and later difficulty still determine survival. A 12s window is an onboarding baseline, not a guaranteed 12s win.

## Coverage of all catalog entries

**13 puzzle routes:** Strands, The Hive, Connections, Wordle/Lexicon, Queens, Mini Sudoku, Tango, Patches, Zip, Wend, Chess Puzzles, Nonogram and Mini Crossword. Their rule validators stay unchanged. 12 use the fixed-height shared/puzzle screens that now scroll on small viewports; Strands already uses a naturally scrollable minimum-height layout.

**4 arcade routes:** Orbit Dash, Diep Tank Arena, Surviv Battle Royale, Krunker Voxel FPS. Gameplay progression and manual Start screens explicitly improved in this PR.

**1 logic hub:** Logic Lab remains the game navigator and practice generator from PR #21. It should not count as a separate combat game.

## Automated verification and acceptance criteria

- `scripts/verify-gameplay-safety.ts` imports **actual production Diep/Surviv engines**. It tests stopped initial state, fresh spawn separation, opponent levels, first-seconds lethal suppression, and lethality after grace. Also tests monotonic easing, per-difficulty duration, Krunker hit/miss probability and Orbit gate pacing.
- `scripts/verify-precision-repairs.ts` retains Diep lethal environmental collision assertions **after grace**; the new regression suite separately verifies early-game protection. No old damage bug coverage removed.
- `scripts/verify-arcade-playability-browser.mjs` exercises real built browser routes, visible Start/Pause/difficulty UI, no premature death through the early play window, plus 12 puzzle URLs at 375×590 viewport for scroll/reachable action controls.
- `scripts/verify-games-upgrade-browser.mjs` from PR #21 still covers all puzzle and arcade route smoke, practice tools, and zero uncaught React page errors.
- `.github/workflows/arcade-playability.yml`: locked dependency install, TypeScript + all regression suites, full production build, actual Chromium interaction.
- Existing advanced tools checks are intentionally still required; gameplay changes must not break unrelated tools.

## Remaining limitations and honest boundaries

- Human playtesting, Android/iOS touch gestures, Safari/Firefox, low-end phones, GPU performance, production Hostinger and staging deployment were **not** completed.
- Krunker AI now has a fair movement/range-sensitive hit chance; it is still not a fully simulated network shooter with true ballistic body/limb hitboxes.
- Diep's legacy movement and projectile integrator has frame-dependent behavior; this patch prioritizes protection and progression without destabilizing physics. Further 60/30 FPS consistency measurement is a separate focused task.
- Surviv bots still share a simplified nearest-target combat model; a truly tactical looting/flanking AI and elaborate NPC progression would need a separate gameplay design/benchmark cycle.
- There is no external multiplayer server, paid gameplay service, global leaderboard or real network opponent mode introduced.
- A safe-spawn algorithm retries up to 150 obstacle-valid candidates then selects the farthest valid fallback; if extreme map crowding prevents full separation it cannot promise impossible geometries. Automated generated-map checks track this.
- No claims that arbitrary game behavior is flawless. CI/browser checks certify the exact scenarios in their scripts, not every gameplay path or physical device.

## Integration

PR #21 was left unmerged because the user identified gameplay blockers. PR #22 carries its puzzle/Logic Lab upgrades **plus** the new safety fixes and targets the working branch directly; it is intended to supersede #21 after all checks are green. Do not merge both overlapping PRs, and do not push hosting changes.
