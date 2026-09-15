// entities.js - AI Enemies, Combat & Outpost NPCs

const entityState = {
  zombies: [],
  npcs: [],
  zombieCount: 15
};

function initEntities(targetScene) {
  for (let i = 0; i < entityState.zombieCount; i++) {
    const zGroup = new THREE.Group();
    const isStalker = Math.random() < 0.2;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: isStalker ? 0x4a148c : 0x2e7d32,
      roughness: 0.8
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.8), bodyMat);
    body.position.y = 0.9;
    body.castShadow = true;
    zGroup.add(body);

    let x, z;
    do {
      x = (Math.random() - 0.5) * 180;
      z = (Math.random() - 0.5) * 180;
    } while (Math.hypot(x, z) < 25);

    zGroup.position.set(x, 0, z);
    targetScene.add(zGroup);

    entityState.zombies.push({
      group: zGroup,
      hp: isStalker ? 60 : 40,
      maxHp: isStalker ? 60 : 40,
      speed: (isStalker ? 0.08 : 0.05) + Math.random() * 0.02,
      isStalker: isStalker,
      aggro: false,
      attackCooldown: 0
    });
  }

  // ফ্রেন্ডলি এনপিসি
  spawnOutpostNPC(targetScene, "Maya (Medic)", -50, -50, 0x00d2d3);
  spawnOutpostNPC(targetScene, "Vikram (Sentry)", 50, 50, 0xff9f43);
}

function spawnOutpostNPC(targetScene, name, x, z, color) {
  const npc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 2.0, 10),
    new THREE.MeshStandardMaterial({ color: color })
  );
  npc.position.set(x, 1.0, z);
  targetScene.add(npc);
  entityState.npcs.push({ name, x, z, mesh: npc });
}

function updateEntities(playerPos, isNight, isTent, onPlayerHit, hyper = { V: 0 }) {
  const playerVec = new THREE.Vector3(playerPos.x, 0, playerPos.z);

  entityState.zombies.forEach(z => {
    const dist = z.group.position.distanceTo(playerVec);
    if (z.attackCooldown > 0) z.attackCooldown -= 0.016;

    let detectRange = isNight ? 35 : 20;
    if (z.isStalker && hyper.V > 0.5) detectRange = 50;

    const canSee = !isTent && dist < detectRange;

    if (canSee) {
      z.aggro = true;
      z.group.lookAt(playerPos.x, 0, playerPos.z);
      z.group.translateZ(z.speed * (isNight ? 1.3 : 1.0));

      if (dist < 2.0 && z.attackCooldown <= 0) {
        z.attackCooldown = 1.2;
        if (typeof onPlayerHit === "function") onPlayerHit(z.isStalker ? 15 : 8);
      }
    } else {
      z.aggro = false;
    }
  });
}

function attackNearestZombie(playerPos, weapon = "spear", onKill) {
  const pVec = new THREE.Vector3(playerPos.x, 0, playerPos.z);
  let hit = false;

  for (let z of entityState.zombies) {
    const d = z.group.position.distanceTo(pVec);
    if (d < 4.0) {
      hit = true;
      z.hp -= 35;

      const push = new THREE.Vector3().subVectors(z.group.position, pVec).normalize();
      z.group.position.addScaledVector(push, 2.5);

      if (z.hp <= 0) {
        z.group.position.set((Math.random() - 0.5) * 180, 0, (Math.random() - 0.5) * 180);
        z.hp = z.maxHp;
        if (typeof onKill === "function") onKill(z.isStalker ? "quantum_core" : "raw_food");
      }
      break;
    }
  }
  return hit;
}

function interactWithNPC(playerPos) {
  for (let npc of entityState.npcs) {
    if (Math.hypot(playerPos.x - npc.x, playerPos.z - npc.z) < 5.0) {
      return npc.name;
    }
  }
  return null;
}
