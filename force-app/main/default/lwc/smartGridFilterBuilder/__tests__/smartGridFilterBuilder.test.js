import { createElement } from "@lwc/engine-dom";
import SmartGridFilterBuilder from "c/smartGridFilterBuilder";

describe("c-smart-grid-filter-builder", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  test("initializes with default AND logic and empty condition", () => {
    const element = createElement("c-smart-grid-filter-builder", {
      is: SmartGridFilterBuilder
    });
    element.columns = [
      { label: "Account Name", fieldName: "Name", type: "STRING" },
      { label: "Industry", fieldName: "Industry", type: "PICKLIST" }
    ];
    document.body.appendChild(element);

    expect(element.filterExpression).toBeDefined();
    expect(element.filterExpression.logic).toBe("AND");
  });

  test("hydrates filter expression correctly from JSON or object", () => {
    const element = createElement("c-smart-grid-filter-builder", {
      is: SmartGridFilterBuilder
    });
    element.columns = [
      { label: "Account Name", fieldName: "Name", type: "STRING" },
      { label: "Annual Revenue", fieldName: "AnnualRevenue", type: "CURRENCY" }
    ];
    element.filterExpression = JSON.stringify({
      logic: "OR",
      conditions: [{ field: "Name", operator: "contains", value: "Tech" }],
      groups: [
        {
          logic: "AND",
          conditions: [
            { field: "AnnualRevenue", operator: ">", value: "1000000" }
          ],
          groups: []
        }
      ]
    });
    document.body.appendChild(element);

    const expr = element.filterExpression;
    expect(expr.logic).toBe("OR");
    expect(expr.conditions.length).toBe(1);
    expect(expr.conditions[0].field).toBe("Name");
    expect(expr.groups.length).toBe(1);
    expect(expr.groups[0].conditions[0].field).toBe("AnnualRevenue");
  });

  test("dispatches applyfilter event on Apply Filter click", () => {
    const element = createElement("c-smart-grid-filter-builder", {
      is: SmartGridFilterBuilder
    });
    element.columns = [
      { label: "Industry", fieldName: "Industry", type: "PICKLIST" }
    ];
    document.body.appendChild(element);

    const handler = jest.fn();
    element.addEventListener("applyfilter", handler);

    element.handleAddCondition();
    element.handleApply();

    expect(handler).toHaveBeenCalled();
    const detail = handler.mock.calls[0][0].detail;
    expect(detail.expression).toBeDefined();
    expect(detail.json).toBeDefined();
  });

  test("dispatches close event on cancel or close button", () => {
    const element = createElement("c-smart-grid-filter-builder", {
      is: SmartGridFilterBuilder
    });
    document.body.appendChild(element);

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    element.handleClose();
    expect(closeHandler).toHaveBeenCalled();
  });

  test("clears all conditions and groups on handleClearAll", () => {
    const element = createElement("c-smart-grid-filter-builder", {
      is: SmartGridFilterBuilder
    });
    document.body.appendChild(element);

    element.handleAddCondition();
    element.handleAddGroup();
    element.handleClearAll();

    expect(element.filterExpression.conditions.length).toBe(0);
    expect(element.filterExpression.groups.length).toBe(0);
  });

  test("populates operatorOptions for conditions based on column data type", () => {
    const element = createElement("c-smart-grid-filter-builder", {
      is: SmartGridFilterBuilder
    });
    element.columns = [
      { label: "Account Name", fieldName: "Name", type: "STRING" },
      { label: "Annual Revenue", fieldName: "AnnualRevenue", type: "CURRENCY" },
      { label: "Created Date", fieldName: "CreatedDate", type: "DATE" }
    ];
    document.body.appendChild(element);

    const stringOps = element.getOperatorOptionsForField("Name");
    expect(stringOps.some((o) => o.value === "contains")).toBe(true);

    const numberOps = element.getOperatorOptionsForField("AnnualRevenue");
    expect(numberOps.some((o) => o.value === ">")).toBe(true);
    expect(numberOps.some((o) => o.value === "contains")).toBe(false);

    const dateOps = element.getOperatorOptionsForField("CreatedDate");
    expect(dateOps.some((o) => o.value === "after")).toBe(false);
    expect(dateOps.some((o) => o.value === ">")).toBe(true);
  });
});
