import * as THREE from 'three'
import type { Vector } from './math'
import { subtract, magnitude } from './math'
import { DebugVector } from './debug-vector'
import { GLOBAL_DEBUG, TRAIL_MAX_LENGTH } from './debug-config'

// Shared across all particles so enabling the trail doesn't allocate a new geometry/material every step.
const trailMarkerGeometry = new THREE.SphereGeometry(0.02, 8, 8)
const trailMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x33ccff, transparent: true, opacity: 0.5 })

export class Particle {
    position: Vector
    lastPosition: Vector
    private mesh: THREE.Mesh | null = null
    private scene: THREE.Scene
    private trailMarkers: THREE.Mesh[] = []
    private trailVectors: DebugVector[] = []

    constructor(position: Vector, lastPosition: Vector, scene: THREE.Scene, debug: boolean = false) {
        this.position = { ...position }
        this.lastPosition = { ...lastPosition }
        this.scene = scene

        if (debug) {
            const geometry = new THREE.SphereGeometry(0.02, 16, 16)
            const material = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5, metalness: 0.1 })
            this.mesh = new THREE.Mesh(geometry, material)
            this.mesh.position.set(position.x, position.y, position.z)
            scene.add(this.mesh)
        }
    }

    setPosition(position: Vector) {
        const previousPosition = this.position
        this.lastPosition = { ...this.position }
        this.position = { ...position }
        if (this.mesh) {
            this.mesh.position.set(position.x, position.y, position.z)
        }

        // Trail of past positions + per-step velocity vectors; the check keeps this a no-op when debugging is off.
        if (GLOBAL_DEBUG) {
            this.recordTrailPoint(previousPosition, subtract(position, previousPosition))
        }
    }

    private recordTrailPoint(point: Vector, velocity: Vector) {
        const marker = new THREE.Mesh(trailMarkerGeometry, trailMarkerMaterial)
        marker.position.set(point.x, point.y, point.z)
        this.scene.add(marker)
        this.trailMarkers.push(marker)

        if (magnitude(velocity) > 1e-6) {
            const arrow = new DebugVector(point, velocity, 0x33ccff, { cylinderRadius: 0.008, lengthScale: 1 })
            arrow.addToScene(this.scene)
            this.trailVectors.push(arrow)
        }

        // Drop the oldest entries once the trail exceeds its cap so memory stays bounded.
        while (this.trailMarkers.length > TRAIL_MAX_LENGTH) {
            this.scene.remove(this.trailMarkers.shift()!)
        }
        while (this.trailVectors.length > TRAIL_MAX_LENGTH) {
            const old = this.trailVectors.shift()!
            old.removeFromScene(this.scene)
            old.dispose()
        }
    }

}
