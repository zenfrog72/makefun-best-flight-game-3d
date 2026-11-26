// PULAU KURIR 3D — input.js
// Keyboard + mouse. Holds the continuous axes (pitch, roll, throttle,
// brake) and queues edge events (gear, flaps, camera, pause, mute) for the
// main loop to consume once each.
window.PK3D = window.PK3D || {};

PK3D.Input = (function () {
  var keys = {};
  var edges = [];
  var orbit = { x: 0, y: 0 };
  var dragging = false, lastX = 0, lastY = 0;

  var EDGE_KEYS = {
    KeyG: 'gear', KeyF: 'flaps', KeyC: 'camera', KeyP: 'pause',
    Escape: 'pause', KeyM: 'mute', Space: 'confirm', Enter: 'confirm',
  };

  function init(canvas) {
    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      keys[e.code] = true;
      if (EDGE_KEYS[e.code]) edges.push(EDGE_KEYS[e.code]);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.code] = false; });
    window.addEventListener('blur', function () { keys = {}; });
    canvas.addEventListener('mousedown', function (e) { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      orbit.x += (e.clientX - lastX) * 0.003;
      orbit.y += (e.clientY - lastY) * 0.003;
      orbit.x = Math.max(-0.6, Math.min(0.6, orbit.x));
      orbit.y = Math.max(-0.4, Math.min(0.4, orbit.y));
      lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('mouseup', function () { dragging = false; });
  }

  function axes() {
    var pitch = 0, roll = 0;
    if (keys.ArrowUp || keys.KeyW) pitch += 1;
    if (keys.ArrowDown || keys.KeyS) pitch -= 1;
    if (keys.ArrowLeft || keys.KeyA) roll -= 1;
    if (keys.ArrowRight || keys.KeyD) roll += 1;
    return {
      pitch: pitch, roll: roll,
      throttleUp: !!(keys.ShiftLeft || keys.ShiftRight),
      throttleDown: !!(keys.ControlLeft || keys.KeyZ),
      brake: !!keys.KeyB,
    };
  }

  function consumeEdges() {
    var out = edges;
    edges = [];
    return out;
  }

  function getOrbit() { return orbit; }
  function setOrbit(x, y) { orbit.x = x; orbit.y = y; }

  return { init: init, axes: axes, consumeEdges: consumeEdges, getOrbit: getOrbit, setOrbit: setOrbit };
})();
