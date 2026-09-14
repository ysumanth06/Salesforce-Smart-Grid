import { createElement } from "lwc";
import SmartGridRelatedGrid from "c/smartGridRelatedGrid";

describe("c-smart-grid-related-grid", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  test("resolves standard and custom relationships correctly", () => {
    const element = createElement("c-smart-grid-related-grid", {
      is: SmartGridRelatedGrid
    });
    element.parentObjectName = "Account";
    element.relatedObjectsString = "Contacts, Opportunities";
    element.parentRecordId = "001000000000001AAA";
    document.body.appendChild(element);

    const tabs = element.relationshipTabs;
    expect(tabs.length).toBe(2);
    expect(tabs[0].objectApiName).toBe("Contact");
    expect(tabs[0].lookupField).toBe("AccountId");
    expect(tabs[1].objectApiName).toBe("Opportunity");
    expect(tabs[1].lookupField).toBe("AccountId");
  });

  test("resolves contact case relationship correctly", () => {
    const element = createElement("c-smart-grid-related-grid", {
      is: SmartGridRelatedGrid
    });
    const parsed = element.resolveRelationship("Cases", "Contact");
    expect(parsed.objectApiName).toBe("Case");
    expect(parsed.lookupField).toBe("ContactId");
  });

  test("enforces max depth 2 (AC-07-3)", () => {
    const element = createElement("c-smart-grid-related-grid", {
      is: SmartGridRelatedGrid
    });
    element.parentRecordId = "001000000000001AAA";
    element.relatedObjectsString = "Contacts";
    element.depth = 3; // Beyond max depth 2
    document.body.appendChild(element);

    expect(element.isVisible).toBe(false);
  });

  test("does not show grid when relatedObjectsString is blank (TC-07-N1)", () => {
    const element = createElement("c-smart-grid-related-grid", {
      is: SmartGridRelatedGrid
    });
    element.parentRecordId = "001000000000001AAA";
    element.relatedObjectsString = "";
    document.body.appendChild(element);

    expect(element.isVisible).toBe(false);
  });

  test("dispatches close event on handleClose", () => {
    const element = createElement("c-smart-grid-related-grid", {
      is: SmartGridRelatedGrid
    });
    document.body.appendChild(element);

    const closeHandler = jest.fn();
    element.addEventListener("close", closeHandler);

    element.handleClose();
    expect(closeHandler).toHaveBeenCalled();
  });
});
