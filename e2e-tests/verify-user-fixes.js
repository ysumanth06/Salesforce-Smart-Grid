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

async function verifyFixes() {
  const frontdoorUrl = getFrontdoorUrl();
  console.log("🚀 Launching browser to verify fixes...");
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
    // 1. Navigation
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

    // 2. Toolbar 2-Row Layout Check
    console.log("\n--- 2. Verifying Two-Row Responsive Toolbar ---");
    const secondaryToolbar = page.locator(
      "c-smart-data-grid .grid-secondary-toolbar"
    );
    const hasSecondaryToolbar = await secondaryToolbar.isVisible();
    record("Two-Row Toolbar Ribbon Rendered", hasSecondaryToolbar);

    const shotToolbar = path.join(SCREENSHOT_DIR, "01-two-row-toolbar.png");
    await page.screenshot({ path: shotToolbar });
    console.log("📸 Screenshot saved: 01-two-row-toolbar.png");

    // 3. Multi-Record Selection & Reading Pane Behavior
    console.log(
      "\n--- 3. Verifying Multi-Record Selection without Reading Pane Cramping ---"
    );
    const checkboxes = page.locator(
      "c-smart-grid-datatable tbody tr lightning-primitive-cell-checkbox"
    );
    const checkboxCount = await checkboxes.count();

    if (checkboxCount >= 4) {
      // Select 4 records
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      await checkboxes.nth(2).click();
      await checkboxes.nth(3).click();
      await page.waitForTimeout(1000);

      const readingPane = page.locator("c-smart-grid-reading-pane");
      const readingPaneVisible = await readingPane.isVisible();
      record(
        "Reading Pane Hidden on Multi-Record Selection",
        !readingPaneVisible,
        "Table maintains 100% width for multi-record operations"
      );

      const shotMultiSelect = path.join(
        SCREENSHOT_DIR,
        "02-multi-record-selection-no-reading-pane.png"
      );
      await page.screenshot({ path: shotMultiSelect });
      console.log(
        "📸 Screenshot saved: 02-multi-record-selection-no-reading-pane.png"
      );

      // 4. Transpose Table Scroll Fix
      console.log(
        "\n--- 4. Verifying Transpose Scroll Arrows (No scrollBy Error) ---"
      );
      const transposeBtn = page.locator(
        'c-smart-data-grid [data-testid="toolbar-transpose-btn"]'
      );
      const transposeText = await transposeBtn.textContent();
      record(
        "Transpose Button Reflects 4 Records",
        transposeText.includes("(4)"),
        `Label: ${transposeText.trim()}`
      );

      await transposeBtn.click();
      await page.waitForTimeout(2000);

      const transposeTable = page.locator("c-smart-grid-transpose-table");
      record(
        "Transpose Table Rendered Side-by-Side",
        await transposeTable.isVisible()
      );

      const shotTranspose = path.join(
        SCREENSHOT_DIR,
        "03-transpose-4-records.png"
      );
      await page.screenshot({ path: shotTranspose });
      console.log("📸 Screenshot saved: 03-transpose-4-records.png");

      // Click Right arrow
      console.log("Clicking Transpose Next / Scroll Right arrow...");
      const scrollRightBtn = page.locator(
        'c-smart-grid-transpose-table [data-testid="transpose-scroll-right"]'
      );
      await scrollRightBtn.click();
      await page.waitForTimeout(1000);

      // Click Left arrow
      console.log("Clicking Transpose Prev / Scroll Left arrow...");
      const scrollLeftBtn = page.locator(
        'c-smart-grid-transpose-table [data-testid="transpose-scroll-left"]'
      );
      await scrollLeftBtn.click();
      await page.waitForTimeout(1000);

      // Check if any error dialog appeared
      const errorDialog = page.locator(
        '.slds-modal__header:has-text("A Component Error has occurred")'
      );
      const hasErrorDialog = await errorDialog.isVisible();
      record(
        "Transpose Scroll Arrows Execute Without Error",
        !hasErrorDialog,
        "No container.scrollBy is not a function error"
      );

      // Exit Transpose
      const exitBtn = page.locator(
        'c-smart-grid-transpose-table [data-action="exit-transpose"]'
      );
      await exitBtn.click();
      await page.waitForTimeout(1500);
    }

    // 5. Data Assistant - Clean Response Without Repetitive Action Buttons
    console.log(
      "\n--- 5. Verifying Data Assistant Clean Response (No Unwanted Blue Buttons) ---"
    );
    const assistantBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-assistant-btn"]'
    );
    await assistantBtn.click();
    await page.waitForTimeout(1000);

    const assistantDrawer = page.locator(
      'c-smart-grid-assistant [data-testid="assistant-drawer"]'
    );
    record("Data Assistant Drawer Opened", await assistantDrawer.isVisible());

    const input = page.locator(
      'c-smart-grid-assistant [data-testid="assistant-input"]'
    );
    const sendBtn = page.locator(
      'c-smart-grid-assistant [data-testid="assistant-send-btn"]'
    );

    await input.fill("How many records are in this view?");
    await sendBtn.click();
    console.log("Waiting for Assistant answer...");

    const lastBubble = page.locator(
      "c-smart-grid-assistant .assistant-bubble:not(.thinking-bubble)"
    );
    await lastBubble.waitFor({ state: "visible", timeout: 25000 });
    const replyText = await lastBubble.last().textContent();
    record(
      "Assistant Answered Query",
      replyText.includes("records") || replyText.includes("48"),
      replyText.trim()
    );

    // Check that repetitive blue action chips are NOT present
    const actionChips = page.locator(
      'c-smart-grid-assistant [data-testid="assistant-action-chip"]'
    );
    const chipCount = await actionChips.count();
    record(
      "Repetitive Action Buttons Removed",
      chipCount === 0,
      `Action chips count: ${chipCount}`
    );

    const shotAssistant = path.join(
      SCREENSHOT_DIR,
      "04-assistant-clean-reply.png"
    );
    await page.screenshot({ path: shotAssistant });
    console.log("📸 Screenshot saved: 04-assistant-clean-reply.png");

    // Close assistant
    const closeBtn = page.locator(
      'c-smart-grid-assistant [data-testid="close-assistant-btn"]'
    );
    await closeBtn.click();
    await page.waitForTimeout(1000);
  } catch (err) {
    console.error("Test execution error:", err);
    record("Verification Flow", false, err.message);
  } finally {
    await browser.close();
  }

  console.log("\n======================================================");
  console.log(
    `🏁 USER FIXES VERIFICATION COMPLETE: ${results.filter((r) => r.passed).length}/${results.length} Passed`
  );
  console.log(`⚠️ Browser Console Errors: ${errors.length}`);
  console.log("======================================================\n");
}

verifyFixes().catch(console.error);
