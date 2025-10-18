# HandVisSimulation

A 3D hand visualization and tracking simulation application built with React Three Fiber and MediaPipe Hands.

## Features

- 🤖 Multiple robotic hand models (Ability Hand, Inspire Hand, Shadow Hand, Allegro Hand, etc.)
- 📹 Real-time hand tracking using MediaPipe
- 🎨 Interactive 3D visualization with Three.js
- 🔄 Dynamic model switching
- 🎯 Hand landmark detection and visualization

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

**`ModelSelector.js`**
- Bottom UI panel for model selection
- Dropdown menu with all available hand models
- Displays usage hints

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

## Usage

1. Grant camera permission when prompted
2. Show your hand to the camera
3. Use the dropdown at the bottom to switch between hand models
4. Use mouse to rotate (drag) and zoom (scroll) the 3D model
5. Hand landmarks will be drawn on the video feed in real-time
