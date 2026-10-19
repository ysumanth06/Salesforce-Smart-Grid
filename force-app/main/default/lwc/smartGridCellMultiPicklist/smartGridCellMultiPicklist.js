import { LightningElement, api, track } from "lwc";

export default class SmartGridCellMultiPicklist extends LightningElement {
  @api options = [];
  @api context = "";
  @api fieldName = "";
  @api isEditable = false;

  @api
  get value() {
    return this._currentValue;
  }
  set value(val) {
    this._currentValue = val;
    this.syncSelectedFromValue();
  }

  @track _currentValue = "";
  @track isEditing = false;
  @track filterText = "";
  @track selectedValues = [];

  connectedCallback() {
    this.syncSelectedFromValue();
  }

  syncSelectedFromValue() {
    if (!this._currentValue) {
      this.selectedValues = [];
      return;
    }
    if (Array.isArray(this._currentValue)) {
      this.selectedValues = [...this._currentValue];
    } else {
      this.selectedValues = String(this._currentValue)
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  get computedDisplayValue() {
    if (!this.selectedValues || this.selectedValues.length === 0) {
      return "";
    }
    return this.selectedValues.join("; ");
  }

  get selectedCountBadge() {
    const count = this.selectedValues ? this.selectedValues.length : 0;
    return count > 1 ? `${count}` : null;
  }

  get filteredOptions() {
    const filter = (this.filterText || "").toLowerCase();
    const selectedSet = new Set(this.selectedValues || []);

    return (this.options || [])
      .filter((opt) => {
        if (!filter) return true;
        const label = (opt.label || opt.value || "").toLowerCase();
        return label.includes(filter);
      })
      .map((opt) => {
        const val = opt.value;
        const isSelected = selectedSet.has(val);
        return {
          ...opt,
          checkboxId: `cb_${this.context}_${val}`,
          isSelected
        };
      });
  }

  handleStartEdit() {
    if (this.isEditable === false) {
      return;
    }
    this.syncSelectedFromValue();
    this.filterText = "";
    this.isEditing = true;
  }

  handleCancel() {
    this.syncSelectedFromValue();
    this.isEditing = false;
  }

  handleFilterInput(event) {
    this.filterText = event.target.value;
  }

  handleToggleOption(event) {
    const value = event.currentTarget.dataset.value;
    const currentSet = new Set(this.selectedValues || []);

    if (currentSet.has(value)) {
      currentSet.delete(value);
    } else {
      currentSet.add(value);
    }

    this.selectedValues = Array.from(currentSet);
  }

  handleSelectAll() {
    const allValues = (this.options || []).map((opt) => opt.value);
    this.selectedValues = allValues;
  }

  handleClearAll() {
    this.selectedValues = [];
  }

  handleApply() {
    const oldValue = this._currentValue;
    const joinedValue = (this.selectedValues || []).join(";");
    this._currentValue = joinedValue;
    this.isEditing = false;

    if (joinedValue !== oldValue) {
      this.dispatchEvent(
        new CustomEvent("cellchange", {
          bubbles: true,
          composed: true,
          detail: {
            recordId: this.context,
            fieldName: this.fieldName,
            value: joinedValue,
            displayValue: this.computedDisplayValue,
            oldValue
          }
        })
      );
    }
  }
}
