# Task Story 04: Record ID Validation Hardening [US-P2-04]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P1 — Critical
**Status**: DRAFT | **Branch**: `feature/003-ts04-id-validation`

---

## Requirements

Implement explicit regex validation (`^[a-zA-Z0-9]{15,18}$`) on all Record IDs before any DML operation. Create a standalone utility class and integrate into existing save/delete methods.

---

## SF Implementation Layers

| Layer                    | Skill      | File Path                                                                                                                 | Status |
| ------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| Apex Utility             | sf-apex    | `force-app/main/default/classes/SmartGridIdValidator.cls`                                                                 | ⬜     |
| Apex Test                | sf-testing | `force-app/main/default/classes/SmartGridIdValidatorTest.cls`                                                             | ⬜     |
| Controller (modify)      | sf-apex    | `force-app/main/default/classes/SmartGridController.cls` — integrate validator into `saveRecords()` and `deleteRecords()` | ⬜     |
| Controller Test (modify) | sf-testing | `force-app/main/default/classes/SmartGridControllerTest.cls`                                                              | ⬜     |

---

## Acceptance Criteria

- **AC-04-1**: Attempting to save a record with a tampered/invalid ID throws `AuraHandledException` with clear message
- **AC-04-2**: Valid 15-char and 18-char IDs pass validation
- **AC-04-3**: Null, empty, and injection-attempt IDs are rejected
- **AC-04-4**: New records (Id = null) bypass validation (they're inserts)
- **AC-04-5**: Validation runs before `stripInaccessible` and DML

## Test Cases

| #        | Type     | Description                                           | Expected                              |
| -------- | -------- | ----------------------------------------------------- | ------------------------------------- |
| TC-04-P1 | Positive | Save record with valid 18-char ID                     | Passes validation, saves successfully |
| TC-04-P2 | Positive | Save record with valid 15-char ID                     | Passes validation                     |
| TC-04-P3 | Positive | Save new record (null ID)                             | Bypasses validation, inserts          |
| TC-04-N1 | Negative | Save with ID `'; DROP TABLE--`                        | AuraHandledException thrown           |
| TC-04-N2 | Negative | Save with ID `12345` (too short)                      | AuraHandledException thrown           |
| TC-04-N3 | Negative | Save with ID containing special chars `001!@#$%^&*()` | AuraHandledException thrown           |
| TC-04-N4 | Negative | Delete with invalid ID                                | AuraHandledException thrown           |
| TC-04-B1 | Bulk     | Save 251 records with valid IDs                       | All pass validation                   |

## Dependencies

- **REQUIRES**: task_story_00 (metadata deployed)
- **INDEPENDENT OF**: TS-01, TS-02, TS-03, TS-05, TS-06, TS-08

## Scoring Gates

| Skill      | Gate          | Target                   |
| ---------- | ------------- | ------------------------ |
| sf-apex    | Apex quality  | ≥ 90/150                 |
| sf-testing | Test coverage | ≥ 108/120, 85%+ coverage |

## Estimation

| Layer                         | Effort | Hours  |
| ----------------------------- | ------ | ------ |
| Apex (SmartGridIdValidator)   | Low    | 2h     |
| Apex (Controller integration) | Low    | 1h     |
| Tests (PNB pattern)           | Low    | 2h     |
| **Total**                     |        | **5h** |
