import { LightningElement, api, track } from "lwc";

export default class SmartGridPicklist extends LightningElement {
  @api label;
  @api placeholder;
  @api options;
  @api value;
  @api context; // Row ID
  @api fieldName; // Field API name for the column

  @track isEditMode = false;
  _pendingChange = false;

  get displayValue() {
    const selectedOption = this.options?.find(
      (opt) => opt.value === this.value
    );
    return selectedOption ? selectedOption.label : this.value || "---";
  }

  handleCellClick(event) {
    // Prevent standard datatable events if needed
    event.stopPropagation();
  }

  handleEditClick() {
    this.isEditMode = true;
    // Use Promise to focus after render
    Promise.resolve().then(() => {
      const combobox = this.template.querySelector("lightning-combobox");
      if (combobox) combobox.focus();
    });
  }

  handleBlur() {
    // Delay closing so handleChange fires first when user selects a value
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      if (!this._pendingChange) {
        this.isEditMode = false;
      }
      this._pendingChange = false;
    }, 200);
  }

  handleChange(event) {
    const newValue = event.detail.value;
    this._pendingChange = true;
    this.isEditMode = false;

    // Fire event that lightning-datatable expects for custom types
    this.dispatchEvent(
      new CustomEvent("picklistchange", {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: {
          data: {
            context: this.context,
            value: newValue,
            fieldName: this.fieldName
          }
        }
      })
    );
  }
}
