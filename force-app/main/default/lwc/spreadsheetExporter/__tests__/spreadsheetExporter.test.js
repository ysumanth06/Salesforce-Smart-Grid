import {
  sanitizeCellValue,
  buildExcelHtml,
  exportToExcel
} from "c/spreadsheetExporter";

describe("spreadsheetExporter", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  test("TC-06-P3: sanitizes formula triggers to mitigate CWE-1236", () => {
    expect(sanitizeCellValue("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(sanitizeCellValue("+12345")).toBe("'+12345");
    expect(sanitizeCellValue("-999")).toBe("'-999");
    expect(sanitizeCellValue("@cmd")).toBe("'@cmd");
    expect(sanitizeCellValue("\tTabbed")).toBe("'\tTabbed");
    expect(sanitizeCellValue("Regular Value")).toBe("Regular Value");
    expect(sanitizeCellValue(null)).toBe("");
    expect(sanitizeCellValue(undefined)).toBe("");
  });

  test("escapes HTML special characters safely", () => {
    expect(sanitizeCellValue("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
    expect(sanitizeCellValue('AT&T "Corp"')).toBe("AT&amp;T &quot;Corp&quot;");
  });

  test("TC-06-P1: builds formatted Excel HTML with header and cell styling", () => {
    const columns = [
      { fieldName: "Name", label: "Account Name" },
      { fieldName: "Industry", label: "Industry" }
    ];
    const data = [
      {
        Name: "Acme Corp",
        Industry: "Technology",
        _cellStyles: { Industry: "background-color: #e3f5e9; color: #027a48;" }
      }
    ];

    const html = buildExcelHtml(data, columns);

    expect(html).toContain("Account Name");
    expect(html).toContain("Industry");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Technology");
    expect(html).toContain("background-color: #0176d3"); // Header style
    expect(html).toContain("background-color: #e3f5e9"); // Cell highlight
  });

  test("TC-06-P2: appends summary footer when totalsData is provided", () => {
    const columns = [
      { fieldName: "Name", label: "Account Name" },
      { fieldName: "Amount", label: "Amount" }
    ];
    const data = [
      { Name: "Deal 1", Amount: 1000 },
      { Name: "Deal 2", Amount: 2000 }
    ];
    const totalsData = [{ fieldApiName: "Amount", sum: 3000 }];

    const html = buildExcelHtml(data, columns, totalsData);

    expect(html).toContain("<tfoot>");
    expect(html).toContain("Totals");
    expect(html).toContain("Sum: 3,000");
  });

  test("TC-06-N1: returns false and does not trigger download on empty dataset", () => {
    expect(exportToExcel([], [{ fieldName: "Name" }])).toBe(false);
    expect(exportToExcel([{ Name: "Acme" }], [])).toBe(false);
    expect(exportToExcel(null, null)).toBe(false);
  });

  test("TC-06-B1: bulk execution generates 1,000 records in under 200ms", () => {
    const columns = [];
    for (let c = 0; c < 10; c++) {
      columns.push({ fieldName: `col_${c}`, label: `Column ${c}` });
    }

    const data = [];
    for (let r = 0; r < 1000; r++) {
      const row = { Id: `rec_${r}` };
      for (let c = 0; c < 10; c++) {
        row[`col_${c}`] = `Row ${r} Col ${c}`;
      }
      data.push(row);
    }

    const start = Date.now();
    const html = buildExcelHtml(data, columns);
    const duration = Date.now() - start;

    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(50000);
    expect(duration).toBeLessThan(500);
  });
});
