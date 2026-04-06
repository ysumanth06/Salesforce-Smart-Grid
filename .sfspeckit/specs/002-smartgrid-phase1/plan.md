# Technical Implementation Plan: 002-smartgrid-phase1 (Phase 1: Grid Lite)

## 📋 Technical Context

- **Project**: Salesforce Smart Grid
- **Module**: Phase 1 (Grid Lite)
- **API Version**: 65.0
- **Base Namespace**: None (Unlocked/Unpackaged)
- **Target Org**: Sandbox (sumanth.yanamala@gmail.com)

---

## 🏛 Constitution Check

| Article                             | Status | Remediations Needed                                                                                    |
| :---------------------------------- | :----- | :----------------------------------------------------------------------------------------------------- |
| **Article I (Metadata-First)**      | ✅     | CMDT and Custom Object defined before code logic.                                                      |
| **Article II (Governor Limits)**    | ✅     | CSV export is client-side; Bulkification in Apex for Delete/Save results.                              |
| **Article III (Declarative-First)** | ✅     | Hybrid Create logic uses standard LWC components where possible.                                       |
| **Article IV (Security)**           | ✅     | `WITH USER_MODE` and Security checks planned for all layers.                                           |
| **Article VI (SoC)**                | ✅     | Clear separation between Selector (`GridQueryBuilder`), Service (`SmartGridController`), and Modal UI. |

---

## 🏗 Data Model Design (Layer 1)

### 1. Smart_Grid_Column\_\_mdt (Child Metadata)

Replaces `Columns_JSON__c` blob for advanced configuration.

- **Parent**: `Smart_Grid_Config__c` (Metadata Relationship)
- **Fields**: `Field_API_Name__c`, `Display_Label__c`, `Order__c`, `Is_Editable__c`, `Column_Width__c`, `Is_Sortable__c`.

### 2. Smart_Grid_User_Pref\_\_c (Custom Object)

- **OWD**: Private.
- **Key Fields**: `User__c` (Lookup), `Object_API_Name__c` (Text), `Preferences_JSON__c` (Long Text).

---

## 💻 Technical Architecture (Layer 2)

### Apex Integration

- **GridQueryBuilder**:
  - Update `buildQuery` signatures for `Map<String, Object> filters` and `String sortField`.
  - Implement Date literal support (`YESTERDAY`, `NEXT_WEEK`) for filtering.
- **SmartGridController**:
  - `getGridConfig`: Update to support relational fetching logic if `Use_Advanced_Config__c` is true.
  - `deleteRecords`: Implement bulkified delete with `Security.stripInaccessible`.
  - `saveRecords`: Enhance result mapping to include `SaveResult` DTO for the LWC failure queue.
- **SmartGridUserPrefService**: New service handles `getPrefs`, `savePrefs`, and `resetPrefs`.

### LWC Componentry (`smartDataGrid`)

- **Cell Rendering utility**: Shared JS helper function `getCellType()`.
- **Hybrid Creation Logic**:
  - `draftValues` management for adding rows.
  - **Failure Queue**: `this.failureQueue = []` state to track records needing modal resolution.
  - `ResolutionModal`: Child component using `lightning-record-edit-form`.
- **CSV Helper**: Client-side library to convert data array to URI for download.
- **Performance**: Use `localStorage` as a fast cache bridge while waiting for `UserPref` server roundtrips.

---

## 🚀 Deployment Order

1. **Ph 1 (Schema)**: Create objects, fields, and CMDT records.
2. **Ph 2 (Access)**: Update `SmartGrid_User` Permission Set.
3. **Ph 3 (Services)**: `SmartGridUserPrefService` and updated `GridQueryBuilder`.
4. **Ph 4 (Controller)**: Updates to `SmartGridController`.
5. **Ph 5 (LWC Utils)**: `csvHelper.js` and `ResolutionModal`.
6. **Ph 6 (LWC Main)**: Logic updates to `smartDataGrid`.
7. **Ph 7 (Verification)**: Run PNB Apex Tests and Jest.

---

## 🏛 Architect Sign-Off

_Required before /sfspeckit-tasks_

| Section               | Signature        | Date       |
| :-------------------- | :--------------- | :--------- |
| **Data Integrity**    | Sumanth Yanamala | 2026-04-06 |
| **Security Review**   | Sumanth Yanamala | 2026-04-06 |
| **Performance Check** | Sumanth Yanamala | 2026-04-06 |

---

## 📊 Scoring Gates

| Gate            | Target  | Key Metric                                     |
| :-------------- | :------ | :--------------------------------------------- |
| **sf-metadata** | 100/120 | CMDT Parent-Child integrity.                   |
| **sf-apex**     | 120/150 | Bulkified DML + Security enforcement.          |
| **sf-lwc**      | 140/165 | Accessibility (ARIA) and component decoupling. |
| **sf-testing**  | 110/120 | Mocking CMDT and User Prefs in Apex tests.     |
