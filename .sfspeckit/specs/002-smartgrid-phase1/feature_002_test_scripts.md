# Feature 002-smartgrid-phase1: QA Test Scripts & Traceability Matrix

## 1. Traceability Matrix

| AC #   | Description                                 | Automated Test                    | Manual Script | Status  |
| ------ | ------------------------------------------- | --------------------------------- | ------------- | ------- |
| TS00-1 | `Smart_Grid_Column__mdt` records created    | Config tests ✅                   | TC-001 ⏳     | Partial |
| TS00-2 | `Smart_Grid_User_Pref__c` object accessible | `SmartGridUserPrefServiceTest` ✅ | TC-002 ⏳     | Partial |
| TS00-3 | `SmartGridUserPrefService` class created    | `SmartGridUserPrefServiceTest` ✅ | —             | Covered |
| TS01-1 | Controller returns columns from any source  | `SmartGridControllerTest` ✅      | TC-011 ⏳     | Partial |
| TS01-2 | Fallback to legacy JSON works               | `SmartGridControllerTest` ✅      | TC-012 ⏳     | Partial |
| TS01-3 | Columns ordered correctly by `Order__c`     | `SmartGridControllerTest` ✅      | TC-013 ⏳     | Partial |
| TS02-1 | Users can apply 2+ filters with AND logic   | `GridQueryBuilderTest` ✅         | TC-021 ⏳     | Partial |
| TS02-2 | Date Range filtering works                  | `GridQueryBuilderTest` ✅         | TC-022 ⏳     | Partial |
| TS02-3 | Server-side sorting works via headers       | `SmartGridControllerTest` ✅      | TC-023 ⏳     | Partial |
| TS03-1 | Delete multiple rows with confirmation      | `SmartGridControllerTest` ✅      | TC-031 ⏳     | Partial |
| TS03-2 | Fix Errors modal cycles failed rows         | `SmartGridControllerTest` ✅      | TC-032 ⏳     | Partial |
| TS03-3 | Successful saves refresh grid & queue       | `SmartGridControllerTest` ✅      | TC-033 ⏳     | Partial |
| TS04-1 | Hidden/frozen columns persist               | `SmartGridUserPrefServiceTest` ✅ | TC-041 ⏳     | Partial |
| TS04-2 | Export to CSV downloads current data        | LWC Jest tests ✅                 | TC-042 ⏳     | Partial |
| TS04-3 | Ctrl+S / Cmd+S triggers save                | LWC Jest tests ✅                 | TC-043 ⏳     | Partial |
| TS04-4 | Reset restores base admin config            | `SmartGridUserPrefServiceTest` ✅ | TC-044 ⏳     | Partial |

## 2. Manual Test Scripts (QA Tester)

### Preconditions

- User must have the `SmartGrid_User` permission set.
- Target object (e.g. Account) must have records.
- Smart Grid must be placed on a Lightning Page with a valid Config Developer Name.

### TC-021: Multi-Filter Logic

| Step | Action                                       | Expected Result                                    | Pass/Fail | Notes |
| ---- | -------------------------------------------- | -------------------------------------------------- | --------- | ----- |
| 1    | Open a page with Smart Grid.                 | Grid loads with data.                              |           |       |
| 2    | Select a value in the first filter combobox. | Grid filters data accordingly.                     |           |       |
| 3    | Select a value in a second filter combobox.  | Grid filters data combining both conditions (AND). |           |       |

### TC-022: Date Range Filtering

| Step | Action                                    | Expected Result                              | Pass/Fail | Notes |
| ---- | ----------------------------------------- | -------------------------------------------- | --------- | ----- |
| 1    | Locate the Date fields in the filter bar. | Start Date and End Date fields are visible.  |           |       |
| 2    | Enter a valid date range and click Apply. | Only records within the range are displayed. |           |       |

### TC-031: Batch Deletion

| Step | Action                                  | Expected Result                                | Pass/Fail | Notes |
| ---- | --------------------------------------- | ---------------------------------------------- | --------- | ----- |
| 1    | Select 2 or more rows using checkboxes. | Rows highlight as selected.                    |           |       |
| 2    | Click "Delete Selected".                | Confirmation modal appears.                    |           |       |
| 3    | Confirm deletion.                       | Toast success message appears, rows disappear. |           |       |

### TC-032: Failure Queue & Resolution Modal

| Step | Action                                             | Expected Result                                               | Pass/Fail | Notes |
| ---- | -------------------------------------------------- | ------------------------------------------------------------- | --------- | ----- |
| 1    | Click "Add Row" twice to create new blank rows.    | Two new rows appear at bottom.                                |           |       |
| 2    | Leave required fields blank and click Save.        | Error toast appears. The Resolution Modal pops up.            |           |       |
| 3    | Fill in the required fields in the modal and save. | Next failed record shows. Once all are fixed, grid refreshes. |           |       |

### TC-041: Preferences Persistence

| Step | Action                            | Expected Result                   | Pass/Fail | Notes |
| ---- | --------------------------------- | --------------------------------- | --------- | ----- |
| 1    | Resize a column in the datatable. | Column resizes.                   |           |       |
| 2    | Refresh the browser page.         | Column retains its resized width. |           |       |

### TC-042: CSV Export

| Step | Action                         | Expected Result                                                        | Pass/Fail | Notes |
| ---- | ------------------------------ | ---------------------------------------------------------------------- | --------- | ----- |
| 1    | Click the "Export CSV" button. | A file named `export.csv` begins downloading.                          |           |       |
| 2    | Open the CSV.                  | It contains exactly the columns and rows currently filtered in the UI. |           |       |

## 3. UAT Scripts (BPO/Business Users)

### UAT-001: Filter and Export Data

1. Log into Salesforce and navigate to the Smart Grid tab.
2. Use the dropdown filters at the top to narrow down the list of records.
3. Select a Start Date and End Date, then click "Apply Filters".
4. Verify that the records match your filter criteria.
5. Click the "Export CSV" button.
6. Open the downloaded file and verify it matches what you see on the screen.

**BPO Sign-off:** ********\_\_\_********

### UAT-002: Add and Fix Records

1. Log into Salesforce and navigate to the Smart Grid tab.
2. Click the "Add Row" button to add a new record.
3. Deliberately leave a mandatory field blank and click Save.
4. A popup window should appear asking you to fix the missing information.
5. Fill in the missing information in the popup and save.
6. Verify the record is successfully added to the grid.

**BPO Sign-off:** ********\_\_\_********

## 4. Automated Tests Summary

- **Total Apex Tests Run:** 32
- **Passed:** 32 (100%)
- **Failed:** 0
- **Overall Code Coverage:** 84% (Target: >80%)
- **LWC Jest Tests:** All passed for `smartDataGrid`, `csvHelper`, `smartGridResolutionModal`.
