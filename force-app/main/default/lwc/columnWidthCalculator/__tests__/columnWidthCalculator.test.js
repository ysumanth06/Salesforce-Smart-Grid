import {
  measureTextWidth,
  calculateColumnWidth,
  calculateAllColumnWidths,
  MIN_WIDTH,
  MAX_WIDTH
} from "c/columnWidthCalculator";

describe("columnWidthCalculator", () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      measureText: (text) => ({ width: String(text).length * 8 }),
      font: ""
    }));
  });

  test("measures text width accurately", () => {
    const emptyWidth = measureTextWidth("");
    expect(emptyWidth).toBe(0);

    const textWidth = measureTextWidth("Salesforce");
    expect(textWidth).toBeGreaterThan(0);

    const longerWidth = measureTextWidth("Salesforce Platform Grid Engine");
    expect(longerWidth).toBeGreaterThan(textWidth);
  });

  test("TC-05-P1: short values snap to header label width + padding", () => {
    const colDef = { fieldName: "Active", label: "Active" };
    const rows = [{ Active: "Yes" }, { Active: "No" }];

    const width = calculateColumnWidth(colDef, rows);
    expect(width).toBeGreaterThanOrEqual(MIN_WIDTH);
    expect(width).toBeLessThan(140);
  });

  test("TC-05-P2: long company names expand column width proportionally", () => {
    const colDef = { fieldName: "Name", label: "Account Name" };
    const shortRows = [{ Name: "Acme" }];
    const longRows = [
      { Name: "International Business Machines & Enterprise Solutions Corp" }
    ];

    const shortWidth = calculateColumnWidth(colDef, shortRows);
    const longWidth = calculateColumnWidth(colDef, longRows);

    expect(longWidth).toBeGreaterThan(shortWidth);
  });

  test("TC-05-P3: 500-character description clamps to MAX_WIDTH (500px)", () => {
    const colDef = { fieldName: "Description", label: "Description" };
    const rows = [{ Description: "X".repeat(500) }];

    const width = calculateColumnWidth(colDef, rows);
    expect(width).toBe(MAX_WIDTH);
  });

  test("TC-05-P4: all blank cells snap to header title width", () => {
    const colDef = { fieldName: "Notes", label: "Internal Audit Notes" };
    const rows = [{ Notes: "" }, { Notes: null }, { Notes: undefined }];

    const width = calculateColumnWidth(colDef, rows);
    expect(width).toBeGreaterThanOrEqual(MIN_WIDTH);
    expect(width).toBeLessThan(MAX_WIDTH);
  });

  test("TC-05-B1: bulk execution across 20 columns and 50 rows runs in under 50ms", () => {
    const columns = [];
    for (let c = 0; c < 20; c++) {
      columns.push({ fieldName: `field_${c}`, label: `Column Title ${c}` });
    }

    const rows = [];
    for (let r = 0; r < 50; r++) {
      const row = { Id: `rec_${r}` };
      for (let c = 0; c < 20; c++) {
        row[`field_${c}`] = `Value for cell row ${r} col ${c}`;
      }
      rows.push(row);
    }

    const start = Date.now();
    const result = calculateAllColumnWidths(columns, rows);
    const duration = Date.now() - start;

    expect(result.length).toBe(20);
    expect(result[0].initialWidth).toBeGreaterThanOrEqual(MIN_WIDTH);
    expect(duration).toBeLessThan(50);
  });
});
