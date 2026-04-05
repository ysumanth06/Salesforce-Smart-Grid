# Developer Story: 04 - Single Dynamic Grid Filter

## Meta
- **Feature**: 001-smartgrid-final
- **Story Link**: [US-4] Dynamic Single Filtering
- **Status**: READY
- **Story Type**: FULL
- **Dependencies**: REQUIRES task_story_01.md

## Requirements & Acceptance Criteria
**Overview**: Fetching dynamic picklist values for a configured Filter Field, and pushing that criteria back down to `GridQueryBuilder` when selecting a combobox option.

- **Acceptance Scenarios**:
  - **Given** CMDT has `Default_Filter_Field__c = 'Industry'`
  - **When** LWC combobox opens, it fetches actual UI picklist values via `SmartGridController.getPicklistValues()`.
  - **Then** selecting 'Healthcare' calls `getRecords` appending `Industry = 'Healthcare'` to the `GridQueryBuilder` pipeline.

## Test Cases
- **Positive**: Query string generated correctly containing new WHERE logic. 
- **Negative**: Query builder logic blocks SQL injection through input binding logic.

## SF Implementation Layers & Skill Routing

| Layer | Skill to Invoke | Exact File Path |
|-------|-----------------|-----------------|
| Apex | `sf-apex` | `force-app/main/default/classes/SmartGridController.cls` (Add picklist fetcher) |
| Apex | `sf-apex` | `force-app/main/default/classes/GridQueryBuilder.cls` (Modify buildQuery signature to support dynamic filter values securely) |
| LWC | `sf-lwc` | `force-app/main/default/lwc/smartDataGrid/` (Add UI filter combobox logic) |

## Scoring Gates
- `sf-apex`: 90 / 150
- `sf-lwc`: 125 / 165

## Estimation
- **Apex + LWC modification**: 4 Hours
- **Total Points**: 2 (Medium)
