# Salesforce Smart Grid — Enterprise AI Data Workspace

[![Salesforce API](https://img.shields.io/badge/Salesforce%20API-v65.0-blue.svg)](https://developer.salesforce.com)
[![Apex Tests](<https://img.shields.io/badge/Apex%20Tests-126%2F126%20Passing%20(100%25)-success.svg>)]()
[![LWC Jest](<https://img.shields.io/badge/LWC%20Jest-124%2F124%20Passing%20(100%25)-success.svg>)]()
[![Security](https://img.shields.io/badge/Security-USER__MODE%20%7C%20stripInaccessible-green.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

A **metadata-driven, enterprise-grade data workspace and spreadsheet experience** for Salesforce Lightning. Drop it onto any App, Home, or Record page to instantly render a fully functional, editable, and AI-augmented datatable for any standard or custom object — no code required.

---

## 📚 Complete Documentation Suite

| Guide                                                       | Description                                                                                                                                   | Target Audience                                |
| :---------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| 📖 **[User Guide](docs/USER_GUIDE.md)**                     | End-user instructions, inline editing, draft review, column customization, with vs without AI usage, and detailed AI examples.                | End Users, Sales Reps, Analysts, Data Stewards |
| 🛠️ **[Administrator Guide](docs/ADMIN_GUIDE.md)**           | Full metadata setup (`__mdt`), App Builder deployment, permission sets, external LLM Named Credentials, telemetry, and governor limit tuning. | Salesforce Admins, Developers, Architects      |
| 🧪 **[QA Audit & Remediation Walkthrough](walkthrough.md)** | 100-point E2E quality audit, defect log (P0-P2 fixes), non-admin persona verification under `System.runAs`, and seed data validation.         | QA Leads, Security Reviewers, Release Managers |

---

## ✨ Feature Pillars

### 1. High-Performance Spreadsheet Experience

- **Mass Inline Editing**: Edit text, numbers, dates, currencies, and custom picklists inline with instant visual cues.
- **Review Pending Changes Modal**: Compare baseline database values against draft edits in a side-by-side diff before saving.
- **Bulk Save with Partial Success**: Uses `Database.insert`/`Database.update(..., false)`. Successful records save cleanly; failed records display inline error tooltips.
- **Add & Delete Rows**: Add new client-side draft rows instantly. Delete selected records safely with confirmation modals.
- **Fill Down**: Copy a value across selected rows targeting the active edited column.
- **Multi-Level Undo/Redo**: Full history stack (`Ctrl+Z`, `Ctrl+Y`).
- **Responsive Paging & Sticky Scrolling**: Page sizes of 10, 25, 50, or 100 with sticky table headers and anchored footer pagination.
- **Sticky Column Totals & Aggregates**: Live Sum, Average, Minimum, and Maximum for numeric and currency fields.
- **Reading Pane**: Side-by-side inspection drawer for viewing record details without leaving the grid.
- **Hierarchical Related Sub-Grids**: Expand parent records to display nested child record grids (e.g. Account → Contacts).
- **RFC 4180 CSV Exporter**: One-click spreadsheet export respecting visible columns and active filter criteria.

### 2. Dynamic Personalization & Customization

- **Field Picker**: Dual-listbox modal enabling users to add, remove, and reorder fields on demand.
- **Column Pinning & Resizing**: Pin vital columns (e.g. `Name`) to the left; drag borders or double-click to auto-fit widths.
- **User-Saved Views (`Smart_Grid_View__c`)**: Create, name, save, and switch between personalized view presets.
- **Ergonomic Preferences (`Smart_Grid_User_Pref__c`)**: Persists user density preferences, page sizes, and column widths across sessions.
- **Conditional Formatting (`Smart_Grid_Format_Rule__mdt`)**: Highlight cells based on business rules (e.g. green for "Closed Won", red for "Closed Lost").

### 3. AI-Powered Intelligence Suite (AI Premium)

- **NLP Command Palette (`Cmd+K` / `Ctrl+K`)**: Query and filter records using natural language (e.g. _"Show California technology accounts with revenue over $2M"_).
- **Data Quality & Health Inspection Drawer**: Automated health score (0-100) scanning records for missing data, duplicate candidates, outliers, and anomalies.
- **Conversational Assistant Copilot**: Side drawer assistant aware of active grid filters, answering questions and computing aggregate analytics in natural language.
- **Pluggable AI Providers**: Compatible with Salesforce **Einstein Models API**, external LLMs (**OpenAI GPT-4o**, **Claude 3.5**, **Azure OpenAI**) via Named Credentials, or local **Mock AI Provider**.

---

## 🏛️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LIGHTNING WEB COMPONENTS                        │
│  smartDataGrid (Parent)                                               │
│  ├── c-smart-grid-datatable (Custom picklist cell types)               │
│  ├── c-smart-grid-filter-bar & c-smart-grid-filter-builder             │
│  ├── c-smart-grid-field-picker & c-smart-grid-view-selector            │
│  ├── c-smart-grid-review-modal (Diff inspection modal)                │
│  ├── c-smart-grid-reading-pane & c-smart-grid-related-grid             │
│  ├── c-smart-grid-command-palette (NLP prompt interface)               │
│  ├── c-smart-grid-assistant (Conversational AI copilot)               │
│  ├── c-smart-grid-data-quality (Health score & issue inspector)        │
│  └── c-smart-grid-onboarding (Interactive product walkthrough)        │
├────────────────────────────────────────────────────────────────────────┤
│                           APEX DOMAIN LAYER                            │
│  SmartGridController (Thin API boundary)                               │
│  ├── GridQueryBuilder (FLS-safe dynamic SOQL, SQLi prevention)         │
│  ├── SmartGridIdValidator (ID validation, delete integrity check)      │
│  ├── SmartGridLicenseService (Entitlement checks & tier gating)        │
│  ├── SmartGridNLPEngine (Natural language query translation)           │
│  ├── SmartGridDataQualityService (Outlier & anomaly evaluation)        │
│  ├── SmartGridAgentService & SmartGridNLPDMLHandler (AI DML execution) │
│  ├── SmartGridViewService & SmartGridUserPrefService                   │
│  └── SmartGridTelemetryService (Platform event publisher)              │
├────────────────────────────────────────────────────────────────────────┤
│                         METADATA & DATA LAYER                          │
│  Custom Metadata Types:                                                │
│    - Smart_Grid_Config__mdt, Smart_Grid_Column__mdt                    │
│    - Smart_Grid_Format_Rule__mdt, Smart_Grid_AI_Config__mdt            │
│    - Smart_Grid_License__mdt                                           │
│  Custom Objects: Smart_Grid_View__c, Smart_Grid_User_Pref__c           │
│  Platform Event: Smart_Grid_Telemetry__e                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
force-app/main/default/
├── classes/
│   ├── GridQueryBuilder.cls                # Dynamic SOQL generator with FLS
│   ├── GridQueryBuilderTest.cls            # 100% pass
│   ├── ISmartGridAIProvider.cls            # Pluggable AI provider interface
│   ├── SmartGridAgentService.cls           # Agent runtime orchestration
│   ├── SmartGridAgentServiceTest.cls       # 100% pass
│   ├── SmartGridController.cls             # Main @AuraEnabled controller
│   ├── SmartGridControllerTest.cls         # 100% pass
│   ├── SmartGridDataQualityService.cls     # Data health analysis engine
│   ├── SmartGridDataQualityServiceTest.cls # 100% pass
│   ├── SmartGridEinsteinAIProvider.cls     # Einstein Models API adapter
│   ├── SmartGridExternalAIProvider.cls     # Named Credential HTTP adapter
│   ├── SmartGridFormatEngine.cls           # Cell format rule parser
│   ├── SmartGridFormatEngineTest.cls       # 100% pass
│   ├── SmartGridIdValidator.cls            # ID security & validation
│   ├── SmartGridIdValidatorTest.cls        # 100% pass
│   ├── SmartGridLicenseService.cls         # Feature gating & licenses
│   ├── SmartGridLicenseServiceTest.cls     # 100% pass
│   ├── SmartGridMockAIProvider.cls         # Simulation AI engine
│   ├── SmartGridNLPDMLHandler.cls          # Natural language DML engine
│   ├── SmartGridNLPDMLHandlerTest.cls      # 100% pass
│   ├── SmartGridNLPEngine.cls              # NLP SOQL translation engine
│   ├── SmartGridNLPEngineTest.cls          # 100% pass
│   ├── SmartGridNonAdminPersonaTest.cls    # System.runAs non-admin test suite
│   ├── SmartGridSchemaService.cls          # Schema describe caching
│   ├── SmartGridTelemetryService.cls       # Telemetry publisher
│   ├── SmartGridTelemetryServiceTest.cls   # 100% pass
│   ├── SmartGridUserPrefService.cls        # User preferences service
│   ├── SmartGridUserPrefServiceTest.cls    # 100% pass
│   ├── SmartGridViewService.cls            # Custom views manager
│   └── SmartGridViewServiceTest.cls        # 100% pass
├── flexipages/
│   └── Smart_Grid_Demo.flexipage-meta.xml  # Lightning App Page
├── tabs/
│   └── Smart_Grid_Explorer.tab-meta.xml    # Lightning Custom Tab
├── lwc/
│   ├── smartDataGrid/                      # Parent grid orchestrator
│   ├── smartGridDatatable/                 # Extended datatable with custom types
│   ├── smartGridPicklist/                  # Custom picklist template
│   ├── smartGridCommandPalette/            # Cmd+K NLP prompt modal
│   ├── smartGridAssistant/                 # AI assistant side drawer
│   ├── smartGridDataQuality/               # Health score & outlier inspector
│   ├── smartGridFilterBar/                 # Quick filter combobox
│   ├── smartGridFilterBuilder/             # Advanced condition builder
│   ├── smartGridFieldPicker/               # Column personalization dual-listbox
│   ├── smartGridReviewModal/               # Unsaved changes diff viewer
│   ├── smartGridReadingPane/               # Side-by-side record drawer
│   ├── smartGridRelatedGrid/               # Nested hierarchical child grid
│   ├── smartGridOnboarding/                # Product tour modal
│   └── [helper services]/                  # Cache, CSV, DirtyState, Formats, etc.
├── objects/
│   ├── Smart_Grid_Config__mdt/             # Configuration CMDT
│   ├── Smart_Grid_Column__mdt/             # Relational column CMDT
│   ├── Smart_Grid_Format_Rule__mdt/        # Formatting rule CMDT
│   ├── Smart_Grid_AI_Config__mdt/          # AI provider CMDT
│   ├── Smart_Grid_License__mdt/            # Licensing & entitlement CMDT
│   ├── Smart_Grid_Telemetry__e/            # Platform Event
│   ├── Smart_Grid_User_Pref__c/            # User preferences custom object
│   └── Smart_Grid_View__c/                 # Saved views custom object
└── permissionsets/
    ├── SmartGrid_User.permissionset-meta.xml
    └── Smart_Grid_AI_Premium.permissionset-meta.xml
```

---

## 🚀 Quick Start Deployment

### 1. Authenticate to your Target Org

```bash
sf org login web --alias my-org
```

### 2. Deploy Metadata

```bash
sf project deploy start \
  --source-dir force-app \
  --target-org my-org \
  --test-level RunLocalTests \
  --wait 15
```

### 3. Assign Permission Sets

```bash
# Assign Core Grid to user
sf org assign permset --name SmartGrid_User --target-org my-org

# Assign AI Suite (Optional)
sf org assign permset --name Smart_Grid_AI_Premium --target-org my-org
```

### 4. Open the App in Lightning Experience

```bash
sf org open --path /lightning/n/Smart_Grid_Explorer --target-org my-org
```

---

## 🧪 Test Execution & Verification

### Apex Automated Tests (13 Suites, 126 Tests)

```bash
sf apex run test \
  --class-names GridQueryBuilderTest,SmartGridControllerTest,SmartGridDataQualityServiceTest,SmartGridFormatEngineTest,SmartGridIdValidatorTest,SmartGridLicenseServiceTest,SmartGridNLPDMLHandlerTest,SmartGridNLPEngineTest,SmartGridNonAdminPersonaTest,SmartGridTelemetryServiceTest,SmartGridUserPrefServiceTest,SmartGridViewServiceTest,SmartGridAgentServiceTest \
  --code-coverage \
  --result-format human \
  --target-org my-org
```

> **Result**: `126 / 126 Passed (100% Pass Rate)`

### LWC Jest Unit Tests (20 Suites, 124 Tests)

```bash
npm test
```

> **Result**: `20 / 20 Suites Passed, 124 / 124 Tests Passed (100% Pass Rate)`

---

## 🔒 Security & Quality Gates

- **User Mode Enforcement**: Queries run `WITH USER_MODE`. Inaccessible fields are automatically excluded from SOQL.
- **Strip Inaccessible**: DML operations execute through `Security.stripInaccessible(AccessType.UPSERTABLE, records)` to prevent unauthorized field writes.
- **SQL Injection Prevention**: Object names and fields are validated against `Schema.getGlobalDescribe()` token maps; string inputs are safely escaped.
- **License-Agnostic Permission Sets**: No rigid user license locks. Fully compatible with Salesforce Platform, Salesforce Standard, and Community internal licenses.
- **Non-Admin Persona Verified**: Tested and verified under `System.runAs(standardUser)` across all DML, NLP, and Data Quality services.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
