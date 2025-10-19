# Phase 1: URDF Loader Implementation - Complete

## Overview
Phase 1 has been successfully implemented, adding URDF-based hand model loading and joint control to the Hand Visualization Simulation project.

## What Was Implemented

### Part A: Display-Only URDF Models ✅

1. **Created `src/utils/urdfConfig.js`**
   - Maps model paths to URDF file locations
   - Uses GLB versions for optimal web performance
   - Supports all available hand models:
     - Shadow Hand (left/right)
     - Allegro Hand (left/right)
     - Leap Hand (left/right)
     - Schunk SVH Hand (left/right)
     - DClaw Gripper
     - Barrett Hand
     - Panda Gripper

2. **Created `src/components/URDFHandModel.js`**
   - Loads URDF files using the `urdf-loader` library
   - Handles loading states and errors gracefully
   - Displays 3D hand models in the scene
   - Supports both display-only and joint-controlled modes

3. **Updated `src/components/HandModel.js`**
   - Added intelligent routing between URDF and manual implementations
   - Keeps AbilityHand manual implementation as fallback
   - Automatically uses URDF loader for supported models

### Part B: Joint Control for URDF Models ✅

4. **Created `src/utils/urdfJointMapping.js`**
   - Maps UI joint names to URDF-specific joint names
   - Comprehensive mappings for:
     - **Shadow Hand**: Uses semantic names (WRJ1, THJ1-5, FFJ1-4, etc.)
     - **Allegro Hand**: Uses numerical names (joint_0.0 to joint_15.0)
     - **Leap Hand**: Uses simple numbers (0 to 15)
   - Helper functions for bidirectional mapping
   - Easy to extend for additional models

5. **Updated `src/components/URDFHandModel.js`**
   - Integrated joint control system
   - Applies rotations from ControlPanel to URDF joints
   - Uses `robot.joints[name].setJointValue(angle)` API
   - Handles missing joints gracefully with warnings

## File Structure

```
src/
├── components/
│   ├── URDFHandModel.js       (NEW - URDF model loader with joint control)
│   └── HandModel.js            (MODIFIED - routing logic)
├── utils/
│   ├── urdfConfig.js           (NEW - URDF file path mappings)
│   └── urdfJointMapping.js     (NEW - UI to URDF joint name mappings)
└── ...

public/
└── assets/
    └── robots/
        └── hands/
            ├── shadow_hand/
            ├── allegro_hand/
            ├── leap_hand/
            ├── schunk_hand/
            ├── dclaw_gripper/
            ├── barrett_hand/
            └── panda_gripper/
```

## How to Test

### Testing Display-Only Mode

1. Start the development server (already running on port 3000)
2. Open the application in your browser
3. Use the model selector in the ControlPanel to switch between:
   - Shadow Hand (Left/Right)
   - Allegro Hand (Left/Right)
   - Leap Hand (Left/Right)
4. Verify that the 3D models load and display correctly

### Testing Joint Control

1. Select a URDF-based hand model (e.g., Shadow Hand Left)
2. Open the ControlPanel
3. Select a joint from the dropdown (e.g., `thumb_mcp`)
4. Move the rotation slider
5. Observe the corresponding joint moving in real-time in the 3D view

### Browser Console Verification

Open the browser console to see:
- URDF loading confirmation: `"URDF loaded successfully: ..."`
- Available joints: `"Robot joints: [...]"`
- Joint rotation applications (debug info)

## Joint Mappings Reference

### Shadow Hand Joint Names

| UI Name | URDF Joint | Description |
|---------|------------|-------------|
| `wrist` | `WRJ1` | Wrist rotation |
| `thumb_mcp` | `THJ4` | Thumb MCP abduction |
| `thumb_pip` | `THJ3` | Thumb MCP flexion |
| `thumb_dip` | `THJ2` | Thumb IP flexion |
| `index_mcp` | `FFJ3` | Index MCP flexion |
| `index_pip` | `FFJ2` | Index PIP joint |
| `middle_mcp` | `MFJ3` | Middle MCP flexion |
| `ring_mcp` | `RFJ3` | Ring MCP flexion |
| `pinky_mcp` | `LFJ3` | Pinky MCP flexion |

### Allegro Hand Joint Names

| UI Name | URDF Joint | Finger |
|---------|------------|--------|
| `index_mcp` to `index_tip` | `joint_0.0` to `joint_3.0` | Index |
| `middle_mcp` to `middle_tip` | `joint_4.0` to `joint_7.0` | Middle |
| `pinky_mcp` to `pinky_tip` | `joint_8.0` to `joint_11.0` | Ring/Pinky |
| `thumb_mcp` to `thumb_tip` | `joint_12.0` to `joint_15.0` | Thumb |

### Leap Hand Joint Names

| UI Name | URDF Joint | Finger |
|---------|------------|--------|
| `thumb_mcp` to `thumb_tip` | `0` to `3` | Thumb |
| `index_mcp` to `index_tip` | `4` to `7` | Index |
| `middle_mcp` to `middle_tip` | `8` to `11` | Middle |
| `ring_mcp` to `ring_tip` | `12` to `15` | Ring |

## Known Limitations

1. **Schunk, Barrett, DClaw, and Panda models**: Joint mappings are placeholders (empty objects). These need to be added when joint control is required for these models.

2. **AbilityHand**: Still uses the manual implementation from `src/models/AbilityHand.js`. Can be migrated to URDF in the future if needed.

3. **InspireHand**: Still uses manual implementation. URDF files exist in the assembly folders but not in the hands folder.

4. **Partial Joint Coverage**: Not all joints from the URDF files are mapped to the UI. Additional mappings can be added as needed.

## Next Steps (Phase 2)

Now that Phase 1 is complete, you can proceed to Phase 2:

### Phase 2: Position → Rotation Conversion

**Part C: Build Kinematics Pipeline**
- Create `src/utils/handKinematics.js` - Convert MediaPipe landmarks to joint rotations
- Create `src/utils/motionFilter.js` - Smoothing and constraints
- Create `src/utils/coordinateMapping.js` - Calibration system

**Part D: Integrate Camera Control**
- Update `HandTrackingCamera.js` to process landmarks → rotations
- Pass computed rotations to App
- Apply rotations to URDF hand models
- Add calibration UI
- Test real-time hand tracking

## Troubleshooting

### Models not loading
- Check browser console for URDF loading errors
- Verify URDF file paths in `public/assets/robots/hands/`
- Ensure GLB mesh files exist alongside URDF files

### Joints not moving
- Check that joint names are correctly mapped in `urdfJointMapping.js`
- Verify joint exists in URDF by checking console logs
- Ensure rotation values are within joint limits

### Performance issues
- GLB format is already optimized for web
- Consider reducing number of active models if needed
- Check for memory leaks in cleanup code

## Technical Details

### URDF Loader Integration
- Uses `urdf-loader` npm package (v0.12.6)
- Supports GLB mesh format for better performance
- Handles Three.js object lifecycle (loading, cleanup)

### Joint Control System
- Real-time joint updates via `setJointValue(angle)`
- Bidirectional mapping (UI ↔ URDF)
- Graceful degradation for missing joints

### Architecture
- Modular design: routing, loading, and control are separated
- Easy to extend with new hand models
- Maintains backward compatibility with manual implementations

---

**Implementation Date**: October 18-19, 2025
**Status**: ✅ Complete and Ready for Phase 2
