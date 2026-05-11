# Geometry and Fabrication Notes

CutCase generates fabrication-ready SVG geometry, but it does not remove the need for calibration. Laser cutting depends on the exact machine, material, lens, focus, speed, power, air assist, and material condition.

## Dimension Basis

CutCase supports two input modes:

- `Inside`: entered dimensions are the usable interior volume.
- `Outside`: entered dimensions are the outside box dimensions.

The geometry engine converts everything to inside dimensions before generating panels.

## Panel Model

The base box uses named panels:

- `front`
- `back`
- `left`
- `right`
- `bottom`
- `top`, when the box is closed

Open boxes omit the top panel and use flat top edges on side panels.

## Finger Joints

CutCase generates complementary A/B finger patterns:

- A edges tab on odd segments.
- B edges tab on even segments.
- Segment count is kept odd so matching edges stay complementary.
- The requested finger width is treated as a target, not a guarantee.
- The final pattern is centered when there is leftover margin.

This is intended to produce clean, symmetric finger runs for common laser-cut box dimensions.

## Kerf and Fit

Kerf is the material removed by the cutter. CutCase applies a simple effective-kerf model to finger tabs:

- `Loose`: kerf multiplied by `0.65`
- `Standard`: kerf multiplied by `1.0`
- `Tight`: kerf multiplied by `1.35`

This is a fast iteration control, not a full replacement for material calibration.

Recommended workflow:

1. Measure the material thickness.
2. Enter the measured value.
3. Cut the fit-test coupon.
4. Test the loose, standard, and tight pairings.
5. Adjust kerf or fit mode.
6. Cut the full design only after the coupon fits correctly.

## Lid Geometry

Lift-off lids are generated as separate parts:

- a top plate
- front and back inner lips
- left and right inner lips

The lid top is wider and deeper than the box footprint by the selected overhang. The inner lips are offset inward by the selected clearance.

## Divider Geometry

Dividers are generated from the inside box span:

- front-back dividers span the box depth
- left-right dividers span the box width
- divider height matches the inside height

When interlock slots are enabled, crossing divider panels receive half-depth notches. Slot width is based on material thickness plus effective kerf.

## Feature Geometry

Panel features use panel-local coordinates in millimeters:

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

Supported shapes:

- round drill hole
- horizontal slot
- rectangle

Supported operations:

- `cut`: appears as cut geometry in SVG and is subtracted from 3D panels
- `engrave`: appears as an SVG engrave operation and 3D surface overlay
- `mark`: appears as an SVG mark operation and 3D surface overlay

## Design Validation

CutCase runs validation after dimensions, add-ons, and features are normalized. The validation result is shown in the production summary and embedded in exported SVG metadata.

Current checks include:

- zero or high effective kerf
- requested finger width clamping
- very small inside spans
- lid clearance and tall lid lips
- narrow divider compartments
- cut features near panel edges
- cut features that are too small for the current kerf
- overlapping or nearly touching cut features on the same panel

Warnings do not replace a physical test cut. They are intended to catch obvious geometry risks before material is wasted.

## Current Geometry Limitations

- Finger-joint kerf compensation is simple tab widening, not a full polygon offset.
- There is no DXF export yet.
- There is no automatic sheet packing or machine-bed constraint.
- Dogbone reliefs are not implemented yet.
- Divider slots are rectangular and do not yet include relief geometry for tight CNC router tooling.

These limitations are tracked in the roadmap.
