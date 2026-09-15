// audio.js - Procedural Synthesizer & LocalStorage Engine

const AudioEngine = {
  ctx: null,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  playHitSound(isHeavy = false) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isHeavy ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(isHeavy ? 160 : 120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  },

  playFootstep(isSprinting = false) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(isSprinting ? 90 : 70, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  },

  playDimensionShift(target) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(target > 0.5 ? 120 : 600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(target > 0.5 ? 600 : 120, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
};

const SaveSystem = {
  saveKey: "outlive_5d_save",

  saveGame() {
    try {
      const data = {
        survival: typeof SurvivalState !== "undefined" ? SurvivalState : null,
        inventory: typeof InventoryState !== "undefined" ? InventoryState : null,
        player: typeof playerState !== "undefined" ? { x: playerState.x, z: playerState.z } : null
      };
      localStorage.setItem(this.saveKey, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  },

  loadGame() {
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (data.survival && typeof SurvivalState !== "undefined") Object.assign(SurvivalState, data.survival);
      if (data.inventory && typeof InventoryState !== "undefined") Object.assign(InventoryState, data.inventory);
      if (data.player && typeof playerState !== "undefined") {
        playerState.x = data.player.x;
        playerState.z = data.player.z;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
};

window.addEventListener("pointerdown", () => AudioEngine.init(), { once: true });

