import { copyFile, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

const files = [
  "styles.css",
  "box-model.js",
  "app.js",
  "preview3d.js"
];

async function copy(source, target) {
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

let html = await readFile(join(root, "index.html"), "utf8");
html = html
  .replace("/node_modules/three/build/three.module.js", "./vendor/three/build/three.module.js")
  .replace("/node_modules/three/examples/jsm/", "./vendor/three/examples/jsm/");
await writeFile(join(dist, "index.html"), html);

for (const file of files) {
  await copy(join(root, file), join(dist, file));
}

await copy(
  join(root, "node_modules/three/build/three.module.js"),
  join(dist, "vendor/three/build/three.module.js")
);
await copy(
  join(root, "node_modules/three/examples/jsm/controls/OrbitControls.js"),
  join(dist, "vendor/three/examples/jsm/controls/OrbitControls.js")
);

console.log("Built static site in dist/");

