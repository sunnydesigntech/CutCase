# SVG Export

CutCase exports the same panel layout shown in the cut-layout preview.

## Export Button

`Download SVG` exports the current full design.

The SVG includes:

- base box panels
- closed top panel when enabled
- lift-off lid parts when enabled
- divider panels when enabled
- panel features
- optional panel labels
- embedded metadata

## Fit-Test Export

`Fit Test` exports a separate calibration SVG.

It contains:

- loose coupon pair
- standard coupon pair
- tight coupon pair
- text notes showing effective kerf

Use this before cutting the full box.

## SVG Classes

CutCase uses classes to distinguish operations.

Common classes:

```text
cut
engrave
mark
panel-outline
feature
feature-cut
feature-engrave
feature-mark
label
```

## Cut Geometry

Cut paths use:

```svg
class="cut"
```

Panel outlines use:

```svg
class="cut panel-outline"
```

## Feature Geometry

Round holes export as circles.

Slots export as paths.

Rectangles export as rect elements.

Feature elements include data attributes:

```svg
data-feature-id="..."
data-feature-type="slot"
data-panel="front"
data-operation="cut"
```

## Metadata

The SVG contains a metadata block:

```xml
<metadata id="finger-box-config">...</metadata>
```

The metadata includes:

- generator name
- version
- normalized dimensions
- material thickness
- kerf
- fit mode
- lid settings
- divider settings
- panel list
- feature list

This makes the SVG self-describing and prepares the project for future reopen/import support.

## Line Color

The export settings allow:

- cut color
- label color
- line width

Many laser workflows use color mapping. Check your laser software's expected colors before cutting.

## Scale

The SVG uses millimeter units:

```svg
width="...mm"
height="...mm"
viewBox="..."
```

After import, verify that a known dimension in the laser software matches the expected millimeter size.

## Known Export Limitations

The current SVG export does not yet include:

- DXF output
- separate named laser layers
- automatic sheet packing
- line merging
- reopen/import from metadata
- material presets

## Recommended Export Checklist

1. Run fit test first.
2. Verify dimensions in the production summary.
3. Check panel count.
4. Check lid/divider parts in SVG.
5. Check custom features.
6. Export SVG.
7. Import into laser software.
8. Verify scale.
9. Map colors/operations.
10. Run machine preview or frame.
