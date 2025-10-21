# Quaternion-Based Hand Tracking Implementation Plan

**Date:** October 21, 2025
**Target Model:** Linker L6 Hand (11 DOF)
**Approach:** Parallel system - preserve existing 1-DOF implementation

---

## Executive Summary

Build a new quaternion-based hand tracking pipeline that converts MediaPipe camera data directly to quaternion rotations, then decomposes these quaternions to extract rotation angles on each joint's specific axis. This approach eliminates gimbal lock and provides more natural 3D hand tracking.

**Key Innovation:** Keep existing system untouched - build new pipeline in parallel with UI toggle for comparison testing.

---

## System Architecture

### Current System (Preserved)
```
MediaPipe (21 landmarks)
    ↓
handKinematics.js → Single-axis curl angles
    ↓
motionFilter.js → EMA smoothing
    ↓
URDFHandModel.js → Apply to joints
```

### New Quaternion System (Parallel)
```
MediaPipe (21 landmarks)
    ↓
handKinematicsQuaternion.js → Quaternion per joint
    ↓
quaternionMotionFilter.js → SLERP smoothing
    ↓
quaternionToAxisAngles.js → Extract axis-specific angles
    ↓
URDFHandModel.js → Apply to joints (axis-aware)
```

---

## Implementation Phases

### Phase 1: Create New Quaternion Pipeline Components
**Status:** Pending
**Files to Create:**
- `src/utils/handKinematicsQuaternion.js` - Convert landmarks to quaternions
- `src/utils/quaternionToAxisAngles.js` - Decompose quaternion to per-axis rotations
- `src/utils/quaternionMotionFilter.js` - SLERP-based smoothing for quaternions

**Key Functions:**
1. **landmarksToQuaternions(landmarks, handedness)**
   - Input: 21 MediaPipe landmarks
   - Output: Quaternion for wrist + 20 finger joints
   - Logic: Build local coordinate frames from 3 consecutive landmarks

2. **decomposeQuaternionToAxes(quaternion, jointAxisConfig)**
   - Input: Quaternion + URDF joint axis definition
   - Output: Rotation angle around specified axis (X/Y/Z)
   - Logic: Convert to rotation matrix, project onto axis vector

3. **slerpFilter(currentQuat, previousQuat, alpha)**
   - Input: Current and previous quaternions, smoothing factor
   - Output: Smoothed quaternion via spherical interpolation
   - Logic: SLERP (Spherical Linear Interpolation)

**No modifications to existing files**

---

### Phase 2: Extract URDF Joint Axis Information
**Status:** Pending
**Goal:** Document Linker L6's 11 DOF structure

**URDF File:** `public/assets/robots/hands/linkerhand_l6_left.urdf`

**Expected Joint Structure:**
```
Thumb (3 DOF):
  - thumb_cmc_roll → axis: Z
  - thumb_cmc_pitch → axis: Y
  - thumb_dip → axis: Y

Index Finger (2 DOF):
  - index_mcp → axis: Y
  - index_dip → axis: Y

Middle Finger (2 DOF):
  - middle_mcp → axis: Y
  - middle_dip → axis: Y

Ring Finger (2 DOF):
  - ring_mcp → axis: Y
  - ring_dip → axis: Y

Pinky Finger (2 DOF):
  - pinky_mcp → axis: Y
  - pinky_dip → axis: Y
```

**Deliverable:** `Todolist/Linker-L6-Joint-Mapping.md` with complete axis documentation

---

### Phase 3: Build Quaternion Conversion Logic
**Status:** Pending
**Goal:** Implement and validate quaternion math

**Key Challenges:**
1. **Coordinate System Alignment**
   - MediaPipe: X (left-right), Y (top-bottom), Z (depth)
   - Three.js: X (right), Y (up), Z (toward camera)
   - URDF: Model-specific joint axes

2. **Quaternion Construction from Landmarks**
   ```javascript
   // For each joint (e.g., index MCP):
   // Use landmarks: base (5), middle (6), tip (7)

   const forward = normalize(landmark[6] - landmark[5])  // proximal → middle
   const alongFinger = normalize(landmark[7] - landmark[6])  // middle → distal
   const right = cross(forward, alongFinger)
   const up = cross(right, forward)

   // Build rotation matrix from [right, up, forward]
   const quaternion = matrixToQuaternion(rotationMatrix)
   ```

3. **Handedness Handling**
   - Left hand: Mirror Z-axis (negate quaternion.y and quaternion.w)
   - Right hand: Use as-is

**Testing Strategy:**
- Console log quaternions before connecting to 3D model
- Verify quaternion normalization (magnitude = 1)
- Test with known hand poses (flat, fist, pointing)

---

### Phase 4: Create Test Integration Point
**Status:** Pending
**Goal:** Allow live switching between old and new systems

**UI Changes:**
- Add toggle in `InspectorPanel.js`: "Use Quaternion Tracking"
- Add state in `App.js`: `const [useQuaternionSystem, setUseQuaternionSystem] = useState(false)`
- Route camera data through appropriate pipeline based on toggle

**Logic Flow:**
```javascript
// In HandTrackingCamera.js callback
if (useQuaternionSystem) {
  const quaternions = landmarksToQuaternions(landmarks, handedness)
  const filteredQuats = applyQuaternionFilter(quaternions)
  const axisAngles = quaternionsToAxisAngles(filteredQuats, urdfJointConfig)
  onQuaternionJointRotations(axisAngles)
} else {
  // Existing system (unchanged)
  const rotations = landmarksToJointRotations(landmarks, handedness)
  const filtered = applyMotionFilter(rotations)
  onJointRotations(filtered)
}
```

**Benefits:**
- Side-by-side comparison
- Easy rollback if issues arise
- Gradual migration path

---

### Phase 5: Connect & Validate
**Status:** Pending
**Goal:** Full integration and testing

**Steps:**
1. Connect quaternion pipeline to `URDFHandModel.js`
2. Verify joint rotations match URDF axis definitions
3. Test with live camera tracking
4. Compare visual results: old vs new system
5. Tune SLERP alpha parameter for smoothness
6. Performance profiling (target: 30 FPS)

**Validation Checklist:**
- [ ] Wrist tracks full 3D orientation (pitch/yaw/roll)
- [ ] All 11 Linker L6 joints respond correctly
- [ ] No gimbal lock artifacts
- [ ] Smooth motion (no jitter)
- [ ] Left/right hand tracking symmetrical
- [ ] Performance meets 30 FPS target

---

## Technical Requirements

### Dependencies
- **Three.js** - Already integrated (rotation matrix operations)
- **MediaPipe Hands** - Already integrated (landmark detection)

### Math Utilities Needed
```javascript
// Quaternion operations
- quaternionFromMatrix(matrix) → quaternion
- quaternionToMatrix(quaternion) → matrix
- quaternionSlerp(q1, q2, t) → quaternion
- quaternionNormalize(quaternion) → quaternion

// Vector operations (already available in Three.js)
- cross(v1, v2) → v3
- normalize(v) → v
- dot(v1, v2) → scalar
```

---

## File Structure

### New Files
```
src/utils/
├── handKinematicsQuaternion.js    # MediaPipe → Quaternions
├── quaternionToAxisAngles.js       # Quaternion → Per-axis angles
├── quaternionMotionFilter.js       # SLERP smoothing
└── (existing files unchanged)

Todolist/
├── Quaternion-Hand-Tracking-Plan.md        # This file
└── Linker-L6-Joint-Mapping.md              # URDF documentation
```

### Modified Files (Minimal Changes)
```
src/App.js                          # Add useQuaternionSystem state
src/components/InspectorPanel.js    # Add toggle UI
src/components/HandTrackingCamera.js # Route to new/old pipeline
```

---

## Success Criteria

### Functional Requirements
✅ **Quaternion generation** from all 21 MediaPipe landmarks
✅ **Axis-specific decomposition** for each URDF joint
✅ **SLERP smoothing** without jitter
✅ **UI toggle** switches between systems seamlessly
✅ **Full 3-DOF wrist** orientation tracking
✅ **11 DOF Linker L6** accurate control

### Performance Requirements
✅ **30 FPS** camera tracking
✅ **< 16ms** processing latency per frame
✅ **No dropped frames** during hand motion

### Quality Requirements
✅ **No gimbal lock** in any pose
✅ **Natural hand motion** matching camera input
✅ **Stable tracking** (no oscillation)
✅ **Symmetric left/right** hand behavior

---

## Risk Mitigation

### Risk 1: Quaternion Instability
**Mitigation:** Always normalize quaternions after operations, use stable SLERP implementation

### Risk 2: Axis Mapping Errors
**Mitigation:** Comprehensive URDF parsing and validation, unit tests for axis projection

### Risk 3: Performance Degradation
**Mitigation:** Profile early, optimize quaternion operations, consider Web Workers for processing

### Risk 4: Breaking Existing System
**Mitigation:** Zero changes to existing files until Phase 4, parallel implementation

---

## Timeline Estimates

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| Phase 1 | 4-6 hours | None |
| Phase 2 | 1-2 hours | URDF file access |
| Phase 3 | 6-8 hours | Phase 1 complete |
| Phase 4 | 2-3 hours | Phase 3 complete |
| Phase 5 | 3-4 hours | All phases complete |
| **Total** | **16-23 hours** | - |

---

## Next Steps

1. ✅ Create this plan document
2. ⏳ Parse Linker L6 URDF and document joint axes
3. ⏳ Implement `handKinematicsQuaternion.js`
4. ⏳ Implement `quaternionToAxisAngles.js`
5. ⏳ Implement `quaternionMotionFilter.js`
6. ⏳ Add UI toggle
7. ⏳ Test and validate

---

## References

- **MediaPipe Hands:** https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
- **URDF Specification:** http://wiki.ros.org/urdf/XML/joint
- **Quaternion Math:** Three.js Quaternion documentation
- **SLERP Algorithm:** Spherical Linear Interpolation for smooth rotation

---

**Document Version:** 1.0
**Last Updated:** October 21, 2025
**Author:** Claude Code
**Status:** Planning Complete - Ready for Implementation
