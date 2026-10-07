import * as THREE from "three";
import { add, magnitude, normalize, scaleVector, subtract } from "../math/operations";
import type { Particle } from "./particle";

export class PapermanBone {
    particle1: Particle;
    particle2: Particle;
    length: number;
    private mesh: THREE.Mesh | null = null;
    // getter instead of field so subclasses can override it before the base constructor builds the mesh
    protected get colorDebugMode(): number {
        return 0x44aaff;
    }

    constructor(
        particle1: Particle,
        particle2: Particle,
        scene: THREE.Scene,
        debug: boolean = false,
    ) {
        this.particle1 = particle1;
        this.particle2 = particle2;
        this.length = magnitude(subtract(particle1.position, particle2.position));

        if (debug) {
            const p1 = particle1.position;
            const p2 = particle2.position;

            const dir = {
                x: p2.x - p1.x,
                y: p2.y - p1.y,
                z: p2.z - p1.z,
            };
            const dist = magnitude(dir);

            const geometry = new THREE.CylinderGeometry(0.01, 0.01, dist, 8);
            const material = new THREE.MeshStandardMaterial({
                color: this.colorDebugMode,
                roughness: 0.5,
                metalness: 0.1,
            });
            this.mesh = new THREE.Mesh(geometry, material);

            // Position at midpoint between the two particles
            this.mesh.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);

            // Rotate cylinder (default Y-axis) to align with direction p1 -> p2
            if (dist > 0) {
                const dirVec = new THREE.Vector3(dir.x, dir.y, dir.z).normalize();
                const quaternion = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    dirVec,
                );
                this.mesh.setRotationFromQuaternion(quaternion);
            }

            scene.add(this.mesh);
        }
    }

    update(): void {
        // a bone should always have constant length even if the particles move
        // so here we correct the particle positions to maintain the bone's length
        const sub = subtract(this.particle1.position, this.particle2.position);
        const currentLength = magnitude(sub);
        const correction = (currentLength - this.length) / 2;
        const norm = normalize(sub);
        this.particle1.setPosition(add(this.particle1.position, scaleVector(norm, -correction)));
        this.particle2.setPosition(add(this.particle2.position, scaleVector(norm, correction)));

        // there is only a mesh in debug mode
        // if not debug mode all the following will be skipped
        if (!this.mesh) return;

        const p1 = this.particle1.position;
        const p2 = this.particle2.position;

        this.mesh.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);

        const dirVec = new THREE.Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
        const dist = dirVec.length();
        if (dist > 0) {
            this.mesh.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dirVec.divideScalar(dist),
            );
        }
    }
}
