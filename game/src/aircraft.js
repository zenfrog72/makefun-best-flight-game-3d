// PULAU KURIR 3D — aircraft.js
// The courier plane: a detailed low-poly single-engine high-wing aircraft
// (red-white livery, spinning prop, gear, flaps, nav lights) and the flight
// model that flies it: throttle, lift/stall, banking turns, flare,
// crosswind, fuel and damage.
window.PK3D = window.PK3D || {};

PK3D.Aircraft = (function () {
  var C = PK3D.CONFIG;

  function mat(color, opts) {
    var o = { color: color, flatShading: true, shininess: 30 };
    if (opts) for (var k in opts) o[k] = opts[k];
    return new THREE.MeshPhongMaterial(o);
  }

  // Build the plane mesh. Forward is local -Z; rotation order YXZ.
  function buildAircraft() {
    var g = new THREE.Group();
    g.rotation.order = 'YXZ';
    var white = mat(0xf2f2ee), red = mat(0xd43a2a), dark = mat(0x22262e), grey = mat(0x8a8f96);

    // Fuselage: tapered cylinder along Z + nose cone + tail cone.
    var fus = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.62, 7.2, 8), white);
    fus.rotation.x = Math.PI / 2;
    fus.position.set(0, 0, 0.2);
    g.add(fus);
    var nose = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.0, 8), red);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0, -4.6);
    g.add(nose);
    var tail = new THREE.Mesh(new THREE.ConeGeometry(0.62, 2.2, 8), white);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0, 4.9);
    g.add(tail);
    // Belly stripe.
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 6.4), red);
    stripe.position.set(0, -0.85, 0.2);
    g.add(stripe);
    // Cockpit windows: dark windscreen + side windows.
    var shield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.5), dark);
    shield.position.set(0, 0.55, -2.6);
    shield.rotation.x = -0.35;
    g.add(shield);
    for (var s = -1; s <= 1; s += 2) {
      var win = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 1.8), dark);
      win.position.set(s * 1.0, 0.45, -1.6);
      g.add(win);
    }
    // High wing + red tips + struts.
    var wing = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.32, 2.7), white);
    wing.position.set(0, 1.05, -0.6);
    g.add(wing);
    for (var w = -1; w <= 1; w += 2) {
      var tip = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.36, 2.7), red);
      tip.position.set(w * 7.5, 1.05, -0.6);
      g.add(tip);
      var strut = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 5), grey);
      strut.position.set(w * 3.4, 0.1, -0.4);
      strut.rotation.z = w * 0.5;
      g.add(strut);
    }
    // Tail: horizontal stabiliser + red vertical fin.
    var stab = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.28, 1.7), white);
    stab.position.set(0, 0.5, 4.6);
    g.add(stab);
    var fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.7, 2.1), red);
    fin.position.set(0, 1.5, 4.7);
    g.add(fin);
    // Flaps (trailing edge, rotate down when on).
    var flapL = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 1.0), red);
    flapL.position.set(-3.9, 0.95, 0.95);
    g.add(flapL);
    var flapR = flapL.clone();
    flapR.position.x = 3.9;
    g.add(flapR);
    // Prop: spinner + two blades + blur disc, spinning around Z.
    var prop = new THREE.Group();
    prop.position.set(0, 0, -5.7);
    var spinner = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 8), red);
    spinner.rotation.x = -Math.PI / 2;
    prop.add(spinner);
    for (var b = 0; b < 2; b++) {
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.4, 0.12), dark);
      blade.rotation.z = b * Math.PI;
      blade.position.y = 0;
      prop.add(blade);
    }
    var disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 20),
      new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
    );
    prop.add(disc);
    g.add(prop);
    // Landing gear: two mains + nose wheel, extend/retract as a group.
    var gear = new THREE.Group();
    var gearMat = dark;
    for (var gg = -1; gg <= 1; gg += 2) {
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.0, 5), gearMat);
      leg.position.set(gg * 1.5, -1.6, -0.6);
      gear.add(leg);
      var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 10), gearMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(gg * 1.5, -2.5, -0.6);
      gear.add(wheel);
    }
    var noseLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 5), gearMat);
    noseLeg.position.set(0, -1.5, -3.2);
    gear.add(noseLeg);
    var noseWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.35, 10), gearMat);
    noseWheel.rotation.z = Math.PI / 2;
    noseWheel.position.set(0, -2.3, -3.2);
    gear.add(noseWheel);
    g.add(gear);
    // Nav lights: red left, green right, white tail.
    var navL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    navL.position.set(-8.0, 1.05, -0.6);
    g.add(navL);
    var navR = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), new THREE.MeshBasicMaterial({ color: 0x22ff66 }));
    navR.position.set(8.0, 1.05, -0.6);
    g.add(navR);
    var navT = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    navT.position.set(0, 0.6, 5.9);
    g.add(navT);
    // Soft blob shadow on the ground below the plane.
    var blob = new THREE.Mesh(
      new THREE.CircleGeometry(1, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
    );
    blob.rotation.x = -Math.PI / 2;
    blob.scale.set(9, 6, 1);
    g.add(blob);
    // The blob is re-parented to the scene by main.js (it must stay flat on
    // the ground, not bank with the plane); keep a reference here.
    return { group: g, prop: prop, gear: gear, flapL: flapL, flapR: flapR, navL: navL, navR: navR, navT: navT, blob: blob };
  }

  // ---- flight model ---------------------------------------------------------
  function createState() {
    return {
      x: 0, y: 0, z: 0, hdg: 0, pitch: 0, roll: 0,
      speedKt: 0, throttle: 0, vsFpm: 0, fuel: 100, damage: 0,
      gear: true, flaps: false, onGround: true, crashed: false,
      landed: false, airTimeS: 0, gearAnim: 1, flapAnim: 0,
    };
  }

  function spawnAt(state, fieldKey, fuelStart) {
    var f = C.AIRFIELDS[fieldKey];
    var rad = f.hdg * Math.PI / 180;
    state.x = f.x - Math.sin(rad) * (f.len / 2 - 80);
    state.z = f.z + Math.cos(rad) * (f.len / 2 - 80);
    state.y = f.elev + C.FLIGHT.gearHeightM;
    state.hdg = f.hdg;
    state.pitch = 0; state.roll = 0;
    state.speedKt = 0; state.throttle = 0; state.vsFpm = 0;
    state.fuel = fuelStart; state.damage = 0;
    state.gear = true; state.flaps = false;
    state.onGround = true; state.crashed = false; state.landed = false;
    state.airTimeS = 0; state.gearAnim = 1; state.flapAnim = 0;
  }

  function update(state, dt, input, env) {
    if (state.crashed) return;
    var F = C.FLIGHT;
    // Throttle.
    if (state.fuel <= 0) state.throttle = 0;
    else {
      if (input.throttleUp) state.throttle = Math.min(100, state.throttle + 60 * dt);
      if (input.throttleDown) state.throttle = Math.max(0, state.throttle - 60 * dt);
    }
    // Speed: acceleration model — thrust vs drag vs gravity along the
    // flight path, so dives gain speed and climbs bleed it.
    var thrust = (state.throttle / 100) * 20; // kt/s^2 at full throttle
    var gravity = -Math.sin(state.pitch * Math.PI / 180) * 19.06; // kt/s^2
    var drag = -Math.pow(state.speedKt / F.maxSpeedKt, 2) * 20;
    var accel = thrust + gravity + drag;
    if (state.flaps) accel -= 2.5;
    if (!state.gear) accel += 0.5;
    if (state.onGround && state.throttle < 20) accel -= 3; // rolling resistance
    state.speedKt = Math.max(0, state.speedKt + accel * dt);
    // Pitch + roll from input, authority grows with speed.
    var auth = state.onGround && state.speedKt < 55 ? 0 : (0.45 + 0.55 * (state.speedKt / F.maxSpeedKt));
    var pitchTarget = input.pitch * 20; // deg, + = nose up
    state.pitch += Math.max(-F.pitchRateDegS * auth * dt, Math.min(F.pitchRateDegS * auth * dt, pitchTarget - state.pitch));
    state.pitch = Math.max(-18, Math.min(22, state.pitch));
    var rollTarget = input.roll * F.maxRollDeg;
    state.roll += Math.max(-F.rollRateDegS * dt, Math.min(F.rollRateDegS * dt, rollTarget - state.roll));
    // Turn rate from bank.
    var vms = state.speedKt * 0.514444;
    if (vms > 12 && !state.onGround) {
      var turnRadS = 9.81 * Math.tan(state.roll * Math.PI / 180) / vms;
      state.hdg = (state.hdg + turnRadS * 57.2958 * dt + 360) % 360;
    }
    // Vertical speed: lift while above stall, sink below it.
    var stall = state.flaps ? F.stallFlapsKt : F.stallKt;
    var stalled = state.speedKt < stall && !state.onGround;
    var lift = stalled ? 0.25 : 1;
    var vs = Math.sin(state.pitch * Math.PI / 180) * state.speedKt * 101.27 * lift;
    if (stalled) { vs = Math.min(vs, -950); state.pitch += (-8 - state.pitch) * dt * 0.8; }
    // Flare: near the ground while descending with nose up, sink softens.
    var groundY = env.groundHeight(state.x, state.z);
    var agl = state.y - groundY;
    if (agl < 45 && vs < 0 && state.pitch > 2 && !state.onGround) vs *= 0.5;
    state.vsFpm = vs;
    // Move.
    var hdgRad = state.hdg * Math.PI / 180;
    var pitchRad = state.pitch * Math.PI / 180;
    state.x += Math.sin(hdgRad) * Math.cos(pitchRad) * vms * dt;
    state.z += -Math.cos(hdgRad) * Math.cos(pitchRad) * vms * dt;
    state.y += vs * 0.00508 * dt;
    if (!state.onGround) state.airTimeS += dt;
    // Crosswind drift while airborne.
    if (env.windKt > 0 && !state.onGround) {
      var wRad = env.windFromDeg * Math.PI / 180;
      state.x += Math.sin(wRad) * env.windKt * 0.514444 * 0.55 * dt;
      state.z += Math.cos(wRad) * env.windKt * 0.514444 * 0.55 * dt;
    }
    // Fuel burn.
    state.fuel = Math.max(0, state.fuel - (state.throttle / 100) * F.fuelBurnPerMin * dt / 60);
    // Ground contact.
    var touchY = groundY + F.gearHeightM;
    if (state.y <= touchY) {
      state.y = touchY;
      if (!state.onGround) {
        // Touchdown event — the caller grades it via onTouchdown.
        var vsAtTouch = state.vsFpm;
        state.onGround = true;
        state.vsFpm = 0;
        state.pitch = 0;
        if (env.onTouchdown) env.onTouchdown(vsAtTouch, state);
        if (vsAtTouch < F.damageCrashFpm || (!state.gear && state.speedKt > 80)) {
          state.crashed = true; state.damage = 100;
        } else if (vsAtTouch < F.damageHardFpm) {
          state.damage = Math.min(100, state.damage + 25);
        }
      }
      // Rollout: brake + drag slow the plane; steering at low speed.
      if (input.brake) state.speedKt = Math.max(0, state.speedKt - 40 * dt);
      else state.speedKt = Math.max(0, state.speedKt - 6 * dt);
      if (state.speedKt < 25) state.hdg = (state.hdg + input.roll * 18 * dt + 360) % 360;
    } else {
      state.onGround = false;
    }
    // Take-off rotation: leaving the ground needs speed.
    if (state.onGround && state.speedKt > 65 && state.pitch > 4) {
      state.onGround = false;
      state.y = touchY + 0.5;
    }
    // Terrain strike while flying low into a slope.
    if (!state.onGround && agl < 0.5 && state.vsFpm < -100) {
      state.crashed = true; state.damage = 100;
    }
    // Gear / flap animation.
    var gearTarget = state.gear ? 1 : 0;
    state.gearAnim += Math.max(-1.6 * dt, Math.min(1.6 * dt, gearTarget - state.gearAnim));
    var flapTarget = state.flaps ? 1 : 0;
    state.flapAnim += Math.max(-2.5 * dt, Math.min(2.5 * dt, flapTarget - state.flapAnim));
  }

  // Apply the flight state to the mesh (position, attitude, prop, gear...).
  function applyToMesh(parts, state, t, groundY, dt) {
    var g = parts.group;
    g.position.set(state.x, state.y, state.z);
    g.rotation.y = -state.hdg * Math.PI / 180;
    g.rotation.x = state.pitch * Math.PI / 180;
    g.rotation.z = -state.roll * Math.PI / 180;
    var spin = state.throttle > 2 ? (4 + state.throttle / 100 * 26) : 0.6;
    parts.prop.rotation.z += spin * dt;
    parts.gear.position.y = (1 - state.gearAnim) * 1.7;
    parts.gear.visible = state.gearAnim > 0.05;
    parts.flapL.rotation.x = state.flapAnim * 0.6;
    parts.flapR.rotation.x = state.flapAnim * 0.6;
    var blink = (t % 1.2) < 0.15;
    parts.navL.visible = blink; parts.navR.visible = blink;
    parts.navT.visible = (t % 1.0) < 0.5;
    // Blob shadow: flat on the ground under the plane, fades with height.
    var blob = parts.blob;
    if (blob.parent !== g) { /* re-parented to scene by main */ }
    var agl = Math.max(0, state.y - groundY);
    blob.position.set(state.x, groundY + 0.6, state.z);
    var s = Math.max(0.4, 1 - agl / 900);
    blob.scale.set(9 * s + 2, 6 * s + 1.5, 1);
    blob.material.opacity = 0.30 * s;
  }

  return { buildAircraft: buildAircraft, createState: createState, spawnAt: spawnAt, update: update, applyToMesh: applyToMesh };
})();
