// geometry.js - Geometry Creation Functions
import { THREE, scene, pendantGroup, currentConfig } from './core.js';
import { getMaterial, getGemMaterial } from './materials.js';

// Create complete pendant
// geometry.js - REPLACEMENT for createPendant function (lines 12-58)
export function createPendant() {
    // DISPOSE existing meshes and materials
    while (pendantGroup.children.length > 0) {
        const child = pendantGroup.children[0];
        // Dispose geometry
        if (child.geometry) child.geometry.dispose();
        
        // Dispose material(s)
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
            } else {
                child.material.dispose();
            }
        }
        // If the child is a Group, recursively dispose of its children (optional but safer)
        if (child.isGroup) {
            child.children.forEach(subChild => {
                 if (subChild.geometry) subChild.geometry.dispose();
                 if (subChild.material) {
                     if (Array.isArray(subChild.material)) {
                         subChild.material.forEach(mat => mat.dispose());
                     } else {
                         subChild.material.dispose();
                     }
                 }
            });
        }
        pendantGroup.remove(child);
    }
    
    // CRITICAL: Set the Z-Offset here before base shape creation, 
    // as it is needed to calculate subsequent positions relative to the base.
    // The Z-Offset is half the thickness.
    pendantGroup.userData.featureZOffset = currentConfig.thickness / 10 / 2;

    let isLocket = currentConfig.shape === 'locket';
    let isCrystalBase = currentConfig.addCrystals && (currentConfig.shape === 'heart' || currentConfig.shape === 'teardrop' || currentConfig.shape === 'oval');
    
    // 1. Create Base Shape / Locket
    if (isLocket) {
        // Locket is a special group that handles its own structure
        const locketGroup = createLocket(); 
        if (locketGroup) pendantGroup.add(locketGroup);
     } else {
         // Create the base shape (either metal or faceted crystal)
         const base = createBaseShape(isCrystalBase); 
         if (base) pendantGroup.add(base);
    }
    
    // 2. Add features (Order is important for layering)

    // Add wings
    if (currentConfig.hasWings) {
        const wingsGroup = createWings();
        if (wingsGroup) pendantGroup.add(wingsGroup);
    }
    
    // Add border
    if (currentConfig.hasBorder) {
        const borderElem = createBorder();
        if (borderElem) pendantGroup.add(borderElem);
    }

    // Add bail
    if (currentConfig.hasBail) {
        const bailElem = createBail();
        if (bailElem) pendantGroup.add(bailElem);
    }

    // Add overlay
    if (currentConfig.hasOverlay) {
        const overlayElem = createOverlay();
        if (overlayElem) pendantGroup.add(overlayElem);
    }

    // Add main gemstone ONLY IF it's requested AND the base is NOT already a crystal.
    if (currentConfig.hasGem && !isCrystalBase) { 
        const gemstone = createGemstone();
        if (gemstone) pendantGroup.add(gemstone);
    }

    // Add engraving
    if (currentConfig.hasEngraving) {
        const engravingElem = createEngraving();
        if (engravingElem) pendantGroup.add(engravingElem);
    }

    // Add chain
    if (currentConfig.hasChain) {
        const chainElem = createChain();
        if (chainElem) pendantGroup.add(chainElem);
    }
    // Add Reference Object
    const reference = createReferenceObject();
    if (reference) pendantGroup.add(reference);
}


// geometry.js - REPLACEMENT for createBaseShape function (lines 125-234)
// Create base shape
export function createBaseShape(isCrystalBase) {
    const material = getMaterial(false, 0);
    let geometry;
    const width = currentConfig.width / 10;
    const height = currentConfig.height / 10;
    const depth = currentConfig.thickness / 10;
    const bevel = currentConfig.bevelSize;
     
    if (isCrystalBase && (currentConfig.shape === 'heart' || currentConfig.shape === 'teardrop' || currentConfig.shape === 'oval')) {
        // Use a specialized faceted mesh for the core shape
        const facetedMesh = createFacetedBaseGem(currentConfig.shape, width, height, depth);
        
        if (facetedMesh) {
            // CRITICAL FIX: We rely solely on getGemMaterial() for properties.
            return facetedMesh;
        }
    }
    
    const extrudeSettings = {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5
    };

    switch (currentConfig.shape) {
        case 'circle':
            geometry = new THREE.CylinderGeometry(width / 2, width / 2, depth, 64);
            geometry.rotateX(Math.PI / 2); 
            break;

        case 'oval':
            const ovalShape = new THREE.Shape();
            ovalShape.absellipse(0, 0, width / 2, height / 2, 0, 2 * Math.PI, false);
            geometry = new THREE.ExtrudeGeometry(ovalShape, extrudeSettings);
            break;

        case 'heart':
            geometry = createHeartGeometry(width, height, depth, bevel);
            break;

        case 'teardrop':
            geometry = createTeardropGeometry(width, height, depth, bevel);
            break;

        case 'square':
            const squareShape = new THREE.Shape();
            squareShape.moveTo(-width/2, -height/2);
            squareShape.lineTo(width/2, -height/2);
            squareShape.lineTo(width/2, height/2);
            squareShape.lineTo(-width/2, height/2);
            squareShape.lineTo(-width/2, -height/2);
            geometry = new THREE.ExtrudeGeometry(squareShape, extrudeSettings);
            break;

        case 'hexagon':
            geometry = new THREE.CylinderGeometry(width / 2, width / 2, depth, 6);
            geometry.rotateX(Math.PI / 2); 
            break;

        case 'octagon':
            geometry = new THREE.CylinderGeometry(width / 2, width / 2, depth, 8);
            geometry.rotateX(Math.PI / 2); 
            break;

        case 'rhombus':
            geometry = createRhombusGeometry(width, height, depth, bevel);
            break;

        case 'star':
            geometry = createStarGeometry(width, height, depth, bevel);
            break;

        case 'cross':
            geometry = createCrossGeometry(width, height, depth, bevel);
            break;

        case 'shield':
            geometry = createShieldGeometry(width, height, depth, bevel);
            break;

        case 'infinity':
            geometry = createInfinityGeometry(width, height, depth, bevel);
            break;

        case 'locket': 
            return null;
        
        default:
            geometry = new THREE.CylinderGeometry(width / 2, width / 2, depth, 32);
            geometry.rotateX(Math.PI / 2);
    }

    // Position extruded geometry (centered at its extrusion midpoint)
    if (geometry.isBufferGeometry) {
         geometry.translate(0, 0, depth / 2);
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}


// Heart geometry
function createHeartGeometry(width, height, depth, bevel) {
    const shape = new THREE.Shape();
    const scale = Math.min(width, height) / 2;

    shape.moveTo(0, 0);
    shape.bezierCurveTo(0, -0.3 * scale, -0.5 * scale, -0.7 * scale, -0.5 * scale, -1.0 * scale);
    shape.bezierCurveTo(-0.5 * scale, -1.5 * scale, 0, -1.8 * scale, 0, -2.2 * scale);
    shape.bezierCurveTo(0, -1.8 * scale, 0.5 * scale, -1.5 * scale, 0.5 * scale, -1.0 * scale);
    shape.bezierCurveTo(0.5 * scale, -0.7 * scale, 0, -0.3 * scale, 0, 0);

    return new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5
    });
}

// Teardrop geometry
function createTeardropGeometry(width, height, depth, bevel) {
    const shape = new THREE.Shape();
    const radius = width / 2;

    shape.moveTo(0, -height / 2);
    shape.quadraticCurveTo(radius, -height / 4, radius, height / 4);
    shape.quadraticCurveTo(radius, height / 2, 0, height / 2);
    shape.quadraticCurveTo(-radius, height / 2, -radius, height / 4);
    shape.quadraticCurveTo(-radius, -height / 4, 0, -height / 2);

    return new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5
    });
}

// Rhombus geometry
function createRhombusGeometry(width, height, depth, bevel) {
    const shape = new THREE.Shape();
    shape.moveTo(0, height / 2);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, -height / 2);
    shape.lineTo(-width / 2, 0);
    shape.lineTo(0, height / 2);

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5
    });
    geometry.center();
    return geometry;
}

// Star geometry
function createStarGeometry(width, height, depth, bevel) {
    const shape = new THREE.Shape();
    const outerRadius = Math.min(width, height) / 2;
    const innerRadius = outerRadius * 0.4;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / points) * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
            shape.moveTo(x, y);
        } else {
            shape.lineTo(x, y);
        }
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5
    });
    geometry.center();
    geometry.rotateZ(Math.PI / 2);
    return geometry;
}

// Cross geometry
function createCrossGeometry(width, height, depth, bevel) {
    const shape = new THREE.Shape();
    const armWidth = width * 0.3;
    const armHeight = height * 0.3;

    // Vertical bar
    shape.moveTo(-armWidth/2, -height/2);
    shape.lineTo(armWidth/2, -height/2);
    shape.lineTo(armWidth/2, -armHeight/2);
    shape.lineTo(width/2, -armHeight/2);
    shape.lineTo(width/2, armHeight/2);
    shape.lineTo(armWidth/2, armHeight/2);
    shape.lineTo(armWidth/2, height/2);
    shape.lineTo(-armWidth/2, height/2);
    shape.lineTo(-armWidth/2, armHeight/2);
    shape.lineTo(-width/2, armHeight/2);
    shape.lineTo(-width/2, -armHeight/2);
    shape.lineTo(-armWidth/2, -armHeight/2);
    shape.lineTo(-armWidth/2, -height/2);

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 3
    });
    geometry.center();
    return geometry;
}

// Shield geometry
function createShieldGeometry(width, height, depth, bevel) {
    const shape = new THREE.Shape();

    shape.moveTo(0, height/2);
    shape.lineTo(width/2, height/3);
    shape.lineTo(width/2, -height/4);
    shape.quadraticCurveTo(width/2, -height/2, 0, -height/2);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2, -height/4);
    shape.lineTo(-width/2, height/3);
    shape.lineTo(0, height/2);

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5
    });
    geometry.center();
    return geometry;
}

// Infinity geometry
function createInfinityGeometry(width, height, depth, bevel) {
    const curve = new THREE.CurvePath();
    const scale = width / 4;

    // Left loop
    const leftCurve = new THREE.EllipseCurve(
        -scale, 0,
        scale, scale * 0.6,
        0, 2 * Math.PI,
        false,
        0
    );

    // Right loop
    const rightCurve = new THREE.EllipseCurve(
        scale, 0,
        scale, scale * 0.6,
        0, 2 * Math.PI,
        false,
        0
    );

    const points = leftCurve.getPoints(50).concat(rightCurve.getPoints(50));
    const shape = new THREE.Shape(points);

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5
    });
    geometry.center();
    return geometry;
}

// geometry.js - CORRECTED Locket Base Shape Function

// Locket base shape (used for both sides)
function createLocketBaseShape(width, height, depth, bevel) {
    const shape = new THREE.Shape();
    // Simple rectangular shape for the locket body
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const cornerRadius = 0.5; // Matches the cornerRadius defined in the original logic

    // Start point: Top-left corner, moved inward by radius
    shape.moveTo(-halfWidth + cornerRadius, halfHeight);

    // 1. Top Edge (straight segment)
    shape.lineTo(halfWidth - cornerRadius, halfHeight);

    // 2. Top-Right Corner (arc)
    // absarc(x, y, radius, startAngle, endAngle, clockwise)
    shape.absarc(
        halfWidth - cornerRadius, // Center X
        halfHeight - cornerRadius, // Center Y
        cornerRadius,
        0, // Start Angle (0 rad = right)
        -Math.PI / 2, // End Angle (-90 deg = down)
        true // Clockwise
    );

    // 3. Right Edge (straight segment)
    shape.lineTo(halfWidth, -halfHeight + cornerRadius);

    // 4. Bottom-Right Corner (arc)
    shape.absarc(
        halfWidth - cornerRadius, // Center X
        -halfHeight + cornerRadius, // Center Y
        cornerRadius,
        -Math.PI / 2, // Start Angle (-90 deg = down)
        -Math.PI, // End Angle (-180 deg = left)
        true // Clockwise
    );

    // 5. Bottom Edge (straight segment)
    shape.lineTo(-halfWidth + cornerRadius, -halfHeight);

    // 6. Bottom-Left Corner (arc)
    shape.absarc(
        -halfWidth + cornerRadius, // Center X
        -halfHeight + cornerRadius, // Center Y
        cornerRadius,
        -Math.PI, // Start Angle (-180 deg = left)
        -3 * Math.PI / 2, // End Angle (-270 deg = up)
        true // Clockwise
    );

    // 7. Left Edge (straight segment)
    shape.lineTo(-halfWidth, halfHeight - cornerRadius);

    // 8. Top-Left Corner (arc)
    shape.absarc(
        -halfWidth + cornerRadius, // Center X
        halfHeight - cornerRadius, // Center Y
        cornerRadius,
        -3 * Math.PI / 2, // Start Angle (-270 deg = up)
        -2 * Math.PI, // End Angle (-360 deg = right, same as 0)
        true // Clockwise
    );

    // This is a correction to ensure the geometry creation does not fail.
    return new THREE.ExtrudeGeometry(shape, {
        depth: depth, 
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 3
    });
}

// geometry.js - CORRECTION BLOCK for createFacetedBaseGem
function createFacetedBaseGem(shape, width, height, depth) {
    let geometry;
    // Base Icosahedron with HIGH detail (higher segments = more facets/brilliance)
    const baseIcosaRadius = 0.5; 
    const baseIcosa = new THREE.IcosahedronGeometry(baseIcosaRadius, 4); // Segment increased to 4 for finer faceting

    switch(shape) {
        case 'heart':
            // Scale and stretch significantly to give it volume and heart shape
            geometry = baseIcosa.clone().scale(width * 0.9, height * 0.9, depth * 1.5); // 1.5x depth for volume
            
            // Align heart point down in the local coordinate system
            geometry.rotateZ(Math.PI); // Rotate 180 degrees (was -PI/2, now PI is safer for symmetry)
            geometry.translate(0, -height * 0.1, 0); // Slight vertical shift down
            
            // Simple manual deformation for the top cleft (More pronounced now)
            const positions = geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                let x = positions[i];
                let y = positions[i + 1];
                let z = positions[i + 2];
                
                // Push in the top center to create the cleft
                if (y > height * 0.35) { // If it's the top region
                    positions[i + 2] += -depth * 0.2; // Push Z in
                }
            }
            geometry.attributes.position.needsUpdate = true;
            break;
            
        case 'teardrop':
        // ... (existing logic for teardrop/oval remains, but will inherit segment=4 from baseIcosa)
        case 'oval':
        default:
             geometry = baseIcosa.clone().scale(width / 2, height / 2, depth / 2);
             geometry.scale(1, 1.5, 1);
             break;
    }
    
    // Translate to center for proper alignment
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -center.z); 

    // Mesh creation is unchanged, relies on getGemMaterial() for color
    const mesh = new THREE.Mesh(geometry, getGemMaterial());
    return mesh;
}

// Function to create an image plane inside the locket
function createImagePlane(url, width, height, thickness, materialLayer) {
    if (!url) return null;

    const texture = new THREE.TextureLoader().load(url, (tex) => {
        tex.needsUpdate = true;
    });

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide
    });

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        material
    );
    // Align with the Z-Y plane
    plane.rotation.x = Math.PI / 2; 
    
    // FIX: Simplified Z position. This photo will be parented, so we want it near the surface.
    // thickness is lid thickness. We want the photo plane to be thin.
    plane.position.z = 0.01; 

    const imageGroup = new THREE.Group();
    imageGroup.add(plane);

    // Add a metal frame/border (Unchanged, for context)
    const frameWidth = 0.05;
    const frameMaterial = getMaterial(true, materialLayer);
    
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(width + frameWidth * 2, frameWidth, 0.01), frameMaterial);
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, height + frameWidth * 2, 0.01), frameMaterial);
    // Frame (Top/Bottom)
    hBar.position.y = (height / 2 + frameWidth / 2);
    vBar.position.x = (width / 2 + frameWidth / 2);
    const hBar2 = hBar.clone();
    hBar2.position.y = -(height / 2 + frameWidth / 2);
    const vBar2 = vBar.clone();
    vBar2.position.x = -(width / 2 + frameWidth / 2);

    const frameGroup = new THREE.Group();
    frameGroup.add(hBar, hBar2, vBar, vBar2);
    frameGroup.rotation.x = Math.PI / 2; // Match the plane rotation
    frameGroup.position.z = 0.01; // Match the plane's corrected Z position

    imageGroup.add(frameGroup);

    return imageGroup;
}



// geometry.js - CORRECTED createLocket function (STRUCTURAL INTEGRITY FIX)

export function createLocket() {
    const locketGroup = new THREE.Group();
    const material = getMaterial(false, 0); // Base material for the body
    const width = currentConfig.width / 10;
    const height = currentConfig.height / 10;
    const thickness = currentConfig.thickness / 10;
    const bevel = currentConfig.bevelSize;
    
    const lidThickness = thickness / 2; 
    
    // Define the base shape geometry once
    const lidGeometry = createLocketBaseShape(width, height, lidThickness, bevel);

    // --- 1. Back Plate ---
    const backPlateMesh = new THREE.Mesh(lidGeometry, material);
    // Position the back plate so its inner face is at Z=0
    backPlateMesh.position.z = -lidThickness; 
    backPlateMesh.castShadow = true;
    locketGroup.add(backPlateMesh);

    // Back interior photo (Sits on the inner face of the back plate, facing Z=0)
    const backPhoto = createImagePlane(
        currentConfig.locketImageBack, 
        width * 0.8, height * 0.8, 
        lidThickness, 
        1
    );
    if (backPhoto) {
        // Photo sits on the inner face (Z=0)
        backPhoto.position.z = 0; 
        backPhoto.rotation.x = Math.PI / 2; // FIX: Ensure plane is aligned correctly
        backPlateMesh.add(backPhoto); 
    }

    // --- 2. Right Lid (Pivoting part) ---
    const rightLidMesh = new THREE.Mesh(lidGeometry, material.clone());
    rightLidMesh.castShadow = true;
    rightLidMesh.receiveShadow = true;
    
    const rightPhoto = createImagePlane(
        currentConfig.locketImageRight, 
        width * 0.8, height * 0.8, 
        lidThickness, 
        2
    );
    if (rightPhoto) {
        // Photo sits on the inner face (Z=0) and faces inwards (rotated 180 on Y)
        rightPhoto.position.z = 0; 
        rightPhoto.rotation.x = Math.PI / 2;
        rightPhoto.rotation.y = Math.PI; // Flip image to face inwards
        rightLidMesh.add(rightPhoto);
    }
    
    // Hinge setup: Pivot at the *center* of the group
    const rightLidPivot = new THREE.Group();
    rightLidPivot.position.x = width / 2; 
    rightLidPivot.add(rightLidMesh);
    // Reposition the mesh so it sits on the hinge when closed
    rightLidMesh.position.x = -width / 2; 
    locketGroup.add(rightLidPivot);
    

    // --- 3. Left Lid (Pivoting part) ---
    const leftLidMesh = new THREE.Mesh(lidGeometry, material.clone());
    leftLidMesh.castShadow = true;
    leftLidMesh.receiveShadow = true;

    const leftPhoto = createImagePlane(
        currentConfig.locketImageLeft, 
        width * 0.8, height * 0.8, 
        lidThickness, 
        2
    );
    if (leftPhoto) {
        leftPhoto.position.z = 0; 
        leftPhoto.rotation.x = Math.PI / 2;
        leftPhoto.rotation.y = Math.PI; // Flip image to face inwards
        leftLidMesh.add(leftPhoto);
    }
    
    // Hinge setup: Pivot at the *center* of the group
    const leftLidPivot = new THREE.Group();
    leftLidPivot.position.x = -width / 2; 
    leftLidPivot.add(leftLidMesh);
    // Reposition the mesh so it sits on the hinge when closed
    leftLidMesh.position.x = width / 2; 
    locketGroup.add(leftLidPivot);


    // 4. Apply locket open/close state
    locketGroup.userData.leftLidPivot = leftLidPivot;
    locketGroup.userData.rightLidPivot = rightLidPivot;

    // Use setLocketAngleImmediate from core.js to ensure immediate sync on create
    if (!window.isAnimatingLocket) {
         window.setLocketAngleImmediate(currentConfig.locketOpenAngle);
    } else {
        // If animation is running, the animate loop will handle the rotation
        // But we need to set the initial pivot state for the start of the animation
        import('./core.js').then(module => {
            const startAngle = currentConfig.locketOpenAngle === 0 ? 180 : 0;
            module.setLocketAngleImmediate(startAngle);
        });
    }
    
    // Final Z-shift of the whole group to ensure the closed front face is at Z=0
    locketGroup.position.z = 0; 

    return locketGroup;
}

// Create wings
export function createWings() {
    const wingGroup = new THREE.Group();
    const material = getMaterial(true, 1);
    const wingWidth = currentConfig.width / 10 * currentConfig.wingSize;
    const wingHeight = currentConfig.height / 10 * currentConfig.wingSize;
    const offsetX = currentConfig.wingOffsetX / 10;
    const offsetY = currentConfig.wingOffsetY / 10;
    const depth = currentConfig.thickness / 15;

    const createWing = (side) => {
        let wingElement;

        // Choose wing surface type
        if (currentConfig.wingSurface === 'pave-diamonds') {
            wingElement = createPaveWing(wingWidth, wingHeight, depth);
        } else {
            let geometry;
            switch (currentConfig.wingSurface) {
                case 'feathered':
                    geometry = createFeatheredWing(wingWidth, wingHeight, depth);
                    break;
                case 'ornate':
                    geometry = createOrnateWing(wingWidth, wingHeight, depth);
                    break;
                case 'geometric':
                    geometry = createGeometricWing(wingWidth, wingHeight, depth);
                    break;
                case 'textured':
                    geometry = createTexturedWing(wingWidth, wingHeight, depth);
                    break;
                case 'crystal':
                    geometry = createCrystalWing(wingWidth, wingHeight, depth);
                    break;
                default:
                    geometry = createSmoothWing(wingWidth, wingHeight, depth);
            }

            wingElement = new THREE.Mesh(geometry, material);
            wingElement.castShadow = true;
            wingElement.receiveShadow = true;
        }

        // Position wing
        const xPos = side === 'left' ? 
            -(currentConfig.width / 10) / 2 - wingWidth / 3 + offsetX :
            (currentConfig.width / 10) / 2 + wingWidth / 3 + offsetX;

        wingElement.position.set(xPos, offsetY, 0);

        // Rotation based on wing angle
        const angleRad = (currentConfig.wingAngle * Math.PI) / 180;
        if (side === 'left') {
            wingElement.rotation.z = angleRad;
            wingElement.scale.x = -1;
        } else {
            wingElement.rotation.z = -angleRad;
        }

        return wingElement;
    };

    // Add wings based on style
    if (currentConfig.wingStyle.includes('single-left') || 
        currentConfig.wingStyle.includes('dual') ||
        currentConfig.wingStyle.includes('angel') ||
        currentConfig.wingStyle.includes('bird') ||
        currentConfig.wingStyle.includes('butterfly') ||
        currentConfig.wingStyle.includes('dragon') ||
        currentConfig.wingStyle === 'ornate') {
        if (!currentConfig.wingStyle.includes('single-right')) {
            wingGroup.add(createWing('left'));
        }
    }

    if (currentConfig.wingStyle.includes('single-right') || 
        currentConfig.wingStyle.includes('dual') ||
        currentConfig.wingStyle.includes('angel') ||
        currentConfig.wingStyle.includes('bird') ||
        currentConfig.wingStyle.includes('butterfly') ||
        currentConfig.wingStyle.includes('dragon') ||
        currentConfig.wingStyle === 'ornate') {
        if (!currentConfig.wingStyle.includes('single-left')) {
            wingGroup.add(createWing('right'));
        }
    }

    return wingGroup;
}

// Smooth wing
function createSmoothWing(width, height, depth) {
    const shape = new THREE.Shape();

    // Adapt based on wing style
    if (currentConfig.wingStyle === 'angel' || currentConfig.wingStyle === 'butterfly') {
        shape.moveTo(0, 0);
        shape.bezierCurveTo(width * 0.2, height * 0.6, width * 0.5, height * 0.5, width * 0.9, height * 0.4);
        shape.bezierCurveTo(width, height * 0.3, width * 0.95, height * 0.1, width * 0.8, -height * 0.05);
        shape.bezierCurveTo(width * 0.5, -height * 0.15, width * 0.2, -height * 0.1, 0, 0);
    } else if (currentConfig.wingStyle === 'bird' || currentConfig.wingStyle === 'dragon') {
        shape.moveTo(0, 0);
        shape.lineTo(width * 0.6, height * 0.5);
        shape.lineTo(width, height * 0.2);
        shape.lineTo(width * 0.9, 0);
        shape.lineTo(width * 0.7, -height * 0.15);
        shape.lineTo(width * 0.4, -height * 0.1);
        shape.lineTo(0, 0);
    } else {
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(width * 0.3, height * 0.5, width, height * 0.3);
        shape.quadraticCurveTo(width * 0.8, height * 0.1, width * 0.6, -height * 0.1);
        shape.quadraticCurveTo(width * 0.3, -height * 0.2, 0, 0);
    }

    return new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 3
    });
}

// Feathered wing
function createFeatheredWing(width, height, depth) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);

    // Create feather-like edges
    for (let i = 0; i < 7; i++) {
        const x = width * (i + 1) / 7;
        const y = height * 0.4 * Math.sin(i * 0.6) + height * 0.1;
        shape.lineTo(x, y);
    }

    shape.lineTo(width * 0.8, -height * 0.2);
    shape.quadraticCurveTo(width * 0.3, -height * 0.15, 0, 0);

    return new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 3
    });
}

// Ornate wing
function createOrnateWing(width, height, depth) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(width * 0.2, height * 0.6, width * 0.5, height * 0.5, width, height * 0.4);
    shape.bezierCurveTo(width * 0.9, height * 0.2, width * 0.7, 0, width * 0.6, -height * 0.1);
    shape.bezierCurveTo(width * 0.4, -height * 0.2, width * 0.2, -height * 0.1, 0, 0);

    return new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 4
    });
}

// Geometric wing
function createGeometricWing(width, height, depth) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(width * 0.5, height * 0.4);
    shape.lineTo(width, height * 0.2);
    shape.lineTo(width * 0.8, 0);
    shape.lineTo(width * 0.6, -height * 0.2);
    shape.lineTo(0, 0);

    return new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2
    });
}

// Textured wing
function createTexturedWing(width, height, depth) {
    return createSmoothWing(width, height, depth * 1.2);
}

// Crystal wing
function createCrystalWing(width, height, depth) {
    return createGeometricWing(width, height, depth * 1.3);
}

// Pavé wing with diamonds
function createPaveWing(width, height, depth) {
    const wingContainer = new THREE.Group();

    // Base wing mesh
    const baseGeometry = createSmoothWing(width, height, depth);
    const baseMaterial = getMaterial(true, 1);
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    wingContainer.add(baseMesh);

    // Add central heart gem if shape is heart
    if (currentConfig.shape === 'heart') {
        const heartGem = createFacetedHeartGem(
            currentConfig.width / 10, 
            currentConfig.height / 10, 
            currentConfig.thickness / 10 * 0.9
        );
        wingContainer.add(heartGem);
    }

    // Add small diamonds
    const diamondGeometry = new THREE.IcosahedronGeometry(0.08, 1);
    const diamondMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.0,
        transparent: true,
        opacity: 0.9,
        reflectivity: 1,
        clearcoat: 1,
        envMap: scene.environment,
        envMapIntensity: 3.0
    });

    // Place diamonds on wing surface
    const diamondCount = 40;
    for (let i = 0; i < diamondCount; i++) {
        const x = (Math.random() - 0.2) * width * 0.9;
        const y = (Math.random() - 0.5) * height * 0.8;
        const diamond = new THREE.Mesh(diamondGeometry, diamondMaterial);
        diamond.position.set(x, y, depth / 2 + 0.1);
        diamond.castShadow = true;
        wingContainer.add(diamond);
    }

    return wingContainer;
}

// Faceted heart gem for pavé designs
function createFacetedHeartGem(width, height, depth) {
    const heartShape = new THREE.Shape();
    const scale = Math.min(width, height) / 2;

    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, -0.3 * scale, -0.5 * scale, -0.7 * scale, -0.5 * scale, -1.0 * scale);
    heartShape.bezierCurveTo(-0.5 * scale, -1.5 * scale, 0, -1.8 * scale, 0, -2.2 * scale);
    heartShape.bezierCurveTo(0, -1.8 * scale, 0.5 * scale, -1.5 * scale, 0.5 * scale, -1.0 * scale);
    heartShape.bezierCurveTo(0.5 * scale, -0.7 * scale, 0, -0.3 * scale, 0, 0);

    const geometry = new THREE.ExtrudeGeometry(heartShape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.15,
        bevelSegments: 8
    });
    geometry.center();

    const gemMaterial = getGemMaterial();
    const mesh = new THREE.Mesh(geometry, gemMaterial);
    mesh.castShadow = true;
    mesh.position.z = depth / 2;

    return mesh;
}

// Gemstone creation
export function createGemstone() {
    let geometry;
    const size = currentConfig.gemSize / 10;
    const depth = currentConfig.gemDepth / 10;

    switch (currentConfig.gemShape) {
        case 'round':
            geometry = new THREE.IcosahedronGeometry(size, 2);
            break;
        case 'heart':
            geometry = createHeartGeometry(size * 2, size * 2, depth, 0.05);
            break;
        case 'oval':
            geometry = new THREE.SphereGeometry(size, 32, 16);
            geometry.scale(1, 1.5, 1);
            break;
        case 'cushion':
            geometry = new THREE.BoxGeometry(size * 1.5, size * 1.5, depth);
            geometry = new THREE.EdgesGeometry(geometry);
            geometry = new THREE.IcosahedronGeometry(size, 1);
            break;
        case 'emerald':
            geometry = new THREE.BoxGeometry(size * 1.3, size * 1.8, depth);
            break;
        case 'princess':
            geometry = new THREE.BoxGeometry(size * 1.5, size * 1.5, depth * 1.2);
            break;
        case 'pear':
            geometry = createTeardropGeometry(size * 1.5, size * 2, depth, 0.05);
            break;
        case 'marquise':
            const marquiseShape = new THREE.Shape();
            marquiseShape.moveTo(0, -size);
            marquiseShape.quadraticCurveTo(size * 0.7, 0, 0, size);
            marquiseShape.quadraticCurveTo(-size * 0.7, 0, 0, -size);
            geometry = new THREE.ExtrudeGeometry(marquiseShape, { depth: depth, bevelEnabled: true });
            break;
        case 'asscher':
            geometry = new THREE.BoxGeometry(size * 1.4, size * 1.4, depth);
            break;
        case 'radiant':
            geometry = new THREE.BoxGeometry(size * 1.5, size * 1.3, depth * 1.1);
            break;
        default:
            geometry = new THREE.IcosahedronGeometry(size, 2);
    }

    // Position gemstone
    geometry.translate(0, 0, currentConfig.thickness / 10 / 2 + depth * 0.5);

    if (currentConfig.shape === 'heart' || currentConfig.shape === 'teardrop') {
        geometry.translate(0, currentConfig.height / 10 * 0.1, 0);
    }

    const material = getGemMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    const gemGroup = new THREE.Group();
    gemGroup.add(mesh);
    
    const setting = createGemSetting();
    if (setting) gemGroup.add(setting); 

    return gemGroup; 
}
function createGemSetting() {
    const settingGroup = new THREE.Group();
    const material = getMaterial(true, 2); 
    
    // Convert gem size and setting thickness to Three.js units (cm)
    const gemSizeCm = currentConfig.gemSize / 10;
    const thicknessCm = currentConfig.prongThickness / 10;
    const gemHeightCm = currentConfig.gemDepth / 10;

    // Setting position (sits around the gem)
    const gemTopZ = currentConfig.thickness / 10 / 2 + gemHeightCm * 0.9;
    const radius = gemSizeCm * 0.5;

    switch (currentConfig.settingStyle) {
        case 'bezel':
            // Bezel Setting: Solid metal rim
            const bezelGeo = new THREE.CylinderGeometry(
                radius + thicknessCm * 0.5, // Outer diameter
                radius + thicknessCm * 0.5, // Outer diameter
                thicknessCm * 2,            // Height
                32
            );
            const bezelMesh = new THREE.Mesh(bezelGeo, material);
            bezelMesh.position.z = gemTopZ - thicknessCm;
            bezelMesh.rotation.x = Math.PI / 2;
            settingGroup.add(bezelMesh);
            break;

        case 'minimal':
            // Minimal Setting: Simple basket (no distinct prongs)
            // Fall through to default prongs, but with thinner metal if possible.
        case '4-prong':
        case '6-prong':
        default:
            // Prong Setting
            const numProngs = currentConfig.settingStyle === '6-prong' ? 6 : 4;
            const prongGeo = new THREE.CylinderGeometry(
                thicknessCm / 2, // Top tip
                thicknessCm,     // Base width
                gemHeightCm * 1.5, // Height (taller than gem depth)
                6
            );
            
            for (let i = 0; i < numProngs; i++) {
                const angle = (i / numProngs) * Math.PI * 2;
                const x = Math.cos(angle) * (radius + thicknessCm * 0.1);
                const y = Math.sin(angle) * (radius + thicknessCm * 0.1);
                
                const prong = new THREE.Mesh(prongGeo, material);
                
                prong.position.set(x, y, gemTopZ - gemHeightCm * 0.75);
                prong.rotation.x = Math.PI / 2; // Lay flat
                // Tilt prongs slightly inwards for grip
                prong.rotation.z = angle; 
                prong.rotation.y = Math.PI * 0.05; 
                
                settingGroup.add(prong);
            }
            break;
    }
    
    return settingGroup;
}

// Border creation
export function createBorder() {
    const borderGroup = new THREE.Group();
    const material = getMaterial(true, 1);
    const width = currentConfig.width / 10;
    const height = currentConfig.height / 10;
    const borderThickness = currentConfig.borderWidth;

    let borderGeometry;

    switch (currentConfig.borderStyle) {
        case 'beaded':
            // Create beaded border with small spheres
            const beadCount = 40;
            const beadSize = borderThickness * 0.8;
            for (let i = 0; i < beadCount; i++) {
                const angle = (i / beadCount) * Math.PI * 2;
                const x = Math.cos(angle) * (width / 2 + borderThickness);
                const y = Math.sin(angle) * (height / 2 + borderThickness);
                const bead = new THREE.Mesh(
                    new THREE.SphereGeometry(beadSize, 8, 8),
                    material
                );
                bead.position.set(x, y, 0);
                bead.castShadow = true;
                borderGroup.add(bead);
            }
            return borderGroup;

        case 'rope':
            borderGeometry = new THREE.TorusGeometry(
                Math.max(width, height) / 2 + borderThickness,
                borderThickness * 0.7,
                16,
                64
            );
            break;

        case 'twisted':
            borderGeometry = new THREE.TorusKnotGeometry(
                Math.max(width, height) / 2.5,
                borderThickness * 0.6,
                100,
                16,
                2,
                3
            );
            break;

        case 'crown':
            // Create crown-style border with pointed elements
            const points = 12;
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const x = Math.cos(angle) * (width / 2 + borderThickness * 2);
                const y = Math.sin(angle) * (height / 2 + borderThickness * 2);
                const spike = new THREE.Mesh(
                    new THREE.ConeGeometry(borderThickness, borderThickness * 3, 8),
                    material
                );
                spike.position.set(x, y, 0);
                spike.rotation.z = -angle + Math.PI / 2;
                spike.castShadow = true;
                borderGroup.add(spike);
            }
            // Add base ring
            borderGeometry = new THREE.TorusGeometry(
                Math.max(width, height) / 2 + borderThickness,
                borderThickness * 0.5,
                16,
                32
            );
            break;

        case 'pave':
            // Pavé border with tiny gems
            borderGeometry = new THREE.TorusGeometry(
                Math.max(width, height) / 2 + borderThickness,
                borderThickness,
                16,
                48
            );

            if (currentConfig.borderGems) {
                const gemCount = 30;
                const gemSize = borderThickness * 0.4;
                for (let i = 0; i < gemCount; i++) {
                    const angle = (i / gemCount) * Math.PI * 2;
                    const radius = Math.max(width, height) / 2 + borderThickness;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    const gemMesh = new THREE.Mesh(
                        new THREE.IcosahedronGeometry(gemSize, 0),
                        new THREE.MeshPhysicalMaterial({
                            color: 0xffffff,
                            metalness: 0,
                            roughness: 0,
                            transparent: true,
                            opacity: 0.9,
                            envMap: scene.environment,
                            envMapIntensity: 2
                        })
                    );
                    gemMesh.position.set(x, y, borderThickness);
                    gemMesh.castShadow = true;
                    borderGroup.add(gemMesh);
                }
            }
            break;

        case 'ornate':
        default:
            borderGeometry = new THREE.TorusGeometry(
                Math.max(width, height) / 2 + borderThickness,
                borderThickness,
                16,
                32
            );
    }

    if (borderGeometry) {
        const borderMesh = new THREE.Mesh(borderGeometry, material);
        borderMesh.castShadow = true;
        borderGroup.add(borderMesh);
    }

    return borderGroup;
}

// Bail creation
export function createBail() {
    const bailGroup = new THREE.Group();
    const material = getMaterial(true, 2);
    const pendantTopY = currentConfig.height / 10 / 2;
    const size = currentConfig.bailSize / 10; // Convert to cm here
    
    let bailGeometry;
    let positionY = pendantTopY + size + 0.5;
    let connectorY = pendantTopY + 0.3;

    switch (currentConfig.bailStyle) {
        case 'ornate':
            bailGeometry = new THREE.TorusGeometry(size * 1.2, size * 0.3, 16, 24, Math.PI);
            break;

        case 'heart':
            bailGeometry = createHeartGeometry(size * 2, size * 2, size * 0.5, 0.05);
            positionY = pendantTopY + size * 1.5;
            break;

        case 'integrated-gem-loop':
            bailGeometry = new THREE.TorusGeometry(size * 0.7, size * 0.25, 12, 20, Math.PI);
            positionY = pendantTopY + size * 0.3;
            connectorY = pendantTopY - 0.1;
            break;

        case 'decorative':
            bailGeometry = new THREE.TorusGeometry(size, size * 0.25, 12, 24, Math.PI);
            break;

        case 'hidden':
            // Minimal hidden bail
            bailGeometry = new THREE.CylinderGeometry(size * 0.3, size * 0.3, size * 0.5, 16);
            positionY = pendantTopY + size * 0.5;
            break;

        default: // simple
            bailGeometry = new THREE.TorusGeometry(size, size * 0.25, 12, 20, Math.PI);
    }

    bailGeometry.rotateX(Math.PI / 2);
    const bailMesh = new THREE.Mesh(bailGeometry, material);
    bailMesh.position.set(0, positionY, 0);
    // **ENHANCEMENT: Add Shadow Flags**
    bailMesh.castShadow = true; 
    bailMesh.receiveShadow = true;
    bailGroup.add(bailMesh);

    // Add connector
    if (currentConfig.bailStyle !== 'hidden') {
        const connectorGeometry = new THREE.CylinderGeometry(size * 0.25, size * 0.25, Math.abs(positionY - connectorY), 12);
        const connectorMesh = new THREE.Mesh(connectorGeometry, material);
        connectorMesh.position.set(0, (positionY + connectorY) / 2, 0);
        // **ENHANCEMENT: Add Shadow Flags**
        connectorMesh.castShadow = true;
        connectorMesh.receiveShadow = true;
        bailGroup.add(connectorMesh);
    }

    return bailGroup;
}
// Engraving creation
// geometry.js - REPLACEMENT for the existing 'export function createEngraving()'
export function createEngraving() {
    if (!currentConfig.hasEngraving) return null;

    const engravingGroup = new THREE.Group();
    // Material uses base pendant material
    const material = getMaterial(false, 0); 
    
    // --- POSITIONING PARAMETERS ---
    // Engraving meshes are created flat on the XY plane locally, facing Z-up.
    const frontFaceZ = currentConfig.thickness / 10 / 2;
    const positionZ = 0.005; // Z offset relative to the engraving plane (for thickness)
    
    const plateWidth = currentConfig.width / 10 * 0.8;
    const plateHeight = currentConfig.height / 10 * 0.8;
    const engraveDepthCm = currentConfig.engraveDepth / 10;
    
    // Y-position adjustment: The engraving should be slightly offset vertically to sit in the upper center
    const positionY = currentConfig.height / 10 * 0.2; 
    
    // Choose between text engraving or design engraving (if text is empty)
    if (!currentConfig.engravingText || currentConfig.engravingText.trim() === '') {
        // DESIGN ENGRAVING (Pavé/Design)
        
        const designMaterial = getMaterial(false, 0, currentConfig.colorLayer1); // Accent color
        
        // Element geometry (small metal setting cylinder). CRITICAL: It must be aligned to the face.
        // We create it vertically (Y-up) and let the group rotation handle the alignment.
        const elementGeometry = new THREE.CylinderGeometry(engraveDepthCm * 0.3, engraveDepthCm * 0.5, engraveDepthCm * 0.1, 8);
        
        const gemMaterial = getGemMaterial(); 
        const count = 20;

        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            
            // Curve the pattern around the top center
            const x = THREE.MathUtils.lerp(-plateWidth * 0.3, plateWidth * 0.3, t);
            const y = positionY + (plateHeight * 0.3 - (x * x) * 0.05); // Y position is based on the top center
            
            const element = new THREE.Mesh(elementGeometry, designMaterial);
            element.position.set(x, y, positionZ); // Z is slight offset from face plane
            
            // CRITICAL FIX: Rotate the element to be perpendicular to the face (Z-axis)
            element.rotation.x = Math.PI / 2; 
            
            engravingGroup.add(element);

            // NEW: Add a crystal/gem on top of the metal setting (like pavé)
            if (currentConfig.addCrystals) {
                 const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(engraveDepthCm * 0.3, 1), gemMaterial);
                 crystal.position.set(x, y, positionZ + engraveDepthCm * 0.5); 
                 crystal.castShadow = true;
                 engravingGroup.add(crystal);
            }
        }

    } else {
        // TEXT ENGRAVING (Canvas Texture)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // ... (Canvas text drawing logic) ...
        canvas.width = 1024;
        canvas.height = 256;
        ctx.fillStyle = '#000000';
        const fontFamily = currentConfig.fontStyle === 'script' ? 'cursive' : 
                           currentConfig.fontStyle === 'gothic' ? 'fantasy' :
                           currentConfig.fontStyle === 'serif' ? 'serif' : 'sans-serif';
        ctx.font = `bold ${currentConfig.fontSize * 4}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentConfig.engravingText, 512, 128);

        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            color: new THREE.Color(currentConfig.colorBase).getHex()
        });

        // PlaneGeometry defaults to the XY plane (flat, facing Z-up)
        const geometry = new THREE.PlaneGeometry(
            plateWidth,
            plateHeight
        );

        const mesh = new THREE.Mesh(geometry, textMaterial);
        mesh.position.set(0, positionY, positionZ - engraveDepthCm);
        
        engravingGroup.add(mesh);
    }
    
    // *** FINAL CRITICAL FIX: Positioning the entire group ***
    // 1. Move the entire group to the Z-coordinate of the pendant's front face.
    engravingGroup.position.z = frontFaceZ;
    
    // 2. Add the rotation to match the pendant's vertical orientation.
    // The pendant base geometry is rotated -PI/2 on X in createBaseShape.
    // The engraving elements, now correctly aligned on Z, do not need
    // further group rotation as they inherit the pendantGroup's parent rotation.
    
    return engravingGroup;
}




// Overlay creation
// geometry.js - REPLACEMENT for createOverlay function (lines 842-913)
export function createOverlay() {
    const overlayGroup = new THREE.Group();
    // CRITICAL FIX: Ensure material is instantiated with the color.
    // The getMaterial function handles the overrideColor logic.
    const material = getMaterial(false, 0, currentConfig.overlayColor);
    
    const size = currentConfig.overlaySize;
    // Define a consistent thickness for all overlays, slightly extruded from the surface
    const overlayThickness = 0.05; 
    
    // Z-Offset of the front face of the base pendant
    const frontFaceZ = pendantGroup.userData.featureZOffset;
    
    switch (currentConfig.overlayType) {
        case 'cross':
            // Vertical bar geometry: Width 0.5, Height 4.0, Depth 0.05
            const vBar = new THREE.BoxGeometry(0.5 * size, 4.0 * size, overlayThickness);
            const vMesh = new THREE.Mesh(vBar, material);
            vMesh.castShadow = true;
            overlayGroup.add(vMesh);

            // Horizontal bar geometry: Width 2.0, Height 0.5, Depth 0.05
            const hBar = new THREE.BoxGeometry(2.0 * size, 0.5 * size, overlayThickness);
            const hMesh = new THREE.Mesh(hBar, material);
            hMesh.castShadow = true;
            overlayGroup.add(hMesh);

            // Center gem (White Heart Gem for 'Angel Cross Base')
            const centerGem = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.5 * size, 1),
                new THREE.MeshPhysicalMaterial({
                    color: 0xffffff,
                    metalness: 0,
                    roughness: 0,
                    transparent: true,
                    opacity: 0.85,
                    envMap: scene.environment,
                    envMapIntensity: 2
                })
            );
            // Position Z: Overlay surface + a small rise
            centerGem.position.z = overlayThickness + 0.1 * size;
            overlayGroup.add(centerGem);
            break;

        case 'floral':
            // Simple floral pattern with circles
            const petalCount = 6;
            const petalSize = 0.8 * size;
            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                const x = Math.cos(angle) * 1.5 * size;
                const y = Math.sin(angle) * 1.5 * size;
                const petal = new THREE.Mesh(
                    new THREE.SphereGeometry(petalSize, 16, 16),
                    material
                );
                petal.position.set(x, y, 0);
                petal.scale.z = overlayThickness / petalSize; // Scale z to be flat
                petal.castShadow = true;
                overlayGroup.add(petal);
            }
            break;

        case 'celtic':
            // Celtic knot approximation
            const knotGeometry = new THREE.TorusKnotGeometry(1.5 * size, 0.3 * size, 100, 16, 3, 2);
            const knotMesh = new THREE.Mesh(knotGeometry, material);
            knotMesh.scale.z = 0.1; // Flatten the knot slightly
            knotMesh.castShadow = true;
            overlayGroup.add(knotMesh);
            break;

        case 'filigree':
            // Delicate filigree pattern
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const curve = new THREE.QuadraticBezierCurve3(
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(Math.cos(angle) * 2 * size, Math.sin(angle) * 2 * size, 0.5 * size),
                    new THREE.Vector3(Math.cos(angle + Math.PI/4) * 1.5 * size, Math.sin(angle + Math.PI/4) * 1.5 * size, 0)
                );
                const points = curve.getPoints(20);
                const tubeGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 0.1 * size, 8, false);
                const tubeMesh = new THREE.Mesh(tubeGeometry, material);
                tubeMesh.castShadow = true;
                overlayGroup.add(tubeMesh);
            }
            break;

        case 'geometric':
            // Geometric pattern
            const geomSize = 1.5 * size;
            const geomGeometry = new THREE.OctahedronGeometry(geomSize);
            const geomMesh = new THREE.Mesh(geomGeometry, material);
            geomMesh.scale.z = 0.1; // Flatten
            geomMesh.castShadow = true;
            overlayGroup.add(geomMesh);
            break;
    }

    // Position Y offset (Shift the whole cross/overlay up to the middle of the heart)
    overlayGroup.position.y = currentConfig.height / 10 * 0.2;
    
    // Position Z offset: Place the back of the overlay geometry on the pendant's front face.
    // The elements are created around Z=0, so the whole group needs to move.
    overlayGroup.position.z = frontFaceZ; 

    return overlayGroup;
}

// Chain creation
export function createChain() {
    if (!currentConfig.hasChain) return null;

    const chainGroup = new THREE.Group();
    const material = getMaterial(false, 0, currentConfig.chainColor); 
    
    // Convert to Three.js units (cm is usually 1 Three.js unit)
    const totalLengthCm = currentConfig.chainLength / 10;
    const thicknessCm = currentConfig.chainLinkThickness / 10;
    
    // Link dimensions
    const baseLinkSize = 0.5 + thicknessCm * 2;
    const linkRadius = baseLinkSize * 0.7; // Radius of the torus link
    const linkThickness = thicknessCm;
    const linkLength = linkRadius * 2.5; // Approximate length of one link
    const linkCount = Math.ceil(totalLengthCm / linkLength);
    
    // 1. Define Catenary Parameters (Hanging Curve)
    const bailTopY = currentConfig.height / 10 / 2 + currentConfig.bailSize / 10;
    const horizontalSpread = 2.0; // Horizontal distance from center (A and B's X coordinate)
    
    // NEW SAG: Depth is calculated as a percentage of the length, controlled by UI
    const sagDepth = totalLengthCm * (currentConfig.chainSagDepth / 100); 

    const A = new THREE.Vector3(-horizontalSpread, bailTopY, 0);
    const B = new THREE.Vector3(horizontalSpread, bailTopY, 0);

    // Function to calculate a point on the drape curve (Parabolic Approximation)
    const getDrapePoint = (t) => {
        const x = A.x + t * (B.x - A.x);
        const normalizedX = x / horizontalSpread; // -1 to 1
        // (1 - normalizedX^2) is 0 at ends, 1 at center.
        const yOffset = (1 - normalizedX * normalizedX) * sagDepth; 
        
        const y = bailTopY + 0.5 - yOffset;
        
        return new THREE.Vector3(x, y, 0);
    };

    // 2. Chain Link Geometry Function (UPDATED for unique styles)
    const createLink = (style) => {
        let geometry;
        const radius = linkRadius;
        const tube = linkThickness;
        
        switch (style) {
            case 'box':
                // Box Chain: Small cubes connected at corners
                const boxSize = radius * 1.5;
                geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize * 0.5);
                break;

            case 'rope':
                // Rope Chain: Twisting torus knots
                geometry = new THREE.TorusKnotGeometry(radius * 1.5, tube * 0.7, 32, 8, 2, 3);
                break;

            case 'figaro':
                // Figaro Chain: Uses a standard torus link, but logic below alternates links
            case 'simple-cable':
            case 'curb':
            default:
                // Cable/Curb Chain: Standard Torus link
                geometry = new THREE.TorusGeometry(radius, tube, 8, 16);
                break;
                
            case 'ball':
                // Ball Chain: Spheres
                geometry = new THREE.SphereGeometry(radius * 1.2, 12, 12);
                break;
                
            case 'snake':
                // Snake Chain: Cylinder for smooth, liquid look (will be elongated below)
                geometry = new THREE.CylinderGeometry(tube * 2, tube * 2, linkLength * 0.8, 8);
                geometry.rotateX(Math.PI / 2); // Align with X-axis
                break;
            case 'wheat':
                // Wheat Chain: Small, intertwined v-shapes (approximated by complex torus)
                geometry = new THREE.TorusGeometry(radius * 1.1, tube * 1.2, 16, 32);
                geometry.scale(1.0, 1.2, 1.0); // Slightly flattened
                break;
        }

        return new THREE.Mesh(geometry, material);
    };
    
    // 3. Distribute Links along the curve
    for (let i = 0; i < linkCount; i++) {
        const t = i / (linkCount - 1); // 0 to 1
        
        const linkPos = getDrapePoint(t);
        const nextPos = getDrapePoint(THREE.MathUtils.clamp(t + 0.05, 0, 1)); 
        
        const link = createLink(currentConfig.chainStyle);
        link.castShadow = true;
        link.receiveShadow = true;
        
        link.position.copy(linkPos);
        
        const tangent = new THREE.Vector3().subVectors(nextPos, linkPos).normalize();
        
        // Use LookAt to align the Z-axis with the tangent vector
        const tempObject = new THREE.Object3D();
        tempObject.position.copy(linkPos);
        tempObject.lookAt(nextPos); 
        link.rotation.copy(tempObject.rotation);

        // Post-Rotation Adjustments
        if (currentConfig.chainStyle === 'simple-cable' || currentConfig.chainStyle === 'curb' || currentConfig.chainStyle === 'wheat' || currentConfig.chainStyle === 'rope') {
            // Torus links need to be rotated 90 deg locally (Pi/2) to look like a hanging link
            link.rotation.z += Math.PI / 2;
            
            // Alternating rotation for swivel/realism (except for rope/snake)
            if (i % 2 === 0) {
                 link.rotation.x += Math.PI / 2;
            }
        }
        
        if (currentConfig.chainStyle === 'box') {
            // Box links alternate 90 degrees rotation around the local Y-axis
            if (i % 2 !== 0) {
                link.rotation.y += Math.PI / 2; 
            }
        }
        
        if (currentConfig.chainStyle === 'figaro') {
            // Figaro: 3 short links then 1 long link (approximated by size/rotation change)
            if (i % 4 === 3) {
                // Apply a larger rotation to make the 'long' link stand out
                link.rotation.z += Math.PI / 2;
                link.scale.set(1.5, 1.5, 1.5); // Make it slightly larger
            } else {
                 link.rotation.z += Math.PI / 2;
            }
        }


        chainGroup.add(link);
    }

    
    return chainGroup;
}

export function createReferenceObject() {
    if (currentConfig.referenceObject === 'none') return null;

    // Convert config size (mm) to Three.js units (cm)
    const sizeCm = currentConfig.referenceSize / 10;
    const thickness = 0.1;
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x555555, 
        transparent: true, 
        opacity: 0.8,
        // Make it slightly darker for contrast against the scene floor
        side: THREE.DoubleSide 
    });
    
    let geometry;

    switch (currentConfig.referenceObject) {
        case 'coin':
            // Simple cylinder for a coin
            geometry = new THREE.CylinderGeometry(sizeCm / 2, sizeCm / 2, thickness, 48);
            geometry.rotateX(Math.PI / 2); // Rotate to lie flat on XY plane
            break;
        case 'ring':
            // Torus to represent a basic ring (approximating 25mm inner diameter)
            const innerRadius = (sizeCm - 0.5) / 2;
            const tube = 0.5 / 2;
            geometry = new THREE.TorusGeometry(innerRadius, tube, 16, 100);
            geometry.rotateX(Math.PI / 2); // Rotate to lie flat on XY plane
            break;
        default:
            return null;
    }

    const mesh = new THREE.Mesh(geometry, material);
    // Position it slightly below the pendant (pendantGroup is positioned at Y=15 in core.js)
    // We place the reference object at Y=0 relative to the pendant's local group.
    mesh.position.y = -(currentConfig.height / 10 / 2 + 1); 
    mesh.position.z = 0; // Center it behind the pendant

    return mesh;
}