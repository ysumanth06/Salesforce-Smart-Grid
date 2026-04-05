# Data Model: Salesforce Smart Grid - Phase 0

## Overview
This document defines the custom metadata types and schema objects required to support the Phase 0 (True MVP) implementation of the Salesforce Smart Grid. All data structures conform to Article I (Metadata-First) of our project constitution.

---

## Objects

### `Smart_Grid_Config__mdt`
**Label**: Smart Grid Config  
**Visibility**: Public

This Custom Metadata Type stores the runtime UI rendering instructions for the Smart Grid when placed on an App, Home, or Record page. By keeping the core configuration in JSON format for Phase 0, we avoid relational metadata complexities, accelerating MVP delivery while designing a migration path (via `Use_Advanced_Config__c`) for Phase 1.

| Field Name | Type | Properties | Description |
|------------|------|------------|-------------|
| `Object_API_Name__c` | Text (80) | Required | The underlying Salesforce object this grid queries (e.g., `Account`, `Apttus__Agreement__c`).
| `Columns_JSON__c` | Long Text Area (10000) | | JSON array definition defining field render mappings. See format below. |
| `Default_Filter_Field__c` | Text (80) | | API name of the field driving the dynamic filter picklist. |
| `Record_Limit__c` | Number (4, 0) | Default: 200 | Maximum rows to return to prevent heap limit explosions. |
| `Default_Sort_Field__c` | Text (80) | | Field the grid sorts by upon initialization. |
| `Is_Active__c` | Checkbox | Default: True | Deactivates the grid entirely without removing the component from the page. |
| `Allow_Personalization__c` | Checkbox | Default: True | Controls whether the end-user can open the Field Picker modal to override the default JSON. |
| `Use_Advanced_Config__c` | Checkbox | Default: False | Migration Flag: If true, the system will ignore JSON and query Phase 1 relational metadata (Future capability). |

#### Demo JSON Format (`Columns_JSON__c`)
```json
[
  {"field": "Name", "order": 1, "editable": true, "width": 200},
  {"field": "Industry", "order": 2, "editable": true},
  {"field": "Phone", "order": 3, "editable": false}
]
```

## Security Strategy
Because this is Custom Metadata, it does not rely on Sharing Rules or OWD. The Apex classes fetching these records (`SmartGridController`) must evaluate their contents securely.
Field Level Access dictates that even if a field API name is defined inside `Columns_JSON__c`, the user running the query MUST have `isAccessible()` and `isUpdateable()` rights to that field; otherwise, the Apex service (`GridQueryBuilder`) silently drops it from the query and restricts UI edits.
