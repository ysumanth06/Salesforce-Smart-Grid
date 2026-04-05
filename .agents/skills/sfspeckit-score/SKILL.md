---
name: sfspeckit-score
description: "Comprehensive quality scoring dashboard across all stories in a feature. Runs all SF skill scoring systems and produces a combined quality report with per-story and per-layer breakdowns."
---

# /sfspeckit-score — Quality Scoring Dashboard

## Overview

This skill produces a comprehensive quality scoring dashboard by running all SF skill scoring systems against the feature's codebase.

## Who Runs This

**QA Tester** or **Architect** — for quality assessment.

## Prerequisites

- Feature code exists in `force-app/`
- Story files exist in `.sfspeckit/specs/NNN-feature-name/`

## Steps

### Step 1: Identify Feature Scope

1. Read all story files in `.sfspeckit/specs/NNN-feature-name/`
2. Collect all artifacts per story (Apex classes, LWC components, metadata)
3. Build a complete file inventory for the feature

### Step 2: Run Metadata Scoring

For each custom object created/modified by this feature:
- Invoke sf-metadata scoring logic (`.agents/skills/sf-metadata/SKILL.md`)
- Score across 6 categories (120 points max):
  - Field definitions (types, required, descriptions)
  - Relationship design (lookup vs. master-detail)
  - Permission Sets (FLS coverage)
  - Naming conventions
  - Validation rules
  - Documentation

### Step 3: Run Apex Scoring

For each Apex class created/modified:
- Invoke sf-apex scoring logic (`.agents/skills/sf-apex/SKILL.md`)
- Score across 7 categories (150 points max):
  - Bulkification compliance
  - Security (sharing, user mode, no hardcoded IDs)
  - SOLID principles
  - Error handling
  - Naming conventions
  - Documentation/comments
  - Performance optimization

### Step 4: Run LWC Scoring

For each LWC component created/modified:
- Invoke sf-lwc scoring logic (`.agents/skills/sf-lwc/SKILL.md`)
- Score using PICKLES methodology (165 points max):
  - Performance
  - Interoperability
  - Consistency
  - Knowledge (documentation)
  - Lifecycle management
  - Error handling
  - Security

### Step 5: Run Test Scoring

Invoke sf-testing scoring logic (`.agents/skills/sf-testing/SKILL.md`):
- Score across 6 categories (120 points max):
  - PNB pattern compliance
  - TestDataFactory usage
  - Assert class with messages
  - SeeAllData=false compliance
  - Coverage percentage
  - Bulk test presence (251+)

### Step 6: Generate Combined Dashboard

```markdown
## 📊 Quality Scoring Dashboard: Feature NNN-feature-name

### Overall Feature Score
| Category | Max | Actual | % | Status |
|----------|-----|--------|---|--------|
| Metadata | 120 | XX | XX% | ✅/❌ |
| Apex | 150 | XX | XX% | ✅/❌ |
| LWC | 165 | XX | XX% | ✅/❌ |
| Testing | 120 | XX | XX% | ✅/❌ |
| **Total** | **555** | **XX** | **XX%** | **✅/❌** |

### Per-Story Breakdown
| Story | Status | Metadata | Apex | LWC | Testing | Total |
|-------|--------|----------|------|-----|---------|-------|
| Story-000 | DONE ✅ | 98/120 | 85/150 | — | 110/120 | 293 |
| Story-001 | QA ⏳ | — | 125/150 | 142/165 | 108/120 | 375 |
| Story-002 | REVIEW ⏳ | — | 95/150 | — | 100/120 | 195 |

### Top Improvements Needed
1. [Story-002] Apex scoring: Add error handling to InvoiceProcessor (+15 pts)
2. [Story-001] LWC scoring: Add ARIA labels to invoiceCreator (+10 pts)
3. [Story-000] Metadata: Add field descriptions to Invoice__c fields (+8 pts)

### Code Coverage Summary
| Class | Coverage | Target | Status |
|-------|----------|--------|--------|
| InvoiceService | 95% | 90% | ✅ |
| InvoiceProcessor | 88% | 90% | ❌ |
| InvoiceController | 92% | 90% | ✅ |
| Overall | 91% | 90% | ✅ |

### Story Status Summary
| Status | Count |
|--------|-------|
| DONE | X |
| QA | X |
| REVIEW | X |
| IMPLEMENTING | X |
| READY | X |
| DRAFT | X |
```

### Step 7: Determine Feature Readiness

- If ALL scoring gates pass and ALL stories are DONE → "Feature is ready for `/sfspeckit-deploy qa`"
- If any gates fail → list specific improvements needed before deployment
- If any stories are not DONE → list pending stories

## Output

- **Quality dashboard**: Displayed with per-story and per-layer breakdowns
- **Top improvements**: Actionable list of specific changes to increase scores
- **Feature readiness**: READY or NOT READY with specific blockers
