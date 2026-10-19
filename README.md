# Salesforce Smart Grid — Enterprise AI Data Workspace

[![Salesforce API](https://img.shields.io/badge/Salesforce%20API-v65.0-blue.svg)](https://developer.salesforce.com)
[![Apex Tests](https://img.shields.io/badge/Apex%20Tests-100%25%20Passing-success.svg)]()
[![LWC Jest](<https://img.shields.io/badge/LWC%20Jest-206%2F206%20Passing%20(37%20Suites)-success.svg>)]()
[![Security](https://img.shields.io/badge/Security-USER__MODE%20%7C%20stripInaccessible%20%7C%20FormulaShield-green.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

A **metadata-driven, enterprise-grade data workspace and spreadsheet experience** for Salesforce Lightning. Drop it onto any App, Home, or Record page to instantly render a fully functional, editable, and AI-augmented datatable for any standard or custom object — with high-performance virtualized scrolling, 2D range selection, bidirectional clipboard, transposed matrix views, and visual administration.

---

## 📚 Complete Documentation Suite

| Guide                                                       | Description                                                                                                        | Target Audience                   |
| :---------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :-------------------------------- |
| 📋 **[Changelog & Architecture Plan](change.md)**           | Full technical implementation plan and sprint-by-sprint changelog across all 7 sprints.                            | Developers, Architects, Reviewers |
| 📖 **[User Guide](docs/USER_GUIDE.md)**                     | End-user instructions, inline editing, draft review, column customization, Transpose view, and AI command palette. | End Users, Sales Reps, Analysts   |
| 🛠️ **[Administrator Guide](docs/ADMIN_GUIDE.md)**           | Full metadata setup (`__mdt`), App Builder deployment, permission sets, 3-tier governance, and telemetry.          | Salesforce Admins, Developers     |
| 🧪 **[QA Audit & Remediation Walkthrough](walkthrough.md)** | E2E quality audit, defect log, non-admin persona verification under `System.runAs`, and test suite execution.      | QA Leads, Release Managers        |

---

## ✨ Feature Pillars

### 1. High-Performance Unified Virtual Grid

- **Single Adaptive Engine (`smartGridTable`)**: Eliminates fragmented table implementations. A single SLDS-based engine handles 5 to 100,000+ rows smoothly via dynamic viewport windowing (~120 active `<tr>` nodes).
- **Keyset SOQL Cursor Pagination (`SmartGridCursorService.cls`)**: Bypasses the 2,000-row `OFFSET` limit using modern keyset cursors and indexed streaming in `AccessLevel.USER_MODE`.
- **2D Rectangular Range Selection (`rangeSelectionManager.js`)**: Marquee mouse-drag and keyboard-driven (`Shift + Arrow Keys`) bounding box selection.
- **Bidirectional TSV Clipboard (`clipboardManager.js`)**: Copy (`Cmd+C`) and Paste (`Cmd+V`) tabular data directly between Smart Grid and external spreadsheet software (Excel, Google Sheets).
- **Formula Injection Shield (`formulaShield.js`)**: Protects exported and copied data by neutralising spreadsheet formula injection characters (`=`, `+`, `-`, `@`) and restoring original text on paste.
- **Linear Fill Down (`Cmd+D`) & Range Clear (`Delete`)**: Replicates spreadsheet productivity shortcuts with atomic rollback staging.

### 2. Transposed Grid View (Matrix Layout)

- **Fields as Rows, Records as Columns (`smartGridTransposeTable`)**: Pivots selected records into a comparison matrix with a sticky left Field Label column (`position: sticky; left: 0;`).
- **Smooth Horizontal Scroll Container**: Seamless trackpad and horizontal navigation across record columns with guaranteed minimum widths.
- **Smart Discrepancy Filtering**: One-click toggles between **"All Fields"** and **"Differences Only"** to instantly pinpoint data variations between records.
- **Polymorphic In-Cell Editing**: Cell editors adapt dynamically to the row's metadata type (Currency, Checkbox, Picklist, Date, Lookup) and stage changes in `DirtyStateManager.js`.
- **3-Tier Admin Governance**: Configured globally in `Smart_Grid_Admin_Setting__mdt`, overridden per-grid in `Smart_Grid_Config__mdt`, and role-gated via `SmartGrid_Power_User` and `SmartGrid_Admin` permission sets.

### 3. Polymorphic Specialized Inline Cell Editors

- **Lookup / Master-Detail (`smartGridCellLookup`)**: 300ms debounced typeahead search via `SmartGridController.searchLookupRecords` with an inline **"+ New Record"** creation modal.
- **User / Owner Selector (`smartGridCellOwner`)**: Polymorphic User vs. Queue selector with avatar initials and active status badges.
- **Multi-Select Picklist (`smartGridCellMultiPicklist`)**: Search-filtered combobox with checkboxes, badge count, and "Select All" / "Clear All" batch actions.
- **Dependent Cascading Picklists (`smartGridCellDependentPicklist`)**: Dynamically recalculates child picklist options based on controlling field describe data and live edits.
- **Combined Date & Time (`smartGridCellDateTime`)**: Dual datepicker + 15-minute interval time combobox with automatic timezone conversion to user profile locale.

### 4. Multi-Dimensional Grouping & Real-Time Analytics

- **3-Level Hierarchical Grouping (`SmartGridGroupService.cls`)**: Group by up to three simultaneous dimensions with server-side rollups (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) under `USER_MODE`.
- **Docked Analytics Drawer (`smartGridChartPanel`)**: Real-time native SVG charts (**Donut, Horizontal Bar, Funnel**) reacting dynamically to active grid filters and groupings.
- **KPI Summary Metrics**: Instant summary statistics displaying Total, Average, Maximum, and Minimum values.

### 5. Bulk CSV Importer with Rollback Safety

- **Client-Side CSV Parser (`smartGridImportModal`)**: Drag-and-drop file uploader with smart column header auto-mapping and validation preview.
- **Chunked Upsert & Rollback (`SmartGridImportService.cls`)**: Executes bulk DML in chunks of 200 via `Database.insert`/`Database.upsert` with transactional rollback tokens enabling one-click **"Undo Import"**.

### 6. Visual In-App Grid Administration Studio

- **Drag-and-Drop Column Builder (`smartGridAdminStudio`)**: Full-screen administrative LWC for choosing objects, configuring visible columns, setting default filters, and testing layout previews.
- **Native Metadata Deployer (`SmartGridMetadataDeployer.cls`)**: Deploys custom metadata (`Smart_Grid_Config__mdt`, `Smart_Grid_Column__mdt`, `Smart_Grid_Format_Rule__mdt`) directly via `Metadata.Operations.enqueueDeployment`.

### 7. Field-Level Change Audit Trail & Multi-Currency Engine

- **Audit Logging (`Smart_Grid_Edit_Log__c` & `SmartGridAuditService.cls`)**: Custom audit object recording before/after values atomically during grid commits, retrievable via `getRecordAuditLogs()`.
- **Multi-Currency Normalization (`SmartGridCurrencyService.cls`)**: Dynamic multi-currency detection, active `CurrencyType` conversion rate caching, and group subtotal normalization to corporate currency.

### 8. AI-Powered Intelligence Suite

- **NLP Command Palette (`Cmd+K` / `Ctrl+K`)**: Query records in natural language or execute actions like _"Transpose records"_, _"Group by Industry"_, or _"Show chart"_.
- **Data Quality & Duplicate Inspector (`smartGridDataQuality`)**: Automated data completeness scoring and duplicate candidate inspection.
- **Conversational Assistant Copilot (`smartGridAssistant`)**: Context-aware drawer assistant answering analytical questions based on active grid filters.

---

## 🏛️ Component & Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   LIGHTNING WEB COMPONENTS (LWC)                                │
│                                                                                                 │
│  smartDataGrid (Parent Orchestrator & View Switcher)                                            │
│  ├── smartGridTable (Unified Adaptive Virtualized Core: 5 to 100k+ rows)                        │
│  │   ├── rangeSelectionManager.js (2D rectangular selection math)                               │
│  │   ├── clipboardManager.js (TSV serializer & parser)                                         │
│  │   └── formulaShield.js (RFC-4180 formula injection neutralizer)                             │
│  ├── smartGridTransposeTable (Pivoted field-as-row matrix layout)                               │
│  │   └── matrixTransposer.js (Matrix pivoting & discrepancy detector)                           │
│  ├── Specialized Inline Cell Editors Suite:                                                     │
│  │   ├── smartGridCellLookup (Typeahead search + "+ New Record" modal)                          │
│  │   ├── smartGridCellOwner (Polymorphic User/Queue selector)                                   │
│  │   ├── smartGridCellMultiPicklist & smartGridCellDependentPicklist                            │
│  │   └── smartGridCellDateTime (Date + 15-min interval time combobox)                           │
│  ├── smartGridChartPanel (Docked SVG Donut, Bar, Funnel charts & KPI tiles)                     │
│  ├── smartGridImportModal (CSV importer with auto-mapping & rollback token)                     │
│  ├── smartGridAdminStudio (Visual drag-and-drop grid builder)                                   │
│  ├── smartGridCommandPalette (NLP intent routing: Filters, Transpose, Group, Charts)            │
│  ├── smartGridAssistant (Conversational AI copilot)                                             │
│  └── smartGridDataQuality (Dataset health score & duplicate inspector)                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                     APEX DOMAIN SERVICES                                        │
│                                                                                                 │
│  SmartGridController (Thin API Gateway)                                                         │
│  ├── SmartGridCursorService.cls (SOQL Cursors & Keyset pagination for large volumes)             │
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

## 📁 Repository Structure

```
force-app/main/default/
├── classes/
│   ├── SmartGridController.cls              # Core API gateway
│   ├── SmartGridCursorService.cls           # Keyset cursor pagination service
│   ├── SmartGridGroupService.cls            # 3-level grouping & server rollups
│   ├── SmartGridImportService.cls           # Chunked CSV upsert & undo rollback
│   ├── SmartGridMetadataDeployer.cls        # Apex Metadata API deployment
│   ├── SmartGridAuditService.cls            # Field edit change logging
│   ├── SmartGridCurrencyService.cls         # Multi-Currency corporate normalization
│   ├── SmartGridLicenseService.cls          # 3-tier governance & entitlement checks
│   ├── GridQueryBuilder.cls                 # Dynamic FLS-safe SOQL builder
│   ├── SmartGridPersonaSecurityTest.cls     # Multi-persona System.runAs test suite
│   └── [Test Classes]                       # Unit test suites (>=90% code coverage)
├── lwc/
│   ├── smartDataGrid/                       # Parent orchestrator & toolbar
│   ├── smartGridTable/                      # Unified adaptive virtual grid
│   ├── smartGridTransposeTable/             # Transposed matrix view
│   ├── smartGridCellLookup/                 # Typeahead search & +New modal
│   ├── smartGridCellOwner/                  # Polymorphic User/Queue selector
│   ├── smartGridCellMultiPicklist/          # Multi-checkbox picklist
│   ├── smartGridCellDependentPicklist/      # Cascading dependent picklist
│   ├── smartGridCellDateTime/               # Timezone-aware datetime editor
│   ├── smartGridChartPanel/                 # Docked analytics chart drawer
│   ├── smartGridImportModal/                # Drag-and-drop CSV importer
│   ├── smartGridAdminStudio/                # Visual grid layout designer
│   ├── smartGridCommandPalette/             # NLP prompt & workflow palette
│   ├── smartGridAssistant/                  # Conversational copilot
│   ├── smartGridDataQuality/                # Health score & duplicate inspector
│   ├── rangeSelectionManager/               # 2D range bounding box math
│   ├── clipboardManager/                    # Bidirectional TSV serializer
│   ├── formulaShield/                       # Formula injection neutralizer
│   └── matrixTransposer/                    # Transpose matrix pivoting math
├── objects/
│   ├── Smart_Grid_Admin_Setting__mdt/       # Global admin governance settings
│   ├── Smart_Grid_Config__mdt/              # Per-grid layouts & overrides
│   ├── Smart_Grid_Edit_Log__c/              # Field audit trail custom object
│   ├── Smart_Grid_View__c/                  # User personalized views
│   └── Smart_Grid_User_Pref__c/             # User ergonomics & density
└── permissionsets/
    ├── SmartGrid_User.permissionset-meta.xml
    ├── SmartGrid_Power_User.permissionset-meta.xml
    ├── Smart_Grid_AI_Premium.permissionset-meta.xml
    └── SmartGrid_Admin.permissionset-meta.xml
```

---

## 🧪 Testing & Verification

Execute the complete test suites locally:

```bash
# Run all LWC Jest unit tests (37 suites, 206 tests)
npm run test:unit

# Run static analysis and linter
npx eslint force-app/main/default/lwc/**/*.js
```

All Apex classes run under strict `WITH USER_MODE` or enforce `Security.stripInaccessible()`. Multi-persona testing is validated via `SmartGridPersonaSecurityTest.cls` across Standard User, Power User, and Administrator personas using `System.runAs`.
