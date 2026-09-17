# Orbit Dash Assets

**Art direction:** Midnight-ink arcade space with crisp geometric gates, a signal-lime player ship, ember-orange fragments, controlled bloom, and a clean side-scrolling playfield. The game should read as a polished casual arcade module within the Orbital Workbench system, not a cyberpunk shooter.

| Asset | Usage | Source |
|---|---|---|
| Orbit Dash wide arcade art | In-game background layer, Games route artwork, and visual QA reference | `/manus-storage/toolbox-galaxy-games-arcade_0b17d873.jpg` |
| Orbit Mark | Global brand mark, favicon, and navigation | `/manus-storage/toolbox-galaxy-orbit-mark_c8160386.png` |
| Orbital Workbench hero art | Homepage hero artwork | `/manus-storage/toolbox-galaxy-hero-orbital-workbench_617f903c.jpg` |
| Tools Station art | Homepage tools story panel | `/manus-storage/toolbox-galaxy-tools-station_0a6e4eb6.jpg` |

The four source images are also mapped for Hostinger in [`HOSTINGER_ASSET_MAP.md`](./HOSTINGER_ASSET_MAP.md). The handoff copies live outside this project at `/home/ubuntu/hostinger-toolboxgalaxy-assets/` so they are not included in the static deployment bundle.

The player ship, gates, collectible signal fragments, and starfield are procedural Babylon geometry. This keeps the game bundle compact and avoids shipping large local media files.

## Signal Switch Assets

**Art direction:** A straight-on, top-down orbital relay console: square midnight-blue metallic board, a central silver-black hub, four large relay pads at cardinal directions, one active pad in signal-lime, one ember-orange packet, and a sparse starfield. The game uses crisp procedural meshes instead of imported models, preserving visual separation and lightweight browser performance.

| Asset | Usage | Source |
|---|---|---|
| Signal Switch 16:9 in-game reference | Games Bay card artwork and visual QA reference | `/manus-storage/toolbox-galaxy-signal-switch-reference_73b96409.jpg` |

## Circuit Shift Assets

**Art direction:** A straight-on 4×4 orbital circuit puzzle board: midnight-blue panels, tactile dark relay tiles, neon-lime power traces, cyan selection feedback, and a restrained amber warning path. The fixed board stays minimal enough to read as an actual browser game rather than decorative concept art.

| Asset | Usage | Source |
|---|---|---|
| Circuit Shift 16:9 in-game reference | Games Bay card artwork and visual QA reference | `/manus-storage/toolbox-galaxy-circuit-shift-reference_92722146.jpg` |

## Logic Lab Assets

**Art direction:** A midnight orbital workbench containing several readable constraint-system mechanisms. The reference supports the Games Bay and Logic Lab catalog while the actual Mini Sudoku, Tango, Queens, Patches, Zip, and Wend boards remain semantic HTML/CSS interfaces with no shipped scene media.

| Asset | Usage | Source |
|---|---|---|
| Logic Lab 16:9 reference | Direct Games Bay puzzle field and optional Logic Lab catalog artwork | `/manus-storage/toolbox-galaxy-logic-puzzle-suite-reference_aebb6519.jpg` |
| Logic Lab ambient loop | Optional, user-started music bed for direct full-screen puzzle routes | `/manus-storage/toolbox-galaxy-logic-lab-loop_ea48028d.mp3` |

The music loop is **not autoplayed**. The visitor must use the visible MUSIC control; the player’s choice is stored only in that browser alongside the shared Games Bay sound preference.
