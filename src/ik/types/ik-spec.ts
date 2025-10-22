/**
 * ik-spec.ts
 *
 * Type definitions for URDF-based IK system using Three.js CCDIKSolver
 * Minimal but sufficient types for mapping URDF data to skeletal IK chains
 */

/** 3D vector [x, y, z] */
export type Vec3 = [number, number, number];

/**
 * Link specification - represents a rigid body in the hand
 * @property name - Unique link identifier (matches URDF link name)
 * @property mesh - Optional mesh file path for visualization (STL/OBJ/etc)
 */
export type LinkSpec = {
  name: string;
  mesh?: string;
};

/**
 * Joint specification - represents connection between two links
 * @property name - Unique joint identifier (matches URDF joint name)
 * @property parent - Parent link name
 * @property child - Child link name
 * @property origin - Transform from parent to child frame
 * @property axis - Joint rotation axis in local frame (unit vector)
 * @property limit - Optional joint angle limits in radians
 * @property mimic - Optional coupling to another joint (for underactuated fingers)
 */
export type JointSpec = {
  name: string;
  parent: string;
  child: string;
  origin: {
    xyz: Vec3;  // Translation in meters
    rpy: Vec3;  // Roll-Pitch-Yaw rotation in radians
  };
  axis: Vec3;  // Rotation axis (unit vector)
  limit?: {
    lower: number;  // Min angle in radians
    upper: number;  // Max angle in radians
  };
  mimic?: {
    joint: string;      // Master joint name
    multiplier: number; // Angle multiplier
    offset: number;     // Angle offset in radians
  };
};

/**
 * IK chain specification - defines one kinematic chain for IK solving
 * Typically one chain per finger (thumb, index, middle, ring, pinky)
 *
 * @property name - Chain identifier for debugging
 * @property effector - End effector link name (fingertip)
 * @property links - Ordered list of link names from base to tip (parent→child order)
 * @property target - Target bone name that the effector tries to reach
 * @property iteration - CCD iteration count (2-10 typical)
 * @property maxAngle - Maximum angle change per CCD iteration (radians)
 * @property minAngle - Minimum angle change per CCD iteration (radians)
 */
export type IKChainSpec = {
  name: string;
  effector: string;
  links: string[];
  target: string;
  iteration?: number;
  maxAngle?: number;
  minAngle?: number;
};

/**
 * Complete hand model specification
 * One model = one URDF file (e.g., linkerhand_l10_left)
 * Contains all data needed to build skeleton + IK solver
 *
 * @property modelName - Model identifier
 * @property scale - Optional uniform scale factor
 * @property links - All rigid bodies in the hand
 * @property joints - All connections between links
 * @property ikChains - IK chains for each finger
 */
export type ModelIKSpec = {
  modelName: string;
  scale?: number;
  links: LinkSpec[];
  joints: JointSpec[];
  ikChains: IKChainSpec[];
};
