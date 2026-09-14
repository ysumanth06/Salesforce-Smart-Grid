# Task Story 06: Formatted Spreadsheet Export (Styled XML/HTML) [US-P2.5-06]

**Feature**: 003.5-smartgrid-phase2.5 | **Story Type**: FULL | **Priority**: P3 — Nice-to-Have  
**Status**: SPECIFIED | **Branch**: `feature/003.5-smartgrid-phase2.5`

---

## Requirements

Provide an enhanced **"Export to Excel (.xls)"** option alongside standard CSV export that preserves:

1. Column header styling (bold, background color)
2. Conditional formatting cell colors (e.g. green badges for "Closed Won", red for "Closed Lost" from TS-01)
3. Computed formula column outputs (TS-11)
4. The sticky summary totals row at the bottom (SUM, AVG, COUNT from TS-02)

Generates an Excel SpreadsheetML (XML) or Microsoft Office HTML format natively in JavaScript without external third-party binary libraries.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                              | Status       |
| :--------------------- | :--------- | :------------------------------------------------------------------------------------- | :----------- |
| LWC Export Utility     | sf-lwc     | `force-app/main/default/lwc/spreadsheetExporter/spreadsheetExporter.js`                | 📝 SPECIFIED |
| LWC Unit Tests         | sf-testing | `force-app/main/default/lwc/spreadsheetExporter/__tests__/spreadsheetExporter.test.js` | 📝 SPECIFIED |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                            | 📝 SPECIFIED |

---

## Salesforce Platform Limitations & Guardrails

1. **Lightning Web Security (LWS) & Script Restrictions**: LWS strictly restricts loading external unverified third-party libraries (e.g. large npm `xlsx` or `sheetjs` bundles).
   - _Architecture Pattern_: Implement export using standard XML Spreadsheet 2003 schema (`urn:schemas-microsoft-com:office:spreadsheet`) or MIME-typed HTML table. Opens natively in Microsoft Excel, Apple Numbers, and Google Sheets without any third-party dependencies.
2. **Formula Injection Sanitization (CWE-1236)**: Every cell value must undergo the formula sanitization protocol established in QA testing: prepend `'` if string starts with `=`, `+`, `-`, `@`, `\t`, or `\r`.
3. **Blob vs Data URI Protocol**: Use `data:application/vnd.ms-excel;charset=utf-8,` with UTF-8 BOM (`\uFEFF`) to avoid LWS `URL.createObjectURL` restrictions.

---

## Acceptance Criteria

- **AC-2.5-06-1**: Grid toolbar provides an export dropdown with options: "Export as CSV" and "Export as Formatted Excel (.xls)".
- **AC-2.5-06-2**: The exported `.xls` file opens in Microsoft Excel with matching header colors, column names, and row data.
- **AC-2.5-06-3**: Cells styled by conditional formatting rules maintain their highlight background colors (green, red, blue, etc.).
- **AC-2.5-06-4**: If column totals are active (TS-02), a bold summary row is appended at the bottom showing the totals.
- **AC-2.5-06-5**: All cell values are safely escaped against formula injection and special characters (`<`, `>`, `&`).

---

## Test Cases

| #        | Type     | Description                                         | Expected                                                        |
| :------- | :------- | :-------------------------------------------------- | :-------------------------------------------------------------- |
| TC-06-P1 | Positive | Export grid with 10 rows and conditional formatting | `.xls` file generated containing XML/HTML table with style tags |
| TC-06-P2 | Positive | Export grid with sticky footer totals               | Summary row included at the bottom with bold labels             |
| TC-06-P3 | Positive | Cell contains formula trigger `=SUM(A1:A10)`        | Value escaped with leading single quote                         |
| TC-06-N1 | Negative | Empty dataset (0 rows)                              | Export triggers warning toast, no file downloaded               |
| TC-06-B1 | Bulk     | 1,000 records with 10 columns                       | File generated in under 1 second                                |

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                                                  | Effort | Hours  |
| :----------------------------------------------------- | :----- | :----- |
| SpreadsheetML Export Module (`spreadsheetExporter.js`) | Medium | 4h     |
| Grid Toolbar Integration                               | Low    | 2h     |
| Jest Tests                                             | Low    | 2h     |
| **Total**                                              |        | **8h** |
