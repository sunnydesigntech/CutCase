# Development Guide

## Requirements

- Node.js 22 is used in GitHub Actions.
- Google Chrome is used by `verify-ui.mjs` for visual/browser checks.
- No frontend framework is required.

Install dependencies:

```sh
npm install
```

## Local Commands

Run geometry checks:

```sh
npm test
```

Build the static site:

```sh
npm run build
```

Serve locally:

```sh
npm run serve
```

Run browser verification against the local server:

```sh
TARGET_URL=http://127.0.0.1:5173 npm run verify:ui
```

Run browser verification against the direct file:

```sh
TARGET_URL=file:///Users/wcchun/Documents/makercase/index.html npm run verify:ui
```

Run browser verification against GitHub Pages:

```sh
TARGET_URL=https://sunnydesigntech.github.io/CutCase/ npm run verify:ui
```

## Build Notes

`preview3d.js` imports Three.js modules. `npm run build` bundles that file to `preview3d.bundle.js` with esbuild:

```sh
npm run bundle:preview
```

The committed bundle is intentional. It lets `index.html` work directly from `file://` without requiring a dev server.

## Adding Geometry

Most feature work should start in `box-model.js`.

Recommended order:

1. Add normalized config values.
2. Generate panel geometry.
3. Expose the generated panel through `buildPanels`.
4. Place the generated panel through `buildSceneData`.
5. Confirm the SVG output.
6. Confirm the 3D preview.
7. Add tests in `test.js`.
8. Extend `verify-ui.mjs` if the change affects browser behavior.

## Adding UI

Most UI work should start in `index.html` and `app.js`.

Keep these rules:

- The geometry model should not read DOM state.
- UI controls should produce plain config values.
- The SVG and 3D preview should both come from the same model output.
- Export behavior should use normalized model output, not raw inputs.

## Deployment

Pushes to `main` trigger GitHub Pages deployment through `.github/workflows/pages.yml`.

Before pushing:

```sh
npm test
npm run build
TARGET_URL=file:///Users/wcchun/Documents/makercase/index.html npm run verify:ui
```

After deployment:

```sh
TARGET_URL=https://sunnydesigntech.github.io/CutCase/ npm run verify:ui
```
