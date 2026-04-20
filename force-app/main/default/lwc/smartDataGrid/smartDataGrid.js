import { LightningElement, api, track } from "lwc";
import getGridConfig from "@salesforce/apex/SmartGridController.getGridConfig";
import getRecordsPaged from "@salesforce/apex/SmartGridController.getRecordsPaged";
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
  @track filterFields = [];

  @track sortField;
  @track sortDirection = "asc";

  // Pagination state
  @track currentPage = 1;
  @track totalRecords = 0;
  @track pageSize = 50;

  config;
  _showFieldPicker = false;
  pickerSelectedFields = [];
  _fieldMetadataMap = {}; // Maps fieldApiName → Salesforce schema type (e.g. 'BOOLEAN', 'PICKLIST')

  async connectedCallback() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));

    if (this.gridConfigName) {
      this.fetchConfig();
    } else if (this.objectApiName) {
      this.isLoading = false;
      // Check cache/server first before prompting
      const hasPrefs = await this.loadCachedColumns();
      if (hasPrefs) {
        await this.initializeFilters();
        this.refreshColumns();
        await this.fetchData();
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

        // Fetch data and initialize filters if columns exist
        if (this.gridColumns.length > 0) {
          await this.initializeFilters();
          this.refreshColumns(); // Re-format with picklist options
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
    if (
      !this.objectApiName ||
      !this.gridColumns ||
      this.gridColumns.length === 0
    )
      return;

    try {
      const fields = await getObjectFields({
        objectApiName: this.objectApiName
      });

      // Build a metadata map so formatColumn can always look up the real SF type
      const metaMap = {};
      fields.forEach((f) => {
        metaMap[f.fieldApiName] = f.type;
      });
      this._fieldMetadataMap = metaMap;

      let filters = [];
      for (let col of this.gridColumns) {
        // Skip URL-helper fields for filtering
        if (col.fieldName.endsWith("_Url")) continue;

        const fieldDescribe = fields.find(
          (f) => f.fieldApiName === col.fieldName
        );
        if (!fieldDescribe) continue;

        let filter = {
          fieldName: col.fieldName,
          label: col.label,
          selectedValue: "",
          type: fieldDescribe.type
        };

        if (
          fieldDescribe.type === "PICKLIST" ||
          fieldDescribe.type === "MULTIPICKLIST"
        ) {
          filter.isPicklist = true;
          // eslint-disable-next-line no-await-in-loop
          const values = await getPicklistValues({
            objectApiName: this.objectApiName,
            fieldApiName: col.fieldName
          });
          filter.options = [
            { label: "-- All --", value: "" },
            ...values.map((v) => ({ label: v.label, value: v.value }))
          ];
        } else if (
          fieldDescribe.type === "DATE" ||
          fieldDescribe.type === "DATETIME"
        ) {
          filter.isDate = true;
        } else {
          filter.isText = true;
        }
        filters.push(filter);
      }
      this.filterFields = filters;
    } catch (e) {
      console.warn("Failed to load filter options:", this.reduceErrors(e));
    }
  }

  handleFilterChange(event) {
    const fieldName = event.target.name;
    const value = event.detail.value;
    const filter = this.filterFields.find((f) => f.fieldName === fieldName);
    if (filter) {
      filter.selectedValue = value;
    }
  }

  async applyFilters() {
    this.isFilterPanelOpen = false;
    this.updateActivePills();
    await this.fetchData();
  }

  async handleClearAllFilters() {
    this.filterFields = this.filterFields.map((f) => ({
      ...f,
      selectedValue: ""
    }));
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
      if (this.filterFields) {
        this.filterFields.forEach((f) => {
          if (f.selectedValue && !f.isDate) {
            filterMap[f.fieldName] = f.selectedValue;
          }
        });
      }

      // Find first date filter for the paged results call (it currently only supports one date range)
      const dateFilter = this.filterFields.find(
        (f) => f.isDate && f.selectedValue
      );

      let response = await getRecordsPaged({
        objectApiName: this.objectApiName,
        fields: fieldsToQuery,
        filters: filterMap,
        dateField: dateFilter ? dateFilter.fieldName : null,
        startDate: dateFilter ? dateFilter.selectedValue : null,
        endDate: null, // Note: Simplified date logic to work with the universal array
        sortField: this.sortField || this.config?.defaultSortField,
        sortDirection: this.sortDirection,
        pageSize: this.pageSize,
        pageNumber: this.currentPage
      });

      // Auto-generate URL properties for lightning-datatable 'url' columns
      this.gridData = response.records.map((row) => {
        let mappedRow = { ...row };
        Object.keys(mappedRow).forEach((key) => {
          if (key === "Id" || key.endsWith("Id")) {
            mappedRow[key + "_Url"] = `/${mappedRow[key]}`;
          }
        });
        return mappedRow;
      });
      this.totalRecords = response.totalSize;
    } catch (e) {
      this.errorMessage = "Error loading records: " + this.reduceErrors(e);
    } finally {
      this.isLoading = false;
    }
  }

  // ─── Pagination Logic ───

  get totalPages() {
    return Math.ceil(this.totalRecords / this.pageSize) || 1;
  }

  get disablePrevious() {
    return this.currentPage <= 1 || this.isLoading;
  }

  get disableNext() {
    return this.currentPage >= this.totalPages || this.isLoading;
  }

  handlePreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchData();
    }
  }

  handleNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchData();
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
      const dt =
        this.template.querySelector("c-smart-grid-datatable") ||
        this.template.querySelector("lightning-datatable");
      if (dt) dt.errors = {};

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

        if (dt) {
          dt.errors = {
            rows: rowErrorMap,
            table: {
              title: "Error Saving Records",
              messages: result.tableErrors || ["Some records failed to save."]
            }
          };
        }

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

  handlePicklistChange(event) {
    const { context, value, fieldName } = event.detail.data;
    if (!fieldName) return;

    let drafts = [...this.draftValues];
    let draft = drafts.find((d) => d.Id === context);
    if (!draft) {
      draft = { Id: context };
      drafts.push(draft);
    }
    draft[fieldName] = value;
    this.draftValues = drafts;
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

    try {
      this.isLoading = true;
      // Fetch fresh metadata to ensure we have types for all selected fields
      const fieldMetadata = await getObjectFields({
        objectApiName: this.objectApiName
      });

      this.pickerSelectedFields = fields;
      await this.initializeFilters();

      // Now that filters (and picklist options) are loaded, format the columns
      this.gridColumns = columns.map((col) => {
        const meta = fieldMetadata.find(
          (f) => f.fieldApiName === (col.fieldApiName || col.fieldName)
        );
        return this.formatColumn({
          ...col,
          type: meta ? meta.type : col.type
        });
      });

      this.saveCurrentPrefs();
      await this.fetchData();
    } catch (e) {
      console.error("Error in field selection:", e);
    } finally {
      this.isLoading = false;
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
    return this.filterFields && this.filterFields.length > 0;
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
    this.filterFields.forEach((f) => {
      if (f.selectedValue && f.selectedValue !== "") {
        let displayVal = f.selectedValue;
        if (f.isPicklist) {
          let opt = f.options.find((o) => o.value === f.selectedValue);
          displayVal = opt ? opt.label : f.selectedValue;
        }
        pills.push({
          label: `${f.label}: ${displayVal}`,
          name: f.fieldName
        });
      }
    });
    this.activeFilterPills = pills;
  }

  handleRemoveFilterPill(event) {
    const name = event.target.name;
    let filter = this.filterFields.find((f) => f.fieldName === name);
    if (filter) {
      filter.selectedValue = "";
    }
    this.updateActivePills();
    this.fetchData();
  }

  // ─── Utilities ───

  refreshColumns() {
    if (!this.gridColumns) return;
    // Re-run formatColumn on all existing columns to pick up picklist options
    this.gridColumns = this.gridColumns.map((col) => {
      // We need the original raw column data or at least the type
      return this.formatColumn(col);
    });
  }

  /**
   * Maps Salesforce Schema field types to lightning-datatable column types.
   */
  mapFieldType(sfType) {
    const typeMap = {
      CURRENCY: { type: "currency", typeAttributes: { currencyCode: "USD" } },
      DOUBLE: { type: "number", typeAttributes: { minimumFractionDigits: 0 } },
      INTEGER: { type: "number" },
      LONG: { type: "number" },
      PERCENT: {
        type: "percent",
        typeAttributes: { minimumFractionDigits: 1 }
      },
      BOOLEAN: { type: "boolean" },
      DATE: { type: "date-local" },
      DATETIME: {
        type: "date",
        typeAttributes: {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }
      },
      EMAIL: { type: "email" },
      PHONE: { type: "phone" },
      URL: { type: "url", typeAttributes: { target: "_blank" } },
      TEXTAREA: { type: "text" },
      STRING: { type: "text" },
      PICKLIST: {
        type: "picklist",
        typeAttributes: { options: [], context: { fieldName: "Id" } }
      },
      MULTIPICKLIST: { type: "text" },
      ID: { type: "text" },
      REFERENCE: { type: "text" }
    };
    return typeMap[sfType?.toUpperCase()] || { type: "text" };
  }

  formatColumn(col) {
    const fieldApi = col.fieldApiName || col.field || col.fieldName;
    const label = col.displayLabel || col.label || fieldApi;
    const isEditable =
      col.isUpdateable !== false &&
      col.isEditable !== false &&
      col.editable !== false;
    const isSortable = col.isSortable === true || col.sortable === true;
    const colWidth = col.columnWidth || col.width;
    // Always resolve to the real Salesforce type from metadata
    const sfType = (
      this._fieldMetadataMap[fieldApi] ||
      col.type ||
      ""
    ).toUpperCase();

    const isReference =
      sfType === "REFERENCE" || sfType === "ID" || fieldApi === "Id";
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

    // sfType was already resolved from _fieldMetadataMap above
    const mapped = this.mapFieldType(sfType);

    // Inject picklist options if applicable
    if (mapped.type === "picklist") {
      const filter = this.filterFields?.find((f) => f.fieldName === fieldApi);
      if (filter && filter.options) {
        mapped.typeAttributes.options = filter.options;
      }
      mapped.typeAttributes.context = { fieldName: "Id" };
      mapped.typeAttributes.fieldName = fieldApi;
    }

    return {
      label: label,
      fieldName: fieldApi,
      type: mapped.type,
      typeAttributes: mapped.typeAttributes || undefined,
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
