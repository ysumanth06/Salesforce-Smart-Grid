import { LightningElement, track } from "lwc";
import getObjectFields from "@salesforce/apex/SmartGridController.getObjectFields";
import deployGridConfig from "@salesforce/apex/SmartGridMetadataDeployer.deployGridConfig";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

const STANDARD_OBJECTS = [
  { label: "Account", value: "Account" },
  { label: "Contact", value: "Contact" },
  { label: "Opportunity", value: "Opportunity" },
  { label: "Lead", value: "Lead" },
  { label: "Case", value: "Case" }
];

export default class SmartGridAdminStudio extends LightningElement {
  @track selectedObject = "Account";
  @track gridDevName = "Custom_Account_Grid";
  @track gridLabel = "Custom Account Grid";
  @track availableFields = [];
  @track selectedFields = ["Name", "Industry", "AnnualRevenue"];
  @track enableAddRow = true;
  @track enableDelete = true;
  @track enableExport = true;
  @track enableFilters = true;
  @track enableTranspose = true;
  @track isLoading = false;

  get objectOptions() {
    return STANDARD_OBJECTS;
  }

  get fieldOptions() {
    return (this.availableFields || []).map((f) => ({
      label: `${f.label || f.fieldName} (${f.fieldName})`,
      value: f.fieldName
    }));
  }

  get disableDeploy() {
    return (
      !this.gridDevName ||
      !this.selectedObject ||
      !this.selectedFields ||
      this.selectedFields.length === 0 ||
      this.isLoading
    );
  }

  connectedCallback() {
    this.fetchFieldsForObject(this.selectedObject);
  }

  async fetchFieldsForObject(objName) {
    this.isLoading = true;
    try {
      const fields = await getObjectFields({ objectApiName: objName });
      this.availableFields = fields || [];
    } catch {
      this.availableFields = [];
    } finally {
      this.isLoading = false;
    }
  }

  handleObjectChange(event) {
    this.selectedObject = event.detail.value;
    this.gridDevName = `Custom_${this.selectedObject}_Grid`;
    this.gridLabel = `Custom ${this.selectedObject} Grid`;
    this.selectedFields = [];
    this.fetchFieldsForObject(this.selectedObject);
  }

  handleDevNameChange(event) {
    this.gridDevName = event.detail.value;
  }

  handleLabelChange(event) {
    this.gridLabel = event.detail.value;
  }

  handleColumnsChange(event) {
    this.selectedFields = event.detail.value;
  }

  handleToggleAddRow(event) {
    this.enableAddRow = event.target.checked;
  }

  handleToggleDelete(event) {
    this.enableDelete = event.target.checked;
  }

  handleToggleExport(event) {
    this.enableExport = event.target.checked;
  }

  handleToggleFilters(event) {
    this.enableFilters = event.target.checked;
  }

  handleToggleTranspose(event) {
    this.enableTranspose = event.target.checked;
  }

  async handleDeploy() {
    if (this.disableDeploy) return;

    this.isLoading = true;

    const columnPayloads = this.selectedFields.map((fieldApi, idx) => {
      const match =
        this.availableFields.find((f) => f.fieldName === fieldApi) || {};
      return {
        fieldApiName: fieldApi,
        displayLabel: match.label || fieldApi,
        order: idx + 1,
        isEditable: true,
        isSortable: true,
        columnWidth: 150
      };
    });

    const deployRequest = {
      configDeveloperName: this.gridDevName,
      masterLabel: this.gridLabel,
      objectApiName: this.selectedObject,
      enableAddRow: this.enableAddRow,
      enableDelete: this.enableDelete,
      enableExport: this.enableExport,
      enableFilters: this.enableFilters,
      enableTranspose: this.enableTranspose,
      columns: columnPayloads
    };

    try {
      const result = await deployGridConfig({ request: deployRequest });
      if (result.isSuccess) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Deployment Enqueued",
            message: `Grid configuration ${this.gridDevName} deployment enqueued successfully. Job ID: ${result.deploymentJobId}`,
            variant: "success"
          })
        );
      } else {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Deployment Failed",
            message: result.errorMessage,
            variant: "error"
          })
        );
      }
    } catch (err) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Deployment Error",
          message: err.body ? err.body.message : err.message,
          variant: "error"
        })
      );
    } finally {
      this.isLoading = false;
    }
  }
}
