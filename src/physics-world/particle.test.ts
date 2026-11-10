import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { Particle } from "./particle";

describe("Particle.correctPosition", () => {
    it("moves the particle without touching lastPosition so its velocity is preserved", () => {
        const particle = new Particle(
            { x: 0, y: 0, z: 0 },
            { x: -1, y: 0, z: 0 },
            new THREE.Scene(),
        );

        particle.correctPosition(0.5, -0.25, 2);

        expect(particle.position).toEqual({ x: 0.5, y: -0.25, z: 2 });
        expect(particle.lastPosition).toEqual({ x: -1, y: 0, z: 0 });
    });

    it("never alters the history that setPosition stored as lastPosition", () => {
        const particle = new Particle(
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
            new THREE.Scene(),
        );

        particle.correctPosition(1, 0, 0); // corrections belong to the final position of the step
        particle.setPosition({ x: 5, y: 0, z: 0 });
        particle.correctPosition(-2, 0, 0);

        expect(particle.lastPosition).toEqual({ x: 1, y: 0, z: 0 });
        expect(particle.position).toEqual({ x: 3, y: 0, z: 0 });
    });
});

describe("Particle.scaleVelocity", () => {
    it("scales the velocity without moving the particle", () => {
        const particle = new Particle(
            { x: 1, y: 2, z: 3 },
            { x: 0, y: 0, z: 0 },
            new THREE.Scene(),
        );

        particle.scaleVelocity(0.5);

        expect(particle.position).toEqual({ x: 1, y: 2, z: 3 });
        expect(particle.lastPosition).toEqual({ x: 0.5, y: 1, z: 1.5 });
    });

    it("restores the original velocity when scaled back", () => {
        const particle = new Particle(
            { x: 1, y: 2, z: 3 },
            { x: 0.9, y: 1.7, z: 3.1 },
            new THREE.Scene(),
        );

        particle.scaleVelocity(1 / 3);
        particle.scaleVelocity(3);

        expect(particle.lastPosition.x).toBeCloseTo(0.9, 12);
        expect(particle.lastPosition.y).toBeCloseTo(1.7, 12);
        expect(particle.lastPosition.z).toBeCloseTo(3.1, 12);
    });

    it("keeps lastPosition a separate object so bone corrections cannot change the velocity afterwards", () => {
        const particle = new Particle(
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
            new THREE.Scene(),
        );

        particle.scaleVelocity(2);
        particle.correctPosition(5, 0, 0);

        expect(particle.lastPosition).toEqual({ x: -1, y: 0, z: 0 });
        expect(particle.position).toEqual({ x: 6, y: 0, z: 0 });
    });
});

describe("Particle.updateMesh", () => {
    it("moves the debug mesh to the current position only when asked to", () => {
        const scene = new THREE.Scene();
        const particle = new Particle({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, scene, true);
        const mesh = scene.children[0];

        particle.correctPosition(1, 2, 3);
        expect(mesh.position.toArray()).toEqual([0, 1, 0]);

        particle.updateMesh();
        expect(mesh.position.toArray()).toEqual([1, 3, 3]);
    });

    it("does nothing for a particle without a debug mesh", () => {
        const particle = new Particle(
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
            new THREE.Scene(),
        );

        expect(() => particle.updateMesh()).not.toThrow();
    });
});
