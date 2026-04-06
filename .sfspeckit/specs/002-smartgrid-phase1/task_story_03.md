# Task Story 03: Mutation Engine (Add/Delete & Failure Queue)

## Context

- **Feature**: 002-smartgrid-phase1
- **Story ID**: TS-03
- **Type**: FULL
- **Status**: DRAFT

## 🎯 Objective

Implement "Add Row" functionality with the Hybrid Failure Queue pattern and Batch Deletion with confirmation.

## 🚀 Requirements

1. Implement `deleteRecords` in `SmartGridController.cls`.
2. Add "Add Row" button to LWC that inserts a blank proxy row into `draftValues`.
3. **Failure Queue Logic**: In the LWC `handleSave` catch block, identify new rows that failed to save.
4. Create a `SmartGridResolutionModal` LWC to cycle through failed records using `lightning-record-edit-form`.

## ✅ Acceptance Criteria

- [ ] Users can delete multiple rows after confirming via `LightningConfirm`.
- [ ] If multiple new rows fail to save due to required fields, the "Fix Errors" modal correctly cycles through them.
- [ ] Successful saves refresh the grid and clear the failure queue.

## 🛠 SF Implementation Layers

| Layer               | Skill   | File Path                                                | Status     |
| :------------------ | :------ | :------------------------------------------------------- | :--------- |
| **Apex Controller** | sf-apex | `force-app/main/default/classes/SmartGridController.cls` | ⭕ PENDING |
| **LWC Component**   | sf-lwc  | `force-app/main/default/lwc/smartGridResolutionModal/`   | ⭕ PENDING |
| **LWC Main**        | sf-lwc  | `force-app/main/default/lwc/smartDataGrid/`              | ⭕ PENDING |

## 🔒 Scoring Gates

- **sf-apex**: 110/150
- **sf-lwc**: 145/165

## 📝 Dependencies

- **Requires**: TS-01

## 📊 Estimation

- **Apex**: 1.5h
- **LWC**: 4h
- **Total**: 5.5h
