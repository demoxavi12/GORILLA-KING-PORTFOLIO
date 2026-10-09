// node scripts/one.mjs <url> <out.png> [w] [h] [waitMs] [reduce]
import puppeteer from "puppeteer-core";
const [, , url, out, w = "1400", h = "700", wait = "4000", reduce] = process.argv;
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, isMobile: +w < 768, hasTouch: +w < 768 });
if (reduce) await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.goto(url, { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, +wait));
await p.screenshot({ path: out });
console.log(errs.length ? errs.join("\n") : "no errors");
await b.close();
