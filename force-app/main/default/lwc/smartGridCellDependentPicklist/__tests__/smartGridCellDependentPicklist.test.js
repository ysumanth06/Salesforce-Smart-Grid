import { createElement } from "@lwc/engine-dom";
import SmartGridCellDependentPicklist from "c/smartGridCellDependentPicklist";

describe("c-smart-grid-cell-dependent-picklist", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const MOCK_DEPENDENCY_MAP = {
    US: [
      { label: "California", value: "CA" },
      { label: "New York", value: "NY" }
    ],
    CA: [
      { label: "Ontario", value: "ON" },
      { label: "Quebec", value: "QC" }
    ]
  };

  it("renders display label for the matching controlling value", async () => {
    const element = createElement("c-smart-grid-cell-dependent-picklist", {
      is: SmartGridCellDependentPicklist
    });
    element.controllingValue = "US";
    element.value = "CA";
    element.dependencyMap = MOCK_DEPENDENCY_MAP;
    document.body.appendChild(element);

    await Promise.resolve();

    const displayWrapper = element.shadowRoot.querySelector(
      ".dependent-display-wrapper"
    );
    expect(displayWrapper).not.toBeNull();
    expect(displayWrapper.textContent).toContain("California");
  });

  it("filters available options based on controllingValue and allows selection", async () => {
    const element = createElement("c-smart-grid-cell-dependent-picklist", {
      is: SmartGridCellDependentPicklist
    });
    element.controllingValue = "CA";
    element.value = "ON";
    element.dependencyMap = MOCK_DEPENDENCY_MAP;
    element.context = "REC_STATE_1";
    element.fieldName = "State__c";
    element.isEditable = true;
    document.body.appendChild(element);

    const changeHandler = jest.fn();
    element.addEventListener("cellchange", changeHandler);

    await Promise.resolve();

    // Start editing
    element.shadowRoot
      .querySelector(".dependent-display-wrapper")
      .dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();

    const options = element.shadowRoot.querySelectorAll(
      ".dependent-option-item"
    );
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain("Ontario");
    expect(options[1].textContent).toContain("Quebec");

    // Select Quebec
    options[1].click();

    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail.recordId).toBe("REC_STATE_1");
    expect(changeHandler.mock.calls[0][0].detail.value).toBe("QC");
    expect(changeHandler.mock.calls[0][0].detail.displayValue).toBe("Quebec");
  });

  it("displays empty state when controlling value has no mapped options", async () => {
    const element = createElement("c-smart-grid-cell-dependent-picklist", {
      is: SmartGridCellDependentPicklist
    });
    element.controllingValue = "UK";
    element.dependencyMap = MOCK_DEPENDENCY_MAP;
    element.isEditable = true;
    document.body.appendChild(element);

    await Promise.resolve();

    element.shadowRoot
      .querySelector(".dependent-display-wrapper")
      .dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();

    const emptyState = element.shadowRoot.querySelector(
      ".dependent-empty-state"
    );
    expect(emptyState).not.toBeNull();
    expect(emptyState.textContent).toContain(
      'No options available for controlling value "UK"'
    );
  });
});
