# HOTFIX-006: Professional Data Types & Custom Picklist Support

## Overview

**Date:** 2026-04-20
**Severity:** High
**Environment:** Production / UI Testing
**Status:** DONE
**Verified By:** Antigravity

## Bug Description / Feature Request

1. **Fallback Rendering:** Even after type mapping was introduced, some fields (like Booleans) were still rendering as text in dynamic grids.
2. **Missing Picklist Support:** `lightning-datatable` lacks a native picklist editor, forcing users to type picklist values manually as text, which is error-prone and non-standard.

## Root Cause Analysis

1. **Stale-Type Bug (Critical):** After columns are formatted the first time (or loaded from cache), `col.type` contains the _datatable_ type (e.g. `"text"`, `"boolean"`, `"url"`) — NOT the _Salesforce schema_ type (e.g. `"BOOLEAN"`, `"PICKLIST"`, `"REFERENCE"`). When `refreshColumns()` re-ran `formatColumn()`, it passed the datatable type to `mapFieldType()`, which didn't recognize lowercase datatable types and defaulted everything back to `{ type: "text" }`. This caused an infinite loop of "always text".
2. **Fix:** Introduced `_fieldMetadataMap` — a class-level dictionary populated during `initializeFilters()` from `getObjectFields()`. `formatColumn()` now always resolves the real Salesforce type from this map: `this._fieldMetadataMap[fieldApi] || col.type`. This ensures correct types survive caching, re-formatting, and preference loading.
3. **Standard Component Limitation:** `lightning-datatable` does not provide a built-in picklist type, requiring a custom LWC extension (`smartGridDatatable`) to support `lightning-combobox` inside grid cells.

## Implementation Details

### 1. Extended Datatable Architecture

- **`smartGridDatatable`:** Created a custom LWC that extends `LightningDatatable`.
- **`smartGridPicklist`:** Created a custom cell editor component that renders a `lightning-combobox` with options dynamically injected from Salesforce metadata.
- **Registration:** Registered the `picklist` custom type in the extended datatable, enabling professional dropdown editing.

### 2. Metadata Enrichment

- **Dynamic Sync:** Updated `handleFieldSelection` in `smartDataGrid.js` to cross-reference selected fields with a fresh schema describe from Apex. This ensures that every field—even in a user-configured grid—has its correct `BOOLEAN`, `CURRENCY`, or `PICKLIST` type.
- **Proprietary Logic:** Updated the type mapping engine to inject picklist options directly into the column definitions, providing a seamless "Zero Configuration" picklist experience.

### 3. Boolean/Checkbox Fix

- **Native Rendering:** By ensuring the `boolean` type is correctly identified in the metadata sync, the datatable now renders standard checkboxes for boolean fields instead of text inputs.

## Deployment

- **Branch:** `hotfix/HOTFIX-001-grid-overlap`
- **Status:** Deployed and Pushed.
- **Components:** `smartDataGrid`, `smartGridDatatable`, `smartGridPicklist`, `SmartGridController`.
