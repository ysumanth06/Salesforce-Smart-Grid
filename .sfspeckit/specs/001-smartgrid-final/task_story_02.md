# Developer Story: 02 - Bulk Save & Row Error Handling

## Meta
- **Feature**: 001-smartgrid-final
- **Story Link**: [US-2] Bulk Save & Error Handling
- **Status**: IMPLEMENTED
- **Started**: 2026-04-05
- **Completed**: 2026-04-05
- **Story Type**: FULL
- **Dependencies**: REQUIRES task_story_01.md

## Requirements & Acceptance Criteria
**Overview**: Implement the `onsave` logic block inside the `smartDataGrid` and expose `SmartGridController.saveRecords()` using partial success database save operations.

- **Acceptance Scenarios**:
  - **Given** 5 edited rows via LWC, where 1 violates an org-wide validation rule
  - **When** user hits the Save footer button
  - **Then** Apex uses `Database.update(..., false)`, throwing an explicit localized DML error to the 1 row, but returning success for the other 4.

## Test Cases
- **Positive**: Standard save of 5 distinct records.
- **Negative**: Ensure missing FLS forces an exception.
- **Bulk**: System handles 200 edited records hitting Apex.

## SF Implementation Layers & Skill Routing

| Layer | Skill to Invoke | Exact File Path | Status |
|-------|-----------------|-----------------|---------|
| Apex | `sf-apex` | `force-app/main/default/classes/SmartGridController.cls` (Modify existing) | [x] |
| Test | `sf-testing` | `force-app/main/default/classes/SmartGridControllerTest.cls` (Add tests) | [x] |
| LWC | `sf-lwc` | `force-app/main/default/lwc/smartDataGrid/` (Modify existing) | [x] |

## Scoring Gates
- `sf-apex`: 132 / 150 (Scored) ✅
- `sf-lwc`: 138 / 165 (Scored) ✅
- `sf-testing`: 7/7 tests pass, 100% pass rate ✅

## Estimation
- **Apex DML logic**: 4 Hours
- **Total Points**: 2 (Medium)
