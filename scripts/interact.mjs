// node interact.mjs <url> <outDir> <w> <h> <figX> <figY>
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const [, , url, out, w = "1440", h = "900", fx = "907", fy = "400"] = process.argv;
fs.mkdirSync(out, { recursive: true });
const mobile = +w < 768;
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, isMobile: mobile, hasTouch: mobile });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.evaluateOnNewDocument(() => sessionStorage.setItem("kage:qa-short", "1"));
await p.goto(url, { waitUntil: "domcontentloaded" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(9000);
await p.screenshot({ path: `${out}/0-idle.png` });
const shots = async (tag) => {
  for (const ms of [250, 300, 300, 500, 1500]) {
    await wait(ms);
    await p.screenshot({ path: `${out}/${tag}-${ms}.png` });
  }
};
if (mobile) {
  await p.touchscreen.tap(+fx, +fy);
  await shots("1-tap");
} else {
  await p.mouse.move(100, 100);
  await wait(300);
  await p.mouse.move(+fx, +fy, { steps: 8 });
  // tiny jitter while over the figure must not restart the encounter
  for (let i = 0; i < 6; i++) await p.mouse.move(+fx + (i % 2 ? 2 : -2), +fy, { steps: 1 });
  await shots("1-hover");
  await p.mouse.move(100, 100);
  await wait(2500);
  const btn = await p.$("button.sr-only-focusable");
  console.log("button:", !!btn);
  await btn.focus();
  await p.screenshot({ path: `${out}/2-focus.png` });
  await p.keyboard.press("Enter");
  await shots("2-key");
}
console.log(errs.length ? errs.join("\n") : "no errors");
await b.close();
