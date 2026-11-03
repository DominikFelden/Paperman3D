import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { magnitude, subtract } from "../math/operations";
import { Particle } from "./particle";
import { PapermanBone } from "./bone";

function stretchedBone() {
    const scene = new THREE.Scene();
    const a = new Particle({ x: 0, y: 0, z: 0 }, { x: -0.1, y: 0, z: 0 }, scene);
    const b = new Particle({ x: 1, y: 0, z: 0 }, { x: 0.9, y: 0, z: 0 }, scene);
    const bone = new PapermanBone(a, b, scene); // rest length 1
    b.setPosition({ x: 3, y: 0, z: 0 }); // stretched to length 3
    return { a, b, bone };
}

describe("PapermanBone.update", () => {
    it("restores the bone length by moving both particles half the error each", () => {
        const { a, b, bone } = stretchedBone();

        bone.update();

        expect(a.position.x).toBeCloseTo(1);
        expect(b.position.x).toBeCloseTo(2);
        expect(magnitude(subtract(a.position, b.position))).toBeCloseTo(bone.length);
    });

    it("keeps lastPosition untouched so the correction does not erase the particles' velocity", () => {
        const { a, b, bone } = stretchedBone();

        bone.update();

        expect(a.lastPosition).toEqual({ x: -0.1, y: 0, z: 0 });
        expect(b.lastPosition).toEqual({ x: 1, y: 0, z: 0 });
    });
});
