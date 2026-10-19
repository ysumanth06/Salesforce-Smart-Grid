import { createElement } from "lwc";
import SmartGridImportModal from "c/smartGridImportModal";
import executeImport from "@salesforce/apex/SmartGridImportService.executeImport";
import executeRollback from "@salesforce/apex/SmartGridImportService.executeRollback";

jest.mock(
  "@salesforce/apex/SmartGridImportService.executeImport",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/SmartGridImportService.executeRollback",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

describe("c-smart-grid-import-modal", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const MOCK_FIELDS = [
    { label: "Account Name", fieldName: "Name", type: "text" },
    { label: "Industry", fieldName: "Industry", type: "text" },
    { label: "Annual Revenue", fieldName: "AnnualRevenue", type: "currency" }
  ];

  it("renders upload dropzone initially", async () => {
    const element = createElement("c-smart-grid-import-modal", {
      is: SmartGridImportModal
    });
    element.objectApiName = "Account";
    element.availableFields = MOCK_FIELDS;
    document.body.appendChild(element);

    await Promise.resolve();

    const dropzone = element.shadowRoot.querySelector(".import-dropzone");
    expect(dropzone).not.toBeNull();
  });

  it("parses CSV, auto-maps columns, and executes import", async () => {
    executeImport.mockResolvedValue({
      isSuccess: true,
      totalInserted: 2,
      totalFailed: 0,
      rollbackToken: "TOKEN_123",
      createdRecordIds: ["001_1", "001_2"]
    });

    const element = createElement("c-smart-grid-import-modal", {
      is: SmartGridImportModal
    });
    element.objectApiName = "Account";
    element.availableFields = MOCK_FIELDS;
    document.body.appendChild(element);

    await Promise.resolve();

    // Directly trigger processCsvText
    const csvContent =
      "Account Name,Industry,Annual Revenue\r\nAcme Alpha,Tech,100000\r\nAcme Beta,Finance,200000";
    element.processCsvText(csvContent);

    await Promise.resolve();

    // Now in mapping step
    const mappingTable = element.shadowRoot.querySelector(".mapping-table");
    expect(mappingTable).not.toBeNull();

    // Click Execute Import
    const importBtn = element.shadowRoot.querySelector(
      '[data-testid="execute-import-btn"]'
    );
    expect(importBtn).not.toBeNull();
    importBtn.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(executeImport).toHaveBeenCalledTimes(1);

    // Results step banner
    const resultBanner = element.shadowRoot.querySelector(
      ".import-success-banner"
    );
    expect(resultBanner).not.toBeNull();
    expect(resultBanner.textContent).toContain("2");
  });

  it("executes rollback when Undo Import button is clicked", async () => {
    executeImport.mockResolvedValue({
      isSuccess: true,
      totalInserted: 2,
      totalFailed: 0,
      rollbackToken: "TOKEN_123",
      createdRecordIds: ["001_1", "001_2"]
    });

    executeRollback.mockResolvedValue({
      isSuccess: true,
      totalDeleted: 2
    });

    const element = createElement("c-smart-grid-import-modal", {
      is: SmartGridImportModal
    });
    element.objectApiName = "Account";
    element.availableFields = MOCK_FIELDS;
    document.body.appendChild(element);

    await Promise.resolve();

    element.processCsvText("Account Name\r\nAcme A\r\nAcme B");

    await Promise.resolve();

    element.shadowRoot
      .querySelector('[data-testid="execute-import-btn"]')
      .click();

    await Promise.resolve();
    await Promise.resolve();

    // Click Rollback
    const rollbackBtn = element.shadowRoot.querySelector(
      '[data-testid="rollback-btn"]'
    );
    expect(rollbackBtn).not.toBeNull();
    rollbackBtn.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(executeRollback).toHaveBeenCalledWith({
      rollbackToken: "TOKEN_123",
      recordIds: ["001_1", "001_2"]
    });
  });
});
