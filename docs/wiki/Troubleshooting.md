# Troubleshooting

This page lists common CutCase problems and practical fixes.

## 3D Preview Is Blank

Check:

1. Refresh the page.
2. Confirm `preview3d.bundle.js` exists.
3. If running locally, run `npm run build`.
4. Open the browser console and check for script errors.
5. Try the hosted app to separate local file issues from app bugs.

For direct `file://` use, CutCase depends on the committed bundled preview file.

## 3D Preview Does Not Update

Check:

- whether the page is using an old cached bundle
- whether `preview3d.bundle.js` was rebuilt after editing `preview3d.js`
- whether the browser console has errors

Hard refresh the page after deployment.

## Feature Appears in SVG but Not in 3D

Cut features should cut through the 3D mesh.

Engrave and mark features should show as 3D surface overlays.

If not:

1. select the feature in the feature list
2. confirm its operation
3. check that it is inside the panel
4. refresh after rebuilding the bundle

## Feature Is Moved or Clamped

CutCase clamps feature positions to keep them inside the panel. If a feature is too large for its panel, its position may shift.

Fix:

- reduce feature size
- choose a larger panel
- move the feature farther from the edge

## Lid Does Not Appear

The lift-off lid is available for open-top boxes. When `Lid` is enabled, CutCase forces open-top behavior.

Check:

- `Lift-off lid` is enabled
- the SVG layout includes `lid top`
- the 3D preview is refreshed

## Divider Slots Are Too Tight

Try:

- increase kerf
- use loose fit mode
- verify material thickness
- disable interlock slots

## Divider Slots Are Too Loose

Try:

- decrease kerf
- use tight fit mode
- verify material thickness

## Export Imports at Wrong Size

Check in laser software:

- SVG import units are millimeters
- scale is 100 percent
- viewBox is interpreted correctly
- no automatic DPI scaling is applied

Use a known panel dimension to confirm scale.

## GitHub Pages Shows Old Version

GitHub Pages and browser caches can lag.

Try:

- hard refresh
- add a query string such as `?v=latest`
- wait a few minutes after deployment
- check the Actions deploy status

## Local Server Port Is Busy

The default server uses port `5173`.

If busy, use another static server, for example:

```sh
python3 -m http.server 5174
```

Then open:

```text
http://localhost:5174
```

## Browser Verification Fails

Run:

```sh
npm test
npm run build
TARGET_URL=file:///Users/wcchun/Documents/makercase/index.html npm run verify:ui
```

If Chrome is in a different location, set:

```sh
CHROME_PATH=/path/to/Google\ Chrome npm run verify:ui
```
