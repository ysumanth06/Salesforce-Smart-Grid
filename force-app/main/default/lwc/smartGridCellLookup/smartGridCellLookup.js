import { LightningElement, api, track } from "lwc";
import searchLookupRecords from "@salesforce/apex/SmartGridController.searchLookupRecords";

export default class SmartGridCellLookup extends LightningElement {
  @api targetObjectApiName = "Account";
  @api fieldName = "";
  @api context = "";
  @api placeholder = "Search...";
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
  @track searchKey = "";
  @track searchResults = [];
  @track isLoading = false;
  @track showNewRecordModal = false;

  _debounceTimeout;

  get computedDisplayValue() {
    return this._currentDisplayValue || this._currentValue || "";
  }

  get computedPlaceholder() {
    return (
      this.placeholder || `Search ${this.targetObjectApiName || "records"}...`
    );
  }

  handleStartEdit() {
    if (this.isEditable === false) {
      return;
    }
    this.isEditing = true;
    this.searchKey = this.computedDisplayValue;
    this.performSearch(this.searchKey);
  }

  handleCloseDropdown() {
    this.isEditing = false;
    this.searchResults = [];
  }

  handleSearchInput(event) {
    this.searchKey = event.target.value;
    window.clearTimeout(this._debounceTimeout);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._debounceTimeout = window.setTimeout(() => {
      this.performSearch(this.searchKey);
    }, 300);
  }

  async performSearch(searchTerm) {
    this.isLoading = true;
    try {
      const results = await searchLookupRecords({
        targetObjectApiName: this.targetObjectApiName || "Account",
        searchTerm: searchTerm || "",
        maxResults: 10
      });
      this.searchResults = results || [];
    } catch {
      this.searchResults = [];
    } finally {
      this.isLoading = false;
    }
  }

  handleSelectRecord(event) {
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

  handleOpenNewRecordModal() {
    this.showNewRecordModal = true;
  }

  handleCloseNewRecordModal() {
    this.showNewRecordModal = false;
  }

  handleNewRecordSuccess(event) {
    const newId = event.detail.id;
    const fields = event.detail.fields || {};
    const label = fields.Name ? fields.Name.value : newId;
    const oldValue = this._currentValue;

    this.showNewRecordModal = false;
    this._currentValue = newId;
    this._currentDisplayValue = label;
    this.isEditing = false;

    this.dispatchEvent(
      new CustomEvent("cellchange", {
        bubbles: true,
        composed: true,
        detail: {
          recordId: this.context,
          fieldName: this.fieldName,
          value: newId,
          displayValue: label,
          oldValue
        }
      })
    );
  }
}
