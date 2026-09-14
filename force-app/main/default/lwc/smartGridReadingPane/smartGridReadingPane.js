import { LightningElement, api, track } from "lwc";

export default class SmartGridReadingPane extends LightningElement {
  @api recordId;
  @api objectApiName;
  @api fields = [];
  @api recordTitle;

  @track hasError = false;
  @track errorMessage = "";

  get displayTitle() {
    return this.recordTitle || "Record Detail";
  }

  get accessibleFields() {
    if (!this.fields || this.fields.length === 0) return [];
    return this.fields.map((f) => {
      const fieldName = typeof f === "string" ? f : f.fieldName;
      const label = typeof f === "object" && f.label ? f.label : fieldName;
      return { fieldName, label };
    });
  }

  @api
  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  @api
  handleError(event) {
    this.hasError = true;
    this.errorMessage =
      (event.detail && event.detail.message) ||
      "Unable to view record details due to permissions.";
  }
}
