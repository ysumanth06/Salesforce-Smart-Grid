# $STORY_ID — $STORY_TITLE

**Feature**: $FEATURE_NAME ([spec.md](../spec.md))
**Plan**: [plan.md](../plan.md)
**Constitution**: [constitution.md](../../../memory/constitution.md)
**Type**: $STORY_TYPE <!-- FULL | DECLARATIVE -->
**Priority**: $PRIORITY <!-- P1, P2, P3 -->

---

## Status

- **State**: DRAFT <!-- DRAFT | READY | IMPLEMENTING | REVIEW | QA | DONE -->
- **Assigned To**: [Developer Name]
- **Jira**: [PROJ-NNN]
- **Branch**: story/$FEATURE_NUMBER-$STORY_NUMBER-$STORY_SLUG
- **Started**: —
- **Completed**: —
- **Scores**: —

---

## Requirements

[Clear description of what this story delivers. Written in business language that a developer can understand without reading the full spec.]

---

## Acceptance Criteria

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]
3. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

## Test Cases

### Positive Tests ✅
- [Valid scenario 1] → [expected success outcome]
- [Valid scenario 2] → [expected success outcome]
- [Valid scenario with edge values] → [expected success outcome]

### Negative Tests ❌
- [Invalid input 1] → [expected error/validation message]
- [Unauthorized access] → [expected permission error]
- [Missing required data] → [expected error handling]

### Bulk Tests 📊
- [251+ records via trigger] → [all records processed correctly]
- [Batch boundary crossing] → [no governor limit exceptions]
- [Concurrent user scenario] → [no record locking errors]

---

## Dependencies

<!--
  Declare what this story requires from other stories (blocking dependencies)
  and what it is independent of (can run in parallel).
-->

- **REQUIRES**: task_story_00.md — [what specifically: objects, fields, perm sets, etc.]
- **REQUIRES**: [task_story_NN.md — only if this story depends on another non-foundation story]
- **INDEPENDENT OF**: [task_story_NN.md — can work in parallel with these stories]

---

## SF Implementation Layers

<!--
  Each row maps to a concrete file to create or modify.
  The developer uses /sfspeckit-implement with this story file.
  Skill references link to .agents/skills/sf-* for detailed guidance.
-->

| Layer | What to Build | SF Skill | File Path | Status |
|-------|-------------|----------|-----------|--------|
| Metadata | [Object/Field/ValidationRule] | sf-metadata | `force-app/main/default/objects/...` | [ ] |
| Apex | [ServiceClass.cls] | sf-apex | `force-app/main/default/classes/...` | [ ] |
| Apex | [SelectorClass.cls] | sf-apex | `force-app/main/default/classes/...` | [ ] |
| Apex | [TriggerAction.cls] | sf-apex | `force-app/main/default/classes/...` | [ ] |
| Apex Test | [ServiceClassTest.cls] | sf-apex | `force-app/main/default/classes/...` | [ ] |
| Flow | [FlowName] | sf-flow | `force-app/main/default/flows/...` | [ ] |
| LWC | [componentName] | sf-lwc | `force-app/main/default/lwc/...` | [ ] |
| LWC Test | [componentName.test.js] | sf-lwc | `force-app/main/default/lwc/.../\__tests__/...` | [ ] |
| PermSet | [PermissionSetName] | sf-metadata | `force-app/main/default/permissionsets/...` | [ ] |

<!--
  For DECLARATIVE stories, only include Metadata rows.
  Remove Apex, Flow, LWC rows that don't apply.
-->

---

## Scoring Gates

<!--
  Each layer must meet its scoring threshold before the story can proceed.
  Scoring is enforced by /sfspeckit-implement and /sfspeckit-pr.
-->

| Layer | SF Skill | Min Score | Target | Actual |
|-------|----------|-----------|--------|--------|
| Metadata | sf-metadata | 84/120 | 100/120 | — |
| Apex | sf-apex | 90/150 | 120/150 | — |
| LWC | sf-lwc | 125/165 | 145/165 | — |
| Coverage | sf-testing | 90% | 95% | — |

---

## Estimation

| Layer | Complexity | Estimated Effort |
|-------|-----------|-----------------|
| Metadata | [Low/Med/High] | [X hours] |
| Apex | [Low/Med/High] | [X hours] |
| Flow | [Low/Med/High] | [X hours] |
| LWC | [Low/Med/High] | [X hours] |
| Tests | [Low/Med/High] | [X hours] |
| **Total** | | **[X hours / Y story points]** |

### Complexity Factors
- [e.g., Uses standard CRUD patterns — low complexity]
- [e.g., External callout with retry logic — medium complexity]
- [e.g., Complex multi-object query with aggregation — high complexity]

---

## Developer Notes

<!--
  TPO and/or Architect can add implementation guidance, gotchas,
  or references to existing patterns in the codebase.
-->

- [e.g., Use @AuraEnabled(cacheable=false) for DML methods]
- [e.g., Follow TAF trigger pattern — see existing AccountTrigger for reference]
- [e.g., Reference InvoiceSelector from Story-000 for all Invoice__c queries]
- [e.g., This object has a validation rule blocking Status changes — test data must match criteria]

---

## Code Review Checklist

<!--
  Completed by peer reviewer + architect during /sfspeckit-pr.
-->

- [ ] Apex: Bulkification verified (no SOQL/DML in loops)
- [ ] Apex: `with sharing` used (or exception documented)
- [ ] Apex: `WITH USER_MODE` on all SOQL queries
- [ ] Apex: No hardcoded Salesforce IDs
- [ ] LWC: SLDS 2 compliant
- [ ] LWC: Keyboard accessible
- [ ] Tests: PNB pattern (Positive, Negative, Bulk 251+)
- [ ] Tests: Coverage ≥ 90%
- [ ] Tests: Test Data Factory used (no inline data creation)
- [ ] Tests: Assert class with descriptive messages
- [ ] Constitution: No violations (or justified in notes)

**Peer Reviewer**: [Name] — [ ] Approved
**Architect**: [Name] — [ ] Approved

---

## QA Results

<!--
  Completed by QA tester during /sfspeckit-verify.
-->

- **Test Scripts Generated**: [link to task_story_NN_test_scripts.md]
- **Automated Tests**: [X/Y passed]
- **Manual Tests**: [X/Y passed]
- **Coverage**: [X%]
- **QA Verdict**: [ ] PASS / [ ] FAIL
- **QA Tester**: [Name]
- **Date**: [Date]
