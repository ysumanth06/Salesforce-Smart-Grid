import { createElement } from "@lwc/engine-dom";
import SmartGridDataQuality from "c/smartGridDataQuality";
import analyzeDataQuality from "@salesforce/apex/SmartGridDataQualityService.analyzeDataQuality";

jest.mock(
  "@salesforce/apex/SmartGridDataQualityService.analyzeDataQuality",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

describe("c-smart-grid-data-quality", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("does not render drawer when isOpen is false", () => {
    const element = createElement("c-smart-grid-data-quality", {
      is: SmartGridDataQuality
    });
    element.isOpen = false;
    document.body.appendChild(element);

    const drawer = element.shadowRoot.querySelector(
      '[data-testid="quality-drawer"]'
    );
    expect(drawer).toBeNull();
  });

  it("renders health score and issues when open", async () => {
    analyzeDataQuality.mockResolvedValue({
      isSuccess: true,
      healthScore: 85,
      totalRecordsEvaluated: 150,
      duplicateCount: 6,
      missingDataCount: 15,
      issues: [
        {
          issueType: "DUPLICATE",
          fieldName: "Name",
          fieldLabel: "Account Name",
          severity: "HIGH",
          description: "Found 3 duplicate groups",
          affectedCount: 6,
          sampleValues: ["Acme Corp (2x)"]
        }
      ]
    });

    const element = createElement("c-smart-grid-data-quality", {
      is: SmartGridDataQuality
    });
    element.isOpen = true;
    element.objectApiName = "Account";
    document.body.appendChild(element);

    await Promise.resolve();
    await Promise.resolve();

    const score = element.shadowRoot.querySelector(
      '[data-testid="health-score-val"]'
    );
    expect(score).not.toBeNull();
    expect(score.textContent).toContain("85%");

    const filterBtn = element.shadowRoot.querySelector(
      '[data-testid="filter-issue-btn"]'
    );
    expect(filterBtn).not.toBeNull();

    const filterHandler = jest.fn();
    element.addEventListener("filterissue", filterHandler);

    filterBtn.click();

    expect(filterHandler).toHaveBeenCalled();
    expect(filterHandler.mock.calls[0][0].detail.fieldName).toBe("Name");
  });

  it("fires close event on close button click", () => {
    const element = createElement("c-smart-grid-data-quality", {
      is: SmartGridDataQuality
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    const closeBtn = element.shadowRoot.querySelector(
      '[data-testid="close-drawer-btn"]'
    );
    closeBtn.click();

    expect(closeHandler).toHaveBeenCalled();
    expect(element.isOpen).toBe(false);
  });
});
