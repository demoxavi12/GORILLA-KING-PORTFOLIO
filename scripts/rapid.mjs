// Screencast frames from first paint: node scripts/rapid.mjs <url> <outDir> <ms total> <keep every n> [w] [h]
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const [, , url, out, total = "7000", keep = "3", w = "1440", h = "900"] = process.argv;
fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, isMobile: +w < 768, hasTouch: +w < 768 });
const cdp = await p.createCDPSession();
let n = 0;
let t0 = 0;
const frames = [];
cdp.on("Page.screencastFrame", async (f) => {
  if (!t0) t0 = f.metadata.timestamp;
  frames.push({ t: Math.round((f.metadata.timestamp - t0) * 1000), data: f.data });
  await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 70, maxWidth: +w, maxHeight: +h, everyNthFrame: 1 });
await p.goto(url, { waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, +total));
await cdp.send("Page.stopScreencast");
frames.forEach((f, i) => {
  if (i % +keep === 0) fs.writeFileSync(`${out}/${String(n++).padStart(3, "0")}-t${f.t}.png`, Buffer.from(f.data, "base64"));
});
console.log(frames.length, "frames,", n, "kept");
await b.close();
