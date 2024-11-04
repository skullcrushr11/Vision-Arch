
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { CSG } from 'three-csg-ts';

const exitButton = document.getElementById('exitButton');
const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const uploadButton = document.getElementById('uploadButton');
const exploreButton = document.getElementById('exploreButton');

let scene, camera, renderer, animationId, controls;

const moveSpeed = 0.1;
const movementState = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false
};

let cubeCamera, cubeRenderTarget, floorCubeCamera, floorCubeRenderTarget;

function initThreeJS() {
    if (renderer) { renderer.dispose(); gameScreen.removeChild(renderer.domElement); }
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameScreen.appendChild(renderer.domElement);

    controls = new PointerLockControls(camera, renderer.domElement);
    gameScreen.addEventListener('click', () => {
        controls.lock();
    });

    renderer.setClearColor(0xA3A3A3);
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('./assets/textures/pure_sky.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.encoding = THREE.sRGBEncoding;

    // Set environment for global reflections and background
    scene.environment = texture;
    scene.background = texture;

    // Initialize the first CubeCamera for general reflections (following main camera)
    const cubeRenderTargetSize = 256;
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(cubeRenderTargetSize, {
        format: THREE.RGBFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
    });
    cubeCamera = new THREE.CubeCamera(0.1, 50, cubeRenderTarget);
    scene.add(cubeCamera);

    // Initialize the second CubeCamera for floor reflections
    floorCubeRenderTarget = new THREE.WebGLCubeRenderTarget(cubeRenderTargetSize, {
        format: THREE.RGBFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
    });
    floorCubeCamera = new THREE.CubeCamera(0.1, 50, floorCubeRenderTarget);
    floorCubeCamera.position.set(0, 0.1, 0); // Position it slightly above the floor
    scene.add(floorCubeCamera);
    addFloor(floorCubeRenderTarget.texture);


    loadModels(cubeRenderTarget.texture); // Use the main CubeCamera texture for models
    addLighting();
    animate();
});
    const gridHelper = new THREE.GridHelper(40, 40, 0x0000ff, 0x808080);
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.4;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}


// Set up the fridge-specific cube camera
const fridgeCubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
});
const fridgeCubeCamera = new THREE.CubeCamera(0.1, 1000, fridgeCubeRenderTarget);
scene.add(fridgeCubeCamera);


function loadModels(envMap) {
    const loader = new GLTFLoader();
    loader.load('./assets/models/fridge.glb', (gltf) => {
        const model = gltf.scene;

        const scaleFactor = 0.015;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        model.position.set(0, 0, -9);

        model.traverse((child) => {
            if (child.isMesh) {
                // Apply the fridge cube camera's environment map to the material
                child.material.envMap = fridgeCubeRenderTarget.texture;
                child.material.envMapIntensity = 1;
                child.material.roughness = 0.05;
                child.material.metalness = 0.8;

                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(model);
    });
}




// Update the addFloor function to use all texture maps and receive shadows
function addFloor(envMap) {
    const textureLoader = new THREE.TextureLoader();

    // Load floor textures
    const floorGeometry = new THREE.PlaneGeometry(20, 20, 512, 512);
    const baseColor = textureLoader.load('./assets/textures/floor/granite/basecolour.jpg');
    const displacementMap = textureLoader.load('./assets/textures/floor/granite/displacement.tiff');
    const normalMap = textureLoader.load('./assets/textures/floor/granite/normal.png');
    const roughnessMap = textureLoader.load('./assets/textures/floor/granite/roughness.jpg');
    const metallicMap = textureLoader.load('./assets/textures/floor/granite/metallic.jpg');

    [baseColor, displacementMap, normalMap, roughnessMap, metallicMap].forEach((texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Tiling
    });

    const floorMaterial = new THREE.MeshPhysicalMaterial({
        map: baseColor,
        displacementMap: displacementMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        metalnessMap: metallicMap,
        side: THREE.DoubleSide,
        metalness: 0.9,
        roughness: 0.05,
        envMap: envMap,
        envMapIntensity: 1,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Lay flat
    floor.receiveShadow = true;
    scene.add(floor);

    // Wall Material
    const wallDiffuseTexture = textureLoader.load('./assets/textures/wall/textures/diff.jpg');
    const wallNormalTexture = textureLoader.load('./assets/textures/wall/textures/nor.jpg');
    const wallGlossinessTexture = textureLoader.load('./assets/textures/wall/textures/arm.jpg');
    
    [wallDiffuseTexture, wallNormalTexture, wallGlossinessTexture].forEach((texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 2); // Tiling
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallDiffuseTexture,
        normalMap: wallNormalTexture,
        roughnessMap: wallGlossinessTexture,
        roughness: 0.4,
        metalness: 0.2,
        envMap: cubeRenderTarget.texture,
    });

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(25, 25);
    const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 4, 0);
    ceiling.receiveShadow = true;
    ceiling.castShadow=true;
    scene.add(ceiling);

    // Wall Geometry
    const wallWidth = 25, wallHeight = 6, wallThickness = 0.1;
    const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallThickness);

    // Window for CSG operation
    const windowWidth = 5, windowHeight = 2;
    const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, wallThickness + 0.01);

    // Back Wall with CSG window
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    const windowMeshBack = new THREE.Mesh(windowGeometry);
    windowMeshBack.position.set(0, wallHeight / 2 - 1, 10);

    const wallCSG = CSG.fromMesh(backWall);
    const windowCSG = CSG.fromMesh(windowMeshBack);
    const wallWithWindowCSG = wallCSG.subtract(windowCSG);
    const wallWithWindow = CSG.toMesh(wallWithWindowCSG, backWall.matrix, wallMaterial);

    wallWithWindow.position.set(0, wallHeight / 2 - 1, 10);
    wallWithWindow.castShadow = true;
    wallWithWindow.receiveShadow = true;
    scene.add(wallWithWindow);

    // Left, Right, and Front Walls
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-10, wallHeight / 2 - 1, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

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
    const ambientLight = new THREE.AmbientLight(0x404040, 8); // Soft white light
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
    const pointLight1 = new THREE.PointLight(0xffccaa, 3, 20); // Warm light, high intensity, 20 units range
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
        case 'KeyW':
            movementState.moveForward = true;
            break;
        case 'KeyS':
            movementState.moveBackward = true;
            break;
        case 'KeyA':
            movementState.moveLeft = true;
            break;
        case 'KeyD':
            movementState.moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            movementState.moveForward = false;
            break;
        case 'KeyS':
            movementState.moveBackward = false;
            break;
        case 'KeyA':
            movementState.moveLeft = false;
            break;
        case 'KeyD':
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
    requestAnimationFrame(animate);
    updateMovement();
    // Update the main CubeCamera to follow the main camera
    cubeCamera.position.copy(camera.position);
    //cubeCamera.quaternion.copy(camera.quaternion);
    //cubeCamera.rotateZ(Math.PI);
    //cubeCamera.rotateX(Math.PI);
    cubeCamera.update(renderer, scene);

    // Update the floor CubeCamera positioned above the floor
    // Keep y position fixed, update only x and z from the main camera
    //floorCubeCamera.position.set(camera.position.x, 0.00000001, camera.position.z);
    //floorCubeCamera.quaternion.copy(camera.quaternion);
    //  // Copy orientation
    //floorCubeCamera.update(renderer, scene);

    // Continue any movement or other updates
    
        // Update the fridge-specific CubeCamera to follow the main camera
        fridgeCubeCamera.position.copy(camera.position);
    
        // Inverse horizontal rotation (Y-axis) and match vertical rotation (X-axis)
        fridgeCubeCamera.rotation.y = -camera.rotation.y; // Inverse horizontal rotation
        fridgeCubeCamera.rotation.x = camera.rotation.x;  // Match vertical rotation
    
        // Update the fridge cube camera to refresh the environment map
        fridgeCubeCamera.update(renderer, scene);
    
        // Render the main scene
        renderer.render(scene, camera);
    
    
    

    // Render the main scene
    renderer.render(scene, camera);
}





function startGame() {
    menuScreen.classList.remove('active');
    menuScreen.style.display = 'none';
    gameScreen.classList.add('active');
    gameScreen.style.display = 'flex';

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
    gameScreen.classList.remove('active');
    gameScreen.style.display = 'none';
    menuScreen.classList.add('active');
    menuScreen.style.display = 'flex';

    cleanupScene();
}

uploadButton.addEventListener('click', () => {
    console.log('Upload clicked');
});

exploreButton.addEventListener('click', startGame);
exitButton.addEventListener('click', exitGame);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
