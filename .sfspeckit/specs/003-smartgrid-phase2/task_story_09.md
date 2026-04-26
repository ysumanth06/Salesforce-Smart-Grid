# Task Story 09: Query History & Saved Views [US-P2-09]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P3 — Nice-to-Have
**Status**: READY | **Branch**: `feature/003-ts09-saved-views`

---

## Requirements

Implement a saved views system allowing users to name and save filter/sort/column configurations. Auto-maintain a "last 10" history without explicit save. Views are user-private.

---

## SF Implementation Layers

| Layer                    | Skill      | File Path                                                                                                 | Status |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------------------------- | ------ |
| Apex Service             | sf-apex    | `force-app/main/default/classes/SmartGridViewService.cls`                                                 | ⬜     |
| Apex Test                | sf-testing | `force-app/main/default/classes/SmartGridViewServiceTest.cls`                                             | ⬜     |
| Controller (modify)      | sf-apex    | `force-app/main/default/classes/SmartGridController.cls` — add `getViews()`, `saveView()`, `deleteView()` | ⬜     |
| Controller Test (modify) | sf-testing | `force-app/main/default/classes/SmartGridControllerTest.cls`                                              | ⬜     |
| LWC Component            | sf-lwc     | `force-app/main/default/lwc/smartGridViewSelector/`                                                       | ⬜     |
| LWC (modify)             | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/` — view selector toolbar integration                           | ⬜     |

---

## Acceptance Criteria

- **AC-09-1**: Users can name and save the current filter + sort + column configuration
- **AC-09-2**: A dropdown in the toolbar lists saved views and allows switching
- **AC-09-3**: "Last 10" auto-history is maintained without explicit save
- **AC-09-4**: Default view (`Is_Default__c = true`) auto-loads on grid init
- **AC-09-5**: Views are user-private — no cross-user access
- **AC-09-6**: Views store serialized filter expressions from the Advanced Filter Builder

## Test Cases

| #        | Type     | Description                      | Expected                          |
| -------- | -------- | -------------------------------- | --------------------------------- |
| TC-09-P1 | Positive | Save view "My Open Opps"         | View appears in dropdown          |
| TC-09-P2 | Positive | Select saved view                | Grid re-queries with saved config |
| TC-09-P3 | Positive | Apply 10+ filters without saving | Last 10 auto-history maintained   |
| TC-09-P4 | Positive | Set view as default              | View auto-loads on next visit     |
| TC-09-N1 | Negative | Delete a saved view              | View removed from dropdown        |
| TC-09-N2 | Negative | User A cannot see User B's views | Query filtered by current user    |
| TC-09-B1 | Bulk     | User with 50+ saved views        | Dropdown loads performantly       |

## Dependencies

- **REQUIRES**: task_story_00 (`Smart_Grid_View__c` object + fields)
- **REQUIRES**: task_story_06 (filter expressions for view serialization)
- **INDEPENDENT OF**: TS-01, TS-02, TS-03, TS-04, TS-05

## Scoring Gates

| Skill      | Gate          | Target                   |
| ---------- | ------------- | ------------------------ |
| sf-apex    | Apex quality  | ≥ 90/150                 |
| sf-lwc     | LWC quality   | ≥ 125/165                |
| sf-testing | Test coverage | ≥ 108/120, 85%+ coverage |

## Estimation

| Layer                                          | Effort | Hours   |
| ---------------------------------------------- | ------ | ------- |
| Apex (SmartGridViewService + controller)       | Medium | 5h      |
| LWC (smartGridViewSelector + grid integration) | Medium | 5h      |
| Tests                                          | Medium | 3h      |
| **Total**                                      |        | **13h** |
