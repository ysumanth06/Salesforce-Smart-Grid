import { createElement } from "@lwc/engine-dom";
import SmartGridCommandPalette from "c/smartGridCommandPalette";
import processPrompt from "@salesforce/apex/SmartGridNLPEngine.processPrompt";

jest.mock(
  "@salesforce/apex/SmartGridNLPEngine.processPrompt",
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
});
