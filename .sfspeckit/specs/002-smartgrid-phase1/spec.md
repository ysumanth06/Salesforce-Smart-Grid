# Functional Specification: Phase 1 - Grid Lite

## Meta

- **Feature Identifier**: 002-smartgrid-phase1
- **Feature Name**: Phase 1 - Grid Lite
- **Status**: CLARIFIED
- **Priority**: High
- **Release Version**: v1.1.0

## 🎯 Objective

Deliver Phase 1 (Grid Lite) to expand the Phase 0 MVP into a comprehensive, user-friendly data grid. This phase introduces Advanced Configuration via child Custom Metadata, Multi-Field & Date Filters, robust UI actions (Export, Batch Delete, Add Row, Column Customizations), user personalization, and rendering optimizations.

---

## 🚀 User Stories

| ID           | Title                        | Description                                                                                                                                                                               |
| ------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US-P1-0**  | **Relational Columns**       | As an Admin, I want to define grid columns as child records in Custom Metadata (instead of JSON) so that configuration is easier to manage and less error-prone.                          |
| **US-P1-1**  | **Hybrid Metadata Resolver** | As a Developer, I want the `SmartGridController` to handle both legacy JSON and new relational metadata formats (using the `Use_Advanced_Config__c` flag) for backward compatibility.     |
| **US-P1-2**  | **Multi-Field Filters**      | As a User, I want to apply up to 3 field filters simultaneously so that I can narrow down my records more precisely.                                                                      |
| **US-P1-3**  | **Date Range Filter**        | As a User, I want to pick any available date field and a range so that I can filter records by specific temporal windows (e.g., CreatedDate, DeliveryDate).                               |
| **US-P1-4**  | **Server-Side Sorting**      | As a User, I want to click column headers to sort the grid server-side so that I can reliably organize thousands of records.                                                              |
| **US-P1-5**  | **Export to CSV**            | As a User, I want to export only the currently visible/filtered rows in the grid to a CSV file for quick local reporting and analysis.                                                    |
| **US-P1-6**  | **Batch Delete**             | As a User, I want a standard confirmation modal before deleting multiple rows to prevent accidental data loss.                                                                            |
| **US-P1-7**  | **Hybrid Record Creation**   | As a User, I want to add a blank row by default, but if mandatory fields or validation rules fail, I want a modal to appear to resolve those requirements (Best Practice: Field Overlay). |
| **US-P1-8**  | **Column Header Actions**    | As a User, I want standard column header actions (freeze, hide, mark read-only) to temporarily customize my current view.                                                                 |
| **US-P1-9**  | **User Preferences & Reset** | As a User, I want the grid to remember my hidden/frozen columns and filters across sessions, and have a "Reset to Default" button to revert to the admin-defined state.                   |
| **US-P1-10** | **Keyboard Shortcuts**       | As a Power User, I want to use the Ctrl+S shortcut to save my inline edits so that I can work faster.                                                                                     |
| **US-P1-11** | **Cell Rendering Strategy**  | As a Developer, I want a `getCellType()` abstraction layer in the LWC so that the code structure cleanly separates the rendering logic for different field data types.                    |

---

## 🛠️ Data Model Enhancements

### New: Smart_Grid_Column\_\_mdt (Child)

This Custom Metadata Type will define individual column behavior, replacing JSON mapping.

| Field Name             | Type                  | Description                                             |
| ---------------------- | --------------------- | ------------------------------------------------------- |
| `Smart_Grid_Config__c` | Metadata Relationship | Links to parent `Smart_Grid_Config__mdt`                |
| `Field_API_Name__c`    | Text (80)             | The API name of the field to display (e.g., `Industry`) |
| `Display_Label__c`     | Text (80)             | Custom label (optional, falls back to field label)      |
| `Order__c`             | Number (18, 0)        | Sort order of the column in the grid                    |
| `Is_Editable__c`       | Checkbox              | Whether the field can be edited inline                  |
| `Column_Width__c`      | Number (18, 0)        | Initial width in pixels                                 |
| `Is_Sortable__c`       | Checkbox              | Whether server-side sorting is enabled for this column  |

### New: Smart_Grid_User_Pref\_\_c (Custom Object)

Stores user-specific grid overrides (e.g., column visibility, frozen status, saved filters).

| Field Name            | Type                 | Description                                                  |
| --------------------- | -------------------- | ------------------------------------------------------------ |
| `User__c`             | Lookup (User)        | The user owning the preference (can also default to OwnerId) |
| `Object_API_Name__c`  | Text (80)            | Grid object context                                          |
| `Preferences_JSON__c` | Long Text Area (32k) | Hidden columns, frozen columns, saved filter state           |

---

## 🏗️ Technical Architecture Changes

### 1. Apex Selector Update (`GridQueryBuilder`)

- **Multi-Filter & Date Support**: Assume `Map<String, Object>` filters to support lists and date ranges (e.g., `['StartDate', 'EndDate']`). Use `AND` logic in `WHERE`.
- **Sorting Logic**: Add `String sortField` and `String sortDirection` (ASC/DESC).

### 2. Apex Controller Update (`SmartGridController`)

- **Relational Fetching**: If `Use_Advanced_Config__c` = true, fetch `Smart_Grid_Column__mdt` child records. Include backwards compatibility mapper for `Columns_JSON__c`.
- **DML additions**: `deleteRecords(List<Id>)` and `createRecord(String objectApiName, Map<String,Object> defaultValues)`.

### 3. User Preferences Layer (`SmartGridUserPrefService`)

- Add service methods to GET/UPSERT/DELETE the `Smart_Grid_User_Pref__c` record for the current user.

### 4. LWC Updates (`smartDataGrid`)

- **Rendering Abstraction (`getCellType`)**: Introduce helper logic to parse field types (Date, Picklist, Number) and map to standard `lightning-datatable` formatting.
- **Header Actions**: Bind generic dropdowns on column headers for Hide/Freeze. Map this state to UI visibility and save to Prefs automatically.
- **Client-Side CSV Export**: Construct row/column matrix, transform into base64 payload, and invoke automatic file download anchor element.
- **Keyboard Listeners**: Intercept `keydown` events (`e.ctrlKey && e.key === 's'`, or `e.metaKey` for macOS) on the container to invoke `saveRecords`.

---

## ✅ Acceptance Criteria

### Advanced Config & Resolving

- [ ] Child CMDT `Smart_Grid_Column__mdt` links functional. Controller correctly toggles JSON/Relational based on `Use_Advanced_Config__c`.
- [ ] Grid renders identically regardless of underlying metadata source.

### Filtering & Sorting

- [ ] UI displays up to 3 combobox/text filters and a Date Range picker side-by-side. Filtering combines logic via `AND`.
- [ ] Clicking a column header triggers server-side sort (ASC/DESC tracking displayed correctly).

### Data Mutability & Export

- [ ] Selecting one or more rows and clicking "Delete" successfully removes them from Salesforce and refreshes the grid.
- [ ] Clicking "Add Row" inserts a new blank/default record inline or via minimal modal, refreshes.
- [ ] Clicking "Export to CSV" accurately downloads client-side text representing active filtered grid data.
- [ ] Pressing `Ctrl+S` (or `Cmd+S`) while rows are edited triggers grid save.

### Customization & Personalization

- [ ] Clicking column header dropdown allows checking "Hide Column" or "Freeze Column".
- [ ] Hidden/Frozen states are persisted to `Smart_Grid_User_Pref__c` and load automatically upon re-entering the page.
- [ ] Clicking "Reset to Default" clears the User Prefs record and restores the grid to Admin config.
- [ ] `getCellType()` effectively decouples the raw field describe from the LWC data formatting, making future expansions easier.

---

## 🔒 Security Gate Requirement

- All new SOQL queries for child CMDT records must use `WITH USER_MODE`.
- User Preference SOQL / DML strictly scoped to `UserInfo.getUserId()`.
- Record deletions require `isDeletable()` checks on `Schema.DescribeSObjectResult`.
- Relationship traversal logic must remain protected from SOQL injection via existing escaping patterns.
- `SmartGrid_User` Permission Set updated to include the new CMDT and `Smart_Grid_User_Pref__c` object access.
