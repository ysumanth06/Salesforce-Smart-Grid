import { LightningElement, api, track } from "lwc";

const ONBOARDING_STORAGE_KEY = "smartgrid_onboarding_dismissed";

const STEPS = [
  {
    title: "Welcome to AI Smart Grid",
    subtitle: "Enterprise Data Management with Generative AI",
    icon: "utility:einstein",
    description:
      "Transform your Salesforce data workflows with spreadsheet-speed inline editing, instant calculations, and generative AI assistance.",
    highlights: [
      "Inline multi-row editing with Undo (Ctrl+Z) & Redo (Ctrl+Y)",
      "Dynamic Excel spreadsheet export (.xls & .csv)",
      "In-place column filtering, sorting, and pinning"
    ]
  },
  {
    title: "AI Command Palette (Cmd+K)",
    subtitle: "Natural Language Filtering & Search",
    icon: "utility:sparkles",
    description:
      "Press Cmd+K (Mac) or Ctrl+K (Windows) at any time to open the Command Palette. Type what you are looking for in plain English.",
    highlights: [
      "Translates natural language to secure, parameterized SOQL",
      "Interactive filter chips show exactly what criteria were applied",
      "Instant client-side evaluation for common patterns"
    ]
  },
  {
    title: "Data Quality & Duplicates",
    subtitle: "Automated Dataset Health Inspection",
    icon: "utility:heart",
    description:
      "Inspect your active grid records for duplicates, null value spikes, and statistical outliers with zero performance lag.",
    highlights: [
      "Database-level duplicate detection on names, emails, and states",
      "Missing data warnings when fields drop below 70% completeness",
      "One-click 'Filter Grid' to review and resolve flagged records"
    ]
  },
  {
    title: "Conversational Analytics",
    subtitle: "Ask Live Questions About Your Data",
    icon: "utility:chat",
    description:
      "Open the AI Assistant drawer from the toolbar to compute totals, calculate averages, and uncover trends in real time.",
    highlights: [
      "Aggregate computations across active filter criteria",
      "One-click starter chips for instant business summaries",
      "Fully compliant with Salesforce field-level security"
    ]
  }
];

export default class SmartGridOnboarding extends LightningElement {
  _isOpen = false;

  @api
  get isOpen() {
    return this._isOpen;
  }
  set isOpen(val) {
    this._isOpen = Boolean(val);
  }

  @track currentStepIndex = 0;
  @track dontShowAgain = false;

  get totalSteps() {
    return STEPS.length;
  }

  get currentStepNumber() {
    return this.currentStepIndex + 1;
  }

  get currentStep() {
    return STEPS[this.currentStepIndex] || STEPS[0];
  }

  get hasPrevious() {
    return this.currentStepIndex > 0;
  }

  get hasNext() {
    return this.currentStepIndex < STEPS.length - 1;
  }

  handleNext() {
    if (this.hasNext) {
      this.currentStepIndex++;
    }
  }

  handlePrevious() {
    if (this.hasPrevious) {
      this.currentStepIndex--;
    }
  }

  handleDontShowChange(event) {
    this.dontShowAgain = event.target.checked;
  }

  handleFinish() {
    this.saveDismissedPreference();
    this.dispatchEvent(
      new CustomEvent("finish", {
        detail: { dontShowAgain: this.dontShowAgain }
      })
    );
    this._isOpen = false;
  }

  handleSkip() {
    this.saveDismissedPreference();
    this.dispatchEvent(
      new CustomEvent("close", {
        detail: { dontShowAgain: this.dontShowAgain }
      })
    );
    this._isOpen = false;
  }

  saveDismissedPreference() {
    if (this.dontShowAgain) {
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      } catch {
        // storage fallback
      }
    }
  }
}
