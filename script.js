       // Loading Screen
const loadingScreen = document.getElementById('loadingScreen');
const loadingCanvas = document.getElementById('loadingCanvas');
const loadingScene = new THREE.Scene();
const loadingCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const loadingRenderer = new THREE.WebGLRenderer({ canvas: loadingCanvas, alpha: true });
loadingRenderer.setSize(window.innerWidth, window.innerHeight);
loadingCamera.position.set(0, 0, 5);

const starCount = 600;
const ringRadius = 1.5;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starOpacities = new Float32Array(starCount);
const starPhases = new Float32Array(starCount);
for (let i = 0; i < starCount; i++) {
  const angle = (i / starCount) * Math.PI * 2;
  starPositions[i * 3] = Math.cos(angle) * ringRadius;
  starPositions[i * 3 + 1] = Math.sin(angle) * ringRadius;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
  starOpacities[i] = 0;
  starPhases[i] = Math.random() * Math.PI * 2;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('opacity', new THREE.BufferAttribute(starOpacities, 1));
starGeometry.setAttribute('phase', new THREE.BufferAttribute(starPhases, 1));

const starMaterial = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, progress: { value: 0 } },
  vertexShader: `
    attribute float opacity;
    attribute float phase;
    uniform float time;
    uniform float progress;
    varying float vOpacity;
    varying float vSize;
    void main() {
      vOpacity = opacity * (0.8 + 0.4 * sin(time + phase));
      vSize = 0.2 + 0.15 * sin(time + phase);
      gl_PointSize = vSize * 30.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying float vOpacity;
    void main() {
      float t = sin(vOpacity * 3.14) * 0.2 + 0.8;
      gl_FragColor = vec4(t, t * 0.83, 1.0, vOpacity);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending
});

const starRing = new THREE.Points(starGeometry, starMaterial);
loadingScene.add(starRing);

function updateStarRing(progress) {
  const visibleStars = Math.floor(starCount * progress);
  for (let i = 0; i < starCount; i++) {
    starOpacities[i] = i < visibleStars ? 1 : 0;
  }
  starGeometry.setAttribute('opacity', new THREE.BufferAttribute(starOpacities, 1));
}

const particles = [];
for (let i = 0; i < 100; i++) {
  const particle = document.createElement('div');
  particle.className = 'particle';
  particle.style.width = `2px`;
  particle.style.height = `${Math.random() * 20 + 10}px`;
  particle.style.left = `${Math.random() * 100}%`;
  particle.style.top = `${Math.random() * 100}%`;
  particle.style.animationDuration = `${Math.random() * 0.4 + 0.2}s`;
  particle.style.animationDelay = `${Math.random() * 2}s`;
  loadingScreen.appendChild(particle);
  particles.push(particle);
}

let time = 0;
function animateLoading() {
  if (loadingScreen.classList.contains('hidden')) return;
  requestAnimationFrame(animateLoading);
  time += 0.02;
  starMaterial.uniforms.time.value = time;
  starRing.rotation.z += 0.015;
  starRing.scale.setScalar(1 + 0.1 * Math.sin(time));
  loadingRenderer.render(loadingScene, loadingCamera);
}
animateLoading(); 
// Main Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, 0.5, 10000);
camera.position.set(10, 0, 90);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

if (!renderer.getContext()) {
  console.error('WebGL not supported');
  alert('WebGL is not supported by your browser.');
}

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 10000;

scene.add(new THREE.AmbientLight(0xffffff, 0.1));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(0, 0, 0);
scene.add(directionalLight);

const loadingManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadingManager);
let isLoading = true;

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  updateStarRing(itemsLoaded / itemsTotal);
};

loadingManager.onLoad = () => {
  loadingScreen.classList.add('hidden');
  setTimeout(() => {
    loadingScreen.style.display = 'none';
    particles.forEach(p => p.remove());
    isLoading = false;
  }, 1000);
};

setTimeout(() => {
  if (!loadingScreen.classList.contains('hidden')) {
    loadingScreen.classList.add('hidden');
    loadingScreen.style.display = 'none';
    particles.forEach(p => p.remove());
    isLoading = false;
  }
}, 10000);

// Navigation
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navMenu.classList.toggle('open');
});

let activeView = null;
let isInteracting = false;
let cameraOffset = new THREE.Vector3();
let lastTargetPosition = new THREE.Vector3();
let showOrbits = true;
let showLabels = false;

controls.addEventListener('start', () => { isInteracting = true; });
controls.addEventListener('end', () => {
  isInteracting = false;
  if (activeView === 'moon' && moon) cameraOffset.copy(camera.position).sub(moon.position);
  else if (activeView === 'earth' && earth) cameraOffset.copy(camera.position).sub(earth.position);
  else if (activeView === 'mars' && mars) cameraOffset.copy(camera.position).sub(mars.position);
  else if (activeView === 'jupiter' && jupiter) cameraOffset.copy(camera.position).sub(jupiter.position);
  else if (activeView === 'mercury' && mercury) cameraOffset.copy(camera.position).sub(mercury.position);
  else if (activeView === 'venus' && venus) cameraOffset.copy(camera.position).sub(venus.position);
  else if (activeView === 'saturn' && saturn) cameraOffset.copy(camera.position).sub(saturn.position);
});

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function transitionCamera(newPosition, newTarget, duration = 1500, newView = null, newOffset = new THREE.Vector3()) {
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();
  const originalDamping = controls.enableDamping;
  controls.enableDamping = true;

  function updateCamera() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const easedT = easeInOutQuad(t);
    camera.position.lerpVectors(startPosition, newPosition, easedT);
    controls.target.lerpVectors(startTarget, newTarget, easedT);
    controls.update();
    if (t < 1) requestAnimationFrame(updateCamera);
    else {
      camera.position.copy(newPosition);
      controls.target.copy(newTarget);
      controls.enableDamping = originalDamping;
      controls.update();
      activeView = newView;
      cameraOffset.copy(newOffset);
      lastTargetPosition.copy(newTarget);
    }
  }
  requestAnimationFrame(updateCamera);
}

document.getElementById('nav1').addEventListener('click', () => {
  if (sun) transitionCamera(sun.position.clone().add(new THREE.Vector3(20, 10, 20)), sun.position, 1500, 'sun', new THREE.Vector3(20, 10, 20));
});
document.getElementById('nav2').addEventListener('click', () => {
  if (moon) transitionCamera(moon.position.clone().add(new THREE.Vector3(5, 2, 5)), moon.position, 1500, 'moon', new THREE.Vector3(5, 2, 5));
});
document.getElementById('nav3').addEventListener('click', () => {
  if (earth) transitionCamera(earth.position.clone().add(new THREE.Vector3(15, 5, 15)), earth.position, 1500, 'earth', new THREE.Vector3(15, 5, 15));
});
document.getElementById('nav4').addEventListener('click', () => {
  if (mars) transitionCamera(mars.position.clone().add(new THREE.Vector3(15, 5, 15)), mars.position, 1500, 'mars', new THREE.Vector3(15, 5, 15));
});
document.getElementById('nav5').addEventListener('click', () => {
  if (jupiter) transitionCamera(jupiter.position.clone().add(new THREE.Vector3(20, 5, 20)), jupiter.position, 1500, 'jupiter', new THREE.Vector3(20, 5, 20));
});
document.getElementById('nav6').addEventListener('click', () => {
  if (mercury) transitionCamera(mercury.position.clone().add(new THREE.Vector3(10, 3, 10)), mercury.position, 1500, 'mercury', new THREE.Vector3(10, 3, 10));
});
document.getElementById('nav7').addEventListener('click', () => {
  if (venus) transitionCamera(venus.position.clone().add(new THREE.Vector3(12, 4, 12)), venus.position, 1500, 'venus', new THREE.Vector3(12, 4, 12));
});
document.getElementById('nav8').addEventListener('click', () => {
  if (saturn) transitionCamera(saturn.position.clone().add(new THREE.Vector3(20, 5, 20)), saturn.position, 1500, 'saturn', new THREE.Vector3(20, 5, 20));
});
document.getElementById('nav9').addEventListener('click', () => {
  transitionCamera(new THREE.Vector3(3100, 60, 60), new THREE.Vector3(3500, 0, 0), 2000, 'milkyWay', new THREE.Vector3(0, 50, 50));
});
document.getElementById('nav10').addEventListener('click', () => {
  showOrbits = !showOrbits;
  showLabels = !showLabels;
  scene.traverse(obj => {
    if (obj.userData.isOrbit) obj.visible = showOrbits;
    if (obj.userData.isLabel) obj.visible = showLabels;
  });
});

function createLabel(text, position, size = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = '40px Orbitron';
  context.fillStyle = '#00D4FF';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.copy(position);
  sprite.scale.set(size * 4, size * 2, 1);
  sprite.userData.isLabel = true;
  sprite.visible = showLabels;
  scene.add(sprite);
  return sprite;
}

// 📌 Info Panel Data
const objectInfo = {
    sun: {
        name: "Sun",
        description: "The blazing star at the center of our Solar System, fueling life on Earth.",
        fact: "It makes up more than 99.8% of the Solar System's mass."
    },
    mercury: {
        name: "Mercury",
        description: "The smallest planet, closest to the Sun with no atmosphere to trap heat.",
        fact: "Temperatures vary from -173°C at night to 427°C during the day."
    },
    venus: {
        name: "Venus",
        description: "Earth's 'evil twin', with a thick, toxic atmosphere and runaway greenhouse effect.",
        fact: "It rotates backwards and has longer days than years."
    },
    earth: {
        name: "Earth",
        description: "The only known planet to support life, with vast oceans and a protective atmosphere.",
        fact: "70% of Earth's surface is covered in water."
    },
    moon: {
        name: "Moon",
        description: "Earth's natural satellite that influences tides and night skies.",
        fact: "The Moon is slowly drifting away from Earth, ~3.8 cm per year."
    },
    mars: {
        name: "Mars",
        description: "The red planet with dust storms, valleys, and signs of past water flow.",
        fact: "Mars hosts the tallest mountain in the solar system: Olympus Mons."
    },
    phobos: {
        name: "Phobos",
        description: "One of Mars' two moons, irregular in shape and cratered.",
        fact: "It may crash into Mars in about 50 million years."
    },
    deimos: {
        name: "Deimos",
        description: "The smaller, more distant moon of Mars, smooth and quiet.",
        fact: "Its name means 'terror' in Greek mythology."
    },
    jupiter: {
        name: "Jupiter",
        description: "The largest planet in the Solar System, a gas giant with storms.",
        fact: "It has over 90 known moons and a massive magnetic field."
    },
    saturn: {
        name: "Saturn",
        description: "Famous for its beautiful rings made of ice and dust.",
        fact: "Saturn could float in water due to its low density."
    },
    titan: {
        name: "Titan",
        description: "Saturn's largest moon, known for its dense atmosphere.",
        fact: "It rains liquid methane and has lakes of hydrocarbons."
    },
    asteroid: {
        name: "Asteroid",
        description: "Small, rocky objects orbiting the Sun, mostly in the asteroid belt.",
        fact: "Some asteroids contain metals and water — future resources for space travel."
    },
    comet: {
        name: "Comet",
        description: "Icy bodies that develop tails when they approach the Sun.",
        fact: "Their bright comas and tails are made of gas and dust."
    },
    milkyway: {
        name: "Milky Way",
        description: "Our galaxy, home to hundreds of billions of stars.",
        fact: "It's a barred spiral galaxy stretching over 100,000 light-years."
    }
};

// 📌 Info Panel Logic
let lastClickedObject = null;

function showInfoPanelFor(object) {
    const panel = document.getElementById('info-panel');
    const info = objectInfo[object.name?.toLowerCase()];
    if (!info) return;

    // Toggle panel if clicking same object
    if (lastClickedObject === object) {
        panel.classList.remove('open');
        lastClickedObject = null;
        return;
    }

    document.getElementById('info-name').textContent = info.name;
    document.getElementById('info-description').textContent = info.description;

    const infoFacts = document.getElementById('info-facts');
    infoFacts.innerHTML = `<li>${info.fact}</li>`;

    panel.classList.add('open');
    lastClickedObject = object;
}

// 📌 Raycasting Setup
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// 📌 Unified Click Handler (Mouse + Touch)
function handleInteraction(event) {
    if (typeof isLoading !== "undefined" && isLoading) return;
    if (typeof isInteracting !== "undefined" && isInteracting) return;

    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        let clicked = intersects[0].object;
        while (clicked && !clicked.name && clicked.parent) {
            clicked = clicked.parent;
        }

        if (clicked && clicked.name) {
            showInfoPanelFor(clicked);
        }
    }
}

// 📌 Mouse Event (Desktop)
window.addEventListener('click', handleInteraction, false);

// 📌 Touch Events (Mobile)
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
const TAP_DISTANCE_THRESHOLD = 50; // pixels
const TAP_TIME_THRESHOLD = 500; // ms

window.addEventListener('touchstart', (event) => {
    if (event.touches.length > 0) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchStartTime = Date.now();
    }
}, { passive: true });

window.addEventListener('touchend', (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const touchEndTime = Date.now();

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const timeDiff = touchEndTime - touchStartTime;

    if (distance < TAP_DISTANCE_THRESHOLD && timeDiff < TAP_TIME_THRESHOLD) {
        handleInteraction(event);
    }
}, { passive: false });

// 📌 Prevent Long Tap Menu on Mobile
window.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });

// Sun
let sun;
const sunGeom = new THREE.SphereGeometry(10, 64, 64);
const sunPositions = sunGeom.attributes.position;
for (let i = 0; i < sunPositions.count; i++) {
    const vertex = new THREE.Vector3().fromBufferAttribute(sunPositions, i);
    const direction = vertex.clone().normalize();
    const randomOffset = (Math.random() - 0.5) * 0.1;
    vertex.addScaledVector(direction, randomOffset);
    sunPositions.setXYZ(i, vertex.x, vertex.y, vertex.z);
}
sunGeom.computeVertexNormals();
const sunMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    roughness: 0.9,
    metalness: 0,
    emissive: 0xFFD700,
    emissiveIntensity: 0.8
});
sun = new THREE.Mesh(sunGeom, sunMat);
sun.name = 'sun'; // Add name for info panel
sun.position.set(0, 0, 0);
scene.add(sun);
createLabel('Sun', sun.position.clone().add(new THREE.Vector3(0, 12, 0)), 2);

const sunLight = new THREE.PointLight(0xFFD700, 2, 200);
sunLight.position.copy(sun.position);
scene.add(sunLight);

loader.load('https://threejs.org/examples/textures/lensflare/lensflare0.png', (flareTexture) => {
    const spriteMat = new THREE.SpriteMaterial({
        map: flareTexture,
        color: 0xFFD700,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const sunGlow = new THREE.Sprite(spriteMat);
    sunGlow.scale.set(16, 16, 1);
    sunGlow.position.copy(sun.position);
    scene.add(sunGlow);
});

const sunAtmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: { sunColor: { value: new THREE.Color(0xFFA500) }, atmosphereColor: { value: new THREE.Color(0xFFA500) }, intensity: { value: 1.2 } },
    vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform vec3 sunColor;
    uniform vec3 atmosphereColor;
    uniform float intensity;
    varying vec3 vNormal;
    void main() {
      float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      gl_FragColor = vec4(mix(sunColor, atmosphereColor, glow) * intensity, glow * 0.5);
    }
  `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});
const sunAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(10.6, 64, 64), sunAtmosphereMaterial);
scene.add(sunAtmosphere);

// Mercury
let mercury, mercuryLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurymap.jpg', (mercuryTex) => {
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurybump.jpg', (bumpTex) => {
        const geom = new THREE.SphereGeometry(2, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ map: mercuryTex, bumpMap: bumpTex, bumpScale: 0.09, roughness: 0.9, metalness: 0 });
        mercury = new THREE.Mesh(geom, mat);
        mercury.name = 'Mercury'; // Add name for info panel
        mercury.position.set(40, 0, 0);
        scene.add(mercury);
        createLabel('Mercury', mercury.position.clone().add(new THREE.Vector3(0, 3, 0)), 0.8);
        mercuryLight = new THREE.PointLight(0xcccccc, 0.5, 20);
        mercuryLight.position.copy(mercury.position);
        scene.add(mercuryLight);
        const mercuryAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 5);
        mercury.add(mercuryAmbientLight);
    }, undefined, () => {
        const geom = new THREE.SphereGeometry(2, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 });
        mercury = new THREE.Mesh(geom, mat);
        mercury.name = 'Mercury'; // Add name for info panel
        mercury.position.set(40, 0, 0);
        scene.add(mercury);
        createLabel('Mercury', mercury.position.clone().add(new THREE.Vector3(0, 3, 0)), 0.8);
        mercuryLight = new THREE.PointLight(0xcccccc, 0.5, 20);
        mercuryLight.position.copy(mercury.position);
        scene.add(mercuryLight);
        const mercuryAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 5);
        mercury.add(mercuryAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(2, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 });
    mercury = new THREE.Mesh(geom, mat);
    mercury.name = 'Mercury'; // Add name for info panel
    mercury.position.set(40, 0, 0);
    scene.add(mercury);
    createLabel('Mercury', mercury.position.clone().add(new THREE.Vector3(0, 3, 0)), 0.8);
    mercuryLight = new THREE.PointLight(0xcccccc, 0.5, 20);
    mercuryLight.position.copy(mercury.position);
    scene.add(mercuryLight);
    const mercuryAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 5);
    mercury.add(mercuryAmbientLight);
});

// Venus
let venus, venusLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusmap.jpg', (venusTex) => {
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusbump.jpg', (bumpTex) => {
        const geom = new THREE.SphereGeometry(4, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ map: venusTex, bumpMap: bumpTex, bumpScale: 0.09, roughness: 0.8, metalness: 0 });
        venus = new THREE.Mesh(geom, mat);
        venus.name = 'Venus'; // Add name for info panel
        venus.position.set(60, 0, 0);
        scene.add(venus);
        createLabel('Venus', venus.position.clone().add(new THREE.Vector3(0, 5, 0)), 1);
        venusLight = new THREE.PointLight(0xcccccc, 0.5, 30);
        venusLight.position.copy(venus.position);
        scene.add(venusLight);
        const venusAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 8);
        venus.add(venusAmbientLight);
        const venusAtmosphereMat = new THREE.ShaderMaterial({
            uniforms: { atmosphereColor: { value: new THREE.Color(0xFF8C00) }, intensity: { value: 0.3 } },
            vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 atmosphereColor;
        uniform float intensity;
        varying vec3 vNormal;
        void main() {
          float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(atmosphereColor * intensity, glow * 0.3);
        }
      `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const venusAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(4.2, 64, 64), venusAtmosphereMat);
        venus.add(venusAtmosphere);
    }, undefined, () => {
        const geom = new THREE.SphereGeometry(4, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xFF8C00, roughness: 0.8 });
        venus = new THREE.Mesh(geom, mat);
        venus.name = 'Venus'; // Add name for info panel
        venus.position.set(50, 0, 0);
        scene.add(venus);
        createLabel('Venus', venus.position.clone().add(new THREE.Vector3(0, 5, 0)), 1);
        venusLight = new THREE.PointLight(0xcccccc, 0.5, 30);
        venusLight.position.copy(venus.position);
        scene.add(venusLight);
        const venusAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 8);
        venus.add(venusAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(4, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xFF8C00, roughness: 0.8 });
    venus = new THREE.Mesh(geom, mat);
    venus.name = 'Venus'; // Add name for info panel
    venus.position.set(60, 0, 0);
    scene.add(venus);
    createLabel('Venus', venus.position.clone().add(new THREE.Vector3(0, 5, 0)), 1);
    venusLight = new THREE.PointLight(0xcccccc, 0.5, 30);
    venusLight.position.copy(venus.position);
    scene.add(venusLight);
    const venusAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 8);
    venus.add(venusAmbientLight);
});

// Earth
let earth;
loader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg', (texture) => {
    const geom = new THREE.SphereGeometry(6, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0 });
    earth = new THREE.Mesh(geom, mat);
    earth.name = 'earth'; // Add name for info panel
    scene.add(earth);
    createLabel('Earth', earth.position.clone().add(new THREE.Vector3(0, 8, 0)));
    const earthAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 10);
    earth.add(earthAmbientLight);
    const earthAtmosphereMat = new THREE.ShaderMaterial({
        uniforms: { atmosphereColor: { value: new THREE.Color(0x00A3CC) }, intensity: { value: 0.3 } },
        vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform vec3 atmosphereColor;
      uniform float intensity;
      varying vec3 vNormal;
      void main() {
        float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(atmosphereColor * intensity, glow * 0.3);
      }
    `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const earthAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(6.2, 64, 64), earthAtmosphereMat);
    earth.add(earthAtmosphere);
}, undefined, () => {
    const geom = new THREE.SphereGeometry(6, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.8 });
    earth = new THREE.Mesh(geom, mat);
    earth.name = 'earth'; // Add name for info panel
    scene.add(earth);
    createLabel('Earth', earth.position.clone().add(new THREE.Vector3(0, 8, 0)));
    const earthAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 10);
    earth.add(earthAmbientLight);
});

// Moon
let moon, moonLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonmap1k.jpg', (moonTex) => {
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonbump1k.jpg', (bumpTex) => {
        const geom = new THREE.SphereGeometry(1.5, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ map: moonTex, bumpMap: bumpTex, bumpScale: 0.09, roughness: 1, metalness: 0 });
        moon = new THREE.Mesh(geom, mat);
        moon.name = 'moon'; // Add name for info panel
        moon.position.set(9, 0, 0);
        scene.add(moon);
        createLabel('Moon', moon.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0.5);
        moonLight = new THREE.PointLight(0xcccccc, 0.8, 55);
        moonLight.position.copy(moon.position);
        scene.add(moonLight);
        const moonAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 3);
        moon.add(moonAmbientLight);
    }, undefined, () => {
        const geom = new THREE.SphereGeometry(1.5, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 1 });
        moon = new THREE.Mesh(geom, mat);
        moon.name = 'moon'; // Add name for info panel
        moon.position.set(9, 0, 0);
        scene.add(moon);
        createLabel('Moon', moon.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0.5);
        moonLight = new THREE.PointLight(0xcccccc, 0.6, 20);
        moonLight.position.copy(moon.position);
        scene.add(moonLight);
        const moonAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 3);
        moon.add(moonAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(1.5, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 1 });
    moon = new THREE.Mesh(geom, mat);
    moon.name = 'moon'; // Add name for info panel
    moon.position.set(9, 0, 0);
    scene.add(moon);
    createLabel('Moon', moon.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0.5);
    moonLight = new THREE.PointLight(0xcccccc, 0.6, 20);
    moonLight.position.copy(moon.position);
    scene.add(moonLight);
    const moonAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 3);
    moon.add(moonAmbientLight);
});

// Mars
let mars, marsLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg', (marsTex) => {
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsbump1k.jpg', (bumpTex) => {
        const geom = new THREE.SphereGeometry(3, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ map: marsTex, bumpMap: bumpTex, bumpScale: 0.09, roughness: 0.7, metalness: 0 });
        mars = new THREE.Mesh(geom, mat);
        mars.name = 'mars'; // Add name for info panel
        mars.position.set(100, 0, 0);
        scene.add(mars);
        createLabel('Mars', mars.position.clone().add(new THREE.Vector3(0, 4, 0)), 1);
        marsLight = new THREE.PointLight(0xcccccc, 0.5, 35);
        marsLight.position.copy(mars.position);
        scene.add(marsLight);
        const marsAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 7);
        mars.add(marsAmbientLight);
    }, undefined, () => {
        const geom = new THREE.SphereGeometry(3, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4040, roughness: 0.8 });
        mars = new THREE.Mesh(geom, mat);
        mars.name = 'mars'; // Add name for info panel
        mars.position.set(140, 0, 0);
        scene.add(mars);
        createLabel('Mars', mars.position.clone().add(new THREE.Vector3(0, 4, 0)), 1);
        marsLight = new THREE.PointLight(0xcccccc, 0.5, 25);
        marsLight.position.copy(mars.position);
        scene.add(marsLight);
        const marsAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 7);
        mars.add(marsAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(3, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff4040, roughness: 0.8 });
    mars = new THREE.Mesh(geom, mat);
    mars.name = 'mars'; // Add name for info panel
    mars.position.set(140, 0, 0);
    scene.add(mars);
    createLabel('Mars', mars.position.clone().add(new THREE.Vector3(0, 4, 0)), 1);
    marsLight = new THREE.PointLight(0xcccccc, 0.5, 25);
    marsLight.position.copy(mars.position);
    scene.add(marsLight);
    const marsAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 7);
    mars.add(marsAmbientLight);
});

// Mars Moons
let phobos, deimos;
loader.load('https://i.ibb.co/BH1prqs/photo-stone-texture-pattern-58702-16107.jpg', (texture) => {
    const phobosGeom = new THREE.IcosahedronGeometry(0.5, 4);
    const phobosMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0, emissive: 0x555555, emissiveIntensity: 0.3 });
    phobos = new THREE.Mesh(phobosGeom, phobosMat);
    phobos.name = 'phobos'; // Add name for info panel
    phobos.position.set(94.5, 0, 0);
    scene.add(phobos);
    createLabel('Phobos', phobos.position.clone().add(new THREE.Vector3(0, 1, 0)), 0.3);
    const phobosAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
    phobos.add(phobosAmbientLight);
    
    const deimosGeom = new THREE.IcosahedronGeometry(0.3, 4);
    const deimosMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0, emissive: 0x555555, emissiveIntensity: 0.3 });
    deimos = new THREE.Mesh(deimosGeom, deimosMat);
    deimos.name = 'deimos'; // Add name for info panel
    deimos.position.set(96.8, 0, 0);
    scene.add(deimos);
    createLabel('Deimos', deimos.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.2);
    const deimosAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
    deimos.add(deimosAmbientLight);
}, undefined, () => {
    const phobosGeom = new THREE.IcosahedronGeometry(0.5, 4);
    const phobosMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1, emissive: 0x555555, emissiveIntensity: 0.3 });
    phobos = new THREE.Mesh(phobosGeom, phobosMat);
    phobos.name = 'phobos'; // Add name for info panel
    phobos.position.set(94.5, 0, 0);
    scene.add(phobos);
    createLabel('Phobos', phobos.position.clone().add(new THREE.Vector3(0, 1, 0)), 0.3);
    const phobosAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
    phobos.add(phobosAmbientLight);
    
    const deimosGeom = new THREE.IcosahedronGeometry(0.3, 4);
    const deimosMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1, emissive: 0x555555, emissiveIntensity: 0.3 });
    deimos = new THREE.Mesh(deimosGeom, deimosMat);
    deimos.name = 'deimos'; // Add name for info panel
    deimos.position.set(96.8, 0, 0);
    scene.add(deimos);
    createLabel('Deimos', deimos.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.2);
    const deimosAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
    deimos.add(deimosAmbientLight);
});

// Jupiter
let jupiter, jupiterLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/jupitermap.jpg', (jupiterTex) => {
    const geom = new THREE.SphereGeometry(8, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ map: jupiterTex, roughness: 0.7, metalness: 0 });
    jupiter = new THREE.Mesh(geom, mat);
    jupiter.name = 'jupiter'; // Add name for info panel
    jupiter.position.set(190, 0, 0);
    scene.add(jupiter);
    createLabel('Jupiter', jupiter.position.clone().add(new THREE.Vector3(0, 10, 0)), 1.5);
    jupiterLight = new THREE.PointLight(0xcccccc, 0.5, 50);
    jupiterLight.position.copy(jupiter.position);
    scene.add(jupiterLight);
    const jupiterAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 12);
    jupiter.add(jupiterAmbientLight);
    const jupiterAtmosphereMat = new THREE.ShaderMaterial({
        uniforms: { atmosphereColor: { value: new THREE.Color(0xcc7a00) }, intensity: { value: 0.2 } },
        vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform vec3 atmosphereColor;
      uniform float intensity;
      varying vec3 vNormal;
      void main() {
        float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(atmosphereColor * intensity, glow * 0.2);
      }
    `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const jupiterAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(8.3, 64, 64), jupiterAtmosphereMat);
    jupiter.add(jupiterAtmosphere);
}, undefined, () => {
    const geom = new THREE.SphereGeometry(8, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xcc7a00, roughness: 0.7 });
    jupiter = new THREE.Mesh(geom, mat);
    jupiter.name = 'jupiter'; // Add name for info panel
    jupiter.position.set(190, 0, 0);
    scene.add(jupiter);
    createLabel('Jupiter', jupiter.position.clone().add(new THREE.Vector3(0, 10, 0)), 1.5);
    jupiterLight = new THREE.PointLight(0xcccccc, 0.5, 50);
    jupiterLight.position.copy(jupiter.position);
    scene.add(jupiterLight);
    const jupiterAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 12);
    jupiter.add(jupiterAmbientLight);
});

// Saturn
let saturn, saturnLight, titan;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnmap.jpg', (saturnTex) => {
    const geom = new THREE.SphereGeometry(9, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ map: saturnTex, roughness: 0.7, metalness: 0 });
    saturn = new THREE.Mesh(geom, mat);
    saturn.name = 'saturn'; // Add name for info panel
    saturn.position.set(240, 0, 0);
    scene.add(saturn);
    createLabel('Saturn', saturn.position.clone().add(new THREE.Vector3(0, 11, 0)), 1.5);
    saturnLight = new THREE.PointLight(0xcccccc, 0.5, 60);
    saturnLight.position.copy(saturn.position);
    scene.add(saturnLight);
    const saturnAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 14);
    saturn.add(saturnAmbientLight);
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnringcolor.jpg', (ringTex) => {
        loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnringpattern.png', (alphaTex) => {
            const ringGeom = new THREE.RingGeometry(10, 16, 64, 1);
            const ringMat = new THREE.MeshStandardMaterial({
                map: ringTex,
                alphaMap: alphaTex,
                side: THREE.DoubleSide,
                transparent: true,
                roughness: 0.8,
                metalness: 0.2,
                opacity: 0.9
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2.2;
            ring.scale.set(1, 1, 0.1);
            saturn.add(ring);
        }, undefined, (error) => {
            console.error('Error loading Saturn ring alpha texture:', error);
            const ringGeom = new THREE.RingGeometry(10, 16, 64, 1);
            const ringMat = new THREE.MeshStandardMaterial({
                map: ringTex,
                side: THREE.DoubleSide,
                transparent: true,
                roughness: 0.8,
                metalness: 0.2,
                opacity: 0.9
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2.2;
            ring.scale.set(1, 1, 0.1);
            saturn.add(ring);
        });
    }, undefined, (error) => {
        console.error('Error loading Saturn ring color texture:', error);
        const ringGeom = new THREE.RingGeometry(10, 16, 64, 1);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xD4A880,
            side: THREE.DoubleSide,
            transparent: true,
            roughness: 0.8,
            metalness: 0.2,
            opacity: 0.9
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2.2;
        ring.scale.set(1, 1, 0.1);
        saturn.add(ring);
    });
    loader.load('https://i.ibb.co/BH1prqs/photo-stone-texture-pattern-58702-16107.jpg', (titanTex) => {
        const titanGeom = new THREE.SphereGeometry(3, 48, 48);
        const titanMat = new THREE.MeshStandardMaterial({ map: titanTex, roughness: 1, metalness: 0, emissive: 0x555555, emissiveIntensity: 0.3 });
        titan = new THREE.Mesh(titanGeom, titanMat);
        titan.name = 'titan'; // Add name for info panel
        titan.position.set(150, 0, 0);
        scene.add(titan);
        createLabel('Titan', titan.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.3);
        const titanAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
        titan.add(titanAmbientLight);
    }, undefined, () => {
        const titanGeom = new THREE.SphereGeometry(1.9, 32, 32);
        const titanMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 1, emissive: 0x555555, emissiveIntensity: 0.3 });
        titan = new THREE.Mesh(titanGeom, titanMat);
        titan.name = 'titan'; // Add name for info panel
        titan.position.set(150, 0, 0);
        scene.add(titan);
        createLabel('Titan', titan.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.3);
        const titanAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
        titan.add(titanAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(0.9, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xD4A880, roughness: 0.7 });
    saturn = new THREE.Mesh(geom, mat);
    saturn.name = 'saturn'; // Add name for info panel
    saturn.position.set(140, 0, 0);
    scene.add(saturn);
    createLabel('Saturn', saturn.position.clone().add(new THREE.Vector3(0, 11, 0)), 1.5);
    saturnLight = new THREE.PointLight(0xcccccc, 0.5, 60);
    saturnLight.position.copy(saturn.position);
    scene.add(saturnLight);
    const saturnAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 14);
    saturn.add(saturnAmbientLight);
});
    
    // Orbital Paths
    function createOrbit(semiMajor, eccentricity, segments = 256, color = 0x00D4FF) {
      const points = [];
      const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity);
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = semiMajor * Math.cos(theta) - semiMajor * eccentricity;
        const z = semiMinor * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0, z));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineDashedMaterial({ color: color, dashSize: 0.5, gapSize: 0.5, transparent: true, opacity: 0.6 });
      const orbit = new THREE.Line(geom, mat);
      orbit.computeLineDistances();
      orbit.userData.isOrbit = true;
      orbit.visible = showOrbits;
      scene.add(orbit);
      return orbit;
    }

    const mercuryOrbit = createOrbit(40, 0.2056, 256, 0xB0BEC5);
    const venusOrbit = createOrbit(60, 0.0067, 256, 0xFF8C00);
    const earthOrbit = createOrbit(90, 0.0167, 256, 0x4682B4);
    const marsOrbit = createOrbit(140, 0.0934, 256, 0x8B0000);
    const jupiterOrbit = createOrbit(190, 0.0489, 256, 0xDAA520);
    const saturnOrbit = createOrbit(240, 0.0557, 256, 0xD4A880);
    const moonOrbit = createOrbit(9, 0.0549, 256, 0xA9A9A9);
    moonOrbit.position.copy(earth ? earth.position : new THREE.Vector3(0, 0, 0));
    const phobosOrbit = createOrbit(4.5, 0.0151, 256, 0x696969);
    phobosOrbit.position.copy(mars ? mars.position : new THREE.Vector3(0, 0, 0));
    const deimosOrbit = createOrbit(6.8, 0.0002, 256, 0x696969);
    deimosOrbit.position.copy(mars ? mars.position : new THREE.Vector3(0, 0, 0));
    const titanOrbit = createOrbit(18, 0.0288, 256, 0xC0C0C0);
    titanOrbit.position.copy(saturn ? saturn.position : new THREE.Vector3(0, 0, 0));

    // Stars
    const starCountMain = 20000;
    const starSpread = 10000;
    const starGeometryMain = new THREE.BufferGeometry();
    const starPositionsMain = new Float32Array(starCountMain * 3);
    const starPhasesMain = new Float32Array(starCountMain);
    for (let i = 0; i < starCountMain; i++) {
      starPositionsMain[i * 3] = (Math.random() - 0.5) * starSpread;
      starPositionsMain[i * 3 + 1] = (Math.random() - 0.5) * starSpread;
      starPositionsMain[i * 3 + 2] = (Math.random() - 0.5) * starSpread;
      starPhasesMain[i] = Math.random() * Math.PI * 2;
    }
    starGeometryMain.setAttribute('position', new THREE.BufferAttribute(starPositionsMain, 3));
    starGeometryMain.setAttribute('phase', new THREE.BufferAttribute(starPhasesMain, 1));

    const starShaderMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float phase;
        uniform float time;
        varying float vOpacity;
        varying float vSize;
        void main() {
          vOpacity = 0.8 + 0.3 * sin(mod(time, 100.0) + phase);
          vSize = 0.5 + 0.4 * sin(mod(time, 100.0) + phase);
          gl_PointSize = vSize * 2.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity);
        }
      `,
      transparent: true
    });
    const starSystem = new THREE.Points(starGeometryMain, starShaderMaterial);
    scene.add(starSystem);
    
// Ensure scene and createLabel are defined in your global context
if (typeof scene === 'undefined') {
    console.error('Scene is undefined. Ensure THREE.Scene is initialized.');
}
if (typeof createLabel === 'undefined') {
    console.warn('createLabel is undefined. Define a function to create labels or remove the call.');
    function createLabel(text, position, size) {
        // Placeholder: Log label creation
        console.log(`Creating label: ${text} at ${position.x}, ${position.y}, ${position.z}`);
    }
}

// Defining the Milky Way sub star system
const milkyWayGroup = new THREE.Group();
const milkyWayRadius = 4000; // Distance from the Sun
const milkyWayDiskRadius = 300; // Middle disk radius
const outerDiskRadius = 700; // Outer disk radius
const milkyWayStarsCount = 2500; // Middle spiral arm stars
const outerStarsCount = 4300; // Outer spiral arm stars
const backgroundStarsCount = 25000; // Blank space stars
const haloStarsCount = 300; // Stellar halo stars
const middleDiskThickness = 10; // Thin middle layer
const outerDiskThickness = 15; // Thicker outer layer
const spiralArms = 4; // Number of spiral arms
const armTightness = 3.4; // Increased for tighter, cyclone-like spirals

// Background Stars for Middle Greenish Layer
const backgroundStarsGeometry = new THREE.BufferGeometry();
const backgroundStarsPositions = new Float32Array(backgroundStarsCount * 3);
const backgroundStarsPhases = new Float32Array(backgroundStarsCount);
const backgroundStarsColors = new Float32Array(backgroundStarsCount * 3);
const backgroundStarsSizes = new Float32Array(backgroundStarsCount);
for (let i = 0; i < backgroundStarsCount; i++) {
    const r = Math.sqrt(Math.random()) * milkyWayDiskRadius * 1.2;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * middleDiskThickness * (1 - r / milkyWayDiskRadius);
    backgroundStarsPositions[i * 3] = x;
    backgroundStarsPositions[i * 3 + 1] = y;
    backgroundStarsPositions[i * 3 + 2] = z;
    backgroundStarsPhases[i] = Math.random() * Math.PI * 2;
    // Assign greenish color (#33CC99)
    backgroundStarsColors[i * 3] = 75.0 / 255; // R
    backgroundStarsColors[i * 3 + 1] = 0.0 / 255; // G
    backgroundStarsColors[i * 3 + 2] = 130.0 / 255; // B
    backgroundStarsSizes[i] = 0.5 + Math.random() * 0.6;
}
backgroundStarsGeometry.setAttribute('position', new THREE.BufferAttribute(backgroundStarsPositions, 3));
backgroundStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(backgroundStarsPhases, 1));
backgroundStarsGeometry.setAttribute('color', new THREE.BufferAttribute(backgroundStarsColors, 3));
backgroundStarsGeometry.setAttribute('size', new THREE.BufferAttribute(backgroundStarsSizes, 1));
const backgroundStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.3 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (1.5 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float dist = length(vPosition.xz);
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.1, 6.28318530718);
            float brightness = 0.8 + 0.2 * sin(rotation * 2.0);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const backgroundStars = new THREE.Points(backgroundStarsGeometry, backgroundStarsMaterial);
milkyWayGroup.add(backgroundStars);

// Middle Greenish Layer (Spiral Stars)
const milkyWayStarsGeometry = new THREE.BufferGeometry();
const milkyWayStarsPositions = new Float32Array(milkyWayStarsCount * 3);
const milkyWayStarsPhases = new Float32Array(milkyWayStarsCount);
const milkyWayStarsColors = new Float32Array(milkyWayStarsCount * 3);
const milkyWayStarsSizes = new Float32Array(milkyWayStarsCount);
for (let i = 0; i < milkyWayStarsCount; i++) {
    const arm = Math.floor(Math.random() * spiralArms);
    const r = Math.sqrt(Math.random()) * milkyWayDiskRadius;
    const baseTheta = arm * (Math.PI * 2 / spiralArms) + Math.log(1 + r * armTightness * 0.019) * 1.7;
    const density = (Math.sin(baseTheta * spiralArms * 1.4) + 1.3) * 0.8; // Sharper density for cyclone effect
    if (Math.random() > density * 0.4) continue; // Tighter star placement
    const theta = baseTheta + (Math.random() - 0.5) * 0.4; // Reduced spread for defined arms
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * middleDiskThickness * (1 - r / milkyWayDiskRadius);
    milkyWayStarsPositions[i * 3] = x;
    milkyWayStarsPositions[i * 3 + 1] = y;
    milkyWayStarsPositions[i * 3 + 2] = z;
    milkyWayStarsPhases[i] = Math.random() * Math.PI * 2;
    // Assign green color for spiral ends (#00FF99), greenish base (#33CC99) elsewhere
    const isSpiralEnd = r > milkyWayDiskRadius * 0.8;
    milkyWayStarsColors[i * 3] = isSpiralEnd ? 75.0 / 255 : 147.0 / 255; // R
    milkyWayStarsColors[i * 3 + 1] = isSpiralEnd ? 0.0 / 255 : 112.0 / 255; // G
    milkyWayStarsColors[i * 3 + 2] = isSpiralEnd ? 130.0 / 255 : 219.0 / 255; // B
    milkyWayStarsSizes[i] = 0.7 + Math.random() * 0.7;
}
milkyWayStarsGeometry.setAttribute('position', new THREE.BufferAttribute(milkyWayStarsPositions, 3));
milkyWayStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(milkyWayStarsPhases, 1));
milkyWayStarsGeometry.setAttribute('color', new THREE.BufferAttribute(milkyWayStarsColors, 3));
milkyWayStarsGeometry.setAttribute('size', new THREE.BufferAttribute(milkyWayStarsSizes, 1));
const milkyWayStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.5 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            pos.x += cos(theta) * sin(time * 0.2 + phase) * 2.0;
            pos.z += sin(theta) * sin(time * 0.2 + phase) * 2.0;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (2.5 + 1.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const milkyWayStars = new THREE.Points(milkyWayStarsGeometry, milkyWayStarsMaterial);
milkyWayGroup.add(milkyWayStars);

// Middle Greenish Gas with Enhanced Gaseous Atmosphere
const gasGeometry = new THREE.PlaneGeometry(milkyWayDiskRadius * 2.8, milkyWayDiskRadius * 2.8, 128, 128);
const gasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0xC71585) }, // Greenish
        intensity: { value: 1.1 } // Increased for visibility
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float turbulence(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${spiralArms}.0 + dist * 0.02 - time * 0.3) * 0.5 + 0.7; // Sharper spiral
            float rotation = mod(theta - time * 0.15, 6.28318530718);
            float cloud = turbulence(vPosition.xy * 0.008 + vec2(cos(rotation), sin(rotation)) * 0.15); // Denser clouds
            float dust = turbulence(vPosition.xy * 0.015 + vec2(cos(theta * ${spiralArms}.0), sin(theta * ${spiralArms}.0)) * 0.07);
            float dustEffect = smoothstep(0.2, 0.5, dust) * 0.6; // Softer dust for visibility
            float glow = exp(-dist * 0.0015) * spiral * (0.7 + 0.3 * cloud) * (1.2 - dustEffect);
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.4); // Increased opacity
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const milkyWayGas = new THREE.Mesh(gasGeometry, gasMaterial);
milkyWayGas.position.y = -1;
milkyWayGas.renderOrder = 1;
milkyWayGroup.add(milkyWayGas);

// Nebular Glow for Spiral Arms (Middle Layer)
const nebulaGeometry = new THREE.PlaneGeometry(milkyWayDiskRadius * 2.4, milkyWayDiskRadius * 2.4, 128, 128);
const nebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        nebulaColor: { value: new THREE.Color(0xD4A017) }, // Green for spiral ends
        intensity: { value: 1.5 } // Increased for visibility
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 nebulaColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float turbulence(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${spiralArms}.0 + dist * 0.02 - time * 0.2) * 0.5 + 0.5; // Sharper spiral
            float cloud = turbulence(vPosition.xy * 0.01 + vec2(cos(time * 0.05), sin(time * 0.05)) * 0.15);
            float glow = exp(-dist * 0.0015) * spiral * (0.6 + 0.4 * cloud);
            gl_FragColor = vec4(nebulaColor * intensity * glow, glow * 0.4); // Increased opacity
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const nebulaGlow = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
nebulaGlow.position.y = 0;
nebulaGlow.renderOrder = 2;
milkyWayGroup.add(nebulaGlow);

// Background Stars for Outer Dark Blue Layer
const outerBackgroundStarsGeometry = new THREE.BufferGeometry();
const outerBackgroundStarsPositions = new Float32Array(backgroundStarsCount * 3);
const outerBackgroundStarsPhases = new Float32Array(backgroundStarsCount);
const outerBackgroundStarsColors = new Float32Array(backgroundStarsCount * 3);
const outerBackgroundStarsSizes = new Float32Array(backgroundStarsCount);
for (let i = 0; i < backgroundStarsCount; i++) {
    const r = Math.sqrt(Math.random()) * outerDiskRadius * 1.4;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * outerDiskThickness * (1 - r / outerDiskRadius);
    outerBackgroundStarsPositions[i * 3] = x;
    outerBackgroundStarsPositions[i * 3 + 1] = y;
    outerBackgroundStarsPositions[i * 3 + 2] = z;
    outerBackgroundStarsPhases[i] = Math.random() * Math.PI * 2;
    // Assign dark blue color (#003366)
    outerBackgroundStarsColors[i * 3] = 25.0 / 255; // R
    outerBackgroundStarsColors[i * 3 + 1] = 25.0 / 255; // G
    outerBackgroundStarsColors[i * 3 + 2] = 112.0 / 255; // B
    outerBackgroundStarsSizes[i] = 0.6 + Math.random() * 0.7;
}
outerBackgroundStarsGeometry.setAttribute('position', new THREE.BufferAttribute(outerBackgroundStarsPositions, 3));
outerBackgroundStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(outerBackgroundStarsPhases, 1));
outerBackgroundStarsGeometry.setAttribute('color', new THREE.BufferAttribute(outerBackgroundStarsColors, 3));
outerBackgroundStarsGeometry.setAttribute('size', new THREE.BufferAttribute(outerBackgroundStarsSizes, 1));
const outerBackgroundStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.15, 1.0);
            vOpacity = (0.35 + 0.45 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (1.6 + 0.6 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float dist = length(vPosition.xz);
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.08, 6.28318530718);
            float brightness = 0.85 + 0.15 * sin(rotation * 2.0);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const outerBackgroundStars = new THREE.Points(outerBackgroundStarsGeometry, outerBackgroundStarsMaterial);
milkyWayGroup.add(outerBackgroundStars);

// Outer Dark Blue Layer (Spiral Stars)
const outerStarsGeometry = new THREE.BufferGeometry();
const outerStarsPositions = new Float32Array(outerStarsCount * 3);
const outerStarsPhases = new Float32Array(outerStarsCount);
const outerStarsColors = new Float32Array(outerStarsCount * 3);
const outerStarsSizes = new Float32Array(outerStarsCount);
for (let i = 0; i < outerStarsCount; i++) {
    const arm = Math.floor(Math.random() * spiralArms);
    const r = Math.sqrt(Math.random()) * outerDiskRadius;
    const baseTheta = arm * (Math.PI * 2 / spiralArms) + Math.log(1 + r * armTightness * 0.018) * 1.8;
    const density = (Math.sin(baseTheta * spiralArms * 1.5) + 1.4) * 0.9; // Sharper density
    if (Math.random() > density * 0.4) continue; // Tighter star placement
    const theta = baseTheta + (Math.random() - 0.5) * 0.3; // Reduced spread
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * outerDiskThickness * (1 - r / outerDiskRadius);
    outerStarsPositions[i * 3] = x;
    outerStarsPositions[i * 3 + 1] = y;
    outerStarsPositions[i * 3 + 2] = z;
    outerStarsPhases[i] = Math.random() * Math.PI * 2;
    // Assign dark blue color (#003366)
    outerStarsColors[i * 3] = 70.0 / 255; // R
    outerStarsColors[i * 3 + 1] = 130.0 / 255; // G
    outerStarsColors[i * 3 + 2] = 180.0 / 255; // B
    outerStarsSizes[i] = 0.7 + Math.random() * 0.7;
}
outerStarsGeometry.setAttribute('position', new THREE.BufferAttribute(outerStarsPositions, 3));
outerStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(outerStarsPhases, 1));
outerStarsGeometry.setAttribute('color', new THREE.BufferAttribute(outerStarsColors, 3));
outerStarsGeometry.setAttribute('size', new THREE.BufferAttribute(outerStarsSizes, 1));
const outerStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.15, 1.0);
            vOpacity = (0.45 + 0.45 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            pos.x += cos(theta) * sin(time * 0.15 + phase) * 2.0;
            pos.z += sin(theta) * sin(time * 0.15 + phase) * 2.0;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (2.0 + 1.2 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const outerStars = new THREE.Points(outerStarsGeometry, outerStarsMaterial);
milkyWayGroup.add(outerStars);

// Outer Dark Blue Gas with Enhanced Gaseous Atmosphere
const outerGasGeometry = new THREE.PlaneGeometry(outerDiskRadius * 2.9, outerDiskRadius * 2.9, 128, 128);
const outerGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0x191970) }, // Dark blue
        intensity: { value: 0.85 } // Increased for visibility
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float turbulence(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${spiralArms}.0 + dist * 0.015 - time * 0.25) * 0.6 + 0.7; // Sharper spiral
            float rotation = mod(theta - time * 0.1, 6.28318530718);
            float cloud = turbulence(vPosition.xy * 0.006 + vec2(cos(rotation), sin(rotation)) * 0.32); // Denser clouds
            float dust = turbulence(vPosition.xy * 0.012 + vec2(cos(theta * ${spiralArms}.0), sin(theta * ${spiralArms}.0)) * 0.06);
            float dustEffect = smoothstep(0.2, 0.7, dust) * 0.7; // Softer dust
            float glow = exp(-dist * 0.001) * spiral * (0.6 + 0.5 * cloud) * (1.4 - dustEffect);
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.6); // Increased opacity
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const outerGas = new THREE.Mesh(outerGasGeometry, outerGasMaterial);
outerGas.position.y = -1;
outerGas.renderOrder = 3;
milkyWayGroup.add(outerGas);

// Nebular Glow for Spiral Arms (Outer Layer)
const outerNebulaGeometry = new THREE.PlaneGeometry(outerDiskRadius * 2.5, outerDiskRadius * 2.5, 128, 128);
const outerNebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        nebulaColor: { value: new THREE.Color(0xFF0000) }, // Dark blue
        intensity: { value: 0.45 } // Increased for visibility
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 nebulaColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float turbulence(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${spiralArms}.0 + dist * 0.015 - time * 0.16) * 0.5 + 0.7; // Sharper spiral
            float cloud = turbulence(vPosition.xy * 0.008 + vec2(cos(time * 0.04), sin(time * 0.04)) * 0.15);
            float glow = exp(-dist * 0.001) * spiral * (0.5 + 0.5 * cloud);
            gl_FragColor = vec4(nebulaColor * intensity * glow, glow * 0.5); // Increased opacity
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const outerNebulaGlow = new THREE.Mesh(outerNebulaGeometry, outerNebulaMaterial);
outerNebulaGlow.position.y = 0;
outerNebulaGlow.renderOrder = 4;
milkyWayGroup.add(outerNebulaGlow);

// Stellar Halo with Enhanced 3D Effect
const haloGeometry = new THREE.BufferGeometry();
const haloPositions = new Float32Array(haloStarsCount * 3);
const haloPhases = new Float32Array(haloStarsCount);
const haloColors = new Float32Array(haloStarsCount * 3);
const haloSizes = new Float32Array(haloStarsCount);
for (let i = 0; i < haloStarsCount; i++) {
    const r = Math.pow(Math.random(), 2.0) * outerDiskRadius * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    const z = r * Math.cos(phi);
    haloPositions[i * 3] = x;
    haloPositions[i * 3 + 1] = y;
    haloPositions[i * 3 + 2] = z;
    haloPhases[i] = Math.random() * Math.PI * 2;
    // Base color for halo (white, modified in shader for rainbow effect)
    haloColors[i * 3] = 1.2;
    haloColors[i * 3 + 1] = 1.1;
    haloColors[i * 3 + 2] = 1.9;
    haloSizes[i] = 0.8 + Math.random() * 1.9 // Larger sizes for prominence
}
haloGeometry.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
haloGeometry.setAttribute('phase', new THREE.BufferAttribute(haloPhases, 1));
haloGeometry.setAttribute('color', new THREE.BufferAttribute(haloColors, 3));
haloGeometry.setAttribute('size', new THREE.BufferAttribute(haloSizes, 1));
const haloMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.2, 1.0);
            vOpacity = (0.2 + 0.3 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            float phi = acos(position.y / length(position));
            pos.x += sin(time * 0.5 + phase) * 2.7 * sin(phi); // 3D displacement
            pos.y += cos(time * 0.5 + phase) * 2.5 * sin(phi);
            pos.z += sin(time * 0.5 + phase) * 2.2 * cos(phi);
            gl_PointSize = size * (1.5 + 0.8 * sin(mod(time, 100.0) + phase)) * distFactor * 3.4; // Larger points
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.6);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        void main() {
            float theta = atan(vPosition.z, vPosition.x);
            float hue = mod(theta + time * 0.8, 6.28318530718) / 6.283185307 eighteen; // Faster hue cycle
            vec3 rainbowColor = hsv2rgb(vec3(hue, 0.9, 1.3)); // Higher saturation
            float brightness = 0.9 + 0.2 * sin(theta * 2.0 + time * 1.8); // Dynamic flares
            gl_FragColor = vec4(rainbowColor * brightness, vOpacity * brightness * 0.97);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const milkyWayHalo = new THREE.Points(haloGeometry, haloMaterial);
milkyWayHalo.renderOrder = 0;
milkyWayGroup.add(milkyWayHalo);

// Central Bulge (Purple)
const bulgeStarsCount = 5000;
const bulgeRadius = 100;
const bulgeGeometry = new THREE.BufferGeometry();
const bulgePositions = new Float32Array(bulgeStarsCount * 3);
const bulgePhases = new Float32Array(bulgeStarsCount);
const bulgeColors = new Float32Array(bulgeStarsCount * 3);
const bulgeSizes = new Float32Array(bulgeStarsCount);
for (let i = 0; i < bulgeStarsCount; i++) {
    const r = Math.pow(Math.random(), 1.5) * bulgeRadius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.4;
    const z = r * Math.cos(phi);
    bulgePositions[i * 3] = x;
    bulgePositions[i * 3 + 1] = y;
    bulgePositions[i * 3 + 2] = z;
    bulgePhases[i] = Math.random() * Math.PI * 2;
    // Assign purple color (#660066)
    bulgeColors[i * 3] = 255.0 / 255; // R
    bulgeColors[i * 3 + 1] = 140.0 / 255; // G
    bulgeColors[i * 3 + 2] = 0.0 / 255; // B
    bulgeSizes[i] = 1.0 + Math.random() * 1.4;
}
bulgeGeometry.setAttribute('position', new THREE.BufferAttribute(bulgePositions, 3));
bulgeGeometry.setAttribute('phase', new THREE.BufferAttribute(bulgePhases, 1));
bulgeGeometry.setAttribute('color', new THREE.BufferAttribute(bulgeColors, 3));
bulgeGeometry.setAttribute('size', new THREE.BufferAttribute(bulgeSizes, 1));
const bulgeMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.15, 1.2);
            vOpacity = (0.6 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.2;
            gl_PointSize = size * (3.0 + 1.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.3);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.2, 6.28318530718);
            float brightness = 0.9 + 0.1 * sin(rotation * 2.4);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const milkyWayBulge = new THREE.Points(bulgeGeometry, bulgeMaterial);
milkyWayBulge.renderOrder = 0;
milkyWayGroup.add(milkyWayBulge);

// 🎯 Invisible and Non-Rendering Clickable Object for Bulge
const bulgeClickableGeom = new THREE.SphereGeometry(800, 64, 64);
const bulgeClickableMat = new THREE.MeshBasicMaterial({ visible: false }); // Completely non-rendering
const bulgeClickableObject = new THREE.Mesh(bulgeClickableGeom, bulgeClickableMat);
bulgeClickableObject.name = 'milkyway';
bulgeClickableObject.position.set(0, 0, 0);
milkyWayGroup.add(bulgeClickableObject);

// Central Gas Glow with Accretion Disk Effect
const coreGasGeometry = new THREE.SphereGeometry(90, 32, 32);
const coreGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0xDC143C) }, // Purple
        accretionColor: { value: new THREE.Color(0xD4A017) }, // Blue for accretion disk
        intensity: { value: 2.6 }
    },
    vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform vec3 accretionColor;
        uniform float intensity;
        varying vec3 vPosition;
        varying vec3 vNormal;
        float noise(vec3 p) {
            return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }
        float turbulence(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            vec3 shift = vec3(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition);
            float theta = atan(vPosition.y, vPosition.x);
            float rotation = mod(theta - time * 0.3, 6.28318530718);
            float spiral = sin(theta * 2.0 - dist * 0.1 + rotation) * 0.5 + 0.5;
            float cloud = turbulence(vPosition * 0.02 + vec3(cos(rotation), sin(rotation), 0.0) * 0.1);
            float pulse = 0.8 + 0.2 * sin(time * 0.5);
            float accretion = smoothstep(0.8, 1.0, abs(vNormal.z));
            vec3 finalColor = mix(gasColor, accretionColor, accretion * 0.3);
            float glow = exp(-dist * 0.02) * (0.5 + 0.5 * cloud) * spiral * pulse;
            gl_FragColor = vec4(finalColor * intensity * glow, glow * 0.5);
        }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const coreGas = new THREE.Mesh(coreGasGeometry, coreGasMaterial);
coreGas.position.y = 0;
coreGas.renderOrder = 5;
milkyWayGroup.add(coreGas);

// Positioning and Slanting the Milky Way
milkyWayGroup.position.set(milkyWayRadius, 0, 0);
milkyWayGroup.rotation.x = Math.PI / 6.6;
milkyWayGroup.rotation.z = Math.PI / 8;
scene.add(milkyWayGroup);
createLabel('Milky Way', milkyWayGroup.position.clone().add(new THREE.Vector3(0, 200, 0)), 3);
// Defining the Andromeda Galaxy (M31) with realistic colors, layers, and distance-based dispersion
const andromedaGroup = new THREE.Group();
const andromedaRadius = 5000; // Slightly farther than Milky Way for visual distinction
const andromedaDiskRadius = 600; // Larger than Milky Way (500 units) to reflect ~1.5x size
const andromedaOuterDiskRadius = 840; // Scaled proportionally (700 * 1.2)
const andromedaStarsCount = 9800; // Slightly more stars in spiral arms
const andromedaOuterStarsCount = 10000; // Outer spiral arms
const andromedaBackgroundStarsCount = 20000; // Background stars
const andromedaHaloStarsCount = 1000; // Stellar halo
const andromedaMiddleDiskThickness = 15; // Slightly thicker middle layer
const andromedaOuterDiskThickness = 25; // Scaled outer layer
const andromedaSpiralArms = 5; // Andromeda has two prominent spiral arms
const andromedaArmTightness = 1.1; // Slightly looser spirals for a different look
const andromedaBarLength = 45; // Length of the central bar

// Background Stars for Middle Blue Layer (Andromeda's Spiral Arms)
const andromedaBackgroundStarsGeometry = new THREE.BufferGeometry();
const andromedaBackgroundStarsPositions = new Float32Array(andromedaBackgroundStarsCount * 3);
const andromedaBackgroundStarsPhases = new Float32Array(andromedaBackgroundStarsCount);
const andromedaBackgroundStarsColors = new Float32Array(andromedaBackgroundStarsCount * 3);
const andromedaBackgroundStarsSizes = new Float32Array(andromedaBackgroundStarsCount);
for (let i = 0; i < andromedaBackgroundStarsCount; i++) {
    const r = Math.sqrt(Math.random()) * andromedaDiskRadius;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * andromedaMiddleDiskThickness * (1 - r / andromedaDiskRadius);
    andromedaBackgroundStarsPositions[i * 3] = x;
    andromedaBackgroundStarsPositions[i * 3 + 1] = y;
    andromedaBackgroundStarsPositions[i * 3 + 2] = z;
    andromedaBackgroundStarsPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.1 - 0.08;
    andromedaBackgroundStarsColors[i * 3] = 0.4 + colorVariation;
    andromedaBackgroundStarsColors[i * 3 + 1] = 0.8 + colorVariation;
    andromedaBackgroundStarsColors[i * 3 + 2] = 1.0 + colorVariation * 1.8; // Blue tint for spiral arms
    andromedaBackgroundStarsSizes[i] = 0.5 + Math.random() * 0.6;
}
andromedaBackgroundStarsGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaBackgroundStarsPositions, 3));
andromedaBackgroundStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaBackgroundStarsPhases, 1));
andromedaBackgroundStarsGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaBackgroundStarsColors, 3));
andromedaBackgroundStarsGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaBackgroundStarsSizes, 1));
const andromedaBackgroundStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.3 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (1.5 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float dist = length(vPosition.xz);
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.1, 6.28318530718);
            float brightness = 0.8 + 0.2 * sin(rotation * 2.0);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaBackgroundStars = new THREE.Points(andromedaBackgroundStarsGeometry, andromedaBackgroundStarsMaterial);
andromedaGroup.add(andromedaBackgroundStars);

// Middle Blue Layer (Spiral Stars with Motion Trails)
const andromedaStarsGeometry = new THREE.BufferGeometry();
const andromedaStarsPositions = new Float32Array(andromedaStarsCount * 3);
const andromedaStarsPhases = new Float32Array(andromedaStarsCount);
const andromedaStarsColors = new Float32Array(andromedaStarsCount * 3);
const andromedaStarsSizes = new Float32Array(andromedaStarsCount);
for (let i = 0; i < andromedaStarsCount; i++) {
    const arm = Math.floor(Math.random() * andromedaSpiralArms);
    const r = Math.sqrt(Math.random()) * andromedaDiskRadius;
    const baseTheta = arm * (Math.PI * 2 / andromedaSpiralArms) + Math.log(1 + r * andromedaArmTightness * 0.015);
    const density = (Math.sin(baseTheta * andromedaSpiralArms) + 1) * 0.5;
    if (Math.random() > density * 0.5) continue;
    const theta = baseTheta + (Math.random() - 0.5) * 0.3;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * andromedaMiddleDiskThickness * (1 - r / andromedaDiskRadius);
    andromedaStarsPositions[i * 3] = x;
    andromedaStarsPositions[i * 3 + 1] = y;
    andromedaStarsPositions[i * 3 + 2] = z;
    andromedaStarsPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.15 - 0.075;
    andromedaStarsColors[i * 3] = 0.4 + colorVariation;
    andromedaStarsColors[i * 3 + 1] = 0.8 + colorVariation;
    andromedaStarsColors[i * 3 + 2] = 1.0 + colorVariation * 1.5; // Blue tint
    andromedaStarsSizes[i] = 0.6 + Math.random() * 0.6;
}
andromedaStarsGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaStarsPositions, 3));
andromedaStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaStarsPhases, 1));
andromedaStarsGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaStarsColors, 3));
andromedaStarsGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaStarsSizes, 1));
const andromedaStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.5 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            pos.x += cos(theta) * sin(time * 0.2 + phase) * 2.0;
            pos.z += sin(theta) * sin(time * 0.2 + phase) * 2.0;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (2.5 + 1.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaStars = new THREE.Points(andromedaStarsGeometry, andromedaStarsMaterial);
andromedaGroup.add(andromedaStars);

// Middle Blue Gas with Dust Lanes
const andromedaGasGeometry = new THREE.PlaneGeometry(andromedaDiskRadius * 2.5, andromedaDiskRadius * 2.5, 128, 128);
const andromedaGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0xDC143C) }, // Blue for spiral arms
        intensity: { value: 1.4 }
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${andromedaSpiralArms}.0 + dist * 0.015 - time * 0.3) * 0.5 + 0.5;
            float rotation = mod(theta - time * 0.15, 6.28318530718);
            float cloud = fbm(vPosition.xy * 0.005 + vec2(cos(rotation), sin(rotation)) * 0.2);
            float dust = fbm(vPosition.xy * 0.01 + vec2(cos(theta * ${andromedaSpiralArms}.0), sin(theta * ${andromedaSpiralArms}.0)) * 0.07);
            float dustEffect = smoothstep(0.4, 0.8, dust) * 0.5;
            float glow = exp(-dist * 0.002) * spiral * (0.6 + 0.4 * cloud) * (1.5 - dustEffect);
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.5);
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaGas = new THREE.Mesh(andromedaGasGeometry, andromedaGasMaterial);
andromedaGas.position.y = -1;
andromedaGas.renderOrder = 1;
andromedaGroup.add(andromedaGas);

// Nebular Glow for Spiral Arms (Middle Layer)
const andromedaNebulaGeometry = new THREE.PlaneGeometry(andromedaDiskRadius * 2.5, andromedaDiskRadius * 2.5, 128, 128);
const andromedaNebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        nebulaColor: { value: new THREE.Color(0xD4A017) }, // Blue
        intensity: { value: 2.4 }
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 nebulaColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${andromedaSpiralArms}.0 + dist * 0.015 - time * 0.2) * 0.5 + 0.8;
            float cloud = fbm(vPosition.xy * 0.008 + vec2(cos(time * 0.05), sin(time * 0.05)) * 0.2);
            float glow = exp(-dist * 0.0025) * spiral * (0.5 + 0.5 * cloud);
            gl_FragColor = vec4(nebulaColor * intensity * glow, glow * 0.4);
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaNebulaGlow = new THREE.Mesh(andromedaNebulaGeometry, andromedaNebulaMaterial);
andromedaNebulaGlow.position.y = 0;
andromedaNebulaGlow.renderOrder = 2;
andromedaGroup.add(andromedaNebulaGlow);

// Outer Blue Layer (Spiral Stars with Motion Trails)
const andromedaOuterStarsGeometry = new THREE.BufferGeometry();
const andromedaOuterStarsPositions = new Float32Array(andromedaOuterStarsCount * 3);
const andromedaOuterStarsPhases = new Float32Array(andromedaOuterStarsCount);
const andromedaOuterStarsColors = new Float32Array(andromedaOuterStarsCount * 3);
const andromedaOuterStarsSizes = new Float32Array(andromedaOuterStarsCount);
for (let i = 0; i < andromedaOuterStarsCount; i++) {
    const arm = Math.floor(Math.random() * andromedaSpiralArms);
    const r = Math.sqrt(Math.random()) * andromedaOuterDiskRadius;
    const baseTheta = arm * (Math.PI * 2 / andromedaSpiralArms) + Math.log(1 + r * andromedaArmTightness * 0.022);
    const density = (Math.sin(baseTheta * andromedaSpiralArms) + 1) * 0.5;
    if (Math.random() > density * 0.5) continue;
    const theta = baseTheta + (Math.random() - 0.5) * 0.25;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * andromedaOuterDiskThickness * (1 - r / andromedaOuterDiskRadius);
    andromedaOuterStarsPositions[i * 3] = x;
    andromedaOuterStarsPositions[i * 3 + 1] = y;
    andromedaOuterStarsPositions[i * 3 + 2] = z;
    andromedaOuterStarsPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.15 - 0.075;
    andromedaOuterStarsColors[i * 3] = 0.4 + colorVariation;
    andromedaOuterStarsColors[i * 3 + 1] = 0.8 + colorVariation;
    andromedaOuterStarsColors[i * 3 + 2] = 1.0 + colorVariation * 1.5; // Blue tint
    andromedaOuterStarsSizes[i] = 0.6 + Math.random() * 0.6;
}
andromedaOuterStarsGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaOuterStarsPositions, 3));
andromedaOuterStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaOuterStarsPhases, 1));
andromedaOuterStarsGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaOuterStarsColors, 3));
andromedaOuterStarsGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaOuterStarsSizes, 1));
const andromedaOuterStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.4 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            pos.x += cos(theta) * sin(time * 0.15 + phase) * 2.0;
            pos.z += sin(theta) * sin(time * 0.15 + phase) * 2.0;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (2.0 + 1.2 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaOuterStars = new THREE.Points(andromedaOuterStarsGeometry, andromedaOuterStarsMaterial);
andromedaGroup.add(andromedaOuterStars);

// Outer Blue Gas with Dust Lanes
const andromedaOuterGasGeometry = new THREE.PlaneGeometry(andromedaOuterDiskRadius * 2.9, andromedaOuterDiskRadius * 2.9, 128, 128);
const andromedaOuterGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0x0F52BA) }, // Blue
        intensity: { value: 0.65}
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3.ConcurrentModificationException vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${andromedaSpiralArms}.0 + dist * 0.012 - time * 0.25) * 0.5 + 0.5;
            float rotation = mod(theta - time * 0.1, 6.28318530718);
            float cloud = fbm(vPosition.xy * 0.004 + vec2(cos(rotation), sin(rotation)) * 0.06);
            float dust = fbm(vPosition.xy * 0.008 + vec2(cos(theta * ${andromedaSpiralArms}.0), sin(theta * ${andromedaSpiralArms}.0)) * 0.3);
            float dustEffect = smoothstep(0.4, 0.8, dust) * 0.7;
            float glow = exp(-dist * 0.0015) * spiral * (0.5 + 0.5 * cloud) * (1.0 - dustEffect);
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.3);
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaOuterGas = new THREE.Mesh(andromedaOuterGasGeometry, andromedaOuterGasMaterial);
andromedaOuterGas.position.y = -1;
andromedaOuterGas.renderOrder = 3;
andromedaGroup.add(andromedaOuterGas);

// Nebular Glow for Spiral Arms (Outer Layer)
const andromedaOuterNebulaGeometry = new THREE.PlaneGeometry(andromedaOuterDiskRadius * 2.9, andromedaOuterDiskRadius * 2.9, 128, 128);
const andromedaOuterNebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        nebulaColor: { value: new THREE.Color(0x6A0DAD) }, // Blue
        intensity: { value: 1.6 }
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.2);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 nebulaColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${andromedaSpiralArms}.0 + dist * 0.012 - time * 0.15) * 0.5 + 0.7;
            float cloud = fbm(vPosition.xy * 0.006 + vec2(cos(time * 0.04), sin(time * 0.04)) * 0.18);
            float glow = exp(-dist * 0.002) * spiral * (0.5 + 0.6 * cloud);
            gl_FragColor = vec4(nebulaColor * intensity * glow, glow * 0.5);
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaOuterNebulaGlow = new THREE.Mesh(andromedaOuterNebulaGeometry, andromedaOuterNebulaMaterial);
andromedaOuterNebulaGlow.position.y = 0;
andromedaOuterNebulaGlow.renderOrder = 4;
andromedaGroup.add(andromedaOuterNebulaGlow);

// Stellar Halo (Faint, Spherical Distribution)
const andromedaHaloGeometry = new THREE.BufferGeometry();
const andromedaHaloPositions = new Float32Array(andromedaHaloStarsCount * 3);
const andromedaHaloPhases = new Float32Array(andromedaHaloStarsCount);
const andromedaHaloColors = new Float32Array(andromedaHaloStarsCount * 3);
const andromedaHaloSizes = new Float32Array(andromedaHaloStarsCount);
for (let i = 0; i < andromedaHaloStarsCount; i++) {
    const r = Math.pow(Math.random(), 2.0) * andromedaOuterDiskRadius * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    const z = r * Math.cos(phi);
  andromedaHaloPositions[i * 3] = x;
    andromedaHaloPositions[i * 3 + 1] = y;
    andromedaHaloPositions[i * 3 + 2] = z;
    andromedaHaloPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.05 - 0.025;
    andromedaHaloColors[i * 3] = 0.8 + colorVariation;
    andromedaHaloColors[i * 3 + 1] = 0.8 + colorVariation;
    andromedaHaloColors[i * 3 + 2] = 1.0 + colorVariation;
    andromedaHaloSizes[i] = 0.4 + Math.random() * 0.4;
}
andromedaHaloGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaHaloPositions, 3));
andromedaHaloGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaHaloPhases, 1));
andromedaHaloGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaHaloColors, 3));
andromedaHaloGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaHaloSizes, 1));
const andromedaHaloMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.1 + 0.2 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 1.0;
            gl_PointSize = size * (1.0 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaHalo = new THREE.Points(andromedaHaloGeometry, andromedaHaloMaterial);
andromedaHalo.renderOrder = 0;
andromedaGroup.add(andromedaHalo);

// Central Bar (Yellowish, Representing the Barred Structure)
const barStarsCount = 2000;
const barGeometry = new THREE.BufferGeometry();
const barPositions = new Float32Array(barStarsCount * 3);
const barPhases = new Float32Array(barStarsCount);
const barColors = new Float32Array(barStarsCount * 3);
const barSizes = new Float32Array(barStarsCount);
for (let i = 0; i < barStarsCount; i++) {
    const t = Math.random() * 2 - 1; // -1 to 1 along the bar
    const x = t * andromedaBarLength;
    const z = (Math.random() - 0.5) * 10; // Small spread along z-axis
    const y = (Math.random() - 0.5) * 5; // Small spread along y-axis
    barPositions[i * 3] = x;
    barPositions[i * 3 + 1] = y;
    barPositions[i * 3 + 2] = z;
    barPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.1 - 0.05;
    barColors[i * 3] = 1.0 + colorVariation;
    barColors[i * 3 + 1] = 0.9 + colorVariation;
    barColors[i * 3 + 2] = 0.5 + colorVariation; // Yellowish tint
    barSizes[i] = 0.8 + Math.random() * 1.0;
}
barGeometry.setAttribute('position', new THREE.BufferAttribute(barPositions, 3));
barGeometry.setAttribute('phase', new THREE.BufferAttribute(barPhases, 1));
barGeometry.setAttribute('color', new THREE.BufferAttribute(barColors, 3));
barGeometry.setAttribute('size', new THREE.BufferAttribute(barSizes, 1));
const barMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.6 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 1.0;
            gl_PointSize = size * (2.5 + 1.0 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaBar = new THREE.Points(barGeometry, barMaterial);
andromedaGroup.add(andromedaBar);

// Central Bulge (Yellowish, Enhanced Twinkling)
const andromedaBulgeStarsCount = 2000;
const andromedaBulgeRadius = 100; // Slightly larger than Milky Way's bulge
const andromedaBulgeGeometry = new THREE.BufferGeometry();
const andromedaBulgePositions = new Float32Array(andromedaBulgeStarsCount * 3);
const andromedaBulgePhases = new Float32Array(andromedaBulgeStarsCount);
const andromedaBulgeColors = new Float32Array(andromedaBulgeStarsCount * 3);
const andromedaBulgeSizes = new Float32Array(andromedaBulgeStarsCount);
for (let i = 0; i < andromedaBulgeStarsCount; i++) {
    const r = Math.pow(Math.random(), 1.5) * andromedaBulgeRadius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.4;
    const z = r * Math.cos(phi);
    andromedaBulgePositions[i * 3] = x;
    andromedaBulgePositions[i * 3 + 1] = y;
    andromedaBulgePositions[i * 3 + 2] = z;
    andromedaBulgePhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.1 - 0.05;
    andromedaBulgeColors[i * 3] = 1.0 + colorVariation;
    andromedaBulgeColors[i * 3 + 1] = 0.9 + colorVariation;
    andromedaBulgeColors[i * 3 + 2] = 0.5 + colorVariation; // Yellowish tint
    andromedaBulgeSizes[i] = 1.0 + Math.random() * 1.2;
}
andromedaBulgeGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaBulgePositions, 3));
andromedaBulgeGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaBulgePhases, 1));
andromedaBulgeGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaBulgeColors, 3));
andromedaBulgeGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaBulgeSizes, 1));
const andromedaBulgeMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.6 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (3.0 + 1.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.2, 6.28318530718);
            float brightness = 0.9 + 0.1 * sin(rotation * 2.0);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaBulge = new THREE.Points(andromedaBulgeGeometry, andromedaBulgeMaterial);
andromedaBulge.renderOrder = 0;
andromedaGroup.add(andromedaBulge);

// Central Gas Glow (Yellowish, Brighter)
const andromedaCoreGasGeometry = new THREE.SphereGeometry(80, 32, 32);
const andromedaCoreGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0xD4A017) }, // Yellowish (gold-like)
        intensity: { value: 2.9 }
    },
    vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3 vPosition;
        varying vec3 vNormal;
        float noise(vec3 p) {
            return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }
        float fbm(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition);
            float theta = atan(vPosition.y, vPosition.x);
            float rotation = mod(theta - time * 0.3, 6.28318530718);
            float spiral = sin(theta * 2.0 - dist * 0.1 + rotation) * 0.5 + 0.5;
            float cloud = fbm(vPosition * 0.02 + vec3(cos(rotation), sin(rotation), 0.0) * 0.3);
            float glow = exp(-dist * 0.02) * (0.5 + 0.5 * cloud) * spiral;
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.6);
        }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaCoreGas = new THREE.Mesh(andromedaCoreGasGeometry, andromedaCoreGasMaterial);
andromedaCoreGas.position.y = 0;
andromedaCoreGas.renderOrder = 5;
andromedaGroup.add(andromedaCoreGas);

// Positioning and Slanting the Andromeda Galaxy (Different orientation for distinction)
andromedaGroup.position.set(andromedaRadius, -2500, -5000); // Offset from Milky Way
andromedaGroup.rotation.x = Math.PI / 6; // More tilted than Milky Way
andromedaGroup.rotation.z = -Math.PI / 6;
scene.add(andromedaGroup);
createLabel('Andromeda Galaxy', andromedaGroup.position.clone().add(new THREE.Vector3(0, 200, 0)), 3);

// Comets
const comets = [];
const cometsCount = 20; // Reduced for performance
const cometBeltInnerRadius = 120; // Beyond Saturn
const cometBeltWidth = 80;
const minPerihelion = 30; // Safe distance from Sun (radius 10 + buffer)

for (let i = 0; i < cometsCount; i++) {
    // Comet Core
    const cometGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const cometMat = new THREE.MeshStandardMaterial({
        color: 0xDCDCDC, // Light cyan for realism
        emissive: 0x00BFFF, // Ion tail blue
        emissiveIntensity: 0.6,
        roughness: 0.3,
    });
    const comet = new THREE.Mesh(cometGeom, cometMat);
    comet.name = `comet${i + 1}`; // Unique name for each comet (e.g., Comet1, Comet2, etc.)
    const semiMajor = cometBeltInnerRadius + Math.random() * cometBeltWidth;
    const eccentricity = 0.6 + Math.random() * 0.6; // High eccentricity
    const perihelion = semiMajor * (1 - eccentricity);
    const adjustedSemiMajor = Math.max(semiMajor, minPerihelion / (1 - eccentricity));
    const semiMinor = adjustedSemiMajor * Math.sqrt(1 - eccentricity * eccentricity);
    const theta = Math.random() * Math.PI * 2;
    const x = adjustedSemiMajor * Math.cos(theta) - adjustedSemiMajor * eccentricity;
    const z = semiMinor * Math.sin(theta);
    comet.position.set(x, (Math.random() - 0.5) * 1.5, z);
    comet.userData = {
        theta,
        semiMajor: adjustedSemiMajor,
        semiMinor,
        eccentricity,
        speed: 0.0003 + Math.random() * 0.0002,
    };
    scene.add(comet);
    
    // Comet Tail
    const tailLength = 1;
    const tailSegments = 12;
    const tailPositions = new Float32Array(tailSegments * 3);
    const tailOpacities = new Float32Array(tailSegments);
    for (let j = 0; j < tailSegments; j++) {
        const t = j / (tailSegments - 1);
        tailPositions[j * 3] = -t * tailLength;
        tailPositions[j * 3 + 1] = 0;
        tailPositions[j * 3 + 2] = 0;
        tailOpacities[j] = 1 - t * 0.9;
    }
    const tailGeom = new THREE.BufferGeometry();
    tailGeom.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeom.setAttribute('opacity', new THREE.BufferAttribute(tailOpacities, 0.3));
    const tailMat = new THREE.PointsMaterial({
        color: 0x00BFFF,
        size: 0.2,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
    });
    const tail = new THREE.Points(tailGeom, tailMat);
    comet.add(tail);
    
    comets.push({ comet, tail });
}

// Meteor
let meteor, meteorLight, meteorTrail;
const meteorStart = new THREE.Vector3(-250, 10, 50); // Start outside, slightly above and offset from Sun
const meteorEnd = new THREE.Vector3(250, -10, 50); // End outside, slightly below, passing near Sun
let meteorT = 0;
const meteorSpeed = 0.0008; // Adjusted speed for smooth one-way travel
loader.load('https://i.ibb.co/BH1prqs/photo-stone-texture-pattern-58702-16107.jpg', (texture) => {
    const geom = new THREE.IcosahedronGeometry(1.5, 3); // Larger for visibility
    const positions = geom.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
        const direction = vertex.clone().normalize();
        const randomOffset = (Math.random() - 0.5) * 0.3;
        vertex.addScaledVector(direction, randomOffset);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geom.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xC0C0C0, // Solar silver color
        roughness: 0.6, // Slightly less rough for shine
        metalness: 0.7, // Higher metalness for metallic silver look
        emissive: 0xD4D4D4, // Light silver emission
        emissiveIntensity: 0.5 // Visible glow
    });
    meteor = new THREE.Mesh(geom, mat);
    meteor.name = 'Meteor'; // Name for info panel
    meteor.position.copy(meteorStart);
    scene.add(meteor);
    
    // Meteor Light for enhanced visibility
    meteorLight = new THREE.PointLight(0xD4D4D4, 2, 25); // Brighter silver light
    meteorLight.position.copy(meteor.position);
    scene.add(meteorLight);
    
    // Meteor Trail for dynamic effect
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(100 * 3); // 100 points for trail
    const trailOpacities = new Float32Array(100);
    for (let i = 0; i < 100; i++) {
        trailPositions[i * 3] = meteorStart.x;
        trailPositions[i * 3 + 1] = meteorStart.y;
        trailPositions[i * 3 + 2] = meteorStart.z;
        trailOpacities[i] = 1 - (i / 100); // Fade from 1 to 0
    }
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('opacity', new THREE.BufferAttribute(trailOpacities, 1));
    const trailMaterial = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(0xD4D4D4) } }, // Silver trail
        vertexShader: `
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.0;
        }
      `,
        fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(color, vOpacity * 0.8);
        }
      `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    meteorTrail = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(meteorTrail);
}, undefined, () => {
    const geom = new THREE.IcosahedronGeometry(1.5, 3); // Larger for visibility
    const positions = geom.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
        const direction = vertex.clone().normalize();
        const randomOffset = (Math.random() - 0.5) * 0.3;
        vertex.addScaledVector(direction, randomOffset);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geom.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
        color: 0xC0C0C0, // Solar silver color
        roughness: 0.6, // Slightly less rough for shine
        metalness: 0.7, // Higher metalness for metallic silver look
        emissive: 0xD4D4D4, // Light silver emission
        emissiveIntensity: 0.5 // Visible glow
    });
    meteor = new THREE.Mesh(geom, mat);
    meteor.name = 'Meteor'; // Name for info panel
    meteor.position.copy(meteorStart);
    scene.add(meteor);
    
    // Meteor Light for enhanced visibility
    meteorLight = new THREE.PointLight(0xD4D4D4, 2, 25); // Brighter silver light
    meteorLight.position.copy(meteor.position);
    scene.add(meteorLight);
    
    // Meteor Trail for dynamic effect
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(100 * 3); // 100 points for trail
    const trailOpacities = new Float32Array(100);
    for (let i = 0; i < 100; i++) {
        trailPositions[i * 3] = meteorStart.x;
        trailPositions[i * 3 + 1] = meteorStart.y;
        trailPositions[i * 3 + 2] = meteorStart.z;
        trailOpacities[i] = 1 - (i / 100); // Fade from 1 to 0
    }
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('opacity', new THREE.BufferAttribute(trailOpacities, 1));
    const trailMaterial = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(0xD4D4D4) } }, // Silver trail
        vertexShader: `
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.0;
        }
      `,
        fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(color, vOpacity * 0.8);
        }
      `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    meteorTrail = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(meteorTrail);
});

// Huge Stone Asteroid Belt after Saturn
const asteroids = [];
const asteroidCount = 5000;
const asteroidBeltInnerRadius = 280;
const asteroidBeltOuterRadius = 320;
const asteroidBeltHeight = 30;

const asteroidMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(0x8A2BE2) }, // Purple glow
    },
    vertexShader: `
    uniform float time;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform float time;
    uniform vec3 glowColor;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      vec3 baseColor = vec3(0.1, 0.1, 0.1); // Dark gray to black
      float purpleMix = 0.4 + 0.3 * sin(time + vPosition.x * 0.2);
      vec3 color = mix(baseColor, glowColor, purpleMix * glow);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
    side: THREE.DoubleSide,
});

for (let i = 0; i < asteroidCount; i++) {
    const radius = asteroidBeltInnerRadius + Math.random() * (asteroidBeltOuterRadius - asteroidBeltInnerRadius);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * asteroidBeltHeight;
    const size = 0.5 + Math.random() * 1.5; // Larger asteroids
    
    // Irregular shape using Icosahedron with vertex displacement
    const asteroidGeom = new THREE.IcosahedronGeometry(size, 1);
    const positions = asteroidGeom.attributes.position;
    for (let j = 0; j < positions.count; j++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, j);
        const offset = vertex.clone().normalize().multiplyScalar((Math.random() - 0.5) * 0.3);
        vertex.add(offset);
        positions.setXYZ(j, vertex.x, vertex.y, vertex.z);
    }
    asteroidGeom.computeVertexNormals();
    
    const asteroid = new THREE.Mesh(asteroidGeom, asteroidMaterial);
    asteroid.name = `asteroid${i + 1}`; // Unique name for each asteroid (e.g., Asteroid1, Asteroid2, etc.)
    asteroid.position.set(radius * Math.cos(theta), y, radius * Math.sin(theta));
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    // Orbital parameters
    const eccentricity = 0.05 + Math.random() * 0.1;
    const semiMajor = radius;
    const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity);
    asteroid.userData = {
        theta: theta,
        semiMajor: semiMajor,
        semiMinor: semiMinor,
        eccentricity: eccentricity,
        speed: 0.0002 + Math.random() * 0.0003,
        rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        ),
    };
    
    scene.add(asteroid);
    asteroids.push(asteroid);
}

  // Asteroid Belt Orbit Visualization
  const asteroidBeltOrbitInner = createOrbit(asteroidBeltInnerRadius, 0.03, 256, 0x808080);
  const asteroidBeltOrbitOuter = createOrbit(asteroidBeltOuterRadius, 0.03, 256, 0x808080);
  createLabel('Asteroid Belt', new THREE.Vector3(asteroidBeltInnerRadius + 20, 10, 0), 2);
  
    // Orbital Parameters
    const mercuryOrbitSemiMajor = 40;
    const mercuryOrbitEccentricity = 0.2056;
    const mercuryOrbitSemiMinor = mercuryOrbitSemiMajor * Math.sqrt(1 - mercuryOrbitEccentricity * mercuryOrbitEccentricity);
    const mercuryOrbitSpeed = 0.0009;

    const venusOrbitSemiMajor = 60;
    const venusOrbitEccentricity = 0.0067;
    const venusOrbitSemiMinor = venusOrbitSemiMajor * Math.sqrt(1 - venusOrbitEccentricity * venusOrbitEccentricity);
    const venusOrbitSpeed = 0.0005;

    const earthOrbitSemiMajor = 90;
    const earthOrbitEccentricity = 0.0167;
    const earthOrbitSemiMinor = earthOrbitSemiMajor * Math.sqrt(1 - earthOrbitEccentricity * earthOrbitEccentricity);
    const earthOrbitSpeed = 0.0004;

    const moonOrbitSemiMajor = 9;
    const moonOrbitEccentricity = 0.0549;
    const moonOrbitSemiMinor = moonOrbitSemiMajor * Math.sqrt(1 - moonOrbitEccentricity * moonOrbitEccentricity);
    const moonOrbitSpeed = 0.00036;

    const marsOrbitSemiMajor = 140;
    const marsOrbitEccentricity = 0.0934;
    const marsOrbitSemiMinor = marsOrbitSemiMajor * Math.sqrt(1 - marsOrbitEccentricity * marsOrbitEccentricity);
    const marsOrbitSpeed = 0.0002;

    const phobosOrbitSemiMajor = 4.5;
    const phobosOrbitEccentricity = 0.0151;
    const phobosOrbitSemiMinor = phobosOrbitSemiMajor * Math.sqrt(1 - phobosOrbitEccentricity * phobosOrbitEccentricity);
    const phobosOrbitSpeed = 0.003;

    const deimosOrbitSemiMajor = 6.8;
    const deimosOrbitEccentricity = 0.0002;
    const deimosOrbitSemiMinor = deimosOrbitSemiMajor * Math.sqrt(1 - deimosOrbitEccentricity * deimosOrbitEccentricity);
    const deimosOrbitSpeed = 0.001;

    const jupiterOrbitSemiMajor = 190;
    const jupiterOrbitEccentricity = 0.0489;
    const jupiterOrbitSemiMinor = jupiterOrbitSemiMajor * Math.sqrt(1 - jupiterOrbitEccentricity * jupiterOrbitEccentricity);
    const jupiterOrbitSpeed = 0.0001;

    const saturnOrbitSemiMajor = 240;
    const saturnOrbitEccentricity = 0.0557;
    const saturnOrbitSemiMinor = saturnOrbitSemiMajor * Math.sqrt(1 - saturnOrbitEccentricity * saturnOrbitEccentricity);
    const saturnOrbitSpeed = 0.00006;

    const titanOrbitSemiMajor = 18;
    const titanOrbitEccentricity = 0.0288;
    const titanOrbitSemiMinor = titanOrbitSemiMajor * Math.sqrt(1 - titanOrbitEccentricity * titanOrbitEccentricity);
    const titanOrbitSpeed = 0.0005;
    
// Animation Loop
function animate(time = 0) {
    requestAnimationFrame(animate);
    try {
        controls.update();
        if (isLoading) return;

        // Update Orbits
        if (moonOrbit && earth) moonOrbit.position.copy(earth.position);
        if (phobosOrbit && mars) phobosOrbit.position.copy(mars.position);
        if (deimosOrbit && mars) deimosOrbit.position.copy(mars.position);
        if (titanOrbit && saturn) titanOrbit.position.copy(saturn.position);

        // Update Positions
        if (mercury) {
            mercury.rotation.y += 0.005;
            const mercuryAngle = time * mercuryOrbitSpeed;
            const mercuryX = mercuryOrbitSemiMajor * Math.cos(mercuryAngle) - mercuryOrbitSemiMajor * mercuryOrbitEccentricity;
            const mercuryZ = mercuryOrbitSemiMinor * Math.sin(mercuryAngle);
            mercury.position.set(mercuryX, 0, mercuryZ);
            if (mercuryLight) mercuryLight.position.copy(mercury.position);
        }

        if (venus) {
            venus.rotation.y += 0.004;
            const venusAngle = time * venusOrbitSpeed;
            const venusX = venusOrbitSemiMajor * Math.cos(venusAngle) - venusOrbitSemiMajor * venusOrbitEccentricity;
            const venusZ = venusOrbitSemiMinor * Math.sin(venusAngle);
            venus.position.set(venusX, 0, venusZ);
            if (venusLight) venusLight.position.copy(venus.position);
        }

        if (earth) {
            earth.rotation.y += 0.004;
            const earthAngle = time * earthOrbitSpeed;
            const earthX = earthOrbitSemiMajor * Math.cos(earthAngle) - earthOrbitSemiMajor * earthOrbitEccentricity;
            const earthZ = earthOrbitSemiMinor * Math.sin(earthAngle);
            earth.position.set(earthX, 0, earthZ);
        }

        if (moon && earth) {
            moon.rotation.y += 0.0037;
            const moonAngle = time * moonOrbitSpeed;
            const moonX = earth.position.x + moonOrbitSemiMajor * Math.cos(moonAngle) - moonOrbitSemiMajor * moonOrbitEccentricity;
            const moonZ = earth.position.z + moonOrbitSemiMinor * Math.sin(moonAngle);
            moon.position.set(moonX, earth.position.y, moonZ);
            if (moonLight) {
                moonLight.position.copy(moon.position);
                moonLight.intensity = moon.position.z < earth.position.z ? 1 : 0.8;
            }
        }

        if (mars) {
            mars.rotation.y += 0.002;
            const marsAngle = time * marsOrbitSpeed;
            const marsX = marsOrbitSemiMajor * Math.cos(marsAngle) - marsOrbitSemiMajor * marsOrbitEccentricity;
            const marsZ = marsOrbitSemiMinor * Math.sin(marsAngle);
            mars.position.set(marsX, 0, marsZ);
            if (marsLight) marsLight.position.copy(mars.position);
        }

        if (phobos && mars) {
            phobos.rotation.y += 0.002;
            const phobosAngle = time * phobosOrbitSpeed;
            const phobosX = mars.position.x + phobosOrbitSemiMajor * Math.cos(phobosAngle) - phobosOrbitSemiMajor * phobosOrbitEccentricity;
            const phobosZ = mars.position.z + phobosOrbitSemiMinor * Math.sin(phobosAngle);
            phobos.position.set(phobosX, mars.position.y, phobosZ);
        }

        if (deimos && mars) {
            deimos.rotation.y -= 0.0015;
            const deimosAngle = time * deimosOrbitSpeed;
            const deimosX = mars.position.x + deimosOrbitSemiMajor * Math.cos(deimosAngle) - deimosOrbitSemiMajor * deimosOrbitEccentricity;
            const deimosZ = mars.position.z + deimosOrbitSemiMinor * Math.sin(deimosAngle);
            deimos.position.set(deimosX, mars.position.y + 0.5 * Math.sin(deimosAngle), deimosZ);
        }

        if (jupiter) {
            jupiter.rotation.y += 0.001;
            const jupiterAngle = time * jupiterOrbitSpeed;
            const jupiterX = jupiterOrbitSemiMajor * Math.cos(jupiterAngle) - jupiterOrbitSemiMajor * jupiterOrbitEccentricity;
            const jupiterZ = jupiterOrbitSemiMinor * Math.sin(jupiterAngle);
            jupiter.position.set(jupiterX, 0, jupiterZ);
            if (jupiterLight) jupiterLight.position.copy(jupiter.position);
        }

        if (saturn) {
            saturn.rotation.y += 0.001;
            const saturnAngle = time * saturnOrbitSpeed;
            const saturnX = saturnOrbitSemiMajor * Math.cos(saturnAngle) - saturnOrbitSemiMajor * saturnOrbitEccentricity;
            const saturnZ = saturnOrbitSemiMinor * Math.sin(saturnAngle);
            saturn.position.set(saturnX, 0, saturnZ);
            if (saturnLight) saturnLight.position.copy(saturn.position);
        }

        if (titan && saturn) {
            titan.rotation.y += 0.0015;
            const titanAngle = time * titanOrbitSpeed;
            const titanX = saturn.position.x + titanOrbitSemiMajor * Math.cos(titanAngle) - titanOrbitSemiMajor * titanOrbitEccentricity;
            const titanZ = saturn.position.z + titanOrbitSemiMinor * Math.sin(titanAngle);
            titan.position.set(titanX, saturn.position.y, titanZ);
        }

        // Camera Tracking
        if (!isInteracting) {
            if (activeView === 'moon' && moon) {
                const moonPos = moon.position.clone();
                camera.position.copy(moonPos).add(cameraOffset);
                controls.target.copy(moonPos);
                lastTargetPosition.copy(moonPos);
            } else if (activeView === 'earth' && earth) {
                const earthPos = earth.position.clone();
                camera.position.copy(earthPos).add(cameraOffset);
                controls.target.copy(earthPos);
                lastTargetPosition.copy(earthPos);
            } else if (activeView === 'mars' && mars) {
                const marsPos = mars.position.clone();
                camera.position.copy(marsPos).add(cameraOffset);
                controls.target.copy(marsPos);
                lastTargetPosition.copy(marsPos);
            } else if (activeView === 'jupiter' && jupiter) {
                const jupiterPos = jupiter.position.clone();
                camera.position.copy(jupiterPos).add(cameraOffset);
                controls.target.copy(jupiterPos);
                lastTargetPosition.copy(jupiterPos);
            } else if (activeView === 'mercury' && mercury) {
                const mercuryPos = mercury.position.clone();
                camera.position.copy(mercuryPos).add(cameraOffset);
                controls.target.copy(mercuryPos);
                lastTargetPosition.copy(mercuryPos);
            } else if (activeView === 'venus' && venus) {
                const venusPos = venus.position.clone();
                camera.position.copy(venusPos).add(cameraOffset);
                controls.target.copy(venusPos);
                lastTargetPosition.copy(venusPos);
            } else if (activeView === 'saturn' && saturn) {
                const saturnPos = saturn.position.clone();
                camera.position.copy(saturnPos).add(cameraOffset);
                controls.target.copy(saturnPos);
                lastTargetPosition.copy(saturnPos);
            }
        } else {
            if (activeView === 'moon' && moon) {
                controls.target.copy(moon.position);
                lastTargetPosition.copy(moon.position);
            } else if (activeView === 'earth' && earth) {
                controls.target.copy(earth.position);
                lastTargetPosition.copy(earth.position);
            } else if (activeView === 'mars' && mars) {
                controls.target.copy(mars.position);
                lastTargetPosition.copy(mars.position);
            } else if (activeView === 'jupiter' && jupiter) {
                controls.target.copy(jupiter.position);
                lastTargetPosition.copy(jupiter.position);
            } else if (activeView === 'mercury' && mercury) {
                controls.target.copy(mercury.position);
                lastTargetPosition.copy(mercury.position);
            } else if (activeView === 'venus' && venus) {
                controls.target.copy(venus.position);
                lastTargetPosition.copy(venus.position);
            } else if (activeView === 'saturn' && saturn) {
                controls.target.copy(saturn.position);
                lastTargetPosition.copy(saturn.position);
            }
        }

        // Update Comets
        comets.forEach(({ comet, tail, orbit }) => {
            comet.userData.theta += comet.userData.speed;
            const theta = comet.userData.theta;
            const x = comet.userData.semiMajor * Math.cos(theta) - comet.userData.semiMajor * comet.userData.eccentricity;
            const z = comet.userData.semiMinor * Math.sin(theta);
            comet.position.set(x, comet.position.y, z);
            const prevTheta = theta - comet.userData.speed;
            const prevX = comet.userData.semiMajor * Math.cos(prevTheta) - comet.userData.semiMajor * comet.userData.eccentricity;
            const prevZ = comet.userData.semiMinor * Math.sin(prevTheta);
            const velocity = new THREE.Vector3(x - prevX, 0, z - prevZ).normalize();
            const sunDirection = new THREE.Vector3().sub(comet.position).normalize();
            tail.lookAt(comet.position.clone().add(sunDirection));
        });

        // Update Meteor
        if (meteor) {
            meteorT += meteorSpeed;
            if (meteorT > 1) {
                meteorT = 0; // Reset for continuous one-way movement
            }
            meteor.position.lerpVectors(meteorStart, meteorEnd, meteorT);
            meteor.rotation.x += 0.015; // Slower rotation for natural tumble
            meteor.rotation.y += 0.015;
            meteor.rotation.z += 0.015;
            if (meteorLight) meteorLight.position.copy(meteor.position);
            if (meteorTrail) {
                const trailPositions = meteorTrail.geometry.attributes.position.array;
                const trailOpacities = meteorTrail.geometry.attributes.opacity.array;
                // Shift trail points backward
                for (let i = 99; i > 0; i--) {
                    trailPositions[i * 3] = trailPositions[(i - 1) * 3];
                    trailPositions[i * 3 + 1] = trailPositions[(i - 1) * 3 + 1];
                    trailPositions[i * 3 + 2] = trailPositions[(i - 1) * 3 + 2];
                    trailOpacities[i] = trailOpacities[i - 1] * 0.95; // Fade effect
                }
                // Add current meteor position as new trail point
                trailPositions[0] = meteor.position.x;
                trailPositions[1] = meteor.position.y;
                trailPositions[2] = meteor.position.z;
                trailOpacities[0] = 1; // Full opacity at head
                meteorTrail.geometry.attributes.position.needsUpdate = true;
                meteorTrail.geometry.attributes.opacity.needsUpdate = true;
            }
        }

        // Update Sun
        if (sun) {
            sun.rotation.y += 0.0002;
            sunAtmosphere.rotation.copy(sun.rotation);
        }

        // Update Planets and Moons Rotations
        if (mercury) {
            mercury.rotation.y += 0.0001; // Slow rotation
            if (mercuryLight) mercuryLight.position.copy(mercury.position); // Keep light in sync
        }

        if (venus) {
            venus.rotation.y -= 0.00005; // Retrograde rotation
            // Venus atmosphere is a child, so it rotates automatically
        }

        if (earth) {
            earth.rotation.y += 0.0003; // Earth-like rotation
            // Earth atmosphere is a child, so it rotates automatically
        }

        if (moon) {
            moon.rotation.y += 0.0001; // Tidally locked rotation
            if (moonLight) moonLight.position.copy(moon.position);
        }

        if (mars) {
            mars.rotation.y += 0.0003; // Similar to Earth
            if (marsLight) marsLight.position.copy(mars.position);
        }

        if (phobos) {
            phobos.rotation.y += 0.0005; // Fast rotation for small moon
        }

        if (deimos) {
            deimos.rotation.y += 0.0005; // Fast rotation for small moon
        }

        if (jupiter) {
            jupiter.rotation.y += 0.0004; // Fast rotation
            // Jupiter atmosphere is a child, so it rotates automatically
            if (jupiterLight) jupiterLight.position.copy(jupiter.position);
        }

        if (saturn) {
            saturn.rotation.y += 0.00035; // Fast rotation
            // Saturn's rings are a child, so they rotate automatically
            if (saturnLight) saturnLight.position.copy(saturn.position);
        }

        if (titan) {
            titan.rotation.y += 0.0001; // Slow rotation
        }

        // Update Stars
        starShaderMaterial.uniforms.time.value = time * 0.001;

        // Update Milky Way (updated to include new outer layer)
        updateMilkyWay(time);

        // Update Labels
        scene.traverse(obj => {
            if (obj.userData.isLabel) {
                obj.lookAt(camera.position);
            }
        });

        // Update Asteroid Material
        asteroidMaterial.uniforms.time.value += 0.01;

        // Render
        renderer.render(scene, camera);
    } catch (error) {
        console.error('Animation error:', error);
    }
}

// Updated Milky Way animation function
function updateMilkyWay(time) {
    milkyWayGroup.rotation.y += 0.00015;
    const cameraPos = camera.position.clone();
    milkyWayStarsMaterial.uniforms.cameraPos.value = cameraPos;
    bulgeMaterial.uniforms.cameraPos.value = cameraPos;
    backgroundStarsMaterial.uniforms.cameraPos.value = cameraPos;
    outerStarsMaterial.uniforms.cameraPos.value = cameraPos;
    outerBackgroundStarsMaterial.uniforms.cameraPos.value = cameraPos;
    haloMaterial.uniforms.cameraPos.value = cameraPos;
    milkyWayStarsMaterial.uniforms.time.value = time * 0.001;
    bulgeMaterial.uniforms.time.value = time * 0.001;
    gasMaterial.uniforms.time.value = time * 0.001;
    outerStarsMaterial.uniforms.time.value = time * 0.001;
    outerGasMaterial.uniforms.time.value = time * 0.001;
    nebulaMaterial.uniforms.time.value = time * 0.001;
    outerNebulaMaterial.uniforms.time.value = time * 0.001;
    coreGasMaterial.uniforms.time.value = time * 0.001;
    backgroundStarsMaterial.uniforms.time.value = time * 0.001;
    outerBackgroundStarsMaterial.uniforms.time.value = time * 0.001;
    haloMaterial.uniforms.time.value = time * 0.001;
}

// Render and start animation
renderer.render(scene, camera);
animate();

    // Resize Handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      loadingRenderer.setSize(window.innerWidth, window.innerHeight);
      loadingCamera.aspect = window.innerWidth / window.innerHeight;
      loadingCamera.updateProjectionMatrix();
    });

    // Error Handling for Renderer
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      console.error('WebGL context lost:', event);
      alert('WebGL context lost. Please refresh the page.');
    });

    renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      animate();
    });