# Developer Story: 03 - Column Personalization Modal

## Meta
- **Feature**: 001-smartgrid-final
- **Story Link**: [US-3] Column Personalization via Picker
- **Status**: READY
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

## SF Implementation Layers & Skill Routing

| Layer | Skill to Invoke | Exact File Path |
|-------|-----------------|-----------------|
| LWC | `sf-lwc` | `force-app/main/default/lwc/smartGridFieldPicker/` |
| LWC | `sf-lwc` | `force-app/main/default/lwc/smartDataGrid/` (Wiring the child logic) |

## Scoring Gates
- `sf-lwc`: 125 / 165

## Estimation
- **LWC**: 3 Hours
- **Total Points**: 2 (Low)
