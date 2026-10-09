// Interaction QA: menu, project takeover, case study, keyboard. node scripts/flows.mjs <base> <outDir>
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const [, , base = "http://localhost:3000", out = "flows"] = process.argv;
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
const shot = (l) => page.screenshot({ path: `${out}/${String(n++).padStart(2, "0")}-${l}.png` });
const log = (...a) => console.log(...a);

await page.evaluateOnNewDocument(() => sessionStorage.setItem("kage:qa-short", "1"));
await page.goto(base, { waitUntil: "networkidle2" });
await sleep(3300);

// Menu via keyboard
await page.focus("#menu-toggle");
await page.keyboard.press("Enter");
await sleep(400);
await shot("menu-mid");
await sleep(900);
await shot("menu-open");
log("focus in menu:", await page.evaluate(() => document.activeElement?.closest("#site-menu") !== null && document.activeElement.textContent));
log("main inert:", await page.evaluate(() => document.getElementById("main").hasAttribute("inert")));
await page.hover('#site-menu a[href="/#archive"]');
await sleep(800);
await shot("menu-hover-archive");
await page.keyboard.press("Escape");
await sleep(900);
log("menu closed, focus on toggle:", await page.evaluate(() => document.activeElement?.id));

// Project takeover from Selected Work
await page.evaluate(() => document.querySelector("#work").scrollIntoView());
await sleep(600);
await page.evaluate(() => scrollBy(0, 4));
await sleep(1500);
const link = await page.$('[data-cut]:not([inert]) h3 a');
await link.click();
await sleep(250);
await shot("takeover-start");
await sleep(500);
await shot("takeover-mid");
await sleep(1200);
await shot("case-landed");
log("url:", page.url());
await sleep(1000);
await shot("case-hero");
for (const y of [1, 2, 3, 4, 5, 6]) {
  await page.evaluate((k) => scrollTo(0, innerHeight * k * 0.95), y);
  await sleep(1100);
  await shot(`case-${y}`);
}
await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
await sleep(1200);
await shot("case-next");

// Back to home via a slash wipe
await page.click('a[href="/#work"]');
await sleep(380);
await shot("wipe-mid");
await sleep(1600);
await shot("back-home");
log("url:", page.url(), "scrollY:", await page.evaluate(() => scrollY));

fs.writeFileSync(`${out}/errors.txt`, errs.join("\n"));
log("errors:", errs.length);
await browser.close();
