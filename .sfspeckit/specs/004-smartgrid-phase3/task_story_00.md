# Task Story 00: Foundation — AI Metadata, Platform Event & Permission Set [US-P3-Foundation]

**Feature**: 004-smartgrid-phase3 | **Story Type**: FULL | **Priority**: P1 — Critical  
**Status**: COMPLETE | **Branch**: `feature/004-smartgrid-phase3`

---

## Requirements

Establish the metadata foundation for the Smart Grid AI features:

1. **Custom Metadata Type `Smart_Grid_AI_Config__mdt`**:
   - Stores AI configuration, model routing, and provider selection per grid.
   - Fields: `Grid_Config__c` (Metadata Relationship), `Enable_NLP__c` (Checkbox), `Enable_Suggestions__c` (Checkbox), `Enable_Chat__c` (Checkbox), `Provider_Type__c` (Picklist: `Einstein`, `OpenAI_Compatible`, `Anthropic`, `Google_Gemini`, `Custom_Class`, `Offline_Mock`), `Named_Credential__c` (Text 255), `Custom_Provider_Class__c` (Text 255), `Prompt_Template__c` (Text 255), `Model_Identifier__c` (Text 255), `Max_Tokens__c` (Number 4,0), `Confidence_Threshold__c` (Number 3,2).
2. **Platform Event `Smart_Grid_Telemetry__e`**:
   - Decoupled asynchronous telemetry publishing.
   - Fields: `User_Id__c` (Text 18), `Object_API_Name__c` (Text 80), `Action__c` (Text 40), `Duration_Ms__c` (Number 8,0), `Record_Count__c` (Number 8,0), `NLP_Input__c` (Text 1000), `Error_Message__c` (Text 500).
3. **Custom Metadata Type `Smart_Grid_License__mdt`**:
   - Feature gating rules for premium features.
   - Fields: `Feature_Name__c` (Text 80), `Is_Premium__c` (Checkbox), `Is_Enabled__c` (Checkbox), `Permission_Set__c` (Text 80).
4. **Permission Set `Smart_Grid_AI_Premium`**:
   - Grants read access to AI CMDT objects and permissions to trigger AI features.
5. **Test Data Factory Extensions**:
   - Utilities in test classes for mocking `Smart_Grid_AI_Config__mdt` records in unit tests.

---

## SF Implementation Layers

| Layer             | Skill       | File Path                                                                            | Status |
| :---------------- | :---------- | :----------------------------------------------------------------------------------- | :----- |
| Custom Metadata   | sf-metadata | `force-app/main/default/objects/Smart_Grid_AI_Config__mdt/`                          | READY  |
| Platform Event    | sf-metadata | `force-app/main/default/objects/Smart_Grid_Telemetry__e/`                            | READY  |
| Custom Metadata   | sf-metadata | `force-app/main/default/objects/Smart_Grid_License__mdt/`                            | READY  |
| Permission Set    | sf-metadata | `force-app/main/default/permissionsets/Smart_Grid_AI_Premium.permissionset-meta.xml` | READY  |
| Test Helper Setup | sf-apex     | `force-app/main/default/classes/SmartGridTestFactory.cls`                            | READY  |

---

## Acceptance Criteria

- **AC-P3-00-1**: `Smart_Grid_AI_Config__mdt` deploys successfully with all required provider fields.
- **AC-P3-00-2**: `Smart_Grid_Telemetry__e` deploys as a high-volume platform event and permits publishing via `EventBus.publish()`.
- **AC-P3-00-3**: `Smart_Grid_License__mdt` deploys with default records for `NLP_COMMAND_BAR`, `AI_SUGGESTIONS`, and `CONVERSATIONAL_ASSISTANT`.
- **AC-P3-00-4**: `Smart_Grid_AI_Premium` permission set grants read access to all custom fields on new CMDT objects.

---

## Scoring Gates

| Skill       | Gate          | Target   |
| :---------- | :------------ | :------- |
| sf-metadata | Quality score | ≥ 84/120 |
| sf-apex     | Apex quality  | ≥ 90/150 |
| sf-testing  | Test coverage | ≥ 90%    |

---

## Estimation

| Layer           | Effort | Hours  |
| :-------------- | :----- | :----- |
| Custom Metadata | Low    | 2h     |
| Platform Event  | Low    | 1h     |
| Permission Set  | Low    | 1h     |
| Test Utilities  | Medium | 2h     |
| **Total**       |        | **6h** |
