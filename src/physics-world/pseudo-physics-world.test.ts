import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { magnitude, subtract } from "../math/operations";
import { Terrain } from "./terrain";
import { Particle } from "./particle";
import { PapermanBone } from "./bone";
import { PseudoPhysicsWorld } from "./pseudo-physics-world";

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
});
