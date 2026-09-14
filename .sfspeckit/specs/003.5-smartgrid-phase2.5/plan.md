# Technical Implementation Plan: Phase 2.5 — Smart Grid Pro Plus

**Feature Number**: 003.5  
**Feature Slug**: 003.5-smartgrid-phase2.5  
**Spec Status**: Approved  
**Plan Status**: Ready for Review  
**API Version**: 65.0  
**Package Directory**: `force-app`  
**Date**: 2026-09-14

---

## Constitution Compliance Check

| Article                           | Check                                                                                                                | Status  |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :-----: |
| **I: Metadata-First**             | No new custom objects required; leverages existing `Smart_Grid_View__c`, `Smart_Grid_User_Pref__c`, and CMDT fields  | ✅ Pass |
| **II: Governor-Limit Awareness**  | Client-side LRU page cache directly saves SOQL queries; double-click resize uses canvas without DOM layout thrashing | ✅ Pass |
| **III: Declarative-First**        | UI features, interactive breadcrumbs, draft diffing, and export logic require LWC modules                            | ✅ Pass |
| **IV: Security-by-Default**       | Formula injection (CWE-1236) sanitized; view ownership enforced; LWS-safe data URI protocols                         | ✅ Pass |
| **V: PNB Test-First**             | Complete Jest test suites planned for all new utility and UI modules                                                 | ✅ Pass |
| **VI: Separation of Concerns**    | Isolated modules (`gridPageCache`, `columnWidthCalculator`, `spreadsheetExporter`, `smartGridFilterBar`)             | ✅ Pass |
| **VII: Deployment Safety**        | Zero-downtime additive client components                                                                             | ✅ Pass |
| **VIII: Agent Architecture**      | DTO structures and filter serialization preserved for Phase 3 Agentforce integrations                                | ✅ Pass |
| **IX: Cross-Skill Orchestration** | Scoring gates defined per layer                                                                                      | ✅ Pass |

---

## Phase 2.5 Story Summary

| Story     | Title                                                 | Layer                                  | Priority |  Hours  |
| :-------- | :---------------------------------------------------- | :------------------------------------- | :------: | :-----: |
| **TS-01** | Active Filter Pill Bar [US-P2.5-01]                   | `smartGridFilterBar` LWC + datatable   |    P1    |   8h    |
| **TS-02** | Visual View State & Save vs Save As [US-P2.5-02]      | `smartGridViewSelector` LWC            |    P1    |   8h    |
| **TS-03** | Unsaved Changes Counter & Review Popover [US-P2.5-03] | `smartGridReviewModal` LWC + datatable |    P2    |   9h    |
| **TS-04** | Client-Side LRU Page Cache [US-P2.5-04]               | `gridPageCache` LWC JS module          |    P2    |   7h    |
| **TS-05** | Double-Click Auto-Fit Column Width [US-P2.5-05]       | `columnWidthCalculator` LWC JS module  |    P2    |   8h    |
| **TS-06** | Formatted Spreadsheet Export [US-P2.5-06]             | `spreadsheetExporter` LWC JS module    |    P3    |   8h    |
| **Total** |                                                       |                                        |          | **48h** |

---

## Technical Architecture & Module Structure

```
force-app/main/default/lwc/
├── smartGridFilterBar/             # [NEW] Active filter breadcrumb pill bar with in-place removal
├── smartGridReviewModal/           # [NEW] Draft edits inspector and discard/revert popover
├── gridPageCache/                  # [NEW] Bounded LRU client-side page cache
├── columnWidthCalculator/          # [NEW] Offscreen canvas-based text measurement for auto-fit
├── spreadsheetExporter/            # [NEW] Styled Excel XML/HTML spreadsheet generator
├── smartGridViewSelector/          # [MODIFIED] Added * Modified badge & Save / Save As actions
└── smartDataGrid/                  # [MODIFIED] Orchestrates pill bar, page cache, and review modal
```

---

## Scoring Gates & Quality Standards

- **sf-lwc**: ≥ 125/165 on all new and modified components
- **sf-testing**: ≥ 90% code coverage across all new Jest suites
- **Zero ESLint errors & 100% Prettier formatting**
