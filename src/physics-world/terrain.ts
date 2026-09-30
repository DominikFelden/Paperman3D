import * as THREE from 'three'
import type { Vector } from '../math/operations'
import { calculateIntersectionTriangleLine, skalarprodukt } from '../math/operations'
import { Triangle } from '../math/triangle'
import { DebugVector } from '../debug-vector'

export class Terrain {
    hightmap: number[][]                              // [terrainX-idx][terrainY-idx] → world Y height; outer index = world X axis, inner = local Y axis (= world −Z)
    width: number
    hightLookup: Map<string, number> = new Map()       // "terrainX-terrainY" → world Y height; key format must match renderTerrain vertex lookup
    allTriangles: Triangle[] = []
    closeSurfaceTriangles: Map<string, Triangle[]> = new Map()  // spatial hash "worldX-worldZ" → triangles; buckets by integer XZ for proximity search
    scaling: number                                    // world units per one heightmap cell
    decimalPlaces: number                              // key precision: enough digits so one cell step is never rounded away
    // Precomputed constants — set once in the constructor, reused on every detectPointBelowTerrain call.
    private readonly halfWidth: number                 // = width / 2; shifts the world range [−hw, +hw] to [0, width] before scaling
    private readonly invScaling: number                // = 1 / scaling; replaces per-call division with a multiplication
    private readonly n: number                         // = hightmap.length − 1; cached upper bound for index clamping

    constructor(width: number, hightmap: number[][], scene: THREE.Scene, debug: boolean = false) {
        if (hightmap.length === 0 || hightmap[0].length === 0 || hightmap.length !== hightmap[0].length) {
            throw 'Invalid hightmap, rows and columns should be equal and > 0'
        }
        this.hightmap = hightmap
        this.width = width // for every 1 unit of terrain width we want to have at least 10 points of the higthmap

        this.scaling = this.width / hightmap.length; // assuming hightmap is square
        this.decimalPlaces = this.scaling < 1 ? Math.ceil(-Math.log10(this.scaling)) : 0;
        this.halfWidth = this.width / 2
        this.invScaling = 1 / this.scaling
        this.n = this.hightmap.length - 1
        this.hightLookup = this.createHightLookup(this.width, this.hightmap)
        
        const groundMesh = this.renderTerrain(scene, debug)
        groundMesh.updateMatrixWorld(true) // Ensure world matrix is up-to-date
        this.createTriangleHashMap(groundMesh)

        if (debug) {
            this.visualizeNormals(scene)
        }

        console.log('Terrain created.')
        
    }

    // Populates hightLookup with one entry per heightmap grid point; key = "terrainX-terrainY" in local plane coordinates.
    createHightLookup(width: number, hightmap: number[][]){
        const halfWidth = width / 2;
        for (let x = 0; x < hightmap.length; x++) {
            for (let y = 0; y < hightmap[x].length; y++) {
                const terrainX = x * this.scaling - halfWidth
                const terrainY = y * this.scaling - halfWidth
                const coordinateString = `${terrainX.toFixed(this.decimalPlaces)}-${terrainY.toFixed(this.decimalPlaces)}`
                this.hightLookup.set(coordinateString, hightmap[x][y])
            }
        }
        return this.hightLookup
    }

    // Files every world-space triangle into closeSurfaceTriangles under the integer (worldX, worldZ) bucket of its first vertex.
    createTriangleHashMap(groundMesh: THREE.Mesh) {
        const position = groundMesh.geometry.attributes.position
        const index = groundMesh.geometry.index
        
        if (!index) {
            throw new Error('Geometry must be indexed')
        }
        
        // Iterate through triangles using the index array
        for (let i = 0; i < index.count; i += 3) {
            const i1 = index.getX(i)
            const i2 = index.getX(i + 1)
            const i3 = index.getX(i + 2)
            
            // Get vertices in local space and transform to world space
            const v1Local = new THREE.Vector3(position.getX(i1), position.getY(i1), position.getZ(i1))
            const v2Local = new THREE.Vector3(position.getX(i2), position.getY(i2), position.getZ(i2))
            const v3Local = new THREE.Vector3(position.getX(i3), position.getY(i3), position.getZ(i3))
            
            const v1World = v1Local.applyMatrix4(groundMesh.matrixWorld)
            const v2World = v2Local.applyMatrix4(groundMesh.matrixWorld)
            const v3World = v3Local.applyMatrix4(groundMesh.matrixWorld)
            
            const v1: Vector = { x: v1World.x, y: v1World.y, z: v1World.z }
            const v2: Vector = { x: v2World.x, y: v2World.y, z: v2World.z }
            const v3: Vector = { x: v3World.x, y: v3World.y, z: v3World.z }
            
            const triangle = new Triangle(v1, 
                { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z }, 
                { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z })
            // check triangle normal it should point up (positive Y after rotation), if not, flip it
            if (triangle.normal.y < 0) {
                triangle.normal.x *= -1
                triangle.normal.y *= -1
                triangle.normal.z *= -1
            }
            // create a key for every square unit of the terrain and add the triangle to the corresponding key, so we can later quickly find all triangles that are close to a given point
            const key = `${v1.x.toFixed(0)}-${v1.z.toFixed(0)}`
            if (!this.closeSurfaceTriangles.has(key)) {
                this.closeSurfaceTriangles.set(key, [])
            }
            this.closeSurfaceTriangles.get(key)!.push(triangle)
            this.allTriangles.push(triangle)
        }
    }



    renderTerrain(scene: THREE.Scene, debug = false): THREE.Mesh {
        const tempWidth = this.width
        const groundGeometry = new THREE.PlaneGeometry(tempWidth, tempWidth, 50, 50)

        // apply hightmap to groundGeometry
        const position = groundGeometry.attributes.position
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i)
            const y = position.getY(i)
            const key = `${x.toFixed(this.decimalPlaces)}-${y.toFixed(this.decimalPlaces)}`
            const height = this.hightLookup.get(key) ?? 0
            position.setZ(i, height)
        }
        position.needsUpdate = true
        groundGeometry.computeVertexNormals()

        const ground = new THREE.Mesh(
            groundGeometry,
            new THREE.MeshStandardMaterial({ color: 0x991827, roughness: 1, wireframe: true })
        )
        ground.rotation.x = -Math.PI / 2
        scene.add(ground)

        return ground;
    }

    // Returns the closest intersection point (and the triangle it hit) between the given line and the terrain triangles,
    // or null if no intersection is found.
    // linePoint: a point on the line; lineDirection: the direction vector of the line (need not be normalised).
    getLineTerrainIntersection(linePoint: Vector, lineDirection: Vector): { point: Vector, triangle: Triangle } | null {
        const candidateTriangles = new Set<Triangle>()

        // closeSurfaceTriangles keys are "{worldX}-{worldZ}" with integer precision.
        // Search a neighbourhood of cells around the line point to gather candidates.
        const searchRadius = Math.ceil(this.scaling) + 10
        const cx = Math.round(linePoint.x)
        const cy = Math.round(linePoint.z)

        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                const key = `${cx + dx}-${cy + dy}`
                const tris = this.closeSurfaceTriangles.get(key)
                if (tris) {
                    for (const tri of tris) candidateTriangles.add(tri)
                }
            }
        }

        let closestPoint: Vector | null = null
        let closestTriangle: Triangle | null = null
        let closestDistSq = Infinity

        // calculateIntersectionTriangleLine treats lineDirection as an infinite ray (only t >= 0 is
        // rejected), but here it represents this frame's finite displacement — a hit beyond it (t > 1)
        // belongs to a future step, not this one, so it must be excluded to avoid phantom far-away contacts.
        const segmentLenSq = skalarprodukt(lineDirection, lineDirection)
        const eps = 1e-9

        for (const triangle of candidateTriangles) {
            const pt = calculateIntersectionTriangleLine(triangle, linePoint, lineDirection)
            if (pt) {
                const ex = pt.x - linePoint.x
                const ey = pt.y - linePoint.y
                const ez = pt.z - linePoint.z
                const distSq = ex * ex + ey * ey + ez * ez
                if (distSq > segmentLenSq + eps) continue // beyond this step's displacement (t > 1)
                if (distSq < closestDistSq) {
                    closestDistSq = distSq
                    closestPoint = pt
                    closestTriangle = triangle
                }
            }
        }

        return closestPoint && closestTriangle ? { point: closestPoint, triangle: closestTriangle } : null
    }

    // Returns the terrain height at any world (X, Z) position, even between heightmap grid samples.
    // The heightmap stores heights at discrete grid points. When the position falls between points,
    // the result is a weighted average of the four surrounding grid heights: corners closer to the
    // position contribute more, corners farther away contribute less.
    //
    // Why −worldZ?
    //   The terrain mesh is a flat plane rotated −90° around the X axis to lie on the ground.
    //   That rotation maps local Y → world −Z, so world Z = −(local Y).
    //   The heightmap is indexed by local Y, so we must negate worldZ to get the right row.
    getTerrainHeightAt(worldX: number, worldZ: number): number {
        // Convert world position to a grid index that can be fractional, e.g. 3.7 = 70% into cell 3.
        // +halfWidth slides the range [−halfWidth, +halfWidth] to [0, width] so the index is never negative.
        // ×invScaling converts from world units to grid cells.
        const ix = (worldX  + this.halfWidth) * this.invScaling
        const iy = (-worldZ + this.halfWidth) * this.invScaling  // negated: see coordinate note above

        // Round down to find which cell we are in; ix0/iy0 is the left/near edge of that cell.
        const ix0 = Math.floor(ix)
        const iy0 = Math.floor(iy)

        // The four grid corners that box in our position; clamped so we never read outside the array.
        const x0 = Math.max(0, Math.min(this.n, ix0))
        const x1 = Math.max(0, Math.min(this.n, ix0 + 1))
        const y0 = Math.max(0, Math.min(this.n, iy0))
        const y1 = Math.max(0, Math.min(this.n, iy0 + 1))

        // How far past the left (tx) and near (ty) edge we are: 0 = sitting on that edge, 1 = at the far edge.
        const tx = ix - ix0
        const ty = iy - iy0

        // Mix the four corner heights. Each corner's weight = how close we are to the *opposite* corner.
        // If tx=0, ty=0 we are right on [x0][y0] so it gets weight 1 and the others get 0.
        // If tx=0.7, ty=0.3 the corners each get (1−0.7)*(1−0.3)=0.21, 0.7*0.7=0.49, 0.3*0.21=0.09, 0.7*0.3=0.21.
        return (
            this.hightmap[x0][y0] * (1 - tx) * (1 - ty) +
            this.hightmap[x1][y0] * tx       * (1 - ty) +
            this.hightmap[x0][y1] * (1 - tx) * ty       +
            this.hightmap[x1][y1] * tx       * ty
        )
    }

    detectPointBelowTerrain(point: Vector): boolean {
        return point.y < this.getTerrainHeightAt(point.x, point.z)
    }

    private visualizeNormals(scene: THREE.Scene): void {
        // Collect all triangles from the terrain
        const allTriangles: Array<{ key: string, triangle: Triangle }> = []
        for (const [key, triangles] of this.closeSurfaceTriangles) {
            for (const triangle of triangles) {
                allTriangles.push({ key, triangle })
            }
        }

        console.log(`Total triangles: ${allTriangles.length}`)

        // Pick 100 random triangles
        const numToVisualize = Math.min(100, allTriangles.length)
        const randomTriangles: typeof allTriangles = []
        const usedIndices = new Set<number>()

        while (randomTriangles.length < numToVisualize) {
            const randomIndex = Math.floor(Math.random() * allTriangles.length)
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex)
                randomTriangles.push(allTriangles[randomIndex])
            }
        }

        // Visualize the normals of the random triangles
        randomTriangles.forEach(({ key, triangle }, index) => {
            // console.log(`Triangle ${index + 1} (key: ${key}):`, {
            //     ankerPoint: triangle.ankerPoint,
            //     normal: triangle.normal
            // })
            
            new DebugVector(
                triangle.ankerPoint,
                triangle.normal,
                0x00ff00 // Green - should point up
            ).addToScene(scene)
        })
    }

}