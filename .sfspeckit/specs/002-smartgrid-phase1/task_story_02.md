# Task Story 02: Advanced Filtering & Date Resolver

## Context

- **Feature**: 002-smartgrid-phase1
- **Story ID**: TS-02
- **Type**: FULL
- **Status**: DRAFT

## 🎯 Objective

Enhance the query engine to support multiple field filters and a dynamic date range picker that can target any date field.

## 🚀 Requirements

1. Update `GridQueryBuilder.cls` to take a `Map<String, Object>` of filters instead of a single value.
2. Update the `getRecords` AuraEnabled method to pass the multi-filter payload.
3. Implement Date Range logic in SOQL (e.g., using `>=` and `<=` or Date Literals).
4. Update LWC UI to display up to 3 filter comboboxes and 1 Date Picker.

## ✅ Acceptance Criteria

- [ ] Users can apply 2 or more filters and the grid combines them with `AND` logic.
- [ ] Selecting a Date Field and a Range (Start/End) successfully filters the grid.
- [ ] Server-side sorting works by clicking column headers.

## 🛠 SF Implementation Layers

| Layer             | Skill   | File Path                                                     | Status     |
| :---------------- | :------ | :------------------------------------------------------------ | :--------- |
| **Apex Selector** | sf-apex | `force-app/main/default/classes/GridQueryBuilder.cls`         | ⭕ PENDING |
| **LWC UI**        | sf-lwc  | `force-app/main/default/lwc/smartDataGrid/smartDataGrid.js`   | ⭕ PENDING |
| **LWC UI**        | sf-lwc  | `force-app/main/default/lwc/smartDataGrid/smartDataGrid.html` | ⭕ PENDING |

## 🔒 Scoring Gates

- **sf-apex**: 130/150
- **sf-lwc**: 120/165

## 📝 Dependencies

- **Requires**: TS-01

## 📊 Estimation

- **Apex**: 3h
- **LWC**: 2h
- **Total**: 5h
