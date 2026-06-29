/* ============================================================
   SOUNDS.JS — Web Audio API sound library
   All sounds are programmatic — no audio files required.
   AudioContext is lazy-initialised on first user interaction.
   ============================================================ */

(function () {
  let _ctx = null;

  function getCtx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  // ── Helpers ───────────────────────────────────────────────

  function playTone(freq, duration, gain, type = 'sine', startAt = 0) {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime + startAt;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = freq === 'noise' ? 'sine' : type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain, t);
      amp.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    } catch {}
  }

  function playNoise(duration, gain) {
    try {
      const ctx = getCtx();
      const bufSize = ctx.sampleRate * duration;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      const amp = ctx.createGain();
      src.buffer = buf;
      amp.gain.setValueAtTime(gain, ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      src.connect(amp);
      amp.connect(ctx.destination);
      src.start(ctx.currentTime);
    } catch {}
  }

  // ── Public API ────────────────────────────────────────────

  window.Sounds = {

    // Low tactical double-blip on tab switch
    playTabSwitch() {
      playTone(180, 0.05, 0.07, 'square', 0);
      playTone(260, 0.04, 0.05, 'square', 0.045);
    },

    // Ascending two-tone ping when habit is completed
    playHabitComplete() {
      playTone(600, 0.08, 0.12, 'sine', 0);
      playTone(900, 0.10, 0.12, 'sine', 0.09);
    },

    // Descending tone when habit is unchecked
    playHabitUncheck() {
      playTone(900, 0.08, 0.10, 'sine', 0);
      playTone(600, 0.10, 0.10, 'sine', 0.09);
    },

    // Ultra-short noise blip for button clicks
    playButtonClick() {
      playNoise(0.03, 0.06);
    },

    // Dramatic ascending 3-tone chord for ACCESS GRANTED
    playAccessGranted() {
      playTone(440, 0.22, 0.15, 'sine', 0);
      playTone(554, 0.22, 0.15, 'sine', 0.20);
      playTone(659, 0.35, 0.15, 'sine', 0.40);
    },

    // Prime AudioContext from a user click (call from boot overlay click)
    _initCtx() {
      try { getCtx(); } catch {}
    },
  };
})();
