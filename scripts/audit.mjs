// Layout audit: horizontal overflow + console errors per route and viewport.
// node scripts/audit.mjs http://localhost:3000
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:3000";
const routes = ["/", "/work", "/work/distributed-job-queue", "/work/medipro", "/nope"];
const sizes = [
  [320, 640],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
];

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let problems = 0;
for (const route of routes) {
  for (const [w, h] of sizes) {
    const page = await browser.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    await page.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: w < 768 });
    await page.evaluateOnNewDocument(() => sessionStorage.setItem("kage:qa-short", "1"));
    await page.goto(base + route, { waitUntil: "networkidle2" });
    await sleep(3200);
    const res = await page.evaluate(async () => {
      const total = document.documentElement.scrollHeight;
      const wide = new Set();
      for (let y = 0; y < total; y += innerHeight * 0.8) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
        if (document.documentElement.scrollWidth > innerWidth + 1) wide.add(Math.round(y));
      }
      return { sw: document.documentElement.scrollWidth, iw: innerWidth, wide: [...wide].slice(0, 5) };
    });
    const bad = res.wide.length || errs.length;
    if (bad) problems++;
    console.log(`${bad ? "✗" : "✓"} ${route} @${w}x${h}`, res.wide.length ? `overflow at y=${res.wide}` : "", errs.join(" | "));
    await page.close();
  }
}
await browser.close();
console.log(problems ? `${problems} problem(s)` : "all clear");
