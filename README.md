# Salesforce Smart Grid — Enterprise Data Workspace & Spreadsheet Engine

[![Salesforce API](https://img.shields.io/badge/Salesforce%20API-v65.0-blue.svg)](https://developer.salesforce.com)
[![Apex Tests](https://img.shields.io/badge/Apex%20Tests-100%25%20Passing-success.svg)]()
[![LWC Jest](<https://img.shields.io/badge/LWC%20Jest-206%2F206%20Passing%20(37%20Suites)-success.svg>)]()
[![Static Analysis](https://img.shields.io/badge/PMD%20Code%20Analyzer-0%20High%20Violations-brightgreen.svg)]()
[![Security](https://img.shields.io/badge/Security-USER__MODE%20%7C%20stripInaccessible%20%7C%20FormulaShield-green.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

> **The Enterprise Grid Component for Salesforce: Not another application to buy seats for.**  
> Salesforce Smart Grid transforms any standard or custom object list into an interactive, high-speed spreadsheet workspace on Lightning pages. Users edit records in place with spreadsheet keys, compare records in a transposed matrix view, group and chart live data, safely preview bulk changes with pre-flight visual diffs, and query datasets in natural language with an integrated AI Copilot — **100% native on-platform, with zero per-seat licensing fees.**

---

## ⚡ Key Facts at a Glance

|                      $0                      |                         10+                          |                 100,000+                  |                         7                         |                      100% Native                      |
| :------------------------------------------: | :--------------------------------------------------: | :---------------------------------------: | :-----------------------------------------------: | :---------------------------------------------------: |
| **License Cost**<br>Unlimited users, forever | **Specialized Editors**<br>Every field type editable | **Record Scale**<br>Keyset SOQL streaming | **Custom Metadata Types**<br>CI/CD & Git portable | **On-Platform Security**<br>`WITH USER_MODE` enforced |

---

## 📚 Complete Documentation Suite

| Document                                          | Description                                                                                                                  | Target Audience               |
| :------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- | :---------------------------- |
| 📖 **[User Guide](docs/USER_GUIDE.md)**           | End-user instructions, inline editing, 2D range fill down, Excel copy/paste, Transpose matrix view, and AI command palette.  | Sales Reps, Ops, Analysts     |
| 🛠️ **[Administrator Guide](docs/ADMIN_GUIDE.md)** | Full metadata architecture (`__mdt`), App Builder deployment, permission sets, Admin Studio, keyset cursors, and governance. | Salesforce Admins, Architects |
| 🧪 **[QA Audit & Test Report](docs/QA_AUDIT.md)** | Full verification matrix, 37 Jest suites (206 tests), PMD code analyzer results, and `System.runAs` security validation.     | QA Leads, Release Managers    |
| 📋 **[Architecture Plan & Changelog](change.md)** | Sprint-by-sprint implementation log across all 7 architectural sprints.                                                      | Developers, Architects        |

---

## 🎯 The Component, Not the App

Most grid tools on the AppExchange are separate applications bolted onto Salesforce that require per-seat subscriptions, separate user management, and external configurations.

**Smart Grid is a native Lightning Web Component that becomes part of your platform:**

- **Place It Anywhere**: Drop the component onto any App Page, Record Detail Page (as an interactive related list), or Home Page in Lightning App Builder.
- **Configured via Metadata**: Each grid's definition lives in Salesforce Custom Metadata (`Smart_Grid_Config__mdt`, `Smart_Grid_Column__mdt`, `Smart_Grid_Format_Rule__mdt`). Build it in a sandbox, track it in Git, deploy it via CI/CD change sets, and never worry about package upgrades overwriting your layout.
- **Visual Admin Studio**: Administrators can build, customize, and deploy grids with zero code using the built-in drag-and-drop Admin Studio.
- **Runs as the User**: Every read and write executes under the active user's permissions via `WITH USER_MODE` and `Security.stripInaccessible()`. Your sharing rules, validation rules, Apex triggers, and Flow automations always execute seamlessly.

---

## ✨ What Sets Smart Grid Apart

### 1. Specialized In-Cell Editors (No More Read-Only Cells)

Standard Salesforce datatables force users to click out to detail pages for complex fields. Smart Grid provides dedicated inline editors for every Salesforce field type:

- **Lookup & Master-Detail (`smartGridCellLookup`)**: 300ms debounced typeahead search with an inline **"+ New Record"** creation modal.
- **User vs. Queue Owner (`smartGridCellOwner`)**: Polymorphic selector distinguishing Users and Queues with initials badges.
- **Multi-Select Picklist (`smartGridCellMultiPicklist`)**: Searchable dropdown with checkboxes, selected count badges, and "Select All" / "Clear All" batch actions.
- **Cascading Dependent Picklists (`smartGridCellDependentPicklist`)**: Dynamically recalculates valid options based on controlling field describe metadata and live in-memory draft changes.
- **Combined Date & Time (`smartGridCellDateTime`)**: Dual calendar datepicker and 15-minute time combobox normalized to the user's timezone.

### 2. Transposed Grid View (Matrix Comparison Mode)

Comparing records horizontally in a traditional list requires endless side-scrolling. Smart Grid's **Transpose View** flips the axes:

- **Fields as Rows, Records as Columns**: Sticky left Field Label column locks in place while scrolling horizontally.
- **"Differences Only" Discrepancy Filter**: Instantly hides rows where selected records share identical values, isolating variations for deduplication, deal reviews, and audits.
- **In-Matrix Editing**: Edit values directly within the matrix cells with dirty-state tracking.

### 3. The Life of an Edit (Safety & Pre-Flight Visual Diffs)

Edits follow an enterprise safety lifecycle:

```
[1. Type] ──▶ [2. Stage] ──▶ [3. Browser Check] ──▶ [4. Pre-Flight Diff] ──▶ [5. Server Validation] ──▶ [6. Batch Save (200)]
  Cell turns     Tracked in      Required fields &     Visual Diff Modal        WITH USER_MODE & FLS     Your triggers & flows run;
    yellow        Save Bar        type validation       shows before/after         enforced in Apex        formulas recalculate
```

- **Pre-Flight DML Confirmation Modal (`smartGridDmlConfirmModal`)**: Shows total affected records, operation type, and a visual diff table displaying previous values with red strike-through and new values in green.
- **Granular Revert**: Revert accidental individual cell edits directly from the modal before committing.

### 4. True Spreadsheet Ergonomics

- **2D Rectangular Range Selection**: Marquee mouse-drag or `Shift + Arrow Keys` bounding box selection.
- **Linear Fill Down (`Cmd + D` / `Ctrl + D`)**: Propagate values down selected rows instantly.
- **Bidirectional Clipboard**: Copy (`Cmd + C`) and Paste (`Cmd + V`) multi-cell ranges directly between Smart Grid and Microsoft Excel or Google Sheets.
- **Formula Injection Shield (`formulaShield.js`)**: Neutralizes formula injection vulnerabilities (CVE-2014-3524) on export and clipboard copy (`=`, `+`, `-`, `@`), restoring raw text cleanly on paste.
- **Multi-Level Undo/Redo (`Cmd + Z` / `Cmd + Shift + Z`)**: Step backward and forward through draft edits.

### 5. Multi-Dimensional Grouping & Real-Time Analytics

- **3-Level Hierarchical Grouping**: Group rows by up to three simultaneous dimensions in picklist metadata order.
- **Server-Side Rollup Summaries**: Instant calculations for `Count`, `Sum`, `Average`, `Min`, and `Max`.
- **Docked SVG Analytics Charts**: Real-time **Donut**, **Horizontal Bar**, and **Funnel** charts reacting dynamically to active grid filters and groupings.

### 6. Bulk CSV Import with Rollback Token

- Drag-and-drop CSV parser with automatic column header mapping.
- Inserts/upserts records in safe chunks of 200 via `Database.insert`/`upsert`.
- Generates an **Audit Rollback Token** allowing administrators to execute a one-click **"Undo Import"** if bad data was uploaded.

### 7. AI Copilot & Natural Language Interface

- **NLP Command Palette (`Cmd + K` / `Ctrl + K`)**: Filter, sort, transpose, and analyze data using natural language prompts (e.g. _"Show enterprise accounts in California with revenue over 5M"_).
- **Data Quality & Health Score (`smartGridDataQuality`)**: Automated 0-100 dataset hygiene scoring identifying missing required data, duplicate candidates, and statistical outliers.
- **Conversational Assistant (`smartGridAssistant`)**: Context-aware drawer assistant answering analytical questions based on active grid filters.

---

## 📊 Comprehensive Comparison: Smart Grid vs. Paid AppExchange Grids

This comparison evaluates Smart Grid against the **six leading paid commercial grid applications** available on the Salesforce AppExchange.

> **Research Basis**: Capabilities and pricing reflect published vendor documentation and AppExchange listings as of 2026.

| Capability Area            | Specific Feature                           | Salesforce Smart Grid | Conga Grid | GridBuddy Connect | Grid Mate | Mashmatrix Sheet | RavenApps Grids |  AGrid  |
| :------------------------- | :----------------------------------------- | :-------------------: | :--------: | :---------------: | :-------: | :--------------: | :-------------: | :-----: |
| **Pricing & Cost**         | **List Price / User / Month**              |     **$0 (Free)**     |   $18.00   |      $27.50       |  $15.00   |      $18.00      |     $12.00      | $10.00  |
|                            | **Per-Seat License Minimums**              |       **None**        |    Yes     |        Yes        |    Yes    |       Yes        |       Yes       |   Yes   |
|                            | **Annual Cost for 50 Users**               |        **$0**         |  $10,800   |      $16,500      |  $9,000   |     $10,800      |     $7,200      | $6,000  |
|                            | **3-Year TCO for 250 Users**               |        **$0**         |  $162,000  |     $247,500      | $135,000  |     $162,000     |    $108,000     | $90,000 |
| **Editing Ergonomics**     | **Mass Inline Editing**                    |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |       Yes       |   Yes   |
|                            | **2D Range Selection & Fill Down**         |        **Yes**        |  Partial   |        No         |  Partial  |       Yes        |       No        |   No    |
|                            | **Excel Range Copy & Paste**               |        **Yes**        |    Yes     |      Partial      |    Yes    |       Yes        |     Partial     |   No    |
|                            | **Multi-Level Undo & Redo**                |        **Yes**        |  Partial   |      Partial      |  Partial  |       Yes        |       No        |   No    |
|                            | **Inline Add Row & Delete**                |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |       Yes       |   Yes   |
| **Cell Editors**           | **Lookup with Inline "+ New Record"**      |        **Yes**        |  Partial   |      Partial      |    Yes    |       Yes        |     Partial     | Partial |
|                            | **User vs. Queue Owner Selector**          |        **Yes**        |  Partial   |      Partial      |    Yes    |       Yes        |     Partial     | Partial |
|                            | **Multi-Select Picklist Combobox**         |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |       Yes       |   Yes   |
|                            | **Cascading Dependent Picklists**          |        **Yes**        |    Yes     |      Partial      |    Yes    |       Yes        |       Yes       |   Yes   |
|                            | **Combined Date & Time Picker**            |        **Yes**        |  Partial   |      Partial      |    Yes    |       Yes        |     Partial     | Partial |
| **Views & Layouts**        | **Transposed Grid (Matrix Mode)**          |        **Yes**        |     No     |        No         |    No     |     Partial      |       No        |   No    |
|                            | **"Differences Only" Discrepancy Filter**  |        **Yes**        |     No     |        No         |    No     |        No        |       No        |   No    |
|                            | **Multi-Column Sorting & Filtering**       |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |       Yes       |   Yes   |
|                            | **Column Freezing (Pin Left/Right)**       |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |       Yes       |   Yes   |
|                            | **Auto-Fit Column Widths**                 |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |       Yes       |   Yes   |
| **Grouping & Analytics**   | **Multi-Level Hierarchical Grouping**      |   **Yes (3-Level)**   |  Partial   |        Yes        |    Yes    |     Partial      |       No        |   Yes   |
|                            | **Server-Side Aggregates (Sum/Avg)**       |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |     Partial     |   Yes   |
|                            | **Docked Real-Time SVG Charts**            |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |     Partial     |   No    |
|                            | **Conditional Formatting & Data Bars**     |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |       Yes       |   Yes   |
| **Data Mobility & Safety** | **Bulk CSV Import with Auto-Mapping**      |        **Yes**        |  Partial   |      Partial      |    Yes    |       Yes        |       Yes       |   No    |
|                            | **Transactional Rollback ("Undo Import")** |        **Yes**        |     No     |        No         |    No     |        No        |       No        |   No    |
|                            | **Pre-Flight DML Visual Diff Modal**       |        **Yes**        |     No     |        No         |    No     |        No        |       No        |   No    |
|                            | **Formula Injection Shield (RFC-4180)**    |        **Yes**        |     No     |        No         |    No     |        No        |       No        |   No    |
|                            | **Field-Level Change Audit Logging**       |        **Yes**        |  Partial   |      Partial      |  Partial  |     Partial      |       No        |   No    |
| **AI & Architecture**      | **NLP Command Palette (`Cmd+K`)**          |        **Yes**        |     No     |        No         |    No     |     Partial      |       No        |   No    |
|                            | **Data Quality & Duplicate Inspector**     |        **Yes**        |     No     |        No         |    No     |        No        |       No        |   No    |
|                            | **Conversational Assistant Drawer**        |        **Yes**        |     No     |        No         |    No     |        No        |       No        |   No    |
|                            | **100% Native (Zero External Egress)**     |        **Yes**        |  Partial   |      Partial      |    Yes    |       Yes        |       Yes       |   Yes   |
|                            | **Custom Metadata Driven (`__mdt`)**       |        **Yes**        |  Partial   |        No         |  Partial  |     Partial      |     Partial     |   No    |
|                            | **Visual In-App Admin Studio**             |        **Yes**        |    Yes     |        Yes        |    Yes    |       Yes        |       Yes       |   Yes   |

---

## 💰 3-Year Total Cost of Ownership (TCO) Analysis

When evaluating grid solutions, per-seat licensing escalates dramatically as your team expands. Because Smart Grid is deployed directly to your Salesforce org as native metadata, its licensing cost is **$0 across any team size**.

```
  Three-Year Licensing Cost by Team Size

  $250k ───────────────────────────────────────────────────────────── GridBuddy ($247.5k)
                                                                 ─── Mashmatrix / Conga ($162k)
  $150k ───────────────────────────────────────────────────────────── Grid Mate ($135k)
                                                                 ─── RavenApps ($108k)
  $100k ───────────────────────────────────────────────────────────── AGrid ($90k)

    $0k ───────────────────────────────────────────────────────────── SMART GRID ($0)
        │                         │                           │
     25 Users                  50 Users                   250 Users
```

### Cumulative License Cost Over 3 Years:

| Solution                  | List Price / User / Mo | 25 Users (3 Yrs) | 50 Users (3 Yrs) | 100 Users (3 Yrs) | 250 Users (3 Yrs) |
| :------------------------ | :--------------------: | :--------------: | :--------------: | :---------------: | :---------------: |
| **Salesforce Smart Grid** |         **$0**         |      **$0**      |      **$0**      |      **$0**       |      **$0**       |
| **Conga Grid**            |         $18.00         |     $16,200      |     $32,400      |      $64,800      |     $162,000      |
| **GridBuddy Connect**     |         $27.50         |     $24,750      |     $49,500      |      $99,000      |     $247,500      |
| **Grid Mate**             |         $15.00         |     $13,500      |     $27,000      |      $54,000      |     $135,000      |
| **Mashmatrix Sheet**      |         $18.00         |     $16,200      |     $32,400      |      $64,800      |     $162,000      |
| **RavenApps Grids**       |         $12.00         |     $10,800      |     $21,600      |      $43,200      |     $108,000      |
| **AGrid**                 |         $10.00         |      $9,000      |     $18,000      |      $36,000      |      $90,000      |

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   LIGHTNING WEB COMPONENTS (LWC)                                │
│                                                                                                 │
│  smartDataGrid (Master Orchestrator & View Switcher)                                            │
│  ├── smartGridTable (Unified Adaptive Virtualized Core: 5 to 100k+ rows)                        │
│  │   ├── rangeSelectionManager.js (2D rectangular selection math)                               │
│  │   ├── clipboardManager.js (TSV serializer & parser)                                         │
│  │   └── formulaShield.js (RFC-4180 formula injection neutralizer)                             │
│  ├── smartGridTransposeTable (Pivoted field-as-row matrix layout with discrepancy filter)       │
│  │   └── matrixTransposer.js (Matrix pivoting & difference calculator)                          │
│  ├── Specialized Inline Cell Editors:                                                          │
│  │   ├── smartGridCellLookup (Typeahead search + "+ New Record" modal)                          │
│  │   ├── smartGridCellOwner (Polymorphic User vs. Queue selector)                               │
│  │   ├── smartGridCellMultiPicklist & smartGridCellDependentPicklist                            │
│  │   └── smartGridCellDateTime (Date + 15-min interval time combobox)                           │
│  ├── smartGridChartPanel (Docked SVG Donut, Bar, Funnel charts & KPI tiles)                     │
│  │   └── smartGridDmlConfirmModal (Pre-flight DML summary badges & before/after visual diffs)   │
│  ├── smartGridImportModal (CSV importer with auto-mapping & rollback token)                     │
│  ├── smartGridAdminStudio (Visual drag-and-drop grid builder)                                   │
│  ├── smartGridCommandPalette (NLP intent routing: Filters, Transpose, Group, Charts)            │
│  ├── smartGridAssistant (Conversational AI copilot)                                             │
│  └── smartGridDataQuality (Dataset health score & duplicate inspector)                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                     APEX DOMAIN SERVICES                                        │
│                                                                                                 │
│  SmartGridController (Thin API Gateway)                                                         │
│  ├── SmartGridCursorService.cls (SOQL Keyset cursor pagination for 100k+ records)               │
│  ├── SmartGridGroupService.cls (3-Level grouping, rollups, & aggregations)                       │
│  ├── SmartGridImportService.cls (Chunked upsert with transactional rollback tokens)             │
│  ├── SmartGridMetadataDeployer.cls (Apex Metadata API programmatic deployment)                  │
│  ├── SmartGridAuditService.cls (Field edit change logger & history retrieval)                   │
│  ├── SmartGridCurrencyService.cls (Multi-Currency ISO rates & corporate rollups)                │
│  ├── SmartGridLicenseService.cls (Entitlements, 3-tier governance & permissions)               │
│  └── GridQueryBuilder.cls (Dynamic FLS-safe SOQL query generator)                               │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                     DATA & METADATA LAYER                                       │
│                                                                                                 │
│  Custom Metadata Types:                                                                         │
│    - Smart_Grid_Config__mdt, Smart_Grid_Column__mdt, Smart_Grid_Format_Rule__mdt                │
│    - Smart_Grid_AI_Config__mdt, Smart_Grid_Admin_Setting__mdt, Smart_Grid_License__mdt          │
│  Custom Objects:                                                                                │
│    - Smart_Grid_View__c, Smart_Grid_User_Pref__c, Smart_Grid_Edit_Log__c                        │
│  Permission Sets:                                                                               │
│    - SmartGrid_User, SmartGrid_Power_User, Smart_Grid_AI_Premium, SmartGrid_Admin               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security & Governance

1. **Strict `WITH USER_MODE`**: All database interactions execute strictly in user mode, ensuring that object access, sharing rules, and field-level security (FLS) are automatically enforced by the platform.
2. **Zero Third-Party Data Transmission**: All computations, formula evaluations, and clipboard processing run locally inside the user's browser or on-platform in Apex. No data ever leaves your Salesforce trust boundary.
3. **Formula Injection Neutralization**: `formulaShield.js` strips dangerous spreadsheet formula prefixes (`=`, `+`, `-`, `@`) during exports and copy commands, mitigating CVE-2014-3524.
4. **Shield Platform Encryption**: Fully compatible with Salesforce Shield Deterministic and Probabilistic Encryption on supported field types.

---

## 🧪 Testing & Quality Assurance

Smart Grid is tested with rigorous automated test suites and static analysis tools:

```bash
# Run all LWC Jest unit tests (37 suites, 206 tests, 100% pass rate)
npm run test:unit

# Run static code analysis & linter
npx eslint force-app/main/default/lwc/**/*.js
```

- **Apex Test Coverage**: All test classes maintain >= 90% code coverage.
- **Multi-Persona Testing**: `SmartGridPersonaSecurityTest.cls` validates access across Standard User, Power User, AI Premium, and Administrator personas using `System.runAs`.
- **Salesforce Code Analyzer**: Verified 0 High/Critical PMD violations across all classes.

---

## 🚀 Quick Start Deployment

Deploy the complete source into your Salesforce DX scratch org or sandbox:

```bash
# Authenticate to your target org
sf org login web -a MySandbox

# Deploy metadata source
sf project deploy start --target-org MySandbox

# Assign the administrator permission set
sf org assign permset -n SmartGrid_Admin -a MySandbox
sf org assign permset -n Smart_Grid_AI_Premium -a MySandbox
```

Once deployed:

1. Open the App Launcher and select **Smart Grid Explorer**.
2. Or open **Lightning App Builder** on any Record or App Page and drag the **`smartDataGrid`** component onto the canvas.
3. Select your desired grid configuration name (e.g., `Account_Demo_Grid`) in the design attributes.
