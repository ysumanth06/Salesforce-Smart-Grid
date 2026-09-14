import { createElement } from "lwc";
import SmartGridPicklist from "c/smartGridPicklist";

describe("c-smart-grid-picklist", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders empty display when value is null or undefined", () => {
    const element = createElement("c-smart-grid-picklist", {
      is: SmartGridPicklist
    });
    element.options = [
      { label: "Agriculture", value: "Agriculture" },
      { label: "Banking", value: "Banking" }
    ];
    element.value = null;
    document.body.appendChild(element);

    const span = element.shadowRoot.querySelector("span");
    expect(span.textContent).toBe("");
  });

  it("renders matching option label when value exists in options", async () => {
    const element = createElement("c-smart-grid-picklist", {
      is: SmartGridPicklist
    });
    element.options = [
      { label: "Agriculture & Mining", value: "Agriculture" },
      { label: "Banking & Finance", value: "Banking" }
    ];
    element.value = "Banking";
    document.body.appendChild(element);

    await Promise.resolve();

    const span = element.shadowRoot.querySelector("span");
    expect(span.textContent).toBe("Banking & Finance");
    const cell = element.shadowRoot.querySelector(".picklist-cell");
    expect(cell.title).toBe("Banking & Finance");
  });

  it("matches case-insensitively when value differs in casing", async () => {
    const element = createElement("c-smart-grid-picklist", {
      is: SmartGridPicklist
    });
    element.options = [
      { label: "Technology", value: "Technology" },
      { label: "Consulting", value: "Consulting" }
    ];
    element.value = "technology";
    document.body.appendChild(element);

    await Promise.resolve();

    const span = element.shadowRoot.querySelector("span");
    expect(span.textContent).toBe("Technology");
  });

  it("falls back to raw value if value is not in options", async () => {
    const element = createElement("c-smart-grid-picklist", {
      is: SmartGridPicklist
    });
    element.options = [{ label: "Government", value: "Government" }];
    element.value = "CustomSector";
    document.body.appendChild(element);

    await Promise.resolve();

    const span = element.shadowRoot.querySelector("span");
    expect(span.textContent).toBe("CustomSector");
  });
});
