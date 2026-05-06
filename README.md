# CutCase

CutCase is a browser-based platform for creating laser-cut finger-joint boxes with a rotatable 3D preview, SVG cut layout, kerf/fit controls, and calibration coupons.

Run the local server and open `http://localhost:5173` to use the prototype:

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
