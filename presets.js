// presets.js - Preset Templates and Loading Logic
import { currentConfig, showStatus } from './core.js';
import { syncUIWithConfig, safeCreatePendant } from './ui-controls.js';

// --- Preset Data ---
const presets = {
    'angel-heart': {
        // GOLD & DIAMOND FEATHERED WINGS
        shape: 'heart',
        hasWings: true,
        wingStyle: 'angel',
        wingSurface: 'feathered',
        wingSize: 1.5,
        wingAngle: 45,
        hasGem: true,
        gemShape: 'heart',
        gemType: 'diamond', 
        gemColor: '#FFFFFF',
        gemSparkle: 4.5,
        gemOpacity: 90,
        hasOverlay: true,
        overlayType: 'cross',
        overlaySize: 0.8,
        material: 'gold',
        chainStyle: 'rope',
        chainLinkThickness: 1.0,
        chainSagDepth: 25,
        bloomEffect: true,
        bloomStrength: 0.8,
        bloomThreshold: 0.7
    },
    'crystal-wings': {
        // CRYSTAL BASE HEART W/ PAVÉ WINGS (MATCHES SS #2 AURORA EFFECT)
        shape: 'heart',
        hasWings: true,
        wingStyle: 'dual-symmetrical',
        wingSurface: 'pave-diamonds',
        wingSize: 1.4,
        wingAngle: 25,
        useLayeredColor: true,
        colorBase: '#444444',
        colorLayer1: '#222222', 
        addCrystals: true, 
        hasGem: false, 
        gemIridescence: true, 
        gemSparkle: 5.0,
        chainStyle: 'box',
        chainColor: '#444444',
        bloomEffect: true, 
        bloomStrength: 1.5, 
        bloomThreshold: 0.6
    },
    'royal-gem': {
        // CROWN BORDER W/ EMERALD CUT SAPPHIRE
        shape: 'emerald',
        hasGem: true,
        gemShape: 'emerald',
        gemType: 'sapphire',
        gemSize: 10,
        gemDepth: 4,
        settingStyle: 'bezel',
        hasBorder: true,
        borderStyle: 'crown',
        borderWidth: 0.4,
        material: 'rose-gold',
        chainStyle: 'curb',
        reflectivity: 2.5
    },
    'celtic-cross': {
        // CELTIC KNOT OVERLAY ON A SIMPLE CROSS
        shape: 'cross',
        hasOverlay: true,
        overlayType: 'celtic',
        overlaySize: 1.2,
        material: 'silver',
        hasWings: false,
        hasChain: true,
        chainStyle: 'wheat',
        chainLinkThickness: 1.5,
        chainSagDepth: 10
    },
    'dragon-pendant': {
        // TITANIUM SHIELD W/ RUBY GEM
        shape: 'shield',
        hasWings: true,
        wingStyle: 'dragon',
        wingSurface: 'geometric',
        wingSize: 1.8,
        hasGem: true,
        gemType: 'ruby',
        gemShape: 'round',
        gemSize: 5,
        material: 'titanium',
        metallic: 90,
        glossiness: 50,
        clearcoat: 0.5,
        chainStyle: 'snake'
    },
    'vintage-locket': {
        // ORNATE ROSE GOLD LOCKET
        shape: 'locket',
        locketOpenAngle: 0,
        locketStyle: 'three-sided',
        hasBorder: true,
        borderStyle: 'ornate',
        hasEngraving: true,
        engravingText: 'Ad Astra',
        fontStyle: 'script',
        material: 'rose-gold',
        chainStyle: 'figaro'
    },
    'angel-cross-base': {
        // BLUE CRYSTAL HEART W/ CROSS OVERLAY (THE DEFAULT)
        shape: 'heart',
        hasWings: true,
        wingStyle: 'angel',
        wingSurface: 'pave-diamonds',
        wingSize: 1.2,
        wingAngle: 30,
        hasGem: false,
        addCrystals: true, 
        gemColor: '#0044BB',
        gemSparkle: 3.5,
        gemOpacity: 95,
        hasOverlay: true,
        overlayType: 'cross',
        overlayColor: '#FFFFFF',
        overlaySize: 1.0,
        bailStyle: 'simple',
        material: 'platinum',
        chainStyle: 'curb',
        bloomEffect: true, 
        bloomStrength: 1.0, 
        bloomThreshold: 0.7
    },
    'celestial-secret': {
        // EXTREME IRIDESCENCE HEART WITH WHITE GOLD WINGS
        shape: 'heart',
        hasWings: true,
        wingStyle: 'dual-symmetrical',
        wingSurface: 'pave-diamonds',
        wingSize: 1.3,
        wingAngle: 35,
        useLayeredColor: true,
        colorBase: '#F5F5F5', 
        colorLayer1: '#C0C0C0', 
        colorLayer2: '#F5F5F5', 
        addCrystals: true, 
        hasGem: false, 
        gemIridescence: true, 
        gemSparkle: 5.0,
        gemOpacity: 95,
        gemColor: '#FF69B4',
        chainStyle: 'snake',
        chainColor: '#F5F5F5',
        bloomEffect: true, 
        bloomStrength: 2.0, 
        bloomThreshold: 0.5
    },
    'ocean-tide': {
        shape: 'teardrop',
        hasWings: false,
        hasGem: true,
        gemShape: 'pear',
        gemType: 'aquamarine',
        gemColor: '#7FFFD4',
        gemSize: 12,
        gemDepth: 5,
        settingStyle: 'bezel',
        material: 'platinum',
        glossiness: 95,
        reflectivity: 3.0,
        chainStyle: 'ball',
        chainLength: 40,
        bloomEffect: true,
        bloomStrength: 0.6,
        bloomThreshold: 0.9,
        addCrystals: false,
        hasBorder: true,
        borderStyle: 'beaded',
        borderWidth: 0.2
    },
    'gothic-key': {
        shape: 'cross',
        hasWings: false,
        hasGem: false,
        hasOverlay: true,
        overlayType: 'filigree',
        overlaySize: 1.5,
        material: 'bronze',
        metallic: 70,
        glossiness: 60,
        anisotropy: 0.5,
        chainStyle: 'figaro',
        chainLinkThickness: 1.5,
        hasEngraving: true,
        engravingText: 'Memento Mori',
        fontStyle: 'gothic',
        engraveDepth: 0.2
    }
};

// presets.js - Function to load the preset configuration
window.loadPreset = function(presetName) {
    const preset = presets[presetName];
    if (preset) {
        // 1. Update the configuration object
        Object.assign(currentConfig, preset);
        
        // 2. Dynamically import ui-controls and core for safe, asynchronous execution
        import('./ui-controls.js').then(uiModule => {
            // A. Sync the UI sliders and inputs to match the new config
            uiModule.syncUIWithConfig(); 
            
            // B. Recreate the 3D model (which includes saving history)
            uiModule.safeCreatePendant(); 
            
            // C. Show status (showStatus is imported from core.js at the top of this file)
            // It is safe to call directly now that core.js has showStatus defined early.
            showStatus(`🎁 Loaded preset: ${presetName}`, 'success');
        }).catch(error => {
            console.error('Error loading preset modules:', error);
            showStatus('⚠️ Error applying preset', 'error');
        });
    }
};


// Function to reset to the gorgeous default
window.resetToDefault = function() {
    window.loadPreset('angel-cross-base');
    showStatus('✨ Reset to the stunning Angel Cross Base default design!', 'success');
};


