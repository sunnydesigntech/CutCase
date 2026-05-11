# CutCase User Guide

This guide covers the current CutCase workflow from first dimensions to SVG export.

## 1. Set the Box Dimensions

Use the left setup panel to define the base box:

- `Basis`: choose whether the entered dimensions are inside or outside dimensions.
- `Open top`: creates a five-panel open box when enabled, or a six-panel closed box when disabled.
- `Width`, `Depth`, `Height`: box dimensions in millimeters.
- `Thickness`: material thickness in millimeters.
- `Finger width`: target finger size. The geometry engine adjusts this to keep an odd, centered joint pattern.
- `Kerf`: cutter width compensation value.
- `Fit`: loose, standard, or tight kerf scaling for quick fit iteration.

CutCase normalizes all dimensions to inside dimensions internally, then derives outside dimensions from the material thickness and top/bottom configuration.

## 2. Add a Lift-Off Lid

Click `Lid` in the top bar or enable `Lift-off lid` in the setup panel.

The lid generator adds:

- `lid top`: a flat top plate.
- `lid front lip`
- `lid back lip`
- `lid left lip`
- `lid right lip`

The lip strips sit inside the open box and help locate the lid.

Lid controls:

- `Overhang`: how far the lid top extends past the outside box footprint.
- `Lip height`: how far the lip strips extend down into the box.
- `Clearance`: extra fit clearance between the inner lip frame and the box inside walls.

## 3. Add Dividers

Click `Divider` in the top bar or set divider counts in the setup panel.

Divider controls:

- `Front-back`: number of divider panels that run from front to back.
- `Left-right`: number of divider panels that run from left to right.
- `Interlock slots`: adds half-depth slots where crossing divider panels meet.

With one front-back divider and one left-right divider, CutCase creates a four-compartment grid. Higher counts generate larger grids.

## 4. Inspect the 3D Preview

Use the center preview:

- Drag to rotate.
- Scroll to zoom.
- Use `Explode` to separate the panels along their face normals.
- Toggle `3D labels` when labels help inspection.

The 3D preview is generated from the same panel polygons as the SVG layout, so changes to dimensions, lid, dividers, and panel features update the 3D preview in real time.

## 5. Add Panel Features

Use the right cut-layout panel.

Feature placement flow:

1. Pick the shape: `Round hole`, `Slot`, or `Rectangle`.
2. Pick the operation: `Cut`, `Engrave`, or `Mark`.
3. Enter diameter or width/height before placement.
4. Click `Place Feature`.
5. Click inside a panel in the SVG layout.
6. Select the placed feature to edit shape, size, operation, or position.

Cut operations are subtracted from the 3D panel mesh. Engrave and mark operations are shown as 3D surface overlays and exported as SVG operations.

## 6. Check Validation

The production summary shows validation results while you work. Review these checks before export, especially after adding holes, slots, lids, or dividers.

Validation flags common risks:

- zero kerf
- finger width clamping
- tight lid clearance
- narrow divider compartments
- cut features near edges
- overlapping cut features

Warnings are advisory, but they should be resolved or intentionally accepted before cutting material.

## 7. Export

Use:

- `Download SVG`: exports the full panel layout.
- `Fit Test`: exports loose, standard, and tight kerf test coupons.

The exported SVG includes metadata with normalized configuration, generated panel information, panel features, and validation results.

## 8. Recommended Fabrication Flow

1. Measure actual material thickness with calipers.
2. Enter that thickness in CutCase.
3. Export and cut the fit-test coupon.
4. Adjust kerf or fit mode.
5. Cut the full design.
6. Keep a record of material, laser settings, kerf, and fit mode for repeat jobs.
