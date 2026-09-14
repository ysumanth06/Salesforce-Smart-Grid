# HOTFIX-001: Grid Configuration Overlap and Field Picker Auto-Open

## Overview

**Date:** 2026-04-20
**Severity:** High
**Environment:** Production / UI Testing
**Status:** DONE
**Verified By:** Sumanth

## Bug Description

1. When a user opens an Account Custom Grid with `defaultObjectApiName` set to 'Account' but no `gridConfigDeveloperName`, a popup to select fields automatically appears every time the component loads. It should only appear on the first time or when explicitly clicking a button.
2. An Account Grid with `gridConfigDeveloperName` = 'Account_Demo_Grid' is broken and not displaying its predefined columns because it shares the same cache/preferences key (`Account`) as the dynamic grid, causing the configurations to overlap and override each other.

## Root Cause Analysis

1. The LWC `smartDataGrid` connectedCallback automatically invoked `this.openFieldPicker()` if there were no cached preferences and no `gridConfigName` was provided.
2. The `loadCachedColumns` and `saveCurrentPrefs` methods, as well as the Apex `SmartGridUserPrefService`, used `this.objectApiName` (e.g., 'Account') as the key. This meant all grids on the Account object shared the same user preferences, overwriting the custom metadata configuration of specific grids (like `Account_Demo_Grid`).

## Implementation Details

1. Replaced the auto-opening field picker with an `isSetupRequired` empty state that displays a centered "Select Fields to Display" button.
2. Added a "Select Fields" button in the action header specifically for dynamic grids (`isDynamicGrid`).
3. Introduced a `prefKey` getter (`this.gridConfigName ? this.gridConfigName : this.objectApiName`) to ensure that grids with a defined `gridConfigDeveloperName` use their specific config name as the cache and preferences key. This isolates them from generic object-level grids and prevents preference overlap.

## Testing

1. Local LWC testing confirms that the dynamic grid now shows an empty state until setup.
2. Local LWC testing confirms that grids with `gridConfigDeveloperName` load properly and save their preferences under their specific key.
