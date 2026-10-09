// Visual QA harness: node scripts/shots.mjs <url> <outDir> [w] [h] [--reduce] [--plan=intro|scroll|path]
// Captures the entry sequence over time, then scroll positions through the page.
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const [, , url, out = "shots", w = "1440", h = "900", ...flags] = process.argv;
const reduce = flags.includes("--reduce");
const plan = (flags.find((f) => f.startsWith("--plan=")) ?? "--plan=full").slice(7);
const scrolls = (flags.find((f) => f.startsWith("--at=")) ?? "").slice(5).split(",").filter(Boolean).map(Number);
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--hide-scrollbars", "--force-device-scale-factor=1"],
});
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, isMobile: +w < 768, hasTouch: +w < 768 });
if (reduce) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
const logs = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));

if (plan !== "intro") await page.evaluateOnNewDocument(() => sessionStorage.setItem("kage:qa-short", "1"));
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
const shot = async (label) => {
  await page.screenshot({ path: `${out}/${String(n++).padStart(2, "0")}-${label}.png` });
};

if (plan === "intro" || plan === "full") {
  for (const t of (process.env.TIMES ?? "150,450,800,1150,1450,1750,2200,3200").split(",").map(Number)) {
    await sleep(t - (shot.last ?? 0));
    shot.last = t;
    await shot(`t${t}`);
  }
} else {
  await sleep(3500);
}

if (plan !== "intro") {
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const points = scrolls.length ? scrolls : Array.from({ length: 24 }, (_, i) => Math.round((total * i) / 23));
  for (const y of points) {
    // step there gradually so scrubbed timelines + pins update like a real scroll
    await page.evaluate(async (target) => {
      const start = scrollY;
      const steps = 12;
      for (let i = 1; i <= steps; i++) {
        scrollTo(0, start + ((target - start) * i) / steps);
        await new Promise((r) => requestAnimationFrame(r));
      }
    }, y);
    await sleep(1300);
    await shot(`y${y}`);
  }
}
fs.writeFileSync(`${out}/console.txt`, logs.join("\n"));
console.log("done", n, "shots;", logs.length, "console lines");
await browser.close();
