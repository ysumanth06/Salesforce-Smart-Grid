# Task Story 02: Visual "Modified View" Badge & Explicit "Save vs Save As" [US-P2.5-02]

**Feature**: 003.5-smartgrid-phase2.5 | **Story Type**: FULL | **Priority**: P1 — High  
**Status**: SPECIFIED | **Branch**: `feature/003.5-smartgrid-phase2.5`

---

## Requirements

Enhance `smartGridViewSelector` to provide clear view lifecycle management:

1. **Dirty View Indicator**: When the current grid state (visible columns, sorting, filters, column widths, pinning) differs from the currently selected saved view, display a `* Modified` badge or visual indicator next to the active view label.
2. **Explicit Actions**: Split view persistence into two distinct, intuitive menu options:
   - **"Update Current View"**: Overwrites the existing saved view configuration without prompting for name, immediately persisting the new state.
   - **"Save as New View..."**: Opens a modal prompting for view name and default checkbox, creating a new clone view.
3. **Reset to Saved State**: If modified, provide a **"Revert Changes"** action that restores the grid to the exact configuration saved in the database.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                                  | Status       |
| :--------------------- | :--------- | :----------------------------------------------------------------------------------------- | :----------- |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartGridViewSelector/`                                        | 📝 SPECIFIED |
| LWC Unit Tests         | sf-testing | `force-app/main/default/lwc/smartGridViewSelector/__tests__/smartGridViewSelector.test.js` | 📝 SPECIFIED |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                                | 📝 SPECIFIED |

---

## Salesforce Platform Limitations & Guardrails

1. **Long Text Area Limits**: `Smart_Grid_View__c.View_Config_JSON__c` is a Long Text Area field (131,072 characters). Serialized view JSON must only store necessary view parameters (visible fields, filters, sort, pinned column) to stay well under limit and minimize heap.
2. **User Ownership Enforcement**: System/default views owned by other users or admins cannot be overwritten; if a non-owner modifies a standard view, the "Update Current View" action must be disabled or automatically redirect to "Save as New View".
3. **Deep State Comparison**: Comparing current grid configuration to saved configuration must be performed efficiently using key-sorted JSON hashing to prevent main-thread UI jank.

---

## Acceptance Criteria

- **AC-2.5-02-1**: When any column, filter, or sort property differs from the loaded saved view, the view selector displays a `*` or `(Modified)` indicator next to the view name.
- **AC-2.5-02-2**: Clicking "Update Current View" directly updates the existing `Smart_Grid_View__c` record via Apex without modal prompt, and clears the modified indicator.
- **AC-2.5-02-3**: Clicking "Save as New View..." opens the save dialog, pre-populating with `Copy of <View Name>`, allowing the user to name and save a separate view.
- **AC-2.5-02-4**: Selecting "Revert Changes" restores all columns, sorting, and filters to match the database record.
- **AC-2.5-02-5**: "Update Current View" is disabled if the active view is the Unsaved Default view (`selectedViewId == ""`).

---

## Test Cases

| #        | Type     | Description                        | Expected                                     |
| :------- | :------- | :--------------------------------- | :------------------------------------------- |
| TC-02-P1 | Positive | Load saved view, change sort order | View label displays `* Modified`             |
| TC-02-P2 | Positive | Click "Update Current View"        | Record updated in Apex, `*` indicator clears |
| TC-02-P3 | Positive | Click "Save as New View"           | Modal opens, new view record created on save |
| TC-02-P4 | Positive | Click "Revert Changes"             | Grid state reverts, `*` indicator clears     |
| TC-02-N1 | Negative | On "Default / Unsaved View"        | "Update Current View" option is disabled     |

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                                  | Effort | Hours  |
| :------------------------------------- | :----- | :----- |
| View Selector Modifications            | Medium | 3h     |
| Grid Dirty Comparison & State Handling | Medium | 3h     |
| Jest Tests                             | Low    | 2h     |
| **Total**                              |        | **8h** |
