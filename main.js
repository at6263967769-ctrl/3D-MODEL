// main.js - Application entry point

let appScene;
let appUI;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js library not loaded');
        return;
    }

    // Initialize core components
    appScene = new SpaceScene();
    appUI = new UIManager(appScene);

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        
        const time = clock.getElapsedTime();
        appScene.update(time); // Update scene, planets, controls
    }

    // Start loop
    animate();
});
