# Task Story 01: Active Filter Pill Bar (Breadcrumbs & In-Place Removal) [US-P2.5-01]

**Feature**: 003.5-smartgrid-phase2.5 | **Story Type**: FULL | **Priority**: P1 — Critical  
**Status**: SPECIFIED | **Branch**: `feature/003.5-smartgrid-phase2.5`

---

## Requirements

Provide an interactive active filter "pill bar" (breadcrumbs) directly below the grid toolbar. Aggregates all active filters originating from:

1. Quick toolbar comboboxes
2. In-place column header dropdown menus (TS-13)
3. Date range picker (TS-02)
4. Advanced Filter Builder modal (TS-06)

Each filter criterion displays as an individual removable SLDS pill (e.g., `[ Stage: Closed Won ✕ ]`, `[ Amount > $50,000 ✕ ]`). Clicking the `✕` on a pill removes that specific filter criterion and triggers an immediate reactive grid refresh without opening any modals. A "Clear All" link removes all filters simultaneously.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                            | Status       |
| :--------------------- | :--------- | :----------------------------------------------------------------------------------- | :----------- |
| LWC Component          | sf-lwc     | `force-app/main/default/lwc/smartGridFilterBar/`                                     | 📝 SPECIFIED |
| LWC Unit Tests         | sf-testing | `force-app/main/default/lwc/smartGridFilterBar/__tests__/smartGridFilterBar.test.js` | 📝 SPECIFIED |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                          | 📝 SPECIFIED |

---

## Salesforce Platform Limitations & Guardrails

1. **SLDS Pill Truncation**: Long text values (e.g., Account Names with 50+ characters) must truncate with `slds-truncate` and provide a native HTML `title` tooltip to avoid overflowing the toolbar.
2. **Responsive Layout**: Use `slds-pill_container` with flex wrapping so that multi-filter pill bars wrap gracefully on small/medium screen sizes without hiding datatable rows.
3. **State Synchronization**: Both client-side memory filters (`activeHeaderFilters`) and server-side SOQL filters (`activeFilterJson`, `filters`) must synchronize when a pill is removed.

---

## Acceptance Criteria

- **AC-2.5-01-1**: When any filter is active (quick filter, header action, date range, or filter builder), the filter bar appears below the toolbar displaying individual criteria pills.
- **AC-2.5-01-2**: Clicking the `✕` icon on an individual pill removes that specific filter, clears its corresponding UI input/checkbox, and immediately updates the datatable rows.
- **AC-2.5-01-3**: Clicking "Clear All" removes all active filters (toolbar, in-place header, and filter builder) and restores the full unfiltered dataset.
- **AC-2.5-01-4**: If no filters are active, the filter bar is hidden from the DOM (`lwc:if={hasActiveFilters}`).
- **AC-2.5-01-5**: Removal of any filter triggers recalculation of column summary totals (TS-02).

---

## Test Cases

| #        | Type     | Description                              | Expected                                                  |
| :------- | :------- | :--------------------------------------- | :-------------------------------------------------------- |
| TC-01-P1 | Positive | Apply picklist filter from column header | Pill appears with field label and value; table filters    |
| TC-01-P2 | Positive | Click `✕` on pill                        | Pill is removed, header checkbox unchecked, rows restored |
| TC-01-P3 | Positive | Apply 3 filters and click "Clear All"    | All 3 pills removed, grid fully restored                  |
| TC-01-N1 | Negative | Value with 80 characters                 | Text truncated with ellipsis, full text in tooltip        |
| TC-01-B1 | Bulk     | 10 active filter pills                   | Pills wrap gracefully without horizontal scrollbar        |

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                                           | Effort | Hours  |
| :---------------------------------------------- | :----- | :----- |
| LWC Component (`smartGridFilterBar`)            | Medium | 3h     |
| Grid Integration & State Sync (`smartDataGrid`) | Medium | 3h     |
| Jest Tests                                      | Low    | 2h     |
| **Total**                                       |        | **8h** |
