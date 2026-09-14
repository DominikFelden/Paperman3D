import * as THREE from 'three'
import type { Vector } from "./math"
import { magnitude } from "./math"

export class DebugVector {
    private group: THREE.Group
    private cylinderMesh: THREE.Mesh
    private coneMesh: THREE.Mesh
    
    constructor(ankerPoint: Vector, direction: Vector, color: number) {
        this.group = new THREE.Group()
        
        // Calculate the length of the direction vector
        const length = magnitude(direction)
        
        if (length === 0) {
            throw new Error('Direction vector cannot have zero length')
        }
        
        // Proportions for the arrow
        const cylinderRadius = 0.05
        const coneLength = length * 0.15
        const cylinderLength = length - coneLength
        const coneRadius = cylinderRadius * 3
        
        // Create the material
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.4,
            metalness: 0.1
        })
        
        // Create cylinder (shaft)
        const cylinderGeometry = new THREE.CylinderGeometry(
            cylinderRadius, 
            cylinderRadius, 
            cylinderLength, 
            8
        )
        this.cylinderMesh = new THREE.Mesh(cylinderGeometry, material)
        
        // Create cone (tip)
        const coneGeometry = new THREE.ConeGeometry(coneRadius, coneLength, 8)
        this.coneMesh = new THREE.Mesh(coneGeometry, material)
        
        // Position cylinder at half its length (cylinder is created centered at origin)
        this.cylinderMesh.position.y = cylinderLength / 2
        
        // Position cone at the end of the cylinder
        this.coneMesh.position.y = cylinderLength + coneLength / 2
        
        // Add both to the group
        this.group.add(this.cylinderMesh)
        this.group.add(this.coneMesh)
        
        // Calculate the direction to point the arrow
        const directionVec = new THREE.Vector3(direction.x, direction.y, direction.z)
        directionVec.normalize()
        
        // The default orientation is along Y-axis (0, 1, 0)
        // We need to rotate to align with our direction
        const up = new THREE.Vector3(0, 1, 0)
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(up, directionVec)
        this.group.setRotationFromQuaternion(quaternion)
        
        // Position the group at the anchor point
        this.group.position.set(ankerPoint.x, ankerPoint.y, ankerPoint.z)
    }
    
    addToScene(scene: THREE.Scene): void {
        scene.add(this.group)
    }
    
    removeFromScene(scene: THREE.Scene): void {
        scene.remove(this.group)
    }
    
    dispose(): void {
        this.cylinderMesh.geometry.dispose()
        this.coneMesh.geometry.dispose()
        if (this.cylinderMesh.material instanceof THREE.Material) {
            this.cylinderMesh.material.dispose()
        }
        if (this.coneMesh.material instanceof THREE.Material) {
            this.coneMesh.material.dispose()
        }
    }
}