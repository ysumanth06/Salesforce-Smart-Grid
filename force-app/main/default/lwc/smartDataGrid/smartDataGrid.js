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

    connectedCallback() {
        if (this.gridConfigName) {
            this.fetchConfig();
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
            } else {
                this.errorMessage = 'Configuration not active or not found.';
            }
        } catch(e) {
            this.errorMessage = 'Error loading config: ' + this.reduceErrors(e);
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
                let errString = result?.errorMessages && result.errorMessages.length > 0 
                    ? result.errorMessages.join(', ') 
                    : 'Unknown error occurred during save.';
                
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error Saving Records',
                    message: errString,
                    variant: 'error'
                }));
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

    reduceErrors(e) {
        if (e && e.body && e.body.message) {
            return e.body.message;
        }
        return e ? String(e) : 'Unknown error';
    }
}
