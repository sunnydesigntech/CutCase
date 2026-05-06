# CutCase

CutCase is a browser-based laser-cut box designer for finger-joint cases, lids, divider grids, and editable panel features. It generates a rotatable Three.js assembly preview and a production SVG layout from the same geometry model.

[Open the live app](https://sunnydesigntech.github.io/CutCase/) · [Read the user guide](docs/user-guide.md) · [Geometry notes](docs/geometry-and-fabrication.md) · [Development guide](docs/development.md)

## Current Capabilities

- Finger-joint box generator with inside/outside dimension modes
- Open-top and closed-box panel sets
- Lift-off lid generator with top plate and four inner lip strips
- Configurable lid overhang, lip height, and fit clearance
- Divider generator with front-back and left-right counts
- Interlocking half-slot geometry for divider grids
- Editable panel features: round holes, slots, and rectangular cutouts
- Feature operations: cut, engrave, and mark
- Size-before-placement workflow plus post-placement edit/delete controls
- Real-time SVG layout and rotatable 3D preview
- Exploded 3D view for inspecting panel relationships
- SVG export with embedded design metadata
- Kerf and fit controls with a separate fit-test coupon export
- Static GitHub Pages deployment

## Live Demo

Use the hosted version:

```text
https://sunnydesigntech.github.io/CutCase/
```

The app is also designed to work from a local file path. After dependencies are installed and the preview bundle has been built, opening `index.html` directly in a browser is enough for the main workflow.

## Quick Start

```sh
npm install
npm test
npm run build
npm run serve
```

Then open:

```text
http://localhost:5173
```

## Basic Workflow

1. Choose inside or outside dimensions.
2. Enter width, depth, height, material thickness, finger width, kerf, and fit.
3. Toggle open top, lid, and dividers as needed.
4. Rotate the 3D preview and use the explode slider to inspect the assembly.
5. Add panel features from the cut-layout panel.
6. Export the SVG and cut a fit test before cutting the full design.

For a fuller walkthrough, see [docs/user-guide.md](docs/user-guide.md).

## Repository Structure

```text
index.html              App shell and controls
styles.css              Workbench UI styling
app.js                  Browser UI state, rendering, downloads
box-model.js            Geometry model, panel generation, SVG export
preview3d.js            Three.js preview adapter
preview3d.bundle.js     Browser-safe bundled 3D preview
verify-ui.mjs           Headless browser visual regression checks
test.js                 Geometry and SVG checks
scripts/build.mjs       Static Pages build
docs/                   Study notes and project documentation
```

## Documentation

- [User guide](docs/user-guide.md)
- [Architecture](docs/architecture.md)
- [Geometry and fabrication notes](docs/geometry-and-fabrication.md)
- [Roadmap](docs/roadmap.md)
- [Wiki source mirror](docs/wiki/Home.md)
- [MakerCase study notes](docs/makercase-basic-box-study.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Development Commands

```sh
npm test
npm run build
TARGET_URL=file:///absolute/path/to/index.html npm run verify:ui
TARGET_URL=https://sunnydesigntech.github.io/CutCase/ npm run verify:ui
```

`npm run build` bundles the Three.js preview and writes the deployable static site to `dist/`.

## GitHub Pages

The Pages workflow runs on every push to `main`:

1. Install dependencies with `npm ci`.
2. Run geometry tests.
3. Build the static site.
4. Upload `dist/`.
5. Deploy to GitHub Pages.

Workflow file: [.github/workflows/pages.yml](.github/workflows/pages.yml)

## Manufacturing Notes

CutCase generates geometry for fabrication, but the correct kerf and fit depend on the actual laser, material, thickness, focus, speed, power, and humidity. Always cut a fit-test coupon on the same material before cutting the full design. See [docs/geometry-and-fabrication.md](docs/geometry-and-fabrication.md).

## License

MIT. See [LICENSE](LICENSE).
