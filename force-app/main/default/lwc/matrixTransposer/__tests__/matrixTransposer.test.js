import {
  detectDiscrepancy,
  filterTransposedRows,
  transposeGrid
} from "c/matrixTransposer";

describe("c-matrix-transposer", () => {
  describe("detectDiscrepancy", () => {
    it("returns EMPTY when all values are null, undefined, or empty string", () => {
      expect(detectDiscrepancy([])).toBe("EMPTY");
      expect(detectDiscrepancy([null, null])).toBe("EMPTY");
      expect(detectDiscrepancy(["", undefined, null])).toBe("EMPTY");
    });

    it("returns MATCH when all values are identical", () => {
      expect(detectDiscrepancy(["Tech", "Tech", "Tech"])).toBe("MATCH");
      expect(detectDiscrepancy([1000, 1000])).toBe("MATCH");
      expect(detectDiscrepancy([true, true, true])).toBe("MATCH");
    });

    it("returns DIFFERING when at least one value differs", () => {
      expect(detectDiscrepancy(["Tech", "Finance"])).toBe("DIFFERING");
      expect(detectDiscrepancy([1000, 2000, 1000])).toBe("DIFFERING");
      expect(detectDiscrepancy([true, false])).toBe("DIFFERING");
    });
  });

  describe("filterTransposedRows", () => {
    const mockRows = [
      { id: "1", discrepancyStatus: "MATCH" },
      { id: "2", discrepancyStatus: "DIFFERING" },
      { id: "3", discrepancyStatus: "EMPTY" },
      { id: "4", discrepancyStatus: "DIFFERING" }
    ];

    it("returns all rows when filterMode is ALL or unspecified", () => {
      expect(filterTransposedRows(mockRows, "ALL")).toHaveLength(4);
      expect(filterTransposedRows(mockRows, "")).toHaveLength(4);
    });

    it("returns only differing rows when filterMode is DIFFERENCES_ONLY", () => {
      const filtered = filterTransposedRows(mockRows, "DIFFERENCES_ONLY");
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.discrepancyStatus === "DIFFERING")).toBe(
        true
      );
    });

    it("returns non-empty rows when filterMode is POPULATED_ONLY", () => {
      const filtered = filterTransposedRows(mockRows, "POPULATED_ONLY");
      expect(filtered).toHaveLength(3);
      expect(filtered.every((r) => r.discrepancyStatus !== "EMPTY")).toBe(true);
    });
  });

  describe("transposeGrid", () => {
    const MOCK_COLUMNS = [
      {
        fieldName: "Name",
        label: "Account Name",
        type: "text",
        editable: true
      },
      {
        fieldName: "Industry",
        label: "Industry",
        type: "text",
        editable: true
      },
      {
        fieldName: "AnnualRevenue",
        label: "Revenue",
        type: "currency",
        editable: true
      },
      {
        fieldName: "Description",
        label: "Description",
        type: "text",
        editable: true
      }
    ];

    const MOCK_RECORDS = [
      {
        Id: "001A",
        Name: "Acme Corp",
        Industry: "Tech",
        AnnualRevenue: 50000,
        Description: null
      },
      {
        Id: "001B",
        Name: "Acme Corp",
        Industry: "Finance",
        AnnualRevenue: 50000,
        Description: null
      },
      {
        Id: "001C",
        Name: "Acme LLC",
        Industry: "Tech",
        AnnualRevenue: 50000,
        Description: null
      }
    ];

    it("handles empty inputs safely", () => {
      const result = transposeGrid({});
      expect(result.columns).toHaveLength(0);
      expect(result.rows).toHaveLength(0);
      expect(result.differingCount).toBe(0);
    });

    it("transposes 3 records and 4 columns into 5 headers and 4 rows", () => {
      const result = transposeGrid({
        records: MOCK_RECORDS,
        columns: MOCK_COLUMNS,
        columnWidth: 150
      });

      // Pinned Field Header + 3 Records + Status Header = 5 columns
      expect(result.columns).toHaveLength(5);
      expect(result.columns[0].isPinned).toBe(true);
      expect(result.columns[0].fieldName).toBe("__fieldLabel__");
      expect(result.columns[1].fieldName).toBe("001A");
      expect(result.columns[1].width).toBe(150);
      expect(result.columns[4].fieldName).toBe("__status__");

      // 4 field rows
      expect(result.rows).toHaveLength(4);
      expect(result.totalFieldCount).toBe(4);

      // AnnualRevenue is MATCH ($50,000 across all)
      const revenueRow = result.rows.find(
        (r) => r.fieldApiName === "AnnualRevenue"
      );
      expect(revenueRow.discrepancyStatus).toBe("MATCH");

      // Description is EMPTY (null across all)
      const descRow = result.rows.find((r) => r.fieldApiName === "Description");
      expect(descRow.discrepancyStatus).toBe("EMPTY");

      // Name is DIFFERING (Acme Corp vs Acme LLC)
      const nameRow = result.rows.find((r) => r.fieldApiName === "Name");
      expect(nameRow.discrepancyStatus).toBe("DIFFERING");

      // Industry is DIFFERING (Tech vs Finance)
      const industryRow = result.rows.find(
        (r) => r.fieldApiName === "Industry"
      );
      expect(industryRow.discrepancyStatus).toBe("DIFFERING");

      expect(result.differingCount).toBe(2);
    });

    it("overlays draft values from staged edits", () => {
      const draftValues = [{ Id: "001B", Name: "Acme LLC" }];

      const result = transposeGrid({
        records: MOCK_RECORDS,
        columns: MOCK_COLUMNS,
        draftValues
      });

      const nameRow = result.rows.find((r) => r.fieldApiName === "Name");
      const recordBCell = nameRow.cells.find((c) => c.recordId === "001B");
      expect(recordBCell.isDraft).toBe(true);
      expect(recordBCell.value).toBe("Acme LLC");
    });

    it("filters rows when DIFFERENCES_ONLY mode is passed", () => {
      const result = transposeGrid({
        records: MOCK_RECORDS,
        columns: MOCK_COLUMNS,
        filterMode: "DIFFERENCES_ONLY"
      });

      expect(result.rows).toHaveLength(2); // Only Name and Industry
      expect(result.differingCount).toBe(2);
      expect(result.totalFieldCount).toBe(4);
    });
  });
});
