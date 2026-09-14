import { LightningElement, api, track } from "lwc";
import analyzeDataQuality from "@salesforce/apex/SmartGridDataQualityService.analyzeDataQuality";

export default class SmartGridDataQuality extends LightningElement {
  @api objectApiName = "Account";
  @api availableFields = [];
  _isOpen = false;

  @api
  get isOpen() {
    return this._isOpen;
  }
  set isOpen(val) {
    this._isOpen = Boolean(val);
  }

  @track isLoading = false;
  @track analysis = null;
  @track errorMessage = "";

  connectedCallback() {
    if (this.isOpen) {
      this.loadAnalysis();
    }
  }

  @api
  openDrawer() {
    this._isOpen = true;
    this.loadAnalysis();
  }

  @api
  closeDrawer() {
    this._isOpen = false;
    this.dispatchEvent(new CustomEvent("close"));
  }

  async loadAnalysis() {
    this.isLoading = true;
    this.errorMessage = "";
    try {
      const res = await analyzeDataQuality({
        objectApiName: this.objectApiName || "Account",
        fieldsToAnalyze:
          this.availableFields && this.availableFields.length > 0
            ? this.availableFields
            : ["Name", "BillingState", "AnnualRevenue", "Rating"]
      });

      if (res && res.isSuccess) {
        this.analysis = res;
      } else {
        this.errorMessage =
          res?.errorMessage || "Unable to complete health analysis.";
      }
    } catch (err) {
      this.errorMessage =
        err?.body?.message || err?.message || "Data quality analysis failed.";
    } finally {
      this.isLoading = false;
    }
  }

  get healthScore() {
    return this.analysis ? this.analysis.healthScore : 100;
  }

  get healthStatusLabel() {
    if (this.healthScore >= 80) return "Healthy";
    if (this.healthScore >= 50) return "Needs Attention";
    return "Critical";
  }

  get healthBadgeClass() {
    if (this.healthScore >= 80) return "badge-green";
    if (this.healthScore >= 50) return "badge-amber";
    return "badge-red";
  }

  get progressFillClass() {
    if (this.healthScore >= 80) return "progress-fill-green";
    if (this.healthScore >= 50) return "progress-fill-amber";
    return "progress-fill-red";
  }

  get progressFillStyle() {
    return `width: ${this.healthScore}%;`;
  }

  get totalEvaluated() {
    return this.analysis ? this.analysis.totalRecordsEvaluated : 0;
  }

  get duplicateCount() {
    return this.analysis ? this.analysis.duplicateCount : 0;
  }

  get missingDataCount() {
    return this.analysis ? this.analysis.missingDataCount : 0;
  }

  get hasIssues() {
    return (
      this.analysis && this.analysis.issues && this.analysis.issues.length > 0
    );
  }

  get issuesCount() {
    return this.analysis?.issues?.length || 0;
  }

  get issuesList() {
    if (!this.hasIssues) return [];
    return this.analysis.issues.map((issue, idx) => {
      let severityClass = "badge-amber";
      if (issue.severity === "HIGH") severityClass = "badge-red";
      if (issue.severity === "LOW") severityClass = "badge-green";

      return {
        id: `issue-${idx}-${issue.fieldName}`,
        typeBadgeClass: "type-badge",
        severityBadgeClass: severityClass,
        hasSampleValues: issue.sampleValues && issue.sampleValues.length > 0,
        ...issue
      };
    });
  }

  handleClose() {
    this.closeDrawer();
  }

  handleFilterIssue(event) {
    const fieldName = event.currentTarget.dataset.field;
    const issueType = event.currentTarget.dataset.type;

    this.dispatchEvent(
      new CustomEvent("filterissue", {
        detail: {
          fieldName,
          issueType
        }
      })
    );
    this.closeDrawer();
  }
}
