import { LightningElement, api, track } from "lwc";
import processPrompt from "@salesforce/apex/SmartGridNLPEngine.processPrompt";

const RECENT_STORAGE_KEY = "smartgrid_recent_prompts";

export default class SmartGridCommandPalette extends LightningElement {
  @api objectApiName = "Account";
  @api availableFields = [];
  @api configDevName = "";
  _isOpen = false;

  @api
  get isOpen() {
    return this._isOpen;
  }
  set isOpen(val) {
    this._isOpen = Boolean(val);
  }

  @track promptText = "";
  @track isLoading = false;
  @track errorMessage = "";
  @track translationResult = null;
  @track recentPrompts = [];

  _boundGlobalKeyHandler = null;

  connectedCallback() {
    this.loadRecentPrompts();
    this._boundGlobalKeyHandler = this.handleGlobalKeyDown.bind(this);
    window.addEventListener("keydown", this._boundGlobalKeyHandler);
  }

  disconnectedCallback() {
    if (this._boundGlobalKeyHandler) {
      window.removeEventListener("keydown", this._boundGlobalKeyHandler);
    }
  }

  handleGlobalKeyDown(event) {
    // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      this.openModal();
    }
  }

  @api
  openModal() {
    this._isOpen = true;
    this.errorMessage = "";
    this.translationResult = null;
    this.loadRecentPrompts();
  }

  @api
  closeModal() {
    this._isOpen = false;
    this.promptText = "";
    this.errorMessage = "";
    this.translationResult = null;
    this.dispatchEvent(new CustomEvent("close"));
  }

  get computedPlaceholder() {
    return `Ask AI anything (e.g., "Show high revenue accounts in CA" or "Sort by Rating")...`;
  }

  get hasResult() {
    return this.translationResult && this.translationResult.isSuccess;
  }

  get resultExplanation() {
    return this.translationResult ? this.translationResult.explanation : "";
  }

  get resultSoql() {
    return this.translationResult ? this.translationResult.generatedSoql : "";
  }

  get resultFilters() {
    if (!this.hasResult || !this.translationResult.filters) {
      return [];
    }
    return this.translationResult.filters.map((f, idx) => ({
      key: `filter-${idx}-${f.field}`,
      ...f
    }));
  }

  get hasResultFilters() {
    return this.resultFilters.length > 0;
  }

  get suggestedPrompts() {
    return [
      "Rating is Hot in California",
      "Accounts with revenue > 1M",
      "Order by AnnualRevenue desc top 15",
      "In Technology industry"
    ];
  }

  get hasRecentPrompts() {
    return this.recentPrompts && this.recentPrompts.length > 0;
  }

  get hasAvailableFields() {
    return this.availableFields && this.availableFields.length > 0;
  }

  handleInputChange(event) {
    this.promptText = event.target.value;
    if (this.errorMessage) {
      this.errorMessage = "";
    }
  }

  handleKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      this.closeModal();
    }
  }

  handleInputKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.executePrompt();
    }
  }

  handleSelectSuggestedPrompt(event) {
    const p = event.currentTarget.dataset.prompt;
    if (p) {
      this.promptText = p;
      this.executePrompt();
    }
  }

  handleFieldTagClick(event) {
    const field = event.currentTarget.dataset.field;
    if (field) {
      this.promptText = (this.promptText ? this.promptText + " " : "") + field;
    }
  }

  handleClearResult() {
    this.translationResult = null;
    this.promptText = "";
  }

  async executePrompt() {
    const text = (this.promptText || "").trim();
    if (!text) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.translationResult = null;

    try {
      const result = await processPrompt({
        prompt: text,
        objectApiName: this.objectApiName || "Account",
        configDevName: this.configDevName || "",
        availableFields:
          this.availableFields && this.availableFields.length > 0
            ? this.availableFields
            : ["Id", "Name"]
      });

      if (result && result.isSuccess) {
        this.translationResult = result;
        this.saveRecentPrompt(text);
      } else {
        this.errorMessage =
          (result && result.errorMessage) ||
          "Could not understand command. Please refine your prompt.";
      }
    } catch (err) {
      this.errorMessage =
        err?.body?.message || err?.message || "Failed to process AI command.";
    } finally {
      this.isLoading = false;
    }
  }

  handleApplyResult() {
    if (!this.hasResult) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("applyfilters", {
        detail: {
          filters: this.translationResult.filters || [],
          explanation: this.translationResult.explanation || "",
          sortField: this.translationResult.sortField || null,
          sortDirection: this.translationResult.sortDirection || null,
          limit: this.translationResult.recordLimit || null,
          soql: this.translationResult.generatedSoql || ""
        }
      })
    );

    this.closeModal();
  }

  loadRecentPrompts() {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      this.recentPrompts = stored ? JSON.parse(stored) : [];
    } catch {
      this.recentPrompts = [];
    }
  }

  saveRecentPrompt(prompt) {
    try {
      let recents = this.recentPrompts ? [...this.recentPrompts] : [];
      recents = recents.filter((p) => p.toLowerCase() !== prompt.toLowerCase());
      recents.unshift(prompt);
      if (recents.length > 5) {
        recents = recents.slice(0, 5);
      }
      this.recentPrompts = recents;
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recents));
    } catch {
      // localStorage may be disabled in some sandboxes
    }
  }
}
