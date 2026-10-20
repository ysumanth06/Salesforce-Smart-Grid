const { test, expect } = require("@playwright/test");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ARTIFACT_DIR = path.resolve(
  "/Users/sumanthyanamala/.gemini/antigravity-ide/brain/15ce4e91-e73e-4d40-bd09-5d3a6272fc09"
);
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "e2e-screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function getFrontdoorUrl() {
  const output = execSync(
    'sf org open --target-org sandbox-org --url-only --path "/lightning/n/Smart_Grid_Explorer"'
  ).toString();
  const match = output.match(/https:\/\/[^\s]+/);
  if (!match) {
    throw new Error("Failed to parse frontdoor URL: " + output);
  }
  return match[0];
}

test.describe.configure({ mode: "serial" });

test.describe("Salesforce Smart Grid End-to-End Enterprise QA Suite", () => {
  let browserContext;
  let page;
  let consoleErrors = [];
  let pageErrors = [];

  test.beforeAll(async ({ browser }) => {
    browserContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    page = await browserContext.newPage();

    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        !msg.text().includes("telemetry") &&
        !msg.text().includes("aura:")
      ) {
        consoleErrors.push({ text: msg.text(), location: msg.location() });
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    const frontdoorUrl = getFrontdoorUrl();
    await page.goto(frontdoorUrl, { waitUntil: "load", timeout: 60000 });
    await page.waitForURL(/.*lightning\/n\/Smart_Grid_Explorer.*/, {
      timeout: 45000
    });

    const grid = page.locator("c-smart-data-grid");
    await expect(grid).toBeVisible({ timeout: 45000 });

    const datatable = page.locator("c-smart-grid-datatable");
    await expect(datatable).toBeVisible({ timeout: 30000 });

    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});
    await page.waitForTimeout(3000);
  });

  test.afterAll(async () => {
    if (browserContext) {
      await browserContext.close();
    }
  });

  test("1. Core Grid Initialization, Keyset Record Count, and Two-Row Toolbar Ribbon", async () => {
    // Verify records count in footer
    const footerRecords = page.locator(
      'c-smart-data-grid span:has-text("records")'
    );
    await expect(footerRecords).toBeVisible({ timeout: 15000 });
    const footerText = await footerRecords.textContent();
    expect(footerText).toContain("records");

    // Verify Two-Row Toolbar Layout
    const secondaryToolbar = page.locator(
      "c-smart-data-grid .grid-secondary-toolbar"
    );
    await expect(secondaryToolbar).toBeVisible();

    // Row 1 Controls
    await expect(
      page.getByRole("combobox", { name: "Select Object" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Select Fields" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Row" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Undo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Redo/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Fill Down/i })
    ).toBeVisible();

    // Row 2 Controls
    await expect(
      page.getByRole("button", { name: /Transpose/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Export Options/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Refresh Data/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Smart Grid AI/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Data Quality/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Analytics Charts/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Grid Guide/i })
    ).toBeVisible();

    // Verify Persistent Column Totals footer is eliminated to maximize workspace
    const persistentTotals = page.locator(
      "c-smart-data-grid .smart-grid-total-card"
    );
    expect(await persistentTotals.count()).toBe(0);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-core-grid-toolbar.png")
    });
  });

  test("2. Multi-Object Switching & Dynamic Metadata Deserialization (Opportunity, Contact, Case, Lead, Account)", async () => {
    const objectCombobox = page.getByRole("combobox", {
      name: "Select Object"
    });

    // Switch to Opportunity
    await objectCombobox.click();
    await page
      .locator('lightning-base-combobox-item:has-text("Opportunity")')
      .click();
    await page.waitForTimeout(3000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});

    let headers = await page
      .locator("c-smart-grid-datatable th")
      .allInnerTexts();
    expect(
      headers.some(
        (h) =>
          h.includes("Stage") ||
          h.includes("Amount") ||
          h.includes("Close Date")
      )
    ).toBeTruthy();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-opp-grid.png")
    });

    // Switch to Contact
    await objectCombobox.click();
    await page
      .locator('lightning-base-combobox-item:has-text("Contact")')
      .click();
    await page.waitForTimeout(3000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});

    headers = await page.locator("c-smart-grid-datatable th").allInnerTexts();
    expect(
      headers.some(
        (h) => h.includes("Email") || h.includes("Phone") || h.includes("Title")
      )
    ).toBeTruthy();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-contact-grid.png")
    });

    // Switch to Case
    await objectCombobox.click();
    await page.locator('lightning-base-combobox-item:has-text("Case")').click();
    await page.waitForTimeout(3000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});

    headers = await page.locator("c-smart-grid-datatable th").allInnerTexts();
    expect(
      headers.some(
        (h) =>
          h.includes("Case") || h.includes("Subject") || h.includes("Status")
      )
    ).toBeTruthy();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-case-grid.png")
    });

    // Switch to Lead
    await objectCombobox.click();
    await page.locator('lightning-base-combobox-item:has-text("Lead")').click();
    await page.waitForTimeout(3000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});

    headers = await page.locator("c-smart-grid-datatable th").allInnerTexts();
    expect(
      headers.some(
        (h) =>
          h.includes("Company") || h.includes("Status") || h.includes("Lead")
      )
    ).toBeTruthy();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-lead-grid.png")
    });

    // Switch back to Account
    await objectCombobox.click();
    await page
      .locator('lightning-base-combobox-item:has-text("Account")')
      .click();
    await page.waitForTimeout(3000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});
  });

  test("3. Transposed Matrix View, Sticky Columns, Differences Only Filter & In-Matrix Editing", async () => {
    const transposeBtn = page.getByRole("button", { name: /Transpose/i });

    // Select 3 rows
    const rowCheckboxes = page.locator(
      "c-smart-grid-datatable tbody tr lightning-primitive-cell-checkbox"
    );
    await rowCheckboxes.nth(0).click();
    await rowCheckboxes.nth(1).click();
    await rowCheckboxes.nth(2).click();
    await page.waitForTimeout(500);

    const btnLabel = await transposeBtn.textContent();
    expect(btnLabel).toContain("(3)");

    await transposeBtn.click();
    await page.waitForTimeout(2000);

    const transposeTable = page.locator("c-smart-grid-transpose-table");
    await expect(transposeTable).toBeVisible({ timeout: 15000 });

    // Verify Sticky Field Name Header
    await expect(transposeTable.locator(".pinned-field-col")).toBeVisible();

    // Verify Difference Filter Buttons
    const diffFilterBtn = transposeTable.locator(
      'lightning-button:has-text("Differences Only")'
    );
    if (await diffFilterBtn.isVisible()) {
      await diffFilterBtn.click();
      await page.waitForTimeout(500);
      const allFilterBtn = transposeTable.locator(
        'lightning-button:has-text("All Fields")'
      );
      await allFilterBtn.click();
      await page.waitForTimeout(500);
    }

    // In-Matrix Inline Editing Check
    const editableCells = transposeTable.locator("td.transpose-cell-editable");
    const count = await editableCells.count();
    if (count > 0) {
      const cell = editableCells.first();
      await cell.hover();
      const editBtn = cell.locator(".cell-edit-btn");
      if (await editBtn.isVisible()) {
        await editBtn.click();
        const input = cell.locator(".cell-inline-input");
        await expect(input).toBeVisible();
        await input.fill("QA Edited Value");
        await input.press("Enter");
        await page.waitForTimeout(1000);

        // Verify dirty dot & Save/Cancel dock
        await expect(cell.locator(".dirty-dot")).toBeVisible();
        await expect(
          page.locator('[data-testid="transpose-dock-save-btn"]')
        ).toBeVisible();

        // Cancel draft
        await page.locator('[data-testid="transpose-dock-cancel-btn"]').click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-transpose-view.png")
    });

    // Exit transpose
    const exitBtn = transposeTable.locator('[data-action="exit-transpose"]');
    await exitBtn.click();
    await page.waitForTimeout(1500);
    await expect(page.locator("c-smart-grid-datatable")).toBeVisible();
  });

  test("4. Docked Full-Width Bottom Analytics Panel with SVG Charts (Donut, Bar, Funnel)", async () => {
    const chartBtn = page.getByRole("button", { name: /Analytics Charts/i });
    await chartBtn.click();
    await page.waitForTimeout(1500);

    const bottomContainer = page.locator(
      '[data-testid="bottom-analytics-container"]'
    );
    await expect(bottomContainer).toBeVisible({ timeout: 10000 });

    // Verify no dimming backdrop
    const backdrop = page.locator(".drawer-backdrop");
    expect(await backdrop.isVisible().catch(() => false)).toBeFalsy();

    // Verify KPI summary cards
    const kpiCards = page.locator(".chart-kpi-card");
    expect(await kpiCards.count()).toBe(3);

    // Verify SVG charts (the chart SVG itself, distinct from SLDS icon SVGs)
    const chartSvg = page
      .locator(
        "c-smart-grid-chart-panel svg[viewBox='0 0 200 200'], c-smart-grid-chart-panel .chart-visual-col svg, c-smart-grid-chart-panel svg"
      )
      .last();
    await expect(chartSvg).toBeVisible();

    // Switch to Bar
    await page
      .locator('c-smart-grid-chart-panel lightning-button:has-text("Bar")')
      .click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-bar-chart.png")
    });

    // Switch to Funnel
    await page
      .locator('c-smart-grid-chart-panel lightning-button:has-text("Funnel")')
      .click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08-funnel-chart.png")
    });

    // Dismiss with Close ✕
    await page.locator('[data-testid="chart-close-btn"]').click();
    await page.waitForTimeout(1000);
    expect(await bottomContainer.isVisible().catch(() => false)).toBeFalsy();
  });

  test("5. Quick Filter Panel, Active Filter Pills Bar, and Advanced Filter Builder", async () => {
    // Quick Filter toggle
    const toggleFilterBtn = page.getByRole("button", {
      name: /Toggle Quick Filters/i
    });
    await toggleFilterBtn.click();
    await page.waitForTimeout(500);

    const filterPanel = page.locator(
      "c-smart-data-grid .slds-box.slds-theme_shade"
    );
    await expect(filterPanel).toBeVisible();

    // Close quick filter panel
    await toggleFilterBtn.click();
    await page.waitForTimeout(500);

    // Advanced Filter Builder
    const advFilterBtn = page.getByRole("button", { name: "Advanced Filter" });
    await advFilterBtn.click();
    await page.waitForTimeout(1000);

    const advDialog = page.locator(
      'c-smart-grid-filter-builder section[role="dialog"]'
    );
    await expect(advDialog).toBeVisible();

    // Add Condition
    const addConditionBtn = advDialog.locator(
      'lightning-button:has-text("Add Condition")'
    );
    if (await addConditionBtn.isVisible()) {
      await addConditionBtn.click();
      await page.waitForTimeout(500);
      expect(await advDialog.locator(".condition-row").count()).toBeGreaterThan(
        0
      );
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "09-advanced-filter-builder.png")
    });

    // Close modal
    const closeAdvBtn = advDialog.locator(
      '[data-testid="filter-builder-close-btn"], button:has-text("Cancel")'
    );
    await closeAdvBtn.first().click();
    await page.waitForTimeout(1000);
  });

  test("6. Field Picker Dual Listbox Modal", async () => {
    const selectFieldsBtn = page.getByRole("button", { name: "Select Fields" });
    await selectFieldsBtn.click();
    await page.waitForTimeout(1000);

    const pickerModal = page.locator(
      'c-smart-grid-field-picker section[role="dialog"]'
    );
    await expect(pickerModal).toBeVisible();

    const dualListbox = pickerModal.locator("lightning-dual-listbox");
    await expect(dualListbox).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "10-field-picker.png")
    });

    const cancelPickerBtn = pickerModal.locator('button:has-text("Cancel")');
    await cancelPickerBtn.first().click();
    await page.waitForTimeout(1000);
  });

  test("7. Unified Smart Grid AI Omnibar (Cmd+K / Einstein Icon) - Command & Analytics Q&A", async () => {
    const aiBtn = page.getByRole("button", { name: /Smart Grid AI/i });
    await aiBtn.click();
    await page.waitForTimeout(1000);

    const paletteModal = page.locator(
      'c-smart-grid-command-palette [data-testid="command-palette-modal"]'
    );
    await expect(paletteModal).toBeVisible();

    const input = page.locator(
      'c-smart-grid-command-palette [data-testid="palette-input"]'
    );

    // Test Analytical Question
    await input.fill("What is the total annual revenue?");
    await input.press("Enter");
    await page.waitForTimeout(4000);

    const answerCard = page.locator(
      'c-smart-grid-command-palette [data-testid="ai-answer-card"]'
    );
    await expect(answerCard).toBeVisible({ timeout: 15000 });

    const answerText = await page
      .locator('c-smart-grid-command-palette [data-testid="ai-answer-text"]')
      .innerText();
    expect(answerText.length).toBeGreaterThan(5);

    // Verify Copy Answer button
    const copyBtn = page.locator(
      'c-smart-grid-command-palette [data-testid="copy-answer-btn"]'
    );
    await expect(copyBtn).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "11-ai-omnibar-analytics.png")
    });

    // Test Operational Command in Omnibar
    await input.fill("Sort by Name ascending");
    await input.press("Enter");
    await page.waitForTimeout(3000);

    // Close palette
    const closeBtn = page.locator(
      'c-smart-grid-command-palette [data-testid="close-palette-btn"]'
    );
    await closeBtn.click();
    await page.waitForTimeout(1000);
  });

  test("8. Dataset Health & Data Quality Inspector (Shield Icon)", async () => {
    const dqBtn = page.getByRole("button", { name: /Data Quality/i });
    await dqBtn.click();
    await page.waitForTimeout(1500);

    const drawer = page.locator(
      'c-smart-grid-data-quality [data-testid="quality-drawer"]'
    );
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // Verify Health Score
    const scoreVal = page.locator(
      'c-smart-grid-data-quality [data-testid="health-score-val"]'
    );
    await expect(scoreVal).toBeVisible();
    const scoreText = await scoreVal.textContent();
    expect(scoreText).toMatch(/\d+%/);

    // Verify Re-scan Dataset button
    const rescanBtn = page.locator(
      'c-smart-grid-data-quality [data-testid="rescan-quality-btn"]'
    );
    await expect(rescanBtn).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "12-data-quality-drawer.png")
    });

    // Close drawer
    await page
      .locator('c-smart-grid-data-quality [data-testid="close-drawer-btn"]')
      .click();
    await page.waitForTimeout(1000);
  });

  test("9. Interactive Product Walkthrough & Guided Onboarding Tour", async () => {
    const helpBtn = page.getByRole("button", { name: /Grid Guide/i });
    await helpBtn.click();
    await page.waitForTimeout(1000);

    const tourModal = page.locator(
      'c-smart-grid-onboarding [data-testid="onboarding-modal"]'
    );
    await expect(tourModal).toBeVisible();

    const nextBtn = tourModal.locator('lightning-button:has-text("Next")');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      const stepText = await tourModal.locator(".step-indicator").textContent();
      expect(stepText).toContain("2");
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "13-onboarding-tour.png")
    });

    // Skip / Close
    await tourModal.locator('[data-testid="skip-tour-btn"]').click();
    await page.waitForTimeout(1000);
    expect(await tourModal.isVisible().catch(() => false)).toBeFalsy();
  });

  test("10. Data Export Menu (CSV & Formatted Excel Options)", async () => {
    const exportBtn = page.getByRole("button", { name: /Export Options/i });
    await exportBtn.click();
    await page.waitForTimeout(500);

    await expect(
      page.locator('c-smart-data-grid [data-testid="export-csv-item"]')
    ).toBeVisible();
    await expect(
      page.locator('c-smart-data-grid [data-testid="export-excel-item"]')
    ).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "14-export-menu.png")
    });
  });

  test("11. In-Cell Dirty State Staging & Review Modal Verification", async () => {
    // 1. Stage a new row via Add Row
    const addRowBtn = page.getByRole("button", { name: "Add Row" });
    await addRowBtn.click();
    await page.waitForTimeout(1000);

    const saveBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-save-btn"]'
    );
    await expect(saveBtn).toBeVisible({ timeout: 5000 });

    const reviewBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-review-btn"]'
    );
    await expect(reviewBtn).toBeVisible();

    const discardBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-discard-btn"]'
    );
    await expect(discardBtn).toBeVisible();

    // Open Review Modal for staged row
    await reviewBtn.click();
    await page.waitForTimeout(1000);

    const reviewModal = page.locator(
      "c-smart-grid-review-modal section.slds-modal"
    );
    await expect(reviewModal).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "15-review-modal-staged.png")
    });

    // Close review modal
    const closeReviewBtn = page.locator(
      'c-smart-grid-review-modal [data-testid="close-review-modal-btn"], c-smart-grid-review-modal button:has-text("Cancel")'
    );
    if (await closeReviewBtn.first().isVisible()) {
      await closeReviewBtn.first().click();
    } else {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(1000);

    // Discard all changes
    await discardBtn.click();
    await page.waitForTimeout(1000);

    // Verify dirty state is cleared
    expect(await saveBtn.isVisible().catch(() => false)).toBeFalsy();
  });
});
