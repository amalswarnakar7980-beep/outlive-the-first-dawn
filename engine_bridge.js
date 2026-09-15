// engine_bridge.js - Isolated Master Integration Bus & Event Binder

(function () {
  "use strict";

  // পূর্ববর্তী কোনো ব্রিজের সাথে সংঘর্ষ এড়াতে সেফ ইনিট
  window.EngineBridge = {
    isLive: false,
    localClock: null,
    stepInterval: 0,
    activeTouchKeys: {},

    // ১. সমস্ত মডিউলের সেফ বুটস্ট্র্যাপ
    init() {
      if (this.isLive) return;
      console.log("⚡ [Bridge] Initializing safe integration bridge...");

      if (typeof THREE === "undefined") {
        console.error("🚨 [Bridge] Three.js not found! Script halted.");
        return;
      }

      this.localClock = new THREE.Clock();

      // বিশ্ব ইঞ্জিন বুট
      if (typeof window.initWorldEngine === "function") {
        window.initWorldEngine("gameContainer");
      }

      // প্লেয়ার বুট
      if (typeof window.initPlayer === "function" && typeof window.scene !== "undefined") {
        window.initPlayer(window.scene);
      }

      // এনিমি ও এনপিসি বুট
      if (typeof window.initEntities === "function" && typeof window.scene !== "undefined") {
        window.initEntities(window.scene);
      }

      // ইনভেন্টরি UI বুট
      if (typeof window.InventoryUI !== "undefined" && typeof window.InventoryUI.init === "function") {
        window.InventoryUI.init();
      }

      // লোকাল সেভ রিস্টোর
      if (typeof window.SaveSystem !== "undefined" && typeof window.SaveSystem.loadGame === "function") {
        window.SaveSystem.loadGame();
      }

      // কন্ট্রোল ও বাটন হুক করা
      this.attachControls();

      this.isLive = true;
      console.log("✅ [Bridge] Complete pipeline linked safely.");

      // কোর রেন্ডার ও আপডেট লুপ
      this.tick();
    },

    // ২. অ্যাকশন বাটন ও টাচ প্যাড বাইন্ডিং
    attachControls() {
      // কী স্টেট সেটার
      const triggerKey = (k, state) => {
        if (typeof window.inputState !== "undefined") {
          window.inputState[k] = state;
        }
      };

      // মোবাইল ডি-প্যাড বাটনস (▲ ◀ ▼ ▶)
      const bindPad = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;

        const start = (e) => {
          e.preventDefault();
          triggerKey(key, true);
        };
        const end = (e) => {
          e.preventDefault();
          triggerKey(key, false);
        };

        el.addEventListener("touchstart", start, { passive: false });
        el.addEventListener("touchend", end, { passive: false });
        el.addEventListener("mousedown", start);
        el.addEventListener("mouseup", end);
        el.addEventListener("mouseleave", end);
      };

      bindPad("btnUp", "w");
      bindPad("btnDown", "s");
      bindPad("btnLeft", "a");
      bindPad("btnRight", "d");

      // ATTACK বাটন
      const atk = document.getElementById("btnAttack");
      if (atk) {
        atk.onclick = () => {
          if (typeof window.attackNearestZombie === "function" && typeof window.playerState !== "undefined") {
            const hit = window.attackNearestZombie(window.playerState, "spear", (loot) => {
              if (typeof window.addItemToBackpack === "function") {
                window.addItemToBackpack(loot, 1);
              }
            });
            if (typeof window.AudioEngine !== "undefined" && typeof window.AudioEngine.playHitSound === "function") {
              window.AudioEngine.playHitSound(!hit);
            }
          }
        };
      }

      // COLLECT বাটন
      const col = document.getElementById("btnCollect");
      if (col) {
        col.onclick = () => {
          if (typeof window.addItemToBackpack === "function") {
            const items = ["wood", "stone", "fabric"];
            const item = items[Math.floor(Math.random() * items.length)];
            window.addItemToBackpack(item, 2);
            if (typeof window.AudioEngine !== "undefined" && typeof window.AudioEngine.playHitSound === "function") {
              window.AudioEngine.playHitSound(false);
            }
          }
        };
      }

      // CRAFT বাটন
      const crf = document.getElementById("btnCamp");
      if (crf) {
        crf.onclick = () => {
          if (typeof window.craftItem === "function" && typeof window.deployStructure === "function" && typeof window.playerState !== "undefined") {
            window.craftItem("campfire");
            window.deployStructure("campfire", window.playerState.x + 2, window.playerState.z + 2);
          }
        };
      }

      // 5D SHIFT বাটন
      const shf = document.getElementById("btnShift");
      if (shf) {
        shf.onclick = () => {
          if (typeof window.HyperCoords !== "undefined" && typeof window.setDimension5D === "function") {
            const target = window.HyperCoords.targetV === 0.0 ? 1.0 : 0.0;
            window.setDimension5D(target);

            const label = document.getElementById("dimVal");
            if (label) {
              label.innerText = target === 1.0 ? "5D ETHEREAL" : "3D REALITY";
              label.style.color = target === 1.0 ? "#bf55ec" : "#00ffaa";
            }

            if (typeof window.AudioEngine !== "undefined" && typeof window.AudioEngine.playDimensionShift === "function") {
              window.AudioEngine.playDimensionShift(target);
            }
          }
        };
      }

      // TIME WARP বাটন
      const tim = document.getElementById("btnTime");
      if (tim) {
        tim.onclick = () => {
          if (typeof window.HyperCoords !== "undefined" && typeof window.setTimeDilation === "function") {
            const cur = window.HyperCoords.timeDilation;
            const next = cur === 1.0 ? 0.3 : (cur === 0.3 ? 2.5 : 1.0);
            window.setTimeDilation(next);
            tim.innerText = next === 0.3 ? "⏳ SLOW-MO" : (next === 2.5 ? "⚡ FAST" : "⏳ TIME");
          }
        };
      }
    },

    // ৩. সেফ সেন্ট্রাল ফ্রেম লুপ
    tick() {
      requestAnimationFrame(() => this.tick());

      const dt = this.localClock ? Math.min(this.localClock.getDelta(), 0.1) : 0.016;

      // ৫ডি স্পেস ও স্কাই আপডেট
      if (typeof window.updateWorld5D === "function") {
        window.updateWorld5D(dt);
      }

      // প্লেয়ার মুভমেন্ট ও ক্যামেরা
      const painVal = typeof window.SurvivalState !== "undefined" ? window.SurvivalState.pain : 0;
      if (typeof window.updatePlayer === "function" && typeof window.camera !== "undefined") {
        window.updatePlayer(window.camera, dt, painVal);
      }

      // অডিও ফুটস্টেপ ট্র্যাকার
      if (typeof window.playerState !== "undefined" && window.playerState.isMoving && typeof window.AudioEngine !== "undefined") {
        this.stepInterval += dt;
        const rate = window.playerState.isSprinting ? 0.28 : 0.48;
        if (this.stepInterval >= rate) {
          this.stepInterval = 0;
          if (typeof window.AudioEngine.playFootstep === "function") {
            window.AudioEngine.playFootstep(window.playerState.isSprinting);
          }
        }
      }

      // এనిমি এআই ও আক্রমণ
      if (typeof window.updateEntities === "function" && typeof window.playerState !== "undefined") {
        const isNight = typeof window.isNightTime !== "undefined" ? window.isNightTime : false;
        const inTent = typeof window.SurvivalState !== "undefined" ? window.SurvivalState.isInsideTent : false;
        const hyper = typeof window.HyperCoords !== "undefined" ? window.HyperCoords : { V: 0 };

        window.updateEntities(
          window.playerState,
          isNight,
          inTent,
          (dmg) => {
            if (typeof window.SurvivalState !== "undefined") {
              window.SurvivalState.hp = Math.max(0, window.SurvivalState.hp - dmg);
              window.SurvivalState.pain = Math.min(100, window.SurvivalState.pain + dmg * 2);
            }
            if (typeof window.AudioEngine !== "undefined" && typeof window.AudioEngine.playHitSound === "function") {
              window.AudioEngine.playHitSound(true);
            }
          },
          hyper
        );
      }

      // ক্রাফটিং স্ট্রাকচার অটো-সাইকেল
      if (typeof window.processDeployablesTick === "function") {
        window.processDeployablesTick(dt);
      }

      // ফ্রেম রেন্ডার
      if (typeof window.renderer !== "undefined" && typeof window.scene !== "undefined" && typeof window.camera !== "undefined") {
        window.renderer.render(window.scene, window.camera);
      }
    }
  };

  // নিরাপদ অটো-স্টার্ট
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.EngineBridge.init());
  } else {
    window.EngineBridge.init();
  }
})();
