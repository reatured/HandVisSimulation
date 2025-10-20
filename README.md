# 🖐️ HandVisSimulation - Real-Time 3D Hand Tracking & Visualization

[![React](https://img.shields.io/badge/React-18+-61dafb?logo=react&logoColor=white)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-00C853?logo=google)](https://mediapipe.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Real-time 3D hand tracking and robotic hand simulation in the browser.** Built with React Three Fiber, Three.js, and MediaPipe Hands for computer vision research, robotics visualization, AR/VR development, and interactive motion capture demos.

[🚀 Live Demo](#) | [📖 Documentation](#setup) | [🤝 Contributing](#)

---

## 🌟 What is HandVisSimulation?

HandVisSimulation is a **browser-based 3D hand tracking and visualization platform** that combines:
- 🎥 **Real-time webcam hand detection** using Google's MediaPipe Hands AI model
- 🤖 **Multiple robotic hand models** (Ability Hand, Shadow Hand, Allegro Hand, etc.)
- 🎨 **Interactive WebGL 3D rendering** with React Three Fiber
- 📊 **Hand landmark visualization** overlayed on live video feed
- 🔧 **Extensible architecture** for custom hand models and sensors

Perfect for:
- 🔬 **Researchers** exploring human-robot interaction and motion capture
- 🤖 **Robotics engineers** visualizing hand kinematics and control systems
- 🎓 **Educators** teaching computer vision, 3D graphics, or biomechanics
- 💻 **Developers** building AR/VR hand tracking applications
- 🎮 **Game developers** prototyping hand gesture controls

---

## ✨ Key Features

### 🤖 Multiple Robotic Hand Models
Support for 9+ professional robotic hand models with accurate URDF kinematics:
- **Ability Hand** - Advanced prosthetic hand
- **Shadow Hand** - Dexterous anthropomorphic hand
- **Allegro Hand** - Research-grade robotic hand
- **Inspire Hand** - Open-source prosthetic design
- **Leap Hand** - High-DOF manipulation
- **Schunk Hand**, **Barrett Hand**, **Panda Gripper**, **DClaw Gripper**

### 📹 Real-Time Hand Tracking
- **MediaPipe Hands** integration for 21-point hand landmark detection
- **60 FPS tracking** with sub-100ms latency
- **Multi-hand support** - track both hands simultaneously
- Works with any standard **webcam** or USB camera

### 🎨 Interactive 3D Visualization
- **WebGL-powered** rendering with Three.js
- **React Three Fiber** declarative 3D components
- **OrbitControls** - rotate, pan, zoom with mouse/touch
- **Real-time lighting** and shadows for realistic rendering
- **Responsive design** - works on desktop, tablet, mobile

### 🔧 Developer-Friendly Architecture
- **Modular component design** - easy to extend with new models
- **Async model loading** with React Suspense
- **URDF + GLB support** for robotic models
- **Clean separation** of tracking, visualization, and UI logic
- **TypeScript-ready** codebase structure

## Project Structure

```
HandVisSimulation/
├── src/
│   ├── App.js                    # Main application orchestrator
│   ├── index.js                  # Application entry point
│   │
│   ├── components/               # Reusable UI and 3D components
│   │   ├── HandTrackingCamera.js # Camera feed + MediaPipe hand tracking
│   │   ├── Scene3D.js            # Three.js canvas and lighting setup
│   │   ├── HandModel.js          # Router/factory for hand models
│   │   └── ModelSelector.js      # Bottom UI selector for models
│   │
│   └── models/                   # Hand-specific 3D model implementations
│       ├── AbilityHand.js        # Ability Hand model (fully implemented)
│       └── InspireHand.js        # Inspire Hand model (basic implementation)
│
├── public/
│   └── assets/
│       └── robots/
│           └── hands/            # Hand model assets (URDF, GLB meshes)
│               ├── ability_hand/
│               ├── inspire_hand/
│               ├── shadow_hand/
│               ├── allegro_hand/
│               ├── leap_hand/
│               ├── schunk_hand/
│               ├── barrett_hand/
│               ├── dclaw_gripper/
│               └── panda_gripper/
│
└── package.json
```

## Component Overview

### Core Components

**`App.js`**
- Main application state management
- Coordinates data flow between components
- Manages selected model and hand tracking data

**`HandTrackingCamera.js`**
- Initializes and manages webcam access
- Runs MediaPipe Hands model for hand detection
- Draws hand landmarks on canvas overlay
- Provides hand tracking results via callback

**`Scene3D.js`**
- Sets up Three.js Canvas and camera
- Manages scene lighting (ambient, directional, point lights)
- Renders selected hand model
- Provides OrbitControls for camera manipulation

**`HandModel.js`**
- Routes to appropriate hand model based on selection
- Handles model-specific component loading
- Shows placeholders for unimplemented models
- Wraps components in Suspense for async loading

**`ControlPanel.js`**
- Interactive control panel for hand manipulation
- Model selection for left and right hands
- Camera tracking vs manual control modes
- Calibration controls for camera tracking
- Gimbal and axes visibility toggles
- Manual Z-axis rotation controls (±90° buttons)
- Hand control mapping (swap left/right)

**`GimbalControl.js`**
- Interactive 3D gimbal widget using PivotControls
- Allows drag-to-rotate hand orientation
- Provides visual feedback with colored rotation rings
- Disables orbit controls during gimbal interaction

**`URDFHandModel.js`**
- Loads URDF-based robotic hand models
- Parses URDF files and loads associated GLB meshes
- Applies individual joint rotations via setJointValue()
- Handles camera position tracking
- Supports multiple hand models (Ability, Shadow, Allegro, etc.)

### Model Components

**`AbilityHand.js`**
- Loads Ability Hand GLB mesh files
- Assembles complete hand with URDF joint structure
- Supports left/right hand variants
- Scales and positions all finger segments

**`InspireHand.js`**
- Loads Inspire Hand GLB mesh files
- Basic hand structure implementation
- Supports left/right hand variants

## 3D Scene Hierarchy

The application uses a layered rotation system for precise hand control:

```
Scene3D
│   Camera: Dynamic position based on mirror mode
│   - Mirror ON (Front view): [0.5, 0.5, 1] - looking at hands like a mirror
│   - Mirror OFF (Back view): [0.5, 0.5, -1] - looking from behind
│
├── Global Axes Helper (at [0, -0.29, 0])
│   Shows world coordinate system (Red=X, Green=Y, Blue=Z)
│
├── Left Hand Group (positioned at [0.3, 0, 0])
│   │   Rotation Level 1: Wrist rotation from camera tracking (Z-axis only)
│   │   Location: Scene3D.js:168-175
│   │   Controls: rotation={[leftWristRotation.x, leftWristRotation.y, leftWristRotation.z]}
│   │   Note: Currently locked to Z-axis (1 DoF), X and Y are set to 0
│   │
│   ├── Local Axes Helper (args={[0.15]})
│   │   Rotates with wrist rotation from camera
│   │
│   └── GimbalControl (PivotControls widget)
│       │   Rotation Level 2: Gimbal offset rotation
│       │   Location: Scene3D.js:178-184
│       │   Controls: Interactive 3D drag handles (X, Y, Z axes)
│       │
│       └── HandModel wrapper
│           │   Rotation Level 3: Manual Z-axis offset
│           │   Location: HandModel.js (via zRotationOffset prop)
│           │   Controls: ±90° rotation buttons in UI
│           │
│           └── URDFHandModel or AbilityHand
│               │   Position: Camera position tracking (optional)
│               │   Location: URDFHandModel.js:132-142 or AbilityHand.js
│               │
│               └── URDF Robot / Hand Mesh
│                   │   Rotation Level 4: Individual joint rotations
│                   │   Controls: Camera joint tracking or manual sliders
│                   │
│                   ├── robot.joints[...] (Articulated joints for URDF)
│                   └── Finger groups with nested rotations (for AbilityHand)
│
└── Right Hand Group (positioned at [-0.3, 0, 0])
    │   [Same hierarchy as Left Hand]
    │   Location: Scene3D.js:200-230
    └── ...
```

## Data Flow Pipeline: Camera → 3D Model

This section documents the complete data transformation pipeline from webcam video to 3D model rotations.

### Pipeline Overview

```
[Webcam Video]
    ↓
[MediaPipe Hands AI Model]
    ↓
[21 Hand Landmarks (3D positions)]
    ↓
[Kinematics Calculations]
    ↓
[Motion Filtering & Smoothing]
    ↓
[Calibration (Optional)]
    ↓
[Handedness Correction]
    ↓
[Wrist Quaternion + Joint Angles]
    ↓
[React State (App.js)]
    ↓
[3D Scene Rendering (Scene3D.js)]
    ↓
[3D Hand Model Display]
```

### Detailed Processing Chain

#### Stage 1: Camera Capture & MediaPipe Detection
**Location:** `HandTrackingCamera.js:250-275`

1. **Camera initialization** (`startCamera()`)
   - Requests webcam access: `640x480` resolution
   - Connects video stream to `<video>` element
   - Input: Raw webcam video stream
   - Output: Video frames at camera FPS

2. **Hand detection loop** (`detectHands()`)
   - Continuously processes video frames via `requestAnimationFrame`
   - Sends frames to MediaPipe Hands model
   - Input: Video frames
   - Output: `multiHandLandmarks` array (up to 2 hands)

3. **MediaPipe processing** (`hands.onResults()` at line 62)
   - AI model detects hands in frame
   - Extracts 21 3D landmarks per hand (x, y, z coordinates)
   - Input: Video frame image
   - Output: Hand results object with landmarks

#### Stage 2: Landmark Coordinate System
**Location:** `HandTrackingCamera.js:166-184`

**MediaPipe Coordinate System:**
- `x`: 0 (left) to 1 (right) - normalized across frame width
- `y`: 0 (top) to 1 (bottom) - normalized across frame height
- `z`: Depth relative to wrist (negative = away from camera)

**Landmark 0 = Wrist position** (extracted at lines 174-184):
```javascript
// Convert MediaPipe coordinates to Three.js space
const position = {
    x: (wristLandmark.x - 0.5) * 2,   // Center around 0, scale to [-1, 1]
    y: -(wristLandmark.y - 0.5) * 2,  // Invert Y and center
    z: -wristLandmark.z * 2            // Invert Z and scale
}
```

#### Stage 3: Kinematics Conversion
**Location:** `handKinematics.js:206-357`

Called via `landmarksToJointRotations(landmarks, handedness)` at `HandTrackingCamera.js:172`

**Input:** 21 MediaPipe landmarks + handedness ('Left' or 'Right')

**Processing Steps:**

1. **Wrist Orientation Calculation** (`calculateWristOrientation()` at `handKinematics.js:131-203`)
   - Uses landmarks 0 (wrist), 5 (index MCP), 9 (middle MCP), 17 (pinky MCP)
   - Computes palm plane vectors:
     - `palmForward`: Wrist → Middle finger base (points up hand)
     - `palmRight`: Pinky → Index (points across palm)
     - `palmNormal`: Cross product (points out of palm)
   - Builds rotation matrix from these orthogonal vectors
   - Converts matrix to Euler angles: `{x, y, z}` in XYZ order
   - Applies coordinate corrections for left hand: `z = -z`, `x = -x` (line 191-194)
   - **Locks to Z-axis only** (line 196-198): Sets `x = 0` and `y = 0` for 1 DoF wrist rotation
   - Ensures fingertips always point upward regardless of hand tilt

2. **Joint Angle Calculations** (lines 214-345)
   - For each finger (thumb, index, middle, ring, pinky):
     - Computes curl angles at MCP, PIP, DIP joints
     - Uses `calculateFingerCurl()` - measures angle between 3 points
     - Formula: `curl = π - angleBetweenVectors` (0 = straight, positive = bent)
   - Calculates thumb abduction/opposition
   - Stores in `joints` object: `{ thumb_mcp, thumb_pip, index_mcp, ... }`

**Output:**
```javascript
{
    wristOrientation: { x: 0, y: 0, z },  // Euler angles (locked to Z-axis only, 1 DoF)
    joints: {
        wrist: 0,  // Legacy compatibility
        thumb_mcp, thumb_pip, thumb_dip, thumb_tip,
        index_mcp, index_pip, index_dip, index_tip,
        middle_mcp, middle_pip, middle_dip, middle_tip,
        ring_mcp, ring_pip, ring_dip, ring_tip,
        pinky_mcp, pinky_pip, pinky_dip, pinky_tip
    }
}
```

**Note:** The wrist orientation is locked to Z-axis rotation only (see `handKinematics.js:196-198`). The X and Y components are always set to 0, ensuring fingertips always point upward. This provides a 1 degree of freedom (DoF) wrist rotation.

#### Stage 4: Motion Filtering
**Location:** `HandTrackingCamera.js:189-190`

Uses `MotionFilter` class (initialized at lines 17-23):
```javascript
rotations = motionFilterRef.current.filter(rotations, Date.now(), handPrefix)
```

**Purpose:** Smooths jittery tracking data
- **Exponential smoothing** (alpha = 0.3): `filtered = prev + 0.3 * (new - prev)`
- **Velocity limiting**: Caps maximum rotation speed to prevent spikes
- **Constraint enforcement**: Ensures joint angles stay within physical limits

#### Stage 5: Calibration (Optional)
**Location:** `HandTrackingCamera.js:193-195`

```javascript
if (calibrationManager) {
    rotations = calibrationManager.applyCalibration(rotations)
}
```

**Purpose:** User-defined offset correction for tracking accuracy

#### Stage 6: Handedness-Specific Correction
**Location:** `handKinematics.js:190-194`

**Left Hand Correction:**
- Applies coordinate system transformations for left hand
- Negates Z and X angles: `z = -z`, `x = -x`
- Corrects for mirrored orientation from MediaPipe's coordinate system
- Right hand uses angles directly without correction

```javascript
if (handedness === 'Left') {
  z = -z
  x = -x
}
```

**Note:** This correction is applied before the Z-axis lock, ensuring consistent behavior across both hands.

#### Stage 7: React State Update
**Location:** `HandTrackingCamera.js:232-239`

Sends processed data to parent component via callbacks:
```javascript
onJointRotations({
    left: rotationsData,  // or null if hand not detected
    right: rotationsData  // or null if hand not detected
})

onHandPositions({
    left: positionData,   // {x, y, z} or null
    right: positionData   // {x, y, z} or null
})
```

Received in `App.js:189-206` and stored in React state.

#### Stage 8: 3D Scene Rendering
**Location:** `Scene3D.js:84-238`

**Camera Positioning** (lines 108-111):
```javascript
// Mirror mode controls camera position
const cameraPosition = mirrorMode ? [0.5, 0.5, 1] : [0.5, 0.5, -1]
```
- **Mirror ON** (default): Camera at positive Z (front view) - like looking in a mirror
- **Mirror OFF**: Camera at negative Z (back view) - looking from behind
- `CameraController` component updates position when mirror mode changes (lines 65-82)

**Rotation Level 1 - Wrist Orientation** (lines 168-175 for left hand):
```javascript
<group
  position={[0.3, 0, 0]}
  rotation={[
    leftWristRotation.x,  // Currently always 0 (locked)
    leftWristRotation.y,  // Currently always 0 (locked)
    leftWristRotation.z   // Active Z-axis rotation
  ]}
>
```
- Applies Euler angle wrist rotation from camera tracking
- **Z-axis only**: Locked to 1 DoF rotation (lines 122-127)
- Disabled if `disableWristRotation` is true (uses {x:0, y:0, z:0})
- Local axes helper rotates with this group (line 177)

**Rotation Level 2 - Gimbal Control** (lines 178-184):
```javascript
<GimbalControl
    position={[0, 0, 0]}
    rotation={safeLeftGimbal}
    onRotationChange={onLeftGimbalChange}
    visible={showGimbals}
    orbitControlsRef={orbitControlsRef}
>
```
- User-controlled manual offset rotation
- Euler angle-based gimbal with interactive drag handles
- Can be hidden via `showGimbals` toggle

**Rotation Level 3 - Z-Axis Offset** (`HandModel.js` via `zRotationOffset` prop):
- Manual ±90° rotation around blue (Z) axis
- Controlled by UI buttons in control panel
- Applied in HandModel component before passing to URDFHandModel

**Rotation Level 4 - Joint Rotations** (`URDFHandModel.js:120-173` or `AbilityHand.js:4-116`):
```javascript
// URDFHandModel
joint.setJointValue(clampedAngle)

// AbilityHand
<group rotation={[4.450589592585541 + thumbMcp, 0, 0]}>
```
- Applies individual finger joint angles to each joint
- **URDFHandModel**: Maps UI joint names to URDF joint names via `mapUIJointToURDF()`
- **AbilityHand**: Directly applies joint rotations to nested groups
- Clamps values to joint limits for safety

### Key Transformations Summary

| Stage | Input | Processing | Output | File:Line |
|-------|-------|------------|--------|-----------|
| **1. Camera** | Webcam video | MediaPipe AI detection | 21 landmarks × 2 hands | `HandTrackingCamera.js:62` |
| **2. Position** | Landmark 0 (wrist) | Coordinate conversion | `{x, y, z}` position | `HandTrackingCamera.js:174-184` |
| **3. Wrist** | Landmarks 0,5,9,17 | Palm plane calculation | Euler `{x:0, y:0, z}` (Z-only) | `handKinematics.js:131-203` |
| **4. Joints** | All 21 landmarks | Angle measurements | 20 joint angles (radians) | `handKinematics.js:214-345` |
| **5. Filter** | Raw angles | Exponential smoothing | Smoothed angles | `HandTrackingCamera.js:189-190` |
| **6. Calibration** | Smoothed angles | User offset | Calibrated angles | Camera component (if enabled) |
| **7. Correction** | Wrist Euler | Negate z,x (left hand) | Corrected Euler | `handKinematics.js:190-194` |
| **8. State** | All data | React callbacks | Component state | `App.js` state management |
| **9. Render** | State data | Hierarchical transforms | 3D visualization | `Scene3D.js:84-238` |

### Coordinate System Conversions

**MediaPipe → Three.js Conversion:**
```
MediaPipe:          Three.js:
X: right →          X: right →
Y: down ↓           Y: up ↑        (inverted)
Z: toward camera    Z: toward user  (inverted)
```

**Right-Hand Rule Application:**
Both hands use consistent right-hand rule:
- 🔴 **Red (X)**: Thumb direction (palm right vector)
- 🟢 **Green (Y)**: Palm normal (toward user)
- 🔵 **Blue (Z)**: Finger direction (up the hand)

### Coordinate System & Axes

The application uses a **right-hand rule** coordinate system for both left and right hand models. This provides a consistent reference frame for all rotations and transformations.

#### Right-Hand Rule (Three-Finger Rule)


**Axis Directions (source: `handKinematics.js:170-179`):**

- **🔴 Red (X-axis) = Thumb direction**
  - Points laterally from palm toward the thumb side
  - For right hand: points to the right
  - For left hand: still follows right-hand rule (points to the left in world space)

- **🔵 Blue (Z-axis) = Index finger direction**
  - Points from wrist to fingertips (along the hand length)
  - This is the "forward" or "up the hand" direction
  - Used for Z-rotation offset (the 180° left hand offset rotates around this axis)

- **🟢 Green (Y-axis) = Middle finger direction**
  - Points perpendicular to the palm
  - When palm faces down: points toward the user/camera
  - When palm faces up: points away from the user/camera

**Important:** Both left and right hand models use the **same right-hand rule**. This keeps the coordinate system consistent, making rotations easier to understand and debug.

### Rotation Offset Configuration Report

This table documents all rotation offsets at each hierarchy level for both left and right hands:

| Level | Component | Script Location | Left Hand Default | Right Hand Default | Description |
|-------|-----------|----------------|-------------------|-------------------|-------------|
| **Level 1** | Hand mesh group | `Scene3D.js:168-175` (Left)<br>`Scene3D.js:202-209` (Right) | `rotation={[0, 0, z]}`<br>from `wristOrientation`<br>**(Z-axis only)** | `rotation={[0, 0, z]}`<br>from `wristOrientation`<br>**(Z-axis only)** | Wrist rotation from MediaPipe camera tracking. **Locked to Z-axis** (1 DoF) - X and Y always 0. Default: `{x: 0, y: 0, z: 0}` when no tracking data or when `disableWristRotation` is true. |
| **Level 2** | GimbalControl | `Scene3D.js:178-184` (Left)<br>`Scene3D.js:211-217` (Right) | `rotation={x: 0, y: 0, z: 0}` | `rotation={x: 0, y: 0, z: 0}` | Interactive gimbal offset rotation using PivotControls. Provides full 3-axis manual control. Visible when `showGimbals` is true. |
| **Level 3** | HandModel wrapper | `HandModel.js` via `zRotationOffset` prop | `zRotationOffset={leftHandZRotation}`<br>Default: **0°** | `zRotationOffset={rightHandZRotation}`<br>Default: **0°** | Manual Z-axis rotation offset. Incremented by ±90° via UI buttons in control panel. Applied in HandModel before rendering hand. |
| **Level 4** | Robot/Hand joints | `URDFHandModel.js:145-172`<br>`AbilityHand.js:10-110` | Individual joint angles<br>from `jointRotations.joints` | Individual joint angles<br>from `jointRotations.joints` | Individual finger joint rotations (MCP, PIP, DIP, TIP for each finger). For URDF: Mapped via `mapUIJointToURDF()` and clamped via `clampJointValue()` before applying. For AbilityHand: Directly added to base rotations. |

#### Position Offsets (Non-Rotational)

| Component | Script Location | Left Hand | Right Hand | Description |
|-----------|----------------|-----------|------------|-------------|
| Hand mesh group | `Scene3D.js:169` (Left)<br>`Scene3D.js:201` (Right) | `position={[0.3, 0, 0]}` | `position={[-0.3, 0, 0]}` | Base position offset in scene. Left hand at +0.3 on X-axis, right hand at -0.3 on X-axis. Creates separation between hands. |
| URDFHandModel inner group | `URDFHandModel.js:132-142` | Camera position if enabled:<br>`{x, y, z}` from tracking<br>Default: `{0, 0, 0}` | Camera position if enabled:<br>`{x, y, z}` from tracking<br>Default: `{0, 0, 0}` | Optional camera position tracking for fine movement. Controlled by `enableCameraPosition` toggle in control panel. Applied to inner group via `groupRef.current.position.set()`. Default: disabled. |
| Camera | `Scene3D.js:111` | **Mirror ON**: `[0.5, 0.5, 1]`<br>**Mirror OFF**: `[0.5, 0.5, -1]` | Same as left | Camera position based on mirror mode toggle. Mirror ON provides front view (like a mirror), Mirror OFF provides back view. Updated by `CameraController` component. |

#### Key Configuration Details

**Left Hand Initialization (App.js):**
- Base gimbal: `{x: 0, y: 0, z: 0}` (initialized in state)
- Z-rotation offset: `0` (initialized in state) - **No initial offset**
- Joint rotations: All zeros (default in component if no tracking data)
- Wrist orientation: `{x: 0, y: 0, z: 0}` (default when no camera tracking)

**Right Hand Initialization (App.js):**
- Base gimbal: `{x: 0, y: 0, z: 0}` (initialized in state)
- Z-rotation offset: `0` (initialized in state) - **No initial offset**
- Joint rotations: All zeros (default in component if no tracking data)
- Wrist orientation: `{x: 0, y: 0, z: 0}` (default when no camera tracking)

**Note:**
- Wrist rotation is **locked to Z-axis only** (1 DoF) in `handKinematics.js:196-198`
- This ensures fingertips always point upward, preventing unnatural hand orientations
- Both hands use the right-hand rule coordinate system
- Mirror mode controls camera position for intuitive front/back viewing

**Rotation Flow (Data → Rendering):**
1. `handKinematics.js` calculates wrist orientation and locks it to Z-axis (line 196-198)
2. `App.js` maintains state for all rotation values (gimbal, z-offset, joint rotations)
3. State passed to `Scene3D.js` via props
4. `Scene3D.js` applies Level 1 (wrist Euler rotation) to hand mesh group
5. `GimbalControl` applies Level 2 (gimbal offset) as child of wrist rotation
6. `HandModel.js` applies Level 3 (Z-offset) via `zRotationOffset` prop
7. `URDFHandModel.js` or `AbilityHand.js` applies Level 4 (individual joint rotations)

### Rotation Stack Explanation

1. **Wrist Rotation (Camera Tracking - Z-axis only)**: Applied at the hand mesh group level using Euler angles. This rotation comes from MediaPipe's wrist orientation detection but is **locked to Z-axis rotation only** (1 DoF) to ensure fingertips always point upward. The local coordinate axes rotate with this to show the hand's current Z-rotation. Can be disabled via `disableWristRotation` toggle.

2. **Gimbal Offset**: The interactive gimbal control (PivotControls widget) allows users to manually adjust the overall hand orientation by dragging the colored rotation rings (red=X, green=Y, blue=Z). This provides full 3-axis control for fine-tuning orientation. Can be hidden via `showGimbals` toggle.

3. **Z-Axis Manual Offset**: The ±90° rotation buttons in the control panel apply discrete rotations around the blue (Z) axis. This is useful for quickly adjusting model orientation by 90° increments without affecting the wrist tracking or gimbal settings.

4. **Individual Joint Rotations**: Each finger joint (MCP, PIP, DIP, TIP) can be controlled independently either through camera tracking or manual sliders, allowing for detailed hand pose control. For URDF models, joint angles are clamped to safe limits. For AbilityHand models, rotations are directly applied to nested groups.

### Key Design Principles

- **Separation of Concerns**: Each rotation level serves a distinct purpose and can be controlled independently
- **Visual Feedback**: Axes helpers and gimbal rings provide clear visual reference for orientation
- **Hierarchical Transforms**: Child transformations are relative to parent transformations, allowing complex poses
- **Camera Independence**: Position and rotation can be tracked from camera or set manually

## Setup

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Dependencies

- **React**: UI framework
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for React Three Fiber
- **three**: 3D graphics library
- **@mediapipe/hands**: Hand tracking and landmark detection
- **@mediapipe/drawing_utils**: Utilities for drawing hand landmarks

## 🚀 Quick Start

1. **Grant camera permission** when your browser prompts
2. **Show your hand** to the webcam
3. **See real-time tracking** - 21 landmarks appear on your hand
4. **Switch models** using the dropdown selector at the bottom
5. **Interact with 3D view**:
   - **Drag** to rotate camera
   - **Scroll** to zoom in/out
   - **Right-click + drag** to pan

### 🎥 Demo Video
[Add demo GIF or video here]

---

## 🔧 Advanced Usage

### Adding Custom Hand Models

1. Place your GLB/URDF files in `public/assets/robots/hands/your_model/`
2. Create a new component in `src/models/YourModel.js`
3. Register it in `HandModel.js` and `ModelSelector.js`

Example:
```javascript
// src/models/YourModel.js
import { useGLTF } from '@react-three/drei';

export default function YourModel({ handedness = 'right' }) {
  const { scene } = useGLTF(`/assets/robots/hands/your_model/base.glb`);
  return <primitive object={scene} />;
}
```

### Camera Configuration

Adjust MediaPipe settings in `HandTrackingCamera.js`:
```javascript
const hands = new Hands({
  maxNumHands: 2,        // Track up to 2 hands
  modelComplexity: 1,    // 0=lite, 1=full
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
```

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18+, JavaScript ES6+ |
| **3D Graphics** | Three.js, React Three Fiber, React Three Drei |
| **Computer Vision** | MediaPipe Hands, TensorFlow.js |
| **3D Models** | URDF (Unified Robot Description Format), GLB/GLTF |
| **Build Tools** | Create React App, Webpack, Babel |
| **Development** | npm, ESLint, Chrome DevTools |

---

## 📊 Use Cases & Applications

### 🔬 Research & Academia
- **Motion capture** for biomechanics studies
- **Human-robot interaction** experiments
- **Gesture recognition** algorithm development
- **Prosthetic design** and testing

### 🤖 Robotics
- **Hand kinematics visualization** for robot control
- **Teleoperation interfaces** for robotic hands
- **Digital twin** simulations
- **Training data collection** for ML models

### 💻 Software Development
- **AR/VR hand tracking** prototypes
- **Gesture-based UI** testing
- **3D animation** reference tool
- **WebGL performance** benchmarking

### 🎓 Education
- **Computer vision** teaching demonstrations
- **3D graphics programming** tutorials
- **Robotics courses** visualization aid
- **Interactive learning** experiences

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Add new hand models** - Support more robotic hands
2. **Improve tracking** - Optimize MediaPipe configuration
3. **Enhance UI** - Better controls and visualization options
4. **Fix bugs** - Report and resolve issues
5. **Write docs** - Improve tutorials and examples

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Related Projects & Resources

- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html) - Hand tracking solution
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React renderer for Three.js
- [Three.js Examples](https://threejs.org/examples/) - WebGL demos and examples
- [URDF Specification](http://wiki.ros.org/urdf) - Robot description format

---

## 🏷️ Keywords & Topics

`hand-tracking` `3d-visualization` `react-three-fiber` `threejs` `mediapipe` `webgl` `computer-vision` `robotics` `motion-capture` `gesture-recognition` `real-time` `hand-landmarks` `urdf` `prosthetics` `human-robot-interaction` `ar-vr` `browser-based` `interactive-demo` `javascript` `react` `frontend` `simulation` `kinematics` `biomechanics` `telepresence` `digital-twin`

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/HandVisSimulation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/HandVisSimulation/discussions)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by developers, for developers

</div>
