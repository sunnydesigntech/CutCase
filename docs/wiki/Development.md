# Development

CutCase is a static browser app with a small geometry core.

## Repository

https://github.com/sunnydesigntech/CutCase

## Requirements

- Node.js 22 recommended
- npm
- Google Chrome for browser verification

GitHub Actions currently uses Node.js 22.

## Local Setup

```sh
git clone https://github.com/sunnydesigntech/CutCase.git
cd CutCase
npm install
npm test
npm run build
npm run serve
```

Open:

```text
http://localhost:5173
```

## File Structure

```text
index.html              App shell and controls
styles.css              Workbench UI styling
app.js                  Browser UI state and rendering
box-model.js            Geometry, panels, SVG export
preview3d.js            Three.js preview adapter
preview3d.bundle.js     Bundled 3D preview for browser/file use
test.js                 Geometry and SVG tests
verify-ui.mjs           Browser verification
scripts/build.mjs       Static build script
docs/                   Versioned project docs
docs/wiki/              Mirror of GitHub Wiki source
```

## Main Runtime Flow

```text
form inputs
  -> app.js readConfig()
  -> box-model.js normalizeConfig()
  -> box-model.js buildPanels()
  -> box-model.js layoutPanels()
  -> box-model.js buildSvg()
  -> app.js writes SVG preview
  -> preview3d.js renders panel meshes
```

## Geometry Layer

`box-model.js` should remain independent from the DOM.

It owns:

- dimension normalization
- panel definitions
- finger-joint paths
- lid generation
- divider generation
- feature normalization
- SVG export
- fit-test export

## UI Layer

`app.js` owns:

- reading form controls
- feature placement state
- selected feature state
- SVG preview injection
- download behavior
- Three.js preview sync

## 3D Preview Layer

`preview3d.js` adapts panel geometry to Three.js.

It owns:

- scene setup
- camera
- orbit controls
- lights and shadows
- panel mesh extrusion
- cut feature holes
- engrave/mark overlays
- exploded view

## Build

`preview3d.js` imports Three.js modules. To keep direct browser file support, it is bundled:

```sh
npm run bundle:preview
```

Full build:

```sh
npm run build
```

This writes `dist/`.

## Tests

Geometry tests:

```sh
npm test
```

Browser verification:

```sh
TARGET_URL=file:///Users/wcchun/Documents/makercase/index.html npm run verify:ui
```

Live verification:

```sh
TARGET_URL=https://sunnydesigntech.github.io/CutCase/ npm run verify:ui
```

## What Browser Verification Checks

`verify-ui.mjs` checks:

- Three.js canvas exists
- 3D canvas is non-blank
- drag rotation changes pixels
- feature placement changes pixels
- lid and divider generation changes pixels
- add-on SVG panels are present
- mobile viewport renders
- console has no errors

## Deployment

GitHub Pages deploys on push to `main`.

Workflow:

1. checkout
2. setup Node
3. `npm ci`
4. `npm test`
5. `npm run build`
6. upload `dist`
7. deploy Pages

Workflow file:

```text
.github/workflows/pages.yml
```

## Development Rules

- Keep geometry code deterministic.
- Keep DOM reads out of `box-model.js`.
- Update tests when geometry changes.
- Update `verify-ui.mjs` when browser behavior changes.
- Rebuild `preview3d.bundle.js` when `preview3d.js` changes.
- Preserve direct `file://` support.
- Keep SVG and 3D preview driven by the same model.

## Release Checklist

1. `npm test`
2. `npm run build`
3. run browser verifier locally
4. commit changes
5. push to `main`
6. watch GitHub Pages workflow
7. run live browser verifier
8. update docs/wiki when behavior changes
