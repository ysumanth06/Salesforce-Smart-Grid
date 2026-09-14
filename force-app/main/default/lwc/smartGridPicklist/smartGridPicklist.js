import { LightningElement, api } from "lwc";

export default class SmartGridPicklist extends LightningElement {
  @api label;
  @api placeholder;
  @api options = [];
  @api value;
  @api context; // Row ID
  @api fieldName; // Field API name for the column

  get displayValue() {
    if (!this.value && this.value !== 0) {
      return "";
    }
    const valStr = String(this.value).toLowerCase();
    const selectedOption = this.options?.find(
      (opt) =>
        opt.value === this.value || String(opt.value).toLowerCase() === valStr
    );
    return selectedOption ? selectedOption.label : this.value;
  }
}
