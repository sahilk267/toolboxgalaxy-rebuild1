# Hostinger Asset Map

The original visual files were copied into the external handoff directory `/home/ubuntu/hostinger-toolboxgalaxy-assets/`. Before the Hostinger upload, optimize them and place the resulting files in `public_html/assets/`.

| Hostinger destination | Source handoff file | Current preview consumer |
|---|---|---|
| `/assets/orbit-mark.png` | `orbit-mark.png` | Global rail/header mark, favicon, web manifest |
| `/assets/hero-orbital-workbench.jpg` | `hero-orbital-workbench.jpg` | Homepage hero panel |
| `/assets/tools-station.jpg` | `tools-station.jpg` | Homepage tools story panel |
| `/assets/games-arcade.jpg` | `games-arcade.jpg` | Games hub and Orbit Dash background art |
| `/assets/signal-switch-reference.jpg` | `signal-switch-reference.jpg` | Signal Switch Games Bay card and visual QA reference |
| `/assets/circuit-shift-reference.jpg` | `circuit-shift-reference.jpg` | Circuit Shift Games Bay card and visual QA reference |
| `/assets/logic-puzzle-suite-reference.jpg` | `logic-puzzle-suite-reference.jpg` | Logic Lab Games Bay card and Logic Lab catalog hero |
| `/assets/logic-lab-loop.mp3` | `logic-lab-loop.mp3` | Optional user-started music bed for direct Logic Lab puzzle routes |

For production, build with `VITE_ASSET_BASE_URL=/assets` and replace the temporary `/manus-storage/…` image references with this asset base. The original handoff artwork is deliberately outside the web project so the static deployment bundle stays small.
