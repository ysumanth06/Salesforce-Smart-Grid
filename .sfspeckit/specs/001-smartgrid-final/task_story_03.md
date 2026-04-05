# Developer Story: 03 - Column Personalization Modal

## Meta
- **Feature**: 001-smartgrid-final
- **Story Link**: [US-3] Column Personalization via Picker
- **Status**: IMPLEMENTED
- **Started**: 2026-04-05
- **Completed**: 2026-04-05
- **Story Type**: FULL
- **Dependencies**: INDEPENDENT OF 01 (Can be built in parallel as a dumb component prior to parent dispatch) | REQUIRES task_story_00.md

## Requirements & Acceptance Criteria
**Overview**: Design the `smartGridFieldPicker` component. This operates as a child modal over the grid whenever there's an absent configuration.

- **Acceptance Scenarios**:
  - **Given** `smartDataGrid` realizes `gridConfigName` is null and CMDT throws an absent error
  - **When** rendering occurs
  - **Then** `smartGridFieldPicker` is rendered over the UI exposing a native `lightning-dual-listbox` containing all `isAccessible()` fields for the Target Object. Users save and emit a `<fieldselection>` custom event.

## Test Cases
- **Positive**: Dispatches `<fieldselection>` properly when Apply is clicked.
- **Negative**: Shows error when no object API name is provided. Shows error when Apply is clicked with no fields selected. Handles Apex errors gracefully.
- **API Contract**: Accepts pre-selected fields via `selectedFields` @api. `close()` method hides modal.

## SF Implementation Layers & Skill Routing

| Layer | Skill to Invoke | Exact File Path | Status |
|-------|-----------------|-----------------|--------|
| LWC | `sf-lwc` | `force-app/main/default/lwc/smartGridFieldPicker/` | [x] |
| LWC | `sf-lwc` | `force-app/main/default/lwc/smartDataGrid/` (Wiring the child logic) | [x] |

## Scoring Gates
- `sf-lwc` (smartGridFieldPicker): 154 / 165 (Scored) ✅
- `sf-lwc` (smartDataGrid wiring): Verified — child event handlers integrated ✅
- Jest tests: 9 tests (4 positive, 3 negative, 2 API contract) ✅

## Estimation
- **LWC**: 3 Hours
- **Total Points**: 2 (Low)
