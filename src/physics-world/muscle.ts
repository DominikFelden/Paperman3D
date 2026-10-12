import * as THREE from "three";
import type { Particle } from "./particle";
import { PapermanBone } from "./bone";

export class PapermanMuscle extends PapermanBone {
    // every muscle should have a unique name so it can identified and modified from outside the class
    name: string;

    private maximumLength: number;// the length of the muscle when it is fully extended
    private minimumLength: number; // the minimum length allowed for this muscle
    // we use extension to control how long the muscle is
    // extension of 0 would mean it is fully contracted and length = 0 (but we'll only allow extension of 0.1 minimum)
    // extension of 1 means it is fully extended and has it's maximum length 
    // default max extension is 0.5 (most muscles should not extend to twice their original length)
    private minExtension: number = 0.1; // Minimum allowed extension relative to the maximum length
    private currentExtension: number = 0.5; // Current extension relative to the maximum length this must be between 0.1 and 1.0
    private maxDeltaPercentage: number; // the maximum change in length (percentage of the maximum length) allowed for this muscle (at every frame) 

    protected override get colorDebugMode(): number {
        return 0x990000;
    }

    constructor(
        name: string,
        particle1: Particle,
        particle2: Particle,
        currentExtension: number,
        scene: THREE.Scene,
        debug: boolean = false,
    ) {
        super(particle1, particle2, scene, debug);
        this.name = name;
        // the maximum length must be calculated from the length (given by the PapermanBone (particles)) and the current extension
        this.currentExtension = currentExtension;
        if (this.currentExtension < this.minExtension || this.currentExtension > 1.0) {
            throw new Error(`Current extension must be between ${this.minExtension} and 1.0 for muscle ${this.name}, current extension is ${this.currentExtension}`);
        }
        this.maximumLength = this.length / this.currentExtension;

        // once we know the maximum length we can set the maximum delta length allowed for this muscle
        this.maxDeltaPercentage = 0.1; // for example, 10% of the maximum length
        this.minimumLength = this.maximumLength * this.minExtension;
    }

    setMinimumExtension(minExtension: number) {
        if (minExtension < 0.1 || minExtension > 1.0) {
            throw new Error(`Minimum extension must be between 0.1 and 1.0 for muscle ${this.name}, provided value is ${minExtension}`);
        }
        this.minExtension = minExtension;
        this.minimumLength = this.maximumLength * this.minExtension;
        if (this.currentExtension < this.minExtension) {
            this.currentExtension = this.minExtension;
        }
    }

    setMaxDeltaLength(maxDeltaPercentage: number) {
        if (maxDeltaPercentage < 0 || maxDeltaPercentage > 0.5) {
            throw new Error(`Maximum delta percentage must be between 0 and 0.5 for muscle ${this.name}, provided value is ${maxDeltaPercentage}`);
        }

        this.maxDeltaPercentage = maxDeltaPercentage;
    }

    /**
     * Used to adjust the length of the muscle by a specified delta percentage, within allowed limits
     * This will allow movement of the paperman skeleton
     * @param deltaPercantage amount (as a percentage of the maximum length) the muscle length should be adjusted by
     */
    addToLength(deltaPercantage: number) {
        // There must be a max delta length based on allowed compression and extension
        if (deltaPercantage > this.maxDeltaPercentage) deltaPercantage = this.maxDeltaPercentage;
        if (deltaPercantage < -this.maxDeltaPercentage) deltaPercantage = -this.maxDeltaPercentage;
        // if length + deltaPercantage exceeds maximum length, clamp it
        // if length + deltaPercantage goes below the minimum length, clamp it
        const newLength = Math.min(Math.max(this.length + (deltaPercantage * this.maximumLength), this.minimumLength), this.maximumLength);
        this.length = newLength;
    }
}
