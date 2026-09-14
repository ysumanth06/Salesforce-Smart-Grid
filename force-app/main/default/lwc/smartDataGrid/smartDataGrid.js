import { LightningElement, api, track, wire } from "lwc";
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
import getFormatRules from "@salesforce/apex/SmartGridController.getFormatRules";
import getAggregates from "@salesforce/apex/SmartGridController.getAggregates";
import logQueryHistory from "@salesforce/apex/SmartGridController.logQueryHistory";
import { exportToCSV } from "c/csvHelper";
import { exportToExcel } from "c/spreadsheetExporter";
import { reduceErrors } from "c/errorUtils";
import { applyFormatRules } from "c/formatRuleEngine";
import { DirtyStateManager } from "c/dirtyStateManager";
import { computeFormulaColumns } from "c/formulaEvaluator";
import { GridPageCache } from "c/gridPageCache";
import {
  calculateColumnWidth,
  calculateAllColumnWidths
} from "c/columnWidthCalculator";
import {
  generateColumnActions,
  filterRecordsByHeaderActions,
  reorderColumnsWithPin
} from "c/columnHeaderMenuManager";
import {
  publish,
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";
import SMART_GRID_CHANNEL from "@salesforce/messageChannel/SmartGridChannel__c";

export default class SmartDataGrid extends LightningElement {
  @api gridConfigName;
  @api objectApiName;
  @api gridTitle = "Smart Data Grid";
  @api depth = 0;
  @api parentRecordId;
  @api parentRelationshipField;

  @track gridColumns;
  @track gridData = [];
  @track draftValues = [];
  @track isLoading = true;
  @track errorMessage;
  @track failureQueue = [];
  @track isSetupRequired = false;
  @track isFilterPanelOpen = false;
  @track activeFilterPills = [];
  @track formatRules = [];
  @track totalsData = [];
  @track selectedRowsList = [];
  @track canUndoState = false;
  @track canRedoState = false;

  // Sprint 4 features state
  @track showAdvancedFilterModal = false;
  @track showReviewModal = false;
  @track activeFilterExpression;
  @track activeFilterJson;
  @track selectedRecordForReadingPane;
  @track selectedRecordTitle;
  @track showReadingPane = false;
  @track showRelatedGrid = false;

  // Phase 3 AI Command Palette & Filters
  @track showCommandPalette = false;
  @track aiFilterPills = [];

  get visibleFieldNames() {
    return (this.gridColumns || []).map((c) => c.fieldName);
  }
  @track selectedRowId;

  // Task Story 13: In-place column header filters & pinning state
  @track activeHeaderFilters = {};
  @track pinnedColumnField = null;
  _unfilteredGridData = [];

  dirtyStateManager = new DirtyStateManager(50);
  pageCache = new GridPageCache(10, 300000);

  // Filter state
  @track filterFields = [];

  @track sortField;
  @track sortDirection = "asc";

  // Pagination state
  @track currentPage = 1;
  @track totalRecords = 0;
  @track pageSize = 50;

  @wire(MessageContext)
  messageContext;

  config;
  _showFieldPicker = false;
  pickerSelectedFields = [];
  _fieldMetadataMap = {}; // Maps fieldApiName → Salesforce schema type
  _picklistOptionsMap = {}; // Maps fieldApiName → List of {label, value} options
  _boundKeyDown; // Stored reference for proper event listener cleanup
  _subscription = null;

  async connectedCallback() {
    this._boundKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener("keydown", this._boundKeyDown);
    this.subscribeToMessageChannel();

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
    window.removeEventListener("keydown", this._boundKeyDown);
    this.unsubscribeFromMessageChannel();
  }

  handleKeyDown(event) {
    const isCmdOrCtrl = event.ctrlKey || event.metaKey;
    if (!isCmdOrCtrl) return;

    const key = event.key.toLowerCase();
    if (key === "s") {
      event.preventDefault();
      this.handleShortcutSave();
    } else if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      this.handleUndo();
    } else if (key === "y" || (key === "z" && event.shiftKey)) {
      event.preventDefault();
      this.handleRedo();
    } else if (key === "d") {
      event.preventDefault();
      this.handleFillDown();
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

        // L-7: Set grid title fallback from config name if not explicitly set
        if (this.gridTitle === "Smart Data Grid" && this.config.developerName) {
          // eslint-disable-next-line @lwc/lwc/no-api-reassignments
          this.gridTitle = this.config.developerName.replace(/_/g, " ");
        }

        // First check user prefs
        const hasPrefs = await this.loadCachedColumns();

        // AC-01-5: Cache format rules on first load
        try {
          this.formatRules = await getFormatRules({
            configDevName: this.gridConfigName,
            objectApiName: this.objectApiName
          });
        } catch (ruleErr) {
          console.warn("Failed to load format rules:", ruleErr);
        }

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
          const options = [
            { label: "-- All --", value: "" },
            ...values.map((v) => ({ label: v.label, value: v.value }))
          ];
          filter.options = options;
          // Store in our direct map for the grid cells (excluding the -- All -- option)
          this._picklistOptionsMap[col.fieldName.toLowerCase()] = values.map(
            (v) => ({ label: v.label, value: v.value })
          );
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
    this.publishLmsEvent("filtered", []);
    this.pageCache.clear();
    await this.fetchData();
  }

  async handleClearAllFilters() {
    if (this.filterFields) {
      this.filterFields = this.filterFields.map((f) => ({
        ...f,
        selectedValue: ""
      }));
    }
    this.activeHeaderFilters = {};
    this.activeFilterExpression = null;
    this.activeFilterJson = null;
    this.aiFilterPills = [];
    this.isFilterPanelOpen = false;
    this.applyHeaderFilters();
    this.refreshHeaderActions();
    this.updateActivePills();
    this.currentPage = 1;
    this.pageCache.clear();
    await this.fetchData();
    this.fetchTotals();
  }

  async handleSort(event) {
    const { fieldName, sortDirection } = event.detail;

    let actualFieldName = fieldName;
    if (actualFieldName.endsWith("_Url")) {
      actualFieldName = actualFieldName.replace("_Url", "");
    }

    // Store both: actual field for Apex query, display field for datatable indicator
    this._sortDisplayField = fieldName;
    this.sortField = actualFieldName;
    this.sortDirection = sortDirection;
    this.pageCache.clear();

    await this.fetchData();
  }

  async handleRefresh() {
    this.pageCache.clear();
    await this.fetchData(true);
  }

  async fetchData(bypassCache = false) {
    if (
      !this.objectApiName ||
      !this.gridColumns ||
      this.gridColumns.length === 0
    )
      return;

    try {
      this.isLoading = true;
      this.errorMessage = null;

      let response;
      if (!bypassCache && this.pageCache.has(this.currentPage)) {
        response = this.pageCache.get(this.currentPage);
      } else {
        let fieldsToQuery = this.gridColumns.map((c) => c.fieldName);

        // Build filter map
        let filterMap = {};
        if (this.parentRelationshipField && this.parentRecordId) {
          filterMap[this.parentRelationshipField] = this.parentRecordId;
        }
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

        response = await getRecordsPaged({
          objectApiName: this.objectApiName,
          fields: fieldsToQuery,
          filters: filterMap,
          dateField: dateFilter ? dateFilter.fieldName : null,
          startDate: dateFilter ? dateFilter.selectedValue : null,
          endDate: null, // Note: Simplified date logic to work with the universal array
          sortField: this.sortField || this.config?.defaultSortField,
          sortDirection: this.sortDirection,
          pageSize: this.pageSize,
          pageNumber: this.currentPage,
          filterJson: this.activeFilterJson || null
        });

        this.pageCache.set(this.currentPage, response);
      }

      // Auto-generate URL properties for lightning-datatable 'url' columns
      let rawMapped = (response.records || []).map((row) => {
        let mappedRow = { ...row };
        Object.keys(mappedRow).forEach((key) => {
          if (key === "Id" || key.endsWith("Id")) {
            mappedRow[key + "_Url"] = `/${mappedRow[key]}`;
          }
        });
        return mappedRow;
      });

      // Apply conditional formatting rules (TS-01)
      let formattedRecords = applyFormatRules(
        rawMapped,
        this.formatRules,
        this.gridColumns
      );

      // Compute formula columns (TS-11)
      this._unfilteredGridData = computeFormulaColumns(
        formattedRecords,
        this.gridColumns,
        this.draftValues
      );
      this.applyHeaderFilters();
      this.refreshHeaderActions();
      this.totalRecords = response.totalSize;

      // Recalculate column totals across full filtered dataset (TS-02)
      await this.fetchTotals();
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

  // L-4: Computed property for datatable sorted-by that uses the display field name
  get sortedByDisplay() {
    return this._sortDisplayField || this.sortField;
  }

  // L-6: Page size options for the selector
  get pageSizeOptions() {
    return [
      { label: "25", value: "25" },
      { label: "50", value: "50" },
      { label: "100", value: "100" },
      { label: "200", value: "200" }
    ];
  }

  get pageSizeString() {
    return String(this.pageSize);
  }

  handlePageSizeChange(event) {
    this.pageSize = parseInt(event.detail.value, 10);
    this.currentPage = 1;
    this.fetchData();
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
    const newRowId =
      "new-" +
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + "-" + Math.random().toString(36).slice(2));
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
          const deletedIds = recordsToDelete.map((r) => r.Id);
          this.publishLmsEvent("deleted", deletedIds);
          this.pageCache.clear();
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
      const dt = this.template.querySelector("lightning-datatable");
      if (dt) dt.errors = {};

      let result = await saveRecords({ records: recordsToSave });

      if (result && result.isSuccess) {
        const savedIds = recordsToSave
          .map((r) => r.Id)
          .filter((id) => id && !id.startsWith("new-"));
        this.publishLmsEvent("saved", savedIds);
        this.dirtyStateManager.clear();
        this.updateUndoRedoState();
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Records saved successfully!",
            variant: "success"
          })
        );
        this.draftValues = [];
        this.pageCache.clear();
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

  // ─── Task Story 03: Live Changes Counter & Review Modal ───

  get hasDrafts() {
    return this.draftValues && this.draftValues.length > 0;
  }

  get draftStats() {
    if (!this.hasDrafts) {
      return { totalChanges: 0, totalRecords: 0 };
    }
    let totalChanges = 0;
    this.draftValues.forEach((d) => {
      const keys = Object.keys(d).filter(
        (k) => k !== "Id" && !k.startsWith("_")
      );
      totalChanges += keys.length;
    });
    return { totalChanges, totalRecords: this.draftValues.length };
  }

  get saveButtonLabel() {
    const stats = this.draftStats;
    if (stats.totalChanges === 0) {
      return "Save";
    }
    const changeWord = stats.totalChanges === 1 ? "change" : "changes";
    const rowWord = stats.totalRecords === 1 ? "row" : "rows";
    return `Save (${stats.totalChanges} ${changeWord} across ${stats.totalRecords} ${rowWord})`;
  }

  handleOpenReviewModal() {
    this.showReviewModal = true;
  }

  handleCloseReviewModal() {
    this.showReviewModal = false;
  }

  async handleToolbarSave() {
    if (!this.hasDrafts) return;
    await this.handleSave({ detail: { draftValues: this.draftValues } });
  }

  async handleReviewSave() {
    this.showReviewModal = false;
    await this.handleToolbarSave();
  }

  handleDiscardAll() {
    this.draftValues = [];
    if (this.dirtyStateManager) {
      this.dirtyStateManager.clear();
      this.updateUndoRedoState();
    }
    if (this.gridData) {
      this.gridData = this.gridData.filter(
        (r) => !r.Id || !r.Id.startsWith("new-")
      );
    }
    if (this._unfilteredGridData) {
      this.applyHeaderFilters();
    }
    this.showReviewModal = false;
    this.fetchTotals();
  }

  handleRevertField(event) {
    const { recordId, fieldName } = event.detail;
    if (!recordId || !fieldName) return;

    let updated = [];
    this.draftValues.forEach((draft) => {
      if (draft.Id === recordId) {
        const copy = { ...draft };
        delete copy[fieldName];
        const remainingKeys = Object.keys(copy).filter(
          (k) => k !== "Id" && !k.startsWith("_")
        );
        if (remainingKeys.length > 0) {
          updated.push(copy);
        }
      } else {
        updated.push(draft);
      }
    });

    this.draftValues = updated;

    // Restore original cell value in gridData if available
    if (this._unfilteredGridData && this.gridData) {
      const originalRow = this._unfilteredGridData.find(
        (r) => r.Id === recordId
      );
      if (originalRow) {
        const gridRow = this.gridData.find((r) => r.Id === recordId);
        if (gridRow) {
          gridRow[fieldName] = originalRow[fieldName];
          this.gridData = [...this.gridData];
        }
      }
    }

    if (this.draftValues.length === 0) {
      this.showReviewModal = false;
    }
    this.fetchTotals();
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
        if (parsed.pinnedColumn) {
          this.pinnedColumnField = parsed.pinnedColumn;
        }
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
        if (parsed.pinnedColumn) {
          this.pinnedColumnField = parsed.pinnedColumn;
        }
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
      fields: this.pickerSelectedFields,
      pinnedColumn: this.pinnedColumnField
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

  handleExportExcel() {
    if (!this.gridData || this.gridData.length === 0) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Nothing to Export",
          message: "No records to export.",
          variant: "warning"
        })
      );
      return;
    }

    try {
      const dataCopy = JSON.parse(JSON.stringify(this.gridData));
      const colsCopy = JSON.parse(JSON.stringify(this.gridColumns));
      const totalsCopy = this.totalsData
        ? JSON.parse(JSON.stringify(this.totalsData))
        : [];

      const fileName = `${this.objectApiName || "export"}_${new Date()
        .toISOString()
        .slice(0, 10)}.xls`;

      exportToExcel(dataCopy, colsCopy, totalsCopy, fileName);

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Export Successful",
          message: "Spreadsheet exported successfully!",
          variant: "success"
        })
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

  // ─── LMS Cross-Component Communication ───

  subscribeToMessageChannel() {
    if (this._subscription || !this.messageContext) {
      return;
    }
    this._subscription = subscribe(
      this.messageContext,
      SMART_GRID_CHANNEL,
      (message) => this.handleLmsMessage(message)
    );
  }

  unsubscribeFromMessageChannel() {
    if (this._subscription) {
      unsubscribe(this._subscription);
      this._subscription = null;
    }
  }

  handleLmsMessage(message) {
    if (!message) return;
    // If objectApiName is specified and doesn't match ours, ignore
    if (
      message.objectApiName &&
      this.objectApiName &&
      message.objectApiName !== this.objectApiName
    ) {
      return;
    }

    if (message.action === "refresh") {
      this.fetchData();
    } else if (message.action === "filter" && message.payload) {
      try {
        const filterPayload =
          typeof message.payload === "string"
            ? JSON.parse(message.payload)
            : message.payload;
        if (this.filterFields && filterPayload) {
          let updated = false;
          Object.keys(filterPayload).forEach((k) => {
            const f = this.filterFields.find((fld) => fld.fieldName === k);
            if (f) {
              f.selectedValue = filterPayload[k];
              updated = true;
            }
          });
          if (updated) {
            this.applyFilters();
          }
        }
      } catch (e) {
        console.warn("Malformed LMS filter payload:", e);
      }
    }
  }

  publishLmsEvent(action, recordIds = [], payload = null) {
    if (!this.messageContext) return;
    const idsString = Array.isArray(recordIds)
      ? recordIds.join(",")
      : recordIds || "";
    const message = {
      recordIds: idsString,
      objectApiName: this.objectApiName || "",
      action: action,
      payload: payload
        ? typeof payload === "string"
          ? payload
          : JSON.stringify(payload)
        : ""
    };
    publish(this.messageContext, SMART_GRID_CHANNEL, message);
  }

  handleRowSelection(event) {
    const selectedRows = event.detail.selectedRows || [];
    this.selectedRowsList = selectedRows;
    const ids = selectedRows
      .map((r) => r.Id)
      .filter((id) => id && !id.startsWith("new-"));
    this.publishLmsEvent("selected", ids);

    // Reading pane & Related grid selection handling (TS-05 & TS-07)
    if (selectedRows.length > 0) {
      const selected = selectedRows[selectedRows.length - 1];
      this.selectedRowId = selected.Id;
      this.selectedRecordForReadingPane = selected.Id;
      this.selectedRecordTitle = selected.Name || selected.Id;
      if (this.canReadingPane) {
        this.showReadingPane = true;
      }
      if (this.hasRelatedObjects) {
        this.showRelatedGrid = true;
      }
    } else {
      this.selectedRowId = null;
      this.selectedRecordForReadingPane = null;
      this.selectedRecordTitle = null;
      this.showReadingPane = false;
      this.showRelatedGrid = false;
    }
  }

  // ─── Cell Changes & Undo / Redo (TS-03) ───

  handleCellChange(event) {
    const newDrafts = event.detail.draftValues || [];
    const changes = [];

    newDrafts.forEach((draft) => {
      const existingDraft = this.draftValues.find((d) => d.Id === draft.Id);
      const originalRow = this.gridData.find((r) => r.Id === draft.Id);

      Object.keys(draft).forEach((field) => {
        if (field === "Id") return;
        const oldVal =
          existingDraft && existingDraft[field] !== undefined
            ? existingDraft[field]
            : originalRow
              ? originalRow[field]
              : undefined;
        const newVal = draft[field];

        if (oldVal !== newVal) {
          changes.push({
            recordId: draft.Id,
            fieldName: field,
            oldValue: oldVal,
            newValue: newVal
          });
        }
      });
    });

    if (changes.length > 0) {
      this.dirtyStateManager.push({ type: "cell", changes });
      this.updateUndoRedoState();
    }

    // Merge newDrafts into this.draftValues
    let updatedDrafts = [...this.draftValues];
    newDrafts.forEach((draft) => {
      const idx = updatedDrafts.findIndex((d) => d.Id === draft.Id);
      if (idx >= 0) {
        updatedDrafts[idx] = { ...updatedDrafts[idx], ...draft };
      } else {
        updatedDrafts.push(draft);
      }
    });
    this.draftValues = updatedDrafts;

    // Recalculate formula columns on cell change (AC-11-4)
    this.gridData = computeFormulaColumns(
      this.gridData,
      this.gridColumns,
      this.draftValues
    );
  }

  handleUndo() {
    if (!this.dirtyStateManager.canUndo) return;
    const op = this.dirtyStateManager.undo();
    if (!op || !op.changes) return;

    let updatedDrafts = [...this.draftValues];
    let updatedGridData = [...this.gridData];

    op.changes.forEach((ch) => {
      const draftIdx = updatedDrafts.findIndex((d) => d.Id === ch.recordId);
      if (draftIdx >= 0) {
        if (ch.oldValue === undefined) {
          delete updatedDrafts[draftIdx][ch.fieldName];
          if (Object.keys(updatedDrafts[draftIdx]).length <= 1) {
            updatedDrafts.splice(draftIdx, 1);
          }
        } else {
          updatedDrafts[draftIdx] = {
            ...updatedDrafts[draftIdx],
            [ch.fieldName]: ch.oldValue
          };
        }
      }

      const rowIdx = updatedGridData.findIndex((r) => r.Id === ch.recordId);
      if (rowIdx >= 0) {
        updatedGridData[rowIdx] = {
          ...updatedGridData[rowIdx],
          [ch.fieldName]: ch.oldValue
        };
      }
    });

    this.draftValues = updatedDrafts;
    this.gridData = computeFormulaColumns(
      updatedGridData,
      this.gridColumns,
      this.draftValues
    );
    this.updateUndoRedoState();
  }

  handleRedo() {
    if (!this.dirtyStateManager.canRedo) return;
    const op = this.dirtyStateManager.redo();
    if (!op || !op.changes) return;

    let updatedDrafts = [...this.draftValues];
    let updatedGridData = [...this.gridData];

    op.changes.forEach((ch) => {
      const draftIdx = updatedDrafts.findIndex((d) => d.Id === ch.recordId);
      if (draftIdx >= 0) {
        updatedDrafts[draftIdx] = {
          ...updatedDrafts[draftIdx],
          [ch.fieldName]: ch.newValue
        };
      } else {
        updatedDrafts.push({
          Id: ch.recordId,
          [ch.fieldName]: ch.newValue
        });
      }

      const rowIdx = updatedGridData.findIndex((r) => r.Id === ch.recordId);
      if (rowIdx >= 0) {
        updatedGridData[rowIdx] = {
          ...updatedGridData[rowIdx],
          [ch.fieldName]: ch.newValue
        };
      }
    });

    this.draftValues = updatedDrafts;
    this.gridData = computeFormulaColumns(
      updatedGridData,
      this.gridColumns,
      this.draftValues
    );
    this.updateUndoRedoState();
  }

  updateUndoRedoState() {
    this.canUndoState = this.dirtyStateManager.canUndo;
    this.canRedoState = this.dirtyStateManager.canRedo;
  }

  get disableUndo() {
    return !this.canUndoState || this.isLoading;
  }

  get disableRedo() {
    return !this.canRedoState || this.isLoading;
  }

  get disableFillDown() {
    return (
      !this.selectedRowsList ||
      this.selectedRowsList.length < 2 ||
      this.isLoading
    );
  }

  // ─── Fill Down & Clipboard Paste (TS-10) ───

  handleFillDown() {
    if (!this.selectedRowsList || this.selectedRowsList.length < 2) {
      return;
    }

    // Find the first editable column
    const editableCol = this.gridColumns.find(
      (c) =>
        c.editable &&
        !c.formula &&
        !c.expression &&
        !c.fieldName.endsWith("_Url")
    );
    if (!editableCol) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Fill Down Unavailable",
          message: "No editable columns available for fill-down.",
          variant: "warning"
        })
      );
      return;
    }

    const fieldName = editableCol.fieldName;
    const selectedIds = new Set(this.selectedRowsList.map((r) => r.Id));
    const visibleSelectedRows = this.gridData.filter((r) =>
      selectedIds.has(r.Id)
    );
    if (visibleSelectedRows.length < 2) return;

    const sourceRow = visibleSelectedRows[0];
    const sourceVal = sourceRow[fieldName];
    const targetRows = visibleSelectedRows.slice(1);
    const changes = [];

    let updatedDrafts = [...this.draftValues];
    let updatedGridData = [...this.gridData];

    targetRows.forEach((row) => {
      const oldVal = row[fieldName];
      changes.push({
        recordId: row.Id,
        fieldName: fieldName,
        oldValue: oldVal,
        newValue: sourceVal
      });

      const draftIdx = updatedDrafts.findIndex((d) => d.Id === row.Id);
      if (draftIdx >= 0) {
        updatedDrafts[draftIdx] = {
          ...updatedDrafts[draftIdx],
          [fieldName]: sourceVal
        };
      } else {
        updatedDrafts.push({
          Id: row.Id,
          [fieldName]: sourceVal
        });
      }

      const rowIdx = updatedGridData.findIndex((r) => r.Id === row.Id);
      if (rowIdx >= 0) {
        updatedGridData[rowIdx] = {
          ...updatedGridData[rowIdx],
          [fieldName]: sourceVal
        };
      }
    });

    if (changes.length > 0) {
      this.dirtyStateManager.push({ type: "fill-down", changes });
      this.draftValues = updatedDrafts;
      this.gridData = computeFormulaColumns(
        updatedGridData,
        this.gridColumns,
        this.draftValues
      );
      this.updateUndoRedoState();
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Fill Down Complete",
          message: `Filled "${fieldName}" down to ${targetRows.length} rows.`,
          variant: "info"
        })
      );
    }
  }

  handlePaste(event) {
    const clipboardText = event.clipboardData
      ? event.clipboardData.getData("text/plain")
      : "";
    if (
      !clipboardText ||
      !this.selectedRowsList ||
      this.selectedRowsList.length === 0
    ) {
      return;
    }

    event.preventDefault();

    const rows = clipboardText
      .split(/\r\n|\n|\r/)
      .filter((line) => line.length > 0);
    if (rows.length === 0) return;

    const editableCols = this.gridColumns.filter(
      (c) =>
        c.editable &&
        !c.formula &&
        !c.expression &&
        !c.fieldName.endsWith("_Url")
    );
    if (editableCols.length === 0) return;

    const selectedIds = new Set(this.selectedRowsList.map((r) => r.Id));
    const visibleSelected = this.gridData.filter((r) => selectedIds.has(r.Id));
    const changes = [];

    let updatedDrafts = [...this.draftValues];
    let updatedGridData = [...this.gridData];

    for (
      let rIdx = 0;
      rIdx < Math.min(rows.length, visibleSelected.length);
      rIdx++
    ) {
      const row = visibleSelected[rIdx];
      const cellValues = rows[rIdx].split("\t");

      for (
        let cIdx = 0;
        cIdx < Math.min(cellValues.length, editableCols.length);
        cIdx++
      ) {
        const fieldName = editableCols[cIdx].fieldName;
        const pastedVal = cellValues[cIdx].trim();
        const oldVal = row[fieldName];

        changes.push({
          recordId: row.Id,
          fieldName: fieldName,
          oldValue: oldVal,
          newValue: pastedVal
        });

        const draftIdx = updatedDrafts.findIndex((d) => d.Id === row.Id);
        if (draftIdx >= 0) {
          updatedDrafts[draftIdx] = {
            ...updatedDrafts[draftIdx],
            [fieldName]: pastedVal
          };
        } else {
          updatedDrafts.push({
            Id: row.Id,
            [fieldName]: pastedVal
          });
        }

        const rowDataIdx = updatedGridData.findIndex((r) => r.Id === row.Id);
        if (rowDataIdx >= 0) {
          updatedGridData[rowDataIdx] = {
            ...updatedGridData[rowDataIdx],
            [fieldName]: pastedVal
          };
        }
      }
    }

    if (changes.length > 0) {
      this.dirtyStateManager.push({ type: "paste", changes });
      this.draftValues = updatedDrafts;
      this.gridData = computeFormulaColumns(
        updatedGridData,
        this.gridColumns,
        this.draftValues
      );
      this.updateUndoRedoState();
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Paste Complete",
          message: `Pasted values into ${changes.length} cell(s).`,
          variant: "info"
        })
      );
    }
  }

  // ─── Feature Security Toggles (TS-12) ───

  get canAddRow() {
    return this.config ? this.config.enableAddRow !== false : true;
  }

  get canDelete() {
    return this.config ? this.config.enableDelete !== false : true;
  }

  get canExport() {
    return this.config ? this.config.enableExport !== false : true;
  }

  get canFilter() {
    return this.config ? this.config.enableFilters !== false : true;
  }

  get canReadingPane() {
    return this.config ? this.config.enableReadingPane === true : false;
  }

  get hasRelatedObjects() {
    return Boolean(this.config && this.config.relatedObject && this.depth < 2);
  }

  get relatedObjectConfig() {
    return this.config ? this.config.relatedObject : "";
  }

  get gridContainerClass() {
    return this.showReadingPane
      ? "slds-col slds-size_1-of-1 slds-medium-size_8-of-12 slds-var-p-right_small"
      : "slds-col slds-size_1-of-1";
  }

  get currentGridConfig() {
    return {
      columns: this.pickerSelectedFields,
      sortField: this.sortField,
      sortDirection: this.sortDirection,
      filterExpression: this.activeFilterExpression,
      pinnedColumn: this.pinnedColumnField
    };
  }

  // ─── Column Totals (TS-02) ───

  async fetchTotals() {
    if (!this.objectApiName || !this.config || !this.config.totalsFieldsJson) {
      this.totalsData = [];
      return;
    }

    try {
      const fieldsToAggregate = JSON.parse(this.config.totalsFieldsJson);
      if (!Array.isArray(fieldsToAggregate) || fieldsToAggregate.length === 0) {
        this.totalsData = [];
        return;
      }

      // If in-place column header filters are active, compute client totals on the filtered gridData
      const hasHeaderFilters = Object.values(this.activeHeaderFilters).some(
        (set) => set instanceof Set && set.size > 0
      );
      if (hasHeaderFilters && this.gridData) {
        this.totalsData = this.computeClientTotals(fieldsToAggregate);
        return;
      }

      let filterMap = {};
      if (this.parentRelationshipField && this.parentRecordId) {
        filterMap[this.parentRelationshipField] = this.parentRecordId;
      }
      if (this.filterFields) {
        this.filterFields.forEach((f) => {
          if (f.selectedValue && !f.isDate) {
            filterMap[f.fieldName] = f.selectedValue;
          }
        });
      }

      const dateFilter = this.filterFields
        ? this.filterFields.find((f) => f.isDate && f.selectedValue)
        : null;

      this.totalsData = await getAggregates({
        objectApiName: this.objectApiName,
        fieldsToAggregate: fieldsToAggregate,
        filters: filterMap,
        dateField: dateFilter ? dateFilter.fieldName : null,
        startDate: dateFilter ? dateFilter.selectedValue : null,
        endDate: null,
        filterJson: this.activeFilterJson || null
      });
    } catch (e) {
      console.warn("Failed to fetch column totals:", e);
      this.totalsData = [];
    }
  }

  get hasTotals() {
    return this.totalsData && this.totalsData.length > 0;
  }

  get totalsDisplayList() {
    if (!this.hasTotals) return [];
    const colMap = {};
    if (this.gridColumns) {
      this.gridColumns.forEach((c) => {
        colMap[c.fieldName] = c.label;
      });
    }

    return this.totalsData.map((t) => ({
      fieldName: t.fieldName,
      label: colMap[t.fieldName] || t.fieldName,
      sumFormatted:
        t.sumValue != null ? Number(t.sumValue).toLocaleString() : "—",
      avgFormatted:
        t.avgValue != null
          ? Number(t.avgValue).toLocaleString(undefined, {
              maximumFractionDigits: 2
            })
          : "—",
      minFormatted:
        t.minValue != null ? Number(t.minValue).toLocaleString() : "—",
      maxFormatted:
        t.maxValue != null ? Number(t.maxValue).toLocaleString() : "—",
      count: t.countValue
    }));
  }

  get hasFilters() {
    return this.filterFields && this.filterFields.length > 0;
  }

  get showFilterPanel() {
    return this.canFilter && this.hasFilters && this.isFilterPanelOpen;
  }

  get hasActiveFilters() {
    return this.activeFilterPills && this.activeFilterPills.length > 0;
  }

  toggleFilterPanel() {
    this.isFilterPanelOpen = !this.isFilterPanelOpen;
  }

  updateActivePills() {
    const pills = [];

    // 1. Quick Filters & Date Filters from filterFields
    if (this.filterFields && Array.isArray(this.filterFields)) {
      this.filterFields.forEach((f) => {
        if (f.selectedValue && f.selectedValue !== "") {
          let displayVal = f.selectedValue;
          if (f.isPicklist && Array.isArray(f.options)) {
            const opt = f.options.find((o) => o.value === f.selectedValue);
            if (opt) displayVal = opt.label;
          }
          pills.push({
            id: `quick_${f.fieldName}`,
            fieldName: f.fieldName,
            fieldLabel: f.label || f.fieldName,
            value: f.selectedValue,
            displayLabel: `${f.label || f.fieldName}: ${displayVal}`,
            source: f.isDate ? "daterange" : "combobox"
          });
        }
      });
    }

    // 2. In-place Column Header Filters (activeHeaderFilters)
    if (
      this.activeHeaderFilters &&
      typeof this.activeHeaderFilters === "object"
    ) {
      Object.keys(this.activeHeaderFilters).forEach((fieldName) => {
        const valSet = this.activeHeaderFilters[fieldName];
        if (valSet && valSet.size > 0) {
          const col = this.gridColumns?.find((c) => c.fieldName === fieldName);
          const colLabel = col ? col.label : fieldName;
          valSet.forEach((val) => {
            pills.push({
              id: `header_${fieldName}_${encodeURIComponent(val)}`,
              fieldName: fieldName,
              fieldLabel: colLabel,
              value: val,
              displayLabel: `${colLabel}: ${val}`,
              source: "header"
            });
          });
        }
      });
    }

    // 3. Advanced Filter Builder (activeFilterJson / activeFilterExpression)
    if (this.activeFilterExpression || this.activeFilterJson) {
      pills.push({
        id: "advanced_filter",
        fieldName: "advanced",
        fieldLabel: "Advanced Filter",
        value: this.activeFilterExpression || "Custom Criteria",
        displayLabel: `Advanced: ${this.activeFilterExpression || "Custom Criteria"}`,
        source: "filterbuilder"
      });
    }

    // 4. AI Filters (Phase 3)
    if (this.aiFilterPills && this.aiFilterPills.length > 0) {
      pills.push(...this.aiFilterPills);
    }

    this.activeFilterPills = pills;
  }

  async handleRemoveFilterPill(event) {
    const detail = event.detail || {};
    const source = detail.source;
    const fieldName = detail.fieldName || event.target?.name;
    const value = detail.value;

    if (source === "header") {
      if (this.activeHeaderFilters && this.activeHeaderFilters[fieldName]) {
        this.activeHeaderFilters[fieldName].delete(value);
        if (this.activeHeaderFilters[fieldName].size === 0) {
          delete this.activeHeaderFilters[fieldName];
        }
      }
      this.applyHeaderFilters();
      this.refreshHeaderActions();
      this.fetchTotals();
      this.updateActivePills();
      return;
    }

    if (source === "filterbuilder") {
      this.activeFilterExpression = null;
      this.activeFilterJson = null;
      this.currentPage = 1;
      this.updateActivePills();
      await this.fetchData();
      return;
    }

    if (source === "ai") {
      this.aiFilterPills = (this.aiFilterPills || []).filter(
        (p) => p.id !== detail.id
      );
      if (this.aiFilterPills.length > 0) {
        const expr = {
          logic: "AND",
          conditions: this.aiFilterPills.map((p) => ({
            field: p.fieldName,
            operator: p.operator || "=",
            value: p.value
          })),
          groups: []
        };
        this.activeFilterJson = JSON.stringify(expr);
      } else {
        this.activeFilterJson = null;
      }
      this.pageCache.clear();
      this.currentPage = 1;
      this.updateActivePills();
      await this.fetchData(true);
      return;
    }

    // Default: Quick Combobox / Date range
    if (this.filterFields) {
      const filter = this.filterFields.find((f) => f.fieldName === fieldName);
      if (filter) {
        filter.selectedValue = "";
      }
    }
    this.updateActivePills();
    await this.fetchData();
  }

  // ─── Phase 3 AI Handlers ───

  handleOpenCommandPalette() {
    this.showCommandPalette = true;
  }

  handleCloseCommandPalette() {
    this.showCommandPalette = false;
  }

  async handleApplyAIFilters(event) {
    const detail = event.detail || {};
    const { filters, sortField, sortDirection } = detail;

    if (filters && Array.isArray(filters)) {
      this.aiFilterPills = filters.map((f, idx) => ({
        id: `ai_${f.field}_${idx}`,
        fieldName: f.field,
        fieldLabel: f.field,
        value: f.value,
        displayLabel: `AI: ${f.field} ${f.operator} '${f.value}'`,
        source: "ai",
        operator: f.operator
      }));

      if (filters.length > 0) {
        const expr = {
          logic: "AND",
          conditions: filters.map((f) => ({
            field: f.field,
            operator: f.operator,
            value: f.value
          })),
          groups: []
        };
        this.activeFilterJson = JSON.stringify(expr);
      } else {
        this.activeFilterJson = null;
      }
    }

    if (sortField) {
      this.sortField = sortField;
      this.sortDirection = (sortDirection || "ASC").toUpperCase();
    }

    this.pageCache.clear();
    this.currentPage = 1;
    this.updateActivePills();
    await this.fetchData(true);
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
   * Maps Salesforce Schema field types to standard lightning-datatable column types.
   * Returns a deep-cloned object to prevent shared mutation across columns.
   *
   * Platform Limitations (documented):
   * - PICKLIST: Renders as editable text input. Native datatable has no dropdown type.
   * - BOOLEAN: Renders as read-only checkbox. Native datatable doesn't support inline boolean editing.
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
      PICKLIST: { type: "text" },
      MULTIPICKLIST: { type: "text" },
      ID: { type: "text" },
      REFERENCE: { type: "text" }
    };
    const result = typeMap[sfType?.toUpperCase()] || { type: "text" };
    // Deep-clone to prevent shared-object mutation across column formatting
    return JSON.parse(JSON.stringify(result));
  }

  formatColumn(col) {
    const fieldApi = col.fieldApiName || col.field || col.fieldName;
    const label = col.displayLabel || col.label || fieldApi;
    // Formula / computed columns are strictly read-only (AC-11-3)
    const isFormula = Boolean(col.formula || col.expression);
    const isEditable = !isFormula && col.isUpdateable !== false;
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
        cellAttributes: {
          class: { fieldName: fieldApi + "_cellClass" },
          iconName: { fieldName: fieldApi + "_iconName" },
          iconPosition: "left"
        },
        editable: false,
        sortable: isSortable,
        initialWidth: colWidth
      };
    }

    // sfType was already resolved from _fieldMetadataMap above
    const mapped = this.mapFieldType(sfType);

    // Boolean fields cannot be inline-edited in standard lightning-datatable
    const isBooleanType = sfType === "BOOLEAN";

    return {
      label: label,
      fieldName: fieldApi,
      type: mapped.type,
      typeAttributes: mapped.typeAttributes || undefined,
      cellAttributes: {
        class: { fieldName: fieldApi + "_cellClass" },
        iconName: { fieldName: fieldApi + "_iconName" },
        iconPosition: "left"
      },
      editable: isBooleanType ? false : isEditable,
      sortable: isSortable,
      initialWidth: colWidth
    };
  }

  // ─── Sprint 4 Actions (TS-05, TS-06, TS-07, TS-09) ───

  handleOpenAdvancedFilter() {
    this.showAdvancedFilterModal = true;
  }

  handleCloseAdvancedFilter() {
    this.showAdvancedFilterModal = false;
  }

  async handleApplyAdvancedFilter(event) {
    this.showAdvancedFilterModal = false;
    this.activeFilterExpression = event.detail.expression;
    this.activeFilterJson = event.detail.json;
    this.currentPage = 1;
    this.pageCache.clear();
    this.updateActivePills();
    await this.fetchData();
    this.logHistory();
  }

  async handleViewSelect(event) {
    const { config } = event.detail;
    if (config) {
      if (config.sortField) this.sortField = config.sortField;
      if (config.sortDirection) this.sortDirection = config.sortDirection;
      if (config.filterExpression) {
        this.activeFilterExpression = config.filterExpression;
        this.activeFilterJson = JSON.stringify(config.filterExpression);
      } else {
        this.activeFilterExpression = null;
        this.activeFilterJson = null;
      }
      if (Array.isArray(config.columns) && config.columns.length > 0) {
        this.pickerSelectedFields = config.columns;
        this.refreshColumns();
      }
      if (config.pinnedColumn !== undefined) {
        this.pinnedColumnField = config.pinnedColumn;
      }
    }
    this.currentPage = 1;
    this.pageCache.clear();
    this.updateActivePills();
    await this.fetchData();
  }

  async handleResetView() {
    this.activeFilterExpression = null;
    this.activeFilterJson = null;
    this.activeHeaderFilters = {};
    this.pinnedColumnField = null;
    this.sortField = null;
    this.sortDirection = "asc";
    this.currentPage = 1;
    this.pageCache.clear();
    this.updateActivePills();
    await this.fetchData();
  }

  // ─── Task Story 13: Column Header Actions Orchestration ───

  computeClientTotals(fieldsToAggregate) {
    if (!this.gridData || this.gridData.length === 0) return [];
    return fieldsToAggregate.map((field) => {
      let sum = 0;
      let count = 0;
      let min = null;
      let max = null;
      for (const row of this.gridData) {
        const val = Number(row[field]);
        if (!isNaN(val) && val !== null) {
          sum += val;
          count++;
          if (min === null || val < min) min = val;
          if (max === null || val > max) max = val;
        }
      }
      return {
        fieldApiName: field,
        sum: sum,
        avg: count > 0 ? sum / count : 0,
        min: min !== null ? min : 0,
        max: max !== null ? max : 0,
        count: count
      };
    });
  }

  applyHeaderFilters() {
    if (!this._unfilteredGridData) {
      this.gridData = [];
      return;
    }
    this.gridData = filterRecordsByHeaderActions(
      this._unfilteredGridData,
      this.activeHeaderFilters
    );
  }

  refreshHeaderActions() {
    if (!this.gridColumns || !this._unfilteredGridData) return;
    let updatedCols = this.gridColumns.map((col) => {
      const actions = generateColumnActions(
        col,
        this._unfilteredGridData,
        this.activeHeaderFilters,
        this.pinnedColumnField
      );
      const isFiltered =
        this.activeHeaderFilters[col.fieldName] &&
        this.activeHeaderFilters[col.fieldName].size > 0;
      const isPinned = this.pinnedColumnField === col.fieldName;

      const copy = { ...col, actions };
      if (isPinned) {
        copy.iconName = "utility:pinned";
      } else if (isFiltered) {
        copy.iconName = "utility:filter";
      } else if (
        copy.iconName === "utility:pinned" ||
        copy.iconName === "utility:filter"
      ) {
        delete copy.iconName;
      }
      return copy;
    });

    if (this.pinnedColumnField) {
      updatedCols = reorderColumnsWithPin(updatedCols, this.pinnedColumnField);
    }
    this.gridColumns = updatedCols;
  }

  handleHeaderAction(event) {
    const actionName = event.detail.action.name;
    const colDef = event.detail.columnDefinition;
    const fieldName = colDef.fieldName;

    if (actionName === "pin_left") {
      this.pinnedColumnField = fieldName;
      this.refreshHeaderActions();
      this.saveCurrentPrefs();
      return;
    }

    if (actionName === "unpin_left") {
      this.pinnedColumnField = null;
      this.refreshHeaderActions();
      this.saveCurrentPrefs();
      return;
    }

    if (actionName === "autofit_width") {
      this.handleAutoFitColumn(fieldName);
      return;
    }

    if (actionName === "more_filters") {
      this.handleOpenAdvancedFilter();
      return;
    }

    if (actionName === "all" || actionName === "clear") {
      if (this.activeHeaderFilters[fieldName]) {
        delete this.activeHeaderFilters[fieldName];
      }
      this.applyHeaderFilters();
      this.refreshHeaderActions();
      this.fetchTotals();
      this.updateActivePills();
      return;
    }

    if (actionName.startsWith("val_")) {
      const rawVal = decodeURIComponent(actionName.substring(4));
      if (!this.activeHeaderFilters[fieldName]) {
        this.activeHeaderFilters[fieldName] = new Set();
      }
      const set = this.activeHeaderFilters[fieldName];
      if (set.has(rawVal)) {
        set.delete(rawVal);
        if (set.size === 0) {
          delete this.activeHeaderFilters[fieldName];
        }
      } else {
        set.add(rawVal);
      }

      this.applyHeaderFilters();
      this.refreshHeaderActions();
      this.fetchTotals();
      this.updateActivePills();
    }
  }

  handleAutoFitColumn(fieldName) {
    if (!this.gridColumns || !this.gridData) return;
    const colIndex = this.gridColumns.findIndex(
      (c) => c.fieldName === fieldName
    );
    if (colIndex === -1) return;

    const col = this.gridColumns[colIndex];
    const newWidth = calculateColumnWidth(col, this.gridData);

    const updatedCols = [...this.gridColumns];
    updatedCols[colIndex] = { ...col, initialWidth: newWidth };
    this.gridColumns = updatedCols;

    this.saveCurrentPrefs();
  }

  handleAutoFitAllColumns() {
    if (!this.gridColumns || !this.gridData) return;
    this.gridColumns = calculateAllColumnWidths(
      this.gridColumns,
      this.gridData
    );
    this.saveCurrentPrefs();
  }

  handleHeaderDoubleClick(event) {
    const th = event.target?.closest ? event.target.closest("th") : null;
    if (th) {
      const col = this.gridColumns?.find(
        (c) =>
          c.label === th.textContent?.trim() ||
          c.fieldName === th.dataset?.fieldName
      );
      if (col) {
        this.handleAutoFitColumn(col.fieldName);
      }
    }
  }

  handleCloseReadingPane() {
    this.showReadingPane = false;
  }

  handleCloseRelatedGrid() {
    this.showRelatedGrid = false;
  }

  async logHistory() {
    try {
      if (this.objectApiName && this.activeFilterJson) {
        await logQueryHistory({
          objectApiName: this.objectApiName,
          configJson: JSON.stringify(this.currentGridConfig)
        });
      }
    } catch {
      // Non-blocking history logging
    }
  }

  // L-1: Delegate to shared utility
  reduceErrors(e) {
    return reduceErrors(e);
  }
}
