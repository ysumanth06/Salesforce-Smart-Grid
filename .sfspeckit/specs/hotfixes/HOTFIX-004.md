# HOTFIX-004: Enterprise Scaling & Smart Rendering

## Overview

**Date:** 2026-04-20
**Severity:** High
**Environment:** Production / UI Testing
**Status:** DONE
**Verified By:** Antigravity

## Bug Description / Feature Request

1. **Scale Issues:** The grid was limited to a 2000-row hard cap with no way to navigate larger datasets.
2. **UI Fidelity:** Columns were rendering as plain text regardless of their actual Salesforce field type (Currency, Date, etc.).
3. **Filter Sync:** Filters were static (showing only 5 fields) and didn't update based on which columns the user actually chose to display.

## Root Cause Analysis

1. **Pagination:** `GridQueryBuilder` only supported `LIMIT`. No `OFFSET` or paging logic existed in the Apex controller or LWC.
2. **Metadata Gap:** `ColumnDTO` lacked a `type` property, and `formatColumn` in JS defaulted everything to 'text'.
3. **Filter Logic:** `initializeFilters` was scanning the entire object schema instead of the active `gridColumns` array.

## Implementation Details

### 1. Server-Side Pagination

- **Apex:** Updated `GridQueryBuilder` to support an `offsetValue` (capped at 2000 per Salesforce limits).
- **Controller:** Added `getRecordsPaged` returning a `PagedResult` DTO containing records, total size, and page state.
- **LWC:** Added a pagination footer with "Previous/Next" navigation and a "Page X of Y" status indicator.

### 2. Smart Column Type Mapping

- **Apex:** Enhanced `ColumnDTO` to include the field `type`. `getGridConfig` now performs a schema describe to populate this.
- **LWC:** Implemented `mapFieldType()` to translate Salesforce types (CURRENCY, PERCENT, BOOLEAN, etc.) to native `lightning-datatable` types.

### 3. Dynamic Filter Panel

- **Logic:** Refactored `initializeFilters()` to dynamically generate filter options based only on the fields currently selected for display.
- **UI:** Removed the "3 picklist limit". Implemented a responsive grid layout for the filter panel to accommodate any number of fields.
- **UX:** Added a "Clear All" button to reset the filter state and the pill display simultaneously.

## Testing

1. **Pagination:** Verified that navigation correctly calculates the OFFSET and fetches subsequent batches of 50 records.
2. **Types:** Confirmed that Currency fields show `$` symbols and Date fields use localized strings.
3. **Filters:** Verified that changing the column selection via the Field Picker immediately updates the available filters in the panel.
4. **Unit Tests:** Updated `SmartGridControllerTest` and `GridQueryBuilderTest` to cover the new paged result structures and offset generation.

## Deployment

- **Branch:** `hotfix/HOTFIX-001-grid-overlap`
- **Status:** Deployed to Salesforce Org and Pushed to GitHub.
