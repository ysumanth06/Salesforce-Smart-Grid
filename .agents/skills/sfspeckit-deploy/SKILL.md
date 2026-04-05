---
name: sfspeckit-deploy
description: "Promote Salesforce code through environments (Dev → QA → UAT → Prod). Validates all stories are complete, runs dry-run, and deploys in the correct Salesforce metadata dependency order."
---

# /sfspeckit-deploy — Environment Promotion

## Overview

This skill promotes the feature code through the environment pipeline: Dev → QA → UAT → Production. It validates prerequisites, runs dry-run validation, and deploys in the correct Salesforce metadata dependency order.

## Who Runs This

**TPO / Release Manager**

## Input

Target environment:
```
/sfspeckit-deploy qa
/sfspeckit-deploy uat
/sfspeckit-deploy prod
```

## Prerequisites

Depending on target environment:

| Target | Prerequisites |
|--------|--------------|
| `qa` | All stories merged to feature branch, code review completed |
| `uat` | QA verification passed, regression tests passed, scoring gates met |
| `prod` | BPO UAT sign-off completed, all stories DONE |

## Steps

### Step 1: Validate Prerequisites

#### For QA deployment:
- [ ] All story PRs merged to feature branch
- [ ] All story statuses are REVIEW or higher
- [ ] No failing tests in dev sandbox

#### For UAT deployment:
- [ ] All stories passed QA verification (`/sfspeckit-verify`)
- [ ] Regression tests passed (`/sfspeckit-regression`)
- [ ] Feature scoring meets thresholds (`/sfspeckit-score`)

#### For Production deployment:
- [ ] All stories in DONE state
- [ ] BPO UAT sign-off received (documented in story files)
- [ ] Architect final sign-off
- [ ] Release notes prepared

If any prerequisite fails → STOP and report what's missing.

### Step 2: Read Deployment Context

1. Read the plan for deployment order: `.sfspeckit/specs/NNN-feature-name/plan.md`
2. Read `sfdx-project.json` for source paths
3. Confirm target org alias is configured:
   ```bash
   sf org display --target-org $TARGET_ENV
   ```

### Step 3: Dry-Run Validation

ALWAYS run dry-run first:

```bash
sf project deploy start \
  --source-dir force-app \
  --target-org $TARGET_ENV \
  --test-level RunLocalTests \
  --dry-run \
  --wait 15
```

If dry-run fails:
- Parse error output
- Categorize errors: compilation, test failure, missing dependency
- Report with suggested fixes
- STOP — do not proceed to actual deployment

### Step 4: Deploy (if dry-run passes)

If deploying the entire source directory at once works (most cases):

```bash
sf project deploy start \
  --source-dir force-app \
  --target-org $TARGET_ENV \
  --test-level RunLocalTests \
  --wait 15
```

If metadata dependencies cause issues, deploy in phases using sf-deploy skill:

**Phase 1: Objects + Fields**
```bash
sf project deploy start \
  --source-dir force-app/main/default/objects \
  --target-org $TARGET_ENV \
  --test-level NoTestRun
```

**Phase 2: Permission Sets**
```bash
sf project deploy start \
  --source-dir force-app/main/default/permissionsets \
  --target-org $TARGET_ENV \
  --test-level NoTestRun
```

**Phase 3: Apex Classes + Tests**
```bash
sf project deploy start \
  --source-dir force-app/main/default/classes \
  --source-dir force-app/main/default/triggers \
  --target-org $TARGET_ENV \
  --test-level RunLocalTests
```

**Phase 4: Flows (as Draft)**
```bash
sf project deploy start \
  --source-dir force-app/main/default/flows \
  --target-org $TARGET_ENV \
  --test-level NoTestRun
```

**Phase 5: Activate Flows**
Reference sf-deploy skill for Flow activation commands.

**Phase 6: LWC Components**
```bash
sf project deploy start \
  --source-dir force-app/main/default/lwc \
  --target-org $TARGET_ENV \
  --test-level NoTestRun
```

### Step 5: Post-Deployment Verification

After successful deployment:

```bash
# Run all tests in the target org
sf apex run test \
  --test-level RunLocalTests \
  --code-coverage \
  --result-format json \
  --target-org $TARGET_ENV
```

Verify:
- All tests pass
- Coverage meets thresholds
- No unexpected failures

### Step 6: Update Story Statuses

If deploying to QA:
- Update story statuses to QA-READY

If deploying to UAT:
- Inform BPO that UAT environment is ready for validation
- Reference UAT test scripts from `/sfspeckit-verify` output

If deploying to Production:
- Update all story statuses to DONE
- Record deployment date
- Congratulate the team 🎉

### Step 7: Report

```markdown
## Deployment Report
- **Target**: $TARGET_ENV
- **Status**: ✅ SUCCESS / ❌ FAILED
- **Dry-run**: Passed
- **Tests**: XX/YY passed
- **Coverage**: XX%
- **Duration**: X minutes
- **Components Deployed**: XX
```

## Output

- **Deployment**: Code promoted to target environment
- **Story files updated**: Status updated based on target
- **Test results**: Post-deployment verification results

## Cross-Referenced Skills

- **sf-deploy**: Core deployment patterns, phased deployment, Flow activation
- **sf-testing**: Post-deployment test execution

## Error Handling

- **Dry-run failure**: Report errors, suggest fixes, do NOT proceed
- **Deployment failure**: Report error, check for locking/conflicts, suggest rollback
- **Test failure post-deploy**: Report failing tests, recommend investigation before promoting further

## Production Safety

For production deployments:
1. ALWAYS dry-run first
2. Deploy during maintenance window if possible
3. Have rollback plan ready (previous Git tag)
4. Monitor for 30 minutes post-deploy
5. Verify with smoke tests in production
