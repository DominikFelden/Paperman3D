import { GLOBAL_DEBUG } from "../debug-config";
import { PapermanBone } from "../physics-world/bone";
import { Particle } from "../physics-world/particle";
import * as THREE from "three";

export class PapermanTorso {
    shoulderLeftLower: Particle;
    shoulderRightLower: Particle;
    waistLeft: Particle;
    waistRight: Particle;

    scene: THREE.Scene;

    constructor(
        shoulderLeftLower: Particle,
        shoulderRightLower: Particle,
        waistLeft: Particle,
        waistRight: Particle,
        scene: THREE.Scene,
    ) {
        this.scene = scene;

        this.shoulderLeftLower = shoulderLeftLower;
        this.shoulderRightLower = shoulderRightLower;
        this.waistLeft = waistLeft;
        this.waistRight = waistRight;

    }

    getParticles() {
        return {
            shoulderLeftLower: this.shoulderLeftLower,
            shoulderRightLower: this.shoulderRightLower,
            waistLeft: this.waistLeft,
            waistRight: this.waistRight,
        };
    }

}
