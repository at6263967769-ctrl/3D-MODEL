// ui.js - Handles DOM interactions and GSAP animations

class UIManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        
        // DOM Elements
        this.loader = document.getElementById('loader');
        this.progress = document.querySelector('.progress');
        this.infoPanel = document.getElementById('info-panel');
        this.closeBtn = document.getElementById('close-panel');
        this.tooltip = document.getElementById('tooltip');
        this.navBtns = document.querySelectorAll('.nav-btn');
        this.aboutPage = document.getElementById('about-page');

        // Audio
        this.audioEnabled = false;
        this.audioToggle = document.getElementById('audio-toggle');
        this.sfxClick = new Howl({
            src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], // Tech click sound
            volume: 0.5
        });
        this.sfxHover = new Howl({
            src: ['https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'], // Tech hover sound
            volume: 0.2
        });

        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredPlanet = null;
        
        // State
        this.isInteracting = false;
        this.currentView = 'home';
        this.isOrbiting = false; // Add orbit state

        this.init();
    }

    init() {
        // Fake Loading sequence for effect
        this.simulateLoading();

        // Event Listeners
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        
        this.closeBtn.addEventListener('click', () => {
            this.isOrbiting = false;
            this.sceneManager.stopOrbitingPlanet();
            this.hideInfoPanel();
            this.sceneManager.resetCamera();
            this.playClickSound();
        });

        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('data-target');
                this.switchView(target);
                
                // Update active state
                this.navBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                this.playClickSound();
            });
        });

        this.audioToggle.addEventListener('click', () => {
            this.audioEnabled = !this.audioEnabled;
            // Update icon visual
            if (this.audioEnabled) {
                this.audioToggle.style.color = 'var(--accent-blue)';
            } else {
                this.audioToggle.style.color = 'var(--text-muted)';
            }
        });

        document.getElementById('explore-btn').addEventListener('click', () => {
             this.playClickSound();
             this.isOrbiting = true;
             this.hideInfoPanel(); // hide panel to full screen orbit
             
             // Update scene manager state to allow rotating around the planet
             this.sceneManager.startOrbitingPlanet();
        });
    }

    simulateLoading() {
        let loadAmount = 0;
        const interval = setInterval(() => {
            loadAmount += Math.random() * 15;
            if (loadAmount >= 100) {
                loadAmount = 100;
                clearInterval(interval);
                
                // GSAP Out animation for loader
                gsap.to(this.loader, {
                    opacity: 0,
                    duration: 1,
                    delay: 0.5,
                    onComplete: () => {
                        this.loader.style.display = 'none';
                        // Initial camera sweep
                        gsap.from(this.sceneManager.camera.position, {
                            y: 200,
                            z: 300,
                            duration: 3,
                            ease: "power2.out"
                        });
                    }
                });
            }
            this.progress.style.width = `${loadAmount}%`;
        }, 200);
    }

    playClickSound() {
        if(this.audioEnabled) this.sfxClick.play();
    }

    playHoverSound() {
        if(this.audioEnabled) this.sfxHover.play();
    }

    onMouseMove(event) {
        // Don't raycast if not in 3D view or hovering over UI panels
        if (this.currentView !== 'home') return;
        
        // Don't trigger if cursor is on the info panel itself
        if (!this.infoPanel.classList.contains('hidden') && event.clientX > window.innerWidth - 450) {
            this.hideTooltip();
            return;
        }

        // Calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.sceneManager.planets);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            if (this.hoveredPlanet !== object) {
                this.hoveredPlanet = object;
                document.body.style.cursor = 'pointer';
                this.playHoverSound();
                
                // Add glow effect material modification if desired
                object.material.emissive.setHex(0x333333);
            }

            // Show tooltip
            this.showTooltip(event.clientX, event.clientY, object.userData.name);

        } else {
            if (this.hoveredPlanet) {
                // Reset hover
                this.hoveredPlanet.material.emissive.setHex(0x000000);
                this.hoveredPlanet = null;
                document.body.style.cursor = 'default';
                this.hideTooltip();
            }
        }
    }

    onClick(event) {
        if (this.currentView !== 'home') return;
        if (!this.infoPanel.classList.contains('hidden') && event.clientX > window.innerWidth - 450) return;

        if (this.hoveredPlanet) {
            this.playClickSound();
            
            // Camera focus
            this.sceneManager.focusOnPlanet(this.hoveredPlanet);
            
            // Populate and show UI
            this.populateInfoPanel(this.hoveredPlanet.userData.data);
            this.showInfoPanel();
            this.hideTooltip();
        }
    }

    showTooltip(x, y, text) {
        this.tooltip.textContent = text;
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = (y - 20) + 'px';
        this.tooltip.classList.remove('hidden');
    }

    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }

    populateInfoPanel(data) {
        document.getElementById('planet-name').textContent = data.name;
        document.getElementById('planet-type').textContent = data.type;
        document.getElementById('planet-description').textContent = data.description;
        
        // Count up animation for numbers
        this.animateNumber('planet-diameter', parseInt(data.diameter.replace(/,/g, '')), ' km');
        document.getElementById('planet-gravity').textContent = data.gravity;
        document.getElementById('planet-distance').textContent = data.distance;
        document.getElementById('planet-moons').textContent = data.moons;
        
        document.getElementById('planet-image').src = data.imageUrl;
    }

    animateNumber(elementId, targetNumber, suffix) {
        const el = document.getElementById(elementId);
        const obj = { val: 0 };
        
        gsap.to(obj, {
            val: targetNumber,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: function() {
                el.textContent = Math.round(obj.val).toLocaleString() + suffix;
            }
        });
    }

    showInfoPanel() {
        this.infoPanel.classList.remove('hidden');
        
        // GSAP timeline for inner elements stagger
        const tl = gsap.timeline();
        tl.fromTo(this.infoPanel, 
            { x: '100%' }, 
            { x: 0, duration: 0.5, ease: "power3.out" }
        )
        .fromTo('.planet-header', 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.4 }, "-=0.2"
        )
        .fromTo('#planet-description', 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.4 }, "-=0.2"
        )
        .fromTo('.stat-box', 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, "-=0.2"
        )
        .fromTo('.planet-gallery', 
            { opacity: 0, scale: 0.9 }, 
            { opacity: 1, scale: 1, duration: 0.4 }, "-=0.2"
        );
    }

    hideInfoPanel() {
        gsap.to(this.infoPanel, {
            x: '100%',
            duration: 0.5,
            ease: "power3.in",
            onComplete: () => {
                this.infoPanel.classList.add('hidden');
                // if not orbiting, reset camera. If orbiting, let camera stay.
                if(!this.isOrbiting && this.currentView === 'home') {
                    // It resets in closeBtn handler.
                }
            }
        });
    }

    switchView(target) {
        this.currentView = target;
        
        if (target === 'about') {
            // Hide info panel if open
            if (!this.infoPanel.classList.contains('hidden')) {
                this.hideInfoPanel();
                this.sceneManager.resetCamera();
            }
            
            this.aboutPage.classList.remove('hidden');
            
            // Animate About Page In
            gsap.fromTo(this.aboutPage,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", display: 'block' }
            );

        } else if (target === 'home') {
            // Animate About Page Out
            gsap.to(this.aboutPage, {
                opacity: 0,
                y: 50,
                duration: 0.5,
                ease: "power2.in",
                onComplete: () => {
                    this.aboutPage.classList.add('hidden');
                    this.aboutPage.style.display = 'none';
                }
            });
        }
    }
}
