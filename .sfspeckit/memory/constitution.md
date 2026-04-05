# Salesforce Smart Grid — Project Constitution

**Date**: 2026-04-05  
**Author**: TPO  
**Version**: 1.0  

## Project Context
- **Project Name**: Salesforce Smart Grid
- **Team Size**: 1
- **Target Org**: Sandbox
- **Installed Packages**: DocGen

## Quality & Scoring Gates (Default)
- **sf-metadata**: 84/120
- **sf-apex**: 90/150
- **sf-lwc**: 125/165
- **sf-testing**: 108/120

---

## Article I: Metadata-First
All features start with proper object and field definitions. Data architecture and schema design must precede code or flow automation.

## Article II: Governor-Limit Awareness
All code and automations must be built with Salesforce governor limits in mind. Bulkification is mandatory. Apex must be tested with a minimum of 251 records to ensure limit compliance.

## Article III: Declarative-First
Evaluate Salesforce declarative tools (Flow) before resorting to custom code (Apex/LWC). Custom code is only permissible when declarative tools cannot meet the requirements or hit governor limits.

## Article IV: Security-by-Default
All Apex code must use `with sharing` unless expressly justified. Queries must actively enforce security using `WITH USER_MODE`. Hardcoded IDs are strictly forbidden anywhere in the codebase.

## Article V: PNB Test-First
All testing must follow the Positive/Negative/Bulk (PNB) pattern. A centralized Test Data Factory must be used to generate test records.

## Article VI: Separation of Concerns
Code should adhere to a clear Separation of Concerns. Where applicable, utilize the Trigger Action Framework (TAF) and strictly delineate Service, Selector, and Domain layers.

## Article VII: Deployment Safety
All deployments must be preceded by a dry-run validation. Dependencies must be clearly documented to dictate the correct deployment order. Access should be provisioned via Permission Sets, not Profiles.

## Article VIII: Agent Architecture
Agentforce architecture must employ proper Topic and Action patterns. Existing agents or actions must be deactivated before modifications are deployed to avoid active session corruption.

## Article IX: Cross-Skill Orchestration
Development must respect skill dependency ordering. Code and features must pass all defined scoring gates before being considered complete and ready for pull request or deployment.
