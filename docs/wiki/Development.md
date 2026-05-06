# Development

## Repository

https://github.com/sunnydesigntech/CutCase

## Local Setup

```sh
npm install
npm test
npm run build
npm run serve
```

## Main Files

- `index.html`: app shell and controls
- `styles.css`: workbench UI
- `app.js`: browser state and rendering
- `box-model.js`: geometry model and SVG export
- `preview3d.js`: Three.js preview adapter
- `preview3d.bundle.js`: bundled browser script
- `test.js`: geometry tests
- `verify-ui.mjs`: browser verification

## Verification

```sh
npm test
npm run build
TARGET_URL=file:///Users/wcchun/Documents/makercase/index.html npm run verify:ui
TARGET_URL=https://sunnydesigntech.github.io/CutCase/ npm run verify:ui
```

## Deployment

GitHub Pages deploys automatically on pushes to `main`.

Workflow:

1. install dependencies
2. run tests
3. build static site
4. upload `dist`
5. deploy Pages

## Development Rules

- Keep geometry independent from DOM state.
- Generate SVG and 3D preview from the same panel model.
- Add tests for geometry changes.
- Rebuild `preview3d.bundle.js` when `preview3d.js` changes.
- Preserve direct `file://` support.
