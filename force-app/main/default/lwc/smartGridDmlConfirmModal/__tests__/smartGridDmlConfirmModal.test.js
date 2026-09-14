import { createElement } from "@lwc/engine-dom";
import SmartGridDmlConfirmModal from "c/smartGridDmlConfirmModal";

describe("c-smart-grid-dml-confirm-modal", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("does not render when isOpen is false", () => {
    const element = createElement("c-smart-grid-dml-confirm-modal", {
      is: SmartGridDmlConfirmModal
    });
    element.isOpen = false;
    document.body.appendChild(element);

    const modal = element.shadowRoot.querySelector(
      '[data-testid="dml-confirm-modal"]'
    );
    expect(modal).toBeNull();
  });

  it("renders preview metrics and diff rows when open", () => {
    const element = createElement("c-smart-grid-dml-confirm-modal", {
      is: SmartGridDmlConfirmModal
    });
    element.isOpen = true;
    element.previewResult = {
      isSuccess: true,
      operation: "UPDATE",
      totalAffectedRecords: 12,
      affectedFieldNames: ["Rating"],
      fieldUpdatesJson: '{"Rating":"Hot"}',
      recordIds: ["001000000000001AAA"],
      previewRows: [
        {
          recordId: "001000000000001AAA",
          recordName: "Acme Corp",
          changes: [{ fieldName: "Rating", oldValue: "Warm", newValue: "Hot" }]
        }
      ]
    };
    document.body.appendChild(element);

    const modal = element.shadowRoot.querySelector(
      '[data-testid="dml-confirm-modal"]'
    );
    expect(modal).not.toBeNull();

    const count = element.shadowRoot.querySelector(
      '[data-testid="affected-count"]'
    );
    expect(count.textContent).toBe("12");

    const row = element.shadowRoot.querySelector(".diff-row");
    expect(row).not.toBeNull();
    expect(row.textContent).toContain("Acme Corp");
    expect(row.textContent).toContain("Warm");
    expect(row.textContent).toContain("Hot");
  });

  it("fires cancel event on cancel button click", () => {
    const element = createElement("c-smart-grid-dml-confirm-modal", {
      is: SmartGridDmlConfirmModal
    });
    element.isOpen = true;
    document.body.appendChild(element);

    const cancelHandler = jest.fn();
    element.addEventListener("cancel", cancelHandler);

    const cancelBtn = element.shadowRoot.querySelector(
      '[data-testid="dml-cancel-btn"]'
    );
    cancelBtn.click();

    expect(cancelHandler).toHaveBeenCalled();
  });

  it("fires confirm event on confirm button click", () => {
    const element = createElement("c-smart-grid-dml-confirm-modal", {
      is: SmartGridDmlConfirmModal
    });
    element.isOpen = true;
    element.previewResult = {
      operation: "UPDATE",
      recordIds: ["001000000000001AAA"],
      fieldUpdatesJson: '{"Rating":"Hot"}'
    };
    document.body.appendChild(element);

    const confirmHandler = jest.fn();
    element.addEventListener("confirm", confirmHandler);

    const confirmBtn = element.shadowRoot.querySelector(
      '[data-testid="dml-confirm-btn"]'
    );
    confirmBtn.click();

    expect(confirmHandler).toHaveBeenCalled();
    const detail = confirmHandler.mock.calls[0][0].detail;
    expect(detail.operation).toBe("UPDATE");
    expect(detail.recordIds).toEqual(["001000000000001AAA"]);
  });
});
