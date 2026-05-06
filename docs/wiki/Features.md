# Features

This page is a detailed reference for the features currently available in CutCase.

## Box Generator

CutCase generates finger-joint box panels from a normalized millimeter model.

Supported box modes:

- open-top box
- closed box
- inside dimension input
- outside dimension input

Generated base panels:

- `front`
- `back`
- `left`
- `right`
- `bottom`
- `top`, when closed

Open-top boxes omit `top` and make side-panel top edges flat.

## Finger Joints

The generator uses complementary A/B finger patterns.

Important behavior:

- the requested finger width is treated as a target
- segment count is forced to be odd
- leftover edge space is centered
- tiny end margins are avoided when possible
- mating edges use opposite A/B parity

This gives a symmetric panel outline and keeps opposing edges compatible.

## Dimension Controls

`Basis`

Controls whether the typed dimensions are inside or outside dimensions.

`Open top`

Controls whether the top panel is omitted.

`Width`, `Depth`, `Height`

Box dimensions in millimeters.

`Thickness`

Material thickness. This is one of the most important values in the design.

`Finger width`

Target width for finger segments.

`Kerf`

Laser/cutter material removal estimate.

`Fit`

Kerf multiplier:

- loose: smaller effective kerf
- standard: entered kerf
- tight: larger effective kerf

## Lift-Off Lid

The lid generator creates a separate lid assembly for open-top boxes.

Generated lid parts:

- `lid top`
- `lid front lip`
- `lid back lip`
- `lid left lip`
- `lid right lip`

Lid controls:

- `Overhang`: how far the top plate extends past the box footprint
- `Lip height`: how far the locating strips extend down into the box
- `Clearance`: fit gap between the inner lip frame and box walls

The lid is shown in the SVG layout and 3D preview.

## Dividers

The divider generator creates internal panels.

Controls:

- `Front-back`: count of dividers running from front to back
- `Left-right`: count of dividers running from left to right
- `Interlock slots`: adds half-depth crossing slots

Examples:

| Front-back | Left-right | Compartments |
| --- | --- | --- |
| 0 | 0 | 1 |
| 1 | 0 | 2 |
| 0 | 1 | 2 |
| 1 | 1 | 4 |
| 2 | 1 | 6 |
| 2 | 2 | 9 |

Divider panels are generated as flat laser-cut parts and shown in the 3D preview inside the box.

## Panel Feature Editor

CutCase can place editable features onto panels.

Supported shapes:

- round hole
- horizontal slot
- rectangle

Supported operations:

- `cut`
- `engrave`
- `mark`

Feature data model:

```js
{
  type: "slot",
  panel: "front",
  x: 50,
  y: 24,
  width: 18,
  height: 6,
  operation: "cut"
}
```

Coordinates are panel-local millimeters measured from the panel's top-left flat bounding area.

## Cut Features

Cut features are:

- rendered in the SVG as cut geometry
- subtracted from the 3D panel mesh
- validated against panel bounds

Common uses:

- mounting holes
- cable holes
- handles
- window cutouts
- ventilation slots

## Engrave Features

Engrave features are:

- rendered with an engrave style in SVG
- shown as a surface overlay in 3D
- not subtracted from the panel mesh

Common uses:

- labels
- alignment marks
- shallow graphics

## Mark Features

Mark features are:

- rendered as mark geometry in SVG
- shown as a darker surface overlay in 3D

Common uses:

- drill guides
- assembly marks
- reference points

## SVG Preview

The right-side SVG preview is interactive:

- panel hit areas are clickable
- selected features are highlighted
- active placement mode uses a crosshair cursor
- layout updates after every parameter change

## 3D Preview

The 3D preview supports:

- rotation
- zoom
- panel labels
- exploded view
- cut-through holes
- engrave/mark overlays
- lid and divider parts

## Fit Test Export

The fit-test coupon exports three pairings:

- loose
- standard
- tight

Use it to choose the best kerf/fit behavior before cutting the full sheet.
