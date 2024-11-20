import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { CSG } from "three-csg-ts";

// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";

document.addEventListener("DOMContentLoaded", () => {
  const uploadButton = document.getElementById("uploadButton");
  const rootContainer = document.getElementById("root");

  uploadButton.addEventListener("click", async () => {
    // Hide the Three.js content and show the React app container
    document.getElementById("menuScreen").style.display = "none";
    rootContainer.style.display = "block";

    // Dynamically import the React app's main component
    const { default: App } = await import("../2d_design/App"); // Adjust path to match your React setup

    const root = ReactDOM.createRoot(rootContainer);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
});

const exitButton = document.getElementById("exitButton");
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");
const uploadButton = document.getElementById("uploadButton");
const exploreButton = document.getElementById("exploreButton");

let scene, camera, renderer, animationId, controls;

const moveSpeed = 0.1;
const movementState = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
};

let cubeCamera, cubeRenderTarget;

function initThreeJS() {
  if (renderer) {
    renderer.dispose();
    gameScreen.removeChild(renderer.domElement);
  }
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  );
  camera.position.set(0, 2, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  gameScreen.appendChild(renderer.domElement);

  controls = new PointerLockControls(camera, renderer.domElement);
  gameScreen.addEventListener("click", () => {
    controls.lock();
  });

  renderer.setClearColor(0xa3a3a3);
  const rgbeLoader = new RGBELoader();
  rgbeLoader.load("./textures/pure_sky.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.encoding = THREE.sRGBEncoding;

    // Set environment for global reflections and background
    //scene.environment = texture;
    scene.background = texture;

    // Initialize the first CubeCamera for general reflections (following main camera)
    const cubeRenderTargetSize = 256;
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(cubeRenderTargetSize, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    cubeCamera = new THREE.CubeCamera(0.1, 30, cubeRenderTarget);
    scene.add(cubeCamera);

    addFloor();

    loadModels(); // Use the main CubeCamera texture for models
    addLighting();
    animate();
  });
  // const gridHelper = new THREE.GridHelper(40, 40, 0x0000ff, 0x808080);
  // scene.add(gridHelper);
  // const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);

  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.4;

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
}

// Set up the fridge-specific cube camera
// fridgeCubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
//     format: THREE.RGBAFormat,
//     generateMipmaps: true,
//     minFilter: THREE.LinearMipmapLinearFilter,
// });
// fridgeCubeCamera = new THREE.CubeCamera(0.1, 50, fridgeCubeRenderTarget);

function getLayoutFromCookie() {
  const match = document.cookie.match(new RegExp("(^| )layoutData=([^;]+)"));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch (error) {
      console.error("Error parsing layout data from cookie:", error);
    }
  }
  return null;
}

function loadModels() {
  const loader = new GLTFLoader();

  // Retrieve layout data from localStorage
  const layoutString = localStorage.getItem("layoutData");
  if (!layoutString) {
    console.error("No layout data found in localStorage.");
    return;
  }

  let layout;
  try {
    layout = JSON.parse(layoutString);
  } catch (error) {
    console.error("Error parsing layout data from localStorage:", error);
    return;
  }

  const { furniturePositions } = layout;

  // Map each furniture position to a load promise for parallel loading
  const loadPromises = furniturePositions.map((furniture) => {
    const {
      file_location,
      x,
      y,
      scaling_factor,
      initial_rotation,
      rotation,
      upwards,
    } = furniture;

    console.log(furniture);

    return new Promise((resolve, reject) => {
      loader.load(
        file_location,
        (gltf) => {
          const model = gltf.scene;

          // Set model's scale, position, and other properties
          const scaleFactor = scaling_factor || 1;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);
          model.position.set(x, upwards, y);

          const rotationY = (initial_rotation || 0) + (rotation || 0);
          model.rotation.y = THREE.MathUtils.degToRad(rotationY);
          // model.rotation.y = rotationY;

          model.traverse((child) => {
            if (child.isMesh) {
              child.material.envMap = cubeRenderTarget.texture;
              child.material.envMapIntensity = 1;
              child.material.roughness = 0.05;
              child.material.metalness = 0.8;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Add the model to the scene and resolve the promise
          scene.add(model);
          resolve();
        },
        undefined,
        (error) => {
          console.error(`Error loading model from ${file_location}:`, error);
          reject(error);
        }
      );
    });
  });

  // Use Promise.all to wait for all models to load
  Promise.all(loadPromises)
    .then(() => {
      console.log("All models loaded successfully.");
    })
    .catch((error) => {
      console.error("Error loading one or more models:", error);
    });
}

// Update the addFloor function to use all texture maps and receive shadows
function addFloor() {
  const textureLoader = new THREE.TextureLoader();

  // Load floor textures
  const floorGeometry = new THREE.PlaneGeometry(20, 20, 512, 512);
  const baseColor = textureLoader.load(
    "/textures/floor/granite/basecolour.jpg"
  );
  const displacementMap = textureLoader.load(
    "/textures/floor/granite/displacement.tiff"
  );
  const normalMap = textureLoader.load("/textures/floor/granite/normal.png");
  const roughnessMap = textureLoader.load(
    "/textures/floor/granite/roughness.jpg"
  );
  const metallicMap = textureLoader.load(
    "/textures/floor/granite/metallic.jpg"
  );

  [baseColor, displacementMap, normalMap, roughnessMap, metallicMap].forEach(
    (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4); // Tiling
    }
  );

  // Create the textured floor material
  const floorMaterial = new THREE.MeshPhysicalMaterial({
    map: baseColor,
    displacementMap: displacementMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    metalnessMap: metallicMap,
    side: THREE.DoubleSide,
    metalness: 0.9,
    roughness: 0.05,
    //envMap: cubeRenderTarget.texture,
    //envMapIntensity: 1,
    //transparent:true,
    opacity: 0.8,
  });
  // const floorMaterial = new MeshReflectorMaterial({
  //     map: baseColor,
  //     displacementMap: displacementMap,
  //     normalMap: normalMap,
  //     roughnessMap: roughnessMap,
  //     metalnessMap: metallicMap,
  //     mixBlur: 1.0,
  //     mixStrength: 0.5,
  //     mirror: 0.5,
  //     textureMatrix: new Matrix4(),
  //     tDiffuse: null,
  //     distortionMap: null,
  //     tDiffuseBlur: null,
  //     hasBlur: true,
  //     minDepthThreshold: 0.9,
  //     maxDepthThreshold: 1,
  //     depthScale: 0,
  //     depthToBlurRatioBias: 0.25,
  //     distortion: 1,
  //     mixContrast: 1
  //   });

  // Create the floor mesh
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; // Lay flat
  floor.receiveShadow = true;
  scene.add(floor);

  // Wall Material
  const wallDiffuseTexture = textureLoader.load(
    "/textures/wall/textures/diff.jpg"
  );
  const wallNormalTexture = textureLoader.load(
    "/textures/wall/textures/nor.jpg"
  );
  const wallGlossinessTexture = textureLoader.load(
    "/textures/wall/textures/arm.jpg"
  );

  [wallDiffuseTexture, wallNormalTexture, wallGlossinessTexture].forEach(
    (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 2); // Tiling
    }
  );

  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallDiffuseTexture,
    normalMap: wallNormalTexture,
    roughnessMap: wallGlossinessTexture,
    roughness: 0.4,
    metalness: 0.2,
    // envMap: cubeRenderTarget.texture,
  });

  // Ceiling
  const ceilingGeometry = new THREE.PlaneGeometry(25, 25);
  const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 4, 0);
  ceiling.receiveShadow = true;
  ceiling.castShadow = true;
  scene.add(ceiling);

  // Wall Geometry
  const wallWidth = 25,
    wallHeight = 6,
    wallThickness = 0.1;
  const wallGeometry = new THREE.BoxGeometry(
    wallWidth,
    wallHeight,
    wallThickness
  );

  // Window for CSG operation
  const windowWidth = 5,
    windowHeight = 2;
  const windowGeometry = new THREE.BoxGeometry(
    windowWidth,
    windowHeight,
    wallThickness + 0.01
  );

  // Back Wall with CSG window
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  const windowMeshBack = new THREE.Mesh(windowGeometry);
  windowMeshBack.position.set(0, wallHeight / 2 - 1, 10);

  const backWallCSG = CSG.fromMesh(backWall);
  const windowCSGBack = CSG.fromMesh(windowMeshBack);
  const wallWithWindowCSGBack = backWallCSG.subtract(windowCSGBack);
  const wallWithWindowBack = CSG.toMesh(
    wallWithWindowCSGBack,
    backWall.matrix,
    wallMaterial
  );

  wallWithWindowBack.position.set(0, wallHeight / 2 - 1, 10);
  wallWithWindowBack.castShadow = true;
  wallWithWindowBack.receiveShadow = true;
  scene.add(wallWithWindowBack);

  // Left Wall with CSG window
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  const windowMeshLeft = new THREE.Mesh(windowGeometry);
  windowMeshLeft.position.set(0, wallHeight / 2 - 1, 0); // Position the window horizontally centered on the left wall

  const leftWallCSG = CSG.fromMesh(leftWall);
  const windowCSGLeft = CSG.fromMesh(windowMeshLeft);
  const wallWithWindowCSGLeft = leftWallCSG.subtract(windowCSGLeft);
  const wallWithWindowLeft = CSG.toMesh(
    wallWithWindowCSGLeft,
    leftWall.matrix,
    wallMaterial
  );

  wallWithWindowLeft.position.set(-10, wallHeight / 2 - 1, 0);
  wallWithWindowLeft.rotation.y = Math.PI / 2;
  wallWithWindowLeft.castShadow = true;
  wallWithWindowLeft.receiveShadow = true;
  scene.add(wallWithWindowLeft);

  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.position.set(10, wallHeight / 2 - 1, 0);
  rightWall.rotation.y = Math.PI / 2;
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
  frontWall.position.set(0, wallHeight / 2 - 1, -10);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  scene.add(frontWall);

  renderer.render(scene, camera);
}

function addLighting() {
  // Ambient light for soft general illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 16); // Soft white light
  scene.add(ambientLight);

  // Single Directional Light positioned from the ceiling
  const directionalLight = new THREE.DirectionalLight(0xffffff, 4); // Color and intensity
  directionalLight.position.set(-10, 5, 15); // Positioned directly above the center of the room
  directionalLight.castShadow = true;

  // Adjust shadow camera to cover the room area
  directionalLight.shadow.camera.left = -40;
  directionalLight.shadow.camera.right = 40;
  directionalLight.shadow.camera.top = 40;
  directionalLight.shadow.camera.bottom = -40;
  directionalLight.shadow.mapSize.width = 2048; // Increased resolution
  directionalLight.shadow.mapSize.height = 2048;

  scene.add(directionalLight);

  // Optional: Additional Directional Light
  const dL2 = new THREE.DirectionalLight(0xffffff, 4); // Color and intensity
  dL2.position.set(-2, 5, 10); // Positioned directly above the center of the room
  dL2.castShadow = true;

  dL2.shadow.camera.left = -12;
  dL2.shadow.camera.right = 12;
  dL2.shadow.camera.top = 7;
  dL2.shadow.camera.bottom = -7;
  dL2.shadow.mapSize.width = 2048;
  dL2.shadow.mapSize.height = 2048;

  // scene.add(dL2); // Add if needed

  // Point Lights - for localized lighting (e.g., lamps, spot illumination)

  // Point Light 1
  const pointLight1 = new THREE.PointLight(0xaaccff, 10, 50); // Warm light, high intensity, 20 units range
  pointLight1.position.set(5, 3, 5); // Position above a certain point in the room
  pointLight1.castShadow = true;
  scene.add(pointLight1);

  // Point Light 2
  const pointLight2 = new THREE.PointLight(0xaaccff, 3, 20); // Cool light, high intensity, 20 units range
  pointLight2.position.set(-5, 3, -5); // Position in another part of the room
  pointLight2.castShadow = true;
  scene.add(pointLight2);
}

function onKeyDown(event) {
  switch (event.code) {
    case "KeyW":
      movementState.moveForward = true;
      break;
    case "KeyS":
      movementState.moveBackward = true;
      break;
    case "KeyA":
      movementState.moveLeft = true;
      break;
    case "KeyD":
      movementState.moveRight = true;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case "KeyW":
      movementState.moveForward = false;
      break;
    case "KeyS":
      movementState.moveBackward = false;
      break;
    case "KeyA":
      movementState.moveLeft = false;
      break;
    case "KeyD":
      movementState.moveRight = false;
      break;
  }
}

function updateMovement() {
  if (movementState.moveForward) controls.moveForward(moveSpeed);
  if (movementState.moveBackward) controls.moveForward(-moveSpeed);
  if (movementState.moveLeft) controls.moveRight(-moveSpeed);
  if (movementState.moveRight) controls.moveRight(moveSpeed);
}

function animate() {
  if (!camera) {
    return;
  }

  requestAnimationFrame(animate);
  updateMovement();

  // Update the main CubeCamera to follow the main camera
  cubeCamera.position.copy(camera.position);
  cubeCamera.rotation.y = -camera.rotation.y;
  cubeCamera.rotation.x = -camera.rotation.x;
  cubeCamera.update(renderer, scene);

  // Floor Cube Camera - Mirrored rotation along the X axis
  //floorCubeCamera.position.set(camera.position.x, 0.01, camera.position.z);

  // Invert rotation for floor reflection (only X and Y axis)
  //floorCubeCamera.rotation.y = camera.rotation.y;
  //floorCubeCamera.rotation.z = camera.rotation.z;
  //floorCubeCamera.rotation.x = camera.rotation.x;
  //floorCubeCamera.rotation.y = camera.rotation.y ; // Flip 180 degrees horizontally

  //floorCubeCamera.update(renderer, scene);

  // Fridge Cube Camera
  //fridgeCubeCamera.position.copy(camera.position);

  //fridgeCubeCamera.update(renderer, scene);

  // Render the main scene
  renderer.render(scene, camera);
}

function startGame() {
  menuScreen.classList.remove("active");
  menuScreen.style.display = "none";
  gameScreen.classList.add("active");
  gameScreen.style.display = "flex";

  if (!renderer) {
    initThreeJS();
  }
}

function cleanupScene() {
  scene.traverse((object) => {
    if (object.isMesh) {
      object.geometry.dispose();

      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else {
        object.material.dispose();
      }
    }
  });

  while (scene.children.length > 0) {
    const child = scene.children[0];
    scene.remove(child);
  }

  if (renderer) {
    renderer.dispose();
    gameScreen.removeChild(renderer.domElement);
  }

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  scene = null;
  camera = null;
  renderer = null;
  controls = null;
}

function exitGame() {
  gameScreen.classList.remove("active");
  gameScreen.style.display = "none";
  menuScreen.classList.add("active");
  menuScreen.style.display = "flex";

  cleanupScene();
}

uploadButton.addEventListener("click", () => {
  console.log("Upload clicked");
});

exploreButton.addEventListener("click", startGame);
exitButton.addEventListener("click", exitGame);
