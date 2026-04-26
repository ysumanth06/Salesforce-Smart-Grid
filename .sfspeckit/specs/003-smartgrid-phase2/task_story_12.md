# Task Story 12: Feature Security Toggles [US-P2-12]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P3 — Nice-to-Have
**Status**: READY | **Branch**: `feature/003-ts12-feature-toggles`

---

## Requirements

Read the `Enable_*` checkbox fields from `Smart_Grid_Config__mdt` and conditionally render/hide toolbar buttons (Export, Delete, Add Row, Filters) per grid configuration.

---

## SF Implementation Layers

| Layer                    | Skill      | File Path                                                                                             | Status |
| ------------------------ | ---------- | ----------------------------------------------------------------------------------------------------- | ------ |
| Controller (modify)      | sf-apex    | `force-app/main/default/classes/SmartGridController.cls` — include toggle fields in `getGridConfig()` | ⬜     |
| Controller Test (modify) | sf-testing | `force-app/main/default/classes/SmartGridControllerTest.cls`                                          | ⬜     |
| LWC (modify)             | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/` — conditional rendering with `lwc:if`                     | ⬜     |

---

## Acceptance Criteria

- **AC-12-1**: Setting `Enable_Export__c = false` hides the Export CSV button
- **AC-12-2**: Setting `Enable_Delete__c = false` hides the Delete button
- **AC-12-3**: Setting `Enable_Add_Row__c = false` hides the Add Row button
- **AC-12-4**: Setting `Enable_Filters__c = false` hides the filter panel
- **AC-12-5**: All toggles default to `true` for backward compatibility
- **AC-12-6**: Toggle state is read from config on grid init (no additional server call)

## Test Cases

| #        | Type     | Description                                | Expected                   |
| -------- | -------- | ------------------------------------------ | -------------------------- |
| TC-12-P1 | Positive | All toggles = true (default)               | All buttons visible        |
| TC-12-P2 | Positive | Enable_Export\_\_c = false                 | Export button hidden       |
| TC-12-P3 | Positive | Enable_Delete\_\_c = false                 | Delete button hidden       |
| TC-12-P4 | Positive | Enable_Filters\_\_c = false                | Filter panel hidden        |
| TC-12-N1 | Negative | Config record missing toggle fields (null) | Defaults to true (visible) |

## Dependencies

- **REQUIRES**: task_story_00 (Config toggle fields deployed)
- **INDEPENDENT OF**: TS-01, TS-02, TS-03, TS-04, TS-05, TS-06, TS-07, TS-08

## Scoring Gates

| Skill   | Gate         | Target    |
| ------- | ------------ | --------- |
| sf-apex | Apex quality | ≥ 90/150  |
| sf-lwc  | LWC quality  | ≥ 125/165 |

## Estimation

| Layer                           | Effort | Hours  |
| ------------------------------- | ------ | ------ |
| Apex (add toggle fields to DTO) | Low    | 1h     |
| LWC (conditional rendering)     | Low    | 2h     |
| Tests                           | Low    | 1h     |
| **Total**                       |        | **4h** |
