import { crossProduct, normalize, type Vector } from "./math";

export class Triangle {
    ankerPoint: Vector;
    edge1: Vector;
    edge2: Vector
    normal: Vector
    constructor(ankerPoint: Vector, edge1: Vector, edge2: Vector) {
        this.ankerPoint = ankerPoint;
        this.edge1 = edge1;
        this.edge2 = edge2;
        this.normal = normalize(crossProduct(edge1, edge2));
    }


}