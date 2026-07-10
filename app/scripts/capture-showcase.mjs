/**
 * Records a polished showcase GIF of BookKing via Playwright + ffmpeg.
 * Run from app/: npm run capture:showcase
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "..");
const ROOT = resolve(APP_DIR, "..");
const OUT_DIR = join(ROOT, "docs");
const TMP_DIR = join(APP_DIR, "scripts", ".capture-tmp");
const BASE_URL = process.env.BOOKKING_URL ?? "https://localhost";
const PERIOD = "2026-07";

const VIEWPORT = { width: 1280, height: 800 };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function smoothScroll(page, delta, steps = 24, stepMs = 28) {
  const step = delta / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await sleep(stepMs);
  }
}

async function ffmpegPath() {
  try {
    const mod = await import("@ffmpeg-installer/ffmpeg");
    return mod.path;
  } catch {
    const found = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
    if (found.status === 0) return "ffmpeg";
    throw new Error("ffmpeg not found — install ffmpeg or @ffmpeg-installer/ffmpeg");
  }
}

async function webmToGif(webmPath, gifPath) {
  const ffmpeg = await ffmpegPath();
  const filter = [
    "fps=12",
    "scale=960:-1:flags=lanczos",
    "split[s0][s1]",
    "[s0]palettegen=max_colors=64:stats_mode=diff[p]",
    "[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
  ].join(",");

  const result = spawnSync(
    ffmpeg,
    ["-y", "-i", webmPath, "-vf", filter, "-loop", "0", gifPath],
    { encoding: "utf8", stdio: "pipe" }
  );

  if (result.status !== 0) {
    console.error(result.stderr);
    throw new Error("ffmpeg GIF conversion failed");
  }
}

async function main() {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    recordVideo: { dir: TMP_DIR, size: VIEWPORT },
    colorScheme: "light",
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  console.log(`Capturing ${BASE_URL} …`);

  await page.goto(`${BASE_URL}/?period=${PERIOD}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".overview-grid", { timeout: 15000 });
  await sleep(1800);

  await smoothScroll(page, 180);
  await sleep(2200);

  await smoothScroll(page, 520);
  await sleep(2800);

  await smoothScroll(page, 480);
  await sleep(2200);

  await page.click('a[href="/ledger"]');
  await page.waitForSelector("table", { timeout: 10000 });
  await sleep(2600);

  const business = page.locator(".profile-filter__pill").filter({ hasText: "Business" });
  if (await business.count()) {
    await business.first().click();
    await sleep(2000);
  }

  await page.click('a[href="/"]');
  await page.waitForSelector(".overview-grid");
  const allProfiles = page.locator(".profile-filter__pill").filter({ hasText: "All profiles" });
  if (await allProfiles.count()) {
    await allProfiles.first().click();
    await sleep(1200);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await sleep(2400);

  const video = page.video();
  await context.close();
  await browser.close();

  const webmPath = await video.path();
  const stagedWebm = join(TMP_DIR, "showcase.webm");
  renameSync(webmPath, stagedWebm);

  const gifPath = join(OUT_DIR, "showcase.gif");
  console.log("Converting to GIF …");
  await webmToGif(stagedWebm, gifPath);

  rmSync(TMP_DIR, { recursive: true, force: true });
  console.log(`Done → ${gifPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
