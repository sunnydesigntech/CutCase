# Geometry Model

This page documents how CutCase thinks about box geometry.

## Canonical Dimensions

CutCase uses inside dimensions internally:

- `W`: inside width
- `D`: inside depth
- `H`: inside height
- `T`: material thickness

If the user enters outside dimensions, the app converts those values to inside dimensions before panel generation.

## Outside Dimensions

Open box:

```text
outsideWidth  = W + 2T
outsideDepth  = D + 2T
outsideHeight = H + T
```

Closed box:

```text
outsideWidth  = W + 2T
outsideDepth  = D + 2T
outsideHeight = H + 2T
```

The open box only adds bottom thickness vertically. The closed box adds bottom and top thickness.

## Base Panels

Panel base sizes:

| Panel | Size |
| --- | --- |
| front | `W x H` |
| back | `W x H` |
| left | `D x H` |
| right | `D x H` |
| bottom | `W x D` |
| top | `W x D` |

The top panel exists only when the box is closed.

## Edge Types

CutCase uses three edge types:

- `A`
- `B`
- `flat`

A and B are complementary finger patterns. Flat edges do not add tabs.

## Open Box Edge Map

For an open box:

| Panel | Top | Right | Bottom | Left |
| --- | --- | --- | --- | --- |
| front | flat | B | A | B |
| back | flat | B | A | B |
| left | flat | A | A | A |
| right | flat | A | A | A |
| bottom | B | B | B | B |

## Closed Box Edge Map

For a closed box:

| Panel | Top | Right | Bottom | Left |
| --- | --- | --- | --- | --- |
| front | A | B | A | B |
| back | A | B | A | B |
| left | A | A | A | A |
| right | A | A | A | A |
| bottom | B | B | B | B |
| top | B | B | B | B |

## Finger Pattern

The finger pattern is generated from:

- edge length
- target finger width
- material thickness
- effective kerf

The segment count is adjusted:

1. Start with `floor(edgeLength / desiredFingerWidth)`.
2. If the count is even, subtract one.
3. Ensure at least one segment.
4. Center the remaining margin.
5. If a small end margin would be weaker than material thickness, reduce count by two when possible.

## A and B Parity

Tabs appear on alternating segments:

- A: odd segments
- B: even segments

Using an odd segment count keeps A and B complementary along mating edges.

## Kerf Model

CutCase currently applies a simple effective-kerf model to tab widths.

Effective kerf:

```text
effectiveKerf = kerf * fitScale
```

Fit scales:

| Fit | Scale |
| --- | --- |
| loose | 0.65 |
| standard | 1.0 |
| tight | 1.35 |

This is useful for fast iteration, but it is not a full polygon offset engine.

## Lid Geometry

A lift-off lid adds five generated parts:

- lid top
- lid front lip
- lid back lip
- lid left lip
- lid right lip

The lid top size:

```text
lidWidth = W + 2T + 2 * overhang
lidDepth = D + 2T + 2 * overhang
```

The lip strips sit inside the box footprint and are reduced by clearance.

## Divider Geometry

Divider positions are evenly distributed across the inside box span.

For `N` dividers:

```text
position(i) = length * i / (N + 1)
```

Front-back dividers:

- span the inside depth
- stand vertically
- are placed across the width

Left-right dividers:

- span the inside width
- stand vertically
- are placed across the depth

## Divider Interlock Slots

When enabled, crossing dividers receive half-depth slots.

Slot width:

```text
slotWidth = materialThickness + effectiveKerf
```

Slot depth is approximately half the divider height.

The goal is to let divider panels slide into each other in a grid.

## Panel Features

Features are normalized against the selected panel.

Each feature has:

- stable id
- type
- panel name
- local x/y position
- shape dimensions
- operation
- warnings

Feature coordinates are clamped so the shape remains inside the panel bounding area.

## SVG Layout

Panel polygons are generated in local coordinates, then placed onto the sheet layout with a row-based layout engine.

Each laid-out panel receives:

- translated polygon points
- bounds
- origin
- label location

The same normalized panel list drives SVG export and feature hit testing.

## 3D Placement

Each panel receives a 3D placement basis:

- center
- right axis
- up axis
- outward axis

The Three.js preview extrudes the 2D panel polygon by material thickness and applies the placement matrix.

## Current Geometry Limitations

- no full polygon boolean engine
- no full contour offsetting
- no dogbone generation
- no DXF output
- no automatic nesting
- no collision detection between arbitrary features and finger joints
