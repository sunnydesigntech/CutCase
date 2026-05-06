# Interface Guide

This page explains every major area of the CutCase interface.

## Top Bar

The top bar contains:

- project name
- quick add-on toggles
- live metrics
- reset
- fit-test export
- full SVG export

## Add-On Toggles

`Box`

Indicates the base box generator.

`Lid`

Enables or disables the lift-off lid. When enabled, the box is forced to open-top mode because the lift-off lid is a separate part.

`Divider`

Toggles a basic divider grid. If no dividers exist, it creates one front-back divider and one left-right divider. If dividers already exist, it clears them.

## Metrics

The metrics area reports:

- inside dimensions
- material thickness
- feature count
- divider count
- lid part count
- fit mode

These values are based on normalized model output, not just raw form input.

## Box Setup Panel

The left panel contains the primary design inputs.

### Dimensions

`Basis`

Selects inside or outside input interpretation.

`Open top`

Controls whether the top panel is included.

`Width`, `Depth`, `Height`

Box dimensions in millimeters.

### Material and Joints

`Thickness`

Measured material thickness.

`Finger width`

Target finger segment size.

`Kerf`

Cutter compensation estimate.

`Fit`

Fast loose/standard/tight kerf scaling.

### Lid

`Lift-off lid`

Adds the lid top and four inner lip strips.

`Overhang`

Extends the lid top beyond the box footprint.

`Lip height`

Controls how deep the inner lip strips reach into the box.

`Clearance`

Controls the fit gap between lip strips and box walls.

### Dividers

`Front-back`

Number of dividers running from front to back.

`Left-right`

Number of dividers running from left to right.

`Interlock slots`

Adds half-depth slots where dividers cross.

### Preview

`Explode`

Separates panels along their outward normals in 3D.

`3D labels`

Shows panel name labels in the 3D preview.

## 3D Preview Panel

The middle preview is the assembly inspection area.

Controls:

- drag to rotate
- scroll to zoom
- use explode slider for panel separation

What to inspect:

- panel orientation
- lid placement
- divider placement
- feature visibility
- whether cutouts are visible on the expected face

## Production Summary

The production summary shows:

- outside size
- inside size
- panel count
- add-on summary
- front bottom finger run

This is intended as a quick check before export.

## Cut Layout Panel

The right panel shows the SVG layout.

The layout is used for:

- visual inspection
- panel feature placement
- panel feature selection
- export preview

## Feature Controls

Feature placement uses two states.

Before placement:

- choose shape
- choose operation
- enter size
- click `Place Feature`

After placement:

- select feature
- edit panel-local X/Y
- edit shape
- edit size
- edit operation
- delete feature

## Export Settings

`Panel labels`

Shows or hides SVG panel labels.

`Cut color`

Sets cut stroke color.

`Label color`

Sets label and engrave styling color.

`Line width`

Sets SVG stroke width.

## Recommended UI Checks Before Export

Before exporting:

1. Rotate the 3D preview.
2. Use explode mode once.
3. Check panel labels in SVG.
4. Confirm lid and divider parts are present.
5. Select each custom feature and verify size.
6. Export a fit test.
7. Export the full SVG.
