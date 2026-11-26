// PULAU KURIR 3D — audio.js
// WebAudio synth only — no audio files. Engine hum, wind, ring chime,
// touchdown thud, warning beep and a landing fanfare.
window.PK3D = window.PK3D || {};

PK3D.Audio = (function () {
  var ctx = null, master = null, engOsc = null, engGain = null, windSrc = null, windGain = null;
  var muted = false, ready = false;

  function ensure() {
    if (ready) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      // Engine: low sawtooth through a lowpass.
      engOsc = ctx.createOscillator();
      engOsc.type = 'sawtooth';
      engOsc.frequency.value = 55;
      var engFilter = ctx.createBiquadFilter();
      engFilter.type = 'lowpass';
      engFilter.frequency.value = 320;
      engGain = ctx.createGain();
      engGain.gain.value = 0;
      engOsc.connect(engFilter); engFilter.connect(engGain); engGain.connect(master);
      engOsc.start();
      // Wind: looped noise through a bandpass.
      var len = ctx.sampleRate * 2;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      windSrc = ctx.createBufferSource();
      windSrc.buffer = buf; windSrc.loop = true;
      var windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 500;
      windGain = ctx.createGain();
      windGain.gain.value = 0;
      windSrc.connect(windFilter); windFilter.connect(windGain); windGain.connect(master);
      windSrc.start();
      ready = true;
      return true;
    } catch (e) { return false; }
  }

  function tone(freq, dur, type, vol, when) {
    if (!ready || muted) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    var t0 = ctx.currentTime + (when || 0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol || 0.25, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function setFlight(throttle, speedKt, airborne) {
    if (!ready) return;
    if (muted) { engGain.gain.value = 0; windGain.gain.value = 0; return; }
    engOsc.frequency.value = 42 + throttle * 0.9;
    engGain.gain.value = 0.05 + (throttle / 100) * 0.10;
    windGain.gain.value = airborne ? Math.min(0.22, speedKt / 700) : 0;
  }

  function chime() { tone(880, 0.35, 'sine', 0.3); tone(1318, 0.5, 'sine', 0.25, 0.09); }
  function thud() { tone(70, 0.25, 'triangle', 0.5); }
  function beep() { tone(1046, 0.12, 'square', 0.12); }
  function fanfare(good) {
    if (good) { tone(523, 0.25, 'sine', 0.3); tone(659, 0.25, 'sine', 0.3, 0.12); tone(784, 0.5, 'sine', 0.3, 0.24); }
    else { tone(392, 0.3, 'sine', 0.25); tone(330, 0.45, 'sine', 0.25, 0.15); }
  }

  function setMuted(m) { muted = m; if (ready && m) { engGain.gain.value = 0; windGain.gain.value = 0; } }
  function isMuted() { return muted; }

  return { ensure: ensure, setFlight: setFlight, chime: chime, thud: thud, beep: beep, fanfare: fanfare, setMuted: setMuted, isMuted: isMuted };
})();
