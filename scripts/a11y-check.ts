/**
 * Automated accessibility check (axe-core) against a running Plainread instance.
 *
 * Used both locally and in CI. Requires a Chrome/Chromium binary; set
 * CHROME_PATH if it is not auto-detected.
 *
 * Usage:
 *   npm run build && PORT=3100 npm start &
 *   npx tsx scripts/a11y-check.ts http://localhost:3100
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.argv[2] || "http://localhost:3100";

const ROUTES = [
  "/",
  "/calibrate",
  "/import",
  "/settings",
  "/account",
  "/privacy",
  "/terms",
  "/accessibility",
  // Reader screen fixture (requires the server to run with READ_AUDIT_FIXTURES=1)
  "/audit-reader",
];

function findChrome(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
        ]
      : process.platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
        : ["/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Chrome/Chromium not found. Set CHROME_PATH.");
}

async function main() {
  const axeSource = fs.readFileSync(
    path.join(path.dirname(require.resolve("axe-core")), "axe.min.js"),
    "utf-8"
  );

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  let totalViolations = 0;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    for (const route of ROUTES) {
      await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
      // Fixture routes 404 unless the server runs with READ_AUDIT_FIXTURES=1
      if (page.url().includes("/_not-found") || (await page.$("#main-content h1") === null && route === "/audit-reader")) {
        console.log(`SKIP  ${route}  (fixture not enabled — start the server with READ_AUDIT_FIXTURES=1)`);
        continue;
      }
      await page.evaluate(axeSource);
      const results = (await page.evaluate(async () => {
        // @ts-expect-error axe is injected above
        return await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] },
        });
      })) as {
        violations: Array<{
          id: string;
          impact: string;
          nodes: Array<{ html: string }>;
        }>;
      };

      const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      totalViolations += results.violations.length;

      if (results.violations.length === 0) {
        console.log(`PASS  ${route}  (0 violations)`);
      } else {
        console.log(`FAIL  ${route}  (${results.violations.length} violations)`);
        for (const v of results.violations) {
          console.log(`      [${v.impact}] ${v.id} — ${v.nodes.length} node(s)`);
          for (const n of v.nodes.slice(0, 3)) {
            console.log(`        ${n.html.slice(0, 160)}`);
          }
        }
      }
      // serious/critical violations are always failures
      void serious;
    }
  } finally {
    await browser.close();
  }

  if (totalViolations > 0) {
    console.error(`\n${totalViolations} accessibility violation(s) found.`);
    process.exit(1);
  }
  console.log("\nAll routes pass axe-core (wcag2a, wcag2aa, wcag22aa).");
}

main().catch((e) => {
  console.error("Accessibility check failed to run:", e);
  process.exit(1);
});
