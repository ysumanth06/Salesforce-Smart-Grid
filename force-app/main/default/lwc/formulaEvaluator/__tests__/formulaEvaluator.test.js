import { evaluateFormula, computeFormulaColumns } from "c/formulaEvaluator";

describe("formulaEvaluator", () => {
  describe("evaluateFormula", () => {
    test("evaluates simple arithmetic: Amount * Probability / 100", () => {
      const record = { Amount: 5000, Probability: 60 };
      expect(evaluateFormula("Amount * Probability / 100", record)).toBe(3000);
    });

    test("evaluates expressions with parentheses: (Price - Cost) * Quantity", () => {
      const record = { Price: 100, Cost: 40, Quantity: 5 };
      expect(evaluateFormula("(Price - Cost) * Quantity", record)).toBe(300);
    });

    test("returns '—' for missing or null field references", () => {
      const record = { Amount: 1000 };
      expect(evaluateFormula("Amount * NonExistentField", record)).toBe("—");
      expect(
        evaluateFormula("Amount * NullField", { Amount: 1000, NullField: null })
      ).toBe("—");
    });

    test("returns '—' for division by zero", () => {
      const record = { Amount: 1000, ZeroVal: 0 };
      expect(evaluateFormula("Amount / ZeroVal", record)).toBe("—");
      expect(evaluateFormula("100 / 0", record)).toBe("—");
    });

    test("returns '—' for malformed expressions without crashing", () => {
      const record = { Amount: 1000 };
      expect(evaluateFormula("Amount * * 2", record)).toBe("—");
      expect(evaluateFormula("(Amount + 5", record)).toBe("—");
      expect(evaluateFormula("Amount + @#$%", record)).toBe("—");
    });
  });

  describe("computeFormulaColumns", () => {
    test("computes formula column for records and accounts for drafts", () => {
      const columns = [
        { fieldName: "Amount" },
        { fieldName: "Probability" },
        { fieldName: "WeightedAmount", formula: "Amount * Probability / 100" }
      ];

      const records = [
        { Id: "001", Amount: 1000, Probability: 50 },
        { Id: "002", Amount: 2000, Probability: 20 }
      ];

      // Draft for 001 changing Amount to 4000
      const drafts = [{ Id: "001", Amount: 4000 }];

      const computed = computeFormulaColumns(records, columns, drafts);

      // 001 with draft Amount 4000 * 50 / 100 = 2000
      expect(computed[0].WeightedAmount).toBe(2000);
      // 002 with original Amount 2000 * 20 / 100 = 400
      expect(computed[1].WeightedAmount).toBe(400);
    });
  });
});
