# Salesforce Smart Grid — End-User & Power-User Guide

Welcome to the **Salesforce Smart Grid** user guide. This document explains how to use the interactive data workspace, leverage spreadsheet productivity shortcuts, compare records in transposed matrix view, review bulk changes with visual diff safety, and utilize built-in AI copilot capabilities.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Personas & Permissions](#2-user-personas--permissions)
3. [Spreadsheet-Speed Inline Editing & Ergonomics](#3-spreadsheet-speed-inline-editing--ergonomics)
   - [Inline Cell Editing](#inline-cell-editing)
   - [2D Rectangular Range Selection](#2d-rectangular-range-selection)
   - [Fill Down (Cmd+D / Ctrl+D)](#fill-down-cmdd--ctrld)
   - [Bidirectional Excel & Google Sheets Copy/Paste](#bidirectional-excel--google-sheets-copypaste)
   - [Multi-Level Undo & Redo (Cmd+Z / Cmd+Shift+Z)](#multi-level-undo--redo-cmdz--cmdshiftz)
   - [Adding & Deleting Rows](#adding--deleting-rows)
4. [Specialized In-Cell Editors](#4-specialized-in-cell-editors)
   - [Lookup & Master-Detail with "+ New Record"](#lookup--master-detail-with--new-record)
   - [User vs. Queue Owner Selector](#user-vs-queue-owner-selector)
   - [Multi-Select Picklist with Search Filter](#multi-select-picklist-with-search-filter)
   - [Cascading Dependent Picklists](#cascading-dependent-picklists)
   - [Combined Date & Time Picker](#combined-date--time-picker)
5. [Transposed Grid View (Matrix Comparison Mode)](#5-transposed-grid-view-matrix-comparison-mode)
   - [Pivoting Fields as Rows, Records as Columns](#pivoting-fields-as-rows-records-as-columns)
   - [Highlighting & Filtering "Differences Only"](#highlighting--filtering-differences-only)
   - [In-Matrix Editing & Staging](#in-matrix-editing--staging)
6. [Finding, Filtering & Custom Views](#6-finding-filtering--custom-views)
   - [Quick Filter Bar & Active Filter Pills](#quick-filter-bar--active-filter-pills)
   - [Advanced Filter Builder (AND/OR Logic)](#advanced-filter-builder-andor-logic)
   - [Field Picker & Column Ordering](#field-picker--column-ordering)
   - [Saving & Sharing Personal Views](#saving--sharing-personal-views)
7. [Grouping & In-Grid Analytics Charts](#7-grouping--in-grid-analytics-charts)
   - [3-Level Hierarchical Grouping](#3-level-hierarchical-grouping)
   - [Server-Side Rollup Aggregates (Sum, Avg, Min, Max)](#server-side-rollup-aggregates)
   - [Docked SVG Chart Drawer (Donut, Bar, Funnel)](#docked-svg-chart-drawer-donut-bar-funnel)
   - [Conditional Formatting & Data Bars](#conditional-formatting--data-bars)
8. [Data Mobility, Safety & Change Auditing](#8-data-mobility-safety--change-auditing)
   - [Pre-Flight Bulk DML Visual Diff Confirmation Modal](#pre-flight-bulk-dml-visual-diff-confirmation-modal)
   - [Bulk CSV Import with Transactional Rollback ("Undo Import")](#bulk-csv-import-with-transactional-rollback-undo-import)
   - [Formula Shield (Neutralizing Formula Injections)](#formula-shield-neutralizing-formula-injections)
   - [Field-Level Change Audit History](#field-level-change-audit-history)
9. [AI Copilot & Natural Language Features](#9-ai-copilot--natural-language-features)
   - [Unified Smart Grid AI Omnibar (Cmd+K / Einstein Icon)](#unified-smart-grid-ai-omnibar-cmdk--einstein-icon)
   - [Data Quality & Health Score Drawer (Shield Icon)](#data-quality--health-score-drawer-shield-icon)
   - [Interactive Onboarding Tour](#interactive-onboarding-tour)
10. [Master Keyboard Shortcuts Cheat Sheet](#10-master-keyboard-shortcuts-cheat-sheet)

---

## 1. Product Overview

Salesforce Smart Grid turns any standard or custom object into an interactive, high-performance spreadsheet workspace embedded directly into Salesforce Lightning Experience.

Key advantages over standard list views:

- **Zero Page Context Switching**: Edit dozens of records and fields simultaneously without clicking through multiple record pages.
- **True Spreadsheet Productivity**: 2D range selection, linear fill down, multi-cell paste from Excel, and infinite undo/redo.
- **Enterprise Safety**: Every bulk change displays a visual diff pre-flight preview showing before/after values before committing to the database.
- **Transposed Matrix Mode**: Compare multiple records side by side with differences highlighted automatically.
- **100% On-Platform Security**: Executes strictly within your Salesforce org under your profile's security, sharing, and Field-Level Security rules.

---

## 2. User Personas & Permissions

Your Salesforce Administrator controls feature availability through Permission Sets:

| Permission Set              | Target Persona                         | Key Capabilities                                                                                                                              |
| :-------------------------- | :------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **`SmartGrid_User`**        | All Standard Users & Sales Reps        | Standard grid navigation, inline cell editing, quick filters, CSV export, column resizing, field picker, personal saved views.                |
| **`SmartGrid_Power_User`**  | Team Leads, Sales Ops, Analysts        | Unlocks Transpose Matrix editing, 2D range fill down, Excel range copy/paste, bulk CSV import with rollback tokens, and private view sharing. |
| **`Smart_Grid_AI_Premium`** | Power Users, Executives, Data Stewards | Unlocks the `Cmd+K` Unified Smart Grid AI Omnibar (Einstein icon), and Dataset Health & Duplicate Inspector (Shield icon).                    |
| **`SmartGrid_Admin`**       | Salesforce Administrators              | Full access including Visual Admin Studio, programmatic metadata deployment, and global grid overrides.                                       |

---

## 3. Spreadsheet-Speed Inline Editing & Ergonomics

### Inline Cell Editing

- Click on any editable cell (or press `Enter` / start typing) to open its dedicated inline editor.
- Modified cells immediately turn **light yellow**, indicating staged unsaved changes.
- The **Save Bar** at the bottom tracks the exact count of pending modifications (e.g., _"4 unsaved changes"_).

### 2D Rectangular Range Selection

- **Mouse Drag**: Click a starting cell and drag your mouse across adjacent rows and columns to create a bounding box.
- **Keyboard Selection**: Hold `Shift` and use the `Arrow Keys` to expand or contract your selection marquee.
- Once selected, apply batch commands across the entire range (Copy, Fill Down, or Clear).

### Fill Down (`Cmd + D` / `Ctrl + D`)

- Select a range where the top row contains values you wish to replicate across rows below.
- Press `Cmd + D` (Mac) or `Ctrl + D` (Windows).
- The values from the topmost cells propagate downward across all selected rows, with each change staged for review.

### Bidirectional Excel & Google Sheets Copy/Paste

- **Copying to Excel**: Select any range of cells in Smart Grid and press `Cmd + C` (`Ctrl + C`). Paste directly into Microsoft Excel or Google Sheets. Tab-separated values and line breaks are formatted automatically.
- **Pasting from Excel**: Highlight a cell range in Excel, copy it, click the top-left destination cell in Smart Grid, and press `Cmd + V` (`Ctrl + V`). Smart Grid maps the clipboard data into the grid's columns and rows.
- **Formula Injection Shield**: Any values starting with `=,+,-,@` are safely sanitized during copy and restored transparently on paste to prevent malicious formula execution in external spreadsheet applications.

### Multi-Level Undo & Redo (`Cmd + Z` / `Cmd + Shift + Z`)

- Made a mistake or pasted incorrect values? Press `Cmd + Z` (`Ctrl + Z`) to revert the last action step by step.
- Press `Cmd + Shift + Z` (`Ctrl + Y`) to redo the reverted changes.
- You can undo actions all the way back to the initial pristine state before saving.

### Adding & Deleting Rows

- **Add Row**: Click **"Add Row"** in the grid toolbar. A new row appears at the top with a green accent bar. Populate the required fields and save.
- **Delete Row**: Select one or more rows, click the row action menu (`▼`), and choose **"Delete"**. Rows staged for deletion display in light red with strike-through formatting until confirmed.

---

## 4. Specialized In-Cell Editors

Salesforce Smart Grid provides customized inline editors for complex Salesforce field types that standard datatables cannot edit:

### Lookup & Master-Detail with "+ New Record"

- Click a lookup cell (e.g., _Account Name_, _Parent Opportunity_, _Contact_).
- A search input opens with 300ms debounced typeahead. Matching records appear with secondary descriptive fields (e.g., _Email_, _Account Industry_).
- Need to reference a record that doesn't exist yet? Click **"+ New Record"** directly inside the dropdown to launch an in-grid creation modal without losing your unsaved work.

### User vs. Queue Owner Selector

- Changing the record owner displays a polymorphic selector that distinguishes between active **Users** and **Queues**.
- Includes avatar initials and active status badges.

### Multi-Select Picklist with Search Filter

- Clicking a multi-select picklist opens a dropdown combobox with individual checkboxes and a quick-filter search box.
- Use **"Select All"** or **"Clear All"** shortcuts for rapid tag assignment. Selected items render as compact pills.

### Cascading Dependent Picklists

- When editing dependent picklists (e.g., _Country & State_, _Category & Subcategory_), changing the controlling field immediately recalculates valid options for the dependent field based on Salesforce metadata rules.

### Combined Date & Time Picker

- Date/Time fields render a dual picker: an intuitive calendar datepicker coupled with a 15-minute interval time dropdown.
- Automatically adjusts and displays in your personal Salesforce user profile timezone.

---

## 5. Transposed Grid View (Matrix Comparison Mode)

When comparing multiple accounts, opportunities, or custom records, standard horizontal tables require constant side-to-side scrolling. Smart Grid's **Transpose View** flips the orientation: **Fields become Rows, and Records become Columns**.

```
┌───────────────────────┬──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Field Name (Sticky)   │ Opportunity A            │ Opportunity B            │ Opportunity C            │
├───────────────────────┼──────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Stage                 │ Closed Won               │ Negotiation/Review       │ Negotiation/Review       │
│ Amount                │ $120,000.00              │ $45,000.00               │ $45,000.00               │
│ Close Date            │ 10/15/2026               │ 10/28/2026               │ 11/04/2026               │
│ Primary Contact       │ Sarah Jenkins            │ Michael Chang            │ Lisa Ray                 │
└───────────────────────┴──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

### Key Matrix Capabilities:

1. **Sticky Field Column**: The leftmost column containing Field Labels stays locked in place while you scroll horizontally across dozens of records.
2. **"Differences Only" Filter**: Click the **"Differences Only"** toggle in the toolbar. Smart Grid instantly collapses all rows where the records share identical values, displaying only fields with discrepancies (ideal for deduplication and contract reviews).
3. **In-Matrix Inline Editing**:
   - **Hover**: Hover over any editable cell in the matrix to display an edit pencil icon (`utility:edit`).
   - **Click to Edit**: Click on the cell to open the inline text/number editor.
   - **Commit Cell**: Type the new value and press `Enter` or click the green checkmark (`✓`). Press `Escape` or click `✕` to revert without staging.
   - **Draft Indicator**: Staged cells display a vibrant **"Draft"** badge and highlight in yellow.
   - **Sticky Save Dock**: A docked action bar appears at the bottom of the matrix showing pending changes count, **"Cancel"**, and **"Save"** buttons. Clicking Save triggers the pre-flight visual diff confirmation modal before committing to Salesforce.
4. **Independent Multi-Record Selection**: Select any combination of records using row checkboxes in standard view and click **Transpose** to isolate and compare them side by side without side-drawer preview interference.
5. **Horizontal Pagination & Navigation**: Use the Next (`>`) and Previous (`<`) navigation buttons in the transpose header to page smoothly across comparison records.

---

## 6. Finding, Filtering & Custom Views

### Quick Filter Bar & Active Filter Pills

- Type in the **Search This List** input for instant client-side filtering across all loaded text columns.
- Applied filters appear as dismissible filter pills below the toolbar (e.g., `[Stage: Closed Won ✕] [Amount > $50,000 ✕]`). Click the `✕` to clear individual filters.

### Advanced Filter Builder

- Click **"Filter Builder"** to build complex queries with nested **AND / OR** logic:
  - Supports string matching (`equals`, `contains`, `starts with`), numerical operators (`>`, `<`, `between`), and picklist sets (`in`, `not in`).
  - Evaluates on server-side SOQL for deep dataset querying.

### Field Picker & Column Ordering

- Click **"Select Columns"** (gear icon) to open the dual-listbox manager.
- Move fields between _Available_ and _Selected_, or drag items up and down to adjust display order.

### Saving & Sharing Personal Views

- Click the View Selector dropdown next to the grid title.
- Choose **"Save Current View As..."** to name your custom combination of columns, active filters, and sort orders.
- Mark your view as **Private** (visible only to you) or **Public** (shared with all users with grid access).

---

## 7. Grouping & In-Grid Analytics Charts

### 3-Level Hierarchical Grouping

- Drag column headers or use the **"Group By"** menu to organize rows by up to three simultaneous dimensions (e.g., _Industry &rarr; Stage &rarr; Lead Source_).
- Picklists group in their configured Salesforce administrative order rather than alphabetical order.
- Expand (`▶`) or collapse (`▼`) individual groups.

### Full-Width Bottom Analytics Panel

- Click the **Analytics** (`utility:chart`) icon in the grid toolbar to open the interactive analytics workspace docked directly at the bottom of the card below the datatable:
  - **Donut Chart**: Distribution breakdown across stages or categories with vector SVG slices and center totals.
  - **Horizontal Bar Chart**: Ranked volume or revenue per category.
  - **Funnel Chart**: Pipeline conversion across qualification phases.
- **Top Metric Cards**: Displays real-time summary KPI cards including **Total Records**, **Total Volume Count**, and **Distinct Groups**.
- **Interactive Category Breakdown**: Displays category legends with color dots, record counts, and percentage distributions.
- **Instant Dismissal**: Dismiss the analytics panel at any time by clicking the **"✕"** close button in the panel header, immediately returning to the full-height datatable view.
- **Clean Table Layout**: Persistent, screen-wasting column totals footer bars have been replaced with this on-demand analytics panel, maximizing the vertical view of your Salesforce records.

### Conditional Formatting & Data Bars

- Color-code critical thresholds:
  - _Red highlight_: Overdue close dates or negative profit margins.
  - _Green highlight_: Deals exceeding $100,000 or accounts marked "Hot".
  - _Inline Data Bars_: Horizontal proportional bars representing revenue magnitude directly inside cells.

---

## 8. Data Mobility, Safety & Change Auditing

### Adaptive Pre-Flight Diff Confirmation & Review Modal

Smart Grid employs an **Adaptive Safety Policy** to balance rapid data entry ergonomics with enterprise data protection:

1. **Micro-Edits ($\le 3$ Records)**: Clicking the toolbar **"Save"** button or pressing `Cmd+S` / `Ctrl+S` commits modifications directly in 1 click, delivering instantaneous spreadsheet speed.
2. **Bulk Edits ($> 3$ Records or Fill-Down)**: Modifying more than 3 records automatically triggers the **Pre-Flight Diff Confirmation Modal** before any database commit occurs.
3. **On-Demand Visual Diff**: You can manually inspect pending changes at any time by clicking the **Preview Eyeball Icon** (`utility:preview`) next to the Save button.
4. **Summary Badges & Per-Field Revert**:
   - Displays total records affected, operation type (Update, Insert, Delete), and modified fields.
   - Side-by-side comparison: Current values in red strike-through (`$50,000`) &rarr; Proposed values in bold green (`$75,000`).
   - Click the revert icon on any cell to discard an accidental edit without cancelling the remaining batch.

### Bulk CSV Import with 24-Hour Transactional Rollback

- Click the Export dropdown menu &rarr; **"Import CSV Dataset..."** to launch the 3-step import wizard:
  1. **Upload**: Drag and drop your `.csv` file. Smart Grid automatically parses headers and previews sample rows.
  2. **Mapping**: Review and adjust automatic column-to-field mappings with live sample value inspection.
  3. **Execute & Rollback Token**: Smart Grid performs chunked insertion with FLS sanitization and returns an **Audit Rollback Token**.
- **24-Hour Safety Rollback Window**: If you discover that an import batch contained corrupt data, click **"Undo Import"** within 24 hours to delete all created records in a single transaction. After 24 hours, rollback capabilities are locked to prevent orphaning downstream child workflows.
- **Audit Retention**: All import events and rollback actions are permanently logged to `Smart_Grid_Edit_Log__c` and retained for 90 days.

### Formula Shield

- Automatically protects against CSV and Excel formula injection (CVE-2014-3524).
- Neutralizes dangerous formulas (`=CMD|...`, `+SUM(...)`) during CSV exports and clipboard copies without altering your raw Salesforce records.

### Field-Level Change Audit History

- Every edit saved through Smart Grid creates an audit entry in `Smart_Grid_Edit_Log__c`.
- View who changed what field, the exact timestamp, the prior value, and the new value directly in the row action audit history viewer.

---

## 9. AI Copilot & Natural Language Features

_(Requires `Smart_Grid_AI_Premium` Permission Set)_

### Unified Smart Grid AI Omnibar (`Cmd + K` / Einstein Icon)

Press `Cmd + K` (Mac) or `Ctrl + K` (Windows) anywhere inside the grid, or click the **Smart Grid AI** agent icon (`utility:einstein`) in the toolbar to open the unified AI modal.

The Unified Omnibar blends **direct grid command execution** and **conversational analytical inquiries** into one seamless dialogue:

- **Conversational Inquiries & Metric Summaries**:
  - Ask questions naturally: _"What is the total revenue?"_, _"How many accounts are in California?"_, or _"Summarize this dataset"_.
  - Smart Grid AI computes real-time database rollups with `WITH USER_MODE` and renders a clean **AI Answer Card** featuring formatted metrics (e.g. `$14,078,203,000`).
  - **One-Click Copy**: Click the **Copy Answer** button to copy metrics and explanations straight to your clipboard.
  - **Contextual Action Chips**: Quick-pivot chips let you drill deeper or swing views with a single click.
  - **Multi-Turn Context**: Remembers previous questions within your session for smooth conversational follow-ups.

- **Natural Language Command Execution**:
  - Type direct workflow shortcuts: _"Transpose"_ &rarr; Swings into Matrix comparison mode.
  - Type analytical actions: _"Group by Stage and show chart"_ &rarr; Groups records and slides out the bottom analytics drawer.
  - Natural Language Sorting: _"Order by AnnualRevenue desc"_ &rarr; Re-sorts grid records immediately.

- **Pre-Flight Safe Bulk DML Updates**:
  - Type: _"Set Rating to Hot for selected rows"_ or _"Update Status to Closed"_.
  - Smart Grid displays an immediate visual diff preview showing previous values with red strike-through and proposed values in green before committing any changes to the database.

- **Cross-Object Intelligence**:
  - Switch objects instantly from the top toolbar dropdown (**Account**, **Opportunity**, **Contact**, **Case**, **Lead**). Smart Grid AI immediately inspects the active schema and contextualizes all calculations and commands.

### Data Quality & Health Score Drawer (Shield Icon)

Click the **Shield** icon (`utility:shield` - _Data Quality & Health Inspector_) in the toolbar to inspect dataset hygiene:

- **Overall Health Score (0 - 100)**: Evaluates missing critical fields, anomalous outliers, date hygiene, and potential duplicates.
- **One-Click "Filter Grid to Review"**: Click the action button on any detected issue card to immediately filter the grid to affected records (e.g. isolate rows missing phone numbers, or review accounts with overdue close dates).
- **Duplicate Candidates**: Identifies records sharing identical email domains, phone numbers, or normalized names.
- **Date Hygiene & Inactive Owners**: Flags open records with expired target dates or records assigned to inactive user accounts.
- **Outlier Detection**: Highlights numeric values that deviate significantly from segment averages (e.g., an Opportunity amount 4x above average).

### Interactive Onboarding Tour

- Click the **Help** (`?`) icon in the toolbar to trigger the interactive walkthrough.
- Guides new team members through editing, keyboard navigation, view personalization, and matrix comparisons.

---

## 10. Master Keyboard Shortcuts Cheat Sheet

| Category          | Action                                | Mac Shortcut            | Windows / Linux Shortcut          |
| :---------------- | :------------------------------------ | :---------------------- | :-------------------------------- |
| **Global**        | Open NLP Command Palette              | `Cmd + K`               | `Ctrl + K`                        |
|                   | Close Modal / Drawer                  | `Escape`                | `Escape`                          |
|                   | Hard Refresh & Clear Grid Cache       | `Cmd + Shift + R`       | `Ctrl + Shift + R` or `Ctrl + F5` |
| **Editing**       | Enter Cell Edit Mode                  | `Enter` or start typing | `Enter` or start typing           |
|                   | Confirm Cell Edit & Move Down         | `Enter`                 | `Enter`                           |
|                   | Cancel Cell Edit                      | `Escape`                | `Escape`                          |
|                   | Navigate Between Cells                | `Tab` / `Shift + Tab`   | `Tab` / `Shift + Tab`             |
|                   | Directional Navigation                | `Arrow Keys`            | `Arrow Keys`                      |
| **Range & Batch** | Expand Range Selection Marquee        | `Shift + Arrow Keys`    | `Shift + Arrow Keys`              |
|                   | Linear Fill Down Active Selection     | `Cmd + D`               | `Ctrl + D`                        |
|                   | Copy Selected Range (TSV Format)      | `Cmd + C`               | `Ctrl + C`                        |
|                   | Paste Spreadsheet Data from Clipboard | `Cmd + V`               | `Ctrl + V`                        |
|                   | Clear Selected Cell Values            | `Delete` or `Backspace` | `Delete` or `Backspace`           |
| **History**       | Undo Last Edit                        | `Cmd + Z`               | `Ctrl + Z`                        |
|                   | Redo Last Reverted Edit               | `Cmd + Shift + Z`       | `Ctrl + Y`                        |
