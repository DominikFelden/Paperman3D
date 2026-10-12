import { GLOBAL_DEBUG } from "../debug-config";
import { PapermanBone } from "../physics-world/bone";
import { PapermanCompoundMuscle } from "../physics-world/compoundMuscle";
import { PapermanMuscle } from "../physics-world/muscle";
import type { Particle } from "../physics-world/particle";
import { stabalize } from "./utils";
import * as THREE from "three";

export class PapermanHead {
    top: Particle;
    topLeft: Particle;
    topRight: Particle;
    bottomLeft: Particle;
    bottomRight: Particle;
    neckUpperLeft: Particle;
    neckUpperRight: Particle;
    neckLowerLeft: Particle;
    neckLowerRight: Particle;

    // bones
    // stabalizer bones
    headBones: PapermanBone[] = [];
    neckBones: PapermanBone[] = [];
    // connecter bones
    headToNeckBoneLeft: PapermanBone;
    headToNeckBoneRight: PapermanBone;
    headToNeckLeftToRight: PapermanBone;
    headToNeckRightToLeft: PapermanBone;

    // Muscles
    headTopToNeckUpperLeft: PapermanMuscle;
    headTopToNeckUpperRight: PapermanMuscle;
    headBottomToNeckLowerLeft: PapermanMuscle;
    headBottomToNeckLowerRight: PapermanMuscle;

    // Compound muscles
    headTopToNeckUpper: PapermanCompoundMuscle;
    headBottomToNeckLower: PapermanCompoundMuscle;

    constructor(
        top: Particle,
        topLeft: Particle,
        topRight: Particle,
        bottomLeft: Particle,
        bottomRight: Particle,
        neckUpperLeft: Particle,
        neckUpperRight: Particle,
        neckLowerLeft: Particle,
        neckLowerRight: Particle,
        scene: THREE.Scene,
    ) {
        this.top = top;
        this.topLeft = topLeft;
        this.topRight = topRight;
        this.bottomLeft = bottomLeft;
        this.bottomRight = bottomRight;
        this.neckUpperLeft = neckUpperLeft;
        this.neckUpperRight = neckUpperRight;
        this.neckLowerLeft = neckLowerLeft;
        this.neckLowerRight = neckLowerRight;

        // create connecter bones
        this.headToNeckBoneLeft = new PapermanBone(
            this.bottomLeft,
            this.neckUpperLeft,
            scene,
            GLOBAL_DEBUG,
        );
        this.headToNeckBoneRight = new PapermanBone(
            this.bottomRight,
            this.neckUpperRight,
            scene,
            GLOBAL_DEBUG,
        );
        this.headToNeckLeftToRight = new PapermanBone(
            this.bottomLeft,
            this.neckUpperRight,
            scene,
            GLOBAL_DEBUG,
        );
        this.headToNeckRightToLeft = new PapermanBone(
            this.bottomRight,
            this.neckUpperLeft,
            scene,
            GLOBAL_DEBUG,
        );

        // stabalize head particles
        this.headBones = stabalize(
            [this.top, this.topLeft, this.topRight, this.bottomLeft, this.bottomRight],
            scene,
            GLOBAL_DEBUG,
        );
        // stabalize neck particles
        this.neckBones = stabalize(
            [this.neckUpperLeft, this.neckUpperRight, this.neckLowerLeft, this.neckLowerRight],
            scene,
            GLOBAL_DEBUG,
        );

        // create single muscles
        this.headTopToNeckUpperLeft = new PapermanMuscle(
            "headTopToNeckUpperLeft",
            this.topLeft,
            this.neckUpperLeft,
            1,
            scene,
            GLOBAL_DEBUG,
        );
        this.headTopToNeckUpperLeft.setMinimumExtension(0.7);
        this.headTopToNeckUpperRight = new PapermanMuscle(
            "headTopToNeckUpperRight",
            this.topRight,
            this.neckUpperRight,
            1,
            scene,
            GLOBAL_DEBUG,
        );
        this.headTopToNeckUpperRight.setMinimumExtension(0.7);
        this.headBottomToNeckLowerLeft = new PapermanMuscle(
            "headBottomToNeckLowerLeft",
            this.bottomLeft,
            this.neckLowerLeft,
            0.95,
            scene,
            GLOBAL_DEBUG,
        );
        this.headBottomToNeckLowerLeft.setMinimumExtension(0.7);
        this.headBottomToNeckLowerRight = new PapermanMuscle(
            "headBottomToNeckLowerRight",
            this.bottomRight,
            this.neckLowerRight,
            0.95,
            scene,
            GLOBAL_DEBUG,
        );
        this.headBottomToNeckLowerRight.setMinimumExtension(0.7);

        // create compound muscles for easier control of head movements
        this.headTopToNeckUpper = new PapermanCompoundMuscle("headTopToNeckUpper", [
            this.headTopToNeckUpperLeft,
            this.headTopToNeckUpperRight,
        ]);
        this.headBottomToNeckLower = new PapermanCompoundMuscle("headBottomToNeckLower", [
            this.headBottomToNeckLowerLeft,
            this.headBottomToNeckLowerRight,
        ]);
    }

    getBones(): PapermanBone[] {
        return [
            ...this.headBones,
            ...this.neckBones,
            this.headToNeckBoneLeft,
            this.headToNeckBoneRight,
            this.headToNeckLeftToRight,
            this.headToNeckRightToLeft,
        ];
    }

    getMuscles(): PapermanMuscle[] {
        return [
            this.headTopToNeckUpperLeft,
            this.headTopToNeckUpperRight,
            this.headBottomToNeckLowerLeft,
            this.headBottomToNeckLowerRight,
        ];
    }

    getParticles(): Particle[] {
        return [
            this.top,
            this.topLeft,
            this.topRight,
            this.bottomLeft,
            this.bottomRight,
            this.neckUpperLeft,
            this.neckUpperRight,
            this.neckLowerLeft,
            this.neckLowerRight,
        ];
    }

    getControlledMuscles(): PapermanCompoundMuscle[] {
        return [this.headTopToNeckUpper, this.headBottomToNeckLower];
    }
}
