import { LightningElement, api, track } from "lwc";
import getObjectFields from "@salesforce/apex/SmartGridController.getObjectFields";
import { reduceErrors as reduceErrorsUtil } from "c/errorUtils";

/**
 * smartGridFieldPicker — Child modal component for column personalization.
 * Renders a lightning-dual-listbox allowing users to select which fields
 * appear in the Smart Data Grid when no CMDT config exists.
 * Fires a custom 'fieldselection' event to the parent smartDataGrid.
 */
export default class SmartGridFieldPicker extends LightningElement {
  /** Object API Name passed from parent (required) */
  @api objectApiName;

  /** Pre-selected field API names from parent (optional) */
  @api
  get selectedFields() {
    return this._selectedFields;
  }
  set selectedFields(value) {
    this._selectedFields = value ? [...value] : [];
    this._currentSelection = [...this._selectedFields];
  }

  @track availableFields = [];
  @track _selectedFields = [];
  @track _currentSelection = [];
  @track isLoading = true;
  @track error;

  /** Controls modal visibility */
  _isOpen = false;

  @api
  get isOpen() {
    return this._isOpen;
  }
  set isOpen(value) {
    this._isOpen = value;
  }

  /** Programmatic open from parent */
  @api
  open() {
    this._isOpen = true;
    this.loadFields();
  }

  /** Programmatic close from parent */
  @api
  close() {
    this._isOpen = false;
  }

  connectedCallback() {
    if (this._isOpen && this.objectApiName) {
      this.loadFields();
    }
  }

  /**
   * Fetch accessible fields for the target object via Apex.
   * Maps to dual-listbox option format { label, value }.
   */
  async loadFields() {
    if (!this.objectApiName) {
      this.error = "No object API name provided.";
      this.isLoading = false;
      return;
    }

    try {
      this.isLoading = true;
      this.error = undefined;
      const fields = await getObjectFields({
        objectApiName: this.objectApiName
      });

      this.availableFields = fields.map((f) => ({
        label: `${f.fieldApiName} — ${f.label}`,
        value: f.fieldApiName
      }));

      // Sort options alphabetically by label
      this.availableFields.sort((a, b) => a.label.localeCompare(b.label));
    } catch (e) {
      this.error = this.reduceErrors(e);
    } finally {
      this.isLoading = false;
    }
  }

  /** Handle dual-listbox selection change */
  handleSelectionChange(event) {
    this._currentSelection = event.detail.value;
  }

  /** Handle Apply button — fire fieldselection event to parent */
  handleApply() {
    if (!this._currentSelection || this._currentSelection.length === 0) {
      this.error = "Please select at least one field.";
      return;
    }
    this.error = undefined;

    // Build column definitions from selected fields
    const columns = this._currentSelection.map((fieldApi, index) => {
      const fieldMeta = this.availableFields.find((f) => f.value === fieldApi);
      return {
        field: fieldApi,
        order: index + 1,
        editable: true,
        label: fieldMeta ? fieldMeta.label : fieldApi
      };
    });

    this.dispatchEvent(
      new CustomEvent("fieldselection", {
        detail: {
          fields: this._currentSelection,
          columns: columns
        }
      })
    );

    this._isOpen = false;
  }

  /** Handle Cancel button — restore previous selection and close */
  handleCancel() {
    this._currentSelection = [...this._selectedFields];
    this.error = undefined;
    this._isOpen = false;

    this.dispatchEvent(new CustomEvent("pickerclosed"));
  }

  /** Utility: Extract meaningful error messages */
  reduceErrors(e) {
    return reduceErrorsUtil(e);
  }

  /** Dual-listbox labels */
  get sourceLabel() {
    return "Available Fields";
  }

  get selectedLabel() {
    return "Selected Fields";
  }

  get modalTitle() {
    return `Select Columns — ${this.objectApiName || "Object"}`;
  }

  get hasError() {
    return !!this.error;
  }

  get applyDisabled() {
    return this.isLoading;
  }
}
