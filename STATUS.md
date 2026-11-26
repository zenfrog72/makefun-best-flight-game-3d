# PULAU KURIR 3D — STATUS (best-flight-game-20261126-0057)

3D rebuild of the flight game. Ora rejected the 2D v2 ("Kurang realistic dan tidak jelas",
2026-11-26 22:03 WIB); the bar is @satesapi "Solstice Wings" / @reactrailgun "Solstice Wing v2"
(low-poly 3D, dense HUD, lit cockpit, graded landings).

## Current state (2026-11-27 ~00:30 WIB)
- **BUILD COMPLETE, NOT SUBMITTED.** Awaiting Ora's review of the 4 screenshots below.
  Review gate: submit ONLY after Ora approves the EXACT FINAL screenshots.
- Commit `11c6a0c4a8939c19b16892ce407ab036a22700cf` (repo `~/workspace/makefun-best-flight-game-3d/`,
  fresh git repo, git identity zenfrog72).
- Kit: fresh level-53 kit `best-flight-game-20261126-0057-kit/`; kit `init` ran before any code.
- Quota: 1 of 3 entries used (v1 ISLAND COURIER `01a2162c`); this would be entry #2.
  **Submitting v3 REPLACES v1 as the counted entry** (latest counts; an earlier entry can be
  re-picked as final via `makefun final <slug> <submission_id>`).
- Round 1 result for v1: rank 2,340 / 6,258 (score 539,459) — far outside paid top 50.
  Cutoffs: round 2 Fri 07:57 / round 3 Fri 19:57 / final Sat 07:57 WIB. Target submit: round 3.

## The game
- Three.js r128 UMD vendored at `game/vendor/three.min.js` (603,445 B, sha256 `9274bbcec8d9…`).
  No network at runtime. HUD = DOM panels. WebAudio synth.
- World: seeded heightmap island (green valleys, snow-capped peaks, pine forests instanced,
  villages, 4 runways with markings/edge lights/windsocks/numbers, sea + golden-hour sky,
  clouds, rain + lightning + crosswind in the storm mission).
- Plane: low-poly red-white high-wing, prop, gear, flaps, nav lights, blob shadow.
- Cameras: chase (primary) + lit 3D cockpit with working dials (SPD/ALT/HDG/attitude/FUEL/RPM).
- Missions (4): 1 Kargo Medis (deliver to Zamrud), 2 Koridor Cincin (6 rings, then Karang),
  3 Pendaratan Ekspres (short-field Atol), 4 Badai Malam (night storm, Mercusuar).
  Real flight model (throttle/pitch/bank/stall/flare/crosswind/fuel/damage) + graded landings.
- HUD: mission panel, compass tape, speed + alt tapes, attitude, fuel/damage, timer, minimap,
  message bar — all big, high-contrast, legible at ~300px.

## Final screenshots (in `screenshots/`, all 1280x720, each <=256 KiB)
1. `shot-1-ring-corridor.png` — 205,189 B — sha256 `f095eb6f…` — chase, banked 3/4 through
   ring 3 over the green valley, sea + sunset at left, snow peak behind. COVER.
2. `shot-2-cockpit.png` — 184,379 B — sha256 `251c5cc0…` — lit cockpit, all 4 dials readable
   (SPD 90 / ALT 233 / HDG 080), runway ahead on final to Zamrud 08.
3. `shot-3-short-field.png` — 137,389 B — sha256 `5d12fc57…` — chase on final to Atol runway
   "04" (threshold bars, dashes, edge lights, golden pillar), gear down + FLAPS.
4. `shot-4-night-storm.png` — 140,760 B — sha256 `b3d024a3…` — night storm approach to
   Mercusuar, rain, lightning bolt in the sky, lit runway, sea at the valley end.

## Verification done
- Headless playtest (puppeteer): title -> all 4 briefings -> fly -> banked turn ->
  pause/resume, 0 JS errors (only favicon 404s). Flight-model unit test: takeoff, 58 deg
  turn in 10 s, hard landing graded (damage 25), dive crash (damage 100).
- Kit check (trial, no bundle): 5 passed (competition_open, snapshot, license_osi,
  entrypoint, repo_created_after_open), 1 failed = transcripts_present (expected: no bundle
  yet), 16 skipped. Snapshot 47 files / 49,603,437 B (47 MB is the kit dir itself; within caps).
- Entrypoint run from a FOREIGN cwd (/tmp, MAKEFUN_OUTPUT_DIR=/tmp/pk3d-out): exit 0,
  dossier.json 983,486 B (text 90,227 B <= 163,840 cap; DOSSIER_MAX_BYTES is 4 MiB),
  12 game files / 692,839 B, 4 screenshots / 667,717 B — all within gate caps.
- Flight-model note: shot staging freezes the sim after 30 frames; crosswind can drift the
  plane a few degrees off the runway heading between runs (shot 4 final: hdg 296 vs rwy 300)
  — cosmetic only, composition still reads.

## To submit (PARENT — do NOT submit from this session)
1. Push the repo to GitHub as zenfrog72 (repo_public was skipped in the check; v1 was pushed).
   README already has the 3 live badges + bounty link.
2. Re-bundle FRESH in the parent session (this session's usage rows land only after it ends;
   the trial check had no transcripts, so `thinking_priced` would fail on a bundle made now).
   Bundle: `--no-discover` + explicit `--session` FILE PATHS for THIS session
   (`4638429f-291b-423b-beed-af7b849bb56c`) + `--parent-session 48c8001c-6a50-42ac-9740-d47caadb02e4`
   + real system prompt `~/workspace/system/system_prompt.md` + `--mcp none --provider meta
   --effort default`. (No `--competition` on bundle.)
3. `makefun check` again with the bundle, then `makefun submit` — ONLY after Ora approves the
   exact 4 screenshots above. Note the check hinted the entry is unsigned ("where the prizes
   are escrowed, submit --keypair signs..."); v1 submitted WITHOUT a keypair, so try plain
   submit first and use `--keypair` only if the server demands it.
4. After ANY submit verify with `makefun status --submission <id>` + API record
   (eligibility, valid, win_rate, artifact_sha256) — intake "checked"/"scored" is not graded.

## Design decisions / lessons (for the next iteration)
- Terrain: the island interior was too high (fbm base + overlapping gaussian skirts put the
  ring corridor over snow). Fix: narrower/taller peaks (750/900, 620/850, 420/1000) + lower
  fbm base (150) -> green valleys ~300-500 m, snow caps only on the two peaks.
- Cockpit: the first cockpit shot hid the runway behind the dashboard; eye raised to 1.75 m,
  view pitched down 2.7 deg, panel lowered to 0.45, yoke shrunk/lowered so it never covers
  the ALT dial.
- Lightning bolt: only reads if thick (r=4), jagged (accumulating offsets), and placed high
  over the valley centreline (not inside a ridge).
- All code was written FRESH in this session from DESIGN-SPEC.md (transcript gate); no code
  lines were read from the Gemini .html, v1, or v2 sources. `game/vendor/three.min.js` and
  `vendor/makefun-game.ts` are kit/vendor files, excluded from the gate.
