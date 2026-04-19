import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class SmartGridResolutionModal extends LightningElement {
    @api objectApiName;
    @api columns = [];
    
    @track isOpen = false;
    @track failedRecords = [];
    @track currentIndex = 0;

    @api
    open(records) {
        if (records && records.length > 0) {
            this.failedRecords = [...records];
            this.currentIndex = 0;
            this.isOpen = true;
        }
    }

    get currentRecord() {
        if (this.failedRecords.length > 0 && this.currentIndex < this.failedRecords.length) {
            return this.failedRecords[this.currentIndex];
        }
        return null;
    }

    get fieldsToRender() {
        if (!this.currentRecord || !this.columns) return [];
        return this.columns
            .filter(c => c.fieldName && c.fieldName !== 'Id' && !c.fieldName.endsWith('_Url'))
            .map(c => {
                return {
                    fieldName: c.fieldName,
                    value: this.currentRecord[c.fieldName] !== undefined ? this.currentRecord[c.fieldName] : null
                };
            });
    }

    get currentIdx() {
        return this.currentIndex + 1;
    }

    get totalCount() {
        return this.failedRecords.length;
    }

    handleClose() {
        this.isOpen = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleSkip() {
        this.nextRecord();
    }

    handleSuccess(event) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Record saved successfully.',
            variant: 'success'
        }));
        
        // Notify parent to remove this draft
        this.dispatchEvent(new CustomEvent('recordsolved', {
            detail: { draftId: this.currentRecord.Id }
        }));

        this.nextRecord();
    }

    handleError(event) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error Saving Record',
            message: event.detail.detail || 'Please check the form for errors.',
            variant: 'error'
        }));
    }

    nextRecord() {
        this.currentIndex++;
        if (this.currentIndex >= this.failedRecords.length) {
            this.isOpen = false;
            this.dispatchEvent(new CustomEvent('complete'));
        }
    }
}
