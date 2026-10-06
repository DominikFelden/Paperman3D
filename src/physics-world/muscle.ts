import * as THREE from "three";
import type { Particle } from "./particle";
import { PapermanBone } from "./bone";

export class PapermanMuscle extends PapermanBone {
    originalLength: number;
    allowedCompression: number = 0.1; // Maximum allowed compression relative to the original length
    allowedExtension: number = 0.1; // Maximum allowed extension relative to the original length
    maxDeltaLength: number;

    constructor(
        particle1: Particle,
        particle2: Particle,
        scene: THREE.Scene,
        debug: boolean = false,
    ) {
        super(particle1, particle2, scene, debug);
        this.originalLength = this.length;
        this.maxDeltaLength =
            this.originalLength * Math.max(this.allowedCompression, this.allowedExtension) * 0.1;
    }

    /**
     * Used to adjust the length of the muscle by a specified delta, within allowed limits
     * This will allow movement of the paperman skeleton
     * @param deltaLength amount the muscle length should be adjusted by
     */
    addToLength(deltaLength: number) {
        // There must be a max delta length based on allowed compression and extension
        if (deltaLength > this.maxDeltaLength) deltaLength = this.maxDeltaLength;
        if (deltaLength < -this.maxDeltaLength) deltaLength = -this.maxDeltaLength;
        // if length + deltaLength exceeds the allowed extension, clamp it
        // if length + deltaLength goes below the allowed compression, clamp it
        const maxLength = this.originalLength * (1 + this.allowedExtension);
        const minLength = this.originalLength * (1 - this.allowedCompression);
        const newLength = Math.min(Math.max(this.length + deltaLength, minLength), maxLength);
        this.length = newLength;
    }
}
