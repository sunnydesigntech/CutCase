(function runApp() {
  "use strict";

  const model = window.BasicBox;
  const form = document.querySelector("#controls");
  const preview = document.querySelector("#svgPreview");
  const downloadButton = document.querySelector("#downloadSvg");
  const fitTestButton = document.querySelector("#downloadFitTest");
  const resetButton = document.querySelector("#reset");
  const errorEl = document.querySelector("#error");
  const metricsEl = document.querySelector("#metrics");
  const threeContainer = document.querySelector("#threePreview");

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
    explode: 0,
    previewLabels: true,
    labels: true,
    cutColor: "#d11a2a",
    labelColor: "#58616f",
    lineWidth: 0.1
  };

  let lastSvg = "";
  let lastConfig = null;
  let threePreview = null;
  const controls = form.elements;

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

  function ensureThreePreview() {
    if (!threePreview && window.BoxThreePreview) {
      threePreview = window.BoxThreePreview.createBoxPreview(threeContainer, model);
    }
    return threePreview;
  }

  function renderMetrics(config, layout) {
    const edge = layout.panels.find((panel) => panel.name === "front").metrics.edges.bottom;
    metricsEl.innerHTML = [
      `<span>Outside ${fmt(config.outsideDims.width)} x ${fmt(config.outsideDims.depth)} x ${fmt(config.outsideDims.height)}</span>`,
      `<span>Inside ${fmt(config.insideDims.width)} x ${fmt(config.insideDims.depth)} x ${fmt(config.insideDims.height)}</span>`,
      `<span>${layout.panels.length} panels</span>`,
      `<span>${edge.segments} fingers on front bottom, ${fmt(edge.actualFingerSize)} actual pitch</span>`,
      `<span>${config.fit} fit, ${fmt(config.effectiveKerf)} effective kerf</span>`
    ].join("");
  }

  function render() {
    try {
      const config = readConfig();
      const svgOptions = {
        showLabels: config.labels,
        cutColor: config.cutColor,
        labelColor: config.labelColor,
        lineWidth: config.lineWidth
      };
      const result = model.buildSvg(config, svgOptions);
      lastSvg = result.svg;
      lastConfig = result.config;
      preview.innerHTML = result.svg;
      errorEl.hidden = true;
      renderMetrics(result.config, result.layout);
      const preview3d = ensureThreePreview();
      if (preview3d) preview3d.render(config);
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
    a.download = `finger-box-${Math.round(dims.width)}x${Math.round(dims.depth)}x${Math.round(dims.height)}.svg`;
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

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  downloadButton.addEventListener("click", downloadSvg);
  fitTestButton.addEventListener("click", downloadFitTest);
  resetButton.addEventListener("click", () => {
    setDefaults();
    render();
  });
  window.addEventListener("resize", render);
  window.addEventListener("box-three-preview-ready", render);

  setDefaults();
  render();
})();
