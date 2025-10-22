/**
 * linkerhand_l10_left.ts
 *
 * Model specification for Linker Hand L10 (Left) - Thumb only
 * Extracted from linkerhand_l10_left.urdf
 *
 * This spec contains minimal but sufficient data for IK:
 * - 3-DOF CMC joint (roll, yaw, pitch)
 * - MCP joint with mimic coupling
 * - IP joint with mimic coupling
 */

import { ModelIKSpec } from "../types/ik-spec";

export const linkerhand_l10_left_thumb: ModelIKSpec = {
  modelName: "linkerhand_l10_left_thumb",
  scale: 1,

  // Links (rigid bodies)
  links: [
    { name: "hand_base_link", mesh: "meshes/hand_base_link.STL" },

    // Thumb CMC - 3 intermediate bones for 3-DOF joint
    { name: "thumb_metacarpals_base1", mesh: "meshes/thumb_metacarpals_base1.STL" },
    { name: "thumb_metacarpals_base2", mesh: "meshes/thumb_metacarpals_base2.STL" },
    { name: "thumb_metacarpals", mesh: "meshes/thumb_metacarpals.STL" },

    // Thumb segments
    { name: "thumb_proximal", mesh: "meshes/thumb_proximal.STL" },
    { name: "thumb_distal", mesh: "meshes/thumb_distal.STL" },
  ],

  // Joints (connections between links)
  joints: [
    // CMC Roll - First DOF of thumb CMC joint
    {
      name: "thumb_cmc_roll",
      parent: "hand_base_link",
      child: "thumb_metacarpals_base1",
      origin: {
        xyz: [-0.013419, -0.012551, 0.060602],
        rpy: [0, 0, 0],
      },
      axis: [-0.99996, 0, -0.0087265],
      limit: { lower: 0.0, upper: 1.1339 },
    },

    // CMC Yaw - Second DOF of thumb CMC joint
    {
      name: "thumb_cmc_yaw",
      parent: "thumb_metacarpals_base1",
      child: "thumb_metacarpals_base2",
      origin: {
        xyz: [0.035797, 0.00065879, 0.00045944],
        rpy: [0, 0, 0],
      },
      axis: [-0.008517, -0.21782, 0.97595],
      limit: { lower: 0.0, upper: 1.9189 },
    },

    // CMC Pitch - Third DOF of thumb CMC joint
    {
      name: "thumb_cmc_pitch",
      parent: "thumb_metacarpals_base2",
      child: "thumb_metacarpals",
      origin: {
        xyz: [0.0046051, -0.014383, -0.0051478],
        rpy: [-0.16356, -1.1191, 2.0038],
      },
      axis: [0, 1, 0],
      limit: { lower: 0.0, upper: 0.5149 },
    },

    // MCP - Metacarpophalangeal joint (coupled to CMC pitch)
    {
      name: "thumb_mcp",
      parent: "thumb_metacarpals",
      child: "thumb_proximal",
      origin: {
        xyz: [0.0061722, 0, 0.047968],
        rpy: [0, 0, 0],
      },
      axis: [0, 1, 0],
      limit: { lower: 0.0, upper: 0.7152 },
      mimic: {
        joint: "thumb_cmc_pitch",
        multiplier: 1.3898,
        offset: 0,
      },
    },

    // IP - Interphalangeal joint (coupled to CMC pitch)
    {
      name: "thumb_ip",
      parent: "thumb_proximal",
      child: "thumb_distal",
      origin: {
        xyz: [-0.00017064, 0, 0.038665],
        rpy: [0, 0, 0],
      },
      axis: [0, 1, 0],
      limit: { lower: 0.0, upper: 0.7763 },
      mimic: {
        joint: "thumb_cmc_pitch",
        multiplier: 1.508,
        offset: 0,
      },
    },
  ],

  // IK chains
  ikChains: [
    {
      name: "thumb_ik",
      effector: "thumb_distal", // Fingertip
      // Links in IK chain (from base to tip, excluding effector)
      // These are the bones that will be adjusted by IK solver
      links: [
        "thumb_metacarpals_base1", // CMC roll
        "thumb_metacarpals_base2", // CMC yaw
        "thumb_metacarpals",       // CMC pitch
        "thumb_proximal",          // MCP (will be constrained by mimic after IK)
      ],
      target: "thumb_target", // Virtual target bone
      iteration: 3,
      maxAngle: Math.PI / 18, // ~10 degrees per iteration
    },
  ],
};
