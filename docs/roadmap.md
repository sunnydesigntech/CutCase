# Roadmap

CutCase is currently a working static app for finger-joint boxes, lids, dividers, editable panel features, SVG export, and 3D preview. The roadmap below keeps the next engineering work focused.

## Near Term

- Add undo/redo for panel feature edits.
- Add drag-to-move features in the SVG layout.
- Add snap-to-center and snap-to-edge placement helpers.
- Add mirror feature to opposite panel.
- Add repeated feature patterns, such as evenly spaced mounting holes.
- Add finger-joint-aware feature clearance warnings.
- Improve lid assembly options, including slide lids and hinged lids.

## Fabrication Accuracy

- Replace simple kerf widening with robust polygon offsets.
- Add dogbone reliefs for CNC/router workflows.
- Add separate inside-cut and outside-cut line colors.
- Add machine-bed size and stock-size constraints.
- Add compact sheet packing and line-merging.
- Add import/reopen from SVG metadata.

## Export Formats

- Add DXF export.
- Add design JSON export/import.
- Add layered SVG export profiles for common laser workflows.
- Add material presets with saved kerf values.

## 3D Preview

- Add face-click feature placement through Three.js raycasting.
- Show measurement overlays in 3D.
- Add exploded add-on groups for lid and divider inspection.
- Add transparency mode for inspecting internal divider grids.

## Project Infrastructure

- Add issue templates.
- Add release notes for tagged versions.
- Add screenshot assets for README and wiki.
- Add more browser regression coverage for mobile layout and add-on controls.
