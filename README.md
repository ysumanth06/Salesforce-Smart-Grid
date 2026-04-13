<div align="center">
  <img src="SFSpeckit/docs/assets/logo.png" width="300" alt="SFSpeckit Logo">
  <h1>Salesforce Smart Grid — Phase 0 MVP</h1>
</div>

<br/>

A **metadata-driven, dynamic inline-edit data grid** for Salesforce Lightning. Drop it onto any App, Home, or Record page to instantly render a fully functional, editable datatable for any object — no code changes required.


---

## ✨ What's Included in Phase 0

### Core Features

| Feature | Description |
|---------|-------------|
| **Dynamic Grid Rendering** | Configure once in Custom Metadata, render everywhere. Supports any standard or custom object. |
| **Inline Editing** | Users can edit records directly in the datatable and save in bulk. |
| **Bulk Save with Partial Success** | Uses `Database.update(records, false)` — successful rows save, failed rows show inline errors. |
| **Row-Level Error Handling** | DML errors are mapped back to individual rows in the datatable with field-level highlights. |
| **Column Personalization** | When no CMDT config exists, a modal with a dual-listbox lets users pick which fields to display. |
| **Dynamic Filtering** | Configurable picklist-based filter combobox. Set a `Default_Filter_Field__c` and the grid auto-populates a filter dropdown. |
| **FLS Security** | All queries enforce `isAccessible()` checks. All DML uses `stripInaccessible()`. No data leaks. |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LWC Layer                                │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │   smartDataGrid     │───▶│   smartGridFieldPicker       │   │
│  │  (Parent: datatable,│◀───│  (Child: dual-listbox modal) │   │
│  │   filter combobox)  │    │   fires <fieldselection>     │   │
│  └─────────┬───────────┘    └──────────────────────────────┘   │
│            │                                                    │
├────────────┼────────────────────────────────────────────────────┤
│            │              Apex Layer                            │
│  ┌─────────▼───────────┐    ┌──────────────────────────────┐   │
│  │ SmartGridController │───▶│     GridQueryBuilder         │   │
│  │ (Thin Controller)   │    │  (Selector / Domain Layer)   │   │
│  │ getGridConfig()     │    │  buildSingleQuery()          │   │
│  │ getRecords()        │    │  validateFields() + FLS      │   │
│  │ saveRecords()       │    │  SQL injection prevention    │   │
│  │ getObjectFields()   │    └──────────────────────────────┘   │
│  │ getPicklistValues() │                                       │
│  └─────────────────────┘                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      Metadata Layer                             │
│  Smart_Grid_Config__mdt (8 fields) + SmartGrid_User PermSet    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
force-app/main/default/
├── classes/
│   ├── GridQueryBuilder.cls          # Dynamic SOQL builder with FLS validation
│   ├── GridQueryBuilderTest.cls      # 8 test methods (PNB + SQL injection)
│   ├── SmartGridController.cls       # @AuraEnabled controller (thin wrapper)
│   └── SmartGridControllerTest.cls   # 11 test methods (PNB + bulk + filter)
├── customMetadata/
│   └── Smart_Grid_Config.Account_Demo_Grid.md-meta.xml  # Demo config record
├── lwc/
│   ├── smartDataGrid/                # Parent grid component
│   │   ├── smartDataGrid.html
│   │   ├── smartDataGrid.js
│   │   ├── smartDataGrid.css
│   │   └── smartDataGrid.js-meta.xml
│   └── smartGridFieldPicker/         # Column picker modal (child)
│       ├── smartGridFieldPicker.html
│       ├── smartGridFieldPicker.js
│       ├── smartGridFieldPicker.css
│       ├── smartGridFieldPicker.js-meta.xml
│       └── __tests__/
│           └── smartGridFieldPicker.test.js  # 9 Jest tests
├── objects/
│   └── Smart_Grid_Config__mdt/       # Custom Metadata Type + 8 fields
└── permissionsets/
    └── SmartGrid_User.permissionset-meta.xml
```

---

## 🚀 Deployment

### Prerequisites

- Salesforce CLI (`sf`) installed and authenticated
- Target org API version 65.0+
- Node.js 18+ (for Jest tests)

### Deploy to a Sandbox or Scratch Org

```bash
# Authenticate to your org
sf org login web --alias dev

# Deploy everything
sf project deploy start \
  --source-dir force-app \
  --target-org dev \
  --test-level RunLocalTests \
  --wait 15

# Assign the permission set to your user
sf org assign permset --name SmartGrid_User --target-org dev
```

### Run Tests

```bash
# Apex tests
sf apex run test \
  --class-names GridQueryBuilderTest,SmartGridControllerTest \
  --code-coverage \
  --result-format human \
  --target-org dev

# Jest tests (LWC)
npm install                          # Install dev dependencies first
npx lwc-jest -- --testPathPattern smartGridFieldPicker
```

---

## 🧪 How to Test in Salesforce

### Step 1: Verify the Custom Metadata

1. Navigate to **Setup → Custom Metadata Types → Smart Grid Config → Manage Records**
2. You should see a record named **Account_Demo_Grid** with:
   - `Object_API_Name__c` = `Account`
   - `Columns_JSON__c` = `[{"field":"Name","order":1,"editable":true,"width":200},{"field":"Industry","order":2,"editable":true},{"field":"Phone","order":3,"editable":false}]`
   - `Default_Filter_Field__c` = `Industry`
   - `Is_Active__c` = `true`

### Step 2: Add the Component to a Lightning Page

1. Navigate to any **Lightning App Page** (e.g., the Home page)
2. Click **Edit Page** (gear icon → Edit Page)
3. Search for **"Smart Data Grid"** in the component palette
4. Drag it onto the page
5. In the right-hand property panel, set:
   - **Grid Config Developer Name** = `Account_Demo_Grid`
6. Click **Save** → **Activate** → **Assign as Org Default** (or app-specific)

### Step 3: Test Inline Editing

1. Navigate to the page where you placed the component.
2. You should see an Account datatable with **Name**, **Industry**, and **Phone** columns.
3. Click on any **Name** or **Industry** cell to edit it inline.
4. Modify values on one or more rows.
5. Click the **Save** button that appears at the bottom of the datatable.
6. ✅ Verify: Edited rows save, and the grid refreshes with updated values.

### Step 4: Test Error Handling

1. Edit a row and clear the **Name** field (set it to blank).
2. Edit another row normally.
3. Click **Save**.
4. ✅ Verify: The good row saves successfully. The bad row shows an inline error with a red indicator. A "Partial Success" toast notification appears.

### Step 5: Test Dynamic Filtering

1. If `Default_Filter_Field__c` is set to `Industry`, you should see a **"Filter by Industry"** combobox above the datatable.
2. Select a value like "Technology" from the dropdown.
3. ✅ Verify: The grid reloads showing only Account records where `Industry = 'Technology'`.
4. Select "-- All --" to clear the filter.

### Step 6: Test the Field Picker (Column Personalization)

1. Add a **new** Smart Data Grid component to a page.
2. Instead of setting a Grid Config, only set:
   - **Default Object API Name** = `Account`
3. Save and navigate to the page.
4. ✅ Verify: A **modal** appears with a dual-listbox showing all accessible Account fields.
5. Move fields (e.g., AnnualRevenue, Website) to the "Selected" side.
6. Click **Apply**.
7. ✅ Verify: The datatable renders with your chosen fields and loads Account data.

---

## ⚙️ Configuration Reference

### Smart_Grid_Config__mdt Fields

| Field | Type | Description |
|-------|------|-------------|
| `Object_API_Name__c` | Text (80) | API name of the target SObject (e.g., `Account`, `Contact`, `My_Custom__c`) |
| `Columns_JSON__c` | Long Text (10000) | JSON array defining columns: `[{"field":"Name","order":1,"editable":true,"width":200}]` |
| `Default_Filter_Field__c` | Text (80) | Picklist field API name for the dynamic filter combobox |
| `Default_Sort_Field__c` | Text (80) | Field to sort by on initial load |
| `Record_Limit__c` | Number | Max rows returned (default: 200, max: 2000) |
| `Is_Active__c` | Checkbox | Deactivate without removing the component |
| `Allow_Personalization__c` | Checkbox | Allow users to open the field picker modal |
| `Use_Advanced_Config__c` | Checkbox | Phase 1 migration flag (not yet implemented) |

### Creating a New Grid Configuration

```bash
# Use sf CLI to create a new config record
sf data create record \
  --sobject Smart_Grid_Config__mdt \
  --values "DeveloperName='Contact_Grid' \
            MasterLabel='Contact Grid' \
            Object_API_Name__c='Contact' \
            Columns_JSON__c='[{\"field\":\"FirstName\",\"order\":1,\"editable\":true},{\"field\":\"LastName\",\"order\":2,\"editable\":true},{\"field\":\"Email\",\"order\":3,\"editable\":false}]' \
            Is_Active__c=true \
            Record_Limit__c=100" \
  --target-org dev
```

Or create a new metadata file in `force-app/main/default/customMetadata/` and deploy.

---

## 🔒 Security Model

| Layer | Enforcement |
|-------|------------|
| **Object Access** | `Schema.getGlobalDescribe().isAccessible()` — objects the user can't see are rejected |
| **Field Access (Read)** | `Schema.DescribeFieldResult.isAccessible()` — inaccessible fields silently dropped from queries |
| **Field Access (Write)** | `Security.stripInaccessible(AccessType.UPDATABLE)` — unauthorized fields stripped before DML |
| **Sharing** | `with sharing` on all Apex classes |
| **Injection** | `String.escapeSingleQuotes()` on all dynamic SOQL inputs |

---

## 🗺️ Roadmap (Phase 1+)

- [ ] Relational metadata config (replace JSON with child CMDT records)
- [ ] Multi-field filtering with AND/OR logic
- [ ] Server-side pagination (offset/cursor)
- [ ] Column sorting by click
- [ ] Export to CSV
- [ ] Record creation (inline "new row")
- [ ] LMS integration for cross-component communication

---

## 📐 Built With

- **Salesforce Platform** — API 65.0
- **Apex** — `with sharing`, `WITH USER_MODE`, `Database.update(records, false)`
- **Lightning Web Components** — SLDS 2, `lwc:if`, PICKLES architecture
- **Custom Metadata Types** — Deployable, packageable config
- **SFSpeckit** — Spec-driven development methodology

## License

MIT
