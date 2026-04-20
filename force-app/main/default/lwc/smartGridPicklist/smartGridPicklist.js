import { LightningElement, api } from "lwc";

export default class SmartGridPicklist extends LightningElement {
  @api label;
  @api value;
  @api placeholder;
  @api options;
  @api context; // Row ID

  handleChange(event) {
    const newValue = event.detail.value;
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
