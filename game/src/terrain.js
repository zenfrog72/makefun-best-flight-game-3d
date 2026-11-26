// PULAU KURIR 3D — terrain.js
// The island: a seeded low-poly heightmap with snow peaks, pine forests,
// villages, four valley airfields, sea, golden-hour sky and storm weather.
// groundHeight() is the single source of truth — the mesh, the flight
// model, the minimap and the screenshot staging all read the same function.
window.PK3D = window.PK3D || {};

PK3D.Terrain = (function () {
  var C = PK3D.CONFIG;
  var SEED = C.WORLD_SEED;

  // ---- deterministic noise -------------------------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash2(ix, iz, seed) {
    var h = (ix * 374761393 + iz * 668265263 + seed * 974634211) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967295;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function sstep(a, b, v) {
    var t = (v - a) / (b - a);
    if (t < 0) t = 0; if (t > 1) t = 1;
    return t * t * (3 - 2 * t);
  }
  function vnoise(x, z, seed) {
    var ix = Math.floor(x), iz = Math.floor(z);
    var fx = x - ix, fz = z - iz;
    var a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
    var c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
    var u = smooth(fx), v = smooth(fz);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, z, seed) {
    return vnoise(x, z, seed) * 0.65 + vnoise(x * 2.13 + 7.7, z * 2.13 + 3.1, seed) * 0.35;
  }
  function gauss(x, z, cx, cz, sigma) {
    var dx = x - cx, dz = z - cz;
    return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma));
  }

  // ---- the height function -------------------------------------------------
  function groundHeight(x, z) {
    var r = Math.sqrt(x * x + z * z);
    var coast = 1 - sstep(2950, 3450, r);
    if (coast <= 0) return -30; // seabed
    var h = fbm(x * 0.00045, z * 0.00045, 2) * 150;
    h += 750 * gauss(x, z, -900, -1400, 900);    // north-west peak
    h += 620 * gauss(x, z, 1200, -600, 850);     // east ridge
    h += 420 * gauss(x, z, 300, 1600, 1000);     // south hill
    h += fbm(x * 0.0016, z * 0.0016, 3) * 50;
    h = h * coast - 12 * (1 - coast);
    // Flatten a pad around every airfield so runways sit on level ground.
    // Runway long axis = heading direction (sin hdg, -cos hdg) in (x, z).
    for (var key in C.AIRFIELDS) {
      var f = C.AIRFIELDS[key];
      var dx = x - f.x, dz = z - f.z;
      var rad = f.hdg * Math.PI / 180;
      var along = dx * Math.sin(rad) - dz * Math.cos(rad);
      var across = dx * Math.cos(rad) + dz * Math.sin(rad);
      var ra = f.len / 2 + 900, rb = 300;
      var e = Math.sqrt((along / ra) * (along / ra) + (across / rb) * (across / rb));
      var blend = 1 - sstep(0.72, 1.0, e);
      if (blend > 0) h = h * (1 - blend) + f.elev * blend;
    }
    return h;
  }

  function terrainColor(h, x, z, out) {
    var n = vnoise(x * 0.01, z * 0.01, 9);
    var r, g, b;
    if (h < 4) { r = 0.85; g = 0.74; b = 0.52; }            // sand
    else if (h < 260) {                                     // grass
      var t = sstep(4, 260, h);
      r = 0.30 + 0.10 * t; g = 0.48 + 0.06 * t; b = 0.23;
    } else if (h < 520) { r = 0.22; g = 0.40; b = 0.18; }   // forest floor
    else if (h < 700) {                                     // rock
      var t2 = sstep(520, 700, h);
      r = 0.42 + 0.06 * t2; g = 0.36 + 0.06 * t2; b = 0.30;
    } else { r = 0.95; g = 0.96; b = 0.98; }                // snow
    var shade = 0.92 + n * 0.16;
    out[0] = r * shade; out[1] = g * shade; out[2] = b * shade;
  }

  // ---- sky palettes --------------------------------------------------------
  var SKIES = {
    gold:  { top: [0.13, 0.16, 0.42], mid: [0.55, 0.32, 0.55], hor: [1.0, 0.60, 0.24], fog: 0xe08a4a, sun: 1.35, hemi: 0.55 },
    dusk:  { top: [0.08, 0.10, 0.30], mid: [0.38, 0.22, 0.42], hor: [0.95, 0.42, 0.20], fog: 0xb05a3a, sun: 0.95, hemi: 0.42 },
    night: { top: [0.02, 0.03, 0.08], mid: [0.05, 0.08, 0.15], hor: [0.11, 0.17, 0.27], fog: 0x0d1526, sun: 0.35, hemi: 0.30 },
  };

  // ---- build ---------------------------------------------------------------
  function build(scene) {
    var api = { weather: 'gold', groundHeight: groundHeight, clouds: [], cloudShadows: [], windsocks: [], rain: null, bolt: null, boltTimer: 0, skyMesh: null, sunLight: null, hemiLight: null, beacon: null };

    // Terrain mesh: non-indexed so every face gets its own flat normal.
    var seg = 110, size = C.WORLD_SIZE;
    var geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)));
    }
    geo = geo.toNonIndexed();
    geo.computeVertexNormals();
    var p2 = geo.attributes.position;
    var colors = new Float32Array(p2.count * 3);
    var c = [0, 0, 0];
    for (var f = 0; f < p2.count; f += 3) {
      var cx = (p2.getX(f) + p2.getX(f + 1) + p2.getX(f + 2)) / 3;
      var cz = (p2.getZ(f) + p2.getZ(f + 1) + p2.getZ(f + 2)) / 3;
      var cy = (p2.getY(f) + p2.getY(f + 1) + p2.getY(f + 2)) / 3;
      terrainColor(cy, cx, cz, c);
      for (var k = 0; k < 3; k++) {
        colors[(f + k) * 3] = c[0]; colors[(f + k) * 3 + 1] = c[1]; colors[(f + k) * 3 + 2] = c[2];
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var terrain = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 0 }));
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Sea.
    var sea = new THREE.Mesh(
      new THREE.PlaneGeometry(16000, 16000),
      new THREE.MeshPhongMaterial({ color: 0x14506e, shininess: 140, specular: 0xffd9a0 })
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = C.SEA_LEVEL;
    scene.add(sea);

    // Sky dome (vertex-colour gradient, rewritten by setWeather).
    var skyGeo = new THREE.SphereGeometry(9500, 24, 16);
    var sp = skyGeo.attributes.position;
    var skyCol = new Float32Array(sp.count * 3);
    skyGeo.setAttribute('color', new THREE.BufferAttribute(skyCol, 3));
    var sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
    scene.add(sky);
    api.skyMesh = sky;

    // Lights.
    var sun = new THREE.DirectionalLight(C.SUN.color, C.SUN.intensity);
    var az = C.SUN.azimuthDeg * Math.PI / 180, el = C.SUN.elevationDeg * Math.PI / 180;
    sun.position.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(5000);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -700; sun.shadow.camera.right = 700;
    sun.shadow.camera.top = 700; sun.shadow.camera.bottom = -700;
    sun.shadow.camera.far = 12000;
    sun.shadow.bias = -0.0008;
    scene.add(sun);
    scene.add(sun.target);
    api.sunLight = sun;
    var hemi = new THREE.HemisphereLight(C.SUN.hemiSky, C.SUN.hemiGround, C.SUN.hemiIntensity);
    scene.add(hemi);
    api.hemiLight = hemi;

    // Clouds: flattened white blobs drifting slowly.
    var rng = mulberry32(SEED + 11);
    var cloudMat = new THREE.MeshLambertMaterial({ color: 0xfff2e2 });
    var blobGeo = new THREE.SphereGeometry(1, 7, 5);
    for (var ci = 0; ci < 14; ci++) {
      var cluster = new THREE.Group();
      var puffs = 3 + Math.floor(rng() * 4);
      for (var pi = 0; pi < puffs; pi++) {
        var puff = new THREE.Mesh(blobGeo, cloudMat);
        var s = 60 + rng() * 110;
        puff.scale.set(s, s * 0.32, s * 0.7);
        puff.position.set((rng() - 0.5) * 260, (rng() - 0.5) * 30, (rng() - 0.5) * 140);
        cluster.add(puff);
      }
      cluster.position.set((rng() - 0.5) * 6400, 560 + rng() * 180, (rng() - 0.5) * 6400);
      cluster.userData.speed = 6 + rng() * 10;
      scene.add(cluster);
      api.clouds.push(cluster);
      // Soft shadow ellipse for a few clouds.
      if (ci < 6) {
        var sh = new THREE.Mesh(
          new THREE.CircleGeometry(1, 20),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.10, depthWrite: false })
        );
        sh.rotation.x = -Math.PI / 2;
        var ss = 180 + rng() * 120;
        sh.scale.set(ss, ss * 0.7, 1);
        sh.position.set(cluster.position.x, 2, cluster.position.z);
        scene.add(sh);
        api.cloudShadows.push({ mesh: sh, cloud: cluster });
      }
    }

    // Pine forests: instanced trunks + two-tier cone canopies.
    var treeSpots = [];
    var trng = mulberry32(SEED + 23);
    var tries = 0;
    while (treeSpots.length < 850 && tries < 6000) {
      tries++;
      var tx = (trng() - 0.5) * 6200, tz = (trng() - 0.5) * 6200;
      var th = groundHeight(tx, tz);
      if (th < 25 || th > 480) continue;
      var nearField = false;
      for (var fk in C.AIRFIELDS) {
        var ff = C.AIRFIELDS[fk];
        if (Math.hypot(tx - ff.x, tz - ff.z) < 380) { nearField = true; break; }
      }
      if (nearField) continue;
      treeSpots.push({ x: tx, z: tz, h: th, s: 0.8 + trng() * 0.9, r: trng() * Math.PI * 2 });
    }
    var dummy = new THREE.Object3D();
    var trunkGeo = new THREE.CylinderGeometry(0.5, 0.9, 6, 5);
    var coneGeo = new THREE.ConeGeometry(4.4, 15, 6);
    var topGeo = new THREE.ConeGeometry(2.8, 10, 6);
    var trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x5a3d24 }), treeSpots.length);
    var cones = new THREE.InstancedMesh(coneGeo, new THREE.MeshLambertMaterial({ color: 0x2c5a26 }), treeSpots.length);
    var tops = new THREE.InstancedMesh(topGeo, new THREE.MeshLambertMaterial({ color: 0x3a7030 }), treeSpots.length);
    for (var ti = 0; ti < treeSpots.length; ti++) {
      var t = treeSpots[ti];
      dummy.position.set(t.x, t.h + 3 * t.s, t.z);
      dummy.scale.setScalar(t.s); dummy.rotation.set(0, t.r, 0); dummy.updateMatrix();
      trunks.setMatrixAt(ti, dummy.matrix);
      dummy.position.set(t.x, t.h + 11 * t.s, t.z); dummy.updateMatrix();
      cones.setMatrixAt(ti, dummy.matrix);
      dummy.position.set(t.x, t.h + 19 * t.s, t.z); dummy.updateMatrix();
      tops.setMatrixAt(ti, dummy.matrix);
    }
    scene.add(trunks); scene.add(cones); scene.add(tops);

    // Villages near airfields: instanced walls, roofs, lit windows.
    var houses = [];
    var hrng = mulberry32(SEED + 41);
    for (var hk in C.AIRFIELDS) {
      var hf = C.AIRFIELDS[hk];
      for (var hi = 0; hi < 10; hi++) {
        var ang = hrng() * Math.PI * 2, dist = 260 + hrng() * 320;
        var hx = hf.x + Math.cos(ang) * dist, hz = hf.z + Math.sin(ang) * dist;
        var hh = groundHeight(hx, hz);
        if (hh < 4) continue;
        houses.push({ x: hx, z: hz, h: hh, s: 0.9 + hrng() * 0.5, r: hrng() * Math.PI });
      }
    }
    var walls = new THREE.InstancedMesh(new THREE.BoxGeometry(10, 6, 8), new THREE.MeshLambertMaterial({ color: 0xf2e8d5 }), houses.length);
    var roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(7.6, 4.5, 4), new THREE.MeshLambertMaterial({ color: 0xb4502e }), houses.length);
    var wins = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 1.7, 0.4), new THREE.MeshBasicMaterial({ color: 0xffc861 }), houses.length * 2);
    for (var hi2 = 0; hi2 < houses.length; hi2++) {
      var hh2 = houses[hi2];
      dummy.position.set(hh2.x, hh2.h + 3 * hh2.s, hh2.z);
      dummy.scale.setScalar(hh2.s); dummy.rotation.set(0, hh2.r, 0); dummy.updateMatrix();
      walls.setMatrixAt(hi2, dummy.matrix);
      dummy.position.set(hh2.x, hh2.h + 8 * hh2.s, hh2.z); dummy.rotation.set(0, hh2.r + Math.PI / 4, 0); dummy.updateMatrix();
      roofs.setMatrixAt(hi2, dummy.matrix);
      dummy.position.set(hh2.x + 5.1 * hh2.s, hh2.h + 3.5 * hh2.s, hh2.z); dummy.scale.setScalar(hh2.s); dummy.rotation.set(0, hh2.r, 0); dummy.updateMatrix();
      wins.setMatrixAt(hi2 * 2, dummy.matrix);
      dummy.position.set(hh2.x - 5.1 * hh2.s, hh2.h + 3.5 * hh2.s, hh2.z); dummy.updateMatrix();
      wins.setMatrixAt(hi2 * 2 + 1, dummy.matrix);
    }
    scene.add(walls); scene.add(roofs); scene.add(wins);

    // Runways: strip, dashes, thresholds, edge lights, windsock, number.
    api.runways = {};
    for (var rk in C.AIRFIELDS) {
      var rf = C.AIRFIELDS[rk];
      var grp = new THREE.Group();
      grp.position.set(rf.x, rf.elev + 0.8, rf.z);
      // Local +X must map to the heading direction (sin hdg, -cos hdg),
      // so the strip runs along the runway heading.
      grp.rotation.y = Math.PI / 2 - rf.hdg * Math.PI / 180;
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(rf.len, 1.6, 34),
        new THREE.MeshPhongMaterial({ color: 0x2a2d33, shininess: 8 })
      );
      strip.receiveShadow = true;
      grp.add(strip);
      var dashMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f0 });
      var dashGeo = new THREE.BoxGeometry(14, 0.4, 2.4);
      for (var di = -4; di <= 4; di++) {
        var dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.set(di * 90, 1.0, 0);
        grp.add(dash);
      }
      for (var ti2 = -1; ti2 <= 1; ti2 += 2) {
        for (var tj = -1; tj <= 1; tj++) {
          var bar = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 5), dashMat);
          bar.position.set(ti2 * (rf.len / 2 - 24), 1.0, tj * 11);
          grp.add(bar);
        }
      }
      // Edge lights: instanced amber spheres along both edges.
      var lightCount = Math.floor(rf.len / 90) * 2;
      var edge = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1.3, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0xffc861 }),
        lightCount
      );
      var li = 0;
      for (var lj = 0; lj < lightCount / 2; lj++) {
        var lx = -rf.len / 2 + 20 + lj * 90;
        dummy.position.set(lx, 1.6, -18); dummy.scale.setScalar(1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
        edge.setMatrixAt(li++, dummy.matrix);
        dummy.position.set(lx, 1.6, 18); dummy.updateMatrix();
        edge.setMatrixAt(li++, dummy.matrix);
      }
      grp.add(edge);
      // Runway number painted on a canvas texture at the threshold.
      var cnv = document.createElement('canvas');
      cnv.width = 256; cnv.height = 128;
      var ctx = cnv.getContext('2d');
      ctx.fillStyle = '#2a2d33'; ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#f5f5f0'; ctx.font = 'bold 84px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(rf.num, 128, 68);
      var numTex = new THREE.CanvasTexture(cnv);
      var numPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(52, 26),
        new THREE.MeshBasicMaterial({ map: numTex })
      );
      numPlane.rotation.x = -Math.PI / 2;
      numPlane.rotation.z = Math.PI;
      numPlane.position.set(-rf.len / 2 + 60, 1.05, 0);
      grp.add(numPlane);
      // Windsock: pole + cone pointing into the wind.
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 16, 6), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
      pole.position.set(rf.len / 2 - 30, 8, 26);
      grp.add(pole);
      var sock = new THREE.Mesh(new THREE.ConeGeometry(2.2, 12, 8), new THREE.MeshLambertMaterial({ color: 0xff7a1a }));
      sock.rotation.z = Math.PI / 2;
      sock.position.set(rf.len / 2 - 38, 15, 26);
      grp.add(sock);
      api.windsocks.push({ cone: sock, group: grp });
      scene.add(grp);
      api.runways[rk] = { field: rf, group: grp };
    }

    // Lighthouse at Mercusuar: banded tower + rotating beam.
    var mf = C.AIRFIELDS.mercusuar;
    var tower = new THREE.Group();
    tower.position.set(mf.x + 120, groundHeight(mf.x + 120, mf.z + 60), mf.z + 60);
    var tBase = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, 46, 10), new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }));
    tBase.position.y = 23; tower.add(tBase);
    var tBand = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.8, 10, 10), new THREE.MeshLambertMaterial({ color: 0xd43a2a }));
    tBand.position.y = 26; tower.add(tBand);
    var tLamp = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
    tLamp.position.y = 48; tower.add(tLamp);
    var beam = new THREE.Mesh(
      new THREE.ConeGeometry(7, 130, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
    );
    beam.rotation.z = Math.PI / 2;
    beam.position.set(65, 48, 0);
    var beamPivot = new THREE.Group();
    beamPivot.position.y = 48;
    beamPivot.add(beam);
    tower.add(beamPivot);
    scene.add(tower);
    api.beacon = beamPivot;

    // Rain (storm only): instanced streaks around the camera.
    var rainGeo = new THREE.BoxGeometry(0.14, 7, 0.14);
    var rain = new THREE.InstancedMesh(rainGeo, new THREE.MeshBasicMaterial({ color: 0xaac4de, transparent: true, opacity: 0.45 }), 380);
    rain.visible = false;
    scene.add(rain);
    api.rain = rain;
    api.rainDrops = [];
    var rrng = mulberry32(SEED + 77);
    for (var ri = 0; ri < 380; ri++) {
      api.rainDrops.push({ x: (rrng() - 0.5) * 520, y: rrng() * 260, z: (rrng() - 0.5) * 520 });
    }

    // Lightning bolt: jagged white segments, hidden until flash().
    // Thick (r=4) with accumulating horizontal offsets so the zigzag
    // reads as one connected bolt at screenshot distance.
    var bolt = new THREE.Group();
    var boltMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var bx = 0, by = 0, bz = 0;
    for (var bi = 0; bi < 5; bi++) {
      var segLen = 60 + Math.random() * 40;
      var seg = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, segLen, 5), boltMat);
      bx += (Math.random() - 0.5) * 80;
      bz += (Math.random() - 0.5) * 40;
      seg.position.set(bx, by - segLen / 2, bz);
      seg.rotation.z = (Math.random() - 0.5) * 0.9;
      bolt.add(seg);
      by -= segLen;
    }
    bolt.visible = false;
    scene.add(bolt);
    api.bolt = bolt;

    api.setWeather = function (mode) {
      api.weather = mode;
      var pal = SKIES[mode] || SKIES.gold;
      var sc = api.skyMesh.geometry.attributes.color;
      for (var vi = 0; vi < sc.count; vi++) {
        var y = api.skyMesh.geometry.attributes.position.getY(vi) / 9500;
        var col;
        if (y > 0.45) col = pal.top;
        else if (y > 0.08) col = pal.mid;
        else if (y > -0.05) col = pal.hor;
        else col = [0.10, 0.08, 0.14];
        sc.setXYZ(vi, col[0], col[1], col[2]);
      }
      sc.needsUpdate = true;
      scene.fog = new THREE.Fog(pal.fog, mode === 'night' ? 900 : 2400, mode === 'night' ? 6200 : 9500);
      api.sunLight.intensity = pal.sun;
      api.hemiLight.intensity = pal.hemi;
      api.rain.visible = (mode === 'night');
    };

    api.flashLightning = function (x, y, z) {
      api.bolt.position.set(x, y, z);
      api.bolt.visible = true;
      api.sunLight.intensity = 4.5;
      api.boltTimer = 0.12;
    };

    // Show the bolt without the light spike (for frozen screenshots).
    api.showBolt = function (x, y, z) {
      api.bolt.position.set(x, y, z);
      api.bolt.visible = true;
      api.boltTimer = 0;
    };

    api.update = function (dt, t, camPos, planePos) {
      for (var ci2 = 0; ci2 < api.clouds.length; ci2++) {
        var cl = api.clouds[ci2];
        cl.position.x += cl.userData.speed * dt;
        if (cl.position.x > 3600) cl.position.x = -3600;
      }
      for (var si = 0; si < api.cloudShadows.length; si++) {
        var sh2 = api.cloudShadows[si];
        sh2.mesh.position.x = sh2.cloud.position.x;
        sh2.mesh.position.z = sh2.cloud.position.z;
        sh2.mesh.position.y = groundHeight(sh2.mesh.position.x, sh2.mesh.position.z) + 2;
      }
      // Windsock points into the wind (wind blows from 90 deg in gold,
      // from 270 deg in the storm).
      var windFrom = api.weather === 'night' ? 270 : 90;
      for (var wi = 0; wi < api.windsocks.length; wi++) {
        api.windsocks[wi].cone.rotation.y = windFrom * Math.PI / 180;
      }
      if (api.beacon) api.beacon.rotation.y = t * 0.7;
      // Rain falls around the camera.
      if (api.rain.visible && camPos) {
        for (var ri2 = 0; ri2 < api.rainDrops.length; ri2++) {
          var d = api.rainDrops[ri2];
          d.y -= 300 * dt;
          if (d.y < -40) { d.y = 220; d.x = (Math.random() - 0.5) * 520; d.z = (Math.random() - 0.5) * 520; }
          dummy.position.set(camPos.x + d.x, camPos.y + d.y, camPos.z + d.z);
          dummy.scale.setScalar(1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
          api.rain.setMatrixAt(ri2, dummy.matrix);
        }
        api.rain.instanceMatrix.needsUpdate = true;
      }
      // Lightning bolt lifetime.
      if (api.boltTimer > 0) {
        api.boltTimer -= dt;
        if (api.boltTimer <= 0) {
          api.bolt.visible = false;
          var pal2 = SKIES[api.weather] || SKIES.gold;
          api.sunLight.intensity = pal2.sun;
        }
      }
      // Shadow camera follows the plane so the soft shadow stays crisp.
      if (planePos) {
        api.sunLight.position.set(
          planePos.x + Math.cos(el) * Math.sin(az) * 900,
          planePos.y + Math.sin(el) * 900 + 400,
          planePos.z + Math.cos(el) * Math.cos(az) * 900
        );
        api.sunLight.target.position.set(planePos.x, planePos.y, planePos.z);
        api.sunLight.target.updateMatrixWorld();
      }
    };

    api.setWeather('gold');
    return api;
  }

  return { groundHeight: groundHeight, build: build };
})();
