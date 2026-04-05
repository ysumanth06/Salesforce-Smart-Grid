---
name: sfspeckit-pr
description: "Prepare a pull request for a completed story. Runs all scoring gates, generates PR description from the story file, and creates a code review checklist for peer and architect review."
---

# /sfspeckit-pr — Prepare Code Review

## Overview

This skill prepares a developer's completed story for peer review and architect approval. It runs all scoring gates, generates a PR description from the story file, and creates a structured review checklist.

## Who Runs This

**Developer** — after completing `/sfspeckit-implement`.

## Input

Path to the story file:
```
/sfspeckit-pr .sfspeckit/specs/001-invoice-mgmt/task_story_01.md
```

## Prerequisites

- Story status is **IMPLEMENTED** (completed by /sfspeckit-implement)
- Story branch exists: `story/$FEATURE_NUMBER-$STORY_NUMBER-$STORY_SLUG`
- All implementation layers are marked `[x]` in the story file

## Steps

### Step 1: Read Story Context

1. Read the story file
2. Verify status is IMPLEMENTED
3. Identify all files created/modified (from the Implementation Layers table)

### Step 2: Run All Scoring Gates

Execute scoring for every artifact layer in this story:

**Metadata scoring** (if story has metadata):
- Invoke sf-metadata scoring logic against objects/fields created
- Target: ≥ 84/120

**Apex scoring** (if story has Apex):
- Invoke sf-apex scoring logic against all Apex classes
- Check for:
  - Bulkification compliance (no SOQL/DML in loops)
  - Security (`with sharing`, `WITH USER_MODE`)
  - No hardcoded IDs
  - Proper error handling
  - SOLID principles adherence
- Target: ≥ 90/150

**LWC scoring** (if story has LWC):
- Invoke sf-lwc scoring logic (PICKLES methodology)
- Check for:
  - SLDS 2 compliance
  - Accessibility (keyboard nav, ARIA labels)
  - Performance (wire service, lazy loading)
- Target: ≥ 125/165

**Test coverage**:
- Run Apex tests: `sf apex run test --class-names [classes] --code-coverage --target-org dev`
- Run Jest tests: `npx lwc-jest -- --testPathPattern [component]`
- Target: ≥ 90% coverage

### Step 3: Generate PR Description

Create a PR description from the story file content:

```markdown
## Story: $STORY_ID — $STORY_TITLE

**Jira**: $JIRA_LINK
**Type**: $STORY_TYPE (FULL / DECLARATIVE)
**Branch**: story/$BRANCH → feature/$FEATURE_BRANCH

### Requirements
[Extract from story's Requirements section]

### Acceptance Criteria
[Extract from story's Acceptance Criteria]

### Files Changed
| File | Type | Action |
|------|------|--------|
| [file path] | [Apex/LWC/Flow/Metadata] | [Created/Modified] |

### Scoring Results
| Layer | Score | Threshold | Status |
|-------|-------|-----------|--------|
| sf-metadata | X/120 | 84 | ✅/❌ |
| sf-apex | X/150 | 90 | ✅/❌ |
| sf-lwc | X/165 | 125 | ✅/❌ |
| Coverage | X% | 90% | ✅/❌ |

### Test Results
- Apex tests: X/Y passed
- Jest tests: X/Y passed
- Coverage: X%

### Dependencies
[Extract from story's Dependencies section]
```

### Step 4: Generate Code Review Checklist

Create the review checklist for the PR:

```markdown
## Code Review Checklist

### Apex Review (Peer + Architect)
- [ ] **Bulkification**: No SOQL or DML inside loops
- [ ] **Sharing**: `with sharing` used on all classes (or exception documented)
- [ ] **SOQL Security**: `WITH USER_MODE` or `WITH SECURITY_ENFORCED` on all queries
- [ ] **No Hardcoded IDs**: No 15/18-char record IDs in code
- [ ] **No Hardcoded URLs**: Using NavigationMixin or custom settings
- [ ] **Error Handling**: Try-catch with meaningful error messages
- [ ] **Layer Separation**: Service ≠ Selector ≠ Controller ≠ Trigger
- [ ] **Naming Conventions**: Match team standards from constitution

### LWC Review (Peer + Architect)
- [ ] **SLDS 2**: Using Lightning Design System tokens and components
- [ ] **Accessibility**: Keyboard navigation, ARIA labels, screen reader compatible
- [ ] **Performance**: Wire service for reads, imperative for writes
- [ ] **No Direct DML**: LWC never calls DML directly (always via Apex controller)
- [ ] **Error Handling**: Toast messages for user-facing errors

### Test Review (Peer)
- [ ] **PNB Pattern**: Positive, Negative, and Bulk tests present
- [ ] **Bulk Test**: 251+ records tested (crosses batch boundary)
- [ ] **TestDataFactory**: No inline test data creation
- [ ] **Assert Class**: Using `Assert.areEqual()` with descriptive messages
- [ ] **Coverage**: ≥ 90% on all production classes
- [ ] **SeeAllData**: `@IsTest(SeeAllData=false)` on all test classes

### General Review (Architect)
- [ ] **Constitution Compliance**: No violations of Articles I–IX
- [ ] **Scope**: Changes don't exceed story boundaries
- [ ] **Performance**: No N+1 query patterns, efficient Apex collections
- [ ] **Deployment Safety**: Safe to deploy in the defined deployment order
```

### Step 5: Present Results

Show the developer:
- Scoring results (pass/fail per gate)
- Generated PR description (ready to paste)
- Code review checklist
- If any scoring gates fail → list specific improvements needed before PR

### Step 6: Update Story File

Update the story file:
- Set **State** to `REVIEW`
- Update **Scoring Gates** section with actual scores

## Output

- **PR description**: Generated markdown ready to paste into Git PR
- **Code review checklist**: Structured reviewer guide
- **Story file updated**: Status → REVIEW, scores recorded
- **Scoring results**: Pass/fail for each gate

## GATE

**PR must be approved by BOTH a Peer Developer AND the Architect before merging to the feature branch.** This ensures code quality, security compliance, and architectural consistency.
