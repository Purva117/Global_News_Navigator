import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const earthGroup = new THREE.Group();
scene.add(earthGroup);

const markerGroup = new THREE.Group();
scene.add(markerGroup);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping (inertia)
controls.dampingFactor = 0.05; // Damping factor
controls.minDistance = 2; // Minimum zoom distance
controls.maxDistance = 10; // Maximum zoom distance

const loader = new THREE.TextureLoader();

const geometry = new THREE.SphereGeometry(1, 64, 64); // Higher detail sphere geometry
const material = new THREE.MeshPhongMaterial({
  map: loader.load("./textures/8k_earth_daymap.jpg"),
  specularMap: loader.load("./textures/8k_earth_specular_map.jpg"),
  bumpMap: loader.load("./textures/8k_earth_bump_map.jpg"),
  bumpScale: 0.04,
});
const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const lightsMat = new THREE.MeshBasicMaterial({
  map: loader.load("./textures/8k_earth_nightmap.jpg"),
  blending: THREE.AdditiveBlending,
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

const starfieldGeometry = new THREE.BufferGeometry();
const starfieldVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = THREE.MathUtils.randFloatSpread(2000);
  const y = THREE.MathUtils.randFloatSpread(2000);
  const z = THREE.MathUtils.randFloatSpread(2000);
  starfieldVertices.push(x, y, z);
}
starfieldGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starfieldVertices, 3));
const starfieldMaterial = new THREE.PointsMaterial({ color: 0x888888 });
const starfield = new THREE.Points(starfieldGeometry, starfieldMaterial);
scene.add(starfield);

const sunLight = new THREE.DirectionalLight(0x000000, 2.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

let selectedMarker = null;
const originalColor = new THREE.Color(0xF9CB9C);
const selectedColor = new THREE.Color(0xF06666);

function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update controls for damping effect
  renderer.render(scene, camera);
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

// Function to convert lat/lon to 3D coordinates
function latLonToVector3(lat, lon, radius, height = 0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -((radius + height) * Math.sin(phi) * Math.cos(theta));
  const y = (radius + height) * Math.cos(phi);
  const z = ((radius + height) * Math.sin(phi) * Math.sin(theta));
  return new THREE.Vector3(x, y, z);
}

// Create a sphere marker
const createMarker = () => {
  const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xF9CB9C });
  return new THREE.Mesh(markerGeometry, markerMaterial);
};

// Load news data and add markers
fetch('summarized_news_data.json')
  .then(response => response.json())
  .then(data => {
    data.forEach(item => {
      const marker = createMarker();
      const coords = latLonToVector3(item.coordinates[0], item.coordinates[1], 1);
      marker.position.copy(coords);
      markerGroup.add(marker);

      marker.userData = { summary: item.summary, location: item.location };

      marker.callback = function () {
        const infoBox = document.getElementById('infoBox');
        const locationHeading = document.getElementById('locationHeading');
        const newsContent = document.getElementById('newsContent');
        infoBox.style.display = 'block';
        locationHeading.textContent = item.location;
        newsContent.innerHTML = formatSummary(item.summary);
      };
    });
  });


document.addEventListener('mousedown', onDocumentMouseDown, false);

function onDocumentMouseDown(event) {
  event.preventDefault();
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(markerGroup.children, true);
  if (intersects.length > 0) {
    const intersected = intersects[0].object;

    // Change the color of the selected marker
    if (selectedMarker) {
      selectedMarker.material.color.copy(originalColor);
    }

    selectedMarker = intersected;
    selectedMarker.material.color.copy(selectedColor);

    if (intersected.callback) {
      intersected.callback();
    }
  }
}

function formatSummary(summary) {
    const lines = summary.split('\n');
    let formatted = '<ul style="list-style-type: none; padding-left: 0;">';
    lines.forEach(line => {
      formatted += `<li style="margin-bottom: 10px;">${line}</li>`;
    });
    formatted += '</ul>';
    return formatted;
  }
  