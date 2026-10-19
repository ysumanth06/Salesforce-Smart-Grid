import { createElement } from "@lwc/engine-dom";
import SmartGridCellLookup from "c/smartGridCellLookup";
import searchLookupRecords from "@salesforce/apex/SmartGridController.searchLookupRecords";

jest.mock(
  "@salesforce/apex/SmartGridController.searchLookupRecords",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

describe("c-smart-grid-cell-lookup", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const MOCK_RESULTS = [
    { id: "001A", label: "Acme Global", sublabel: "Account" },
    { id: "001B", label: "Acme Labs", sublabel: "Account" }
  ];

  it("renders displayValue in read-only mode", async () => {
    const element = createElement("c-smart-grid-cell-lookup", {
      is: SmartGridCellLookup
    });
    element.value = "001A";
    element.displayValue = "Acme Global";
    document.body.appendChild(element);

    await Promise.resolve();

    const displayWrapper = element.shadowRoot.querySelector(
      ".lookup-display-wrapper"
    );
    expect(displayWrapper).not.toBeNull();
    expect(displayWrapper.textContent).toContain("Acme Global");
  });

  it("enters edit mode on double click and loads search results", async () => {
    searchLookupRecords.mockResolvedValue(MOCK_RESULTS);

    const element = createElement("c-smart-grid-cell-lookup", {
      is: SmartGridCellLookup
    });
    element.value = "001A";
    element.displayValue = "Acme Global";
    element.isEditable = true;
    document.body.appendChild(element);

    await Promise.resolve();

    const displayWrapper = element.shadowRoot.querySelector(
      ".lookup-display-wrapper"
    );
    displayWrapper.dispatchEvent(
      new CustomEvent("dblclick", { bubbles: true })
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(searchLookupRecords).toHaveBeenCalled();
    const items = element.shadowRoot.querySelectorAll(".lookup-item");
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain("Acme Global");
  });

  it("dispatches cellchange event when a record is selected from dropdown", async () => {
    searchLookupRecords.mockResolvedValue(MOCK_RESULTS);

    const element = createElement("c-smart-grid-cell-lookup", {
      is: SmartGridCellLookup
    });
    element.value = "001A";
    element.displayValue = "Acme Global";
    element.context = "REC_123";
    element.fieldName = "AccountId";
    element.isEditable = true;
    document.body.appendChild(element);

    const cellChangeHandler = jest.fn();
    element.addEventListener("cellchange", cellChangeHandler);

    await Promise.resolve();

    // Start editing
    element.shadowRoot
      .querySelector(".lookup-display-wrapper")
      .dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();
    await Promise.resolve();

    // Select second item
    const items = element.shadowRoot.querySelectorAll(".lookup-item");
    items[1].click();

    expect(cellChangeHandler).toHaveBeenCalledTimes(1);
    expect(cellChangeHandler.mock.calls[0][0].detail.recordId).toBe("REC_123");
    expect(cellChangeHandler.mock.calls[0][0].detail.fieldName).toBe(
      "AccountId"
    );
    expect(cellChangeHandler.mock.calls[0][0].detail.value).toBe("001B");
    expect(cellChangeHandler.mock.calls[0][0].detail.displayValue).toBe(
      "Acme Labs"
    );
  });

  it("closes dropdown when Escape key is pressed", async () => {
    searchLookupRecords.mockResolvedValue(MOCK_RESULTS);

    const element = createElement("c-smart-grid-cell-lookup", {
      is: SmartGridCellLookup
    });
    element.isEditable = true;
    document.body.appendChild(element);

    await Promise.resolve();

    element.shadowRoot
      .querySelector(".lookup-display-wrapper")
      .dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();
    await Promise.resolve();

    const input = element.shadowRoot.querySelector("input.cell-inline-input");
    expect(input).not.toBeNull();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    await Promise.resolve();

    // Should return to view mode
    const displayWrapper = element.shadowRoot.querySelector(
      ".lookup-display-wrapper"
    );
    expect(displayWrapper).not.toBeNull();
  });
});
