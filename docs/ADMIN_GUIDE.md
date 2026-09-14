# Salesforce Smart Grid — Administrator & Implementation Guide

This guide is for Salesforce System Administrators, Developers, and Technical Architects. It covers end-to-end installation, metadata configuration, Lightning App Builder deployment, permission set architecture, AI engine configuration, security enforcement, and performance tuning.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data & Metadata Model Reference](#2-data--metadata-model-reference)
   - [Smart_Grid_Config\_\_mdt (Grid Configurations)](#smart_grid_config__mdt)
   - [Smart_Grid_Column\_\_mdt (Child Column Definitions)](#smart_grid_column__mdt)
   - [Smart_Grid_Format_Rule\_\_mdt (Conditional Formatting)](#smart_grid_format_rule__mdt)
   - [Smart_Grid_AI_Config\_\_mdt (AI Provider Settings)](#smart_grid_ai_config__mdt)
   - [Smart_Grid_License\_\_mdt (Feature Licensing & Tiers)](#smart_grid_license__mdt)
   - [Custom Objects: Smart_Grid_View**c & Smart_Grid_User_Pref**c](#custom-objects)
   - [Platform Event: Smart_Grid_Telemetry\_\_e](#platform-event-smart_grid_telemetry__e)
3. [Step-by-Step: Adding Smart Grid for Any Object](#3-step-by-step-adding-smart-grid-for-any-object)
   - [Example A: Setting up an Opportunity Grid](#example-a-setting-up-an-opportunity-grid)
   - [Example B: Setting up a Custom Object Grid (Project\_\_c)](#example-b-setting-up-a-custom-object-grid-project__c)
4. [Lightning App Builder Deployment](#4-lightning-app-builder-deployment)
   - [App Page Placement](#app-page-placement)
   - [Record Page Placement (Parent-Child Context)](#record-page-placement-parent-child-context)
   - [Home Page Placement](#home-page-placement)
5. [Permissions & Security Model](#5-permissions--security-model)
   - [Permission Sets Overview](#permission-sets-overview)
   - [User License Compatibility (Salesforce vs Platform)](#user-license-compatibility)
   - [CRUD & Field-Level Security (FLS) Enforcement](#crud--fls-enforcement)
6. [Configuring the AI Suite](#6-configuring-the-ai-suite)
   - [Supported AI Providers](#supported-ai-providers)
   - [Setting up Einstein AI Models API](#setting-up-einstein-ai-models-api)
   - [Setting up External LLM via Named Credential (OpenAI / Claude)](#setting-up-external-llm-via-named-credential)
   - [Using Mock AI in Sandbox / Development](#using-mock-ai-in-sandbox--development)
   - [Enabling or Disabling AI Features (Feature Gating)](#enabling-or-disabling-ai-features)
7. [Telemetry & Audit Logging](#7-telemetry--audit-logging)
8. [Governor Limits & Performance Tuning](#8-governor-limits--performance-tuning)
9. [Troubleshooting & FAQs](#9-troubleshooting--faqs)

---

## 1. Architecture Overview

Salesforce Smart Grid follows an enterprise three-tier architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  smartDataGrid (Parent orchestrator)                                  │
│  ├── c-smart-grid-datatable (Custom picklist & cell rendering)         │
│  ├── c-smart-grid-filter-bar & c-smart-grid-filter-builder             │
│  ├── c-smart-grid-field-picker & c-smart-grid-view-selector            │
│  ├── c-smart-grid-review-modal (Unsaved diff viewer)                   │
│  ├── c-smart-grid-reading-pane & c-smart-grid-related-grid             │
│  ├── c-smart-grid-command-palette (NLP prompt interface)               │
│  ├── c-smart-grid-assistant (Conversational AI drawer)                 │
│  └── c-smart-grid-data-quality (Health score & issue inspector)        │
├────────────────────────────────────────────────────────────────────────┤
│                          BUSINESS LOGIC LAYER                          │
│  SmartGridController (Thin AuraEnabled boundary)                       │
│  ├── GridQueryBuilder (FLS-safe dynamic SOQL with SQLi prevention)     │
│  ├── SmartGridIdValidator (ID formatting and delete validation)        │
│  ├── SmartGridLicenseService (Entitlement checks & tier verification)  │
│  ├── SmartGridNLPEngine (Natural Language prompt translation)          │
│  ├── SmartGridDataQualityService (Outlier, missing data & duplicates)  │
│  ├── SmartGridAgentService & SmartGridNLPDMLHandler (DML via AI)       │
│  ├── SmartGridViewService & SmartGridUserPrefService                   │
│  └── SmartGridTelemetryService (Publishes Smart_Grid_Telemetry__e)     │
├────────────────────────────────────────────────────────────────────────┤
│                          METADATA & DATA LAYER                         │
│  Custom Metadata:                                                      │
│    - Smart_Grid_Config__mdt, Smart_Grid_Column__mdt                    │
│    - Smart_Grid_Format_Rule__mdt, Smart_Grid_AI_Config__mdt            │
│    - Smart_Grid_License__mdt                                           │
│  Custom Objects: Smart_Grid_View__c, Smart_Grid_User_Pref__c           │
│  Platform Event: Smart_Grid_Telemetry__e                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data & Metadata Model Reference

### Smart_Grid_Config\_\_mdt

The primary metadata record that defines the behavior, object target, and column layout of a grid instance.

| Field Name                 | Type            | Description                                                                    |
| :------------------------- | :-------------- | :----------------------------------------------------------------------------- |
| `DeveloperName`            | Text            | Unique API identifier (e.g. `Account_Demo_Grid`, `Opportunity_Pipeline_Grid`). |
| `Object_API_Name__c`       | Text(80)        | SObject API Name (e.g. `Account`, `Opportunity`, `Invoice__c`).                |
| `Columns_JSON__c`          | LongText(10000) | JSON array of columns (used when child metadata is not utilized).              |
| `Default_Filter_Field__c`  | Text(80)        | API name of the picklist field to populate the quick filter combobox.          |
| `Default_Sort_Field__c`    | Text(80)        | Initial sort field (e.g. `Name`, `CloseDate`).                                 |
| `Record_Limit__c`          | Number(6,0)     | Maximum query rows fetched (default: 200, max safe limit: 2000).               |
| `Is_Active__c`             | Checkbox        | Master on/off toggle.                                                          |
| `Allow_Personalization__c` | Checkbox        | Determines if users can open the Field Picker to modify columns.               |
| `Enable_Add_Row__c`        | Checkbox        | Enables the **Add Row** button in the toolbar.                                 |
| `Enable_Delete__c`         | Checkbox        | Enables the **Delete Selected** button in the toolbar.                         |
| `Enable_Export__c`         | Checkbox        | Enables the **Export to CSV** button.                                          |
| `Enable_Filters__c`        | Checkbox        | Enables the Advanced Filter Builder modal.                                     |
| `Enable_ReadingPane__c`    | Checkbox        | Enables the side-by-side detail drawer.                                        |
| `Totals_Fields_JSON__c`    | LongText(10000) | JSON array of numeric fields to compute totals for (e.g. `["Amount"]`).        |
| `Related_Object__c`        | Text(255)       | Related child object configuration string for hierarchical sub-grids.          |

#### Sample `Columns_JSON__c` Payload:

```json
[
  { "field": "Name", "order": 1, "editable": true, "width": 220 },
  { "field": "StageName", "order": 2, "editable": true, "width": 160 },
  { "field": "Amount", "order": 3, "editable": true, "width": 140 },
  { "field": "CloseDate", "order": 4, "editable": true, "width": 140 },
  { "field": "Probability", "order": 5, "editable": false, "width": 120 }
]
```

---

### Smart_Grid_Column\_\_mdt

An alternative relational child metadata type for administrators who prefer defining columns as individual records rather than raw JSON.

- `Grid_Config__c`: Master-Detail relationship to `Smart_Grid_Config__mdt`.
- `Field_API_Name__c`: API name of the field (e.g. `StageName`).
- `Display_Label__c`: Custom override label (optional).
- `Order__c`: Sorting index (e.g. `1`, `2`, `3`).
- `Is_Editable__c`: Checkbox allowing inline editing.
- `Column_Width__c`: Default pixel width.
- `Is_Sortable__c`: Enables column header sorting.

---

### Smart_Grid_Format_Rule\_\_mdt

Defines conditional formatting highlights (background colors, badges, warning text) on cell values.

| Field Name            | Type         | Description                                                         |
| :-------------------- | :----------- | :------------------------------------------------------------------ |
| `Grid_Config__c`      | Relationship | Link to target `Smart_Grid_Config__mdt` record.                     |
| `Field_API_Name__c`   | Text(80)     | Target field to evaluate (e.g. `StageName`, `Rating`).              |
| `Operator__c`         | Text(20)     | `equals`, `not_equal_to`, `greater_than`, `less_than`, `contains`.  |
| `Comparison_Value__c` | Text(255)    | Value to evaluate against (e.g. `Closed Won`, `Hot`, `0`).          |
| `Style_Class__c`      | Text(80)     | CSS styling: `smart-grid-color-green`, `smart-grid-color-red`, etc. |
| `Priority__c`         | Number(4,0)  | Precedence order when multiple rules match a row.                   |

---

### Smart_Grid_AI_Config\_\_mdt

Controls the AI LLM integration, prompt templates, and execution parameters.

| Field Name                | Type         | Description                                                                |
| :------------------------ | :----------- | :------------------------------------------------------------------------- |
| `Grid_Config__c`          | Relationship | Linked grid configuration.                                                 |
| `Provider_Type__c`        | Picklist     | `Einstein`, `NamedCredential`, `Custom`, `Mock`.                           |
| `Named_Credential__c`     | Text(80)     | Developer name of the Named Credential (if external LLM).                  |
| `Model_Identifier__c`     | Text(80)     | Target model ID (e.g. `gpt-4o`, `claude-3-5-sonnet`, `sfdc_einstein_gpt`). |
| `Prompt_Template__c`      | Text(80)     | Prompt Template API name (for Einstein Prompt Builder).                    |
| `Confidence_Threshold__c` | Number(3,2)  | Minimum confidence required (e.g. `0.75`).                                 |
| `Max_Tokens__c`           | Number(5,0)  | Token response limit (e.g. `1024`).                                        |
| `Enable_NLP__c`           | Checkbox     | Enables the Command Palette (`Cmd+K`).                                     |
| `Enable_Suggestions__c`   | Checkbox     | Enables proactive data quality recommendations.                            |
| `Enable_Chat__c`          | Checkbox     | Enables the Conversational Assistant drawer.                               |

---

### Smart_Grid_License\_\_mdt

Provides server-side feature gating for AppExchange packaging and user licensing.

- `Feature_Name__c`: Feature token (`CORE_GRID`, `NLP_COMMAND_PALETTE`, `AI_SUGGESTIONS`, `CONVERSATIONAL_ASSISTANT`).
- `Is_Enabled__c`: Master switch.
- `Is_Premium__c`: If true, requires the user to have the assigned `Permission_Set__c`.
- `Permission_Set__c`: DeveloperName of the required permission set (e.g. `Smart_Grid_AI_Premium`).

---

### Custom Objects

#### `Smart_Grid_View__c`

Stores private or shared user-saved grid views.

- `Object_API_Name__c`: Target SObject name.
- `View_Name__c`: Label entered by the user.
- `User__c`: Lookup to User (owner of the view).
- `Columns_JSON__c`: Serialized selected fields and column widths.
- `Filters_JSON__c`: Serialized filter expressions.
- `Sort_JSON__c`: Saved sort field and direction.
- `Is_Default__c`: Indicates user's default startup view.

#### `Smart_Grid_User_Pref__c`

Stores user-specific grid ergonomics per object.

- `Object_API_Name__c`: Target SObject name.
- `User__c`: Lookup to User.
- `Preferences_JSON__c`: Serialized settings (default page size, compact density, column widths).

---

### Platform Event: `Smart_Grid_Telemetry__e`

Publishes real-time telemetry events when users execute AI prompts, mass DML operations, or export data.

- `Event_Type__c`: `DML_EXECUTE`, `AI_PROMPT_EXECUTE`, `DATA_EXPORT`, `VIEW_SAVED`.
- `Object_API_Name__c`: The target object.
- `User_Id__c`: Running user ID.
- `Record_Count__c`: Number of affected rows.
- `Execution_Time_Ms__c`: Processing duration in milliseconds.
- `Payload_JSON__c`: Contextual metadata payload.

---

## 3. Step-by-Step: Adding Smart Grid for Any Object

Smart Grid works with **any** Salesforce object (Standard or Custom) with zero code changes. Follow these steps:

### Example A: Setting up an Opportunity Grid

#### Step 1: Create the Custom Metadata Record

1. Navigate to **Setup → Custom Metadata Types**.
2. Click **Manage Records** next to **Smart Grid Config**.
3. Click **New** and fill in:
   - **Label**: `Opportunity Pipeline Grid`
   - **Smart Grid Config Name**: `Opportunity_Pipeline_Grid`
   - **Object API Name**: `Opportunity`
   - **Default Filter Field**: `StageName`
   - **Default Sort Field**: `CloseDate`
   - **Record Limit**: `500`
   - **Is Active**: :white_check_mark: Checked
   - **Allow Personalization**: :white_check_mark: Checked
   - **Enable Add Row**: :white_check_mark: Checked
   - **Enable Delete**: :white_check_mark: Checked
   - **Enable Export**: :white_check_mark: Checked
   - **Enable Filters**: :white_check_mark: Checked
   - **Enable Reading Pane**: :white_check_mark: Checked
   - **Totals Fields JSON**: `["Amount", "ExpectedRevenue"]`
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
4. Click **Save**.

#### Step 2: Add Conditional Format Rules (Optional)

Highlight won and lost deals automatically:

1. Under **Custom Metadata Types**, click **Manage Records** next to **Smart Grid Format Rule**.
2. Click **New**:
   - **Grid Config**: `Opportunity_Pipeline_Grid`
   - **Field API Name**: `StageName`
   - **Operator**: `equals`
   - **Comparison Value**: `Closed Won`
   - **Style Class**: `smart-grid-color-green`
   - **Priority**: `1`
3. Click **Save & New**:
   - **Comparison Value**: `Closed Lost`
   - **Style Class**: `smart-grid-color-red`
   - **Priority**: `2`
4. Click **Save**.

---

### Example B: Setting up a Custom Object Grid (`Project__c`)

If you have a custom object `Project__c`:

1. Create a `Smart_Grid_Config__mdt` record:
   - **Object API Name**: `Project__c`
   - **Default Filter Field**: `Status__c`
   - **Default Sort Field**: `CreatedDate`
   - **Columns JSON**:
     ```json
     [
       { "field": "Name", "order": 1, "editable": true, "width": 200 },
       { "field": "Client__c", "order": 2, "editable": true, "width": 180 },
       { "field": "Status__c", "order": 3, "editable": true, "width": 140 },
       { "field": "Budget__c", "order": 4, "editable": true, "width": 140 },
       { "field": "Start_Date__c", "order": 5, "editable": true, "width": 130 },
       {
         "field": "Target_End_Date__c",
         "order": 6,
         "editable": true,
         "width": 130
       }
     ]
     ```
2. Click **Save**.
3. The grid is immediately ready for deployment.

---

## 4. Lightning App Builder Deployment

The `smartDataGrid` component is exposed to **App Pages**, **Home Pages**, and **Record Pages**.

### App Page Placement (Dedicated Workspace)

1. In Setup, search for **Lightning App Builder**.
2. Click **New** → **App Page** → Name it **Pipeline Workspace** → Select **One Region**.
3. Drag **Smart Data Grid** from the Custom Components panel into the canvas.
4. In the right-hand properties sidebar, configure:
   - **Grid Title**: `Opportunity Pipeline Manager`
   - **Grid Config Developer Name**: `Opportunity_Pipeline_Grid`
   - **Default Object API Name**: `Opportunity`
5. Click **Save** and **Activate**. Add the page to your desired Lightning Apps.

### Record Page Placement (Parent-Child Context)

To render related child records on a parent record page (e.g. Account's Opportunities):

1. Navigate to an Account record → Gear Icon → **Edit Page**.
2. Add a new Tab labeled **Opportunities Grid**.
3. Drag **Smart Data Grid** into the tab.
4. Set **Grid Config Developer Name** to your Opportunity config.
5. In **Smart_Grid_Config\_\_mdt**, configure `Related_Object__c` to filter child records by the parent Account ID automatically.

### Home Page Placement

Drag `smartDataGrid` onto the Salesforce Home Page to provide users with an instant, interactive daily worklist.

---

## 5. Permissions & Security Model

### Permission Sets Overview

Smart Grid includes two pre-packaged, license-agnostic Permission Sets:

```
┌───────────────────────────────────────────────────────────────┐
│                    SmartGrid_User                             │
│  - Apex Classes: SmartGridController, GridQueryBuilder,       │
│                  SmartGridIdValidator, SmartGridViewService,  │
│                  SmartGridUserPrefService, SmartGridSchema    │
│  - Custom Metadata: Smart_Grid_Config__mdt, Column, Format    │
│  - Custom Objects: Smart_Grid_View__c, Smart_Grid_User_Pref__c│
│  - Custom Tab: Smart_Grid_Explorer                            │
└───────────────────────────────────────────────────────────────┘
                                ▲
                                │ Extends
┌───────────────────────────────────────────────────────────────┐
│                 Smart_Grid_AI_Premium                         │
│  - Apex Classes: SmartGridNLPEngine, SmartGridAgentService,   │
│                  SmartGridDataQualityService, NLPDMLHandler,  │
│                  SmartGridLicenseService, TelemetryService    │
│  - Custom Metadata: Smart_Grid_AI_Config__mdt, License__mdt   │
└───────────────────────────────────────────────────────────────┘
```

### User License Compatibility

Both permission sets are **license-agnostic** (no rigid `<license>` tag). They can be assigned to:

- Full **Salesforce** license users.
- **Salesforce Platform** license users.
- Identity and community internal users with appropriate object CRUD.

#### Assigning via Salesforce CLI:

```bash
# Assign Core Grid to user
sf org assign permset --name SmartGrid_User --target-org my-org

# Assign AI Premium to user
sf org assign permset --name Smart_Grid_AI_Premium --target-org my-org
```

### CRUD & Field-Level Security (FLS) Enforcement

Smart Grid adheres to the strictest 2026 AppExchange security standards:

- **SOQL User Mode**: Queries execute `WITH USER_MODE`. If a user does not have read access to a field, the query builder excludes it automatically.
- **DML Stripping**: Before performing insert or update DML, the controller passes all records through `Security.stripInaccessible(AccessType.UPSERTABLE, records)`. Inaccessible fields are safely stripped without crashing the transaction.
- **Delete Enforcement**: The controller validates that the user's profile grants `isDeletable()` on the target object before invoking `Database.delete(..., AccessLevel.USER_MODE)`.
- **SQL Injection Prevention**: Field names and table names are validated against `Schema.getGlobalDescribe()` token maps. User inputs in filter conditions are bound via parameterized SOQL or escaped with `String.escapeSingleQuotes()`.

---

## 6. Configuring the AI Suite

The Smart Grid AI Engine supports flexible, pluggable providers.

### Supported AI Providers

| Provider Type     | Implementation                | Description                                                                                        |
| :---------------- | :---------------------------- | :------------------------------------------------------------------------------------------------- |
| `Einstein`        | `SmartGridEinsteinAIProvider` | Native Salesforce Models API & Prompt Builder templates. Zero callout setup required.              |
| `NamedCredential` | `SmartGridExternalAIProvider` | Direct secure HTTP callout to OpenAI, Anthropic, or Azure OpenAI via Salesforce Named Credentials. |
| `Custom`          | Custom Apex Class             | Any custom Apex class that implements `ISmartGridAIProvider`.                                      |
| `Mock`            | `SmartGridMockAIProvider`     | Local simulation engine for sandbox testing and zero-cost offline validation.                      |

---

### Setting up Einstein AI Models API

1. Ensure your org has **Einstein Generative AI** enabled (**Setup → Einstein Generative AI**).
2. Create or verify your Prompt Template in **Setup → Prompt Builder**.
3. Create a `Smart_Grid_AI_Config__mdt` record:
   - **Provider Type**: `Einstein`
   - **Prompt Template**: `Smart_Grid_NLP_Translator`
   - **Model Identifier**: `sfdc_einstein_gpt`
   - **Confidence Threshold**: `0.75`
   - **Max Tokens**: `1024`
   - Check **Enable NLP**, **Enable Suggestions**, and **Enable Chat**.

---

### Setting up External LLM via Named Credential

To connect directly to OpenAI, Anthropic Claude, or Azure OpenAI:

#### Step 1: Create an External Credential & Named Credential

1. Go to **Setup → Named Credentials → External Credentials**.
2. Click **New**:
   - **Label**: `OpenAI External Credential`
   - **Name**: `OpenAI_External_Credential`
   - **Authentication Protocol**: `Custom`
3. Add a Principal:
   - **Parameter Name**: `ApiKey`
   - **Header Name**: `Authorization`
   - **Value**: `Bearer sk-proj-YOUR_ACTUAL_API_KEY`
4. Under **Named Credentials**, click **New**:
   - **Label**: `Smart Grid AI Endpoint`
   - **Name**: `Smart_Grid_AI_Endpoint`
   - **URL**: `https://api.openai.com/v1/chat/completions`
   - **External Credential**: `OpenAI_External_Credential`
   - Check **Generate Authorization Header**.

#### Step 2: Configure Smart_Grid_AI_Config\_\_mdt

1. Open **Custom Metadata Types → Smart Grid AI Config**.
2. Set:
   - **Provider Type**: `NamedCredential`
   - **Named Credential**: `Smart_Grid_AI_Endpoint`
   - **Model Identifier**: `gpt-4o`
   - **Max Tokens**: `1024`
   - Check **Enable NLP**, **Enable Suggestions**, and **Enable Chat**.

---

### Using Mock AI in Sandbox / Development

For continuous integration, QA sandboxes, or scratch orgs without external credentials:

- Leave `Named_Credential__c` blank and set `Provider_Type__c` to `Mock` (or leave as default).
- `SmartGridMockAIProvider` automatically intercepts natural language prompts and parses common patterns (`revenue > X`, `industry = Y`, `sort by Z`) with 100% deterministic accuracy and zero API overhead.

---

### Enabling or Disabling AI Features

To globally disable an AI feature without deleting configuration records:

1. Navigate to **Custom Metadata Types → Smart Grid License**.
2. Edit the target feature record:
   - `NLP_COMMAND_PALETTE`: Command Palette (`Cmd+K`).
   - `AI_SUGGESTIONS`: Data Quality Health Drawer.
   - `CONVERSATIONAL_ASSISTANT`: Smart Grid Assistant drawer.
3. Set `Is_Enabled__c = false` to turn off the feature org-wide, or set `Is_Premium__c = false` to make it free for all users.

---

## 7. Telemetry & Audit Logging

Smart Grid publishes the `Smart_Grid_Telemetry__e` platform event asynchronously on user actions.

### Subscribing to Telemetry Events

Administrators can build an **Event-Triggered Flow** or an Apex trigger to monitor usage or trigger audit alerts:

```apex
trigger SmartGridAuditTrigger on Smart_Grid_Telemetry__e(after insert) {
  List<Audit_Log__c> logs = new List<Audit_Log__c>();
  for (Smart_Grid_Telemetry__e evt : Trigger.new) {
    if (evt.Event_Type__c == 'DATA_EXPORT' && evt.Record_Count__c > 500) {
      // Log high-volume data export alert
      logs.add(
        new Audit_Log__c(
          User__c = evt.User_Id__c,
          Action__c = 'MASS_EXPORT',
          Details__c = 'User exported ' +
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

## 8. Governor Limits & Performance Tuning

| Limit Category       | Threshold     | How Smart Grid Protects It                                                                                                                     |
| :------------------- | :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **SOQL Query Rows**  | 50,000 limit  | Grids default to `Record_Limit__c = 200` (max ceiling: 2,000). The query builder uses `LIMIT` and `OFFSET` pagination.                         |
| **SOQL Query Count** | 100 limit     | All grid loads execute exactly **1 SOQL query** for records and **1 count query** for pagination.                                              |
| **DML Statements**   | 150 limit     | Bulk saves group inserts and updates into exactly **2 DML operations** (`Database.insert` and `Database.update`).                              |
| **DML Rows**         | 10,000 limit  | Bulk edits validate selected row count before invoking server endpoints.                                                                       |
| **Heap Size**        | 6MB / 12MB    | Fields are pruned to only requested columns. Payload sizes are validated before JSON serialization.                                            |
| **LWC Caching**      | Browser Cache | Set `UserPreferencesUserDebugModePref = true` on developers' user records to prevent browser caching of LWC bundles during active development. |

---

## 9. Troubleshooting & FAQs

### Q: Why is a field missing from the Field Picker?

**A**: Smart Grid respects Field-Level Security. If the running user's Profile or Permission Sets do not have Read access to the field, `isAccessible()` returns `false` and the field is automatically omitted from the available fields list.

### Q: Why does a user receive a "Cannot assign permission set, user license doesn't match" error?

**A**: Ensure your `SmartGrid_User` and `Smart_Grid_AI_Premium` permission set metadata files do **not** contain `<license>Salesforce</license>`. Both permission sets in this repository have been configured without license locks to allow assignment across Salesforce Platform, Community, and standard users.

### Q: How do I clear cached LWC components after deploying changes?

**A**: Salesforce aggressively caches Lightning web components.

1. Enable Debug Mode for your user: **Setup → Debug Mode → Check your user**.
2. Perform a hard browser refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` / `Ctrl + F5` (Windows).

### Q: Why does the NLP Command Palette say "AI features not licensed"?

**A**: Check that the user has been assigned the `Smart_Grid_AI_Premium` permission set, and verify in **Custom Metadata Types → Smart Grid License** that `NLP_COMMAND_PALETTE` has `Is_Enabled__c = true`.
