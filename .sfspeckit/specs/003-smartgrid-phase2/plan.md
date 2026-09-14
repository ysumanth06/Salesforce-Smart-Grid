# Technical Implementation Plan: Phase 2 — Smart Grid Pro

**Feature Number**: 003
**Feature Slug**: 003-smartgrid-phase2
**Spec Status**: Clarified
**Plan Status**: Approved
**API Version**: 65.0
**Source API Version** (sfdx-project.json): 65.0
**Package Directory**: `force-app`
**Date**: 2026-04-21

---

## Constitution Compliance Check

| Article                           | Check                                                                                                                                                                                 | Status        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **I: Metadata-First**             | All new objects/fields (Format Rule CMDT, View object, Config fields, LMS channel) defined before code                                                                                | ✅ Pass       |
| **II: Governor-Limit Awareness**  | Data volume target 50K records; pagination in place; aggregate queries use server-side SOQL; format rules cached client-side                                                          | ✅ Pass       |
| **III: Declarative-First**        | Automation Approach Decision table reviewed — all features require code (UI components, dynamic SOQL, client-state). No Flow candidates.                                              | ✅ Pass       |
| **IV: Security-by-Default**       | `with sharing`, `USER_MODE`, `stripInaccessible`, Record ID regex validation, FLS on format rules, LMS message sanitization                                                           | ✅ Pass       |
| **V: PNB Test-First**             | PNB pattern planned for all new Apex classes; 251-record bulk tests for aggregates                                                                                                    | ✅ Pass       |
| **VI: Separation of Concerns**    | Controller (AuraEnabled) → Service (SmartGridFormatEngine, SmartGridViewService) → Query Builder (GridQueryBuilder). No domain/trigger layer needed (no record-triggered automation). | ✅ Pass       |
| **VII: Deployment Safety**        | 7-phase deployment order defined; Permission Set updates; dry-run validation required                                                                                                 | ✅ Pass       |
| **VIII: Agent Architecture**      | No Agentforce in Phase 2; DTO-based method signatures prep for Phase 3                                                                                                                | ✅ Pass (N/A) |
| **IX: Cross-Skill Orchestration** | Scoring gates defined per layer                                                                                                                                                       | ✅ Pass       |

---

## Technical Context (from sfdx-project.json)

```json
{
  "packageDirectories": [{ "path": "force-app", "default": true }],
  "name": "smart-grid",
  "namespace": "",
  "sourceApiVersion": "65.0"
}
```

---

## Existing Codebase Inventory

### Apex Classes (6 files — 3 classes + 3 tests)

| Class                      | Role                                                                               | Lines |
| -------------------------- | ---------------------------------------------------------------------------------- | ----- |
| `SmartGridController`      | AuraEnabled controller — grid config, paged records, save, delete, picklist values | ~524  |
| `GridQueryBuilder`         | Dynamic SOQL construction with FLS validation, `@InvocableMethod`                  | ~302  |
| `SmartGridUserPrefService` | User preference CRUD                                                               | ~80   |

### LWC Components (7)

| Component                  | Role                                                |
| -------------------------- | --------------------------------------------------- |
| `smartDataGrid`            | Main grid — datatable, filters, pagination, toolbar |
| `smartGridFieldPicker`     | Field selection modal                               |
| `smartGridResolutionModal` | Failure queue resolution UI                         |
| `smartGridDatatable`       | Extended datatable (reverted to native wrapper)     |
| `smartGridPicklist`        | Custom picklist renderer (deprecated)               |
| `csvHelper`                | CSV export utility module                           |
| `errorUtils`               | Error formatting utilities                          |

### Custom Objects & CMDT (3)

| Object                    | Type                                  |
| ------------------------- | ------------------------------------- |
| `Smart_Grid_Config__mdt`  | CMDT — 8 fields                       |
| `Smart_Grid_Column__mdt`  | CMDT — child columns                  |
| `Smart_Grid_User_Pref__c` | Custom Object — user prefs (3 fields) |

### Permission Sets (1)

| Name             | Scope                                          |
| ---------------- | ---------------------------------------------- |
| `SmartGrid_User` | CMDT access, User Pref CRUD, Apex class access |

---

## Deployment Order (7 Phases)

### Phase 1: Metadata Foundation (Objects, Fields, CMDT)

**No code dependencies — deploy first.**

| #   | Artifact                          | Type                 | File Path                                                                         |
| --- | --------------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| 1.1 | `Smart_Grid_Format_Rule__mdt`     | Custom Metadata Type | `force-app/main/default/objects/Smart_Grid_Format_Rule__mdt/`                     |
| 1.2 | Format Rule fields (10)           | CMDT Fields          | `force-app/main/default/objects/Smart_Grid_Format_Rule__mdt/fields/`              |
| 1.3 | `Smart_Grid_View__c`              | Custom Object        | `force-app/main/default/objects/Smart_Grid_View__c/`                              |
| 1.4 | View fields (6)                   | Custom Fields        | `force-app/main/default/objects/Smart_Grid_View__c/fields/`                       |
| 1.5 | Config toggle fields (7)          | CMDT Fields          | `force-app/main/default/objects/Smart_Grid_Config__mdt/fields/`                   |
| 1.6 | `SmartGridChannel.messageChannel` | LMS Channel          | `force-app/main/default/messageChannels/SmartGridChannel.messageChannel-meta.xml` |

### Phase 2: Seed Data (CMDT Records)

**Depends on Phase 1 metadata.**

| #   | Artifact                                 | File Path                                                                                  |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| 2.1 | `Smart_Grid_Format_Rule.Opp_Closed_Won`  | `force-app/main/default/customMetadata/Smart_Grid_Format_Rule.Opp_Closed_Won.md-meta.xml`  |
| 2.2 | `Smart_Grid_Format_Rule.Opp_Closed_Lost` | `force-app/main/default/customMetadata/Smart_Grid_Format_Rule.Opp_Closed_Lost.md-meta.xml` |
| 2.3 | `Smart_Grid_Format_Rule.Opp_Low_Amount`  | `force-app/main/default/customMetadata/Smart_Grid_Format_Rule.Opp_Low_Amount.md-meta.xml`  |
| 2.4 | `Smart_Grid_Format_Rule.Case_Escalated`  | `force-app/main/default/customMetadata/Smart_Grid_Format_Rule.Case_Escalated.md-meta.xml`  |
| 2.5 | `Smart_Grid_Format_Rule.Lead_Hot`        | `force-app/main/default/customMetadata/Smart_Grid_Format_Rule.Lead_Hot.md-meta.xml`        |

### Phase 3: Apex Classes (New + Modified)

**Depends on Phase 1 (objects referenced in queries).**

| #   | Artifact                    | Type                                                                         | File Path                                                  |
| --- | --------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 3.1 | `SmartGridFormatEngine.cls` | New — Format rule evaluation service                                         | `force-app/main/default/classes/SmartGridFormatEngine.cls` |
| 3.2 | `SmartGridViewService.cls`  | New — Saved View CRUD service                                                | `force-app/main/default/classes/SmartGridViewService.cls`  |
| 3.3 | `SmartGridIdValidator.cls`  | New — Record ID regex validation utility                                     | `force-app/main/default/classes/SmartGridIdValidator.cls`  |
| 3.4 | `SmartGridController.cls`   | Modified — add `getAggregates()`, `getFormatRules()`, integrate ID validator | `force-app/main/default/classes/SmartGridController.cls`   |
| 3.5 | `GridQueryBuilder.cls`      | Modified — add `buildAggregateQuery()`, `buildWhereClause(FilterExpression)` | `force-app/main/default/classes/GridQueryBuilder.cls`      |

### Phase 4: Apex Test Classes

**Depends on Phase 3.**

| #   | Artifact                        | File Path                                                      |
| --- | ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| 4.1 | `SmartGridFormatEngineTest.cls` | `force-app/main/default/classes/SmartGridFormatEngineTest.cls` |
| 4.2 | `SmartGridViewServiceTest.cls`  | `force-app/main/default/classes/SmartGridViewServiceTest.cls`  |
| 4.3 | `SmartGridIdValidatorTest.cls`  | `force-app/main/default/classes/SmartGridIdValidatorTest.cls`  |
| 4.4 | `SmartGridControllerTest.cls`   | Modified — cover aggregates, format rules, ID validation       | `force-app/main/default/classes/SmartGridControllerTest.cls` |
| 4.5 | `GridQueryBuilderTest.cls`      | Modified — cover aggregate queries, filter expressions         | `force-app/main/default/classes/GridQueryBuilderTest.cls`    |

### Phase 5: LWC Components (New + Modified)

**Depends on Phase 3 (Apex) + Phase 1 (LMS channel).**

| #   | Artifact                 | Type                                                                                       | File Path                                            |
| --- | ------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 5.1 | `dirtyStateManager`      | New — Undo/Redo JS module                                                                  | `force-app/main/default/lwc/dirtyStateManager/`      |
| 5.2 | `smartGridReadingPane`   | New — Record detail sidebar                                                                | `force-app/main/default/lwc/smartGridReadingPane/`   |
| 5.3 | `smartGridFilterBuilder` | New — Advanced AND/OR filter UI                                                            | `force-app/main/default/lwc/smartGridFilterBuilder/` |
| 5.4 | `smartGridRelatedGrid`   | New — Related object sub-grid wrapper                                                      | `force-app/main/default/lwc/smartGridRelatedGrid/`   |
| 5.5 | `smartGridViewSelector`  | New — Saved views dropdown                                                                 | `force-app/main/default/lwc/smartGridViewSelector/`  |
| 5.6 | `formatRuleEngine`       | New — Client-side rule evaluation JS module                                                | `force-app/main/default/lwc/formatRuleEngine/`       |
| 5.7 | `smartDataGrid`          | Modified — integrate all new child components, LMS pub/sub, totals footer, feature toggles | `force-app/main/default/lwc/smartDataGrid/`          |

### Phase 6: Permission Set Updates

**Depends on Phases 1–5.**

| #   | Artifact                   | File Path                                                                     |
| --- | -------------------------- | ----------------------------------------------------------------------------- |
| 6.1 | `SmartGrid_User` (updated) | `force-app/main/default/permissionsets/SmartGrid_User.permissionset-meta.xml` |

**Additions to permission set:**

- CMDT access: `Smart_Grid_Format_Rule__mdt`
- Object CRUD: `Smart_Grid_View__c` (Create, Read, Edit, Delete)
- Field permissions: All `Smart_Grid_View__c` fields
- Field permissions: New `Smart_Grid_Config__mdt` toggle fields
- Apex class access: `SmartGridFormatEngine`, `SmartGridViewService`, `SmartGridIdValidator`

### Phase 7: Validation & Deployment

**Depends on Phases 1–6.**

| Step | Action                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------ |
| 7.1  | `sf project deploy start --dry-run` — validate all metadata                                            |
| 7.2  | Run all Apex tests: `sf apex run test --code-coverage --result-format human`                           |
| 7.3  | Verify 85%+ code coverage on all new classes                                                           |
| 7.4  | Deploy to sandbox: `sf project deploy start`                                                           |
| 7.5  | Smoke test: conditional formatting, totals, undo/redo, reading pane, filters, LMS, related grid, views |
| 7.6  | Per-org deployment to production orgs (repeat 7.1–7.5 per org)                                         |

---

## Apex Architecture

### New Classes

#### `SmartGridFormatEngine` (Service Layer)

- **Pattern**: Stateless service class
- **Sharing**: `with sharing`
- **Methods**:
  - `getFormatRules(String configDevName)` → `List<FormatRuleDTO>` — Fetches active rules from `Smart_Grid_Format_Rule__mdt` with FLS validation
  - Inner DTOs: `FormatRuleDTO`, `CellFormat` — serializable for `@InvocableMethod` future use

#### `SmartGridViewService` (Service Layer)

- **Pattern**: Stateless service class
- **Sharing**: `with sharing`
- **Methods**:
  - `getViews(String objectApiName)` → `List<ViewDTO>` — User's views for an object, ordered by `Last_Used__c` DESC
  - `saveView(ViewDTO view)` → `Id` — Upsert a named view
  - `deleteView(Id viewId)` → `void`
  - `recordHistory(String objectApiName, String configJson)` → `void` — Auto-save last 10 unnamed history entries
  - Inner DTOs: `ViewDTO` — serializable

#### `SmartGridIdValidator` (Utility)

- **Pattern**: Static utility class
- **Sharing**: `with sharing`
- **Methods**:
  - `validateIds(List<SObject> records)` → `void` — Throws `AuraHandledException` if any record has invalid ID
  - `isValidSalesforceId(String idValue)` → `Boolean` — Regex `^[a-zA-Z0-9]{15,18}$`

### Modified Classes

#### `SmartGridController` (Controller Layer)

- **New methods**:
  - `getAggregates(String objectApiName, List<String> fields, Map<String,Object> filters, ...)` → `AggregateResultDTO` — Delegates to `GridQueryBuilder.buildAggregateQuery()`
  - `getFormatRules(String configDevName)` → `List<FormatRuleDTO>` — Delegates to `SmartGridFormatEngine`
  - `getViews(String objectApiName)` → `List<ViewDTO>` — Delegates to `SmartGridViewService`
  - `saveView(String viewJson)` → `Id` — Delegates to `SmartGridViewService`
  - `deleteView(String viewId)` → `void`
- **Modified methods**:
  - `saveRecords()` — Add `SmartGridIdValidator.validateIds()` before DML
  - `deleteRecords()` — Add `SmartGridIdValidator.validateIds()` before DML
- **New DTOs**: `AggregateResultDTO`, `AggregateFieldResult`

#### `GridQueryBuilder` (Query Layer)

- **New methods**:
  - `buildAggregateQuery(AggregateRequest req)` → `String` — Generates `SELECT SUM(x), AVG(x), MIN(x), MAX(x), COUNT(Id) FROM Object WHERE ...`
  - `buildWhereClause(FilterExpression expr)` → `String` — Recursive AND/OR group evaluation with bind-variable-safe output
- **New inner classes**: `AggregateRequest`, `FilterExpression`, `FilterGroup`, `FilterCondition`

---

## LWC Architecture

### New Components

| Component                | Target                     | Pattern                      | Key Dependencies                                             |
| ------------------------ | -------------------------- | ---------------------------- | ------------------------------------------------------------ |
| `dirtyStateManager`      | Shared JS module (no HTML) | ES module export             | None — pure JS                                               |
| `smartGridReadingPane`   | Embedded child             | `lightning-record-view-form` | Parent passes `recordId`, `objectApiName`                    |
| `smartGridFilterBuilder` | Embedded child             | Custom UI with nested groups | Publishes filter expression JSON to parent                   |
| `smartGridRelatedGrid`   | Embedded child             | Recursive `smartDataGrid`    | `depth` prop (max 2), `parentRecordId`, `childObjectApiName` |
| `smartGridViewSelector`  | Embedded child             | `lightning-combobox` + menu  | Imperative Apex (`getViews`, `saveView`, `deleteView`)       |
| `formatRuleEngine`       | Shared JS module (no HTML) | ES module export             | Receives rules array + data rows, returns style map          |

### Modified Components

#### `smartDataGrid` (Main Grid)

- **New child components**: Reading pane, filter builder, related grid, view selector
- **New imports**: `@salesforce/messageChannel/SmartGridChannel__c`, `lightning/messageService`
- **New keyboard handlers**: `Ctrl+Z` (undo), `Ctrl+Y` (redo)
- **New toolbar elements**: Undo/Redo buttons, View selector dropdown, totals toggle
- **New sections**: Aggregate footer row, reading pane sidebar (70/30 split), related grid tabs
- **Feature toggle integration**: Read `Enable_Export__c`, `Enable_Delete__c`, etc. from config and conditionally render toolbar buttons

### Component Communication

```
smartDataGrid (parent)
├── smartGridFilterBuilder → dispatches 'filterchange' CustomEvent (filter expression JSON)
├── smartGridReadingPane → receives recordId + objectApiName via @api
├── smartGridRelatedGrid → receives parentRecordId + childObject via @api; depth counter
├── smartGridViewSelector → dispatches 'viewselect' CustomEvent; calls Apex for CRUD
├── dirtyStateManager (JS import) → tracks undo/redo stack
├── formatRuleEngine (JS import) → evaluates rules against data rows
└── LMS (SmartGridChannel) → publish on select/save/delete/filter; subscribe for external events
```

---

## Scoring Gates

| Skill           | Gate Score | Applies To                                         |
| --------------- | ---------- | -------------------------------------------------- |
| **sf-metadata** | ≥ 84/120   | All new objects, fields, CMDT records, LMS channel |
| **sf-apex**     | ≥ 90/150   | All new/modified Apex classes                      |
| **sf-lwc**      | ≥ 125/165  | All new/modified LWC components                    |
| **sf-testing**  | ≥ 108/120  | All test classes; 85%+ code coverage               |

---

## Estimation Summary

| Story Group                                   | Effort       | Complexity |
| --------------------------------------------- | ------------ | ---------- |
| Foundation (metadata, seed data, permissions) | 1 day        | Low        |
| Conditional Formatting (CMDT + Engine + LWC)  | 2 days       | Medium     |
| Column Totals (Aggregate query + footer)      | 1 day        | Medium     |
| Undo/Redo (Dirty State Manager)               | 1 day        | Medium     |
| Record ID Validation                          | 0.5 days     | Low        |
| Reading Pane                                  | 1 day        | Low-Medium |
| Advanced Filter Builder                       | 2 days       | High       |
| Related Object Navigation                     | 2 days       | High       |
| LMS Integration                               | 1 day        | Medium     |
| Saved Views                                   | 1.5 days     | Medium     |
| Fill-Down & Copy/Paste                        | 1 day        | Medium     |
| Formula/Computed Columns                      | 1.5 days     | High       |
| Feature Security Toggles                      | 0.5 days     | Low        |
| **Total**                                     | **~16 days** | —          |

---

## Environment Strategy

| Environment          | Purpose                         | When                              |
| -------------------- | ------------------------------- | --------------------------------- |
| **Personal Sandbox** | Development + unit testing      | All development                   |
| **QA Sandbox**       | Integration testing, regression | After each story group            |
| **Prod Org 1**       | First production deployment     | After full QA pass                |
| **Prod Orgs 2–N**    | Rolling deployment              | Sequential after Org 1 validation |

**Multi-org deployment notes:**

- Each prod org may have different managed packages — validate per org
- Seed CMDT rules deploy identically to all orgs
- `Smart_Grid_View__c` data is org-specific (user-created, not migrated)
- Run `sf project deploy start --dry-run` per org before live deployment

---

## 🏛️ Architect Sign-Off

> **⚠️ This section MUST be completed before `/sfspeckit-tasks` can generate story files.**

| Item                                    | Architect Decision      |
| --------------------------------------- | ----------------------- |
| Data model approved?                    | ✅ Approved             |
| Apex architecture approved?             | ✅ Approved             |
| LWC component hierarchy approved?       | ✅ Approved             |
| Deployment order approved?              | ✅ Approved             |
| Security model approved?                | ✅ Approved             |
| Multi-org deployment strategy approved? | ✅ Approved             |
| Scoring gates appropriate?              | ✅ Approved             |
| Estimation reasonable?                  | ✅ Approved             |
| **Architect Name**                      | Sumanth Yanamala (User) |
| **Date**                                | 2026-04-21              |
| **Status**                              | ✅ Approved             |
