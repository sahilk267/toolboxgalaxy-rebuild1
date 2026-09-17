# Toolbox Galaxy — Design Directions

## Teen stylistic approaches

### 1. Signal Garden
**Very Brief Intro:** Ek bright, optimistic utility space jisme soft sage green, warm orange aur paper-like surfaces hain. Iska mood everyday problem-solving ko calm aur approachable banata hai.

**Probability:** 0.04

### 2. Orbital Workbench — Chosen
**Very Brief Intro:** Ek high-contrast, night-shift digital workshop jahan serious utility tools aur lightweight browser games ek hi visual universe share karte hain. Dark ink background, solar-lime signals aur blueprint-like information blocks precision aur play dono ko express karte hain.

**Probability:** 0.07

### 3. Paper Arcade
**Very Brief Intro:** Retro editorial print ke saath arcade energy: cobalt panels, off-white paper, stamped labels aur bold geometric blocks. Is direction mein tactile character strong hai, lekin technical tool workflows ke liye thoda less neutral rahega.

**Probability:** 0.02

---

# Chosen System: Orbital Workbench

## Design Movement

**Contemporary space-industrial editorial design** — observatory interfaces, spacecraft checklists aur independent developer tools ki directness ka blend. Yeh cyberpunk neon aesthetic nahi hai; yeh restrained, precise aur purpose-led night-workstation feel hai.

## Core Principles

1. **Utility first, spectacle second:** Har visual element user ko tool ya game tak jaldi pahunchane mein help karega.
2. **Two speeds, one universe:** Tools systematic, clear aur calm; games playful aur kinetic, lekin same material language ke andar.
3. **Visible system logic:** Labels, status chips, grid lines aur compact metadata user ko orientation dete hain.
4. **Deliberate contrast:** Dark ink surfaces par solar-lime sirf important interaction aur verified status ke liye use hoga.

## Color Philosophy

Base palette midnight ink aur graphite rakhegi, jisse screens focused aur low-glare feel karein. **Signal Lime (`#C7F36B`)** ownable brand color hai: isko verified status, active navigation, important CTAs aur interactive moments ke liye reserve kiya jayega. Warm ember (`#FF9B54`) game energy aur secondary emphasis ko signal karega. Parchment-tint (`#F4F2EA`) readable long-form tool surfaces aur data panels ko soften karega.

## Layout Paradigm

Homepage ek symmetrical centered landing page nahi hoga. Desktop par **left rail + offset content runway** hoga: fixed identity/navigation rail, hero ke liye asymmetrical signal panel, tool categories ke liye masonry-like rail-aligned cards, aur games ke liye horizontal playable strip. Mobile par rail compact top bar mein collapse hoga; content single-column but status-rich rahega.

## Signature Elements

1. **Orbit Mark:** thin orbital ring ke center mein four-point signal spark; transparent icon without text.
2. **Telemetry Strips:** cards aur panels par compact uppercase metadata rows, e.g. `VERIFIED · LOCAL · 0.2s`.
3. **Dock Lines:** subtle 1px grid/docking lines that connect home modules and provide a workshop blueprint feel.

## Interaction Philosophy

Interactions tool-like honge: controls immediate feedback denge, state visibly confirm hogi, aur feature placeholders clear "planned" status ke saath honest rahenge. Games navigation playful hover preview use karega, but core tools par motion restrained rahegi.

## Animation

Hover states 140–180ms ke snappy ease-out par use honge. Cards ek 2–4px lift aur signal border shift use karenge; buttons active press par `scale(0.97)` feel denge. Hero telemetry aur game tiles small staggered fade/translate entry use karenge. `prefers-reduced-motion` users ke liye saari non-essential motion disable hogi. No constant floating objects, no excessive glow.

## Typography System

**Space Grotesk** headings ke liye use hoga: technical, compact aur human. **IBM Plex Mono** labels, tool metadata aur values ke liye use hoga. Body text `Manrope` use karega for clear readability. Headings short, declarative aur left-aligned rahenge; all-caps mono text sirf metadata aur status ke liye.

## Brand Essence

**Positioning:** A browser-first workbench for people who need a reliable tool now and a quick game when they need a reset.

**Personality:** Precise, spirited, trustworthy.

## Brand Voice

Headlines direct aur useful honge; CTAs action-focused rahenge. Generic filler aur vague AI promises avoid karne hain.

> “Make the small thing easy.”

> “Run a tool. Take a break. Keep moving.”

## Wordmark & Logo

Wordmark custom Space Grotesk construction mein `TOOLBOX / GALAXY` two-line lockup hoga, with the Orbit Mark acting as a visual separator. Primary icon ek asymmetric orbital loop ke andar four-point spark hoga; koi embedded text nahi hoga, transparent PNG favicon/header use ke liye.

## Signature Brand Color

**Signal Lime — `#C7F36B`**

## Build Reminder

Har CSS/component/page file ke top par style reminder add karna hai:

> `Orbital Workbench: midnight-ink workshop surfaces, signal-lime reserved for key actions, Space Grotesk + IBM Plex Mono, left-rail layout, calm utility motion.`

## Style Decisions

- The `TOOLBOX / GALAXY` wordmark and Orbit Mark remain visible in the primary navigation/identity area on every AppShell route.
- Dock lines and telemetry strips are structural motifs: each major card, form, and feature panel exposes a visible metadata or status layer.
- Tool detail pages are treated as operational instrument consoles, using labeled input/output zones, verified/local state, and precise panel framing.
- Game play screens retain a compact Toolbox Galaxy identity layer with the Orbit Mark, Games Bay route label, and telemetry HUD so they remain part of the same workbench system.
- Dock lines are structural rather than decorative: each major page exposes a visible runway relationship between its rail, hero, and primary panels.
- Games use warm ember for launch energy and playful module accents; Signal Lime remains reserved for active, verified, successful, and primary-action states.
- Every route, including games and offline states, exposes a compact Orbit Mark, `TOOLBOX / GALAXY` lockup, route label, and telemetry/status signal.
- Games use Ember for score and playful module energy; Signal Lime is retained for live paths, verified state, success, and primary actions.
- Dock lines must visibly relate the shell, hero or playfield, and primary panels as a structural blueprint system rather than decorative borders.
- On Tools routes, category differentiation comes from mono telemetry, labels, and layout rhythm—not rainbow accents. Signal Lime stays reserved for verified, active, successful, and primary-action states; Ember remains game/launch energy.
- Every major route hero pairs its direct headline with an offset control or telemetry panel so the first viewport unmistakably reads as an Orbital Workbench.
- Tool listing cards use a single graphite instrument-console grammar with blueprint dock lines, status chips, and mono metadata; hierarchy comes from typography and panel structure rather than decorative colors.
- Game selection overlays are docked relay-control consoles with named operational zones, visible module/status hierarchy, and blueprint lines that connect them to the playfield.
- Circuit Shift’s signature is relay/circuit logic: lime indicates live path or successful connection; Ember is reserved for scoring, local bests, and launch energy.
- Game display headlines stay declarative and technical-compact, while mono control labels carry the Orbital Workbench voice around them.
- Cyan/blue is blueprint structure only; Signal Lime `#C7F36B` is the live system color for active navigation, verified/local trust, primary actions, and successful output.
- Tool grids avoid brochure-card repetition by grouping modules as docked operational fields with distinct telemetry headers and panel rhythm, while retaining one graphite console grammar.
- The Orbit Mark and `TOOLBOX / GALAXY` lockup behave as a compact mission patch with enough visual weight to remain custom and operational across routes.
- Game headlines use compact technical grotesque at display scale—never cinematic, serif, or luxury-editorial treatments. Game overlays read as relay-control consoles with named zones, terminal edges, and dock lines to the playfield.
- Tool cards never use decorative category colors: graphite console structure, blue blueprint separators, and Signal Lime live/verified states carry the hierarchy. Every card exposes a compact operational payload, and image panels include instrument-style telemetry captions.
- Homepage bays dock into a continuous blueprint runway through shared field lines, telemetry labels, and vertical terminal ticks; Ember stays reserved for the games pause/play field only.
- Circuit Shift overlays retain a compact Toolbox Galaxy mission-patch lockup as cockpit framing, use named relay/result/action bands, and dock visibly to the playfield. Lime is confirmed live/primary, ember is daily/score warmth, and cyan is structural blueprint only.
- Logic Lab play routes compose controls, telemetry, board, and local validator guidance as one named Constraint Field: terminal ticks, module-bus labels, coordinate cues, and dock-line framing turn the semantic puzzle grid into an Orbital Workbench cockpit rather than an isolated board.
- Game titles pair display-scale names with a visible mono `CONSTRAINT FIELD` designation so the hero reads as a named operational module rather than a generic puzzle masthead.
- Authored daily-board variants expose a compact field-state telemetry strip; the signal changes by difficulty/edition state while keeping shared cockpit geometry, lime live-field semantics, and cyan blueprint structure.
- The compact Orbit Mark and `TOOLBOX / GALAXY` lockup carries a framed, high-contrast mission-patch treatment on game routes before secondary controls compete for attention.
- The game-route mission patch remains visually competitive with the module title through framed Orbit Mark treatment, two-line lockup, and a compact `MISSION PATCH / LOCAL COCKPIT` designation.
- Queens region fills are semantic connected constraint zones, never decorative swatches: each field exposes a named region bus, zone coordinates, a six-zone map label, and a docked validator relay to tie color to rule logic.
- Each authored Queens edition communicates personality through map-lock telemetry, connected-zone profile, search-depth readout, and its calm/standard/dense state—not through changing the shared Orbital Workbench palette.
- Signal Lime outlines or dominates Games Bay modules only for active, verified, live, successful, or primary states; cyan stays quiet blueprint structure and Ember carries launch/play warmth.
- Games Bay arcade rows are docked relay instruments with named chassis zones, telemetry bands, local-state framing, and terminal corners—not generic launch cards.
- The Games Bay hero, arcade modules, verified daily fields, and local streak console attach to one visible blueprint runway; imagery is treated as an instrument-field capture rather than cinematic key art.
- Patches composes its board, clue bus, progress, validator relay, assist channel, and hint band as one docked `Constraint Field` chassis; the assist panel is never a floating card.
- Patches telemetry separates clue-owner count, named partition lock, and authored search depth into distinct mono readout clusters; density state changes hierarchy through the shared lime/ember system rather than new decorative colors.
- Patches boards expose rectangle ownership as semantic field information through a named partition bus, live clue-owner caption, shape-aware clue markers, and a visible validator relay.
- Each Patches edition signals authorship through its named partition lock, clue count, search profile, and Calm/Standard/Dense telemetry treatment while preserving the common Orbital Workbench cockpit.
- Wend composes its target bus, letter grid, progress relay, assist channel, and hint band as one docked `WORD COVER FIELD` chassis; the assist channel connects to the playfield by a visible validator relay rather than floating independently.
- Wend telemetry separates target-path count, named word-cover lock, and authored path-branch readout into distinct mono clusters; lime is live/verified, ember expresses dense path pressure, and cyan stays blueprint structure.
- Wend editions communicate personality through distinct target words, path branching, field-density state, and local cover validation, while word chips serve as operational target-bus markers rather than generic tags.
- The image privacy relay is one continuous docked chassis: a local-only relay bus visibly connects the metadata route’s hero telemetry to its primary console rather than presenting isolated utility blocks.
- The rail’s Orbit Mark plus `TOOLBOX / GALAXY` lockup retains mission-patch authority through a compact framed badge, structural divider, terminal tick, and restrained active glow; it must read as an operational identity anchor at first glance.
- On privacy-focused image routes, violet signals the distinct re-export instrument while Signal Lime remains limited to verified/local trust and primary-action semantics; telemetry panels carry enough material weight to anchor the offset hero field.
