# Task Story 01: Conditional Formatting Engine [US-P2-01]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P1 — Critical
**Status**: READY | **Branch**: `feature/003-ts01-conditional-formatting`

---

## Requirements

Build the conditional formatting engine that evaluates `Smart_Grid_Format_Rule__mdt` records and applies cell/row color highlighting in the grid. Rules are fetched server-side and evaluated client-side.

---

## SF Implementation Layers

| Layer                    | Skill      | File Path                                                                         | Status |
| ------------------------ | ---------- | --------------------------------------------------------------------------------- | ------ |
| Apex Service             | sf-apex    | `force-app/main/default/classes/SmartGridFormatEngine.cls`                        | ⬜     |
| Apex Test                | sf-testing | `force-app/main/default/classes/SmartGridFormatEngineTest.cls`                    | ⬜     |
| Controller (modify)      | sf-apex    | `force-app/main/default/classes/SmartGridController.cls` — add `getFormatRules()` | ⬜     |
| Controller Test (modify) | sf-testing | `force-app/main/default/classes/SmartGridControllerTest.cls`                      | ⬜     |
| LWC Module               | sf-lwc     | `force-app/main/default/lwc/formatRuleEngine/`                                    | ⬜     |
| LWC (modify)             | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/` — integrate format engine             | ⬜     |

---

## Acceptance Criteria

- **AC-01-1**: Admin creates a format rule CMDT record; grid cell/row highlights according to the rule
- **AC-01-2**: Multiple rules on the same field respect Priority order (lower = higher priority)
- **AC-01-3**: Rules with `Row_Highlight__c = true` color the entire row
- **AC-01-4**: Invalid/inactive rules are silently skipped
- **AC-01-5**: Format rules are cached client-side on first load (no re-fetch on pagination)
- **AC-01-6**: Rules with `Icon_Name__c` display text + icon overlay (no icon-only mode)

## Test Cases

| #        | Type     | Description                                  | Expected                                         |
| -------- | -------- | -------------------------------------------- | ------------------------------------------------ |
| TC-01-P1 | Positive | Create rule: StageName=Closed Won, green row | Row highlights green                             |
| TC-01-P2 | Positive | Two rules, same field, different priorities  | Lower priority number wins                       |
| TC-01-P3 | Positive | Rule with icon + cell color                  | Cell shows text, icon, and background color      |
| TC-01-N1 | Negative | Rule with Is_Active\_\_c=false               | Rule is skipped, no formatting                   |
| TC-01-N2 | Negative | Rule references non-existent field           | Rule silently skipped                            |
| TC-01-B1 | Bulk     | 251 records with mixed rule matches          | All rows formatted correctly, no governor errors |

## Dependencies

- **REQUIRES**: task_story_00 (Format Rule CMDT + seed data)
- **INDEPENDENT OF**: TS-02, TS-03, TS-04, TS-05, TS-08, TS-10

## Scoring Gates

| Skill      | Gate          | Target                   |
| ---------- | ------------- | ------------------------ |
| sf-apex    | Apex quality  | ≥ 90/150                 |
| sf-lwc     | LWC quality   | ≥ 125/165                |
| sf-testing | Test coverage | ≥ 108/120, 85%+ coverage |

## Estimation

| Layer                                     | Effort | Hours   |
| ----------------------------------------- | ------ | ------- |
| Apex (SmartGridFormatEngine + controller) | Medium | 4h      |
| LWC (formatRuleEngine + grid integration) | Medium | 6h      |
| Tests                                     | Medium | 3h      |
| **Total**                                 |        | **13h** |
