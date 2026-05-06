(function runApp() {
  "use strict";

  const model = window.BasicBox;
  const form = document.querySelector("#controls");
  const preview = document.querySelector("#svgPreview");
  const downloadButton = document.querySelector("#downloadSvg");
  const fitTestButton = document.querySelector("#downloadFitTest");
  const resetButton = document.querySelector("#reset");
  const addHoleButton = document.querySelector("#addHole");
  const deleteFeatureButton = document.querySelector("#deleteFeature");
  const featurePreset = document.querySelector("#featurePreset");
  const errorEl = document.querySelector("#error");
  const metricsEl = document.querySelector("#metrics");
  const summaryMetricsEl = document.querySelector("#summaryMetrics");
  const threeContainer = document.querySelector("#threePreview");
  const explodeValue = document.querySelector("#explodeValue");
  const addonButtons = document.querySelectorAll("[data-addon]");
  const featureStatus = document.querySelector("#featureStatus");
  const featureEditor = document.querySelector("#featureEditor");
  const featurePanelName = document.querySelector("#featurePanelName");
  const featureList = document.querySelector("#featureList");
  const featureTypeLabels = {
    "drill-hole": "round hole",
    slot: "slot",
    rectangle: "rectangle"
  };

  const defaults = {
    dimensionBasis: "inside",
    open: true,
    width: 100,
    height: 60,
    depth: 80,
    thickness: 3,
    fingerSize: 9,
    kerf: 0.1,
    fit: "standard",
    lidEnabled: false,
    lidOverhang: 3,
    lidLipHeight: 8,
    lidClearance: 0.3,
    dividerXCount: 0,
    dividerYCount: 0,
    dividerSlots: true,
    explode: 0,
    previewLabels: true,
    labels: true,
    cutColor: "#d11a2a",
    labelColor: "#58616f",
    lineWidth: 0.1
  };

  let features = [];
  let lastSvg = "";
  let lastConfig = null;
  let lastLayout = null;
  let lastFeatures = [];
  let threePreview = null;
  let activeTool = null;
  let selectedFeatureId = null;
  let hoverPanelName = null;
  let syncingFeatureEditor = false;

  const controls = form.elements;
  const featureControls = featureEditor.elements;
  const presetControls = featurePreset.elements;

  function readConfig() {
    const data = new FormData(form);
    return {
      dimensionBasis: data.get("dimensionBasis"),
      open: data.get("open") === "on",
      width: data.get("width"),
      height: data.get("height"),
      depth: data.get("depth"),
      thickness: data.get("thickness"),
      fingerSize: data.get("fingerSize"),
      kerf: data.get("kerf"),
      fit: data.get("fit"),
      lidEnabled: data.get("lidEnabled") === "on",
      lidOverhang: data.get("lidOverhang"),
      lidLipHeight: data.get("lidLipHeight"),
      lidClearance: data.get("lidClearance"),
      dividerXCount: data.get("dividerXCount"),
      dividerYCount: data.get("dividerYCount"),
      dividerSlots: data.get("dividerSlots") === "on",
      explode: data.get("explode"),
      previewLabels: data.get("previewLabels") === "on",
      labels: data.get("labels") === "on",
      cutColor: data.get("cutColor"),
      labelColor: data.get("labelColor"),
      lineWidth: data.get("lineWidth")
    };
  }

  function setDefaults() {
    controls.dimensionBasis.value = defaults.dimensionBasis;
    controls.open.checked = defaults.open;
    controls.width.value = defaults.width;
    controls.height.value = defaults.height;
    controls.depth.value = defaults.depth;
    controls.thickness.value = defaults.thickness;
    controls.fingerSize.value = defaults.fingerSize;
    controls.kerf.value = defaults.kerf;
    controls.fit.value = defaults.fit;
    controls.lidEnabled.checked = defaults.lidEnabled;
    controls.lidOverhang.value = defaults.lidOverhang;
    controls.lidLipHeight.value = defaults.lidLipHeight;
    controls.lidClearance.value = defaults.lidClearance;
    controls.dividerXCount.value = defaults.dividerXCount;
    controls.dividerYCount.value = defaults.dividerYCount;
    controls.dividerSlots.checked = defaults.dividerSlots;
    controls.explode.value = defaults.explode;
    controls.previewLabels.checked = defaults.previewLabels;
    controls.labels.checked = defaults.labels;
    controls.cutColor.value = defaults.cutColor;
    controls.labelColor.value = defaults.labelColor;
    controls.lineWidth.value = defaults.lineWidth;
  }

  function fmt(value) {
    return `${Math.round(value * 10) / 10} mm`;
  }

  function fmtCompact(value) {
    return String(Math.round(value * 10) / 10);
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function createFeatureId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `feature-${Date.now()}-${Math.round(Math.random() * 100000)}`;
  }

  function publicFeature(feature) {
    return {
      id: feature.id,
      type: feature.type,
      panel: feature.panel,
      x: feature.x,
      y: feature.y,
      diameter: feature.diameter,
      width: feature.width,
      height: feature.height,
      operation: feature.operation
    };
  }

  function featureLabel(type) {
    return featureTypeLabels[type] || "feature";
  }

  function featureSizeLabel(feature) {
    if (feature.type === "drill-hole") return `${fmt(feature.diameter)} dia`;
    return `${fmtCompact(feature.width)} x ${fmtCompact(feature.height)} mm`;
  }

  function isBoxShape(type) {
    return type === "slot" || type === "rectangle";
  }

  function syncShapeFields(container, type) {
    container.querySelectorAll(".shape-circle").forEach((node) => {
      node.classList.toggle("is-hidden", type !== "drill-hole");
    });
    container.querySelectorAll(".shape-box").forEach((node) => {
      node.classList.toggle("is-hidden", !isBoxShape(type));
    });
  }

  function readFeaturePreset() {
    return {
      type: presetControls.presetType.value,
      operation: presetControls.presetOperation.value,
      diameter: Number(presetControls.presetDiameter.value) || 5,
      width: Number(presetControls.presetWidth.value) || 18,
      height: Number(presetControls.presetHeight.value) || 6
    };
  }

  function ensureThreePreview() {
    if (!threePreview && window.BoxThreePreview) {
      threePreview = window.BoxThreePreview.createBoxPreview(threeContainer, model);
    }
    return threePreview;
  }

  function renderMetrics(config, layout, normalizedFeatures) {
    const front = layout.panels.find((panel) => panel.name === "front");
    const edge = front ? front.metrics.edges.bottom : null;
    const dividerCount = config.dividerXCount + config.dividerYCount;
    const lidParts = layout.panels.filter((panel) => panel.kind === "lid" || panel.kind === "lid-lip").length;
    metricsEl.innerHTML = [
      `<span>Inside ${fmt(config.insideDims.width)} x ${fmt(config.insideDims.depth)} x ${fmt(config.insideDims.height)}</span>`,
      `<span>${fmt(config.thickness)} material</span>`,
      `<span>${normalizedFeatures.length} features</span>`,
      `<span>${dividerCount} dividers</span>`,
      `<span>${config.lidEnabled ? `${lidParts} lid parts` : "no lid"}</span>`,
      `<span>${config.fit} fit</span>`
    ].join("");

    summaryMetricsEl.innerHTML = [
      `<div class="metric-card"><span>Outside size</span><strong>${fmtCompact(config.outsideDims.width)} x ${fmtCompact(config.outsideDims.depth)} x ${fmtCompact(config.outsideDims.height)}</strong></div>`,
      `<div class="metric-card"><span>Inside size</span><strong>${fmtCompact(config.insideDims.width)} x ${fmtCompact(config.insideDims.depth)} x ${fmtCompact(config.insideDims.height)}</strong></div>`,
      `<div class="metric-card"><span>Panels</span><strong>${layout.panels.length}</strong></div>`,
      `<div class="metric-card"><span>Add-ons</span><strong>${config.lidEnabled ? "lid" : "none"} · ${dividerCount} dividers</strong></div>`,
      `<div class="metric-card"><span>Front bottom run</span><strong>${edge ? `${edge.segments} fingers` : "n/a"}</strong></div>`
    ].join("");
  }

  function selectedFeature() {
    return lastFeatures.find((feature) => feature.id === selectedFeatureId) || null;
  }

  function panelForFeature(feature) {
    if (!lastLayout || !feature) return null;
    return lastLayout.panels.find((panel) => panel.name === feature.panel) || null;
  }

  function syncToolState() {
    const placing = activeTool === "feature";
    addHoleButton.setAttribute("aria-pressed", placing ? "true" : "false");
    preview.classList.toggle("is-placing-feature", placing);
  }

  function syncAddonButtons(config = readConfig()) {
    addonButtons.forEach((button) => {
      const active = button.dataset.addon === "lid"
        ? config.lidEnabled
        : Number(config.dividerXCount) > 0 || Number(config.dividerYCount) > 0;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applySvgState() {
    const svg = preview.querySelector("svg");
    if (!svg) return;

    svg.querySelectorAll(".panel-hit").forEach((node) => {
      node.classList.toggle("is-hovered", activeTool === "feature" && node.dataset.panel === hoverPanelName);
    });

    svg.querySelectorAll(".feature").forEach((node) => {
      node.classList.toggle("is-selected", node.dataset.featureId === selectedFeatureId);
    });
  }

  function updateFeatureStatus() {
    const feature = selectedFeature();
    featureStatus.className = "feature-status";

    if (activeTool === "feature") {
      const preset = readFeaturePreset();
      const size = preset.type === "drill-hole"
        ? `${fmt(preset.diameter)} diameter`
        : `${fmtCompact(preset.width)} x ${fmtCompact(preset.height)} mm`;
      featureStatus.textContent = hoverPanelName
        ? `Click the ${hoverPanelName} panel to place a ${featureLabel(preset.type)} (${size}).`
        : `Click inside a panel to place a ${featureLabel(preset.type)} (${size}).`;
      return;
    }

    if (feature) {
      if (feature.warnings.length) {
        featureStatus.classList.add("warning");
        featureStatus.textContent = feature.warnings.join(" ");
      } else {
        featureStatus.classList.add("ready");
        featureStatus.textContent = `${feature.panel} ${featureLabel(feature.type)} is ready for ${feature.operation}.`;
      }
      return;
    }

    featureStatus.textContent = features.length
      ? "Select a feature to edit its shape, size, position, or operation."
      : "Choose a shape, then click Place Feature and click a panel.";
  }

  function syncFeatureEditor() {
    const feature = selectedFeature();
    featureEditor.hidden = !feature;

    if (!feature) {
      renderFeatureList();
      updateFeatureStatus();
      return;
    }

    const panel = panelForFeature(feature);
    syncingFeatureEditor = true;
    featurePanelName.textContent = feature.panel;
    featureControls.featureType.value = feature.type;
    featureControls.featureOperation.value = feature.operation;
    featureControls.featureX.value = feature.x;
    featureControls.featureY.value = feature.y;
    featureControls.featureDiameter.value = feature.diameter;
    featureControls.featureWidth.value = feature.width;
    featureControls.featureHeight.value = feature.height;
    if (panel) {
      featureControls.featureX.max = panel.baseWidth;
      featureControls.featureY.max = panel.baseHeight;
      featureControls.featureDiameter.max = Math.min(panel.baseWidth, panel.baseHeight);
      featureControls.featureWidth.max = panel.baseWidth;
      featureControls.featureHeight.max = panel.baseHeight;
    }
    syncShapeFields(featureEditor, feature.type);
    syncingFeatureEditor = false;
    renderFeatureList();
    updateFeatureStatus();
  }

  function renderFeatureList() {
    featureList.innerHTML = lastFeatures.map((feature) => `
      <button type="button" class="feature-item${feature.id === selectedFeatureId ? " is-selected" : ""}" data-feature-id="${escapeHtml(feature.id)}">
        <strong>${escapeHtml(feature.panel)} ${escapeHtml(featureLabel(feature.type))}</strong>
        <span>${escapeHtml(feature.operation)} · ${featureSizeLabel(feature)} · x ${fmtCompact(feature.x)}, y ${fmtCompact(feature.y)}</span>
      </button>
    `).join("");
  }

  function render() {
    try {
      const config = readConfig();
      if (explodeValue) explodeValue.textContent = `${config.explode || 0}%`;

      const svgOptions = {
        showLabels: config.labels,
        cutColor: config.cutColor,
        labelColor: config.labelColor,
        lineWidth: config.lineWidth,
        features
      };
      const exportResult = model.buildSvg({ ...config, features }, svgOptions);
      const previewResult = model.buildSvg({ ...config, features }, { ...svgOptions, interactive: true });

      lastSvg = exportResult.svg;
      lastConfig = exportResult.config;
      lastLayout = exportResult.layout;
      lastFeatures = exportResult.features;
      features = lastFeatures.map(publicFeature);
      if (selectedFeatureId && !lastFeatures.some((feature) => feature.id === selectedFeatureId)) {
        selectedFeatureId = null;
      }

      preview.innerHTML = previewResult.svg;
      errorEl.hidden = true;
      renderMetrics(exportResult.config, exportResult.layout, exportResult.features);
      syncToolState();
      syncAddonButtons(exportResult.config);
      applySvgState();
      syncFeatureEditor();

      const preview3d = ensureThreePreview();
      if (preview3d) preview3d.render({ ...config, features });
      downloadButton.disabled = false;
    } catch (error) {
      errorEl.hidden = false;
      errorEl.textContent = error.message;
      downloadButton.disabled = true;
    }
  }

  function downloadSvg() {
    if (!lastSvg || !lastConfig) return;
    const blob = new Blob([lastSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dims = lastConfig.outsideDims;
    a.href = url;
    a.download = `cutcase-box-${Math.round(dims.width)}x${Math.round(dims.depth)}x${Math.round(dims.height)}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadFitTest() {
    const config = readConfig();
    const result = model.buildKerfTestSvg(config, {
      cutColor: config.cutColor,
      labelColor: config.labelColor,
      lineWidth: config.lineWidth
    });
    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finger-fit-test-${Math.round(result.config.thickness * 10) / 10}mm.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function svgPointFromEvent(event) {
    const svg = preview.querySelector("svg");
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformed = point.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function panelHitAt(point) {
    if (!point || !lastLayout) return null;
    for (const panel of lastLayout.panels) {
      const localX = point.x - panel.origin.x;
      const localY = point.y - panel.origin.y;
      if (localX >= 0 && localY >= 0 && localX <= panel.baseWidth && localY <= panel.baseHeight) {
        return {
          panel,
          x: round(localX),
          y: round(localY)
        };
      }
    }
    return null;
  }

  function setActiveTool(tool) {
    activeTool = activeTool === tool ? null : tool;
    hoverPanelName = null;
    syncToolState();
    applySvgState();
    updateFeatureStatus();
  }

  function placeFeature(hit) {
    const preset = readFeaturePreset();
    const feature = {
      id: createFeatureId(),
      type: preset.type,
      panel: hit.panel.name,
      x: hit.x,
      y: hit.y,
      diameter: preset.diameter,
      width: preset.width,
      height: preset.height,
      operation: preset.operation
    };
    features.push(feature);
    selectedFeatureId = feature.id;
    activeTool = null;
    hoverPanelName = null;
    render();
  }

  function updateFeatureFromEditor() {
    if (syncingFeatureEditor || !selectedFeatureId) return;
    const index = features.findIndex((feature) => feature.id === selectedFeatureId);
    if (index < 0) return;

    features[index] = {
      ...features[index],
      type: featureControls.featureType.value,
      x: round(Number(featureControls.featureX.value) || 0),
      y: round(Number(featureControls.featureY.value) || 0),
      diameter: round(Number(featureControls.featureDiameter.value) || 0.2),
      width: round(Number(featureControls.featureWidth.value) || 0.2),
      height: round(Number(featureControls.featureHeight.value) || 0.2),
      operation: featureControls.featureOperation.value
    };
    render();
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  document.querySelectorAll('[form="controls"]').forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });
  featureEditor.addEventListener("submit", (event) => event.preventDefault());
  featureEditor.addEventListener("input", updateFeatureFromEditor);
  featureEditor.addEventListener("change", updateFeatureFromEditor);
  featurePreset.addEventListener("submit", (event) => event.preventDefault());
  featurePreset.addEventListener("input", () => {
    syncShapeFields(featurePreset, presetControls.presetType.value);
    updateFeatureStatus();
  });
  featurePreset.addEventListener("change", () => {
    syncShapeFields(featurePreset, presetControls.presetType.value);
    updateFeatureStatus();
  });
  downloadButton.addEventListener("click", downloadSvg);
  fitTestButton.addEventListener("click", downloadFitTest);
  addHoleButton.addEventListener("click", () => setActiveTool("feature"));
  addonButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.addon === "lid") {
        controls.lidEnabled.checked = !controls.lidEnabled.checked;
        if (controls.lidEnabled.checked) controls.open.checked = true;
      } else if (Number(controls.dividerXCount.value) > 0 || Number(controls.dividerYCount.value) > 0) {
        controls.dividerXCount.value = 0;
        controls.dividerYCount.value = 0;
      } else {
        controls.dividerXCount.value = 1;
        controls.dividerYCount.value = 1;
      }
      render();
    });
  });
  deleteFeatureButton.addEventListener("click", () => {
    if (!selectedFeatureId) return;
    features = features.filter((feature) => feature.id !== selectedFeatureId);
    selectedFeatureId = null;
    render();
  });
  resetButton.addEventListener("click", () => {
    setDefaults();
    features = [];
    selectedFeatureId = null;
    activeTool = null;
    render();
  });

  featureList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-feature-id]");
    if (!item) return;
    selectedFeatureId = item.dataset.featureId;
    activeTool = null;
    render();
  });

  preview.addEventListener("click", (event) => {
    const featureNode = event.target.closest && event.target.closest("[data-feature-id]");
    if (featureNode) {
      selectedFeatureId = featureNode.dataset.featureId;
      activeTool = null;
      render();
      return;
    }

    if (activeTool !== "feature") return;
    const hit = panelHitAt(svgPointFromEvent(event));
    if (!hit) {
      featureStatus.textContent = "Click inside a panel to place the feature.";
      return;
    }
    placeFeature(hit);
  });

  preview.addEventListener("mousemove", (event) => {
    if (activeTool !== "feature") return;
    const hit = panelHitAt(svgPointFromEvent(event));
    const nextHover = hit ? hit.panel.name : null;
    if (nextHover === hoverPanelName) return;
    hoverPanelName = nextHover;
    applySvgState();
    updateFeatureStatus();
  });

  preview.addEventListener("mouseleave", () => {
    if (!hoverPanelName) return;
    hoverPanelName = null;
    applySvgState();
    updateFeatureStatus();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeTool) {
      activeTool = null;
      hoverPanelName = null;
      syncToolState();
      applySvgState();
      updateFeatureStatus();
    }
  });
  window.addEventListener("resize", render);
  window.addEventListener("box-three-preview-ready", render);

  setDefaults();
  syncShapeFields(featurePreset, presetControls.presetType.value);
  render();
})();
