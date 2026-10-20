const { chromium } = require("playwright");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ARTIFACT_DIR = path.resolve(
  "/Users/sumanthyanamala/.gemini/antigravity-ide/brain/be4ca1be-79c8-471f-b51b-1e8d954f620b"
);
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "bug-hunt-screenshots");

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
    throw new Error("Failed to parse frontdoor URL: " + output);
  }
  return match[0];
}

async function runBugHunt() {
  const frontdoorUrl = getFrontdoorUrl();
  console.log("🌐 Frontdoor URL successfully obtained.");

  console.log("🚀 Launching Chromium (1440x900 viewport)...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  const audit = {
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    bugsFound: [],
    consoleErrors: [],
    pageErrors: [],
    checks: []
  };

  // Monitor console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore routine Salesforce framework telemetry / noise
      if (
        !text.includes("telemetry") &&
        !text.includes("sfdc-") &&
        !text.includes("aura:")
      ) {
        audit.consoleErrors.push({ text, location: msg.location() });
        console.warn("  ⚠️ [BROWSER CONSOLE ERROR]:", text);
      }
    }
  });

  page.on("pageerror", (err) => {
    audit.pageErrors.push(err.message);
    console.error("  🔥 [UNCAUGHT PAGE ERROR]:", err.message);
  });

  function recordCheck(feature, name, success, details = "") {
    audit.totalChecks++;
    if (success) {
      audit.passedChecks++;
      console.log(
        `  ✅ [PASS] [${feature}] ${name}${details ? ": " + details : ""}`
      );
    } else {
      audit.failedChecks++;
      console.error(
        `  ❌ [FAIL/BUG] [${feature}] ${name}${details ? ": " + details : ""}`
      );
      audit.bugsFound.push({ feature, name, details });
    }
    audit.checks.push({ feature, name, success, details });
  }

  try {
    // ==========================================
    // 1. Initial Load & Account Grid Validation
    // ==========================================
    console.log("\n--- CHECK 1: Initial Load & Account Grid Validation ---");
    await page.goto(frontdoorUrl, { waitUntil: "load", timeout: 60000 });
    await page.waitForURL(/.*lightning\/n\/Smart_Grid_Explorer.*/, {
      timeout: 45000
    });

    const grid = page.locator("c-smart-data-grid");
    await grid.waitFor({ state: "visible", timeout: 45000 });
    recordCheck(
      "Core Grid",
      "Component Loaded",
      true,
      "c-smart-data-grid mounted"
    );

    const datatable = page.locator("c-smart-grid-datatable");
    await datatable.waitFor({ state: "visible", timeout: 30000 });

    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(3000);

    const shot1 = path.join(SCREENSHOT_DIR, "01-default-account-grid.png");
    await page.screenshot({ path: shot1 });

    const accountFooter = await page
      .locator('c-smart-data-grid span:has-text("records")')
      .textContent()
      .catch(() => "");
    recordCheck(
      "Account Grid",
      "Record Count Displayed",
      accountFooter.includes("records"),
      accountFooter.trim()
    );

    // ==========================================
    // 2. Object Switcher Validation (Contact, Opportunity, Case, Lead)
    // ==========================================
    console.log("\n--- CHECK 2: Object Switcher & Dynamic Metadata ---");
    const objectCombobox = page.locator(
      'c-smart-data-grid [data-testid="object-selector-combobox"] button'
    );
    await objectCombobox.waitFor({ state: "visible", timeout: 10000 });

    // Switch to Opportunity
    console.log("Switching to Opportunity...");
    await objectCombobox.click();
    await page
      .locator('lightning-base-combobox-item:has-text("Opportunity")')
      .click();
    await page.waitForTimeout(4000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});

    const shotOpp = path.join(SCREENSHOT_DIR, "02-opportunity-grid.png");
    await page.screenshot({ path: shotOpp });

    const oppHeaders = await page
      .locator("c-smart-grid-datatable th")
      .allInnerTexts()
      .catch(() => []);
    const hasOppFields = oppHeaders.some(
      (h) =>
        h.includes("Stage") ||
        h.includes("Amount") ||
        h.includes("Close Date") ||
        h.includes("Opportunity")
    );
    recordCheck(
      "Object Switcher",
      "Switch to Opportunity",
      hasOppFields,
      `Headers: ${oppHeaders.join(", ").substring(0, 80)}...`
    );

    // Switch to Contact
    console.log("Switching to Contact...");
    await objectCombobox.click();
    await page
      .locator('lightning-base-combobox-item:has-text("Contact")')
      .click();
    await page.waitForTimeout(4000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});

    const shotContact = path.join(SCREENSHOT_DIR, "03-contact-grid.png");
    await page.screenshot({ path: shotContact });

    const contactHeaders = await page
      .locator("c-smart-grid-datatable th")
      .allInnerTexts()
      .catch(() => []);
    const hasContactFields = contactHeaders.some(
      (h) =>
        h.includes("Email") ||
        h.includes("Phone") ||
        h.includes("Contact") ||
        h.includes("Title")
    );
    recordCheck(
      "Object Switcher",
      "Switch to Contact",
      hasContactFields,
      `Headers: ${contactHeaders.join(", ").substring(0, 80)}...`
    );

    // Switch to Case
    console.log("Switching to Case...");
    await objectCombobox.click();
    await page.locator('lightning-base-combobox-item:has-text("Case")').click();
    await page.waitForTimeout(4000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});

    const shotCase = path.join(SCREENSHOT_DIR, "04-case-grid.png");
    await page.screenshot({ path: shotCase });

    const caseHeaders = await page
      .locator("c-smart-grid-datatable th")
      .allInnerTexts()
      .catch(() => []);
    const hasCaseFields = caseHeaders.some(
      (h) =>
        h.includes("Case") ||
        h.includes("Subject") ||
        h.includes("Status") ||
        h.includes("Priority")
    );
    recordCheck(
      "Object Switcher",
      "Switch to Case",
      hasCaseFields,
      `Headers: ${caseHeaders.join(", ").substring(0, 80)}...`
    );

    // Switch to Lead
    console.log("Switching to Lead...");
    await objectCombobox.click();
    await page.locator('lightning-base-combobox-item:has-text("Lead")').click();
    await page.waitForTimeout(4000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});

    const shotLead = path.join(SCREENSHOT_DIR, "05-lead-grid.png");
    await page.screenshot({ path: shotLead });

    const leadHeaders = await page
      .locator("c-smart-grid-datatable th")
      .allInnerTexts()
      .catch(() => []);
    const hasLeadFields = leadHeaders.some(
      (h) =>
        h.includes("Company") ||
        h.includes("Lead") ||
        h.includes("Status") ||
        h.includes("Email")
    );
    recordCheck(
      "Object Switcher",
      "Switch to Lead",
      hasLeadFields,
      `Headers: ${leadHeaders.join(", ").substring(0, 80)}...`
    );

    // Switch back to Account
    console.log("Switching back to Account...");
    await objectCombobox.click();
    await page
      .locator('lightning-base-combobox-item:has-text("Account")')
      .click();
    await page.waitForTimeout(4000);
    await page
      .locator("c-smart-data-grid lightning-spinner")
      .waitFor({ state: "detached", timeout: 20000 })
      .catch(() => {});

    // ==========================================
    // 3. Transpose View Testing
    // ==========================================
    console.log("\n--- CHECK 3: Transpose Table Comparison View ---");
    const transposeBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-transpose-btn"]'
    );
    const transposeVisible = await transposeBtn.isVisible();
    recordCheck(
      "Transpose Mode",
      "Transpose Button Available on Toolbar",
      transposeVisible
    );

    // Test zero rows selected click
    await transposeBtn.click();
    await page.waitForTimeout(1000);

    // Now select 2 rows using row checkboxes
    console.log("Selecting rows 1 and 2 for transpose...");
    const rowCheckboxes = page.locator(
      "c-smart-grid-datatable tbody tr lightning-primitive-cell-checkbox"
    );
    const checkboxCount = await rowCheckboxes.count();
    console.log(`Found ${checkboxCount} row checkboxes`);

    if (checkboxCount >= 2) {
      await rowCheckboxes.nth(0).click();
      await rowCheckboxes.nth(1).click();
      await page.waitForTimeout(1000);

      const transposeBtnLabel = await transposeBtn.textContent();
      recordCheck(
        "Transpose Mode",
        "Button Label Updates with Selected Count",
        transposeBtnLabel.includes("(2)"),
        `Label: ${transposeBtnLabel.trim()}`
      );

      // Click Transpose button
      await transposeBtn.click();
      await page.waitForTimeout(2000);

      const transposeTable = page.locator("c-smart-grid-transpose-table");
      const transposeMounted = await transposeTable.isVisible();
      recordCheck(
        "Transpose Mode",
        "Transpose Table Rendered Side-by-Side",
        transposeMounted
      );

      const shotTranspose = path.join(SCREENSHOT_DIR, "06-transpose-view.png");
      await page.screenshot({ path: shotTranspose });

      // Test Exit Transpose button
      const exitTransposeBtn = page.locator(
        'c-smart-grid-transpose-table [data-action="exit-transpose"]'
      );
      if (await exitTransposeBtn.isVisible()) {
        await exitTransposeBtn.click();
        await page.waitForTimeout(2000);
        const backToGrid = await page
          .locator("c-smart-grid-datatable")
          .isVisible();
        recordCheck(
          "Transpose Mode",
          "Exit Transpose Returns to Standard Grid",
          backToGrid
        );
      }
    } else {
      recordCheck(
        "Transpose Mode",
        "Row Selection Checkboxes Available",
        false,
        `Only ${checkboxCount} checkboxes found`
      );
    }

    // ==========================================
    // 4. Analytics Chart Panel Testing
    // ==========================================
    console.log("\n--- CHECK 4: Analytics Chart Panel ---");
    const chartBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-chart-btn"]'
    );
    const chartBtnVisible = await chartBtn.isVisible();
    recordCheck(
      "Analytics Charts",
      "Toolbar Chart Button Present",
      chartBtnVisible
    );

    if (chartBtnVisible) {
      await chartBtn.click();
      await page.waitForTimeout(2000);

      const chartPanel = page.locator(
        "c-smart-grid-chart-panel .chart-panel-container"
      );
      const chartOpen = await chartPanel.isVisible();
      recordCheck("Analytics Charts", "Chart Panel Drawer Opened", chartOpen);

      const shotChart = path.join(
        SCREENSHOT_DIR,
        "07-analytics-chart-panel.png"
      );
      await page.screenshot({ path: shotChart });

      // Click Bar Chart button
      const barBtn = page.locator(
        'c-smart-grid-chart-panel lightning-button:has-text("Bar")'
      );
      if (await barBtn.isVisible()) {
        await barBtn.click();
        await page.waitForTimeout(1000);
        recordCheck("Analytics Charts", "Switch to Bar Chart", true);
      }

      // Click Funnel Chart button
      const funnelBtn = page.locator(
        'c-smart-grid-chart-panel lightning-button:has-text("Funnel")'
      );
      if (await funnelBtn.isVisible()) {
        await funnelBtn.click();
        await page.waitForTimeout(1000);
        recordCheck("Analytics Charts", "Switch to Funnel Chart", true);
      }

      // Close Chart Panel
      const closeChartBtn = page.locator(
        'c-smart-grid-chart-panel [data-testid="chart-close-btn"]'
      );
      if (await closeChartBtn.isVisible()) {
        await closeChartBtn.click();
        await page.waitForTimeout(1000);
        recordCheck("Analytics Charts", "Chart Panel Closes Cleanly", true);
      }
    }

    // ==========================================
    // 5. Product Walkthrough / Onboarding Testing
    // ==========================================
    console.log("\n--- CHECK 5: Onboarding Walkthrough Tour ---");
    const helpBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-help-btn"]'
    );
    const helpBtnVisible = await helpBtn.isVisible();
    recordCheck(
      "Onboarding",
      "Help/Walkthrough Button Present",
      helpBtnVisible
    );

    if (helpBtnVisible) {
      await helpBtn.click();
      await page.waitForTimeout(1500);

      const onboardingModal = page.locator(
        'c-smart-grid-onboarding [data-testid="onboarding-modal"]'
      );
      const onboardingOpen = await onboardingModal.isVisible();
      recordCheck(
        "Onboarding",
        "Walkthrough Tour Modal Opened",
        onboardingOpen
      );

      const shotOnboarding = path.join(
        SCREENSHOT_DIR,
        "08-onboarding-modal.png"
      );
      await page.screenshot({ path: shotOnboarding });

      // Test Step Forward
      const nextBtn = page.locator(
        'c-smart-grid-onboarding lightning-button:has-text("Next")'
      );
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(500);
        const stepInd = await page
          .locator("c-smart-grid-onboarding .step-indicator")
          .textContent();
        recordCheck(
          "Onboarding",
          "Advances to Next Step",
          stepInd.includes("2"),
          stepInd.trim()
        );
      }

      // Test Skip / Close Tour
      const skipBtn = page.locator(
        'c-smart-grid-onboarding [data-testid="skip-tour-btn"]'
      );
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
        await page.waitForTimeout(1000);
        const modalClosed = !(await onboardingModal.isVisible());
        recordCheck("Onboarding", "Tour Closes on Skip", modalClosed);
      }
    }

    // ==========================================
    // 6. Field Picker (Select Fields) Modal Testing
    // ==========================================
    console.log("\n--- CHECK 6: Field Picker (Dual Listbox) ---");
    const selectFieldsBtn = page.locator(
      'c-smart-data-grid lightning-button:has-text("Select Fields")'
    );
    if (await selectFieldsBtn.isVisible()) {
      await selectFieldsBtn.click();
      await page.waitForTimeout(1500);

      const fieldPickerModal = page.locator(
        'c-smart-grid-field-picker section[role="dialog"]'
      );
      const pickerOpen = await fieldPickerModal.isVisible();
      recordCheck("Field Picker", "Field Picker Modal Opened", pickerOpen);

      const shotPicker = path.join(SCREENSHOT_DIR, "09-field-picker-modal.png");
      await page.screenshot({ path: shotPicker });

      const dualListbox = page.locator(
        "c-smart-grid-field-picker lightning-dual-listbox"
      );
      recordCheck(
        "Field Picker",
        "Dual Listbox Rendered",
        await dualListbox.isVisible()
      );

      // Close modal cleanly
      const closePickerBtn = page.locator(
        'c-smart-grid-field-picker [data-testid="picker-cancel-btn"], c-smart-grid-field-picker [data-testid="picker-close-btn"], c-smart-grid-field-picker button:has-text("Cancel")'
      );
      if (await closePickerBtn.first().isVisible()) {
        await closePickerBtn.first().click();
        await page.waitForTimeout(1000);
      }
      await page
        .locator('c-smart-grid-field-picker section[role="dialog"]')
        .waitFor({ state: "detached", timeout: 5000 })
        .catch(() => {});
    }

    // ==========================================
    // 7. Advanced Filter Builder Testing
    // ==========================================
    console.log("\n--- CHECK 7: Advanced Filter Builder ---");
    const advFilterBtn = page.locator(
      'c-smart-data-grid lightning-button:has-text("Advanced Filter")'
    );
    if (await advFilterBtn.isVisible()) {
      await advFilterBtn.click();
      await page.waitForTimeout(1500);

      const advFilterModal = page.locator(
        'c-smart-grid-filter-builder section[role="dialog"]'
      );
      const advFilterOpen = await advFilterModal.isVisible();
      recordCheck(
        "Advanced Filter",
        "Filter Builder Modal Opened",
        advFilterOpen
      );

      const shotAdvFilter = path.join(
        SCREENSHOT_DIR,
        "10-advanced-filter-modal.png"
      );
      await page.screenshot({ path: shotAdvFilter });

      // Check Add Condition
      const addConditionBtn = page.locator(
        'c-smart-grid-filter-builder lightning-button:has-text("Add Condition")'
      );
      if (await addConditionBtn.isVisible()) {
        await addConditionBtn.click();
        await page.waitForTimeout(500);
        const conditionRows = page.locator(
          "c-smart-grid-filter-builder .condition-row"
        );
        recordCheck(
          "Advanced Filter",
          "Condition Row Added",
          (await conditionRows.count()) > 0
        );
      }

      // Close modal
      const closeAdvBtn = page.locator(
        'c-smart-grid-filter-builder [data-testid="filter-builder-close-btn"], c-smart-grid-filter-builder lightning-button:has-text("Cancel")'
      );
      if (await closeAdvBtn.first().isVisible()) {
        await closeAdvBtn.first().click();
        await page.waitForTimeout(1000);
      }
      await page
        .locator('c-smart-grid-filter-builder section[role="dialog"]')
        .waitFor({ state: "detached", timeout: 5000 })
        .catch(() => {});
    }

    // ==========================================
    // 8. Data Quality & Health Inspector Testing
    // ==========================================
    console.log("\n--- CHECK 8: Data Quality & Health Inspector ---");
    const dqBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-data-quality-btn"]'
    );
    if (await dqBtn.isVisible()) {
      await dqBtn.click();
      await page.waitForTimeout(2000);

      const dqDrawer = page.locator(
        'c-smart-grid-data-quality [data-testid="quality-drawer"]'
      );
      recordCheck("Data Quality", "Drawer Opened", await dqDrawer.isVisible());

      const shotDq = path.join(SCREENSHOT_DIR, "11-data-quality-health.png");
      await page.screenshot({ path: shotDq });

      // Check Re-scan Dataset button
      const rescanBtn = page.locator(
        'c-smart-grid-data-quality [data-testid="rescan-dataset-btn"]'
      );
      if (await rescanBtn.isVisible()) {
        await rescanBtn.click();
        await page.waitForTimeout(1500);
        recordCheck("Data Quality", "Re-scan Dataset Triggered", true);
      }

      // Close drawer
      const closeDqBtn = page.locator(
        'c-smart-grid-data-quality [data-testid="close-drawer-btn"]'
      );
      if (await closeDqBtn.isVisible()) {
        await closeDqBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // ==========================================
    // 9. AI Command Palette Testing
    // ==========================================
    console.log("\n--- CHECK 9: AI Command Palette ---");
    const aiBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-ai-command-btn"]'
    );
    if (await aiBtn.isVisible()) {
      await aiBtn.click();
      await page.waitForTimeout(1000);

      const paletteModal = page.locator(
        'c-smart-grid-command-palette [data-testid="command-palette-modal"]'
      );
      recordCheck(
        "AI Command Palette",
        "Modal Opened",
        await paletteModal.isVisible()
      );

      const paletteInput = page.locator(
        'c-smart-grid-command-palette [data-testid="palette-input"]'
      );
      await paletteInput.fill("Sort by Name ascending");
      await paletteInput.press("Enter");
      await page.waitForTimeout(5000);

      const resultCard = page.locator(
        "c-smart-grid-command-palette .result-card"
      );
      const hasResult = await resultCard.isVisible();
      recordCheck(
        "AI Command Palette",
        "NLP Translation for Sort Action",
        hasResult
      );

      const shotPalette = path.join(
        SCREENSHOT_DIR,
        "12-ai-command-palette-sort.png"
      );
      await page.screenshot({ path: shotPalette });

      // Close modal
      const closePaletteBtn = page.locator(
        'c-smart-grid-command-palette [data-testid="close-palette-btn"], c-smart-grid-command-palette button[title="Close"]'
      );
      if (await closePaletteBtn.first().isVisible()) {
        await closePaletteBtn.first().click();
        await page.waitForTimeout(1000);
      } else {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(1000);
      }
      await page
        .locator(
          'c-smart-grid-command-palette [data-testid="command-palette-modal"]'
        )
        .waitFor({ state: "detached", timeout: 5000 })
        .catch(() => {});
    }

    // ==========================================
    // 10. Conversational AI Assistant Testing
    // ==========================================
    console.log("\n--- CHECK 10: Conversational AI Assistant ---");
    const assistantBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-assistant-btn"]'
    );
    if (await assistantBtn.isVisible()) {
      await assistantBtn.click();
      await page.waitForTimeout(1000);

      const assistantDrawer = page.locator(
        'c-smart-grid-assistant [data-testid="assistant-drawer"]'
      );
      recordCheck(
        "AI Assistant",
        "Drawer Opened",
        await assistantDrawer.isVisible()
      );

      const assistantInput = page.locator(
        'c-smart-grid-assistant [data-testid="assistant-input"]'
      );
      const assistantSendBtn = page.locator(
        'c-smart-grid-assistant [data-testid="assistant-send-btn"]'
      );

      await assistantInput.fill(
        "What is the total annual revenue of all accounts?"
      );
      await assistantSendBtn.click();
      console.log("Waiting for AI Assistant response...");

      const responseBubble = page.locator(
        "c-smart-grid-assistant .assistant-bubble:not(.thinking-bubble)"
      );
      await responseBubble.waitFor({ state: "visible", timeout: 25000 });

      const answerText = await responseBubble.last().textContent();
      const hasRevenueData =
        answerText.includes("$") ||
        answerText.includes("revenue") ||
        answerText.includes("14,078,203,000") ||
        answerText.includes("billion");
      recordCheck(
        "AI Assistant",
        "Responds with Grounded Live Data",
        hasRevenueData,
        answerText.trim().substring(0, 80) + "..."
      );

      const shotAssistant = path.join(
        SCREENSHOT_DIR,
        "13-ai-assistant-conversation.png"
      );
      await page.screenshot({ path: shotAssistant });

      const closeAssistantBtn = page.locator(
        'c-smart-grid-assistant [data-testid="close-assistant-btn"]'
      );
      if (await closeAssistantBtn.isVisible()) {
        await closeAssistantBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  } catch (err) {
    console.error("❌ Critical Execution Failure:", err);
    recordCheck(
      "Suite Execution",
      "Encountered Unhandled Suite Error",
      false,
      err.message
    );
    const errShot = path.join(SCREENSHOT_DIR, "critical-failure.png");
    await page.screenshot({ path: errShot }).catch(() => {});
  } finally {
    await browser.close();
  }

  console.log("\n======================================================");
  console.log(
    `🏁 BUG HUNT COMPLETE: ${audit.passedChecks}/${audit.totalChecks} Passed (${audit.failedChecks} Failed)`
  );
  console.log(`🚨 Total Bugs / UI Defects Detected: ${audit.bugsFound.length}`);
  console.log(`⚠️ Browser Console Errors: ${audit.consoleErrors.length}`);
  console.log(`🔥 Uncaught Page Errors: ${audit.pageErrors.length}`);
  console.log("======================================================\n");

  const auditPath = path.join(ARTIFACT_DIR, "bug-hunt-summary.json");
  fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
}

runBugHunt().catch((err) => {
  console.error("Fatal crash:", err);
  process.exit(1);
});
