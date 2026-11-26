// PULAU KURIR 3D — cameras.js
// Two cameras: a smoothed chase camera (the primary shot camera) and a lit
// 3D cockpit camera — a real dashboard panel with working dials drawn on a
// canvas texture, amber backlit, seen over the nose.
window.PK3D = window.PK3D || {};

PK3D.Cameras = (function () {
  var chasePos = null;
  var lookTmp = null;
  var eyeTmp = null;

  // Build the cockpit interior and attach it to the plane group. Hidden in
  // chase mode, shown in cockpit mode (the exterior is hidden instead).
  function buildCockpit(parts) {
    var grp = new THREE.Group();
    var dark = new THREE.MeshPhongMaterial({ color: 0x1c2026, flatShading: true, shininess: 10 });
    var trim = new THREE.MeshPhongMaterial({ color: 0x3a3f46, flatShading: true });
    var grey = new THREE.MeshPhongMaterial({ color: 0x8a8f96, flatShading: true });

    // Dashboard panel (the dial texture goes on its front face).
    var cnv = document.createElement('canvas');
    cnv.width = 1024; cnv.height = 300;
    var tex = new THREE.CanvasTexture(cnv);
    var panel = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 1.35, 0.35),
      [dark, dark, dark, dark, new THREE.MeshBasicMaterial({ map: tex }), dark]
    );
    panel.position.set(0, 0.45, -2.35);
    panel.rotation.x = -0.12;
    grp.add(panel);
    // Panel bezel: four trim bars framing the dials, corner screws, and a
    // switch strip with toggles + indicator lights below the panel.
    var bezH = new THREE.BoxGeometry(4.9, 0.12, 0.06);
    var bezV = new THREE.BoxGeometry(0.12, 1.5, 0.06);
    [[0, 1.18, bezH], [0, -0.28, bezH], [-2.42, 0.45, bezV], [2.42, 0.45, bezV]].forEach(function (b) {
      var bar = new THREE.Mesh(b[2], trim);
      bar.position.set(b[0], b[1], -2.15);
      grp.add(bar);
    });
    [[-2.2, 1.05], [2.2, 1.05], [-2.2, -0.15], [2.2, -0.15]].forEach(function (p) {
      var screw = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8), grey);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(p[0], p[1], -2.16);
      grp.add(screw);
    });
    var strip = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 0.1), dark);
    strip.position.set(0, -0.42, -2.2);
    grp.add(strip);
    var lampColors = [0x37c978, 0xffb347, 0xff5a3c, 0x37c978, 0xffb347, 0x37c978];
    for (var si = 0; si < 6; si++) {
      var lever = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.07), trim);
      lever.position.set(-1.9 + si * 0.76, -0.36, -2.16);
      lever.rotation.x = -0.3;
      grp.add(lever);
      var lampDot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshBasicMaterial({ color: lampColors[si] }));
      lampDot.position.set(-1.9 + si * 0.76, -0.5, -2.16);
      grp.add(lampDot);
    }
    // Glareshield above the panel — kept low and thin so the nose cone
    // and the spinning prop stay visible over the dashboard.
    var shield = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.12, 0.5), trim);
    shield.position.set(0, 1.12, -2.2);
    shield.rotation.x = 0.15;
    grp.add(shield);
    // Canopy frame: slim side posts + centre post, a top bar across the
    // windscreen, a cabin roof overhead and side walls, so the camera
    // reads as sitting INSIDE the cockpit, not floating behind a slab.
    for (var s = -1; s <= 1; s += 2) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), trim);
      post.position.set(s * 2.1, 1.6, -2.9);
      post.rotation.z = -s * 0.18;
      grp.add(post);
    }
    var centre = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.0, 0.1), trim);
    centre.position.set(0, 1.6, -3.0);
    grp.add(centre);
    var topBar = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.16, 0.16), trim);
    topBar.position.set(0, 2.62, -2.9);
    grp.add(topBar);
    var roof = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 1.4), dark);
    roof.position.set(0, 2.74, -2.2);
    roof.rotation.x = 0.08;
    grp.add(roof);
    for (var w = -1; w <= 1; w += 2) {
      var wall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 3.2), dark);
      wall.position.set(w * 2.5, 1.5, -1.2);
      grp.add(wall);
      // Wingtip stubs at the lower windscreen corners, just above the
      // dashboard and beside the side posts, so the wings read at the
      // frame edges.
      var stub = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.7), new THREE.MeshPhongMaterial({ color: 0xf2f2ee, flatShading: true }));
      stub.position.set(w * 1.95, 1.35, -3.0);
      stub.rotation.z = -w * 0.1;
      grp.add(stub);
      var stubTip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.7), new THREE.MeshPhongMaterial({ color: 0xd43a2a, flatShading: true }));
      stubTip.position.set(w * 2.45, 1.35, -3.0);
      stubTip.rotation.z = -w * 0.1;
      grp.add(stubTip);
    }
    // Yoke — low and small so it never covers the dials.
    var yoke = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 6, 14), trim);
    yoke.position.set(0, -0.08, -1.7);
    grp.add(yoke);
    var column = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6), trim);
    column.position.set(0, -0.35, -1.9);
    column.rotation.x = 0.7;
    grp.add(column);
    // Warm cockpit light so the panel reads as lit.
    var lamp = new THREE.PointLight(0xffc861, 0.9, 9);
    lamp.position.set(0, 1.6, -1.2);
    grp.add(lamp);

    grp.visible = false;
    parts.group.add(grp);
    parts.cockpit = grp;
    return { group: grp, canvas: cnv, ctx: cnv.getContext('2d'), texture: tex, lastDraw: -1 };
  }

  function drawDial(ctx, cx, cy, r, label, valueText, frac) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#10141a';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a4150'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2;
    for (var i = 0; i <= 8; i++) {
      var a = -Math.PI * 0.75 + (i / 8) * Math.PI * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8));
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.stroke();
    }
    var na = -Math.PI * 0.75 + frac * Math.PI * 1.5;
    ctx.strokeStyle = '#ff5a3c'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(na) * (r - 12), Math.sin(na) * (r - 12));
    ctx.stroke();
    ctx.fillStyle = '#e8ecf2'; ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(valueText, 0, r * 0.42);
    ctx.fillStyle = '#ffb347'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(label, 0, -r * 0.55);
    ctx.restore();
  }

  // Redraw the dial texture from the flight state, at most 10x a second.
  function updateCockpitDials(ck, state, t) {
    if (t - ck.lastDraw < 0.1) return;
    ck.lastDraw = t;
    var ctx = ck.ctx;
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, 1024, 300);
    ctx.strokeStyle = '#2a3040'; ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 1016, 292);
    drawDial(ctx, 130, 150, 92, 'SPD KT', String(Math.round(state.speedKt)), state.speedKt / 180);
    // Attitude ball.
    ctx.save();
    ctx.translate(360, 150);
    ctx.beginPath(); ctx.arc(0, 0, 92, 0, Math.PI * 2); ctx.clip();
    ctx.rotate(-state.roll * Math.PI / 180);
    ctx.translate(0, state.pitch * 2.2);
    ctx.fillStyle = '#3a6fd8'; ctx.fillRect(-100, -100, 200, 100);
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(-100, 0, 200, 100);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-100, -2, 200, 4);
    ctx.restore();
    ctx.strokeStyle = '#3a4150'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(360, 150, 92, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffb347'; ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ATT', 360, 150 - 108);
    drawDial(ctx, 590, 150, 92, 'ALT FT', String(Math.round((state.y) * 3.28084)), ((state.y * 3.28084) % 1000) / 1000);
    drawDial(ctx, 800, 150, 92, 'HDG', String(Math.round(state.hdg)).padStart(3, '0'), state.hdg / 360);
    // Fuel + RPM bars.
    ctx.fillStyle = '#e8ecf2'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('FUEL', 920, 84);
    ctx.fillStyle = '#222a36'; ctx.fillRect(920, 96, 84, 16);
    ctx.fillStyle = state.fuel < 20 ? '#ff5a3c' : '#37c978';
    ctx.fillRect(920, 96, 84 * state.fuel / 100, 16);
    ctx.fillStyle = '#e8ecf2';
    ctx.fillText('RPM', 920, 154);
    ctx.fillStyle = '#222a36'; ctx.fillRect(920, 166, 84, 16);
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(920, 166, 84 * state.throttle / 100, 16);
    ctx.fillStyle = '#e8ecf2';
    ctx.fillText(state.gear ? 'GEAR DN' : 'GEAR UP', 920, 226);
    ctx.fillStyle = state.flaps ? '#37c978' : '#8a93a5';
    ctx.fillText(state.flaps ? 'FLAPS' : 'FLAPS -', 920, 256);
    ck.texture.needsUpdate = true;
  }

  function setCockpitMode(parts, on) {
    if (!parts.cockpit) return;
    parts.cockpit.visible = on;
    // In cockpit mode keep the nose cone and prop visible so the pilot
    // sees the aircraft ahead; hide the rest of the exterior — the
    // fuselage top and the wing sit right under the camera and would
    // cover the panel, and the dark windscreen / side windows would
    // block the view.
    var keep = [parts.nose, parts.prop];
    parts.group.children.forEach(function (child) {
      if (child !== parts.cockpit && child !== parts.blob && keep.indexOf(child) === -1) child.visible = !on;
    });
    parts.blob.visible = true;
  }

  // Chase camera: behind + above, smoothed, slight orbit from mouse drag.
  function updateCamera(camera, mode, parts, state, dt, orbit) {
    if (!chasePos) { chasePos = new THREE.Vector3(); lookTmp = new THREE.Vector3(); eyeTmp = new THREE.Vector3(); }
    var hdgRad = state.hdg * Math.PI / 180;
    var fwdX = Math.sin(hdgRad), fwdZ = -Math.cos(hdgRad);
    if (mode === 'cockpit') {
      camera.fov = 68;
      camera.updateProjectionMatrix();
      // Eye above the panel so the runway ahead reads over the dashboard.
      eyeTmp.set(0, 1.75, -0.9);
      parts.group.localToWorld(eyeTmp);
      camera.position.copy(eyeTmp);
      lookTmp.set(0, -2.0, -80);
      parts.group.localToWorld(lookTmp);
      camera.lookAt(lookTmp);
      return;
    }
    camera.fov = 62;
    camera.updateProjectionMatrix();
    var dist = 15, height = 4.6;
    var ox = orbit ? orbit.x : 0, oy = orbit ? orbit.y : 0;
    var desX = state.x - fwdX * dist + Math.cos(hdgRad) * ox * 8;
    var desZ = state.z - fwdZ * dist + Math.sin(hdgRad) * ox * 8;
    var desY = state.y + height + oy * 3;
    var k = 1 - Math.exp(-dt * 4.5);
    if (chasePos.lengthSq() === 0) chasePos.set(desX, desY, desZ);
    else { chasePos.x += (desX - chasePos.x) * k; chasePos.y += (desY - chasePos.y) * k; chasePos.z += (desZ - chasePos.z) * k; }
    camera.position.copy(chasePos);
    lookTmp.set(state.x + fwdX * 42, state.y + 0.5, state.z + fwdZ * 42);
    camera.lookAt(lookTmp);
  }

  function resetChase() { if (chasePos) chasePos.set(0, 0, 0); }

  return { buildCockpit: buildCockpit, updateCockpitDials: updateCockpitDials, setCockpitMode: setCockpitMode, updateCamera: updateCamera, resetChase: resetChase };
})();
