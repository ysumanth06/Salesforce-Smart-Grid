import {
  createRange,
  isCellInRange,
  expandRange,
  computeFillDown,
  computeClearRange
} from "c/rangeSelectionManager";

describe("c/rangeSelectionManager", () => {
  it("creates and normalizes a 2D bounding box regardless of drag direction", () => {
    // Drag from bottom-right (4, 3) to top-left (1, 1)
    const range = createRange(4, 3, 1, 1);
    expect(range.minRow).toBe(1);
    expect(range.maxRow).toBe(4);
    expect(range.minCol).toBe(1);
    expect(range.maxCol).toBe(3);
    expect(range.rowCount).toBe(4);
    expect(range.colCount).toBe(3);
    expect(range.totalCells).toBe(12);
  });

  it("correctly checks whether a cell coordinate is in range", () => {
    const range = createRange(2, 2, 5, 4);
    expect(isCellInRange(3, 3, range)).toBe(true);
    expect(isCellInRange(2, 2, range)).toBe(true);
    expect(isCellInRange(5, 4, range)).toBe(true);
    expect(isCellInRange(1, 3, range)).toBe(false); // Above
    expect(isCellInRange(6, 3, range)).toBe(false); // Below
    expect(isCellInRange(3, 1, range)).toBe(false); // Left
    expect(isCellInRange(3, 5, range)).toBe(false); // Right
  });

  it("expands range in all four directions with bounds protection", () => {
    let range = createRange(2, 2, 2, 2);

    range = expandRange(range, "DOWN", 10, 10);
    expect(range.endRow).toBe(3);

    range = expandRange(range, "RIGHT", 10, 10);
    expect(range.endCol).toBe(3);

    range = expandRange(range, "UP", 10, 10);
    expect(range.endRow).toBe(2);

    range = expandRange(range, "LEFT", 10, 10);
    expect(range.endCol).toBe(2);
  });

  it("computes fill-down changes from top row downwards across editable columns", () => {
    const records = [
      { Id: "001", Name: "Acme Master", Rating: "Hot" },
      { Id: "002", Name: "Beta Corp", Rating: "Cold" },
      { Id: "003", Name: "Gamma Inc", Rating: "Warm" }
    ];
    const columns = [
      { fieldName: "Name", editable: true },
      { fieldName: "Rating", editable: false } // Non-editable, should not fill
    ];

    const range = createRange(0, 0, 2, 1);
    const changes = computeFillDown(records, columns, range);

    expect(changes.length).toBe(2); // Only row 1 and row 2 for Name
    expect(changes[0]).toEqual({
      recordId: "002",
      fieldName: "Name",
      value: "Acme Master",
      oldValue: "Beta Corp"
    });
    expect(changes[1]).toEqual({
      recordId: "003",
      fieldName: "Name",
      value: "Acme Master",
      oldValue: "Gamma Inc"
    });
  });

  it("computes clear range updates for editable populated cells", () => {
    const records = [
      { Id: "001", Name: "Acme", Rating: "Hot" },
      { Id: "002", Name: "Beta", Rating: "Warm" }
    ];
    const columns = [
      { fieldName: "Name", editable: true },
      { fieldName: "Rating", editable: true }
    ];

    const range = createRange(0, 0, 1, 1);
    const changes = computeClearRange(records, columns, range);

    expect(changes.length).toBe(4);
    expect(changes[0].value).toBe("");
    expect(changes[0].recordId).toBe("001");
  });
});
