(function attachBasicBox(root) {
  "use strict";

  const EDGE_ORDER = ["top", "right", "bottom", "left"];
  const EPSILON = 1e-7;

  function numberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function round(n) {
    return Math.round(n * 1000) / 1000;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function pushPoint(points, point) {
    const next = { x: round(point.x), y: round(point.y) };
    const last = points[points.length - 1];
    if (!last || Math.abs(last.x - next.x) > EPSILON || Math.abs(last.y - next.y) > EPSILON) {
      points.push(next);
    }
  }

  function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  function scale(v, scalar) {
    return { x: v.x * scalar, y: v.y * scalar };
  }

  function getFingerRange(insideDims, thickness) {
    const smallest = Math.min(insideDims.width, insideDims.height, insideDims.depth);
    const min = Math.max(0.5, thickness * 2);
    const max = Math.max(min, smallest / 2);
    return { min, max };
  }

  function oddSegmentCount(length, desiredFingerSize) {
    const safeSize = Math.max(0.5, desiredFingerSize);
    let count = Math.floor(length / safeSize);
    if (count < 1) count = 1;
    if (count % 2 === 0) count -= 1;
    return Math.max(1, count);
  }

  function normalizeConfig(raw) {
    const open = raw.open !== false;
    const thickness = Math.max(0.1, numberOr(raw.thickness, 3));
    const basis = raw.dimensionBasis === "outside" ? "outside" : "inside";
    const fit = ["loose", "standard", "tight"].includes(raw.fit) ? raw.fit : "standard";
    const fitScales = { loose: 0.65, standard: 1, tight: 1.35 };
    const inputDims = {
      width: Math.max(0.1, numberOr(raw.width, 100)),
      height: Math.max(0.1, numberOr(raw.height, 60)),
      depth: Math.max(0.1, numberOr(raw.depth, 80))
    };

    const insideDims = basis === "inside" ? inputDims : {
      width: inputDims.width - 2 * thickness,
      depth: inputDims.depth - 2 * thickness,
      height: inputDims.height - thickness - (open ? 0 : thickness)
    };

    if (insideDims.width <= 0 || insideDims.height <= 0 || insideDims.depth <= 0) {
      throw new Error("Material is too thick for the selected dimensions.");
    }

    const range = getFingerRange(insideDims, thickness);
    const requestedFingerSize = numberOr(raw.fingerSize, thickness * 3);
    const fingerSize = clamp(requestedFingerSize, range.min, range.max);
    const kerf = Math.max(0, numberOr(raw.kerf, 0));
    const effectiveKerf = kerf * fitScales[fit];

    const outsideDims = {
      width: insideDims.width + 2 * thickness,
      depth: insideDims.depth + 2 * thickness,
      height: insideDims.height + thickness + (open ? 0 : thickness)
    };

    return {
      dimensionBasis: basis,
      open,
      thickness,
      kerf,
      effectiveKerf,
      fit,
      fingerSize,
      fingerRange: range,
      inputDims,
      insideDims,
      outsideDims
    };
  }

  function tabFor(edgeType, index) {
    if (edgeType === "A") return index % 2 === 1;
    if (edgeType === "B") return index % 2 === 0;
    return false;
  }

  function pointOnEdge(start, unit, distance) {
    return {
      x: start.x + unit.x * distance,
      y: start.y + unit.y * distance
    };
  }

  function fingerPattern(length, config) {
    let segments = oddSegmentCount(length, config.fingerSize);
    let fingerSize = Math.min(config.fingerSize, length);
    let margin = (length - segments * fingerSize) / 2;

    if (segments > 2 && margin > EPSILON && margin < config.thickness) {
      segments -= 2;
      margin = (length - segments * fingerSize) / 2;
    }

    if (margin < 0) {
      segments = 1;
      fingerSize = length;
      margin = 0;
    }

    return {
      segments,
      fingerSize,
      margin
    };
  }

  function addEdge(points, start, end, edgeType, config, metrics, edgeName) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const unit = { x: dx / length, y: dy / length };
    const outward = { x: dy / length, y: -dx / length };
    const pattern = edgeType === "flat" ? { segments: 1, fingerSize: length, margin: 0 } : fingerPattern(length, config);
    const halfKerf = Math.min(config.effectiveKerf / 2, pattern.fingerSize * 0.45);
    const tabIntervals = [];

    if (edgeType === "A" && pattern.margin > EPSILON) {
      tabIntervals.push([0, pattern.margin]);
      tabIntervals.push([length - pattern.margin, length]);
    }

    if (edgeType !== "flat") {
      for (let i = 0; i < pattern.segments; i += 1) {
        if (!tabFor(edgeType, i)) continue;
        const nominalStart = pattern.margin + pattern.fingerSize * i;
        const nominalEnd = nominalStart + pattern.fingerSize;
        tabIntervals.push([nominalStart, nominalEnd]);
      }
    }

    tabIntervals.sort((a, b) => a[0] - b[0]);

    metrics.edges[edgeName] = {
      type: edgeType,
      length: round(length),
      segments: pattern.segments,
      actualFingerSize: round(pattern.fingerSize),
      margin: round(pattern.margin),
      tabCount: tabIntervals.length
    };

    if (edgeType === "flat") {
      pushPoint(points, end);
      return;
    }

    tabIntervals.forEach(([nominalStart, nominalEnd]) => {
      const tabStart = clamp(nominalStart - halfKerf, 0, length);
      const tabEnd = clamp(nominalEnd + halfKerf, 0, length);
      const baseStart = pointOnEdge(start, unit, tabStart);
      const baseEnd = pointOnEdge(start, unit, tabEnd);
      const outerStart = add(baseStart, scale(outward, config.thickness));
      const outerEnd = add(baseEnd, scale(outward, config.thickness));

      pushPoint(points, baseStart);
      pushPoint(points, outerStart);
      pushPoint(points, outerEnd);
      pushPoint(points, baseEnd);
    });

    pushPoint(points, end);
  }

  function makePanel(name, width, height, edgeTypes, config) {
    const points = [{ x: 0, y: 0 }];
    const metrics = { edges: {} };
    const corners = {
      top: [{ x: 0, y: 0 }, { x: width, y: 0 }],
      right: [{ x: width, y: 0 }, { x: width, y: height }],
      bottom: [{ x: width, y: height }, { x: 0, y: height }],
      left: [{ x: 0, y: height }, { x: 0, y: 0 }]
    };

    EDGE_ORDER.forEach((edgeName) => {
      const [start, end] = corners[edgeName];
      addEdge(points, start, end, edgeTypes[edgeName], config, metrics, edgeName);
    });

    return {
      name,
      baseWidth: width,
      baseHeight: height,
      edgeTypes,
      points,
      metrics
    };
  }

  function getPanelDefinitions(config) {
    const { width: w, height: h, depth: d } = config.insideDims;
    const wallTop = config.open ? "flat" : "A";
    const definitions = [
      {
        name: "front",
        width: w,
        height: h,
        edges: { top: wallTop, right: "B", bottom: "A", left: "B" }
      },
      {
        name: "back",
        width: w,
        height: h,
        edges: { top: wallTop, right: "B", bottom: "A", left: "B" }
      },
      {
        name: "left",
        width: d,
        height: h,
        edges: { top: wallTop, right: "A", bottom: "A", left: "A" }
      },
      {
        name: "right",
        width: d,
        height: h,
        edges: { top: wallTop, right: "A", bottom: "A", left: "A" }
      },
      {
        name: "bottom",
        width: w,
        height: d,
        edges: { top: "B", right: "B", bottom: "B", left: "B" }
      }
    ];

    if (!config.open) {
      definitions.push({
        name: "top",
        width: w,
        height: d,
        edges: { top: "B", right: "B", bottom: "B", left: "B" }
      });
    }

    return definitions;
  }

  function buildPanels(rawConfig) {
    const config = normalizeConfig(rawConfig);
    const definitions = getPanelDefinitions(config);
    const panels = definitions.map((definition) => (
      makePanel(definition.name, definition.width, definition.height, definition.edges, config)
    ));
    return { config, panels };
  }

  function getAssemblyPlacements(config) {
    const { width, height, depth } = config.insideDims;
    const t = config.thickness;
    return {
      front: {
        center: { x: 0, y: 0, z: depth / 2 + t / 2 },
        rightAxis: { x: 1, y: 0, z: 0 },
        upAxis: { x: 0, y: 1, z: 0 },
        outwardAxis: { x: 0, y: 0, z: 1 }
      },
      back: {
        center: { x: 0, y: 0, z: -depth / 2 - t / 2 },
        rightAxis: { x: -1, y: 0, z: 0 },
        upAxis: { x: 0, y: 1, z: 0 },
        outwardAxis: { x: 0, y: 0, z: -1 }
      },
      left: {
        center: { x: -width / 2 - t / 2, y: 0, z: 0 },
        rightAxis: { x: 0, y: 0, z: -1 },
        upAxis: { x: 0, y: 1, z: 0 },
        outwardAxis: { x: -1, y: 0, z: 0 }
      },
      right: {
        center: { x: width / 2 + t / 2, y: 0, z: 0 },
        rightAxis: { x: 0, y: 0, z: 1 },
        upAxis: { x: 0, y: 1, z: 0 },
        outwardAxis: { x: 1, y: 0, z: 0 }
      },
      bottom: {
        center: { x: 0, y: -height / 2 - t / 2, z: 0 },
        rightAxis: { x: 1, y: 0, z: 0 },
        upAxis: { x: 0, y: 0, z: 1 },
        outwardAxis: { x: 0, y: -1, z: 0 }
      },
      top: {
        center: { x: 0, y: height / 2 + t / 2, z: 0 },
        rightAxis: { x: 1, y: 0, z: 0 },
        upAxis: { x: 0, y: 0, z: 1 },
        outwardAxis: { x: 0, y: 1, z: 0 }
      }
    };
  }

  function buildSceneData(rawConfig) {
    const result = buildPanels(rawConfig);
    const placements = getAssemblyPlacements(result.config);
    const panels = result.panels.map((panel) => ({
      ...panel,
      placement: placements[panel.name]
    }));
    return { config: result.config, panels };
  }

  function getBounds(points) {
    return points.reduce((bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y)
    }), {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    });
  }

  function translatePoints(points, dx, dy) {
    return points.map((point) => ({ x: round(point.x + dx), y: round(point.y + dy) }));
  }

  function layoutPanels(panels, config) {
    const gap = Math.max(12, config.thickness * 5);
    const rows = config.open
      ? [["left", "front", "right", "back"], ["bottom"]]
      : [["top"], ["left", "front", "right", "back"], ["bottom"]];
    const byName = Object.fromEntries(panels.map((panel) => [panel.name, panel]));
    const laidOut = [];
    let y = gap;
    let totalWidth = 0;

    rows.forEach((row) => {
      const rowPanels = row.map((name) => byName[name]).filter(Boolean);
      const rowBounds = rowPanels.map((panel) => getBounds(panel.points));
      const rowHeight = Math.max(...rowBounds.map((bounds) => bounds.maxY - bounds.minY));
      let x = gap;

      rowPanels.forEach((panel, index) => {
        const bounds = rowBounds[index];
        const dx = x - bounds.minX;
        const dy = y - bounds.minY;
        const points = translatePoints(panel.points, dx, dy);
        const placedBounds = getBounds(points);
        laidOut.push({
          ...panel,
          points,
          bounds: placedBounds,
          label: {
            x: round((placedBounds.minX + placedBounds.maxX) / 2),
            y: round((placedBounds.minY + placedBounds.maxY) / 2)
          }
        });
        x += bounds.maxX - bounds.minX + gap;
      });

      totalWidth = Math.max(totalWidth, x);
      y += rowHeight + gap;
    });

    return {
      panels: laidOut,
      width: round(totalWidth),
      height: round(y)
    };
  }

  function pointsToPath(points) {
    return points.map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${point.x} ${point.y}`;
    }).join(" ") + " Z";
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildSvg(rawConfig, options = {}) {
    const { config, panels } = buildPanels(rawConfig);
    const layout = layoutPanels(panels, config);
    const showLabels = options.showLabels !== false;
    const cutColor = options.cutColor || "#d11a2a";
    const labelColor = options.labelColor || "#58616f";
    const lineWidth = Math.max(0.01, numberOr(options.lineWidth, 0.1));
    const paths = layout.panels.map((panel) => {
      const label = showLabels
        ? `<text x="${panel.label.x}" y="${panel.label.y}" text-anchor="middle" dominant-baseline="middle" class="label">${escapeXml(panel.name)}</text>`
        : "";
      return `<path class="cut" data-panel="${escapeXml(panel.name)}" d="${pointsToPath(panel.points)}"/>${label}`;
    }).join("");
    const metadata = {
      generator: "basicFingerBox",
      version: 1,
      config: {
        dimensionBasis: config.dimensionBasis,
        open: config.open,
        inputDims: config.inputDims,
        insideDims: config.insideDims,
        outsideDims: config.outsideDims,
        thickness: config.thickness,
        fingerSize: config.fingerSize,
        kerf: config.kerf,
        fit: config.fit
      }
    };

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}mm" height="${layout.height}mm" viewBox="0 0 ${layout.width} ${layout.height}">`,
      `<metadata id="finger-box-config">${escapeXml(JSON.stringify(metadata))}</metadata>`,
      "<style>",
      `.cut{fill:none;stroke:${escapeXml(cutColor)};stroke-width:${lineWidth};vector-effect:non-scaling-stroke}`,
      `.label{font-family:Arial,sans-serif;font-size:5px;fill:${escapeXml(labelColor)}}`,
      "</style>",
      paths,
      "</svg>"
    ].join("");

    return { config, layout, svg };
  }

  function buildKerfTestSvg(rawConfig, options = {}) {
    const baseConfig = normalizeConfig(rawConfig);
    const cutColor = options.cutColor || "#d11a2a";
    const labelColor = options.labelColor || "#58616f";
    const lineWidth = Math.max(0.01, numberOr(options.lineWidth, 0.1));
    const couponWidth = Math.max(baseConfig.fingerSize * 7, baseConfig.thickness * 18, 48);
    const couponHeight = Math.max(baseConfig.thickness * 5, 15);
    const gap = Math.max(baseConfig.thickness * 5, 12);
    const rows = ["loose", "standard", "tight"];
    const panels = [];

    rows.forEach((fit, rowIndex) => {
      const config = normalizeConfig({ ...rawConfig, fit });
      const y = gap + rowIndex * (couponHeight + gap * 1.4);
      const a = makePanel(`${fit} A`, couponWidth, couponHeight, {
        top: "A",
        right: "flat",
        bottom: "flat",
        left: "flat"
      }, config);
      const b = makePanel(`${fit} B`, couponWidth, couponHeight, {
        top: "B",
        right: "flat",
        bottom: "flat",
        left: "flat"
      }, config);
      const aBounds = getBounds(a.points);
      const aPoints = translatePoints(a.points, gap - aBounds.minX, y - aBounds.minY);
      const bBounds = getBounds(b.points);
      const bPoints = translatePoints(b.points, gap * 2 + couponWidth + baseConfig.thickness * 3 - bBounds.minX, y - bBounds.minY);
      panels.push({ name: `${fit} A`, fit, points: aPoints, bounds: getBounds(aPoints) });
      panels.push({ name: `${fit} B`, fit, points: bPoints, bounds: getBounds(bPoints) });
    });

    const width = round(couponWidth * 2 + gap * 3 + baseConfig.thickness * 3);
    const height = round(rows.length * couponHeight + gap * 5);
    const paths = panels.map((panel) => (
      `<path class="cut" data-coupon="${escapeXml(panel.name)}" d="${pointsToPath(panel.points)}"/>` +
      `<text x="${round((panel.bounds.minX + panel.bounds.maxX) / 2)}" y="${round((panel.bounds.minY + panel.bounds.maxY) / 2)}" text-anchor="middle" dominant-baseline="middle" class="label">${escapeXml(panel.name)}</text>`
    )).join("");

    const notes = rows.map((fit, index) => {
      const config = normalizeConfig({ ...rawConfig, fit });
      return `<text x="${gap}" y="${round(height - gap + index * 4.5)}" class="note">${escapeXml(`${fit}: effective kerf ${round(config.effectiveKerf)} mm`)}</text>`;
    }).join("");

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">`,
      `<metadata id="finger-box-fit-test">${escapeXml(JSON.stringify({ generator: "fingerFitTest", version: 1, config: rawConfig }))}</metadata>`,
      "<style>",
      `.cut{fill:none;stroke:${escapeXml(cutColor)};stroke-width:${lineWidth};vector-effect:non-scaling-stroke}`,
      `.label{font-family:Arial,sans-serif;font-size:4.5px;fill:${escapeXml(labelColor)}}`,
      ".note{font-family:Arial,sans-serif;font-size:3.2px;fill:#65717a}",
      "</style>",
      paths,
      notes,
      "</svg>"
    ].join("");

    return { config: baseConfig, panels, svg };
  }

  const api = {
    buildSceneData,
    buildPanels,
    buildKerfTestSvg,
    buildSvg,
    fingerPattern,
    getBounds,
    getAssemblyPlacements,
    getFingerRange,
    layoutPanels,
    normalizeConfig,
    oddSegmentCount,
    pointsToPath
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BasicBox = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
