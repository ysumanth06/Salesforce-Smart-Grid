# Task Story 11: Formula/Computed Columns [US-P2-11]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P3 — Nice-to-Have
**Status**: READY | **Branch**: `feature/003-ts11-computed-columns`

---

## Requirements

Allow admins to define computed columns in CMDT (e.g., `Amount * Probability / 100`) that calculate values on-the-fly in the grid without creating actual formula fields on the object.

---

## SF Implementation Layers

| Layer      | Skill  | File Path                                                                                     | Status |
| ---------- | ------ | --------------------------------------------------------------------------------------------- | ------ |
| LWC Module | sf-lwc | `force-app/main/default/lwc/smartDataGrid/` — expression evaluator, computed column rendering | ⬜     |

---

## Acceptance Criteria

- **AC-11-1**: Admin defines a computed column expression in CMDT (via `Columns_JSON__c` or `Smart_Grid_Column__mdt`)
- **AC-11-2**: Computed columns render calculated values in the grid
- **AC-11-3**: Computed columns are read-only (not editable)
- **AC-11-4**: Computed columns recalculate when dependent fields change via inline edit
- **AC-11-5**: Invalid expressions show error placeholder (not crash the grid)
- **AC-11-6**: Supports basic arithmetic: `+`, `-`, `*`, `/` with field references

## Test Cases

| #        | Type     | Description                          | Expected                     |
| -------- | -------- | ------------------------------------ | ---------------------------- |
| TC-11-P1 | Positive | Column: `Amount * Probability / 100` | Shows weighted amount        |
| TC-11-P2 | Positive | Edit Amount inline                   | Computed column recalculates |
| TC-11-P3 | Positive | Click computed column cell           | Not editable                 |
| TC-11-N1 | Negative | Expression references missing field  | Shows "—" placeholder        |
| TC-11-N2 | Negative | Division by zero                     | Shows "—" or "∞"             |
| TC-11-N3 | Negative | Malformed expression `Amount ** `    | Shows error placeholder      |

## Dependencies

- **REQUIRES**: task_story_00 (metadata deployed)
- **INDEPENDENT OF**: TS-01, TS-02, TS-03, TS-04, TS-05, TS-06

## Scoring Gates

| Skill  | Gate        | Target    |
| ------ | ----------- | --------- |
| sf-lwc | LWC quality | ≥ 125/165 |

## Estimation

| Layer                               | Effort | Hours   |
| ----------------------------------- | ------ | ------- |
| LWC (expression parser + evaluator) | High   | 8h      |
| LWC (grid column integration)       | Medium | 4h      |
| **Total**                           |        | **12h** |
