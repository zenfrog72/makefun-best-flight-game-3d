# DESIGN SPEC — PULAU KURIR 3D (best-flight-game-20261126-0057, 3rd entry)

## Why
- v1 ISLAND COURIER (PixiJS 2D top-down): round 1 rank 2,340/6,258.
- v2 PULAU KURIR Golden Hour (Canvas 2D): Ora rejected 2026-11-26 22:03 WIB —
  "Kurang realistic dan tidak jelas".
- Bar (Ora: "Minimal gini", screenshot of the make.fun feed): @satesapi
  "Solstice Wings" and @reactrailgun "Solstice Wing v2" — LOW-POLY 3D:
  mountain ranges with snow peaks, pine forests, valley runway, red-white
  plane in chase view, dense readable HUD, lit 3D cockpit, graded landings.
- This build: real 3D with Three.js r128 UMD vendored locally
  (game/vendor/three.min.js), DOM HUD, WebAudio synth. No network at runtime.

## Concept
"PULAU KURIR 3D" — courier pilot flying medical cargo between four valley
airfields on one big tropical mountain island (Zamrud, Karang, Atol,
Mercusuar). Golden-hour light, low sun, sea around the island, snow-capped
peaks inland, pine forests, villages with lit windows, runways with markings,
edge lights and windsocks. Original names, art, sounds — nothing copied from
any commercial game or from the reference entries (learned their techniques,
never their scenes).

## Tech
- Three.js r128 UMD (global THREE), classic `<script>` tags, no modules, no
  import map. All game code plain ES6 that also parses as a module.
- Files under game/ (one job each; names are what the judge's outline shows):
  - index.html — page, DOM HUD, script load order
  - src/config.js — world/mission/flight constants
  - src/terrain.js — seeded heightmap island, sea, sky, sun, clouds, forests,
    villages, runways, windsocks
  - src/aircraft.js — low-poly plane mesh (fuselage, wings + nav lights,
    tail, spinning prop, gear, flaps) + flight model
  - src/cameras.js — chase camera + lit 3D cockpit camera
  - src/hud.js — DOM HUD (mission panel, compass tape, speed/alt tapes,
    attitude canvas, fuel/damage, timer, minimap canvas, message bar)
  - src/missions.js — 4 missions, rings, objectives, graded landings
  - src/audio.js — WebAudio synth (engine, wind, chime, touchdown, fanfare)
  - src/input.js — keyboard + mouse
  - src/shots.js — screenshot staging (?shot=1..4&seed=N, frozen sim)
  - src/main.js — bootstrap, states (title/briefing/flying/paused/done),
    game loop, resize
  - vendor/three.min.js — vendored (not my source)
- Deterministic: mulberry32 seeded PRNG for terrain/forest/village placement;
  shots freeze the sim at a staged state. No Math.random in world gen.

## World (terrain.js)
- Heightmap: PlaneGeometry 96x96 segments over 7200x7200 units, vertex
  heights from 2-octave value noise (seeded) + mountain mask inland
  (peaks up to ~900 units, snow above ~650 via vertex colours) + valley
  flattening near the 4 airfields + beach falloff to sea level at the coast.
  Flat-shaded (computeVertexNormals with flat shading via non-indexed
  geometry) for the low-poly look.
- Sea: large plane at y=0, Phong material, warm sun-glint via a stretched
  specular highlight (directional light + high shininess) + slow moving
  glint band mesh.
- Sky: big inverted sphere with vertex-colour gradient (indigo top →
  violet → orange horizon at golden hour); fog matching horizon colour.
  Storm mission swaps to dark slate sky + heavy fog.
- Sun: directional light, warm orange, low angle (golden hour); hemisphere
  light sky/ground. Cloud shadows: a few large soft dark ellipse decals
  drifting on the terrain.
- Clouds: ~14 clusters of 3-6 flattened white low-poly blobs, drifting
  slowly, kept out of the sun's screen slot in chase shots.
- Forests: InstancedMesh — cone pines (trunk cylinder + 2 stacked cones),
  ~900 trees on slopes below the snow line, seeded positions, 3 size classes.
- Villages: ~40 houses near airfields/coast — instanced boxes with pyramid
  roofs; windows emissive amber (lit at golden hour / night).
- Runways: one per airfield — dark asphalt strip (box, slightly above
  terrain), white centre dashes + threshold bars (thin boxes), edge lights
  (small emissive spheres, lit at dusk/night), windsock (pole + cone that
  points into the wind), runway number painted via canvas texture.
- Airfields (all flat pads carved into terrain):
  - Zamrud (medical delivery target) — main valley, heading 080.
  - Karang (ring corridor end) — east valley, heading 250.
  - Atol (short field) — south coast, 620-unit strip, heading 040.
  - Mercusuar (storm) — north point, heading 300, lighthouse beacon.
- Rain (storm only): instanced thin streaks falling around the camera.
  Lightning: random flash — directional light intensity spike + white sky
  flash quad for 120 ms.

## Aircraft (aircraft.js)
- Low-poly courier plane, red-white livery (distinct from the reference's
  twin: single-engine high-wing, red tail + wingtips, white fuselage):
  fuselage (tapered cylinder/box), high wing (box, slight dihedral), tail
  (horizontal + vertical stabilisers), spinning prop (2-blade + blur disc),
  fixed gear with fairings + extendable state, flaps, nav lights
  (red left / green right / white tail, blinking), beacon.
- Soft shadow: directional-light shadow map 1024 over a 1200-unit box
  following the plane + a dark blob ellipse under the plane when low.
- Flight model (units: 1 unit ≈ 1 m; speeds in knots displayed, ft for alt):
  throttle 0–100%, speed from throttle + pitch + drag, lift/stall below
  62 kt (sink + nose drop + buffet shake), bank → turn rate, pitch authority
  scales with speed, flare reduces vertical speed near ground, crosswind
  pushes the plane sideways (storm), fuel burns with throttle, damage from
  hard touchdown / terrain strike / stall-spin into ground.
- Gear (G): down = more drag, safe landing; up landing = damage + sparks.
  Flaps (F): more lift + drag, short-field landings.

## Cameras (cameras.js)
- Chase (primary): behind + above the plane, smoothed (lerp), slight lag on
  turns, FOV 62. Plane sits lower-centre so the runway/ring ahead is visible
  above the nose. Mouse drag orbits slightly; C toggles cockpit.
- Cockpit: camera at pilot eye, looking forward over a lit 3D dashboard —
  dashboard panel mesh with a CanvasTexture (drawn dials: airspeed, alt,
  attitude ball, compass, fuel, RPM) updated 10×/s, amber backlight glow,
  glareshield, windscreen frame struts. Lit = emissive texture + small
  point light. This is the "lit 3D cockpit" shot.

## Missions (missions.js)
1. Kargo Medis — take off from Karang, deliver to Zamrud runway 08.
   Golden hour, calm. Objective: land on Zamrud.
2. Koridor Cincin — 6 golden rings over the valley, then land at Karang.
   Ring = torus + glow sprite; next ring highlighted, passed rings green.
3. Pendaratan Ekspres — short-field landing at Atol (620 units), tight fuel
   (72% at start), flaps recommended.
4. Badai Malam — night storm: rain, lightning, 18 kt crosswind, land at
   Mercusuar (lit runway + lighthouse beacon).
- Graded landing on every landing: touchdown vertical speed (fpm) +
  centreline offset (m) → SMOOTH / GOOD / FIRM / HARD + score; shown on the
  debrief panel. Crash (terrain strike, stall into ground, gear-up landing
  at speed) = mission failed panel with retry.

## HUD (hud.js, DOM panels — proven readable in v2)
Dark navy panels, white/amber text, big numbers, readable at ~300 px:
- Top-left mission panel: mission name + objective, rings x/6, distance to
  target (m), status.
- Top-centre compass tape: scrolling tick strip + big HDG number.
- Left speed tape: scrolling, big SPD kt + throttle bar.
- Right alt tape: scrolling, big ALT ft + vertical-speed arrow.
- Bottom-left attitude indicator: small canvas — horizon ball + bank arc.
- Top-right: timer, fuel bar, damage bar.
- Bottom-right minimap: canvas top-down — terrain dots, runways, plane
  arrow, target marker, rings.
- Bottom-centre message bar: objective updates / warnings / landing grade.
- Pause button + sound toggle (clickable, like v2).

## Input (input.js)
Arrows/WASD pitch+roll, Shift throttle up, Ctrl/Z throttle down, G gear,
F flaps, B brake, P/Esc pause, C camera, M mute, Space confirm. Mouse drag
= slight chase orbit. Touch: on-screen buttons (throttle +/-, pitch, turn)
— basic, keyboard is primary.

## Audio (audio.js)
WebAudio synth only: engine hum (oscillator + throttle pitch), wind noise
(filtered noise, speed-scaled), ring chime, touchdown thud, warning beep,
mission-complete fanfare. No audio files.

## Screenshots (shots.js) — ?shot=1..4&seed=7
4 × 1280×720, genuine renders, frozen sim, each reading clearly at small
size (plane + target + HUD legible, no empty frames):
1. 01-cover — chase, golden hour, plane banked over pine valley, Zamrud
   runway + golden ring ahead, snow peaks behind.
2. 02-cockpit — lit 3D cockpit, dashboard dials glowing, runway ahead
   through the windscreen.
3. 03-ring — chase, ring 3/6 golden ahead, Karang valley + village below.
4. 04-storm — chase at night, rain + lightning, lit Mercusuar runway ahead.
Size guard: each ≤ 256 KiB (re-check after any visual change; PNG quality
via canvas.toBlob is not used — screenshots come from the browser capture).

## Playtest + verify
- Headless Chrome (puppeteer-core, cached chrome) at 1280×720: title → all
  4 briefings → fly → banked turn → pause/resume → 0 console errors.
- main.ts determinism: run twice from a foreign cwd, fresh
  MAKEFUN_OUTPUT_DIR each time, dossier byte-identical.
- Kit check (trial bundle) — expect thinking_priced to fail while this
  session is still running (usage rows land after the session ends); parent
  re-bundles before submit. DO NOT submit the trial bundle.
- DO NOT submit at all — review gate: Ora approves the exact final
  screenshots first. Target: screenshots to Ora Friday morning
  (~09:00–10:00 WIB); submit window round 3, Fri 19:57 WIB.

## Anti-flag
All kit CLI output redirected to /tmp; only exit codes + whitelisted scalars
shown. No ls/git status/cat/tree/find in makefun repos.
