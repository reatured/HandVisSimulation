# Model Asset Organization Refactor

## Goal
Create a centralized data structure that stores both model file paths and preview image paths, making it easier to add new models.

## Current Issues
1. Model data is defined in `src/App.js` (HAND_MODELS array)
2. Preview images are mapped separately in `src/components/ModelSelectorModal.js` (getModelImage function)
3. Adding a new model requires updating multiple locations
4. No clear relationship between model paths and their preview images

## Proposed Solution

### 1. Create `src/config/modelAssets.js`
A new centralized config file containing all model information:

```javascript
// Example structure:
export const MODEL_ASSETS = [
  {
    id: 'ability_left',
    name: 'Ability Hand (Left)',
    modelPath: 'ability_hand',
    previewImage: './assets/doc/gallery/ability_rt.webp',
    side: 'left'
  },
  {
    id: 'ability_right',
    name: 'Ability Hand (Right)',
    modelPath: 'ability_hand',
    previewImage: './assets/doc/gallery/ability_rt.webp',
    side: 'right'
  },
  // ... more models
]
```

### 2. Update `src/components/ModelSelectorModal.js`
- Remove the `getModelImage` function (lines 4-17)
- Use `model.previewImage` directly from the model data
- Change line 120: `const imagePath = getModelImage(model.path)` to `const imagePath = model.previewImage`

### 3. Update `src/App.js`
- Remove the local HAND_MODELS array definition (lines 16-32)
- Import from new config: `import { MODEL_ASSETS as HAND_MODELS } from './config/modelAssets'`
- No other logic changes needed

## Benefits
- **Single source of truth**: All model information in one place
- **Easy to add models**: Just add one entry with all related data
- **Clear relationships**: Model path and preview image are together
- **Auto-population**: Model selector automatically gets preview images
- **Maintainability**: Easier to update or modify model configurations

## Implementation Tasks
- [ ] Create new config file `src/config/modelAssets.js` with centralized model data structure
- [ ] Update `ModelSelectorModal.js` to use `previewImage` from model data instead of `getModelImage` function
- [ ] Update `App.js` to import models from new config file
- [ ] Test that all models display correctly with their preview images
- [ ] Verify no regressions in model selection functionality
