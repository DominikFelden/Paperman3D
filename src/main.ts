import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Terrain } from './terrain'
import { loadHeightmap } from './utils'
import { Particle } from './particle'
import { Bone } from './bone'
import { subtract } from './math'
import { PseudoPhysicsWorld } from './pseudo-physics-world'

const canvasQuery = document.querySelector<HTMLCanvasElement>('#scene')
if (!canvasQuery) throw new Error('Missing <canvas id="scene">')
const canvas = canvasQuery

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0b1020)

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200)
camera.position.set(2.5, 5, 5)

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
})
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 0.25, 0)

scene.add(new THREE.AmbientLight(0xffffff, 0.4))
const sun = new THREE.DirectionalLight(0xffffff, 1.2)
sun.position.set(3, 4, 2)
scene.add(sun)

// load heightmap image
const heightmap = await loadHeightmap('/heightmap2.png')

const terrain = new Terrain(10, heightmap, scene, false) // Enable debug mode

const particle1 = new Particle(
    { x: -2, y: 3, z: -1 },
    { x: -2.04, y: 2.99, z: -1 },
    scene,
    true
)

// const particle2 = new Particle(
//     { x: -2, y: 3, z: -1 },
//     { x: -1, y: 3, z: -1 },
//     scene,
//     true
// )

// const intersectionPoint = terrain.getLineTerrainIntersection(particle1.position, subtract(particle1.position, particle2.position))

// const particle3 = new Particle(
//     intersectionPoint || { x: 0, y: 0, z: 0 },
//     intersectionPoint || { x: 0, y: 0, z: 0 },
    
//     scene,
//     true
// )

// const bone = new Bone(particle1, particle2, 4, scene, true)

const physicsWorld = new PseudoPhysicsWorld(terrain, [particle1], scene, true)


function resize() {
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

window.addEventListener('resize', resize)
resize()

const clock = new THREE.Clock()
function animate() {
  controls.update()
  renderer.render(scene, camera)

  physicsWorld.step()

  requestAnimationFrame(animate)

}

animate()
