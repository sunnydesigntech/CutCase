import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const PANEL_COLORS = {
  front: 0xf2c36b,
  back: 0xd9efe8,
  left: 0x9fc4d4,
  right: 0xe8ded1,
  bottom: 0xb8d5bf,
  top: 0x8fb4c5
};

const FEATURE_COLORS = {
  cut: 0xd11a2a,
  engrave: 0x58616f,
  mark: 0x172126
};

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function toVector3(value) {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function makeMatrix(placement, explodeDistance) {
  const right = toVector3(placement.rightAxis);
  const up = toVector3(placement.upAxis);
  const outward = toVector3(placement.outwardAxis);
  const center = toVector3(placement.center).add(outward.clone().multiplyScalar(explodeDistance));
  const matrix = new THREE.Matrix4();
  matrix.makeBasis(right, up, outward);
  matrix.setPosition(center);
  return matrix;
}

function addRectangleHole(shape, centerX, centerY, width, height) {
  const x1 = centerX - width / 2;
  const x2 = centerX + width / 2;
  const y1 = centerY - height / 2;
  const y2 = centerY + height / 2;
  const hole = new THREE.Path();
  hole.moveTo(x1, y1);
  hole.lineTo(x1, y2);
  hole.lineTo(x2, y2);
  hole.lineTo(x2, y1);
  hole.lineTo(x1, y1);
  shape.holes.push(hole);
}

function addSlotHole(shape, centerX, centerY, width, height) {
  const radius = height / 2;
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  const top = centerY + height / 2;
  const bottom = centerY - height / 2;
  const start = left + radius;
  const end = right - radius;
  const hole = new THREE.Path();
  hole.moveTo(start, top);
  hole.lineTo(end, top);
  hole.absarc(end, centerY, radius, Math.PI / 2, -Math.PI / 2, true);
  hole.lineTo(start, bottom);
  hole.absarc(start, centerY, radius, -Math.PI / 2, Math.PI / 2, true);
  shape.holes.push(hole);
}

function featureCenter(feature, panel) {
  return {
    x: feature.x - panel.baseWidth / 2,
    y: panel.baseHeight / 2 - feature.y
  };
}

function makeFeatureShape(feature, panel) {
  const center = featureCenter(feature, panel);
  const shape = new THREE.Shape();

  if (feature.type === "slot") {
    const radius = feature.height / 2;
    const left = center.x - feature.width / 2;
    const right = center.x + feature.width / 2;
    const top = center.y + feature.height / 2;
    const bottom = center.y - feature.height / 2;
    const start = left + radius;
    const end = right - radius;
    shape.moveTo(start, top);
    shape.lineTo(end, top);
    shape.absarc(end, center.y, radius, Math.PI / 2, -Math.PI / 2, true);
    shape.lineTo(start, bottom);
    shape.absarc(start, center.y, radius, -Math.PI / 2, Math.PI / 2, true);
    return shape;
  }

  if (feature.type === "rectangle") {
    const x1 = center.x - feature.width / 2;
    const x2 = center.x + feature.width / 2;
    const y1 = center.y - feature.height / 2;
    const y2 = center.y + feature.height / 2;
    shape.moveTo(x1, y1);
    shape.lineTo(x2, y1);
    shape.lineTo(x2, y2);
    shape.lineTo(x1, y2);
    shape.lineTo(x1, y1);
    return shape;
  }

  const radius = feature.diameter / 2;
  shape.absellipse(center.x, center.y, radius, radius, 0, Math.PI * 2, false);
  return shape;
}

function makeFeatureOutlinePoints(feature, panel) {
  const center = featureCenter(feature, panel);
  const points = [];

  if (feature.type === "slot") {
    const radius = feature.height / 2;
    const leftCenter = center.x - feature.width / 2 + radius;
    const rightCenter = center.x + feature.width / 2 - radius;
    const top = center.y + feature.height / 2;
    const bottom = center.y - feature.height / 2;
    const arcSegments = 14;

    points.push(new THREE.Vector2(leftCenter, top));
    points.push(new THREE.Vector2(rightCenter, top));
    for (let i = 1; i <= arcSegments; i += 1) {
      const angle = Math.PI / 2 - (Math.PI * i) / arcSegments;
      points.push(new THREE.Vector2(
        rightCenter + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius
      ));
    }
    points.push(new THREE.Vector2(leftCenter, bottom));
    for (let i = 1; i <= arcSegments; i += 1) {
      const angle = -Math.PI / 2 - (Math.PI * i) / arcSegments;
      points.push(new THREE.Vector2(
        leftCenter + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius
      ));
    }
    return points;
  }

  if (feature.type === "rectangle") {
    const x1 = center.x - feature.width / 2;
    const x2 = center.x + feature.width / 2;
    const y1 = center.y - feature.height / 2;
    const y2 = center.y + feature.height / 2;
    return [
      new THREE.Vector2(x1, y1),
      new THREE.Vector2(x2, y1),
      new THREE.Vector2(x2, y2),
      new THREE.Vector2(x1, y2)
    ];
  }

  const radius = feature.diameter / 2;
  for (let i = 0; i < 64; i += 1) {
    const angle = (Math.PI * 2 * i) / 64;
    points.push(new THREE.Vector2(
      center.x + Math.cos(angle) * radius,
      center.y + Math.sin(angle) * radius
    ));
  }
  return points;
}

function makePanelGeometry(panel, thickness, placement, explodeDistance, features = []) {
  let points = panel.points.map((point) => new THREE.Vector2(
    point.x - panel.baseWidth / 2,
    panel.baseHeight / 2 - point.y
  ));

  if (signedArea(points) < 0) {
    points = points.reverse();
  }

  const shape = new THREE.Shape(points);
  features.filter((feature) => feature.operation === "cut").forEach((feature) => {
    const centerX = feature.x - panel.baseWidth / 2;
    const centerY = panel.baseHeight / 2 - feature.y;

    if (feature.type === "slot") {
      addSlotHole(shape, centerX, centerY, feature.width, feature.height);
      return;
    }

    if (feature.type === "rectangle") {
      addRectangleHole(shape, centerX, centerY, feature.width, feature.height);
      return;
    }

    const radius = feature.diameter / 2;
    const hole = new THREE.Path();
    hole.absellipse(centerX, centerY, radius, radius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 24
  });

  geometry.translate(0, 0, -thickness / 2);
  geometry.applyMatrix4(makeMatrix(placement, explodeDistance));
  geometry.computeVertexNormals();
  return geometry;
}

function addFeatureOverlay(root, panel, thickness, placement, explodeDistance, feature) {
  const color = FEATURE_COLORS[feature.operation] || FEATURE_COLORS.cut;
  const z = thickness / 2 + 0.16;

  if (feature.operation !== "cut") {
    const fillGeometry = new THREE.ShapeGeometry(makeFeatureShape(feature, panel), 24);
    fillGeometry.translate(0, 0, z);
    fillGeometry.applyMatrix4(makeMatrix(placement, explodeDistance));
    const fill = new THREE.Mesh(
      fillGeometry,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: feature.operation === "mark" ? 0.28 : 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      })
    );
    fill.name = `${panel.name}-${feature.type}-${feature.operation}-fill`;
    fill.renderOrder = 4;
    root.add(fill);
  }

  const outlinePoints = makeFeatureOutlinePoints(feature, panel).map((point) => (
    new THREE.Vector3(point.x, point.y, z + 0.08)
  ));
  const outlineGeometry = new THREE.BufferGeometry().setFromPoints(outlinePoints);
  outlineGeometry.applyMatrix4(makeMatrix(placement, explodeDistance));
  const outline = new THREE.LineLoop(
    outlineGeometry,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: feature.operation === "cut" ? 0.95 : 0.82,
      depthTest: true,
      depthWrite: false
    })
  );
  outline.name = `${panel.name}-${feature.type}-${feature.operation}-outline`;
  outline.renderOrder = 5;
  root.add(outline);
}

function makeLabelTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(23,33,38,0.18)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  ctx.fillStyle = "#172126";
  ctx.font = "700 34px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function getPanelCenter(panel, explodeDistance) {
  const outward = toVector3(panel.placement.outwardAxis);
  return toVector3(panel.placement.center).add(outward.multiplyScalar(explodeDistance + 0.7));
}

export function createBoxPreview(container, model) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8faf9);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 5000);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 40;
  controls.maxDistance = 900;
  controls.target.set(0, 0, 0);

  const root = new THREE.Group();
  scene.add(root);

  const ambient = new THREE.HemisphereLight(0xffffff, 0xd8c7a1, 2.2);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(160, 210, 180);
  key.castShadow = true;
  key.shadow.camera.near = 10;
  key.shadow.camera.far = 600;
  key.shadow.camera.left = -220;
  key.shadow.camera.right = 220;
  key.shadow.camera.top = 220;
  key.shadow.camera.bottom = -220;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9fc4d4, 1.2);
  fill.position.set(-180, 120, -160);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 1600),
    new THREE.ShadowMaterial({ color: 0x172126, opacity: 0.12 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -80;
  floor.receiveShadow = true;
  scene.add(floor);

  let lastRadius = 0;

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function clearRoot() {
    while (root.children.length) {
      const child = root.children.pop();
      child.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
          else node.material.dispose();
        }
        if (node.material && node.material.map) node.material.map.dispose();
      });
    }
  }

  function fitCamera(config) {
    const dims = config.outsideDims;
    const radius = Math.max(dims.width, dims.height, dims.depth) * 1.55;
    if (Math.abs(radius - lastRadius) < 0.5) return;
    lastRadius = radius;
    camera.near = Math.max(0.1, radius / 80);
    camera.far = radius * 16;
    camera.position.set(radius * 1.08, radius * 0.78, radius * 1.12);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function render(configRaw) {
    const sceneData = model.buildSceneData(configRaw);
    const normalizedFeatures = model.normalizeFeatures(configRaw.features || [], sceneData.panels, sceneData.config);
    const featuresByPanel = normalizedFeatures.reduce((groups, feature) => {
      groups[feature.panel] = groups[feature.panel] || [];
      groups[feature.panel].push(feature);
      return groups;
    }, {});
    clearRoot();

    const explodePercent = Math.max(0, Math.min(100, Number(configRaw.explode) || 0));
    const explodeDistance = Math.max(
      sceneData.config.outsideDims.width,
      sceneData.config.outsideDims.height,
      sceneData.config.outsideDims.depth
    ) * 0.62 * (explodePercent / 100);

    sceneData.panels.forEach((panel) => {
      const geometry = makePanelGeometry(
        panel,
        sceneData.config.thickness,
        panel.placement,
        explodeDistance,
        featuresByPanel[panel.name] || []
      );
      const material = new THREE.MeshStandardMaterial({
        color: PANEL_COLORS[panel.name] || 0xd9c7a3,
        roughness: 0.58,
        metalness: 0.02,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = panel.name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 22),
        new THREE.LineBasicMaterial({ color: 0x1f2d32, transparent: true, opacity: 0.78 })
      );
      root.add(edges);

      (featuresByPanel[panel.name] || []).forEach((feature) => {
        addFeatureOverlay(
          root,
          panel,
          sceneData.config.thickness,
          panel.placement,
          explodeDistance,
          feature
        );
      });

      if (configRaw.previewLabels !== false) {
        const texture = makeLabelTexture(panel.name);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texture,
          depthTest: false,
          transparent: true
        }));
        sprite.position.copy(getPanelCenter(panel, explodeDistance));
        const labelScale = Math.max(sceneData.config.thickness * 8, 16);
        sprite.scale.set(labelScale * 1.8, labelScale * 0.68, 1);
        root.add(sprite);
      }
    });

    floor.position.y = -sceneData.config.outsideDims.height / 2 - sceneData.config.thickness * 1.8;
    fitCamera(sceneData.config);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return { render, resize };
}

window.BoxThreePreview = { createBoxPreview };
window.dispatchEvent(new CustomEvent("box-three-preview-ready"));
