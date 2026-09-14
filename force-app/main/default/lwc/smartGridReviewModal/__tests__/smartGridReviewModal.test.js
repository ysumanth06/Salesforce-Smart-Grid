import { createElement } from "@lwc/engine-dom";
import SmartGridReviewModal from "c/smartGridReviewModal";

describe("c-smart-grid-review-modal", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  test("does not render modal when isOpen is false", () => {
    const element = createElement("c-smart-grid-review-modal", {
      is: SmartGridReviewModal
    });
    element.isOpen = false;
    document.body.appendChild(element);

    const modal = element.shadowRoot.querySelector(
      '[data-testid="review-modal"]'
    );
    expect(modal).toBeNull();
  });

  test("renders pending changes with original and new values (TC-03-P1, TC-03-P2)", async () => {
    const element = createElement("c-smart-grid-review-modal", {
      is: SmartGridReviewModal
    });
    element.isOpen = true;
    element.gridColumns = [
      { fieldName: "Name", label: "Account Name" },
      { fieldName: "Industry", label: "Industry" },
      { fieldName: "Rating", label: "Rating" }
    ];
    element.gridData = [
      {
        Id: "rec1",
        Name: "Acme Corp",
        Industry: "Agriculture",
        Rating: "Cold"
      },
      { Id: "rec2", Name: "Global Media", Industry: "Media", Rating: "Warm" }
    ];
    // Row 1 has 2 changes, Row 2 has 1 change
    element.draftValues = [
      { Id: "rec1", Industry: "Technology", Rating: "Hot" },
      { Id: "rec2", Industry: "Entertainment" }
    ];
    document.body.appendChild(element);

    await Promise.resolve();

    expect(element.totalChanges).toBe(3);
    expect(element.totalRecords).toBe(2);
    expect(element.summaryText).toBe("3 changes across 2 rows");

    const rows = element.shadowRoot.querySelectorAll(
      '[data-testid="review-row"]'
    );
    expect(rows.length).toBe(3);

    // Verify record names
    const textContent = element.shadowRoot.textContent;
    expect(textContent).toContain("Acme Corp");
    expect(textContent).toContain("Global Media");
    expect(textContent).toContain("Agriculture");
    expect(textContent).toContain("Technology");
    expect(textContent).toContain("Cold");
    expect(textContent).toContain("Hot");
  });

  test("dispatches revertfield event when individual field undo button is clicked (TC-03-P4)", async () => {
    const element = createElement("c-smart-grid-review-modal", {
      is: SmartGridReviewModal
    });
    element.isOpen = true;
    element.gridColumns = [{ fieldName: "Industry", label: "Industry" }];
    element.gridData = [{ Id: "rec1", Name: "Acme", Industry: "Banking" }];
    element.draftValues = [{ Id: "rec1", Industry: "Technology" }];
    document.body.appendChild(element);

    await Promise.resolve();

    const revertHandler = jest.fn();
    element.addEventListener("revertfield", revertHandler);

    const btn = element.shadowRoot.querySelector(
      '[data-testid="revert-field-btn"]'
    );
    expect(btn).not.toBeNull();
    btn.click();

    expect(revertHandler).toHaveBeenCalled();
    const detail = revertHandler.mock.calls[0][0].detail;
    expect(detail.recordId).toBe("rec1");
    expect(detail.fieldName).toBe("Industry");
  });

  test("dispatches discardall event when Discard All is clicked (TC-03-P3)", async () => {
    const element = createElement("c-smart-grid-review-modal", {
      is: SmartGridReviewModal
    });
    element.isOpen = true;
    element.gridData = [{ Id: "rec1", Name: "Acme", Industry: "Banking" }];
    element.draftValues = [{ Id: "rec1", Industry: "Technology" }];
    document.body.appendChild(element);

    await Promise.resolve();

    const discardHandler = jest.fn();
    element.addEventListener("discardall", discardHandler);

    const btn = element.shadowRoot.querySelector(
      '[data-testid="discard-all-btn"]'
    );
    btn.click();

    expect(discardHandler).toHaveBeenCalled();
  });

  test("dispatches save event when Save Changes is clicked", async () => {
    const element = createElement("c-smart-grid-review-modal", {
      is: SmartGridReviewModal
    });
    element.isOpen = true;
    element.gridData = [{ Id: "rec1", Name: "Acme", Industry: "Banking" }];
    element.draftValues = [{ Id: "rec1", Industry: "Technology" }];
    document.body.appendChild(element);

    await Promise.resolve();

    const saveHandler = jest.fn();
    element.addEventListener("save", saveHandler);

    const btn = element.shadowRoot.querySelector(
      '[data-testid="save-changes-btn"]'
    );
    btn.click();

    expect(saveHandler).toHaveBeenCalled();
  });

  test("dispatches close event on cancel or close button click", async () => {
    const element = createElement("c-smart-grid-review-modal", {
      is: SmartGridReviewModal
    });
    element.isOpen = true;
    document.body.appendChild(element);

    await Promise.resolve();

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    const closeBtn = element.shadowRoot.querySelector("header button");
    closeBtn.click();

    expect(closeHandler).toHaveBeenCalled();
  });

  test("handles new records with friendly label (e.g. New Record #1)", async () => {
    const element = createElement("c-smart-grid-review-modal", {
      is: SmartGridReviewModal
    });
    element.isOpen = true;
    element.gridColumns = [{ fieldName: "Name", label: "Name" }];
    element.gridData = [];
    element.draftValues = [{ Id: "new-row-1", Name: "Brand New Account" }];
    document.body.appendChild(element);

    await Promise.resolve();

    const textContent = element.shadowRoot.textContent;
    expect(textContent).toContain("New Record #1");
    expect(textContent).toContain("Brand New Account");
    expect(textContent).toContain("(empty)");
  });

  test("bulk handling: handles 50 filled-down edits smoothly (TC-03-B1)", async () => {
    const element = createElement("c-smart-grid-review-modal", {
      is: SmartGridReviewModal
    });
    element.isOpen = true;
    element.gridColumns = [{ fieldName: "StageName", label: "Stage" }];

    const gridData = [];
    const draftValues = [];
    for (let i = 0; i < 50; i++) {
      gridData.push({
        Id: `rec_${i}`,
        Name: `Opp ${i}`,
        StageName: "Prospecting"
      });
      draftValues.push({ Id: `rec_${i}`, StageName: "Closed Won" });
    }
    element.gridData = gridData;
    element.draftValues = draftValues;
    document.body.appendChild(element);

    await Promise.resolve();

    expect(element.totalChanges).toBe(50);
    expect(element.totalRecords).toBe(50);
    expect(element.summaryText).toBe("50 changes across 50 rows");

    const rows = element.shadowRoot.querySelectorAll(
      '[data-testid="review-row"]'
    );
    expect(rows.length).toBe(50);
  });
});
