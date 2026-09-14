import { createElement } from "lwc";
import SmartDataGrid from "c/smartDataGrid";

// Mock Apex calls
jest.mock(
  "@salesforce/apex/SmartGridController.getGridConfig",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridController.getRecordsPaged",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridController.getPicklistValues",
  () => ({ default: jest.fn().mockResolvedValue([]) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridController.getObjectFields",
  () => ({ default: jest.fn().mockResolvedValue([]) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridController.saveRecords",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridController.deleteRecords",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridController.getAggregates",
  () => ({ default: jest.fn().mockResolvedValue([]) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridController.getFormatRules",
  () => ({ default: jest.fn().mockResolvedValue([]) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridController.checkFeatureEntitlements",
  () => ({ default: jest.fn().mockResolvedValue({}) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridUserPrefService.getUserPreferences",
  () => ({ default: jest.fn().mockResolvedValue(null) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SmartGridUserPrefService.saveUserPreferences",
  () => ({ default: jest.fn().mockResolvedValue(null) }),
  { virtual: true }
);
jest.mock(
  "lightning/messageService",
  () => ({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn(),
    MessageContext: jest.fn()
  }),
  { virtual: true }
);

describe("c-smart-data-grid formatColumn", () => {
  let element;

  beforeEach(() => {
    element = createElement("c-smart-data-grid", {
      is: SmartDataGrid
    });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("handles null, undefined, or empty column definitions without throwing", () => {
    expect(() => element.formatColumn(null)).not.toThrow();
    expect(element.formatColumn(null)).toBeNull();

    expect(() => element.formatColumn(undefined)).not.toThrow();
    expect(element.formatColumn(undefined)).toBeUndefined();

    const emptyCol = {};
    expect(() => element.formatColumn(emptyCol)).not.toThrow();
    expect(element.formatColumn(emptyCol)).toEqual(emptyCol);
  });

  it("handles action columns lacking a fieldName without throwing", () => {
    const actionCol = {
      type: "action",
      typeAttributes: { rowActions: [{ label: "Edit", name: "edit" }] }
    };
    let formatted;
    expect(() => {
      formatted = element.formatColumn(actionCol);
    }).not.toThrow();
    expect(formatted).toEqual(actionCol);
  });

  it("formats standard text columns properly", () => {
    const col = {
      fieldName: "Name",
      label: "Account Name",
      type: "text"
    };
    const formatted = element.formatColumn(col);
    expect(formatted.fieldName).toBe("Name");
    expect(formatted.label).toBe("Account Name");
    expect(formatted.editable).toBe(true);
  });

  it("formats picklist columns with editable: true when options are present", () => {
    const col = {
      fieldName: "Industry",
      label: "Industry",
      sfType: "PICKLIST",
      type: "picklist",
      typeAttributes: {
        options: [
          { label: "Agriculture", value: "Agriculture" },
          { label: "Banking", value: "Banking" }
        ]
      }
    };
    const formatted = element.formatColumn(col);
    expect(formatted.type).toBe("picklist");
    expect(formatted.editable).toBe(true);
    expect(formatted.typeAttributes.options).toHaveLength(2);
  });
});
