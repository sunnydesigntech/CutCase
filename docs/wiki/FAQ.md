# FAQ

## Is CutCase a MakerCase clone?

CutCase is inspired by the broad workflow of browser-based box generators: enter dimensions, preview the box, and export SVG. It is a separate implementation with its own feature editor, lid/divider add-ons, and repo structure.

## Does CutCase run offline?

Yes, after dependencies are installed and `preview3d.bundle.js` exists, `index.html` can be opened directly. The hosted version also runs as a static GitHub Pages site.

## Does it require a backend?

No. CutCase is a static frontend app.

## What units does CutCase use?

Millimeters.

## Can it export DXF?

Not yet. SVG export is currently supported.

## Can I reopen an exported SVG and keep editing?

Not yet. The SVG includes embedded metadata to support this in the future, but import/reopen is not implemented.

## Can I place holes directly on the 3D model?

Not yet. Current feature placement is in the 2D SVG layout. 3D face-click placement is on the roadmap.

## Are divider positions adjustable?

Currently, divider positions are evenly spaced. Variable divider positions are on the roadmap.

## Does CutCase compensate kerf perfectly?

No. The current kerf model is simple and useful for fit iteration. A full polygon offset engine is planned.

## Can I use it for CNC routing?

The SVG can be used as vector geometry, but dogbone reliefs and router-specific corner compensation are not implemented yet. Laser cutting is the primary target for the current version.

## Why does finger width change slightly?

CutCase treats finger width as a target. It adjusts the actual segment pattern to keep an odd number of segments and centered margins.

## Why should I cut a fit test?

Material thickness and kerf vary. A fit test reduces wasted material and catches joint fit problems before the full cut.

## What browsers are supported?

Modern browsers with WebGL support should work. The automated verifier uses Google Chrome.

## Why is `preview3d.bundle.js` committed?

It keeps the app usable from a direct `file://` URL without requiring a dev server or module import map.

## Can I host CutCase elsewhere?

Yes. It is a static site. Any static host can serve the built `dist/` folder.

## Where should bugs be reported?

Use GitHub Issues:

https://github.com/sunnydesigntech/CutCase/issues
