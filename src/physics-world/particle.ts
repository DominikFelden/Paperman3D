import * as THREE from "three";
import type { Vector } from "../math/operations";
import { subtract, magnitude } from "../math/operations";
import { DebugVector } from "../debug-vector";
import { GLOBAL_DEBUG, TRAIL_MAX_LENGTH, ENABLE_TRAILS } from "../debug-config";

// Shared across all particles so enabling the trail doesn't allocate a new geometry/material every step.
const trailMarkerGeometry = new THREE.SphereGeometry(0.02, 8, 8);
const trailMarkerMaterial = new THREE.MeshBasicMaterial({
    color: 0x33ccff,
    transparent: true,
    opacity: 0.5,
});

// Shared by all debug particle meshes so each particle doesn't build its own geometry/material.
const particleGeometry = new THREE.SphereGeometry(0.02, 16, 16);
const particleMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    roughness: 0.5,
    metalness: 0.1,
});

export class Particle {
    position: Vector;
    lastPosition: Vector;
    private mesh: THREE.Mesh | null = null;
    private scene: THREE.Scene;
    private trailMarkers: THREE.Mesh[] = [];
    private trailVectors: DebugVector[] = [];

    constructor(
        position: Vector,
        lastPosition: Vector,
        scene: THREE.Scene,
        debug: boolean = false,
    ) {
        this.position = { ...position };
        this.lastPosition = { ...lastPosition };
        this.scene = scene;

        if (debug) {
            this.mesh = new THREE.Mesh(particleGeometry, particleMaterial);
            this.mesh.position.set(position.x, position.y, position.z);
            scene.add(this.mesh);
        }
    }

    setPosition(position: Vector) {
        const previousPosition = this.position;
        // the old position object can become lastPosition without a copy: correctPosition only ever
        // mutates the current position object, and this call replaces it with a fresh one
        this.lastPosition = previousPosition;
        this.position = { x: position.x, y: position.y, z: position.z };
        if (this.mesh) {
            this.mesh.position.set(position.x, position.y, position.z);
        }

        // Trail of past positions + per-step velocity vectors; the check keeps this a no-op when debugging is off.
        if (GLOBAL_DEBUG && ENABLE_TRAILS) {
            this.recordTrailPoint(previousPosition, subtract(position, previousPosition));
        }
    }

    // applies a constraint correction (e.g. from a bone) without touching lastPosition, so the particle
    // keeps its velocity; setPosition would overwrite lastPosition and wipe out the momentum of the step.
    // The debug mesh is not touched here; call updateMesh() once after all corrections.
    correctPosition(dx: number, dy: number, dz: number) {
        this.position.x += dx;
        this.position.y += dy;
        this.position.z += dz;
    }

    // scales the Verlet velocity (position - lastPosition) without moving the particle, used when the
    // time slice a step is simulated in changes (substeps)
    scaleVelocity(factor: number) {
        const { position, lastPosition } = this;
        this.lastPosition = {
            x: position.x - (position.x - lastPosition.x) * factor,
            y: position.y - (position.y - lastPosition.y) * factor,
            z: position.z - (position.z - lastPosition.z) * factor,
        };
    }

    // syncs the debug mesh with the current position
    updateMesh() {
        // there is only a mesh in debug mode
        if (!this.mesh) return;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    }

    // moves the particle without giving it any velocity (setPosition would turn the jump into velocity)
    teleportTo(position: Vector) {
        this.position = { ...position };
        this.lastPosition = { ...position };
        if (this.mesh) {
            this.mesh.position.set(position.x, position.y, position.z);
        }
    }

    private recordTrailPoint(point: Vector, velocity: Vector) {
        const marker = new THREE.Mesh(trailMarkerGeometry, trailMarkerMaterial);
        marker.position.set(point.x, point.y, point.z);
        this.scene.add(marker);
        this.trailMarkers.push(marker);

        if (magnitude(velocity) > 1e-6) {
            const arrow = new DebugVector(point, velocity, 0x33ccff, {
                cylinderRadius: 0.008,
                lengthScale: 1,
            });
            arrow.addToScene(this.scene);
            this.trailVectors.push(arrow);
        }

        // Drop the oldest entries once the trail exceeds its cap so memory stays bounded.
        while (this.trailMarkers.length > TRAIL_MAX_LENGTH) {
            this.scene.remove(this.trailMarkers.shift()!);
        }
        while (this.trailVectors.length > TRAIL_MAX_LENGTH) {
            const old = this.trailVectors.shift()!;
            old.removeFromScene(this.scene);
            old.dispose();
        }
    }
}

export function getZeroVelocityParticle(
    position: Vector,
    scene: THREE.Scene,
    debug: boolean = false,
): Particle {
    return new Particle(position, position, scene, debug);
}
