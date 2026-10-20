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

async function verifyTransposeEditing() {
  const frontdoorUrl = getFrontdoorUrl();
  console.log("🚀 Launching browser to verify Transpose Editing...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
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

    // 2. Select 3 records
    console.log("\n--- 2. Selecting 3 records for Transpose ---");
    const checkboxes = page.locator(
      "c-smart-grid-datatable tbody tr lightning-primitive-cell-checkbox"
    );
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();
    await page.waitForTimeout(1000);

    // 3. Click Transpose button
    console.log("\n--- 3. Opening Transpose View ---");
    const transposeBtn = page.locator('[data-testid="toolbar-transpose-btn"]');
    await transposeBtn.click();
    await page.waitForTimeout(2000);

    const transposeTable = page.locator("c-smart-grid-transpose-table");
    await transposeTable.waitFor({ state: "visible", timeout: 15000 });
    record("Transpose View Rendered", await transposeTable.isVisible());

    // 4. Hover over an editable cell and verify edit button
    console.log("\n--- 4. Hovering on Editable Cell ---");
    const editableCells = page.locator("td.transpose-cell-editable");
    const editableCount = await editableCells.count();
    record(
      "Editable Cells Present",
      editableCount > 0,
      `Found ${editableCount} editable cells`
    );

    const targetCell = editableCells.first();
    await targetCell.hover();
    await page.waitForTimeout(500);

    const editBtn = targetCell.locator(".cell-edit-btn");
    record("Edit Pencil Button Visible on Hover", await editBtn.isVisible());

    const hoverScreenshot = path.join(
      SCREENSHOT_DIR,
      "09-transpose-edit-hover.png"
    );
    await page.screenshot({ path: hoverScreenshot });
    console.log(`  📸 Hover screenshot saved: ${hoverScreenshot}`);

    // 5. Click the edit pencil button
    console.log("\n--- 5. Clicking Edit Pencil Button ---");
    await editBtn.click();
    await page.waitForTimeout(500);

    const inlineInput = targetCell.locator(".cell-inline-input");
    const isInputVisible = await inlineInput.isVisible();
    record("Inline Input Field Appears on Edit Click", isInputVisible);

    const editingScreenshot = path.join(
      SCREENSHOT_DIR,
      "10-transpose-inline-input.png"
    );
    await page.screenshot({ path: editingScreenshot });
    console.log(`  📸 Inline input screenshot saved: ${editingScreenshot}`);

    // 6. Enter a modified value and blur
    console.log("\n--- 6. Modifying Value and Committing Draft ---");
    const originalVal = await inlineInput.inputValue();
    await inlineInput.fill(originalVal + " (Updated)");
    await inlineInput.press("Enter");
    await page.waitForTimeout(1000);

    // 7. Verify Save/Cancel actions appear in toolbar and bottom dock
    const saveToolbarBtn = page.locator('[data-testid="transpose-save-btn"]');
    const saveDockBtn = page.locator('[data-testid="transpose-dock-save-btn"]');
    const isSaveToolbarVisible = await saveToolbarBtn.isVisible();
    const isSaveDockVisible = await saveDockBtn.isVisible();
    record(
      "Save Button Appears in Toolbar & Sticky Dock",
      isSaveToolbarVisible && isSaveDockVisible
    );

    const dirtyDot = targetCell.locator(".dirty-dot");
    record(
      "Unsaved Dirty Dot Indicator Displayed on Cell",
      await dirtyDot.isVisible()
    );

    const draftScreenshot = path.join(
      SCREENSHOT_DIR,
      "11-transpose-draft-with-save-dock.png"
    );
    await page.screenshot({ path: draftScreenshot });
    console.log(
      `  📸 Draft with Save dock screenshot saved: ${draftScreenshot}`
    );

    // 8. Test Cancel
    console.log("\n--- 8. Testing Cancel Draft ---");
    const cancelDockBtn = page.locator(
      '[data-testid="transpose-dock-cancel-btn"]'
    );
    await cancelDockBtn.click();
    await page.waitForTimeout(1000);

    const isSaveDockGone = !(await saveDockBtn.isVisible());
    record("Cancel Clears Draft and Hides Save Dock", isSaveDockGone);
  } catch (err) {
    console.error("❌ Test failed with exception:", err);
    record("Execution Error", false, err.message);
  } finally {
    await browser.close();
    console.log("\n=======================================");
    console.log("📊 TRANSPOSE EDITING TEST SUMMARY:");
    results.forEach((r) => {
      console.log(
        `  ${r.passed ? "✅" : "❌"} ${r.title}: ${r.detail || (r.passed ? "OK" : "FAILED")}`
      );
    });
    console.log("=======================================\n");
  }
}

verifyTransposeEditing();
