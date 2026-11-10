import { describe, it, expect, vi } from "vitest";
import * as THREE from "three";
import { magnitude, subtract } from "../math/operations";
import { Terrain } from "./terrain";
import { Particle } from "./particle";
import { PapermanBone } from "./bone";
import { PseudoPhysicsWorld } from "./pseudo-physics-world";

function flatTerrain() {
    return new Terrain(
        4,
        [
            [0, 0],
            [0, 0],
        ],
        new THREE.Scene(),
    );
}

function speedHistory(world: PseudoPhysicsWorld, particle: Particle, steps: number): number[] {
    const speeds: number[] = [];
    for (let i = 0; i < steps; i++) {
        world.step();
        speeds.push(magnitude(subtract(particle.position, particle.lastPosition)));
    }
    return speeds;
}

describe("PseudoPhysicsWorld friction on collision", () => {
    it("damps a resting particle's horizontal speed on flat terrain instead of accelerating it", () => {
        const terrain = new Terrain(
            4,
            [
                [0, 0],
                [0, 0],
            ],
            new THREE.Scene(),
        );
        const particle = new Particle(
            { x: -1, y: 0, z: 0 },
            { x: -1.02, y: 0, z: 0 },
            new THREE.Scene(),
        );
        const world = new PseudoPhysicsWorld(terrain, [particle]);

        const speeds = speedHistory(world, particle, 15);

        for (let i = 1; i < speeds.length; i++) {
            expect(speeds[i]).toBeLessThanOrEqual(speeds[i - 1] + 1e-9);
        }
        expect(speeds[speeds.length - 1]).toBeLessThan(speeds[0] * 0.5);
    });

    it("decays speed faster with friction enabled than with friction disabled", () => {
        const dampedTerrain = new Terrain(
            4,
            [
                [0, 0],
                [0, 0],
            ],
            new THREE.Scene(),
        );
        const dampedParticle = new Particle(
            { x: -1, y: 0, z: 0 },
            { x: -1.02, y: 0, z: 0 },
            new THREE.Scene(),
        );
        const dampedWorld = new PseudoPhysicsWorld(dampedTerrain, [dampedParticle]);

        const undampedTerrain = new Terrain(
            4,
            [
                [0, 0],
                [0, 0],
            ],
            new THREE.Scene(),
        );
        const undampedParticle = new Particle(
            { x: -1, y: 0, z: 0 },
            { x: -1.02, y: 0, z: 0 },
            new THREE.Scene(),
        );
        const undampedWorld = new PseudoPhysicsWorld(undampedTerrain, [undampedParticle]);
        undampedWorld.friction = 0;

        const dampedSpeeds = speedHistory(dampedWorld, dampedParticle, 15);
        const undampedSpeeds = speedHistory(undampedWorld, undampedParticle, 15);

        expect(dampedSpeeds[dampedSpeeds.length - 1]).toBeLessThan(
            undampedSpeeds[undampedSpeeds.length - 1],
        );
    });

    it("keeps a particle sliding down a slope numerically stable and speed-capped", () => {
        const slopeHeightmap = [
            [0, 0, 0],
            [0.3, 0.3, 0.3],
            [0.6, 0.6, 0.6],
        ];
        const terrain = new Terrain(3, slopeHeightmap, new THREE.Scene());
        const particle = new Particle(
            { x: -1, y: 1, z: 0 },
            { x: -1, y: 1, z: 0 },
            new THREE.Scene(),
        );
        const world = new PseudoPhysicsWorld(terrain, [particle]);

        const speeds = speedHistory(world, particle, 30);

        for (const speed of speeds) {
            expect(Number.isFinite(speed)).toBe(true);
            expect(speed).toBeLessThanOrEqual(world.maxVelocity * Math.sqrt(3) + 1e-6);
        }

        // Regression guard: a bad terrain-intersection hit (t > 1 along this step's displacement)
        // previously caused a sudden multi-fold speed spike instead of a smooth slide/slow-down.
        for (let i = 1; i < speeds.length; i++) {
            expect(speeds[i]).toBeLessThanOrEqual(speeds[i - 1] + 0.02);
        }
    });
});

describe("PseudoPhysicsWorld bone constraints", () => {
    it("keeps the momentum of bone-linked particles so they accelerate like free particles", () => {
        const scene = new THREE.Scene();
        const a = new Particle({ x: -0.5, y: 50, z: 0 }, { x: -0.5, y: 50, z: 0 }, scene);
        const b = new Particle({ x: 0.5, y: 50, z: 0 }, { x: 0.5, y: 50, z: 0 }, scene);
        const free = new Particle({ x: 0, y: 50, z: 1 }, { x: 0, y: 50, z: 1 }, scene);
        const bone = new PapermanBone(a, b, scene);
        const world = new PseudoPhysicsWorld(flatTerrain(), [a, b, free], [bone]);

        for (let i = 0; i < 10; i++) {
            world.step();
        }

        const freeVelocity = subtract(free.position, free.lastPosition);
        expect(freeVelocity.y).toBeLessThan(0);
        for (const particle of [a, b]) {
            const velocity = subtract(particle.position, particle.lastPosition);
            expect(velocity.y).toBeCloseTo(freeVelocity.y, 9);
        }
    });

    it("moves debug particle meshes to the positions left by the bone corrections", () => {
        const scene = new THREE.Scene();
        const a = new Particle({ x: -0.5, y: 5, z: 0 }, { x: -0.5, y: 5, z: 0 }, scene, true);
        const b = new Particle({ x: 0.5, y: 5, z: 0 }, { x: 0.5, y: 5, z: 0 }, scene, true);
        const bone = new PapermanBone(a, b, scene);
        b.teleportTo({ x: 1.5, y: 5, z: 0 }); // stretch the bone so the step has to correct it
        const world = new PseudoPhysicsWorld(flatTerrain(), [a, b], [bone]);

        world.step();

        const [meshA, meshB] = scene.children;
        expect(meshA.position.toArray()).toEqual([a.position.x, a.position.y, a.position.z]);
        expect(meshB.position.toArray()).toEqual([b.position.x, b.position.y, b.position.z]);
    });

    it("lets the bones adapt to the ground instead of dragging a particle through it", () => {
        const scene = new THREE.Scene();
        const lower = new Particle({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, scene);
        const upper = new Particle({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, scene);
        const bone = new PapermanBone(lower, upper, scene); // rest length 1
        upper.teleportTo({ x: 0, y: 0.5, z: 0 }); // compressed, so the bone pushes the lower particle into the ground
        const world = new PseudoPhysicsWorld(flatTerrain(), [lower, upper], [bone]);
        world.gravityVector = { x: 0, y: 0, z: 0 };
        world.amountBoneUpdateLoops = 25; // enough passes for the bone length to converge to the tight tolerance below

        world.step();

        // the ground and the bone length must both hold, so the upper particle has to take the whole correction
        expect(lower.position.y).toBeGreaterThanOrEqual(0);
        expect(magnitude(subtract(upper.position, lower.position))).toBeCloseTo(bone.length, 6);
    });

    it.each([1, 4])(
        "never ends a step inside the terrain when a braced body lands on it (%i substeps)",
        (substeps) => {
            const scene = new THREE.Scene();
            const corners: Particle[] = [];
            for (const x of [-0.2, 0.2]) {
                for (const y of [0.3, 0.7]) {
                    for (const z of [-0.2, 0.2]) {
                        corners.push(new Particle({ x, y, z }, { x, y, z }, scene));
                    }
                }
            }
            const bones: PapermanBone[] = [];
            for (let i = 0; i < corners.length; i++) {
                for (let j = i + 1; j < corners.length; j++) {
                    bones.push(new PapermanBone(corners[i], corners[j], scene));
                }
            }
            const world = new PseudoPhysicsWorld(flatTerrain(), corners, bones);
            world.substeps = substeps;

            for (let step = 0; step < 100; step++) {
                world.step();
                for (const corner of corners) {
                    expect(corner.position.y).toBeGreaterThanOrEqual(-1e-9);
                }
            }

            // the body really did land and rest on the ground, so the loop above checked actual contact
            expect(Math.min(...corners.map((corner) => corner.position.y))).toBeCloseTo(0, 3);
        },
    );
});

describe("PseudoPhysicsWorld substeps", () => {
    function particleAt(
        position: { x: number; y: number; z: number },
        velocity = { x: 0, y: 0, z: 0 },
    ) {
        return new Particle(position, subtract(position, velocity), new THREE.Scene());
    }

    it("only accepts a whole number of at least 1 as substep count", () => {
        const world = new PseudoPhysicsWorld(flatTerrain());
        world.substeps = 3;

        for (const invalid of [0, -2, 1.5, NaN, Infinity]) {
            expect(() => (world.substeps = invalid)).toThrow("Substeps must be a whole number");
        }

        expect(world.substeps).toBe(3);
    });

    it("updates every bone amountBoneUpdateLoops times in every substep", () => {
        const scene = new THREE.Scene();
        const a = new Particle({ x: 0, y: 5, z: 0 }, { x: 0, y: 5, z: 0 }, scene);
        const b = new Particle({ x: 1, y: 5, z: 0 }, { x: 1, y: 5, z: 0 }, scene);
        const bone = new PapermanBone(a, b, scene);
        const update = vi.spyOn(bone, "update");
        const world = new PseudoPhysicsWorld(flatTerrain(), [a, b], [bone]);
        world.substeps = 3;
        world.amountBoneUpdateLoops = 5;

        world.step();

        expect(update).toHaveBeenCalledTimes(15);
    });

    it("lets a particle fall the same distance per step no matter how many substeps a step has", () => {
        const drops = [1, 2, 4, 8].map((substeps) => {
            const particle = particleAt({ x: 0, y: 100, z: 0 });
            const world = new PseudoPhysicsWorld(flatTerrain(), [particle]);
            world.gravityVector = { x: 0, y: -0.001, z: 0 };
            world.substeps = substeps;

            for (let i = 0; i < 20; i++) {
                world.step();
            }

            return 100 - particle.position.y;
        });

        // finer time slices only change the result by the discretisation error (about 0.2 for 20 steps)
        expect(drops[0]).toBeGreaterThan(0.2);
        for (const drop of drops) {
            expect(Math.abs(drop - drops[0]) / drops[0]).toBeLessThan(0.1);
        }
    });

    it("keeps the speed limit per step no matter how many substeps a step has", () => {
        for (const substeps of [1, 3, 8]) {
            const particle = particleAt({ x: 0, y: 1000, z: 0 });
            const world = new PseudoPhysicsWorld(flatTerrain(), [particle]);
            world.gravityVector = { x: 0, y: -0.01, z: 0 };
            world.maxVelocity = 0.05;
            world.substeps = substeps;
            for (let i = 0; i < 50; i++) {
                world.step(); // long enough to be falling at the limit
            }

            const before = particle.position.y;
            world.step();

            expect(before - particle.position.y).toBeCloseTo(0.05, 9);
        }
    });

    it("keeps position - lastPosition as the velocity per step whatever the substep count is", () => {
        for (const substeps of [1, 2, 5]) {
            const particle = particleAt({ x: 0, y: 50, z: 0 }, { x: 0.01, y: 0, z: 0.02 });
            const world = new PseudoPhysicsWorld(flatTerrain(), [particle]);
            world.gravityVector = { x: 0, y: 0, z: 0 };
            world.substeps = substeps;

            for (let i = 0; i < 5; i++) {
                world.step();
            }

            expect(particle.position.x).toBeCloseTo(0.05, 9);
            expect(particle.position.z).toBeCloseTo(0.1, 9);
            const velocity = subtract(particle.position, particle.lastPosition);
            expect(velocity.x).toBeCloseTo(0.01, 9);
            expect(velocity.z).toBeCloseTo(0.02, 9);
        }
    });

    it("damps a sliding particle by the same friction per step no matter how many substeps a step has", () => {
        const speeds = [1, 4].map((substeps) => {
            const particle = particleAt({ x: -1, y: 0, z: 0 }, { x: 0.02, y: 0, z: 0 });
            const world = new PseudoPhysicsWorld(flatTerrain(), [particle]);
            world.friction = 0.1;
            world.substeps = substeps;

            for (let i = 0; i < 15; i++) {
                world.step();
            }

            return magnitude(subtract(particle.position, particle.lastPosition));
        });

        expect(speeds[1]).toBeCloseTo(speeds[0], 6);
        expect(speeds[0]).toBeLessThan(0.02 * 0.5); // friction really slowed it down (0.9^15 is about 0.2)
    });

    it("keeps a falling chain more rigid than the same number of bone updates in one big step", () => {
        function worstStretch(substeps: number, loops: number) {
            const scene = new THREE.Scene();
            const particles: Particle[] = [];
            for (let i = 0; i <= 6; i++) {
                const position = { x: 0, y: 3 + i * 0.3, z: 0 };
                particles.push(new Particle(position, position, scene));
            }
            const bones: PapermanBone[] = [];
            for (let i = 0; i < 6; i++) {
                bones.push(new PapermanBone(particles[i], particles[i + 1], scene));
            }
            const world = new PseudoPhysicsWorld(flatTerrain(), particles, bones);
            world.gravityVector = { x: 0, y: -0.00481, z: 0 };
            world.substeps = substeps;
            world.amountBoneUpdateLoops = loops;

            let worst = 0;
            for (let i = 0; i < 200; i++) {
                world.step(); // falls at the speed limit and lands on its lowest particle
                for (const bone of bones) {
                    const length = magnitude(
                        subtract(bone.particle1.position, bone.particle2.position),
                    );
                    worst = Math.max(worst, Math.abs(length - bone.length) / bone.length);
                }
            }
            return worst;
        }

        const oneBigStep = worstStretch(1, 16);
        const manySubsteps = worstStretch(16, 1);

        expect(manySubsteps).toBeLessThan(oneBigStep * 0.7);
    });

    it("draws the velocity arrows with the velocity per step", () => {
        const scene = new THREE.Scene();
        const particle = new Particle({ x: 0, y: 50, z: 0 }, { x: -0.01, y: 50, z: 0 }, scene);
        const world = new PseudoPhysicsWorld(flatTerrain(), [particle], [], scene, true);
        world.gravityVector = { x: 0, y: 0, z: 0 };
        world.substeps = 4;

        world.step();

        const arrow = scene.children[0]; // shaft and head, both scaled along their length
        const arrowLength = arrow.children.reduce((sum, part) => sum + part.scale.y, 0);
        expect(arrowLength).toBeCloseTo(0.01, 9);
    });
});
