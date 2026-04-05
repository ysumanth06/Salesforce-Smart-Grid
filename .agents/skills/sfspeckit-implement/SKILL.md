---
name: sfspeckit-implement
description: "Implement a specific Salesforce developer story file. Reads the story, invokes SF skills in deployment order, runs scoring gates, and marks tasks complete. Run by the developer."
---

# /sfspeckit-implement — Implement a Developer Story

## Overview

This skill implements a single developer story by reading the story file and building each layer in Salesforce deployment order, invoking the appropriate SF skills at each step.

## Who Runs This

**Developer** — each developer implements their assigned story.

## Input

Path to the story file:
```
/sfspeckit-implement .sfspeckit/specs/001-invoice-mgmt/task_story_01.md
```

## Prerequisites

- Story file exists and status is **READY** (approved by /sfspeckit-review)
- Constitution exists: `.sfspeckit/memory/constitution.md`
- Plan exists in the same feature directory
- Dependencies are met (Story-000 must be DONE for non-foundation stories)
- Developer has authenticated to Dev Sandbox: `sf org login web --alias dev`

## Steps

### Step 1: Read All Context

1. Read the story file provided as input
2. Read the constitution from `.sfspeckit/memory/constitution.md`
3. Read the plan from the same feature directory (`plan.md`)
4. Read the data model (`data-model.md`) for object/field definitions
5. Read `sfdx-project.json` for API version

### Step 2: Validate Prerequisites

Check the following before starting:

1. **Story status**: Must be READY (not DRAFT or already IMPLEMENTING)
2. **Dependencies**: Check each REQUIRES dependency:
   - Read the required story file
   - Verify its status is DONE or IMPLEMENTING
   - If not met → STOP and inform: "Dependency task_story_00.md is not yet complete"
3. **Constitution**: Verify constitution.md exists
4. **Environment**: Confirm target org is Dev Sandbox (`--target-org dev`)

### Step 3: Update Story Status

Update the story file:
- Set **State** to `IMPLEMENTING`
- Set **Started** to today's date

### Step 4: Create Story Branch

```bash
git checkout -b story/$FEATURE_NUMBER-$STORY_NUMBER-$STORY_SLUG
```

If the feature branch exists and Story-000 has been merged, branch from the updated feature branch.

### Step 5: Implement Layers in Deployment Order

Read the **SF Implementation Layers** table from the story file. Execute each layer in order:

#### Phase 1: Metadata (if applicable)
- Read the sf-metadata skill: `.agents/skills/sf-metadata/SKILL.md`
- Create/modify custom objects, fields, validation rules, permission sets
- File paths from the story's implementation layers table
- Check: mark `[ ]` → `[x]` in the story's layer table
- **Scoring gate**: Run sf-metadata scoring → must meet 84/120 minimum

#### Phase 2: Apex (if applicable)
- Read the sf-apex skill: `.agents/skills/sf-apex/SKILL.md`
- Create classes in order: Selector → Service → TriggerAction → Controller
- Follow Separation of Concerns (Article VI):
  - Selector: All SOQL queries, `WITH USER_MODE`
  - Service: Business logic, no SOQL/DML directly
  - TriggerAction: TAF handler, dispatched from trigger
  - Controller: `@AuraEnabled` methods only, delegates to Service
- Create test classes following PNB pattern (Article V):
  - Positive tests: Valid inputs → success
  - Negative tests: Invalid inputs → proper error handling
  - Bulk tests: 251+ records → no governor limit exceptions
  - Use TestDataFactory (from Story-000)
- Check: mark `[ ]` → `[x]` in the story's layer table
- **Scoring gate**: Run sf-apex scoring → must meet 90/150 minimum

#### Phase 3: Flow (if applicable)
- Read the sf-flow skill: `.agents/skills/sf-flow/SKILL.md`
- Create flow definition files
- Deploy as Draft first, then activate after validation
- Check: mark `[ ]` → `[x]` in the story's layer table
- **Scoring gate**: Run sf-flow scoring → must meet minimum

#### Phase 4: LWC (if applicable)
- Read the sf-lwc skill: `.agents/skills/sf-lwc/SKILL.md`
- Follow PICKLES methodology
- Create component files: .html, .js, .css, .js-meta.xml
- Create Jest test files in `__tests__/` directory
- Ensure SLDS 2 compliance, keyboard accessibility
- Check: mark `[ ]` → `[x]` in the story's layer table
- **Scoring gate**: Run sf-lwc scoring → must meet 125/165 minimum

### Step 6: Run Full Story Tests

After all layers are implemented:

1. Read the sf-testing skill: `.agents/skills/sf-testing/SKILL.md`
2. Run Apex tests for this story's classes:
   ```bash
   sf apex run test --class-names [TestClass1,TestClass2] --code-coverage --result-format json --target-org dev
   ```
3. Run Jest tests (if LWC present):
   ```bash
   npx lwc-jest -- --testPathPattern [componentName]
   ```
4. Verify coverage meets story's scoring gates
5. Update the story's **Scoring Gates** section with actual scores

### Step 7: Scoring Gate Validation

Compare actual scores with story thresholds:
- If ALL gates pass → proceed
- If any gate FAILS → STOP and inform developer:
  - Which gate failed
  - Current score vs. minimum
  - Specific improvements needed
  - Re-run after fixes

### Step 8: Update Story File

Update the story file:
- Mark all implementation layer checkboxes as `[x]`
- Update **Scoring Gates** with actual scores
- Set **State** to `IMPLEMENTED`
- Set **Completed** to today's date (implementation date, not QA date)

### Step 9: Summary

Inform the developer:
- Layers completed: X/Y
- All scoring gates: PASS/FAIL
- Files created: [list]
- Suggest: "Run `/sfspeckit-pr` to prepare the code for review"

## Output

- **Files created**: All force-app/ files listed in the story's implementation layers
- **Story file updated**: Status → IMPLEMENTED, all layers marked complete, scores recorded
- **Branch**: `story/$FEATURE_NUMBER-$STORY_NUMBER-$STORY_SLUG`

## Cross-Referenced Skills

Invoked in order during implementation:
1. **sf-metadata** — Custom objects, fields, permission sets
2. **sf-apex** — Apex classes with 150-pt scoring
3. **sf-flow** — Flow definitions with 110-pt scoring
4. **sf-lwc** — LWC components with PICKLES + 165-pt scoring
5. **sf-testing** — Test execution and coverage analysis

## Error Handling

- **Dependency not met**: Stop with clear message about which story needs to complete first
- **Scoring gate failure**: Stop, report score gap, suggest fixes, allow re-run
- **Git branch conflict**: Warn and suggest resolving before continuing
- **Compilation error**: Report error, suggest fix, allow retry
