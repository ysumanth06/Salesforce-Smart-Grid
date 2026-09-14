# Task Story 03: Unsaved Changes Counter & Review Popover [US-P2.5-03]

**Feature**: 003.5-smartgrid-phase2.5 | **Story Type**: FULL | **Priority**: P2 — High  
**Status**: SPECIFIED | **Branch**: `feature/003.5-smartgrid-phase2.5`

---

## Requirements

Provide immediate visual clarity around uncommitted draft edits:

1. **Dynamic Changes Counter**: Replace the static "Save" button label with a live count badge: e.g., `Save (5 changes across 2 rows)`.
2. **Review Changes Popover**: Clicking an info badge next to the counter opens an SLDS popover listing each pending edit:
   - Record Name (or `New Record`)
   - Field Label
   - Original Value → Draft Value
   - Individual "Revert Field" action
3. **Revert All Button**: A dedicated "Discard / Revert All" button next to Save that purges all draft values and clears the dirty state stack.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                                | Status       |
| :--------------------- | :--------- | :--------------------------------------------------------------------------------------- | :----------- |
| LWC Component          | sf-lwc     | `force-app/main/default/lwc/smartGridReviewModal/`                                       | 📝 SPECIFIED |
| LWC Unit Tests         | sf-testing | `force-app/main/default/lwc/smartGridReviewModal/__tests__/smartGridReviewModal.test.js` | 📝 SPECIFIED |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                              | 📝 SPECIFIED |

---

## Salesforce Platform Limitations & Guardrails

1. **Draft Value Schema Compatibility**: Standard `lightning-datatable` stores draft values as an array of partial objects (`[{ Id: '...', FieldName: '...' }]`). The review summary must merge original row data from `gridData` with `draftValues` efficiently without modifying raw datatable objects.
2. **Bulk Fill-Down Scale**: If a user fills down 50 rows, the popover should paginate or group by field (e.g. `StageName: 50 records updated to "Closed Won"`) to prevent an excessively long popover DOM tree.
3. **Draft Identity for New Rows**: Newly inserted rows have temporary IDs (`new-xxx`). The reviewer must label these clearly as `[New Record #1]` rather than displaying raw timestamp IDs.

---

## Acceptance Criteria

- **AC-2.5-03-1**: When `draftValues.length > 0`, the Save button displays the total number of field changes and distinct records affected.
- **AC-2.5-03-2**: Clicking the Review icon opens a popover detailing record name, field name, previous value, and new value.
- **AC-2.5-03-3**: Clicking "Discard All" clears all drafts, restores original cell values in the grid, and clears the undo/redo stack.
- **AC-2.5-03-4**: Reverting an individual field from the review popover removes that specific draft key and updates the counter.
- **AC-2.5-03-5**: When `draftValues` is empty, the Save and Discard buttons are disabled.

---

## Test Cases

| #        | Type     | Description                            | Expected                                       |
| :------- | :------- | :------------------------------------- | :--------------------------------------------- |
| TC-03-P1 | Positive | Edit 2 cells on Row 1, 1 cell on Row 2 | Counter reads `Save (3 changes across 2 rows)` |
| TC-03-P2 | Positive | Open Review popover                    | Table shows 3 rows with old vs new values      |
| TC-03-P3 | Positive | Click "Discard All"                    | All changes reverted, counter hidden           |
| TC-03-P4 | Positive | Revert single field in popover         | Field reverted, counter drops from 3 to 2      |
| TC-03-B1 | Bulk     | Fill-down 50 rows                      | Summary displays grouped representation        |

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                            | Effort | Hours  |
| :------------------------------- | :----- | :----- |
| Review Popover Component         | Medium | 4h     |
| Grid Integration & Draft Diffing | Medium | 3h     |
| Jest Tests                       | Low    | 2h     |
| **Total**                        |        | **9h** |
