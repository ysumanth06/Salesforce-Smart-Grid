# Task Story 00: Phase 1 Foundation

## Context

- **Feature**: 002-smartgrid-phase1
- **Story ID**: TS-00
- **Type**: FULL (Metadata + Setup Apex)
- **Status**: DONE
- **Started**: 2026-04-19
- **Completed**: 2026-04-19

## 🎯 Objective

Establish the structural foundation for Phase 1 by creating the new child Custom Metadata Type, the User Preference custom object, and the shared Apex service skeleton.

## 🚀 Requirements

1. Create `Smart_Grid_Column__mdt` Custom Metadata Type with relationship to `Smart_Grid_Config__mdt`.
2. Create `Smart_Grid_User_Pref__c` Custom Object with Private OWD.
3. Update `SmartGrid_User` Permission Set to include Read/Write access to the new object and FLS for all fields.
4. Create `SmartGridUserPrefService.cls` for preference orchestration.
5. Create `TestFactory.cls` (if not exists) or update to support Phase 1 objects.

## ✅ Acceptance Criteria

- [ ] `Smart_Grid_Column__mdt` records can be created as children of `Smart_Grid_Config__mdt`.
- [ ] `Smart_Grid_User_Pref__c` object is accessible to the system and assigned users.
- [ ] `SmartGridUserPrefService` class is created with empty method signatures for `getPrefs` and `savePrefs`.
- [ ] All new metadata deploys successfully using `sf project deploy start`.

## 🛠 SF Implementation Layers

| Layer           | Skill          | File Path                                                                     | Status  |
| :-------------- | :------------- | :---------------------------------------------------------------------------- | :------ |
| **Metadata**    | sf-metadata    | `force-app/main/default/objects/Smart_Grid_Column__mdt/*`                     | ✅ DONE |
| **Metadata**    | sf-metadata    | `force-app/main/default/objects/Smart_Grid_User_Pref__c/*`                    | ✅ DONE |
| **Permissions** | sf-permissions | `force-app/main/default/permissionsets/SmartGrid_User.permissionset-meta.xml` | ✅ DONE |
| **Apex**        | sf-apex        | `force-app/main/default/classes/SmartGridUserPrefService.cls`                 | ✅ DONE |
| **Testing**     | sf-testing     | `force-app/main/default/classes/SmartGridUserPrefServiceTest.cls`             | ✅ DONE |

## 🔒 Scoring Gates

- **sf-metadata**: 105/120
- **sf-apex**: 130/150

## 📝 Dependencies

- **Blocks**: TS-01, TS-02, TS-03, TS-04, TS-05
- **Requires**: NONE

## 📊 Estimation

- **Metadata**: 1.5h
- **Apex**: 1h
- **Total**: 2.5h
