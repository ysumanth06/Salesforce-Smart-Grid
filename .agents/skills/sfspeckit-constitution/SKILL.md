---
name: sfspeckit-constitution
description: "Establish Salesforce project principles. Creates the project constitution with 9 Salesforce-specific articles. Run once per project by the TPO."
---

# /sfspeckit-constitution — Establish Project Principles

## Overview

This skill creates the project constitution — the immutable principles governing all Salesforce development. Run this **once per project** before any feature work begins. The constitution is referenced by every subsequent sfspeckit skill.

## Who Runs This

**TPO** (Technical Product Owner) — ideally with Architect input.

## Prerequisites

- Salesforce DX project initialized (`sfdx-project.json` exists)
- `.sfspeckit/` directory exists (created automatically)

## Steps

### Step 1: Read the Constitution Template

Read the constitution template from `.sfspeckit/templates/constitution-template.md`. This contains 9 Salesforce-specific articles:

1. **Article I: Metadata-First** — Features start with object/field definitions
2. **Article II: Governor-Limit Awareness** — Bulkification, 251-record testing
3. **Article III: Declarative-First** — Flow before Apex decision mandate
4. **Article IV: Security-by-Default** — `with sharing`, `WITH USER_MODE`, no hardcoded IDs
5. **Article V: PNB Test-First** — Positive/Negative/Bulk pattern, Test Data Factory
6. **Article VI: Separation of Concerns** — TAF, Service/Selector/Domain layers
7. **Article VII: Deployment Safety** — Dry-run first, deploy order, Permission Sets
8. **Article VIII: Agent Architecture** — Topic/action patterns, deactivate-before-modify
9. **Article IX: Cross-Skill Orchestration** — Skill dependency ordering, scoring gates

### Step 2: Check for Existing Constitution

Check if `.sfspeckit/memory/constitution.md` already exists.
- If yes: ask the user if they want to update or replace it.
- If no: proceed with creation.

### Step 3: Gather Project-Specific Context

Ask the user the following contextual questions to customize the constitution:

1. **Project name**: What is this project called?
2. **Team size**: How many developers will work on this project?
3. **Org type**: Production, Sandbox, or Scratch Org development?
4. **Installed packages**: Any managed packages (TAF, CPQ, DocGen, etc.)?
5. **Custom additions**: Any project-specific principles to add? (e.g., "All components must support dark mode", "No Platform Events without Architect approval")
6. **Article overrides**: Any articles to relax or strengthen? (e.g., "Article III: We use Apex primarily, Flows only for simple automations")
7. **Scoring thresholds**: Accept default scoring gates (sf-metadata 84/120, sf-apex 90/150, sf-lwc 125/165, sf-testing 108/120) or customize?

### Step 4: Generate the Constitution

Using the template and the user's answers:

1. Copy `.sfspeckit/templates/constitution-template.md` to `.sfspeckit/memory/constitution.md`
2. Replace `$PROJECT_NAME` with the project name
3. Replace `$DATE` with today's date
4. Replace `$AUTHOR` with the user's name or "TPO"
5. Apply any article overrides or additions from Step 3
6. Update scoring thresholds if customized

### Step 5: Confirm with the User

Present the generated constitution to the user for review. Highlight:
- Any articles that were customized
- Any custom additions
- Scoring gate thresholds

Ask: "Does this constitution look correct? Any changes needed?"

### Step 6: Finalize

Once confirmed:
- Save `.sfspeckit/memory/constitution.md`
- Inform the user: "Constitution established. All sfspeckit skills will reference this document."
- Suggest next step: "Run `/sfspeckit-specify <feature description>` to create your first specification."

## Output

- **File created**: `.sfspeckit/memory/constitution.md`
- **Content**: 9 Salesforce articles with project-specific customizations
- **Status**: Active, version 1.0

## Notes

- The constitution is referenced by ALL other sfspeckit skills
- It should rarely change — use the Amendment Process (documented in the constitution) for modifications
- The constitution is GUIDED (recommended with exception paths), not absolute
