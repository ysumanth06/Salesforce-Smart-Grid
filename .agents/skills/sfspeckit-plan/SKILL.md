---
name: sfspeckit-plan
description: "Create a Salesforce technical implementation plan from the feature spec. Includes force-app structure, deployment order, scoring gates, and Architect sign-off section. Run by the TPO."
---

# /sfspeckit-plan — Create Technical Implementation Plan

## Overview

This skill transforms a functional specification into a technical implementation plan. The plan defines the `force-app/` file structure, deployment order, scoring gates, and includes an Architect sign-off gate.

## Who Runs This

**TPO** (Technical Product Owner) — Architect must review and sign off before proceeding.

## Input

Optional tech stack guidance:
```
/sfspeckit-plan Use LWC with wire service, TAF triggers, and Batch Apex for nightly scoring
```

## Prerequisites

- Spec exists: `.sfspeckit/specs/NNN-feature-name/spec.md` (status: Clarified or Draft)
- Constitution exists: `.sfspeckit/memory/constitution.md`
- `sfdx-project.json` exists

## Steps

### Step 1: Read All Context

1. Read constitution from `.sfspeckit/memory/constitution.md`
2. Read spec from `.sfspeckit/specs/NNN-feature-name/spec.md`
3. Read `sfdx-project.json` for API version, package directories
4. Scan `force-app/main/default/` for existing objects, classes, LWC components
5. Check for existing data model patterns (naming conventions, trigger patterns)
6. Read user's tech stack guidance (if provided)

### Step 2: Run Constitution Check

Validate the spec against Constitution Articles I–IX:
- Article I: Are all objects/fields defined before code references?
- Article II: Are data volume estimates present?
- Article III: Is the automation approach decision table complete?
- Article IV: Is the security model defined?
- Article V: Is the PNB test pattern planned?
- Article VI: Are service/selector/domain layers identified?

If any checks fail, note them in the plan's "Constitution Check" section with specific remediation guidance.

### Step 3: Read Plan Template

Read `.sfspeckit/templates/plan-template.md` — this defines the plan structure.

### Step 4: Design the Technical Architecture

Based on the spec, determine:

1. **Data Model**: Define all custom objects, fields, relationships, and validation rules. Consider:
   - Field types (use Picklist over Text where values are constrained)
   - Lookup vs. Master-Detail relationships (cascade delete implications)
   - Auto Number vs. Name fields
   - Record types (if multiple business processes on same object)

2. **Apex Architecture**: Map to Separation of Concerns layers:
   - Trigger + Trigger Actions (TAF pattern) — one trigger per object
   - Service classes — business logic orchestration
   - Selector classes — all SOQL for an object
   - Domain classes — record validation, field calculation
   - Controller classes — `@AuraEnabled` methods only
   - Batch/Schedulable — async processing if needed

3. **Flow Architecture**: Identify:
   - Record-triggered flows (Before/After, on Create/Update/Delete)
   - Screen flows (user-facing wizards)
   - Autolaunched flows (background processing)
   - Flow interview callbacks

4. **LWC Architecture**: Identify:
   - Components with their target configs (Record Page, App Page, Home Page)
   - Wire vs. imperative Apex calls
   - Component communication patterns (events, LMS, parent-child)
   - SLDS 2 design tokens

5. **File Paths**: Map every artifact to its exact `force-app/` path.

### Step 5: Generate Plan Files

Create the following files:

#### `.sfspeckit/specs/NNN-feature-name/plan.md`
- Populate from the plan template
- Auto-fill technical context from `sfdx-project.json`
- Include deployment order (7 phases)
- Include scoring gates table
- Include Architect Sign-Off section (blank — architect fills this)
- Include environment strategy
- Include estimation summary

#### `.sfspeckit/specs/NNN-feature-name/data-model.md`
- Detailed object/field definitions
- Field-level metadata XML examples
- Relationship diagrams (consider using sf-diagram-mermaid)

#### `.sfspeckit/specs/NNN-feature-name/research.md` (optional)
- Only if technical research was needed
- Document findings, comparisons, decisions

### Step 6: Present Plan for Architect Review

Present the plan to the user with clear indication of:
- ⚠️ The **Architect Sign-Off** section is empty and MUST be completed
- The deployment order
- The scoring gates
- Any constitution violations or exceptions noted

Remind: "This plan requires Architect review. The 🏛️ Architect Sign-Off section must be completed before `/sfspeckit-tasks` can generate story files."

## Output

- **File created**: `.sfspeckit/specs/NNN-feature-name/plan.md`
- **File created**: `.sfspeckit/specs/NNN-feature-name/data-model.md`
- **File created**: `.sfspeckit/specs/NNN-feature-name/research.md` (optional)
- **Status**: Pending Architect Review

## Cross-Referenced Skills

- **sf-metadata**: Field type best practices, object relationship patterns
- **sf-apex**: Separation of Concerns layer patterns
- **sf-lwc**: PICKLES methodology, component architecture
- **sf-flow**: Flow type selection, bulkification patterns
- **sf-soql**: Query optimization patterns
- **sf-permissions**: Permission Set architecture
- **sf-integration**: Named Credential patterns (if integrations present)
- **sf-diagram-mermaid**: ERD and architecture diagram generation

## GATE

**The plan is NOT approved until the Architect Sign-Off section in plan.md is completed.** The `/sfspeckit-tasks` skill will check for this and warn if sign-off is missing.
