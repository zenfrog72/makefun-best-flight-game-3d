// PULAU KURIR 3D — missions.js
// The four sorties: medical delivery, ring corridor, short-field express
// landing, night storm. Rings to fly through, a target runway to find, and
// every landing graded on touchdown rate + centreline offset.
window.PK3D = window.PK3D || {};

PK3D.Missions = (function () {
  var C = PK3D.CONFIG;

  function gradeLanding(vsFpm, offM) {
    var bands = C.LANDING_GRADES;
    for (var i = 0; i < bands.length; i++) {
      if (vsFpm >= bands[i].maxSink && offM <= bands[i].maxOff) {
        return { label: bands[i].label, score: bands[i].score };
      }
    }
    return { label: 'HARD', score: 30 };
  }

  // Centreline offset + along-track distance from a runway centre.
  // Runway long axis = heading direction (sin hdg, -cos hdg) in (x, z).
  function runwayFrame(field, x, z) {
    var dx = x - field.x, dz = z - field.z;
    var rad = field.hdg * Math.PI / 180;
    return {
      along: dx * Math.sin(rad) - dz * Math.cos(rad),
      across: dx * Math.cos(rad) + dz * Math.sin(rad),
    };
  }

  function create(def, scene, terrain) {
    var m = {
      def: def, status: 'flying', rings: [], ringsDone: 0,
      targetField: C.AIRFIELDS[def.target],
      startField: C.AIRFIELDS[def.start],
      targetPos: { x: C.AIRFIELDS[def.target].x, z: C.AIRFIELDS[def.target].z },
      elapsed: 0, grade: null, message: def.objective, pillar: null,
    };
    // Golden light pillar over the target runway so the pilot can find it.
    var pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 150, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffc861, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })
    );
    pillar.position.set(m.targetPos.x, m.targetField.elev + 75, m.targetPos.z);
    scene.add(pillar);
    m.pillar = pillar;
    // Rings for the corridor mission: along the valley waypoints in
    // def.ringPath (or the straight start->target line as a fallback).
    if (def.kind === 'rings') {
      var sx = m.startField.x, sz = m.startField.z;
      var tx = m.targetField.x, tz = m.targetField.z;
      var path = def.ringPath || null;
      for (var i = 0; i < def.rings; i++) {
        var rx, rz, pathHdg;
        if (path) {
          rx = path[i][0]; rz = path[i][1];
          var nx = path[Math.min(i + 1, path.length - 1)][0];
          var nz = path[Math.min(i + 1, path.length - 1)][1];
          pathHdg = Math.atan2(nx - rx, -(nz - rz));
        } else {
          var t = (i + 1) / (def.rings + 1);
          rx = sx + (tx - sx) * t + Math.sin(t * 9.1) * 320;
          rz = sz + (tz - sz) * t + Math.cos(t * 7.3) * 320;
          pathHdg = Math.atan2(tx - sx, -(tz - sz));
        }
        var ry = terrain.groundHeight(rx, rz) + 130 + ((i % 3) * 40);
        var ring = new THREE.Mesh(
          new THREE.TorusGeometry(34, 3.0, 8, 28),
          new THREE.MeshBasicMaterial({ color: 0xffd94a })
        );
        ring.position.set(rx, ry, rz);
        ring.rotation.y = pathHdg;
        scene.add(ring);
        m.rings.push({ x: rx, y: ry, z: rz, mesh: ring, done: false });
      }
    }
    return m;
  }

  function destroy(m, scene) {
    if (!m) return;
    if (m.pillar) scene.remove(m.pillar);
    for (var i = 0; i < m.rings.length; i++) scene.remove(m.rings[i].mesh);
  }

  function update(m, state, dt, terrain, audio) {
    if (m.status !== 'flying') return;
    m.elapsed += dt;
    // Rings: fly through the next one.
    if (m.def.kind === 'rings' && m.ringsDone < m.rings.length) {
      var next = m.rings[m.ringsDone];
      var d = Math.hypot(state.x - next.x, state.y - next.y, state.z - next.z);
      next.mesh.rotation.z += dt * 0.8;
      var pulse = 1 + Math.sin(m.elapsed * 5) * 0.08;
      next.mesh.scale.set(pulse, pulse, pulse);
      if (d < 30) {
        next.done = true;
        next.mesh.material = new THREE.MeshBasicMaterial({ color: 0x37c978 });
        m.ringsDone++;
        if (audio) audio.chime();
        m.message = m.ringsDone >= m.rings.length
          ? 'All rings cleared — land at Karang!'
          : 'Ring ' + m.ringsDone + '/' + m.rings.length + ' cleared!';
      }
    }
    // Timeout.
    if (m.elapsed > m.def.timeLimitS) {
      m.status = 'failed';
      m.message = 'Time up — mission failed.';
    }
    // Crash.
    if (state.crashed) {
      m.status = 'failed';
      m.message = state.damage >= 100 ? 'Aircraft destroyed — mission failed.' : 'Mission failed.';
    }
  }

  // Called by the flight model the moment the wheels touch.
  function handleTouchdown(m, vsFpm, state, audio) {
    if (m.status !== 'flying') return;
    var f = m.targetField;
    var fr = runwayFrame(f, state.x, state.z);
    var onStrip = Math.abs(fr.along) <= f.len / 2 + 60 && Math.abs(fr.across) <= 60;
    if (m.def.kind === 'rings' && m.ringsDone < m.rings.length) {
      m.message = 'Rings incomplete — take off again!';
      return;
    }
    if (onStrip) {
      m.grade = gradeLanding(vsFpm, Math.abs(fr.across));
      m.status = 'done';
      m.message = 'Landed at ' + f.name + ' — ' + m.grade.label + ' (' + Math.round(-vsFpm) + ' fpm, ' + Math.round(Math.abs(fr.across)) + ' m from centreline)';
      if (audio) audio.fanfare(m.grade.score >= 80);
    } else {
      m.message = 'Not the target runway — take off again!';
    }
  }

  return { create: create, destroy: destroy, update: update, handleTouchdown: handleTouchdown, gradeLanding: gradeLanding };
})();
