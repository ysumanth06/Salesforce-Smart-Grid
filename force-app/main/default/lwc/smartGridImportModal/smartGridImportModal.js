import { LightningElement, api, track } from "lwc";
import executeImport from "@salesforce/apex/SmartGridImportService.executeImport";
import executeRollback from "@salesforce/apex/SmartGridImportService.executeRollback";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class SmartGridImportModal extends LightningElement {
  @api objectApiName = "Account";
  @api availableFields = [];

  @track currentStep = "UPLOAD"; // 'UPLOAD' | 'MAPPING' | 'RESULT'
  @track csvHeaders = [];
  @track csvRows = [];
  @track headerToFieldMap = {};
  @track importResult = null;
  @track isLoading = false;

  get isUploadStep() {
    return this.currentStep === "UPLOAD";
  }

  get isMappingStep() {
    return this.currentStep === "MAPPING";
  }

  get isResultStep() {
    return this.currentStep === "RESULT";
  }

  get fieldOptions() {
    return (this.availableFields || []).map((f) => ({
      label: f.label || f.fieldName,
      value: f.fieldName
    }));
  }

  get columnMappings() {
    return this.csvHeaders.map((header) => {
      const sample =
        this.csvRows.length > 0 ? this.csvRows[0][header] || "" : "";
      const mappedField = this.headerToFieldMap[header] || "";
      return {
        csvHeader: header,
        sampleValue: sample,
        selectedField: mappedField
      };
    });
  }

  get previewRows() {
    return this.csvRows.slice(0, 5).map((row, idx) => ({
      id: `row_${idx}`,
      cells: this.csvHeaders.map((h) => ({
        key: `${idx}_${h}`,
        val: row[h] || ""
      }))
    }));
  }

  handleTriggerFileInput() {
    const fileInput = this.template.querySelector(
      '[data-testid="file-upload-input"]'
    );
    if (fileInput) {
      fileInput.click();
    }
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.isLoading = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      this.processCsvText(text);
      this.isLoading = false;
    };
    reader.onerror = () => {
      this.isLoading = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "File Read Error",
          message: "Unable to parse CSV file.",
          variant: "error"
        })
      );
    };
    reader.readAsText(file);
  }

  @api
  processCsvText(text) {
    if (!text || typeof text !== "string") return;
    const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return;

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^["']|["']$/g, ""));
    this.csvHeaders = headers;

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i]
        .split(",")
        .map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const rowObj = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = cells[colIdx] || "";
      });
      rows.push(rowObj);
    }
    this.csvRows = rows;

    // Automatic Smart Mapping
    const autoMap = {};
    const fields = this.availableFields || [];
    headers.forEach((h) => {
      const hLower = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = fields.find((f) => {
        const fLower = (f.fieldName || "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const lLower = (f.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return fLower === hLower || lLower === hLower;
      });
      if (match) {
        autoMap[h] = match.fieldName;
      }
    });

    this.headerToFieldMap = autoMap;
    this.currentStep = "MAPPING";
  }

  handleMappingChange(event) {
    const header = event.target.dataset.header;
    const field = event.target.value;
    this.headerToFieldMap = {
      ...this.headerToFieldMap,
      [header]: field
    };
  }

  async handleExecuteImport() {
    this.isLoading = true;

    // Map rows according to headerToFieldMap
    const recordsToInsert = this.csvRows.map((row) => {
      const sObj = {};
      Object.keys(this.headerToFieldMap).forEach((header) => {
        const targetField = this.headerToFieldMap[header];
        if (targetField && row[header] !== undefined) {
          sObj[targetField] = row[header];
        }
      });
      return sObj;
    });

    try {
      const result = await executeImport({
        objectApiName: this.objectApiName,
        rawRecords: recordsToInsert
      });

      this.importResult = result;
      this.currentStep = "RESULT";
      this.dispatchEvent(new CustomEvent("importsuccess", { detail: result }));
    } catch (err) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Import Failed",
          message: err.body ? err.body.message : err.message,
          variant: "error"
        })
      );
    } finally {
      this.isLoading = false;
    }
  }

  async handleRollback() {
    if (!this.importResult || !this.importResult.rollbackToken) return;

    this.isLoading = true;
    try {
      const rollbackRes = await executeRollback({
        rollbackToken: this.importResult.rollbackToken,
        recordIds: this.importResult.createdRecordIds
      });

      if (rollbackRes.isSuccess) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Rollback Successful",
            message: `Successfully removed ${rollbackRes.totalDeleted} imported records.`,
            variant: "success"
          })
        );
        this.handleClose();
      }
    } catch (err) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Rollback Failed",
          message: err.body ? err.body.message : err.message,
          variant: "error"
        })
      );
    } finally {
      this.isLoading = false;
    }
  }

  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }
}
