import { createElement } from "lwc";
import SmartGridTable from "c/smartGridTable";

describe("c-smart-grid-table", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const MOCK_COLUMNS = [
    {
      fieldName: "Name",
      label: "Account Name",
      type: "text",
      sortable: true,
      editable: true,
      width: 200
    },
    {
      fieldName: "AnnualRevenue",
      label: "Revenue",
      type: "currency",
      sortable: true,
      editable: true,
      width: 150
    },
    {
      fieldName: "Industry",
      label: "Industry",
      type: "text",
      sortable: true,
      editable: false,
      width: 150
    }
  ];

  function createMockRecords(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        Id: `00100000000000${i.toString().padStart(4, "0")}AAA`,
        Name: `Account ${i}`,
        AnnualRevenue: 10000 * (i + 1),
        Industry: i % 2 === 0 ? "Technology" : "Finance"
      });
    }
    return list;
  }

  it("renders a small dataset with direct rows and no virtual spacers", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    element.columns = MOCK_COLUMNS;
    element.records = createMockRecords(10);
    document.body.appendChild(element);

    await Promise.resolve();

    const rows = element.shadowRoot.querySelectorAll(
      "tbody tr:not(.virtual-spacer-row)"
    );
    expect(rows.length).toBe(10);

    const spacers = element.shadowRoot.querySelectorAll(".virtual-spacer-row");
    expect(spacers.length).toBe(0);
  });

  it("engages adaptive virtualization with spacers on datasets larger than 50 rows", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    element.columns = MOCK_COLUMNS;
    element.records = createMockRecords(100);
    element.rowHeight = 36;
    element.bufferRows = 5;
    document.body.appendChild(element);

    await Promise.resolve();

    // With 100 records and bufferRows=5, total rendered rows is bounded, not 100!
    const rows = element.shadowRoot.querySelectorAll(
      "tbody tr:not(.virtual-spacer-row)"
    );
    expect(rows.length).toBeLessThan(100);
    expect(rows.length).toBeGreaterThan(0);

    // Bottom spacer should be present to preserve scrollbar height
    const bottomSpacer = element.shadowRoot.querySelector(
      ".virtual-spacer-row"
    );
    expect(bottomSpacer).not.toBeNull();
  });

  it("benchmark test: renders 5,000 records with bounded DOM footprint (<150 nodes)", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    const startTime = performance.now();
    element.columns = MOCK_COLUMNS;
    element.records = createMockRecords(5000);
    element.rowHeight = 36;
    element.bufferRows = 15;
    document.body.appendChild(element);

    await Promise.resolve();
    const duration = performance.now() - startTime;

    // Verify DOM node containment
    const renderedRows = element.shadowRoot.querySelectorAll(
      "tbody tr:not(.virtual-spacer-row)"
    );
    expect(renderedRows.length).toBeLessThanOrEqual(150);
    expect(duration).toBeLessThan(1000); // Renders in under 1s even during parallel test execution
  });

  it("benchmark test: handles 50,000 records and dynamically re-anchors during deep scroll", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    element.columns = MOCK_COLUMNS;
    element.records = createMockRecords(50000);
    element.rowHeight = 36;
    element.bufferRows = 15;
    document.body.appendChild(element);

    await Promise.resolve();

    // Simulate deep scrolling to row index 25,000 (scrollTop = 25000 * 36 = 900,000px)
    const scrollEvent = {
      target: {
        scrollTop: 900000,
        clientHeight: 600,
        scrollHeight: 50000 * 36
      }
    };
    element.handleScroll(scrollEvent);

    await Promise.resolve();

    // Verify window dynamically shifted to middle of 50,000 rows
    const renderedRows = element.shadowRoot.querySelectorAll(
      "tbody tr:not(.virtual-spacer-row)"
    );
    expect(renderedRows.length).toBeLessThanOrEqual(150);

    // Both top and bottom spacer rows must be present when scrolled into the middle of 50,000 rows
    const spacers = element.shadowRoot.querySelectorAll(".virtual-spacer-row");
    expect(spacers.length).toBe(2);
  });

  it("dispatches sort event when a sortable column header is clicked", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    element.columns = MOCK_COLUMNS;
    element.records = createMockRecords(5);
    element.sortedBy = "Name";
    element.sortedDirection = "asc";
    document.body.appendChild(element);

    const sortHandler = jest.fn();
    element.addEventListener("sort", sortHandler);

    await Promise.resolve();

    const nameHeader = element.shadowRoot.querySelector(
      'th[data-field="Name"]'
    );
    expect(nameHeader).not.toBeNull();
    nameHeader.click();

    expect(sortHandler).toHaveBeenCalledTimes(1);
    expect(sortHandler.mock.calls[0][0].detail.fieldName).toBe("Name");
    expect(sortHandler.mock.calls[0][0].detail.sortDirection).toBe("desc");
  });

  it("dispatches rowselection event when row checkbox is toggled", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    const records = createMockRecords(5);
    element.columns = MOCK_COLUMNS;
    element.records = records;
    element.selectedRowIds = [];
    document.body.appendChild(element);

    const selectionHandler = jest.fn();
    element.addEventListener("rowselection", selectionHandler);

    await Promise.resolve();

    const firstCheckbox = element.shadowRoot.querySelector(
      'tbody input[type="checkbox"]'
    );
    expect(firstCheckbox).not.toBeNull();
    firstCheckbox.checked = true;
    firstCheckbox.dispatchEvent(new CustomEvent("change"));

    expect(selectionHandler).toHaveBeenCalledTimes(1);
    expect(selectionHandler.mock.calls[0][0].detail.selectedRows).toContain(
      records[0].Id
    );
  });

  it("dispatches cellchange event on inline edit blur with modified value", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    const records = createMockRecords(5);
    element.columns = MOCK_COLUMNS;
    element.records = records;
    document.body.appendChild(element);

    const cellChangeHandler = jest.fn();
    element.addEventListener("cellchange", cellChangeHandler);

    await Promise.resolve();

    const firstCell = element.shadowRoot.querySelector('td[data-field="Name"]');
    expect(firstCell).not.toBeNull();
    firstCell.dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();

    const input = element.shadowRoot.querySelector(".cell-inline-input");
    expect(input).not.toBeNull();
    input.value = "Updated Account Name";
    input.dispatchEvent(new CustomEvent("blur"));

    expect(cellChangeHandler).toHaveBeenCalledTimes(1);
    expect(cellChangeHandler.mock.calls[0][0].detail.recordId).toBe(
      records[0].Id
    );
    expect(cellChangeHandler.mock.calls[0][0].detail.fieldName).toBe("Name");
    expect(cellChangeHandler.mock.calls[0][0].detail.value).toBe(
      "Updated Account Name"
    );
  });

  it("renders range selection with in-range-cell and in-range-origin classes", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    const records = createMockRecords(5);
    element.columns = MOCK_COLUMNS;
    element.records = records;
    document.body.appendChild(element);

    await Promise.resolve();

    // Select 2x2 range: rows 1..2, cols 0..1
    element.setRange(1, 0, 2, 1);

    await Promise.resolve();

    const rangeOrigin = element.shadowRoot.querySelector("td.in-range-origin");
    expect(rangeOrigin).not.toBeNull();
    expect(rangeOrigin.dataset.rowIndex).toBe("1");
    expect(rangeOrigin.dataset.colIndex).toBe("0");

    const inRangeCells =
      element.shadowRoot.querySelectorAll("td.in-range-cell");
    expect(inRangeCells.length).toBe(4); // 2 rows * 2 cols = 4 cells
  });

  it("handles mouse click and shift-click to expand range selection", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    const records = createMockRecords(5);
    element.columns = MOCK_COLUMNS;
    element.records = records;
    document.body.appendChild(element);

    const rangeHandler = jest.fn();
    element.addEventListener("rangeselect", rangeHandler);

    await Promise.resolve();

    const cells = element.shadowRoot.querySelectorAll(
      'tbody tr td[role="gridcell"][data-row-index]'
    );
    const firstDataCell = cells[0];
    firstDataCell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(rangeHandler).toHaveBeenCalledTimes(1);
    expect(element.selectedRange).not.toBeNull();
    expect(element.selectedRange.rowCount).toBe(1);
    expect(element.selectedRange.colCount).toBe(1);

    // Shift click on row 2, col 1
    const targetCell = element.shadowRoot.querySelector(
      'td[data-row-index="2"][data-col-index="1"]'
    );
    targetCell.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, shiftKey: true })
    );

    expect(element.selectedRange.rowCount).toBe(3);
    expect(element.selectedRange.colCount).toBe(2);
    expect(element.selectedRange.totalCells).toBe(6);
  });

  it("copies selected range to TSV and dispatches rangecopy", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    const records = createMockRecords(5);
    element.columns = MOCK_COLUMNS;
    element.records = records;
    document.body.appendChild(element);

    const copyHandler = jest.fn();
    element.addEventListener("rangecopy", copyHandler);

    await Promise.resolve();

    element.setRange(0, 0, 1, 1);
    const tsv = element.copyRange();

    expect(copyHandler).toHaveBeenCalledTimes(1);
    expect(tsv).toContain("Account 0\t10000");
    expect(tsv).toContain("Account 1\t20000");
  });

  it("applies pasted TSV text onto grid records and dispatches cellschange", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    const records = createMockRecords(5);
    element.columns = MOCK_COLUMNS;
    element.records = records;
    document.body.appendChild(element);

    const cellsChangeHandler = jest.fn();
    element.addEventListener("cellschange", cellsChangeHandler);

    await Promise.resolve();

    element.setRange(0, 0, 0, 0); // Anchor at row 0, col 0
    const pastedText = "Acme Corp\t99999\r\nGlobex Corp\t88888";
    element.applyPastedText(pastedText);

    expect(cellsChangeHandler).toHaveBeenCalledTimes(1);
    const changes = cellsChangeHandler.mock.calls[0][0].detail.changes;
    expect(changes.length).toBe(4);
    expect(changes[0].recordId).toBe(records[0].Id);
    expect(changes[0].fieldName).toBe("Name");
    expect(changes[0].value).toBe("Acme Corp");
    expect(changes[1].fieldName).toBe("AnnualRevenue");
    expect(changes[1].value).toBe("99999");
  });

  it("handles fill down across selected range and dispatches cellschange", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    const records = createMockRecords(5);
    element.columns = MOCK_COLUMNS;
    element.records = records;
    document.body.appendChild(element);

    const cellsChangeHandler = jest.fn();
    element.addEventListener("cellschange", cellsChangeHandler);

    await Promise.resolve();

    // Select row 0 to 2, col 0 (Name)
    element.setRange(0, 0, 2, 0);
    element.handleFillDown();

    expect(cellsChangeHandler).toHaveBeenCalledTimes(1);
    const changes = cellsChangeHandler.mock.calls[0][0].detail.changes;
    expect(changes.length).toBe(2); // rows 1 and 2 filled with row 0 value
    expect(changes[0].recordId).toBe(records[1].Id);
    expect(changes[0].value).toBe("Account 0");
    expect(changes[1].recordId).toBe(records[2].Id);
    expect(changes[1].value).toBe("Account 0");
  });

  it("clears editable cells across selected range and dispatches cellschange", async () => {
    const element = createElement("c-smart-grid-table", {
      is: SmartGridTable
    });
    const records = createMockRecords(5);
    element.columns = MOCK_COLUMNS;
    element.records = records;
    document.body.appendChild(element);

    const cellsChangeHandler = jest.fn();
    element.addEventListener("cellschange", cellsChangeHandler);

    await Promise.resolve();

    // Select rows 0..1, col 0 (editable Name) and col 2 (non-editable Industry)
    element.setRange(0, 0, 1, 2);
    element.handleClearRange();

    expect(cellsChangeHandler).toHaveBeenCalledTimes(1);
    const changes = cellsChangeHandler.mock.calls[0][0].detail.changes;
    // Industry is editable: false, so only Name and Revenue should be cleared!
    const industryChanges = changes.filter((c) => c.fieldName === "Industry");
    expect(industryChanges.length).toBe(0);
    expect(changes.length).toBe(4); // 2 rows * 2 editable cols
  });
});
