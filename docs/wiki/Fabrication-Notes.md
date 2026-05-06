# Fabrication Notes

CutCase produces SVG geometry for fabrication, but physical fit must still be validated on the actual machine and material.

## Why Calibration Matters

Laser-cut parts are affected by:

- actual material thickness
- material density
- laser power
- cutting speed
- focus height
- lens condition
- air assist
- bed flatness
- humidity
- material batch

Two sheets sold as the same nominal thickness can fit differently.

## Measure Material Thickness

Use calipers. Measure in several locations and use a realistic average.

Examples:

| Nominal | Possible measured values |
| --- | --- |
| 3 mm plywood | 2.7 to 3.2 mm |
| 3 mm acrylic | 2.8 to 3.1 mm |
| 6 mm plywood | 5.6 to 6.4 mm |

Enter measured thickness, not nominal thickness.

## Kerf

Kerf is the width of material removed by the cutting beam.

If kerf is not compensated:

- tabs may be too loose
- holes may be too large
- press-fit joints may fail
- dimensions may drift from the intended design

## Fit Modes

CutCase has three quick fit modes:

- loose
- standard
- tight

These scale the entered kerf. They are intended for quick iteration with the fit-test coupon.

## Fit-Test Workflow

1. Enter measured material thickness.
2. Enter an estimated kerf.
3. Click `Fit Test`.
4. Cut the coupon on the same material.
5. Test loose, standard, and tight pairings.
6. Pick the best fit mode.
7. If all are wrong, adjust kerf and repeat.
8. Export the full box after the coupon fits.

## Suggested Starting Values

These are starting points only:

| Material | Thickness | Starting kerf |
| --- | --- | --- |
| plywood | 3 mm | 0.10 mm |
| MDF | 3 mm | 0.10 mm |
| acrylic | 3 mm | 0.08 mm |
| cardboard | 2 mm | 0.15 mm |

Always test.

## Lid Fit

For lift-off lids:

- start with `0.3 mm` clearance
- increase clearance for tight lids
- decrease clearance if the lid rattles
- make sure lip strips are not too tall for the box height

The lid lip is meant to locate the lid, not to form a sealed mechanical lock.

## Divider Fit

Divider slots depend on thickness and effective kerf.

If dividers are too tight:

- increase kerf
- use loose fit
- increase material thickness only if measured value was wrong
- disable interlock slots and manually adjust if needed

If dividers are too loose:

- decrease kerf
- use tight fit
- verify actual material thickness

## Feature Placement Safety

Before cutting:

- keep holes away from panel edges
- avoid placing holes through finger joints
- keep large cutouts away from corners
- avoid thin strips of material between nearby holes
- check every feature in both SVG and 3D

## Laser Software Checks

When importing SVG:

- verify millimeter scale
- verify line colors
- verify stroke width handling
- map cut, engrave, and mark operations to correct settings
- check whether the laser software interprets filled shapes differently
- run a frame or low-power preview before cutting

## Material Holding

Use appropriate hold-down:

- magnets for steel honeycomb beds
- tape for light material
- weights outside the cutting path
- pins or tabs where safe

Warped material can break finger-joint accuracy.

## Fire and Machine Safety

Never leave a laser cutter unattended. Confirm extraction, air assist, and material safety before cutting.

Do not cut unknown plastics. PVC and some coated materials can release hazardous gases.

## Current Fabrication Limitations

CutCase does not yet provide:

- dogbone reliefs
- full polygon offset kerf compensation
- machine bed packing
- material preset storage
- DXF layers
- automatic joint strength warnings
