import { LightningElement, api } from "lwc";

export default class SmartGridDmlConfirmModal extends LightningElement {
  @api isOpen = false;
  @api previewResult;
  @api isLoading = false;

  get computedOperationLabel() {
    return this.previewResult?.operation === "DELETE" ? "Deletion" : "Update";
  }

  get affectedCount() {
    return this.previewResult?.totalAffectedRecords || 0;
  }

  get operationType() {
    return this.previewResult?.operation || "UPDATE";
  }

  get hasFields() {
    return (
      this.previewResult?.affectedFieldNames &&
      this.previewResult.affectedFieldNames.length > 0
    );
  }

  get affectedFieldsList() {
    return (this.previewResult?.affectedFieldNames || []).join(", ");
  }

  get flattenedRows() {
    if (!this.previewResult || !this.previewResult.previewRows) {
      return [];
    }

    const rows = [];
    const isDelete = this.previewResult.operation === "DELETE";

    this.previewResult.previewRows.forEach((r, rIdx) => {
      if (r.changes && r.changes.length > 0) {
        r.changes.forEach((c, cIdx) => {
          rows.push({
            key: `diff-${r.recordId || rIdx}-${c.fieldName || cIdx}`,
            recordName: r.recordName || "Record",
            fieldName: c.fieldName || "-",
            oldValue: c.oldValue != null ? String(c.oldValue) : "(blank)",
            newValue: c.newValue != null ? String(c.newValue) : "(blank)",
            newValClass: isDelete
              ? "new-val-badge-delete"
              : "new-val-badge-update"
          });
        });
      }
    });

    return rows;
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleConfirm() {
    if (!this.previewResult) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("confirm", {
        detail: {
          operation: this.previewResult.operation,
          recordIds: this.previewResult.recordIds || [],
          fieldUpdatesJson: this.previewResult.fieldUpdatesJson || "{}"
        }
      })
    );
  }
}
