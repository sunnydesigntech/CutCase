# CutCase Architecture

CutCase is intentionally small: plain HTML, CSS, browser JavaScript, a geometry module, and a Three.js preview adapter. There is no frontend framework at this stage.

## Runtime Flow

```text
User controls
  -> app.js reads form state
  -> box-model.js normalizes dimensions and generates panels
  -> box-model.js lays panels out for SVG
  -> app.js writes the SVG preview
  -> preview3d.js renders the same panels as extruded meshes
  -> download buttons export SVG or fit-test SVG
```

## Key Files

`index.html`

Defines the workbench shell, controls, preview regions, feature editor, add-on controls, and export settings.

`styles.css`

Provides the app layout, form controls, feature editor, SVG interaction states, and responsive behavior.

`app.js`

Owns browser state and events:

- reads form inputs
- manages feature placement and editing
- calls the geometry model
- syncs the SVG preview
- syncs the Three.js preview
- exports SVG files

`box-model.js`

Owns fabrication geometry:

- dimension normalization
- finger-joint edge pattern generation
- box panel generation
- lid and divider generation
- divider interlock slot geometry
- panel layout
- feature normalization
- SVG export
- kerf fit-test export

`preview3d.js`

Adapts the geometry model to Three.js:

- extrudes panel polygons by material thickness
- maps each named panel to a 3D face placement
- renders cut features as mesh holes
- renders mark/engrave features as surface overlays
- supports orbit controls, zoom, labels, shadows, and exploded view

`preview3d.bundle.js`

Bundled browser-safe output from `preview3d.js`. This file is committed so `index.html` can be opened directly without a dev server or module import map.

## Geometry Model

The geometry model uses inside dimensions as canonical values:

- `width`: inside left-right span
- `depth`: inside front-back span
- `height`: inside vertical span
- `thickness`: material thickness

Outside dimensions are derived from the canonical inside dimensions.

Panel polygons are generated in panel-local 2D coordinates. Each panel later receives:

- a sheet-layout origin for SVG
- a 3D placement basis for the assembly preview

This keeps SVG export and 3D preview aligned.

## Add-Ons

Lids are generated as extra flat parts:

- one top plate
- four inner lip strips

Dividers are generated as flat panels:

- front-back dividers use the box depth as their panel width
- left-right dividers use the box width as their panel width
- crossing dividers can receive half-depth interlock slots

## Testing

`test.js` checks geometry invariants and generated SVG output.

`verify-ui.mjs` runs a headless browser check. It verifies:

- the 3D canvas exists and is non-blank
- drag rotation changes the canvas
- feature placement changes the 3D canvas
- lid and divider add-ons generate SVG panels and change the 3D canvas
- mobile viewport still renders
- browser console has no errors

## Deployment

GitHub Pages deploys from `.github/workflows/pages.yml`. The workflow installs dependencies, runs tests, builds `dist/`, and publishes it to Pages.
