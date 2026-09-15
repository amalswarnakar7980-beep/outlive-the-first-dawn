// survival.js - Biometrics, Dynamic Metabolism & Sensory System

const SurvivalState = {
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  hunger: 100,
  thirst: 100,
  bodyTemp: 36.8,
  pain: 0,
  fear: 0,
  bpm: 72,
  toxicity: 0,
  isInsideTent: false
};

function updateSurvivalCycle(isNight, player, structures = [], hyper = { V: 0 }) {
  // ক্ষুধা ও তৃষ্ণা ক্ষয়
  SurvivalState.hunger = Math.max(0, SurvivalState.hunger - 0.35);
  SurvivalState.thirst = Math.max(0, SurvivalState.thirst - 0.55);

  // ক্যাম্পফায়ার প্রক্সিমিটি ওয়ার্মথ
  let nearFire = false;
  structures.forEach(s => {
    if (s.type === "campfire" && s.active) {
      const dist = Math.hypot(player.x - s.x, player.z - s.z);
      if (dist < 8.0) nearFire = true;
    }
  });

  // শরীরের তাপমাত্রা নিয়ন্ত্রণ
  if (isNight && !nearFire) {
    SurvivalState.bodyTemp = Math.max(34.0, SurvivalState.bodyTemp - 0.15);
  } else if (nearFire) {
    SurvivalState.bodyTemp = Math.min(37.2, SurvivalState.bodyTemp + 0.25);
  }

  // ৫ম ডাইমেনশনে নিউরাল স্ট্রেস ও ভয়
  if (hyper.V > 0.5) {
    SurvivalState.fear = Math.min(100, SurvivalState.fear + 2.5);
  } else {
    SurvivalState.fear = Math.max(0, SurvivalState.fear - 1.5);
  }

  // হার্টবিট রেট (BPM) হিসাব
  let targetBpm = 70;
  targetBpm += (SurvivalState.fear * 0.5);
  targetBpm += (SurvivalState.pain * 0.4);
  if (player.isSprinting) targetBpm += 30;
  SurvivalState.bpm = Math.round(THREE.MathUtils.lerp(SurvivalState.bpm, targetBpm, 0.2));

  // অনাহার বা ডিহাইড্রেশনে ক্ষতি
  if (SurvivalState.hunger <= 0 || SurvivalState.thirst <= 0 || SurvivalState.bodyTemp < 35.0) {
    SurvivalState.hp = Math.max(0, SurvivalState.hp - 1.5);
    SurvivalState.pain = Math.min(100, SurvivalState.pain + 2.0);
  }

  // স্ট্যামিনা রিকভারি
  if (!player.isSprinting) {
    SurvivalState.stamina = Math.min(SurvivalState.maxStamina, SurvivalState.stamina + 4.0);
  } else {
    SurvivalState.stamina = Math.max(0, SurvivalState.stamina - 6.0);
  }

  // UI রিডআউট সিঙ্ক
  syncSurvivalHUD();
}

function syncSurvivalHUD() {
  const hpEl = document.getElementById("hpVal");
  const hpBar = document.getElementById("hpBar");
  const bpmEl = document.getElementById("bpmVal");
  const nrgEl = document.getElementById("nrgVal");
  const nrgBar = document.getElementById("nrgBar");
  const tempEl = document.getElementById("bodyTempTxt");

  if (hpEl) hpEl.innerText = Math.round(SurvivalState.hp);
  if (hpBar) hpBar.style.width = `${Math.max(0, SurvivalState.hp)}%`;
  if (bpmEl) bpmEl.innerText = `${SurvivalState.bpm} BPM`;
  if (nrgEl) nrgEl.innerText = Math.round(SurvivalState.stamina);
  if (nrgBar) nrgBar.style.width = `${Math.max(0, SurvivalState.stamina)}%`;
  if (tempEl) tempEl.innerText = `${SurvivalState.bodyTemp.toFixed(1)}°C`;

  // সেন্সরি ভিউপোর্ট ফিল্টার (ব্লাড/পেইন ওভারলে)
  const filter = document.getElementById("sensoryFilter");
  if (filter) {
    const painAlpha = (SurvivalState.pain / 100) * 0.6;
    const fearBlur = (SurvivalState.fear / 100) * 4;
    filter.style.background = `rgba(255, 0, 0, ${painAlpha})`;
    filter.style.filter = `blur(${fearBlur}px)`;
  }
}

