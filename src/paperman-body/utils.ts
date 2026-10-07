import { PapermanBone } from "../physics-world/bone";
import type { Particle } from "../physics-world/particle";
import * as THREE from "three";


// Stabilizes a set of particles by creating a connecting Bone
// between every particle to all other particles
export function stabalize(particles: Particle[], scene: THREE.Scene, debug: boolean = false): PapermanBone[] {
    const bones: PapermanBone[] = [];
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            // Create a PapermanBone between particles[i] and particles[j]
            const bone = new PapermanBone(particles[i], particles[j], scene, debug);
            bones.push(bone);
        }
    }
    return bones;
}