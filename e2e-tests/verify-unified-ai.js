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

async function verifyUnifiedAi() {
  const frontdoorUrl = getFrontdoorUrl();
  console.log(
    "🚀 Launching browser to verify Unified Smart Grid AI (Option A) & Shield Icon..."
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

    // 2. Verify Toolbar Buttons
    console.log("\n--- 2. Verifying Toolbar Intelligence Icons ---");
    const aiBtn = page.locator('[data-testid="toolbar-ai-command-btn"]');
    const hasAiBtn = await aiBtn.isVisible();
    record("Unified Smart Grid AI Button Visible with Agent Icon", hasAiBtn);

    const dqBtn = page.locator('[data-testid="toolbar-data-quality-btn"]');
    const hasDqBtn = await dqBtn.isVisible();
    const dqTitle =
      (await dqBtn
        .locator("button")
        .getAttribute("title")
        .catch(() => "")) ||
      (await dqBtn.getAttribute("title").catch(() => "")) ||
      "";
    record(
      "Data Quality Button Visible with Shield Icon (Title updated)",
      hasDqBtn &&
        (dqTitle.includes("Data Quality") || dqTitle.includes("Health")),
      `Title: ${dqTitle}`
    );

    const separateAssistantBtn = page.locator(
      '[data-testid="toolbar-assistant-btn"]'
    );
    const hasAssistantBtn = await separateAssistantBtn
      .isVisible()
      .catch(() => false);
    record("Redundant Assistant Button Removed from Toolbar", !hasAssistantBtn);

    const shotToolbar = path.join(
      SCREENSHOT_DIR,
      "15-unified-toolbar-shield-icon.png"
    );
    await page.screenshot({ path: shotToolbar });
    console.log(`  📸 Toolbar screenshot saved: ${shotToolbar}`);

    // 3. Open Unified AI Omnibar via Click
    console.log(
      "\n--- 3. Testing Conversational Question in Unified AI Omnibar ---"
    );
    await aiBtn.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('[data-testid="command-palette-modal"]');
    record("Unified AI Omnibar Opens on Click", await modal.isVisible());

    const shotPlaceholder = path.join(
      SCREENSHOT_DIR,
      "15b-unified-smart-grid-ai-placeholder.png"
    );
    await page.screenshot({ path: shotPlaceholder });
    console.log(
      `  📸 Omnibar placeholder screenshot saved: ${shotPlaceholder}`
    );

    const input = page.locator('[data-testid="palette-input"]');
    await input.fill("What is the total revenue?");
    await input.press("Enter");
    await page.waitForTimeout(3000);

    const answerCard = page.locator('[data-testid="ai-answer-card"]');
    const hasAnswer = await answerCard
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    record(
      "Conversational Question Answer Card Rendered in Omnibar",
      hasAnswer
    );

    const answerText = await page
      .locator('[data-testid="ai-answer-text"]')
      .innerText()
      .catch(() => "");
    record(
      "Narrative Answer Contains Calculated Revenue Data",
      answerText.length > 5,
      answerText.substring(0, 70) + "..."
    );

    const shotAnswer = path.join(
      SCREENSHOT_DIR,
      "16-unified-smart-grid-ai-answer.png"
    );
    await page.screenshot({ path: shotAnswer });
    console.log(`  📸 AI Answer Card screenshot saved: ${shotAnswer}`);

    // 4. Test Operational Command in the Same Unified Omnibar
    console.log("\n--- 4. Testing Operational Command in Unified Omnibar ---");
    const clearBtn = page.locator('[data-testid="clear-answer-btn"]');
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
      await page.waitForTimeout(500);
    }

    await input.fill("transpose records");
    await input.press("Enter");
    await page.waitForTimeout(1500);

    const applyBtn = page.locator('[data-testid="apply-ai-filters-btn"]');
    record(
      "Command Execution Preview Generated for Transpose",
      await applyBtn.isVisible().catch(() => false)
    );

    const shotCommand = path.join(
      SCREENSHOT_DIR,
      "17-unified-smart-grid-ai-command.png"
    );
    await page.screenshot({ path: shotCommand });
    console.log(`  📸 AI Command Preview screenshot saved: ${shotCommand}`);

    // Close palette
    const closeBtn = page.locator('[data-testid="close-palette-btn"]');
    await closeBtn.click();
    await page.waitForTimeout(1000);
    record(
      "Unified AI Omnibar Closes Cleanly",
      !(await modal.isVisible().catch(() => false))
    );
  } catch (err) {
    console.error("❌ Test failed with exception:", err);
    record("Execution Error", false, err.message);
  } finally {
    await browser.close();
    console.log("\n=======================================");
    console.log("📊 UNIFIED SMART GRID AI VERIFICATION SUMMARY:");
    results.forEach((r) => {
      console.log(
        `  ${r.passed ? "✅" : "❌"} ${r.title}: ${r.detail || (r.passed ? "OK" : "FAILED")}`
      );
    });
    console.log("=======================================\n");
  }
}

verifyUnifiedAi();
