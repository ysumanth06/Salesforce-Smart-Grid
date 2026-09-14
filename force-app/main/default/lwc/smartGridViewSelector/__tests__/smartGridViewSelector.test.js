import { createElement } from "lwc";
import SmartGridViewSelector from "c/smartGridViewSelector";
import getViews from "@salesforce/apex/SmartGridController.getViews";
import saveView from "@salesforce/apex/SmartGridController.saveView";
import deleteView from "@salesforce/apex/SmartGridController.deleteView";

jest.mock(
  "@salesforce/apex/SmartGridController.getViews",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/SmartGridController.saveView",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/SmartGridController.deleteView",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

const MOCK_VIEWS = [
  {
    Id: "view1",
    View_Name__c: "Default Account View",
    Object_API_Name__c: "Account",
    Is_Default__c: true,
    View_Config_JSON__c: '{"sortField":"Name"}'
  },
  {
    Id: "view2",
    View_Name__c: "Secondary View",
    Object_API_Name__c: "Account",
    Is_Default__c: false,
    View_Config_JSON__c: '{"sortField":"Industry"}'
  },
  {
    Id: "hist1",
    View_Name__c: "__history_12345",
    Object_API_Name__c: "Account",
    Is_Default__c: false,
    View_Config_JSON__c: '{"filterIndex":1}',
    Last_Used__c: "2026-09-14T01:00:00Z"
  }
];

describe("c-smart-grid-view-selector", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  test("loads views and auto-selects default view", async () => {
    getViews.mockResolvedValue(MOCK_VIEWS);

    const element = createElement("c-smart-grid-view-selector", {
      is: SmartGridViewSelector
    });
    element.objectApiName = "Account";

    const selectHandler = jest.fn();
    element.addEventListener("viewselect", selectHandler);

    document.body.appendChild(element);

    await Promise.resolve();
    await Promise.resolve();

    expect(getViews).toHaveBeenCalledWith({ objectApiName: "Account" });
    expect(selectHandler).toHaveBeenCalled();
    const detail = selectHandler.mock.calls[0][0].detail;
    expect(detail.viewId).toBe("view1");
    expect(detail.config.sortField).toBe("Name");
  });

  test("dispatches viewselect when another view is picked", async () => {
    getViews.mockResolvedValue(MOCK_VIEWS);

    const element = createElement("c-smart-grid-view-selector", {
      is: SmartGridViewSelector
    });
    element.objectApiName = "Account";
    document.body.appendChild(element);

    await Promise.resolve();
    await Promise.resolve();

    const selectHandler = jest.fn();
    element.addEventListener("viewselect", selectHandler);

    // Change to view2
    element.handleViewChange({ detail: { value: "view2" } });

    expect(selectHandler).toHaveBeenCalled();
    expect(selectHandler.mock.calls[0][0].detail.viewId).toBe("view2");
    expect(selectHandler.mock.calls[0][0].detail.config.sortField).toBe(
      "Industry"
    );
  });

  test("dispatches resetview when blank view is picked", async () => {
    getViews.mockResolvedValue(MOCK_VIEWS);

    const element = createElement("c-smart-grid-view-selector", {
      is: SmartGridViewSelector
    });
    element.objectApiName = "Account";
    document.body.appendChild(element);

    await Promise.resolve();
    await Promise.resolve();

    const resetHandler = jest.fn();
    element.addEventListener("resetview", resetHandler);

    element.handleViewChange({ detail: { value: "" } });
    expect(resetHandler).toHaveBeenCalled();
  });

  test("saves a new view via saveView Apex call", async () => {
    getViews.mockResolvedValue([]);
    saveView.mockResolvedValue({
      Id: "newView1",
      View_Name__c: "Custom Filter"
    });

    const element = createElement("c-smart-grid-view-selector", {
      is: SmartGridViewSelector
    });
    element.objectApiName = "Account";
    element.currentConfig = { sortField: "CreatedDate" };
    document.body.appendChild(element);

    await Promise.resolve();

    element.handleOpenSaveModal();
    await element.saveNewView("Custom Filter", true);

    expect(saveView).toHaveBeenCalledWith({
      viewId: null,
      viewName: "Custom Filter",
      objectApiName: "Account",
      configJson: '{"sortField":"CreatedDate"}',
      isDefault: true
    });
  });

  test("deletes selected view via deleteView Apex call", async () => {
    getViews.mockResolvedValue(MOCK_VIEWS);
    deleteView.mockResolvedValue();

    const element = createElement("c-smart-grid-view-selector", {
      is: SmartGridViewSelector
    });
    element.objectApiName = "Account";
    document.body.appendChild(element);

    await Promise.resolve();
    await Promise.resolve();

    element.handleViewChange({ detail: { value: "view2" } });

    const resetHandler = jest.fn();
    element.addEventListener("resetview", resetHandler);

    await element.handleDeleteSelectedView();

    expect(deleteView).toHaveBeenCalledWith({ viewId: "view2" });
    expect(resetHandler).toHaveBeenCalled();
  });
});
