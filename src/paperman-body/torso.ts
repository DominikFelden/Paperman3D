import type { PapermanBone } from "../physics-world/bone";
import type { Particle } from "../physics-world/particle";
import * as THREE from "three";
import { stabalize } from "./utils";
import { GLOBAL_DEBUG } from "../debug-config";
import { PapermanMuscle } from "../physics-world/muscle";
import { PapermanCompoundMuscle } from "../physics-world/compoundMuscle";

export class PapermanTorso {
    leftShoulderUpper: Particle;
    rightShoulderUpper: Particle;
    leftShoulderLower: Particle;
    rightShoulderLower: Particle;
    leftWaist: Particle;
    rightWaist: Particle;
    hipLeftOuter: Particle;
    hipLeftInner: Particle;
    hipRightOuter: Particle;
    hipRightInner: Particle;

    // muscles
    leftStomachMuscle: PapermanMuscle;
    rightStomachMuscle: PapermanMuscle;
    stomachMuscle: PapermanCompoundMuscle;

    // stabalizing bones
    upperTorsoStabalizers: PapermanBone[];
    lowerTorsoStabalizers: PapermanBone[];

    scene: THREE.Scene;

    constructor(
        leftShoulderUpper: Particle,
        rightShoulderUpper: Particle,
        leftShoulderLower: Particle,
        rightShoulderLower: Particle,
        leftWaist: Particle,
        rightWaist: Particle,
        hipLeftOuter: Particle,
        hipLeftInner: Particle,
        hipRightOuter: Particle,
        hipRightInner: Particle,
        scene: THREE.Scene,
    ) {
        this.scene = scene;

        this.leftShoulderUpper = leftShoulderUpper;
        this.rightShoulderUpper = rightShoulderUpper;
        this.leftShoulderLower = leftShoulderLower;
        this.rightShoulderLower = rightShoulderLower;
        this.leftWaist = leftWaist;
        this.rightWaist = rightWaist;
        this.hipLeftOuter = hipLeftOuter;
        this.hipLeftInner = hipLeftInner;
        this.hipRightOuter = hipRightOuter;
        this.hipRightInner = hipRightInner;

        // stabalizing bones
        this.upperTorsoStabalizers = stabalize(
            [
                this.leftShoulderUpper,
                this.rightShoulderUpper,
                this.leftShoulderLower,
                this.rightShoulderLower,
                this.leftWaist,
                this.rightWaist,
            ],
            scene,
            GLOBAL_DEBUG,
        );
        this.lowerTorsoStabalizers = stabalize(
            [
                this.leftWaist,
                this.rightWaist,
                this.hipLeftOuter,
                this.hipLeftInner,
                this.hipRightOuter,
                this.hipRightInner,
            ],
            scene,
            GLOBAL_DEBUG,
        );

        // stomach muscles
        this.leftStomachMuscle = new PapermanMuscle(
            "leftStomachMuscle",
            this.leftShoulderUpper,
            this.hipLeftOuter,
            0.9,
            scene,
            GLOBAL_DEBUG,
        );

        this.rightStomachMuscle = new PapermanMuscle(
            "rightStomachMuscle",
            this.rightShoulderUpper,
            this.hipRightOuter,
            0.9,
            scene,
            GLOBAL_DEBUG,
        );

        this.stomachMuscle = new PapermanCompoundMuscle("stomachMuscle", [
            this.leftStomachMuscle,
            this.rightStomachMuscle,
        ]);
    }

    getParticles(): Particle[] {
        return [
            this.leftShoulderUpper,
            this.rightShoulderUpper,
            this.leftShoulderLower,
            this.rightShoulderLower,
            this.leftWaist,
            this.rightWaist,
            this.hipLeftOuter,
            this.hipLeftInner,
            this.hipRightOuter,
            this.hipRightInner,
        ];
    }

    getBones(): PapermanBone[] {
        return [...this.upperTorsoStabalizers, ...this.lowerTorsoStabalizers];
    }

    getMuscles(): PapermanMuscle[] {
        return [this.leftStomachMuscle, this.rightStomachMuscle];
    }

    getControlledMuscles(): PapermanCompoundMuscle[] {
        return [this.stomachMuscle];
    }
}
