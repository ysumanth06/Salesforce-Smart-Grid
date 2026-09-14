# Task Story 05: Dockable Conversational Analytics Assistant Drawer [US-P3-05]

**Feature**: 004-smartgrid-phase3 | **Story Type**: FULL | **Priority**: P2 — High  
**Status**: COMPLETE | **Branch**: `feature/004-smartgrid-phase3`

---

## Requirements

Provide an embedded conversational assistant panel capable of answering questions about live grid data:

1. **`smartGridAssistant` (LWC Component)**:
   - Expandable slide-out side drawer or floating widget that does not compress or disrupt the datatable column widths.
   - Quick starter prompt chips (_"Summarize this view"_, _"Calculate total revenue"_, _"Show deals closing this month"_).
   - Conversational message bubble interface with copy-to-clipboard and clear history buttons.
2. **Context-Aware Analytics**:
   - Transmits active grid context (current object, visible columns, and active filter criteria) to `SmartGridNLPEngine.askAssistant`.
   - Generates aggregate calculations (sums, averages, counts, distributions) and returns conversational explanations.
3. **Guardrails**:
   - Rejects non-data questions politely (_"I am configured to assist exclusively with your grid data and analytics."_).
   - Session chat history stored locally in component memory (reset on page reload).

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                            | Status |
| :--------------------- | :--------- | :----------------------------------------------------------------------------------- | :----- |
| LWC Component          | sf-lwc     | `force-app/main/default/lwc/smartGridAssistant/`                                     | READY  |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                          | READY  |
| Apex Method (modify)   | sf-apex    | `force-app/main/default/classes/SmartGridNLPEngine.cls`                              | READY  |
| Jest Tests             | sf-testing | `force-app/main/default/lwc/smartGridAssistant/__tests__/smartGridAssistant.test.js` | READY  |

---

## Acceptance Criteria

- **AC-P3-05-1**: Clicking the AI Assistant icon in the grid toolbar expands the drawer smoothly.
- **AC-P3-05-2**: Asking _"What is the total revenue?"_ computes the aggregate sum for the filtered dataset and returns the formatted currency answer.
- **AC-P3-05-3**: Clicking a starter chip automatically populates and submits the prompt.
- **AC-P3-05-4**: Closing the drawer preserves the conversation during the active user session.

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                         | Effort | Hours  |
| :---------------------------- | :----- | :----- |
| LWC Chat Drawer Component     | Medium | 4h     |
| NLP Engine Aggregation Bridge | Medium | 2h     |
| Jest Tests                    | Low    | 2h     |
| **Total**                     |        | **8h** |
