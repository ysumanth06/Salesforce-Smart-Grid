import { LightningElement, api } from "lwc";

export default class SmartGridFilterBar extends LightningElement {
  @api filters = [];

  get filterPills() {
    if (!this.filters || !Array.isArray(this.filters)) {
      return [];
    }

    return this.filters.map((f) => {
      const fieldLabel = f.fieldLabel || f.fieldName || "";
      let displayLabel = f.displayLabel;
      if (!displayLabel) {
        if (f.source === "daterange") {
          displayLabel = `${fieldLabel}: ${f.value}`;
        } else if (f.source === "filterbuilder") {
          displayLabel = f.value || "Advanced Criteria";
        } else {
          displayLabel = fieldLabel ? `${fieldLabel}: ${f.value}` : f.value;
        }
      }

      return {
        ...f,
        displayLabel,
        removeTitle: `Remove filter: ${displayLabel}`
      };
    });
  }

  get hasFilters() {
    return this.filterPills.length > 0;
  }

  handleRemovePill(event) {
    event.stopPropagation();
    const btn = event.currentTarget;
    const { id, source, field, value } = btn.dataset;

    this.dispatchEvent(
      new CustomEvent("removefilter", {
        detail: {
          id,
          source,
          fieldName: field,
          value
        }
      })
    );
  }

  handleClearAll() {
    this.dispatchEvent(new CustomEvent("clearall"));
  }
}
