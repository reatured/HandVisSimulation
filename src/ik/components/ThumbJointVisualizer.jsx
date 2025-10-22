/**
 * ThumbJointVisualizer.jsx
 *
 * Visualizes L10 thumb joints and their rotation axes
 * Shows 5 joints as colored spheres with axis direction lines
 */

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildSkeletonFromSpec } from "../builders/skeleton-builder.ts";
import { linkerhand_l10_left_thumb } from "../specs/linkerhand_l10_left.ts";

/**
 * Visualizes a single joint with position sphere and rotation axis line
 */
function JointAxisHelper({ joint, bone, bones, color }) {
  const lineRef = useRef();
  const sphereRef = useRef();

  useFrame(() => {
    if (!bone || !lineRef.current || !sphereRef.current) return;

    // Update world position of sphere to match bone
    bone.updateWorldMatrix(true, false);
    const worldPos = new THREE.Vector3();
    bone.getWorldPosition(worldPos);
    sphereRef.current.position.copy(worldPos);

    // Transform axis to world space
    const parentBone = bones.get(joint.parent);
    if (parentBone) {
      parentBone.updateWorldMatrix(true, false);

      // Get joint axis in local space
      const localAxis = new THREE.Vector3(...joint.axis);

      // Transform axis to world space (rotation only, no translation)
      const worldAxis = localAxis.clone().applyQuaternion(parentBone.getWorldQuaternion(new THREE.Quaternion()));
      worldAxis.normalize();

      // Position line at joint position, pointing along axis
      lineRef.current.position.copy(worldPos);

      // Orient line to point along axis
      // Create a rotation that aligns the line (initially along Y) with the axis
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, worldAxis);
      lineRef.current.setRotationFromQuaternion(quaternion);
    }
  });

  return (
    <group>
      {/* Joint position sphere - made larger for visibility */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.01, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Rotation axis line - made longer and thicker for visibility */}
      <mesh ref={lineRef}>
        <cylinderGeometry args={[0.003, 0.003, 0.05, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/**
 * Main thumb joint visualizer component
 * Shows all 5 thumb joints with color-coded axes
 */
export default function ThumbJointVisualizer() {
  const groupRef = useRef();
  const skeletonRef = useRef(null);

  // Build skeleton on mount
  useEffect(() => {
    try {
      const skeleton = buildSkeletonFromSpec(linkerhand_l10_left_thumb);

      // Initialize skeleton to default pose
      skeleton.root.updateWorldMatrix(true, true);

      skeletonRef.current = skeleton;

      console.log("✅ Thumb joint visualizer initialized");
    } catch (error) {
      console.error("❌ Failed to build thumb joint visualizer:", error);
    }
  }, []);

  if (!skeletonRef.current) {
    return null; // Loading
  }

  const { bones } = skeletonRef.current;
  const spec = linkerhand_l10_left_thumb;

  // Joint color mapping
  const jointColors = {
    thumb_cmc_roll: "#FF0000",   // Red
    thumb_cmc_yaw: "#00FF00",    // Green
    thumb_cmc_pitch: "#0000FF",  // Blue
    thumb_mcp: "#FFFF00",        // Yellow
    thumb_ip: "#00FFFF",         // Cyan
  };

  return (
    <group ref={groupRef}>
      {/* Render each joint with its axis */}
      {spec.joints.map((joint) => {
        const bone = bones.get(joint.child);
        const color = jointColors[joint.name] || "#FFFFFF";

        if (!bone) {
          console.warn(`Joint ${joint.name}: child bone not found`);
          return null;
        }

        return (
          <JointAxisHelper
            key={joint.name}
            joint={joint}
            bone={bone}
            bones={bones}
            color={color}
          />
        );
      })}
    </group>
  );
}
