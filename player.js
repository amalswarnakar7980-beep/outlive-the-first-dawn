// player.js - Kinematic Character Controller & Spring Camera

const playerState = {
  x: 0,
  y: 1.1,
  z: 0,
  rotation: 0,
  speed: 12.0,
  isMoving: false,
  isSprinting: false,
  mesh: null
};

const inputState = {
  w: false,
  s: false,
  a: false,
  d: false,
  shift: false
};

function initPlayer(targetScene) {
  const group = new THREE.Group();

  // ক্যারেক্টার বডি
  const bodyGeo = new THREE.BoxGeometry(1.2, 2.0, 1.0);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x00ffaa,
    roughness: 0.4,
    metalness: 0.6
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = 1.0;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // ক্যারেক্টার হেড
  const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x00ffee });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.position.y = 2.3;
  headMesh.castShadow = true;
  group.add(headMesh);

  group.position.set(0, 0, 0);
  targetScene.add(group);
  playerState.mesh = group;

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k in inputState) inputState[k] = true;
    if (e.key === "Shift") inputState.shift = true;
  });

  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k in inputState) inputState[k] = false;
    if (e.key === "Shift") inputState.shift = false;
  });
}

function updatePlayer(activeCamera, delta, painFactor = 0) {
  if (!playerState.mesh) return;

  const effectiveDelta = delta * (typeof HyperCoords !== "undefined" ? HyperCoords.timeDilation : 1.0);
  let currentSpeed = (inputState.shift ? playerState.speed * 1.6 : playerState.speed) * (1.0 - (painFactor / 100) * 0.4);

  let moveX = 0;
  let moveZ = 0;

  if (inputState.w) moveZ -= 1;
  if (inputState.s) moveZ += 1;
  if (inputState.a) moveX -= 1;
  if (inputState.d) moveX += 1;

  playerState.isMoving = (moveX !== 0 || moveZ !== 0);
  playerState.isSprinting = playerState.isMoving && inputState.shift;

  if (playerState.isMoving) {
    const len = Math.hypot(moveX, moveZ);
    moveX /= len;
    moveZ /= len;

    playerState.x += moveX * currentSpeed * effectiveDelta;
    playerState.z += moveZ * currentSpeed * effectiveDelta;

    playerState.rotation = Math.atan2(moveX, moveZ);
    playerState.mesh.rotation.y = playerState.rotation;
  }

  playerState.mesh.position.set(playerState.x, 0, playerState.z);

  // ক্যামেরা ফলো মেকানিক্স
  if (activeCamera) {
    activeCamera.position.x = THREE.MathUtils.lerp(activeCamera.position.x, playerState.x, 0.08);
    activeCamera.position.z = THREE.MathUtils.lerp(activeCamera.position.z, playerState.z + 18, 0.08);
    activeCamera.position.y = THREE.MathUtils.lerp(activeCamera.position.y, 14, 0.08);
    activeCamera.lookAt(playerState.x, 1.2, playerState.z);
  }
}

