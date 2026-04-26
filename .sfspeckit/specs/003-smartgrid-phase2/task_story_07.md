# Task Story 07: Related Object Navigation [US-P2-07]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P2 — High
**Status**: DRAFT | **Branch**: `feature/003-ts07-related-grid`

---

## Requirements

When a record is selected and `Related_Object__c` is configured, render a child `smartDataGrid` instance showing related child records. Supports up to 2 levels deep (Parent → Children → Grandchildren). Tabbed interface below the main grid.

---

## SF Implementation Layers

| Layer         | Skill  | File Path                                                                         | Status |
| ------------- | ------ | --------------------------------------------------------------------------------- | ------ |
| LWC Component | sf-lwc | `force-app/main/default/lwc/smartGridRelatedGrid/`                                | ⬜     |
| LWC (modify)  | sf-lwc | `force-app/main/default/lwc/smartDataGrid/` — child grid rendering, depth counter | ⬜     |

---

## Acceptance Criteria

- **AC-07-1**: Selecting an Account row with `Related_Object__c = 'Contacts'` renders a child grid showing related Contacts
- **AC-07-2**: Child grid inherits security model (USER_MODE, FLS checks)
- **AC-07-3**: Max drill-down depth: 2 levels (sub-grid at depth 2 does not render its own children)
- **AC-07-4**: Child grid supports pagination, sorting, and inline editing independently
- **AC-07-5**: Tabs allow switching between multiple child relationships (if configured)

## Test Cases

| #        | Type     | Description                                             | Expected                              |
| -------- | -------- | ------------------------------------------------------- | ------------------------------------- |
| TC-07-P1 | Positive | Select Account, Related_Object = Contacts               | Child grid shows Account's contacts   |
| TC-07-P2 | Positive | Select Contact in child grid (depth 1), Related = Cases | Grandchild grid shows Cases (depth 2) |
| TC-07-P3 | Positive | At depth 2, no further sub-grid                         | No child grid rendered                |
| TC-07-N1 | Negative | Related_Object\_\_c is blank                            | No child grid shown                   |
| TC-07-N2 | Negative | User lacks access to child object                       | Child grid shows access error         |

## Dependencies

- **REQUIRES**: task_story_00 (Config field `Related_Object__c`)
- **INDEPENDENT OF**: TS-01, TS-02, TS-03, TS-04, TS-06, TS-08

## Scoring Gates

| Skill  | Gate        | Target    |
| ------ | ----------- | --------- |
| sf-lwc | LWC quality | ≥ 125/165 |

## Estimation

| Layer                                            | Effort | Hours   |
| ------------------------------------------------ | ------ | ------- |
| LWC (smartGridRelatedGrid + recursive rendering) | High   | 10h     |
| LWC (grid integration + tabs)                    | Medium | 4h      |
| Manual testing (multi-level)                     | Medium | 2h      |
| **Total**                                        |        | **16h** |
