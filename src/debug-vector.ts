import * as THREE from "three";
import type { Vector } from "./math/operations";
import { magnitude } from "./math/operations";

const yAxis = new THREE.Vector3(0, 1, 0);
const scratchDirection = new THREE.Vector3();

export class DebugVector {
    private group: THREE.Group;
    private cylinderMesh: THREE.Mesh;
    private coneMesh: THREE.Mesh;
    private lengthScale: number;

    constructor(
        ankerPoint: Vector,
        direction: Vector,
        color: number,
        options: { cylinderRadius?: number; lengthScale?: number } = {},
    ) {
        this.group = new THREE.Group();
        this.lengthScale = options.lengthScale ?? 1;

        // Calculate the length of the direction vector
        // lengthScale lets callers stretch tiny vectors (e.g. per-step velocity) to a visible size without affecting the underlying data
        const length = magnitude(direction) * this.lengthScale;

        if (length === 0) {
            throw new Error("Direction vector cannot have zero length");
        }

        // Proportions for the arrow
        const cylinderRadius = options.cylinderRadius ?? 0.05;
        const coneRadius = cylinderRadius * 3;

        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.4,
            metalness: 0.1,
        });

        // Both parts are built with unit height and their base at the origin, so the arrow can be
        // resized and re-aimed later (update) just by changing transforms, without rebuilding geometry.
        const cylinderGeometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, 1, 8);
        cylinderGeometry.translate(0, 0.5, 0);
        this.cylinderMesh = new THREE.Mesh(cylinderGeometry, material);

        const coneGeometry = new THREE.ConeGeometry(coneRadius, 1, 8);
        coneGeometry.translate(0, 0.5, 0);
        this.coneMesh = new THREE.Mesh(coneGeometry, material);

        this.group.add(this.cylinderMesh);
        this.group.add(this.coneMesh);

        this.update(ankerPoint, direction);
    }

    // Re-aims and resizes the arrow in place; hides it when the direction has (almost) no length.
    update(ankerPoint: Vector, direction: Vector): void {
        const length = magnitude(direction) * this.lengthScale;
        if (length < 1e-6) {
            this.group.visible = false;
            return;
        }
        this.group.visible = true;

        const coneLength = length * 0.15;
        const cylinderLength = length - coneLength;
        this.cylinderMesh.scale.y = cylinderLength;
        this.coneMesh.position.y = cylinderLength; // cone sits at the end of the shaft
        this.coneMesh.scale.y = coneLength;

        // The default orientation is along the Y-axis, so rotate it onto the direction
        scratchDirection.set(direction.x, direction.y, direction.z).normalize();
        this.group.quaternion.setFromUnitVectors(yAxis, scratchDirection);
        this.group.position.set(ankerPoint.x, ankerPoint.y, ankerPoint.z);
    }

    addToScene(scene: THREE.Scene): void {
        scene.add(this.group);
    }

    removeFromScene(scene: THREE.Scene): void {
        scene.remove(this.group);
    }

    dispose(): void {
        this.cylinderMesh.geometry.dispose();
        this.coneMesh.geometry.dispose();
        if (this.cylinderMesh.material instanceof THREE.Material) {
            this.cylinderMesh.material.dispose();
        }
        if (this.coneMesh.material instanceof THREE.Material) {
            this.coneMesh.material.dispose();
        }
    }
}
