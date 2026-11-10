import {
    add,
    magnitude,
    projectVectorOntoPlane,
    scaleVector,
    subtract,
    type Vector,
} from "../math/operations";
import type { Particle } from "./particle";
import type { Terrain } from "./terrain";
import type { Scene } from "three";
import type { PapermanBone } from "./bone";
import { DebugVector } from "../debug-vector";

export class PseudoPhysicsWorld {
    // physical constants, all given per full step: the world scales them itself when a step is split into substeps
    gravityVector = { x: 0, y: -0.000481, z: 0 }; // Gravity vector (m/s^2)
    maxVelocity = 0.1; // Maximum allowed velocity for particles (m/s)
    // objects
    terrain: Terrain;
    particles: Particle[] = [];
    bones: PapermanBone[] = [];
    friction: number = 0.05; // Coefficient of friction for particles on the terrain
    // cylinders: Cylinder[] = [];
    // boxes: Box[] = [];
    // spheres: Sphere[] = [];
    // other geographic sahpes...
    private scene?: Scene;
    private debug: boolean;
    private velocityVectors = new Map<Particle, DebugVector>(); // tracks per-particle debug arrows so they can be replaced each frame

    // 4 substeps with 2 bone updates each keep the skeleton about as rigid as 25 bone updates in one big step did
    amountBoneUpdateLoops = 2; // Number of times to update bones per substep
    private substepCount = 4;

    constructor(
        terrain: Terrain,
        particles: Particle[] = [],
        bones: PapermanBone[] = [],
        scene?: Scene,
        debug: boolean = false,
    ) {
        this.terrain = terrain;
        this.particles = particles;
        this.bones = bones;
        this.scene = scene;
        this.debug = debug;
    }

    // Number of shorter time slices every step is simulated in (whole number >= 1). The bones stay much
    // more rigid with several substeps and few bone updates each than with the same number of bone
    // updates in one big step, because the particles move less between two constraint passes.
    get substeps(): number {
        return this.substepCount;
    }

    set substeps(value: number) {
        if (!Number.isInteger(value) || value < 1) {
            throw new Error(`Substeps must be a whole number >= 1, provided value is ${value}`);
        }
        this.substepCount = value;
    }

    step() {
        // if(this.debug) console.log('\n New Step:')
        const substeps = this.substeps;
        // A step is simulated as `substeps` shorter time slices (h = 1 / substeps). Displacements scale with h,
        // accelerations with h², and the friction damping has to compound back to the per-step value
        const substepGravity = scaleVector(this.gravityVector, 1 / (substeps * substeps));
        const substepMaxVelocity = this.maxVelocity / substeps;
        const substepFriction = 1 - Math.pow(1 - this.friction, 1 / substeps);

        // between steps the velocity (position - lastPosition) is stored per full step, so it doesn't depend on the
        // number of substeps; inside the step it has to be per substep
        this.scaleParticleVelocities(1 / substeps);
        for (let i = 0; i < substeps; i++) {
            this.integrateParticles(substepGravity, substepMaxVelocity, substepFriction);
            this.solveConstraints();
        }
        this.scaleParticleVelocities(substeps);

        if (this.debug && this.scene) {
            for (const particle of this.particles) {
                this.updateVelocityDebugVector(
                    particle,
                    subtract(particle.position, particle.lastPosition),
                );
            }
        }

        // meshes only need to follow the final positions, not every constraint iteration
        // (particles only have a mesh if they were created in debug mode, otherwise this is a no-op)
        for (const particle of this.particles) {
            particle.updateMesh();
        }
        if (this.debug) {
            for (const bone of this.bones) {
                bone.updateMesh();
            }
        }
    }

    // scales the velocity of every particle without moving any of them
    private scaleParticleVelocities(factor: number) {
        if (factor === 1) return;
        for (const particle of this.particles) {
            particle.scaleVelocity(factor);
        }
    }

    // Update particle positions based on their velocities and collisions
    private integrateParticles(gravity: Vector, maxVelocity: number, friction: number) {
        for (const particle of this.particles) {
            // Simple physics integration (e.g., Euler method)
            const velocity = subtract(particle.position, particle.lastPosition);
            let fullDisplacement = add(velocity, gravity);
            fullDisplacement = this.controlMaxVelocity(fullDisplacement, maxVelocity);

            // if(this.debug) console.log(`Full displacement for particle: ${JSON.stringify(fullDisplacement)} and Full displacement magnitude: ${magnitude(fullDisplacement)}`)

            let newPosition = add(particle.position, fullDisplacement);

            // Check if the integrated new position has crossed the terrain surface
            if (this.terrain.detectPointBelowTerrain(newPosition)) {
                const intersection = this.terrain.getLineTerrainIntersection(
                    particle.position,
                    fullDisplacement,
                );
                if (intersection) {
                    // if(this.debug) console.log(`Intersection with Triangle detected`)
                    // When there is an intersection the particle should move to the intersection point
                    // and after that it should move with the remaining displacement along the triangle surface
                    const remainingDisplacement = subtract(
                        fullDisplacement,
                        subtract(intersection.point, particle.position),
                    );
                    // to achieve this the remainingdisplacement must be projected onto the plane of the triangle
                    const projectedRemainingDisplacement = projectVectorOntoPlane(
                        remainingDisplacement,
                        intersection.triangle.normal,
                    );
                    newPosition = add(
                        intersection.point,
                        scaleVector(projectedRemainingDisplacement, 1 - friction),
                    );
                } else {
                    if (this.debug) console.log(`Falling back to horizontal displacement`);

                    // fallback when ray misses all triangles: still damp horizontal motion so friction stays consistent with the intersection path
                    const horizontalDisplacement = {
                        x: fullDisplacement.x,
                        y: 0,
                        z: fullDisplacement.z,
                    };
                    newPosition = add(
                        particle.position,
                        scaleVector(horizontalDisplacement, 1 - friction),
                    );
                    newPosition.y = this.terrain.getTerrainHeightAt(newPosition.x, newPosition.z);
                }
            }

            particle.setPosition(newPosition);
        }
    }

    // pulls the bones back to their length. After every pass the ground is enforced again: the bones can drag
    // particles into the terrain, and this lets them adapt to it instead of fighting it, so no particle
    // ends a substep below the surface
    private solveConstraints() {
        for (let i = 0; i < this.amountBoneUpdateLoops; i++) {
            for (const bone of this.bones) {
                bone.update();
            }
            this.resolveTerrainPenetrations();
        }
    }

    // pushes particles that ended up below the terrain surface (e.g. dragged there by the bones) straight back up
    // onto it. Only position is corrected, lastPosition stays, so the Verlet velocity is untouched.
    private resolveTerrainPenetrations() {
        for (const particle of this.particles) {
            const position = particle.position;
            const surfaceHeight = this.terrain.getTerrainHeightAt(position.x, position.z);
            if (position.y < surfaceHeight) {
                particle.correctPosition(0, surfaceHeight - position.y, 0);
            }
        }
    }

    // updates the debug arrow representing a particle's resulting velocity for this frame (created once, then reused)
    private updateVelocityDebugVector(particle: Particle, velocity: Vector) {
        let arrow = this.velocityVectors.get(particle);
        if (!arrow) {
            if (magnitude(velocity) < 1e-6) return; // DebugVector throws on a zero-length direction
            // velocity magnitudes are tiny per step, so thin the arrow out to keep it legible
            arrow = new DebugVector(particle.position, velocity, 0xffff00, {
                cylinderRadius: 0.01,
                lengthScale: 1,
            });
            arrow.addToScene(this.scene!);
            this.velocityVectors.set(particle, arrow);
            return;
        }

        // DebugVector hides itself when the direction is (almost) zero
        arrow.update(particle.position, velocity);
    }

    controlMaxVelocity(velocity: Vector, maxVelocity: number = this.maxVelocity) {
        if (velocity.x > maxVelocity) velocity.x = maxVelocity;
        if (velocity.y > maxVelocity) velocity.y = maxVelocity;
        if (velocity.z > maxVelocity) velocity.z = maxVelocity;
        if (velocity.x < -maxVelocity) velocity.x = -maxVelocity;
        if (velocity.y < -maxVelocity) velocity.y = -maxVelocity;
        if (velocity.z < -maxVelocity) velocity.z = -maxVelocity;
        return velocity;
    }
}
