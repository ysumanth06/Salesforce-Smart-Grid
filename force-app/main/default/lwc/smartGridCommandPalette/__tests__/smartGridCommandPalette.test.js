import { createElement } from "@lwc/engine-dom";
import SmartGridCommandPalette from "c/smartGridCommandPalette";
import processPrompt from "@salesforce/apex/SmartGridNLPEngine.processPrompt";
import previewDML from "@salesforce/apex/SmartGridNLPDMLHandler.previewDML";

jest.mock(
  "@salesforce/apex/SmartGridNLPEngine.processPrompt",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/SmartGridNLPDMLHandler.previewDML",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

describe("c-smart-grid-command-palette", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("does not render modal when isOpen is false", () => {
    const element = createElement("c-smart-grid-command-palette", {
      is: SmartGridCommandPalette
    });
    element.isOpen = false;
    document.body.appendChild(element);

    const modal = element.shadowRoot.querySelector(
      '[data-testid="command-palette-modal"]'
    );
    expect(modal).toBeNull();
  });

  it("renders modal and input when isOpen is true", () => {
    const element = createElement("c-smart-grid-command-palette", {
      is: SmartGridCommandPalette
    });
    element.isOpen = true;
    element.objectApiName = "Account";
    document.body.appendChild(element);

    const modal = element.shadowRoot.querySelector(
      '[data-testid="command-palette-modal"]'
    );
    expect(modal).not.toBeNull();

    const input = element.shadowRoot.querySelector(
      '[data-testid="palette-input"]'
    );
    expect(input).not.toBeNull();
  });

  it("calls processPrompt on Enter and renders result card", async () => {
    processPrompt.mockResolvedValue({
      isSuccess: true,
      explanation: "Rating equals Hot",
      generatedSoql: "SELECT Id, Name FROM Account WHERE Rating = 'Hot'",
      filters: [{ field: "Rating", operator: "=", value: "Hot" }],
      sortField: "Name",
      sortDirection: "ASC",
      recordLimit: 25
    });

    const element = createElement("c-smart-grid-command-palette", {
      is: SmartGridCommandPalette
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const input = element.shadowRoot.querySelector(
      '[data-testid="palette-input"]'
    );
    input.value = "Rating is Hot";
    input.dispatchEvent(new CustomEvent("input"));

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter"
      })
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(processPrompt).toHaveBeenCalledWith({
      prompt: "Rating is Hot",
      objectApiName: "Account",
      configDevName: "",
      availableFields: ["Id", "Name"]
    });

    const applyBtn = element.shadowRoot.querySelector(
      '[data-testid="apply-ai-filters-btn"]'
    );
    expect(applyBtn).not.toBeNull();

    const applyHandler = jest.fn();
    element.addEventListener("applyfilters", applyHandler);

    applyBtn.click();

    expect(applyHandler).toHaveBeenCalled();
    const eventDetail = applyHandler.mock.calls[0][0].detail;
    expect(eventDetail.explanation).toBe("Rating equals Hot");
    expect(eventDetail.filters[0].field).toBe("Rating");
  });

  it("handles Escape key to close modal", () => {
    const element = createElement("c-smart-grid-command-palette", {
      is: SmartGridCommandPalette
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    const modal = element.shadowRoot.querySelector(
      '[data-testid="command-palette-modal"]'
    );
    modal.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape"
      })
    );

    expect(closeHandler).toHaveBeenCalled();
    expect(element.isOpen).toBe(false);
  });

  it("handles direct transpose command workflow without Apex call", async () => {
    const element = createElement("c-smart-grid-command-palette", {
      is: SmartGridCommandPalette
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const input = element.shadowRoot.querySelector(
      '[data-testid="palette-input"]'
    );
    input.value = "transpose records";
    input.dispatchEvent(new CustomEvent("input"));

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter"
      })
    );

    await Promise.resolve();

    expect(processPrompt).not.toHaveBeenCalled();

    const applyBtn = element.shadowRoot.querySelector(
      '[data-testid="apply-ai-filters-btn"]'
    );
    expect(applyBtn).not.toBeNull();

    const applyHandler = jest.fn();
    element.addEventListener("applyfilters", applyHandler);
    applyBtn.click();

    expect(applyHandler).toHaveBeenCalled();
    const eventDetail = applyHandler.mock.calls[0][0].detail;
    expect(eventDetail.action).toBe("transpose");
  });

  it("handles direct group by command workflow", async () => {
    const element = createElement("c-smart-grid-command-palette", {
      is: SmartGridCommandPalette
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const input = element.shadowRoot.querySelector(
      '[data-testid="palette-input"]'
    );
    input.value = "group by Industry and Type";
    input.dispatchEvent(new CustomEvent("input"));

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter"
      })
    );

    await Promise.resolve();

    expect(processPrompt).not.toHaveBeenCalled();

    const applyBtn = element.shadowRoot.querySelector(
      '[data-testid="apply-ai-filters-btn"]'
    );
    const applyHandler = jest.fn();
    element.addEventListener("applyfilters", applyHandler);
    applyBtn.click();

    expect(applyHandler).toHaveBeenCalled();
    const eventDetail = applyHandler.mock.calls[0][0].detail;
    expect(eventDetail.action).toBe("group");
    expect(eventDetail.groupFields).toEqual(["Industry", "Type"]);
  });

  it("handles DML update command and dispatches applydml event", async () => {
    previewDML.mockResolvedValue({
      isSuccess: true,
      operation: "UPDATE",
      explanation: "Set Rating to Hot",
      targetObject: "Account",
      totalAffectedRecords: 2,
      previewRows: [
        {
          recordId: "001xx000003DHPxAAO",
          recordName: "Acme Corp",
          changes: [{ fieldName: "Rating", oldValue: "Cold", newValue: "Hot" }]
        }
      ]
    });

    const element = createElement("c-smart-grid-command-palette", {
      is: SmartGridCommandPalette
    });
    element.isOpen = true;
    element.selectedRecordIds = ["001xx000003DHPxAAO"];
    document.body.appendChild(element);

    const applyDmlHandler = jest.fn();
    element.addEventListener("applydml", applyDmlHandler);

    const input = element.shadowRoot.querySelector(
      '[data-testid="palette-input"]'
    );
    input.value = "Set Rating to Hot";
    input.dispatchEvent(new CustomEvent("input"));

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter"
      })
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(previewDML).toHaveBeenCalled();
    const applyDmlBtn = element.shadowRoot.querySelector(
      '[data-testid="apply-ai-dml-btn"]'
    );
    expect(applyDmlBtn).not.toBeNull();
    applyDmlBtn.click();

    expect(applyDmlHandler).toHaveBeenCalled();
    expect(applyDmlHandler.mock.calls[0][0].detail.operation).toBe("UPDATE");
  });
});
