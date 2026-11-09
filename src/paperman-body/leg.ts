// the leg class is different from the torso and head class because it takes
// two hip particles and then the rest of the leg particles are calculated from those.

import { GLOBAL_DEBUG } from "../debug-config";
import { add } from "../math/operations";
import type { PapermanBone } from "../physics-world/bone";
import { getZeroVelocityParticle, type Particle } from "../physics-world/particle";
import * as THREE from "three";
import { stabalize } from "./utils";
import { PapermanMuscle } from "../physics-world/muscle";
import { PapermanCompoundMuscle } from "../physics-world/compoundMuscle";

export class PapermanLeg {
    name: string; // to differentiate between left and right leg
    // particles
    hipInner: Particle; // look out lives in body class
    hipOuter: Particle; // look out lives in body class
    kneeInner: Particle;
    kneeOuter: Particle;
    heelInner: Particle;
    heelOuter: Particle;
    footTipInner: Particle;
    footTipOuter: Particle;

    // bones

    thighStabalizers: PapermanBone[] = [];
    calfStabalizers: PapermanBone[] = [];
    footStabalizers: PapermanBone[] = [];

    // muscles
    kneeMuscles: PapermanMuscle[] = [];
    footMuscles: PapermanMuscle[] = [];

    // compound muscles
    kneeMuscleCompound: PapermanCompoundMuscle;
    footMuscleCompound: PapermanCompoundMuscle;

    scene: THREE.Scene;
    constructor(name: string, hipOuter: Particle, hipInner: Particle, scene: THREE.Scene) {
        this.name = name;
        this.hipInner = hipInner;
        this.hipOuter = hipOuter;
        this.scene = scene;

        this.kneeInner = getZeroVelocityParticle(
            add(this.hipInner.position, { x: 0, y: -0.4, z: 0.05 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.kneeOuter = getZeroVelocityParticle(
            add(this.hipOuter.position, { x: 0, y: -0.4, z: 0.05 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.heelInner = getZeroVelocityParticle(
            add(this.kneeInner.position, { x: 0, y: -0.3, z: -0.2 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.heelOuter = getZeroVelocityParticle(
            add(this.kneeOuter.position, { x: 0, y: -0.3, z: -0.2 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.footTipInner = getZeroVelocityParticle(
            add(this.heelInner.position, { x: 0, y: -0.0, z: 0.2 }),
            this.scene,
            GLOBAL_DEBUG,
        );
        this.footTipOuter = getZeroVelocityParticle(
            add(this.heelOuter.position, { x: 0, y: -0.0, z: 0.2 }),
            this.scene,
            GLOBAL_DEBUG,
        );

        // define the stabalizing bones
        this.thighStabalizers = stabalize(
            [this.hipInner, this.hipOuter, this.kneeInner, this.kneeOuter],
            this.scene,
            GLOBAL_DEBUG,
        );
        this.calfStabalizers = stabalize(
            [this.kneeInner, this.kneeOuter, this.heelInner, this.heelOuter],
            this.scene,
            GLOBAL_DEBUG,
        );
        this.footStabalizers = stabalize(
            [this.heelInner, this.heelOuter, this.footTipInner, this.footTipOuter],
            this.scene,
            GLOBAL_DEBUG,
        );

        // define muscles
        this.kneeMuscles = [
            new PapermanMuscle(
                "kneeMuscleInner",
                this.hipInner,
                this.heelInner,
                0.95,
                this.scene,
                GLOBAL_DEBUG,
            ),
            new PapermanMuscle(
                "kneeMuscleOuter",
                this.hipOuter,
                this.heelOuter,
                0.95,
                this.scene,
                GLOBAL_DEBUG,
            ),
        ];

        this.kneeMuscles.forEach((muscle) => muscle.setMinimumExtension(0.35));

        this.footMuscles = [
            new PapermanMuscle(
                "footMuscleInner",
                this.kneeInner,
                this.footTipInner,
                0.75,
                this.scene,
                GLOBAL_DEBUG,
            ),
            new PapermanMuscle(
                "footMuscleOuter",
                this.kneeOuter,
                this.footTipOuter,
                0.75,
                this.scene,
                GLOBAL_DEBUG,
            ),
        ];

        this.footMuscles.forEach((muscle) => muscle.setMinimumExtension(0.65));

        // define compound muscles
        this.kneeMuscleCompound = new PapermanCompoundMuscle(
            `${this.name}-kneeMuscle`,
            this.kneeMuscles,
        );
        this.footMuscleCompound = new PapermanCompoundMuscle(
            `${this.name}-footMuscle`,
            this.footMuscles,
        );
    }

    getParticles() {
        // don't return the hip particles as they belong to body class
        return [
            this.kneeInner,
            this.kneeOuter,
            this.heelInner,
            this.heelOuter,
            this.footTipInner,
            this.footTipOuter,
        ];
    }

    getBones() {
        return [...this.thighStabalizers, ...this.calfStabalizers, ...this.footStabalizers];
    }

    getMuscles() {
        return [...this.kneeMuscles, ...this.footMuscles];
    }

    getControlledMuscles(): PapermanCompoundMuscle[] {
        return [this.kneeMuscleCompound, this.footMuscleCompound];
    }
}
