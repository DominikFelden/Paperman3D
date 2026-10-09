import type { Vector } from "../math/operations";
import { getZeroVelocityParticle } from "../physics-world/particle";
import { defaultBodyData } from "./body-default-data";
import { PapermanHead } from "./head";
import { PapermanTorso } from "./torso";
import * as THREE from "three";

export class PapermanBody {
    anchorPoint: Vector;
    yRotation: number;
    head: PapermanHead;
    torso: PapermanTorso;
    scene: THREE.Scene;
    debug: boolean;
    constructor(anchorPoint: Vector, yRotation: number, scene: THREE.Scene, debug: boolean) {
        this.anchorPoint = anchorPoint;
        this.yRotation = yRotation;
        this.scene = scene;
        this.debug = debug;
        this.head = new PapermanHead(
            getZeroVelocityParticle(defaultBodyData.head.top, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.topLeft, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.topRight, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.bottomLeft, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.bottomRight, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.neckUpperLeft, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.neckUpperRight, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.neckLowerLeft, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.neckLowerRight, scene, debug),
            scene,
        );
        this.torso = new PapermanTorso(
            getZeroVelocityParticle(defaultBodyData.torso.leftShoulder, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.rightShoulder, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.leftWaist, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.rightWaist, scene, debug),
            scene,
        );
    }

    getParticles() {
        return [...this.head.getParticles(), ...Object.values(this.torso.getParticles())];
    }

    getBones() {
        return this.head.getBones();
    }

    getMuscles() {
        return this.head.getMuscles();
    }
}
