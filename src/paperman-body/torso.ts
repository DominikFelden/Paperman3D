import { GLOBAL_DEBUG } from "../debug-config";
import  { PapermanBone } from "../physics-world/bone";
import  { Particle } from "../physics-world/particle";
import * as THREE from 'three'


export class PapermanTorso {
    shoulderLeftLower: Particle;
    shoulderRightLower: Particle;
    waistLeft: Particle;
    waistRight: Particle;

    lowerShoulderConnection: PapermanBone;
    lowerShoulderToWaistLeft: PapermanBone;
    lowerShoulderToWaistRight: PapermanBone;
    waistConnection: PapermanBone;
    stabeliserleftShoulderToWaistRight: PapermanBone;
    stabeliserrightShoulderToWaistLeft: PapermanBone;

    scene: THREE.Scene;

    constructor(particles: { shoulderLeftLower: Particle; shoulderRightLower: Particle; waistLeft: Particle; waistRight: Particle; },
        scene: THREE.Scene
    ) {
        this.scene = scene;

        // Initialize torso properties here
        this.shoulderLeftLower = particles.shoulderLeftLower;
        this.shoulderRightLower = particles.shoulderRightLower;
        this.waistLeft = particles.waistLeft;
        this.waistRight = particles.waistRight;

        this.lowerShoulderConnection = new PapermanBone(this.shoulderLeftLower, this.shoulderRightLower, this.scene, GLOBAL_DEBUG);
        this.lowerShoulderToWaistLeft = new PapermanBone(this.shoulderLeftLower, this.waistLeft, this.scene, GLOBAL_DEBUG);
        this.lowerShoulderToWaistRight = new PapermanBone(this.shoulderRightLower, this.waistRight, this.scene, GLOBAL_DEBUG);
        this.waistConnection = new PapermanBone(this.waistLeft, this.waistRight, this.scene, GLOBAL_DEBUG);
        this.stabeliserleftShoulderToWaistRight = new PapermanBone(this.shoulderLeftLower, this.waistRight, this.scene, GLOBAL_DEBUG);
        this.stabeliserrightShoulderToWaistLeft = new PapermanBone(this.shoulderRightLower, this.waistLeft, this.scene, GLOBAL_DEBUG);

    }

    getParticles() {
        return {
            shoulderLeftLower: this.shoulderLeftLower,
            shoulderRightLower: this.shoulderRightLower,
            waistLeft: this.waistLeft,
            waistRight: this.waistRight,
        };
    };

    getBones() {
        return {
            lowerShoulderConnection: this.lowerShoulderConnection,
            lowerShoulderToWaistLeft: this.lowerShoulderToWaistLeft,
            lowerShoulderToWaistRight: this.lowerShoulderToWaistRight,
            waistConnection: this.waistConnection,
            stabeliserleftShoulderToWaistRight: this.stabeliserleftShoulderToWaistRight,
            stabeliserrightShoulderToWaistLeft: this.stabeliserrightShoulderToWaistLeft,
        };
    }
}