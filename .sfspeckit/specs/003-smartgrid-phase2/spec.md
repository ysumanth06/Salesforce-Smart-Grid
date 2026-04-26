# Functional Specification: Phase 2 — Smart Grid Pro

**Feature Number**: 003
**Feature Slug**: 003-smartgrid-phase2
**API Version**: 65.0
**Date**: 2026-04-20
**Status**: Clarified

---

## Overview

Phase 2 transforms the Smart Grid from a functional inline-editing data grid into a **professional-grade data management platform**. Building on the foundation of Phase 0 (MVP) and Phase 1 (Grid Lite), this phase adds conditional formatting, related-object navigation, undo/redo state management, a reading pane for record detail, an advanced filter builder with AND/OR logic, Lightning Message Service (LMS) integration for cross-component communication, query history with saved views, and security hardening with explicit Record ID validation.

### What's Already Done (Phase 0 + Phase 1 + Hotfixes)

The following capabilities are **already implemented** and form the baseline for Phase 2:

| Capability                                                         | Source                         |
| ------------------------------------------------------------------ | ------------------------------ |
| Dynamic grid with inline editing                                   | Phase 0                        |
| Bulk save with partial-save handling                               | Phase 0                        |
| Field picker modal                                                 | Phase 0                        |
| CMDT-based configuration (JSON + Relational)                       | Phase 0 + Phase 1 TS-00/TS-01  |
| Multi-field filtering (all field types)                            | Phase 1 TS-02 + HOTFIX-005     |
| Server-side sorting                                                | Phase 1 TS-02                  |
| Add Row + Delete Selected + Failure Queue Modal                    | Phase 1 TS-03                  |
| CSV Export (Data URI, LWS-safe)                                    | Phase 1 TS-04 + HOTFIX-002/003 |
| User Preferences persistence                                       | Phase 1 TS-04                  |
| Keyboard shortcuts (Ctrl+S)                                        | Phase 1 TS-04                  |
| Server-side pagination with page size selector                     | HOTFIX-004 + HOTFIX-007        |
| Smart column type mapping (Currency, Date, Boolean, etc.)          | HOTFIX-004 + HOTFIX-006        |
| Dynamic filter panel with pills                                    | HOTFIX-003 + HOTFIX-005        |
| Extended datatable → reverted to native (platform limitation)      | HOTFIX-006 + HOTFIX-007        |
| CRUD enforcement, SOQL injection hardening, error utilities        | HOTFIX-007                     |
| Dark mode (SLDS tokens), accessibility (ARIA), directive migration | HOTFIX-007                     |

---

## Platform Context

- **Target Org Type**: Sandbox (ISV / AppExchange-ready architecture)
- **Deployment Model**: Multi-org (unmanaged). Developed in personal sandbox, deployed to **multiple production orgs** serving different businesses. Each org may have different installed packages and configurations.
- **API Version**: 65.0
- **Source Path**: `force-app`
- **Installed Packages**: Varies by org. Grid must be **resilient to unknown managed package interactions** — namespaced fields, external triggers, and validation rules may differ per org. Architecture is namespace-safe (e.g., Conga CLM / `Apttus__`).
- **Data Volume**: Pagination already supports 2000+ record datasets; Phase 2 targets up to **50,000 records** with cursor-based optimization
- **Data Seeding**: Phase 2 ships **seed CMDT format rules** (Opportunity stage colors, Case escalation, Lead/Account rating) providing out-of-the-box conditional formatting on deploy.
- **Agentforce Readiness**: No Agentforce in Phase 2, but all new Apex methods use **DTO-based inputs/outputs** to enable future `@InvocableMethod` annotation in Phase 3 without refactoring.
- **Exclusions**: No Mobile, Experience Cloud, Screen Flow, Multi-Currency, or Multi-Language support

---

## 🚀 User Stories

### P1 — Critical

| ID           | Title                               | Description                                                                                                                                                                                                        |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **US-P2-01** | **Conditional Formatting Rules**    | As an Admin, I want to define color-coded formatting rules via CMDT so that cells/rows automatically highlight based on field values (e.g., red for Closed Lost, green for Closed Won, yellow for revenue < $10K). |
| **US-P2-02** | **Column Totals Footer**            | As a User, I want to see aggregate summaries (Sum, Avg, Min, Max, Count) at the bottom of numeric columns so that I can quickly assess data without exporting to Excel.                                            |
| **US-P2-03** | **Undo/Redo (Dirty State Manager)** | As a Power User, I want to undo (Ctrl+Z) and redo (Ctrl+Y) my inline edits before saving so that I can safely experiment with changes without fear of accidental data corruption.                                  |
| **US-P2-04** | **Record ID Validation Hardening**  | As a Security Architect, I want explicit regex validation (`^[a-zA-Z0-9]{15,18}$`) on all Record IDs before any DML operation to provide defense-in-depth against ID injection attacks.                            |

### P2 — High

| ID           | Title                                    | Description                                                                                                                                                                                                        |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **US-P2-05** | **Reading Pane (Record Detail Sidebar)** | As a User, I want to click a row and see a detail sidebar (like Outlook's reading pane) showing all fields of the selected record without navigating away from the grid.                                           |
| **US-P2-06** | **Advanced Filter Builder (AND/OR)**     | As a Power User, I want to build complex filter expressions with AND/OR logic groups so that I can create sophisticated queries like "Industry = Tech AND (Revenue > 1M OR Employees > 500)".                      |
| **US-P2-07** | **Related Object Navigation**            | As a User, I want to view parent→child related records in a tabbed sub-grid when I select a record, so that I can drill into related Contacts, Opportunities, or Cases without leaving the Smart Grid.             |
| **US-P2-08** | **LMS Cross-Component Communication**    | As a Developer, I want the Smart Grid to publish and subscribe to Lightning Message Service channels so that other LWC components on the same page can react to grid events (row selection, save, delete, filter). |

### P3 — Nice-to-Have

| ID           | Title                           | Description                                                                                                                                                                                    |
| ------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US-P2-09** | **Query History & Saved Views** | As a Power User, I want the grid to remember my last 10 filter/sort combinations and let me save named "views" so that I can quickly switch between frequently used data perspectives.         |
| **US-P2-10** | **Fill-Down & Copy/Paste**      | As a Data Entry User, I want to select a cell value and fill it down to multiple rows, or paste values from a clipboard, so that I can rapidly populate repetitive data.                       |
| **US-P2-11** | **Formula/Computed Columns**    | As an Admin, I want to define computed columns in CMDT (e.g., `Amount * Probability / 100`) that calculate values on-the-fly in the grid without creating actual formula fields on the object. |
| **US-P2-12** | **Feature Security Toggles**    | As an Admin, I want to enable or disable individual grid features (export, delete, add row, filter) per grid configuration so that I can control what users can do on specific object grids.   |

---

## 🛠️ Data Model Enhancements

### New: Smart_Grid_Format_Rule\_\_mdt (Conditional Formatting)

| Field Name             | Type                  | Description                                                                                |
| ---------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `Smart_Grid_Config__c` | Metadata Relationship | Links to parent `Smart_Grid_Config__mdt`                                                   |
| `Field_API_Name__c`    | Text (80)             | The field to evaluate                                                                      |
| `Operator__c`          | Text (20)             | Comparison operator: `EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `LESS_THAN`, `CONTAINS`, `IN` |
| `Value__c`             | Text (255)            | The comparison value (comma-separated for `IN`)                                            |
| `Cell_Color__c`        | Text (7)              | Hex color for cell background (e.g., `#FF0000`)                                            |
| `Text_Color__c`        | Text (7)              | Hex color for cell text (e.g., `#FFFFFF`)                                                  |
| `Row_Highlight__c`     | Checkbox              | If true, highlights the entire row instead of just the cell                                |
| `Icon_Name__c`         | Text (80)             | Optional SLDS icon name (e.g., `utility:warning`)                                          |
| `Priority__c`          | Number (4, 0)         | Rule evaluation order (lower = higher priority)                                            |
| `Is_Active__c`         | Checkbox              | Enable/disable individual rules                                                            |

### New: Smart_Grid_View\_\_c (Saved Views — Custom Object)

| Field Name            | Type                 | Description                             |
| --------------------- | -------------------- | --------------------------------------- |
| `User__c`             | Lookup (User)        | View owner                              |
| `Object_API_Name__c`  | Text (80)            | Grid object context                     |
| `View_Name__c`        | Text (80)            | User-defined view name                  |
| `View_Config_JSON__c` | Long Text Area (32k) | Serialized filter + sort + column state |
| `Is_Default__c`       | Checkbox             | Auto-load this view on grid init        |
| `Last_Used__c`        | DateTime             | Timestamp for LRU sorting               |

### New: SmartGridChannel\_\_c (Lightning Message Channel)

| Field Name      | Type | Description                                            |
| --------------- | ---- | ------------------------------------------------------ |
| `recordIds`     | Text | Comma-separated selected record IDs                    |
| `objectApiName` | Text | Object context                                         |
| `action`        | Text | Event type: `selected`, `saved`, `deleted`, `filtered` |
| `payload`       | Text | Optional JSON payload for additional context           |

### Modify: Smart_Grid_Config\_\_mdt

| New Field                | Type                      | Description                                  |
| ------------------------ | ------------------------- | -------------------------------------------- |
| `Enable_Export__c`       | Checkbox (default: true)  | Toggle CSV export visibility                 |
| `Enable_Delete__c`       | Checkbox (default: true)  | Toggle delete button visibility              |
| `Enable_Add_Row__c`      | Checkbox (default: true)  | Toggle add row button visibility             |
| `Enable_Filters__c`      | Checkbox (default: true)  | Toggle filter panel visibility               |
| `Enable_Reading_Pane__c` | Checkbox (default: false) | Toggle reading pane sidebar                  |
| `Related_Object__c`      | Text (80)                 | Child relationship name for related sub-grid |
| `Totals_Fields_JSON__c`  | Long Text Area (5000)     | JSON array of `{field, aggregate}` pairs     |

---

## 🏗️ Technical Architecture Changes

### 1. Conditional Formatting Engine (New Apex Class)

- **`SmartGridFormatEngine.cls`**: Evaluates `Smart_Grid_Format_Rule__mdt` records against data rows and returns a `Map<Id, List<CellFormat>>` with styling directives for the LWC.
- **LWC Integration**: `smartDataGrid` injects `cellAttributes` and `class` properties into column definitions based on the format engine output.
- **Performance**: Rules are evaluated client-side after data fetch to avoid additional server roundtrips. Rule definitions are cached on first load.

### 2. Aggregate Footer (Apex + LWC)

- **`SmartGridController.getAggregates()`**: Executes a `SELECT SUM(Amount), AVG(Amount), COUNT(Id) FROM Object WHERE <filters>` aggregate query.
- **LWC**: Renders a sticky footer row below the datatable using SLDS data table footer pattern.

### 3. Dirty State Manager (LWC Module)

- **`dirtyStateManager.js`**: Client-side undo/redo stack using a circular buffer (max 50 operations).
- **API**: `pushState(cellId, oldValue, newValue)`, `undo()`, `redo()`, `canUndo`, `canRedo`, `clearStack()`.
- **Integration**: Intercepts `Ctrl+Z` / `Ctrl+Y` keyboard events alongside existing `Ctrl+S`.

### 4. Reading Pane (LWC Child Component)

- **`smartGridReadingPane`**: Child LWC using `lightning-record-view-form` to render all accessible fields of the selected record in a collapsible sidebar.
- **Layout**: 70/30 split when enabled — datatable takes 70%, reading pane takes 30%.
- **Trigger**: Click a row → publish row data to reading pane. Close button collapses to full-width grid.

### 5. Advanced Filter Builder (LWC Child Component)

- **`smartGridFilterBuilder`**: Replaces the basic filter panel with a visual query builder supporting nested AND/OR groups.
- **Data Model**: Filter expressions stored as nested JSON in `Smart_Grid_User_Pref__c`.
- **Apex**: `GridQueryBuilder` enhanced with `buildWhereClause(FilterExpression)` supporting recursive group evaluation.

### 6. LMS Integration

- **Message Channel**: `SmartGridChannel__c` deployed under `force-app/main/default/messageChannels/`.
- **Publish**: On row selection, save, delete, and filter apply events.
- **Subscribe**: Accept external filter events to re-query the grid from sibling components.

### 7. Related Object Sub-Grid (LWC Recursive)

- **Pattern**: When a record is selected and `Related_Object__c` is configured, render a child `smartDataGrid` instance with `objectApiName` = child object, pre-filtered by the parent record ID.
- **UI**: Tabbed interface below the main grid or within the reading pane.

### 8. Record ID Validation Utility

- **`SmartGridController.isValidSalesforceId()`**: Private utility method with regex `^[a-zA-Z0-9]{15,18}$`.
- **Enforcement**: Called in `saveRecords()`, `deleteRecords()`, and any new DML method before processing.

---

## ✅ Acceptance Criteria

### Conditional Formatting

- [ ] Admin creates a format rule CMDT record; grid cell/row highlights according to the rule.
- [ ] Multiple rules on the same field respect Priority order.
- [ ] Rules with `Row_Highlight` = true color the entire row.
- [ ] Invalid/inactive rules are silently skipped.

### Column Totals

- [ ] Numeric columns display Sum/Avg/Min/Max in a pinned footer row.
- [ ] Totals recalculate on filter change or pagination (based on full dataset, not just visible page).
- [ ] Non-numeric columns display "—" in the totals footer.

### Undo/Redo

- [ ] `Ctrl+Z` reverts the last inline edit. `Ctrl+Y` re-applies it.
- [ ] Undo/Redo stack is cleared on Save.
- [ ] Visual indicators (undo/redo buttons) show disabled state when stack is empty.

### Record ID Validation

- [ ] Attempting to save a record with a tampered/invalid ID throws `AuraHandledException` with a clear message.
- [ ] Valid 15-char and 18-char IDs pass validation.
- [ ] Null, empty, and injection-attempt IDs are rejected.

### Reading Pane

- [ ] Clicking a row opens a detail sidebar with all accessible fields.
- [ ] Closing the pane restores the grid to full width.
- [ ] The pane updates when a different row is clicked.

### Advanced Filter Builder

- [ ] Users can create nested AND/OR filter groups via the UI.
- [ ] Filter expressions are persisted and restored from user preferences.
- [ ] The generated SOQL WHERE clause is parameterized (no injection).

### LMS Integration

- [ ] Placing a second LWC on the same page that subscribes to `SmartGridChannel__c` receives selection events.
- [ ] External components can publish filter events that the grid consumes.

### Related Objects

- [ ] Selecting an Account row and having `Related_Object__c = 'Contacts'` renders a child grid showing related Contacts.
- [ ] Child grid inherits security model (USER_MODE, FLS checks).

### Saved Views

- [ ] Users can name and save the current filter + sort + column configuration.
- [ ] A dropdown in the toolbar lists saved views and allows switching between them.
- [ ] "Last 10" auto-history is maintained without explicit save.

### Feature Security Toggles

- [ ] Setting `Enable_Export__c = false` hides the Export CSV button.
- [ ] Setting `Enable_Delete__c = false` hides the Delete button.
- [ ] All toggles default to `true` for backward compatibility.

---

## 🔒 Security Gate Requirement

- All new Apex classes use `with sharing`.
- All dynamic SOQL uses `WITH USER_MODE` / `AccessLevel.USER_MODE`.
- Record ID validation regex enforced on all DML entry points.
- Format rule evaluation must not expose field values the user lacks FLS access to.
- LMS channel messages must not contain sensitive field data — only IDs and action types.
- Related object sub-grids enforce independent CRUD/FLS checks per child object.
- Saved views stored per-user; no cross-user access to view configurations.
- `Security.stripInaccessible()` applied on all DML operations.

---

## Automation Approach Decision

| Use Case                               | Approach              | Rationale                                                                                        |
| -------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| Conditional formatting rule evaluation | **LWC (Client-Side)** | Rules are simple comparisons; evaluated against already-fetched data. No additional Apex needed. |
| Column totals / aggregates             | **Apex**              | Requires aggregate SOQL queries; cannot be computed client-side for paginated datasets.          |
| Undo/Redo state management             | **LWC (Client-Side)** | Purely UI state; no server interaction until Save.                                               |
| Reading Pane                           | **LWC**               | Uses standard `lightning-record-view-form`; no custom Apex needed.                               |
| Filter builder WHERE clause            | **Apex**              | Complex SOQL construction must go through `GridQueryBuilder` for security validation.            |
| LMS messaging                          | **LWC**               | Standard `@salesforce/messageChannel` import; no Apex.                                           |
| Related object sub-grid                | **Apex + LWC**        | Requires parameterized child query via `GridQueryBuilder`; rendered as nested `smartDataGrid`.   |

---

## Assumptions

1. The existing `lightning-datatable` cell rendering will support `cellAttributes.class` for conditional formatting background colors. If not, CSS custom properties via `:host` will be used as a fallback.
2. Related object navigation uses the existing `smartDataGrid` component recursively — no new grid component is needed. **Max drill-down depth: 2 levels** (Parent → Children → Grandchildren).
3. LMS integration uses a single message channel for all event types, differentiated by the `action` field.
4. Aggregate totals are computed against the **full filtered dataset**, not just the current page. Totals reflect the **running user's visible records** per OWD/sharing model (`USER_MODE`).
5. Picklist and Boolean inline editing remain text/read-only due to documented platform limitations (HOTFIX-007).
6. Smart Grid is **package-agnostic** — DML errors from external managed package triggers or validation rules are surfaced via the existing failure queue modal.
7. All new Phase 2 Apex methods use **DTO-based inputs/outputs** (serializable inner classes) to enable future `@InvocableMethod` annotation in Phase 3.
8. The grid respects existing OWD settings via `USER_MODE` — no custom sharing logic is needed.
9. No external callouts required — Phase 2 is fully org-internal.
10. Conditional formatting uses **text + optional icon overlay** — no icon-only cell mode.
11. Reading Pane is **read-only** (`lightning-record-view-form`) — inline editing happens only in the main grid.
12. Saved views are **user-private** — no shared/team view functionality in Phase 2.
13. Fill-Down operates on **visible rows only** — does not cross pagination boundaries.
14. Seed CMDT format rules are deployed as part of the metadata package — each prod org receives identical starter rules.

---

## Clarification Status

### 10-Point Checklist (Completed 2026-04-21)

| #   | Question                        | Answer                                                                                                      |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Org Architecture                | **Multi-org (unmanaged)**. Dev in personal sandbox → deploy to multiple prod orgs for different businesses. |
| 2   | Data Migration                  | **No legacy migration.** Ship seed CMDT format rules for out-of-the-box conditional formatting.             |
| 3   | External Integrations           | **None.** Phase 2 is fully org-internal. No callouts.                                                       |
| 4   | Sharing Model                   | **Respects existing OWD** via `USER_MODE`. Aggregates reflect user's visible dataset.                       |
| 5   | Managed Packages                | **Varies by org.** Grid is package-agnostic; resilient to unknown triggers/validations.                     |
| 6   | Flow vs. Apex                   | **All code confirmed.** No Flow candidates. Article III compliant.                                          |
| 7   | Experience Cloud                | **No.** Internal Lightning only.                                                                            |
| 8   | Mobile Compatibility            | **No.** Desktop Lightning only.                                                                             |
| 9   | Agentforce Integration          | **Prep only.** No Agentforce in Phase 2; DTO-based method signatures for Phase 3 readiness.                 |
| 10  | Multi-Currency / Multi-Language | **Neither.** Confirmed exclusion.                                                                           |

### Spec-Specific Clarifications (Resolved)

| #   | Question                                                               | Resolution                                                   |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | Should conditional formatting support icon-only cells (no text)?       | **No.** Text + optional icon overlay.                        |
| 2   | Should the reading pane support inline editing or stay read-only?      | **Read-only.** Uses `lightning-record-view-form`.            |
| 3   | Maximum depth for related object drill-down (1 level or unlimited)?    | **2 levels.** Parent → Children → Grandchildren.             |
| 4   | Should saved views be shareable between users (Team Views)?            | **User-private.** No shared views in Phase 2.                |
| 5   | Fill-down: should it work across paginated pages or only visible rows? | **Visible rows only.** Does not cross pagination boundaries. |
