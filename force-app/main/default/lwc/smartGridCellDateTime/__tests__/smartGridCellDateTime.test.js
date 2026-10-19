import { createElement } from "lwc";
import SmartGridCellDateTime from "c/smartGridCellDateTime";

describe("c-smart-grid-cell-date-time", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const ISO_DATE = "2026-10-18T14:30:00.000Z";

  it("renders localized datetime string in view mode", async () => {
    const element = createElement("c-smart-grid-cell-date-time", {
      is: SmartGridCellDateTime
    });
    element.value = ISO_DATE;
    document.body.appendChild(element);

    await Promise.resolve();

    const displayWrapper = element.shadowRoot.querySelector(
      ".datetime-display-wrapper"
    );
    expect(displayWrapper).not.toBeNull();
    expect(displayWrapper.textContent.length).toBeGreaterThan(0);
  });

  it("enters edit mode, changes date and 15-min interval time, and dispatches cellchange with ISO string", async () => {
    const element = createElement("c-smart-grid-cell-date-time", {
      is: SmartGridCellDateTime
    });
    element.value = ISO_DATE;
    element.context = "REC_DT_1";
    element.fieldName = "CreatedDate";
    element.isEditable = true;
    document.body.appendChild(element);

    const changeHandler = jest.fn();
    element.addEventListener("cellchange", changeHandler);

    await Promise.resolve();

    // Double click to edit
    element.shadowRoot
      .querySelector(".datetime-display-wrapper")
      .dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();

    const dateInput = element.shadowRoot.querySelector(
      '[data-testid="datetime-date-input"]'
    );
    expect(dateInput).not.toBeNull();
    dateInput.value = "2026-11-20";
    dateInput.dispatchEvent(new CustomEvent("change"));

    const timeSelect = element.shadowRoot.querySelector(
      '[data-testid="datetime-time-select"]'
    );
    expect(timeSelect).not.toBeNull();
    timeSelect.value = "10:45";
    timeSelect.dispatchEvent(new CustomEvent("change"));

    await Promise.resolve();

    // Click Apply
    const applyBtn = element.shadowRoot.querySelector(
      '[data-testid="datetime-apply-btn"]'
    );
    applyBtn.click();

    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail.recordId).toBe("REC_DT_1");
    expect(changeHandler.mock.calls[0][0].detail.value).toBe(
      "2026-11-20T10:45:00.000Z"
    );
  });
});
