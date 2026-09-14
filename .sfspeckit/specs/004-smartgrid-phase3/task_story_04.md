# Task Story 04: Governor-Safe Data Quality Service & Health Panel [US-P3-04]

**Feature**: 004-smartgrid-phase3 | **Story Type**: FULL | **Priority**: P1 — Critical  
**Status**: COMPLETE | **Branch**: `feature/004-smartgrid-phase3`

---

## Requirements

Implement high-performance data quality analysis and health card visualization without exceeding Apex CPU limits:

1. **`SmartGridDataQualityService` (Apex Service)**:
   - **Database-Level Duplicate Detection**: Uses SOQL Aggregate Grouping (`GROUP BY Field HAVING COUNT(Id) > 1`) directly at the database engine level (0 ms Apex CPU time) for exact duplicates.
   - **Soundex / Blocking Key Fuzzy Matching**: Partitions records by domain or Soundex prefix to restrict in-memory fuzzy comparisons to small windows ($<20$ records per bucket).
   - **Null Field Analysis**: Analyzes current view dataset to report percentage of empty values across visible columns.
   - **Outlier Detection**: Uses SOQL `AVG()`, `MIN()`, `MAX()` to identify numeric values $>3$ standard deviations from mean.
2. **`smartGridDataQuality` (LWC Component)**:
   - Side inspector drawer displaying expandable health cards:
     - "Missing Information" (fields with $>30\%$ nulls).
     - "Potential Duplicates" (grouped list with one-click merge or review).
     - "Value Outliers" (unusual amounts/dates).
   - Actionable "Fix" button that focuses the relevant cell or filters the grid to affected rows.

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                                | Status |
| :--------------------- | :--------- | :--------------------------------------------------------------------------------------- | :----- |
| Apex Service           | sf-apex    | `force-app/main/default/classes/SmartGridDataQualityService.cls`                         | READY  |
| Apex Unit Tests        | sf-testing | `force-app/main/default/classes/SmartGridDataQualityServiceTest.cls`                     | READY  |
| LWC Component          | sf-lwc     | `force-app/main/default/lwc/smartGridDataQuality/`                                       | READY  |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                              | READY  |
| Jest Tests             | sf-testing | `force-app/main/default/lwc/smartGridDataQuality/__tests__/smartGridDataQuality.test.js` | READY  |

---

## Acceptance Criteria

- **AC-P3-04-1**: Analyzing a dataset of 2,000 records executes in $< 1,500$ ms Apex CPU time without governor limit warnings.
- **AC-P3-04-2**: Duplicate card accurately groups records sharing identical email, phone, or normalized name values.
- **AC-P3-04-3**: Clicking "View Affected Records" applies a filter to the grid isolating the flagged records.
- **AC-P3-04-4**: If all health checks pass, a "Data Health: 100% — All checks passed" badge displays.

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-apex    | Apex quality  | ≥ 120/150 |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                       | Effort | Hours  |
| :-------------------------- | :----- | :----- |
| Apex Data Quality Service   | Medium | 3h     |
| LWC Health Drawer Component | Medium | 3h     |
| PNB Apex & Jest Tests       | Low    | 2h     |
| **Total**                   |        | **8h** |
