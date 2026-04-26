# Task Story 03: Undo/Redo — Dirty State Manager [US-P2-03]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P1 — Critical
**Status**: DRAFT | **Branch**: `feature/003-ts03-undo-redo`

---

## Requirements

Implement a client-side undo/redo stack for inline edits using a circular buffer (max 50 operations). Supports `Ctrl+Z` / `Ctrl+Y` keyboard shortcuts and visual undo/redo toolbar buttons.

---

## SF Implementation Layers

| Layer        | Skill  | File Path                                                                         | Status |
| ------------ | ------ | --------------------------------------------------------------------------------- | ------ |
| LWC Module   | sf-lwc | `force-app/main/default/lwc/dirtyStateManager/dirtyStateManager.js`               | ⬜     |
| LWC (modify) | sf-lwc | `force-app/main/default/lwc/smartDataGrid/` — keyboard handlers + toolbar buttons | ⬜     |

---

## Acceptance Criteria

- **AC-03-1**: `Ctrl+Z` reverts the last inline edit; `Ctrl+Y` re-applies it
- **AC-03-2**: Undo/Redo stack is cleared on Save
- **AC-03-3**: Visual undo/redo buttons show disabled state when stack is empty
- **AC-03-4**: Circular buffer caps at 50 operations (oldest dropped when exceeded)
- **AC-03-5**: Multi-cell edits each get their own stack entry

## Test Cases

| #        | Type     | Description                    | Expected                         |
| -------- | -------- | ------------------------------ | -------------------------------- |
| TC-03-P1 | Positive | Edit cell, press Ctrl+Z        | Cell reverts to original value   |
| TC-03-P2 | Positive | Undo then Ctrl+Y               | Cell returns to edited value     |
| TC-03-P3 | Positive | Save then try Ctrl+Z           | Nothing happens (stack cleared)  |
| TC-03-N1 | Negative | Press Ctrl+Z with no edits     | No action, undo button disabled  |
| TC-03-N2 | Negative | Exceed 50 operations, undo all | Only last 50 operations undoable |

## Dependencies

- **REQUIRES**: task_story_00 (metadata deployed)
- **INDEPENDENT OF**: TS-01, TS-02, TS-04, TS-05, TS-06, TS-08

## Scoring Gates

| Skill  | Gate        | Target    |
| ------ | ----------- | --------- |
| sf-lwc | LWC quality | ≥ 125/165 |

## Estimation

| Layer                             | Effort | Hours  |
| --------------------------------- | ------ | ------ |
| LWC (dirtyStateManager module)    | Medium | 4h     |
| LWC (grid integration + keyboard) | Medium | 3h     |
| Manual testing                    | Low    | 1h     |
| **Total**                         |        | **8h** |
