---
name: sfspeckit-clarify
description: "Walk through the 10-point Salesforce clarification checklist to fill gaps in the current feature specification. Run by the TPO after /sfspeckit-specify."
---

# /sfspeckit-clarify — Fill Specification Gaps

## Overview

This skill walks through a structured 10-point Salesforce-specific clarification checklist, resolving `[NEEDS CLARIFICATION]` markers and filling gaps in the feature specification.

## Who Runs This

**TPO** (Technical Product Owner) — often with BPO input for business questions.

## Prerequisites

- Specification exists in `.sfspeckit/specs/NNN-feature-name/spec.md`
- Constitution exists in `.sfspeckit/memory/constitution.md`

## Steps

### Step 1: Read Current State

1. Read the feature spec from `.sfspeckit/specs/NNN-feature-name/spec.md`
2. Identify all `[NEEDS CLARIFICATION]` markers
3. Read `.sfspeckit/templates/clarify-template.md` for the 10-point checklist

### Step 2: Walk Through the 10-Point Checklist

Present each question to the user one at a time. For each:
- State the question clearly
- Explain WHY it matters for Salesforce development
- Record the answer
- Identify the impact on the spec

**The 10 questions:**

1. **Org Architecture** — Single org or multi-org? (affects data sync, APIs)
2. **Data Migration** — Existing data to migrate? (affects Story-000 scope)
3. **External Integrations** — Callouts needed? (affects Named Credentials, callout limits)
4. **Sharing Model** — OWD settings? (affects record visibility, sharing rules)
5. **Managed Packages** — Installed packages that interact? (affects trigger order, conflicts)
6. **Flow vs. Apex** — Confirm automation approach decisions (Article III compliance)
7. **Experience Cloud** — Community/Portal exposure? (affects LWC targets, security)
8. **Mobile Compatibility** — Salesforce Mobile App support? (affects UI design)
9. **Agentforce Integration** — AI agent access? (affects `@InvocableMethod`, story decomposition)
10. **Multi-Currency / Multi-Language** — International support? (affects fields, labels)

### Step 3: Update the Specification

For each answered question:
1. Remove the corresponding `[NEEDS CLARIFICATION]` marker from spec.md
2. Update the relevant spec section (Platform Context, Security Model, Object Map, etc.)
3. Update the Clarification Status table in the spec

### Step 4: Check for Remaining Gaps

After all 10 questions:
- List any `[NEEDS CLARIFICATION]` markers still remaining
- Identify any new questions raised by the answers
- If all questions are resolved, mark the spec as CLARIFIED

### Step 5: Summarize

Present a summary to the user:
- Questions answered: X/10
- Spec sections updated: [list]
- Remaining clarifications: [list or "none"]
- Recommend next step: "Run `/sfspeckit-plan` to create the technical implementation plan"

## Output

- **File updated**: `.sfspeckit/specs/NNN-feature-name/spec.md` (clarifications applied)
- **Status**: Updated from Draft to Clarified (if all questions resolved)
