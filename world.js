// world.js - 5D Hyperspace Terrain, Sky Dome & Spacetime Engine

let scene, camera, renderer, terrainMesh, directionalLight, ambientLight;

const HyperCoords = {
  V: 0.0,
  targetV: 0.0,
  timeDilation: 1.0,
  dimensionName: "3D Reality"
};

let isNightTime = false;
let dayNightCycle = 0;

function initWorldEngine(containerId = "gameContainer") {
  const container = document.getElementById(containerId) || document.body;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06090e);
  scene.fog = new THREE.FogExp2(0x06090e, 0.015);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 14, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0x00ffaa, 1.2);
  directionalLight.position.set(30, 60, 30);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);

  // 5D কোয়ান্টাম স্পেস গ্রিড
  const gridGeo = new THREE.PlaneGeometry(240, 240, 60, 60);
  gridGeo.rotateX(-Math.PI / 2);
  const gridMat = new THREE.MeshStandardMaterial({
    color: 0x111927,
    roughness: 0.8,
    metalness: 0.2,
    wireframe: false
  });
  terrainMesh = new THREE.Mesh(gridGeo, gridMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // রেফারেন্স গাইড লাইন
  const helperGrid = new THREE.GridHelper(240, 60, 0x00ffaa, 0x1f293d);
  helperGrid.position.y = 0.02;
  scene.add(helperGrid);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

function setDimension5D(targetValue) {
  HyperCoords.targetV = targetValue;
  HyperCoords.dimensionName = targetValue > 0.5 ? "5D Ethereal" : "3D Reality";
}

function setTimeDilation(factor) {
  HyperCoords.timeDilation = factor;
}

function updateWorld5D(delta) {
  // ৫ম ডাইমেনশন মসৃণ স্থানান্তর
  HyperCoords.V = THREE.MathUtils.lerp(HyperCoords.V, HyperCoords.targetV, 0.05);

  // দিন ও রাতের সাইকেল
  dayNightCycle += delta * 0.03;
  const sunY = Math.sin(dayNightCycle);
  isNightTime = sunY < 0;

  if (directionalLight) {
    directionalLight.position.y = Math.max(sunY * 50, -10);
    directionalLight.intensity = isNightTime ? 0.2 : 1.2;
  }

  // ডাইমেনশন অনুযায়ী পরিবেশের রং শিফট
  if (scene && terrainMesh) {
    const r = THREE.MathUtils.lerp(isNightTime ? 0.02 : 0.08, 0.35, HyperCoords.V);
    const g = THREE.MathUtils.lerp(isNightTime ? 0.04 : 0.12, 0.05, HyperCoords.V);
    const b = THREE.MathUtils.lerp(isNightTime ? 0.08 : 0.18, 0.45, HyperCoords.V);
    scene.background.setRGB(r * 0.5, g * 0.5, b * 0.5);
    scene.fog.color.setRGB(r * 0.5, g * 0.5, b * 0.5);
    terrainMesh.material.color.setRGB(r, g, b);
  }
}

