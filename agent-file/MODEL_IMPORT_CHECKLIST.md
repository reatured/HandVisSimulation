# Model Import Checklist

Quick reference for importing new hand models into the HandVisSimulation application.

## Essential Steps

### 1. Add Preview Images
- **Location:** `public/assets/doc/gallery/`
- **Naming:** `[model_name]_rt.png` or `.webp`
- **Action:** Copy preview images from source to gallery folder

### 2. Add Model Entries to App.js
- **File:** `src/App.js`
- **Location:** `HAND_MODELS` array (around line 16-32)
- **Format:**
  ```js
  { id: 'model_left', name: 'Model Name (Left)', path: 'model_name', side: 'left' },
  { id: 'model_right', name: 'Model Name (Right)', path: 'model_name', side: 'right' },
  ```

### 3. Update Model Selector Image Map
- **File:** `src/components/ModelSelectorModal.js`
- **Location:** `getModelImage()` function's `imageMap` object (around line 5-16)
- **Format:**
  ```js
  'model_name': './assets/doc/gallery/model_name_rt.png',
  ```

### 4. Copy URDF Files
- **From:** Source URDF directory
- **To:** `public/assets/robots/hands/[model_name]/`
- **Structure:** Must include:
  - `left/[model]_left.urdf` (if applicable)
  - `right/[model]_right.urdf` (if applicable)
  - `meshes/` directory with all mesh files

### 5. Configure URDF Paths
- **File:** `src/utils/urdfConfig.js`
- **Location:** `URDF_MODELS` object (around line 10-41)
- **Format:**
  ```js
  model_name: {
    left: `${PUBLIC_URL}/assets/robots/hands/model_name/left/model_left.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/model_name/right/model_right.urdf`,
  },
  ```

### 6. Add Model Case to HandModel.js
- **File:** `src/components/HandModel.js`
- **Location:** Switch statement (around line 39-86)
- **Format:**
  ```js
  case 'model_name':
    if (hasURDFSupport(modelPath)) {
      return <URDFHandModel ... />
    }
  ```

### 7. Add Joint Mappings
- **File:** `src/utils/urdfJointMapping.js`
- **Actions:**
  1. Analyze URDF to extract joint names
  2. Create `MODEL_NAME_JOINT_MAP` object mapping UI joints to URDF joints
  3. Add to `JOINT_MAPPINGS` object (around line 241-260)
- **UI Joint Names:** `thumb_mcp`, `thumb_pip`, `thumb_dip`, `index_mcp`, `index_pip`, `index_dip`, `middle_mcp`, `middle_pip`, `middle_dip`, `ring_mcp`, `ring_pip`, `ring_dip`, `pinky_mcp`, `pinky_pip`, `pinky_dip`

## Special Cases

### STL Mesh Files (if model uses .STL instead of .glb)
Already configured in `src/components/URDFHandModel.js` - STLLoader handles both .stl and .glb files automatically.

### Models with Only One Side
For right-only models (e.g., l20pro, l30):
- Only add right entry to App.js
- Only add right path to urdfConfig.js
- Joint mapping still needed

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Model not in selector | Missing App.js entry | Add to HAND_MODELS array |
| Pink/red cube displayed | URDF path incorrect or missing | Check urdfConfig.js paths and file locations |
| Joints don't move | Missing joint mapping | Add joint mapping in urdfJointMapping.js |
| Image not showing | Wrong path or missing file | Check image path in ModelSelectorModal.js |

## Extract Joint Names from URDF

```bash
# Python script to extract joint names
python3 << 'EOF'
import re
with open('path/to/model.urdf', 'r') as f:
    content = f.read()
joints = re.findall(r'<joint\s+name="([^"]+)"\s+type="revolute"', content)
for j in joints:
    print(f"  {j}")
EOF
```

## Example: Linker Hand Import

**Models imported:** l6, l10, l20, l20pro, l21, l25, l30, o6, o7 (9 models, 17 variants)

**Key findings:**
- L6: 11 DOF (simpler structure)
- L10: 20 DOF (intermediate)
- L20/L21/L25/L30/O6/O7: 21 DOF (full articulation, shared mapping)
- Used STL meshes (no conversion needed, already supported)
- L20pro and L30: right-hand only

**Files modified:** 5 files total
1. `ModelSelectorModal.js` - Added 9 image mappings
2. `App.js` - Added 17 model entries
3. `urdfConfig.js` - Added 9 URDF path configs
4. `HandModel.js` - Added 9 case statements
5. `urdfJointMapping.js` - Created 3 joint maps for different DOF levels

**Time estimate:** ~30 minutes with checklist
