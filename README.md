# PULAU KURIR 3D

[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/zenfrog72/makefun-best-flight-game-3d/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/zenfrog72/makefun-best-flight-game-3d/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

Courier pilot flying medical cargo between four valley airfields on one big
tropical mountain island — real 3D with Three.js (vendored), a lit 3D
cockpit with working dials, a chase camera, and graded landings.

[Play the bounty on make.fun](https://make.fun/bounty/best-flight-game-20261126-0057)

## The game

- **4 missions**: Kargo Medis (deliver to Zamrud), Koridor Cincin (6 golden
  rings, then land at Karang), Pendaratan Ekspres (short-field landing at
  Atol on tight fuel), Badai Malam (night storm — rain, lightning,
  crosswind — land at Mercusuar).
- **Real flight model**: throttle, lift/stall, banking turns, flare,
  crosswind, fuel burn and damage. Landings are graded on touchdown rate
  and centreline offset (SMOOTH / GOOD / FIRM / HARD).
- **Two cameras**: chase (primary) and a lit 3D cockpit with working dials
  (airspeed, altimeter, attitude ball, compass, fuel, RPM).
- **Dense HUD**: mission panel, compass tape, speed + altitude tapes,
  attitude indicator, fuel/damage, timer, minimap, message bar.
- **World**: seeded low-poly heightmap island — snow peaks, pine forests,
  villages with lit windows, four runways with markings, edge lights and
  windsocks, sea with sun glint, golden-hour sky, drifting clouds and cloud
  shadows.
- **Sound**: WebAudio synth (engine, wind, chimes, touchdown, fanfare).
  No audio files, no network — everything is vendored under `game/`.

## Controls

Arrows / WASD pitch + turn, Shift throttle up, Ctrl/Z throttle down,
G gear, F flaps, B brake, C camera, P pause, M mute, mouse drag orbits
the chase camera.

## Play locally

Serve `game/` with any static server and open `game/index.html`
in desktop Chrome. Screenshots: `game/index.html?shot=1..4`.
