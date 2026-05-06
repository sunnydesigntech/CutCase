# CutCase Wiki

CutCase is a browser-based laser-cut finger-joint box designer. It generates a production SVG layout and a rotatable 3D assembly preview from the same geometry model, so the flat cut sheet and the assembled box stay aligned.

## Live App

https://sunnydesigntech.github.io/CutCase/

## Repository

https://github.com/sunnydesigntech/CutCase

## What CutCase Builds

CutCase currently creates:

- open-top finger-joint boxes
- closed finger-joint boxes
- lift-off lids with top plate and inner lip strips
- front-back and left-right divider grids
- round drill holes
- horizontal slots
- rectangular panel cutouts
- cut, engrave, and mark operations
- kerf fit-test coupons
- SVG exports with embedded design metadata

## Main Wiki Pages

- [[Getting Started]]
- [[Interface Guide]]
- [[Features]]
- [[Geometry Model]]
- [[SVG Export]]
- [[Fabrication Notes]]
- [[Development]]
- [[Troubleshooting]]
- [[FAQ]]
- [[Roadmap]]

## Recommended First Workflow

1. Open the live app.
2. Enter measured material thickness.
3. Enter inside box dimensions.
4. Keep the top open for a first test box.
5. Set a conservative finger width, such as three times the material thickness.
6. Export and cut the fit-test coupon.
7. Tune kerf or fit mode.
8. Export the full SVG.
9. Cut the box from the same material used for the fit test.

## Design Philosophy

CutCase prioritizes:

- a simple browser-first workflow
- geometry that can be inspected in both 2D and 3D
- explicit fabrication settings
- readable SVG output
- small, understandable source files
- direct `file://` support
- GitHub Pages deployment without a server backend

## Current Technical Status

The current implementation is a static web app:

- `index.html` for the application shell
- `styles.css` for the workbench interface
- `app.js` for browser state and UI events
- `box-model.js` for geometry, panel generation, and SVG export
- `preview3d.js` for the Three.js preview
- `preview3d.bundle.js` for direct browser loading
- `test.js` for geometry checks
- `verify-ui.mjs` for browser verification

## Important Fabrication Note

Do not assume the default kerf will fit your material. Laser kerf depends on the machine, material, focus, speed, power, lens, and environmental conditions. Always cut a fit-test coupon before cutting a full design.
