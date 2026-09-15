// world.js - 5D Hyperspace World Engine Core

let scene, camera, renderer, clock;
let terrainMesh, helperGrid, directionalLight, ambientLight;

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
  clock = new THREE.Clock();

  // ১. সিন এবং ফগ ইনিট
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06090e);
  scene.fog = new THREE.FogExp2(0x06090e, 0.015);

  // ২. পার্সপেক্টিভ ক্যামেরা
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 35);
  camera.lookAt(0, 0, 0);

  // ৩. WebGL রেন্ডারার
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // ৪. আলো (অ্যাম্বিয়েন্ট ও সূর্য/চাঁদ)
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0x00ffaa, 1.2);
  directionalLight.position.set(30, 60, 30);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);

  // ৫. ৫ডি কোয়ান্টাম স্পেস গ্রিড টেরেইন
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

  // নিয়ন কোঅর্ডিনেট গাইড গ্রিড
  helperGrid = new THREE.GridHelper(240, 60, 0x00ffaa, 0x1f293d);
  helperGrid.position.y = 0.02;
  scene.add(helperGrid);

  // উইন্ডো রিসাইজ
  window.addEventListener("resize", () => {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });

  return { scene, camera, renderer };
}

// ৫ডি ডাইমেনশন ও টাইম কন্ট্রোল
function setDimension5D(targetValue) {
  HyperCoords.targetV = targetValue;
  HyperCoords.dimensionName = targetValue > 0.5 ? "5D Ethereal" : "3D Reality";

  const dimTxt = document.getElementById("dimTxt") || document.getElementById("dimVal");
  if (dimTxt) {
    dimTxt.innerText = targetValue > 0.5 ? "5D ETHEREAL VOID" : "3D REALITY";
    dimTxt.style.color = targetValue > 0.5 ? "#bf55ec" : "#00ffaa";
  }
}

function setTimeDilation(factor) {
  HyperCoords.timeDilation = factor;
  const warpTxt = document.getElementById("warpTxt");
  if (warpTxt) {
    warpTxt.innerText = `${factor}x`;
  }
}

// ৫ডি ম্যাথমেটিক্যাল স্পেস ট্রানজিশন ও ডে-নাইট সাইকেল
function updateWorld5D(delta) {
  HyperCoords.V = THREE.MathUtils.lerp(HyperCoords.V, HyperCoords.targetV, 0.05);

  // দিন-রাত্রির পরিক্রমা
  dayNightCycle += delta * 0.03;
  const sunY = Math.sin(dayNightCycle);
  isNightTime = sunY < 0;

  const cycleTxt = document.getElementById("cycleTxt");
  if (cycleTxt) {
    cycleTxt.innerText = isNightTime ? "NIGHT (COLD)" : "DAY";
    cycleTxt.style.color = isNightTime ? "#3867d6" : "#ffa502";
  }

  if (directionalLight) {
    directionalLight.position.y = Math.max(sunY * 50, -10);
    directionalLight.intensity = isNightTime ? 0.2 : 1.2;
  }

  // কোয়ান্টাম ডাইমেনশন শিফট ট্রানজিশন (রং পরিবর্তন)
  if (scene && terrainMesh) {
    const r = THREE.MathUtils.lerp(isNightTime ? 0.02 : 0.08, 0.35, HyperCoords.V);
    const g = THREE.MathUtils.lerp(isNightTime ? 0.04 : 0.12, 0.05, HyperCoords.V);
    const b = THREE.MathUtils.lerp(isNightTime ? 0.08 : 0.18, 0.45, HyperCoords.V);

    scene.background.setRGB(r * 0.5, g * 0.5, b * 0.5);
    scene.fog.color.setRGB(r * 0.5, g * 0.5, b * 0.5);
    terrainMesh.material.color.setRGB(r, g, b);

    // ৫ডি ডাইমেনশনে গ্রিড রোটেশন
    if (helperGrid) {
      helperGrid.rotation.y += delta * (0.02 + HyperCoords.V * 0.1);
    }
  }
}
