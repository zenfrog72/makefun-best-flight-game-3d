// PULAU KURIR 3D — hud.js
// The DOM HUD: mission panel, compass tape, speed + altitude tapes,
// attitude indicator, fuel/damage, timer, minimap and message bar.
// Dark navy panels, white/amber text, big numbers — readable at ~300 px.
window.PK3D = window.PK3D || {};

PK3D.HUD = (function () {
  var el = {};
  var mapBase = null; // offscreen canvas with the island shape, drawn once
  var lastMsg = '';

  function $(id) { return document.getElementById(id); }

  function init() {
    el.missionName = $('hud-mission');
    el.missionObj = $('hud-objective');
    el.missionMeta = $('hud-meta');
    el.hdg = $('hud-hdg');
    el.spd = $('hud-spd');
    el.spdBar = $('hud-throttle');
    el.alt = $('hud-alt');
    el.vs = $('hud-vs');
    el.timer = $('hud-timer');
    el.fuelBar = $('hud-fuel');
    el.fuelText = $('hud-fuel-text');
    el.dmgBar = $('hud-damage');
    el.msg = $('hud-message');
    el.att = $('hud-attitude');
    el.map = $('hud-map');
    el.gear = $('hud-gear');
    el.flaps = $('hud-flaps');
    el.compassStrip = buildCompass();
    el.spdTape = buildVerticalTape($('hud-spd-tape'), 10, 20, 200, 2.4);
    el.altTape = buildVerticalTape($('hud-alt-tape'), 100, 250, 5000, 0.09);
    buildMapBase();
  }

  // Horizontal compass tape: ticks every 5 deg from -180 to 540, each 4 px.
  function buildCompass() {
    var wrap = $('hud-compass-tape');
    var strip = document.createElement('div');
    strip.className = 'tape-strip-h';
    var labels = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
    for (var d = -180; d <= 540; d += 5) {
      var h = ((d % 360) + 360) % 360;
      var tick = document.createElement('div');
      tick.className = 'tape-tick-h' + (h % 45 === 0 ? ' major' : '');
      tick.style.left = ((d + 180) * 4) + 'px';
      tick.textContent = labels[h] !== undefined ? labels[h] : (h % 90 === 0 ? String(h).padStart(3, '0') : '');
      strip.appendChild(tick);
    }
    strip.style.width = (720 * 4) + 'px';
    wrap.appendChild(strip);
    return strip;
  }

  // Vertical tape: ticks every `step` from -max to 2*max, pxPerUnit px apart.
  // Labels only for non-negative multiples of labelEvery (no wrap-around
  // duplicates at the top of the range).
  function buildVerticalTape(container, step, labelEvery, max, pxPerUnit) {
    var strip = document.createElement('div');
    strip.className = 'tape-strip';
    for (var v = -max; v <= max * 2; v += step) {
      var tick = document.createElement('div');
      tick.className = 'tape-tick' + (v >= 0 && v % labelEvery === 0 ? ' major' : '');
      tick.style.top = ((v + max) * pxPerUnit) + 'px';
      tick.textContent = (v >= 0 && v % labelEvery === 0) ? String(v) : '';
      strip.appendChild(tick);
    }
    strip.style.height = (max * 3 * pxPerUnit) + 'px';
    container.appendChild(strip);
    return { strip: strip, max: max, px: pxPerUnit };
  }

  function buildMapBase() {
    var C = PK3D.CONFIG;
    mapBase = document.createElement('canvas');
    mapBase.width = 180; mapBase.height = 180;
    var ctx = mapBase.getContext('2d');
    ctx.fillStyle = '#0d2f4a';
    ctx.fillRect(0, 0, 180, 180);
    for (var gy = 0; gy < 60; gy++) {
      for (var gx = 0; gx < 60; gx++) {
        var wx = (gx / 59 - 0.5) * 7200, wz = (gy / 59 - 0.5) * 7200;
        var h = PK3D.Terrain.groundHeight(wx, wz);
        if (h > 2) {
          ctx.fillStyle = h > 700 ? '#dfe6ee' : (h > 260 ? '#3d6b32' : '#4d7a3a');
          ctx.fillRect(gx * 3, gy * 3, 3, 3);
        }
      }
    }
    // Runways.
    ctx.strokeStyle = '#f5f5f0'; ctx.lineWidth = 2;
    for (var k in C.AIRFIELDS) {
      var f = C.AIRFIELDS[k];
      var rad = f.hdg * Math.PI / 180;
      var mx = (f.x / 7200 + 0.5) * 180, my = (f.z / 7200 + 0.5) * 180;
      ctx.beginPath();
      ctx.moveTo(mx - Math.sin(rad) * 8, my + Math.cos(rad) * 8);
      ctx.lineTo(mx + Math.sin(rad) * 8, my - Math.cos(rad) * 8);
      ctx.stroke();
    }
  }

  function drawAttitude(state) {
    var ctx = el.att.getContext('2d');
    ctx.clearRect(0, 0, 140, 140);
    ctx.save();
    ctx.beginPath(); ctx.arc(70, 70, 62, 0, Math.PI * 2); ctx.clip();
    ctx.translate(70, 70);
    ctx.rotate(-state.roll * Math.PI / 180);
    ctx.translate(0, state.pitch * 1.6);
    ctx.fillStyle = '#3a6fd8'; ctx.fillRect(-70, -70, 140, 70);
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(-70, 0, 140, 70);
    ctx.fillStyle = '#fff'; ctx.fillRect(-70, -2, 140, 4);
    ctx.restore();
    ctx.strokeStyle = '#e8ecf2'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(70, 70, 62, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.moveTo(70, 66); ctx.lineTo(58, 74); ctx.lineTo(82, 74); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8ecf2'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ATT', 70, 122);
  }

  function drawMap(state, mission) {
    var ctx = el.map.getContext('2d');
    ctx.clearRect(0, 0, 180, 180);
    ctx.drawImage(mapBase, 0, 0);
    function toMap(x, z) { return [(x / 7200 + 0.5) * 180, (z / 7200 + 0.5) * 180]; }
    if (mission && mission.targetPos) {
      var tp = toMap(mission.targetPos.x, mission.targetPos.z);
      ctx.strokeStyle = '#ffc861'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(tp[0], tp[1], 9, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffc861';
      ctx.beginPath(); ctx.arc(tp[0], tp[1], 3, 0, Math.PI * 2); ctx.fill();
    }
    if (mission && mission.rings) {
      ctx.fillStyle = '#ffd94a';
      for (var i = 0; i < mission.rings.length; i++) {
        var rp = toMap(mission.rings[i].x, mission.rings[i].z);
        ctx.beginPath(); ctx.arc(rp[0], rp[1], mission.rings[i].done ? 3 : 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    var pp = toMap(state.x, state.z);
    ctx.save();
    ctx.translate(pp[0], pp[1]);
    ctx.rotate(state.hdg * Math.PI / 180);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function update(state, mission, info) {
    if (!el.hdg) return;
    var altFt = Math.round(state.y * 3.28084);
    el.hdg.textContent = String(Math.round(state.hdg)).padStart(3, '0') + '°';
    el.spd.textContent = String(Math.round(state.speedKt)) + ' KTS';
    el.spdBar.style.width = state.throttle + '%';
    el.alt.textContent = String(altFt) + ' FT';
    el.vs.textContent = (state.vsFpm >= 0 ? '▲ +' : '▼ ') + Math.round(Math.abs(state.vsFpm)) + ' fpm';
    el.vs.style.color = state.vsFpm < -600 ? '#ff5a3c' : '#e8ecf2';
    var tLeft = Math.max(0, info.timeLeft);
    el.timer.textContent = String(Math.floor(tLeft / 60)).padStart(2, '0') + ':' + String(Math.floor(tLeft % 60)).padStart(2, '0');
    el.fuelBar.style.width = state.fuel + '%';
    el.fuelText.textContent = 'FUEL ' + Math.round(state.fuel) + '%';
    el.fuelBar.style.background = state.fuel < 20 ? '#ff5a3c' : '#37c978';
    el.dmgBar.style.width = state.damage + '%';
    el.gear.textContent = state.gear ? 'GEAR DOWN' : 'GEAR UP';
    el.flaps.textContent = state.flaps ? 'FLAPS' : '';
    if (mission) {
      el.missionName.textContent = 'MISSION ' + mission.def.id + ': ' + mission.def.name;
      el.missionObj.textContent = mission.def.objective;
      var meta = '';
      if (mission.def.kind === 'rings') meta = 'RING ' + mission.ringsDone + '/' + mission.def.rings + '  •  ';
      meta += 'DIST ' + Math.round(info.distToTarget) + ' m  •  ' + (state.onGround ? 'ON GROUND' : 'AIRBORNE');
      el.missionMeta.textContent = meta;
    }
    // Compass: centre the current heading (tape window centre at 110 px).
    el.compassStrip.style.transform = 'translateX(' + (110 - (state.hdg + 180) * 4) + 'px)';
    // Vertical tapes: centre the current value (window centre at 70 px).
    el.spdTape.strip.style.transform = 'translateY(' + (70 - (state.speedKt + el.spdTape.max) * el.spdTape.px) + 'px)';
    el.altTape.strip.style.transform = 'translateY(' + (70 - (altFt + el.altTape.max) * el.altTape.px) + 'px)';
    drawAttitude(state);
    drawMap(state, mission);
    if (info.message && info.message !== lastMsg) {
      el.msg.textContent = info.message;
      lastMsg = info.message;
    }
  }

  function setMessage(text) {
    if (el.msg) el.msg.textContent = text;
    lastMsg = text;
  }

  return { init: init, update: update, setMessage: setMessage };
})();
