import { LightningElement, api, track } from "lwc";
import { transposeGrid } from "c/matrixTransposer";

export default class SmartGridTransposeTable extends LightningElement {
  @api records = [];
  @api columns = [];
  @api draftValues = [];
  @api columnWidth = 160;
  @api maxTransposeLimit = 20;

  @track filterMode = "ALL"; // 'ALL' | 'DIFFERENCES_ONLY' | 'POPULATED_ONLY'
  @track activeEditingCell = null; // { recordId, fieldName }

  get boundedRecords() {
    if (!this.records || this.records.length === 0) {
      return [];
    }
    if (this.records.length > this.maxTransposeLimit) {
      return this.records.slice(0, this.maxTransposeLimit);
    }
    return this.records;
  }

  get isOverLimit() {
    return this.records && this.records.length > this.maxTransposeLimit;
  }

  get effectiveRecordCount() {
    return this.boundedRecords.length;
  }

  get transposedData() {
    return transposeGrid({
      records: this.boundedRecords,
      columns: this.columns,
      filterMode: this.filterMode,
      draftValues: this.draftValues,
      columnWidth: this.columnWidth
    });
  }

  get recordColumns() {
    return (this.transposedData.columns || []).filter(
      (col) => !col.isPinned && col.type !== "badge"
    );
  }

  get transposedRows() {
    const rawRows = this.transposedData.rows || [];
    return rawRows.map((row) => {
      const isDiffering = row.discrepancyStatus === "DIFFERING";
      const rowClass = isDiffering ? "is-differing-row" : "";

      const cells = (row.cells || []).map((cell) => {
        const isEditing =
          this.activeEditingCell &&
          this.activeEditingCell.recordId === cell.recordId &&
          this.activeEditingCell.fieldName === cell.fieldName;

        let inputType = "text";
        if (
          cell.dataType === "number" ||
          cell.dataType === "currency" ||
          cell.dataType === "percent"
        ) {
          inputType = "number";
        } else if (cell.dataType === "date") {
          inputType = "date";
        }

        const cellClass = cell.isEditable
          ? "transpose-cell-editable slds-cell-edit"
          : "slds-cell-edit";

        return {
          ...cell,
          isEditing,
          inputType,
          cellClass
        };
      });

      return {
        ...row,
        rowClass,
        cells
      };
    });
  }

  get recordColumnStyle() {
    const width = this.columnWidth || 160;
    return `width: ${width}px; min-width: 140px; max-width: 320px;`;
  }

  get totalFieldCount() {
    return this.transposedData.totalFieldCount || 0;
  }

  get differingCount() {
    return this.transposedData.differingCount || 0;
  }

  get allFieldsButtonLabel() {
    return `All Fields (${this.totalFieldCount})`;
  }

  get diffFieldsButtonLabel() {
    return `Differences Only (${this.differingCount})`;
  }

  get allFilterVariant() {
    return this.filterMode === "ALL" ? "brand" : "neutral";
  }

  get diffFilterVariant() {
    return this.filterMode === "DIFFERENCES_ONLY" ? "brand" : "neutral";
  }

  get populatedFilterVariant() {
    return this.filterMode === "POPULATED_ONLY" ? "brand" : "neutral";
  }

  get summaryText() {
    return `Comparing ${this.effectiveRecordCount} records across ${this.transposedRows.length} fields (${this.differingCount} differing)`;
  }

  handleFilterAll() {
    this.filterMode = "ALL";
  }

  handleFilterDiff() {
    this.filterMode = "DIFFERENCES_ONLY";
  }

  handleFilterPopulated() {
    this.filterMode = "POPULATED_ONLY";
  }

  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  handleScrollLeft() {
    const container = this.template.querySelector(".transpose-scroll-area");
    if (container) {
      container.scrollBy({ left: -300, behavior: "smooth" });
    }
  }

  handleScrollRight() {
    const container = this.template.querySelector(".transpose-scroll-area");
    if (container) {
      container.scrollBy({ left: 300, behavior: "smooth" });
    }
  }

  handleCellDblClick(event) {
    const cell = event.currentTarget;
    const recordId = cell.dataset.recordId;
    const fieldName = cell.dataset.field;

    const col = (this.columns || []).find((c) => c.fieldName === fieldName);
    if (!col || col.editable === false) {
      return;
    }

    this.activeEditingCell = { recordId, fieldName };
  }

  handleCellEditBlur(event) {
    if (!this.activeEditingCell) {
      return;
    }

    const recordId = event.target.dataset.recordId;
    const fieldName = event.target.dataset.field;
    const newValue = event.target.value;

    const record = (this.records || []).find((r) => r.Id === recordId);
    const oldValue = record ? record[fieldName] : undefined;

    this.activeEditingCell = null;

    if (String(newValue) !== String(oldValue)) {
      this.dispatchEvent(
        new CustomEvent("cellchange", {
          detail: {
            recordId,
            fieldName,
            value: newValue,
            oldValue
          }
        })
      );
    }
  }

  handleCellEditKeyDown(event) {
    if (event.key === "Enter") {
      event.target.blur();
    } else if (event.key === "Escape") {
      this.activeEditingCell = null;
    }
  }
}
