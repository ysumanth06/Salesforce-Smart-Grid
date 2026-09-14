import { createElement } from "@lwc/engine-dom";
import SmartGridReadingPane from "c/smartGridReadingPane";

describe("c-smart-grid-reading-pane", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  test("renders prompt when no recordId is provided", () => {
    const element = createElement("c-smart-grid-reading-pane", {
      is: SmartGridReadingPane
    });
    element.objectApiName = "Account";
    document.body.appendChild(element);

    const prompt = element.shadowRoot.querySelector(".pane-body p");
    expect(prompt.textContent).toContain(
      "Select a row to preview record details"
    );
  });

  test("renders form when recordId is provided", () => {
    const element = createElement("c-smart-grid-reading-pane", {
      is: SmartGridReadingPane
    });
    element.objectApiName = "Account";
    element.recordId = "001000000000001AAA";
    element.fields = ["Name", "Industry"];
    document.body.appendChild(element);

    const form = element.shadowRoot.querySelector("lightning-record-view-form");
    expect(form).not.toBeNull();
    expect(form.recordId).toBe("001000000000001AAA");
  });

  test("dispatches close event on close button click", () => {
    const element = createElement("c-smart-grid-reading-pane", {
      is: SmartGridReadingPane
    });
    document.body.appendChild(element);

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    element.handleClose();
    expect(closeHandler).toHaveBeenCalled();
  });

  test("displays error message gracefully on record load error", async () => {
    const element = createElement("c-smart-grid-reading-pane", {
      is: SmartGridReadingPane
    });
    element.objectApiName = "Account";
    element.recordId = "001000000000001AAA";
    document.body.appendChild(element);

    element.handleError({ detail: { message: "Access denied" } });

    await Promise.resolve();

    const alert = element.shadowRoot.querySelector(".slds-alert_error");
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain("Access denied");
  });
});
