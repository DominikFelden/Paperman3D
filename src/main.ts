import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Terrain } from "./physics-world/terrain";
import { loadHeightmap } from "./utils";
import { Particle } from "./physics-world/particle";
import { PapermanBone } from "./physics-world/bone";
import { subtract } from "./math/operations";
import { PseudoPhysicsWorld } from "./physics-world/pseudo-physics-world";
import { PapermanTorso } from "./paperman-body/torso";
import { PapermanBody } from "./paperman-body/body";

const canvasQuery = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvasQuery) throw new Error('Missing <canvas id="scene">');
const canvas = canvasQuery;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
camera.position.set(-1, 3, 3);

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.25, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(3, 4, 2);
scene.add(sun);

// load heightmap image
const heightmap = await loadHeightmap("/heightmap2.png");

const terrain = new Terrain(10, heightmap, scene, false); // Enable debug mode

const body = new PapermanBody(
    { x: 0, y: 3, z: 0 },
    0,
    scene,
    true
);

const physicsWorld = new PseudoPhysicsWorld(
    terrain,
    Object.values(body.getParticles()),
    [...Object.values(body.getBones()), ...Object.values(body.getMuscles())],
    scene,
    true,
);

// --- Temporary physics debug controls, remove once collision behavior is finalized ---
const stepCountInput = document.querySelector<HTMLInputElement>("#step-count");
const stepButton = document.querySelector<HTMLButtonElement>("#step-btn");
const goButton = document.querySelector<HTMLButtonElement>("#go-btn");

let running = false;

stepButton?.addEventListener("click", () => {
    const steps = Math.max(1, Math.floor(Number(stepCountInput?.value)) || 1);
    for (let i = 0; i < steps; i++) {
        physicsWorld.step();
    }
});

goButton?.addEventListener("click", () => {
    running = !running;
    goButton.textContent = running ? "Stop" : "Go";
});

function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
function animate() {
    controls.update();
    renderer.render(scene, camera);

    if (running) {
        physicsWorld.step();
    }

    requestAnimationFrame(animate);
}

animate();
