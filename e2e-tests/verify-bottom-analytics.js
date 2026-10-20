const { chromium } = require("playwright");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ARTIFACT_DIR = path.resolve(
  "/Users/sumanthyanamala/.gemini/antigravity-ide/brain/be4ca1be-79c8-471f-b51b-1e8d954f620b"
);
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "user-fixes-screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function getFrontdoorUrl() {
  console.log("🔑 Generating Salesforce frontdoor login URL...");
  const output = execSync(
    'sf org open --target-org sandbox-org --url-only --path "/lightning/n/Smart_Grid_Explorer"'
  ).toString();
  const match = output.match(/https:\/\/[^\s]+/);
  if (!match) throw new Error("Failed to parse URL: " + output);
  return match[0];
}

async function verifyBottomAnalytics() {
  const frontdoorUrl = getFrontdoorUrl();
  console.log(
    "🚀 Launching browser to verify Bottom Analytics Panel & Removal of Column Totals..."
  );
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 }
  });

  const page = await context.newPage();
  const results = [];

  function record(title, passed, detail = "") {
    results.push({ title, passed, detail });
    if (passed) {
      console.log(`  ✅ [PASS] ${title}${detail ? ": " + detail : ""}`);
    } else {
      console.error(`  ❌ [FAIL] ${title}${detail ? ": " + detail : ""}`);
    }
  }

  try {
    console.log("\n--- 1. Navigating to Smart Grid Explorer ---");
    await page.goto(frontdoorUrl, { waitUntil: "load", timeout: 60000 });
    await page.waitForURL(/.*lightning\/n\/Smart_Grid_Explorer.*/, {
      timeout: 45000
    });
    await page
      .locator("c-smart-data-grid")
      .waitFor({ state: "visible", timeout: 30000 });
    await page
      .locator("c-smart-grid-datatable")
      .waitFor({ state: "visible", timeout: 30000 });
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});
    await page.waitForTimeout(3000);

    // 2. Verify Aggregates & Column Totals is NOT present
    console.log("\n--- 2. Verifying Aggregates & Column Totals is Removed ---");
    const totalsBadge = page.locator('text="Aggregates & Column Totals"');
    const isTotalsPresent = await totalsBadge.isVisible();
    record("Aggregates & Column Totals Completely Removed", !isTotalsPresent);

    const shotNoTotals = path.join(
      SCREENSHOT_DIR,
      "12-no-aggregates-column-totals.png"
    );
    await page.screenshot({ path: shotNoTotals });
    console.log(`  📸 Grid without totals screenshot saved: ${shotNoTotals}`);

    // 3. Open Analytics Panel
    console.log("\n--- 3. Opening Bottom Analytics Panel ---");
    const chartBtn = page.locator('[data-testid="toolbar-chart-btn"]');
    await chartBtn.click();
    await page.waitForTimeout(1500);

    const bottomContainer = page.locator(
      '[data-testid="bottom-analytics-container"]'
    );
    const isBottomPanelVisible = await bottomContainer.isVisible();
    record(
      "Analytics Panel Appears as Full-Width Bottom Section",
      isBottomPanelVisible
    );

    // Verify backdrop is NOT present (since it's a bottom section, not a modal drawer)
    const backdrop = page.locator(".drawer-backdrop");
    const hasBackdrop = await backdrop.isVisible().catch(() => false);
    record("No Dimming Backdrop Overlay Blocking Table", !hasBackdrop);

    // Verify data rendered
    const kpiCards = page.locator(".chart-kpi-card");
    const kpiCount = await kpiCards.count();
    record("KPI Metrics Populated", kpiCount === 3, `Found ${kpiCount} cards`);

    const donutSlices = page.locator("c-smart-grid-chart-panel svg path");
    const sliceCount = await donutSlices.count();
    record(
      "Donut Chart Slices Rendered with Data",
      sliceCount > 0,
      `${sliceCount} slices`
    );

    const shotBottomAnalytics = path.join(
      SCREENSHOT_DIR,
      "13-bottom-full-width-analytics.png"
    );
    await page.screenshot({ path: shotBottomAnalytics });
    console.log(
      `  📸 Bottom full-width analytics screenshot saved: ${shotBottomAnalytics}`
    );

    // 4. Test "Cancel" button
    console.log("\n--- 4. Testing Cancel Button ---");
    const cancelBtn = page.locator('[data-testid="chart-cancel-btn"]');
    await cancelBtn.click();
    await page.waitForTimeout(1000);

    const isGoneAfterCancel = !(await bottomContainer
      .isVisible()
      .catch(() => false));
    record("Cancel Button Closes Analytics Panel", isGoneAfterCancel);

    // 5. Test "✕" close button
    console.log("\n--- 5. Testing Close ✕ Button ---");
    await chartBtn.click();
    await page.waitForTimeout(1000);
    record("Re-opened Analytics Panel", await bottomContainer.isVisible());

    const closeBtn = page.locator('[data-testid="chart-close-btn"]');
    await closeBtn.click();
    await page.waitForTimeout(1000);

    const isGoneAfterClose = !(await bottomContainer
      .isVisible()
      .catch(() => false));
    record("Close ✕ Button Dismisses Analytics Panel", isGoneAfterClose);

    const shotClosed = path.join(
      SCREENSHOT_DIR,
      "14-grid-after-dismissing-analytics.png"
    );
    await page.screenshot({ path: shotClosed });
    console.log(`  📸 Grid after dismissing screenshot saved: ${shotClosed}`);
  } catch (err) {
    console.error("❌ Test failed with exception:", err);
    record("Execution Error", false, err.message);
  } finally {
    await browser.close();
    console.log("\n=======================================");
    console.log("📊 BOTTOM ANALYTICS & TOTALS REMOVAL SUMMARY:");
    results.forEach((r) => {
      console.log(
        `  ${r.passed ? "✅" : "❌"} ${r.title}: ${r.detail || (r.passed ? "OK" : "FAILED")}`
      );
    });
    console.log("=======================================\n");
  }
}

verifyBottomAnalytics();
