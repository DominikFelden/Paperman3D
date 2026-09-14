import { add, magnitude, projectVectorOntoPlane, scaleVector, subtract, type Vector } from "./math";
import type { Particle } from "./particle";
import type { Terrain } from "./terrain";
import type { Scene } from "three";
import { DebugVector } from "./debug-vector";

export class PseudoPhysicsWorld {
    // physical constants
    gravityVector = { x: 0, y: -0.000981, z: 0 }; // Gravity vector (m/s^2)
    maxVelocity = 0.1; // Maximum allowed velocity for particles (m/s)
    // objects
    terrain: Terrain;
    particles: Particle[] = [];
    friction: number = 0.1; // Coefficient of friction for particles on the terrain
    // cylinders: Cylinder[] = [];
    // boxes: Box[] = [];
    // spheres: Sphere[] = [];
    // other geographic sahpes...
    private scene?: Scene;
    private debug: boolean;
    private velocityVectors = new Map<Particle, DebugVector>(); // tracks per-particle debug arrows so they can be replaced each frame

    constructor(terrain: Terrain, particles: Particle[] = [], scene?: Scene, debug: boolean = false) {
        this.terrain = terrain;
        this.particles = particles;
        this.scene = scene;
        this.debug = debug;
    }

    step() {
        // Update particle positions based on their velocities and collisions
        for (const particle of this.particles) {
            const oldPosition = particle.position;

            // Simple physics integration (e.g., Euler method)
            let velocity = subtract(particle.position, particle.lastPosition);
            velocity = this.controlMaxVelocity(velocity);
            const fullDisplacement = add(velocity, this.gravityVector);

            let newPosition = add(particle.position, fullDisplacement);

            // Check if the integrated new position has crossed the terrain surface
            if (this.terrain.detectPointBelowTerrain(newPosition)) {
                const intersection = this.terrain.getLineTerrainIntersection(particle.position, fullDisplacement);
                if (intersection) {
                    // When there is an intersection the particle should move to the intersection point
                    // and after that it should move with the remaining displacement along the triangle surface
                    const remainingDisplacement = subtract(fullDisplacement, subtract(intersection.point, particle.position));
                    // to achieve this the remainingdisplacement must be projected onto the plane of the triangle
                    const projectedRemainingDisplacement = projectVectorOntoPlane(remainingDisplacement, intersection.triangle.normal);
                    newPosition = add(intersection.point, scaleVector(projectedRemainingDisplacement, 1-this.friction));
                } else {
                    // fallback when ray misses all triangles: still damp horizontal motion so friction stays consistent with the intersection path
                    const horizontalDisplacement = { x: fullDisplacement.x, y: 0, z: fullDisplacement.z };
                    newPosition = add(particle.position, scaleVector(horizontalDisplacement, 1 - this.friction));
                    newPosition.y = this.terrain.getTerrainHeightAt(newPosition.x, newPosition.z);
                }
            }

            particle.setPosition(newPosition);

            if (this.debug && this.scene) {
                this.updateVelocityDebugVector(particle, subtract(particle.position, oldPosition));
            }
        }
    }

    // (re)draws the debug arrow representing a particle's resulting velocity for this frame
    private updateVelocityDebugVector(particle: Particle, velocity: Vector) {
        const existing = this.velocityVectors.get(particle);
        if (existing) {
            existing.removeFromScene(this.scene!);
            existing.dispose();
            this.velocityVectors.delete(particle);
        }

        if (magnitude(velocity) < 1e-6) return; // DebugVector throws on a zero-length direction

        const arrow = new DebugVector(particle.position, velocity, 0xffff00);
        arrow.addToScene(this.scene!);
        this.velocityVectors.set(particle, arrow);
    }

    controlMaxVelocity(velocity: Vector) {
        if(velocity.x > this.maxVelocity) velocity.x = this.maxVelocity;
        if(velocity.y > this.maxVelocity) velocity.y = this.maxVelocity;
        if(velocity.z > this.maxVelocity) velocity.z = this.maxVelocity;
        if(velocity.x < -this.maxVelocity) velocity.x = -this.maxVelocity;
        if(velocity.y < -this.maxVelocity) velocity.y = -this.maxVelocity;
        if(velocity.z < -this.maxVelocity) velocity.z = -this.maxVelocity;
        return velocity;
    }
}