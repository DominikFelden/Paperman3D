import type { Vector } from "./operations";

type Matrix = number[][];

function transform3DVector(matrix: Matrix, vector: Vector): Vector {
    const x = vector.x;
    const y = vector.y;
    const z = vector.z;

    vector.x = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z;
    vector.y = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z;
    vector.z = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z;

    return vector;
}
