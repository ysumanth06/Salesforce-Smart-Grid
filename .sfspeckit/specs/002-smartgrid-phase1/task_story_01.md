# Task Story 01: Relational Metadata Resolver

## Context

- **Feature**: 002-smartgrid-phase1
- **Story ID**: TS-01
- **Type**: FULL
- **Status**: DRAFT

## 🎯 Objective

Upgrade the `SmartGridController` to support fetching columns from the new `Smart_Grid_Column__mdt` relationship if the `Use_Advanced_Config__c` flag is true.

## 🚀 Requirements

1. Update `SmartGridController.getGridConfig` to query child column records if advanced config is enabled.
2. Implement a DTO (Data Transfer Object) in Apex to unify the old JSON-based columns and new Relational columns into a single response format for the LWC.
3. Ensure sorting by the `Order__c` field on the child records.

## ✅ Acceptance Criteria

- [ ] Controller returns a list of column objects regardless of the storage source (JSON vs Relational).
- [ ] If `Use_Advanced_Config__c` is false, fallback to legacy JSON parsing works perfectly.
- [ ] Columns are ordered correctly in the response according to the defined `Order__c`.
- [ ] Apex tests mock both JSON and Relational scenarios.

## 🛠 SF Implementation Layers

| Layer            | Skill      | File Path                                                    | Status     |
| :--------------- | :--------- | :----------------------------------------------------------- | :--------- |
| **Apex Service** | sf-apex    | `force-app/main/default/classes/SmartGridController.cls`     | ⭕ PENDING |
| **Apex Test**    | sf-testing | `force-app/main/default/classes/SmartGridControllerTest.cls` | ⭕ PENDING |

## 🔒 Scoring Gates

- **sf-apex**: 120/150

## 📝 Dependencies

- **Requires**: TS-00
- **Blocks**: TS-04

## 📊 Estimation

- **Apex**: 2h
- **Total**: 2h
