import { LightningElement, api, track } from "lwc";
import getGridConfig from "@salesforce/apex/SmartGridController.getGridConfig";
import getRecords from "@salesforce/apex/SmartGridController.getRecords";
import saveRecords from "@salesforce/apex/SmartGridController.saveRecords";
import getPicklistValues from "@salesforce/apex/SmartGridController.getPicklistValues";
import getObjectFields from "@salesforce/apex/SmartGridController.getObjectFields";
import deleteRecords from "@salesforce/apex/SmartGridController.deleteRecords";
import LightningConfirm from "lightning/confirm";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getPrefs from "@salesforce/apex/SmartGridUserPrefService.getPrefs";
import savePrefs from "@salesforce/apex/SmartGridUserPrefService.savePrefs";
import { exportToCSV } from "c/csvHelper";

export default class SmartDataGrid extends LightningElement {
  @api gridConfigName;
  @api objectApiName;
  @api gridTitle = "Smart Data Grid";

  @track gridColumns;
  @track gridData = [];
  @track draftValues = [];
  @track isLoading = true;
  @track errorMessage;
  @track failureQueue = [];
  @track isSetupRequired = false;
  @track isFilterPanelOpen = false;
  @track activeFilterPills = [];

  // Filter state
  @track filterComboboxes = [];
  @track dateFilter = {
    fieldApiName: "",
    label: "",
    startDate: null,
    endDate: null
  };
  @track hasDateFilter = false;

  @track sortField;
  @track sortDirection = "asc";

  config;
  _showFieldPicker = false;
  pickerSelectedFields = [];

  async connectedCallback() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));

    if (this.gridConfigName) {
      this.fetchConfig();
    } else if (this.objectApiName) {
      this.isLoading = false;
      // Check cache/server first before prompting
      const hasPrefs = await this.loadCachedColumns();
      if (hasPrefs) {
        this.fetchData();
      } else {
        this.isSetupRequired = true;
      }
    } else {
      this.isLoading = false;
    }
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.handleKeyDown.bind(this));
  }

  handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      this.handleShortcutSave();
    }
  }

  handleShortcutSave() {
    const datatable = this.template.querySelector("lightning-datatable");
    if (datatable && this.draftValues.length > 0) {
      this.handleSave({ detail: { draftValues: this.draftValues } });
    }
  }

  async fetchConfig() {
    try {
      this.isLoading = true;
      this.errorMessage = null;
      this.config = await getGridConfig({ configDevName: this.gridConfigName });

      if (this.config && this.config.isActive) {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.objectApiName = this.config.objectApiName;

        // First check user prefs
        const hasPrefs = await this.loadCachedColumns();

        if (!hasPrefs) {
          // Parse columns
          let columnsDef = [];
          if (this.config.columns && this.config.columns.length > 0) {
            columnsDef = this.config.columns.map((c) => this.formatColumn(c));
          }
          this.gridColumns = columnsDef;
        }

        // Load filter picklist if configured
        await this.initializeFilters();

        // Fetch data if columns exist
        if (this.gridColumns.length > 0) {
          await this.fetchData();
        }
      } else if (this.objectApiName) {
        // Config not found/not active but we have an object — offer field picker
        this.isSetupRequired = true;
      } else {
        this.errorMessage = "Configuration not active or not found.";
      }
    } catch (e) {
      // Config retrieval failed — check if we should show the field picker
      if (this.objectApiName) {
        this.isSetupRequired = true;
      } else {
        this.errorMessage = "Error loading config: " + this.reduceErrors(e);
      }
    } finally {
      this.isLoading = false;
    }
  }

  // ─── Filter Logic ───

  /**
   * Initialize filters dynamically based on object fields
   */
  async initializeFilters() {
    if (!this.objectApiName) return;

    try {
      const fields = await getObjectFields({
        objectApiName: this.objectApiName
      });

      // Find up to 3 picklist fields
      let targetPicklists = [];
      if (this.config && this.config.defaultFilterField) {
        let defaultField = fields.find(
          (f) => f.fieldApiName === this.config.defaultFilterField
        );
        if (defaultField && defaultField.type === "PICKLIST") {
          targetPicklists.push(defaultField);
        }
      }

      for (let f of fields) {
        if (
          f.type === "PICKLIST" &&
          !targetPicklists.find((t) => t.fieldApiName === f.fieldApiName)
        ) {
          targetPicklists.push(f);
          if (targetPicklists.length >= 3) break;
        }
      }

      // Find 1 Date field
      const dateFields = fields.filter(
        (f) => f.type === "DATE" || f.type === "DATETIME"
      );

      // Populate picklist options
      let comboboxes = [];
      for (let p of targetPicklists) {
        // eslint-disable-next-line no-await-in-loop
        const values = await getPicklistValues({
          objectApiName: this.objectApiName,
          fieldApiName: p.fieldApiName
        });

        comboboxes.push({
          fieldApiName: p.fieldApiName,
          label: p.label,
          options: [
            { label: "-- All --", value: "" },
            ...values.map((v) => ({ label: v.label, value: v.value }))
          ],
          selectedValue: ""
        });
      }
      this.filterComboboxes = comboboxes;

      if (dateFields.length > 0) {
        this.dateFilter = {
          fieldApiName: dateFields[0].fieldApiName,
          label: dateFields[0].label,
          startDate: null,
          endDate: null
        };
        this.hasDateFilter = true;
      }
    } catch (e) {
      console.warn("Failed to load filter options:", this.reduceErrors(e));
    }
  }

  handleMultiFilterChange(event) {
    const fieldName = event.target.name;
    const value = event.detail.value;
    const index = this.filterComboboxes.findIndex(
      (fc) => fc.fieldApiName === fieldName
    );
    if (index !== -1) {
      this.filterComboboxes[index].selectedValue = value;
    }
  }

  handleDateChange(event) {
    const fieldName = event.target.name; // 'startDate' or 'endDate'
    this.dateFilter[fieldName] = event.detail.value;
  }

  async applyFilters() {
    this.isFilterPanelOpen = false;
    this.updateActivePills();
    await this.fetchData();
  }

  async handleSort(event) {
    const { fieldName, sortDirection } = event.detail;

    let actualFieldName = fieldName;
    if (actualFieldName.endsWith("_Url")) {
      actualFieldName = actualFieldName.replace("_Url", "");
    }

    this.sortField = actualFieldName;
    this.sortDirection = sortDirection;

    await this.fetchData();
  }

  async fetchData() {
    if (
      !this.objectApiName ||
      !this.gridColumns ||
      this.gridColumns.length === 0
    )
      return;

    try {
      this.isLoading = true;
      this.errorMessage = null;

      let fieldsToQuery = this.gridColumns.map((c) => c.fieldName);

      // Build filter map
      let filterMap = {};
      if (this.filterComboboxes) {
        this.filterComboboxes.forEach((fc) => {
          if (fc.selectedValue) {
            filterMap[fc.fieldApiName] = fc.selectedValue;
          }
        });
      }

      let response = await getRecords({
        objectApiName: this.objectApiName,
        fields: fieldsToQuery,
        filters: filterMap,
        dateField: this.hasDateFilter ? this.dateFilter.fieldApiName : null,
        startDate:
          this.hasDateFilter && this.dateFilter.startDate
            ? this.dateFilter.startDate
            : null,
        endDate:
          this.hasDateFilter && this.dateFilter.endDate
            ? this.dateFilter.endDate
            : null,
        sortField: this.sortField || this.config?.defaultSortField,
        sortDirection: this.sortDirection,
        recordLimit: this.config?.recordLimit || 200
      });

      // Auto-generate URL properties for lightning-datatable 'url' columns
      this.gridData = response.map((row) => {
        let mappedRow = { ...row };
        Object.keys(mappedRow).forEach((key) => {
          if (key === "Id" || key.endsWith("Id")) {
            mappedRow[key + "_Url"] = `/${mappedRow[key]}`;
          }
        });
        return mappedRow;
      });
    } catch (e) {
      this.errorMessage = "Error loading records: " + this.reduceErrors(e);
    } finally {
      this.isLoading = false;
    }
  }

  handleAddRow() {
    const newRowId = "new-" + Date.now();
    const newRow = { Id: newRowId };
    this.gridData = [newRow, ...this.gridData];
    this.draftValues = [...this.draftValues, newRow];
  }

  async handleDelete() {
    const datatable = this.template.querySelector("lightning-datatable");
    const selectedRows = datatable.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "No Rows Selected",
          message: "Please select rows to delete.",
          variant: "info"
        })
      );
      return;
    }

    const result = await LightningConfirm.open({
      message: `Are you sure you want to delete ${selectedRows.length} record(s)?`,
      theme: "warning",
      label: "Confirm Deletion"
    });

    if (result) {
      try {
        this.isLoading = true;
        const recordsToDelete = selectedRows.map((r) => ({
          Id: r.Id,
          sobjectType: this.objectApiName
        }));
        const deleteResult = await deleteRecords({ records: recordsToDelete });
        if (deleteResult && deleteResult.isSuccess) {
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: "Records deleted successfully!",
              variant: "success"
            })
          );
          await this.fetchData();
        } else {
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Error Deleting Records",
              message:
                deleteResult.tableErrors?.join(", ") ||
                "Failed to delete records",
              variant: "error"
            })
          );
        }
      } catch (e) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error Deleting",
            message: this.reduceErrors(e),
            variant: "error"
          })
        );
      } finally {
        this.isLoading = false;
      }
    }
  }

  async handleSave(event) {
    let drafts = event.detail.draftValues;

    let recordsToSave = drafts.map((d) => {
      let copy = { ...d };
      if (copy.Id && copy.Id.startsWith("new-")) {
        delete copy.Id;
      }
      copy.sobjectType = this.objectApiName;
      return copy;
    });

    try {
      this.isLoading = true;
      this.errorMessage = null;
      // Clear previous table errors
      this.template.querySelector("lightning-datatable").errors = {};

      let result = await saveRecords({ records: recordsToSave });

      if (result && result.isSuccess) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Records saved successfully!",
            variant: "success"
          })
        );
        this.draftValues = [];
        await this.fetchData();
      } else {
        let rowErrorMap = {};
        let failedNewDrafts = [];
        if (result.rowErrors && result.rowErrors.length > 0) {
          result.rowErrors.forEach((re) => {
            if (!isNaN(re.id)) {
              let originalIndex = parseInt(re.id, 10);
              let draftRow = drafts[originalIndex];
              if (draftRow) {
                failedNewDrafts.push(draftRow);
                rowErrorMap[draftRow.Id] = {
                  title: re.title,
                  messages: re.messages,
                  fieldNames: re.fieldNames
                };
              }
            } else {
              rowErrorMap[re.id] = {
                title: re.title,
                messages: re.messages,
                fieldNames: re.fieldNames
              };
            }
          });
        }

        this.template.querySelector("lightning-datatable").errors = {
          rows: rowErrorMap,
          table: {
            title: "Error Saving Records",
            messages: result.tableErrors || ["Some records failed to save."]
          }
        };

        this.dispatchEvent(
          new ShowToastEvent({
            title: "Partial Success",
            message:
              "Some records failed to save. Please review the errors in the table.",
            variant: "warning"
          })
        );
        // Keep failed records in drafts
        if (result.rowErrors) {
          let failedIds = Object.keys(rowErrorMap);
          this.draftValues = drafts.filter((draft) =>
            failedIds.includes(draft.Id)
          );
        }

        if (failedNewDrafts.length > 0) {
          this.failureQueue = failedNewDrafts;
          // Open the resolution modal
          const modal = this.template.querySelector(
            "c-smart-grid-resolution-modal"
          );
          if (modal) {
            modal.open(this.failureQueue);
          }
        }

        // Refresh data to show successful updates
        await this.fetchData();
      }
    } catch (e) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error Saving",
          message: this.reduceErrors(e),
          variant: "error"
        })
      );
    } finally {
      this.isLoading = false;
    }
  }

  handleRecordSolved(event) {
    const solvedDraftId = event.detail.draftId;
    this.draftValues = this.draftValues.filter((d) => d.Id !== solvedDraftId);
  }

  handleResolutionClose() {
    this.failureQueue = [];
  }

  handleResolutionComplete() {
    this.failureQueue = [];
    this.fetchData();
  }

  // ─── Field Picker Integration ───

  get prefKey() {
    return this.gridConfigName ? this.gridConfigName : this.objectApiName;
  }

  async loadCachedColumns() {
    if (!this.prefKey) return false;
    try {
      const prefsJson = await getPrefs({ objectApiName: this.prefKey });
      if (prefsJson) {
        const parsed = JSON.parse(prefsJson);
        this.gridColumns = parsed.columns;
        this.pickerSelectedFields = parsed.fields;
        return true;
      }
    } catch (e) {
      console.warn(
        "Failed to load user prefs from server, falling back to local storage:",
        e
      );
    }

    try {
      const cacheKey = `smartGridCols_${this.prefKey}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.gridColumns = parsed.columns;
        this.pickerSelectedFields = parsed.fields;
        return true;
      }
    } catch (e) {
      console.warn("Failed to load cached columns:", e);
    }
    return false;
  }

  openFieldPicker() {
    this._showFieldPicker = true;
    Promise.resolve().then(() => {
      const picker = this.template.querySelector("c-smart-grid-field-picker");
      if (picker) {
        picker.open();
      }
    });
  }

  async handleFieldSelection(event) {
    const { fields, columns } = event.detail;
    this._showFieldPicker = false;
    this.isSetupRequired = false;

    this.gridColumns = columns.map((col) => this.formatColumn(col));

    this.pickerSelectedFields = fields;

    this.saveCurrentPrefs();

    if (this.gridColumns.length > 0) {
      await this.fetchData();
    }
  }

  handlePickerClosed() {
    this._showFieldPicker = false;
  }

  handleResize(event) {
    const columnWidths = event.detail.columnWidths;
    if (this.gridColumns && columnWidths) {
      this.gridColumns = this.gridColumns.map((col, idx) => {
        return { ...col, initialWidth: columnWidths[idx] };
      });
      this.saveCurrentPrefs();
    }
  }

  saveCurrentPrefs() {
    if (!this.prefKey) return;
    const prefsObj = {
      columns: this.gridColumns,
      fields: this.pickerSelectedFields
    };
    const prefsStr = JSON.stringify(prefsObj);

    try {
      localStorage.setItem(`smartGridCols_${this.prefKey}`, prefsStr);
    } catch (e) {
      console.warn("Failed to save to local storage:", e);
    }

    savePrefs({ objectApiName: this.prefKey, prefsJson: prefsStr }).catch((e) =>
      console.warn("Failed to save prefs to server:", e)
    );
  }

  handleExportCSV() {
    try {
      // Create deep copy to remove LWC proxy before export
      const dataCopy = JSON.parse(JSON.stringify(this.gridData));
      const colsCopy = JSON.parse(JSON.stringify(this.gridColumns));

      exportToCSV(
        dataCopy,
        colsCopy,
        `${this.objectApiName || "export"}_${new Date().toISOString().slice(0, 10)}.csv`
      );
    } catch (e) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Export Error",
          message: this.reduceErrors(e),
          variant: "error"
        })
      );
    }
  }

  // ─── Computed Properties ───

  get isDynamicGrid() {
    return !this.gridConfigName && this.objectApiName;
  }

  get showNoConfigMessage() {
    return (
      !this.gridColumns &&
      !this.isLoading &&
      !this._showFieldPicker &&
      !this.isSetupRequired
    );
  }

  get hasFilters() {
    return (
      (this.filterComboboxes && this.filterComboboxes.length > 0) ||
      this.hasDateFilter
    );
  }

  get showFilterPanel() {
    return this.hasFilters && this.isFilterPanelOpen;
  }

  get hasActiveFilters() {
    return this.activeFilterPills && this.activeFilterPills.length > 0;
  }

  toggleFilterPanel() {
    this.isFilterPanelOpen = !this.isFilterPanelOpen;
  }

  updateActivePills() {
    let pills = [];
    this.filterComboboxes.forEach((fc) => {
      if (fc.selectedValue && fc.selectedValue !== "") {
        let opt = fc.options.find((o) => o.value === fc.selectedValue);
        let optLabel = opt ? opt.label : fc.selectedValue;
        pills.push({
          label: `${fc.label}: ${optLabel}`,
          name: fc.fieldApiName
        });
      }
    });
    if (this.hasDateFilter) {
      if (this.dateFilter.startDate) {
        pills.push({
          label: `Start Date: ${this.dateFilter.startDate}`,
          name: "startDate"
        });
      }
      if (this.dateFilter.endDate) {
        pills.push({
          label: `End Date: ${this.dateFilter.endDate}`,
          name: "endDate"
        });
      }
    }
    this.activeFilterPills = pills;
  }

  handleRemoveFilterPill(event) {
    const name = event.target.name;
    if (name === "startDate") {
      this.dateFilter.startDate = null;
    } else if (name === "endDate") {
      this.dateFilter.endDate = null;
    } else {
      let fc = this.filterComboboxes.find((f) => f.fieldApiName === name);
      if (fc) fc.selectedValue = "";
    }
    this.updateActivePills();
    this.fetchData();
  }

  // ─── Utilities ───

  formatColumn(col) {
    let fieldApi = col.fieldApiName || col.field;
    let label = col.displayLabel || col.label || fieldApi;
    let isEditable = col.isEditable !== false && col.editable !== false;
    let isSortable = col.isSortable === true || col.sortable === true;
    let colWidth = col.columnWidth || col.width;

    const isReference = fieldApi === "Id" || fieldApi.endsWith("Id");
    if (isReference) {
      return {
        label: label,
        fieldName: fieldApi + "_Url",
        type: "url",
        typeAttributes: {
          label: { fieldName: fieldApi },
          target: "_blank"
        },
        editable: false,
        sortable: isSortable,
        initialWidth: colWidth
      };
    }
    return {
      label: label,
      fieldName: fieldApi,
      type: "text",
      editable: isEditable,
      sortable: isSortable,
      initialWidth: colWidth
    };
  }

  reduceErrors(e) {
    if (e && e.body && e.body.message) {
      return e.body.message;
    }
    return e ? String(e) : "Unknown error";
  }
}
