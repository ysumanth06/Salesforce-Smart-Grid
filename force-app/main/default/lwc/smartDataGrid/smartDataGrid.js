import { LightningElement, api, track } from 'lwc';
import getGridConfig from '@salesforce/apex/SmartGridController.getGridConfig';
import getRecords from '@salesforce/apex/SmartGridController.getRecords';
import saveRecords from '@salesforce/apex/SmartGridController.saveRecords';
import getPicklistValues from '@salesforce/apex/SmartGridController.getPicklistValues';
import deleteRecords from '@salesforce/apex/SmartGridController.deleteRecords';
import LightningConfirm from 'lightning/confirm';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class SmartDataGrid extends LightningElement {
    @api gridConfigName;
    @api objectApiName;
    @api gridTitle = 'Smart Data Grid';
    
    @track gridColumns;
    @track gridData = [];
    @track draftValues = [];
    @track isLoading = true;
    @track errorMessage;
    @track failureQueue = [];

    // Filter state
    @track filterOptions = [];
    @track selectedFilterValue = '';
    _filterField;

    config;
    _showFieldPicker = false;
    pickerSelectedFields = [];

    connectedCallback() {
        if (this.gridConfigName) {
            this.fetchConfig();
        } else if (this.objectApiName) {
            this.isLoading = false;
            // Check cache first before prompting
            if (this.loadCachedColumns()) {
                this.fetchData();
            } else {
                this.openFieldPicker();
            }
        } else {
            this.isLoading = false;
        }
    }

    async fetchConfig() {
        try {
            this.isLoading = true;
            this.errorMessage = null;
            this.config = await getGridConfig({ configDevName: this.gridConfigName });
            
            if (this.config && this.config.Is_Active__c) {
                this.objectApiName = this.config.Object_API_Name__c;
                // Parse columns
                let columnsDef = [];
                if (this.config.Columns_JSON__c) {
                    let parsed = JSON.parse(this.config.Columns_JSON__c);
                    // Map to lightning-datatable structure
                    columnsDef = parsed.map(c => this.formatColumn(c));
                }
                this.gridColumns = columnsDef;

                // Load filter picklist if configured
                if (this.config.Default_Filter_Field__c) {
                    this._filterField = this.config.Default_Filter_Field__c;
                    await this.loadFilterOptions();
                }
                
                // Fetch data if columns exist
                if (this.gridColumns.length > 0) {
                    await this.fetchData();
                }
            } else if (this.objectApiName) {
                // Config not found/not active but we have an object — offer field picker
                this.openFieldPicker();
            } else {
                this.errorMessage = 'Configuration not active or not found.';
            }
        } catch(e) {
            // Config retrieval failed — check if we should show the field picker
            if (this.objectApiName) {
                this.openFieldPicker();
            } else {
                this.errorMessage = 'Error loading config: ' + this.reduceErrors(e);
            }
        } finally {
            this.isLoading = false;
        }
    }

    // ─── Filter Logic ───

    /**
     * Loads picklist values from Apex for the configured filter field.
     * Populates the combobox options with an "All" entry as default.
     */
    async loadFilterOptions() {
        if (!this.objectApiName || !this._filterField) return;

        try {
            const values = await getPicklistValues({
                objectApiName: this.objectApiName,
                fieldApiName: this._filterField
            });

            // Prepend "All" option as default
            this.filterOptions = [
                { label: '-- All --', value: '' },
                ...values.map(v => ({ label: v.label, value: v.value }))
            ];
        } catch(e) {
            // Non-critical: filter just won't render if it fails
            this.filterOptions = [];
            console.warn('Failed to load filter options:', this.reduceErrors(e));
        }
    }

    /**
     * Handle combobox selection change — refetch data with new filter value.
     */
    async handleFilterChange(event) {
        this.selectedFilterValue = event.detail.value;
        await this.fetchData();
    }

    async fetchData() {
        if (!this.objectApiName || !this.gridColumns || this.gridColumns.length === 0) return;

        try {
            this.isLoading = true;
            this.errorMessage = null;
            
            let fieldsToQuery = this.gridColumns.map(c => c.fieldName);

            // Pass filter value to Apex if a filter field is configured
            let filterValueParam = null;
            if (this._filterField && this.selectedFilterValue) {
                filterValueParam = this.selectedFilterValue;
            }

            let response = await getRecords({
                objectApiName: this.objectApiName,
                fields: fieldsToQuery,
                filterField: this._filterField || this.config?.Default_Filter_Field__c,
                filterValue: filterValueParam,
                sortField: this.config?.Default_Sort_Field__c,
                recordLimit: this.config?.Record_Limit__c || 200
            });
            
            // Auto-generate URL properties for lightning-datatable 'url' columns
            this.gridData = response.map(row => {
                let mappedRow = { ...row };
                Object.keys(mappedRow).forEach(key => {
                    if (key === 'Id' || key.endsWith('Id')) {
                        mappedRow[key + '_Url'] = `/${mappedRow[key]}`;
                    }
                });
                return mappedRow;
            });
        } catch(e) {
            this.errorMessage = 'Error loading records: ' + this.reduceErrors(e);
        } finally {
            this.isLoading = false;
        }
    }

    handleAddRow() {
        const newRowId = 'new-' + Date.now();
        const newRow = { Id: newRowId };
        this.draftValues = [...this.draftValues, newRow];
    }

    async handleDelete() {
        const datatable = this.template.querySelector('lightning-datatable');
        const selectedRows = datatable.getSelectedRows();
        if (!selectedRows || selectedRows.length === 0) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'No Rows Selected',
                message: 'Please select rows to delete.',
                variant: 'info'
            }));
            return;
        }

        const result = await LightningConfirm.open({
            message: `Are you sure you want to delete ${selectedRows.length} record(s)?`,
            theme: 'warning',
            label: 'Confirm Deletion',
        });

        if (result) {
            try {
                this.isLoading = true;
                const recordsToDelete = selectedRows.map(r => ({ Id: r.Id, sobjectType: this.objectApiName }));
                const deleteResult = await deleteRecords({ records: recordsToDelete });
                if (deleteResult && deleteResult.isSuccess) {
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Success',
                        message: 'Records deleted successfully!',
                        variant: 'success'
                    }));
                    await this.fetchData();
                } else {
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Error Deleting Records',
                        message: deleteResult.tableErrors?.join(', ') || 'Failed to delete records',
                        variant: 'error'
                    }));
                }
            } catch(e) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error Deleting',
                    message: this.reduceErrors(e),
                    variant: 'error'
                }));
            } finally {
                this.isLoading = false;
            }
        }
    }

    async handleSave(event) {
        let drafts = event.detail.draftValues;
        
        let recordsToSave = drafts.map((d, index) => {
            let copy = { ...d };
            if (copy.Id && copy.Id.startsWith('new-')) {
                delete copy.Id;
            }
            copy.sobjectType = this.objectApiName;
            return copy;
        });

        try {
            this.isLoading = true;
            this.errorMessage = null;
            // Clear previous table errors
            this.template.querySelector('lightning-datatable').errors = {};

            let result = await saveRecords({ records: recordsToSave });
            
            if(result && result.isSuccess) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Records saved successfully!',
                    variant: 'success'
                }));
                this.draftValues = [];
                await this.fetchData();
            } else {
                let rowErrorMap = {};
                let failedNewDrafts = [];
                if (result.rowErrors && result.rowErrors.length > 0) {
                    result.rowErrors.forEach(re => {
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
                
                this.template.querySelector('lightning-datatable').errors = {
                    rows: rowErrorMap,
                    table: {
                        title: 'Error Saving Records',
                        messages: result.tableErrors || ['Some records failed to save.']
                    }
                };

                this.dispatchEvent(new ShowToastEvent({
                    title: 'Partial Success',
                    message: 'Some records failed to save. Please review the errors in the table.',
                    variant: 'warning'
                }));
                // Keep failed records in drafts
                if (result.rowErrors) {
                    let failedIds = Object.keys(rowErrorMap);
                    this.draftValues = drafts.filter(draft => failedIds.includes(draft.Id));
                }

                if (failedNewDrafts.length > 0) {
                    this.failureQueue = failedNewDrafts;
                    // Open the resolution modal
                    const modal = this.template.querySelector('c-smart-grid-resolution-modal');
                    if (modal) {
                        modal.open(this.failureQueue);
                    }
                }

                // Refresh data to show successful updates
                await this.fetchData();
            }
        } catch(e) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error Saving',
                message: this.reduceErrors(e),
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }

    handleRecordSolved(event) {
        const solvedDraftId = event.detail.draftId;
        this.draftValues = this.draftValues.filter(d => d.Id !== solvedDraftId);
    }

    handleResolutionClose() {
        this.failureQueue = [];
    }

    handleResolutionComplete() {
        this.failureQueue = [];
        this.fetchData();
    }

    // ─── Field Picker Integration ───

    loadCachedColumns() {
        if (!this.objectApiName) return false;
        try {
            const cacheKey = `smartGridCols_${this.objectApiName}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                this.gridColumns = parsed.columns;
                this.pickerSelectedFields = parsed.fields;
                return true;
            }
        } catch (e) {
            console.warn('Failed to load cached columns:', e);
        }
        return false;
    }

    openFieldPicker() {
        this._showFieldPicker = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        Promise.resolve().then(() => {
            const picker = this.template.querySelector('c-smart-grid-field-picker');
            if (picker) {
                picker.open();
            }
        });
    }

    async handleFieldSelection(event) {
        const { fields, columns } = event.detail;
        this._showFieldPicker = false;

        this.gridColumns = columns.map(col => this.formatColumn(col));

        this.pickerSelectedFields = fields;

        // Cache the selection
        try {
            if (this.objectApiName) {
                const cacheKey = `smartGridCols_${this.objectApiName}`;
                localStorage.setItem(cacheKey, JSON.stringify({
                    columns: this.gridColumns,
                    fields: this.pickerSelectedFields
                }));
            }
        } catch (e) {
            console.warn('Failed to save columns to cache:', e);
        }

        if (this.gridColumns.length > 0) {
            await this.fetchData();
        }
    }

    handlePickerClosed() {
        this._showFieldPicker = false;
    }

    // ─── Computed Properties ───

    get showNoConfigMessage() {
        return !this.gridColumns && !this.isLoading && !this._showFieldPicker;
    }

    get hasFilter() {
        return this.filterOptions && this.filterOptions.length > 1;
    }

    get filterLabel() {
        return `Filter by ${this._filterField || 'Field'}`;
    }

    // ─── Utilities ───

    formatColumn(col) {
        const isReference = col.field === 'Id' || col.field.endsWith('Id');
        if (isReference) {
            return {
                label: col.label || col.field,
                fieldName: col.field + '_Url',
                type: 'url',
                typeAttributes: {
                    label: { fieldName: col.field },
                    target: '_blank'
                },
                editable: false,
                initialWidth: col.width
            };
        }
        return {
            label: col.label || col.field,
            fieldName: col.field,
            type: 'text',
            editable: col.editable !== false,
            initialWidth: col.width
        };
    }

    reduceErrors(e) {
        if (e && e.body && e.body.message) {
            return e.body.message;
        }
        return e ? String(e) : 'Unknown error';
    }
}
