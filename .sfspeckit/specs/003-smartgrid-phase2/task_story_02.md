# Task Story 02: Column Totals Footer [US-P2-02]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P1 — Critical
**Status**: READY | **Branch**: `feature/003-ts02-column-totals`

---

## Requirements

Add an aggregate footer row showing Sum, Avg, Min, Max, and Count for configured numeric columns. Totals are computed server-side against the full filtered dataset (not just the visible page).

---

## SF Implementation Layers

| Layer                       | Skill      | File Path                                                                           | Status |
| --------------------------- | ---------- | ----------------------------------------------------------------------------------- | ------ |
| Query Builder (modify)      | sf-apex    | `force-app/main/default/classes/GridQueryBuilder.cls` — add `buildAggregateQuery()` | ⬜     |
| Query Builder Test (modify) | sf-testing | `force-app/main/default/classes/GridQueryBuilderTest.cls`                           | ⬜     |
| Controller (modify)         | sf-apex    | `force-app/main/default/classes/SmartGridController.cls` — add `getAggregates()`    | ⬜     |
| Controller Test (modify)    | sf-testing | `force-app/main/default/classes/SmartGridControllerTest.cls`                        | ⬜     |
| LWC (modify)                | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/` — sticky footer row                     | ⬜     |

---

## Acceptance Criteria

- **AC-02-1**: Numeric columns display Sum/Avg/Min/Max in a pinned footer row
- **AC-02-2**: Totals recalculate on filter change (full dataset, not just visible page)
- **AC-02-3**: Non-numeric columns display "—" in the totals footer
- **AC-02-4**: Aggregates configured via `Totals_Fields_JSON__c` on `Smart_Grid_Config__mdt`
- **AC-02-5**: Totals reflect the running user's visible records per OWD/USER_MODE

## Test Cases

| #        | Type     | Description                           | Expected                                  |
| -------- | -------- | ------------------------------------- | ----------------------------------------- |
| TC-02-P1 | Positive | Config with SUM(Amount)               | Footer shows correct sum                  |
| TC-02-P2 | Positive | Apply filter, check totals            | Totals recalculate for filtered set       |
| TC-02-P3 | Positive | Non-numeric column in totals          | Shows "—"                                 |
| TC-02-N1 | Negative | No Totals_Fields_JSON\_\_c configured | No footer rendered                        |
| TC-02-N2 | Negative | User lacks FLS on aggregated field    | Field excluded from totals                |
| TC-02-B1 | Bulk     | Aggregate query on 50K+ records       | Returns in <5 seconds, no governor errors |

## Dependencies

- **REQUIRES**: task_story_00 (Config field `Totals_Fields_JSON__c`)
- **INDEPENDENT OF**: TS-01, TS-03, TS-04, TS-05, TS-08, TS-10

## Scoring Gates

| Skill      | Gate          | Target                   |
| ---------- | ------------- | ------------------------ |
| sf-apex    | Apex quality  | ≥ 90/150                 |
| sf-lwc     | LWC quality   | ≥ 125/165                |
| sf-testing | Test coverage | ≥ 108/120, 85%+ coverage |

## Estimation

| Layer                               | Effort | Hours   |
| ----------------------------------- | ------ | ------- |
| Apex (aggregate query + controller) | Medium | 4h      |
| LWC (sticky footer row)             | Medium | 4h      |
| Tests                               | Low    | 2h      |
| **Total**                           |        | **10h** |
