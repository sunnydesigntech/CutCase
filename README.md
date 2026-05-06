# CutCase

CutCase is a browser-based platform for creating laser-cut finger-joint boxes with a rotatable 3D preview, SVG cut layout, kerf/fit controls, calibration coupons, and editable panel features.

Box add-ons support:

- Lift-off lids with a top plate and four inner lip strips
- Configurable lid overhang, lip height, and fit clearance
- Front-back and left-right divider counts
- Interlocking half-slot geometry for divider grids
- Real-time SVG layout and 3D preview updates for generated add-on parts

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
