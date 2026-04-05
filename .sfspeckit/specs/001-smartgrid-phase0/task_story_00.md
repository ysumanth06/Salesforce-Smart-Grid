# Developer Story: 00 - Foundation & Data Model

## Meta
- **Feature**: 001-smartgrid-phase0
- **Story Link**: Foundation (Blocks All)
- **Status**: REVIEW
- **Started**: 2026-04-05
- **Completed**: 2026-04-05
- **Story Type**: FULL
- **Assignee**: Unassigned

## Requirements & Acceptance Criteria
**Overview**: Before UI or Controller logic can be built, the foundational Custom Metadata Types, Permission Sets, and the dynamic `GridQueryBuilder` Selector layer must be established.

- **Acceptance Scenarios**:
  - **Given** an admin configures the system, **When** they navigate to Custom Metadata Types, **Then** `Smart_Grid_Config__mdt` exists with all 8 defined fields.
  - **Given** an org setup, **Then** the `SmartGrid_User` permission set is deployable.
  - **Given** Apex execution, **When** `GridQueryBuilder.buildQuery()` is called for `Account`, **Then** it cleanly outputs a dynamic SAFE string with valid FLS checks mapped via schema describes.

## Test Cases
- **Positive**: Query builder outputs correct SOQL.
- **Negative**: Query builder rejects queries containing an invalid namespace or an inaccessible field via user schema checks.

## SF Implementation Layers & Skill Routing

| Layer | Skill to Invoke | Exact File Path | Status |
|-------|-----------------|-----------------|--------|
| Metadata | `sf-metadata` | `force-app/main/default/objects/Smart_Grid_Config__mdt/*` (inc. fields) | [x] |
| Metadata | `sf-metadata` | `force-app/main/default/customMetadata/Smart_Grid_Config.Account_Demo_Grid.md-meta.xml` | [x] |
| PermSet | `sf-permissions` | `force-app/main/default/permissionsets/SmartGrid_User.permissionset-meta.xml` | [x] |
| Apex | `sf-apex` | `force-app/main/default/classes/GridQueryBuilder.cls` | [x] |
| Test | `sf-testing` | `force-app/main/default/classes/GridQueryBuilderTest.cls` | [x] |

## Scoring Gates
- `sf-metadata`: 105 / 120 (Scored)
- `sf-apex`: 140 / 150 (Scored)

## Estimation
- **Metadata**: 2 Hours
- **Apex core**: 4 Hours
- **Total Points**: 3 (Medium)
