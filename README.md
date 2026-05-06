# CutCase

CutCase is a browser-based platform for creating laser-cut finger-joint boxes with a rotatable 3D preview, SVG cut layout, kerf/fit controls, calibration coupons, and editable panel features.

The feature editor supports:

- Round drill holes
- Horizontal slots
- Rectangular cutouts
- Cut, engrave, or mark operations
- Size selection before placement
- Post-placement edit/delete controls
- Real-time 3D surface previews for placed features
- SVG metadata for generated features

Open `index.html` directly, or run the local server and open `http://localhost:5173`:

```sh
npm install
npm run serve
```

Build the static deploy folder:

```sh
npm run build
```

Run the geometry checks:

```sh
npm test
```

Run the browser verification after the server is running:

```sh
npm run verify:ui
```

Study notes are in [docs/makercase-basic-box-study.md](docs/makercase-basic-box-study.md).
