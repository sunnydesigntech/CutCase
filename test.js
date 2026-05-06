const assert = require("assert");
const box = require("./box-model.js");

function byName(panels, name) {
  return panels.find((panel) => panel.name === name);
}

const openResult = box.buildPanels({
  dimensionBasis: "inside",
  open: true,
  width: 100,
  height: 60,
  depth: 80,
  thickness: 3,
  fingerSize: 9,
  kerf: 0.1,
  fit: "standard"
});

assert.strictEqual(openResult.panels.length, 5, "open box should omit the top panel");
assert.deepStrictEqual(openResult.config.outsideDims, {
  width: 106,
  depth: 86,
  height: 63
});
assert.strictEqual(byName(openResult.panels, "front").edgeTypes.top, "flat");
assert.strictEqual(byName(openResult.panels, "bottom").edgeTypes.top, "B");
assert.strictEqual(openResult.config.effectiveKerf, 0.1);

const closedResult = box.buildPanels({
  dimensionBasis: "outside",
  open: false,
  width: 106,
  height: 66,
  depth: 86,
  thickness: 3,
  fingerSize: 9,
  kerf: 0.1,
  fit: "tight"
});

assert.strictEqual(closedResult.panels.length, 6, "closed box should include the top panel");
assert.deepStrictEqual(closedResult.config.insideDims, {
  width: 100,
  depth: 80,
  height: 60
});
assert.strictEqual(closedResult.config.effectiveKerf, 0.135);
assert.strictEqual(byName(closedResult.panels, "top").edgeTypes.left, "B");

const front = byName(closedResult.panels, "front");
const bottom = byName(closedResult.panels, "bottom");
assert.strictEqual(front.metrics.edges.bottom.segments, bottom.metrics.edges.top.segments);
assert.notStrictEqual(front.edgeTypes.bottom, bottom.edgeTypes.top);
assert.strictEqual(front.metrics.edges.bottom.segments, 9);
assert.strictEqual(front.metrics.edges.bottom.margin, 9.5);

const svg = box.buildSvg({
  dimensionBasis: "inside",
  open: false,
  width: 100,
  height: 60,
  depth: 80,
  thickness: 3,
  fingerSize: 9,
  kerf: 0.1
}).svg;

assert.match(svg, /<svg /);
assert.match(svg, /finger-box-config/);
assert.strictEqual((svg.match(/class="cut"/g) || []).length, 6);

const scene = box.buildSceneData({
  dimensionBasis: "inside",
  open: false,
  width: 100,
  height: 60,
  depth: 80,
  thickness: 3,
  fingerSize: 9,
  kerf: 0.1
});
assert.strictEqual(byName(scene.panels, "front").placement.outwardAxis.z, 1);
assert.strictEqual(byName(scene.panels, "bottom").placement.outwardAxis.y, -1);

const fitTest = box.buildKerfTestSvg({
  dimensionBasis: "inside",
  open: true,
  width: 100,
  height: 60,
  depth: 80,
  thickness: 3,
  fingerSize: 9,
  kerf: 0.1
}).svg;
assert.match(fitTest, /finger-box-fit-test/);
assert.strictEqual((fitTest.match(/class="cut"/g) || []).length, 6);

console.log("All geometry checks passed.");
