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

async function verifyChartPanel() {
  const frontdoorUrl = getFrontdoorUrl();
  console.log("🚀 Launching browser to verify Analytics Chart Panel...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  const results = [];
  const errors = [];

  page.on("console", (msg) => {
    if (
      msg.type() === "error" &&
      !msg.text().includes("telemetry") &&
      !msg.text().includes("aura:")
    ) {
      errors.push(msg.text());
      console.warn("  ⚠️ [BROWSER CONSOLE ERROR]:", msg.text());
    }
  });

  page.on("pageerror", (err) => {
    errors.push(err.message);
    console.error("  🔥 [PAGE ERROR]:", err.message);
  });

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
    console.log("  c-smart-data-grid and datatable loaded.");

    console.log("\n--- 2. Opening Analytics Chart Panel ---");
    const chartBtn = page.locator('[data-testid="toolbar-chart-btn"]');
    await chartBtn.waitFor({ state: "visible", timeout: 15000 });
    await chartBtn.click();
    console.log("  Clicked toolbar chart button.");

    await page.waitForTimeout(2000);

    // Verify Drawer is visible
    const chartDrawer = page.locator(
      '.chart-drawer, [data-testid="chart-drawer"]'
    );
    const isDrawerVisible = await chartDrawer.isVisible();
    record("Analytics Drawer Opens and is Visible", isDrawerVisible);

    // Verify KPI Cards
    const kpiCards = page.locator(".chart-kpi-card");
    const kpiCount = await kpiCards.count();
    record("KPI Cards Rendered", kpiCount === 3, `Found ${kpiCount} KPI cards`);

    const recordCountText = await page
      .locator(".chart-kpi-card:nth-child(1) .chart-kpi-val")
      .textContent();
    const volumeText = await page
      .locator(".chart-kpi-card:nth-child(2) .chart-kpi-val")
      .textContent();
    const groupsText = await page
      .locator(".chart-kpi-card:nth-child(3) .chart-kpi-val")
      .textContent();
    console.log(
      `  📊 KPI Metrics -> Records: ${recordCountText}, Volume: ${volumeText}, Groups: ${groupsText}`
    );
    record(
      "KPI Metrics Populated with Real Data",
      parseInt(recordCountText) > 0,
      `Records=${recordCountText}, Groups=${groupsText}`
    );

    // Verify Donut Chart Slices (default view)
    const donutPaths = page.locator("svg path");
    const donutSliceCount = await donutPaths.count();
    record(
      "Donut Chart Slices Rendered in SVG",
      donutSliceCount > 0,
      `${donutSliceCount} slices rendered`
    );

    const donutScreenshot = path.join(
      SCREENSHOT_DIR,
      "05-analytics-donut-chart.png"
    );
    await page.screenshot({ path: donutScreenshot });
    console.log(`  📸 Donut chart screenshot saved: ${donutScreenshot}`);

    console.log("\n--- 3. Testing Bar Chart Switcher ---");
    const barBtn = page.locator("lightning-button button", { hasText: "Bar" });
    if ((await barBtn.count()) > 0) {
      await barBtn.click();
    } else {
      await page.locator('lightning-button:has-text("Bar")').click();
    }
    await page.waitForTimeout(1000);

    const hbarItems = page.locator(".hbar-item");
    const hbarCount = await hbarItems.count();
    record(
      "Horizontal Bar Chart Items Rendered",
      hbarCount > 0,
      `${hbarCount} bars rendered`
    );

    const barScreenshot = path.join(
      SCREENSHOT_DIR,
      "06-analytics-bar-chart.png"
    );
    await page.screenshot({ path: barScreenshot });
    console.log(`  📸 Bar chart screenshot saved: ${barScreenshot}`);

    console.log("\n--- 4. Testing Funnel Chart Switcher ---");
    const funnelBtn = page.locator("lightning-button button", {
      hasText: "Funnel"
    });
    if ((await funnelBtn.count()) > 0) {
      await funnelBtn.click();
    } else {
      await page.locator('lightning-button:has-text("Funnel")').click();
    }
    await page.waitForTimeout(1000);

    const funnelPolys = page.locator("svg polygon");
    const funnelCount = await funnelPolys.count();
    record(
      "Funnel Chart Stages Rendered in SVG",
      funnelCount > 0,
      `${funnelCount} trapezoid stages rendered`
    );

    const funnelScreenshot = path.join(
      SCREENSHOT_DIR,
      "07-analytics-funnel-chart.png"
    );
    await page.screenshot({ path: funnelScreenshot });
    console.log(`  📸 Funnel chart screenshot saved: ${funnelScreenshot}`);

    console.log("\n--- 5. Testing Group By Selector ---");
    const groupByCombobox = page.locator(".chart-combobox");
    const hasCombobox = await groupByCombobox.isVisible();
    record("Group By Combobox Selector Available", hasCombobox);

    console.log("\n--- 6. Testing Close Drawer Button ---");
    const closeBtn = page.locator('[data-testid="chart-close-btn"]');
    await closeBtn.click();
    await page.waitForTimeout(1000);

    const isDrawerStillVisible = await chartDrawer.isVisible();
    record("Close Button Hides Analytics Drawer", !isDrawerStillVisible);

    const finalScreenshot = path.join(
      SCREENSHOT_DIR,
      "08-grid-after-closing-analytics.png"
    );
    await page.screenshot({ path: finalScreenshot });
    console.log(`  📸 Closed drawer screenshot saved: ${finalScreenshot}`);
  } catch (err) {
    console.error("❌ Test failed with exception:", err);
    record("Execution Error", false, err.message);
  } finally {
    await browser.close();
    console.log("\n=======================================");
    console.log("📊 ANALYTICS CHART VERIFICATION SUMMARY:");
    results.forEach((r) => {
      console.log(
        `  ${r.passed ? "✅" : "❌"} ${r.title}: ${r.detail || (r.passed ? "OK" : "FAILED")}`
      );
    });
    console.log("=======================================\n");
  }
}

verifyChartPanel();
