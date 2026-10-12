import type { Vector } from "../math/operations";
import { PapermanMuscle } from "../physics-world/muscle";
import { PapermanCompoundMuscle } from "../physics-world/compoundMuscle";
import type { PapermanBone } from "../physics-world/bone";
import { getZeroVelocityParticle } from "../physics-world/particle";
import { defaultBodyData } from "./body-default-data";
import { PapermanHead } from "./head";
import { PapermanTorso } from "./torso";
import * as THREE from "three";
import { stabalize } from "./utils";

export class PapermanBody {
    anchorPoint: Vector;
    yRotation: number;
    head: PapermanHead;
    torso: PapermanTorso;
    headToTorsoStabalizers: PapermanBone[];
    headToTorsoMuscles: PapermanMuscle[];
    headTorsoMuscleMain: PapermanCompoundMuscle;
    headTorsoMuscleSupport: PapermanCompoundMuscle;
    scene: THREE.Scene;
    debug: boolean;
    constructor(anchorPoint: Vector, yRotation: number, scene: THREE.Scene, debug: boolean) {
        this.anchorPoint = anchorPoint;
        this.yRotation = yRotation;
        this.scene = scene;
        this.debug = debug;

        // first head and torso are created with bones and muscles
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
            getZeroVelocityParticle(defaultBodyData.torso.leftShoulderUpper, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.rightShoulderUpper, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.leftShoulderLower, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.rightShoulderLower, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.leftWaist, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.rightWaist, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.hipLeftOuter, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.hipLeftInner, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.hipRightOuter, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.hipRightInner, scene, debug),
            scene,
        );

        // head to torso stabalization
        this.headToTorsoStabalizers = stabalize(
            [
                this.head.neckLowerLeft,
                this.head.neckLowerRight,
                this.torso.leftShoulderUpper,
                this.torso.rightShoulderUpper,
                this.torso.leftShoulderLower,
                this.torso.rightShoulderLower,
            ],
            scene,
            debug,
        );

        // head to torso muscles
        this.headToTorsoMuscles = [
            new PapermanMuscle(
                "headToTorsoMuscleLeft",
                this.head.topLeft,
                this.torso.leftShoulderLower,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "headToTorsoMuscleRight",
                this.head.topRight,
                this.torso.rightShoulderLower,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "headToTorsoMuscleSupportLeft",
                this.head.bottomLeft,
                this.torso.leftShoulderUpper,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "headToTorsoMuscleSupportRight",
                this.head.bottomRight,
                this.torso.rightShoulderUpper,
                0.9,
                scene,
                debug,
            ),
        ];
        this.headTorsoMuscleMain = new PapermanCompoundMuscle("headTorsoMuscleMain", [
            this.headToTorsoMuscles[0],
            this.headToTorsoMuscles[1],
        ]);
        this.headTorsoMuscleSupport = new PapermanCompoundMuscle("headTorsoMuscleSupport", [
            this.headToTorsoMuscles[2],
            this.headToTorsoMuscles[3],
        ]);
    }

    getParticles() {
        return [...this.head.getParticles(), ...this.torso.getParticles()];
    }

    getBones() {
        return [...this.head.getBones(), ...this.torso.getBones(), ...this.headToTorsoStabalizers];
    }

    getMuscles() {
        return [...this.head.getMuscles(), ...this.torso.getMuscles(), ...this.headToTorsoMuscles];
    }

    // this should return all the muscles which should be exposed to external control
    // this can be either single muscles or summarized compound muscles
    getControllableMuscles(): (PapermanCompoundMuscle | PapermanMuscle)[] {
        return [
            ...this.head.getControlledMuscles(),
            ...this.torso.getControlledMuscles(),
            this.headTorsoMuscleMain,
            this.headTorsoMuscleSupport,
        ];
    }
}
