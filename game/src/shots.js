// PULAU KURIR 3D — shots.js
// Screenshot staging: ?shot=1..4&seed=N freezes the sim at a composed
// moment — chase over the valley, lit cockpit on final, short-field flare,
// night storm approach. Each shot must read clearly at small size: plane +
// target + HUD legible, no empty frames.
window.PK3D = window.PK3D || {};

PK3D.Shots = (function () {
  var C = PK3D.CONFIG;

  function placeBefore(G, tx, tz, ty, hdgDeg, distBack, rollDeg, speedKt, throttle, gear, flaps, pitchDeg) {
    var st = G.flight;
    var rad = hdgDeg * Math.PI / 180;
    st.x = tx - Math.sin(rad) * distBack;
    st.z = tz + Math.cos(rad) * distBack;
    st.y = ty;
    st.hdg = hdgDeg;
    st.pitch = pitchDeg || 0;
    st.roll = rollDeg || 0;
    st.speedKt = speedKt;
    st.throttle = throttle;
    st.gear = gear; st.gearAnim = gear ? 1 : 0;
    st.flaps = flaps; st.flapAnim = flaps ? 1 : 0;
    st.onGround = false;
    st.fuel = 88; st.damage = 0;
    st.vsFpm = (pitchDeg || 0) < 0 ? -420 : 120;
  }

  function headingTo(x1, z1, x2, z2) {
    return (Math.atan2(x2 - x1, -(z2 - z1)) * 180 / Math.PI + 360) % 360;
  }

  // Stage shot n (1..4). Returns a short label for the probe log.
  // NOTE: setMission returns the new mission — keep G.mission in sync.
  function stage(n, G) {
    var F = C.AIRFIELDS;
    if (n === 1) {
      // Cover: ring corridor, chase, golden hour — golden ring ahead,
      // Karang runway + village in the valley, snow peaks behind.
      G.mission = G.setMission(1); // mission index 1 = Koridor Cincin
      var ring = G.mission.rings[2];
      var prev = G.mission.rings[1];
      // Approach along the course (ring 2 -> ring 3) so the plane flies
      // through the ring toward Karang.
      var hdg = headingTo(prev.x, prev.z, ring.x, ring.z);
      placeBefore(G, ring.x, ring.z, ring.y + 6, hdg, 280, 24, 132, 80, true, false, 1);
      G.setCamera('chase');
      G.setOrbit(0.45, 0.05); // 3/4 angle so the banked wing reads
      G.mission.message = 'Koridor Cincin — lewati 6 cincin, lalu mendarat di Karang';
      return 'cover ring-corridor chase';
    }
    if (n === 2) {
      // Lit 3D cockpit on final to Zamrud: gear down, dials glowing,
      // runway centred ahead through the windscreen.
      G.mission = G.setMission(0);
      var zf = F.zamrud;
      placeBefore(G, zf.x, zf.z, zf.elev + 45, zf.hdg, 320, 0, 86, 55, true, true, -3);
      G.setCamera('cockpit');
      G.mission.message = 'Kargo Medis — final ke landasan Zamrud 08';
      return 'cockpit final zamrud';
    }
    if (n === 3) {
      // Short-field express landing at Atol, dusk: low over the threshold,
      // gear + flaps, flare.
      G.mission = G.setMission(2);
      var af = F.atol;
      placeBefore(G, af.x, af.z, af.elev + 55, af.hdg, 420, -6, 78, 48, true, true, -4);
      G.setCamera('chase');
      G.mission.message = 'Pendaratan Ekspres — runway pendek Pulau Atol';
      return 'landing atol dusk';
    }
    // 4: Night storm approach to Mercusuar: rain, lightning frozen
    // mid-flash, lit runway + lighthouse beam ahead.
    G.mission = G.setMission(3);
    var mf = F.mercusuar;
    placeBefore(G, mf.x, mf.z, mf.elev + 160, mf.hdg, 620, 8, 104, 70, true, false, -3);
    G.setCamera('chase');
    G.terrain.flashLightning(G.flight.x + 260, G.flight.y + 320, G.flight.z - 420);
    G.mission.message = 'Badai Malam — mendarat di Mercusuar menembus badai';
    return 'storm mercusuar night';
  }

  return { stage: stage };
})();
