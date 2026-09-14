import { LightningElement, api } from "lwc";

export default class SmartGridReviewModal extends LightningElement {
  @api isOpen = false;
  @api draftValues = [];
  @api gridData = [];
  @api gridColumns = [];
  @api draftDetails = null;

  get reviewRows() {
    if (this.draftDetails && Array.isArray(this.draftDetails)) {
      return this.draftDetails;
    }

    if (
      !this.draftValues ||
      !Array.isArray(this.draftValues) ||
      this.draftValues.length === 0
    ) {
      return [];
    }

    const colMap = {};
    if (this.gridColumns && Array.isArray(this.gridColumns)) {
      this.gridColumns.forEach((c) => {
        if (c.fieldName) {
          colMap[c.fieldName] = c.label || c.fieldName;
        }
      });
    }

    const dataMap = {};
    if (this.gridData && Array.isArray(this.gridData)) {
      this.gridData.forEach((row) => {
        if (row.Id) {
          dataMap[row.Id] = row;
        }
      });
    }

    const rows = [];
    let newRecordIndex = 1;

    this.draftValues.forEach((draft) => {
      const recordId = draft.Id;
      const isNewRecord = Boolean(recordId && recordId.startsWith("new-"));
      const originalRow = dataMap[recordId] || {};

      let recordName =
        originalRow.Name || originalRow.Title || originalRow.Subject;
      if (!recordName) {
        if (isNewRecord) {
          recordName = `New Record #${newRecordIndex++}`;
        } else {
          recordName = recordId || "Record";
        }
      }

      Object.keys(draft).forEach((field) => {
        if (field === "Id" || field.startsWith("_")) return;

        const fieldLabel = colMap[field] || field;
        const origVal =
          originalRow[field] !== undefined ? originalRow[field] : "";
        const draftVal = draft[field] !== undefined ? draft[field] : "";

        rows.push({
          id: `${recordId}_${field}`,
          recordId,
          recordName,
          fieldName: field,
          fieldLabel,
          originalValue: origVal,
          draftValue: draftVal,
          displayOriginal:
            origVal !== null && origVal !== undefined && origVal !== ""
              ? String(origVal)
              : "(empty)",
          displayDraft:
            draftVal !== null && draftVal !== undefined && draftVal !== ""
              ? String(draftVal)
              : "(empty)",
          isNewRecord
        });
      });
    });

    return rows;
  }

  @api
  get hasChanges() {
    return this.reviewRows.length > 0;
  }

  @api
  get totalChanges() {
    return this.reviewRows.length;
  }

  @api
  get totalRecords() {
    const distinct = new Set(this.reviewRows.map((r) => r.recordId));
    return distinct.size;
  }

  @api
  get summaryText() {
    const changes = this.totalChanges;
    const records = this.totalRecords;
    const changeWord = changes === 1 ? "change" : "changes";
    const recordWord = records === 1 ? "row" : "rows";
    return `${changes} ${changeWord} across ${records} ${recordWord}`;
  }

  get isActionDisabled() {
    return !this.hasChanges;
  }

  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  handleRevertField(event) {
    const { recordId, fieldName } = event.currentTarget.dataset;
    this.dispatchEvent(
      new CustomEvent("revertfield", {
        detail: {
          recordId,
          fieldName
        }
      })
    );
  }

  handleDiscardAll() {
    this.dispatchEvent(new CustomEvent("discardall"));
  }

  handleSave() {
    this.dispatchEvent(new CustomEvent("save"));
  }
}
