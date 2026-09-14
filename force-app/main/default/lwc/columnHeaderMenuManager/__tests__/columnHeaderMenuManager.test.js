import {
  generateColumnActions,
  filterRecordsByHeaderActions,
  reorderColumnsWithPin
} from "c/columnHeaderMenuManager";

describe("c-column-header-menu-manager", () => {
  const sampleData = [
    { Id: "001", Name: "Acme Corp", Rating: "Hot", Industry: "Technology" },
    { Id: "002", Name: "Beta LLC", Rating: "Warm", Industry: "Finance" },
    { Id: "003", Name: "Gamma Inc", Rating: "Hot", Industry: "Technology" },
    { Id: "004", Name: "Delta Co", Rating: null, Industry: "Healthcare" }
  ];

  describe("generateColumnActions", () => {
    it("returns empty array for Id or URL fields", () => {
      expect(generateColumnActions({ fieldName: "Id" }, sampleData)).toEqual(
        []
      );
      expect(
        generateColumnActions({ fieldName: "Name_Url" }, sampleData)
      ).toEqual([]);
    });

    it("generates Pin to Left and unique value counts with All checked by default", () => {
      const col = { fieldName: "Rating", label: "Rating" };
      const actions = generateColumnActions(col, sampleData);

      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0]).toEqual({
        label: "Pin to Left",
        name: "pin_left",
        iconName: "utility:pin"
      });

      const allAction = actions.find((a) => a.name === "all");
      expect(allAction).toBeDefined();
      expect(allAction.checked).toBe(true);

      const hotAction = actions.find((a) => a.name === "val_Hot");
      expect(hotAction).toBeDefined();
      expect(hotAction.label).toBe("Hot (2)");
      expect(hotAction.checked).toBe(false);

      const warmAction = actions.find((a) => a.name === "val_Warm");
      expect(warmAction).toBeDefined();
      expect(warmAction.label).toBe("Warm (1)");

      const blankAction = actions.find((a) => a.name === "val_(Blank)");
      expect(blankAction).toBeDefined();
      expect(blankAction.label).toBe("(Blank) (1)");
    });

    it("generates Unpin from Left when field is currently pinned", () => {
      const col = { fieldName: "Rating", label: "Rating" };
      const actions = generateColumnActions(col, sampleData, {}, "Rating");

      expect(actions[0]).toEqual({
        label: "Unpin from Left",
        name: "unpin_left",
        iconName: "utility:pinned"
      });
    });

    it("marks active filter values as checked and includes Clear Filter", () => {
      const col = { fieldName: "Rating", label: "Rating" };
      const activeFilters = {
        Rating: new Set(["Hot"])
      };
      const actions = generateColumnActions(col, sampleData, activeFilters);

      const allAction = actions.find((a) => a.name === "all");
      expect(allAction.checked).toBe(false);

      const hotAction = actions.find((a) => a.name === "val_Hot");
      expect(hotAction.checked).toBe(true);

      const clearAction = actions.find((a) => a.name === "clear");
      expect(clearAction).toBeDefined();
    });

    it("caps distinct values at 15 and appends More in Filter Builder for high-cardinality", () => {
      const highCardinalityData = [];
      for (let i = 1; i <= 25; i++) {
        highCardinalityData.push({ Id: `00${i}`, Code: `CODE_${i}` });
      }

      const col = { fieldName: "Code", label: "Code" };
      const actions = generateColumnActions(col, highCardinalityData);

      const moreAction = actions.find((a) => a.name === "more_filters");
      expect(moreAction).toBeDefined();
      expect(moreAction.label).toBe("More in Filter Builder...");

      // 1 Pin + 1 All + 15 items + 1 More in Filter Builder = 18 actions
      const valActions = actions.filter((a) => a.name.startsWith("val_"));
      expect(valActions.length).toBe(15);
    });
  });

  describe("filterRecordsByHeaderActions", () => {
    it("returns all records when no filters are active", () => {
      const filtered = filterRecordsByHeaderActions(sampleData, {});
      expect(filtered.length).toBe(4);
    });

    it("filters records by a single column selection", () => {
      const activeFilters = {
        Rating: new Set(["Hot"])
      };
      const filtered = filterRecordsByHeaderActions(sampleData, activeFilters);
      expect(filtered.length).toBe(2);
      expect(filtered.map((r) => r.Id)).toEqual(["001", "003"]);
    });

    it("filters records by multiple columns (AND logic across columns)", () => {
      const activeFilters = {
        Rating: new Set(["Hot"]),
        Industry: new Set(["Finance"])
      };
      const filtered = filterRecordsByHeaderActions(sampleData, activeFilters);
      expect(filtered.length).toBe(0);
    });

    it("filters records by multiple values in same column (OR logic within column)", () => {
      const activeFilters = {
        Rating: new Set(["Hot", "Warm"])
      };
      const filtered = filterRecordsByHeaderActions(sampleData, activeFilters);
      expect(filtered.length).toBe(3);
    });

    it("filters by (Blank) values", () => {
      const activeFilters = {
        Rating: new Set(["(Blank)"])
      };
      const filtered = filterRecordsByHeaderActions(sampleData, activeFilters);
      expect(filtered.length).toBe(1);
      expect(filtered[0].Id).toBe("004");
    });
  });

  describe("reorderColumnsWithPin", () => {
    const columns = [
      { label: "Name", fieldName: "Name" },
      { label: "Rating", fieldName: "Rating" },
      { label: "Industry", fieldName: "Industry" }
    ];

    it("returns unmodified columns if pinnedField is null", () => {
      const result = reorderColumnsWithPin(columns, null);
      expect(result.map((c) => c.fieldName)).toEqual([
        "Name",
        "Rating",
        "Industry"
      ]);
    });

    it("moves pinned column to index 0 and sets pinned icon", () => {
      const result = reorderColumnsWithPin(columns, "Industry");
      expect(result.length).toBe(3);
      expect(result[0].fieldName).toBe("Industry");
      expect(result[0].iconName).toBe("utility:pinned");
      expect(result[1].fieldName).toBe("Name");
      expect(result[2].fieldName).toBe("Rating");
    });

    it("removes pinned icon when unpinned", () => {
      const withPinned = [
        {
          label: "Industry",
          fieldName: "Industry",
          iconName: "utility:pinned"
        },
        { label: "Name", fieldName: "Name" }
      ];
      const result = reorderColumnsWithPin(withPinned, null);
      expect(result[0].iconName).toBeUndefined();
    });
  });
});
