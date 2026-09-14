# Functional Specification: Phase 3 — AI Smart Grid

**Feature Number**: 004
**Feature Slug**: 004-smartgrid-phase3
**API Version**: 65.0
**Date**: 2026-04-20
**Status**: Draft

---

## Overview

Phase 3 elevates the Smart Grid into an **AI-powered data management platform** by integrating natural language processing, intelligent data quality analysis, and conversational assistance. This phase leverages the existing `GridQueryBuilder` architecture (designed for AI reuse since Phase 0) and connects it to Salesforce's Einstein / Agentforce ecosystem. The culmination is AppExchange readiness with managed packaging, licensing, and security review.

### What's Already Done (Phase 0–2 Baseline)

All capabilities from Phase 0, Phase 1, and Phase 2 form the prerequisite foundation. Specifically:

- **`GridQueryBuilder`** with `@InvocableMethod` annotation — designed from Day 1 for AI-driven SOQL generation
- **Pagination, filtering, sorting** — all parameterized and server-validated
- **CRUD/FLS/Sharing enforcement** at every layer
- **LMS integration** for cross-component communication (Phase 2)
- **Conditional formatting, reading pane, and saved views** (Phase 2)

---

## Platform Context

- **Target Org Type**: Managed Package (ISV / AppExchange)
- **API Version**: 65.0
- **Source Path**: `force-app`
- **Einstein Dependencies**: Einstein Generative AI (Prompt Builder), Agentforce Platform
- **Licensing Model**: Per-org or per-user (TBD based on AppExchange strategy)
- **Namespace**: Required for managed package — `[NEEDS CLARIFICATION: namespace prefix]`
- **Data Volume**: Enterprise-scale — 100K+ record datasets supported via cursor pagination
- **Exclusions**: No Mobile app support in initial release

---

## 🚀 User Stories

### P1 — Critical

| ID           | Title                        | Description                                                                                                                                                                                              |
| ------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US-P3-01** | **NLP Command Bar**          | As a User, I want to type natural language commands (e.g., "Show accounts with revenue > 1M in California") into a command bar and have the grid instantly filter and display matching records.          |
| **US-P3-02** | **AI → SOQL Translation**    | As a Developer, I want the NLP engine to translate natural language into parameterized SOQL via `GridQueryBuilder` so that all queries go through the existing security validation pipeline.             |
| **US-P3-03** | **Bulk Update via NLP**      | As a Power User, I want to type commands like "Set all selected accounts' Rating to Hot" and have the grid apply the update after showing a confirmation dialog with the affected record count.          |
| **US-P3-04** | **Data Quality Suggestions** | As a Data Steward, I want the AI to analyze the current grid data and suggest improvements — highlighting null fields, potential duplicates, inconsistent casing, and data patterns that suggest errors. |

### P2 — High

| ID           | Title                                 | Description                                                                                                                                                                                                    |
| ------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US-P3-05** | **Conversational Assistant**          | As a User, I want an embedded chat panel alongside the grid where I can ask questions about my data (e.g., "What's the average deal size for Q1?") and receive instant answers computed from the live dataset. |
| **US-P3-06** | **Einstein / Agentforce Integration** | As an Admin, I want to configure the Smart Grid as an Agentforce action so that AI agents can query, filter, and update grid data through standard Agentforce topic/action patterns.                           |
| **US-P3-07** | **Smart Suggestions (Auto-Complete)** | As a User, I want the command bar to suggest auto-completions based on the object schema, recently used filters, and common query patterns — reducing typing and errors.                                       |
| **US-P3-08** | **Telemetry & Usage Analytics**       | As a Product Owner, I want to track which grid features users use most frequently, which objects are queried, average session duration, and error rates so I can prioritize future improvements.               |

### P3 — AppExchange Readiness

| ID           | Title                          | Description                                                                                                                                                                                                    |
| ------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US-P3-09** | **Managed Package Structure**  | As a Release Manager, I want the Smart Grid packaged as a managed Salesforce package with proper namespace isolation, version numbering, and upgrade paths.                                                    |
| **US-P3-10** | **Security Review Compliance** | As an ISV, I want the package to pass the AppExchange Security Review with zero findings — covering CRUD/FLS enforcement, SOQL injection prevention, CSP compliance, and sensitive data handling.              |
| **US-P3-11** | **Licensing & Feature Gating** | As a Business Owner, I want to gate premium features (NLP, AI suggestions, conversational assistant) behind a license check so that free-tier users get the core grid while paid users unlock AI capabilities. |
| **US-P3-12** | **In-App Help & Onboarding**   | As a New User, I want guided walkthroughs and contextual help tooltips so that I can learn the Smart Grid's features without external documentation.                                                           |

---

## 🛠️ Data Model Enhancements

### New: Smart_Grid_AI_Config\_\_mdt (AI Settings)

| Field Name                | Type                  | Description                                                          |
| ------------------------- | --------------------- | -------------------------------------------------------------------- |
| `Grid_Config__c`          | Metadata Relationship | Links to parent `Smart_Grid_Config__mdt`                             |
| `Enable_NLP__c`           | Checkbox              | Enable/disable NLP command bar per grid                              |
| `Enable_Suggestions__c`   | Checkbox              | Enable data quality suggestions                                      |
| `Enable_Chat__c`          | Checkbox              | Enable conversational assistant                                      |
| `Prompt_Template__c`      | Text (255)            | Name of the `PromptTemplate` metadata record for NLP translation     |
| `Max_Tokens__c`           | Number (4, 0)         | Token limit for AI responses                                         |
| `Confidence_Threshold__c` | Number (3, 2)         | Minimum confidence score (0.00–1.00) for auto-executing NLP commands |

### New: Smart_Grid_Telemetry\_\_c (Platform Event)

| Field Name           | Type          | Description                                                              |
| -------------------- | ------------- | ------------------------------------------------------------------------ |
| `User_Id__c`         | Text (18)     | User who triggered the event                                             |
| `Object_API_Name__c` | Text (80)     | Grid object context                                                      |
| `Action__c`          | Text (40)     | Event type: `query`, `save`, `delete`, `export`, `nlp_command`, `filter` |
| `Duration_Ms__c`     | Number (8, 0) | Operation duration in milliseconds                                       |
| `Record_Count__c`    | Number (8, 0) | Number of records affected                                               |
| `NLP_Input__c`       | Text (1000)   | Raw NLP command text (if applicable)                                     |
| `Error_Message__c`   | Text (500)    | Error text if operation failed                                           |

### New: Smart_Grid_License\_\_mdt (Feature Gating)

| Field Name          | Type      | Description                                                    |
| ------------------- | --------- | -------------------------------------------------------------- |
| `Feature_Name__c`   | Text (80) | Feature identifier (e.g., `NLP_COMMAND_BAR`, `AI_SUGGESTIONS`) |
| `Is_Premium__c`     | Checkbox  | Whether this feature requires a paid license                   |
| `Is_Enabled__c`     | Checkbox  | Global enable/disable toggle                                   |
| `Permission_Set__c` | Text (80) | Required Permission Set for access                             |

---

## 🏗️ Technical Architecture Changes

### 1. NLP Command Engine (New Apex + Prompt Template)

- **`SmartGridNLPEngine.cls`**: Receives raw text from the LWC command bar, sends it to Einstein Generative AI via `PromptTemplate`, and parses the structured SOQL response.
- **Prompt Template**: A `PromptTemplate` metadata record that instructs the LLM to translate natural language into a structured JSON object containing: `{ objectApiName, fields, filters, sortField, sortDirection, limit }`.
- **Security**: The NLP engine's output is **never executed directly**. It is always passed through `GridQueryBuilder.buildQuery()` for validation, FLS checks, and injection prevention. The AI output is treated as untrusted input.
- **Confidence Gate**: If the LLM's confidence score is below the configured threshold, the command is shown to the user for confirmation before execution.

### 2. Bulk NLP DML (Apex Service)

- **`SmartGridNLPDMLHandler.cls`**: Parses NLP update/delete commands into structured DML operations.
- **Confirmation Pattern**: NLP DML commands always trigger a confirmation modal showing:
  - Number of records affected
  - Fields being modified
  - Before/after preview (first 5 rows)
  - "Apply" / "Cancel" buttons
- **Execution**: Delegates to existing `SmartGridController.saveRecords()` / `deleteRecords()` — no bypass of security pipeline.

### 3. Data Quality Analyzer (Apex + LWC)

- **`SmartGridDataQualityService.cls`**: Analyzes the current grid dataset and returns quality metrics:
  - **Null Analysis**: Fields with >50% null values
  - **Duplicate Detection**: Fuzzy matching on Name/Email fields (Levenshtein distance)
  - **Inconsistent Casing**: Mixed case values in the same picklist field
  - **Outlier Detection**: Numeric values >3 standard deviations from mean
- **LWC**: `smartGridDataQuality` child component renders a side panel with quality cards, each containing a list of affected records and a "Fix" action.

### 4. Conversational Assistant (LWC)

- **`smartGridAssistant`**: Embedded chat panel using a local message history.
- **Backend**: Routes questions through `SmartGridNLPEngine` to generate aggregate SOQL queries, then formats results as natural language responses.
- **Context Awareness**: The assistant knows the current object, active filters, and visible columns — it can answer contextual questions.

### 5. Agentforce Integration (GenAiPlugin)

- **`GenAiPlugin: SmartGridAgent`**: Registers the Smart Grid as an Agentforce action.
- **Topics**: `SmartGrid_Query`, `SmartGrid_Update`, `SmartGrid_Analyze`.
- **Actions**: Each topic maps to existing controller methods via `@InvocableMethod` annotations on `GridQueryBuilder`.
- **Reuse**: The `@InvocableMethod` on `GridQueryBuilder.query()` (already annotated in Phase 0) becomes the primary entry point.

### 6. Telemetry Layer (Platform Events)

- **Pattern**: Fire-and-forget Platform Events on every significant user action.
- **Consumer**: A trigger or flow subscriber aggregates events into a reporting custom object or external analytics platform.
- **Privacy**: No PII in telemetry events — only User IDs, object names, and action types.

### 7. AppExchange Packaging

- **Namespace**: TBD — required for managed package isolation.
- **Versioning**: Semantic versioning (`v2.0.0` for Phase 2 baseline, `v3.0.0` for AI release).
- **Upgrade Scripts**: `PostInstallClass` and `UninstallClass` for data migration and cleanup.
- **Security Review Checklist**:
  - [ ] All CRUD/FLS enforced (already done)
  - [ ] No hardcoded IDs (already enforced by constitution)
  - [ ] CSP-compliant (no external requests without Remote Site Settings)
  - [ ] Managed sharing model
  - [ ] `without sharing` justification log (none expected)
  - [ ] Lightning Locker / LWS compliance verified

### 8. License Check Utility

- **`SmartGridLicenseService.cls`**: Checks `Smart_Grid_License__mdt` and the user's assigned Permission Sets to determine feature access.
- **LWC Integration**: `@wire` the license check on component init; conditionally render premium features.

---

## ✅ Acceptance Criteria

### NLP Command Bar

- [ ] Typing "Show accounts in California with revenue > 1M" returns matching records.
- [ ] The command bar shows auto-suggestions based on object schema.
- [ ] Invalid or ambiguous commands show a "Could not understand" message with suggestions.
- [ ] Generated SOQL is displayed in a collapsible "Debug" section for transparency.

### Bulk NLP Updates

- [ ] Typing "Set Rating to Hot for selected rows" shows a confirmation modal.
- [ ] Confirming the action updates the records and refreshes the grid.
- [ ] Canceling the action makes no changes.
- [ ] Updates go through `stripInaccessible()` and `Database.update(records, false)`.

### Data Quality

- [ ] Quality panel shows null percentage per field for the current dataset.
- [ ] Duplicate suggestions highlight rows with similar Name/Email values.
- [ ] Clicking "Fix" on a quality card opens the record for editing.

### Conversational Assistant

- [ ] Asking "What's the total revenue?" returns a computed answer.
- [ ] Chat history persists during the session (cleared on page refresh).
- [ ] The assistant refuses to answer non-data questions ("I can only help with your grid data").

### Agentforce Integration

- [ ] An Agentforce agent can execute "Query Account records where Industry = Technology" and receive structured results.
- [ ] Agent actions respect the same CRUD/FLS/Sharing rules as the UI.

### Telemetry

- [ ] Every grid action (query, save, delete, export, NLP command) fires a Platform Event.
- [ ] Telemetry events are visible in the Platform Event monitoring tool.
- [ ] No PII is included in telemetry payloads.

### AppExchange

- [ ] Package installs cleanly in a fresh Developer Edition org.
- [ ] `PostInstallClass` creates default CMDT records on first install.
- [ ] Package passes `sf scanner run` with zero critical findings.
- [ ] All components render correctly under Lightning Locker and LWS.

### Licensing

- [ ] Free-tier users see the core grid without NLP/AI features.
- [ ] Assigning the premium Permission Set unlocks NLP command bar and AI suggestions.
- [ ] Removing the Permission Set immediately hides premium features.

---

## 🔒 Security Gate Requirement

- **NLP Output = Untrusted**: All AI-generated SOQL passes through `GridQueryBuilder` validation. No direct `Database.query()` on LLM output.
- **Prompt Injection Prevention**: The `PromptTemplate` includes system instructions that constrain the LLM to only produce SOQL-compatible JSON. Non-SOQL output is rejected.
- **DML Confirmation Required**: No NLP-triggered DML executes without explicit user confirmation via modal.
- **Telemetry Privacy**: Platform Events contain no field values, record names, or PII. Only metadata (object names, action types, counts).
- **Package Security**: All Apex classes pass `sf scanner run --target force-app --engine pmd,eslint,retire-js`.
- **License Enforcement**: Premium features check licenses server-side (not just UI hide/show) to prevent API bypass.
- **CSP Compliance**: No external HTTP callouts without configured Remote Site Settings / Named Credentials.

---

## Automation Approach Decision

| Use Case                 | Approach                   | Rationale                                                                                                     |
| ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| NLP → SOQL translation   | **Apex + Einstein GenAI**  | Requires LLM integration via `ConnectApi.EinsteinLlm` or `PromptTemplate`. Must run server-side for security. |
| Bulk NLP DML             | **Apex**                   | Reuses existing `saveRecords()` / `deleteRecords()` pipeline. Confirmation modal is LWC.                      |
| Data Quality analysis    | **Apex**                   | Aggregate queries and fuzzy matching require server-side compute. Results rendered in LWC.                    |
| Conversational assistant | **LWC + Apex**             | Chat UI in LWC; query execution in Apex via NLP engine.                                                       |
| Agentforce integration   | **Apex**                   | `@InvocableMethod` on `GridQueryBuilder` + `GenAiPlugin` metadata.                                            |
| Telemetry                | **Apex (Platform Events)** | Fire-and-forget pattern; subscriber handles aggregation.                                                      |
| License checks           | **Apex**                   | Server-side enforcement prevents client-side bypass.                                                          |
| Onboarding walkthrough   | **LWC**                    | Client-side overlay/tooltip system; no Apex needed.                                                           |

---

## Assumptions

1. Einstein Generative AI APIs are available in the target org (requires Einstein add-on license).
2. Agentforce platform is enabled and configured with at least one active agent.
3. AppExchange namespace will be determined before development begins.
4. Telemetry Platform Events will be consumed by a Flow or external analytics tool — not stored long-term in Salesforce custom objects (to avoid storage limits).
5. The NLP command bar will support English language only in the initial release.
6. Data quality analysis operates on the **currently loaded dataset** (up to pagination limit), not the entire object's records.

---

## Clarification Status

| #   | Question                                                                                            | Status                                             |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | What namespace prefix should be used for the managed package?                                       | [NEEDS CLARIFICATION]                              |
| 2   | Which Einstein license tier will be available (Standard vs. Premium)?                               | [NEEDS CLARIFICATION]                              |
| 3   | Should telemetry data be stored in Salesforce or exported to an external analytics platform?        | [NEEDS CLARIFICATION]                              |
| 4   | Per-org or per-user licensing model for AppExchange?                                                | [NEEDS CLARIFICATION]                              |
| 5   | Should the NLP command bar support multi-language input in the future?                              | [NEEDS CLARIFICATION: suggest English-only for v1] |
| 6   | Is the free tier of Smart Grid expected to remain fully open-source, or will it be a limited trial? | [NEEDS CLARIFICATION]                              |
| 7   | Target AppExchange listing category (Data Management, Admin Tools, or Productivity)?                | [NEEDS CLARIFICATION]                              |
