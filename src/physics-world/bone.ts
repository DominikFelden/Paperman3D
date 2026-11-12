import * as THREE from "three";
import { magnitude, subtract } from "../math/operations";
import type { Particle } from "./particle";

// reused every updateMesh call so the per-frame debug sync allocates nothing
const yAxis = new THREE.Vector3(0, 1, 0);
const scratchDirection = new THREE.Vector3();

// one material per color, shared by all bone/muscle meshes
const boneMaterials = new Map<number, THREE.MeshStandardMaterial>();
function getBoneMaterial(color: number): THREE.MeshStandardMaterial {
    let material = boneMaterials.get(color);
    if (!material) {
        material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
        boneMaterials.set(color, material);
    }
    return material;
}

export class PapermanBone {
    particle1: Particle;
    particle2: Particle;
    length: number;
    private mesh: THREE.Mesh | null = null;
    // getter instead of field so subclasses can override it before the base constructor builds the mesh
    protected get colorDebugMode(): number {
        return 0x44aaff;
    }

    // TODO: test the effect of different overrelaxation factors on convergence speed and stability
    private overrelaxationFactor = 1.2; // This should speed up Gauss-Seidel convergence

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
            const material = getBoneMaterial(this.colorDebugMode);
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
        // (the debug mesh is not touched here; call updateMesh() once after all constraint iterations)
        const p1 = this.particle1.position;
        const p2 = this.particle2.position;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        const currentLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (currentLength === 0) return; // no direction to correct along

        // moving each particle by half the error time overrelaxation along the bone direction
        // (correctPosition leaves lastPosition alone, so the particles keep their momentum)
        const factor =
            ((currentLength - this.length) * this.overrelaxationFactor) / (2 * currentLength);
        this.particle1.correctPosition(-dx * factor, -dy * factor, -dz * factor);
        this.particle2.correctPosition(dx * factor, dy * factor, dz * factor);
    }

    // syncs the debug mesh with the current particle positions
    updateMesh(): void {
        // there is only a mesh in debug mode
        // if not debug mode all the following will be skipped
        if (!this.mesh) return;

        const p1 = this.particle1.position;
        const p2 = this.particle2.position;

        this.mesh.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);

        scratchDirection.set(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
        const dist = scratchDirection.length();
        if (dist > 0) {
            this.mesh.quaternion.setFromUnitVectors(yAxis, scratchDirection.divideScalar(dist));
        }
    }
}
