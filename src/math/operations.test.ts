import { describe, it, expect } from "vitest";
import { calculateIntersectionPlaneLine } from "./operations";

describe("calculateIntersectionPlaneLine", () => {
    it("intersects a horizontal plane (XZ) with a vertical line", () => {
        // Plane: y = 2, normal pointing up, anchor at origin
        const planeNormal = { x: 0, y: 1, z: 0 };
        const planePoint = { x: 0, y: 2, z: 0 };

        // Line: starts at (3, 5, 1), shoots straight down
        const linePoint = { x: 3, y: 5, z: 1 };
        const lineDirection = { x: 0, y: -1, z: 0 };

        const result = calculateIntersectionPlaneLine(
            planeNormal,
            planePoint,
            linePoint,
            lineDirection,
        );

        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(3);
        expect(result!.y).toBeCloseTo(2);
        expect(result!.z).toBeCloseTo(1);
    });

    it("intersects a tilted plane with a diagonal line", () => {
        // Plane: passes through origin with normal (0, 0, 1) — the XY plane
        const planeNormal = { x: 0, y: 0, z: 1 };
        const planePoint = { x: 0, y: 0, z: 0 };

        // Line: starts at (1, 1, 3) and travels in direction (0, 0, -1)
        const linePoint = { x: 1, y: 1, z: 3 };
        const lineDirection = { x: 0, y: 0, z: -1 };

        const result = calculateIntersectionPlaneLine(
            planeNormal,
            planePoint,
            linePoint,
            lineDirection,
        );

        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(1);
        expect(result!.y).toBeCloseTo(1);
        expect(result!.z).toBeCloseTo(0);
    });

    it("returns null when the line is parallel to the plane", () => {
        // Plane: y = 0, normal pointing up
        const planeNormal = { x: 0, y: 1, z: 0 };
        const planePoint = { x: 0, y: 0, z: 0 };

        // Line: travels horizontally — direction has no y component, never hits the plane
        const linePoint = { x: 1, y: 3, z: 1 };
        const lineDirection = { x: 1, y: 0, z: 0 };

        const result = calculateIntersectionPlaneLine(
            planeNormal,
            planePoint,
            linePoint,
            lineDirection,
        );

        expect(result).toBeNull();
    });

    it("intersects when the line starts exactly on the plane", () => {
        // Plane: y = 0, normal pointing up
        const planeNormal = { x: 0, y: 1, z: 0 };
        const planePoint = { x: 0, y: 0, z: 0 };

        // Line starts on the plane and moves at an angle
        const linePoint = { x: 2, y: 0, z: 2 };
        const lineDirection = { x: 1, y: 1, z: 0 };

        const result = calculateIntersectionPlaneLine(
            planeNormal,
            planePoint,
            linePoint,
            lineDirection,
        );

        // t = 0, so intersection is the line point itself
        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(2);
        expect(result!.y).toBeCloseTo(0);
        expect(result!.z).toBeCloseTo(2);
    });
});
