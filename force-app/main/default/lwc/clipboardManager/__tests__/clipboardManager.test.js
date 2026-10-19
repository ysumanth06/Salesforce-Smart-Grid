import {
  serializeRangeToTsv,
  parseTsvToMatrix,
  applyPastedMatrix
} from "c/clipboardManager";
import { createRange } from "c/rangeSelectionManager";

describe("c/clipboardManager", () => {
  const MOCK_COLUMNS = [
    { fieldName: "Name", editable: true },
    { fieldName: "AnnualRevenue", editable: true },
    { fieldName: "Industry", editable: false }
  ];

  const MOCK_RECORDS = [
    { Id: "001", Name: "Acme", AnnualRevenue: 10000, Industry: "Tech" },
    { Id: "002", Name: "Beta", AnnualRevenue: 25000, Industry: "Finance" },
    { Id: "003", Name: "Gamma", AnnualRevenue: 50000, Industry: "Healthcare" }
  ];

  describe("serializeRangeToTsv", () => {
    it("serializes a selected range of records into tab-delimited text", () => {
      const range = createRange(0, 0, 1, 1);
      const tsv = serializeRangeToTsv(MOCK_RECORDS, MOCK_COLUMNS, range);

      expect(tsv).toBe("Acme\t10000\r\nBeta\t25000");
    });

    it("neutralizes formulas during TSV serialization", () => {
      const recordsWithFormulas = [
        {
          Id: "001",
          Name: "=SUM(A1:B2)",
          AnnualRevenue: "+500",
          Industry: "Tech"
        }
      ];
      const range = createRange(0, 0, 0, 1);
      const tsv = serializeRangeToTsv(recordsWithFormulas, MOCK_COLUMNS, range);

      expect(tsv).toBe("'=SUM(A1:B2)\t'+500");
    });
  });

  describe("parseTsvToMatrix", () => {
    it("parses tab-separated values into a 2D matrix of strings", () => {
      const tsv = "Acme\t15000\r\nBeta Corp\t35000";
      const matrix = parseTsvToMatrix(tsv);

      expect(matrix.length).toBe(2);
      expect(matrix[0]).toEqual(["Acme", "15000"]);
      expect(matrix[1]).toEqual(["Beta Corp", "35000"]);
    });

    it("handles empty input gracefully", () => {
      expect(parseTsvToMatrix("")).toEqual([]);
      expect(parseTsvToMatrix(null)).toEqual([]);
    });
  });

  describe("applyPastedMatrix", () => {
    it("maps a 2D matrix onto grid records, updating editable fields and skipping non-editable ones", () => {
      const matrix = [
        ["Acme Updated", "99999", "Manufacturing"],
        ["Beta Updated", "88888", "Retail"]
      ];

      // Paste starting at row 0, col 0
      const changes = applyPastedMatrix(
        matrix,
        0,
        0,
        MOCK_RECORDS,
        MOCK_COLUMNS
      );

      // Industry is non-editable in MOCK_COLUMNS, so only Name and AnnualRevenue should generate changes
      expect(changes.length).toBe(4);
      expect(changes[0]).toEqual({
        recordId: "001",
        fieldName: "Name",
        value: "Acme Updated",
        oldValue: "Acme"
      });
      expect(changes[1]).toEqual({
        recordId: "001",
        fieldName: "AnnualRevenue",
        value: "99999",
        oldValue: 10000
      });
    });

    it("stops mapping when target row index exceeds records length", () => {
      const matrix = [
        ["Row 1"],
        ["Row 2"],
        ["Row 3"],
        ["Row 4"] // Exceeds MOCK_RECORDS length 3
      ];

      const changes = applyPastedMatrix(
        matrix,
        1,
        0,
        MOCK_RECORDS,
        MOCK_COLUMNS
      );
      // Starting at row 1, can only map Row 1 (to idx 1) and Row 2 (to idx 2)
      expect(changes.length).toBe(2);
    });
  });
});
