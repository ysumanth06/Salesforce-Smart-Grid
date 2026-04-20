import { LightningElement, api, track } from "lwc";

export default class SmartGridPicklist extends LightningElement {
  @api label;
  @api placeholder;
  @api options;
  @api value;
  @api context; // Row ID

  @track isEditMode = false;

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
    this.isEditMode = false;
  }

  handleChange(event) {
    const newValue = event.detail.value;
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
            fieldName: this.template.host.getAttribute("data-field-name")
          }
        }
      })
    );
  }
}
