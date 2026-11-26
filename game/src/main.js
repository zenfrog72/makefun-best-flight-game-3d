// PULAU KURIR 3D — main.js
// Bootstrap, game states (title / briefing / flying / paused / done),
// the frame loop, and screenshot mode (?shot=1..4) which freezes the sim
// at a staged moment and sets window.__shotReady for the capture probe.
(function () {
  var params = new URLSearchParams(location.search);
  var shotNum = parseInt(params.get('shot') || '0', 10);
  window.__errors = [];
  window.addEventListener('error', function (e) { window.__errors.push(String(e.message)); });

  var C = PK3D.CONFIG;
  var renderer, scene, camera, terrain, parts, cockpit, flight, mission = null;
  var missionIndex = 0, cameraMode = 'chase';
  var state = 'title'; // title | briefing | flying | paused | done
  var frozen = false, frames = 0, elapsed = 0, lastT = 0;
  var windKt = 4, windFromDeg = 90;

  function $(id) { return document.getElementById(id); }

  function setWeatherFor(def) {
    terrain.setWeather(def.weather);
    if (def.storm) { windKt = C.FLIGHT.crosswindStormKt; windFromDeg = 270; }
    else { windKt = 4; windFromDeg = 90; }
  }

  function setMission(i) {
    missionIndex = i;
    var def = C.MISSIONS[i];
    if (mission) PK3D.Missions.destroy(mission, scene);
    mission = PK3D.Missions.create(def, scene, terrain);
    PK3D.Aircraft.spawnAt(flight, def.start, def.fuelStart);
    setWeatherFor(def);
    PK3D.Cameras.resetChase();
    PK3D.HUD.setMessage(def.objective);
    return mission;
  }

  function setCamera(mode) {
    cameraMode = mode;
    PK3D.Cameras.setCockpitMode(parts, mode === 'cockpit');
    var btn = $('hud-cam');
    if (btn) btn.textContent = mode === 'cockpit' ? 'KOKPIT [C]' : 'CHASE [C]';
  }

  function show(id) {
    ['screen-title', 'screen-briefing', 'screen-done', 'screen-pause'].forEach(function (s) {
      var n = $(s);
      if (n) n.style.display = s === id ? 'flex' : 'none';
    });
  }

  function openBriefing(i) {
    setMission(i);
    var def = C.MISSIONS[i];
    $('brief-name').textContent = 'MISI ' + def.id + ': ' + def.name;
    $('brief-detail').textContent = def.detail;
    $('brief-meta').textContent = 'Target: ' + C.AIRFIELDS[def.target].name +
      '  •  Bahan bakar ' + def.fuelStart + '%  •  Batas waktu ' +
      Math.floor(def.timeLimitS / 60) + ':' + String(def.timeLimitS % 60).padStart(2, '0');
    state = 'briefing';
    show('screen-briefing');
  }

  function startFlying() {
    state = 'flying';
    show(null);
    PK3D.Audio.ensure();
  }

  function openDone(title, body, grade) {
    $('done-title').textContent = title;
    $('done-body').textContent = body;
    $('done-grade').textContent = grade || '';
    state = 'done';
    show('screen-done');
  }

  function init() {
    // ?fast=1 is a test/debug aid for slow software renderers (headless
    // SwiftShader): no antialias, no preserved drawing buffer, no shadow
    // map. The shipped game always runs with all three on.
    var fast = !!params.get('fast');
    renderer = new THREE.WebGLRenderer({ antialias: !fast, preserveDrawingBuffer: !fast });
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !fast && !params.get('noshadow');
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    $('game-container').appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 20000);
    terrain = PK3D.Terrain.build(scene);
    parts = PK3D.Aircraft.buildAircraft();
    scene.add(parts.group);
    // The blob shadow must lie flat on the ground, not bank with the plane.
    parts.group.remove(parts.blob);
    scene.add(parts.blob);
    cockpit = PK3D.Cameras.buildCockpit(parts);
    flight = PK3D.Aircraft.createState();
    PK3D.HUD.init();
    PK3D.Input.init(renderer.domElement);
    setMission(0);
    setCamera('chase');

    // Title-screen mission buttons.
    document.querySelectorAll('[data-mission]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        PK3D.Audio.ensure();
        openBriefing(parseInt(btn.getAttribute('data-mission'), 10));
      });
    });
    $('btn-fly').addEventListener('click', startFlying);
    $('btn-next').addEventListener('click', function () {
      openBriefing((missionIndex + 1) % C.MISSIONS.length);
    });
    $('btn-retry').addEventListener('click', function () { openBriefing(missionIndex); });
    $('btn-resume').addEventListener('click', function () { state = 'flying'; show(null); });
    $('btn-sound').addEventListener('click', function () {
      PK3D.Audio.ensure();
      PK3D.Audio.setMuted(!PK3D.Audio.isMuted());
      $('btn-sound').textContent = PK3D.Audio.isMuted() ? '🔇 Suara: OFF' : '🔊 Suara: ON';
    });
    $('hud-cam').addEventListener('click', function () { setCamera(cameraMode === 'chase' ? 'cockpit' : 'chase'); });
    $('hud-pause').addEventListener('click', function () {
      if (state === 'flying') { state = 'paused'; show('screen-pause'); }
    });
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    if (shotNum >= 1 && shotNum <= 4) {
      // Screenshot mode: stage, settle a few frames, freeze, signal ready.
      var G = { flight: flight, mission: mission, terrain: terrain, parts: parts, setMission: setMission, setCamera: setCamera, setOrbit: PK3D.Input.setOrbit };
      PK3D.Shots.stage(shotNum, G);
      mission = G.mission;
      state = 'flying';
      show(null);
    } else {
      show('screen-title');
    }
    window.__game = { flight: flight, terrain: terrain, camera: camera, scene: scene, get mission() { return mission; }, get state() { return state; } };
    lastT = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    elapsed += dt;
    frames++;

    if (state === 'title') {
      var a = elapsed * 0.03;
      camera.position.set(Math.cos(a) * 3400, 820, Math.sin(a) * 3400);
      camera.lookAt(0, 120, 0);
      terrain.update(dt, elapsed, camera.position, null);
      var distT = Math.hypot(flight.x - mission.targetPos.x, flight.z - mission.targetPos.z);
      PK3D.HUD.update(flight, mission, { timeLeft: mission.def.timeLimitS, distToTarget: distT, message: mission.message });
      renderer.render(scene, camera);
      return;
    }

    if (state === 'flying' && !frozen) {
      var input = PK3D.Input.axes();
      PK3D.Aircraft.update(flight, dt, input, {
        groundHeight: PK3D.Terrain.groundHeight,
        windKt: windKt, windFromDeg: windFromDeg,
        onTouchdown: function (vs, st) {
          PK3D.Audio.thud();
          PK3D.Missions.handleTouchdown(mission, vs, st, PK3D.Audio);
        },
      });
      PK3D.Missions.update(mission, flight, dt, terrain, PK3D.Audio);
      PK3D.Aircraft.applyToMesh(parts, flight, elapsed, PK3D.Terrain.groundHeight(flight.x, flight.z), dt);
      PK3D.Cameras.updateCamera(camera, cameraMode, parts, flight, dt, PK3D.Input.getOrbit());
      if (cameraMode === 'cockpit') PK3D.Cameras.updateCockpitDials(cockpit, flight, elapsed);
      terrain.update(dt, elapsed, camera.position, flight);
      PK3D.Audio.setFlight(flight.throttle, flight.speedKt, !flight.onGround);
      var dist = Math.hypot(flight.x - mission.targetPos.x, flight.z - mission.targetPos.z);
      PK3D.HUD.update(flight, mission, { timeLeft: mission.def.timeLimitS - mission.elapsed, distToTarget: dist, message: mission.message });
      // Edge events.
      PK3D.Input.consumeEdges().forEach(function (e) {
        if (e === 'gear') { flight.gear = !flight.gear; PK3D.Audio.beep(); }
        else if (e === 'flaps') { flight.flaps = !flight.flaps; PK3D.Audio.beep(); }
        else if (e === 'camera') setCamera(cameraMode === 'chase' ? 'cockpit' : 'chase');
        else if (e === 'mute') { PK3D.Audio.setMuted(!PK3D.Audio.isMuted()); }
        else if (e === 'pause') { state = 'paused'; show('screen-pause'); }
      });
      // Storm lightning, random-ish but seeded by frame count.
      if (mission.def.storm && frames % 240 === 0) {
        terrain.flashLightning(flight.x + (frames % 500) - 250, flight.y + 380, flight.z - 500);
      }
      // Mission end states.
      if (mission.status === 'done') {
        var g = mission.grade;
        openDone('MISI SELESAI — ' + (g ? g.label : ''),
          mission.message + '  Skor pendaratan: ' + (g ? g.score : 0) + '/100.',
          g ? g.label : '');
      } else if (mission.status === 'failed') {
        openDone('MISI GAGAL', mission.message, '—');
      }
    } else if (state === 'paused') {
      PK3D.Input.consumeEdges().forEach(function (e) {
        if (e === 'pause') { state = 'flying'; show(null); }
      });
    } else if (state === 'briefing' || state === 'done') {
      PK3D.Input.consumeEdges().forEach(function (e) {
        if (e === 'confirm' && state === 'briefing') startFlying();
        else if (e === 'confirm' && state === 'done') openBriefing(missionIndex);
      });
    }

    if (shotNum >= 1 && shotNum <= 4 && !frozen && frames >= 30) {
      frozen = true;
      // Storm shot: freeze a lightning bolt in the sky (no light spike,
      // so the night stays dark). High over the valley centreline so the
      // whole zigzag reads against the sky, not inside a ridge.
      if (shotNum === 4) terrain.showBolt(flight.x + 30, flight.y + 180, flight.z - 350);
      window.__shotReady = true;
    }
    renderer.render(scene, camera);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
