import { LightningElement, api, track } from 'lwc';
import getGridConfig from '@salesforce/apex/SmartGridController.getGridConfig';
import getRecords from '@salesforce/apex/SmartGridController.getRecords';
import saveRecords from '@salesforce/apex/SmartGridController.saveRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class SmartDataGrid extends LightningElement {
    @api gridConfigName;
    @api objectApiName;
    
    @track gridColumns;
    @track gridData = [];
    @track draftValues = [];
    @track isLoading = true;
    @track errorMessage;

    config;
    _showFieldPicker = false;
    pickerSelectedFields = [];

    connectedCallback() {
        if (this.gridConfigName) {
            this.fetchConfig();
        } else if (this.objectApiName) {
            // No config name but has an object — trigger field picker
            this.isLoading = false;
            this.openFieldPicker();
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
                    columnsDef = parsed.map(c => ({
                        label: c.field, // Simplistic label for phase 0 MVP
                        fieldName: c.field,
                        type: 'text', 
                        editable: c.editable,
                        initialWidth: c.width
                    }));
                }
                this.gridColumns = columnsDef;
                
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

    async fetchData() {
        if (!this.objectApiName || !this.gridColumns || this.gridColumns.length === 0) return;

        try {
            this.isLoading = true;
            this.errorMessage = null;
            
            let fieldsToQuery = this.gridColumns.map(c => c.fieldName);
            let response = await getRecords({
                objectApiName: this.objectApiName,
                fields: fieldsToQuery,
                filterField: this.config?.Default_Filter_Field__c,
                sortField: this.config?.Default_Sort_Field__c,
                recordLimit: this.config?.Record_Limit__c || 200
            });
            this.gridData = response;
        } catch(e) {
            this.errorMessage = 'Error loading records: ' + this.reduceErrors(e);
        } finally {
            this.isLoading = false;
        }
    }

    async handleSave(event) {
        let drafts = event.detail.draftValues;
        
        try {
            this.isLoading = true;
            this.errorMessage = null;
            // Clear previous table errors
            this.template.querySelector('lightning-datatable').errors = {};

            let result = await saveRecords({ records: drafts });
            
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
                if (result.rowErrors && result.rowErrors.length > 0) {
                    result.rowErrors.forEach(re => {
                        rowErrorMap[re.id] = {
                            title: re.title,
                            messages: re.messages,
                            fieldNames: re.fieldNames
                        };
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
                    let failedIds = result.rowErrors.map(e => e.id);
                    this.draftValues = drafts.filter(draft => failedIds.includes(draft.Id));
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

    // ─── Field Picker Integration ───

    /**
     * Opens the field picker modal via the child component's @api open() method.
     */
    openFieldPicker() {
        this._showFieldPicker = true;
        // Use a microtask to ensure the child is rendered before calling open()
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        Promise.resolve().then(() => {
            const picker = this.template.querySelector('c-smart-grid-field-picker');
            if (picker) {
                picker.open();
            }
        });
    }

    /**
     * Handle fieldselection event from the child smartGridFieldPicker.
     * Builds datatable columns from the user's selections and fetches data.
     */
    async handleFieldSelection(event) {
        const { fields, columns } = event.detail;
        this._showFieldPicker = false;

        // Build datatable column definitions from picker output
        this.gridColumns = columns.map(col => ({
            label: col.label || col.field,
            fieldName: col.field,
            type: 'text',
            editable: col.editable !== false
        }));

        this.pickerSelectedFields = fields;

        // Fetch data with the user's selected fields
        if (this.gridColumns.length > 0) {
            await this.fetchData();
        }
    }

    /**
     * Handle pickerclosed event — user cancelled the modal.
     */
    handlePickerClosed() {
        this._showFieldPicker = false;
    }

    // ─── Computed Properties ───

    /**
     * Show the "no config" message only when not loading, no columns, and no picker open.
     */
    get showNoConfigMessage() {
        return !this.gridColumns && !this.isLoading && !this._showFieldPicker;
    }

    // ─── Utilities ───

    reduceErrors(e) {
        if (e && e.body && e.body.message) {
            return e.body.message;
        }
        return e ? String(e) : 'Unknown error';
    }
}
