# Linker L6 Hand - Joint Mapping Documentation

**Model:** Linker Hand L6 (Left)
**Total DOF:** 11 revolute joints
**URDF File:** `public/assets/robots/hands/linker_l6/left/linkerhand_l6_left.urdf`

---

## Joint Structure Overview

The Linker L6 hand has 11 degrees of freedom distributed across 5 digits:

| Finger | Joints | Total DOF |
|--------|--------|-----------|
| Thumb  | cmc_roll, cmc_pitch, dip | 3 |
| Index  | mcp_pitch, dip | 2 |
| Middle | mcp_pitch, dip | 2 |
| Ring   | mcp_pitch, dip | 2 |
| Pinky  | mcp_pitch, dip | 2 |
| **Total** | | **11** |

---

## Complete Joint Definitions

### Thumb (3 DOF)

#### 1. thunb_cmc_roll (Note: typo in URDF "thunb" instead of "thumb")
- **Type:** Revolute
- **Axis:** `[0, 0, 1]` = **Z-axis**
- **Range:** 0 to 1.39 rad (0° to 79.6°)
- **Parent:** hand_base_link
- **Child:** thumb_metacarpals_base1
- **Function:** Thumb abduction/adduction (side-to-side movement)

#### 2. thumb_cmc_pitch
- **Type:** Revolute
- **Axis:** `[-1, 0, 0]` = **Negative X-axis**
- **Range:** 0 to 0.99 rad (0° to 56.7°)
- **Parent:** thumb_metacarpals_base1
- **Child:** thumb_metacarpals
- **Function:** Thumb flexion (bending toward palm)

#### 3. thumb_dip
- **Type:** Revolute
- **Axis:** `[-1, 0, 0]` = **Negative X-axis**
- **Range:** 0 to 1.22 rad (0° to 69.9°)
- **Parent:** thumb_metacarpals
- **Child:** thumb_distal
- **Function:** Thumb tip flexion
- **Mimic:** Coupled to `thumb_cmc_pitch` with multiplier 2.22

---

### Index Finger (2 DOF)

#### 4. index_mcp_pitch
- **Type:** Revolute
- **Axis:** `[0, 1, 0]` = **Y-axis**
- **Range:** 0 to 1.26 rad (0° to 72.2°)
- **Parent:** hand_base_link
- **Child:** index_proximal
- **Function:** Index finger flexion at knuckle

#### 5. index_dip
- **Type:** Revolute
- **Axis:** `[0, 1, 0]` = **Y-axis**
- **Range:** 0 to 1.14 rad (0° to 65.3°)
- **Parent:** index_proximal
- **Child:** index_distal
- **Function:** Index finger tip flexion
- **Mimic:** Coupled to `index_mcp_pitch` with multiplier 1.9

---

### Middle Finger (2 DOF)

#### 6. middle_mcp_pitch
- **Type:** Revolute
- **Axis:** `[0, 1, 0]` = **Y-axis**
- **Range:** 0 to 1.26 rad (0° to 72.2°)
- **Parent:** hand_base_link
- **Child:** middle_proximal
- **Function:** Middle finger flexion at knuckle

#### 7. middle_dip
- **Type:** Revolute
- **Axis:** `[0, 1, 0]` = **Y-axis**
- **Range:** 0 to 1.14 rad (0° to 65.3°)
- **Parent:** middle_proximal
- **Child:** middle_distal
- **Function:** Middle finger tip flexion
- **Mimic:** Coupled to `middle_mcp_pitch` with multiplier 1.9

---

### Ring Finger (2 DOF)

#### 8. ring_mcp_pitch
- **Type:** Revolute
- **Axis:** `[0, 1, 0]` = **Y-axis**
- **Range:** 0 to 1.26 rad (0° to 72.2°)
- **Parent:** hand_base_link
- **Child:** ring_proximal
- **Function:** Ring finger flexion at knuckle

#### 9. ring_dip
- **Type:** Revolute
- **Axis:** `[0, 1, 0]` = **Y-axis**
- **Range:** 0 to 1.14 rad (0° to 65.3°)
- **Parent:** ring_proximal
- **Child:** ring_distal
- **Function:** Ring finger tip flexion
- **Mimic:** Coupled to `ring_mcp_pitch` with multiplier 1.9

---

### Pinky Finger (2 DOF)

#### 10. pinky_mcp_pitch
- **Type:** Revolute
- **Axis:** `[0, 1, 0]` = **Y-axis**
- **Range:** 0 to 1.26 rad (0° to 72.2°)
- **Parent:** hand_base_link
- **Child:** pinky_proximal
- **Function:** Pinky finger flexion at knuckle

#### 11. pinky_dip
- **Type:** Revolute
- **Axis:** `[0, 1, 0]` = **Y-axis**
- **Range:** 0 to 1.14 rad (0° to 65.3°)
- **Parent:** pinky_proximal
- **Child:** pinky_distal
- **Function:** Pinky finger tip flexion
- **Mimic:** Coupled to `pinky_mcp_pitch` with multiplier 1.9

---

## Axis Summary

| Axis | Joints | Count |
|------|--------|-------|
| **Y-axis** `[0, 1, 0]` | All 4 fingers (mcp_pitch, dip) | 8 |
| **Z-axis** `[0, 0, 1]` | thumb_cmc_roll | 1 |
| **-X-axis** `[-1, 0, 0]` | thumb_cmc_pitch, thumb_dip | 2 |

---

## Mimic Joint Relationships

The L6 hand uses **mimic joints** to couple distal joints to their proximal counterparts:

| Mimic Joint | Follows | Multiplier | Behavior |
|-------------|---------|------------|----------|
| thumb_dip | thumb_cmc_pitch | 2.22 | DIP bends 2.22× more than CMC pitch |
| index_dip | index_mcp_pitch | 1.9 | DIP bends 1.9× the MCP |
| middle_dip | middle_mcp_pitch | 1.9 | DIP bends 1.9× the MCP |
| ring_dip | ring_mcp_pitch | 1.9 | DIP bends 1.9× the MCP |
| pinky_dip | pinky_mcp_pitch | 1.9 | DIP bends 1.9× the MCP |

**Important:** When controlling these joints, you only need to set the primary joint (mcp/cmc). The DIP joints will automatically follow based on the mimic relationship.

---

## MediaPipe Landmark to URDF Joint Mapping

### MediaPipe Landmarks (21 points per hand)
```
0: WRIST
1-4: THUMB (CMC, MCP, IP, TIP)
5-8: INDEX (MCP, PIP, DIP, TIP)
9-12: MIDDLE (MCP, PIP, DIP, TIP)
13-16: RING (MCP, PIP, DIP, TIP)
17-20: PINKY (MCP, PIP, DIP, TIP)
```

### Proposed Mapping Strategy

#### Thumb
- **thunb_cmc_roll** (Z-axis): Calculate from angle between landmarks 0→1 projected onto XZ plane
- **thumb_cmc_pitch** (-X-axis): Calculate from landmarks 1→2→3 flexion angle
- **thumb_dip** (-X-axis): Automatically mimics thumb_cmc_pitch × 2.22

#### Index, Middle, Ring, Pinky (all similar structure)
- **{finger}_mcp_pitch** (Y-axis): Calculate from landmarks base→MCP→PIP flexion angle
  - Index: 5→6→7
  - Middle: 9→10→11
  - Ring: 13→14→15
  - Pinky: 17→18→19
- **{finger}_dip** (Y-axis): Automatically mimics mcp_pitch × 1.9

---

## Quaternion Decomposition Strategy

For each joint, we need to:

1. **Build quaternion from MediaPipe landmarks** (3D orientation of bone segment)
2. **Decompose quaternion to rotation matrix**
3. **Project rotation onto joint's specific axis**
4. **Extract rotation angle around that axis**

### Example: Index MCP Pitch

```javascript
// MediaPipe landmarks
const wrist = landmarks[0]        // Base reference
const indexMCP = landmarks[5]     // Joint location
const indexPIP = landmarks[6]     // Direction indicator

// Build local coordinate frame
const forward = normalize(indexPIP - indexMCP)  // Along finger
const right = cross(forward, [0, 1, 0])         // Perpendicular
const up = cross(right, forward)                // Complete frame

// Create rotation matrix and convert to quaternion
const rotationMatrix = [right, up, forward]
const quaternion = matrixToQuaternion(rotationMatrix)

// Decompose to Y-axis rotation (index_mcp_pitch axis)
const yAxisAngle = extractAxisRotation(quaternion, [0, 1, 0])

// Apply to joint
robot.joints['index_mcp_pitch'].setJointValue(yAxisAngle)
```

---

## Implementation Notes

### 1. Independent vs. Mimic Joints
- **Set independently:** 6 joints (thumb_cmc_roll, thumb_cmc_pitch, and 4× mcp_pitch)
- **Auto-calculated:** 5 joints (all DIP joints via mimic)
- **Total control inputs:** 6 (not 11)

### 2. Axis Considerations
- Y-axis joints (fingers): Standard pitch rotation
- Z-axis joint (thumb roll): Requires different projection
- Negative X-axis joints (thumb pitch/dip): Negate the extracted angle

### 3. Coordinate System
- URDF uses right-hand coordinate system
- MediaPipe uses normalized screen coordinates
- Transformation needed: MediaPipe → Three.js → URDF

---

**Document Version:** 1.0
**Date:** October 21, 2025
**Status:** Complete - Ready for implementation
