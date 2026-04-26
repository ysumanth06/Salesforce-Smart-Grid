# Task Story 05: Reading Pane — Record Detail Sidebar [US-P2-05]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P2 — High
**Status**: DRAFT | **Branch**: `feature/003-ts05-reading-pane`

---

## Requirements

Add a collapsible detail sidebar (70/30 split) that shows all accessible fields of the selected record using `lightning-record-view-form`. Read-only — no inline editing in the pane.

---

## SF Implementation Layers

| Layer         | Skill  | File Path                                                                     | Status |
| ------------- | ------ | ----------------------------------------------------------------------------- | ------ |
| LWC Component | sf-lwc | `force-app/main/default/lwc/smartGridReadingPane/`                            | ⬜     |
| LWC (modify)  | sf-lwc | `force-app/main/default/lwc/smartDataGrid/` — 70/30 layout, row click handler | ⬜     |

---

## Acceptance Criteria

- **AC-05-1**: Clicking a row opens a detail sidebar with all accessible fields
- **AC-05-2**: Closing the pane restores the grid to full width
- **AC-05-3**: The pane updates when a different row is clicked
- **AC-05-4**: Pane is read-only (`lightning-record-view-form`)
- **AC-05-5**: Controlled by `Enable_Reading_Pane__c` config toggle (default: false)
- **AC-05-6**: Pane respects FLS — only accessible fields shown

## Test Cases

| #        | Type     | Description                          | Expected                           |
| -------- | -------- | ------------------------------------ | ---------------------------------- |
| TC-05-P1 | Positive | Click row with reading pane enabled  | Sidebar opens with record details  |
| TC-05-P2 | Positive | Click different row                  | Pane updates to new record         |
| TC-05-P3 | Positive | Close pane                           | Grid returns to full width         |
| TC-05-N1 | Negative | Enable_Reading_Pane\_\_c = false     | No sidebar rendered                |
| TC-05-N2 | Negative | Click row for record user can't view | Form shows access error gracefully |

## Dependencies

- **REQUIRES**: task_story_00 (Config field `Enable_Reading_Pane__c`)
- **INDEPENDENT OF**: TS-01, TS-02, TS-03, TS-04, TS-06, TS-08

## Scoring Gates

| Skill  | Gate        | Target    |
| ------ | ----------- | --------- |
| sf-lwc | LWC quality | ≥ 125/165 |

## Estimation

| Layer                         | Effort     | Hours  |
| ----------------------------- | ---------- | ------ |
| LWC (smartGridReadingPane)    | Low-Medium | 4h     |
| LWC (grid layout integration) | Medium     | 4h     |
| **Total**                     |            | **8h** |
