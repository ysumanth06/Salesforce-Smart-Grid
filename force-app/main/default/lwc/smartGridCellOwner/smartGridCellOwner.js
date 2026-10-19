import { LightningElement, api, track } from "lwc";
import searchLookupRecords from "@salesforce/apex/SmartGridController.searchLookupRecords";

export default class SmartGridCellOwner extends LightningElement {
  @api fieldName = "OwnerId";
  @api context = "";
  @api isEditable = false;

  @api
  get value() {
    return this._currentValue;
  }
  set value(val) {
    this._currentValue = val;
  }

  @api
  get displayValue() {
    return this._currentDisplayValue;
  }
  set displayValue(val) {
    this._currentDisplayValue = val;
  }

  @track _currentValue = "";
  @track _currentDisplayValue = "";
  @track isEditing = false;
  @track activeTab = "USERS"; // 'USERS' | 'QUEUES'
  @track searchKey = "";
  @track searchResults = [];
  @track isLoading = false;

  _debounceTimeout;

  get isQueue() {
    return (
      typeof this._currentValue === "string" &&
      this._currentValue.startsWith("00G")
    );
  }

  get ownerIconName() {
    return this.isQueue ? "standard:groups" : "standard:user";
  }

  get computedDisplayValue() {
    return this._currentDisplayValue || this._currentValue || "Unassigned";
  }

  get placeholderText() {
    return this.activeTab === "USERS" ? "Search Users..." : "Search Queues...";
  }

  get userTabClass() {
    return `owner-type-tab ${this.activeTab === "USERS" ? "is-active" : ""}`;
  }

  get queueTabClass() {
    return `owner-type-tab ${this.activeTab === "QUEUES" ? "is-active" : ""}`;
  }

  get filteredResults() {
    const icon =
      this.activeTab === "USERS" ? "standard:user" : "standard:groups";
    return (this.searchResults || []).map((r) => ({
      ...r,
      iconName: icon,
      type: this.activeTab
    }));
  }

  handleStartEdit() {
    if (this.isEditable === false) {
      return;
    }
    this.isEditing = true;
    this.activeTab = this.isQueue ? "QUEUES" : "USERS";
    this.searchKey = "";
    this.performSearch();
  }

  handleCloseDropdown() {
    this.isEditing = false;
    this.searchResults = [];
  }

  handleSelectUserTab() {
    if (this.activeTab !== "USERS") {
      this.activeTab = "USERS";
      this.performSearch();
    }
  }

  handleSelectQueueTab() {
    if (this.activeTab !== "QUEUES") {
      this.activeTab = "QUEUES";
      this.performSearch();
    }
  }

  handleSearchInput(event) {
    this.searchKey = event.target.value;
    window.clearTimeout(this._debounceTimeout);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._debounceTimeout = window.setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  async performSearch() {
    this.isLoading = true;
    const targetObj = this.activeTab === "USERS" ? "User" : "Group";
    try {
      const results = await searchLookupRecords({
        targetObjectApiName: targetObj,
        searchTerm: this.searchKey || "",
        maxResults: 10
      });
      this.searchResults = results || [];
    } catch {
      this.searchResults = [];
    } finally {
      this.isLoading = false;
    }
  }

  handleSelectOwner(event) {
    const recordId = event.currentTarget.dataset.id;
    const label = event.currentTarget.dataset.label;
    const oldValue = this._currentValue;

    this._currentValue = recordId;
    this._currentDisplayValue = label;
    this.isEditing = false;

    this.dispatchEvent(
      new CustomEvent("cellchange", {
        bubbles: true,
        composed: true,
        detail: {
          recordId: this.context,
          fieldName: this.fieldName,
          value: recordId,
          displayValue: label,
          oldValue
        }
      })
    );
  }

  handleKeyDown(event) {
    if (event.key === "Escape") {
      this.handleCloseDropdown();
    }
  }
}
