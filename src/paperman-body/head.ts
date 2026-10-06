import type { Particle } from "../physics-world/particle";

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
    }
}
