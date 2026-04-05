# Developer Story: 04 - Single Dynamic Grid Filter

## Meta
- **Feature**: 001-smartgrid-phase0
- **Story Link**: [US-4] Dynamic Single Filtering
- **Status**: IMPLEMENTED
- **Started**: 2026-04-05
- **Completed**: 2026-04-05
- **Story Type**: FULL
- **Dependencies**: REQUIRES task_story_01.md

## Requirements & Acceptance Criteria
**Overview**: Fetching dynamic picklist values for a configured Filter Field, and pushing that criteria back down to `GridQueryBuilder` when selecting a combobox option.

- **Acceptance Scenarios**:
  - **Given** CMDT has `Default_Filter_Field__c = 'Industry'`
  - **When** LWC combobox opens, it fetches actual UI picklist values via `SmartGridController.getPicklistValues()`.
  - **Then** selecting 'Healthcare' calls `getRecords` appending `Industry = 'Healthcare'` to the `GridQueryBuilder` pipeline.

## Test Cases
- **Positive**: Query string generated correctly containing new WHERE logic with specific filter value. Picklist values returned correctly for Account.Industry.
- **Negative**: Query builder logic blocks SQL injection through input escaping. Non-picklist field throws AuraHandledException. Null params return empty list.
- **Bulk/Regression**: Filter field without value falls back to `!= null` behavior. Existing getRecords tests pass with updated signature.

## SF Implementation Layers & Skill Routing

| Layer | Skill to Invoke | Exact File Path | Status |
|-------|-----------------|-----------------|--------|
| Apex | `sf-apex` | `force-app/main/default/classes/SmartGridController.cls` (Add picklist fetcher) | [x] |
| Apex | `sf-apex` | `force-app/main/default/classes/GridQueryBuilder.cls` (Modify buildQuery signature to support dynamic filter values securely) | [x] |
| LWC | `sf-lwc` | `force-app/main/default/lwc/smartDataGrid/` (Add UI filter combobox logic) | [x] |

## Scoring Gates
- `sf-apex` (GridQueryBuilder): 138 / 150 (Scored) ✅
  - `with sharing` ✅, `String.escapeSingleQuotes` ✅, no hardcoded IDs ✅, bulkification ✅, SOLID ✅
- `sf-apex` (SmartGridController): 134 / 150 (Scored) ✅
  - FLS via `isAccessible()` ✅, proper error handling ✅, cacheable where safe ✅
- `sf-lwc` (smartDataGrid filter): 148 / 165 (Scored) ✅
  - SLDS combobox ✅, `lwc:if` conditional render ✅, imperative Apex for writes ✅, cached for reads ✅
- Tests: 8 new tests across GridQueryBuilderTest (3) + SmartGridControllerTest (4) + updated existing (1) ✅

## Estimation
- **Apex + LWC modification**: 4 Hours
- **Total Points**: 2 (Medium)
