import { LightningElement, api, track } from "lwc";
import getViews from "@salesforce/apex/SmartGridController.getViews";
import saveView from "@salesforce/apex/SmartGridController.saveView";
import deleteView from "@salesforce/apex/SmartGridController.deleteView";

export default class SmartGridViewSelector extends LightningElement {
  @api objectApiName;
  @api currentConfig;

  @track views = [];
  @track historyViews = [];
  @track selectedViewId = "";
  @track showSaveModal = false;
  @track newViewName = "";
  @track newViewIsDefault = false;
  @track isLoading = false;

  connectedCallback() {
    this.loadViews();
  }

  get viewOptions() {
    const options = [{ label: "Default / Unsaved View", value: "" }];

    if (this.views && this.views.length > 0) {
      this.views.forEach((v) => {
        const star = v.Is_Default__c ? " ★" : "";
        options.push({
          label: `${v.View_Name__c}${star}`,
          value: v.Id
        });
      });
    }

    if (this.historyViews && this.historyViews.length > 0) {
      this.historyViews.forEach((h, idx) => {
        const timeStr = h.Last_Used__c
          ? new Date(h.Last_Used__c).toLocaleTimeString()
          : `Session ${idx + 1}`;
        options.push({
          label: `[History] ${timeStr}`,
          value: h.Id
        });
      });
    }

    return options;
  }

  @api
  async loadViews() {
    if (!this.objectApiName) return;
    this.isLoading = true;
    try {
      const records = await getViews({ objectApiName: this.objectApiName });
      const userViews = [];
      const histViews = [];
      let defaultView = null;

      (records || []).forEach((v) => {
        if (v.View_Name__c && v.View_Name__c.startsWith("__history_")) {
          histViews.push(v);
        } else {
          userViews.push(v);
          if (v.Is_Default__c) {
            defaultView = v;
          }
        }
      });

      this.views = userViews;
      this.historyViews = histViews;

      // Auto-load default view on init (AC-09-4)
      if (!this.selectedViewId && defaultView) {
        this.selectedViewId = defaultView.Id;
        this.emitViewSelect(defaultView);
      }
    } catch {
      // Non-blocking error
    } finally {
      this.isLoading = false;
    }
  }

  @api
  handleViewChange(event) {
    const viewId = event.detail.value;
    this.selectedViewId = viewId;

    if (!viewId) {
      this.dispatchEvent(new CustomEvent("resetview"));
      return;
    }

    const allViews = [...this.views, ...this.historyViews];
    const match = allViews.find((v) => v.Id === viewId);
    if (match) {
      this.emitViewSelect(match);
    }
  }

  emitViewSelect(viewRecord) {
    let config = null;
    if (viewRecord.View_Config_JSON__c) {
      try {
        config = JSON.parse(viewRecord.View_Config_JSON__c);
      } catch {
        config = null;
      }
    }
    this.dispatchEvent(
      new CustomEvent("viewselect", {
        detail: {
          viewId: viewRecord.Id,
          viewName: viewRecord.View_Name__c,
          isDefault: viewRecord.Is_Default__c,
          config: config
        }
      })
    );
  }

  @api
  handleOpenSaveModal() {
    this.newViewName = "";
    this.newViewIsDefault = false;
    this.showSaveModal = true;
  }

  @api
  handleCloseSaveModal() {
    this.showSaveModal = false;
  }

  handleNameChange(event) {
    this.newViewName = event.target.value;
  }

  handleDefaultChange(event) {
    this.newViewIsDefault = event.target.checked;
  }

  @api
  async saveNewView(name, isDefault) {
    this.newViewName = name;
    this.newViewIsDefault = isDefault;
    await this.handleSaveView();
  }

  @api
  async handleSaveView() {
    if (!this.newViewName || !this.newViewName.trim()) {
      return;
    }
    this.isLoading = true;
    try {
      const configStr = this.currentConfig
        ? JSON.stringify(this.currentConfig)
        : "{}";
      const saved = await saveView({
        viewId: null,
        viewName: this.newViewName.trim(),
        objectApiName: this.objectApiName,
        configJson: configStr,
        isDefault: this.newViewIsDefault
      });

      this.showSaveModal = false;
      await this.loadViews();
      if (saved && saved.Id) {
        this.selectedViewId = saved.Id;
      }
    } catch {
      // Error handling
    } finally {
      this.isLoading = false;
    }
  }

  @api
  async handleDeleteSelectedView() {
    if (!this.selectedViewId) return;
    this.isLoading = true;
    try {
      await deleteView({ viewId: this.selectedViewId });
      this.selectedViewId = "";
      await this.loadViews();
      this.dispatchEvent(new CustomEvent("resetview"));
    } catch {
      // Error handling
    } finally {
      this.isLoading = false;
    }
  }
}
