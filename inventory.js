// inventory.js - Storage, Item Consumption & Holographic Backpack

const InventoryState = {
  slots: {
    wood: 16,
    stone: 10,
    fabric: 6,
    raw_food: 4,
    cooked_food: 0,
    water_bottles: 2,
    quantum_core: 1
  },
  deployables: {
    campfire: 0,
    water_collector: 0,
    tent: 0,
    temporal_beacon: 0
  },
  maxWeight: 45.0,
  currentWeight: 0.0
};

const ItemWeights = {
  wood: 0.8,
  stone: 1.2,
  fabric: 0.3,
  raw_food: 0.5,
  cooked_food: 0.4,
  water_bottles: 1.0,
  quantum_core: 2.0
};

function updateBackpackWeight() {
  let total = 0;
  for (let key in InventoryState.slots) {
    total += (InventoryState.slots[key] || 0) * (ItemWeights[key] || 0.5);
  }
  InventoryState.currentWeight = parseFloat(total.toFixed(2));
  return InventoryState.currentWeight;
}

function addItemToBackpack(key, count = 1) {
  InventoryState.slots[key] = (InventoryState.slots[key] || 0) + count;
  updateBackpackWeight();
  if (typeof InventoryUI !== "undefined" && InventoryUI.isOpen) {
    InventoryUI.renderSlots();
  }
}

const InventoryUI = {
  isOpen: false,
  selectedKey: null,

  itemDefs: {
    wood: { name: "Hardwood", icon: "🪵", desc: "Crafting & campfire fuel." },
    stone: { name: "Stone", icon: "🪨", desc: "Construction & tool material." },
    fabric: { name: "Fabric", icon: "🧵", desc: "Used for tents and bandages." },
    raw_food: {
      name: "Raw Meat", icon: "🥩", desc: "Cook before eating or gain toxicity.",
      use: () => {
        if (typeof SurvivalState !== "undefined") {
          SurvivalState.hunger = Math.min(100, SurvivalState.hunger + 15);
          SurvivalState.toxicity = Math.min(100, SurvivalState.toxicity + 20);
        }
        return "Consumed raw meat! Toxicity increased.";
      }
    },
    cooked_food: {
      name: "Cooked Meat", icon: "🍖", desc: "Nutritious and restores vital HP.",
      use: () => {
        if (typeof SurvivalState !== "undefined") {
          SurvivalState.hunger = Math.min(100, SurvivalState.hunger + 40);
          SurvivalState.hp = Math.min(SurvivalState.maxHp, SurvivalState.hp + 20);
        }
        return "Ate cooked meal. Health and hunger replenished!";
      }
    },
    water_bottles: {
      name: "Pure Water", icon: "💧", desc: "Quenches thirst and cools temperature.",
      use: () => {
        if (typeof SurvivalState !== "undefined") {
          SurvivalState.thirst = Math.min(100, SurvivalState.thirst + 45);
        }
        return "Drank pure water. Hydration normalized.";
      }
    },
    quantum_core: {
      name: "5D Core", icon: "🔮", desc: "Stabilizes dimension and resets fear.",
      use: () => {
        if (typeof SurvivalState !== "undefined") {
          SurvivalState.fear = 0;
          SurvivalState.pain = Math.max(0, SurvivalState.pain - 30);
        }
        return "Quantum pulse emitted! Neural stress cleansed.";
      }
    }
  },

  init() {
    this.createModalUI();
    this.createQuickButton();
    updateBackpackWeight();
  },

  createModalUI() {
    if (document.getElementById("inventoryModal")) return;

    const modal = document.createElement("div");
    modal.id = "inventoryModal";
    modal.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 320px; max-width: 90vw;
      background: rgba(8, 14, 24, 0.96);
      border: 1px solid #00ffaa;
      border-radius: 10px; padding: 14px;
      color: #fff; z-index: 10002; display: none;
      box-shadow: 0 0 30px rgba(0,255,170,0.25);
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 800; color: #00ffaa;">🎒 5D NEURAL BACKPACK</span>
        <button id="closeInvBtn" style="background: none; border: none; color: #ff4757; font-weight: bold; cursor: pointer; font-size: 16px;">✕</button>
      </div>
      <div style="font-size: 11px; color: #848e9c; margin-bottom: 8px;">
        Load: <b id="invWeightText" style="color: #fff;">0.0</b> / 45.0 kg
      </div>
      <div id="invGrid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px;"></div>
      <div id="itemDetailPane" style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; font-size: 11px; min-height: 48px; margin-bottom: 10px;">
        <div id="selectedItemTitle" style="color: #00ffee; font-weight: bold;">Select an item</div>
        <div id="selectedItemDesc" style="color: #ccc; font-size: 10px;">Tap a slot to inspect or use.</div>
      </div>
      <button id="btnUseItem" style="width: 100%; background: #00ffaa; border: none; border-radius: 6px; padding: 8px; font-weight: bold; cursor: pointer; color: #000;">USE ITEM</button>
    `;

    document.body.appendChild(modal);
    document.getElementById("closeInvBtn").onclick = () => this.toggle();
    document.getElementById("btnUseItem").onclick = () => this.useSelected();
  },

  createQuickButton() {
    if (document.getElementById("quickInvBtn")) return;
    const btn = document.createElement("button");
    btn.id = "quickInvBtn";
    btn.innerText = "🎒 BACKPACK (I)";
    btn.style.cssText = `
      position: fixed; top: 12px; right: 12px; z-index: 1000;
      background: rgba(10, 18, 30, 0.85); border: 1px solid #00ffaa;
      border-radius: 6px; color: #00ffaa; font-weight: bold; font-size: 11px;
      padding: 7px 11px; cursor: pointer;
    `;
    btn.onclick = () => this.toggle();
    document.body.appendChild(btn);

    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "i") this.toggle();
    });
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const modal = document.getElementById("inventoryModal");
    if (!modal) return;
    if (this.isOpen) {
      this.renderSlots();
      modal.style.display = "block";
    } else {
      modal.style.display = "none";
    }
  },

  renderSlots() {
    const grid = document.getElementById("invGrid");
    if (!grid) return;
    grid.innerHTML = "";
    document.getElementById("invWeightText").innerText = updateBackpackWeight();

    Object.keys(this.itemDefs).forEach(key => {
      const def = this.itemDefs[key];
      const count = InventoryState.slots[key] || 0;

      const slot = document.createElement("div");
      slot.style.cssText = `
        background: ${this.selectedKey === key ? "rgba(0,255,170,0.3)" : "rgba(255,255,255,0.06)"};
        border: 1px solid ${this.selectedKey === key ? "#00ffaa" : "#333"};
        border-radius: 6px; padding: 6px 0; text-align: center; cursor: pointer;
      `;
      slot.innerHTML = `<div style="font-size: 18px;">${def.icon}</div><div style="font-size: 10px; font-weight: bold;">${count}</div>`;

      slot.onclick = () => {
        this.selectedKey = key;
        document.getElementById("selectedItemTitle").innerText = `${def.icon} ${def.name} (${count}x)`;
        document.getElementById("selectedItemDesc").innerText = def.desc;
        this.renderSlots();
      };
      grid.appendChild(slot);
    });
  },

  useSelected() {
    if (!this.selectedKey || (InventoryState.slots[this.selectedKey] || 0) <= 0) return;
    const def = this.itemDefs[this.selectedKey];
    if (def.use) {
      const msg = def.use();
      InventoryState.slots[this.selectedKey] -= 1;
      updateBackpackWeight();
      this.renderSlots();
      document.getElementById("selectedItemDesc").innerText = msg;
    } else {
      alert("Crafting material. Deploy it via CRAFT menu.");
    }
  }
};

