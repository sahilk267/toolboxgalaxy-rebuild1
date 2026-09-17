# LinkedIn-Style Puzzle Rules Research

## Patches — official LinkedIn Help

Source: [Play Patches game on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a10314037), accessed 2026-08-26.

| Topic | Verified rule or behavior |
|---|---|
| Objective | Complete every shape in a clue grid. |
| Grid coverage | Fill the entire grid without overlapping shapes; every cell belongs to exactly one shape. |
| Clue ownership | Every completed shape contains exactly one clue cell. |
| Clue data | A clue can contain a number (shape size), a shape icon (square, tall rectangle, wide rectangle, or freeform), both, or neither. |
| Input | Drag across cells to draw a shape including the clue; click/tap an existing shape to delete it. |
| Assistance | Hint reveals the next cell or region; Undo reverts the last move; Reset clears the grid. |

**Implementation note.** The official description confirms partition constraints and hint/undo/reset interactions. It does not precisely define the allowed topology for a “freeform” shape, so this remains an open rule to resolve from additional authoritative material before implementation.

## Zip — official LinkedIn Help

Source: [Play Zip game on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a7445030), accessed 2026-08-26.

| Topic | Verified rule or behavior |
|---|---|
| Objective | Draw one path through the grid, connecting numbered cells sequentially and filling every cell. |
| Number order | The path begins at 1 and passes numbered cells in increasing order. |
| Walls | Bold vertical or horizontal lines between cells cannot be crossed. |
| Input | Click/tap-and-hold the 1 cell, then draw; click/tap/drag back to a cell to erase path segments. |
| Assistance | Hint erases to the first mistake and reveals the next correct step; Undo reverts the last move; Clear resets the grid. |

**Implementation note.** A faithful local version needs Hamiltonian-path validation with required ordered waypoints and blocked directed edges. It must support live backtracking rather than accepting disjoint path segments.

## Mini Sudoku — LinkedIn game evidence

Sources: [Mini Sudoku game page](https://www.linkedin.com/games/mini-sudoku) and LinkedIn’s [Mini Sudoku how-to-play post](https://www.linkedin.com/posts/minisudoku-game_how-to-play-mini-sudoku-activity-7379409304770039808-Gc8-), accessed 2026-08-26. The direct game route did not render publicly in this session, so the public LinkedIn post is the detailed rule evidence.

| Topic | Verified rule or behavior |
|---|---|
| Board | 6×6 grid. |
| Symbols | Digits 1–6. |
| Completion | Every row, column, and shaded box contains all six digits without repetition. |
| Regions | Public rule summaries identify 3×2 shaded regions. |

**Implementation note.** The local version should use a 6×6 constraint solver with row, column, and 2-row × 3-column box checks. It should not reuse a generic 9×9 Sudoku validator.

Additional official source: [Mini Sudoku how-to-play tutorial](https://www.linkedin.com/posts/minisudoku-game_how-to-play-mini-sudoku-activity-7379409304770039808-Gc8-), accessed 2026-08-26. The tutorial confirms values 1–6 occur exactly once in every row, column, and shaded box; it demonstrates single-missing-value deduction and describes a highlight-sections tool that helps inspect a candidate’s row, column, and region.

## Shared LinkedIn delivery context

Source: [Games on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a6863543), accessed 2026-08-26.

LinkedIn describes its games as daily, thinking-oriented puzzles and states that new editions release at midnight Pacific Time. Toolbox Galaxy will retain browser-local date-based deterministic boards instead of mirroring LinkedIn’s schedule, identity, leaderboards, or network features.

## Daily editions, assistance, and local audio controls

The current [Games on LinkedIn Help page](https://www.linkedin.com/help/linkedin/answer/a6863543) confirms that LinkedIn positions the games as daily thinking puzzles and releases new puzzles at midnight Pacific Time. The current [Zip Help page](https://www.linkedin.com/help/linkedin/answer/a7445030) specifically states that a new puzzle for each game releases daily and specifies the assistance pattern: a hint removes the path through the first mistake and reveals the next correct step, Undo reverts the last move, and Clear resets the board.

Toolbox Galaxy will not copy that release schedule or fetch external editions. Instead, it derives a deterministic **local-date edition ID** from the visitor device date and selects one independently authored bundled board whose solution and reasoning topology are distinct and solver-verified. Rotations, reflections, theme swaps, or assistance can support presentation but are not described as fresh boards. The `calm`, `standard`, or `dense` label describes an authored local board band rather than claiming LinkedIn difficulty parity. All six games—Mini Sudoku, Zip, Tango, Queens, Patches, and Wend—meet this bank standard. Queens’ standard is a distinct connected region map plus a distinct non-touching queen arrangement; Patches’ standard is a distinct non-symmetry-equivalent rectangle partition plus a distinct clue/shape layout; Wend’s is a distinct five-word set plus a non-symmetry-equivalent orthogonal exact-cover path topology—not a recolored, reflected, or orientation-only field.

The local **Weekly Streak Calendar** is therefore an audit view of real browser-local successes, not a copied release schedule or engagement counter. It derives its marks only from existing completed Mini Sudoku, Zip, Tango, Queens, Patches, and Wend edition keys for device-local dates already reached. The accompanying six-card Personal Best overview applies a stricter authored-bank check to each full edition ID, then reports only distinct completed editions and local-date runs; it is an independent local activity summary, not a copied LinkedIn profile, ranking, speed table, or achievement system. The optional `All fields` or individual-game scope and `Grid` or `Timeline` arrangement are only in-memory lenses over that same verified record; they recalculate or rearrange the identical visible markers and streak figures without saving a choice or sending any activity. Once a qualifying local summary exists, a visitor may explicitly share, copy, or download a plain-text statement of only the visible calendar range, selected scope, and derived streak/day/field totals; it excludes keys, IDs, board layouts, and any person-level data. Route opens, demo playback, a reflection/orientation, legacy fixed-board records, and future-dated local data never count; several completed genuine editions on one day remain one verified calendar day. No streak or activity data leaves the browser automatically.

For browser audio, MDN documents that audible media and Web Audio are generally subject to autoplay blocking until a visitor interaction, and recommends explicit user controls.[^mdn-autoplay] [^mdn-web-audio] The Toolbox Galaxy implementation will therefore store a browser-local sound preference, but will create/resume audio and begin an optional low-volume music loop only from a visible player click. Music is not started by navigation, demo playback, or background timers.

## Tango — official LinkedIn Help

Source: [Play Tango game on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a6861672), accessed 2026-08-26.

| Topic | Verified rule or behavior |
|---|---|
| Symbols | Each cell is either a sun or moon; LinkedIn may theme the two symbol families differently on some days. |
| Balance | Every row and column has equal counts of the two symbol types. |
| Run rule | No horizontal or vertical run may contain more than two identical symbols. |
| Equality marker | Adjacent cells linked by `=` have the same symbol. |
| Difference marker | Adjacent cells linked by `×` have different symbols. |
| Assistance | Hint shows a forced cell or flags wrong placement; optional auto-check flags violated cells; Undo and Clear are available. |

**Implementation note.** A faithful local Tango solver must validate all four constraint families incrementally: binary values, line balance, maximum pair runs, and adjacent equality/difference relations. It should permit themed rendering but keep the binary model independent of emoji artwork.

## Queens — official LinkedIn Help

Source: [Play Queens game on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a6269510), accessed 2026-08-26.

| Topic | Verified rule or behavior |
|---|---|
| Objective | Place exactly one Crown/Queen in every row, column, and colored region. |
| Adjacency | Two Crowns cannot occupy adjacent cells, including diagonals. |
| Cell states | Click/tap cycles empty → marked-elimination symbol → Crown. |
| Assistance | Hint identifies a forced/incorrect region; optional auto-check flags excess Crowns; optional auto-place marks invalid cells; Undo and Clear are available. |

**Implementation note.** The correct core model is a constrained region assignment: one selected cell per row, column, and region, with Chebyshev-distance-one conflicts disallowed. Player marking is a separate, non-solution state and must never be conflated with a Queen.

## Wend — official LinkedIn Help

Source: [Play Wend game on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a6565995), accessed 2026-08-26.

| Topic | Verified rule or behavior |
|---|---|
| Identity | Wend is a word-finding grid game, not a variation of any other named puzzle. |
| Movement | A word traces horizontally or vertically adjacent letters only; no diagonal joins. |
| Exact cover | Every letter is used exactly once, and words cannot overlap. |
| Clues | Empty answer rows communicate how many words to find and the length of each word. |
| Submission | Drag an adjacent-letter sequence and release; correct words fill a matching answer row and stay highlighted; incorrect selections remain highlighted but do not fill a row. |
| Assistance | Hint removes mistakes or reveals the next correct letter; Undo reverts the previous move; Reset clears the board. |

**Implementation note.** The valid solution is an exact cover of the letter grid by a fixed local dictionary/answer set. Each target word needs at least one orthogonal path; a selected path cannot reuse a tile and completion requires all target words and all tiles.

## Patches freeform clue — additional official evidence

Source: LinkedIn Patches tutorial post, [“Meet Patches”](https://www.linkedin.com/posts/patches-game_patches-linkedingames-activity-7440290974368473088-OdOE), accessed 2026-08-26.

The page transcript describes the remaining freeform clue as a “very nice 8 cell shape,” which confirms that Patches is not limited to rectangular regions when a freeform clue is present. The exact allowable topology is not fully specified in the published rule text; a local implementation should therefore define and disclose its allowed freeform polyomino contract rather than falsely claiming byte-for-byte parity with an unpublished generator.

## Patches geometry clarification — LinkedIn announcement

Source: [LinkedIn Announces Patches](https://news.linkedin.com/2026/LinkedIn-Announces-Patches-A-New-Thinking-Oriented-Game-Inspired-by-Zip/LinkedIn-Announces-Patches-A-New-Thinking-Oriented-Game-Inspired-by-Zip), accessed 2026-08-26.

LinkedIn’s announcement explicitly describes Patches as filling the board “with rectangles and squares” from preset clues, with no overlap or gaps. For the Toolbox Galaxy edition, all patches will therefore be axis-aligned rectangles; `square`, `wide`, and `tall` constrain aspect ratio, while an unconstrained/free clue permits any axis-aligned rectangle. This transparent local contract avoids inventing an unsupported arbitrary-polyomino mechanic.

[^mdn-autoplay]: [MDN — Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), accessed 2026-08-26.
[^mdn-web-audio]: [MDN — Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), accessed 2026-08-26.
