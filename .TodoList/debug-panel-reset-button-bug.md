# Debug Panel Reset Button Bug

## Issue
The "Reset Rotation" button in the debug panel is making all hand models disappear when clicked.

## Root Cause
The `handleResetGimbals` function in `src/App.js` (lines 231-246) has a bug on lines 232-233:

```javascript
setLeftHandGimbal(leftHandZRotation)   // BUG: Sets gimbal to a number (e.g., π/2)
setRightHandGimbal(rightHandZRotation) // BUG: Sets gimbal to a number (e.g., -π/2)
```

**Problem**: The function sets the gimbal rotations to scalar number values (`leftHandZRotation` and `rightHandZRotation` are numbers, not objects) instead of rotation objects with `{x, y, z}` properties.

**Effect**: The Scene3D component expects gimbal rotations to be objects with x, y, z properties. When it receives numbers instead, the models fail to render correctly and disappear.

## Solution
Change lines 232-233 in `src/App.js` from:
```javascript
setLeftHandGimbal(leftHandZRotation)
setRightHandGimbal(rightHandZRotation)
```

To:
```javascript
setLeftHandGimbal({ x: -Math.PI / 2, y: 0, z: 0 })
setRightHandGimbal({ x: -Math.PI / 2, y: 0, z: 0 })
```

This resets the gimbals to their initial default rotation (matching the defaults defined on lines 93-94) while preserving the wrist orientation reset functionality.

## File Location
- **File**: `src/App.js`
- **Function**: `handleResetGimbals`
- **Lines to change**: 232-233

## Priority
Medium - The feature is broken but there's a workaround (refresh the page)
