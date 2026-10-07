import { GLOBAL_DEBUG } from "../debug-config";
import { PapermanBone } from "../physics-world/bone";
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
        this.headToNeckBoneLeft = new PapermanBone(this.bottomLeft, this.neckUpperLeft, scene, GLOBAL_DEBUG);
        this.headToNeckBoneRight = new PapermanBone(this.bottomRight, this.neckUpperRight, scene, GLOBAL_DEBUG);
        this.headToNeckLeftToRight = new PapermanBone(this.bottomLeft, this.neckUpperRight, scene, GLOBAL_DEBUG);
        this.headToNeckRightToLeft = new PapermanBone(this.bottomRight, this.neckUpperLeft, scene, GLOBAL_DEBUG);

        // stabalize head particles
        this.headBones = stabalize(
            [
                this.top,
                this.topLeft,
                this.topRight,
                this.bottomLeft,
                this.bottomRight,
            ],
            scene,
            GLOBAL_DEBUG
        );
        // stabalize neck particles
        this.neckBones = stabalize(
            [
                this.neckUpperLeft,
                this.neckUpperRight,
                this.neckLowerLeft,
                this.neckLowerRight,
            ],
            scene,
            GLOBAL_DEBUG
        );

        // create muscles
        this.headTopToNeckUpperLeft = new PapermanMuscle(this.topLeft, this.neckUpperLeft, scene, GLOBAL_DEBUG);
        this.headTopToNeckUpperRight = new PapermanMuscle(this.topRight, this.neckUpperRight, scene, GLOBAL_DEBUG);
        this.headBottomToNeckLowerLeft = new PapermanMuscle(this.bottomLeft, this.neckLowerLeft, scene, GLOBAL_DEBUG);
        this.headBottomToNeckLowerRight = new PapermanMuscle(this.bottomRight, this.neckLowerRight, scene, GLOBAL_DEBUG);
    }

    getBones(): PapermanBone[] {
        return [...this.headBones, ...this.neckBones, this.headToNeckBoneLeft, this.headToNeckBoneRight, this.headToNeckLeftToRight, this.headToNeckRightToLeft];
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
}
