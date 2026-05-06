import { chromium } from "playwright-core";

const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const targetUrl = process.env.TARGET_URL || "http://127.0.0.1:5173";

async function canvasStats(page) {
  return page.evaluate(async () => {
    const canvas = document.querySelector("#threePreview canvas");
    if (!canvas) return { error: "missing canvas" };
    const url = canvas.toDataURL("image/png");
    const img = new Image();
    img.src = url;
    await img.decode();

    const probe = document.createElement("canvas");
    probe.width = 96;
    probe.height = 96;
    const ctx = probe.getContext("2d");
    ctx.drawImage(img, 0, 0, probe.width, probe.height);
    const data = ctx.getImageData(0, 0, probe.width, probe.height).data;

    let nonBg = 0;
    let rsum = 0;
    let gsum = 0;
    let bsum = 0;
    let hash = 2166136261;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      rsum += r;
      gsum += g;
      bsum += b;
      if (Math.abs(r - 248) + Math.abs(g - 250) + Math.abs(b - 249) > 18) nonBg += 1;
      hash ^= r;
      hash = Math.imul(hash, 16777619) >>> 0;
      hash ^= g;
      hash = Math.imul(hash, 16777619) >>> 0;
      hash ^= b;
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    const pixels = data.length / 4;
    const ravg = rsum / pixels;
    const gavg = gsum / pixels;
    const bavg = bsum / pixels;
    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      variance += Math.abs(data[i] - ravg) + Math.abs(data[i + 1] - gavg) + Math.abs(data[i + 2] - bavg);
    }

    return {
      width: canvas.width,
      height: canvas.height,
      dataUrlLength: url.length,
      hash,
      nonBgRatio: nonBg / pixels,
      variance: variance / pixels
    };
  });
}

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
const messages = [];
page.on("console", (msg) => messages.push(`${msg.type()}: ${msg.text()}`));
page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));

await page.goto(targetUrl, { waitUntil: "networkidle" });
await page.waitForSelector("#threePreview canvas", { timeout: 15000 });
await page.waitForTimeout(900);
const desktopBefore = await canvasStats(page);
await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
await page.locator("#threePreview").screenshot({ path: "artifacts/canvas-desktop.png" });

const box = await page.locator("#threePreview canvas").boundingBox();
await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.45);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.58, { steps: 20 });
await page.mouse.up();
await page.waitForTimeout(500);
const desktopAfter = await canvasStats(page);
await page.screenshot({ path: "artifacts/desktop-rotated.png", fullPage: true });
await page.locator("#threePreview").screenshot({ path: "artifacts/canvas-desktop-rotated.png" });

await page.selectOption('select[name="presetType"]', "slot");
await page.fill('input[name="presetWidth"]', "24");
await page.fill('input[name="presetHeight"]', "8");
await page.click("#addHole");
const frontPanel = page.locator('.panel-hit[data-panel="front"]').first();
const frontBox = await frontPanel.boundingBox();
await page.mouse.click(frontBox.x + frontBox.width / 2, frontBox.y + frontBox.height / 2);
await page.waitForTimeout(700);
const featureAfter = await canvasStats(page);
await page.screenshot({ path: "artifacts/desktop-feature.png", fullPage: true });
await page.locator("#threePreview").screenshot({ path: "artifacts/canvas-desktop-feature.png" });

await page.click('[data-addon="lid"]');
await page.click('[data-addon="divider"]');
await page.waitForTimeout(700);
const addonAfter = await canvasStats(page);
const addonPanels = await page.evaluate(() => (
  [...document.querySelectorAll(".panel-outline")].map((node) => node.getAttribute("data-panel"))
));
await page.screenshot({ path: "artifacts/desktop-addons.png", fullPage: true });
await page.locator("#threePreview").screenshot({ path: "artifacts/canvas-desktop-addons.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(700);
const mobile = await canvasStats(page);
await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
await page.locator("#threePreview").screenshot({ path: "artifacts/canvas-mobile.png" });
await browser.close();

const result = { desktopBefore, desktopAfter, featureAfter, addonAfter, addonPanels, mobile, consoleMessages: messages };
console.log(JSON.stringify(result, null, 2));

if (messages.length > 0) throw new Error("Browser console produced messages.");
if (desktopBefore.error || mobile.error) throw new Error("Three.js canvas was not found.");
if (desktopBefore.nonBgRatio < 0.04 || mobile.nonBgRatio < 0.04) throw new Error("Three.js canvas appears blank.");
if (desktopBefore.variance < 4 || mobile.variance < 4) throw new Error("Three.js canvas has insufficient pixel variation.");
if (desktopBefore.dataUrlLength === desktopAfter.dataUrlLength) throw new Error("Drag interaction did not change the rendered canvas.");
if (desktopAfter.hash === featureAfter.hash) throw new Error("Feature placement did not update the rendered 3D canvas.");
if (featureAfter.hash === addonAfter.hash) throw new Error("Lid/divider add-ons did not update the rendered 3D canvas.");
if (!addonPanels.includes("lid top")) throw new Error("Lid panel was not generated in the SVG layout.");
if (!addonPanels.includes("divider front-back 1")) throw new Error("Front-back divider was not generated in the SVG layout.");
if (!addonPanels.includes("divider left-right 1")) throw new Error("Left-right divider was not generated in the SVG layout.");
