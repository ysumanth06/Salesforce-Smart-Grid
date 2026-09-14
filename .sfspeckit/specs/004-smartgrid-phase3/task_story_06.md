# Task Story 06: Agentforce Integration, Invocable Actions & Telemetry [US-P3-06, US-P3-08]

**Feature**: 004-smartgrid-phase3 | **Story Type**: FULL | **Priority**: P2 — High  
**Status**: COMPLETE | **Branch**: `feature/004-smartgrid-phase3`

---

## Requirements

Connect Smart Grid to the Agentforce ecosystem and implement decoupled Platform Event telemetry:

1. **Agentforce Invocable Entry Points**:
   - Enhance `@InvocableMethod` annotations on `GridQueryBuilder.buildQuery()` and `SmartGridController.queryRecords()` to declare clear input/output schemas for Agentforce agents.
   - Package actions into reusable topics: `SmartGrid_Query`, `SmartGrid_Update`, `SmartGrid_Analyze`.
   - Support external agent consumption via the standard REST Invocable endpoint `/services/data/v65.0/actions/custom/apex/GridQueryBuilder`.
2. **`SmartGridTelemetryService` (Apex Service)**:
   - Publishes `Smart_Grid_Telemetry__e` platform events asynchronously via `EventBus.publish()`.
   - Captures operation durations, action types (`query`, `save`, `nlp_command`, `export`), record counts, and errors.
   - Guarantees zero PII in telemetry payloads.
   - Fire-and-forget: failure to publish never interrupts or rolls back user database transactions.

---

## SF Implementation Layers

| Layer             | Skill            | File Path                                                          | Status |
| :---------------- | :--------------- | :----------------------------------------------------------------- | :----- |
| Apex Invocable    | sf-apex          | `force-app/main/default/classes/GridQueryBuilder.cls` (enhance)    | READY  |
| Apex Service      | sf-apex          | `force-app/main/default/classes/SmartGridTelemetryService.cls`     | READY  |
| Apex Unit Tests   | sf-testing       | `force-app/main/default/classes/SmartGridTelemetryServiceTest.cls` | READY  |
| GenAi Action Meta | sf-ai-agentforce | `force-app/main/default/genAiPlugins/SmartGridAgent/`              | READY  |

---

## Acceptance Criteria

- **AC-P3-06-1**: An Agentforce agent can execute `SmartGrid_Query` with parameters `{ objectApiName: 'Account', fields: 'Id,Name', filters: 'Rating = Hot' }` and receive structured record results.
- **AC-P3-06-2**: Queries executed by Agentforce respect the invoking user's object and field permissions (`WITH USER_MODE`).
- **AC-P3-06-3**: Significant grid actions publish a `Smart_Grid_Telemetry__e` event without delaying UI response time.
- **AC-P3-06-4**: No sensitive field values, record names, or PII appear in event payloads.

---

## Scoring Gates

| Skill            | Gate          | Target    |
| :--------------- | :------------ | :-------- |
| sf-apex          | Apex quality  | ≥ 120/150 |
| sf-ai-agentforce | Agent design  | ≥ 80/100  |
| sf-testing       | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                         | Effort | Hours  |
| :---------------------------- | :----- | :----- |
| Agentforce Invocable Wrappers | Medium | 2h     |
| Telemetry Publishing Service  | Medium | 2h     |
| Apex Unit Tests               | Low    | 2h     |
| **Total**                     |        | **6h** |
