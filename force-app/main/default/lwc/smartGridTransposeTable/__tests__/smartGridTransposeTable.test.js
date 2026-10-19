import { createElement } from "lwc";
import SmartGridTransposeTable from "c/smartGridTransposeTable";

describe("c-smart-grid-transpose-table", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const MOCK_COLUMNS = [
    { fieldName: "Name", label: "Account Name", type: "text", editable: true },
    { fieldName: "Industry", label: "Industry", type: "text", editable: true },
    {
      fieldName: "AnnualRevenue",
      label: "Annual Revenue",
      type: "currency",
      editable: true
    }
  ];

  const MOCK_RECORDS = [
    {
      Id: "001A",
      Name: "Acme Corp",
      Industry: "Technology",
      AnnualRevenue: 100000
    },
    {
      Id: "001B",
      Name: "Acme Corp",
      Industry: "Finance",
      AnnualRevenue: 100000
    }
  ];

  it("renders transposed matrix headers and field rows", async () => {
    const element = createElement("c-smart-grid-transpose-table", {
      is: SmartGridTransposeTable
    });
    element.columns = MOCK_COLUMNS;
    element.records = MOCK_RECORDS;
    document.body.appendChild(element);

    await Promise.resolve();

    // 1 pinned field header + 2 record headers + 1 status header = 4 headers
    const headers = element.shadowRoot.querySelectorAll("thead th");
    expect(headers).toHaveLength(4);
    expect(headers[0].textContent).toContain("Field Name");
    expect(headers[1].textContent).toContain("Acme Corp");

    // 3 rows (1 per field)
    const rows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(3);

    // Name row: Match (Acme Corp === Acme Corp)
    // Industry row: Differing (Technology !== Finance)
    const differingRows = element.shadowRoot.querySelectorAll(
      "tr.is-differing-row"
    );
    expect(differingRows).toHaveLength(1);
  });

  it("filters rows when Differences Only button is clicked", async () => {
    const element = createElement("c-smart-grid-transpose-table", {
      is: SmartGridTransposeTable
    });
    element.columns = MOCK_COLUMNS;
    element.records = MOCK_RECORDS;
    document.body.appendChild(element);

    await Promise.resolve();

    // Initial: 3 rows
    expect(element.shadowRoot.querySelectorAll("tbody tr")).toHaveLength(3);

    // Find and click "Differences Only" button
    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const diffButton = Array.from(buttons).find(
      (b) => b.label && b.label.includes("Differences Only")
    );
    expect(diffButton).not.toBeNull();
    diffButton.click();

    await Promise.resolve();

    // Now only 1 row (Industry) should be visible
    const filteredRows = element.shadowRoot.querySelectorAll("tbody tr");
    expect(filteredRows).toHaveLength(1);
    expect(filteredRows[0].textContent).toContain("Industry");

    // Click "All Fields" to restore
    const allButton = Array.from(buttons).find(
      (b) => b.label && b.label.includes("All Fields")
    );
    allButton.click();

    await Promise.resolve();
    expect(element.shadowRoot.querySelectorAll("tbody tr")).toHaveLength(3);
  });

  it("enforces admin safety ceiling and displays warning banner when record count exceeds limit", async () => {
    const element = createElement("c-smart-grid-transpose-table", {
      is: SmartGridTransposeTable
    });
    const manyRecords = [];
    for (let i = 0; i < 15; i++) {
      manyRecords.push({
        Id: `001_${i}`,
        Name: `Account ${i}`,
        Industry: "Tech",
        AnnualRevenue: 1000
      });
    }

    element.columns = MOCK_COLUMNS;
    element.records = manyRecords;
    element.maxTransposeLimit = 5;
    document.body.appendChild(element);

    await Promise.resolve();

    const banner = element.shadowRoot.querySelector(".transpose-limit-banner");
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain("Viewing first 5 of 15 records");

    // Record headers should only show 5 records
    const recordHeaders = element.shadowRoot.querySelectorAll(
      ".transpose-record-header"
    );
    expect(recordHeaders).toHaveLength(5);
  });

  it("dispatches close event when Exit Transpose View is clicked", async () => {
    const element = createElement("c-smart-grid-transpose-table", {
      is: SmartGridTransposeTable
    });
    element.columns = MOCK_COLUMNS;
    element.records = MOCK_RECORDS;
    document.body.appendChild(element);

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    await Promise.resolve();

    const exitBtn = element.shadowRoot.querySelector(
      'lightning-button[data-action="exit-transpose"]'
    );
    expect(exitBtn).not.toBeNull();
    exitBtn.click();

    expect(closeHandler).toHaveBeenCalledTimes(1);
  });

  it("allows inline cell editing and dispatches cellchange event", async () => {
    const element = createElement("c-smart-grid-transpose-table", {
      is: SmartGridTransposeTable
    });
    element.columns = MOCK_COLUMNS;
    element.records = MOCK_RECORDS;
    document.body.appendChild(element);

    const cellChangeHandler = jest.fn();
    element.addEventListener("cellchange", cellChangeHandler);

    await Promise.resolve();

    // Find the cell for Record 001A, Field Name
    const cell = element.shadowRoot.querySelector(
      'td[data-record-id="001A"][data-field="Name"]'
    );
    expect(cell).not.toBeNull();
    cell.dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();

    const input = element.shadowRoot.querySelector(".cell-inline-input");
    expect(input).not.toBeNull();
    input.value = "New Acme Name";
    input.dispatchEvent(new CustomEvent("blur"));

    expect(cellChangeHandler).toHaveBeenCalledTimes(1);
    expect(cellChangeHandler.mock.calls[0][0].detail.recordId).toBe("001A");
    expect(cellChangeHandler.mock.calls[0][0].detail.fieldName).toBe("Name");
    expect(cellChangeHandler.mock.calls[0][0].detail.value).toBe(
      "New Acme Name"
    );
  });
});
