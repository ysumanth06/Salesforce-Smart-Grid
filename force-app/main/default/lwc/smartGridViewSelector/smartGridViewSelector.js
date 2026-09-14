import { LightningElement, api, track } from "lwc";
import getViews from "@salesforce/apex/SmartGridController.getViews";
import saveView from "@salesforce/apex/SmartGridController.saveView";
import deleteView from "@salesforce/apex/SmartGridController.deleteView";

function normalizeConfig(config) {
  if (!config) return "{}";
  const normalized = {
    columns: Array.isArray(config.columns) ? [...config.columns].sort() : [],
    sortField: config.sortField || null,
    sortDirection: config.sortDirection || "asc",
    filterExpression: config.filterExpression || null,
    pinnedColumn: config.pinnedColumn || null
  };
  return JSON.stringify(normalized);
}

export default class SmartGridViewSelector extends LightningElement {
  @api objectApiName;
  @api currentConfig;

  @track views = [];
  @track historyViews = [];
  @track _selectedViewId = "";
  @track showSaveModal = false;
  @track _newViewName = "";
  @track newViewIsDefault = false;
  @track isLoading = false;

  loadedViewConfig = null;
  loadedViewRecord = null;

  @api
  get selectedViewId() {
    return this._selectedViewId;
  }
  set selectedViewId(val) {
    this._selectedViewId = val;
  }

  @api
  get newViewName() {
    return this._newViewName;
  }
  set newViewName(val) {
    this._newViewName = val;
  }

  connectedCallback() {
    this.loadViews();
  }

  @api
  get isModified() {
    if (!this.selectedViewId || !this.loadedViewConfig) {
      return false;
    }
    return (
      normalizeConfig(this.currentConfig) !==
      normalizeConfig(this.loadedViewConfig)
    );
  }

  get viewOptions() {
    const options = [{ label: "Default / Unsaved View", value: "" }];

    if (this.views && this.views.length > 0) {
      this.views.forEach((v) => {
        const star = v.Is_Default__c ? " ★" : "";
        const mod =
          v.Id === this.selectedViewId && this.isModified ? " (Modified)" : "";
        options.push({
          label: `${v.View_Name__c}${star}${mod}`,
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
  get isUpdateDisabled() {
    return !this.selectedViewId || !this.isModified || this.isLoading;
  }

  @api
  get isRevertDisabled() {
    return !this.isModified || this.isLoading;
  }

  get canDelete() {
    return Boolean(this.selectedViewId);
  }

  get isQuickSaveDisabled() {
    return this.isLoading;
  }

  get saveButtonTitle() {
    return this.isModified && this.selectedViewId
      ? "Update Current View"
      : "Save View";
  }

  get saveButtonVariant() {
    return this.isModified && this.selectedViewId ? "brand" : "border-filled";
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
        this._selectedViewId = defaultView.Id;
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
    this._selectedViewId = viewId;

    if (!viewId) {
      this.loadedViewRecord = null;
      this.loadedViewConfig = null;
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
    if (viewRecord && viewRecord.View_Config_JSON__c) {
      try {
        config = JSON.parse(viewRecord.View_Config_JSON__c);
      } catch {
        config = null;
      }
    }
    this.loadedViewRecord = viewRecord;
    this.loadedViewConfig = config;
    this.dispatchEvent(
      new CustomEvent("viewselect", {
        detail: {
          viewId: viewRecord ? viewRecord.Id : "",
          viewName: viewRecord ? viewRecord.View_Name__c : "",
          isDefault: viewRecord ? viewRecord.Is_Default__c : false,
          config: config
        }
      })
    );
  }

  handleQuickSave() {
    if (this.isModified && this.selectedViewId) {
      this.handleUpdateCurrentView();
    } else {
      this.handleOpenSaveModal();
    }
  }

  @api
  async handleUpdateCurrentView() {
    if (!this.selectedViewId) return;
    const viewRecord = this.views.find((v) => v.Id === this.selectedViewId);
    if (!viewRecord) return;

    this.isLoading = true;
    try {
      const configStr = this.currentConfig
        ? JSON.stringify(this.currentConfig)
        : "{}";
      const updated = await saveView({
        viewId: this.selectedViewId,
        viewName: viewRecord.View_Name__c,
        objectApiName: this.objectApiName,
        configJson: configStr,
        isDefault: viewRecord.Is_Default__c || false
      });

      this.loadedViewConfig = this.currentConfig
        ? JSON.parse(JSON.stringify(this.currentConfig))
        : {};
      if (updated) {
        this.loadedViewRecord = updated;
      }
      await this.loadViews();
    } catch {
      // Error handling
    } finally {
      this.isLoading = false;
    }
  }

  @api
  handleOpenSaveModal() {
    const selected = this.views.find((v) => v.Id === this.selectedViewId);
    this._newViewName = selected ? `Copy of ${selected.View_Name__c}` : "";
    this.newViewIsDefault = false;
    this.showSaveModal = true;
  }

  @api
  handleCloseSaveModal() {
    this.showSaveModal = false;
  }

  handleNameChange(event) {
    this._newViewName = event.target.value;
  }

  handleDefaultChange(event) {
    this.newViewIsDefault = event.target.checked;
  }

  @api
  handleRevertChanges() {
    if (this.selectedViewId && this.loadedViewRecord) {
      this.emitViewSelect(this.loadedViewRecord);
    } else {
      this.dispatchEvent(new CustomEvent("resetview"));
    }
  }

  @api
  async saveNewView(name, isDefault) {
    this._newViewName = name;
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
      this.loadedViewConfig = this.currentConfig
        ? JSON.parse(JSON.stringify(this.currentConfig))
        : {};
      this.loadedViewRecord = saved;
      await this.loadViews();
      if (saved && saved.Id) {
        this._selectedViewId = saved.Id;
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
      this._selectedViewId = "";
      this.loadedViewRecord = null;
      this.loadedViewConfig = null;
      await this.loadViews();
      this.dispatchEvent(new CustomEvent("resetview"));
    } catch {
      // Error handling
    } finally {
      this.isLoading = false;
    }
  }
}
