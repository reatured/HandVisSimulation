/**
 * IK Package Exports
 *
 * Central export point for all IK-related modules
 * Now using TypeScript + CCDIKSolver implementation
 */

export { default as IKController } from './IKController'
export { buildSkeletonFromSpec } from './builders/skeleton-builder.ts'
export { linkerhand_l10_left_thumb } from './specs/linkerhand_l10_left.ts'
export { default as ThumbIKTest } from './components/ThumbIKTest.jsx'
export { default as ThumbJointVisualizer } from './components/ThumbJointVisualizer.jsx'

// Type exports (for TypeScript consumers only)
// Uncomment if you need to import types in TS files:
// export type { ModelIKSpec, JointSpec, LinkSpec, IKChainSpec, Vec3 } from './types/ik-spec'
