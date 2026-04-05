# Developer Story: 01 - Grid Base & Read/Edit Init

## Meta
- **Feature**: 001-smartgrid-phase0
- **Story Link**: [US-1] Inline Data Editing
- **Status**: IMPLEMENTED
- **Started**: 2026-04-05
- **Completed**: 2026-04-05
- **Story Type**: FULL
- **Dependencies**: REQUIRES task_story_00.md

## Requirements & Acceptance Criteria
**Overview**: Build the base Lightning Web Component table view and its supporting thin Apex service layer to fetch configurations and parse JSON metadata to bind to a visual datatable.

- **Acceptance Scenarios**:
  - **Given** an org configured with `Account_Demo_Grid` CMDT
  - **When** the `smartDataGrid` LWC is loaded onto an Account App page
  - **Then** the Apex controller calls the Query Builder and returns records that populate a `lightning-datatable` matching the JSON columns, exposing `EDIT` mode capability.

## Test Cases
- **Positive**: `SmartGridController.getGridConfig` retrieves JSON properly. `getRecords` executes cleanly with `WITH USER_MODE`.
- **Negative**: Object API Name provided doesn't exist -> AuraHandledException.

## SF Implementation Layers & Skill Routing

| Layer | Skill to Invoke | Exact File Path | Status |
|-------|-----------------|-----------------|--------|
| Apex | `sf-apex` | `force-app/main/default/classes/SmartGridController.cls` | [x] |
| Test | `sf-testing` | `force-app/main/default/classes/SmartGridControllerTest.cls` | [x] |
| LWC | `sf-lwc` | `force-app/main/default/lwc/smartDataGrid/` | [x] |

## Scoring Gates
- `sf-apex`: 135 / 150 (Scored)
- `sf-lwc`: 145 / 165 (Scored)
- `sf-testing`: 115 / 120 (Scored)

## Estimation
- **Apex + LWC**: 5 Hours
- **Total Points**: 3 (Medium)
