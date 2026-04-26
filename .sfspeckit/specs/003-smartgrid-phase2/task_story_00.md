# Task Story 00: Foundation — Metadata, Seed Data & Permissions

**Feature**: 003-smartgrid-phase2 (Phase 2 — Smart Grid Pro)
**Story Type**: FULL
**Priority**: P0 — Foundation (blocks all other stories)
**Status**: DRAFT
**Assignee**: —
**Jira**: —
**Branch**: `feature/003-ts00-foundation`

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

---

## Requirements

Deploy all Phase 2 metadata infrastructure — new objects, fields, CMDT seed records, LMS channel, and permission set updates. This story produces zero Apex/LWC code but unblocks every subsequent story.

### What This Story Creates

1. **Smart_Grid_Format_Rule\_\_mdt** — Custom Metadata Type + 10 fields
2. **Smart_Grid_View\_\_c** — Custom Object + 6 fields
3. **Smart_Grid_Config\_\_mdt** — 7 new toggle/config fields
4. **SmartGridChannel** — Lightning Message Channel
5. **5 Seed CMDT records** — Out-of-the-box conditional formatting rules
6. **SmartGrid_User permission set** — Updated with new object/field/CMDT access

---

## SF Implementation Layers

| Layer             | Skill          | File Path                                                                                                | Status |
| ----------------- | -------------- | -------------------------------------------------------------------------------------------------------- | ------ |
| CMDT Object       | sf-metadata    | `force-app/main/default/objects/Smart_Grid_Format_Rule__mdt/Smart_Grid_Format_Rule__mdt.object-meta.xml` | ⬜     |
| CMDT Fields (10)  | sf-metadata    | `force-app/main/default/objects/Smart_Grid_Format_Rule__mdt/fields/*.field-meta.xml`                     | ⬜     |
| Custom Object     | sf-metadata    | `force-app/main/default/objects/Smart_Grid_View__c/Smart_Grid_View__c.object-meta.xml`                   | ⬜     |
| Custom Fields (6) | sf-metadata    | `force-app/main/default/objects/Smart_Grid_View__c/fields/*.field-meta.xml`                              | ⬜     |
| Config Fields (7) | sf-metadata    | `force-app/main/default/objects/Smart_Grid_Config__mdt/fields/Enable_*.field-meta.xml` etc.              | ⬜     |
| LMS Channel       | sf-metadata    | `force-app/main/default/messageChannels/SmartGridChannel.messageChannel-meta.xml`                        | ⬜     |
| Seed CMDT (5)     | sf-metadata    | `force-app/main/default/customMetadata/Smart_Grid_Format_Rule.*.md-meta.xml`                             | ⬜     |
| Permission Set    | sf-permissions | `force-app/main/default/permissionsets/SmartGrid_User.permissionset-meta.xml`                            | ⬜     |

---

## Acceptance Criteria

### AC-00-1: Format Rule CMDT Deploys Successfully

- **Given** the metadata package contains `Smart_Grid_Format_Rule__mdt` with 10 fields
- **When** I run `sf project deploy start --dry-run`
- **Then** the deployment validates without errors

### AC-00-2: View Object Deploys Successfully

- **Given** the metadata package contains `Smart_Grid_View__c` with 6 fields (Private OWD, AutoNumber name)
- **When** I deploy to the sandbox
- **Then** the object appears in Setup > Object Manager with correct field definitions

### AC-00-3: Config Toggle Fields Added

- **Given** 7 new fields are added to `Smart_Grid_Config__mdt`
- **When** I view the existing `Account_Demo_Grid` CMDT record
- **Then** all toggles default to `true` (except `Enable_Reading_Pane__c` = `false`)

### AC-00-4: LMS Channel Deploys

- **Given** `SmartGridChannel.messageChannel-meta.xml` exists
- **When** deployed, LWC components can import `@salesforce/messageChannel/SmartGridChannel__c`
- **Then** the channel is available for publish/subscribe

### AC-00-5: Seed Format Rules Deployed

- **Given** 5 seed CMDT records exist in `customMetadata/`
- **When** deployed, an admin opens Setup > Custom Metadata Types > Smart Grid Format Rule
- **Then** all 5 seed rules are visible and active

### AC-00-6: Permission Set Updated

- **Given** `SmartGrid_User` permission set is updated
- **When** a user with this permission set accesses the grid
- **Then** they have CRUD on `Smart_Grid_View__c`, read access on `Smart_Grid_Format_Rule__mdt`, and access to new Apex classes

---

## Test Cases

| #        | Type     | Description                                               | Expected                                 |
| -------- | -------- | --------------------------------------------------------- | ---------------------------------------- |
| TC-00-P1 | Positive | Deploy full metadata package to sandbox                   | Clean deployment, no errors              |
| TC-00-P2 | Positive | Verify all 5 seed CMDT records in Setup                   | All records present and active           |
| TC-00-P3 | Positive | Verify config toggle defaults on existing record          | All `true` except Reading Pane (`false`) |
| TC-00-N1 | Negative | Remove a required field from Format Rule CMDT and deploy  | Deployment fails with validation error   |
| TC-00-N2 | Negative | User without SmartGrid_User perm set tries to create View | Access denied                            |

---

## Dependencies

- **REQUIRES**: Nothing (this is the root story)
- **BLOCKS**: ALL other stories (TS-01 through TS-12)

## Scoring Gates

| Skill       | Gate             | Target   |
| ----------- | ---------------- | -------- |
| sf-metadata | Metadata quality | ≥ 84/120 |

## Estimation

| Layer                            | Effort | Hours  |
| -------------------------------- | ------ | ------ |
| Metadata (objects, fields, CMDT) | Low    | 3h     |
| Seed Data (5 CMDT records)       | Low    | 1h     |
| LMS Channel                      | Low    | 0.5h   |
| Permission Set                   | Low    | 0.5h   |
| Validation & smoke test          | Low    | 1h     |
| **Total**                        |        | **6h** |
