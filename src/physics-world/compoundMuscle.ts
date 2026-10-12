import { PapermanMuscle } from "./muscle";

// a helper class to summarize multiple PapermanMuscles as a single compound muscle
// this should allow controlling multiple muscles as if they were a single muscle
export class PapermanCompoundMuscle {
    name: string;
    muscles: PapermanMuscle[];
    constructor(name: string, muscles: PapermanMuscle[]) {
        this.muscles = muscles;
        this.name = name;
    }

    // A Compound Muscle 
    addToLength(deltaPercantage: number) {
        for (const muscle of this.muscles) {
            muscle.addToLength(deltaPercantage);
        }
    }
}
