# Feature Specification: Salesforce Smart Grid - Phase 0

**Feature Number**: 001
**Feature Slug**: 001-smartgrid-final
**API Version**: 65.0
**Date**: 2026-04-05
**Status**: Clarified

## Overview
A metadata-driven, dynamic inline-edit data grid platform inside Salesforce. The "True MVP" (Phase 0) provides `lightning-datatable` based inline editing, bulk saving with partial success handling, single-field dynamic filtering, a custom field picker modal, and configuration via Custom Metadata Types (CMDT) with auto-discovery fallback.

## Platform Context
- **Target Org Type**: Sandbox, built with **ISV / AppExchange Packaging** in mind.
- **Installed Packages**: Designed to integrate safely with third-party namespace objects (e.g., Conga CLM / `Apttus__`).
- **Data Volume**: Hard limit enforced of `MAX_RECORDS = 200` per grid load.
- **Deployment Details**: A demo `Smart_Grid_Config__mdt` record will be deployed alongside the metadata to provide out-of-the-box functionality upon installation.
- **Exclusions**: Requires NO support for Mobile, Experience Cloud, Screen Flows, or Multi-Currency translations.

## User Stories

### Story 1: Inline Data Editing (P1)
**As a** Salesforce User,  
**I want to** view and inline-edit my records dynamically,  
**So that** I can rapidly update multiple records without navigating to detail pages.

- **Scenario: Toggle to Edit Mode and Make Changes**
  - **Given** I am on a page containing the `smartDataGrid` displaying records
  - **When** the grid defaults to `EDIT` mode or I toggle to `EDIT` mode
  - **Then** the configured columns become editable, allowing me to modify cell values inline.

### Story 2: Bulk Save & Error Handling (P1)
**As a** Salesforce User,  
**I want to** save all my inline changes with a single click,  
**So that** my data is updated efficiently.

- **Scenario: Partial Save Success**
  - **Given** I have edited multiple rows, one of which violates a validation rule
  - **When** I click "Save"
  - **Then** the valid rows are committed to the database, and the single row with a validation rule failure highlights an error without failing the entire transaction.

### Story 3: Column Personalization via Picker (P1)
**As an** End User or Admin,  
**I want to** select my preferred grid columns if no default configuration has been provided,  
**So that** I see exactly the fields that are relevant to me.

- **Scenario: Auto-Discovery Fallback**
  - **Given** the component is loaded for an object that has no associated `Smart_Grid_Config__mdt`
  - **When** the component initializes
  - **Then** the `smartGridFieldPicker` modal automatically opens, allowing me to select up to 15 accessible fields via a dual-list box.

### Story 4: Dynamic Single Filtering (P2)
**As a** Salesforce User,  
**I want to** filter the currently displayed grid records by a single predefined field,  
**So that** I can isolate the records I care about.

- **Scenario: Picklist Filtering**
  - **Given** the grid is displaying a list of records
  - **When** I select a value from the dynamic filter picklist
  - **Then** the records automatically re-filter on the client-side/server-side to match my selection.

## Automation Approach Decision

| Use Case | Approach | Rationale |
|----------|----------|-----------|
| Dynamic Grid UI | **LWC** | No declarative option exists in Salesforce for fully dynamic custom multi-object inline editable grids. Targeted strictly to `lightning__AppPage`, `lightning__RecordPage`, and `lightning__HomePage`. |
| Grid Data fetching | **Apex Query Builder** | Requires dynamic SOQL generation. Must elegantly handle namespace-prefixed fields (e.g., Conga CLM). Annotated with `@InvocableMethod` to support future **Agentforce AI Integration**. |
| Data DML | **Apex Controller** | Requires handling `Database.update(records, false)` for partial saves and explicit CRUD/FLS validation checks via code. |

## Object & Data Model

We introduce one primary Custom Metadata Type:

- **Object:** `Smart_Grid_Config__mdt`
- **Fields:**
  - `Object_API_Name__c` (Text 80)
  - `Columns_JSON__c` (LongTextArea 10000)
  - `Default_Filter_Field__c` (Text 80)
  - `Record_Limit__c` (Number 4,0 — defaults to 200)
  - `Default_Sort_Field__c` (Text 80)
  - `Is_Active__c` (Checkbox)
  - `Allow_Personalization__c` (Checkbox)
  - `Use_Advanced_Config__c` (Checkbox — migration flag)

## Security Model
As per our constitution and AppExchange ISV standards, this feature enforces strict boundaries:
- **Apex Sharing**: All controllers utilize strictly `with sharing`. Under no circumstances will this component bypass OWD.
- **Query Mode**: All dynamic queries execute `WITH USER_MODE`.
- **Field Level Security (FLS)**: Extracted fields are rigorously checked via `isAccessible()` schema methods in the `GridQueryBuilder` layer before queries or saves (`stripInaccessible()`). Non-accessible fields are aggressively isolated.
- **Permission Sets**: Requires `SmartGrid_User` permission set granting Apex class access to `SmartGridController` and `GridQueryBuilder`.
