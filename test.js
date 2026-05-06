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
assert.strictEqual((svg.match(/class="cut panel-outline"/g) || []).length, 6);

const holeSvgResult = box.buildSvg({
  dimensionBasis: "inside",
  open: true,
  width: 100,
  height: 60,
  depth: 80,
  thickness: 3,
  fingerSize: 9,
  kerf: 0.1
}, {
  features: [{
    id: "hole-1",
    type: "drill-hole",
    panel: "front",
    x: 42,
    y: 18,
    diameter: 5,
    operation: "cut"
  }]
});

assert.strictEqual(holeSvgResult.features.length, 1);
assert.strictEqual(holeSvgResult.features[0].panel, "front");
assert.match(holeSvgResult.svg, /data-feature-id="hole-1"/);
assert.match(holeSvgResult.svg, /<circle class="cut feature feature-cut"/);
assert.match(holeSvgResult.svg, /&quot;features&quot;:\[/);

const shapeSvgResult = box.buildSvg({
  dimensionBasis: "inside",
  open: true,
  width: 100,
  height: 60,
  depth: 80,
  thickness: 3,
  fingerSize: 9,
  kerf: 0.1
}, {
  features: [
    {
      id: "slot-1",
      type: "slot",
      panel: "front",
      x: 50,
      y: 30,
      width: 18,
      height: 6,
      operation: "cut"
    },
    {
      id: "rect-1",
      type: "rectangle",
      panel: "right",
      x: 30,
      y: 25,
      width: 14,
      height: 10,
      operation: "engrave"
    }
  ]
});

assert.strictEqual(shapeSvgResult.features.length, 2);
assert.strictEqual(shapeSvgResult.features[0].type, "slot");
assert.strictEqual(shapeSvgResult.features[0].width, 18);
assert.match(shapeSvgResult.svg, /data-feature-type="slot"/);
assert.match(shapeSvgResult.svg, /data-feature-type="rectangle"/);
assert.match(shapeSvgResult.svg, /<rect class="engrave feature feature-engrave"/);

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
