let scene, camera, renderer, particles;
const count = 12000;
let currentState = 'sphere';

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf8f9fa);
    document.getElementById('container').appendChild(renderer.domElement);

    camera.position.z = 25;

    createParticles();
    setupEventListeners();
    addTouchSupport(); // Add touch support for mobile
    
    // Initialize with cosmic color scheme
    window.currentColorScheme = 'cosmic';
    
    animate();
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        
        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        
        positions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const color = new THREE.Color();
        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material with lighter settings for sphere
    const material = new THREE.PointsMaterial({
        size: 0.08, // Smaller particles for sphere
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.6, // Lower opacity for lighter appearance
        sizeAttenuation: true
    });

    if (particles) scene.remove(particles);
    particles = new THREE.Points(geometry, material);
    particles.rotation.x = 0;
    particles.rotation.y = 0;
    particles.rotation.z = 0;
    scene.add(particles);
}

function setupEventListeners() {
    const typeBtn = document.getElementById('typeBtn');
    const input = document.getElementById('morphText');
    const sphereBtn = document.getElementById('sphereBtn');
    const waveBtn = document.getElementById('waveBtn');
    const spiralBtn = document.getElementById('spiralBtn');
    
    // Color scheme buttons
    const cosmicBtn = document.querySelector('.color-scheme button:nth-child(1)');
    const neonBtn = document.querySelector('.color-scheme button:nth-child(2)');
    const sunsetBtn = document.querySelector('.color-scheme button:nth-child(3)');
    const oceanBtn = document.querySelector('.color-scheme button:nth-child(4)');

    typeBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (text) {
            morphToText(text);
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = input.value.trim();
            if (text) {
                morphToText(text);
            }
        }
    });

    sphereBtn.addEventListener('click', () => {
        morphToCircle();
        setActiveButton(sphereBtn, 'shape');
    });

    waveBtn.addEventListener('click', () => {
        morphToWave();
        setActiveButton(waveBtn, 'shape');
    });

    spiralBtn.addEventListener('click', () => {
        morphToSpiral();
        setActiveButton(spiralBtn, 'shape');
    });
    
    // Color scheme event listeners
    cosmicBtn.addEventListener('click', () => {
        setColorScheme('cosmic');
        setActiveButton(cosmicBtn, 'color');
    });
    
    neonBtn.addEventListener('click', () => {
        setColorScheme('neon');
        setActiveButton(neonBtn, 'color');
    });
    
    sunsetBtn.addEventListener('click', () => {
        setColorScheme('sunset');
        setActiveButton(sunsetBtn, 'color');
    });
    
    oceanBtn.addEventListener('click', () => {
        setColorScheme('ocean');
        setActiveButton(oceanBtn, 'color');
    });
}

function setActiveButton(activeBtn, type) {
    if (type === 'shape') {
        // Remove active class from all shape buttons
        document.querySelectorAll('.controls button').forEach(btn => {
            btn.classList.remove('active');
        });
    } else if (type === 'color') {
        // Remove active class from all color buttons
        document.querySelectorAll('.color-scheme button').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    // Add active class to clicked button
    activeBtn.classList.add('active');
}

function createTextPoints(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 100;
    const padding = 20;

    ctx.font = `bold ${fontSize}px Arial`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const points = [];
    const threshold = 128;

    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > threshold) {
            const x = (i / 4) % canvas.width;
            const y = Math.floor((i / 4) / canvas.width);
            
            // Use more particles for denser text (increased from 30% to 70%)
            if (Math.random() < 0.7) {
                points.push({
                    x: (x - canvas.width / 2) / (fontSize / 10),
                    y: -(y - canvas.height / 2) / (fontSize / 10)
                });
            }
        }
    }

    return points;
}

function morphToText(text) {
    currentState = 'text';
    const textPoints = createTextPoints(text);
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);

    // Update particle material for text (more prominent)
    particles.material.size = 0.12; // Larger particles for text
    particles.material.opacity = 0.9; // Higher opacity for text
    particles.material.needsUpdate = true;

    gsap.to(particles.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
    });

    for (let i = 0; i < count; i++) {
        if (i < textPoints.length) {
            targetPositions[i * 3] = textPoints[i].x;
            targetPositions[i * 3 + 1] = textPoints[i].y;
            targetPositions[i * 3 + 2] = 0;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20 + 10;
            targetPositions[i * 3] = Math.cos(angle) * radius;
            targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
            targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
    }

    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(particles.geometry.attributes.position.array, {
            [i]: targetPositions[i],
            [i + 1]: targetPositions[i + 1],
            [i + 2]: targetPositions[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    setTimeout(() => {
        morphToCircle();
    }, 4000);
}

function morphToCircle() {
    currentState = 'sphere';
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);
    const colors = particles.geometry.attributes.color.array;

    // Reset particle material for sphere (lighter appearance)
    particles.material.size = 0.08; // Smaller particles for sphere
    particles.material.opacity = 0.6; // Lower opacity for sphere
    particles.material.needsUpdate = true;

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        
        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        
        targetPositions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        const color = new THREE.Color();
        color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    animateMorph(positions, targetPositions, colors, colors);
}

function morphToWave() {
    currentState = 'wave';
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);
    const colors = particles.geometry.attributes.color.array;
    const targetColors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const ix = i % 100;
        const iy = Math.floor(i / 100);
        
        targetPositions[i * 3] = (ix - 50) * 0.5;
        targetPositions[i * 3 + 1] = Math.sin(ix * 0.2) * 5 + Math.cos(iy * 0.15) * 3;
        targetPositions[i * 3 + 2] = (iy - 50) * 0.5;

        // Create wave-like color effect
        const color = new THREE.Color();
        const waveValue = (Math.sin(ix * 0.2) + 1) / 2;
        color.setHSL(0.5 + waveValue * 0.3, 0.8, 0.4 + waveValue * 0.3);
        
        targetColors[i * 3] = color.r;
        targetColors[i * 3 + 1] = color.g;
        targetColors[i * 3 + 2] = color.b;
    }

    animateMorph(positions, targetPositions, colors, targetColors);
}

function morphToSpiral() {
    currentState = 'spiral';
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);
    const colors = particles.geometry.attributes.color.array;
    const targetColors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const angle = 0.1 * i;
        const radius = 0.05 * i;
        
        targetPositions[i * 3] = Math.cos(angle) * (radius % 15);
        targetPositions[i * 3 + 1] = (i / count) * 40 - 20;
        targetPositions[i * 3 + 2] = Math.sin(angle) * (radius % 15);

        // Create spiral color effect
        const color = new THREE.Color();
        const depth = i / count;
        color.setHSL(depth * 0.8, 0.9, 0.3 + depth * 0.4);
        
        targetColors[i * 3] = color.r;
        targetColors[i * 3 + 1] = color.g;
        targetColors[i * 3 + 2] = color.b;
    }

    animateMorph(positions, targetPositions, colors, targetColors);
}

function setColorScheme(scheme) {
    // Store the current scheme
    window.currentColorScheme = scheme;
    
    // If we're in a static state (not animating), update the colors immediately
    if (currentState === 'sphere' || currentState === 'wave' || currentState === 'spiral') {
        updateParticleColors();
    }
}

function updateParticleColors() {
    if (!particles || !particles.geometry || !particles.geometry.attributes.color) return;
    
    const colors = particles.geometry.attributes.color.array;
    const positions = particles.geometry.attributes.position.array;
    
    // Define color schemes
    const colorSchemes = {
        cosmic: { h: 0.5, s: 0.7, lStart: 0.4, lRange: 0.3 },
        neon: { h: 0.33, s: 0.8, lStart: 0.3, lRange: 0.4 },
        sunset: { h: 0.05, s: 0.9, lStart: 0.4, lRange: 0.3 },
        ocean: { h: 0.55, s: 0.8, lStart: 0.3, lRange: 0.4 }
    };
    
    const scheme = colorSchemes[window.currentColorScheme] || colorSchemes.cosmic;
    
    for (let i = 0; i < colors.length; i += 3) {
        let depth;
        
        if (currentState === 'sphere') {
            // For sphere, calculate depth based on distance from center
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            depth = Math.sqrt(x * x + y * y + z * z) / 8;
        } else if (currentState === 'wave') {
            // For wave, calculate depth based on position
            const x = positions[i];
            depth = (Math.sin(x * 0.2) + 1) / 2;
        } else if (currentState === 'spiral') {
            // For spiral, calculate depth based on position along spiral
            const y = positions[i + 1];
            depth = (y + 20) / 40; // Normalize from -20 to 20 range
        } else {
            // Default depth calculation
            depth = i / colors.length;
        }
        
        const color = new THREE.Color();
        color.setHSL(
            scheme.h + depth * 0.2, 
            scheme.s, 
            scheme.lStart + depth * scheme.lRange
        );
        
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }
    
    particles.geometry.attributes.color.needsUpdate = true;
}

function animateMorph(positions, targetPositions, colors, targetColors) {
    // Reset any ongoing animations
    gsap.killTweensOf(positions);
    gsap.killTweensOf(colors);
    gsap.killTweensOf(particles.rotation);

    // Reset rotation
    gsap.to(particles.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
    });

    // Animate positions
    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
            [i]: targetPositions[i],
            [i + 1]: targetPositions[i + 1],
            [i + 2]: targetPositions[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    // Animate colors if target colors provided
    if (targetColors && colors) {
        for (let i = 0; i < colors.length; i += 3) {
            gsap.to(colors, {
                [i]: targetColors[i],
                [i + 1]: targetColors[i + 1],
                [i + 2]: targetColors[i + 2],
                duration: 2,
                ease: "power2.inOut",
                onUpdate: () => {
                    particles.geometry.attributes.color.needsUpdate = true;
                }
            });
        }
    }
    
    // Update colors after morph completes
    setTimeout(() => {
        updateParticleColors();
    }, 2000);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (currentState === 'sphere') {
        particles.rotation.y += 0.002;
    } else if (currentState === 'wave') {
        particles.rotation.y += 0.003;
        // Add some wave motion
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] = Math.sin(positions[i] * 0.2 + Date.now() * 0.005) * 3 + 
                             Math.cos(positions[i + 2] * 0.15 + Date.now() * 0.003) * 2;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Update colors for wave motion
        if (Date.now() % 100 < 2) { // Update periodically to avoid performance issues
            updateParticleColors();
        }
    } else if (currentState === 'spiral') {
        particles.rotation.y += 0.005;
    } else if (currentState === 'text') {
        // Add subtle floating motion to text particles
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            // Apply gentle floating motion only to Z axis
            positions[i + 2] = Math.sin(positions[i] * 0.1 + positions[i + 1] * 0.05 + Date.now() * 0.002) * 0.5;
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Adjust particle count based on screen size for better performance
    adjustParticleCount();
});

// Add touch event support for mobile devices
function addTouchSupport() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (!particles) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        
        // Rotate particles based on touch movement
        particles.rotation.y += deltaX * 0.005;
        particles.rotation.x += deltaY * 0.005;
    }, { passive: true });
}

// Adjust particle count based on screen size for better performance
function adjustParticleCount() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenSize = width * height;
    const maxScreenSize = 1920 * 1080; // Reference screen size
    
    // Adjust particle count based on screen size
    const newCount = Math.max(2000, Math.min(12000, Math.floor(count * (screenSize / maxScreenSize))));
    
    if (Math.abs(newCount - count) > 1000) {
        count = newCount;
        createParticles();
    }
}

// Initialize touch support
init();