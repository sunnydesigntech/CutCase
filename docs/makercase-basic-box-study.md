# MakerCase Basic Box Study

## What MakerCase Optimizes For

MakerCase is built around a simple loop: enter dimensions and material thickness, preview a 3D box, flatten it into 2D panels, then export a laser/CNC-ready file. Jon Hollander describes it as a single-page application that generates laser-cut designs from user specs, creates an interactive 3D model, flattens the model into a blueprint, exports SVG, and supports beam-width compensation. Source: https://jonhollander.me/projects/makercase/

Other fabrication guides describe the same user flow: choose units, set inside or outside dimensions, enter material thickness, select Finger joints, choose tab width, generate plans, set kerf, then download. Source: https://wikifab.org/wiki/Design_for_lasercut_with_Makercase

DMaF Lab summarizes current MakerCase capability as box or polygon design, flat or interlocking/finger edges, open or closed boxes, SVG/DXF export, kerf adjustment, and dogbone fillets for CNC. Source: https://www.dmaf-lab.com/resources/free-parametric-box-generator-for-laser-cutting

Makeabox documents a similar design choice: tab width is an approximate guide, and the generator intentionally creates a symmetric tab layout instead of blindly using the requested width exactly. Source: https://makeabox.io/

Boxes.py documents "burn correction" as a core laser-cutting concern and provides a BurnTest generator because the correct burn/kerf value depends on the actual cutter, material, and thickness. Source: https://florianfesti.github.io/boxes/html/usermanual.html

Ponoko's laser-cutting help confirms that vector lines are cut on their centerline, dimensional accuracy and kerf vary by material, and average kerf is only a starting point. Source: https://help.ponoko.com/en/articles/3149752-how-does-laser-cutting-work

The current live app is a Vite/React/WebGL application. Its loaded chunks include separate generators for Basic Box, Divider Box, Poly Box, Kerf Box, Laser Flex Box, Laser Slide Box, and Basic 3D Box. In the current bundle, the basic box follows this pipeline:

1. Store canonical inside dimensions, material, open/closed state, edge type, and finger size.
2. Convert outside dimensions to inside dimensions when the user chooses outside mode.
3. Generate 2D panel outlines from base rectangles plus finger rectangles.
4. Extrude those 2D panels by material thickness for the 3D preview.
5. Export the 2D panel outlines to SVG/DXF with optional labels, line formatting, kerf, or dogbones.

## Deeper Live-App Observations

The current app's basic box path is built around reusable edge functions rather than a one-off "box" drawing routine. The minified app exposes a `basicBox` generator state with `boxInsideDims`, `material`, `inside`, `open`, `boxType`, `edgeParams`, and `renderable: [SVG, THREE]`. The generator then dispatches by edge type:

- Flat box: panels are plain rectangles.
- Finger box: panels are rectangles plus alternating finger rectangles.
- T-slot box: panels use related alternating edges plus bolt/nut geometry.

The finger-box panel map in the live code is:

- `front` and `back`: `fingerA, fingerB, topEdge, fingerB`
- `left` and `right`: `fingerA, fingerA, topEdge, fingerA`
- `bottom`: all `fingerB`
- `top`, when closed: all `fingerB`

Where `topEdge` is `flat` for an open box and `fingerA` for a closed box. This starter follows that same map.

The live edge algorithm also does several subtle things worth copying over time:

- It chooses an odd segment count so A/B parity remains complementary.
- It centers the finger sequence with equal leftover margin where possible.
- If the leftover edge margin is positive but smaller than the material thickness, it reduces the finger count by two to avoid tiny weak end slivers.
- It adds small corner filler rectangles when two adjacent odd edges would otherwise leave a corner gap.
- It represents panel outlines as polygon boolean operations: start with a rectangle, union protruding tabs, then subtract internal features where needed.

This starter implements the odd segment rule, A/B parity, centered leftover margins, and the "drop two fingers when the end margin would be thinner than the material" rule. Corner filler geometry is still intentionally deferred until a polygon boolean library is added.

## Basic Box Geometry

Use inside dimensions as the canonical model:

- `W`: inside width
- `D`: inside depth
- `H`: inside height
- `T`: material thickness

Outside dimensions are derived:

- Open box: `outsideWidth = W + 2T`, `outsideDepth = D + 2T`, `outsideHeight = H + T`
- Closed box: `outsideWidth = W + 2T`, `outsideDepth = D + 2T`, `outsideHeight = H + 2T`

This is important. An open box has no lid thickness at the top, so only the bottom panel adds height. A closed box has bottom and top panels.

The starter follows the same basic panel sizing:

- Front/back base panels: `W x H`
- Left/right base panels: `D x H`
- Bottom panel: `W x D`
- Top panel, only when closed: `W x D`

Finger tabs protrude outward from these base rectangles by `T`. The complementary edge does not need inward cutouts in this basic model. Instead, one edge uses A parity and the mating edge uses B parity:

- A edge: tabs on odd finger segments
- B edge: tabs on even finger segments

With an odd segment count, A and B remain complementary even when opposing panel paths are traversed in opposite directions.

## Edge Pattern

For edge order `top, right, bottom, left`, the closed-box pattern is:

- Front/back: `A, B, A, B`
- Left/right: `A, A, A, A`
- Bottom/top: `B, B, B, B`

For an open-top box, the side panels' top edge becomes flat and the top panel is omitted:

- Front/back: `flat, B, A, B`
- Left/right: `flat, A, A, A`
- Bottom: `B, B, B, B`

This gives every shared edge one A side and one B side.

## Finger Size

MakerCase clamps finger size from roughly `2 * materialThickness` up to half of the smallest inside dimension. The starter uses the same rule of thumb. It then uses an odd number of segments per edge:

```text
segmentCount = floor(edgeLength / desiredFingerSize)
if segmentCount is even, subtract 1
segmentCount must be at least 1
actualFingerSize = edgeLength / segmentCount
```

The actual finger width may differ slightly from the requested width so the pattern fills the full edge cleanly.

## Kerf Model

Kerf is the material removed by the cutter. Wikifab calls it one of the most important settings and notes it depends on laser, lens, material, and thickness. Source: https://wikifab.org/wiki/Design_for_lasercut_with_Makercase

MakerCase's own kerf calibration guide recommends cutting a known-size test square, measuring the actual part, and using the difference as kerf. It also notes that the entered compensation is half the laser beam width because the beam travels along the line center. Source: https://www.makercase.com/markdown/kerf-calibrate.md

The starter implements a basic press-fit allowance: each tab is widened in the drawing by half the effective kerf on each side. The new `Fit` control scales that kerf for fast iteration:

- Loose: `kerf * 0.65`
- Standard: `kerf * 1.0`
- Tight: `kerf * 1.35`

A production system should replace this with true polygon offsets:

- Offset outside panel contours outward by `kerf / 2`.
- Offset internal cutouts inward by `kerf / 2`.
- Use a robust polygon clipping library for intersections and corner joins.
- Add dogbone fillets for CNC when the cutter is round.

The practical workflow should be:

1. Cut the fit-test coupon on scrap from the same sheet.
2. Try the loose, standard, and tight pairings.
3. Update kerf or fit mode before cutting the full box.
4. Re-test whenever changing material, thickness, lens, speed, power, or focus.

## Export Model

MakerCase's download options include panel labels, panel layout, line width, outside cut color, inside cut color, kerf compensation, and router-bit corner compensation. It also supports a combined panel layout that merges overlapping lines to reduce cutting time and material use. Source: https://www.makercase.com/markdown/download.md

The starter now includes the first slice of that export model:

- Optional panel labels
- Configurable cut color
- Configurable label color
- Configurable stroke width
- SVG export from the same layout shown on screen
- Embedded SVG metadata containing normalized box dimensions and fabrication settings
- A separate fit-test coupon SVG for loose, standard, and tight kerf multipliers

Missing export features:

- DXF export
- inside cut color for holes and internal features
- compact/combined panel packing
- machine bed or stock size constraints
- reading embedded design-state metadata back from SVG/DXF

## 3D Preview Model

The first prototype used a simple 2D canvas isometric sketch. The advanced version uses Three.js:

- The same 2D panel polygons are extruded by material thickness.
- Each panel is placed with a face basis: right axis, up axis, and outward axis.
- Orbit controls provide drag rotation and scroll zoom.
- An `Explode` slider moves each panel along its outward normal so the join logic can be inspected.
- Edge outlines are rendered with `EdgesGeometry` so fingers remain visible.
- Labels are rendered as sprites and can be toggled.

This matters architecturally because the 3D preview is now an adapter over the geometry model. If the SVG outline improves, the 3D preview improves at the same time.

## System Design

The clean architecture is:

1. `BoxConfig`: user inputs, units, dimension basis, material, open/closed, finger size, kerf.
2. `DimensionNormalizer`: converts all inputs into canonical millimeter inside dimensions.
3. `PanelGenerator`: creates named panels with base size, edge pattern, and polygon points.
4. `LayoutEngine`: places panels onto a sheet with spacing and bounding boxes.
5. `PreviewAdapters`: 2D SVG preview and simple 3D/isometric preview.
6. `ExportAdapters`: SVG first, DXF later, STL/3MF only for 3D-print-specific generators.
7. `ManufacturingAdapters`: kerf offset, dogbone generation, line colors, labels, machine bed packing.

The prototype in this workspace implements steps 1 through 5 plus SVG download.

## Next Fidelity Upgrades

1. Add centered finger margins and the "drop two fingers when end margin is too small" rule.
2. Add corner filler geometry for adjacent protruding edges.
3. Replace tab-only kerf fitting with full polygon offsetting.
4. Add dogbone/corner-compensation geometry for CNC routing.
5. Add DXF export with separate inside/outside layers.
6. Add compact layout and machine bed constraints.
7. Add a persisted design JSON block inside SVG metadata so files can be reopened and edited.
