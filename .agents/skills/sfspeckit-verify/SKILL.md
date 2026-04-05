---
name: sfspeckit-verify
description: "QA story verification. Generates manual test scripts from acceptance criteria, runs automated Apex/Jest tests, creates a traceability matrix, and produces UAT scripts for BPO reviewers. Run by the QA tester."
---

# /sfspeckit-verify — QA Story Verification

## Overview

This skill helps QA testers verify a developer story by generating manual test scripts, running automated tests, and mapping results to acceptance criteria.

## Who Runs This

**QA Tester**

## Input

Path to the story file:
```
/sfspeckit-verify .sfspeckit/specs/001-invoice-mgmt/task_story_01.md
```

## Prerequisites

- Story status is **REVIEW** or higher (code review completed)
- Story code is deployed to QA Sandbox (`--target-org qa`)
- QA tester authenticated to QA org

## Steps

### Step 1: Read Story Context

1. Read the story file
2. Extract:
   - Acceptance criteria (Given/When/Then)
   - Test cases (Positive, Negative, Bulk)
   - Implementation layers (which Apex classes, LWC components, Flows)
   - Scoring gates

### Step 2: Generate Manual Test Scripts

Read `.sfspeckit/templates/test-scripts-template.md` and generate test scripts for each acceptance criterion:

For each acceptance criterion:
1. Convert Given/When/Then into step-by-step clickpath instructions
2. Create a table with columns: Step | Action | Expected Result | Pass/Fail | Notes
3. Add preconditions (user permissions, test data requirements)
4. Add cleanup instructions

For negative test cases:
- Generate scripts that verify error handling
- Include expected error messages

For bulk test cases:
- Generate scripts for data loader or trigger bulk scenarios
- Include governor limit verification steps

### Step 3: Run Automated Apex Tests

Execute Apex tests for classes listed in the story:

```bash
sf apex run test \
  --class-names [TestClass1,TestClass2,...] \
  --code-coverage \
  --result-format json \
  --target-org qa \
  --wait 10
```

Parse results:
- Extract pass/fail per method
- Extract code coverage per class
- Identify any compilation failures

### Step 4: Run Jest Tests (if LWC)

If the story includes LWC components:

```bash
npx lwc-jest -- --testPathPattern [componentName] --json
```

Parse results:
- Extract pass/fail per test
- Identify snapshot mismatches
- Report component render coverage

### Step 5: Build Traceability Matrix

Map every acceptance criterion to its test coverage:

| AC # | Description | Automated Test | Manual Script | Status |
|------|-------------|---------------|---------------|--------|
| AC-1 | [Brief] | TestClass.method ✅ | TC-001 ⏳ | Partial |
| AC-2 | [Brief] | — | TC-002 ⏳ | Manual Only |
| AC-3 | [Brief] | TestClass.method ❌ | — | Failed |

Highlight:
- ✅ ACs fully covered by automated tests
- ⏳ ACs requiring manual testing
- ❌ ACs with failing automated tests
- ⚠️ ACs with NO coverage (neither automated nor manual)

### Step 6: Generate UAT Scripts (For BPO)

Create business-language test scripts for BPO reviewers:
- No technical jargon (no "Apex", "SOQL", "LWC")
- Written as business process steps
- Expected outcomes in business terms
- Space for BPO sign-off

Example:
```markdown
### UAT-001: Create a New Invoice
1. Log into Salesforce and navigate to any customer's account page
2. Click the "New Invoice" button
3. Fill in the invoice amount and due date
4. Click "Save"
5. Verify the invoice appears in the customer's invoice list
```

### Step 7: Write Test Scripts File

Save all generated scripts to:
`.sfspeckit/specs/NNN-feature-name/task_story_NN_test_scripts.md`

### Step 8: Present QA Report

Show the QA tester:
- Automated test results (X/Y passed)
- Code coverage per class
- Manual test scripts generated (Count)
- Traceability matrix (coverage gaps highlighted)
- UAT scripts for BPO

### Step 9: Update Story File

Update the story file's QA Results section:
- **Test Scripts Generated**: link to test scripts file
- **Automated Tests**: X/Y passed
- **Manual Tests**: 0/Y (not yet executed — QA will fill this in manually)
- **Coverage**: X%
- Set **State** to `QA` (in QA testing)

## Output

- **File created**: `.sfspeckit/specs/NNN-feature-name/task_story_NN_test_scripts.md`
- **Content**: Manual test scripts, automated results, traceability matrix, UAT scripts
- **Story file updated**: Status → QA, QA results section populated

## Notes

- Manual test scripts require QA to EXECUTE them in the org and record Pass/Fail
- UAT scripts are for BPO reviewers in the UAT sandbox (separate phase)
- If automated tests fail, story should be returned to developer before manual testing
