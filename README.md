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
└── Hand mesh group (positioned at [±0.3, 0, 0])
    │   Rotation Level 1: Wrist rotation from camera tracking
    │   Controls: Calculated from MediaPipe hand landmarks
    │
    ├── axesHelper (Red=X, Green=Y, Blue=Z)
    │   └── Rotates with wrist rotation from camera
    │
    └── GimbalControl (PivotControls widget)
        │   Rotation Level 2: Gimbal offset rotation
        │   Controls: Interactive 3D drag handles
        │
        └── HandModel wrapper
            │   Rotation Level 3: Manual Z-axis offset
            │   Controls: ±90° rotation buttons in UI
            │
            └── URDFHandModel
                │   Position: Camera position tracking (optional)
                │
                └── URDF Robot
                    │   Rotation Level 4: Individual joint rotations
                    │   Controls: Camera joint tracking or manual sliders
                    │
                    ├── robot.links[...] (Visual meshes)
                    └── robot.joints[...] (Articulated joints)
```

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
| **Level 1** | Hand mesh group | `Scene3D.js:86-92` (Left)<br>`Scene3D.js:119-125` (Right) | `rotation={[x, y, z]}`<br>from `wristOrientation` | `rotation={[x, y, z]}`<br>from `wristOrientation` | Wrist rotation from MediaPipe camera tracking. Default: `{x: 0, y: 0, z: 0}` when no tracking data. Initialized in `App.js:76-77` |
| **Level 2** | GimbalControl | `Scene3D.js:96-113` (Left)<br>`Scene3D.js:129-146` (Right) | `rotation={x: 0, y: 0, z: 0}` | `rotation={x: 0, y: 0, z: 0}` | Interactive gimbal offset rotation. Initialized in `App.js:76-77`. Controlled via PivotControls drag handles. |
| **Level 3** | HandModel wrapper | `HandModel.js:85`<br>(applied to both hands) | `rotation={[0, 0, 0]}`<br>**0° offset** | `rotation={[0, 0, 0]}`<br>**0° offset** | Manual Z-axis rotation offset. Both hands initialized with `0` in `App.js:81-82`. Incremented by ±90° via UI buttons. |
| **Level 4** | URDF Robot joints | `URDFHandModel.js:140-167` | Individual joint angles<br>from `jointRotations` | Individual joint angles<br>from `jointRotations` | Individual finger joint rotations (MCP, PIP, DIP, TIP for each finger). Mapped via `mapUIJointToURDF()` and applied via `joint.setJointValue()`. Initialized to `0` for all joints in `App.js:35-46`. |

#### Position Offsets (Non-Rotational)

| Component | Script Location | Left Hand | Right Hand | Description |
|-----------|----------------|-----------|------------|-------------|
| Hand mesh group | `Scene3D.js:87` (Left)<br>`Scene3D.js:120` (Right) | `position={[0.3, 0, 0]}` | `position={[-0.3, 0, 0]}` | Base position offset in scene. Left hand at +0.3 on X-axis, right hand at -0.3 on X-axis. |
| URDFHandModel | `URDFHandModel.js:129-136` | Camera position if enabled:<br>`{x, y, z}` from tracking<br>Default: `{0, 0, 0}` | Camera position if enabled:<br>`{x, y, z}` from tracking<br>Default: `{0, 0, 0}` | Optional camera position tracking. Controlled by `enableCameraPosition` toggle in `App.js:94`. Default: disabled. |

#### Key Configuration Details

**Left Hand Initialization (App.js):**
- Base gimbal: `{x: 0, y: 0, z: 0}` (line 76)
- Z-rotation offset: `0` (line 81) - **No initial offset**
- Joint rotations: All zeros via `createInitialJointRotations()` (lines 60-62)
- Wrist orientation: `{x: 0, y: 0, z: 0}` (default in Scene3D.js:89-91)

**Right Hand Initialization (App.js):**
- Base gimbal: `{x: 0, y: 0, z: 0}` (line 77)
- Z-rotation offset: `0` (line 82) - **No initial offset**
- Joint rotations: All zeros via `createInitialJointRotations()` (lines 60-62)
- Wrist orientation: `{x: 0, y: 0, z: 0}` (default in Scene3D.js:122-124)

**Note:** All rotation offsets are currently set to zero to test camera-to-hand control using only the default conversion algorithm from `handKinematics.js`. Both hands use the right-hand rule coordinate system with no manual adjustments.

**Rotation Flow (Data → Rendering):**
1. `App.js` maintains state for all rotation values
2. State passed to `Scene3D.js` via props
3. `Scene3D.js` applies Level 1 (wrist) and passes remaining to `GimbalControl`
4. `GimbalControl` applies Level 2 (gimbal) and passes remaining to `HandModel`
5. `HandModel.js` applies Level 3 (Z-offset) and passes remaining to `URDFHandModel`
6. `URDFHandModel.js` applies Level 4 (individual joints) to URDF robot

### Rotation Stack Explanation

1. **Wrist Rotation (Camera Tracking)**: Applied at the hand mesh group level, this rotation comes from MediaPipe's wrist orientation detection. The coordinate axes rotate with this to show the hand's orientation in space.

2. **Gimbal Offset**: The interactive gimbal control allows users to manually adjust the overall hand orientation by dragging the colored rotation rings (red=X, green=Y, blue=Z).

3. **Z-Axis Manual Offset**: The ±90° rotation buttons in the control panel apply discrete rotations around the blue (Z) axis. This is useful for adjusting model orientation without affecting the wrist tracking or gimbal.

4. **Individual Joint Rotations**: Each finger joint (MCP, PIP, DIP, TIP) can be controlled independently either through camera tracking or manual sliders, allowing for detailed hand pose control.

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
