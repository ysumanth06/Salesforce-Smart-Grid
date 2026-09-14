# Technical Implementation Plan: Phase 3 — AI Smart Grid & Universal AI Adapter

**Feature Number**: 004  
**Feature Slug**: 004-smartgrid-phase3  
**Spec Status**: Approved  
**Plan Status**: Ready for Implementation  
**API Version**: 65.0  
**Package Directory**: `force-app`  
**Date**: 2026-09-14

---

## Constitution Compliance Check

| Article                           | Check                                                                                                                                   | Status  |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :-----: |
| **I: Metadata-First**             | Schema changes (`Smart_Grid_AI_Config__mdt`, `Smart_Grid_License__mdt`, `Smart_Grid_Telemetry__e`, Permission Sets) defined in Story 00 | ✅ Pass |
| **II: Governor-Limit Awareness**  | Bulkification mandatory (251+ records); fast-path client tokenizer; SOQL aggregate grouping used for duplicate detection                | ✅ Pass |
| **III: Declarative-First**        | Custom metadata drives provider switching; Prompt Templates used when available; Platform Events for decoupled telemetry                | ✅ Pass |
| **IV: Security-by-Default**       | Strict `with sharing`; all AI output validated via `GridQueryBuilder.cls`; FLS/CRUD enforced via `stripInaccessible()`; no raw SOQL DML | ✅ Pass |
| **V: PNB Test-First**             | Positive, Negative, and Bulk (251+ records) test patterns across all Apex services and Jest tests for all LWC components                | ✅ Pass |
| **VI: Separation of Concerns**    | Clean demarcation: `ISmartGridAIProvider` (Adapter), `SmartGridNLPEngine` (Orchestrator), `SmartGridDataQualityService` (Service)       | ✅ Pass |
| **VII: Deployment Safety**        | 7-phase deployment ordering; permission sets provision access; backward-compatible additive modules                                     | ✅ Pass |
| **VIII: Agent Architecture**      | Topic & Action pattern for Agentforce via `GenAiPlugin`; `@InvocableMethod` entry points on `GridQueryBuilder`                          | ✅ Pass |
| **IX: Cross-Skill Orchestration** | Clear story boundaries and dependencies; sf-metadata, sf-apex, sf-lwc, and sf-testing scoring gates defined                             | ✅ Pass |

---

## Phase 3 Story Summary

| Story     | Title                                                     | Layer                         | Priority |  Hours  | Dependencies |
| :-------- | :-------------------------------------------------------- | :---------------------------- | :------: | :-----: | :----------- |
| **TS-00** | Foundation: Custom Metadata, Events, PermSets & Test Data | Metadata, Objects, PermSets   |    P1    |   6h    | None (Root)  |
| **TS-01** | Universal AI Provider Engine & Adapters                   | Apex Services & Factory       |    P1    |   10h   | TS-00        |
| **TS-02** | Modern Command Palette (`Cmd+K`) & Explainability Chips   | LWC + Keyboard Shortcuts      |    P1    |   8h    | TS-00, TS-01 |
| **TS-03** | Bulk NLP DML Handler & Visual Safety Diff Modal           | Apex Service + LWC Modal      |    P1    |   8h    | TS-00, TS-01 |
| **TS-04** | Governor-Safe Data Quality Service & Health Panel         | Apex Service + LWC Side Panel |    P1    |   8h    | TS-00        |
| **TS-05** | Dockable Conversational Analytics Assistant Drawer        | LWC Chat Drawer + Apex Bridge |    P2    |   8h    | TS-01        |
| **TS-06** | Agentforce Integration, Invocable Actions & Telemetry     | Apex Invocable, GenAi, Events |    P2    |   6h    | TS-00, TS-01 |
| **TS-07** | AppExchange Packaging, License Gating & In-App Onboarding | Apex Gating + LWC Tour        |    P3    |   6h    | TS-00..TS-06 |
| **Total** |                                                           |                               |          | **60h** |              |

---

## Technical Architecture & Module Structure

```
force-app/main/default/
├── objects/
│   ├── Smart_Grid_AI_Config__mdt/          # Universal AI provider routing & settings
│   ├── Smart_Grid_License__mdt/            # Feature gating by license/permission set
│   └── Smart_Grid_Telemetry__e/            # High-throughput asynchronous Platform Event
├── permissionsets/
│   └── Smart_Grid_AI_Premium.permissionset-meta.xml # Premium AI capability grant
├── classes/
│   ├── ISmartGridAIProvider.cls            # Pluggable AI abstraction interface
│   ├── SmartGridEinsteinAIProvider.cls     # Native Einstein GenAI / PromptTemplate adapter
│   ├── SmartGridExternalAIProvider.cls     # External Named Credential BYO-LLM adapter
│   ├── SmartGridMockAIProvider.cls         # Offline heuristic & regex tokenizer fallback
│   ├── SmartGridNLPEngine.cls              # Core AI orchestrator & query validator
│   ├── SmartGridNLPDMLHandler.cls          # Safe bulk NLP DML preview & execution
│   ├── SmartGridDataQualityService.cls     # Aggregate duplicate & health analyzer
│   ├── SmartGridLicenseService.cls         # Server-side license & feature gating
│   ├── SmartGridTelemetryService.cls       # Platform Event telemetry publisher
│   └── (Corresponding Test Classes)        # PNB pattern tests with >=90% coverage
└── lwc/
    ├── smartGridCommandPalette/            # Cmd+K Command Palette with autocomplete
    ├── smartGridDmlConfirmModal/           # Visual before/after diff table for bulk DML
    ├── smartGridDataQuality/               # Health cards & inline quick-fix inspector
    ├── smartGridAssistant/                 # Non-intrusive conversational chat drawer
    └── smartGridOnboarding/                # Guided interactive walkthrough tooltip tour
```

---

## Deployment Order (7 Phases)

1. **Phase 1: Metadata Foundation**: Custom Metadata Types (`Smart_Grid_AI_Config__mdt`, `Smart_Grid_License__mdt`), Platform Events (`Smart_Grid_Telemetry__e`), and Permission Set (`Smart_Grid_AI_Premium`).
2. **Phase 2: Core AI Engine**: `ISmartGridAIProvider`, `SmartGridMockAIProvider`, `SmartGridEinsteinAIProvider`, `SmartGridExternalAIProvider`, and `SmartGridNLPEngine`.
3. **Phase 3: Data Services**: `SmartGridNLPDMLHandler`, `SmartGridDataQualityService`, `SmartGridTelemetryService`, and `SmartGridLicenseService`.
4. **Phase 4: Apex Unit Tests**: Full PNB test coverage across all new Apex classes (`>= 90%`).
5. **Phase 5: LWC UI Components**: `smartGridCommandPalette`, `smartGridDmlConfirmModal`, `smartGridDataQuality`, `smartGridAssistant`, and `smartGridOnboarding`.
6. **Phase 6: Integration & Orchestration**: Integrate components into `smartDataGrid` container and `smartGridFilterBar`.
7. **Phase 7: LWC Jest Tests & Code Analyzer**: Jest suites execution and `sf scanner run` validation.

---

## Scoring Gates & Quality Standards

- **sf-metadata**: ≥ 84/120 (schema integrity, FLS definitions, descriptions)
- **sf-apex**: ≥ 120/150 (CRUD/FLS enforcement, bulkification, zero hardcoded IDs)
- **sf-lwc**: ≥ 135/165 (accessibility, SLDS 2 tokens, keyboard navigation, reactivity)
- **sf-testing**: ≥ 108/120 (PNB test patterns, >=90% coverage, bulk 251+ rows)
- **Security Review**: Zero critical or high findings via `sf scanner run`
