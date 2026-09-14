import type { Triangle } from "./triangle"

export interface Vector {
    x: number, 
    y: number, 
    z: number
}

export function scaleVector(v: Vector, scalar: number): Vector {
    return {
        x: v.x * scalar,
        y: v.y * scalar,
        z: v.z * scalar
    }
}

export function skalarprodukt(v1: Vector, v2: Vector): number{
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
}

export function magnitude(v: Vector): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

export function normalize(v: Vector): Vector {
    const mag = magnitude(v)
    if (mag === 0) return { x: 0, y: 0, z: 0 }
    return {
        x: v.x / mag,
        y: v.y / mag,
        z: v.z / mag
    }
}

export function crossProduct(v1: Vector, v2: Vector): Vector {
    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    }
}

export function add(v1: Vector, v2: Vector): Vector {
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y,
        z: v1.z + v2.z
    }
}

export function subtract(v1: Vector, v2: Vector): Vector {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
        z: v1.z - v2.z
    }
}


export function calculateIntersectionPlaneLine(planeNormal: Vector, planePoint: Vector, linePoint: Vector, lineDirection: Vector): Vector | null {
    // find the vector from the plane's anchor point to the line's anchor point
    const planeToLine = subtract(linePoint, planePoint)

    // project that vector onto the plane normal to get the signed distance
    // from the line point to the plane along the normal axis
    const distance = skalarprodukt(planeToLine, planeNormal)

    // project the line direction onto the plane normal to get the rate at which
    // the line approaches the plane per unit of the parameter t
    const denom = skalarprodukt(lineDirection, planeNormal)

    // if denom is zero the line runs parallel to the plane — no single intersection
    if (denom === 0) return null

    // solve for t: how far along the line direction we must travel from linePoint
    // to reach the plane  (derived from dot(linePoint + t*dir - planePoint, n) = 0)
    const t = -distance / denom

    if (t < 0) return null  // intersection is behind the ray origin

    // compute the actual intersection point by walking t steps along the line
    return {
        x: linePoint.x + lineDirection.x * t,
        y: linePoint.y + lineDirection.y * t,
        z: linePoint.z + lineDirection.z * t
    }
}

export function calculateIntersectionTriangleLine(triangle: Triangle, linePoint: Vector, lineDirection: Vector): Vector | null {
    // First calculate intersection of the line with the plane of the triangle
    const planeLine_intersectionPoint = calculateIntersectionPlaneLine(triangle.normal, triangle.ankerPoint, linePoint, lineDirection)
    // If there's no intersection with the plane, there's no intersection with the triangle
    if (!planeLine_intersectionPoint) return null

    // Check if the intersection point lies inside the triangle using barycentric coordinates.
    // Any point P on the triangle's plane can be written as:
    //   P = ankerPoint + barycentricU * edge1 + barycentricV * edge2
    // The point is inside the triangle when:
    //   barycentricU >= 0, barycentricV >= 0, and barycentricU + barycentricV <= 1

    // Pre-compute the dot products between the two edge vectors.
    // These form the entries of the 2x2 Gram matrix of the edge basis.
    // TODO: this can be moved to the Triangle class for efficiency since it doesn't change per intersection test.
    const edge1DotEdge1 = skalarprodukt(triangle.edge1, triangle.edge1)
    const edge1DotEdge2 = skalarprodukt(triangle.edge1, triangle.edge2)
    const edge2DotEdge2 = skalarprodukt(triangle.edge2, triangle.edge2)

    // Vector from the triangle's anchor point to the candidate intersection point
    const anchorToIntersection = subtract(planeLine_intersectionPoint, triangle.ankerPoint)

    // Project that offset vector onto each edge to get the right-hand side of the linear system
    const anchorToIntersectionDotEdge1 = skalarprodukt(anchorToIntersection, triangle.edge1)
    const anchorToIntersectionDotEdge2 = skalarprodukt(anchorToIntersection, triangle.edge2)

    // The determinant of the Gram matrix; zero means the two edges are parallel (degenerate triangle)
    const gramDeterminant = edge1DotEdge1 * edge2DotEdge2 - edge1DotEdge2 * edge1DotEdge2
    if (gramDeterminant === 0) return null

    // Solve the 2x2 system via Cramer's rule to obtain the barycentric coordinates
    const barycentricU = (edge2DotEdge2 * anchorToIntersectionDotEdge1 - edge1DotEdge2 * anchorToIntersectionDotEdge2) / gramDeterminant
    const barycentricV = (edge1DotEdge1 * anchorToIntersectionDotEdge2 - edge1DotEdge2 * anchorToIntersectionDotEdge1) / gramDeterminant

    // The point is outside the triangle if either coordinate is negative or their sum exceeds 1
    // epsilon guards against floating-point rejection when the ray lands exactly on an edge
    const eps = 1e-10
    if (barycentricU < -eps || barycentricV < -eps || barycentricU + barycentricV > 1 + eps) return null

    return planeLine_intersectionPoint
}

export function projectVectorOntoPlane(vector: Vector, planeNormal: Vector): Vector {
    const dot = skalarprodukt(vector, planeNormal)
    return subtract(vector, { x: dot * planeNormal.x, y: dot * planeNormal.y, z: dot * planeNormal.z })
}

