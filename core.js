// core.js - Main 3D Scene Setup and Initialization
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'; // NEW
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';       // NEW
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'; // NEW
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Global scene objects
export let scene, camera, renderer, controls;
export let pendantGroup = null
;
export let baseShape, wings, gem, border, bail, engraving, chain, overlay;
export let ambientLight, directionalLight1, directionalLight2, pointLight;
export let gridHelper;
export let isRotating = true;
export let composer, bloomPass;
// NEW: Clock for time-based animation
const clock = new THREE.Clock(); 
// NEW: Animation State
export let isAnimatingWings = false;
let wingAnimationTime = 0;
// Frames for one full opening/closing cycle (3 seconds at 60fps)
const WING_ANIMATION_DURATION = 1.0; 

// NEW: Locket Animation State
let isAnimatingLocket = false;
let locketAnimationProgress = 0; // 0 (closed) to 1 (open)
const LOCKET_ANIMATION_DURATION = 1.0; // Speed of opening/closing per frame

let historyStack = [];
let historyIndex = -1;
const MAX_HISTORY = 20;

// Configuration state
export let currentConfig = {
    // Base shape
    shape: 'heart',
    // NEW: Locket state
    locketOpenAngle: 0, // 0 for closed, 180 for fully open
    locketStyle: 'three-sided', // 'two-sided' (left only) or 'three-sided' (left/right)
    locketImageLeft: '', // Base64 or URL for the left interior photo
    locketImageRight: '', // Base64 or URL for the right interior photo
    locketImageBack: '', // Base64 or URL for the back interior photo

    // Material
    material: 'platinum',
    useLayeredColor: true,
    colorBase: '#E8E4F3',
    colorLayer1: '#B8B5FF',
    colorLayer2: '#E8E4F3',

    // Dimensions
    width: 25,
    height: 30,
    thickness: 3,
    bevelSize: 0.1,

    // Appearance
    glossiness: 90,
    metallic: 100,
    reflectivity: 2.0,
    anisotropy: 0.0, 
    clearcoat: 0.0, 

    // Wings
    hasWings: true,
    wingStyle: 'dual-symmetrical',
    wingSurface: 'pave-diamonds',
    wingSize: 1.2,
    wingAngle: 30,
    wingOffsetX: 0,
    wingOffsetY: 0,

    // Gemstone
    hasGem: true,
    gemShape: 'heart',
    gemColor: '#00D9FF',
    gemType: 'custom',
    gemSize: 8,
    gemDepth: 2,
    gemFacets: 32,
    gemSparkle: 3.5,
    gemOpacity: 75,
    gemIridescence: true,
    settingStyle: '4-prong', 
    prongThickness: 0.5,
    // Border
    hasBorder: false,
    borderStyle: 'simple',
    borderWidth: 0.15,
    borderGems: false,

    // Bail
    hasBail: true,
    bailStyle: 'integrated-gem-loop',
    bailSize: 0.5,

    // Engraving
    hasEngraving: false,
    engravingText: '',
    fontSize: 12,
    fontStyle: 'arial',
    engraveDepth: 0.1,

    // Overlay
    hasOverlay: true,
    overlayType: 'cross',
    overlaySize: 1.0,
    addCrystals: false,
    overlayColor: '#FFFFFF',

    // Chain
    hasChain: true,
    chainStyle: 'simple-cable',
    chainLength: 50,
    chainLinkThickness: 0.6,
    chainSagDepth: 15,
    chainColor: '#D3D3D3',

    // Lighting
    ambientLightIntensity: 0.6,
    directLightIntensity: 0.9,
    envIntensity: 1.5,
    shadowIntensity: 100,
    bloomEffect: false,
    
    // Bloom Effect Parameters (for the "Crystallized/Color Mixture" glow)
    bloomStrength: 0.5,
    bloomThreshold: 0.8,
    bloomRadius: 0.2,
    
    // Real-World Reference Object Settings
    referenceObject: 'none', 
    referenceSize: 25.0,
    
    unitSystem: 'mm', 
    language: 'en' 
};

export function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = 'status-message show ' + type;

    if (type === 'success') {
        createConfetti();
    }

    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 3000);
}
// Initialize the 3D scene
export function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xE6F3FF);

    // Camera setup
    const container = document.getElementById('canvas-container');
    camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 15, 45);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        preserveDrawingBuffer: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0;
    container.appendChild(renderer.domElement);

    // Controls setup with touch support
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 150;
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
    };
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };

    // Environment setup
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const highContrastCubeTexture = createHighContrastCubemap();
    const environment = pmremGenerator.fromCubemap(highContrastCubeTexture).texture;
    scene.environment = environment;
    scene.environmentIntensity = Math.max(currentConfig.envIntensity * 1.5, 1.0);
    // Lighting setup
    setupLights();
     
    // Post-Processing Composer Setup
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // Unreal Bloom Pass (The Glow/Radiant Effect)
    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(container.clientWidth, container.clientHeight),
        currentConfig.bloomStrength = 0.8,
        currentConfig.bloomRadius = 0.3,
        currentConfig.bloomThreshold = 0.7
    );
    composer.addPass(bloomPass);
    // Grid helper
    gridHelper = new THREE.GridHelper(100, 20, 0xFFE66D, 0x95E1D3);
    gridHelper.position.y = -20;
    scene.add(gridHelper);

    // Create pendant group
    pendantGroup = new THREE.Group();
    pendantGroup.position.y = 15;
    scene.add(pendantGroup);

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(onWindowResize, 100);
    });

    // Start animation loop
    animate();
}

function createHighContrastCubemap() {
    // This creates a cubemap array simulating a bright, directional light setup 
    // without relying on image loaders or paths.
    const size = 512; // Use a smaller size for performance
    const faces = [];
    
    // Simple procedural generation for the faces
    const createFaceData = (colorHex) => {
        const color = new THREE.Color(colorHex);
        const data = new Uint8Array(size * size * 4);

        for (let i = 0; i < size * size; i++) {
            data[i * 4 + 0] = color.r * 255;
            data[i * 4 + 1] = color.g * 255;
            data[i * 4 + 2] = color.b * 255;
            data[i * 4 + 3] = 255;
        }
        return new THREE.DataTexture(data, size, size);
    };

    // Use a high-contrast pattern for maximum shine: Bright Front/Top, Dark Sides
    // This creates 6 separate DataTexture objects for the Cubemap
    faces.push(createFaceData(0xffffff));   // px - Right (Bright)
    faces.push(createFaceData(0x333333));   // nx - Left (Darker fill)
    faces.push(createFaceData(0xffffff));   // py - Top (Bright)
    faces.push(createFaceData(0x111111));   // ny - Bottom (Very Dark)
    faces.push(createFaceData(0xffffff));   // pz - Front (Bright)
    faces.push(createFaceData(0x000000));   // nz - Back (Black)

    // The CubeTexture is constructed directly from the array of DataTextures
    const cubemap = new THREE.CubeTexture(faces);
    cubemap.needsUpdate = true;
    
    return cubemap;
}

export function convertUnitToMM(value, unit) {
    if (unit === 'in') {
        return value * 25.4; // 1 inch = 25.4 mm
    } else if (unit === 'cm') {
        return value * 10; // 1 cm = 10 mm
    }
    return value; // Default base unit is mm
}

export function convertMMToUnit(valueMM, targetUnit) {
    if (targetUnit === 'in') {
        return valueMM / 25.4;
    } else if (targetUnit === 'cm') {
        return valueMM / 10;
    }
    return valueMM;
}
// Setup scene lighting
function setupLights() {
    // Ambient light
    ambientLight = new THREE.AmbientLight(0xffffff, currentConfig.ambientLightIntensity);
    scene.add(ambientLight);

    // Main directional light
    directionalLight1 = new THREE.DirectionalLight(0xffffff, currentConfig.directLightIntensity);
    directionalLight1.position.set(5, 10, 7);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 2048;
    directionalLight1.shadow.mapSize.height = 2048;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 50;
    directionalLight1.shadow.camera.left = -15;
    directionalLight1.shadow.camera.right = 15;
    directionalLight1.shadow.camera.top = 15;
    directionalLight1.shadow.camera.bottom = -15;
    directionalLight1.shadow.bias = -0.001;
    scene.add(directionalLight1);

    // Secondary directional light
    directionalLight2 = new THREE.DirectionalLight(0xa0a0ff, 0.7); // UPDATED: Stronger fill light
    directionalLight2.position.set(-10, 5, -10);
    scene.add(directionalLight2);

    // Point light for extra diamond/gem highlights (The "pop")
    pointLight = new THREE.PointLight(0xffffff, 2.0, 50);
    pointLight.position.set(0, 30, 0);
    scene.add(pointLight);
}

// NEW: Function to find the wing meshes
function getWingMeshes() {
    // Find the wings group within the pendantGroup
    const wingsGroup = pendantGroup.children.find(child => 
        child instanceof THREE.Group && child.children.length > 0 && 
        child.children.some(grandchild => grandchild.isMesh || grandchild.isGroup)
    );

    if (wingsGroup) {
        // Filter for two primary wing elements (assuming dual wings)
        const wingElements = wingsGroup.children.filter(child => 
            child.position.x !== 0 && (child.isMesh || child.isGroup)
        );
        // Sort them by X position to consistently get left/right
        wingElements.sort((a, b) => a.position.x - b.position.x);
        return wingElements.slice(0, 2); // Return at most the two main wings (left, right)
    }
    return [];
}

// NEW: Function to toggle the wing animation (global function called by UI)
window.toggleWingAnimation = function() {
    isAnimatingWings = !isAnimatingWings;
    const btn = document.getElementById('wing-animation-btn');
    if (btn) {
        btn.textContent = isAnimatingWings ? '⏸️ Pause Wing Animation' : '▶️ Animate Wings';
    }
    showStatus(isAnimatingWings ? '▶️ Wing animation started' : '⏸️ Wing animation paused', 'info');
};

//NEW Exported Functions to Control Animation State
export function setLocketAnimationState(isAnimating, progress = null) {
    isAnimatingLocket = isAnimating;
    if (progress !== null) {
        locketAnimationProgress = progress;
    }
}

export function getLocketAnimationProgress() {
    return locketAnimationProgress;
}

export function isLocketAnimating() {
    return isAnimatingLocket;
}
window.setLocketAngleImmediate = function(angleDegrees) {
    if (pendantGroup && currentConfig.shape === 'locket') {
        const leftPivot = pendantGroup.userData.leftLidPivot;
        const rightPivot = pendantGroup.userData.rightLidPivot;
        const angleRad = angleDegrees * Math.PI / 180;
        
       // Corrected hinge direction
        if (leftPivot && (currentConfig.locketStyle === 'two-sided' || currentConfig.locketStyle === 'three-sided')) {
            leftPivot.rotation.y = angleRad; 
        }
        if (rightPivot && currentConfig.locketStyle === 'three-sided') {
            rightPivot.rotation.y = -angleRad; 
        }
        // FIX: Now uses the exported setter function
        setLocketAnimationState(false);
        
 }
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Get time elapsed since last frame for consistent animation
    // Rotate pendant if enabled
    if (pendantGroup && isRotating) {
         // Use delta for framerate-independent rotation (0.5 radians/second)
        pendantGroup.rotation.y += 0.5 * delta; 
    }

    // NEW: Wing Animation Logic (Updated to use delta time)
    if (pendantGroup && currentConfig.hasWings && isAnimatingWings) {
        const wings = getWingMeshes();
        
        if (wings.length === 2) {
            // Update time parameter (t) cyclically from 0 to 1 over 2*DURATION seconds
            wingAnimationTime = (wingAnimationTime + delta / (WING_ANIMATION_DURATION * 2)) % 1;
            const t = wingAnimationTime;
            
            // Use Math.cos to create a smooth, oscillating animation (closed -> open -> closed)
            const animationValue = (1 - Math.cos(t * 2 * Math.PI)) / 2; 
            
            // Define the range of motion (in degrees)
            const minAngle = currentConfig.wingAngle; // Starting/Closed angle from config
            const maxAngle = minAngle + 60;          // Max Open angle
            
            // Convert to radians
            const minAngleRad = minAngle * Math.PI / 180;
            const maxAngleRad = maxAngle * Math.PI / 180;
            
            // Calculate the final animated angle
            const animatedAngle = minAngleRad + (maxAngleRad - minAngleRad) * animationValue;
            
            // Apply rotation (Left wing: positive Z rotation, Right wing: negative Z rotation)
            wings[0].rotation.z = animatedAngle;
            wings[1].rotation.z = -animatedAngle;
        }
    }
    
    // NEW: Locket Animation Logic (Updated to use delta time and corrected pivot direction)
    if (pendantGroup && currentConfig.shape === 'locket' && isAnimatingLocket) {
        const leftPivot = pendantGroup.userData.leftLidPivot;
        const rightPivot = pendantGroup.userData.rightLidPivot;
        
        // Target angle (180 degrees)
        const targetAngle = 180 * Math.PI / 180; 
        
        // Determine the direction and delta progress
        const direction = (currentConfig.locketOpenAngle > 0 ? 1 : -1);
        const deltaProgress = delta / LOCKET_ANIMATION_DURATION;

        // Update progress, clamped between 0 and 1
        locketAnimationProgress = THREE.MathUtils.clamp(locketAnimationProgress + deltaProgress * direction, 0, 1);

        const currentAngle = targetAngle * locketAnimationProgress;

        // Apply corrected rotation
        if (leftPivot && (currentConfig.locketStyle === 'two-sided' || currentConfig.locketStyle === 'three-sided')) {
            leftPivot.rotation.y = currentAngle; // Left lid opens positively around its pivot
        }

        if (rightPivot && currentConfig.locketStyle === 'three-sided') {
            rightPivot.rotation.y = -currentAngle; // Right lid opens negatively around its pivot
        }
        
        // Stop animation when target is reached
        if ((direction > 0 && locketAnimationProgress >= 1) || (direction < 0 && locketAnimationProgress <= 0)) {
            isAnimatingLocket = false;
            
            // Finalize config state
            currentConfig.locketOpenAngle = direction > 0 ? 180 : 0;
            
            // Sync UI slider to the final state for consistency (prevents jump on next manual slide)
            document.getElementById('locket-open-angle').value = currentConfig.locketOpenAngle;
            document.getElementById('locket-angle-value').textContent = currentConfig.locketOpenAngle + '°';

            if (currentConfig.locketOpenAngle === 0) {
                 showStatus('🔒 Locket closed', 'info');
            } else {
                 showStatus('🔓 Locket opened', 'info');
            }
            
            // Also call immediate set to ensure the visual state is locked immediately after animation ends
            window.setLocketAngleImmediate(currentConfig.locketOpenAngle);
        }
    }

    controls.update();
    if (currentConfig.bloomEffect) {
        // Update bloom parameters before rendering
        bloomPass.strength = currentConfig.bloomStrength;
        bloomPass.radius = currentConfig.bloomRadius;
        bloomPass.threshold = currentConfig.bloomThreshold;
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}    

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Viewport control functions (exposed to window)
window.resetCamera = function() {
    camera.position.set(0, 15, 45);
    controls.target.set(0, 0, 0);
    controls.update();
    showStatus('🎥 Camera view reset!', 'info');
};

window.toggleRotation = function() {
    isRotating = !isRotating;
    const btn = document.getElementById('rotate-btn');
    btn.textContent = isRotating ? '⏸️ Pause Rotation' : '▶️ Resume Rotation';
    showStatus(isRotating ? '▶️ Auto-rotation enabled' : '⏸️ Auto-rotation paused', 'info');
};

window.toggleGrid = function() {
    gridHelper.visible = !gridHelper.visible;
    showStatus(gridHelper.visible ? '📐 Grid visible' : '📐 Grid hidden', 'info');
};

window.takeScreenshot = function() {
    try {
        const originalSize = renderer.getSize(new THREE.Vector2());
        renderer.setSize(1920, 1080);
        renderer.render(scene, camera);
        const dataURL = renderer.domElement.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `pendant_screenshot_${Date.now()}.png`;
        link.click();
        renderer.setSize(originalSize.x, originalSize.y);
        showStatus('📸 Screenshot captured!', 'success');
    } catch (error) {
        console.error('Screenshot error:', error);
        showStatus('⚠️ Error taking screenshot', 'error');
    }
};

// Status message helper



// core.js - NEW Function for History Management
export function saveHistory(config) {
    // Clear future history (for redo) if we move back and then make a new change
    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }

    // Save current config state
    const state = JSON.parse(JSON.stringify(config));
    historyStack.push(state);
    historyIndex++;

    // Prune old history
    if (historyStack.length > MAX_HISTORY) {
        historyStack.shift();
        historyIndex--;
    }
    
    // Update button states (you need to add buttons to index.html)
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1;
}

window.undo = function() {
    if (historyIndex > 0) {
        historyIndex--;
        applyHistoryState(historyStack[historyIndex]);
        showStatus('↩️ Undone last change', 'info');
    }
};

window.redo = function() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        applyHistoryState(historyStack[historyIndex]);
        showStatus('↪️ Redone change', 'info');
    }
};

function applyHistoryState(state) {
    // 1. Update global config state
    Object.assign(currentConfig, state);
    
    // 2. Call external functions to update UI and 3D scene
    import('./ui-controls.js').then(module => {
        module.syncUIWithConfig(); 
        module.safeCreatePendant();
    });
    
    // 3. Update buttons
    updateUndoRedoButtons();
    
    showStatus('↩️ Applying previous design state', 'info'); 
}



// Confetti effect
function createConfetti() {
    const colors = ['#FF6B6B', '#FFE66D', '#95E1D3', '#C6B3FF', '#FFA07A'];
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

// core.js - REPLACEMENT for the final document.addEventListener block
// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Three.js scene, renderer, camera, lights, and environment
    init(); 
    
    // 2. Import the UI controls module and execute the initial sync and creation.
    // This is GUARANTEED to run AFTER init() has defined pendantGroup.
    import('./ui-controls.js').then(module => {
        // Initial sync of config to UI elements
        module.syncUIWithConfig(); 
        
        // Safety delay is still good practice for initial texture loads
        setTimeout(() => {
            module.safeCreatePendant();
            showStatus('🎨 Pendant Designer loaded successfully!', 'success');
        }, 500);
    });
});

// Export for other modules
export { THREE };
