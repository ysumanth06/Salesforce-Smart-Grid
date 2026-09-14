# Task Story 04: Client-Side Page Cache (Zero-Latency Navigation) [US-P2.5-04]

**Feature**: 003.5-smartgrid-phase2.5 | **Story Type**: FULL | **Priority**: P2 — High  
**Status**: SPECIFIED | **Branch**: `feature/003.5-smartgrid-phase2.5`

---

## Requirements

Implement an in-memory client-side LRU (Least Recently Used) page cache inside `smartDataGrid`. When a user navigates between pages (e.g., Page 1 → Page 2 → Page 1), previously loaded pages are retrieved instantly from the local memory cache with **0ms network latency** and **zero SOQL queries**.

The cache automatically invalidates upon:

- Committing DML edits (`saveRecords` or `deleteRecords`)
- Applying/clearing any filter or search term
- Changing sort field or sort direction
- Changing page size
- Clicking the manual "Refresh" button

---

## SF Implementation Layers

| Layer                  | Skill      | File Path                                                                  | Status       |
| :--------------------- | :--------- | :------------------------------------------------------------------------- | :----------- |
| LWC Service / Module   | sf-lwc     | `force-app/main/default/lwc/gridPageCache/gridPageCache.js`                | 📝 SPECIFIED |
| LWC Unit Tests         | sf-testing | `force-app/main/default/lwc/gridPageCache/__tests__/gridPageCache.test.js` | 📝 SPECIFIED |
| LWC Component (modify) | sf-lwc     | `force-app/main/default/lwc/smartDataGrid/`                                | 📝 SPECIFIED |

---

## Salesforce Platform Limitations & Guardrails

1. **Browser Heap & Memory Footprint**: Caching all pages indefinitely can cause browser tabs to crash on large objects. The cache must be strictly bounded at a maximum of **10 pages** (typically ~500 records) using an LRU eviction policy.
2. **Stale Data Prevention**: If another user modifies data in Salesforce, cached pages may become stale. Provide a 5-minute TTL (Time to Live) on cached pages, and an explicit "Refresh" button that bypasses cache (`bypassCache: true`).
3. **Pending Draft Value Integrity**: If a user edits a cell on Page 1, navigates to Page 2, and returns to Page 1, the cached Page 1 records must seamlessly re-merge with existing `draftValues` so unsaved user edits are never lost.

---

## Acceptance Criteria

- **AC-2.5-04-1**: Navigating to an already visited page renders data instantly without triggering an Apex call to `getRecordsPaged`.
- **AC-2.5-04-2**: Cache stores a maximum of 10 pages; accessing an 11th page evicts the least recently viewed page.
- **AC-2.5-04-3**: Any filter change, sorting change, page size change, or DML save immediately purges the entire page cache.
- **AC-2.5-04-4**: Unsaved draft values on a cached page are preserved and visible when navigating back to that page.
- **AC-2.5-04-5**: Clicking the Refresh toolbar button explicitly invalidates the cache and fetches fresh records from Salesforce.

---

## Test Cases

| #        | Type     | Description                                               | Expected                                        |
| :------- | :------- | :-------------------------------------------------------- | :---------------------------------------------- |
| TC-04-P1 | Positive | Load Page 1, go to Page 2, return to Page 1               | Page 1 renders instantly, zero network requests |
| TC-04-P2 | Positive | Edit cell on Page 1, navigate to Page 2, return to Page 1 | Draft edit is intact and visible on Page 1      |
| TC-04-P3 | Positive | Apply filter on Page 2                                    | Cache purged, fresh query executed for Page 1   |
| TC-04-P4 | Positive | Click Refresh button                                      | Cache purged, fresh query executed              |
| TC-04-B1 | Bulk     | Visit 15 distinct pages sequentially                      | Cache size remains capped at 10 items           |

---

## Scoring Gates

| Skill      | Gate          | Target    |
| :--------- | :------------ | :-------- |
| sf-lwc     | LWC quality   | ≥ 125/165 |
| sf-testing | Test coverage | ≥ 90%     |

---

## Estimation

| Layer                                 | Effort | Hours  |
| :------------------------------------ | :----- | :----- |
| LRU Cache Module (`gridPageCache.js`) | Low    | 2h     |
| Grid Integration & Draft Merging      | Medium | 3h     |
| Jest Tests                            | Low    | 2h     |
| **Total**                             |        | **7h** |
