# Getting Started

This page walks through the complete first-use path for CutCase.

## 1. Open the App

Use the hosted app:

```text
https://sunnydesigntech.github.io/CutCase/
```

Or run it locally:

```sh
git clone https://github.com/sunnydesigntech/CutCase.git
cd CutCase
npm install
npm run build
npm run serve
```

Then open:

```text
http://localhost:5173
```

CutCase also works from `file://` after `preview3d.bundle.js` has been built.

## 2. Measure Material

Before setting dimensions, measure the actual sheet thickness with calipers. Enter the measured value in `Thickness`.

Common nominal material thicknesses are often not exact:

- 3 mm plywood may measure 2.7 to 3.2 mm.
- Acrylic can vary by supplier and batch.
- Cardboard and MDF can change with humidity.

Finger joints depend strongly on this value.

## 3. Choose Dimension Basis

CutCase has two dimension modes:

- `Inside`: the entered dimensions are the usable internal volume.
- `Outside`: the entered dimensions are the finished external box size.

For containers, trays, and storage boxes, `Inside` is usually easier because you can design around the thing you want to hold.

## 4. Create a Basic Open Box

For a first test:

1. Set `Basis` to `Inside`.
2. Enable `Open top`.
3. Set `Width`, `Depth`, and `Height`.
4. Set `Thickness` to the measured material thickness.
5. Set `Finger width` to roughly `3 x thickness`.
6. Enter a small starting `Kerf`, such as `0.1 mm`.
7. Leave `Fit` at `Standard`.

The SVG layout should show five main panels:

- left
- front
- right
- back
- bottom

The 3D preview should show the assembled open box.

## 5. Inspect the 3D Preview

Use the center preview:

- drag to rotate
- scroll to zoom
- use `Explode` to separate the panels
- toggle `3D labels` to identify panels

The exploded preview is useful for checking orientation before cutting.

## 6. Add a Lid

Click `Lid` in the top bar or enable `Lift-off lid`.

The lid adds five more parts:

- lid top
- lid front lip
- lid back lip
- lid left lip
- lid right lip

Start with:

- `Overhang`: about one material thickness
- `Lip height`: about two to three material thicknesses
- `Clearance`: about `0.3 mm`

Increase clearance if the lid is too tight.

## 7. Add Dividers

Click `Divider` in the top bar or enter divider counts manually.

Controls:

- `Front-back`: number of panels running front to back
- `Left-right`: number of panels running left to right
- `Interlock slots`: adds half-depth slots at crossing points

Example:

- `Front-back = 1`
- `Left-right = 1`

This creates a four-compartment grid.

## 8. Add Features

Use the feature editor in the cut-layout panel.

Feature workflow:

1. Choose shape: `Round hole`, `Slot`, or `Rectangle`.
2. Choose operation: `Cut`, `Engrave`, or `Mark`.
3. Enter size before placement.
4. Click `Place Feature`.
5. Click a panel in the SVG layout.
6. Select the feature to edit it.

Round holes use diameter. Slots and rectangles use width and height.

## 9. Review Validation

The production summary shows design checks as you edit the model. Review warnings before exporting the final sheet.

Current checks can flag:

- zero kerf
- clamped finger width
- tight lid clearance
- narrow divider compartments
- cut features near panel edges
- overlapping or nearly touching cut features

Warnings are not a substitute for laser software preview or a physical fit test, but they catch common mistakes before material is wasted.

## 10. Export a Fit Test

Before cutting the full design, click `Fit Test`. Cut the exported coupon from the same material.

Use it to choose between:

- loose
- standard
- tight

If all fits are wrong, adjust kerf and repeat.

## 11. Export the Full SVG

Click `Download SVG` after the fit test is acceptable.

Before cutting:

- check SVG line color settings
- check scale in your laser software
- confirm the file imports in millimeters
- verify that engraving and marking operations map to the correct laser layers

## Local Verification Commands

For development or testing:

```sh
npm test
npm run build
TARGET_URL=file:///Users/wcchun/Documents/makercase/index.html npm run verify:ui
```

For the live app:

```sh
TARGET_URL=https://sunnydesigntech.github.io/CutCase/ npm run verify:ui
```
