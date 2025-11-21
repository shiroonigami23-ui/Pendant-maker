// materials.js - Material Management
import { THREE, scene, currentConfig } from './core.js';

export function getMaterial(isLayered = false, layerIndex = 0, overrideColor = null) {
    // 1. Calculate PBR properties
    const glossiness = currentConfig.glossiness / 100;
    const metallic = currentConfig.metallic / 100;
    const roughness = 1 - glossiness;
    let color;

    // 2. Color Determination
    if (overrideColor) {
        color = overrideColor; // NEW: Use the passed-in dedicated color
    } else if (currentConfig.useLayeredColor) {
        if (isLayered) {
            if (layerIndex === 1) {
                color = currentConfig.colorLayer1;
            } 
            else if (layerIndex === 2) { 
                color = currentConfig.colorLayer2;
            } 
            else { 
                color = currentConfig.colorBase;
            }
        } else {
            color = currentConfig.colorBase;
        }
    } else {
        // Standard material colors
        switch (currentConfig.material) {
            case 'silver': color = '#D3D3D3'; break;
            case 'gold': color = '#FFD700'; break;
            case 'rose-gold': color = '#B76E79'; break;
            case 'platinum': color = '#E5E4E2'; break;
            case 'copper': color = '#B87333'; break;
            case 'titanium': color = '#878681'; break;
            case 'white-gold': color = '#F5F5F5'; break;
            case 'bronze': color = '#CD7F32'; break;
            default: color = '#D3D3D3';
        }
    }

    // 3. Setup Material (Using MeshPhysicalMaterial)
    let finalColor;
    try {
        // CRITICAL FIX: Ensure color is a valid hex string before creating THREE.Color
        if (typeof color === 'string' && color.match(/^#([0-9A-F]{3}){1,2}$/i)) {
             finalColor = new THREE.Color(color);
        } else {
             finalColor = new THREE.Color('#D3D3D3'); // Fallback to silver
        }
    } catch (e) {
        finalColor = new THREE.Color('#D3D3D3'); // Fallback
    }

    const envMapValue = scene?.environment || null;

    return new THREE.MeshPhysicalMaterial({
        color: finalColor,
        metalness: metallic,
        roughness: roughness,
        envMap: envMapValue,
        envMapIntensity: currentConfig.reflectivity,
        anisotropy: currentConfig.anisotropy,
        clearcoat: currentConfig.clearcoat,
        clearcoatRoughness: 0.1,
        sheen: 0.05
    });
}

export function getGemMaterial() {
    let gemColor = currentConfig.gemColor;

    // Apply gem type presets
    if (currentConfig.gemType !== 'custom') {
        gemColor = getGemPresetColor(currentConfig.gemType);
    }
      
    // NEW: If "diamond" or white is the color, ensure it uses the overlay color for cohesion
    if (currentConfig.gemType === 'diamond' || gemColor === '#FFFFFF') {
        // Use a color slightly brighter than the overlay for contrast/realism
        gemColor = currentConfig.overlayColor || '#FFFFFF'; 
    }
    // Fallback if color is invalid (prevents runtime error)
    if (!gemColor || typeof gemColor !== "string" || gemColor.trim() === "") {
        gemColor = '#0044bb';
    }

    const envMapValue = scene?.environment || null;
    const finalColor = new THREE.Color(gemColor);
    const opacity = currentConfig.gemOpacity / 100;
    const sparkle = currentConfig.gemSparkle;
    const facets = currentConfig.gemFacets || 24; // Use a default if missing
    // Use a slightly different material if Bloom is active to avoid over-brightening
    const isHighBloom = currentConfig.bloomEffect && currentConfig.bloomStrength > 1.5;

    const materialProps = {
        color: finalColor,
        metalness: 0.0,
        roughness: isHighBloom ? 0.05 : 0.0, // Slight roughness if high bloom to stabilize
        transparent: true,
        opacity: opacity,
        reflectivity: 1.0, 
        
        // Increased sparkle through envMapIntensity
        envMap: envMapValue,
        envMapIntensity: sparkle * (isHighBloom ? 2.0 : 4.0)* (facets / 48),
        
        // MeshPhysicalMaterial properties
        ior: 2.417, 
        specularIntensity: 2.0, 
        
        // Add iridescence if enabled
        iridescence: currentConfig.gemIridescence ? 1.0 : 0.0, 
        iridescenceIOR: 1.6,
        // Increased iridescence thickness range for more visible rainbow effects
        iridescenceThicknessRange: [500, 15000] // Max thickness increased
    };

    return new THREE.MeshPhysicalMaterial(materialProps);
}
// Gem preset colors
function getGemPresetColor(type) {
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

    return presets[type] || '#0044bb';
}

// Export for use in other modules
export default { getMaterial, getGemMaterial };
