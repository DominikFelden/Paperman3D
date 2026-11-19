// the arm class is different from the torso and head class because it takes
// two shoulder particles and then the rest of the arm particles are calculated from those.

import { GLOBAL_DEBUG } from "../debug-config";
import { add } from "../math/operations";
import type { PapermanBone } from "../physics-world/bone";
import { getZeroVelocityParticle, type Particle } from "../physics-world/particle";
import * as THREE from "three";
import { stabalize } from "./utils";
import { PapermanMuscle } from "../physics-world/muscle";
import { PapermanCompoundMuscle } from "../physics-world/compoundMuscle";

export class PapermanArm {
    name: string; // to differentiate between left and right leg
    left: boolean;
    // particles
    shoulderUpper: Particle; // look out lives in body class
    shoulderLower: Particle; // look out lives in body class
    elbowInner: Particle;
    elbowOuter: Particle;
    wristInner: Particle;
    wristOuter: Particle;
    // from outside to inside knuckles 1,2,3
    knuckle1: Particle;
    knuckle2: Particle;
    knuckle3: Particle;
    knuckle4: Particle;
    // // fingertips belonging to knuckles
    // // fintertip 1 belonging to knuckle 1 and 2
    // fingerTip1: Particle;
    // // fintertip 2 belonging to knuckle 2 and 3
    // fingerTip2: Particle;
    // // fintertip 3 belonging to knuckle 3 and 4
    // fingerTip3: Particle;

    // bones

    // muscles

    // compound muscles

    scene: THREE.Scene;
    constructor(
        left: boolean,
        shoulderUpper: Particle,
        shoulderLower: Particle,
        scene: THREE.Scene,
    ) {
        this.left = left;
        this.name = left ? "leftArm" : "rightArm";
        this.shoulderUpper = shoulderUpper;
        this.shoulderLower = shoulderLower;
        this.scene = scene;

        this.elbowInner = getZeroVelocityParticle(
            add(this.shoulderLower.position, { x: 0, y: -0.1, z: 0.3 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.elbowOuter = getZeroVelocityParticle(
            add(this.shoulderLower.position, { x: this.left ? -0.1 : 0.1, y: -0.1, z: 0.3 }),
            this.scene,
            GLOBAL_DEBUG,
        );

        this.wristInner = getZeroVelocityParticle(
            add(this.elbowInner.position, { x: 0, y: 0, z: 0.3 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.wristOuter = getZeroVelocityParticle(
            add(this.elbowOuter.position, { x: 0, y: 0, z: 0.3 }),
            this.scene,
            GLOBAL_DEBUG,
        );

        this.knuckle1 = getZeroVelocityParticle(
            add(this.wristInner.position, { x: 0.01, y: 0, z: 0.1 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.knuckle2 = getZeroVelocityParticle(
            add(this.wristInner.position, { x: -0.03, y: 0, z: 0.1 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.knuckle3 = getZeroVelocityParticle(
            add(this.wristOuter.position, { x: 0.03, y: 0, z: 0.1 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.knuckle4 = getZeroVelocityParticle(
            add(this.wristOuter.position, { x: -0.01, y: 0, z: 0.1 }),
            this.scene,
            GLOBAL_DEBUG,
        );

        // this.fingerTip1 = getZeroVelocityParticle();
        // this.fingerTip2 = getZeroVelocityParticle();
        // this.fingerTip3 = getZeroVelocityParticle();
    }

    getParticles() {
        // don't return the hip particles as they belong to body class
        return [
            this.elbowInner,
            this.elbowOuter,
            this.wristInner,
            this.wristOuter,
            this.knuckle1,
            this.knuckle2,
            this.knuckle3,
            this.knuckle4,
        ];
    }

    getBones() {
        return [];
    }

    getMuscles() {
        return [];
    }

    getControlledMuscles(): PapermanCompoundMuscle[] {
        return [];
    }
}
