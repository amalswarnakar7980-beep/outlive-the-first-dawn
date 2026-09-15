
// main.js - Master Orchestrator Lifecycle

let clock = new THREE.Clock();
let survivalTimer = 0;
let footstepTimer = 0;

function bootEngine() {
  // ১. ওয়ার্ল্ড
  if (typeof initWorldEngine === "function") {
    initWorldEngine("gameContainer");
  }

  // ২. প্লেয়ার
  if (typeof initPlayer === "function" && typeof scene !== "undefined") {
    initPlayer(scene);
  }

  // ৩. এন্টিটিজ
  if (typeof initEntities === "function" && typeof scene !== "undefined") {
    initEntities(scene);
  }

  // ৪. ইনভেন্টরি UI
  if (typeof InventoryUI !== "undefined" && typeof InventoryUI.init === "function") {
    InventoryUI.init();
  }

  // ৫. সেভ স্টেট লোড
  if (typeof SaveSystem !== "undefined") {
    SaveSystem.loadGame();
  }

  // ৬. বাটন লিসেনার্স
  bindControls();

  // ৭. রেন্ডার লুপ
  mainLoop();
}

function bindControls() {
  const btnShift = document.getElementById("btnShift");
  const btnTime = document.getElementById("btnTime");
  const btnCamp = document.getElementById("btnCamp");

  if (btnShift) {
    btnShift.onclick = () => {
      const next = (HyperCoords.targetV === 0.0) ? 1.0 : 0.0;
      setDimension5D(next);
      const dimEl = document.getElementById("dimVal");
      if (dimEl) {
        dimEl.innerText = next === 1.0 ? "5D ETHEREAL" : "3D REALITY";
        dimEl.style.color = next === 1.0 ? "#bf55ec" : "#00ffaa";
      }
      if (typeof AudioEngine !== "undefined") AudioEngine.playDimensionShift(next);
    };
  }

  if (btnTime) {
    btnTime.onclick = () => {
      const cur = HyperCoords.timeDilation;
      const next = (cur === 1.0) ? 0.3 : (cur === 0.3 ? 2.5 : 1.0);
      setTimeDilation(next);
      btnTime.innerText = next === 0.3 ? "⏳ SLOW-MO" : (next === 2.5 ? "⚡ FAST" : "⏳ TIME (T)");
    };
  }

  if (btnCamp) {
    btnCamp.onclick = () => {
      if (typeof craftItem === "function" && typeof deployStructure === "function") {
        craftItem("campfire");
        deployStructure("campfire", playerState.x + 2, playerState.z + 2);
      }
    };
  }

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "v" && btnShift) btnShift.click();
    if (k === "t" && btnTime) btnTime.click();
    if (k === "c" && btnCamp) btnCamp.click();
    if (k === "e" && typeof attackNearestZombie === "function") {
      attackNearestZombie(playerState, "spear", (loot) => {
        if (typeof addItemToBackpack === "function") addItemToBackpack(loot, 1);
      });
      if (typeof AudioEngine !== "undefined") AudioEngine.playHitSound(true);
    }
  });
}

function mainLoop() {
  requestAnimationFrame(mainLoop);

  const delta = Math.min(clock.getDelta(), 0.1);

  // ওয়ার্ল্ড ৫ডি ও ডাইমেনশন আপডেট
  if (typeof updateWorld5D === "function") updateWorld5D(delta);

  // প্লেয়ার মুভমেন্ট
  const pain = typeof SurvivalState !== "undefined" ? SurvivalState.pain : 0;
  if (typeof updatePlayer === "function" && typeof camera !== "undefined") {
    updatePlayer(camera, delta, pain);
  }

  // অডিও ফুটস্টেপ
  if (typeof playerState !== "undefined" && playerState.isMoving && typeof AudioEngine !== "undefined") {
    footstepTimer += delta;
    if (footstepTimer >= (playerState.isSprinting ? 0.28 : 0.48)) {
      footstepTimer = 0;
      AudioEngine.playFootstep(playerState.isSprinting);
    }
  }

  // এনিমি এআই
  if (typeof updateEntities === "function" && typeof playerState !== "undefined") {
    updateEntities(
      playerState,
      typeof isNightTime !== "undefined" ? isNightTime : false,
      typeof SurvivalState !== "undefined" ? SurvivalState.isInsideTent : false,
      (damage) => {
        if (typeof SurvivalState !== "undefined") {
          SurvivalState.hp = Math.max(0, SurvivalState.hp - damage);
          SurvivalState.pain = Math.min(100, SurvivalState.pain + damage * 2);
        }
        if (typeof AudioEngine !== "undefined") AudioEngine.playHitSound(true);
      },
      HyperCoords
    );
  }

  // ক্রাফটিং অটো সাইকেল
  if (typeof processDeployablesTick === "function") processDeployablesTick(delta);

  // সারভাইভাল মেটাবলিজম টিক
  survivalTimer += delta;
  if (survivalTimer >= 1.5) {
    survivalTimer = 0;
    if (typeof updateSurvivalCycle === "function" && typeof playerState !== "undefined") {
      updateSurvivalCycle(
        typeof isNightTime !== "undefined" ? isNightTime : false,
        playerState,
        typeof ActiveDeployables !== "undefined" ? ActiveDeployables : [],
        HyperCoords
      );
    }
  }

  // রেন্ডার ফ্রেম
  if (typeof renderer !== "undefined" && typeof scene !== "undefined" && typeof camera !== "undefined") {
    renderer.render(scene, camera);
  }
}

// সেফ বুটস্ট্র্যাপ
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootEngine);
} else {
  bootEngine();
}
