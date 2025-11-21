// export-utils.js - Export Functions
import { THREE, renderer, camera, scene, pendantGroup, currentConfig, showStatus } from './core.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

function preExportLocketCheck() {
    let wasLocketOpen = false;
    if (currentConfig.shape === 'locket' && currentConfig.locketOpenAngle > 0) {
        if (window.setLocketAngleImmediate) { 
            // Save the current open angle, then close it immediately for export
            const originalAngle = currentConfig.locketOpenAngle;
            currentConfig.locketOpenAngle = 0;
            window.setLocketAngleImmediate(0); 
            wasLocketOpen = true; 
            return originalAngle; // Return the original angle to restore later
     }
    }
    return null; // Null if no change was made
}

function postExportLocketRestore(originalAngle) {
    if (originalAngle !== null) {
        currentConfig.locketOpenAngle = originalAngle; // Restore config
        if (window.setLocketAngleImmediate) {
            window.setLocketAngleImmediate(originalAngle); // Restore visual angle
        }
    }
}
// Export as STL
window.exportSTL = function() {
    // CRITICAL FIX: The preExportLocketCheck returns the originalAngle, which we must store.
    const originalAngle = preExportLocketCheck(); 
    try {
        const exporter = new STLExporter();
        const stlString = exporter.parse(pendantGroup);
        const blob = new Blob([stlString], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pendant_design_${Date.now()}.stl`;
        link.click();
        URL.revokeObjectURL(link.href);
        showStatus('✨ STL file exported! Ready for 3D printing!', 'success');
    } catch (error) {
        console.error('STL Export Error:', error);
        showStatus('⚠️ Error exporting STL file', 'error');
    } finally {
        // FIX: Use the local variable storing the original angle
        postExportLocketRestore(originalAngle); 
    }
};


// Export as OBJ
window.exportOBJ = function() {
    // CRITICAL FIX: The preExportLocketCheck returns the originalAngle, which we must store.
    const originalAngle = preExportLocketCheck(); 
    try {
        const exporter = new OBJExporter();
        const objString = exporter.parse(pendantGroup);
        const blob = new Blob([objString], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pendant_design_${Date.now()}.obj`;
        link.click();
        URL.revokeObjectURL(link.href);
        showStatus('📦 OBJ file exported successfully!', 'success');
    } catch (error) {
        console.error('OBJ Export Error:', error);
        showStatus('⚠️ Error exporting OBJ file', 'error');
    } finally {
        // FIX: Use the local variable storing the original angle
        postExportLocketRestore(originalAngle);
    }
};

// Export as GLTF
// Export as GLTF
window.exportGLTF = function() {
    // CRITICAL FIX: The preExportLocketCheck returns the originalAngle, which we must store.
    const originalAngle = preExportLocketCheck(); 
    try {
        const exporter = new GLTFExporter();
        exporter.parse(
            pendantGroup,
            function(result) {
                const output = JSON.stringify(result, null, 2);
                const blob = new Blob([output], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `pendant_design_${Date.now()}.gltf`;
                link.click();
                URL.revokeObjectURL(link.href);
                showStatus('🎯 GLTF file exported successfully!', 'success');
            
                // FIX: Restoration MUST happen inside the callback on success
                postExportLocketRestore(originalAngle); 
            },
            function(error) {
                console.error('GLTF Export Error:', error);
                showStatus('⚠️ Error exporting GLTF file', 'error');
                // FIX: Restoration MUST happen inside the callback on failure
                postExportLocketRestore(originalAngle);
            },
            { binary: false }
        );
    } catch (error) {
        console.error('GLTF Export Error:', error);
        showStatus('⚠️ Error exporting GLTF file', 'error');
        // This catch block handles synchronous errors before parse starts
        postExportLocketRestore(originalAngle);
    }
};

// Export as PNG
window.exportPNG = function() {
    try {
        const originalSize = renderer.getSize(new THREE.Vector2());
        renderer.setSize(3840, 2160); // 4K resolution
        renderer.render(scene, camera);
        const dataURL = renderer.domElement.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `pendant_preview_4K_${Date.now()}.png`;
        link.click();
        renderer.setSize(originalSize.x, originalSize.y);
        showStatus('📸 High-resolution 4K PNG image exported!', 'success');
    } catch (error) {
        console.error('PNG Export Error:', error);
        showStatus('⚠️ Error exporting PNG image', 'error');
    }
};

// Export specifications as JSON
window.exportJSON = function() {
    try {
        const designData = {
            name: 'Custom Pendant Design',
            created: new Date().toLocaleString(),
            timestamp: new Date().toISOString(),
            version: '2.0 Pro',
            configuration: currentConfig,
            specifications: {
                dimensions: {
                    width: currentConfig.width + 'mm',
                    height: currentConfig.height + 'mm',
                    thickness: currentConfig.thickness + 'mm',
                    bevelSize: currentConfig.bevelSize + 'mm',
                    wingSpan: currentConfig.hasWings ? 
                        (currentConfig.width * currentConfig.wingSize * 2.5) + 'mm' : 'N/A'
                },
                material: {
                    type: currentConfig.useLayeredColor ? 'Custom Layered' : currentConfig.material,
                    finish: currentConfig.glossiness + '% glossy',
                    metallic: currentConfig.metallic + '%',
                    reflectivity: currentConfig.reflectivity + 'x',
                    colors: currentConfig.useLayeredColor ? {
                        base: currentConfig.colorBase,
                        layer1: currentConfig.colorLayer1,
                        layer2: currentConfig.colorLayer2
                    } : null
                },
                shape: currentConfig.shape,
                features: {
                    wings: currentConfig.hasWings ? {
                        style: currentConfig.wingStyle,
                        surface: currentConfig.wingSurface,
                        size: currentConfig.wingSize + 'x',
                        angle: currentConfig.wingAngle + '°'
                    } : 'None',
                    gemstone: currentConfig.hasGem ? {
                        shape: currentConfig.gemShape,
                        type: currentConfig.gemType,
                        color: currentConfig.gemColor,
                        size: currentConfig.gemSize + 'mm',
                        depth: currentConfig.gemDepth + 'mm',
                        facets: currentConfig.gemFacets,
                        sparkle: currentConfig.gemSparkle + 'x',
                        opacity: currentConfig.gemOpacity + '%',
                        iridescence: currentConfig.gemIridescence
                    } : 'None',
                    border: currentConfig.hasBorder ? {
                        style: currentConfig.borderStyle,
                        width: currentConfig.borderWidth + 'mm',
                        gems: currentConfig.borderGems
                    } : 'None',
                    bail: currentConfig.hasBail ? {
                        style: currentConfig.bailStyle,
                        size: currentConfig.bailSize + 'mm'
                    } : 'None',
                    engraving: currentConfig.hasEngraving ? {
                        text: currentConfig.engravingText,
                        fontSize: currentConfig.fontSize + 'pt',
                        fontStyle: currentConfig.fontStyle,
                        depth: currentConfig.engraveDepth + 'mm'
                    } : 'None',
                    overlay: currentConfig.hasOverlay ? {
                        type: currentConfig.overlayType,
                        size: currentConfig.overlaySize + 'x'
                    } : 'None',
                    chain: currentConfig.hasChain ? {
                        style: currentConfig.chainStyle,
                        length: currentConfig.chainLength + 'cm',
                        thickness: currentConfig.chainLinkThickness + 'mm'
                    } : 'None'
                },
                lighting: {
                    ambient: currentConfig.ambientLightIntensity,
                    directional: currentConfig.directLightIntensity,
                    environment: currentConfig.envIntensity,
                    shadows: currentConfig.shadowIntensity + '%',
                    bloom: currentConfig.bloomEffect
                },
                notes: 'Professional 3D model ready for manufacturing. All measurements in millimeters. Created with Pendant Designer 3D Pro.'
            }
        };

        const jsonString = JSON.stringify(designData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pendant_specifications_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        showStatus('📄 Complete design specifications downloaded!', 'success');
    } catch (error) {
        console.error('JSON Export Error:', error);
        showStatus('⚠️ Error exporting specifications', 'error');
    }
};

// Save design to localStorage
window.saveDesign = function() {
    try {
        const designName = `Pendant_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
        const designData = {
            name: designName,
            config: currentConfig,
            savedAt: new Date().toISOString()
        };

        localStorage.setItem('latestPendantDesign', JSON.stringify(designData));
        showStatus('💾 Design saved successfully!', 'success');
    } catch (error) {
        console.error('Save Error:', error);
        showStatus('⚠️ Error saving design', 'error');
    }
};

// Load design from localStorage
window.loadDesign = function() {
    try {
        const savedDesign = localStorage.getItem('latestPendantDesign');
        if (savedDesign) {
            const designData = JSON.parse(savedDesign);
            Object.assign(currentConfig, designData.config);

            // Sync UI
            if (window.syncUIWithConfig) {
                window.syncUIWithConfig();
            }

            // Recreate pendant
            import('./geometry.js').then(module => {
                module.createPendant();
                showStatus('📂 Design loaded successfully!', 'success');
            });
        } else {
            showStatus('⚠️ No saved design found', 'warning');
        }
    } catch (error) {
        console.error('Load Error:', error);
        showStatus('⚠️ Error loading design', 'error');
    }
};
