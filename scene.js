// scene.js - Three.js core logic

class SpaceScene {
    constructor() {
        this.container = document.getElementById('canvas-container');
        
        // Scene Setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 80, 150);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 500;
        this.controls.minDistance = 5;

        // Texture Loader
        this.textureLoader = new THREE.TextureLoader();
        
        this.planets = [];
        this.sun = null;
        this.focusedPlanet = null;
        
        this.init();
        
        // Handle Resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    init() {
        this.createLighting();
        this.createStarfield();
        this.createSun();
        this.createPlanets();
    }

    createLighting() {
        // Ambient light for the dark side of planets
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.scene.add(ambientLight);

        // Main sunlight (Point light from the center)
        this.sunLight = new THREE.PointLight(0xffffff, 2, 800);
        this.scene.add(this.sunLight);
    }

    createStarfield() {
        // Create a large sphere for the skybox
        const geometry = new THREE.SphereGeometry(1000, 64, 64);
        // We'll use a procedural starfield for now if texture isn't available
        const material = new THREE.MeshBasicMaterial({
            color: 0x050505,
            side: THREE.BackSide
        });
        const skybox = new THREE.Mesh(geometry, material);
        this.scene.add(skybox);

        // Add particles for stars
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 5000;
        const posArray = new Float32Array(starsCount * 3);
        const colorArray = new Float32Array(starsCount * 3);

        const color1 = new THREE.Color(0xffffff);
        const color2 = new THREE.Color(0x00d2ff);
        const color3 = new THREE.Color(0x9d00ff);

        for(let i = 0; i < starsCount * 3; i+=3) {
            // Random position in sphere
            const r = 400 + Math.random() * 600;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            
            posArray[i] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i+1] = r * Math.sin(phi) * Math.sin(theta);
            posArray[i+2] = r * Math.cos(phi);

            // Random color
            const randColor = Math.random();
            let c = color1;
            if (randColor > 0.8) c = color2;
            else if (randColor > 0.9) c = color3;

            colorArray[i] = c.r;
            colorArray[i+1] = c.g;
            colorArray[i+2] = c.b;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const starsMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    createSun() {
        // Create the sun base sphere
        const geometry = new THREE.SphereGeometry(SUN_DATA[3].radius, 64, 64);
        
        // Use an emissive glowing core so it's impossible to be black
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff // pure bright white center
        });
        
        this.sun = new THREE.Mesh(geometry, material);
        // Ensure sun never receives shadows and draws last (on top of background but under sprite glow)
        this.sun.receiveShadow = false;
        this.sun.castShadow = false;
        this.sun.renderOrder = 1;
        this.scene.add(this.sun);

        // Generate a glowing radial gradient using an HTML Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');     // intense white core
        gradient.addColorStop(0.1, 'rgba(255, 230, 100, 1)');   // intense yellow
        gradient.addColorStop(0.4, 'rgba(255, 120, 0, 0.9)');   // fiery orange
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');         // fade out
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);

        const glowTexture = new THREE.CanvasTexture(canvas);

        // Add sprite for the glow (sprites always face the camera)
        const spriteMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false // don't occlude other objects
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        // Scale the glow to be much larger than the sun itself
        const glowSize = SUN_DATA[3].radius * 6;
        sprite.scale.set(glowSize, glowSize, 1);
        this.sun.add(sprite);
    }

    createPlanets() {
        PLANET_DATA.forEach(data => {
            // Create a pivot object for the orbit
            const orbitGroup = new THREE.Group();
            
            // Apply orbital tilt
            if (data[3].orbitalTilt) {
                orbitGroup.rotation.x = data[3].orbitalTilt;
                // Add some random starting position
                orbitGroup.rotation.y = Math.random() * Math.PI * 2;
            }

            this.scene.add(orbitGroup);

            // Create planet mesh
            const geometry = new THREE.SphereGeometry(data[3].radius, 64, 64);
            const material = new THREE.MeshStandardMaterial({
                color: data.color,
                roughness: 0.8,
                metalness: 0.1
            });

            // Load Texture
            if (data.textureUrl) {
                this.textureLoader.load(data.textureUrl, (texture) => {
                    material.map = texture;
                    material.color.setHex(0xffffff); // Remove base color tint if texture loads
                    material.needsUpdate = true;
                });
            }

            // Bump map for Earth
            if (data.bumpUrl) {
                this.textureLoader.load(data.bumpUrl, (bump) => {
                    material.bumpMap = bump;
                    material.bumpScale = 0.05;
                    material.needsUpdate = true;
                });
            }

            const planetMesh = new THREE.Mesh(geometry, material);
            planetMesh.castShadow = true;
            planetMesh.receiveShadow = true;
            
            // Position planet
            planetMesh.position.x = data[3].distance;
            orbitGroup.add(planetMesh);

            // Create rings if needed
            if (data[3].hasRings) {
                const ringGeometry = new THREE.RingGeometry(data[3].ringInner, data[3].ringOuter, 64);
                
                // Need two materials to see both sides of the flat ring
                const pos = ringGeometry.attributes.position;
                const uv = ringGeometry.attributes.uv;
                for (let i = 0; i < pos.count; i++) {
                    uv.setXY(i, (pos.getX(i) / data[3].ringOuter + 1) / 2, (pos.getY(i) / data[3].ringOuter + 1) / 2);
                }

                const ringMaterial = new THREE.MeshStandardMaterial({
                    color: data[3].ringColor,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8
                });

                const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
                ringMesh.rotation.x = Math.PI / 2; // Flat on the orbit plane
                ringMesh.receiveShadow = true;
                planetMesh.add(ringMesh);
            }

            // Create orbit line visual
            const orbitLineGeometry = new THREE.BufferGeometry();
            const orbitVertices = [];
            for (let i = 0; i <= 64; i++) {
                const angle = (i / 64) * Math.PI * 2;
                orbitVertices.push(
                    Math.cos(angle) * data[3].distance,
                    0,
                    Math.sin(angle) * data[3].distance
                );
            }
            orbitLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitVertices, 3));
            const orbitLineMaterial = new THREE.LineBasicMaterial({
                color: 0x333333,
                transparent: true,
                opacity: 0.5
            });
            const orbitLine = new THREE.Line(orbitLineGeometry, orbitLineMaterial);
            orbitGroup.add(orbitLine);

            // Store references
            planetMesh.userData = {
                id: data.id,
                name: data.name,
                orbitSpeed: data[3].orbitSpeed,
                rotationSpeed: data[3].rotationSpeed,
                orbitGroup: orbitGroup,
                baseObj: planetMesh,
                radius: data[3].radius,
                data: data
            };

            this.planets.push(planetMesh);
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(time) {
        this.controls.update();

        // Rotate sun
        if (this.sun) {
            this.sun.rotation.y += 0.002;
        }

        // Rotate stars slowly
        if (this.stars) {
            this.stars.rotation.y = time * 0.00005;
        }

        // Update planets
        this.planets.forEach(planet => {
            const data = planet.userData;
            
            // Only orbit if not focused
            if (this.focusedPlanet !== planet) {
                // Orbit around sun
                data.orbitGroup.rotation.y += data.orbitSpeed;
                
                // Self rotation
                planet.rotation.y += data.rotationSpeed;
            } else {
                // Still rotate on own axis when focused
                planet.rotation.y += data.rotationSpeed * 0.5; // slower when focused
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    // Camera animation
    focusOnPlanet(planet) {
        this.focusedPlanet = planet;
        
        // Calculate new camera position
        const targetPos = new THREE.Vector3();
        planet.getWorldPosition(targetPos);

        const radius = planet.userData.radius;
        const camDistance = radius * 4; // distance from planet
        
        // Position camera relative to planet
        const offset = new THREE.Vector3(camDistance, radius * 0.5, camDistance);
        
        // Add current planet world position
        const endPos = targetPos.clone().add(offset);

        // GSAP Animation
        gsap.to(this.camera.position, {
            x: endPos.x,
            y: endPos.y,
            z: endPos.z,
            duration: 2,
            ease: "power3.inOut"
        });

        gsap.to(this.controls.target, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 2,
            ease: "power3.inOut"
        });
    }

    resetCamera() {
        this.focusedPlanet = null;
        this.controls.autoRotate = false; // Add
        
        gsap.to(this.camera.position, {
            x: 0,
            y: 80,
            z: 150,
            duration: 2,
            ease: "power3.inOut"
        });

        gsap.to(this.controls.target, {
            x: 0,
            y: 0,
            z: 0,
            duration: 2,
            ease: "power3.inOut"
        });
    }

    startOrbitingPlanet() {
        // Enable auto rotation around the currently focused planet
        if (this.focusedPlanet) {
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 2.0; // adjust speed as needed
        }
    }

    stopOrbitingPlanet() {
        this.controls.autoRotate = false;
    }
}
