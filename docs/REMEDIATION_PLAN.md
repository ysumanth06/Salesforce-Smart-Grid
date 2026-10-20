# Salesforce Smart Grid — Remediation & Production Polish Plan

**Author**: Senior Salesforce QA & DevOps Automation Lead  
**Date**: October 2026  
**Status**: APPROVED BY STAKEHOLDER / READY FOR EXECUTION  
**Target Target**: Salesforce Smart Grid v1.0.0 Production GA Sign-off

---

## 1. Executive Summary & Goals

Following stakeholder approval of the QA Audit recommendations, this plan details the step-by-step remediation of **3 strategic architectural requirements**, **5 functional defects (BUG-01 to BUG-05)**, and **4 UI/UX ergonomic enhancements** across Apex domain services, Lightning Web Components, and Salesforce metadata.

### Core Objectives:

1. **Prevent Data Loss & Enforce Safety**: Guard against silent draft destruction on object change; implement smart threshold pre-flight diff confirmation; enforce a strict 24-hour rollback window on CSV imports.
2. **Platform Resilience & Fallbacks**: Enable resilient ConnectApi exception catching and automatic fallback to `Offline_Mock` with UI diagnostic pills when Einstein GenAI credits or templates are absent.
3. **Complete Feature Delivery**: Wire `smartGridImportModal` into the main grid UI and establish the missing `Smart_Grid_Admin_Studio` Custom Tab.
4. **Ergonomic Excellence**: Provide bidirectional analytics panel toggling, clear guidance toasts on Transpose view with $< 2$ records, and accurate draft counter labels on staged additions.
5. **Zero Regression**: Maintain 100% pass rates across Jest unit tests (37+ suites), Apex tests with $\ge 90\%$ code coverage, and 11 Playwright E2E scenarios.

---

## 2. Detailed Remediation Plan by Phase

```mermaid
flowchart TD
    subgraph Phase 1: Apex & Security
        A1[SmartGridImportService: 24h Expiry & Audit Link] --> A2[SmartGridEinsteinAIProvider: Resilient Fallback]
        A2 --> A3[Apex Unit Tests Update]
    end

    subgraph Phase 2: LWC Data Safety
        B1[smartDataGrid: Unsaved Draft Guard on Object Switch] --> B2[smartDataGrid: Adaptive Pre-Flight Diff Threshold]
        B2 --> B3[smartDataGrid: Staged New Row Label Polish]
    end

    subgraph Phase 3: Metadata & Feature Wiring
        C1[smartDataGrid: Mount & Wire smartGridImportModal] --> C2[Create Smart_Grid_Admin_Studio Custom Tab]
        C2 --> C3[Update SmartGrid_Admin Permission Set]
    end

    subgraph Phase 4: UI/UX Ergonomics
        D1[Bidirectional Analytics Panel Toggle] --> D2[Transpose Selection Warning Toast]
        D2 --> D3[AI Fallback UI Indicator & Toolbar Ribbon Polish]
    end

    subgraph Phase 5: Verification & Sign-Off
        E1[LWC Jest Tests: npm test] --> E2[Metadata Deployment & Apex Tests]
        E2 --> E3[Playwright E2E Tests: npm run test:e2e]
        E3 --> E4[Update Documentation & Final Sign-Off]
    end

    Phase 1 --> Phase 2
    Phase 2 --> Phase 3
    Phase 3 --> Phase 4
    Phase 4 --> Phase 5
```

---

### Phase 1: Apex Layer — Architecture, Fallbacks & Data Governance

#### 1.1 `SmartGridImportService.cls` & Expiration Logic

- **Objective**: Implement 24-hour expiration on transactional rollback tokens and record audit metadata.
- **Changes**:
  - Update `rollbackToken` generation to encode creation timestamp or store in static cache / metadata / `Smart_Grid_Edit_Log__c`.
  - In `executeRollback(String rollbackToken, List<Id> recordIds)`:
    - Validate token existence and check creation timestamp.
    - If elapsed time exceeds 86,400 seconds (24 hours), reject execution and return:  
      `"ROLLBACK_EXPIRED: The 24-hour safety rollback window has elapsed. Records are now permanent. Please consult your Salesforce Administrator or use Mass Delete."`
  - Update `SmartGridImportServiceTest.cls` to test valid rollback, expired rollback, and unauthorized deletion attempts.

#### 1.2 `SmartGridEinsteinAIProvider.cls` & `SmartGridNLPEngine.cls` Graceful Fallback

- **Objective**: Ensure Einstein AI never throws unhandled platform exceptions if Generative AI credits are depleted or Prompt Builder templates are missing.
- **Changes**:
  - In `SmartGridEinsteinAIProvider.translateQuery` and `answerQuestion`:
    - Wrap `ConnectApi` calls in explicit `try/catch` catching `ConnectApi.ConnectApiException`, `System.NoAccessException`, and general `Exception`.
    - On catch, log warning to debug log and delegate execution to `SmartGridMockAIProvider`.
    - Set `isFallback = true` and `providerUsed = 'Offline_Mock'` on the returned DTO with human-readable explanation:  
      `"Einstein Generative AI template or credit quota unavailable. Gracefully executed via Smart Grid Heuristic Engine."`
  - In `SmartGridNLPEngine.cls`: Pass through fallback diagnostic flags to client.
  - Update `SmartGridNLPEngineTest.cls` and `SmartGridEinsteinAIProviderTest.cls` to verify 100% coverage on exception fallbacks.

---

### Phase 2: LWC Core Data Safety & Transactional Interception

#### 2.1 BUG-01 Fix: Guard Unsaved Changes on Object Switcher

- **Component**: `smartDataGrid.js` (`handleObjectChange`)
- **Changes**:
  - Check `if (this.hasDrafts)`.
  - Use `LightningConfirm.open()` (with fallback to custom confirmation dialog) to warn:  
    _"You have unsaved changes. Switching objects will discard your pending edits. Are you sure you want to proceed?"_
  - If user cancels:
    - Restore previous object value on `lightning-combobox`.
    - Retain `draftValues` and dirty cell highlights.
  - If user confirms:
    - Discard drafts cleanly and load selected object schema and records.

#### 2.2 BUG-02 Fix: Adaptive Pre-Flight Diff Confirmation Policy

- **Component**: `smartDataGrid.js` (`handleToolbarSave`)
- **Changes**:
  - Introduce `preflightReviewMode` property (`Adaptive_Bulk_Only` [default], `Always_Mandatory`, `Optional`).
  - Calculate modified record count `stats = this.draftStats`.
  - If `(this.preflightReviewMode === 'Always_Mandatory')` OR `(this.preflightReviewMode === 'Adaptive_Bulk_Only' && (stats.totalRecords > 3 || this._fillDownApplied))`:
    - Automatically set `this.showReviewModal = true`.
    - Present before/after visual diff with red strikethrough and green proposed values.
  - Else (micro-edits $\le 3$ records):
    - Proceed directly with 1-click database commit.
  - Maintain the toolbar eye preview icon (`handleOpenReviewModal`) so users can open the modal manually at any time.

#### 2.3 BUG-05 Fix: Staged New Row Label Polish

- **Component**: `smartDataGrid.js` (`draftStats` and `saveButtonLabel`)
- **Changes**:
  - In `draftStats`, accurately account for newly added records (`draft.Id && draft.Id.startsWith('new-')`).
  - If new rows are staged without field edits yet, ensure `totalRecords` reflects the count.
  - Update `saveButtonLabel` to display:
    - `"Save (1 new row)"` or `"Save (X new rows)"` when new rows are added.
    - `"Save (X changes across Y rows)"` when modifying existing rows.

---

### Phase 3: Missing Feature Integrations & Metadata

#### 3.1 BUG-03 Fix: Wire CSV Import Modal into UI

- **Components**: `smartDataGrid.html` and `smartDataGrid.js`
- **Changes**:
  - In `smartDataGrid.html`:
    - Add an "Import CSV" button in the Export/Data actions section of Toolbar Row 2.
    - Mount `<c-smart-grid-import-modal>` conditionally or bound to `showImportModal`.
    - Pass `object-api-name={objectApiName}`, `visible-columns={gridColumns}`.
  - In `smartDataGrid.js`:
    - Add `@track showImportModal = false;`
    - Add `handleOpenImportModal()`, `handleCloseImportModal()`.
    - Add `handleImportComplete(event)`:
      - Display success toast with total records inserted.
      - Close import modal.
      - Refresh grid data (`this.fetchPageRecords()` or `this.handleRefresh()`) so newly imported records immediately populate in the grid.

#### 3.2 BUG-04 Fix: In-App Admin Studio Custom Tab

- **Components**: `force-app/main/default/tabs/Smart_Grid_Admin_Studio.tab-meta.xml` & `SmartGrid_Admin.permissionset-meta.xml`
- **Changes**:
  - Create Custom Tab definition metadata for `smartGridAdminStudio` LWC.
  - Add tab visibility to `SmartGrid_Admin` permission set:
    ```xml
    <tabSettings>
        <tab>Smart_Grid_Admin_Studio</tab>
        <visibility>Visible</visibility>
    </tabSettings>
    ```

---

### Phase 4: UI/UX Ergonomic Refinements

#### 4.1 UIUX-01: Bidirectional Analytics Panel Toggle

- **Component**: `smartDataGrid.js` (`handleToggleAnalyticsPanel`)
- **Changes**:
  - Update handler to toggle state: `this.showAnalyticsPanel = !this.showAnalyticsPanel;`.
  - When panel is already open, clicking the toolbar chart icon smoothly collapses it.

#### 4.2 UIUX-02: Transpose Selection Guidance Toast

- **Component**: `smartDataGrid.js` (`handleTransposeToggle`)
- **Changes**:
  - If `this.selectedRowIds.length < 2`:
    - Show `ShowToastEvent` warning:  
      `Title: 'Transpose Matrix Comparison'`,  
      `Message: 'Please select at least 2 records to compare side-by-side in Transpose view.'`,  
      `Variant: 'warning'`.
    - Prevent switching to empty matrix mode.

#### 4.3 UIUX-03: Responsive Toolbar Ribbon Layout

- **Component**: `smartDataGrid.css`
- **Changes**:
  - Add flex-wrap and responsive breakpoint handling (`@media (max-width: 1400px)`) to group toolbar actions cleanly without overflowing into an accidental 3rd row.

#### 4.4 UIUX-04: AI Fallback Indicator

- **Component**: `smartGridCommandPalette.html` / `smartGridCommandPalette.js`
- **Changes**:
  - If response returns `isFallback === true`, display a subtle status chip:  
    `⚡ Heuristic Mode (Einstein Offline)` with a tooltip explaining that queries are safely parsed using the local deterministic engine.

---

### Phase 5: Verification & Production Sign-Off

1. **Jest Unit Testing**: Run `npm test` and ensure all 37+ test suites pass (updating tests for `smartDataGrid`, `smartGridImportModal`, `smartGridReviewModal`, etc.).
2. **Metadata Deployment**: Deploy all updated Apex classes, LWCs, Custom Tabs, and Permission Sets to sandbox org via `sf project deploy start`.
3. **Apex Unit Testing**: Run `sf apex run test --test-level RunLocalTests --code-coverage` and ensure $\ge 90\%$ pass rate and no regressions.
4. **Playwright E2E Verification**: Run `npm run test:e2e` across all 11 test scenarios and verify newly added features (object change confirmation, import modal trigger, bidirectional analytics toggle).
5. **Documentation Alignment**: Update `docs/USER_GUIDE.md`, `docs/ADMIN_GUIDE.md`, and `docs/QA_AUDIT.md` to reflect the implemented policies and mark QA sign-off as **FULLY APPROVED / PRODUCTION GA READY**.
