# Feature Specification: Phase 2.5 — Smart Grid Pro Plus (UX, Flow & Performance Enhancements)

**Feature Number**: 003.5  
**Feature Slug**: 003.5-smartgrid-phase2.5  
**Target API Version**: 65.0  
**Status**: SPECIFIED  
**Author**: Lead QA & Technical Product Owner (TPO)  
**Date**: 2026-09-14

---

## 1. Executive Summary & Context

Phase 2 ("Smart Grid Pro") successfully delivered 14 foundation, formatting, undo/redo, drill-down, and in-place header menu capabilities. During comprehensive end-to-end QA testing on `sandbox-org`, several UX gaps and workflow friction points were uncovered:

1. Filters applied across 3 distinct entry points (toolbar, header menus, filter builder) lack a single glanceable, removable representation.
2. Saved view updates lack clear "Save vs Save As" separation and "Modified" dirty indicators.
3. Users making large inline edits (or fill-downs) have no pre-commit summary count or review drawer.
4. Back-and-forth pagination redundantly consumes SOQL queries and network latency.
5. Column dividers require tedious manual dragging rather than Excel-style double-click auto-fit.
6. CSV export drops conditional formatting colors and summary column totals.

**Phase 2.5 ("Smart Grid Pro Plus")** delivers these high-value usability, productivity, and performance enhancements while strictly adhering to Salesforce platform limits (LWS, Governor Limits, Shadow DOM, FLS, and memory boundaries).

---

## 2. User Stories & Acceptance Overview

| ID             | Title                              | Priority | Target Component                       | Value Proposition                                                        |
| :------------- | :--------------------------------- | :------: | :------------------------------------- | :----------------------------------------------------------------------- |
| **US-P2.5-01** | Active Filter Pill Bar             |    P1    | `smartGridFilterBar` / `smartDataGrid` | Glanceable breadcrumbs of all active criteria with 1-click removal.      |
| **US-P2.5-02** | View State & "Save vs Save As"     |    P1    | `smartGridViewSelector`                | Explicit update vs clone workflows with `* Modified` dirty badging.      |
| **US-P2.5-03** | Unsaved Changes Counter & Drawer   |    P2    | `smartDataGrid`                        | Clear count of pending changes with quick review popover before DML.     |
| **US-P2.5-04** | Client-Side Page Cache             |    P2    | `smartDataGrid`                        | Instant 0ms back/forward pagination saving SOQL queries.                 |
| **US-P2.5-05** | Double-Click Auto-Fit Column Width |    P2    | `smartDataGrid`                        | Auto-fits column width to longest visible content like desktop Excel.    |
| **US-P2.5-06** | Formatted Spreadsheet Export       |    P3    | `csvHelper` / `spreadsheetExporter`    | Native Excel-compatible export preserving cell colors and column totals. |

---

## 3. Salesforce Platform Limitations & Architectural Guardrails

### 3.1 Lightning Web Security (LWS) & Blob Constraints

- **Limitation**: Direct `window.URL.createObjectURL(blob)` is restricted in LWS under certain secure context conditions.
- **Guardrail**: Use standard Data URIs with UTF-8 BOM encoding (`data:application/vnd.ms-excel;charset=utf-8,` or `data:text/csv;charset=utf-8,`) to ensure 100% LWS compatibility without external untrusted third-party NPM bundles.

### 3.2 Datatable Shadow DOM Encapsulation

- **Limitation**: `lightning-datatable` encapsulates internal table elements (`th`, `td`, `div`) within its shadow root. Standard DOM query selectors (`template.querySelector('td')`) cannot reach internal cell widths.
- **Guardrail**: Measure text length using a hidden canvas 2D context (`measureText`) or calibrated character width constants, and update column definitions programmatically via `initialWidth` properties.

### 3.3 Governor Limits & LRU Cache Size

- **Limitation**: While caching reduces SOQL queries, unbound browser memory consumption in LWC can cause mobile devices or low-spec machines to freeze.
- **Guardrail**: Implement a strict LRU (Least Recently Used) cache bounded at a maximum of 10 pages (~500 records). Automatically clear cache upon any DML action (`insert`, `update`, `delete`), manual Refresh, or filter modification.

### 3.4 Security & Formula Injection (CWE-1236)

- **Limitation**: Exporting fields to spreadsheet formats can execute malicious formulas if cell values start with `=`, `+`, `-`, `@`, `\t`, or `\r`.
- **Guardrail**: All export routines must sanitize formula triggers by prepending single quotes (`'`).

---

## 4. Automation & Declarative Decision

All 6 stories involve interactive client-side LWC behavior, responsive UI rendering, and in-memory caching. None are candidates for Salesforce Flow.
