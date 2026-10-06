import type { Vector } from "../math/operations";
import { PapermanHead } from "./head";

export class PapermanBody {
    anchorPoint: Vector;
    yRotation: number;
    head: PapermanHead;
    constructor(anchorPoint: Vector, yRotation: number) {
        this.anchorPoint = anchorPoint;
        this.yRotation = yRotation;
        this.head = new PapermanHead();
    }
}
