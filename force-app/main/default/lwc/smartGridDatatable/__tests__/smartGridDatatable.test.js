import { createElement } from "lwc";
import SmartGridDatatable from "c/smartGridDatatable";

describe("c-smart-grid-datatable", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("configures custom picklist type with template, editTemplate, and standardCellLayout", () => {
    expect(SmartGridDatatable.customTypes).toBeDefined();
    expect(SmartGridDatatable.customTypes.picklist).toBeDefined();

    const picklistType = SmartGridDatatable.customTypes.picklist;
    expect(picklistType.template).toBeDefined();
    expect(picklistType.editTemplate).toBeDefined();
    expect(picklistType.standardCellLayout).toBe(true);
    expect(picklistType.typeAttributes).toEqual(
      expect.arrayContaining([
        "label",
        "placeholder",
        "options",
        "context",
        "fieldName"
      ])
    );
  });

  it("instantiates datatable element successfully", () => {
    const element = createElement("c-smart-grid-datatable", {
      is: SmartGridDatatable
    });
    element.keyField = "Id";
    element.data = [];
    element.columns = [];
    document.body.appendChild(element);

    expect(element).toBeDefined();
  });
});
