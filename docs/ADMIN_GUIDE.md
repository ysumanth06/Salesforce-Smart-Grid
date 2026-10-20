# Salesforce Smart Grid — Comprehensive Administrator & Implementation Guide

This guide is designed for Salesforce System Administrators, Technical Architects, and Developers. It covers end-to-end installation, metadata configuration, Lightning App Builder deployment, security governance, the universal AI suite, spreadsheet-speed data editing, custom formula calculations, data quality monitoring, error recovery, and enterprise performance optimization for the **Salesforce Smart Grid**.

---

## Table of Contents

1. [Architecture & Component Ecosystem](#1-architecture--component-ecosystem)
2. [Data & Metadata Model Reference](#2-data--metadata-model-reference)
   - [Smart_Grid_Config\_\_mdt (Master Grid Configuration)](#smart_grid_config__mdt)
   - [Smart_Grid_Column\_\_mdt (Relational Column Definitions)](#smart_grid_column__mdt)
   - [Smart_Grid_Format_Rule\_\_mdt (Conditional Formatting)](#smart_grid_format_rule__mdt)
   - [Smart_Grid_AI_Config\_\_mdt (AI Provider Settings)](#smart_grid_ai_config__mdt)
   - [Smart_Grid_License\_\_mdt (Feature Licensing & Tiers)](#smart_grid_license__mdt)
   - [Custom Objects: Smart_Grid_View\_\_c & Smart_Grid_User_Pref\_\_c](#custom-objects)
   - [Platform Event: Smart_Grid_Telemetry\_\_e](#platform-event-smart_grid_telemetry__e)
   - [Custom Tabs & Flexipages](#custom-tabs--flexipages)
3. [Step-by-Step: Adding Smart Grid for Any Object](#3-step-by-step-adding-smart-grid-for-any-object)
   - [Example A: Account Management Grid (JSON Column Mode)](#example-a-account-management-grid)
   - [Example B: Opportunity Pipeline Grid (With Conditional Rules & Totals)](#example-b-opportunity-pipeline-grid)
   - [Example C: Custom Object Grid (Project\_\_c with Relational Columns)](#example-c-custom-object-grid)
   - [Example D: Embedded Child Related Grid (Account → Contacts & Opportunities)](#example-d-embedded-child-related-grid)
4. [Lightning App Builder Deployment & Properties](#4-lightning-app-builder-deployment--properties)
   - [App Page Placement (Dedicated Full-Screen Workspace)](#app-page-placement)
   - [Record Detail Page Placement (Parent-Child Context)](#record-detail-page-placement)
   - [Home Page & Utility Bar Placement](#home-page--utility-bar-placement)
   - [Component Properties Reference](#component-properties-reference)
5. [Permissions & Security Governance](#5-permissions--security-governance)
   - [Permission Sets Architecture (SmartGrid_User vs Smart_Grid_AI_Premium)](#permission-sets-architecture)
   - [User License Compatibility (Salesforce vs Platform vs Experience Cloud)](#user-license-compatibility)
   - [CRUD & Field-Level Security (FLS) Enforcement](#crud--field-level-security-fls-enforcement)
   - [SQL & CSV Injection Prevention](#sql--csv-injection-prevention)
6. [Universal AI Suite Configuration & Customization](#6-universal-ai-suite-configuration--customization)
   - [Universal AI Provider Architecture](#universal-ai-provider-architecture)
   - [Option 1: Built-in Heuristic / Offline Mock Provider (Default)](#option-1-built-in-heuristic--offline-mock-provider)
   - [Option 2: External BYO-LLM via Named Credentials (OpenAI, Claude, Gemini)](#option-2-external-byo-llm-via-named-credentials)
   - [Option 3: Native Salesforce Einstein Generative AI (Prompt Builder)](#option-3-native-salesforce-einstein-generative-ai)
   - [Option 4: Pluggable Custom Apex Provider (Custom_Class)](#option-4-pluggable-custom-apex-provider)
   - [Customizing Heuristic Phrases & Metrics in Apex](#customizing-heuristic-phrases--metrics-in-apex)
   - [Customizing NLP Filter Keywords in Apex](#customizing-nlp-filter-keywords-in-apex)
   - [Customizing Starter Chips in LWC](#customizing-starter-chips-in-lwc)
   - [Multi-Object Polymorphism (Branching by SObject)](#multi-object-polymorphism)
   - [AI Bulk DML & Natural Language Updates](#ai-bulk-dml--natural-language-updates)
   - [Declarative Feature Gating](#declarative-feature-gating)
7. [Spreadsheet-Speed Inline Editing & Safe DML Workflow](#7-spreadsheet-speed-inline-editing--safe-dml-workflow)
   - [Supported Field Types & Custom Inline Picklists](#supported-field-types--custom-inline-picklists)
   - [Copy & Paste from External Spreadsheets (Excel & Google Sheets)](#copy--paste-from-external-spreadsheets)
   - [Dirty State Tracking, Undo/Redo & Fill Down](#dirty-state-tracking-undoredo--fill-down)
   - [Add Row Staging](#add-row-staging)
   - [Review Modal (Visual Diff Viewer & Granular Per-Field Revert)](#review-modal)
   - [DML Confirmation Modal (Pre-Flight Preview)](#dml-confirmation-modal)
   - [In-Grid DML Error Resolution & Recovery Wizard](#in-grid-dml-error-resolution--recovery-wizard)
8. [Column Management & Excel-Style In-Column Actions](#8-column-management--excel-style-in-column-actions)
   - [Field Picker Modal](#field-picker-modal)
   - [Pin Left / Unpin (Column Freezing)](#pin-left--unpin)
   - [Auto-Fit Column Width (Canvas-Based Font Measurement)](#auto-fit-column-width)
   - [In-Column Checklist Filter (Distinct Values with Record Counts)](#in-column-checklist-filter)
   - [Double-Click Header Separator Auto-Resize](#double-click-header-separator-auto-resize)
9. [Advanced Filter Builder & Active Filter Pills](#9-advanced-filter-builder--active-filter-pills)
   - [Nested Filter Groups (Recursive AND/OR Logic)](#nested-filter-groups)
   - [Type-Specific Operators Reference](#type-specific-operators-reference)
   - [Active Filter Pills Bar](#active-filter-pills-bar)
   - [Relative SOQL Date Literals](#relative-soql-date-literals)
10. [In-Grid Analytics Panel & Dataset Visualizations](#10-in-grid-analytics-panel--dataset-visualizations)
    - [Architecture & Placement](#architecture--placement)
    - [Supported Visualizations (Donut, Bar, Funnel)](#supported-visualizations)
    - [Real-Time Metric Tiles & Category Legend](#real-time-metric-tiles--category-legend)
    - [Dismissal Mechanics (✕ Button)](#dismissal-mechanics)
11. [Client-Side Virtual Formula Evaluator](#11-client-side-virtual-formula-evaluator)
    - [Formula Engine Architecture (Shunting-Yard / RPN)](#formula-engine-architecture)
    - [Real-Time Reactive Recalculation on Draft Edits](#real-time-reactive-recalculation)
    - [Supported Formula Syntax & Examples](#supported-formula-syntax--examples)
12. [Conditional Formatting Rules Engine](#12-conditional-formatting-rules-engine)
    - [Rule Evaluation & Priority Resolution](#rule-evaluation--priority-resolution)
    - [Cell Colors, Row Highlights & Icon Badges](#cell-colors-row-highlights--icon-badges)
13. [Split Views, Reading Pane & Tabbed Related Sub-Grids](#13-split-views-reading-pane--tabbed-related-sub-grids)
    - [Reading Pane (Side Drawer vs Bottom Dock)](#reading-pane)
    - [Tabbed Child Related Sub-Grids (Parent-Child Navigation)](#tabbed-child-related-sub-grids)
14. [Custom Views, Personalization & User Preference Persistence](#14-custom-views-personalization--user-preference-persistence)
    - [Public Team Views vs Private User Views](#public-team-views-vs-private-user-views)
    - [User Preference Caching (Widths, Order, Page Size)](#user-preference-caching)
15. [Data Quality & Health Score Engine](#15-data-quality--health-score-engine)
    - [Composite Health Score Algorithm (0-100%)](#composite-health-score-algorithm)
    - [Zero-CPU Database-Level Duplicate Detection](#zero-cpu-database-level-duplicate-detection)
    - [Missing Critical Data & Statistical Outliers](#missing-critical-data--statistical-outliers)
    - [One-Click Grid Isolation](#one-click-grid-isolation)
16. [Enterprise Spreadsheet Exporter & Interactive Onboarding Tour](#16-enterprise-spreadsheet-exporter--interactive-onboarding-tour)
    - [Export to Formatted Excel (.xls)](#export-to-formatted-excel-xls)
    - [Export to CSV (.csv) with UTF-8 BOM & CWE-1236 Sanitization](#export-to-csv)
    - [4-Step Interactive Product Walkthrough](#4-step-interactive-product-walkthrough)
17. [In-Memory LRU Pagination Cache & Governor Limits](#17-in-memory-lru-pagination-cache--governor-limits)
    - [LRU Page Cache Architecture](#lru-page-cache-architecture)
    - [Governor Limit Safeguards Reference Table](#governor-limit-safeguards-reference-table)
18. [Telemetry, Auditing & Observability](#18-telemetry-auditing--observability)
    - [Smart_Grid_Telemetry\_\_e Platform Event](#smart_grid_telemetry__e-platform-event)
    - [Audit Logging Implementation (Flow & Apex)](#audit-logging-implementation)
19. [Keyboard Shortcuts Cheat Sheet](#19-keyboard-shortcuts-cheat-sheet)
20. [Troubleshooting & FAQs](#20-troubleshooting--faqs)
21. [NextGen Visual Administration Studio & Metadata Deployment](#21-nextgen-visual-administration-studio--metadata-deployment)
22. [Enterprise Governance, Cursors & Change Auditing](#22-enterprise-governance-cursors--change-auditing)
23. [Automated End-to-End Testing & Playwright Verification](#23-automated-end-to-end-testing--playwright-verification)

---

## 1. Architecture & Component Ecosystem

The Salesforce Smart Grid is built with an enterprise three-tier architecture that separates user presentation, business logic, and metadata persistence. All data operations strictly adhere to Salesforce Field-Level Security (FLS) and `WITH USER_MODE`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  smartDataGrid (Master Orchestrator LWC)                              │
│  ├── c-smart-grid-datatable (Custom picklist & formatted cells)       │
│  ├── c-smart-grid-filter-bar & c-smart-grid-filter-builder            │
│  ├── c-smart-grid-field-picker & c-smart-grid-view-selector           │
│  ├── c-smart-grid-review-modal (Pre-commit diff comparison)           │
│  ├── c-smart-grid-dml-confirm-modal (AI bulk update confirmation)     │
│  ├── c-smart-grid-resolution-modal (Step-by-step DML error wizard)    │
│  ├── c-smart-grid-reading-pane (Split-view record detail inspector)   │
│  ├── c-smart-grid-related-grid (Tabbed parent-child sub-grids)        │
│  ├── c-smart-grid-command-palette (Unified Smart Grid AI Omnibar - Cmd+K & Q&A)│
│  ├── c-smart-grid-assistant (Conversational AI analytics backend engine)│
│  ├── c-smart-grid-data-quality (Health score & duplicate inspector - Shield)   │
│  └── c-smart-grid-onboarding (4-step interactive guided tour)         │
│  Shared LWC Client Utilities:                                         │
│  ├── dirtyStateManager (Undo/Redo stack, draft diffing, fill down)    │
│  ├── columnHeaderMenuManager (Pinning, auto-fit, checklist filters)   │
│  ├── columnWidthCalculator (HTML5 Canvas font metric measurement)     │
│  ├── formulaEvaluator (Sandboxed Shunting-Yard RPN formula engine)    │
│  ├── formatRuleEngine (Client-side conditional formatting engine)     │
│  ├── spreadsheetExporter & csvHelper (Styled Excel & UTF-8 CSV export)│
│  └── gridPageCache (In-memory 10-page LRU pagination cache)           │
├────────────────────────────────────────────────────────────────────────┤
│                          BUSINESS LOGIC LAYER                          │
│  SmartGridController (Thin @AuraEnabled security boundary)            │
│  ├── GridQueryBuilder (FLS-safe dynamic SOQL & relative date literals)│
│  ├── SmartGridIdValidator (Id format & delete authorization check)    │
│  ├── SmartGridLicenseService (Server-side feature & entitlement gating│
│  ├── SmartGridNLPEngine (Universal AI routing & provider resolution)  │
│  │   ├── SmartGridMockAIProvider (Deterministic regex & live SOQL)    │
│  │   ├── SmartGridExternalAIProvider (Callout via Named Credentials)  │
│  │   └── SmartGridEinsteinAIProvider (Models API / Prompt Builder)    │
│  ├── SmartGridDataQualityService (DB GROUP BY duplicates & outliers)  │
│  ├── SmartGridNLPDMLHandler (AI-driven dry run & bulk DML execution)  │
│  ├── SmartGridFormatEngine (Metadata format rule retriever)           │
│  ├── SmartGridViewService (Public/Private saved view persistence)     │
│  ├── SmartGridUserPrefService (Individual column width/order cache)   │
│  └── SmartGridTelemetryService (Platform event publisher)             │
├────────────────────────────────────────────────────────────────────────┤
│                          METADATA & DATA LAYER                         │
│  Custom Metadata Types (Declarative Admin Setup):                      │
│    - Smart_Grid_Config__mdt, Smart_Grid_Column__mdt                   │
│    - Smart_Grid_Format_Rule__mdt, Smart_Grid_AI_Config__mdt           │
│    - Smart_Grid_License__mdt                                          │
│  Custom Objects: Smart_Grid_View__c, Smart_Grid_User_Pref__c          │
│  Platform Event: Smart_Grid_Telemetry__e                              │
│  Custom Tabs: Smart_Grid_Explorer (Lightning Flexipage)               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data & Metadata Model Reference

### Smart_Grid_Config\_\_mdt

The primary metadata record defining grid behavior, target object, and column layouts.

| Field Name                 | Type            | Description                                                                                                              | Default  |
| :------------------------- | :-------------- | :----------------------------------------------------------------------------------------------------------------------- | :------- |
| `DeveloperName`            | Text(40)        | Unique API identifier (e.g. `Account_Demo_Grid`, `Opportunity_Pipeline_Grid`).                                           | Required |
| `MasterLabel`              | Text(80)        | Friendly display label for administrators.                                                                               | Required |
| `Object_API_Name__c`       | Text(80)        | Target SObject API Name (`Account`, `Opportunity`, `Invoice__c`).                                                        | Required |
| `Columns_JSON__c`          | LongText(10000) | JSON array defining column fields, order, editability, and initial widths (used when `Use_Advanced_Config__c` is false). | `[]`     |
| `Use_Advanced_Config__c`   | Checkbox        | If `true`, ignores `Columns_JSON__c` and queries relational child records in `Smart_Grid_Column__mdt`.                   | `false`  |
| `Related_Object__c`        | Text(80)        | Comma-separated list of child relationships for sub-grids (e.g., `Contacts, Opportunities, Cases`).                      | Optional |
| `Default_Filter_Field__c`  | Text(80)        | Field API name used in quick filter bar (e.g. `Industry`, `StageName`).                                                  | Optional |
| `Default_Sort_Field__c`    | Text(80)        | Initial sort column.                                                                                                     | `Name`   |
| `Record_Limit__c`          | Number(6,0)     | Maximum query rows per page/fetch (default: 200, max: 2000).                                                             | `200`    |
| `Is_Active__c`             | Checkbox        | Master active toggle for the grid configuration.                                                                         | `true`   |
| `Allow_Personalization__c` | Checkbox        | Allows end users to customize visible columns via the Field Picker.                                                      | `true`   |
| `Enable_Add_Row__c`        | Checkbox        | Displays the **Add Row** button in the toolbar.                                                                          | `true`   |
| `Enable_Delete__c`         | Checkbox        | Displays the **Delete Selected** button in the toolbar.                                                                  | `true`   |
| `Enable_Export__c`         | Checkbox        | Displays the **Export** menu (CSV / Excel) in the toolbar.                                                               | `true`   |
| `Enable_Filters__c`        | Checkbox        | Displays the Quick Filters toggle and Advanced Filter Builder button.                                                    | `true`   |
| `Enable_Reading_Pane__c`   | Checkbox        | Displays the split-view Reading Pane button.                                                                             | `true`   |
| `Totals_Fields_JSON__c`    | LongText(1000)  | JSON array of currency/number fields to aggregate in the grid footer (e.g. `["AnnualRevenue"]`).                         | `[]`     |

#### Sample `Columns_JSON__c` Payload:

```json
[
  { "field": "Name", "order": 1, "editable": true, "width": 240 },
  { "field": "AccountNumber", "order": 2, "editable": true, "width": 150 },
  { "field": "Industry", "order": 3, "editable": true, "width": 160 },
  { "field": "AnnualRevenue", "order": 4, "editable": true, "width": 150 },
  { "field": "Phone", "order": 5, "editable": true, "width": 150 },
  { "field": "BillingCity", "order": 6, "editable": true, "width": 140 },
  { "field": "Rating", "order": 7, "editable": true, "width": 120 }
]
```

---

### Smart_Grid_Column\_\_mdt

Used when `Use_Advanced_Config__c = true` for relational, record-by-record column declarations instead of a JSON blob.

| Field Name             | Type               | Description                                                                   |
| :--------------------- | :----------------- | :---------------------------------------------------------------------------- |
| `Smart_Grid_Config__c` | EntityRelationship | Lookup to parent `Smart_Grid_Config__mdt` record.                             |
| `Field_API_Name__c`    | Text(80)           | SObject field API name (e.g. `BillingCity`, `CloseDate`, `Amount`).           |
| `Display_Label__c`     | Text(80)           | Optional custom column header label. Defaults to field schema label if blank. |
| `Order__c`             | Number(3,0)        | Column display order from left to right (1, 2, 3...).                         |
| `Column_Width__c`      | Number(4,0)        | Default initial column pixel width (e.g. `160`).                              |
| `Is_Editable__c`       | Checkbox           | Governs inline editing permission on this column.                             |
| `Is_Sortable__c`       | Checkbox           | Enables or disables column header sorting.                                    |

---

### Smart_Grid_Format_Rule\_\_mdt

Defines conditional formatting highlights for table cells or entire rows based on data values.

| Field Name             | Type               | Description                                                                                                                               |
| :--------------------- | :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `Smart_Grid_Config__c` | EntityRelationship | Target `Smart_Grid_Config__mdt` record.                                                                                                   |
| `Field_API_Name__c`    | Text(80)           | Target field to evaluate (e.g. `StageName`, `Rating`, `AnnualRevenue`).                                                                   |
| `Operator__c`          | Text(20)           | Comparison operator: `EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `LESS_THAN`, `GREATER_OR_EQUAL`, `LESS_OR_EQUAL`, `CONTAINS`, `STARTS_WITH`. |
| `Value__c`             | Text(255)          | Value to compare against (e.g. `Closed Won`, `Hot`, `1000000`).                                                                           |
| `Cell_Color__c`        | Text(40)           | Highlight color name (`green`, `red`, `yellow`, `blue`). Maps to CSS class `smart-grid-color-{color}`.                                    |
| `Text_Color__c`        | Text(40)           | Optional font color override.                                                                                                             |
| `Row_Highlight__c`     | Checkbox           | If `true`, highlights the entire row; if `false`, highlights only the matching cell.                                                      |
| `Icon_Name__c`         | Text(80)           | SLDS icon name displayed next to the cell value (e.g. `utility:success`, `utility:warning`).                                              |
| `Priority__c`          | Number(3,0)        | Evaluation order when multiple rules match a record (1 = highest priority).                                                               |
| `Is_Active__c`         | Checkbox           | Toggles this rule on or off.                                                                                                              |

---

### Smart_Grid_AI_Config\_\_mdt

Controls the AI engine routing, LLM provider, prompt templates, and feature gating per grid.

| Field Name                 | Type               | Description                                                                                    | Default        |
| :------------------------- | :----------------- | :--------------------------------------------------------------------------------------------- | :------------- |
| `Grid_Config__c`           | EntityRelationship | Target `Smart_Grid_Config__mdt` record.                                                        | Required       |
| `Provider_Type__c`         | Text(50)           | `Offline_Mock`, `OpenAI_Compatible`, `Anthropic`, `Google_Gemini`, `Einstein`, `Custom_Class`. | `Offline_Mock` |
| `Named_Credential__c`      | Text(80)           | Salesforce Named Credential API name for external callouts (e.g. `Smart_Grid_LLM_Endpoint`).   | Optional       |
| `Model_Identifier__c`      | Text(80)           | LLM model ID (e.g. `gpt-4o-mini`, `claude-3-5-sonnet`, `gemini-1.5-flash`).                    | `gpt-4o-mini`  |
| `Prompt_Template__c`       | Text(80)           | API name of Salesforce Prompt Builder template (used when Provider is `Einstein`).             | Optional       |
| `Custom_Provider_Class__c` | Text(80)           | Apex class name implementing `ISmartGridAIProvider` (used when Provider is `Custom_Class`).    | Optional       |
| `Enable_NLP__c`            | Checkbox           | Master toggle for natural language Command Palette (<kbd>Cmd</kbd>+<kbd>K</kbd>).              | `true`         |
| `Enable_Chat__c`           | Checkbox           | Master toggle for the Conversational Data Assistant drawer.                                    | `true`         |
| `Enable_Suggestions__c`    | Checkbox           | Master toggle for Data Quality health inspections.                                             | `true`         |
| `Confidence_Threshold__c`  | Number(3,2)        | Minimum confidence required to accept AI SOQL translations (0.00 - 1.00).                      | `0.70`         |
| `Max_Tokens__c`            | Number(5,0)        | Maximum token ceiling for external LLM API responses.                                          | `500`          |

---

### Smart_Grid_License\_\_mdt

Provides server-side feature licensing and gating. Allows administrators to turn off specific capabilities org-wide or link them to a required Permission Set.

| DeveloperName              | Feature_Name\_\_c          | Is_Enabled\_\_c | Is_Premium\_\_c | Permission_Set\_\_c     | Description                                                     |
| :------------------------- | :------------------------- | :-------------- | :-------------- | :---------------------- | :-------------------------------------------------------------- |
| `CORE_GRID`                | `CORE_GRID`                | `true`          | `false`         | _(None)_                | Core inline editing and viewing.                                |
| `NLP_COMMAND_PALETTE`      | `NLP_COMMAND_PALETTE`      | `true`          | `true`          | `Smart_Grid_AI_Premium` | Natural language Command Palette (<kbd>Cmd</kbd>+<kbd>K</kbd>). |
| `AI_SUGGESTIONS`           | `AI_SUGGESTIONS`           | `true`          | `true`          | `Smart_Grid_AI_Premium` | Data Quality health scores & duplicates.                        |
| `CONVERSATIONAL_ASSISTANT` | `CONVERSATIONAL_ASSISTANT` | `true`          | `true`          | `Smart_Grid_AI_Premium` | Conversational chat drawer.                                     |

---

### Custom Objects

#### `Smart_Grid_View__c`

Stores saved views created by administrators or users.

- `Grid_Config_Name__c`: Matches `Smart_Grid_Config__mdt.DeveloperName`.
- `Columns_JSON__c`: Serialized field visibility and column order.
- `Filter_Logic__c`: Filter JSON payload (conditions, operators, AND/OR logic).
- `Sort_Field__c` & `Sort_Direction__c`: Active sort state.
- `Is_Public__c`: Checkbox. If `true`, visible to all users; if `false`, private to owner.
- `Is_Default__c`: Checkbox. If `true`, loads automatically on grid launch for the owner.

#### `Smart_Grid_User_Pref__c`

Persists individual user preferences across browser sessions without admin intervention.

- `User__c`: Lookup to `User`.
- `Grid_Config_Name__c`: Matches target grid.
- `Active_View_Id__c`: Last selected saved view.
- `Column_Widths_JSON__c`: Key-value map of column widths resized by the user.
- `Page_Size__c`: Selected records per page (25, 50, 100, 200).

---

### Platform Event: `Smart_Grid_Telemetry__e`

Used for audit tracking, user engagement analytics, and security compliance.

- `Event_Type__c`: `VIEW_LOAD`, `BULK_UPDATE`, `DATA_EXPORT`, `AI_PROMPT`, `RECORD_DELETE`.
- `User_Id__c`: ID of the executing user.
- `Object_API_Name__c`: SObject accessed.
- `Record_Count__c`: Number of rows affected.
- `Execution_Time_Ms__c`: Server execution duration in milliseconds.

---

### Custom Tabs & Flexipages

- **Custom Tab**: `Smart_Grid_Explorer` (`/lightning/n/Smart_Grid_Explorer`) allows users to access the grid as a primary workspace navigation tab.
- **Master Flexipage**: `Smart_Grid_Demo` hosts the master grid component and provides an out-of-the-box interactive environment.

---

## 3. Step-by-Step: Adding Smart Grid for Any Object

Smart Grid works with **any standard or custom Salesforce object** with zero Apex code required.

### Example A: Account Management Grid

#### Step 1: Create the Metadata Record

1. Navigate to **Setup → Custom Metadata Types**.
2. Click **Manage Records** next to **Smart Grid Config** → Click **New**:
   - **Label**: `Account Master Grid`
   - **Smart Grid Config Name**: `Account_Master_Grid`
   - **Object API Name**: `Account`
   - **Default Filter Field**: `Industry`
   - **Default Sort Field**: `Name`
   - **Record Limit**: `200`
   - **Columns JSON**:
     ```json
     [
       { "field": "Name", "order": 1, "editable": true, "width": 240 },
       { "field": "AccountNumber", "order": 2, "editable": true, "width": 150 },
       { "field": "Industry", "order": 3, "editable": true, "width": 160 },
       { "field": "AnnualRevenue", "order": 4, "editable": true, "width": 150 },
       { "field": "Phone", "order": 5, "editable": true, "width": 150 },
       { "field": "Rating", "order": 6, "editable": true, "width": 120 }
     ]
     ```
   - **Totals Fields JSON**: `["AnnualRevenue"]`
   - **Related Object**: `Contacts, Opportunities, Cases`
3. Click **Save**.

---

### Example B: Opportunity Pipeline Grid

#### Step 1: Create the Grid Config Record

1. In **Setup → Custom Metadata Types → Smart Grid Config**, click **New**:
   - **Label**: `Opportunity Pipeline Grid`
   - **Smart Grid Config Name**: `Opportunity_Pipeline_Grid`
   - **Object API Name**: `Opportunity`
   - **Default Filter Field**: `StageName`
   - **Default Sort Field**: `CloseDate`
   - **Record Limit**: `500`
   - **Columns JSON**:
     ```json
     [
       { "field": "Name", "order": 1, "editable": true, "width": 240 },
       { "field": "AccountId", "order": 2, "editable": true, "width": 200 },
       { "field": "StageName", "order": 3, "editable": true, "width": 160 },
       { "field": "Amount", "order": 4, "editable": true, "width": 140 },
       { "field": "CloseDate", "order": 5, "editable": true, "width": 140 },
       { "field": "Probability", "order": 6, "editable": false, "width": 120 }
     ]
     ```
   - **Totals Fields JSON**: `["Amount"]`
2. Click **Save**.

#### Step 2: Add Conditional Format Rules

1. Under **Custom Metadata Types**, click **Manage Records** next to **Smart Grid Format Rule** → Click **New**:
   - **Label**: `Won Deals Highlight`
   - **Smart Grid Format Rule Name**: `Won_Deals_Highlight`
   - **Smart Grid Config**: `Opportunity_Pipeline_Grid`
   - **Field API Name**: `StageName`
   - **Operator**: `EQUALS`
   - **Value**: `Closed Won`
   - **Cell Color**: `green`
   - **Icon Name**: `utility:success`
   - **Row Highlight**: `false`
   - **Priority**: `1`
   - **Is Active**: `true`
2. Create a second rule for `Closed Lost`:
   - **Label**: `Lost Deals Highlight`
   - **Operator**: `EQUALS`, **Value**: `Closed Lost`, **Cell Color**: `red`, **Icon Name**: `utility:error`
3. Create a third rule for large deals:
   - **Field API Name**: `Amount`, **Operator**: `GREATER_THAN`, **Value**: `500000`, **Cell Color**: `yellow`, **Row Highlight**: `true`

---

### Example C: Custom Object Grid (`Project__c`)

You can also use record-by-record relational column definitions (`Smart_Grid_Column__mdt`):

1. In **Smart Grid Config**, create `Project_Delivery_Grid`:
   - **Object API Name**: `Project__c`
   - **Use Advanced Config**: `true` (Check this box)
   - **Default Sort Field**: `Name`
2. Under **Custom Metadata Types → Smart Grid Column**, click **New** for each column:
   - Column 1: `Field_API_Name__c`: `Name`, `Order__c`: 1, `Column_Width__c`: 220, `Is_Editable__c`: true
   - Column 2: `Field_API_Name__c`: `Client__c`, `Order__c`: 2, `Column_Width__c`: 180, `Is_Editable__c`: true
   - Column 3: `Field_API_Name__c`: `Status__c`, `Order__c`: 3, `Column_Width__c`: 140, `Is_Editable__c`: true
   - Column 4: `Field_API_Name__c`: `Budget__c`, `Order__c`: 4, `Column_Width__c`: 140, `Is_Editable__c`: true

---

### Example D: Embedded Child Related Grid

To embed a child grid under an Account record detail page:

1. In Lightning App Builder on the **Account Record Page**, drag the `smartDataGrid` component into a tab (e.g. "Account Opportunities").
2. Set Component Properties:
   - **Grid Title**: `Related Opportunities`
   - **Grid Config Developer Name**: `Opportunity_Pipeline_Grid`
   - **Default Object API Name**: `Opportunity`
3. When placed on a Record Page, the grid automatically detects the parent context and filters child records where `AccountId = :recordId`.

---

## 4. Lightning App Builder Deployment & Properties

The `smartDataGrid` component can be deployed across **App Pages**, **Home Pages**, or **Record Detail Pages**.

### Component Properties Reference

| Property Name in App Builder   | API Property Name | Description                                                       | Example               |
| :----------------------------- | :---------------- | :---------------------------------------------------------------- | :-------------------- |
| **Grid Title**                 | `gridTitle`       | The card title displayed above the grid toolbar.                  | `Enterprise Accounts` |
| **Grid Config Developer Name** | `gridConfigName`  | DeveloperName of `Smart_Grid_Config__mdt` to load.                | `Account_Demo_Grid`   |
| **Default Object API Name**    | `objectApiName`   | Target SObject API name. Automatically populated on Record Pages. | `Account`             |

---

## 5. Permissions & Security Governance

Smart Grid includes two pre-packaged, license-agnostic Permission Sets:

```
┌───────────────────────────────────────────────────────────────┐
│                    SmartGrid_User                             │
│  - Apex Classes: SmartGridController, GridQueryBuilder,       │
│                  SmartGridIdValidator, SmartGridViewService,  │
│                  SmartGridUserPrefService,                    │
│                  SmartGridFormatEngine                        │
│  - Custom Metadata: Smart_Grid_Config__mdt,                   │
│                     Smart_Grid_Column__mdt,                   │
│                     Smart_Grid_Format_Rule__mdt               │
│  - Custom Objects: Smart_Grid_View__c, Smart_Grid_User_Pref__c│
│  - Platform Events: Smart_Grid_Telemetry__e (Publish)         │
└───────────────────────────────────────────────────────────────┘
                                ▲
                                │ Inherits & Extends
┌───────────────────────────────────────────────────────────────┐
│                 Smart_Grid_AI_Premium                         │
│  - Apex Classes: SmartGridNLPEngine, SmartGridAgentService,   │
│                  SmartGridDataQualityService,                 │
│                  SmartGridNLPDMLHandler,                      │
│                  SmartGridLicenseService,                     │
│                  SmartGridExternalAIProvider,                 │
│                  SmartGridMockAIProvider,                     │
│                  SmartGridEinsteinAIProvider                  │
│  - Custom Metadata: Smart_Grid_AI_Config__mdt,                │
│                     Smart_Grid_License__mdt                   │
└───────────────────────────────────────────────────────────────┘
```

### User License Compatibility

Both permission sets omit hardcoded `<license>` tags, allowing seamless assignment across:

- **Salesforce Full CRM** license users.
- **Salesforce Platform** license users.
- **Customer Community / Experience Cloud** users.

```bash
# Assign core grid capabilities
sf org assign permset --name SmartGrid_User --target-org my-org

# Assign generative AI capabilities
sf org assign permset --name Smart_Grid_AI_Premium --target-org my-org
```

### CRUD & Field-Level Security (FLS) Enforcement

- **SOQL with User Mode**: All queries execute `WITH USER_MODE`. If a user lacks FLS Read access to a field, the field is stripped safely before query execution.
- **DML with Accessibility Strip**: All record updates and inserts run through `Security.stripInaccessible(AccessType.UPSERTABLE, records)` before commit.
- **Delete Authorization**: Verifies `sObjectType.getDescribe().isDeletable()` before invoking `Database.delete(records, AccessLevel.USER_MODE)`.
- **SQL Injection Prevention**: All dynamic SOQL expressions validate field tokens against `Schema.getGlobalDescribe()`. Values are strictly escaped using `String.escapeSingleQuotes()` or passed through parameterized binds.
- **CSV Injection Prevention (CWE-1236)**: Cell values starting with `=, +, -, @, \t, \r` are escaped with a leading single quote (`'`) to prevent formula execution in Microsoft Excel.

---

## 6. Universal AI Suite Configuration & Customization

The Smart Grid AI Engine employs the **Universal AI Provider Pattern** (`SmartGridNLPEngine`), routing requests dynamically based on `Smart_Grid_AI_Config__mdt`.

### Unified AI Experience Architecture (Option A: Smart Grid AI Omnibar)

In release v2.4+, the AI user interface is unified into a single, high-performance Omnibar (`c-smart-grid-command-palette`), triggered either by the keyboard shortcut `Cmd+K` / `Ctrl+K` or the toolbar **Smart Grid AI** agent button (`utility:einstein`).

- **Smart Intent Routing**: The Omnibar automatically classifies user inputs:
  - **Conversational Inquiries**: Questions like _"What is the total revenue?"_ or _"Summarize dataset"_ route directly to `SmartGridNLPEngine.askAssistant`, rendering an interactive **AI Answer Card** with formatted totals, live database rollups (`WITH USER_MODE`), copy-to-clipboard buttons, and recommended action chips.
  - **Workflow Shortcuts**: Commands like _"Transpose"_ or _"Show chart"_ trigger immediate grid layout actions without leaving the keyboard.
  - **Pre-Flight DML Commands**: Updates like _"Set Rating to Hot"_ invoke `SmartGridNLPDMLHandler.previewDML`, presenting a visual diff preview for user confirmation before committing database changes.
- **Data Quality Decoupling (Shield Icon)**: Data hygiene, duplicate candidate identification, and outlier checks are decoupled into the dedicated **Data Quality & Health Score** inspector accessible via the **Shield** icon (`utility:shield`) on the secondary toolbar.

```
User Prompt (Cmd+K Omnibar or Toolbar Agent Icon)
               │
               ▼
 SmartGridNLPEngine.getProvider(configDevName)
               │
               ├── Provider_Type__c = 'Offline_Mock' (Option 1 - Default)
               │     └── SmartGridMockAIProvider (Deterministic regex & live SOQL)
               │
               ├── Provider_Type__c = 'OpenAI_Compatible' / 'Anthropic' / 'Google_Gemini' (Option 2)
               │     └── SmartGridExternalAIProvider (Callout via Named Credential)
               │
               ├── Provider_Type__c = 'Einstein' (Option 3)
               │     └── SmartGridEinsteinAIProvider (Models API / Prompt Builder)
               │
               └── Provider_Type__c = 'Custom_Class' (Option 4)
                     └── Loads custom Apex class implementing ISmartGridAIProvider
```

---

### Option 1: Built-in Heuristic / Offline Mock Provider

- **Status**: Active by default with **zero configuration required**.
- **Cost**: **$0**, 0 API tokens, 0ms external network latency.
- **Live Database Aggregations**: Questions like _"What is the total revenue?"_ run **real, live database SOQL queries** (`SELECT SUM(AnnualRevenue) FROM Account WITH USER_MODE`).
- **Use Case**: Dev sandboxes, scratch orgs, trials, and security-restricted orgs.

---

### Option 2: External BYO-LLM via Named Credentials

Connect to **OpenAI (GPT-4o)**, **Anthropic (Claude 3.5 Sonnet)**, or **Google Gemini**:

#### Step 1: Create External Credential & Named Credential

1. In **Setup → Named Credentials → External Credentials**, click **New**:
   - Label: `OpenAI External Credential`
   - Authentication Protocol: `Custom`
   - Principals: Parameter Name `ApiKey`, Header `Authorization`, Value `Bearer sk-...your-key...`
2. Under **Named Credentials**, click **New**:
   - Label: `Smart Grid LLM Endpoint`
   - Name: `Smart_Grid_LLM_Endpoint`
   - URL: `https://api.openai.com`
   - External Credential: Select your credential.

#### Step 2: Create `Smart_Grid_AI_Config__mdt` Record

In **Custom Metadata Types → Smart Grid AI Config**:

- **Grid Config**: `Account_Demo_Grid`
- **Provider Type**: `OpenAI_Compatible` _(or `Anthropic`, `Google_Gemini`)_
- **Named Credential**: `Smart_Grid_LLM_Endpoint`
- **Model Identifier**: `gpt-4o-mini`
- Check **Enable NLP**, **Enable Chat**, and **Enable Suggestions**.

---

### Option 3: Native Salesforce Einstein Generative AI

For orgs with **Einstein 1 Platform** / **Prompt Builder**:

1. In **Setup → Prompt Builder**, create a Flex Prompt Template: `Smart_Grid_NLP_Translator`.
2. Configure `Smart_Grid_AI_Config__mdt`:
   - **Provider Type**: `Einstein`
   - **Prompt Template**: `Smart_Grid_NLP_Translator`
   - **Grid Config**: `Account_Demo_Grid`

---

### Option 4: Pluggable Custom Apex Provider

Create a proprietary AI routing provider:

1. Implement the `ISmartGridAIProvider` interface:

   ```apex
   public with sharing class CustomEnterpriseAIProvider implements ISmartGridAIProvider {
     public SmartGridNLPEngine.TranslationResult translateQuery(
       SmartGridNLPEngine.TranslationRequest req
     ) {
       SmartGridNLPEngine.TranslationResult res = new SmartGridNLPEngine.TranslationResult();
       res.objectApiName = req.objectApiName;
       res.isSuccess = true;
       // Custom logic or internal microservice callout
       return res;
     }

     public SmartGridNLPEngine.AssistantResult answerQuestion(
       SmartGridNLPEngine.AssistantRequest req
     ) {
       SmartGridNLPEngine.AssistantResult res = new SmartGridNLPEngine.AssistantResult();
       res.isSuccess = true;
       res.answer = 'Custom computed metric.';
       return res;
     }
   }
   ```

2. In `Smart_Grid_AI_Config__mdt`:
   - **Provider Type**: `Custom_Class`
   - **Custom Provider Class**: `CustomEnterpriseAIProvider`

---

### Option 5: Agentforce & Autonomous AI Agent Invocable Actions

Smart Grid provides standard Salesforce Invocable Actions allowing autonomous **Agentforce Agents** (Sales Agents, Service Agents, RevOps Agents) and Flow automations to interact directly with grid datasets with strict FLS and security:

1. **`SmartGridAgentService.cls` (`Smart Grid: Query Records`)**:
   - Queries records dynamically for any SObject with FLS enforcement.
   - Input: `objectApiName`, `fields` (comma-separated), `sortField`, `sortDirection`, `recordLimit`.
   - Output: `recordCount`, `recordsJson`, `executedSoql`.

2. **`SmartGridAgentSummaryService.cls` (`Smart Grid: Summarize Dataset`)**:
   - Calculates record totals, numeric sums, averages, and narrative analytical summaries on demand for Agentforce conversations.
   - Input: `objectApiName`, `numericField`, `groupField`, `filterJson`.
   - Output: `recordCount`, `totalNumericSum`, `averageNumericValue`, `summaryNarrative`.

3. **`SmartGridAgentHealthService.cls` (`Smart Grid: Audit Data Quality`)**:
   - Audits data quality, duplicate groups, date hygiene, and missing required values on demand.
   - Input: `objectApiName`, `fields` (comma-separated).
   - Output: `healthScore` (0-100), `duplicateCount`, `missingDataCount`, `healthNarrative`.

#### Adding Smart Grid Actions to Agentforce Builder:

1. Navigate to **Setup → Agents → Agentforce Builder**.
2. Select your Target Agent (e.g. _Service Agent_ or _Sales Rep Assistant_).
3. Under **Topics → Actions**, click **Add Action** &rarr; Search for **`Smart Grid`**.
4. Select `Smart Grid: Summarize Dataset` or `Smart Grid: Query Records`.
5. Enter instructions: _"Use this action when the user asks for dataset metrics, totals, or data health on any Salesforce object."_

---

### Customizing Heuristic Phrases & Metrics in Apex

To add business-specific metrics to the heuristic engine:

1. Open `SmartGridMockAIProvider.cls` in line 150 (`answerQuestion`).
2. Add custom phrase matches:
   ```apex
   // Custom Metric: Largest Customer
   else if (q.contains('largest account') || q.contains('top customer')) {
       Account top = [SELECT Name, AnnualRevenue FROM Account WHERE AnnualRevenue != null WITH USER_MODE ORDER BY AnnualRevenue DESC LIMIT 1];
       res.answer = 'The largest customer is ' + top.Name + ' with $' + top.AnnualRevenue.format() + ' in annual revenue.';
       res.computedValue = top.Name;
   }
   // Custom Metric: Total Workforce
   else if (q.contains('total employees') || q.contains('headcount')) {
       AggregateResult[] ar = [SELECT SUM(NumberOfEmployees) totalEmp FROM Account WITH USER_MODE];
       Decimal total = (Decimal) ar[0].get('totalEmp');
       res.answer = 'Total workforce across all accounts is ' + total.format() + ' employees.';
       res.computedValue = String.valueOf(total);
   }
   ```

---

### Customizing NLP Filter Keywords in Apex

To teach the Command Palette (<kbd>Cmd</kbd>+<kbd>K</kbd>) new business filters:
In `SmartGridMockAIProvider.cls` under `translateQuery`:

```apex
// Example: Match "VIP accounts" or "Key accounts"
if (lowerPrompt.contains('vip') || lowerPrompt.contains('key account')) {
    result.filters.add(new GridQueryBuilder.FilterCondition('Rating', '=', 'Hot'));
    result.filters.add(new GridQueryBuilder.FilterCondition('AnnualRevenue', '>=', '5000000'));
    explanations.add('VIP Criteria: Hot Rating & Revenue >= $5,000,000');
}
```

---

### Customizing Starter Chips in LWC

In `smartGridAssistant.js`:

```javascript
get starterChips() {
    return [
        "What is the total revenue?",
        "What is the average revenue?",
        "Who is the largest account?",
        "How many records are in this view?"
    ];
}
```

---

### Multi-Object Polymorphism

Smart Grid passes `request.objectApiName` to every AI call. You can branch logic dynamically across objects:

```apex
public SmartGridNLPEngine.AssistantResult answerQuestion(SmartGridNLPEngine.AssistantRequest request) {
    String obj = request.objectApiName;
    String q = request.question.toLowerCase();

    // 1. OPPORTUNITY SPECIFIC
    if (obj.equalsIgnoreCase('Opportunity')) {
        if (q.contains('total pipeline') || q.contains('revenue')) {
            AggregateResult[] res = [SELECT SUM(Amount) totalAmt FROM Opportunity WITH USER_MODE];
            Decimal amt = (Decimal) res[0].get('totalAmt');
            return formatResult('Total pipeline amount is $' + amt.format() + '.');
        } else if (q.contains('win rate') || q.contains('won')) {
            Integer won = [SELECT COUNT() FROM Opportunity WHERE StageName = 'Closed Won' WITH USER_MODE];
            return formatResult('There are currently ' + won + ' Closed Won deals.');
        }
    }
    // 2. CASE SPECIFIC
    else if (obj.equalsIgnoreCase('Case')) {
        if (q.contains('open cases') || q.contains('backlog')) {
            Integer openCount = [SELECT COUNT() FROM Case WHERE Status != 'Closed' WITH USER_MODE];
            return formatResult('Active support backlog is ' + openCount + ' open cases.');
        }
    }
    // 3. ACCOUNT (Default)
    else {
        if (q.contains('total revenue')) {
            AggregateResult[] res = [SELECT SUM(AnnualRevenue) totalRev FROM Account WITH USER_MODE];
            Decimal rev = (Decimal) res[0].get('totalRev');
            return formatResult('Total annual revenue is $' + rev.format() + '.');
        }
    }
    return formatResult('I am configured to assist with ' + obj + ' metrics.');
}
```

---

### AI Bulk DML & Natural Language Updates

Users can trigger bulk updates using natural language via `SmartGridNLPDMLHandler.cls`:

- **Example Prompt**: _"Set all Warm accounts in California to Hot"_
- **Safety Architecture**:
  1. **Dry Run**: Evaluates matching records and prepares a staged diff payload.
  2. **Pre-Flight Confirmation**: Opens the **DML Confirmation Modal** showing impacted record counts and field changes.
  3. **Atomic Execution**: No records are updated until the user explicitly clicks **Confirm**.

---

## 7. Spreadsheet-Speed Inline Editing & Safe DML Workflow

### Supported Field Types & Custom Inline Picklists

| Field Type                  | Cell Rendering                     | Inline Editing Experience                        |
| :-------------------------- | :--------------------------------- | :----------------------------------------------- |
| **Text, Email, Phone, URL** | Standard text with link support    | Inline input with regex format validation.       |
| **Currency & Number**       | Formatted currency/integer display | Numeric input with precision enforcement.        |
| **Date & DateTime**         | Locale-formatted date              | Native datepicker popup.                         |
| **Checkbox**                | Interactive checkbox icon          | Toggle on/off directly in cell.                  |
| **Picklist & Multi-Select** | `c-smart-grid-picklist`            | In-cell dropdown honoring Record Type picklists. |
| **Lookup / Reference**      | Clickable record name link         | Lookup search modal with recent records.         |

---

### Copy & Paste from External Spreadsheets

Users can copy tabular data from **Microsoft Excel** or **Google Sheets** and paste directly into the Smart Grid:

1. Select the target rows in Smart Grid.
2. In Excel, select a range of cells (e.g. 5 rows × 3 columns) and press <kbd>Ctrl</kbd>+<kbd>C</kbd> / <kbd>Cmd</kbd>+<kbd>C</kbd>.
3. Click into the Smart Grid table and press <kbd>Ctrl</kbd>+<kbd>V</kbd> / <kbd>Cmd</kbd>+<kbd>V</kbd>.
4. Smart Grid parses tab-separated values (`\t`) and newlines (`\n`), applies updates across visible editable columns, pushes the changes to the Undo stack, and flags cells as dirty.

---

### Dirty State Tracking, Undo/Redo & Fill Down

- **Dirty State Manager** (`dirtyStateManager`): Tracks original vs modified cell values in memory. Cells with unsaved edits highlight in yellow.
- **Undo / Redo Stack**:
  - Undo: Press <kbd>Cmd</kbd>+<kbd>Z</kbd> (Mac) or <kbd>Ctrl</kbd>+<kbd>Z</kbd> (Windows).
  - Redo: Press <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> (Mac) or <kbd>Ctrl</kbd>+<kbd>Y</kbd> (Windows).
- **Fill Down**: Select a cell and press <kbd>Cmd</kbd>+<kbd>D</kbd> or click **Fill Down** in the toolbar to copy the value across all selected rows.

---

### Add Row Staging

Clicking **Add Row** creates a staged new record (`new-1`, `new-2`) directly in the grid table. Users can populate values across all columns and commit them in a single batch insert alongside updates.

---

### Review Modal

Clicking the **Review Pending Changes** button (<lightning-button-icon icon-name="utility:preview">) opens the `c-smart-grid-review-modal`:

- Displays a visual side-by-side diff: Record Name, Field Label, Original Value vs Draft Value (with picklist label translation).
- **Granular Per-Field Revert**: Users can click the revert button on any individual cell edit to discard that change while retaining others!
- Summary header: e.g. _"5 changes across 3 rows"_.

---

### DML Confirmation Modal

For AI natural language mass updates or deletions, the `c-smart-grid-dml-confirm-modal` provides pre-flight confirmation:

- Displays operation type (Update vs Deletion).
- Total affected records count.
- Affected field list and sample before/after values with styled badges.

---

### In-Grid DML Error Resolution & Recovery Wizard

When a mass save fails due to a custom Validation Rule or missing required field, Smart Grid **does not discard unsaved edits**:

1. It automatically launches the `c-smart-grid-resolution-modal`.
2. Presents each failed record one-by-one (`Record 1 of 3`) in a `lightning-record-edit-form`.
3. Highlights the exact validation error message.
4. Allows the user to correct the invalid field value and click **Save**.
5. Emits `recordsolved`, updates the grid drafts, and moves to the next record (`nextRecord()`).
6. Users can click **Skip** if they wish to resolve a record later.

---

## 8. Column Management & Excel-Style In-Column Actions

Smart Grid provides full control over column layouts directly from the grid interface.

### Field Picker Modal

Click **Select Fields** in the toolbar:

- Search available fields by label or API name.
- Select/deselect fields to adjust grid visibility.
- Drag and drop columns to reorder.
- Changes persist to user preferences automatically.

---

### Pin Left / Unpin

Click the dropdown arrow on any column header:

- Select **Pin to Left**: Freezes the column at position 0 with a pinned icon (`utility:pinned`).
- Select **Unpin from Left**: Returns the column to standard scrolling.

---

### Auto-Fit Column Width

Smart Grid includes `columnWidthCalculator`:

- Uses an offscreen **HTML5 Canvas** context (`canvasContext.measureText(str)`) to measure actual font-rendered pixel widths.
- Evaluates column header labels (accounting for sort arrows and action menus) and all cell values on the current page.
- Clamps widths safely between **80px** and **500px**.
- Trigger via **Auto-Fit Column Width** in the header menu or by **double-clicking the header column separator**.

---

### In-Column Checklist Filter

Every column header menu includes an Excel-style distinct value checklist:

- Extracts unique values from the current dataset with record counts: e.g. `Technology (18)`, `Finance (12)`, `(Blank) (2)`.
- Select checkboxes to filter the grid instantly.
- Select **All** or **Clear Filter** to reset.
- Displays _"More in Filter Builder..."_ when column cardinality exceeds 15 unique values.

---

## 9. Advanced Filter Builder & Active Filter Pills

### Nested Filter Groups

Click **Advanced Filter** in the toolbar to open `c-smart-grid-filter-builder`:

- Build complex filter criteria using nested groups with **AND / OR** logic.
- Add multiple condition rows within groups.

### Type-Specific Operators Reference

| Field Type            | Available Operators                                                                                                |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------- |
| **String & Picklist** | `equals (=)`, `not equal (!=)`, `contains`, `does not contain`, `starts with`, `ends with`                         |
| **Number & Currency** | `equals (=)`, `not equal (!=)`, `greater than (>)`, `greater or equal (>=)`, `less than (<)`, `less or equal (<=)` |
| **Date & DateTime**   | `on (=)`, `not on (!=)`, `after (>)`, `on or after (>=)`, `before (<)`, `on or before (<=)`                        |
| **Boolean**           | `equals (=)`, `not equal (!=)`                                                                                     |

### Active Filter Pills Bar

Applied filters appear as interactive pills in `c-smart-grid-filter-bar`:

- Displays each condition: e.g. `[Industry = 'Technology' ✕]`, `[AnnualRevenue > 1,000,000 ✕]`.
- Click the `✕` on any pill to remove that specific criteria.
- Click **Clear All** to remove all active filters at once.

### Relative SOQL Date Literals

`GridQueryBuilder.cls` supports relative date literals in filters:
`TODAY`, `YESTERDAY`, `TOMORROW`, `THIS_WEEK`, `LAST_WEEK`, `NEXT_WEEK`, `THIS_MONTH`, `LAST_MONTH`, `THIS_QUARTER`, `LAST_90_DAYS`, `THIS_YEAR`, `LAST_N_DAYS:n`, `NEXT_N_DAYS:n`.

---

## 10. In-Grid Analytics Panel & Dataset Visualizations

In modern enterprise workspaces, fixed bottom aggregate rows waste valuable vertical screen height and disrupt high-volume data scrolling. Smart Grid replaces intrusive static footers with a docked, **Full-Width Bottom Analytics Panel (`c-smart-grid-chart-panel`)** that activates on demand with zero layout shift.

### Architecture & Placement

- **Bottom Docked Container**: Positioned directly beneath the virtualized datatable and above the pagination footer.
- **Smooth Auto-Scroll**: When users click the **Analytics** button in the toolbar, the grid automatically scrolls the analytics section smoothly into the viewport.
- **No Dimming Backdrops**: Unlike modal drawers that blur the background, the bottom panel allows users to view their active grid records and analytical charts concurrently.

### Supported Visualizations

1. **Donut Chart**:
   - Rendered using native vector SVG `<path>` arcs calculated via client-side trigonometry.
   - Displays up to 10 top segments with an aggregated "Other" slice.
   - Shows total record volume in the center donut badge.
2. **Horizontal Bar Chart**:
   - Proportional SVG rectangles comparing volume across categories.
   - Displays category labels, counts, and interactive hover highlights.
3. **Funnel Chart**:
   - Tapered SVG polygon stages illustrating stage conversion and fallout.

### Real-Time Metric Tiles & Category Legend

- **Summary KPI Cards**:
  - **Total Records**: Active record count in the loaded view.
  - **Total Volume**: Aggregated numeric or currency volume count.
  - **Distinct Groups**: Unique category count for the selected "Group By" field.
- **Interactive Breakdown Legend**:
  - Color-coded indicator dots matching the SVG chart slices.
  - Exact record counts and percentage distribution per category.

### Dismissal Mechanics

Users can close the analytics workspace at any time via:

- **"✕" Close Button** (`data-testid="chart-close-btn"`): Streamlined top-right dismiss icon in the panel header.

Clicking the button immediately dispatches a `close` event to `c-smart-data-grid`, resetting `showChartPanel = false` and restoring maximum vertical space for datatable rows.

---

## 11. Client-Side Virtual Formula Evaluator

Smart Grid allows defining virtual computed formula columns that calculate client-side without creating custom Salesforce formula fields:

### Formula Engine Architecture

- **Sandboxed Tokenizer & Shunting-Yard Algorithm**: Uses Reverse Polish Notation (RPN) to evaluate math expressions.
- **Zero Vulnerabilities**: **Never** invokes `eval()` or `new Function()`.
- **Reactive Calculation**: Formulated columns recalculate instantly in browser memory as users type into inline edit cells.

### Supported Formula Syntax & Examples

```json
[
  {
    "field": "Commission__c",
    "expression": "Amount * 0.10",
    "label": "Commission (10%)"
  },
  {
    "field": "Margin__c",
    "expression": "(Revenue - Cost) / Revenue",
    "label": "Profit Margin"
  },
  {
    "field": "RevenuePerEmployee__c",
    "expression": "AnnualRevenue / NumberOfEmployees",
    "label": "Rev / Employee"
  }
]
```

---

## 12. Conditional Formatting Rules Engine

The `formatRuleEngine` evaluates `Smart_Grid_Format_Rule__mdt` records in priority order:

- **Supported Operators**: `EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `LESS_THAN`, `GREATER_OR_EQUAL`, `LESS_OR_EQUAL`, `CONTAINS`, `STARTS_WITH`.
- **Cell Highlighting**: Applies `smart-grid-color-green`, `smart-grid-color-red`, `smart-grid-color-yellow`, `smart-grid-color-blue`.
- **Row Highlighting**: Sets `Row_Highlight__c = true` to highlight the entire row when a critical condition matches.
- **Icon Badges**: Displays SLDS icons (e.g. `utility:warning`, `utility:success`) inside the cell.
- **Priority Resolution**: Lower priority numbers evaluate first; the first matching rule per field wins.

---

## 13. Split Views, Reading Pane & Tabbed Related Sub-Grids

### Reading Pane

Click the Reading Pane button in the toolbar to inspect record details without opening a new browser tab:

- Built with `lightning-record-view-form` to display all active view fields and system audit timestamps.
- **Side Drawer**: Opens on the right side of the screen.
- **Bottom Dock**: Opens underneath the grid table.

### Tabbed Child Related Sub-Grids

Configured via `Related_Object__c` (e.g. `Contacts, Opportunities, Cases`):

- Selecting a parent row expands sub-grids in tabs.
- Automatically queries child records where `ParentId = :recordId`.
- Includes recursion depth protection (`depth <= 2`).
- Sub-grids support independent inline editing, sorting, and CSV/Excel export.

---

## 14. Custom Views, Personalization & User Preference Persistence

### Public Team Views vs Private User Views

Users can create and switch views using `c-smart-grid-view-selector`:

- **Private Views**: Visible only to the creating user (`OwnerId = UserInfo.getUserId()`).
- **Public Views**: Administrators can mark `Is_Public__c = true` to publish team-wide standard views.
- **Default Views**: Users can mark any view as their personal default (`Is_Default__c = true`).

### User Preference Caching

Via `Smart_Grid_User_Pref__c`, the grid automatically remembers:

- Resized column widths.
- Hidden and reordered columns.
- Active page size (25, 50, 100, 200).
- Last active view selection.

---

## 15. Data Quality & Health Score Engine

The `SmartGridDataQualityService.cls` and `c-smart-grid-data-quality` drawer provide real-time dataset health inspection.

### Composite Health Score Algorithm (0-100%)

$$\text{Health Score} = \max\left(0, 100 - (\text{Penalty}_{\text{duplicates}} + \text{Penalty}_{\text{missing}} + \text{Penalty}_{\text{outliers}})\right)$$

| Issue Type                | Penalty                        | How It Is Evaluated                                                                                                                                     |
| :------------------------ | :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Duplicates**            | -15 points per duplicate group | Evaluated via database grouping `GROUP BY dupField HAVING COUNT(Id) > 1` on `Name`, `Email`, `Phone`, `BillingState`.                                   |
| **Missing Critical Data** | -5 or -10 points               | Analyzes sample set of 200 records. If missing rate $\ge 30\%$, penalty is -5 pts (Medium severity); if $\ge 60\%$, penalty is -10 pts (High severity). |
| **Statistical Outliers**  | -10 points                     | Single aggregated SOQL query calculates `AVG()` and `MAX()`. Flags fields where `MAX() > 4 * AVG()`.                                                    |

### One-Click Grid Isolation

Click **Filter Grid** next to any detected issue to instantly filter the grid table down to only the records requiring remediation.

---

## 16. Enterprise Spreadsheet Exporter & Interactive Onboarding Tour

### Export to Formatted Excel (.xls)

The `spreadsheetExporter` module generates a complete Microsoft Excel workbook using standard XML/HTML table format:

- Styled blue table header (`#0176d3`) with white text and clean borders.
- Preserves cell colors from conditional format rules.
- Includes sticky footer totals row (`<tfoot>`) with bold summary calculations.
- Configures `<x:DisplayGridlines/>` so grid lines render cleanly in Microsoft Excel.

### Export to CSV (.csv) with UTF-8 BOM & CWE-1236 Sanitization

The `csvHelper` module provides secure CSV generation:

- Prepends **UTF-8 Byte Order Mark (BOM)** (`\uFEFF`) to support international characters and accents without garbled text.
- **CSV Injection Protection (CWE-1236)**: Cells starting with `=, +, -, @, \t, \r` are prefixed with `'` to prevent command execution.
- Download initiated via LWS-compliant Data URI.

### 4-Step Interactive Product Walkthrough

The `c-smart-grid-onboarding` component guides new users through the grid:

1. **Welcome to AI Smart Grid**: Multi-row editing, Undo/Redo, and dynamic exports.
2. **AI Command Palette (<kbd>Cmd</kbd>+<kbd>K</kbd>)**: Natural language search to parameterized SOQL.
3. **Data Quality & Duplicates**: Automated health inspection and duplicate isolation.
4. **Conversational Analytics**: Real-time Q&A assistant drawer.

- Users can check _"Don't show again"_, stored in browser `localStorage`.

---

## 17. In-Memory LRU Pagination Cache & Governor Limits

### LRU Page Cache Architecture

The `gridPageCache` utility implements an in-memory **Least Recently Used (LRU)** pagination cache:

- Holds up to **10 pages** with a **5-minute Time-to-Live (TTL)**.
- Navigating back and forth between previously viewed pages executes with **0ms latency and 0 SOQL queries**.
- Bypassed on explicit toolbar Refresh click (`handleRefresh()`).

### Governor Limit Safeguards Reference Table

| Limit Category       | Threshold    | How Smart Grid Protects It                                                       |
| :------------------- | :----------- | :------------------------------------------------------------------------------- |
| **SOQL Query Rows**  | 50,000 limit | Default ceiling of 200 rows per fetch with offset pagination.                    |
| **SOQL Query Count** | 100 limit    | Grid loads execute **1 data query** and **1 count query** for pagination.        |
| **DML Statements**   | 150 limit    | Bulk edits group inserts and updates into **2 atomic DML statements**.           |
| **DML Rows**         | 10,000 limit | Pre-commit validation checks selected record count before sending payload.       |
| **Heap Size**        | 6MB / 12MB   | Queries request only visible columns; payloads are stripped before transmission. |

---

## 18. Telemetry, Auditing & Observability

Smart Grid publishes `Smart_Grid_Telemetry__e` platform events for all major actions. You can write an Event-Triggered Flow or Apex trigger for compliance:

```apex
trigger SmartGridAuditTrigger on Smart_Grid_Telemetry__e(after insert) {
  List<Audit_Log__c> logs = new List<Audit_Log__c>();
  for (Smart_Grid_Telemetry__e evt : Trigger.new) {
    if (evt.Event_Type__c == 'DATA_EXPORT' && evt.Record_Count__c > 500) {
      logs.add(
        new Audit_Log__c(
          User__c = evt.User_Id__c,
          Action__c = 'HIGH_VOLUME_EXPORT',
          Details__c = 'User exported ' +
            evt.Record_Count__c +
            ' records from ' +
            evt.Object_API_Name__c
        )
      );
    } else if (evt.Event_Type__c == 'RECORD_DELETE') {
      logs.add(
        new Audit_Log__c(
          User__c = evt.User_Id__c,
          Action__c = 'MASS_DELETE',
          Details__c = 'User deleted ' +
            evt.Record_Count__c +
            ' records from ' +
            evt.Object_API_Name__c
        )
      );
    }
  }
  if (!logs.isEmpty()) {
    insert logs;
  }
}
```

---

## 19. Keyboard Shortcuts Cheat Sheet

| Shortcut (Mac)                                                                   | Shortcut (Windows)             | Action Description                        |
| :------------------------------------------------------------------------------- | :----------------------------- | :---------------------------------------- |
| <kbd>Cmd</kbd> + <kbd>S</kbd>                                                    | <kbd>Ctrl</kbd> + <kbd>S</kbd> | Quick Save pending inline edits           |
| <kbd>Cmd</kbd> + <kbd>Z</kbd>                                                    | <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo last cell edit                       |
| <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> / <kbd>Cmd</kbd> + <kbd>Y</kbd> | <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo undone cell edit                     |
| <kbd>Cmd</kbd> + <kbd>D</kbd>                                                    | <kbd>Ctrl</kbd> + <kbd>D</kbd> | Fill Down value across selected rows      |
| <kbd>Cmd</kbd> + <kbd>K</kbd>                                                    | <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open AI Command Palette                   |
| <kbd>Cmd</kbd> + <kbd>V</kbd>                                                    | <kbd>Ctrl</kbd> + <kbd>V</kbd> | Paste spreadsheet cells from Excel/Sheets |
| Double-Click Header Border                                                       | Double-Click Header Border     | Auto-Fit column width to content          |

---

## 20. Troubleshooting & FAQs

### Q: What causes `EmpApi streaming error "403::Handshake denied"`?

**A**: In Salesforce Streaming API / CometD, a `403::Handshake denied` error occurs when a user's browser session times out or goes idle while an eager streaming component is active in the background (e.g. in the Sales App Utility Bar).

- **Resolution 1**: Refresh the browser page or re-authenticate to establish a fresh session token.
- **Resolution 2**: In **Setup → App Manager → Sales App → Utility Items**, ensure background AI chat components have **Eager = false** so streaming sockets only open when the user actively opens the tool.

### Q: Why is a field missing from the Field Picker?

**A**: Smart Grid enforces Field-Level Security. If the user's Profile or Permission Set does not have Read access to the field, it is automatically omitted.

### Q: Why does a user receive a "Cannot assign permission set, user license doesn't match" error?

**A**: Ensure your `SmartGrid_User` and `Smart_Grid_AI_Premium` permission set metadata files do **not** contain `<license>Salesforce</license>`. Both permission sets in this repository are license-agnostic.

### Q: How do I clear cached LWC components after deploying changes?

**A**:

1. Enable Debug Mode: **Setup → Debug Mode → Check your user**.
2. Perform a hard browser refresh: <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> (Mac) or <kbd>Ctrl</kbd> + <kbd>F5</kbd> (Windows).

### Q: Why does the NLP Command Palette say "AI features not licensed"?

**A**: Ensure the user has the `Smart_Grid_AI_Premium` permission set, and verify that `NLP_COMMAND_PALETTE` in **Custom Metadata Types → Smart Grid License** has `Is_Enabled__c = true`.

---

## 21. NextGen Visual Administration Studio & Metadata Deployment

### 21.1 In-App Visual Grid Designer (`smartGridAdminStudio`)

The **Smart Grid Admin Studio** provides a drag-and-drop visual interface for configuring grids without manually editing Custom Metadata records:

- **Target Object Selection**: Choose any standard or custom object from an active schema dropdown.
- **Dual-Listbox Column Selector**: Pick fields, set custom display labels, configure widths, and toggle inline editability.
- **Default Filters & Sorting**: Define base SOQL conditions and sort orders.
- **Live Interactive Preview**: Test the grid layout with real sandbox data before deploying.

### 21.2 Programmatic Apex Metadata API Deployment (`SmartGridMetadataDeployer.cls`)

When an administrator clicks **"Deploy Grid Configuration"** in Admin Studio, Smart Grid constructs and enqueues standard Salesforce Metadata deployment containers:

- Uses `Metadata.Operations.enqueueDeployment` to generate `Smart_Grid_Config__mdt` and `Smart_Grid_Column__mdt` records natively.
- Implements `Metadata.DeployCallback` to track deployment status and notify the administrator upon completion.
- Eliminates manual XML file authoring and Change Set overhead.

---

## 22. Enterprise Governance, Cursors & Change Auditing

### 22.1 Global Governance Settings (`Smart_Grid_Admin_Setting__mdt`)

Configure org-wide defaults and enterprise guardrails in **Custom Metadata Types → Smart Grid Admin Setting**:

- `Enable_Transpose_Mode__c`: Globally enables or disables the Transposed Matrix view.
- `Max_Export_Rows__c`: Caps maximum CSV export rows (default: 50,000).
- `Enable_Formula_Shield__c`: Enforces RFC-4180 formula injection neutralization across exports and clipboard actions.
- `Enable_Field_Audit_Log__c`: Toggles transactional before/after field edit logging in `Smart_Grid_Edit_Log__c`.

### 22.2 High-Volume Keyset SOQL Cursor Service (`SmartGridCursorService.cls`)

For datasets exceeding 2,000 records, standard SOQL `OFFSET` queries degrade or throw runtime governor exceptions. Smart Grid uses indexed keyset pagination:

- Queries order by indexed keys (e.g. `Id` or created date) and stream batches via `WHERE Id > :lastSeenId`.
- Enables smooth navigation across 100,000+ records within standard CPU and heap limits.

### 22.3 Multi-Currency Corporate Normalization (`SmartGridCurrencyService.cls`)

In multi-currency Salesforce orgs:

- Automatically detects active multi-currency state via Schema describe.
- Queries and caches active `CurrencyType` conversion rates.
- Normalizes group subtotals and footer aggregates to corporate currency so multi-currency rollups are mathematically accurate.

### 22.4 Field-Level Change Audit Logging (`Smart_Grid_Edit_Log__c`)

When `Enable_Field_Audit_Log__c` is enabled:

- Every save transaction records the User, SObject, Record ID, Field API Name, Old Value, New Value, and Timestamp into `Smart_Grid_Edit_Log__c`.
- Audit logs are accessible via `SmartGridAuditService.getRecordAuditLogs(recordId)` and displayed in the row action history drawer.

---

## 23. Automated End-to-End Testing & Playwright Verification

Smart Grid features a comprehensive automated browser testing suite powered by [Playwright](https://playwright.dev) to validate complex user workflows against live Salesforce sandboxes and scratch orgs without manual intervention.

### 23.1 Test Scripts Architecture (`e2e-tests/`)

The repository includes pre-built end-to-end verification scripts that generate frontdoor session URLs via `sf org open` and run headless browser automation:

| Script Name                  | Target Scenarios & Verified Assertions                                                                                                                                                                                                                      |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify-unified-ai.js`       | Validates the single unified Smart Grid AI (Cmd+K / Einstein icon) omnibar, conversational Q&A answer card rendering with live database rollups, command preview execution, and the Data Quality shield (`utility:shield`) icon.                            |
| `verify-bottom-analytics.js` | Validates complete removal of sticky column totals footer, opening of full-width bottom analytics panel, SVG Donut/Bar/Funnel rendering with live data, removal of redundant Cancel button, and clean dismissal via the **✕** button.                       |
| `verify-user-fixes.js`       | Validates the ergonomic 2-row toolbar alignment, multi-record selection without side drawer intrusion, in-place inline editing in Transpose View (hover pencil, click-to-edit, draft badge, and sticky save dock), and conversational AI assistant replies. |
| `verify-chart-panel.js`      | Deep visual validation of all chart rendering states, legend color matching, and metric calculations across different record counts.                                                                                                                        |

### 23.2 Running the Playwright Test Suite

```bash
# Authenticate your target org first
sf org login web -a sandbox-org

# Run complete Playwright end-to-end test suite
npx playwright test

# Or execute specific headless scenario scripts directly
node e2e-tests/verify-unified-ai.js
node e2e-tests/verify-bottom-analytics.js
node e2e-tests/verify-user-fixes.js
node e2e-tests/verify-chart-panel.js
```

Each run captures automated screenshot artifacts in the test directory for audit compliance and visual regression detection.
