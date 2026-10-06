import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { Terrain } from "./terrain";

describe("Terrain.getLineTerrainIntersection", () => {
    it("ignores a plane hit that lies beyond the given displacement segment (t > 1)", () => {
        const terrain = new Terrain(
            4,
            [
                [0, 0],
                [0, 0],
            ],
            new THREE.Scene(),
        );

        // Direction only covers 0.1 units of travel, but the flat terrain (y=0) is 0.5 below the
        // line point, so the unbounded ray parameter would be t=5 — five times this step's motion.
        const linePoint = { x: 0, y: 0.5, z: 0 };
        const lineDirection = { x: 0, y: -0.1, z: 0 };

        const result = terrain.getLineTerrainIntersection(linePoint, lineDirection);

        expect(result).toBeNull();
    });

    it("still finds a plane hit that lies within the given displacement segment (t <= 1)", () => {
        const terrain = new Terrain(
            4,
            [
                [0, 0],
                [0, 0],
            ],
            new THREE.Scene(),
        );

        // t = 0.5 / 0.6 ≈ 0.83, within this step's motion.
        const linePoint = { x: 0, y: 0.5, z: 0 };
        const lineDirection = { x: 0, y: -0.6, z: 0 };

        const result = terrain.getLineTerrainIntersection(linePoint, lineDirection);

        expect(result).not.toBeNull();
        expect(result!.point.y).toBeCloseTo(0);
    });
});
