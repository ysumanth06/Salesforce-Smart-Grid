import { createElement } from "lwc";
import SmartGridCellOwner from "c/smartGridCellOwner";
import searchLookupRecords from "@salesforce/apex/SmartGridController.searchLookupRecords";

jest.mock(
  "@salesforce/apex/SmartGridController.searchLookupRecords",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

describe("c-smart-grid-cell-owner", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  const MOCK_USERS = [
    { id: "0050000001", label: "Sarah Connor", sublabel: "User" }
  ];

  const MOCK_QUEUES = [
    { id: "00G0000001", label: "Tier 2 Support Queue", sublabel: "Group" }
  ];

  it("renders user icon when value is a User ID (005)", async () => {
    const element = createElement("c-smart-grid-cell-owner", {
      is: SmartGridCellOwner
    });
    element.value = "0050000001";
    element.displayValue = "Sarah Connor";
    document.body.appendChild(element);

    await Promise.resolve();

    const icon = element.shadowRoot.querySelector("lightning-icon");
    expect(icon).not.toBeNull();
    expect(icon.iconName).toBe("standard:user");
    expect(element.shadowRoot.textContent).toContain("Sarah Connor");
  });

  it("renders queue icon when value is a Queue ID (00G)", async () => {
    const element = createElement("c-smart-grid-cell-owner", {
      is: SmartGridCellOwner
    });
    element.value = "00G0000001";
    element.displayValue = "Tier 2 Support Queue";
    document.body.appendChild(element);

    await Promise.resolve();

    const icon = element.shadowRoot.querySelector("lightning-icon");
    expect(icon).not.toBeNull();
    expect(icon.iconName).toBe("standard:groups");
    expect(element.shadowRoot.textContent).toContain("Tier 2 Support Queue");
  });

  it("allows switching between Users and Queues tabs and selecting a new owner", async () => {
    searchLookupRecords
      .mockResolvedValueOnce(MOCK_USERS)
      .mockResolvedValueOnce(MOCK_QUEUES);

    const element = createElement("c-smart-grid-cell-owner", {
      is: SmartGridCellOwner
    });
    element.value = "0050000001";
    element.displayValue = "Sarah Connor";
    element.context = "REC_999";
    element.isEditable = true;
    document.body.appendChild(element);

    const changeHandler = jest.fn();
    element.addEventListener("cellchange", changeHandler);

    await Promise.resolve();

    // Start editing
    element.shadowRoot
      .querySelector(".owner-display-wrapper")
      .dispatchEvent(new CustomEvent("dblclick", { bubbles: true }));

    await Promise.resolve();

    // Switch to Queues tab
    const queueTab = element.shadowRoot.querySelector(
      '[data-testid="owner-tab-queues"]'
    );
    queueTab.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(searchLookupRecords).toHaveBeenCalledWith(
      expect.objectContaining({ targetObjectApiName: "Group" })
    );

    // Select the queue
    const queueItem = element.shadowRoot.querySelector(".owner-item");
    expect(queueItem).not.toBeNull();
    queueItem.click();

    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail.recordId).toBe("REC_999");
    expect(changeHandler.mock.calls[0][0].detail.value).toBe("00G0000001");
    expect(changeHandler.mock.calls[0][0].detail.displayValue).toBe(
      "Tier 2 Support Queue"
    );
  });
});
