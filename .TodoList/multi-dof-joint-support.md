# Multi-DoF Joint Support Plan

**Status**: Planning
**Created**: 2025-10-20
**Priority**: High

## Problem Statement

Currently, the hand tracking and simulation system has two critical limitations:

1. **Camera tracking** (`handKinematics.js`) only calculates a single angle per joint (1-DoF flexion/extension)
2. **Joint mapping** doesn't account for models with 2-3 DoF joints (e.g., MCP joints with both flexion AND abduction)

### Current Behavior
- Camera tracking outputs: `joints.index_mcp = 0.5` (single scalar value)
- Only flexion/extension is captured
- Abduction/adduction and rotation axes are ignored

### Required Behavior
Different hand models have varying degrees of freedom:
- **Ability Hand**: 2 DoF per finger (mcp, pip) - flexion only (currently works)
- **Shadow Hand**: Up to 3 DoF at some joints (e.g., thumb has THJ1-5, wrist has WRJ1-2)
- **Linker L20/L25/L30/O6/O7**: 4 DoF per finger (mcp_roll, mcp_pitch, pip, dip) - 2 DoF at MCP
- **Linker L10**: 3-5 DoF per finger
- **Linker L6**: 2-3 DoF per finger

## Solution Architecture

### Phase 1: Enhance Camera Tracking to Calculate Multi-Axis Angles
**File**: `src/utils/handKinematics.js`

**Goal**: Calculate 3D rotation data for each joint instead of just flexion angle.

**Changes**:
1. Modify `landmarksToJointRotations()` to return 3-axis data per joint:
   ```js
   // OLD FORMAT (current):
   joints.index_mcp = 0.5  // single flexion angle

   // NEW FORMAT:
   joints.index_mcp = {
     pitch: 0.5,  // flexion/extension (bending finger)
     yaw: 0.2,    // abduction/adduction (spreading fingers)
     roll: 0.0    // rotation/twist (rare, mostly for thumb)
   }
   ```

2. Add new helper functions:
   - `calculateJointAbduction()` - measure finger spreading
   - `calculateJointRotation()` - measure twist (primarily for thumb)
   - `calculateMultiAxisJointRotation()` - combine all three axes

3. For each finger joint, calculate:
   - **Pitch (flexion/extension)**: Already calculated via `calculateFingerCurl()`
   - **Yaw (abduction/adduction)**: Angle between finger and reference plane
   - **Roll (rotation)**: Twist around finger axis (mainly for thumb opposition)

**Technical Details**:
- Use MediaPipe 3D landmark positions
- Calculate vectors between landmarks
- Use vector math (cross products, dot products) for multi-axis angles
- Maintain backward compatibility with single-value format

---

### Phase 2: Create DoF Configuration System
**New File**: `src/utils/jointDofConfig.js`

**Goal**: Define which axes each model actually supports and uses.

**Structure**:
```js
// Define DoF for each model
export const MODEL_DOF_CONFIG = {
  ability_hand: {
    thumb_mcp: ['pitch'],              // 1-DoF: flexion only
    thumb_pip: ['pitch'],
    index_mcp: ['pitch'],              // 1-DoF: flexion only
    index_pip: ['pitch'],
    // ... all joints
  },

  shadow_hand: {
    wrist: ['pitch', 'yaw'],           // 2-DoF: WRJ1 and WRJ2
    thumb_mcp: ['pitch', 'yaw'],       // 2-DoF: THJ4 (abduction) + THJ3 (flexion)
    thumb_pip: ['pitch'],              // 1-DoF: THJ2
    index_mcp: ['pitch', 'yaw'],       // 2-DoF: FFJ4 (abduction) + FFJ3 (flexion)
    // ... all joints
  },

  linker_l20: {
    thumb_mcp: ['pitch', 'yaw', 'roll'], // 3-DoF: cmc_yaw, cmc_roll, cmc_pitch
    index_mcp: ['pitch', 'roll'],        // 2-DoF: mcp_roll, mcp_pitch
    index_pip: ['pitch'],                // 1-DoF: pip
    // ... all joints
  },

  // ... other models
}

// Helper function to get DoF for a specific joint
export function getJointDoF(modelPath, jointName) {
  const modelConfig = MODEL_DOF_CONFIG[modelPath]
  if (!modelConfig) return ['pitch'] // default to 1-DoF
  return modelConfig[jointName] || ['pitch']
}

// Check if a joint supports a specific axis
export function supportsAxis(modelPath, jointName, axis) {
  const dof = getJointDoF(modelPath, jointName)
  return dof.includes(axis)
}
```

---

### Phase 3: Update URDF Joint Mapping
**File**: `src/utils/urdfJointMapping.js`

**Goal**: Map multi-axis UI joint data to multiple URDF joints.

**Changes**:

1. Extend existing mappings to support multi-axis format:
   ```js
   // OLD FORMAT (current):
   const SHADOW_HAND_JOINT_MAP = {
     thumb_mcp: 'THJ4',  // single mapping
   }

   // NEW FORMAT:
   const SHADOW_HAND_JOINT_MAP = {
     thumb_mcp: {
       pitch: 'THJ3',  // flexion/extension
       yaw: 'THJ4',    // abduction/adduction
     },
     // Single-DoF joints can stay simple:
     thumb_pip: 'THJ2',  // or: { pitch: 'THJ2' }
   }

   const LINKER_L20_JOINT_MAP = {
     thumb_mcp: {
       yaw: 'thumb_cmc_yaw',
       roll: 'thumb_cmc_roll',
       pitch: 'thumb_cmc_pitch',
     },
     index_mcp: {
       roll: 'index_mcp_roll',
       pitch: 'index_mcp_pitch',
     },
     index_pip: 'index_pip',  // single-DoF
   }
   ```

2. Update `mapUIJointToURDF()` to handle both formats:
   ```js
   export function mapUIJointToURDF(uiJointName, modelPath, axis = 'pitch') {
     const modelMapping = JOINT_MAPPINGS[modelPath]
     if (!modelMapping) return null

     const mapping = modelMapping[uiJointName]
     if (!mapping) return null

     // Handle multi-axis mapping (object)
     if (typeof mapping === 'object') {
       return mapping[axis] || null
     }

     // Handle single-axis mapping (string)
     return mapping
   }
   ```

3. Add new helper function:
   ```js
   export function getAllURDFJointsForUI(uiJointName, modelPath) {
     // Returns all URDF joints for a UI joint across all axes
     const mapping = JOINT_MAPPINGS[modelPath]?.[uiJointName]
     if (!mapping) return []

     if (typeof mapping === 'object') {
       return Object.values(mapping)
     }
     return [mapping]
   }
   ```

---

### Phase 4: Update URDFHandModel Component
**File**: `src/components/URDFHandModel.js`

**Goal**: Apply multi-axis rotations to URDF joints based on model DoF configuration.

**Changes** (around lines 179-204):

```js
import { getJointDoF } from '../utils/jointDofConfig'
import { mapUIJointToURDF } from '../utils/urdfJointMapping'

// In the joint rotation application loop:
Object.entries(joints).forEach(([uiJointName, angleData]) => {
  // Determine if angleData is old format (number) or new format (object)
  const isMultiAxis = typeof angleData === 'object' && angleData !== null

  // Get which axes this model supports for this joint
  const supportedAxes = getJointDoF(modelPath, uiJointName)

  // Apply rotations for each supported axis
  supportedAxes.forEach(axis => {
    // Get the URDF joint name for this axis
    const urdfJointName = mapUIJointToURDF(uiJointName, modelPath, axis)
    if (!urdfJointName) return

    // Get the joint from the robot
    const joint = robot.joints[urdfJointName]
    if (!joint) return

    // Get the angle value for this axis
    let angle
    if (isMultiAxis) {
      angle = angleData[axis] || 0
    } else {
      // Old format: single number, use for pitch axis only
      angle = (axis === 'pitch') ? angleData : 0
    }

    // Clamp and apply
    const clampedAngle = clampJointValue(angle, urdfJointName, modelPath)
    try {
      joint.setJointValue(clampedAngle)
    } catch (error) {
      console.error(`Error setting ${urdfJointName}:`, error)
    }
  })
})
```

---

### Phase 5: Backward Compatibility
**Across all files**

**Guarantees**:
1. **Old format support**: Single number values (e.g., `0.5`) still work
2. **Graceful degradation**: Missing DoF config defaults to pitch-only
3. **Partial data handling**: Missing axes default to 0
4. **Existing models**: Ability Hand continues working without changes

**Helper functions** (add to `src/utils/jointDofConfig.js`):
```js
export function normalizeJointData(angleData, modelPath, jointName) {
  // Converts any format to multi-axis object
  const supportedAxes = getJointDoF(modelPath, jointName)

  if (typeof angleData === 'number') {
    // Old format: single number
    return {
      pitch: angleData,
      yaw: 0,
      roll: 0
    }
  }

  // New format: ensure all axes present
  return {
    pitch: angleData.pitch || 0,
    yaw: angleData.yaw || 0,
    roll: angleData.roll || 0
  }
}
```

---

## Implementation Order

### Step 1: Create DoF Configuration System ✓
- Create `src/utils/jointDofConfig.js`
- Define DoF for all existing models
- Add helper functions
- Write tests/validation

### Step 2: Update URDF Joint Mappings ✓
- Modify `src/utils/urdfJointMapping.js`
- Convert single mappings to multi-axis where needed
- Update `mapUIJointToURDF()` to handle both formats
- Maintain backward compatibility

### Step 3: Enhance Camera Tracking ✓
- Modify `src/utils/handKinematics.js`
- Implement multi-axis calculation functions
- Update `landmarksToJointRotations()` to return 3D data
- Test with real camera data

### Step 4: Update URDFHandModel Component ✓
- Modify `src/components/URDFHandModel.js`
- Implement multi-axis joint application
- Test with Ability Hand (1-DoF)
- Test with Shadow/Linker hands (2-3 DoF)

### Step 5: Testing & Validation ✓
- Test backward compatibility with Ability Hand
- Test multi-DoF with Shadow Hand
- Test multi-DoF with Linker L20
- Verify camera tracking provides all axes
- Performance testing

---

## Technical Challenges & Solutions

### Challenge 1: Calculating Abduction/Adduction from MediaPipe
**Problem**: MediaPipe gives 3D positions, need to extract spreading angles

**Solution**:
- Define a reference plane (e.g., palm plane or adjacent finger)
- Project finger direction onto that plane
- Calculate angle between projection and reference direction
- Use cross product to determine sign (left vs right spread)

### Challenge 2: Thumb Opposition
**Problem**: Thumb has unique kinematics (rotation + flexion + abduction)

**Solution**:
- Special handling for thumb CMC joint
- Calculate opposition angle relative to palm plane
- Use all three axes (pitch, yaw, roll) for thumb base

### Challenge 3: Performance
**Problem**: More calculations per frame

**Solution**:
- Only calculate axes that the current model needs
- Cache DoF configurations
- Use efficient vector math (Three.js Vector3)
- Consider web workers for heavy computation

---

## Benefits

1. **Full DoF Support**: Shadow Hand, Linker hands, and future models work correctly
2. **Better Tracking**: Camera captures finger spreading and rotation
3. **Model Flexibility**: Easy to add new models with different DoF
4. **Backward Compatible**: Existing Ability Hand code continues working
5. **Scalable**: Framework supports any combination of DoF

---

## Future Enhancements

- Add UI controls for individual axes in manual mode
- Visualize which axes are active for current model
- Add per-axis calibration
- Support coupling between joints (e.g., DIP follows PIP)
- Add constraints between axes (e.g., can't abduct while fully flexed)

---

## Files to Modify

1. ✅ `src/utils/jointDofConfig.js` - **NEW FILE**
2. ✅ `src/utils/urdfJointMapping.js` - Update mappings
3. ✅ `src/utils/handKinematics.js` - Add multi-axis calculations
4. ✅ `src/components/URDFHandModel.js` - Apply multi-axis rotations
5. ⚠️ `src/components/ControlPanel.js` - Optional: Show DoF per model
6. ⚠️ `src/utils/motionFilter.js` - Optional: Filter per axis

---

## Notes

- Start with Shadow Hand as test case (well-documented DoF)
- Reference URDF files for exact joint names and limits
- Consider adding debug visualization for active DoF
- May need to adjust motion filtering for multi-axis data
