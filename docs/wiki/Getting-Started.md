# Getting Started

## Open CutCase

Use the hosted app:

https://sunnydesigntech.github.io/CutCase/

Or clone the repository and run locally:

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

## Basic Box Workflow

1. Choose `Inside` or `Outside` dimension basis.
2. Enter width, depth, height, material thickness, finger width, kerf, and fit.
3. Choose whether the box is open-top or closed.
4. Rotate the 3D preview to inspect the assembly.
5. Use the explode slider to inspect joints and panel orientation.
6. Add lid, divider, or panel features if needed.
7. Export SVG.
8. Cut a fit-test coupon before cutting the full design.

## Add a Lid

Click `Lid` in the top bar or enable `Lift-off lid` in the setup panel.

The lid generator creates:

- a top plate
- front and back inner lip strips
- left and right inner lip strips

Tune:

- overhang
- lip height
- clearance

## Add Dividers

Click `Divider` in the top bar or set divider counts manually.

Controls:

- `Front-back`: divider count running front to back
- `Left-right`: divider count running left to right
- `Interlock slots`: half-depth slots where dividers cross

## Add Panel Features

1. Pick `Round hole`, `Slot`, or `Rectangle`.
2. Pick `Cut`, `Engrave`, or `Mark`.
3. Enter size before placement.
4. Click `Place Feature`.
5. Click a panel in the SVG layout.
6. Select the feature to edit or delete it.
