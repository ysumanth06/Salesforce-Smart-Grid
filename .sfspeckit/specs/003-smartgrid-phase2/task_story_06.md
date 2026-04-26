# Task Story 06: Advanced Filter Builder (AND/OR) [US-P2-06]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P2 — High
**Status**: DRAFT | **Branch**: `feature/003-ts06-filter-builder`

---

## Requirements

Replace the basic filter panel with a visual query builder supporting nested AND/OR logic groups. Filter expressions are stored as nested JSON and translated to secure SOQL WHERE clauses via `GridQueryBuilder`.

---

## SF Implementation Layers

| Layer                       | Skill      | File Path                                                                                        | Status |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------ | ------ |
| Query Builder (modify)      | sf-apex    | `force-app/main/default/classes/GridQueryBuilder.cls` — add `buildWhereClause(FilterExpression)` | ⬜     |
| Query Builder Test (modify) | sf-testing | `force-app/main/default/classes/GridQueryBuilderTest.cls`                                        | ⬜     |
| LWC Component               | sf-lwc     | `force-app/main/default/lwc/smartGridFilterBuilder/`                                             | ⬜     |
| LWC (modify)                | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/` — replace basic filter with builder                  | ⬜     |

---

## Acceptance Criteria

- **AC-06-1**: Users can create nested AND/OR filter groups via the UI
- **AC-06-2**: Filter expressions are persisted and restored from user preferences
- **AC-06-3**: The generated SOQL WHERE clause is parameterized (no injection)
- **AC-06-4**: Supports all field types: Text (LIKE), Picklist (=), Number (>, <, =), Date (range), Boolean (=)
- **AC-06-5**: Visual grouping with indentation and add/remove controls
- **AC-06-6**: Backward-compatible — basic single-field filters still work

## Test Cases

| #        | Type     | Description                                                   | Expected                    |
| -------- | -------- | ------------------------------------------------------------- | --------------------------- |
| TC-06-P1 | Positive | Create: Industry = Tech AND Rating = Hot                      | Both conditions applied     |
| TC-06-P2 | Positive | Create: Industry = Tech AND (Revenue > 1M OR Employees > 500) | Nested OR works             |
| TC-06-P3 | Positive | Save filter, reload page                                      | Filter restored from prefs  |
| TC-06-N1 | Negative | Injection attempt in filter value                             | Value escaped, no injection |
| TC-06-N2 | Negative | Filter on FLS-blocked field                                   | Field excluded from query   |
| TC-06-B1 | Bulk     | Complex filter with 5 groups, 15 conditions                   | Query builds correctly      |

## Dependencies

- **REQUIRES**: task_story_00 (metadata deployed)
- **INDEPENDENT OF**: TS-01, TS-02, TS-03, TS-04, TS-05, TS-08
- **BLOCKS**: task_story_09 (Saved Views serializes filter expressions)

## Scoring Gates

| Skill      | Gate          | Target                   |
| ---------- | ------------- | ------------------------ |
| sf-apex    | Apex quality  | ≥ 90/150                 |
| sf-lwc     | LWC quality   | ≥ 125/165                |
| sf-testing | Test coverage | ≥ 108/120, 85%+ coverage |

## Estimation

| Layer                                 | Effort | Hours   |
| ------------------------------------- | ------ | ------- |
| Apex (recursive WHERE clause builder) | High   | 6h      |
| LWC (visual filter builder UI)        | High   | 8h      |
| Tests                                 | Medium | 3h      |
| **Total**                             |        | **17h** |
