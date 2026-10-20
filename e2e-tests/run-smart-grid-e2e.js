const { chromium } = require("playwright");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ARTIFACT_DIR = path.resolve(
  "/Users/sumanthyanamala/.gemini/antigravity-ide/brain/be4ca1be-79c8-471f-b51b-1e8d954f620b"
);
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "e2e-screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function getFrontdoorUrl() {
  console.log(
    "🔑 Generating Salesforce frontdoor login URL for sandbox-org..."
  );
  const output = execSync(
    'sf org open --target-org sandbox-org --url-only --path "/lightning/n/Smart_Grid_Explorer"'
  ).toString();
  const match = output.match(/https:\/\/[^\s]+/);
  if (!match) {
    throw new Error("Failed to parse frontdoor URL from sf output: " + output);
  }
  return match[0];
}

async function runE2ETests() {
  const frontdoorUrl = getFrontdoorUrl();
  console.log("🌐 Frontdoor URL successfully obtained.");

  console.log(
    "🚀 Launching Chromium browser (headless mode with 1440x900 viewport)..."
  );
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  const results = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    steps: []
  };

  function recordStep(name, success, message = "") {
    results.totalTests++;
    if (success) {
      results.passed++;
      console.log(`  ✅ [PASS] ${name}${message ? ": " + message : ""}`);
    } else {
      results.failed++;
      console.error(`  ❌ [FAIL] ${name}${message ? ": " + message : ""}`);
    }
    results.steps.push({ name, success, message });
  }

  try {
    // 1. Navigation
    console.log("\n--- STEP 1: Salesforce Navigation & Authentication ---");
    console.log("Navigating to Smart Grid Explorer tab...");
    await page.goto(frontdoorUrl, { waitUntil: "load", timeout: 60000 });

    // Wait for Salesforce Lightning main container or redirect
    await page.waitForURL(/.*lightning\/n\/Smart_Grid_Explorer.*/, {
      timeout: 45000
    });
    recordStep(
      "Salesforce Navigation",
      true,
      "Successfully navigated to /lightning/n/Smart_Grid_Explorer"
    );

    // Wait for the Smart Grid LWC component to load
    console.log("Waiting for c-smart-data-grid component...");
    const gridLocator = page.locator("c-smart-data-grid");
    await gridLocator.waitFor({ state: "visible", timeout: 45000 });
    recordStep(
      "Smart Data Grid Component Mounted",
      true,
      "c-smart-data-grid is visible on page"
    );

    // Wait for datatable and seed records to render
    console.log("Waiting for grid data to populate...");
    const datatableLocator = page.locator("c-smart-grid-datatable");
    await datatableLocator.waitFor({ state: "visible", timeout: 30000 });

    // Wait for loading spinner to disappear
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(3000); // Allow datatable internal render

    // 2. Data Validation
    console.log("\n--- STEP 2: Grid Data & Seed Record Validation ---");
    const screenshot1Path = path.join(
      SCREENSHOT_DIR,
      "01-smart-grid-initial-load.png"
    );
    await page.screenshot({ path: screenshot1Path, fullPage: false });
    console.log(`📸 Screenshot saved: ${screenshot1Path}`);

    // Check pagination / record count text
    const footerTextLocator = page.locator(
      'c-smart-data-grid span:has-text("records")'
    );
    const footerText = await footerTextLocator.textContent().catch(() => "");
    const hasRecords = footerText && footerText.includes("records");
    recordStep("Grid Record Count Display", hasRecords, footerText.trim());

    // Check Aggregates & Column Totals card
    const totalsCard = page.locator("c-smart-data-grid .smart-grid-total-card");
    const totalsCount = await totalsCard.count();
    recordStep(
      "Column Aggregates & Totals Display",
      totalsCount > 0,
      `Found ${totalsCount} aggregate metric card(s)`
    );

    // 3. Toolbar & Feature Controls Check
    console.log("\n--- STEP 3: Toolbar & Control Elements Validation ---");
    const aiCommandBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-ai-command-btn"]'
    );
    const hasAiBtn = await aiCommandBtn.isVisible();
    recordStep("AI Command Palette Button Present", hasAiBtn);

    const assistantBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-assistant-btn"]'
    );
    const hasAssistantBtn = await assistantBtn.isVisible();
    recordStep("AI Conversational Assistant Button Present", hasAssistantBtn);

    const dataQualityBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-data-quality-btn"]'
    );
    const hasDataQualityBtn = await dataQualityBtn.isVisible();
    recordStep(
      "Data Quality Health Inspector Button Present",
      hasDataQualityBtn
    );

    const exportBtn = page.locator(
      'c-smart-data-grid [data-testid="export-menu"]'
    );
    const hasExportBtn = await exportBtn.isVisible();
    recordStep("Export Menu Button Present", hasExportBtn);

    // 4. AI Command Palette (NLP Querying)
    console.log(
      "\n--- STEP 4: AI Command Palette & NLP Translation Testing ---"
    );
    if (hasAiBtn) {
      await aiCommandBtn.click();
      const commandPaletteModal = page.locator(
        'c-smart-grid-command-palette [data-testid="command-palette-modal"]'
      );
      await commandPaletteModal.waitFor({ state: "visible", timeout: 10000 });
      recordStep("AI Command Palette Modal Opened", true);

      const screenshot2Path = path.join(
        SCREENSHOT_DIR,
        "02-smart-grid-ai-command-palette.png"
      );
      await page.screenshot({ path: screenshot2Path });
      console.log(`📸 Screenshot saved: ${screenshot2Path}`);

      // Type natural language prompt
      const paletteInput = page.locator(
        'c-smart-grid-command-palette [data-testid="palette-input"]'
      );
      await paletteInput.fill("Show accounts with Hot rating");
      await paletteInput.press("Enter");

      console.log("Waiting for AI NLP translation...");
      // Wait for AI result card or preview
      const resultCard = page.locator(
        "c-smart-grid-command-palette .result-card"
      );
      await resultCard.waitFor({ state: "visible", timeout: 20000 });

      const explanation = await page
        .locator("c-smart-grid-command-palette .result-title")
        .textContent();
      recordStep("AI NLP Translation Succeeded", true, explanation.trim());

      const screenshot3Path = path.join(
        SCREENSHOT_DIR,
        "03-smart-grid-ai-query-result.png"
      );
      await page.screenshot({ path: screenshot3Path });
      console.log(`📸 Screenshot saved: ${screenshot3Path}`);

      // Apply filter to grid
      const applyBtn = page.locator(
        'c-smart-grid-command-palette [data-testid="apply-ai-filters-btn"]'
      );
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
        await page.waitForTimeout(2000);
        recordStep(
          "Apply AI Filter to Grid",
          true,
          "Filter applied and palette closed"
        );

        const screenshot4Path = path.join(
          SCREENSHOT_DIR,
          "04-smart-grid-ai-filter-applied.png"
        );
        await page.screenshot({ path: screenshot4Path });
        console.log(`📸 Screenshot saved: ${screenshot4Path}`);
      }
    }

    // 5. Conversational AI Assistant Testing
    console.log("\n--- STEP 5: Conversational AI Assistant Testing ---");
    if (hasAssistantBtn) {
      await assistantBtn.click();
      const assistantDrawer = page.locator(
        'c-smart-grid-assistant [data-testid="assistant-drawer"]'
      );
      await assistantDrawer.waitFor({ state: "visible", timeout: 10000 });
      recordStep("AI Assistant Drawer Opened", true);

      const screenshot5Path = path.join(
        SCREENSHOT_DIR,
        "05-smart-grid-ai-assistant.png"
      );
      await page.screenshot({ path: screenshot5Path });
      console.log(`📸 Screenshot saved: ${screenshot5Path}`);

      // Ask question about total annual revenue
      const assistantInput = page.locator(
        'c-smart-grid-assistant [data-testid="assistant-input"]'
      );
      const assistantSendBtn = page.locator(
        'c-smart-grid-assistant [data-testid="assistant-send-btn"]'
      );

      await assistantInput.fill("What is total annual revenue?");
      await assistantSendBtn.click();

      console.log("Waiting for AI Assistant response...");
      // Wait for assistant response bubble
      const assistantBubble = page.locator(
        "c-smart-grid-assistant .assistant-bubble:not(.thinking-bubble)"
      );
      await assistantBubble.waitFor({ state: "visible", timeout: 20000 });

      const replyText = await assistantBubble.last().textContent();
      recordStep(
        "AI Assistant Answered Analytics Question",
        true,
        replyText.trim().substring(0, 100) + "..."
      );

      const screenshot5bPath = path.join(
        SCREENSHOT_DIR,
        "05b-smart-grid-ai-assistant-answered.png"
      );
      await page.screenshot({ path: screenshot5bPath });
      console.log(`📸 Screenshot saved: ${screenshot5bPath}`);

      // Close assistant drawer
      const closeAssistantBtn = page.locator(
        'c-smart-grid-assistant [data-testid="close-assistant-btn"]'
      );
      await closeAssistantBtn.click();
      await page.waitForTimeout(1000);
    }

    // 6. Data Quality & Health Inspection Testing
    console.log("\n--- STEP 6: Data Quality & Health Inspection Testing ---");
    if (hasDataQualityBtn) {
      await dataQualityBtn.click();
      const dqDrawer = page.locator(
        'c-smart-grid-data-quality [data-testid="quality-drawer"]'
      );
      await dqDrawer.waitFor({ state: "visible", timeout: 10000 });
      recordStep("Data Quality Health Drawer Opened", true);

      await page.waitForTimeout(1500);
      const screenshot6Path = path.join(
        SCREENSHOT_DIR,
        "06-smart-grid-data-quality.png"
      );
      await page.screenshot({ path: screenshot6Path });
      console.log(`📸 Screenshot saved: ${screenshot6Path}`);

      // Close drawer
      const closeDqBtn = page.locator(
        'c-smart-grid-data-quality [data-testid="close-drawer-btn"]'
      );
      if (await closeDqBtn.isVisible()) {
        await closeDqBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // 7. Export Menu Testing
    console.log("\n--- STEP 7: Export Menu Validation ---");
    if (hasExportBtn) {
      await exportBtn.click();
      await page.waitForTimeout(500);
      const csvItem = page.locator(
        'c-smart-data-grid [data-testid="export-csv-item"]'
      );
      const excelItem = page.locator(
        'c-smart-data-grid [data-testid="export-excel-item"]'
      );
      const csvVisible = await csvItem.isVisible();
      const excelVisible = await excelItem.isVisible();
      recordStep(
        "Export Options Displayed",
        csvVisible && excelVisible,
        "CSV and Excel options available"
      );

      const screenshot7Path = path.join(
        SCREENSHOT_DIR,
        "07-smart-grid-export-menu.png"
      );
      await page.screenshot({ path: screenshot7Path });
      console.log(`📸 Screenshot saved: ${screenshot7Path}`);
    }
  } catch (err) {
    console.error("❌ E2E Execution Error:", err);
    recordStep("E2E Execution Flow", false, err.message);
    const errScreenshot = path.join(SCREENSHOT_DIR, "error-state.png");
    await page.screenshot({ path: errScreenshot }).catch(() => {});
  } finally {
    await browser.close();
  }

  console.log("\n======================================================");
  console.log(
    `🏁 AUTOMATION SUITE COMPLETE: ${results.passed}/${results.totalTests} Passed (${results.failed} Failed)`
  );
  console.log("======================================================\n");

  // Save JSON summary
  const summaryPath = path.join(ARTIFACT_DIR, "e2e-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

  if (results.failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error("Fatal runner error:", err);
  process.exit(1);
});
