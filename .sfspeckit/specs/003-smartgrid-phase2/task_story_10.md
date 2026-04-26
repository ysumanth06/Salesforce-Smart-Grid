# Task Story 10: Fill-Down & Copy/Paste [US-P2-10]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P3 — Nice-to-Have
**Status**: DRAFT | **Branch**: `feature/003-ts10-fill-down`

---

## Requirements

Allow users to select a cell value and fill it down to multiple selected rows, or paste values from clipboard. Fill-down operates on visible rows only (does not cross pagination boundaries).

---

## SF Implementation Layers

| Layer        | Skill  | File Path                                                                        | Status |
| ------------ | ------ | -------------------------------------------------------------------------------- | ------ |
| LWC (modify) | sf-lwc | `force-app/main/default/lwc/smartDataGrid/` — fill-down logic, clipboard handler | ⬜     |

---

## Acceptance Criteria

- **AC-10-1**: User selects a cell value and fills it down to selected rows below
- **AC-10-2**: Fill-down operates on visible rows only
- **AC-10-3**: Clipboard paste populates cells with pasted values
- **AC-10-4**: Filled/pasted cells are marked as dirty (tracked by undo/redo)
- **AC-10-5**: Non-editable columns reject fill-down

## Test Cases

| #        | Type     | Description                                 | Expected                       |
| -------- | -------- | ------------------------------------------- | ------------------------------ |
| TC-10-P1 | Positive | Select "Active" in Status, fill down 5 rows | All 5 rows show "Active"       |
| TC-10-P2 | Positive | Copy value from external source, paste      | Cell updated with pasted value |
| TC-10-P3 | Positive | Fill-down then Ctrl+Z                       | All filled cells revert        |
| TC-10-N1 | Negative | Fill-down on non-editable column            | Operation rejected             |
| TC-10-N2 | Negative | Fill-down across page boundary              | Only visible rows affected     |

## Dependencies

- **REQUIRES**: task_story_00 (metadata deployed)
- **REQUIRES**: task_story_03 (dirty state manager for undo integration)
- **INDEPENDENT OF**: TS-01, TS-02, TS-04, TS-05, TS-06

## Scoring Gates

| Skill  | Gate        | Target    |
| ------ | ----------- | --------- |
| sf-lwc | LWC quality | ≥ 125/165 |

## Estimation

| Layer                             | Effort | Hours  |
| --------------------------------- | ------ | ------ |
| LWC (fill-down logic + clipboard) | Medium | 6h     |
| Manual testing                    | Low    | 2h     |
| **Total**                         |        | **8h** |
