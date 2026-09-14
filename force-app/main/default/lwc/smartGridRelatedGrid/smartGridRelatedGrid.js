import { LightningElement, api, track } from "lwc";

export default class SmartGridRelatedGrid extends LightningElement {
  @api parentRecordId;
  @api parentObjectName = "";
  @api relatedObjectsString = "";
  @api depth = 1;

  @track activeTab = "";

  @api
  get isVisible() {
    return Boolean(
      this.parentRecordId &&
      this.relatedObjectsString &&
      this.relatedObjectsString.trim() &&
      this.depth <= 2
    );
  }

  @api
  get relationshipTabs() {
    if (!this.relatedObjectsString) return [];
    return this.relatedObjectsString
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((relName) => {
        const parsed = this.resolveRelationship(relName, this.parentObjectName);
        return {
          id: relName,
          label: relName,
          objectApiName: parsed.objectApiName,
          lookupField: parsed.lookupField
        };
      });
  }

  get activeRelationship() {
    const tabs = this.relationshipTabs;
    if (!tabs || tabs.length === 0) return null;
    return tabs.find((t) => t.id === this.activeTab) || tabs[0];
  }

  get activeObjectApiName() {
    return this.activeRelationship ? this.activeRelationship.objectApiName : "";
  }

  get activeLookupField() {
    return this.activeRelationship ? this.activeRelationship.lookupField : "";
  }

  get nextDepth() {
    return Number(this.depth) + 1;
  }

  get hasMultipleTabs() {
    return this.relationshipTabs.length > 1;
  }

  connectedCallback() {
    if (this.relationshipTabs.length > 0) {
      this.activeTab = this.relationshipTabs[0].id;
    }
  }

  handleTabActive(event) {
    this.activeTab = event.target.value;
  }

  @api
  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  @api
  resolveRelationship(relName, parentObj) {
    const lowerRel = relName.toLowerCase();
    const parentLower = (parentObj || "").toLowerCase();

    // Standard relationship heuristics
    if (lowerRel === "contacts") {
      return { objectApiName: "Contact", lookupField: "AccountId" };
    }
    if (lowerRel === "opportunities") {
      return { objectApiName: "Opportunity", lookupField: "AccountId" };
    }
    if (lowerRel === "cases") {
      const lookup = parentLower === "contact" ? "ContactId" : "AccountId";
      return { objectApiName: "Case", lookupField: lookup };
    }
    if (lowerRel === "tasks") {
      const lookup = parentLower === "contact" ? "WhoId" : "WhatId";
      return { objectApiName: "Task", lookupField: lookup };
    }

    // Custom relationship (e.g. Invoices__r, Project_Tasks__r)
    if (relName.endsWith("__r")) {
      const customObj = relName.replace(/__r$/, "__c");
      const customLookup = parentObj ? `${parentObj}__c` : "Parent__c";
      return { objectApiName: customObj, lookupField: customLookup };
    }

    // Default fallback
    return {
      objectApiName: relName,
      lookupField: parentObj ? `${parentObj}Id` : "ParentId"
    };
  }
}
