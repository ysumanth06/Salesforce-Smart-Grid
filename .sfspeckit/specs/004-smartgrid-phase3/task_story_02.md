# Task Story 02: Modern Command Palette (`Cmd+K`) & Explainability Chips [US-P3-01, US-P3-07]

**Feature**: 004-smartgrid-phase3 | **Story Type**: FULL | **Priority**: P1 — Critical  
**Status**: COMPLETE | **Branch**: `feature/004-smartgrid-phase3`

---

## Requirements

Implement a keyboard-accessible Command Palette modal and explainability filter chips:

1. **`smartGridCommandPalette` (LWC)**:
   - Omnipresent command center invoked by clicking a search/prompt bar or pressing `Cmd+K` (Mac) / `Ctrl+K` (Windows).
   - Fast-path client tokenizer: evaluates simple filter patterns (`rating = hot`, `stage is won`) instantly in JavaScript without server roundtrips.
   - Rich input box with placeholder prompts, recent queries history (cached in `localStorage`), and schema suggestions.
   - Non-blocking shimmer / skeleton loader when waiting for LLM server response.
2. **Explainability Filter Chips**:
   - When the AI returns query filters, they are automatically published to `smartGridFilterBar` as active filter pills (e.g., `[ BillingState = 'CA' ✕ ]`, `[ AnnualRevenue > 1M ✕ ]`).
   - The user can see exactly what the AI applied, edit individual criteria, or remove a pill by clicking `✕`.
3. **Integration with `smartDataGrid`**:
   - Adds Command Palette button to toolbar and listens for keyboard shortcut `Cmd+K`.
   - Dispatches `nlpfilterapply` event to update the datatable.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                                      | Status |
| :--------------------- | :--------- | :--------------------------------------------------------------------------------------------- | :----- |
| LWC Component          | sf-lwc     | `force-app/main/default/lwc/smartGridCommandPalette/`                                          | READY  |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartGridFilterBar/`                                               | READY  |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                                    | READY  |
| Jest Tests             | sf-testing | `force-app/main/default/lwc/smartGridCommandPalette/__tests__/smartGridCommandPalette.test.js` | READY  |

---

## Acceptance Criteria

- **AC-P3-02-1**: Pressing `Cmd+K` or `Ctrl+K` opens the Command Palette modal with focus placed on the input field.
- **AC-P3-02-2**: Entering a natural language prompt and pressing `Enter` calls the fast-path parser or `SmartGridNLPEngine.processPrompt`.
- **AC-P3-02-3**: Returned filters render as removable filter pills in `smartGridFilterBar`.
- **AC-P3-02-4**: Removing an AI filter pill immediately clears that condition and updates the datatable rows.
- **AC-P3-02-5**: Escape key closes the palette cleanly.

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-lwc     | LWC quality   | ≥ 135/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                             | Effort | Hours  |
| :-------------------------------- | :----- | :----- |
| LWC Command Palette Component     | Medium | 4h     |
| Keyboard & Filter Bar Integration | Medium | 2h     |
| Jest Unit Tests                   | Low    | 2h     |
| **Total**                         |        | **8h** |
