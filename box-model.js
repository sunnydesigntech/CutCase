(function attachBasicBox(root) {
  "use strict";

  const EDGE_ORDER = ["top", "right", "bottom", "left"];
  const FEATURE_TYPES = ["drill-hole", "slot", "rectangle"];
  const FEATURE_OPERATIONS = ["cut", "engrave", "mark"];
  const EPSILON = 1e-7;

  function numberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function integerOr(value, fallback) {
    const n = parseInt(value, 10);
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
    const dividerXCount = clamp(integerOr(raw.dividerXCount, 0), 0, 8);
    const dividerYCount = clamp(integerOr(raw.dividerYCount, 0), 0, 8);
    const dividerSlots = raw.dividerSlots !== false;
    const lidEnabled = open && raw.lidEnabled === true;
    const lidOverhang = clamp(numberOr(raw.lidOverhang, thickness), 0, Math.max(inputDims.width, inputDims.depth));
    const lidLipHeight = clamp(numberOr(raw.lidLipHeight, Math.max(thickness * 2.5, 8)), thickness, Math.max(thickness, insideDims.height));
    const lidClearance = clamp(numberOr(raw.lidClearance, Math.max(kerf * 2, 0.3)), 0, Math.min(insideDims.width, insideDims.depth) / 4);

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
      lidEnabled,
      lidOverhang,
      lidLipHeight,
      lidClearance,
      dividerXCount,
      dividerYCount,
      dividerSlots,
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

  function makePanel(name, width, height, edgeTypes, config, meta = {}) {
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
      kind: meta.kind || "box",
      baseWidth: width,
      baseHeight: height,
      edgeTypes,
      points,
      metrics,
      placement: meta.placement || null
    };
  }

  function slotIntervals(positions, slotWidth, panelWidth) {
    return positions.map((position) => ({
      x1: round(clamp(position - slotWidth / 2, 0, panelWidth)),
      x2: round(clamp(position + slotWidth / 2, 0, panelWidth))
    })).filter((slot) => slot.x2 - slot.x1 > EPSILON);
  }

  function makeDividerPanel(name, width, height, config, topSlotPositions, bottomSlotPositions, placement) {
    const slotWidth = Math.max(0.2, config.thickness + config.effectiveKerf);
    const slotDepth = clamp(height / 2 + config.effectiveKerf / 2, config.thickness, Math.max(config.thickness, height - config.thickness * 0.5));
    const topSlots = config.dividerSlots ? slotIntervals(topSlotPositions, slotWidth, width) : [];
    const bottomSlots = config.dividerSlots ? slotIntervals(bottomSlotPositions, slotWidth, width) : [];
    const points = [];

    pushPoint(points, { x: 0, y: 0 });
    topSlots.forEach((slot) => {
      pushPoint(points, { x: slot.x1, y: 0 });
      pushPoint(points, { x: slot.x1, y: slotDepth });
      pushPoint(points, { x: slot.x2, y: slotDepth });
      pushPoint(points, { x: slot.x2, y: 0 });
    });
    pushPoint(points, { x: width, y: 0 });
    pushPoint(points, { x: width, y: height });

    bottomSlots.slice().reverse().forEach((slot) => {
      pushPoint(points, { x: slot.x2, y: height });
      pushPoint(points, { x: slot.x2, y: height - slotDepth });
      pushPoint(points, { x: slot.x1, y: height - slotDepth });
      pushPoint(points, { x: slot.x1, y: height });
    });

    pushPoint(points, { x: 0, y: height });
    pushPoint(points, { x: 0, y: 0 });

    return {
      name,
      kind: "divider",
      baseWidth: width,
      baseHeight: height,
      edgeTypes: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
      points,
      metrics: {
        edges: {
          top: { type: "flat", length: round(width), segments: 1, actualFingerSize: round(width), margin: 0, tabCount: 0 },
          right: { type: "flat", length: round(height), segments: 1, actualFingerSize: round(height), margin: 0, tabCount: 0 },
          bottom: { type: "flat", length: round(width), segments: 1, actualFingerSize: round(width), margin: 0, tabCount: 0 },
          left: { type: "flat", length: round(height), segments: 1, actualFingerSize: round(height), margin: 0, tabCount: 0 }
        },
        slotWidth: round(slotWidth),
        slotDepth: round(slotDepth)
      },
      placement
    };
  }

  function dividerPositions(length, count) {
    const positions = [];
    for (let i = 1; i <= count; i += 1) {
      positions.push(round((length * i) / (count + 1)));
    }
    return positions;
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

    if (config.lidEnabled) {
      const lidWidth = w + config.thickness * 2 + config.lidOverhang * 2;
      const lidDepth = d + config.thickness * 2 + config.lidOverhang * 2;
      const lipWidth = Math.max(config.thickness, w - config.lidClearance * 2);
      const lipDepth = Math.max(config.thickness, d - config.lidClearance * 2 - config.thickness * 2);
      const lift = config.thickness * 2.2;
      definitions.push(
        {
          name: "lid top",
          kind: "lid",
          width: lidWidth,
          height: lidDepth,
          edges: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
          placement: {
            center: { x: 0, y: h / 2 + config.thickness / 2 + lift, z: 0 },
            rightAxis: { x: 1, y: 0, z: 0 },
            upAxis: { x: 0, y: 0, z: 1 },
            outwardAxis: { x: 0, y: 1, z: 0 }
          }
        },
        {
          name: "lid front lip",
          kind: "lid-lip",
          width: lipWidth,
          height: config.lidLipHeight,
          edges: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
          placement: {
            center: { x: 0, y: h / 2 + lift - config.lidLipHeight / 2, z: d / 2 - config.thickness / 2 - config.lidClearance },
            rightAxis: { x: 1, y: 0, z: 0 },
            upAxis: { x: 0, y: 1, z: 0 },
            outwardAxis: { x: 0, y: 0, z: 1 }
          }
        },
        {
          name: "lid back lip",
          kind: "lid-lip",
          width: lipWidth,
          height: config.lidLipHeight,
          edges: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
          placement: {
            center: { x: 0, y: h / 2 + lift - config.lidLipHeight / 2, z: -d / 2 + config.thickness / 2 + config.lidClearance },
            rightAxis: { x: -1, y: 0, z: 0 },
            upAxis: { x: 0, y: 1, z: 0 },
            outwardAxis: { x: 0, y: 0, z: -1 }
          }
        },
        {
          name: "lid left lip",
          kind: "lid-lip",
          width: lipDepth,
          height: config.lidLipHeight,
          edges: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
          placement: {
            center: { x: -w / 2 + config.thickness / 2 + config.lidClearance, y: h / 2 + lift - config.lidLipHeight / 2, z: 0 },
            rightAxis: { x: 0, y: 0, z: -1 },
            upAxis: { x: 0, y: 1, z: 0 },
            outwardAxis: { x: -1, y: 0, z: 0 }
          }
        },
        {
          name: "lid right lip",
          kind: "lid-lip",
          width: lipDepth,
          height: config.lidLipHeight,
          edges: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
          placement: {
            center: { x: w / 2 - config.thickness / 2 - config.lidClearance, y: h / 2 + lift - config.lidLipHeight / 2, z: 0 },
            rightAxis: { x: 0, y: 0, z: 1 },
            upAxis: { x: 0, y: 1, z: 0 },
            outwardAxis: { x: 1, y: 0, z: 0 }
          }
        }
      );
    }

    const dividerXPositions = dividerPositions(w, config.dividerXCount);
    const dividerYPositions = dividerPositions(d, config.dividerYCount);

    dividerXPositions.forEach((xPosition, index) => {
      definitions.push({
        name: `divider front-back ${index + 1}`,
        kind: "divider-x",
        width: d,
        height: h,
        dividerPanel: true,
        topSlotPositions: dividerYPositions,
        bottomSlotPositions: [],
        placement: {
          center: { x: -w / 2 + xPosition, y: 0, z: 0 },
          rightAxis: { x: 0, y: 0, z: 1 },
          upAxis: { x: 0, y: 1, z: 0 },
          outwardAxis: { x: 1, y: 0, z: 0 }
        }
      });
    });

    dividerYPositions.forEach((zPosition, index) => {
      definitions.push({
        name: `divider left-right ${index + 1}`,
        kind: "divider-y",
        width: w,
        height: h,
        dividerPanel: true,
        topSlotPositions: [],
        bottomSlotPositions: dividerXPositions,
        placement: {
          center: { x: 0, y: 0, z: -d / 2 + zPosition },
          rightAxis: { x: 1, y: 0, z: 0 },
          upAxis: { x: 0, y: 1, z: 0 },
          outwardAxis: { x: 0, y: 0, z: 1 }
        }
      });
    });

    return definitions;
  }

  function buildPanels(rawConfig) {
    const config = normalizeConfig(rawConfig);
    const definitions = getPanelDefinitions(config);
    const panels = definitions.map((definition) => {
      if (definition.dividerPanel) {
        return makeDividerPanel(
          definition.name,
          definition.width,
          definition.height,
          config,
          definition.topSlotPositions,
          definition.bottomSlotPositions,
          definition.placement
        );
      }

      return makePanel(definition.name, definition.width, definition.height, definition.edges, config, {
        kind: definition.kind,
        placement: definition.placement
      });
    });
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
      placement: panel.placement || placements[panel.name]
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
    const byName = Object.fromEntries(panels.map((panel) => [panel.name, panel]));
    const rows = [];

    if (byName.top) rows.push(["top"]);
    rows.push(["left", "front", "right", "back"], ["bottom"]);

    const lidNames = panels.filter((panel) => panel.kind === "lid").map((panel) => panel.name);
    const lipNames = panels.filter((panel) => panel.kind === "lid-lip").map((panel) => panel.name);
    if (lidNames.length) rows.push(lidNames);
    if (lipNames.length) rows.push(lipNames);

    const dividerNames = panels.filter((panel) => panel.kind === "divider").map((panel) => panel.name);
    for (let i = 0; i < dividerNames.length; i += 4) {
      rows.push(dividerNames.slice(i, i + 4));
    }

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
          origin: {
            x: round(dx),
            y: round(dy)
          },
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

  function normalizeFeatures(rawFeatures, panels, config) {
    if (!Array.isArray(rawFeatures)) return [];
    const byName = Object.fromEntries(panels.map((panel) => [panel.name, panel]));

    return rawFeatures.map((feature, index) => {
      if (!feature || typeof feature !== "object") return null;
      const type = FEATURE_TYPES.includes(feature.type) ? feature.type : "drill-hole";
      const panel = byName[feature.panel];
      if (!panel) return null;

      const operation = FEATURE_OPERATIONS.includes(feature.operation) ? feature.operation : "cut";
      const maxDiameter = Math.max(0.2, Math.min(panel.baseWidth, panel.baseHeight) * 0.9);
      const diameter = clamp(numberOr(feature.diameter, config.thickness * 1.6), 0.2, maxDiameter);
      const maxWidth = Math.max(0.2, panel.baseWidth * 0.9);
      const maxHeight = Math.max(0.2, panel.baseHeight * 0.9);
      const requestedWidth = numberOr(feature.width, type === "slot" ? config.thickness * 6 : config.thickness * 4);
      const requestedHeight = numberOr(feature.height, type === "slot" ? config.thickness * 2 : config.thickness * 4);
      const width = clamp(type === "drill-hole" ? diameter : requestedWidth, 0.2, maxWidth);
      const height = clamp(
        type === "drill-hole" ? diameter : requestedHeight,
        0.2,
        type === "slot" ? Math.min(maxHeight, maxWidth) : maxHeight
      );
      const normalizedWidth = type === "slot" ? clamp(Math.max(width, height), height, maxWidth) : width;
      const halfWidth = (type === "drill-hole" ? diameter : normalizedWidth) / 2;
      const halfHeight = (type === "drill-hole" ? diameter : height) / 2;
      const x = clamp(numberOr(feature.x, panel.baseWidth / 2), halfWidth, Math.max(halfWidth, panel.baseWidth - halfWidth));
      const y = clamp(numberOr(feature.y, panel.baseHeight / 2), halfHeight, Math.max(halfHeight, panel.baseHeight - halfHeight));
      const edgeClearance = Math.min(x - halfWidth, y - halfHeight, panel.baseWidth - x - halfWidth, panel.baseHeight - y - halfHeight);
      const warnings = [];

      if (edgeClearance < 0) {
        warnings.push("Feature extends outside the panel.");
      } else if (edgeClearance < config.thickness) {
        warnings.push("Feature is close to the panel edge.");
      }

      if (Math.min(diameter, normalizedWidth, height) <= config.effectiveKerf * 2) {
        warnings.push("Feature size is close to the effective kerf.");
      }

      return {
        id: feature.id ? String(feature.id) : `feature-${index + 1}`,
        type,
        panel: panel.name,
        x: round(x),
        y: round(y),
        diameter: round(diameter),
        width: round(normalizedWidth),
        height: round(height),
        operation,
        warnings,
        edgeClearance: round(edgeClearance)
      };
    }).filter(Boolean);
  }

  function featureClass(feature) {
    if (feature.operation === "cut") return "cut feature feature-cut";
    if (feature.operation === "engrave") return "engrave feature feature-engrave";
    return "mark feature feature-mark";
  }

  function renderFeature(feature, panel) {
    const cx = round(panel.origin.x + feature.x);
    const cy = round(panel.origin.y + feature.y);
    const baseAttrs = [
      `class="${featureClass(feature)}"`,
      `data-feature-id="${escapeXml(feature.id)}"`,
      `data-feature-type="${escapeXml(feature.type)}"`,
      `data-panel="${escapeXml(feature.panel)}"`,
      `data-operation="${escapeXml(feature.operation)}"`
    ];

    if (feature.type === "slot") {
      const width = round(feature.width);
      const height = round(feature.height);
      const radius = round(height / 2);
      const left = round(cx - width / 2);
      const right = round(cx + width / 2);
      const top = round(cy - height / 2);
      const bottom = round(cy + height / 2);
      const start = round(left + radius);
      const end = round(right - radius);
      const path = [
        `M${start} ${top}`,
        `H${end}`,
        `A${radius} ${radius} 0 0 1 ${end} ${bottom}`,
        `H${start}`,
        `A${radius} ${radius} 0 0 1 ${start} ${top}`,
        "Z"
      ].join(" ");
      return `<path ${baseAttrs.join(" ")} data-width="${width}" data-height="${height}" d="${path}"/>`;
    }

    if (feature.type === "rectangle") {
      const width = round(feature.width);
      const height = round(feature.height);
      return `<rect ${baseAttrs.join(" ")} data-width="${width}" data-height="${height}" x="${round(cx - width / 2)}" y="${round(cy - height / 2)}" width="${width}" height="${height}"/>`;
    }

    const r = round(feature.diameter / 2);
    const attrs = [
      ...baseAttrs,
      `cx="${cx}"`,
      `cy="${cy}"`,
      `r="${r}"`
    ];
    return `<circle ${attrs.join(" ")}/>`;
  }

  function buildSvg(rawConfig, options = {}) {
    const { config, panels } = buildPanels(rawConfig);
    const layout = layoutPanels(panels, config);
    const showLabels = options.showLabels !== false;
    const cutColor = options.cutColor || "#d11a2a";
    const labelColor = options.labelColor || "#58616f";
    const lineWidth = Math.max(0.01, numberOr(options.lineWidth, 0.1));
    const features = normalizeFeatures(options.features || rawConfig.features, layout.panels, config);
    const featureByPanel = features.reduce((groups, feature) => {
      groups[feature.panel] = groups[feature.panel] || [];
      groups[feature.panel].push(feature);
      return groups;
    }, {});
    const hitAreas = options.interactive ? layout.panels.map((panel) => (
      `<rect class="panel-hit" data-panel="${escapeXml(panel.name)}" ` +
      `x="${panel.origin.x}" y="${panel.origin.y}" width="${round(panel.baseWidth)}" height="${round(panel.baseHeight)}"/>`
    )).join("") : "";
    const paths = layout.panels.map((panel) => {
      const label = showLabels
        ? `<text x="${panel.label.x}" y="${panel.label.y}" text-anchor="middle" dominant-baseline="middle" class="label">${escapeXml(panel.name)}</text>`
        : "";
      const panelFeatures = (featureByPanel[panel.name] || []).map((feature) => renderFeature(feature, panel)).join("");
      return `<path class="cut panel-outline" data-panel="${escapeXml(panel.name)}" d="${pointsToPath(panel.points)}"/>${panelFeatures}${label}`;
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
        fit: config.fit,
        lidEnabled: config.lidEnabled,
        lidOverhang: config.lidOverhang,
        lidLipHeight: config.lidLipHeight,
        lidClearance: config.lidClearance,
        dividerXCount: config.dividerXCount,
        dividerYCount: config.dividerYCount,
        dividerSlots: config.dividerSlots
      },
      panels: layout.panels.map((panel) => ({
        name: panel.name,
        kind: panel.kind,
        width: round(panel.baseWidth),
        height: round(panel.baseHeight)
      })),
      features
    };

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}mm" height="${layout.height}mm" viewBox="0 0 ${layout.width} ${layout.height}">`,
      `<metadata id="finger-box-config">${escapeXml(JSON.stringify(metadata))}</metadata>`,
      "<style>",
      `.cut{fill:none;stroke:${escapeXml(cutColor)};stroke-width:${lineWidth};vector-effect:non-scaling-stroke}`,
      `.engrave{fill:none;stroke:${escapeXml(labelColor)};stroke-width:${lineWidth};stroke-dasharray:1.2 1.2;vector-effect:non-scaling-stroke}`,
      `.mark{fill:${escapeXml(labelColor)};stroke:none}`,
      `.label{font-family:Arial,sans-serif;font-size:5px;fill:${escapeXml(labelColor)}}`,
      options.interactive ? `.panel-hit{fill:transparent;stroke:transparent;pointer-events:all}.feature{fill:rgba(209,26,42,0.08);cursor:pointer}.feature-engrave{fill:rgba(88,97,111,0.08)}.feature-mark{fill:${escapeXml(labelColor)}}` : `.feature-cut,.feature-engrave{fill:none}`,
      "</style>",
      hitAreas,
      paths,
      "</svg>"
    ].join("");

    return { config, features, layout, svg };
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
    normalizeFeatures,
    oddSegmentCount,
    pointsToPath
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BasicBox = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
