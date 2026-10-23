import { add, type Vector } from "../math/operations";
import { PapermanMuscle } from "../physics-world/muscle";
import { PapermanCompoundMuscle } from "../physics-world/compoundMuscle";
import { PapermanBone } from "../physics-world/bone";
import { getZeroVelocityParticle } from "../physics-world/particle";
import { Particle } from "../physics-world/particle";
import { defaultBodyData } from "./body-default-data";
import { PapermanHead } from "./head";
import { PapermanTorso } from "./torso";
import * as THREE from "three";
import { stabalize } from "./utils";
import { PapermanLeg } from "./leg";

export class PapermanBody {
    anchorPoint: Vector;
    yRotation: number;
    head: PapermanHead;
    torso: PapermanTorso;
    leftLeg: PapermanLeg;
    rightLeg: PapermanLeg;
    headToTorsoStabalizers: PapermanBone[];
    headToTorsoMuscles: PapermanMuscle[];
    headTorsoMuscleMain: PapermanCompoundMuscle;
    headTorsoMuscleSupport: PapermanCompoundMuscle;
    thighMuscleAnchorLeft: Particle;
    thighMuscleAnchorRight: Particle;
    thighMuscleAnchorBones: PapermanBone[];
    leftThighMuscles: PapermanMuscle[];
    rightThighMuscles: PapermanMuscle[];
    leftThighCompound: PapermanCompoundMuscle;
    rightThighCompound: PapermanCompoundMuscle;
    scene: THREE.Scene;
    debug: boolean;
    constructor(anchorPoint: Vector, yRotation: number, scene: THREE.Scene, debug: boolean) {
        this.anchorPoint = anchorPoint;
        this.yRotation = yRotation;
        this.scene = scene;
        this.debug = debug;

        // first head and torso are created with bones and muscles
        this.head = new PapermanHead(
            getZeroVelocityParticle(defaultBodyData.head.top, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.topLeft, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.topRight, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.bottomLeft, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.bottomRight, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.neckUpperLeft, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.neckUpperRight, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.neckLowerLeft, scene, debug),
            getZeroVelocityParticle(defaultBodyData.head.neckLowerRight, scene, debug),
            scene,
        );
        this.torso = new PapermanTorso(
            getZeroVelocityParticle(defaultBodyData.torso.leftShoulderUpper, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.rightShoulderUpper, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.leftShoulderLower, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.rightShoulderLower, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.leftWaist, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.rightWaist, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.hipLeftOuter, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.hipLeftInner, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.hipRightOuter, scene, debug),
            getZeroVelocityParticle(defaultBodyData.torso.hipRightInner, scene, debug),
            scene,
        );

        this.leftLeg = new PapermanLeg(
            "leg-left",
            this.torso.hipLeftOuter,
            this.torso.hipLeftInner,
            scene,
        );
        this.rightLeg = new PapermanLeg(
            "leg-right",
            this.torso.hipRightOuter,
            this.torso.hipRightInner,
            scene,
        );

        // head to torso stabalization
        this.headToTorsoStabalizers = stabalize(
            [
                this.head.neckLowerLeft,
                this.head.neckLowerRight,
                this.torso.leftShoulderUpper,
                this.torso.rightShoulderUpper,
                this.torso.leftShoulderLower,
                this.torso.rightShoulderLower,
            ],
            scene,
            debug,
        );

        // head to torso muscles
        this.headToTorsoMuscles = [
            new PapermanMuscle(
                "headToTorsoMuscleLeft",
                this.head.topLeft,
                this.torso.leftShoulderLower,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "headToTorsoMuscleRight",
                this.head.topRight,
                this.torso.rightShoulderLower,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "headToTorsoMuscleSupportLeft",
                this.head.bottomLeft,
                this.torso.leftShoulderUpper,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "headToTorsoMuscleSupportRight",
                this.head.bottomRight,
                this.torso.rightShoulderUpper,
                0.9,
                scene,
                debug,
            ),
        ];
        this.headTorsoMuscleMain = new PapermanCompoundMuscle("headTorsoMuscleMain", [
            this.headToTorsoMuscles[0],
            this.headToTorsoMuscles[1],
        ]);
        this.headTorsoMuscleSupport = new PapermanCompoundMuscle("headTorsoMuscleSupport", [
            this.headToTorsoMuscles[2],
            this.headToTorsoMuscles[3],
        ]);

        // torso to leg muscle section
        // for this we need some special particles and stabalizing bones to anchor the muscles
        // to give the legs full range of motion
        // this is not doable with the otherwise flat body of the paperman
        // But it is important that no triangles are drawn between these particles and the others
        // since the paperman is supposed to remain a flat figure otherwise
        this.thighMuscleAnchorLeft = getZeroVelocityParticle(
            add(this.torso.hipLeftInner.position, { x: -0.05, y: 0, z: 0.2 }),
            scene,
            debug,
        );
        this.thighMuscleAnchorRight = getZeroVelocityParticle(
            add(this.torso.hipRightInner.position, { x: 0.05, y: 0, z: 0.2 }),
            scene,
            debug,
        );
        // the thigh muscle anchor particles need to be connected to the hip particles
        this.thighMuscleAnchorBones = [
            new PapermanBone(this.thighMuscleAnchorLeft, this.torso.hipLeftInner, scene, debug),
            new PapermanBone(this.thighMuscleAnchorRight, this.torso.hipRightInner, scene, debug),
            new PapermanBone(this.thighMuscleAnchorLeft, this.torso.hipLeftOuter, scene, debug),
            new PapermanBone(this.thighMuscleAnchorRight, this.torso.hipRightOuter, scene, debug),
        ];

        // thigh muscles
        // leftThighMuscles
        this.leftThighMuscles = [
            new PapermanMuscle(
                "leftThighInner",
                this.thighMuscleAnchorLeft,
                this.leftLeg.kneeInner,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "leftThighOuter",
                this.thighMuscleAnchorLeft,
                this.leftLeg.kneeOuter,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "leftThighUpper",
                this.thighMuscleAnchorLeft,
                this.torso.leftWaist,
                0.9,
                scene,
                debug,
            ),
        ];

        // rightThighMuscles
        this.rightThighMuscles = [
            new PapermanMuscle(
                "rightThighInner",
                this.thighMuscleAnchorRight,
                this.rightLeg.kneeInner,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "rightThighOuter",
                this.thighMuscleAnchorRight,
                this.rightLeg.kneeOuter,
                0.9,
                scene,
                debug,
            ),
            new PapermanMuscle(
                "rightThighUpper",
                this.thighMuscleAnchorRight,
                this.torso.rightWaist,
                0.9,
                scene,
                debug,
            ),
        ];

        this.leftThighCompound = new PapermanCompoundMuscle("leftThigh", this.leftThighMuscles);
        this.rightThighCompound = new PapermanCompoundMuscle("rightThigh", this.rightThighMuscles);

        // do this at the very end of the constructor to ensure all particles are positioned correctly
        this.setPosition(this.anchorPoint);
    }

    // moves the whole body by the given offset, without adding velocity
    setPosition(position: Vector) {
        for (const particle of this.getParticles()) {
            particle.teleportTo(add(particle.position, position));
        }
        // bone/muscle debug meshes only follow the particles when updated
        for (const bone of [...this.getBones(), ...this.getMuscles()]) {
            bone.updateMesh();
        }
    }

    getParticles() {
        return [
            ...this.head.getParticles(),
            ...this.torso.getParticles(),
            ...this.leftLeg.getParticles(),
            ...this.rightLeg.getParticles(),
            this.thighMuscleAnchorLeft,
            this.thighMuscleAnchorRight,
        ];
    }

    getBones() {
        return [
            ...this.head.getBones(),
            ...this.torso.getBones(),
            ...this.leftLeg.getBones(),
            ...this.rightLeg.getBones(),
            ...this.headToTorsoStabalizers,
            ...this.thighMuscleAnchorBones,
        ];
    }

    getMuscles() {
        return [
            ...this.head.getMuscles(),
            ...this.torso.getMuscles(),
            ...this.headToTorsoMuscles,
            ...this.leftLeg.getMuscles(),
            ...this.rightLeg.getMuscles(),
            ...this.leftThighMuscles,
            ...this.rightThighMuscles,
        ];
    }

    // this should return all the muscles which should be exposed to external control
    // this can be either single muscles or summarized compound muscles
    getControllableMuscles(): (PapermanCompoundMuscle | PapermanMuscle)[] {
        return [
            ...this.head.getControlledMuscles(),
            ...this.torso.getControlledMuscles(),
            this.headTorsoMuscleMain,
            this.headTorsoMuscleSupport,
            ...this.leftLeg.getControlledMuscles(),
            ...this.rightLeg.getControlledMuscles(),
            this.leftThighCompound,
            this.rightThighCompound,
        ];
    }
}
