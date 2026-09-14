# Task Story 13: Excel-Style Column Header Menus & Pinning [US-P2-13]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P2 — High
**Status**: IMPLEMENTED | **Branch**: `feature/003-smartgrid-phase2`

---

## Requirements

Add native Excel-style column header dropdown menus to data columns in `smartDataGrid` using `lightning-datatable`'s `actions` property and `onheaderaction` event. Provides in-place unique-value checkbox filtering with record counts, visual filter indicators, and a "Pin to Left" column anchoring action that persists to user preferences.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                                      | Status |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------------- | ------ |
| LWC Service / Utility  | sf-lwc     | `force-app/main/default/lwc/columnHeaderMenuManager/columnHeaderMenuManager.js`                | ✅     |
| LWC Unit Tests         | sf-testing | `force-app/main/default/lwc/columnHeaderMenuManager/__tests__/columnHeaderMenuManager.test.js` | ✅     |
| LWC Datatable (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/smartDataGrid.html` — `onheaderaction` handler       | ✅     |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/smartDataGrid.js` — header action orchestration      | ✅     |

---

## Acceptance Criteria

- **AC-13-1**: Data columns display a native dropdown trigger (`▼`) in their header containing actions.
- **AC-13-2**: The dropdown menu dynamically displays the distinct values present in the current dataset along with record counts (e.g., `Hot (14)`, `Warm (8)`, `Cold (3)`).
- **AC-13-3**: Clicking a distinct value toggles its checkbox (`checked: true/false`) and filters the displayed rows in real-time.
- **AC-13-4**: Selecting "All" or "Clear Filter" removes the in-place filter for that column and restores all rows.
- **AC-13-5**: When a column has an active filter, its header icon dynamically changes to `utility:filter` so the user knows which column is actively filtering data.
- **AC-13-6**: For high-cardinality fields (> 15 unique values), the menu displays the top 15 most frequent values plus a _"More in Filter Builder..."_ action that opens `smartGridFilterBuilder`.
- **AC-13-7**: Clicking "Pin to Left" moves the column to index 0 (lead data column) and displays a pinned icon (`utility:pinned`).
- **AC-13-8**: Clicking "Unpin from Left" restores the column to its original default position.
- **AC-13-9**: In-place filtering and pinning trigger instant recalculation of sticky column totals (`TS-02`).

---

## Test Cases

| #        | Type     | Description                                        | Expected                                                 |
| -------- | -------- | -------------------------------------------------- | -------------------------------------------------------- |
| TC-13-P1 | Positive | Open header menu for picklist column (e.g., Stage) | Shows unique values with record counts                   |
| TC-13-P2 | Positive | Check unique value (e.g., "Closed Won (12)")       | Only matching rows displayed, icon updates to filter     |
| TC-13-P3 | Positive | Click "All" / "Clear Filter"                       | Filter removed, all rows restored                        |
| TC-13-P4 | Positive | Click "Pin to Left" on 3rd column                  | Column moves to index 0, pin icon displayed              |
| TC-13-P5 | Positive | Click "Unpin from Left"                            | Column returns to original index                         |
| TC-13-P6 | Positive | Filter applied, check sticky footer totals (TS-02) | Summary aggregations recalculate on filtered dataset     |
| TC-13-N1 | Negative | Column with 50+ unique values                      | Top 15 values shown + "More in Filter Builder..." action |
| TC-13-N2 | Negative | Column with all null values                        | Shows "(Blank)" value action                             |
| TC-13-B1 | Bulk     | 1,000 loaded records with 10 columns               | Distinct value computation executes under 50ms           |

---

## Dependencies

- **REQUIRES**: `smartDataGrid` core datatable (`smartGridDatatable`)
- **INTEGRATES WITH**: `TS-02` (Column Totals recalculation on filter)
- **INTEGRATES WITH**: `TS-06` (Filter Builder fallback for complex queries)
- **INTEGRATES WITH**: `TS-09` (View persistence and column preferences)

---

## Scoring Gates

| Skill      | Gate          | Target    |
| ---------- | ------------- | --------- |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                                                    | Effort | Hours   |
| -------------------------------------------------------- | ------ | ------- |
| LWC Service (`columnHeaderMenuManager.js`)               | Medium | 4h      |
| LWC Datatable Integration (`smartDataGrid.js` / `.html`) | Medium | 4h      |
| Jest Unit Tests & Edge Cases                             | Medium | 3h      |
| **Total**                                                |        | **11h** |
