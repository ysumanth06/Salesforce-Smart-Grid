import { LightningElement, api, track } from "lwc";

export default class SmartGridCellDependentPicklist extends LightningElement {
  @api controllingValue = "";
  @api dependencyMap = {}; // { [controllingValue]: Array<{ label, value }> }
  @api context = "";
  @api fieldName = "";
  @api isEditable = false;

  @api
  get value() {
    return this._currentValue;
  }
  set value(val) {
    this._currentValue = val;
  }

  @track _currentValue = "";
  @track isEditing = false;
  @track searchFilter = "";

  get availableOptions() {
    if (!this.dependencyMap || !this.controllingValue) {
      return [];
    }
    return this.dependencyMap[this.controllingValue] || [];
  }

  get hasAvailableOptions() {
    return this.availableOptions && this.availableOptions.length > 0;
  }

  get filteredOptions() {
    const filter = (this.searchFilter || "").toLowerCase();
    return this.availableOptions.filter((opt) => {
      if (!filter) return true;
      const label = (opt.label || opt.value || "").toLowerCase();
      return label.includes(filter);
    });
  }

  get computedDisplayValue() {
    if (!this._currentValue) {
      return "";
    }
    const matched = this.availableOptions.find(
      (o) => o.value === this._currentValue
    );
    return matched ? matched.label : this._currentValue;
  }

  get computedPlaceholder() {
    return this.hasAvailableOptions
      ? "Select an option..."
      : "No options available";
  }

  handleStartEdit() {
    if (this.isEditable === false) {
      return;
    }
    this.searchFilter = "";
    this.isEditing = true;
  }

  handleCloseDropdown() {
    this.isEditing = false;
  }

  handleFilterInput(event) {
    this.searchFilter = event.target.value;
  }

  handleSelectOption(event) {
    const selectedVal = event.currentTarget.dataset.value;
    const label = event.currentTarget.dataset.label;
    const oldValue = this._currentValue;

    this._currentValue = selectedVal;
    this.isEditing = false;

    if (selectedVal !== oldValue) {
      this.dispatchEvent(
        new CustomEvent("cellchange", {
          bubbles: true,
          composed: true,
          detail: {
            recordId: this.context,
            fieldName: this.fieldName,
            value: selectedVal,
            displayValue: label,
            oldValue
          }
        })
      );
    }
  }

  handleKeyDown(event) {
    if (event.key === "Escape") {
      this.handleCloseDropdown();
    }
  }
}
