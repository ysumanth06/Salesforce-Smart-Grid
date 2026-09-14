# Salesforce Smart Grid — Getting Started & User Guide

Welcome to the **Salesforce Smart Grid** user guide. This guide explains how to use the interactive data grid, customize columns, manage views, and leverage built-in AI intelligence to streamline your Salesforce workflow.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites & Access](#2-prerequisites--access)
3. [Using the Grid (Standard Mode — Without AI)](#3-using-the-grid-standard-mode--without-ai)
   - [Inline Editing](#inline-editing)
   - [Reviewing & Saving Pending Changes](#reviewing--saving-pending-changes)
   - [Adding and Deleting Rows](#adding-and-deleting-rows)
   - [Fill Down & Active Column Copy](#fill-down--active-column-copy)
   - [Undo & Redo](#undo--redo)
   - [Sorting & Column Resizing](#sorting--column-resizing)
   - [Pagination & Page Size](#pagination--page-size)
   - [Column Totals & Aggregates](#column-totals--aggregates)
   - [Reading Pane](#reading-pane)
   - [Related Sub-Grids](#related-sub-grids)
   - [Exporting to CSV](#exporting-to-csv)
4. [Customizing Columns & Personalization](#4-customizing-columns--personalization)
   - [Field Picker](#field-picker)
   - [Supported Field Types & Limitations](#supported-field-types--limitations)
5. [Filtering & Saved Views](#5-filtering--saved-views)
   - [Quick Filter Bar](#quick-filter-bar)
   - [Advanced Filter Builder](#advanced-filter-builder)
   - [Managing Saved Views & Preferences](#managing-saved-views--preferences)
6. [AI-Powered Capabilities (AI Premium Mode)](#6-ai-powered-capabilities-ai-premium-mode)
   - [Feature 1: NLP Command Palette (Cmd+K / Ctrl+K)](#feature-1-nlp-command-palette-cmdk--ctrlk)
   - [Feature 2: Data Quality & Health Inspection Drawer](#feature-2-data-quality--health-inspection-drawer)
   - [Feature 3: Conversational Smart Grid Assistant](#feature-3-conversational-smart-grid-assistant)
   - [Feature 4: Guided Onboarding Tour](#feature-4-guided-onboarding-tour)
7. [Comparison: Using the Grid With vs Without AI](#7-comparison-using-the-grid-with-vs-without-ai)
8. [Keyboard Shortcuts Cheat Sheet](#8-keyboard-shortcuts-cheat-sheet)

---

## 1. Introduction

Salesforce Smart Grid transforms traditional record list views into a high-performance, spreadsheet-like workspace. Whether you are managing Accounts, Contacts, Opportunities, Cases, or custom objects, Smart Grid enables:

- **Mass inline editing** with live draft tracking and review.
- **Dynamic personalization** to add, hide, and reorder fields on the fly.
- **Enterprise data hygiene** with automated duplicate and outlier detection.
- **AI-driven command palette and assistant** to query, filter, and analyze data in natural language.

---

## 2. Prerequisites & Access

To use Smart Grid, your Salesforce Administrator must assign you one or both of the following Permission Sets:

| Permission Set                                     | What It Enables                                                                                                      | Who Needs It                                   |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| **SmartGrid User** (`SmartGrid_User`)              | Access to core grid rendering, inline editing, field picker, personal views, export, and related grids.              | All regular users and analysts.                |
| **SmartGrid AI Premium** (`Smart_Grid_AI_Premium`) | Unlocks the NLP Command Palette (`Cmd+K`), Data Quality Drawer, Conversational Assistant, and automated suggestions. | Power users, sales leaders, and data stewards. |

### Accessing the Grid

- **App Launcher**: Click the **App Launcher** (9 dots) in Salesforce and search for **Smart Grid** or **Smart Grid Explorer**.
- **Record & App Pages**: If placed by your administrator, the grid may appear directly on your Home Page, App Page, or as a tab on Record Detail pages.

---

## 3. Using the Grid (Standard Mode — Without AI)

You do **not** need AI licenses to use Smart Grid. All core spreadsheet functions operate entirely client-side and via secure standard Apex controllers.

### Inline Editing

1. Double-click or click into any editable cell (indicated by a pencil icon on hover).
2. Type your changes:
   - **Text / Number / Currency / Date**: Type directly into the cell.
   - **Picklists**: Select from the custom picklist dropdown.
3. Edited cells immediately highlight with a yellow indicator, and a live unsaved changes badge appears in the toolbar: **"Save (X)"**.

### Reviewing & Saving Pending Changes

- **Save Immediately**: Click **Save (X)** on the toolbar. The grid executes bulk DML under user security.
- **Review Modal**: Click the **Preview / Eye** icon next to Save to open the **Review Pending Changes** modal. This displays a side-by-side diff comparing the original database value with your draft value.
- **Reverting**: Revert individual fields in the Review modal or click **Discard All** to discard all unsaved drafts.
- **Partial Success Safety**: If some rows violate validation rules (e.g., missing required fields), successful rows save cleanly while failing rows highlight in red with exact error tooltips.

### Adding and Deleting Rows

- **Add Row**: Click **Add Row** in the toolbar. A new row (`new-1...`) appears at the top of the grid with empty fields ready for entry.
- **Delete Rows**: Select one or more rows using the row checkboxes and click **Delete Selected**.
  - If the row is a newly added unsaved draft, it is discarded immediately client-side.
  - If the row exists in Salesforce, a confirmation dialog appears before performing secure deletion.

### Fill Down & Active Column Copy

To quickly copy a value across multiple consecutive rows:

1. Select the rows you want to update using the checkboxes.
2. Edit the active cell on the first selected row.
3. Use the **Fill Down** action from the header menu. The value in the active column propagates across all selected rows instantly as draft changes.

### Undo & Redo

- Click the **Undo** button (or press `Ctrl+Z` / `Cmd+Z`) to revert your last edit.
- Click the **Redo** button (or press `Ctrl+Y` / `Cmd+Shift+Z`) to re-apply reverted edits.
- The grid maintains a multi-step history stack for peace of mind.

### Sorting & Column Resizing

- **Sort**: Click any column header to sort ascending. Click again to sort descending. An arrow indicator shows the active sort order.
- **Resize**: Drag the right border of any column header to resize.
- **Auto-Fit**: Double-click the column header divider to auto-fit the column to the longest value.

### Pagination & Page Size

- The pagination toolbar is anchored cleanly at the bottom of the card.
- Use **Previous** and **Next** buttons to navigate through pages.
- Use the **Page Size** combobox to switch between **10**, **25**, **50**, or **100** records per page.
- When page size exceeds the screen height, the table container scrolls vertically with sticky header columns.

### Column Totals & Aggregates

If configured on numeric or currency fields, the grid displays a sticky **Aggregates & Column Totals** card below the table showing:

- **Sum**: Total sum of values on the current view.
- **Avg**: Mathematical mean.
- **Min & Max**: Lowest and highest recorded values.

### Reading Pane

Click the **Reading Pane** icon on any row to open a side-by-side detail drawer. This allows you to inspect related fields and record details without navigating away from your active grid.

### Related Sub-Grids

For hierarchical data (e.g. viewing Contacts or Opportunities related to an Account):

1. Click the expand arrow on a parent record row.
2. A nested sub-grid opens inline with independent columns, editing, and pagination for child records.

### Exporting to CSV

Click the **Export** button in the toolbar. The grid generates an RFC 4180-compliant `.csv` file including all visible fields, column headers, and active filter criteria, instantly downloaded to your browser.

---

## 4. Customizing Columns & Personalization

### Field Picker

If you want to customize which columns appear in your grid:

1. Click the **Select Fields** (gear) button in the toolbar.
2. The **Field Picker Modal** opens with a dual-listbox:
   - **Available Fields**: All fields on the object that your user profile has permission to view.
   - **Selected Fields**: The fields currently rendered on your grid.
3. Select fields and use the right/left arrows to add or remove them.
4. Use the up/down arrows on the right listbox to reorder columns from left to right.
5. Click **Apply Changes**. The grid refreshes immediately with your customized column layout.

### Supported Field Types & Limitations

Smart Grid supports all common Salesforce standard and custom field types with proper input formatting:

| Supported Field Types       | Formatting & Behavior                                       |
| :-------------------------- | :---------------------------------------------------------- |
| **Text, String, Text Area** | Standard inline text input with character limit validation. |
| **Picklist**                | Custom dropdown template with active picklist options.      |
| **Currency & Number**       | Formatted currency/numeric input with decimal precision.    |
| **Date & DateTime**         | Datepicker calendar popup with timezone awareness.          |
| **Checkbox (Boolean)**      | Toggle checkbox switch.                                     |
| **Email, Phone, URL**       | Clickable links with type-specific validation.              |
| **Lookup / Reference Id**   | Displays linked record name with hover preview.             |

#### Field Limitations to Keep in Mind:

1. **Compound Fields**: Standard compound fields like `BillingAddress` or `MailingAddress` cannot be directly edited in datatables. Instead, select their component fields (`BillingStreet`, `BillingCity`, `BillingState`, `BillingPostalCode`).
2. **Long Text Area (> 32,000 characters)**: Displayed as truncated text with a click-to-expand popover. Inline editing of massive long text areas is restricted to prevent viewstate bloat.
3. **Rich Text / HTML Fields**: Stripped of dangerous HTML scripts; displayed in reading pane for formatted viewing.
4. **Binary / Blob Fields (Base64)**: Document attachments and file binaries cannot be rendered as table columns.
5. **Recommended Column Limit**: While there is no hard restriction, displaying between **5 to 20 columns** yields optimal performance and readability. Having more than 50 columns simultaneously may degrade browser scrolling speed.

---

## 5. Filtering & Saved Views

### Quick Filter Bar

- When a `Default_Filter_Field__c` is configured (e.g., `Industry` on Account or `StageName` on Opportunity), a combobox appears above the grid.
- Select any value to immediately filter rows. Select `-- All --` to clear the filter.

### Advanced Filter Builder

Click the **Filter** button in the toolbar to launch the **Advanced Filter Builder**:

1. Add one or more condition rows.
2. Choose the **Field**, **Comparison Operator**, and **Value**:
   - **Text Fields**: `equals`, `not_equal_to`, `contains`, `starts_with`, `is_null`
   - **Numeric / Date Fields**: `=`, `!=`, `>`, `<`, `>=`, `<=`, `is_null`
   - **Picklist Fields**: `equals`, `not_equal_to`, `in`
3. Choose the Logical Operator: **AND** (all conditions must match) or **OR** (any condition can match).
4. Click **Apply Filter**.

### Managing Saved Views & Preferences

- **Save Current View**: Click the view selector dropdown at the top-left and select **Save As New View**. Give it a descriptive name (e.g. _"West Coast Enterprise Prospects"_).
- **Default View**: Check the "Set as my default view" box so this view loads automatically whenever you visit the page.
- **Switching Views**: Use the dropdown selector to toggle between your personal saved views and the system default view.
- **Reset View**: Click **Reset View** to discard temporary column or filter changes and return to the baseline metadata configuration.

---

## 6. AI-Powered Capabilities (AI Premium Mode)

When assigned the **SmartGrid AI Premium** permission set, an additional suite of intelligence tools becomes active on your toolbar.

---

### Feature 1: NLP Command Palette (`Cmd+K` / `Ctrl+K`)

The **Command Palette** allows you to talk to your data in plain English. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) anywhere on the grid to open the modal.

#### How It Works:

Type a natural language request. The AI engine parses your prompt into verified SOQL filters, sort orders, and field selections without requiring you to build manual queries.

#### Concrete Examples:

##### Example 1: Targeted Segment Filtering

- **User Prompt**: `"Show me all healthcare and technology accounts with revenue greater than 1 million"`
- **AI Action**: Translates to:
  - `Industry IN ('Healthcare', 'Technology')`
  - `AnnualRevenue > 1000000`
- **Result**: The grid updates in real time to show only high-value accounts in those two verticals.

##### Example 2: Missing Data Auditing

- **User Prompt**: `"Find hot accounts that don't have a phone number"`
- **AI Action**: Translates to:
  - `Rating = 'Hot'`
  - `Phone = null`
- **Result**: Filters the grid to high-priority accounts needing telephone contact information.

##### Example 3: Natural Language Sorting & Limits

- **User Prompt**: `"Sort by highest revenue and show top 25"`
- **AI Action**: Sets sort order to `AnnualRevenue DESC` and page size to `25`.

---

### Feature 2: Data Quality & Health Inspection Drawer

Click the **Data Health** (heartbeat) button in the toolbar to open the **Data Quality Drawer**.

#### What It Analyzes:

The service scans all loaded records and computes a **Health Score (0 to 100)** based on four hygiene factors:

1. **Missing Data**: Mandatory or critical fields left blank (e.g. unassigned Industry, blank Phone).
2. **Duplicate Candidates**: Records sharing identical names, domains, or phone numbers.
3. **Outliers**: Extreme values that skew metrics (e.g. an account with revenue 4x above the segment mean).
4. **Anomalies**: Inconsistent status or rating combinations.

#### Concrete Example:

- **Health Score**: `74 / 100 (Needs Attention)`
- **Detected Issues**:
  - _Outlier_: Account `"MegaGlobal Corp"` has `AnnualRevenue = $850,000,000` (Mean is $12,000,000).
  - _Missing Data_: 6 Accounts have `Type = null`.
  - _Duplicate_: `"Precision Labs"` appears twice with the same website domain.
- **Benefit**: Pinpoints dirty data instantly before exporting or running sales campaigns.

---

### Feature 3: Conversational Smart Grid Assistant

Click the **AI Assistant** (Einstein sparkle) button in the toolbar to slide out the **Smart Grid Assistant** drawer.

#### What It Does:

The Assistant is a conversational copilot that understands the **exact dataset and active filters** currently displayed on your screen.

#### Concrete Examples:

##### Example 1: Instant Metric Calculations

- **User Question**: _"What is the total and average revenue of the accounts currently shown?"_
- **Assistant Response**: _"Based on your active filter (Industry = Technology, 24 records), total revenue is **$42.5M** with an average revenue of **$1.77M** per account. 3 accounts currently do not report revenue."_

##### Example 2: Pipeline Strategy Suggestions

- **User Question**: _"Which of these accounts should our reps prioritize first?"_
- **Assistant Response**: _"I recommend prioritizing the 4 accounts marked with Rating = 'Hot' that have over $5M in Annual Revenue: Acme Corp, Apex Systems, Sterling Cloud, and DataFlow Inc."_

---

### Feature 4: Guided Onboarding Tour

Click the **Help / Onboarding** icon (`?`) in the toolbar to open the interactive onboarding modal.

- Walks new team members through editing, filtering, personalizing columns, and saving views step by step.
- Self-paced slides with visual cues ensure zero training downtime.

---

## 7. Comparison: Using the Grid With vs Without AI

| Capability                           |      Standard Mode (No AI)      |              AI Premium Mode               |
| :----------------------------------- | :-----------------------------: | :----------------------------------------: |
| **Required Permission Set**          |        `SmartGrid_User`         | `SmartGrid_User` + `Smart_Grid_AI_Premium` |
| **Mass Inline Editing**              | :white_check_mark: Full Support |      :white_check_mark: Full Support       |
| **Bulk Save & Partial Success**      | :white_check_mark: Full Support |      :white_check_mark: Full Support       |
| **Field Picker & Personal Views**    | :white_check_mark: Full Support |      :white_check_mark: Full Support       |
| **Filter Builder (Operators/Logic)** | :white_check_mark: Full Support |      :white_check_mark: Full Support       |
| **Column Totals & Aggregates**       | :white_check_mark: Full Support |      :white_check_mark: Full Support       |
| **Reading Pane & Related Grids**     | :white_check_mark: Full Support |      :white_check_mark: Full Support       |
| **CSV Export**                       | :white_check_mark: Full Support |      :white_check_mark: Full Support       |
| **NLP Command Palette (`Cmd+K`)**    |      :x: Hidden / Inactive      |         :white_check_mark: Active          |
| **Data Quality & Health Score**      |      :x: Hidden / Inactive      |         :white_check_mark: Active          |
| **Conversational Assistant Drawer**  |      :x: Hidden / Inactive      |         :white_check_mark: Active          |

---

## 8. Keyboard Shortcuts Cheat Sheet

| Action                              | Mac Shortcut          | Windows / Linux Shortcut          |
| :---------------------------------- | :-------------------- | :-------------------------------- |
| **Open Command Palette**            | `Cmd + K`             | `Ctrl + K`                        |
| **Close Open Modal / Drawer**       | `Escape`              | `Escape`                          |
| **Undo Last Edit**                  | `Cmd + Z`             | `Ctrl + Z`                        |
| **Redo Last Edit**                  | `Cmd + Shift + Z`     | `Ctrl + Y`                        |
| **Navigate Grid Cells**             | `Tab` / `Shift + Tab` | `Tab` / `Shift + Tab`             |
| **Submit Natural Language Prompt**  | `Enter`               | `Enter`                           |
| **Hard Refresh Grid (Clear Cache)** | `Cmd + Shift + R`     | `Ctrl + Shift + R` or `Ctrl + F5` |
