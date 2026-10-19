import { createElement } from "lwc";
import SmartGridCellMultiPicklist from "c/smartGridCellMultiPicklist";

describe("c-smart-grid-cell-multi-picklist", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const MOCK_OPTIONS = [
    { label: "Technology", value: "Technology" },
    { label: "Healthcare", value: "Healthcare" },
    { label: "Finance", value: "Finance" }
  ];

  it("renders semicolon separated values and badge count in view mode", async () => {
    const element = createElement("c-smart-grid-cell-multi-picklist", {
      is: SmartGridCellMultiPicklist
    });
    element.value = "Technology;Finance";
    element.options = MOCK_OPTIONS;
    document.body.appendChild(element);

    await Promise.resolve();

    const displayWrapper = element.shadowRoot.querySelector(
      ".multi-display-wrapper"
    );
    expect(displayWrapper).not.toBeNull();
    expect(displayWrapper.textContent).toContain("Technology; Finance");

    const badge = element.shadowRoot.querySelector(".slds-badge");
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe("2");
  });

  it("allows selecting all options and applying changes", async () => {
    const element = createElement("c-smart-grid-cell-multi-picklist", {
      is: SmartGridCellMultiPicklist
    });
    element.value = "Technology";
    element.options = MOCK_OPTIONS;
    element.context = "REC_101";
    element.fieldName = "Sectors__c";
    element.isEditable = true;
    document.body.appendChild(element);

    const changeHandler = jest.fn();
    element.addEventListener("cellchange", changeHandler);

    await Promise.resolve();

    // Start editing
    element.shadowRoot
      .querySelector(".multi-display-wrapper")
      .dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();

    // Click "All" button
    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const allBtn = Array.from(buttons).find((b) => b.label === "All");
    allBtn.click();

    await Promise.resolve();

    // Click Apply
    const applyBtn = element.shadowRoot.querySelector(
      '[data-testid="multi-apply-btn"]'
    );
    applyBtn.click();

    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail.recordId).toBe("REC_101");
    expect(changeHandler.mock.calls[0][0].detail.value).toBe(
      "Technology;Healthcare;Finance"
    );
  });

  it("clears all options when Clear is clicked", async () => {
    const element = createElement("c-smart-grid-cell-multi-picklist", {
      is: SmartGridCellMultiPicklist
    });
    element.value = "Technology;Finance";
    element.options = MOCK_OPTIONS;
    element.context = "REC_101";
    element.fieldName = "Sectors__c";
    element.isEditable = true;
    document.body.appendChild(element);

    const changeHandler = jest.fn();
    element.addEventListener("cellchange", changeHandler);

    await Promise.resolve();

    element.shadowRoot
      .querySelector(".multi-display-wrapper")
      .dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const clearBtn = Array.from(buttons).find((b) => b.label === "Clear");
    clearBtn.click();

    await Promise.resolve();

    const applyBtn = element.shadowRoot.querySelector(
      '[data-testid="multi-apply-btn"]'
    );
    applyBtn.click();

    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail.value).toBe("");
  });
});
