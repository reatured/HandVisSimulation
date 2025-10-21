# GitHub Pages Asset Path Issue - Fixed 2025-10-20

## Issue Summary
Preview images in ModelSelectorModal.js were not loading when deployed to GitHub Pages.

## Root Cause
When deploying to GitHub Pages with `homepage: "."` in package.json, **absolute paths** like `/assets/...` fail because they try to load from the domain root instead of the repository subdirectory.

### Example:
- Deployed URL: `https://lingyi-zhou.github.io/HandVisSimulation/`
- ❌ Absolute path `/assets/doc/gallery/ability_rt.webp` → tries to load from `https://lingyi-zhou.github.io/assets/...` (404)
- ✅ Relative path `./assets/doc/gallery/ability_rt.webp` → correctly loads from `https://lingyi-zhou.github.io/HandVisSimulation/assets/...`

## Solution Applied
**File:** `src/components/ModelSelectorModal.js`

Changed all image paths from absolute to relative:
```javascript
// BEFORE (broken on GitHub Pages)
const imageMap = {
  'ability_hand': '/assets/doc/gallery/ability_rt.webp',
  'shadow_hand': '/assets/doc/gallery/shadow_rt.webp',
  // ... etc
}

// AFTER (works everywhere)
const imageMap = {
  'ability_hand': './assets/doc/gallery/ability_rt.webp',
  'shadow_hand': './assets/doc/gallery/shadow_rt.webp',
  // ... etc
}
```

Also fixed:
- Barrett Hand: Changed from `barrett-collision.png` to `bhand_rt.webp` (correct preview file)

## Important Rule for This Project
**When referencing public assets in React components:**
- ✅ Use relative paths: `./assets/...`
- ❌ Avoid absolute paths: `/assets/...`

This applies to:
- Images
- 3D models (GLB/URDF files)
- Any files in the `public/` folder

## Files to Watch
If adding new model previews or assets, ensure paths in these files use relative paths:
- `src/components/ModelSelectorModal.js` - Model preview images
- Any components loading URDF/GLB models from `public/assets/`

## Testing
After making changes to asset paths:
1. Test locally: `npm start` (should work at `localhost:3000`)
2. Test build: `npm run build` then serve the `build` folder
3. Test on GitHub Pages after deployment

## Related Configuration
- `package.json`: `"homepage": "."` - enables relative paths in build
- Deploy script: `npm run deploy` uses `gh-pages -d build`
