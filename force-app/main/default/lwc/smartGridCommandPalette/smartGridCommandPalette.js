import { LightningElement, api, track } from "lwc";
import processPrompt from "@salesforce/apex/SmartGridNLPEngine.processPrompt";
import previewDML from "@salesforce/apex/SmartGridNLPDMLHandler.previewDML";
import askAssistant from "@salesforce/apex/SmartGridNLPEngine.askAssistant";

const RECENT_STORAGE_KEY = "smartgrid_recent_prompts";

export default class SmartGridCommandPalette extends LightningElement {
  @api objectApiName = "Account";
  @api availableFields = [];
  @api configDevName = "";
  @api selectedRecordIds = [];
  @api activeFilters = "";
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
  @track dmlPreviewResult = null;
  @track aiAnswer = null;
  @track aiActionChips = [];
  @track copySuccess = false;
  @track conversationHistory = [];
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
    this.dmlPreviewResult = null;
    this.aiAnswer = null;
    this.aiActionChips = [];
    this.copySuccess = false;
    this.loadRecentPrompts();
  }

  @api
  closeModal() {
    this._isOpen = false;
    this.promptText = "";
    this.errorMessage = "";
    this.translationResult = null;
    this.dmlPreviewResult = null;
    this.aiAnswer = null;
    this.aiActionChips = [];
    this.copySuccess = false;
    this.dispatchEvent(new CustomEvent("close"));
  }

  get computedPlaceholder() {
    return "Ask AI a question or type a command...";
  }

  get hasAiAnswer() {
    return Boolean(this.aiAnswer);
  }

  get hasActionChips() {
    return this.aiActionChips && this.aiActionChips.length > 0;
  }

  get copyIconName() {
    return this.copySuccess ? "utility:check" : "utility:copy";
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

  get hasDmlPreview() {
    return Boolean(this.dmlPreviewResult && this.dmlPreviewResult.isSuccess);
  }

  get dmlExplanation() {
    return this.dmlPreviewResult ? this.dmlPreviewResult.explanation : "";
  }

  get dmlOperation() {
    return this.dmlPreviewResult ? this.dmlPreviewResult.operation : "UPDATE";
  }

  get dmlBadgeClass() {
    return this.dmlOperation === "DELETE"
      ? "slds-badge slds-theme_error"
      : "slds-badge slds-theme_brand";
  }

  get dmlTargetObject() {
    return this.dmlPreviewResult
      ? this.dmlPreviewResult.targetObject
      : this.objectApiName;
  }

  get dmlTotalAffected() {
    return this.dmlPreviewResult
      ? this.dmlPreviewResult.totalAffectedRecords
      : 0;
  }

  get dmlPreviewRows() {
    return (this.dmlPreviewResult && this.dmlPreviewResult.previewRows) || [];
  }

  get hasDmlDiffs() {
    return this.dmlPreviewRows.length > 0;
  }

  get suggestedPrompts() {
    return [
      "What is the total revenue?",
      "Summarize current view",
      "Transpose selected records",
      "Accounts with revenue > 1M",
      "Order by AnnualRevenue desc top 15",
      "Group by Industry"
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
    this.dmlPreviewResult = null;
    this.aiAnswer = null;
    this.aiActionChips = [];
    this.promptText = "";
    this.copySuccess = false;
  }

  async handleCopyAnswer() {
    if (!this.aiAnswer) return;
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(this.aiAnswer);
        this.copySuccess = true;
      }
    } catch {
      // clipboard fallback
    }
  }

  handleActionChipClick(event) {
    const actionType = event.currentTarget.dataset.actionType;
    const payload = event.currentTarget.dataset.payload;
    const label = event.currentTarget.dataset.label;

    this.dispatchEvent(
      new CustomEvent("assistantaction", {
        detail: { actionType, payload, label }
      })
    );
    this.closeModal();
  }

  async executePrompt() {
    const text = (this.promptText || "").trim();
    if (!text) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.translationResult = null;
    this.dmlPreviewResult = null;
    this.aiAnswer = null;
    this.aiActionChips = [];

    // Direct Workflow Command Matchers
    if (/\btranspose\b/i.test(text)) {
      this.translationResult = {
        isSuccess: true,
        action: "transpose",
        explanation: "Switch grid to Transpose Matrix view"
      };
      this.saveRecentPrompt(text);
      this.isLoading = false;
      return;
    }

    const groupMatch = text.match(/\bgroup\s+by\s+(.+)/i);
    if (groupMatch) {
      const rawFields = groupMatch[1]
        .split(/,| and /i)
        .map((s) => s.trim())
        .filter(Boolean);
      this.translationResult = {
        isSuccess: true,
        action: "group",
        groupFields: rawFields,
        explanation: `Group records by ${rawFields.join(", ")}`
      };
      this.saveRecentPrompt(text);
      this.isLoading = false;
      return;
    }

    if (/\b(show\s+chart|open\s+chart|chart\s+panel|analytics)\b/i.test(text)) {
      this.translationResult = {
        isSuccess: true,
        action: "chart",
        explanation: "Open Analytics and Chart Drawer"
      };
      this.saveRecentPrompt(text);
      this.isLoading = false;
      return;
    }

    // Natural Language DML Updates & Deletes
    const isDml = /^(set|update|mark|change|delete|remove)\b/i.test(text);
    if (isDml) {
      try {
        const dmlRes = await previewDML({
          prompt: text,
          objectApiName: this.objectApiName || "Account",
          selectedRecordIds: this.selectedRecordIds || [],
          activeFilterJson: this.activeFilters || ""
        });
        if (dmlRes && dmlRes.isSuccess) {
          this.dmlPreviewResult = dmlRes;
          this.saveRecentPrompt(text);
        } else {
          this.errorMessage =
            (dmlRes && dmlRes.errorMessage) ||
            "Could not process DML instruction. Please specify field and value.";
        }
      } catch (err) {
        this.errorMessage =
          err?.body?.message || err?.message || "Failed to preview DML.";
      } finally {
        this.isLoading = false;
      }
      return;
    }

    // Question & Conversational Analytical Inquiries
    const isQuestion =
      /^(what|how|why|who|when|where|summarize|explain|tell|is there|are there|calculate|count|average|total|sum|give me|show me)\b/i.test(
        text
      ) || /\?$/.test(text);

    if (isQuestion) {
      try {
        const recentHistory = (this.conversationHistory || [])
          .slice(-4)
          .map((m) => ({
            isAssistant: m.isAssistant,
            text: m.text
          }));

        const res = await askAssistant({
          question: text,
          objectApiName: this.objectApiName || "Account",
          activeFilterJson: this.activeFilters || "",
          historyJson: JSON.stringify(recentHistory),
          configDevName: this.configDevName || ""
        });

        if (res && res.isSuccess) {
          this.aiAnswer = res.answer;
          this.aiActionChips = res.suggestedActions || [];
          this.conversationHistory = [
            ...this.conversationHistory,
            { text, isAssistant: false },
            { text: res.answer, isAssistant: true }
          ];
          this.saveRecentPrompt(text);
        } else {
          this.errorMessage =
            (res && res.errorMessage) ||
            "Could not process question. Please try rephrasing.";
        }
      } catch (err) {
        this.errorMessage =
          err?.body?.message || err?.message || "Failed to get AI answer.";
      } finally {
        this.isLoading = false;
      }
      return;
    }

    // Default: Structured Filter/Sort Query with fallback to conversational AI
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
        // Fallback to conversational question routing
        const res = await askAssistant({
          question: text,
          objectApiName: this.objectApiName || "Account",
          activeFilterJson: this.activeFilters || "",
          historyJson: "[]",
          configDevName: this.configDevName || ""
        });
        if (res && res.isSuccess) {
          this.aiAnswer = res.answer;
          this.aiActionChips = res.suggestedActions || [];
          this.saveRecentPrompt(text);
        } else {
          this.errorMessage =
            (result && result.errorMessage) ||
            "Could not understand command. Please refine your prompt.";
        }
      }
    } catch (err) {
      this.errorMessage =
        err?.body?.message || err?.message || "Failed to process AI command.";
    } finally {
      this.isLoading = false;
    }
  }

  handleApplyDml() {
    if (!this.hasDmlPreview) return;
    this.dispatchEvent(
      new CustomEvent("applydml", {
        detail: {
          ...this.dmlPreviewResult
        }
      })
    );
    this.closeModal();
  }

  handleApplyResult() {
    if (!this.hasResult) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("applyfilters", {
        detail: {
          action: this.translationResult.action || null,
          groupFields: this.translationResult.groupFields || null,
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
