// =============================================
// SUBASTA — Casino Sound Effects (Web Audio API)
// =============================================
(function() {
  let ctx = null;
  let ambientNode = null;
  let muted = localStorage.getItem('subasta_muted') === 'true';

  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  const master = (gain = 0.4) => {
    const g = getCtx().createGain();
    g.gain.value = muted ? 0 : gain;
    g.connect(getCtx().destination);
    return g;
  };

  // Utility: play a tone
  const tone = (freq, type, duration, gainVal, startTime, dest) => {
    const c = getCtx();
    const t = startTime || c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gainVal || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(dest || getCtx().destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  };

  // White noise burst
  const noise = (duration, gainVal, dest) => {
    const c = getCtx();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    const g = c.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(gainVal || 0.1, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    src.connect(g);
    g.connect(dest || c.destination);
    src.start();
  };

  const SFX = {
    // Roulette spinning — rising pitch noise
    rouletteSpin: () => {
      try {
        const c = getCtx(); const m = master(0.3);
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, c.currentTime + 3);
        osc.frequency.exponentialRampToValueAtTime(120, c.currentTime + 5);
        g.gain.setValueAtTime(0.15, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 5);
        osc.connect(g); g.connect(m);
        osc.start(); osc.stop(c.currentTime + 5.1);
      } catch(e) {}
    },

    // Roulette stops — satisfying tick + bell
    rouletteStop: () => {
      try {
        const m = master(0.5);
        tone(880, 'sine', 0.8, 0.4, null, m);
        tone(1320, 'sine', 0.6, 0.2, getCtx().currentTime + 0.05, m);
        tone(1760, 'sine', 0.5, 0.15, getCtx().currentTime + 0.1, m);
      } catch(e) {}
    },

    // Coin drop — bid placed
    coin: () => {
      try {
        const m = master(0.4);
        [600, 900, 1200].forEach((f, i) => {
          tone(f, 'triangle', 0.3, 0.25, getCtx().currentTime + i * 0.04, m);
        });
      } catch(e) {}
    },

    // Dramatic reveal — artifact
    reveal: () => {
      try {
        const m = master(0.5);
        const c = getCtx();
        [220, 330, 440, 550, 660].forEach((f, i) => {
          tone(f, 'sine', 0.6, 0.2, c.currentTime + i * 0.07, m);
        });
      } catch(e) {}
    },

    // Blessing — bright ascending chime
    blessing: () => {
      try {
        const m = master(0.5);
        const c = getCtx();
        [523, 659, 784, 1047].forEach((f, i) => {
          tone(f, 'sine', 0.7, 0.3, c.currentTime + i * 0.1, m);
        });
      } catch(e) {}
    },

    // Curse — low ominous descending
    curse: () => {
      try {
        const m = master(0.5);
        const c = getCtx();
        [220, 196, 165, 147].forEach((f, i) => {
          tone(f, 'sawtooth', 0.6, 0.25, c.currentTime + i * 0.12, m);
        });
        noise(0.8, 0.08, m);
      } catch(e) {}
    },

    // Win fanfare
    win: () => {
      try {
        const m = master(0.5);
        const c = getCtx();
        const melody = [523, 659, 784, 659, 784, 1047];
        melody.forEach((f, i) => {
          tone(f, 'sine', i === melody.length - 1 ? 1.2 : 0.25, 0.35, c.currentTime + i * 0.12, m);
        });
      } catch(e) {}
    },

    // Click — UI interaction
    click: () => {
      try {
        const m = master(0.2);
        tone(800, 'sine', 0.08, 0.3, null, m);
      } catch(e) {}
    },

    // Alert — warning
    alert: () => {
      try {
        const m = master(0.4);
        const c = getCtx();
        tone(440, 'square', 0.15, 0.3, c.currentTime, m);
        tone(440, 'square', 0.15, 0.3, c.currentTime + 0.2, m);
      } catch(e) {}
    },

    // Background ambient — low casino hum
    startAmbient: () => {
      try {
        if (ambientNode || muted) return;
        const c = getCtx();
        const osc = c.createOscillator();
        const g = c.createGain();
        const filter = c.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.value = 55;
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        g.gain.value = muted ? 0 : 0.04;
        osc.connect(filter); filter.connect(g); g.connect(c.destination);
        osc.start();
        ambientNode = { osc, g };
      } catch(e) {}
    },

    stopAmbient: () => {
      try {
        if (ambientNode) { ambientNode.osc.stop(); ambientNode = null; }
      } catch(e) {}
    },

    toggleMute: () => {
      muted = !muted;
      localStorage.setItem('subasta_muted', muted);
      if (ambientNode) ambientNode.g.gain.value = muted ? 0 : 0.04;
      return muted;
    },

    isMuted: () => muted,
  };

  window.SFX = SFX;
})();
