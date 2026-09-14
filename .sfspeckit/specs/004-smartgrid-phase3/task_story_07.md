# Task Story 07: AppExchange Readiness, License Gating & In-App Onboarding [US-P3-09, US-P3-10, US-P3-11, US-P3-12]

**Feature**: 004-smartgrid-phase3 | **Story Type**: FULL | **Priority**: P3 — High  
**Status**: COMPLETE | **Branch**: `feature/004-smartgrid-phase3`

---

## Requirements

Ensure AppExchange commercial readiness, security review compliance, feature gating, and user onboarding:

1. **`SmartGridLicenseService` (Apex Service)**:
   - Server-side license and entitlement checking against `Smart_Grid_License__mdt` and the user's assigned Permission Sets.
   - Restricts API access to `SmartGridNLPEngine`, `SmartGridDataQualityService`, and `SmartGridAssistant` for users without the `Smart_Grid_AI_Premium` permission set.
2. **`smartGridOnboarding` (LWC Component)**:
   - Interactive guided tour overlay with step-by-step tooltip callouts highlighting:
     - 1. Command Palette (`Cmd+K`).
     - 2. In-place column menus & filtering.
     - 3. Saved views & custom views.
     - 4. AI data health & conversational assistant.
   - Tracks onboarding completion per-user in `Smart_Grid_User_Pref__c`.
3. **AppExchange Security Review Compliance**:
   - Zero critical or high findings from `sf scanner run --target force-app --engine pmd,eslint`.
   - Complete CRUD/FLS validation across all DML operations.
   - Verification of Lightning Locker and Lightning Web Security (LWS) compatibility.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                              | Status |
| :--------------------- | :--------- | :------------------------------------------------------------------------------------- | :----- |
| Apex Service           | sf-apex    | `force-app/main/default/classes/SmartGridLicenseService.cls`                           | READY  |
| Apex Unit Tests        | sf-testing | `force-app/main/default/classes/SmartGridLicenseServiceTest.cls`                       | READY  |
| LWC Component          | sf-lwc     | `force-app/main/default/lwc/smartGridOnboarding/`                                      | READY  |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                            | READY  |
| Jest Tests             | sf-testing | `force-app/main/default/lwc/smartGridOnboarding/__tests__/smartGridOnboarding.test.js` | READY  |

---

## Acceptance Criteria

- **AC-P3-07-1**: Users without `Smart_Grid_AI_Premium` permission set cannot invoke AI endpoints and do not see the Command Palette or Assistant buttons.
- **AC-P3-07-2**: First-time users see an optional guided onboarding tour explaining key features.
- **AC-P3-07-3**: Dismissing or completing the tour records the preference so it does not reappear on subsequent logins.
- **AC-P3-07-4**: The entire codebase passes static analysis (`sf scanner run`) with zero security findings.

---

## Scoring Gates

| Skill      | Gate             | Target    |
| :--------- | :--------------- | :-------- |
| sf-apex    | Apex quality     | ≥ 120/150 |
| sf-lwc     | LWC quality      | ≥ 135/165 |
| sf-deploy  | Security scanner | 0 errors  |
| sf-testing | Test coverage    | ≥ 90%     |

---

## Estimation

| Layer                       | Effort | Hours  |
| :-------------------------- | :----- | :----- |
| License Check Service       | Medium | 2h     |
| LWC Onboarding Walkthrough  | Medium | 2h     |
| Security Scan & Remediation | Low    | 1h     |
| Jest & Apex Unit Tests      | Low    | 1h     |
| **Total**                   |        | **6h** |
