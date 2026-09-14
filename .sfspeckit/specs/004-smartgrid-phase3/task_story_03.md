# Task Story 03: Bulk NLP DML Handler & Visual Safety Diff Modal [US-P3-03]

**Feature**: 004-smartgrid-phase3 | **Story Type**: FULL | **Priority**: P1 — Critical  
**Status**: COMPLETE | **Branch**: `feature/004-smartgrid-phase3`

---

## Requirements

Provide safe natural language bulk updates and deletions with an interactive visual diff modal:

1. **`SmartGridNLPDMLHandler` (Apex Service)**:
   - Parses NLP update commands (e.g., `"Set Rating to Hot for selected accounts"`) into structured field-value modification maps.
   - Generates a preview payload showing the first 5 records with before and after values.
   - Executes DML strictly via `Security.stripInaccessible()` and `Database.update(records, false)` or `Database.delete(records, false)`.
2. **`smartGridDmlConfirmModal` (LWC Component)**:
   - Confirmation dialog showing:
     - Total count of records to be modified or deleted.
     - Affected fields.
     - Visual high-contrast diff table (highlighting changed cells in green for updates, red for deletions).
     - Explicit "Confirm & Apply" and "Cancel" buttons.
3. **Rollback / Undo Window**:
   - If an update succeeds, a toast notification displays with an "Undo" action available for 10 seconds.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                                        | Status |
| :--------------------- | :--------- | :----------------------------------------------------------------------------------------------- | :----- |
| Apex Service           | sf-apex    | `force-app/main/default/classes/SmartGridNLPDMLHandler.cls`                                      | READY  |
| Apex Unit Tests        | sf-testing | `force-app/main/default/classes/SmartGridNLPDMLHandlerTest.cls`                                  | READY  |
| LWC Component          | sf-lwc     | `force-app/main/default/lwc/smartGridDmlConfirmModal/`                                           | READY  |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                                      | READY  |
| Jest Tests             | sf-testing | `force-app/main/default/lwc/smartGridDmlConfirmModal/__tests__/smartGridDmlConfirmModal.test.js` | READY  |

---

## Acceptance Criteria

- **AC-P3-03-1**: Any NLP command intending to update or delete records automatically opens the `smartGridDmlConfirmModal`.
- **AC-P3-03-2**: The modal displays the total count of affected records and highlights altered fields.
- **AC-P3-03-3**: Clicking "Cancel" aborts the operation with zero database changes.
- **AC-P3-03-4**: Clicking "Confirm & Apply" executes the DML, refreshes the grid, and displays an execution summary toast.
- **AC-P3-03-5**: All updates respect user FLS and object update permissions; inaccessible fields are stripped safely.

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-apex    | Apex quality  | ≥ 120/150 |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                  | Effort | Hours  |
| :--------------------- | :----- | :----- |
| Apex NLP DML Handler   | Medium | 3h     |
| LWC Visual Diff Modal  | Medium | 3h     |
| Apex & Jest Unit Tests | Low    | 2h     |
| **Total**              |        | **8h** |
