// PULAU KURIR 3D — config.js
// One place for every tunable number: world size, airfields, flight tuning,
// mission definitions. Nothing here draws or moves; other modules read it.
window.PK3D = window.PK3D || {};

PK3D.CONFIG = {
  // World: one big mountain island, 7200 x 7200 units (1 unit = 1 m).
  WORLD_SIZE: 7200,
  SEA_LEVEL: 0,
  // Seeded PRNG seed for terrain / forest / village placement.
  WORLD_SEED: 20261126,

  // Airfields: flat pads carved into the terrain. hdg = runway heading deg.
  AIRFIELDS: {
    zamrud:    { name: 'Zamrud',    x: 1050,  z:  750, hdg: 80,  len: 900, elev: 26, num: '08' },
    karang:    { name: 'Karang',    x: -1500, z: -950, hdg: 250, len: 900, elev: 34, num: '25' },
    atol:      { name: 'Atol',      x:  700,  z: 2350, hdg: 40,  len: 620, elev: 12, num: '04' },
    mercusuar: { name: 'Mercusuar', x: -700,  z: -2450, hdg: 300, len: 900, elev: 48, num: '30' },
  },

  // Flight tuning (speeds in knots, altitudes in feet for the HUD).
  FLIGHT: {
    maxSpeedKt: 168,      // full throttle, level
    cruiseSpeedKt: 128,
    stallKt: 62,          // clean stall
    stallFlapsKt: 55,     // with flaps
    climbRateFpm: 1400,   // full throttle climb
    maxRollDeg: 55,
    rollRateDegS: 70,
    pitchRateDegS: 26,
    gearHeightM: 2.2,     // wheels touch when y <= ground + this
    fuelBurnPerMin: 1.6,  // % per minute at full throttle
    damageHardFpm: -650,  // touchdown harder than this hurts
    damageCrashFpm: -1100,
    crosswindStormKt: 18,
  },

  // Golden-hour lighting.
  SUN: {
    azimuthDeg: 262,      // low sun in the west
    elevationDeg: 14,
    color: 0xffb36b,
    intensity: 1.35,
    hemiSky: 0x8a7fd0,
    hemiGround: 0x4a3a28,
    hemiIntensity: 0.55,
  },

  // Missions in order. weather: 'gold' | 'dusk' | 'night'.
  MISSIONS: [
    {
      id: 1, key: 'medis', name: 'MEDICAL CARGO',
      objective: 'Deliver medical cargo to Zamrud Island',
      detail: 'Fly the medical package from Karang to the Zamrud runway and land smoothly.',
      start: 'karang', target: 'zamrud', weather: 'gold',
      fuelStart: 100, timeLimitS: 240, kind: 'land',
    },
    {
      id: 2, key: 'cincin', name: 'RING CORRIDOR',
      objective: 'Fly 6 rings, then land at Karang',
      detail: 'Navigate the plane through 6 golden rings over the valley, then land at Karang.',
      start: 'zamrud', target: 'karang', weather: 'gold',
      fuelStart: 100, timeLimitS: 270, kind: 'rings', rings: 6,
      // Valley route for the rings (waypoints stay in the green valleys
      // between the peaks, so the corridor reads as a valley run).
      ringPath: [[700, 1050], [100, 1250], [-500, 900], [-1000, 350], [-1350, -250], [-1450, -700]],
    },
    {
      id: 3, key: 'ekspres', name: 'EXPRESS LANDING',
      objective: 'Land on the short runway at Atol Island',
      detail: 'Fast approach to the short Atol runway. Watch your speed and descent rate — tight fuel.',
      start: 'karang', target: 'atol', weather: 'dusk',
      fuelStart: 72, timeLimitS: 180, kind: 'land',
    },
    {
      id: 4, key: 'badai', name: 'NIGHT STORM',
      objective: 'Land at Mercusuar through the storm',
      detail: 'Fly through rain, lightning, and crosswind to the Mercusuar runway beacon.',
      start: 'zamrud', target: 'mercusuar', weather: 'night',
      fuelStart: 100, timeLimitS: 270, kind: 'land', storm: true,
    },
  ],

  // Landing grade bands: [max sink fpm, max centreline m] -> label.
  LANDING_GRADES: [
    { label: 'SMOOTH',  maxSink: -220, maxOff: 6,  score: 100 },
    { label: 'GOOD',    maxSink: -380, maxOff: 12, score: 80 },
    { label: 'FIRM',    maxSink: -650, maxOff: 20, score: 60 },
    { label: 'HARD',    maxSink: -1100, maxOff: 40, score: 30 },
  ],
};
