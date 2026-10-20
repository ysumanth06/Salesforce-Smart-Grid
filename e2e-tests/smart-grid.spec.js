const { test, expect } = require("@playwright/test");
const { execSync } = require("child_process");

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

test.describe("Salesforce Smart Grid End-to-End Suite", () => {
  let browserContext;
  let page;

  test.beforeAll(async ({ browser }) => {
    browserContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    page = await browserContext.newPage();

    const frontdoorUrl = getFrontdoorUrl();
    await page.goto(frontdoorUrl, { waitUntil: "load", timeout: 60000 });
    await page.waitForURL(/.*lightning\/n\/Smart_Grid_Explorer.*/, {
      timeout: 45000
    });

    const grid = page.locator("c-smart-data-grid");
    await expect(grid).toBeVisible({ timeout: 45000 });

    const datatable = page.locator("c-smart-grid-datatable");
    await expect(datatable).toBeVisible({ timeout: 30000 });
  });

  test.afterAll(async () => {
    if (browserContext) {
      await browserContext.close();
    }
  });

  test("1. Grid loads Account seed records with column aggregates and toolbar buttons", async () => {
    // Verify footer showing records count
    const footerRecords = page.locator(
      'c-smart-data-grid span:has-text("records")'
    );
    await expect(footerRecords).toBeVisible({ timeout: 15000 });
    const footerText = await footerRecords.textContent();
    expect(footerText).toContain("records");

    // Verify Column Totals card
    const totalsCard = page.locator("c-smart-data-grid .smart-grid-total-card");
    await expect(totalsCard.first()).toBeVisible({ timeout: 15000 });

    // Verify Toolbar buttons
    await expect(
      page.locator('c-smart-data-grid [data-testid="toolbar-ai-command-btn"]')
    ).toBeVisible();
    await expect(
      page.locator('c-smart-data-grid [data-testid="toolbar-assistant-btn"]')
    ).toBeVisible();
    await expect(
      page.locator('c-smart-data-grid [data-testid="toolbar-data-quality-btn"]')
    ).toBeVisible();
    await expect(
      page.locator('c-smart-data-grid [data-testid="export-menu"]')
    ).toBeVisible();
  });

  test("2. AI Command Palette translates natural language prompt into SOQL filters and applies to grid", async () => {
    const aiBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-ai-command-btn"]'
    );
    await aiBtn.click();

    const modal = page.locator(
      'c-smart-grid-command-palette [data-testid="command-palette-modal"]'
    );
    await expect(modal).toBeVisible({ timeout: 10000 });

    const input = page.locator(
      'c-smart-grid-command-palette [data-testid="palette-input"]'
    );
    await input.fill("Show accounts with Hot rating");
    await input.press("Enter");

    const resultCard = page.locator(
      "c-smart-grid-command-palette .result-card"
    );
    await expect(resultCard).toBeVisible({ timeout: 20000 });

    const applyBtn = page.locator(
      'c-smart-grid-command-palette [data-testid="apply-ai-filters-btn"]'
    );
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });

  test("3. Conversational AI Assistant answers analytics question about seed data", async () => {
    const assistantBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-assistant-btn"]'
    );
    await assistantBtn.click();

    const drawer = page.locator(
      'c-smart-grid-assistant [data-testid="assistant-drawer"]'
    );
    await expect(drawer).toBeVisible({ timeout: 10000 });

    const input = page.locator(
      'c-smart-grid-assistant [data-testid="assistant-input"]'
    );
    const sendBtn = page.locator(
      'c-smart-grid-assistant [data-testid="assistant-send-btn"]'
    );

    await input.fill("What is total annual revenue?");
    await sendBtn.click();

    const reply = page.locator(
      "c-smart-grid-assistant .assistant-bubble:not(.thinking-bubble)"
    );
    await expect(reply.first()).toBeVisible({ timeout: 25000 });

    const replyText = await reply.last().textContent();
    expect(replyText).toMatch(/Annual Revenue|total|revenue|\$/i);

    const closeBtn = page.locator(
      'c-smart-grid-assistant [data-testid="close-assistant-btn"]'
    );
    await closeBtn.click();
    await expect(drawer).not.toBeVisible({ timeout: 10000 });
  });

  test("4. Dataset Health & Data Quality inspector scans records and displays audit summary", async () => {
    const dqBtn = page.locator(
      'c-smart-data-grid [data-testid="toolbar-data-quality-btn"]'
    );
    await dqBtn.click();

    const drawer = page.locator(
      'c-smart-grid-data-quality [data-testid="quality-drawer"]'
    );
    await expect(drawer).toBeVisible({ timeout: 10000 });

    const closeBtn = page.locator(
      'c-smart-grid-data-quality [data-testid="close-drawer-btn"]'
    );
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(drawer).not.toBeVisible({ timeout: 10000 });
  });

  test("5. Export Menu provides CSV and formatted Excel options", async () => {
    const exportBtn = page.locator(
      'c-smart-data-grid [data-testid="export-menu"]'
    );
    await exportBtn.click();
    await expect(
      page.locator('c-smart-data-grid [data-testid="export-csv-item"]')
    ).toBeVisible();
    await expect(
      page.locator('c-smart-data-grid [data-testid="export-excel-item"]')
    ).toBeVisible();
  });
});
