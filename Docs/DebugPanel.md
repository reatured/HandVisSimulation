# Debug Panel Documentation

## Overview

The Debug Panel is a real-time visualization tool that displays 3-axis rotation data for hand joints. It converts MediaPipe hand landmark positions into rotation angles (pitch, yaw, roll) for all finger joints and the wrist.

**Component Location**: `src/components/DebugPanel.js`

**Data Source**: `src/utils/positionToRotation.js`

## Features

### 1. Hand Selection
- Toggle between **LEFT** and **RIGHT** hand data
- Active hand highlighted with colored border:
  - Left hand: Amber/yellow (`rgba(251, 191, 36, 0.9)`)
  - Right hand: Cyan/blue (`rgba(96, 213, 244, 0.9)`)

### 2. 3-Axis Rotation Display
Each joint displays three rotation components:
- **P (Pitch)**: Flexion/Extension (bending up/down) - Red color (`#ff6b6b`)
- **Y (Yaw)**: Lateral deviation (side-to-side) - Cyan color (`#4ecdc4`)
- **R (Roll)**: Axial rotation (twist) - Yellow color (`#ffe66d`)

All angles are displayed in **degrees** (°), converted from radians internally.

### 3. Data Persistence
- When hand is visible: Updates in real-time
- When hand tracking is lost: **Freezes at last valid values** (does not reset to zero)
- Only resets to zero on page refresh or first load

### 4. Panel Controls
- **Close button (✕)**: Hides the debug panel
- **Reset Rotation button**: Resets gimbal and wrist orientation (calls `onReset` handler)
- **Show Debug button**: Appears when panel is closed, click to reopen

## Joint Structure

### Finger Joints (Index, Middle, Ring, Pinky)
Display order from **top to bottom** (fingertip to base):
1. **TIP** - Fingertip segment
2. **DIP** - Distal Interphalangeal (joint nearest fingertip)
3. **PIP** - Proximal Interphalangeal (middle knuckle)
4. **MCP** - Metacarpophalangeal (base knuckle at palm)

### Thumb Joints
The thumb has a different structure:
1. **TIP** - Thumb tip segment
2. **DIP** - (Follows IP joint, simplified)
3. **PIP** - (Labeled as such but actually represents IP joint)
4. **MCP** - Metacarpophalangeal (middle knuckle)

**Note**: Anatomically, the thumb has:
- **CMC** (Carpometacarpal) - base joint at wrist (landmark 1)
- **MCP** (Metacarpophalangeal) - middle knuckle (landmark 2)
- **IP** (Interphalangeal) - tip knuckle (landmark 3)
- **TIP** - fingertip (landmark 4)

### Wrist
Displays separate wrist orientation (Pitch, Yaw, Roll) calculated from palm plane.

## Technical Details

### Input Data
- **Source**: MediaPipe Hands API
- **Format**: 21 3D landmarks per hand, each with `{x, y, z}` coordinates
- **Coordinate System**:
  - MediaPipe: x (right), y (down), z (toward camera, negative = away)
  - Normalized to [0, 1] range

### Landmark Indices (MediaPipe)
```
WRIST: 0

THUMB:
  THUMB_CMC: 1
  THUMB_MCP: 2
  THUMB_IP: 3
  THUMB_TIP: 4

INDEX:
  INDEX_MCP: 5
  INDEX_PIP: 6
  INDEX_DIP: 7
  INDEX_TIP: 8

MIDDLE:
  MIDDLE_MCP: 9
  MIDDLE_PIP: 10
  MIDDLE_DIP: 11
  MIDDLE_TIP: 12

RING:
  RING_MCP: 13
  RING_PIP: 14
  RING_DIP: 15
  RING_TIP: 16

PINKY:
  PINKY_MCP: 17
  PINKY_PIP: 18
  PINKY_DIP: 19
  PINKY_TIP: 20
```

### Angle Calculation Method

#### Vector-Based Approach
For each joint, we use three consecutive landmarks:
1. **Proximal landmark** - Base point
2. **Middle landmark** - The joint itself
3. **Distal landmark** - End point

#### Two Key Vectors
1. **boneIn**: Vector FROM proximal TO middle
   - Formula: `middleVec - proximalVec`
   - Represents the bone segment entering the joint

2. **boneOut**: Vector FROM middle TO distal
   - Formula: `distalVec - middleVec`
   - Represents the bone segment leaving the joint

#### Rotation Calculations

**Pitch (Flexion/Extension)**:
```javascript
pitch = π - boneIn.angleTo(boneOut)
```
- When finger is straight: vectors aligned (angle ≈ π), pitch ≈ 0
- When bent: angle decreases, pitch becomes positive
- Measures bending up/down

**Yaw (Lateral Deviation)**:
```javascript
lateralAxis = boneIn × referenceUp (cross product)
yawComponent = boneOut · lateralAxis (dot product)
yaw = arcsin(yawComponent)
```
- Measures side-to-side deviation
- Uses hand's "up" direction as reference

**Roll (Axial Rotation)**:
```javascript
rollAxis = boneOut
perpendicularToBone = boneOut × referenceUp
rollReference = rollAxis × perpendicularToBone
rollComponent = referenceUp · rollReference
roll = arcsin(rollComponent)
```
- Measures twist around the bone axis
- Rotation perpendicular to bend direction

### Example: Thumb MCP Calculation

**Current Implementation**:
```javascript
rotations.thumb_mcp = calculateJointRotation3D(
  landmarks[THUMB_CMC],  // Landmark 1 (proximal)
  landmarks[THUMB_MCP],  // Landmark 2 (middle/joint)
  landmarks[THUMB_IP],   // Landmark 3 (distal)
  referenceUp
)
```

**Vectors Used**:
- boneIn: CMC (landmark 1) → MCP (landmark 2)
- boneOut: MCP (landmark 2) → IP (landmark 3)

**Note**: Anatomically, thumb MCP should use WRIST(0)→CMC(1) and CMC(1)→MCP(2) to properly measure the MCP joint angle. Current implementation may be offset by one segment.

### Reference "Up" Direction
```javascript
referenceUp = normalize(MIDDLE_MCP - WRIST)
```
- Vector pointing from wrist to middle finger base
- Used as the hand's primary orientation axis
- Helps calculate yaw and roll consistently

## Data Flow

1. **HandTrackingCamera.js** captures video and detects hand landmarks via MediaPipe
2. **positionToRotation.js** converts landmarks to 3-axis rotations
3. **DebugPanel.js** receives `handTrackingData` prop
4. Component filters for selected hand (left/right)
5. Calls `landmarksToRotations3D()` to calculate angles
6. Stores valid rotations in state (`lastValidRotations`)
7. Displays angles in degrees (converted from radians)

## State Management

### Component State
```javascript
const [selectedHand, setSelectedHand] = useState('left')
const [lastValidRotations, setLastValidRotations] = useState(null)
```

### Data Persistence Logic
```javascript
useEffect(() => {
  if (convertedRotations3D) {
    setLastValidRotations(convertedRotations3D)
  }
}, [convertedRotations3D])
```
- When valid data available: Update stored rotations
- When tracking lost: Keep last stored values
- Display always uses `lastValidRotations`

## Display Format

### Grid Layout
```
           THUMB  INDEX  MIDDLE  RING  PINKY
TIP        P:X.X  P:X.X  P:X.X   P:X.X P:X.X
           Y:X.X  Y:X.X  Y:X.X   Y:X.X Y:X.X
           R:X.X  R:X.X  R:X.X   R:X.X R:X.X

DIP        P:X.X  P:X.X  P:X.X   P:X.X P:X.X
           Y:X.X  Y:X.X  Y:X.X   Y:X.X Y:X.X
           R:X.X  R:X.X  R:X.X   R:X.X R:X.X

PIP        P:X.X  P:X.X  P:X.X   P:X.X P:X.X
           Y:X.X  Y:X.X  Y:X.X   Y:X.X Y:X.X
           R:X.X  R:X.X  R:X.X   R:X.X R:X.X

MCP        P:X.X  P:X.X  P:X.X   P:X.X P:X.X
           Y:X.X  Y:X.X  Y:X.X   Y:X.X Y:X.X
           R:X.X  R:X.X  R:X.X   R:X.X R:X.X

WRIST      P:X.X  Y:X.X  R:X.X
```

### Formatting
- Angles displayed with 1 decimal place
- Format function: `formatDeg(radians) = (radians × 180 / π).toFixed(1)`
- Fallback for missing data: `{ pitch: 0, yaw: 0, roll: 0 }`

## Styling

### Panel Container
- Position: Absolute, bottom-left corner (10px from bottom/left)
- Background: Semi-transparent black (`rgba(0, 0, 0, 0.6)`)
- Border: White border with 30% opacity
- Min width: 600px
- Max height: 90vh with scrolling
- Z-index: 20

### Color Scheme
- Text: White/monospace font
- Pitch values: Red (`#ff6b6b`)
- Yaw values: Cyan (`#4ecdc4`)
- Roll values: Yellow (`#ffe66d`)
- Headers: White with reduced opacity

## Usage

### Opening the Panel
1. Click **"Show Debug"** button at bottom-left when panel is closed
2. Button has blue background (`rgba(100, 150, 255, 0.9)`)

### Switching Hands
1. Click **LEFT** or **RIGHT** button at top of panel
2. Active button has colored border and background
3. Data updates immediately for selected hand

### Reading the Data
- Each cell shows 3 values stacked vertically
- P = Pitch (positive = bent/flexed)
- Y = Yaw (lateral deviation)
- R = Roll (twist/rotation)
- All values in degrees

### Closing the Panel
1. Click **✕** button at top-right
2. Panel hides but continues processing in background
3. Data preserved when reopened

## Integration with App

### Props
```javascript
<DebugPanel
  handTrackingData={handTrackingData}  // Raw MediaPipe results
  onReset={handleResetGimbals}         // Reset handler
  onClose={() => setShowDebugPanel(false)}  // Close handler
/>
```

### App State
```javascript
const [handTrackingData, setHandTrackingData] = useState(null)
const [showDebugPanel, setShowDebugPanel] = useState(false)
```

## Troubleshooting

### No data showing
- Verify hand is visible to camera
- Check MediaPipe is detecting landmarks
- Ensure `handTrackingData` prop is being passed
- Check browser console for errors

### Data shows zeros
- Normal on first load before hand detection
- Should populate once hand is detected
- If persisting, check landmark conversion function

### Data not updating
- Check if hand tracking is active
- Verify `convertedRotations3D` is being calculated
- Check `useEffect` dependency array

### Wrong hand data
- Verify hand selection toggle (LEFT/RIGHT)
- Check MediaPipe handedness detection
- Ensure landmark filtering logic is correct

## Future Improvements

### Potential Enhancements
1. Fix thumb joint calculation to use anatomically correct landmarks
2. Add degree/radian toggle for advanced users
3. Display velocity/acceleration of joint angles
4. Add graph/timeline view of angle changes
5. Export rotation data to CSV/JSON
6. Add visual hand skeleton overlay
7. Highlight active/moving joints
8. Add calibration/offset controls per joint
9. Show confidence scores from MediaPipe
10. Add comparison mode (left vs right side-by-side)

## Related Files

- **Component**: `src/components/DebugPanel.js`
- **Conversion Logic**: `src/utils/positionToRotation.js`
- **Hand Tracking**: `src/components/HandTrackingCamera.js`
- **Main App**: `src/App.js`
- **Old Conversion** (not used by debug panel): `src/utils/handKinematics.js`

## Version History

### Latest Changes
- Display angles in degrees instead of radians
- Reverse segment order (TIP → MCP instead of MCP → TIP)
- Data persistence when hand tracking is lost
- Removed conditional "No hand detected" message
- Added state-based last valid rotation storage
- Disconnected from old handKinematics.js conversion

### Original Implementation
- Used old conversion script with single-axis curl angles
- Displayed radians
- Showed "No hand detected" when tracking lost
- Order was MCP → TIP
