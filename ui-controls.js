// ui-controls.js - UI Control Handlers
import { currentConfig, scene, ambientLight, directionalLight1, gridHelper, isAnimatingWings, convertUnitToMM, convertMMToUnit } from './core.js';
import { createPendant } from './geometry.js';
import { showStatus } from './core.js';

// Safe pendant creation wrapper
// ui-controls.js - Safe pendant creation wrapper
// CRITICAL FIX: The logic must ensure all global imports are ready.
export function safeCreatePendant() {
    // Dynamically import core module (to ensure all exports are available)
    import('./core.js').then(core => {
        // CRITICAL CHECK: Ensure the 3D group is initialized before attempting to build.
        if (!core.pendantGroup) { 
            // The canvas isn't fully initialized yet, stop and wait for the next call.
            return;
        }

        // Dynamically import geometry module
        import('./geometry.js').then(geometry => {
            try {
                // This calls the fixed createPendant from geometry.js
                geometry.createPendant(); 
                
                // NEW: Save state ONLY after a successful render
                if (window.saveHistory) { 
                     window.saveHistory(core.currentConfig); 
                }
                
                // CRITICAL: Call the function we know exists on window
                if (window.updateLiveDimensionsDisplay) {
                    window.updateLiveDimensionsDisplay(); 
                }
                
            } catch (error) {
                console.error('Error creating pendant:', error);
                core.showStatus('⚠️ Error updating design', 'error');
            }
        });
    });
}

// Section toggle
window.toggleSection = function(header) {
    const section = header.parentElement;
    section.classList.toggle('collapsed');
};

// Shape update
window.updateShape = function() {
    const selected = document.querySelector('input[name="shape"]:checked');
    if (selected) {
        currentConfig.shape = selected.value;
        // NEW: Hide/show locket controls
        const locketSection = document.getElementById('locket-section');
        if (locketSection) {
            locketSection.style.display = currentConfig.shape === 'locket' ? 'block' : 'none';
        }
        safeCreatePendant();
    }
};

window.updateUnitSystem = function() {
    const newUnit = document.getElementById('unit-system').value;
    currentConfig.unitSystem = newUnit;

    // Helper to convert current MM values back to the new display unit and set slider values
    const updateSlider = (id, configProp, precision) => {
        const valueMM = currentConfig[configProp];
        const newValue = convertMMToUnit(valueMM, newUnit);
        
        const slider = document.getElementById(id);
        if (slider) slider.value = newValue.toFixed(precision);
    };

    updateSlider('pendant-width', 'width', 0);
    updateSlider('pendant-height', 'height', 0);
    updateSlider('thickness', 'thickness', 1);
    updateSlider('bevel-size', 'bevelSize', 2);
    updateSlider('gem-size', 'gemSize', 1);
    updateSlider('gem-depth', 'gemDepth', 1);
    updateSlider('border-width', 'borderWidth', 2);
    updateSlider('bail-size', 'bailSize', 1);
    updateSlider('engrave-depth', 'engraveDepth', 2);
    updateSlider('chain-length', 'chainLength', 0);
    updateSlider('chain-link-thickness', 'chainLinkThickness', 1);

    // Re-call all dimensional and material updates to fix display strings and geometry
    updateDimensions(); 
    updateBevel();
    updateGemSize();
    updateGemDepth();
    updateBorderWidth();
    updateBailSize();
    updateEngraveDepth();
    updateChainLength();
    updateChainThickness();
    updateMaterial(); // Need to call this to sync clearcoat/anisotropy values
    updateLiveDimensionsDisplay();
    showStatus(`📏 Unit system changed to ${newUnit.toUpperCase()}`, 'info');
};

window.updateAnisotropy = function() {
    const value = document.getElementById('anisotropy').value;
    currentConfig.anisotropy = parseFloat(value);
    document.getElementById('anisotropy-value').textContent = value;
    safeCreatePendant();
};

window.updateClearcoat = function() {
    const value = document.getElementById('clearcoat').value;
    currentConfig.clearcoat = parseFloat(value);
    document.getElementById('clearcoat-value').textContent = value;
    safeCreatePendant();
};
// Wings update
window.updateWings = function() {
    currentConfig.hasWings = document.getElementById('add-wings').checked;
    currentConfig.wingStyle = document.getElementById('wing-style').value;
    currentConfig.wingSurface = document.getElementById('wing-surface').value;

    const wingControls = document.getElementById('wing-controls');
    wingControls.style.display = currentConfig.hasWings ? 'block' : 'none';

    safeCreatePendant();
};

window.updateWingSize = function() {
    const value = document.getElementById('wing-size').value;
    currentConfig.wingSize = parseFloat(value);
    document.getElementById('wing-size-value').textContent = value + 'x';
    safeCreatePendant();
};

window.updateWingAngle = function() {
    // Import the animation state from core.js
    import('./core.js').then(module => {
        if (module.isAnimatingWings) { // Check if animation is running
            showStatus('🚫 Cannot change angle while wings are animating.', 'warning');
            // Reset the UI slider to the current config value
            document.getElementById('wing-angle').value = currentConfig.wingAngle;
            document.getElementById('wing-angle-value').textContent = currentConfig.wingAngle + '°';
            return; 
        }
        
        const value = document.getElementById('wing-angle').value;
        currentConfig.wingAngle = parseFloat(value);
        document.getElementById('wing-angle-value').textContent = value + '°';
        safeCreatePendant();
    });
};

window.updateWingOffset = function() {
    currentConfig.wingOffsetX = parseFloat(document.getElementById('wing-offset-x').value);
    currentConfig.wingOffsetY = parseFloat(document.getElementById('wing-offset-y').value);
    document.getElementById('wing-offset-x-value').textContent = currentConfig.wingOffsetX;
    document.getElementById('wing-offset-y-value').textContent = currentConfig.wingOffsetY;
    safeCreatePendant();
};

window.updateLocketStyle = function() {
    currentConfig.locketStyle = document.getElementById('locket-style').value;
    safeCreatePendant();
};

window.updateLocketAngle = function() {
    const value = document.getElementById('locket-open-angle').value;
    currentConfig.locketOpenAngle = parseFloat(value);
    document.getElementById('locket-angle-value').textContent = value + '°';

    // Disable animation flag immediately on manual slider change
    import('./core.js').then(module => {
         // CRITICAL FIX: Use the exported setter to disable animation
         module.setLocketAnimationState(false); 
         // FIX: Call the global function directly
         window.setLocketAngleImmediate(currentConfig.locketOpenAngle);
    });
    
    // Call safeCreatePendant to ensure all dependencies update
    safeCreatePendant();
};

window.handleImageUpload = function(side) {
    const fileInput = document.getElementById(`locket-image-${side}`);
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataURL = e.target.result;
            // Store the data URL in the config
            if (side === 'left') {
                currentConfig.locketImageLeft = dataURL;
            } else if (side === 'right') {
                currentConfig.locketImageRight = dataURL;
            } else if (side === 'back') {
                currentConfig.locketImageBack = dataURL;
            }

            // Optional: Update a preview thumbnail
            const previewEl = document.getElementById(`preview-${side}`);
            if (previewEl) previewEl.src = dataURL;

            safeCreatePendant();
            showStatus(`🖼️ ${side} locket image updated!`, 'info');
        };
        reader.readAsDataURL(file);
    }
};

// Locket animation is handled by a separate function that will be called by a button
// We need a simple function that changes the angle and triggers the re-render.
// For a button-based animation, we can add a simple toggle.
window.toggleLocketAnimation = function() {
    // Import the animation state from core.js
    import('./core.js').then(module => {
        
        // 1. If currently animating, stop and use current config
        if (module.isLocketAnimating()) {
            module.setLocketAnimationState(false); // Stop animation
            showStatus('⏸️ Locket animation paused.', 'info');
            return;
        }
        
        const angleInput = document.getElementById('locket-open-angle');
        
        // Determine the target state
        if (currentConfig.locketOpenAngle > 0) {
            // Target: Close (angle 0)
            currentConfig.locketOpenAngle = 0;
            module.setLocketAnimationState(true, 1); // Start progress from 1 (open)
        } else {
            // Target: Open (angle 180)
            currentConfig.locketOpenAngle = 180;
            module.setLocketAnimationState(true, 0); // Start progress from 0 (closed)
        }
        
        // Sync UI display value
        document.getElementById('locket-angle-value').textContent = currentConfig.locketOpenAngle + '°';
        showStatus('✨ Locket animation started!', 'info');
        
        // CRITICAL FIX: To start the animation smoothly, we must immediately set the model 
        // to the STARTING (opposite) position of the animation before core.js begins running the loop.
        // FIX: Call the global function directly
        window.setLocketAngleImmediate(currentConfig.locketOpenAngle === 0 ? 180 : 0);
    });
};


// Dimensions update
window.updateDimensions = function() {
    const unit = currentConfig.unitSystem;
    const widthUI = parseFloat(document.getElementById('pendant-width').value);
    const heightUI = parseFloat(document.getElementById('pendant-height').value);
    const thicknessUI = parseFloat(document.getElementById('thickness').value);
    
    // Store all values in the config in the BASE UNIT (mm)
    currentConfig.width = convertUnitToMM(widthUI, unit);
    currentConfig.height = convertUnitToMM(heightUI, unit);
    currentConfig.thickness = convertUnitToMM(thicknessUI, unit);

    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');

    // Update display values using the current UI value and unit label
    document.getElementById('pendant-width-value').textContent = widthUI.toFixed(0) + unitLabel;
    document.getElementById('pendant-height-value').textContent = heightUI.toFixed(0) + unitLabel;
    document.getElementById('thickness-value').textContent = thicknessUI.toFixed(1) + unitLabel;

    safeCreatePendant();
};

window.updateLiveDimensionsDisplay = function() {
    // CRITICAL FIX: Dynamically import core.js to ensure pendantGroup is defined,
    // and THREE is imported from core.js (where it is exported)
    import('./core.js').then(core => {
        const unit = core.currentConfig.unitSystem;
        const pendantGroup = core.pendantGroup;
        // THREE is exported from core.js
        const THREE = core.THREE; 

        // Get total bounding box of the entire pendant group
        if (pendantGroup && pendantGroup.children.length > 0) {
            // Check if THREE object is available
            if (!THREE || !THREE.Box3 || !THREE.Vector3) {
                 console.warn("THREE object not fully initialized for dimension calculation.");
                 return;
            }
            
            const box = new THREE.Box3().setFromObject(pendantGroup);
            const size = box.getSize(new THREE.Vector3());
            
            // Convert to display units
            // NOTE: core.convertMMToUnit is not imported at the top, so we use core.convertMMToUnit
            const widthDisplay = core.convertMMToUnit(size.x * 10, unit); 
            const heightDisplay = core.convertMMToUnit(size.y * 10, unit);
            const depthDisplay = core.convertMMToUnit(size.z * 10, unit);
            
            const unitLabel = unit.toUpperCase();

            const totalWidthEl = document.getElementById('total-width-value');
            const totalHeightEl = document.getElementById('total-height-value');
            const totalDepthEl = document.getElementById('total-depth-value');

            if (totalWidthEl) totalWidthEl.textContent = widthDisplay.toFixed(1) + unitLabel;
            if (totalHeightEl) totalHeightEl.textContent = heightDisplay.toFixed(1) + unitLabel;
            if (totalDepthEl) totalDepthEl.textContent = depthDisplay.toFixed(1) + unitLabel;
        } else {
             // Handle case where pendantGroup is not yet populated
             const totalWidthEl = document.getElementById('total-width-value');
             if (totalWidthEl) totalWidthEl.textContent = '--';
        }
    });
};


window.updateBevel = function() {
    const valueUI = parseFloat(document.getElementById('bevel-size').value);
    const unit = currentConfig.unitSystem;
    
    currentConfig.bevelSize = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('bevel-value').textContent = valueUI.toFixed(2) + unitLabel;
    safeCreatePendant();
};


// Material update
window.updateMaterial = function() {
    const materialChecked = document.querySelector('input[name="material"]:checked');
    if (materialChecked) {
        currentConfig.material = materialChecked.value;
    }

    currentConfig.useLayeredColor = document.getElementById('use-layered-color').checked;
    currentConfig.colorBase = document.getElementById('color-base').value;
    currentConfig.colorLayer1 = document.getElementById('color-layer1').value;
    currentConfig.colorLayer2 = document.getElementById('color-layer2').value;

    const layeredControls = document.getElementById('layered-color-controls');
    const standardControls = document.getElementById('standard-material-controls');

    if (currentConfig.useLayeredColor) {
        layeredControls.style.display = 'block';
        standardControls.style.display = 'none';
    } else {
        layeredControls.style.display = 'none';
        standardControls.style.display = 'grid';
    }

    safeCreatePendant();
};

window.updateGlossiness = function() {
    const value = document.getElementById('glossiness').value;
    currentConfig.glossiness = parseFloat(value);
    document.getElementById('glossiness-value').textContent = value + '%';
    safeCreatePendant();
};

window.updateMetallic = function() {
    const value = document.getElementById('metallic').value;
    currentConfig.metallic = parseFloat(value);
    document.getElementById('metallic-value').textContent = value + '%';
    safeCreatePendant();
};

window.updateReflectivity = function() {
    const value = document.getElementById('reflectivity').value;
    currentConfig.reflectivity = parseFloat(value);
    document.getElementById('reflectivity-value').textContent = value + 'x';
    safeCreatePendant();
};

// Gemstone controls
window.updateGemSize = function() {
    const valueUI = parseFloat(document.getElementById('gem-size').value);
    const unit = currentConfig.unitSystem;
    
    currentConfig.gemSize = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('gem-size-value').textContent = valueUI.toFixed(1) + unitLabel;
    safeCreatePendant();
};

window.setGemPreset = function() {
    const type = document.getElementById('gem-type').value;
    currentConfig.gemType = type;

    if (type !== 'custom') {
        const presets = {
            'diamond': '#FFFFFF',
            'ruby': '#E0115F',
            'sapphire': '#0F52BA',
            'emerald': '#50C878',
            'amethyst': '#9966CC',
            'topaz': '#FFC87C',
            'aquamarine': '#7FFFD4',
            'opal': '#A8C3BC',
            'pearl': '#F0EAD6'
        };

        if (presets[type]) {
            currentConfig.gemColor = presets[type];
            document.getElementById('gem-color').value = presets[type];
        }
    }

    safeCreatePendant();
};

window.updateGemSize = function() {
    const value = document.getElementById('gem-size').value;
    currentConfig.gemSize = parseFloat(value);
    document.getElementById('gem-size-value').textContent = value + 'mm';
    safeCreatePendant();
};

window.updateGemDepth = function() {
    const valueUI = parseFloat(document.getElementById('gem-depth').value);
    const unit = currentConfig.unitSystem;
    
    currentConfig.gemDepth = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('gem-depth-value').textContent = valueUI.toFixed(1) + unitLabel;
    safeCreatePendant();
};

window.updateGemFacets = function() {
    const value = document.getElementById('gem-facets').value;
    currentConfig.gemFacets = parseInt(value);
    document.getElementById('gem-facets-value').textContent = value;
    safeCreatePendant();
};

window.updateGemSparkle = function() {
    const value = document.getElementById('gem-sparkle').value;
    currentConfig.gemSparkle = parseFloat(value);
    document.getElementById('gem-sparkle-value').textContent = value + 'x';
    safeCreatePendant();
};

window.updateGemOpacity = function() {
    const value = document.getElementById('gem-opacity').value;
    currentConfig.gemOpacity = parseFloat(value);
    document.getElementById('gem-opacity-value').textContent = value + '%';
    safeCreatePendant();
};

window.updateGemIridescence = function() {
    currentConfig.gemIridescence = document.getElementById('gem-iridescence').checked;
    safeCreatePendant();
};

window.updateSettingStyle = function() {
    currentConfig.settingStyle = document.getElementById('setting-style').value;
    safeCreatePendant();
};

window.updateProngThickness = function() {
    const valueUI = parseFloat(document.getElementById('prong-thickness').value);
    const unit = currentConfig.unitSystem;
    
    // Store size in base unit (mm)
    currentConfig.prongThickness = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('prong-thickness-value').textContent = valueUI.toFixed(2) + unitLabel;
    safeCreatePendant();
};

window.updateGemstone = function() {
    currentConfig.hasGem = document.getElementById('add-gem').checked;
    currentConfig.gemShape = document.getElementById('gem-shape').value;
    currentConfig.gemColor = document.getElementById('gem-color').value;

    const gemControls = document.getElementById('gem-controls');
    gemControls.style.display = currentConfig.hasGem ? 'block' : 'none';

    safeCreatePendant();
};

window.setGemPreset = function() {
    const type = document.getElementById('gem-type').value;
    currentConfig.gemType = type;

    if (type !== 'custom') {
        // The getGemPresetColor function is defined in materials.js, 
        // so we must use the presets array defined here to update the UI color input immediately.
        const presets = {
            'diamond': '#FFFFFF',
            'ruby': '#E0115F',
            'sapphire': '#0F52BA',
            'emerald': '#50C878',
            'amethyst': '#9966CC',
            'topaz': '#FFC87C',
            'aquamarine': '#7FFFD4',
            'opal': '#A8C3BC',
            'pearl': '#F0EAD6'
        };

        if (presets[type]) {
            currentConfig.gemColor = presets[type];
            document.getElementById('gem-color').value = presets[type];
        }
    }

    safeCreatePendant();
};

window.updateGemSize = function() {
    const valueUI = parseFloat(document.getElementById('gem-size').value);
    const unit = currentConfig.unitSystem;
    
    currentConfig.gemSize = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('gem-size-value').textContent = valueUI.toFixed(1) + unitLabel;
    safeCreatePendant();
};

window.updateGemDepth = function() {
    const valueUI = parseFloat(document.getElementById('gem-depth').value);
    const unit = currentConfig.unitSystem;
    
    currentConfig.gemDepth = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('gem-depth-value').textContent = valueUI.toFixed(1) + unitLabel;
    safeCreatePendant();
};

window.updateGemFacets = function() {
    const value = document.getElementById('gem-facets').value;
    currentConfig.gemFacets = parseInt(value);
    document.getElementById('gem-facets-value').textContent = value;
    safeCreatePendant();
};

window.updateGemSparkle = function() {
    const value = document.getElementById('gem-sparkle').value;
    currentConfig.gemSparkle = parseFloat(value);
    document.getElementById('gem-sparkle-value').textContent = value + 'x';
    safeCreatePendant();
};

window.updateGemOpacity = function() {
    const value = document.getElementById('gem-opacity').value;
    currentConfig.gemOpacity = parseFloat(value);
    document.getElementById('gem-opacity-value').textContent = value + '%';
    safeCreatePendant();
};

window.updateGemIridescence = function() {
    currentConfig.gemIridescence = document.getElementById('gem-iridescence').checked;
    safeCreatePendant();
};
// Border controls
window.updateBorder = function() {
    currentConfig.hasBorder = document.getElementById('add-border').checked;
    currentConfig.borderStyle = document.getElementById('border-style').value;

    const borderControls = document.getElementById('border-controls');
    borderControls.style.display = currentConfig.hasBorder ? 'block' : 'none';

    safeCreatePendant();
};

window.updateBorderWidth = function() {
    const valueUI = parseFloat(document.getElementById('border-width').value);
    const unit = currentConfig.unitSystem;
    
    currentConfig.borderWidth = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('border-width-value').textContent = valueUI.toFixed(2) + unitLabel;
    safeCreatePendant();
};


window.updateBorderGems = function() {
    currentConfig.borderGems = document.getElementById('border-gems').checked;
    safeCreatePendant();
};

// Bail controls
window.updateBail = function() {
    currentConfig.hasBail = document.getElementById('add-bail').checked;
    currentConfig.bailStyle = document.getElementById('bail-style').value;

    const bailControls = document.getElementById('bail-controls');
    bailControls.style.display = currentConfig.hasBail ? 'block' : 'none';

    safeCreatePendant();
};

window.updateBailSize = function() {
    const valueUI = parseFloat(document.getElementById('bail-size').value);
    const unit = currentConfig.unitSystem;
    
    currentConfig.bailSize = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('bail-size-value').textContent = valueUI.toFixed(1) + unitLabel;
    safeCreatePendant();
};

// Engraving controls
window.updateEngraving = function() {
    currentConfig.hasEngraving = document.getElementById('add-engraving').checked;
    currentConfig.engravingText = document.getElementById('engraving-text').value;

    const engravingControls = document.getElementById('engraving-controls');
    engravingControls.style.display = currentConfig.hasEngraving ? 'block' : 'none';

    safeCreatePendant();
};

window.updateFontSize = function() {
    const value = document.getElementById('font-size').value;
    currentConfig.fontSize = parseFloat(value);
    document.getElementById('font-size-value').textContent = value + 'pt';
    safeCreatePendant();
};

window.updateFontStyle = function() {
    currentConfig.fontStyle = document.getElementById('font-style').value;
    safeCreatePendant();
};

window.updateEngraveDepth = function() {
    const valueUI = parseFloat(document.getElementById('engrave-depth').value);
    const unit = currentConfig.unitSystem;
    
    currentConfig.engraveDepth = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('engrave-depth-value').textContent = valueUI.toFixed(2) + unitLabel;
    safeCreatePendant();
};

// Overlay controls
window.updateOverlay = function() {
    currentConfig.hasOverlay = document.getElementById('add-overlay').checked;
    currentConfig.overlayType = document.getElementById('overlay-type').value;

    const overlayControls = document.getElementById('overlay-controls');
    overlayControls.style.display = currentConfig.hasOverlay ? 'block' : 'none';

    safeCreatePendant();
};

window.updateOverlaySize = function() {
    const value = document.getElementById('overlay-size').value;
    currentConfig.overlaySize = parseFloat(value);
    document.getElementById('overlay-size-value').textContent = value + 'x';
    safeCreatePendant();
};

// ui-controls.js - CORRECTION BLOCK
window.updateCrystals = function() {
    currentConfig.addCrystals = document.getElementById('add-crystals').checked;
    // Check if the base shape is compatible with crystal base (only Heart, Teardrop, Oval are supported)
    if (currentConfig.addCrystals && 
        !(currentConfig.shape === 'heart' || currentConfig.shape === 'teardrop' || currentConfig.shape === 'oval')) {
        
        showStatus('⚠️ Crystal Base only works with Heart, Teardrop, or Oval shapes.', 'warning');
        currentConfig.addCrystals = false; // Disable if shape is unsupported
        document.getElementById('add-crystals').checked = false; // Sync UI
    }
    
    // Ensure the pendant is recreated to switch the base type
    safeCreatePendant(); 
};


// Chain controls
window.updateChain = function() {
    currentConfig.hasChain = document.getElementById('add-chain').checked;
    currentConfig.chainStyle = document.getElementById('chain-style').value;

    const chainControls = document.getElementById('chain-controls');
    chainControls.style.display = currentConfig.hasChain ? 'block' : 'none';

    safeCreatePendant();
};

window.updateChainLength = function() {
    const valueUI = parseFloat(document.getElementById('chain-length').value);
    const unit = currentConfig.unitSystem;
    
    // Store in the base unit (mm)
    currentConfig.chainLength = convertUnitToMM(valueUI, unit); 
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    // Display the UI value
    document.getElementById('chain-length-value').textContent = valueUI.toFixed(0) + unitLabel;
    safeCreatePendant();
};


window.updateChainThickness = function() {
    const valueUI = parseFloat(document.getElementById('chain-link-thickness').value);
    const unit = currentConfig.unitSystem;
    
    currentConfig.chainLinkThickness = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('chain-link-thickness-value').textContent = valueUI.toFixed(1) + unitLabel;
    safeCreatePendant();
};

window.updateReferenceObject = function() {
    const refObjectEl = document.getElementById('reference-object');
    
    if (refObjectEl) {
         currentConfig.referenceObject = refObjectEl.value;
    } else {
         // If the element doesn't exist, we can't update.
         currentConfig.referenceObject = 'none';
    }
    
    updateReferenceSize(); // Update size when object type changes
    safeCreatePendant();
};


window.updateReferenceSize = function() {
    const valueUI = parseFloat(document.getElementById('reference-size').value);
    const unit = currentConfig.unitSystem;
    
    // Store size in base unit (mm)
    currentConfig.referenceSize = convertUnitToMM(valueUI, unit);
    
    const unitLabel = unit === 'mm' ? 'mm' : (unit === 'cm' ? 'cm' : 'in');
    document.getElementById('reference-size-value').textContent = valueUI.toFixed(1) + unitLabel;
    safeCreatePendant();
};

window.updateChainSagDepth = function() {
    const value = document.getElementById('chain-sag-depth').value;
    currentConfig.chainSagDepth = parseFloat(value);
    document.getElementById('chain-sag-depth-value').textContent = value + '%';
    safeCreatePendant();
};

window.updateOverlayColor = function() {
    currentConfig.overlayColor = document.getElementById('overlay-color').value;
    safeCreatePendant();
};

window.updateChainColor = function() {
    currentConfig.chainColor = document.getElementById('chain-color').value;
    safeCreatePendant();
};

// Lighting controls
window.updateLighting = function() {
    currentConfig.ambientLightIntensity = parseFloat(document.getElementById('ambient-light').value);
    currentConfig.directLightIntensity = parseFloat(document.getElementById('direct-light').value);

    document.getElementById('ambient-light-value').textContent = currentConfig.ambientLightIntensity.toFixed(1);
    document.getElementById('direct-light-value').textContent = currentConfig.directLightIntensity.toFixed(1);

    if (ambientLight) ambientLight.intensity = currentConfig.ambientLightIntensity;
    if (directionalLight1) directionalLight1.intensity = currentConfig.directLightIntensity;
};

window.updateEnvironment = function() {
    const value = document.getElementById('env-intensity').value;
    currentConfig.envIntensity = parseFloat(value);
    document.getElementById('env-intensity-value').textContent = value;
    safeCreatePendant();
};

window.updateShadows = function() {
    const value = document.getElementById('shadow-intensity').value;
    currentConfig.shadowIntensity = parseFloat(value);
    document.getElementById('shadow-value').textContent = value + '%';

    if (directionalLight1 && directionalLight1.shadow) {
        directionalLight1.shadow.camera.far = 50 * (value / 100);
    }
};

// ui-controls.js - Check and fix updateBloom if necessary
window.updateBloom = function() {
    currentConfig.bloomEffect = document.getElementById('bloom-effect').checked;
    
    const bloomControls = document.getElementById('bloom-controls');
    if (bloomControls) {
        // This is what controls the visibility of the sliders
        bloomControls.style.display = currentConfig.bloomEffect ? 'block' : 'none'; 
    }

    safeCreatePendant();
    if (currentConfig.bloomEffect) {
        showStatus('✨ Bloom effect enabled', 'info');
    }
};

window.updateBloomParams = function() {
    const strengthEl = document.getElementById('bloom-strength');
    const thresholdEl = document.getElementById('bloom-threshold');
    const radiusEl = document.getElementById('bloom-radius');

    // CRITICAL: Check if ALL elements are available before proceeding.
    if (!strengthEl || !thresholdEl || !radiusEl) {
        // If elements are missing (e.g., hidden or not yet rendered), exit gracefully
        return; 
    }
    currentConfig.bloomStrength = parseFloat(document.getElementById('bloom-strength').value);
    currentConfig.bloomThreshold = parseFloat(document.getElementById('bloom-threshold').value);
    currentConfig.bloomRadius = parseFloat(document.getElementById('bloom-radius').value);

    document.getElementById('bloom-strength-value').textContent = currentConfig.bloomStrength.toFixed(1);
    document.getElementById('bloom-threshold-value').textContent = currentConfig.bloomThreshold.toFixed(2);
    document.getElementById('bloom-radius-value').textContent = currentConfig.bloomRadius.toFixed(1);
    
    // Actual Bloom rendering update requires post-processing implementation 
    // which is done in the final section, but we update config here.
    safeCreatePendant(); 
    showStatus('✨ Glow parameters updated!', 'info');
};

export function syncUIWithConfig() {
    // Helper to safely get and update checked state
    const getCheckedElement = (id, prop) => {
        const el = document.getElementById(id);
        // Syncs the checkbox status from config (e.g., currentConfig.hasGem)
        if (el) el.checked = currentConfig[prop]; 
        return el;
    };
    
    // Helper to safely get and update value state (for select/range/input)
    const getValueElement = (id, prop) => {
        const el = document.getElementById(id);
        // Syncs the element's value from config (e.g., currentConfig.gemShape)
        if (el) el.value = currentConfig[prop];
        return el;
    };

    // Update all UI elements to match currentConfig
    const shapeEl = document.querySelector(`input[name="shape"][value="${currentConfig.shape}"]`);
    if (shapeEl) shapeEl.checked = true;
    
    const materialEl = document.querySelector(`input[name="material"][value="${currentConfig.material}"]`);
    if (materialEl) materialEl.checked = true;

    // NEW: Sync Unit System
    const unit = currentConfig.unitSystem;
    getValueElement('unit-system', 'unitSystem');

    // Helper to convert internal MM to UI display units
    const convertAndSync = (id, prop, precision) => {
        const valueMM = currentConfig[prop];
        const newValue = convertMMToUnit(valueMM, unit);
        const element = document.getElementById(id);
        if (element) {
            element.value = newValue.toFixed(precision);
        }
    };
    
    // Convert and sync all dimension-related inputs
    convertAndSync('pendant-width', 'width', 0);
    convertAndSync('pendant-height', 'height', 0);
    convertAndSync('thickness', 'thickness', 1);
    convertAndSync('bevel-size', 'bevelSize', 2);
    convertAndSync('gem-size', 'gemSize', 1);
    convertAndSync('gem-depth', 'gemDepth', 1);
    convertAndSync('border-width', 'borderWidth', 2);
    convertAndSync('bail-size', 'bailSize', 1);
    convertAndSync('engrave-depth', 'engraveDepth', 2);
    convertAndSync('chain-length', 'chainLength', 0);
    convertAndSync('chain-link-thickness', 'chainLinkThickness', 1);
    convertAndSync('reference-size', 'referenceSize', 1);
    convertAndSync('prong-thickness', 'prongThickness', 2);
    
    // Sync non-dimension controls (using new helpers where possible)
    getCheckedElement('add-wings', 'hasWings');
    getValueElement('wing-style', 'wingStyle');
    getValueElement('wing-surface', 'wingSurface');
    getValueElement('wing-size', 'wingSize');
    getValueElement('wing-angle', 'wingAngle');
    getValueElement('wing-offset-x', 'wingOffsetX'); 
    getValueElement('wing-offset-y', 'wingOffsetY'); 
    
    getValueElement('reference-object', 'referenceObject');
    getValueElement('setting-style', 'settingStyle');
    
    // Locket
    const locketSection = document.getElementById('locket-section');
    if (locketSection) {
        locketSection.style.display = currentConfig.shape === 'locket' ? 'block' : 'none';
        getValueElement('locket-style', 'locketStyle');
        getValueElement('locket-open-angle', 'locketOpenAngle');

        const sides = ['left', 'right', 'back'];
        sides.forEach(side => {
            const imgUrl = currentConfig[`locketImage${side.charAt(0).toUpperCase() + side.slice(1)}`];
            const previewEl = document.getElementById(`preview-${side}`);
            if (previewEl && imgUrl) previewEl.src = imgUrl;
        });
    }
    
    // NEW: Sync Custom Colors
    getValueElement('overlay-color', 'overlayColor');
    getValueElement('chain-color', 'chainColor');
    
    // Material
    getCheckedElement('use-layered-color', 'useLayeredColor');
    getValueElement('color-base', 'colorBase');
    getValueElement('color-layer1', 'colorLayer1');
    getValueElement('color-layer2', 'colorLayer2');
    getValueElement('glossiness', 'glossiness');
    
    // NEW: PBR Controls
    getValueElement('anisotropy', 'anisotropy');
    getValueElement('clearcoat', 'clearcoat');

    // NEW: Sync Bloom Parameters
    getCheckedElement('bloom-effect', 'bloomEffect'); 
    getValueElement('bloom-strength', 'bloomStrength');
    getValueElement('bloom-threshold', 'bloomThreshold');
    getValueElement('bloom-radius', 'bloomRadius');
    
    // Gem
    getCheckedElement('add-gem', 'hasGem'); 
    getValueElement('gem-shape', 'gemShape');
    getValueElement('gem-color', 'gemColor');
    getValueElement('gem-type', 'gemType'); 
    getCheckedElement('gem-iridescence', 'gemIridescence'); 
    getValueElement('gem-facets', 'gemFacets');
    getValueElement('gem-sparkle', 'gemSparkle');
    getValueElement('gem-opacity', 'gemOpacity');
    getValueElement('setting-style', 'settingStyle');

    // Bail
    getCheckedElement('add-bail', 'hasBail');
    getValueElement('bail-style', 'bailStyle');

    // Overlay
    getCheckedElement('add-overlay', 'hasOverlay');
    getValueElement('overlay-type', 'overlayType');
    getValueElement('overlay-size', 'overlaySize');
    getCheckedElement('add-crystals', 'addCrystals'); 

    // Chain
    getCheckedElement('add-chain', 'hasChain');
    getValueElement('chain-style', 'chainStyle');
    
    // Border
    getCheckedElement('add-border', 'hasBorder');
    getValueElement('border-style', 'borderStyle');
    getCheckedElement('border-gems', 'borderGems');
    
    // Engraving
    getCheckedElement('add-engraving', 'hasEngraving');
    getValueElement('engraving-text', 'engravingText');
    getValueElement('font-size', 'fontSize');
    getValueElement('font-style', 'fontStyle');


    // Update display values (calls all updated functions that use current UI values)
    // CRITICAL: Calling these functions handles the logic for showing/hiding control sections.
    updateDimensions();
    updateBevel();
    updateGlossiness();
    updateMetallic();
    updateReflectivity();
    updateAnisotropy();
    updateClearcoat();
    updateWingSize();
    updateWingAngle();
    updateGemSize();
    updateGemDepth();
    updateBorderWidth();
    updateBorder();
    updateBailSize();
    updateBail();
    updateEngraveDepth();
    updateEngraving();
    updateOverlay();
    updateChainLength();
    updateChainThickness();
    updateChainSagDepth();
    updateChain();
    updateReferenceObject();
    updateMaterial();
    updateWings();
    updateGemstone();
    updateProngThickness();
    updateOverlayColor();
    updateChainColor();
    updateBloomParams();
    updateCrystals();
    updateLiveDimensionsDisplay();
}


