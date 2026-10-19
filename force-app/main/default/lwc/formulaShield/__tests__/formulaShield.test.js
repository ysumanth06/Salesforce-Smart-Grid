import { neutralizeFormula, sanitizePastedValue } from "c/formulaShield";

describe("c/formulaShield", () => {
  describe("neutralizeFormula", () => {
    it("prepends an apostrophe to values starting with =", () => {
      expect(neutralizeFormula("=SUM(A1:B10)")).toBe("'=SUM(A1:B10)");
    });

    it("prepends an apostrophe to values starting with +, -, or @", () => {
      expect(neutralizeFormula("+1500")).toBe("'+1500");
      expect(neutralizeFormula("-500")).toBe("'-500");
      expect(neutralizeFormula("@mention")).toBe("'@mention");
    });

    it("leaves standard text and numbers untouched", () => {
      expect(neutralizeFormula("Acme Corp")).toBe("Acme Corp");
      expect(neutralizeFormula(12500)).toBe("12500");
      expect(neutralizeFormula("100.50")).toBe("100.50");
    });

    it("handles null and undefined gracefully", () => {
      expect(neutralizeFormula(null)).toBe("");
      expect(neutralizeFormula(undefined)).toBe("");
      expect(neutralizeFormula("")).toBe("");
    });
  });

  describe("sanitizePastedValue", () => {
    it("strips leading apostrophe from protected formula values", () => {
      expect(sanitizePastedValue("'=SUM(A1:B10)")).toBe("=SUM(A1:B10)");
      expect(sanitizePastedValue("'+1500")).toBe("+1500");
      expect(sanitizePastedValue("'-500")).toBe("-500");
      expect(sanitizePastedValue("'@mention")).toBe("@mention");
    });

    it("does not strip apostrophes from regular text words like O'Connor", () => {
      expect(sanitizePastedValue("O'Connor")).toBe("O'Connor");
      expect(sanitizePastedValue("'Standard'")).toBe("'Standard'");
    });

    it("handles null and undefined gracefully", () => {
      expect(sanitizePastedValue(null)).toBe("");
      expect(sanitizePastedValue(undefined)).toBe("");
    });
  });
});
