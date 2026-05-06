import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

const files = [
  "styles.css",
  "box-model.js",
  "app.js",
  "preview3d.js",
  "preview3d.bundle.js",
  "index.html"
];

async function copy(source, target) {
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of files) {
  await copy(join(root, file), join(dist, file));
}

console.log("Built static site in dist/");
