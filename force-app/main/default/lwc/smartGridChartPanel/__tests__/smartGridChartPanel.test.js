import { createElement } from "@lwc/engine-dom";
import SmartGridChartPanel from "c/smartGridChartPanel";

describe("c-smart-grid-chart-panel", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const MOCK_DATA = [
    { Id: "001A", Industry: "Technology", AnnualRevenue: 500000 },
    { Id: "001B", Industry: "Technology", AnnualRevenue: 300000 },
    { Id: "001C", Industry: "Finance", AnnualRevenue: 200000 }
  ];

  it("does not render drawer when isOpen is false", async () => {
    const element = createElement("c-smart-grid-chart-panel", {
      is: SmartGridChartPanel
    });
    element.isOpen = false;
    element.data = MOCK_DATA;
    document.body.appendChild(element);

    await Promise.resolve();

    const container = element.shadowRoot.querySelector(
      ".chart-panel-container"
    );
    expect(container).toBeNull();
  });

  it("renders KPI metrics and donut chart SVG by default when open", async () => {
    const element = createElement("c-smart-grid-chart-panel", {
      is: SmartGridChartPanel
    });
    element.isOpen = true;
    element.data = MOCK_DATA;
    element.groupByField = "Industry";
    element.aggregateField = "AnnualRevenue";
    document.body.appendChild(element);

    await Promise.resolve();

    const kpiVals = element.shadowRoot.querySelectorAll(".chart-kpi-val");
    expect(kpiVals.length).toBe(3);
    expect(kpiVals[0].textContent).toBe("3"); // 3 records
    expect(kpiVals[1].textContent).toBe("$1,000,000"); // 500k + 300k + 200k
    expect(kpiVals[2].textContent).toBe("2"); // 2 groups (Technology, Finance)

    // Donut SVG paths
    const paths = element.shadowRoot.querySelectorAll("svg path");
    expect(paths.length).toBe(2);
  });

  it("switches chart type to Bar and renders horizontal progress bars", async () => {
    const element = createElement("c-smart-grid-chart-panel", {
      is: SmartGridChartPanel
    });
    element.isOpen = true;
    element.data = MOCK_DATA;
    document.body.appendChild(element);

    await Promise.resolve();

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const barBtn = Array.from(buttons).find((b) => b.label === "Bar");
    barBtn.click();

    await Promise.resolve();

    const hbars = element.shadowRoot.querySelectorAll(".hbar-item");
    expect(hbars.length).toBe(2);
  });

  it("switches chart type to Funnel and renders SVG polygon stages", async () => {
    const element = createElement("c-smart-grid-chart-panel", {
      is: SmartGridChartPanel
    });
    element.isOpen = true;
    element.data = MOCK_DATA;
    document.body.appendChild(element);

    await Promise.resolve();

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const funnelBtn = Array.from(buttons).find((b) => b.label === "Funnel");
    funnelBtn.click();

    await Promise.resolve();

    const polygons = element.shadowRoot.querySelectorAll("svg polygon");
    expect(polygons.length).toBe(2);
  });

  it("dispatches close event when close icon is clicked", async () => {
    const element = createElement("c-smart-grid-chart-panel", {
      is: SmartGridChartPanel
    });
    element.isOpen = true;
    element.data = MOCK_DATA;
    document.body.appendChild(element);

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    await Promise.resolve();

    const closeBtn = element.shadowRoot.querySelector(
      '[data-testid="chart-close-btn"]'
    );
    closeBtn.click();

    expect(closeHandler).toHaveBeenCalledTimes(1);
  });
});
