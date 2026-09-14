# Task Story 05: Double-Click Auto-Fit Column Width [US-P2.5-05]

**Feature**: 003.5-smartgrid-phase2.5 | **Story Type**: FULL | **Priority**: P2 — Medium  
**Status**: COMPLETE | **Branch**: `feature/003.5-smartgrid-phase2.5`

---

## Requirements

Provide an Excel-like double-click auto-fit action on column headers.
When a user double-clicks the border/divider between columns or selects "Auto-Fit Column Width" from the column header action menu (TS-13):

1. Calculates the maximum character length and font-rendered width among:
   - The column header label
   - All visible cell values for that column in the current page
2. Sets the column's `initialWidth` to fit the content cleanly plus comfortable padding (24px).
3. Enforces minimum width (80px) and maximum width (500px).
4. Persists the resized width to the user's grid preferences (`Smart_Grid_User_Pref__c`) so it remains consistent across sessions.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                                  | Status      |
| :--------------------- | :--------- | :----------------------------------------------------------------------------------------- | :---------- |
| LWC Utility            | sf-lwc     | `force-app/main/default/lwc/columnWidthCalculator/columnWidthCalculator.js`                | ✅ COMPLETE |
| LWC Unit Tests         | sf-testing | `force-app/main/default/lwc/columnWidthCalculator/__tests__/columnWidthCalculator.test.js` | ✅ COMPLETE |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                                | ✅ COMPLETE |

---

## Salesforce Platform Limitations & Guardrails

1. **Shadow DOM Encapsulation**: Standard `lightning-datatable` does not expose native DOM column divider elements across the Shadow DOM boundary.
   - _Architecture Pattern_:
     a) Add an explicit "Auto-Fit Width" action to the native column header action dropdown (TS-13).
     b) Attach an `ondblclick` event listener on the datatable header container to detect double-click coordinates near column boundaries.
2. **Text Measurement without DOM Layout Thrashing**: Rather than querying the DOM for each cell (which triggers expensive browser reflows), use an in-memory offscreen HTML5 `<canvas>` 2D context (`measureText`) with Salesforce SLDS font tokens (`13px Salesforce Sans, -apple-system, BlinkMacSystemFont, sans-serif`).
3. **Boundary Constraints**: Enforce `MIN_WIDTH = 80px` (to prevent column collapse) and `MAX_WIDTH = 500px` (to prevent a single long text value from dominating the viewport).

---

## Acceptance Criteria

- **AC-2.5-05-1**: Selecting "Auto-Fit Width" from the column header menu adjusts the column width to snugly fit the widest visible cell or header title.
- **AC-2.5-05-2**: Double-clicking within 5px of a column header boundary triggers the auto-fit calculation.
- **AC-2.5-05-3**: Auto-fitted column widths are never smaller than 80px and never larger than 500px.
- **AC-2.5-05-4**: Recalculated widths update the user preference record in Apex so the layout persists upon page reload.
- **AC-2.5-05-5**: Auto-fit calculation for a 50-row column executes in under 5ms without visual stutter.

---

## Test Cases

| #        | Type     | Description                                     | Expected                                       |
| :------- | :------- | :---------------------------------------------- | :--------------------------------------------- |
| TC-05-P1 | Positive | Auto-fit column with short values ("Yes", "No") | Snaps to header label width + padding (~90px)  |
| TC-05-P2 | Positive | Auto-fit column with long company names         | Expands to fit longest name without truncation |
| TC-05-P3 | Positive | Column with 500-character description           | Clamped to max limit (500px)                   |
| TC-05-P4 | Positive | Column with all blank cells                     | Snaps to header title width                    |
| TC-05-B1 | Bulk     | Auto-fit across 20 columns and 50 rows          | Calculation completes in < 20ms                |

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                                    | Effort | Hours  |
| :--------------------------------------- | :----- | :----- |
| Canvas Text Measurement Utility          | Medium | 3h     |
| Header Action & Double-Click Integration | Medium | 3h     |
| Jest Tests                               | Low    | 2h     |
| **Total**                                |        | **8h** |
