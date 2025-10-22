/**
 * skeleton-builder.ts
 *
 * Builds Three.js Skeleton + CCDIKSolver from ModelIKSpec
 * Handles per-axis constraints using swing-twist decomposition
 */

import * as THREE from "three";
import { CCDIKSolver } from "three/examples/jsm/animation/CCDIKSolver.js";
import type { ModelIKSpec } from "../types/ik-spec";

// Type definitions for CCDIKSolver (not exported by Three.js)
interface IKChain {
  index: number;
  rotationMin?: THREE.Vector3;
  rotationMax?: THREE.Vector3;
}

interface IK {
  target: number;
  effector: number;
  links: IKChain[];
  iteration?: number;
  maxAngle?: number;
  minAngle?: number;
}

/**
 * Helper to set RPY (Roll-Pitch-Yaw) rotation in XYZ order
 */
function setRPY(obj: THREE.Object3D, rpy: [number, number, number]) {
  obj.rotation.set(rpy[0], rpy[1], rpy[2], "XYZ");
}

/**
 * Swing-twist decomposition: extract twist around an axis
 * Used for per-axis joint angle constraints
 *
 * @param q - Quaternion to decompose
 * @param axis - Axis to extract twist around
 * @returns Twist quaternion (rotation around axis only)
 */
function twistAroundAxis(q: THREE.Quaternion, axis: THREE.Vector3): THREE.Quaternion {
  const ra = new THREE.Vector3(q.x, q.y, q.z);
  const proj = axis.clone().multiplyScalar(ra.dot(axis));
  const twist = new THREE.Quaternion(proj.x, proj.y, proj.z, q.w).normalize();
  return twist;
}

/**
 * Result of building skeleton from spec
 */
export interface SkeletonBuildResult {
  /** Root bone (usually hand_base_link) */
  root: THREE.Bone;

  /** Map from link name to bone */
  bones: Map<string, THREE.Bone>;

  /** Three.js Skeleton containing all bones */
  skeleton: THREE.Skeleton;

  /** Skinned mesh (can be used for visualization) */
  skinned: THREE.SkinnedMesh;

  /** CCD IK Solver */
  solver: CCDIKSolver;

  /** Map from target name to target bone */
  targets: Map<string, THREE.Bone>;

  /** Apply mimic constraints (call after solver.update()) */
  applyMimicConstraints: () => void;

  /** Apply per-axis angle limits (call after solver.update()) */
  applyAxisConstraints: () => void;
}

/**
 * Build Three.js skeleton from model spec
 * Creates bones, sets up hierarchy, initializes CCDIKSolver
 *
 * @param spec - Model specification (links, joints, IK chains)
 * @returns Skeleton build result with solver and helpers
 */
export function buildSkeletonFromSpec(spec: ModelIKSpec): SkeletonBuildResult {
  const bones = new Map<string, THREE.Bone>();

  // 1) Create bones for each link
  for (const link of spec.links) {
    const bone = new THREE.Bone();
    bone.name = link.name;
    bones.set(link.name, bone);
  }

  // 2) Set up parent-child hierarchy with origin transforms
  for (const joint of spec.joints) {
    const parent = bones.get(joint.parent);
    const child = bones.get(joint.child);

    if (!parent || !child) {
      console.warn(`Joint ${joint.name}: missing parent or child bone`);
      continue;
    }

    parent.add(child);

    // Set child's local transform according to joint origin
    child.position.set(...joint.origin.xyz);
    setRPY(child, joint.origin.rpy);
  }

  // 3) Find root bone (typically hand_base_link or first link)
  const root = bones.get("hand_base_link") ?? bones.get(spec.links[0].name);
  if (!root) {
    throw new Error("No root bone found");
  }

  // 4) Create target bones for IK
  const targets = new Map<string, THREE.Bone>();
  for (const chain of spec.ikChains) {
    const target = new THREE.Bone();
    target.name = chain.target;
    // Add target as child of root for now (can be repositioned later)
    root.add(target);
    targets.set(chain.target, target);
  }

  // 5) Create skeleton with all bones (including targets)
  const allBones = [...bones.values(), ...targets.values()];
  const skeleton = new THREE.Skeleton(allBones);

  // 6) Create a minimal SkinnedMesh (required by CCDIKSolver)
  // For visualization, you can replace this with actual geometry later
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshStandardMaterial({ wireframe: true });
  const skinned = new THREE.SkinnedMesh(geometry, material);
  skinned.add(root);
  skinned.bind(skeleton);

  // 7) Build CCDIKSolver IK configuration
  const iks: IK[] = spec.ikChains.map((chain) => {
    const effectorBone = bones.get(chain.effector);
    const targetBone = targets.get(chain.target);

    if (!effectorBone || !targetBone) {
      throw new Error(`IK chain ${chain.name}: missing effector or target bone`);
    }

    const effectorIndex = allBones.indexOf(effectorBone);
    const targetIndex = allBones.indexOf(targetBone);

    // Build link indices (bones that will be adjusted by IK)
    const links: IKChain[] = chain.links.map((linkName) => {
      const bone = bones.get(linkName);
      if (!bone) {
        throw new Error(`IK chain ${chain.name}: missing link ${linkName}`);
      }
      return {
        index: allBones.indexOf(bone),
        rotationMin: undefined,
        rotationMax: undefined,
      };
    });

    return {
      target: targetIndex,
      effector: effectorIndex,
      links,
      iteration: chain.iteration ?? 3,
      maxAngle: chain.maxAngle,
      minAngle: chain.minAngle,
    };
  });

  // 8) Initialize CCDIKSolver
  const solver = new CCDIKSolver(skinned, iks);

  // 9) Create helper functions for constraints

  // Build joint lookup maps for constraint application
  const jointByName = new Map(spec.joints.map((j) => [j.name, j]));

  /**
   * Apply mimic constraints
   * For joints with mimic spec, sync their angle to master joint
   * Call this AFTER solver.update()
   */
  function applyMimicConstraints() {
    for (const joint of spec.joints) {
      if (!joint.mimic) continue;

      const slaveBone = bones.get(joint.child);
      const masterJoint = jointByName.get(joint.mimic.joint);

      if (!slaveBone || !masterJoint) {
        console.warn(`Mimic: missing bone or master joint for ${joint.name}`);
        continue;
      }

      const masterBone = bones.get(masterJoint.child);
      if (!masterBone) continue;

      // Simple case: assume axis is Y (common for fingers)
      // For more complex axes, use swing-twist decomposition
      if (
        joint.axis[0] === 0 &&
        joint.axis[1] === 1 &&
        joint.axis[2] === 0 &&
        masterJoint.axis[0] === 0 &&
        masterJoint.axis[1] === 1 &&
        masterJoint.axis[2] === 0
      ) {
        // Both joints rotate around Y axis
        const masterAngle = masterBone.rotation.y;
        let slaveAngle = joint.mimic.multiplier * masterAngle + joint.mimic.offset;

        // Apply limits
        if (joint.limit) {
          slaveAngle = THREE.MathUtils.clamp(slaveAngle, joint.limit.lower, joint.limit.upper);
        }

        slaveBone.rotation.y = slaveAngle;
      } else {
        // General case: use quaternion-based approach
        // TODO: implement if needed for non-Y-axis joints
        console.warn(`Mimic for non-Y-axis joints not yet implemented: ${joint.name}`);
      }
    }
  }

  /**
   * Apply per-axis angle constraints using swing-twist decomposition
   * Clamps joint rotation to stay within specified limits
   * Call this AFTER solver.update() and BEFORE applyMimicConstraints()
   */
  function applyAxisConstraints() {
    for (const joint of spec.joints) {
      if (!joint.limit) continue;

      const bone = bones.get(joint.child);
      if (!bone) continue;

      const axis = new THREE.Vector3(...joint.axis).normalize();

      // Use swing-twist to extract rotation around this specific axis
      const twist = twistAroundAxis(bone.quaternion, axis);

      // Convert twist quaternion to angle
      const angle = 2 * Math.acos(THREE.MathUtils.clamp(twist.w, -1, 1));

      // Determine sign based on axis direction
      const twistVec = new THREE.Vector3(twist.x, twist.y, twist.z);
      const signedAngle = twistVec.dot(axis) >= 0 ? angle : -angle;

      // Clamp to limits
      const clampedAngle = THREE.MathUtils.clamp(
        signedAngle,
        joint.limit.lower,
        joint.limit.upper
      );

      // If out of bounds, apply correction
      const delta = clampedAngle - signedAngle;
      if (Math.abs(delta) > 1e-4) {
        const correction = new THREE.Quaternion().setFromAxisAngle(axis, delta);
        bone.quaternion.multiply(correction);
      }
    }
  }

  return {
    root,
    bones,
    skeleton,
    skinned,
    solver,
    targets,
    applyMimicConstraints,
    applyAxisConstraints,
  };
}
