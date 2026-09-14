import { evaluateRule, applyFormatRules } from "c/formatRuleEngine";

describe("formatRuleEngine", () => {
  describe("evaluateRule", () => {
    test("handles null or missing rule gracefully", () => {
      expect(evaluateRule(null, "Test")).toBe(false);
      expect(evaluateRule({}, "Test")).toBe(false);
      expect(evaluateRule({ operator: "" }, "Test")).toBe(false);
    });

    test("evaluates EQUALS operator for strings case-insensitively", () => {
      const rule = { operator: "EQUALS", value: "Closed Won" };
      expect(evaluateRule(rule, "Closed Won")).toBe(true);
      expect(evaluateRule(rule, "closed won")).toBe(true);
      expect(evaluateRule(rule, "Closed Lost")).toBe(false);
    });

    test("evaluates EQUALS and comparison operators for numbers correctly", () => {
      expect(evaluateRule({ operator: "EQUALS", value: 1000 }, 1000)).toBe(
        true
      );
      expect(evaluateRule({ operator: "GREATER_THAN", value: 500 }, 1000)).toBe(
        true
      );
      expect(
        evaluateRule({ operator: "GREATER_THAN", value: 1500 }, 1000)
      ).toBe(false);
      expect(evaluateRule({ operator: "LESS_THAN", value: 2000 }, 1000)).toBe(
        true
      );
      expect(
        evaluateRule({ operator: "LESS_OR_EQUAL", value: 1000 }, 1000)
      ).toBe(true);
      expect(
        evaluateRule({ operator: "GREATER_OR_EQUAL", value: 1000 }, 1000)
      ).toBe(true);
      expect(evaluateRule({ operator: "NOT_EQUALS", value: 500 }, 1000)).toBe(
        true
      );
    });

    test("evaluates CONTAINS and STARTS_WITH operators", () => {
      expect(
        evaluateRule(
          { operator: "CONTAINS", value: "health" },
          "Healthcare Inc"
        )
      ).toBe(true);
      expect(
        evaluateRule({ operator: "CONTAINS", value: "tech" }, "Healthcare Inc")
      ).toBe(false);
      expect(
        evaluateRule(
          { operator: "STARTS_WITH", value: "Health" },
          "Healthcare Inc"
        )
      ).toBe(true);
      expect(
        evaluateRule(
          { operator: "STARTS_WITH", value: "care" },
          "Healthcare Inc"
        )
      ).toBe(false);
    });

    test("inequality operators return false for null, undefined, or empty values", () => {
      const lessThanRule = { operator: "LESS_THAN", value: 50 };
      const greaterThanRule = { operator: "GREATER_THAN", value: 50 };
      const lessOrEqualRule = { operator: "LESS_OR_EQUAL", value: 50 };
      const greaterOrEqualRule = { operator: "GREATER_OR_EQUAL", value: 50 };

      // Null, undefined, and empty string must NOT match inequality rules
      expect(evaluateRule(lessThanRule, null)).toBe(false);
      expect(evaluateRule(lessThanRule, undefined)).toBe(false);
      expect(evaluateRule(lessThanRule, "")).toBe(false);

      expect(evaluateRule(lessOrEqualRule, null)).toBe(false);
      expect(evaluateRule(lessOrEqualRule, "")).toBe(false);

      expect(evaluateRule(greaterThanRule, null)).toBe(false);
      expect(evaluateRule(greaterThanRule, "")).toBe(false);

      expect(evaluateRule(greaterOrEqualRule, null)).toBe(false);
      expect(evaluateRule(greaterOrEqualRule, "")).toBe(false);
    });

    test("handles empty target values safely without accidental matching", () => {
      expect(evaluateRule({ operator: "LESS_THAN", value: "" }, 25)).toBe(
        false
      );
      expect(evaluateRule({ operator: "GREATER_THAN", value: null }, 25)).toBe(
        false
      );
      expect(evaluateRule({ operator: "CONTAINS", value: "" }, "Acme")).toBe(
        false
      );
      expect(evaluateRule({ operator: "STARTS_WITH", value: "" }, "Acme")).toBe(
        false
      );
    });
  });

  describe("applyFormatRules", () => {
    const rules = [
      {
        fieldApiName: "StageName",
        operator: "EQUALS",
        value: "Closed Won",
        cellColor: "green",
        rowHighlight: true,
        priority: 1,
        iconName: "utility:success"
      },
      {
        fieldApiName: "StageName",
        operator: "EQUALS",
        value: "Closed Lost",
        cellColor: "red",
        priority: 2,
        iconName: "utility:close"
      },
      {
        fieldApiName: "Amount",
        operator: "GREATER_THAN",
        value: 10000,
        cellColor: "blue",
        priority: 3
      }
    ];

    const columns = [
      { fieldName: "Name" },
      { fieldName: "StageName" },
      { fieldName: "Amount" }
    ];

    test("formats records with cell and row highlighting", () => {
      const records = [
        { Id: "001", Name: "Deal 1", StageName: "Closed Won", Amount: 5000 },
        { Id: "002", Name: "Deal 2", StageName: "Closed Lost", Amount: 20000 },
        { Id: "003", Name: "Deal 3", StageName: "Prospecting", Amount: 1000 }
      ];

      const formatted = applyFormatRules(records, rules, columns);

      // Deal 1: Closed Won -> green cell, rowHighlight, success icon
      expect(formatted[0].StageName_cellClass).toBe("smart-grid-color-green");
      expect(formatted[0].StageName_iconName).toBe("utility:success");
      expect(formatted[0]._rowClass).toContain("smart-grid-row-highlight");
      expect(formatted[0].Name_cellClass).toContain("smart-grid-row-highlight");

      // Deal 2: Closed Lost -> red cell, close icon; Amount > 10000 -> blue cell
      expect(formatted[1].StageName_cellClass).toBe("smart-grid-color-red");
      expect(formatted[1].StageName_iconName).toBe("utility:close");
      expect(formatted[1].Amount_cellClass).toBe("smart-grid-color-blue");
      expect(formatted[1]._rowClass).toBeUndefined();

      // Deal 3: No matches
      expect(formatted[2].StageName_cellClass).toBeUndefined();
      expect(formatted[2]._rowClass).toBeUndefined();
    });

    test("respects priority order when multiple rules match same field", () => {
      const conflictingRules = [
        {
          fieldApiName: "Rating",
          operator: "EQUALS",
          value: "Hot",
          cellColor: "yellow",
          priority: 5
        },
        {
          fieldApiName: "Rating",
          operator: "EQUALS",
          value: "Hot",
          cellColor: "red",
          priority: 1
        }
      ];

      const records = [{ Id: "001", Rating: "Hot" }];
      const formatted = applyFormatRules(records, conflictingRules, columns);

      // Priority 1 rule (red) should win over Priority 5 rule (yellow)
      expect(formatted[0].Rating_cellClass).toBe("smart-grid-color-red");
    });

    test("returns original records if rules are empty or null", () => {
      const records = [{ Id: "001", Name: "Test" }];
      expect(applyFormatRules(records, null)).toEqual(records);
      expect(applyFormatRules(records, [])).toEqual(records);
    });
  });
});
