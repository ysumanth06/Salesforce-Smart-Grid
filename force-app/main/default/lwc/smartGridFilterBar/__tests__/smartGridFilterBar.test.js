import { createElement } from "lwc";
import SmartGridFilterBar from "c/smartGridFilterBar";

describe("c-smart-grid-filter-bar", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  test("does not render filter bar when filters array is empty", () => {
    const element = createElement("c-smart-grid-filter-bar", {
      is: SmartGridFilterBar
    });
    element.filters = [];
    document.body.appendChild(element);

    const bar = element.shadowRoot.querySelector('[data-testid="filter-bar"]');
    expect(bar).toBeNull();
  });

  test("renders pills when filters are provided", async () => {
    const element = createElement("c-smart-grid-filter-bar", {
      is: SmartGridFilterBar
    });
    element.filters = [
      {
        id: "f1",
        fieldName: "Industry",
        fieldLabel: "Industry",
        value: "Technology",
        source: "combobox"
      },
      {
        id: "f2",
        fieldName: "StageName",
        fieldLabel: "Stage",
        value: "Closed Won",
        displayLabel: "Stage: Closed Won",
        source: "header"
      }
    ];
    document.body.appendChild(element);

    await Promise.resolve();

    const pills = element.shadowRoot.querySelectorAll(".filter-pill");
    expect(pills.length).toBe(2);

    const pillTexts = element.shadowRoot.querySelectorAll(".filter-pill-text");
    expect(pillTexts[0].textContent.trim()).toBe("Industry: Technology");
    expect(pillTexts[1].textContent.trim()).toBe("Stage: Closed Won");
  });

  test("dispatches removefilter event when pill close button is clicked", async () => {
    const element = createElement("c-smart-grid-filter-bar", {
      is: SmartGridFilterBar
    });
    element.filters = [
      {
        id: "f1",
        fieldName: "Industry",
        fieldLabel: "Industry",
        value: "Technology",
        source: "combobox"
      }
    ];
    document.body.appendChild(element);

    await Promise.resolve();

    const handler = jest.fn();
    element.addEventListener("removefilter", handler);

    const removeBtn = element.shadowRoot.querySelector(".slds-pill__remove");
    removeBtn.click();

    expect(handler).toHaveBeenCalled();
    const detail = handler.mock.calls[0][0].detail;
    expect(detail.id).toBe("f1");
    expect(detail.fieldName).toBe("Industry");
    expect(detail.value).toBe("Technology");
    expect(detail.source).toBe("combobox");
  });

  test("dispatches clearall event when Clear All button is clicked", async () => {
    const element = createElement("c-smart-grid-filter-bar", {
      is: SmartGridFilterBar
    });
    element.filters = [
      {
        id: "f1",
        fieldName: "Rating",
        value: "Hot",
        source: "header"
      }
    ];
    document.body.appendChild(element);

    await Promise.resolve();

    const clearHandler = jest.fn();
    element.addEventListener("clearall", clearHandler);

    const clearBtn = element.shadowRoot.querySelector(".clear-all-button");
    clearBtn.click();

    expect(clearHandler).toHaveBeenCalled();
  });

  test("formats daterange and filterbuilder sources properly", async () => {
    const element = createElement("c-smart-grid-filter-bar", {
      is: SmartGridFilterBar
    });
    element.filters = [
      {
        id: "d1",
        fieldName: "CloseDate",
        fieldLabel: "Close Date",
        value: "2026-01-01",
        source: "daterange"
      },
      {
        id: "fb1",
        fieldName: "advanced",
        value: "Amount > 50000",
        source: "filterbuilder"
      },
      {
        id: "fb2",
        fieldName: "advanced2",
        value: "",
        source: "filterbuilder"
      }
    ];
    document.body.appendChild(element);

    await Promise.resolve();

    const pills = element.shadowRoot.querySelectorAll(".filter-pill-text");
    expect(pills.length).toBe(3);
    expect(pills[0].textContent.trim()).toBe("Close Date: 2026-01-01");
    expect(pills[1].textContent.trim()).toBe("Amount > 50000");
    expect(pills[2].textContent.trim()).toBe("Advanced Criteria");
  });

  test("handles long values with native tooltip title for accessibility and truncation", async () => {
    const longValue = "A".repeat(80);
    const element = createElement("c-smart-grid-filter-bar", {
      is: SmartGridFilterBar
    });
    element.filters = [
      {
        id: "long1",
        fieldName: "Description",
        fieldLabel: "Description",
        value: longValue,
        source: "combobox"
      }
    ];
    document.body.appendChild(element);

    await Promise.resolve();

    const pill = element.shadowRoot.querySelector(".filter-pill");
    expect(pill.title).toBe(`Description: ${longValue}`);
  });

  test("renders 10 active filter pills gracefully in bulk", async () => {
    const element = createElement("c-smart-grid-filter-bar", {
      is: SmartGridFilterBar
    });
    const bulkFilters = Array.from({ length: 10 }, (_, i) => ({
      id: `pill_${i}`,
      fieldName: `Field_${i}`,
      fieldLabel: `Field ${i}`,
      value: `Val ${i}`,
      source: "header"
    }));
    element.filters = bulkFilters;
    document.body.appendChild(element);

    await Promise.resolve();

    const pills = element.shadowRoot.querySelectorAll(".filter-pill");
    expect(pills.length).toBe(10);
  });

  test("handles null or non-array filters gracefully", () => {
    const element = createElement("c-smart-grid-filter-bar", {
      is: SmartGridFilterBar
    });
    element.filters = null;
    document.body.appendChild(element);

    const bar = element.shadowRoot.querySelector('[data-testid="filter-bar"]');
    expect(bar).toBeNull();
  });
});
