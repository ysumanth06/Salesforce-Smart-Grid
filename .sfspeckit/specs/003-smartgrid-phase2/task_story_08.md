# Task Story 08: LMS Cross-Component Communication [US-P2-08]

**Feature**: 003-smartgrid-phase2 | **Story Type**: FULL | **Priority**: P2 — High
**Status**: READY | **Branch**: `feature/003-ts08-lms-integration`

---

## Requirements

Integrate Lightning Message Service (LMS) into `smartDataGrid` to publish grid events (row selection, save, delete, filter) and subscribe to external events from sibling components.

---

## SF Implementation Layers

| Layer        | Skill  | File Path                                                           | Status |
| ------------ | ------ | ------------------------------------------------------------------- | ------ |
| LWC (modify) | sf-lwc | `force-app/main/default/lwc/smartDataGrid/` — LMS publish/subscribe | ⬜     |

---

## Acceptance Criteria

- **AC-08-1**: Placing a second LWC on the same page that subscribes to `SmartGridChannel__c` receives selection events
- **AC-08-2**: External components can publish filter events that the grid consumes and re-queries
- **AC-08-3**: LMS messages contain only IDs and action types — no sensitive field data
- **AC-08-4**: Published actions: `selected`, `saved`, `deleted`, `filtered`
- **AC-08-5**: Grid subscribes on `connectedCallback`, unsubscribes on `disconnectedCallback`

## Test Cases

| #        | Type     | Description                         | Expected                                                       |
| -------- | -------- | ----------------------------------- | -------------------------------------------------------------- |
| TC-08-P1 | Positive | Select row in grid                  | Subscriber component receives `selected` event with record IDs |
| TC-08-P2 | Positive | Save records                        | Subscriber receives `saved` event                              |
| TC-08-P3 | Positive | External component publishes filter | Grid re-queries with external filter                           |
| TC-08-N1 | Negative | No subscribers on page              | Grid still functions normally                                  |
| TC-08-N2 | Negative | Malformed external message          | Grid ignores invalid messages                                  |

## Dependencies

- **REQUIRES**: task_story_00 (SmartGridChannel LMS deployed)
- **INDEPENDENT OF**: TS-01, TS-02, TS-03, TS-04, TS-05, TS-06, TS-07

## Scoring Gates

| Skill  | Gate        | Target    |
| ------ | ----------- | --------- |
| sf-lwc | LWC quality | ≥ 125/165 |

## Estimation

| Layer                          | Effort | Hours  |
| ------------------------------ | ------ | ------ |
| LWC (LMS publish integration)  | Medium | 4h     |
| LWC (LMS subscribe + re-query) | Medium | 4h     |
| **Total**                      |        | **8h** |
