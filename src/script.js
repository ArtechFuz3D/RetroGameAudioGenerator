import { melodySets, bassSets, pitchMap } from "./sets";

class AudioManager {
    constructor() {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Master gain nodes
      this.masterGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();

      this.masterGain.gain.value = 0.7;
      this.sfxGain.gain.value = 0.8;
      this.musicGain.gain.value = 0.4;

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      this.params = {
        jumpFreqStart: 380,
        punchDecay: 0.2,
        coinFreqEnd: 1200,
        explosionIntensity: 1,
        kickFreqStart: 250,
        powerUpFreqStart: 400,
        laserFreqStart: 800,
      };

      this.isLooping = true;
      this.playingSong = false;
      this.songLoopTimeout = null;
    }

    setMasterVolume(value) {
      this.masterGain.gain.value = value;
    }
    setSFXVolume(value) {
      this.sfxGain.gain.value = value;
    }
    setMusicVolume(value) {
      this.musicGain.gain.value = value;
    }

    resumeContext() {
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
    }

    playJump() {
      this.resumeContext();
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(
        this.params.jumpFreqStart,
        this.audioContext.currentTime
      );
      osc.frequency.exponentialRampToValueAtTime(
        this.params.jumpFreqStart * 1.5,
        this.audioContext.currentTime + 0.1
      );

      gain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.25
      );

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.25);
    }

    playPunch() {
      this.resumeContext();

      // Main impact sound
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      // Use a mix of waveforms for more texture
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        120,
        this.audioContext.currentTime + 0.05
      );

      // Better filter for punch sound
      filter.type = "lowpass";
      filter.frequency.value = 600;
      filter.Q.value = 5;

      // More dynamic envelope
      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(
        1.5,
        this.audioContext.currentTime + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + this.params.punchDecay
      );

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.audioContext.currentTime + this.params.punchDecay);

      // Add impact noise for more realism
      const noise = this.createNoise(0.1);
      const noiseGain = this.audioContext.createGain();
      const noiseFilter = this.audioContext.createBiquadFilter();

      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 300;
      noiseFilter.Q.value = 1;

      noiseGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      noiseGain.gain.linearRampToValueAtTime(
        0.8,
        this.audioContext.currentTime + 0.01
      );
      noiseGain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.1
      );

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
    }

    playKick() {
      this.resumeContext();

      // Main impact sound with better frequency curve
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(
        this.params.kickFreqStart || 320,
        this.audioContext.currentTime
      );
      osc.frequency.exponentialRampToValueAtTime(
        60,
        this.audioContext.currentTime + 0.1
      );

      filter.type = "lowpass";
      filter.frequency.value = 500;
      filter.Q.value = 2;

      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(
        0.7,
        this.audioContext.currentTime + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.2
      );

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.2);

      // Add whoosh effect
      const whoosh = this.audioContext.createOscillator();
      const whooshGain = this.audioContext.createGain();
      const whooshFilter = this.audioContext.createBiquadFilter();

      whoosh.type = "sawtooth";
      whoosh.frequency.setValueAtTime(800, this.audioContext.currentTime);
      whoosh.frequency.exponentialRampToValueAtTime(
        200,
        this.audioContext.currentTime + 0.2
      );

      whooshFilter.type = "bandpass";
      whooshFilter.frequency.value = 500;

      whooshGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      whooshGain.gain.linearRampToValueAtTime(
        0.3,
        this.audioContext.currentTime + 0.02
      );
      whooshGain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.15
      );

      whoosh.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(this.sfxGain);

      whoosh.start();
      whoosh.stop(this.audioContext.currentTime + 0.15);

      // Add thud impact
      const thud = this.audioContext.createOscillator();
      const thudGain = this.audioContext.createGain();

      thud.type = "sine";
      thud.frequency.setValueAtTime(80, this.audioContext.currentTime);
      thud.frequency.exponentialRampToValueAtTime(
        40,
        this.audioContext.currentTime + 0.2
      );

      thudGain.gain.setValueAtTime(0, this.audioContext.currentTime + 0.02);
      thudGain.gain.linearRampToValueAtTime(
        1.0,
        this.audioContext.currentTime + 0.04
      );
      thudGain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3
      );

      thud.connect(thudGain);
      thudGain.connect(this.sfxGain);

      thud.start();
      thud.stop(this.audioContext.currentTime + 0.3);
    }

    // Helper method for noise generation
    createNoise(duration) {
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(
        1,
        bufferSize,
        this.audioContext.sampleRate
      );
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      noise.start();
      noise.stop(this.audioContext.currentTime + duration);

      return noise;
    }

    playCoin() {
      this.resumeContext();
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(900, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        this.params.coinFreqEnd,
        this.audioContext.currentTime + 0.15
      );

      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.2
      );

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.2);
    }

    playPowerUp() {
      this.resumeContext();
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(
        this.params.powerUpFreqStart,
        this.audioContext.currentTime
      );
      osc.frequency.linearRampToValueAtTime(
        this.params.powerUpFreqStart * 2,
        this.audioContext.currentTime + 0.3
      );

      gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.35
      );

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.35);
    }

    playGameOver() {
      this.resumeContext();
      const osc1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      osc1.type = "square";
      osc1.frequency.value = 440;
      gain1.gain.setValueAtTime(0.5, this.audioContext.currentTime);
      gain1.gain.linearRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.4
      );
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start();
      osc1.stop(this.audioContext.currentTime + 0.4);

      setTimeout(() => {
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = "square";
        osc2.frequency.value = 220;
        gain2.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gain2.gain.linearRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.7
        );
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start();
        osc2.stop(this.audioContext.currentTime + 0.7);
      }, 400);
    }

    playExplosion() {
      this.resumeContext();
      const noise = this.audioContext.createBufferSource();
      const buffer = this.audioContext.createBuffer(
        1,
        this.audioContext.sampleRate * 0.5,
        this.audioContext.sampleRate
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * this.params.explosionIntensity;
      }

      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 200;

      gain.gain.setValueAtTime(1.9, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.9
      );

      noise.buffer = buffer;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start();
    }

    playLaser() {
      this.resumeContext();
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(
        this.params.laserFreqStart,
        this.audioContext.currentTime
      );
      osc.frequency.exponentialRampToValueAtTime(
        this.params.laserFreqStart * 0.5,
        this.audioContext.currentTime + 0.2
      );

      gain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.25
      );

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.25);
    }

    playHeal() {
      this.resumeContext();
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.value = 400;
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.4
      );

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);
      osc1.start();
      osc2.start();
      osc1.stop(this.audioContext.currentTime + 0.4);
      osc2.stop(this.audioContext.currentTime + 0.4);
    }

    playAlert() {
      this.resumeContext();
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        660,
        this.audioContext.currentTime + 0.1
      );
      osc.frequency.exponentialRampToValueAtTime(
        880,
        this.audioContext.currentTime + 0.2
      );

      gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.25
      );

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.25);
    }

    playSong() {
      this.resumeContext();
      if (this.playingSong) return;

      this.playingSong = true;
      this.songStartTime = this.audioContext.currentTime;



      // const melodyNotes = melodySets.chaseNotes;
      // const bassNotes = bassSets.chaseBass;
      // const melodyNotes = melodySets.bossNotes;
      // const bassNotes = bassSets.bossBass;
      const melodyNotes = melodySets.dramaNotes;
      const bassNotes = bassSets.dramaBass;
      // const melodyNotes = melodySets.sillyNotes
      // const bassNotes = bassSets.sillyBass


      // Get current preset based on params (simple detection)
      const getCurrentPreset = () => {
        if (this.params.jumpFreqStart === presets["8bit"].jumpFreqStart)
          return "8bit";
        if (this.params.jumpFreqStart === presets.modern.jumpFreqStart)
          return "modern";
        return "arcade";
      };

      // Waveform configurations for different presets
      const waveformConfig = {
        "8bit": {
          melody: "square",
          bass: "triangle",
          melodyGain: 0.25,
          bassGain: 0.35,
        },
        modern: {
          melody: "sawtooth",
          bass: "sine",
          melodyGain: 0.3,
          bassGain: 0.4,
        },
        arcade: {
          melody: "square",
          bass: "square",
          melodyGain: 0.2,
          bassGain: 0.3,
        },
      };

      const currentPreset = getCurrentPreset();
      const config = waveformConfig[currentPreset];

      const playNote = (note, type, gainValue, connectTo) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = pitchMap[note.pitch];

        gain.gain.setValueAtTime(gainValue, this.songStartTime + note.time);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          this.songStartTime + note.time + note.duration
        );

        osc.connect(gain);
        gain.connect(connectTo);
        osc.start(this.songStartTime + note.time);
        osc.stop(this.songStartTime + note.time + note.duration);
      };

      // Play notes with preset-specific waveforms
      melodyNotes.forEach((note) =>
        playNote(note, config.melody, config.melodyGain, this.musicGain)
      );
      bassNotes.forEach((note) =>
        playNote(note, config.bass, config.bassGain, this.musicGain)
      );

      this.songDuration = 4;
      if (this.isLooping) {
        const scheduleNextLoop = () => {
          if (!this.isLooping || !this.playingSong) return;

          const nextStartTime = this.songStartTime + this.songDuration;
          this.songStartTime = nextStartTime;

          melodyNotes.forEach((note) =>
            playNote(note, config.melody, config.melodyGain, this.musicGain)
          );
          bassNotes.forEach((note) =>
            playNote(note, config.bass, config.bassGain, this.musicGain)
          );

          this.songLoopTimeout = setTimeout(
            scheduleNextLoop,
            (this.songDuration - 0.1) * 1000
          );
        };

        this.songLoopTimeout = setTimeout(
          scheduleNextLoop,
          (this.songDuration - 0.1) * 1000
        );
      } else {
        this.songLoopTimeout = setTimeout(() => {
          this.playingSong = false;
        }, this.songDuration * 1000);
      }
    }

    stopSong() {
      this.playingSong = false;
      if (this.songLoopTimeout) {
        clearTimeout(this.songLoopTimeout);
        this.songLoopTimeout = null;
      }
    }

    toggleLoop() {
      this.isLooping = !this.isLooping;
      document.getElementById("loop-toggle-btn").textContent = `Loop: ${
        this.isLooping ? "On" : "Off"
      }`;
    }
  }

  const audio = new AudioManager();

  // Button event listeners
  document
    .getElementById("jump-btn")
    .addEventListener("click", () => audio.playJump());
  document
    .getElementById("punch-btn")
    .addEventListener("click", () => audio.playPunch());
  document
    .getElementById("kick-btn")
    .addEventListener("click", () => audio.playKick());
  document
    .getElementById("coin-btn")
    .addEventListener("click", () => audio.playCoin());
  document
    .getElementById("powerup-btn")
    .addEventListener("click", () => audio.playPowerUp());
  document
    .getElementById("gameover-btn")
    .addEventListener("click", () => audio.playGameOver());
  document
    .getElementById("explosion-btn")
    .addEventListener("click", () => audio.playExplosion());
  document
    .getElementById("laser-btn")
    .addEventListener("click", () => audio.playLaser());
  document
    .getElementById("heal-btn")
    .addEventListener("click", () => audio.playHeal());
  document
    .getElementById("alert-btn")
    .addEventListener("click", () => audio.playAlert());

  document
    .getElementById("play-song-btn")
    .addEventListener("click", () => audio.playSong());
  document
    .getElementById("stop-song-btn")
    .addEventListener("click", () => audio.stopSong());
  document
    .getElementById("loop-toggle-btn")
    .addEventListener("click", () => audio.toggleLoop());

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    const actions = {
      Space: () => audio.playJump(),
      KeyP: () => audio.playPunch(),
      KeyK: () => audio.playKick(),
      KeyC: () => audio.playCoin(),
      KeyU: () => audio.playPowerUp(),
      KeyG: () => audio.playGameOver(),
      KeyE: () => audio.playExplosion(),
      KeyL: () => audio.playLaser(),
      KeyH: () => audio.playHeal(),
      KeyA: () => audio.playAlert(),
      KeyM: () => (audio.playingSong ? audio.stopSong() : audio.playSong()),
    };

    if (actions[e.code]) {
      actions[e.code]();
    }
  });

  // Slider setup
  const setupSlider = (id, param, callback) => {
    const slider = document.getElementById(id);
    const valueSpan = document.getElementById(`${id}-value`);
    slider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      valueSpan.textContent = value.toFixed(2);
      callback(value);
    });
  };

  setupSlider("master-volume", "masterVolume", (v) =>
    audio.setMasterVolume(v)
  );
  setupSlider("sfx-volume", "sfxVolume", (v) => audio.setSFXVolume(v));
  setupSlider("music-volume", "musicVolume", (v) =>
    audio.setMusicVolume(v)
  );
  setupSlider(
    "jump-freq-start",
    "jumpFreqStart",
    (v) => (audio.params.jumpFreqStart = v)
  );
  setupSlider(
    "punch-decay",
    "punchDecay",
    (v) => (audio.params.punchDecay = v)
  );
  setupSlider(
    "coin-freq-end",
    "coinFreqEnd",
    (v) => (audio.params.coinFreqEnd = v)
  );
  setupSlider(
    "explosion-intensity",
    "explosionIntensity",
    (v) => (audio.params.explosionIntensity = v)
  );

  // Presets
  const presets = {
    "8bit": {
      jumpFreqStart: 380,
      punchDecay: 0.2,
      coinFreqEnd: 1200,
      explosionIntensity: 1,
      // Classic 8-bit style: square and triangle waves
    },
    modern: {
      jumpFreqStart: 500,
      punchDecay: 0.3,
      coinFreqEnd: 1500,
      explosionIntensity: 1.5,
      // Modern style: sawtooth and sine for smoother, richer sound
    },
    arcade: {
      jumpFreqStart: 300,
      punchDecay: 0.15,
      coinFreqEnd: 1000,
      explosionIntensity: 0.8,
      // Arcade style: all square waves for that retro feel
    },
  };

  Object.keys(presets).forEach((preset) => {
    document
      .getElementById(`preset-${preset}`)
      .addEventListener("click", () => {
        Object.entries(presets[preset]).forEach(([key, value]) => {
          audio.params[key] = value;
          const slider = document.getElementById(
            `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
          );
          const valueSpan = document.getElementById(
            `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}-value`
          );
          if (slider && valueSpan) {
            slider.value = value;
            valueSpan.textContent = value.toFixed(2);
          }
        });
      });
  });