# Contributing to CutCase

CutCase is a small static web app. Contributions should keep the geometry model, SVG export, and 3D preview aligned.

## Development Setup

```sh
npm install
npm test
npm run build
```

For browser verification:

```sh
TARGET_URL=file:///Users/wcchun/Documents/makercase/index.html npm run verify:ui
```

## Pull Request Checklist

- Geometry changes include `test.js` coverage.
- Browser-facing changes pass `verify-ui.mjs`.
- SVG export and 3D preview are checked together.
- README or docs are updated when behavior changes.
- Generated `preview3d.bundle.js` is rebuilt when `preview3d.js` changes.

## Coding Notes

- Keep the geometry model independent from DOM state.
- Prefer named panel data and normalized configuration over ad hoc state.
- Preserve direct `file://` support.
- Avoid introducing a frontend framework unless the project scope changes substantially.

## Fabrication Safety

When changing geometry or export behavior, consider the physical result. Small errors can waste material or create unsafe machine paths. Add validation when a generated part may become too small, too close to an edge, or too close to another cut.
