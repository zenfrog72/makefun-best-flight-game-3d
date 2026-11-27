# PULAU KURIR 3D — STATUS (best-flight-game-20261126-0057)

3D rebuild of the flight game. Ora rejected the 2D v2 ("Kurang realistic dan tidak jelas",
2026-11-26 22:03 WIB); the bar is @satesapi "Solstice Wings" / @reactrailgun "Solstice Wing v2"
(low-poly 3D, dense HUD, lit cockpit, graded landings).

## SUBMITTED — Fri 2026-11-27 ~01:36 WIB (round 2, before the Fri 07:57 cutoff)
- **Submission `01a21924-bf27-73bf-b0c6-f4d850aa2fb8`, title "PULAU KURIR 3D", counts from round 2.** Ora approved the exact final screenshots Fri 01:24 WIB ("Ok" — cockpit view still a bit weird, but approved).
- Repo: https://github.com/zenfrog72/makefun-best-flight-game-3d, commit `a09767372d0f55d7ab4e07ba78564dbe3c071e8f` (public, MIT, About: homepage + `makefun` topic; README has the 3 competition-scoped badges).
- Bundle `~/workspace/pk3d-bundle.tar.gz`, sha256 `f4bab782c4a68895edb2d102262347e88e5e526c7918b096fc05d5e96aaeb42b` (10,651,939 B): sessions 4638429f (3D build) + 5fdb8ee9 (fixes), parent 48c8001c, usage file `muse-usage-3d.jsonl` (2 rows), system prompt uploaded, prompt file = Ora's verbatim "Ya bikin yang 3d dulu, kalo gak suruh Gemini aja" (handed-off). Usage rows queried fresh from DB in the submit session.
- Check (fresh bundle, new commit): **15 pass / 0 fail / 7 skip** — thinking_reproduces 81.2% authored (2049/2522, 0 copied), thinking_priced pass (2 usage records).
- Server status after submit: stage "submitted", round 2, outcome not decided; intake checks all pass (account_wallet, quota, form, entry_signature signed by payout wallet 9Hqxaer…, repo_owner/public, license, repo_created_after_open, commit_in_repo, duplicate_snapshot, committed_secret, repo_readme, repo_about). security_audit: skip ("flagged… graded as submitted"). API record: status "preparing", metrics_withheld, scores [] — rank/score appear after round 2 is judged (cutoff Fri 07:57 WIB). Verify again after the round with `makefun rounds best-flight-game-20261126-0057`.
- Failed attempts before success (both 422, do NOT count toward quota): (1) unsigned submit → entry_signature (this competition's rewards are escrowed — keypair required, unlike v1's unsigned submit); (2) signed submit → repo_readme (badge URLs needed the competition-scoped form `/badge/<slug>/<owner>/<repo>/rank.svg` — fixed mechanically in README only, new commit a0976737). Screenshots re-verified unchanged after the fix (sha256 == approved set).
- Quota: this is entry #2 of 3 for the competition; day cap 10/UTC day. Submitting v3 REPLACES v1 as the counted entry (v1 re-pickable via `makefun final`). Claim code: NOT recorded here — it is on the entry's status page (owner view only, `makefun status --submission 01a21924-bf27-73bf-b0c6-f4d850aa2fb8`).
- Note: a service restart mid-task wiped /tmp (bundle + logs) — bundle was rebuilt fresh from the workspace inputs and stored at ~/workspace/pk3d-bundle.tar.gz so it survives restarts.

## Current state (fix round, late 2026-11-26 WIB)
- **BUILD COMPLETE, SUBMITTED — see above.** (Was: awaiting Ora's review; approved Fri 01:24 WIB.)
- Fix round (Ora 23:02 "Betulin dulu" + interior note + "Bahasa juga diganti inggris"):
  shot 1 gear up + ring count, shot 2 rebuilt as a proper in-plane interior,
  shot 4 lightning in frame, ALL in-game text switched to English.
- Commit `72894416d9c970298ac6fc9c0512f52dc56b8f38` (repo `~/workspace/makefun-best-flight-game-3d/`,
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
1. `shot-1-ring-corridor.png` — 198,254 B — sha256 `925c98a1…` — chase, banked through
   ring 3 over the green valley, sea + sunset at left, snow peak behind. COVER.
   HUD: RING 2/6, GEAR UP. All text English.
2. `shot-2-cockpit.png` — 208,268 B — sha256 `d9a9b9da…` — PROPER in-plane cockpit:
   canopy frame (posts + top bar + roof + side walls), detailed panel (bezel,
   screws, switch strip + indicator lights), yoke, wingtip stubs with red tips
   at the lower windscreen corners, nose cone + spinning prop ahead, runway +
   valley through the windscreen. All 4 dials readable (SPD 87 / ALT 183 /
   HDG 080 + attitude). Target pillar thinned + faded. All text English.
3. `shot-3-short-field.png` — 134,493 B — sha256 `2815b646…` — chase on final to Atol runway
   "04" (threshold bars, dashes, edge lights, golden pillar), gear down + FLAPS.
   All text English.
4. `shot-4-night-storm.png` — 137,457 B — sha256 `a6941c78…` — night storm approach to
   Mercusuar, rain, THICK lightning bolt visible in the sky over the valley
   centreline, lit runway, sea at the valley end. All text English.

## Verification done
- Headless playtest (puppeteer-core, cached Chrome 157, 1280x720): title -> briefing 1 ->
  fly -> banked turn -> pause/resume (key + button), 0 JS errors, 0 console errors.
  (One probe run showed pause/resume inverted on a 600 ms wait — re-checked with
  2 s waits: flying -> P -> paused -> P -> flying -> button -> paused. Correct;
  the first reading was a slow-SwiftShader timing artefact.)
- main.ts determinism: run twice from a FOREIGN cwd (/tmp, fresh MAKEFUN_OUTPUT_DIR
  each time): exit 0 both, dossier.json byte-identical (sha256 `508e691372feeb55…`).
- Kit check (trial, no bundle): 5 passed (competition_open, snapshot, license_osi,
  entrypoint, repo_created_after_open), 1 failed = transcripts_present (expected: no bundle
  yet), 16 skipped. Snapshot 47 files / 49,603,437 B (47 MB is the kit dir itself; within caps).
- Entrypoint run from a FOREIGN cwd (/tmp, MAKEFUN_OUTPUT_DIR=/tmp/pk3d-out): exit 0,
  dossier.json 983,486 B (text 90,227 B <= 163,840 cap; DOSSIER_MAX_BYTES is 4 MiB),
  12 game files / 692,839 B, 4 screenshots / 667,717 B — all within gate caps.
- Flight-model note: shot staging freezes the sim after 30 frames; crosswind can drift the
  plane a few degrees off the runway heading between runs (shot 4 final: hdg 300 vs rwy 300)
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
  over the valley centreline (not inside a ridge). FIX ROUND: the freeze-time showBolt
  offset (flight.x+30, +180, -350) put the bolt ~69 deg off-axis (out of frame) — the
  old staging flashLightning call also expired in 0.12 s before capture. Fix: heading-
  relative placement (480 m ahead, 40 m right, 220 m up) in main.js freeze block +
  remove the staging flash; showBolt persists (boltTimer 0).
- Shot 1 staging: gear must be UP in cruise (was down at 1923 ft) and the HUD ring
  count must match the visual — stage ringsDone = 2 with rings 1-2 green so the HUD
  reads RING 2/6 with gold ring 3 ahead.
- Cockpit interior (fix round): the first cockpit shot read as a floating slab. Fixes:
  canopy frame (slim posts + centre post + top bar + roof + side walls), panel bezel
  + screws + switch strip with indicator lights, wingtip stubs at the lower windscreen
  corners, and the real nose cone + spinning prop kept visible via setCockpitMode.
  TRAPS: keeping the wing visible covers the panel (the wing sits right under the
  camera); keeping the fuselage visible puts a white pyramid over the dials; a tall
  glareshield hides the nose cone. Keep list is now [nose, prop] only, glareshield
  low + thin, prop disc opacity 0.18 -> 0.3.
- ALL in-game text is English now (HUD, missions, briefings, buttons, message bar,
  done/pause screens); island names Zamrud / Karang / Atol / Mercusuar kept as proper
  names. Verified by grep: zero Indonesian strings left in game/ (only code comments
  were touched up too).
- All code was written FRESH in this session from DESIGN-SPEC.md (transcript gate); no code
  lines were read from the Gemini .html, v1, or v2 sources. `game/vendor/three.min.js` and
  `vendor/makefun-game.ts` are kit/vendor files, excluded from the gate.
