import * as THREE from 'three'
import { magnitude } from './math'
import type { Particle } from './particle'

export class Bone {
    particle1: Particle
    particle2: Particle
    length: number
    private mesh: THREE.Mesh | null = null

    constructor(particle1: Particle, particle2: Particle, length: number, scene: THREE.Scene, debug: boolean = false) {
        this.particle1 = particle1
        this.particle2 = particle2
        this.length = length

        if (debug) {
            const p1 = particle1.position
            const p2 = particle2.position

            const dir = {
                x: p2.x - p1.x,
                y: p2.y - p1.y,
                z: p2.z - p1.z,
            }
            const dist = magnitude(dir)

            const geometry = new THREE.CylinderGeometry(0.03, 0.03, dist, 8)
            const material = new THREE.MeshStandardMaterial({ color: 0x44aaff, roughness: 0.5, metalness: 0.1 })
            this.mesh = new THREE.Mesh(geometry, material)

            // Position at midpoint between the two particles
            this.mesh.position.set(
                (p1.x + p2.x) / 2,
                (p1.y + p2.y) / 2,
                (p1.z + p2.z) / 2
            )

            // Rotate cylinder (default Y-axis) to align with direction p1 -> p2
            if (dist > 0) {
                const dirVec = new THREE.Vector3(dir.x, dir.y, dir.z).normalize()
                const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec)
                this.mesh.setRotationFromQuaternion(quaternion)
            }

            scene.add(this.mesh)
        }
    }

    update(): void {
        if (!this.mesh) return

        const p1 = this.particle1.position
        const p2 = this.particle2.position

        this.mesh.position.set(
            (p1.x + p2.x) / 2,
            (p1.y + p2.y) / 2,
            (p1.z + p2.z) / 2
        )

        const dirVec = new THREE.Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z)
        const dist = dirVec.length()
        if (dist > 0) {
            this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec.divideScalar(dist))
        }
    }
}
