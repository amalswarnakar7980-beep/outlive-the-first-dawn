// crafting_engine.js - Blueprints & Deployable Structures

const CraftingBlueprints = {
  campfire: {
    name: "Thermic Campfire",
    icon: "🔥",
    cost: { wood: 4, stone: 2 },
    desc: "Warmth and passive food cooking."
  },
  water_collector: {
    name: "Moisture Condenser",
    icon: "🪣",
    cost: { wood: 3, stone: 2, fabric: 1 },
    desc: "Passively collects clean drinking water."
  },
  tent: {
    name: "Reinforced Tent",
    icon: "⛺",
    cost: { wood: 6, fabric: 4 },
    desc: "Mobile shelter against cold and enemies."
  },
  temporal_beacon: {
    name: "5D Temporal Beacon",
    icon: "🔮",
    cost: { stone: 4, quantum_core: 1 },
    desc: "Local spacetime dilation anchor."
  }
};

const ActiveDeployables = [];

function craftItem(itemKey) {
  const recipe = CraftingBlueprints[itemKey];
  if (!recipe) return { success: false, msg: "Unknown recipe!" };

  for (let mat in recipe.cost) {
    if ((InventoryState.slots[mat] || 0) < recipe.cost[mat]) {
      return { success: false, msg: `Missing materials for ${recipe.name}!` };
    }
  }

  for (let mat in recipe.cost) {
    InventoryState.slots[mat] -= recipe.cost[mat];
  }

  InventoryState.deployables[itemKey] = (InventoryState.deployables[itemKey] || 0) + 1;
  if (typeof updateBackpackWeight === "function") updateBackpackWeight();

  return { success: true, msg: `Crafted 1x ${recipe.name}!` };
}

function deployStructure(type, playerX, playerZ) {
  if ((InventoryState.deployables[type] || 0) <= 0) {
    return { success: false, msg: `No ${type} available in backpack!` };
  }

  InventoryState.deployables[type] -= 1;

  const structure = {
    id: "struct_" + Date.now(),
    type: type,
    x: playerX,
    z: playerZ,
    durability: 100,
    fuel: 180,
    productionTimer: 0,
    active: true,
    meshRef: null
  };

  // থ্রি.জেএস ৩ডি মেশ
  if (typeof scene !== "undefined" && typeof THREE !== "undefined") {
    const geo = type === "campfire" 
      ? new THREE.CylinderGeometry(0.8, 1.1, 0.4, 8) 
      : new THREE.ConeGeometry(2.0, 2.5, 4);
    const mat = new THREE.MeshStandardMaterial({
      color: type === "campfire" ? 0xd35400 : 0x16a085,
      roughness: 0.7
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(playerX, 0.5, playerZ);
    scene.add(mesh);
    structure.meshRef = mesh;
  }

  ActiveDeployables.push(structure);
  return { success: true, structure: structure, msg: `Deployed ${type}.` };
}

function processDeployablesTick(deltaSeconds) {
  for (let i = ActiveDeployables.length - 1; i >= 0; i--) {
    const s = ActiveDeployables[i];
    if (!s.active) continue;

    if (s.type === "campfire") {
      if (s.fuel > 0) {
        s.fuel -= deltaSeconds;
        if ((InventoryState.slots.raw_food || 0) > 0) {
          s.productionTimer += deltaSeconds;
          if (s.productionTimer >= 6.0) {
            s.productionTimer = 0;
            InventoryState.slots.raw_food -= 1;
            addItemToBackpack("cooked_food", 1);
          }
        }
      } else {
        s.active = false;
      }
    }

    if (s.type === "water_collector") {
      s.productionTimer += deltaSeconds;
      if (s.productionTimer >= 25.0) {
        s.productionTimer = 0;
        addItemToBackpack("water_bottles", 1);
      }
    }

    s.durability -= deltaSeconds * 0.04;
    if (s.durability <= 0) {
      if (s.meshRef && s.meshRef.parent) s.meshRef.parent.remove(s.meshRef);
      ActiveDeployables.splice(i, 1);
    }
  }
}
