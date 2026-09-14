import * as THREE from 'three'
import type { Vector } from './math'

export class Particle {
    position: Vector
    lastPosition: Vector
    private mesh: THREE.Mesh | null = null

    constructor(position: Vector, lastPosition: Vector, scene: THREE.Scene, debug: boolean = false) {
        this.position = { ...position }
        this.lastPosition = { ...lastPosition }

        if (debug) {
            const geometry = new THREE.SphereGeometry(0.1, 16, 16)
            const material = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5, metalness: 0.1 })
            this.mesh = new THREE.Mesh(geometry, material)
            this.mesh.position.set(position.x, position.y, position.z)
            scene.add(this.mesh)
        }
    }

    setPosition(position: Vector) {
        this.lastPosition = { ...this.position }
        this.position = { ...position }
        if (this.mesh) {
            this.mesh.position.set(position.x, position.y, position.z)
        }
    }

}
