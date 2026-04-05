import { createElement } from 'lwc';
import SmartGridFieldPicker from 'c/smartGridFieldPicker';
import getObjectFields from '@salesforce/apex/SmartGridController.getObjectFields';

// Mock Apex method
jest.mock(
    '@salesforce/apex/SmartGridController.getObjectFields',
    () => ({ default: jest.fn() }),
    { virtual: true }
);

const MOCK_FIELDS = [
    { fieldApiName: 'Name', label: 'Account Name', type: 'STRING', isUpdateable: true },
    { fieldApiName: 'Industry', label: 'Industry', type: 'PICKLIST', isUpdateable: true },
    { fieldApiName: 'Phone', label: 'Phone', type: 'PHONE', isUpdateable: true },
    { fieldApiName: 'Id', label: 'Record ID', type: 'ID', isUpdateable: false }
];

describe('c-smart-grid-field-picker', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    function createComponent(props = {}) {
        const element = createElement('c-smart-grid-field-picker', {
            is: SmartGridFieldPicker
        });
        Object.assign(element, props);
        document.body.appendChild(element);
        return element;
    }

    async function flushPromises() {
        return Promise.resolve();
    }

    // ─── Positive Tests ───

    it('renders modal when opened programmatically', async () => {
        getObjectFields.mockResolvedValue(MOCK_FIELDS);

        const element = createComponent({ objectApiName: 'Account' });
        element.open();
        await flushPromises();

        const modal = element.shadowRoot.querySelector('section[role="dialog"]');
        expect(modal).not.toBeNull();
    });

    it('loads and displays accessible fields in dual-listbox', async () => {
        getObjectFields.mockResolvedValue(MOCK_FIELDS);

        const element = createComponent({ objectApiName: 'Account' });
        element.open();
        await flushPromises();

        const dualListbox = element.shadowRoot.querySelector('lightning-dual-listbox');
        expect(dualListbox).not.toBeNull();
        expect(dualListbox.options.length).toBe(MOCK_FIELDS.length);
    });

    it('dispatches fieldselection event when Apply is clicked', async () => {
        getObjectFields.mockResolvedValue(MOCK_FIELDS);

        const element = createComponent({ objectApiName: 'Account' });
        element.open();
        await flushPromises();

        // Simulate selecting fields via dual-listbox
        const dualListbox = element.shadowRoot.querySelector('lightning-dual-listbox');
        dualListbox.dispatchEvent(
            new CustomEvent('change', { detail: { value: ['Name', 'Phone'] } })
        );
        await flushPromises();

        // Listen for event
        const handler = jest.fn();
        element.addEventListener('fieldselection', handler);

        // Click Apply
        const applyButton = element.shadowRoot.querySelector('button.slds-button_brand');
        applyButton.click();
        await flushPromises();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail.fields).toEqual(['Name', 'Phone']);
        expect(handler.mock.calls[0][0].detail.columns).toHaveLength(2);
    });

    it('does not render modal when closed', async () => {
        const element = createComponent({ objectApiName: 'Account' });
        await flushPromises();

        const modal = element.shadowRoot.querySelector('section[role="dialog"]');
        expect(modal).toBeNull();
    });

    it('closes modal when Cancel is clicked', async () => {
        getObjectFields.mockResolvedValue(MOCK_FIELDS);

        const element = createComponent({ objectApiName: 'Account' });
        element.open();
        await flushPromises();

        const handler = jest.fn();
        element.addEventListener('pickerclosed', handler);

        const cancelButton = element.shadowRoot.querySelector('button.slds-button_neutral');
        cancelButton.click();
        await flushPromises();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // ─── Negative Tests ───

    it('shows error when no objectApiName is provided', async () => {
        const element = createComponent({});
        element.open();
        await flushPromises();

        const errorBlock = element.shadowRoot.querySelector('.slds-notify_alert');
        expect(errorBlock).not.toBeNull();
        expect(errorBlock.textContent).toContain('No object API name');
    });

    it('shows error when Apply is clicked with no fields selected', async () => {
        getObjectFields.mockResolvedValue(MOCK_FIELDS);

        const element = createComponent({ objectApiName: 'Account' });
        element.open();
        await flushPromises();

        // Don't select any fields, just click Apply
        const applyButton = element.shadowRoot.querySelector('button.slds-button_brand');
        applyButton.click();
        await flushPromises();

        const errorBlock = element.shadowRoot.querySelector('.slds-notify_alert');
        expect(errorBlock).not.toBeNull();
        expect(errorBlock.textContent).toContain('select at least one field');
    });

    it('handles Apex error gracefully', async () => {
        getObjectFields.mockRejectedValue({ body: { message: 'Apex error occurred' } });

        const element = createComponent({ objectApiName: 'BadObject' });
        element.open();
        await flushPromises();

        const errorBlock = element.shadowRoot.querySelector('.slds-notify_alert');
        expect(errorBlock).not.toBeNull();
        expect(errorBlock.textContent).toContain('Apex error occurred');
    });

    // ─── API Contract Tests ───

    it('accepts pre-selected fields via selectedFields api', async () => {
        getObjectFields.mockResolvedValue(MOCK_FIELDS);

        const element = createComponent({
            objectApiName: 'Account',
            selectedFields: ['Name', 'Industry']
        });
        element.open();
        await flushPromises();

        const dualListbox = element.shadowRoot.querySelector('lightning-dual-listbox');
        expect(dualListbox.value).toEqual(['Name', 'Industry']);
    });

    it('close() api method hides the modal', async () => {
        getObjectFields.mockResolvedValue(MOCK_FIELDS);

        const element = createComponent({ objectApiName: 'Account' });
        element.open();
        await flushPromises();

        let modal = element.shadowRoot.querySelector('section[role="dialog"]');
        expect(modal).not.toBeNull();

        element.close();
        await flushPromises();

        modal = element.shadowRoot.querySelector('section[role="dialog"]');
        expect(modal).toBeNull();
    });
});
