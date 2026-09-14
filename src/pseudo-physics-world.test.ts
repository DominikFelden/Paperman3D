import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { magnitude, subtract } from './math'
import { Terrain } from './terrain'
import { Particle } from './particle'
import { PseudoPhysicsWorld } from './pseudo-physics-world'

function speedHistory(world: PseudoPhysicsWorld, particle: Particle, steps: number): number[] {
    const speeds: number[] = []
    for (let i = 0; i < steps; i++) {
        world.step()
        speeds.push(magnitude(subtract(particle.position, particle.lastPosition)))
    }
    return speeds
}

describe('PseudoPhysicsWorld friction on collision', () => {
    it('damps a resting particle\'s horizontal speed on flat terrain instead of accelerating it', () => {
        const terrain = new Terrain(4, [[0, 0], [0, 0]], new THREE.Scene())
        const particle = new Particle({ x: -1, y: 0, z: 0 }, { x: -1.02, y: 0, z: 0 }, new THREE.Scene())
        const world = new PseudoPhysicsWorld(terrain, [particle])

        const speeds = speedHistory(world, particle, 15)

        for (let i = 1; i < speeds.length; i++) {
            expect(speeds[i]).toBeLessThanOrEqual(speeds[i - 1] + 1e-9)
        }
        expect(speeds[speeds.length - 1]).toBeLessThan(speeds[0] * 0.5)
    })

    it('decays speed faster with friction enabled than with friction disabled', () => {
        const dampedTerrain = new Terrain(4, [[0, 0], [0, 0]], new THREE.Scene())
        const dampedParticle = new Particle({ x: -1, y: 0, z: 0 }, { x: -1.02, y: 0, z: 0 }, new THREE.Scene())
        const dampedWorld = new PseudoPhysicsWorld(dampedTerrain, [dampedParticle])

        const undampedTerrain = new Terrain(4, [[0, 0], [0, 0]], new THREE.Scene())
        const undampedParticle = new Particle({ x: -1, y: 0, z: 0 }, { x: -1.02, y: 0, z: 0 }, new THREE.Scene())
        const undampedWorld = new PseudoPhysicsWorld(undampedTerrain, [undampedParticle])
        undampedWorld.friction = 0

        const dampedSpeeds = speedHistory(dampedWorld, dampedParticle, 15)
        const undampedSpeeds = speedHistory(undampedWorld, undampedParticle, 15)

        expect(dampedSpeeds[dampedSpeeds.length - 1]).toBeLessThan(undampedSpeeds[undampedSpeeds.length - 1])
    })

    it('keeps a particle sliding down a slope numerically stable and speed-capped', () => {
        const slopeHeightmap = [
            [0, 0, 0],
            [0.3, 0.3, 0.3],
            [0.6, 0.6, 0.6],
        ]
        const terrain = new Terrain(3, slopeHeightmap, new THREE.Scene())
        const particle = new Particle({ x: -1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }, new THREE.Scene())
        const world = new PseudoPhysicsWorld(terrain, [particle])

        const speeds = speedHistory(world, particle, 30)

        for (const speed of speeds) {
            expect(Number.isFinite(speed)).toBe(true)
            expect(speed).toBeLessThanOrEqual(world.maxVelocity * Math.sqrt(3) + 1e-6)
        }
    })
})
