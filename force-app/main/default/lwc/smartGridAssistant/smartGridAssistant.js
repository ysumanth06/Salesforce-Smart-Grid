import { LightningElement, api, track } from "lwc";
import askAssistant from "@salesforce/apex/SmartGridNLPEngine.askAssistant";

export default class SmartGridAssistant extends LightningElement {
  @api objectApiName = "Account";
  @api activeFilters = "";
  @api visibleFields = [];
  @api configDevName = "";
  _isOpen = false;

  @api
  get isOpen() {
    return this._isOpen;
  }
  set isOpen(val) {
    this._isOpen = Boolean(val);
  }

  @track messages = [];
  @track inputText = "";
  @track isThinking = false;

  get isThreadEmpty() {
    return this.messages.length === 0;
  }

  get isSendDisabled() {
    return this.isThinking || !this.inputText || !this.inputText.trim();
  }

  get starterChips() {
    return [
      "What is the total revenue?",
      "What is the average revenue?",
      "How many records are in this view?",
      "Summarize current view"
    ];
  }

  @api
  openDrawer() {
    this._isOpen = true;
  }

  @api
  closeDrawer() {
    this._isOpen = false;
    this.dispatchEvent(new CustomEvent("close"));
  }

  handleClose() {
    this.closeDrawer();
  }

  handleClearHistory() {
    this.messages = [];
  }

  handleInputChange(event) {
    this.inputText = event.target.value;
  }

  handleInputKeyDown(event) {
    if (event.key === "Enter" && !this.isSendDisabled) {
      event.preventDefault();
      this.handleSend();
    }
  }

  handleSelectStarterChip(event) {
    const q = event.currentTarget.dataset.question;
    if (q) {
      this.inputText = q;
      this.handleSend();
    }
  }

  async handleSend() {
    const q = (this.inputText || "").trim();
    if (!q || this.isThinking) return;

    const userMsgId = `msg-user-${Date.now()}`;
    const recentHistory = this.messages.slice(-4).map((m) => ({
      isAssistant: m.isAssistant,
      text: m.text
    }));

    this.messages = [
      ...this.messages,
      {
        id: userMsgId,
        text: q,
        isAssistant: false,
        containerClass: "msg-row user-row"
      }
    ];

    this.inputText = "";
    this.isThinking = true;

    try {
      const res = await askAssistant({
        question: q,
        objectApiName: this.objectApiName || "Account",
        activeFilters: this.activeFilters || "",
        visibleFields:
          this.visibleFields && this.visibleFields.length > 0
            ? this.visibleFields
            : ["Id", "Name", "AnnualRevenue"],
        configDevName: this.configDevName || "",
        historyJson: JSON.stringify(recentHistory)
      });

      const assistantText =
        res && res.isSuccess
          ? res.answer
          : res?.errorMessage || "I encountered an issue computing the answer.";

      const actions = (res && res.actions) || [];

      this.messages = [
        ...this.messages,
        {
          id: `msg-ai-${Date.now()}`,
          text: assistantText,
          isAssistant: true,
          actions: actions,
          hasActions: actions.length > 0,
          containerClass: "msg-row assistant-row"
        }
      ];
    } catch (err) {
      this.messages = [
        ...this.messages,
        {
          id: `msg-err-${Date.now()}`,
          text:
            err?.body?.message ||
            err?.message ||
            "Unable to connect to AI assistant.",
          isAssistant: true,
          actions: [],
          hasActions: false,
          containerClass: "msg-row assistant-row"
        }
      ];
    } finally {
      this.isThinking = false;
      this.scrollToBottom();
    }
  }

  handleActionClick(event) {
    const actionType = event.currentTarget.dataset.actionType;
    const payload = event.currentTarget.dataset.payload;
    const label = event.currentTarget.dataset.label;

    this.dispatchEvent(
      new CustomEvent("assistantaction", {
        detail: {
          actionType,
          payload,
          label
        }
      })
    );
  }

  scrollToBottom() {
    Promise.resolve().then(() => {
      const thread = this.template.querySelector('[data-testid="chat-thread"]');
      if (thread) {
        thread.scrollTop = thread.scrollHeight;
      }
    });
  }
}
