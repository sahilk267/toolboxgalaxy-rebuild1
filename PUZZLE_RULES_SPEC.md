# Toolbox Galaxy Logic Puzzle Contract

This document defines the **browser-local Toolbox Galaxy editions** of the requested daily logic-puzzle concepts. They are not LinkedIn services or copies of LinkedIn’s daily data. Each edition uses fixed, source-verified mechanics, deterministic boards, independent validation, optional local progress, and no account, API, or leaderboard.

| Puzzle | Board model | Core condition | Primary validation |
|---|---|---|---|
| Patches | 6×6 rectangle partition | Every cell belongs to one clue-owned rectangle | Exact-cover partition search |
| Zip | 5×5 path grid with optional walls | One ordered path covers all cells | Hamiltonian-path validation |
| Mini Sudoku | 6×6, 2×3 boxes | Digits 1–6 occur once per unit | All-different solver |
| Tango | 6×6 binary grid | Balanced lines, no triples, relation markers | Binary constraint solver |
| Queens | 6×6 colored regions | One queen per row, column, region; no touching | Region/row/column adjacency validator |
| Wend | 5×5 letter grid | Target word paths exactly cover tiles | Orthogonal word-path exact cover |

## Shared implementation contract

All puzzle engines are framework-independent TypeScript modules under `client/src/game/logicPuzzles/`. React components only own the HUD, timer, local UI state, and explicit audio consent. Each puzzle definition must include an immutable board, a known solution, a validator, and a `?demo` deterministic playback sequence. The engine must never mutate its initial puzzle definition.

> **Completion rule.** A board is shown as solved only when its own validator confirms every stated constraint. UI state, visual fill, or a guessed answer is never enough by itself.

| Cross-cutting requirement | Contract |
|---|---|
| Input | Click/tap is the baseline; keyboard selection/action parity is supplied for each puzzle. |
| Audio | A single browser-local sound preference applies across all Games Bay routes. Audio contexts and optional music may start only from a visible user gesture; demo mode remains silent. |
| Local state | Only progress, best result, and optional streak date are retained in `localStorage`; no inputs are transmitted. |
| Undo/reset | User moves are stored as immutable snapshots. Reset returns to the original deterministic board. |
| Daily-style boards | A local calendar date chooses a pre-validated bundled edition where a game claims genuine daily freshness. Orientation remains a display transform only; it is never presented as a new board. The local `calm`/`standard`/`dense` label is tied to that authored edition and never fetches a remote challenge. |
| Accessibility | Cells have accessible labels describing coordinates, clue/state, and violation state; color is never the only status indicator. |

## Assistance and local daily-edition contract

The local assistance controls adapt the documented in-game interaction patterns without pretending to mirror any network edition. A hint always uses the already authored verified solution and communicates exactly what it changed; it never queries an external solver or dictionary. Patches reveals one correct region; Zip removes the path after the first incorrect step and reveals the next correct cell; Mini Sudoku reveals one empty value and highlights its row/column/2×3 box; Tango identifies one incorrect/forced cell; Queens identifies one correct queen location or excess queen; and Wend clears an active mistaken trace or reveals the next tile of one unsolved target. Each module also records immutable move snapshots for **Undo**, while Reset restores the date-selected starting state.

Every claimed fresh daily edition is selected deterministically from a device-local `YYYY-MM-DD` ID and a small independently authored bank. Its solution and relevant reasoning topology must be distinct, and it must pass known-solution, mutation, and uniqueness checks before shipping. Rotation, reflection, symbol-theme swap, or opening assistance may improve presentation but cannot by themselves be called a fresh board.

## Weekly local streak calendar contract

The Games Bay calendar is a **derived read-only view** of `toolboxgalaxy:puzzle-completions`; it does not create another progress record or receive player input. It recognizes only edition-specific completion keys for the independently authored Mini Sudoku, Tango, Queens, Patches, Zip, and Wend banks. The `All fields` view can be narrowed for the current page session to one named game. That filter uses the same verified-key parser and recomputes only its date markers, field total, verified days, current streak, and longest streak in memory; it neither writes nor hides invalid data by counting it. A date with one or more qualifying completed fields becomes one verified day; the field total still reports each completed game separately. The `current streak` counts backward from the device-local current date through uninterrupted verified dates, while `longest streak` considers all reached qualifying local dates.

Route navigation, demo completion, a transformed presentation, fixed-board legacy keys, malformed records, and dates later than the device-local date are ignored. The weekly view begins Monday, can move through prior or later weeks without changing storage, and the visible Today control only returns its view offset to the device-local current week. A selected-game historical week without a matching completion states that it has no match rather than implying that the browser record was erased. The same seven `role=listitem` local-day records can be arranged as a Grid map or Timeline log; their selected layout lives only in the component and resets to Grid after a page load. It cannot add, remove, transform, or persist a completion, metric, marker, range, filter scope, or share-payload value. The six-card **Personal Best** overview is another read-only view of the same map: a record qualifies only when its route slug and full edition ID match a bundled authored field and its valid `YYYY-MM-DD` date is not later than the device-local date. It reports distinct authored editions completed out of seven plus current/longest qualifying daily-date runs; it does not claim or infer a solve time, score, player identity, profile, or incomplete-board progress. When one or more qualifying browser-local fields exist for the selected scope, the visitor may explicitly share, copy, or download a text summary containing only the visible range, scope label, current/longest streaks, verified-day total, and field total; it excludes completion keys, edition IDs, paths, grids, identities, and hidden records. `scripts/verify-weekly-logic-streak.ts` asserts the all-fields and selected-field key filters, `scripts/verify-logic-personal-bests.ts` asserts strict six-bank eligibility and edition de-duplication, and `scripts/verify-weekly-logic-share.ts` verifies the stable visible-only text payload; the trusted browser suite verifies the actual pointer/keyboard marker, Grid/Timeline control, reload reset, personal-best link, export fallback, and navigation interactions.

## Patches contract

LinkedIn’s official help requires full non-overlapping coverage and exactly one clue per shape.[^patches-help] LinkedIn’s announcement describes rectangles and squares.[^patches-news] The local edition therefore uses **axis-aligned rectangles only**. `square`, `wide`, and `tall` constrain aspect ratio; `free` means any axis-aligned rectangle, a disclosed local interpretation of the official freeform clue label.

```ts
type PatchClue = {
  cell: Cell;
  area?: number;
  shape?: "square" | "wide" | "tall" | "free";
};
type Patch = { top: number; left: number; height: number; width: number };
```

The validator rejects a patch when it is out of bounds, overlaps an existing patch, includes zero or multiple clue cells, conflicts with its clue’s area/aspect, or leaves a cell uncovered at completion. Solver validation enumerates candidate rectangles per clue and runs exact cover; shipped boards require exactly one solution.

| Required edge case | Expected result |
|---|---|
| Rectangle contains two clues | Reject before placement. |
| Correct area but wrong aspect | Reject before placement. |
| Valid patch overlaps existing patch | Reject before placement. |
| All patches placed with a gap | Remain unsolved. |
| Alternate complete partition | Board is rejected during authoring. |

`patchesBank.ts` contains seven deterministic date-selected 6×6 editions (`Apollo` through `Galileo`). Each owns a distinct exact-cover rectangle solution, freeform clue/area/shape map, clue count, Calm/Standard/Dense authoring band, and recorded solver-search depth. The permanent verifier rejects repeated literal partitions, repeated clue signatures, and any partition equivalent under the eight square symmetries; it also asserts unique exact cover, incomplete-cover failure, clue-area/boundary mutation failure, genuine occupied-rectangle overlap failure, and coverage across seven consecutive device-local dates. Completion storage uses `patches-<edition-id>` plus the local date so results cannot mix between fields.

## Zip contract

Zip needs one path that fills every cell, visits numbered cells in order, and does not cross walls.[^zip-help] The local board stores an ordered `solutionPath`, required numbered waypoints, and blocked adjacent-edge pairs.

```ts
type ZipBoard = {
  rows: number; cols: number;
  numbers: Record<number, Cell>;
  blockedEdges: Edge[];
  solutionPath: Cell[];
};
```

The live path must begin at number 1, add only orthogonally adjacent unvisited cells, respect walls, and never reach a numbered cell before the previous number. Completion requires the path length to equal the grid cell count and the final waypoint sequence to be complete. Drag-back performs legitimate path backtracking; it does not create a branch.

## Mini Sudoku contract

Mini Sudoku is a 6×6 grid with digits 1–6 exactly once in each row, column, and shaded box.[^mini-sudoku-tutorial] The local edition uses 2-row × 3-column boxes and a fixed, independently checked solution.

The validator supports partial play: it marks duplicates in the active row, column, or box but only declares success when all 36 cells are populated and match all all-different constraints. Puzzle authoring removes clues from a solved grid and requires the solver to count exactly one completion.

## Tango contract

Tango requires a binary symbol in every cell, balanced rows/columns, no run of three identical symbols, and `=`/`×` adjacency relations.[^tango-help] The local edition models symbols as `0 | 1`, rendering them as a controlled pair of workbench glyphs.

```ts
type TangoRelation = { a: Cell; b: Cell; relation: "same" | "different" };
```

For a 6-cell line, partial validation rejects counts above three, prevents remaining blanks from making balance impossible, rejects any horizontal/vertical triple, and enforces every completed relation. Shipped boards must be uniquely solvable under all four constraint families.

`tangoBank.ts` contains seven date-selected editions (`Apollo` through `Galileo`). Each stores its own 6×6 solution, null-preserving given mask, equal/different adjacent relation map, clue count, and Calm/Standard/Dense authoring band. The permanent verifier rejects any repeated solution signature, given-mask signature, or relation-topology signature; it also asserts a unique solution, a triple violation, a direct relation violation, and coverage across seven consecutive local dates. Completion storage uses `tango-<edition-id>` plus the local date so records cannot mix.

## Queens contract

Queens uses exactly one Crown in every row, column, and colored region, with no orthogonal or diagonal touching.[^queens-help] The local edition separates cell marking from Queen placement: `empty`, `marked`, and `queen` are distinct player states.

The validator checks per-row, per-column, and per-region counts, then checks all eight neighboring cells of every queen. Marked cells are ignored by the solver and never count toward completion. Shipped region maps require a single valid queen assignment.

`queensBank.ts` contains seven date-selected editions (`Apollo` through `Galileo`). Each stores an independently authored 6×6 connected region map, its own non-touching six-queen row-to-column solution, region-size profile, search-depth record, and Calm/Standard/Dense band. A region signature and canonical reflection/rotation signature are both unique across the bank, so an orientation change cannot be shipped as a new Queens field. The permanent verifier asserts six connected substantive regions, one legal assignment, distinct queen layouts, direct duplicate-region and adjacency mutations, distinct authoring complexity, and seven-consecutive-date selector coverage. Completion storage uses `queens-<edition-id>` plus the local date so records cannot mix.

## Wend contract

Wend forms words from orthogonally adjacent letters; every letter must be used exactly once and words cannot overlap.[^wend-help] A local board stores a fixed letter grid, target words/lengths, and one valid path per target word.

```ts
type WendWord = { word: string; path: Cell[] };
```

Each submitted selection must be an orthogonal non-repeating path. A selection resolves only when its letters match an unsolved target word and its path is valid for that target. Completion requires every target word and all 25 tiles. This avoids any network dictionary dependency and removes ambiguity from homographs or multiple external dictionary variants.

`wendBank.ts` contains seven date-selected editions (`Apollo` through `Galileo`). Each stores an independently authored 5×5 letter grid, five target words, and five orthogonal non-repeating paths that together form an exact 25-cell cover. Target-word signatures and canonical square-symmetry path signatures are unique across the bank, so a reflection, rotation, palette swap, or opening assist cannot represent a new Wend field. The permanent verifier checks every path’s spelling and adjacency, each full cover, unique exact-cover count, word/path mutation rejection, and seven-consecutive-date selector coverage. Completion storage uses `wend-<edition-id>` plus the local date so records cannot mix.

## Verification sequence

Every shipped board must pass these checks before it is exposed in the Games Bay.

1. Run the independent solver/validator on the authored solution and require `true`.
2. Mutate one required constraint at a time and require `false`.
3. For uniqueness-required boards, enumerate solution count and require exactly one.
4. Replay the deterministic `?demo` move list and require the same solved state without local progress writes.
5. Exercise pointer/touch and keyboard input paths against the same state transition assertions.

[^patches-help]: [LinkedIn Help — Play Patches](https://www.linkedin.com/help/linkedin/answer/a10314037).
[^patches-news]: [LinkedIn News — Patches announcement](https://news.linkedin.com/2026/LinkedIn-Announces-Patches-A-New-Thinking-Oriented-Game-Inspired-by-Zip/LinkedIn-Announces-Patches-A-New-Thinking-Oriented-Game-Inspired-by-Zip).
[^zip-help]: [LinkedIn Help — Play Zip](https://www.linkedin.com/help/linkedin/answer/a7445030).
[^mini-sudoku-tutorial]: [LinkedIn — Mini Sudoku tutorial](https://www.linkedin.com/posts/minisudoku-game_how-to-play-mini-sudoku-activity-7379409304770039808-Gc8-).
[^tango-help]: [LinkedIn Help — Play Tango](https://www.linkedin.com/help/linkedin/answer/a6861672).
[^queens-help]: [LinkedIn Help — Play Queens](https://www.linkedin.com/help/linkedin/answer/a6269510).
[^wend-help]: [LinkedIn Help — Play Wend](https://www.linkedin.com/help/linkedin/answer/a6565995).
