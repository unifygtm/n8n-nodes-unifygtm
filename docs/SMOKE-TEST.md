# Authenticated smoke tests

Status: limited authenticated read-only smoke tests passed on 2026-11-11 in n8n 2.47.4. Full operation coverage remains pending. Automated mock tests do not establish live compatibility for untested operations.

Use a dedicated test workspace and enter the API key in the platform credential UI. Do not commit credentials, real IDs, captured headers or customer response data.

| Test | Expected result | Status |
| --- | --- | --- |
| Save Unify API credential | Read-only object listing succeeds | Saved and usable in successful executions |
| List objects | Individual output items, usable field mapping | Passed, 38 schema definitions returned |
| List sequences with a low limit | Total output respects limit | Passed, limit 1 and one item returned |
| List tasks with a low limit | Total output respects limit | Passed, limit 1 and one item returned |
| List a fixture collection across two pages | No missing or duplicated IDs | Pending |
| Find a known fixture record | Correct record or documented not-found response | Pending |
| Create and update a fixture record | Values match the documented schema | Pending |
| Upsert the same fixture twice | Same record is matched, no duplicate | Pending |
| Add one valid and one invalid fixture list entry | Partial failure details remain visible | Pending |
| Create and retrieve a fixture query job | Retrieve results only after completion | Pending |
| Delete a disposable fixture | API result is returned without retry | Pending |
| Invalid test key | Clear error without exposing key | Pending |

Do not test sequence enrollment, approval or resume against real prospects. Validate those in a workspace with controlled test mailboxes and recipients. Before a marketplace release, exercise every exposed operation's success and error path in its platform, especially polymorphic task/attribute JSON payloads.

## Low-cost test scope

The user requested minimal credit use. Executed the credential check and three read-only node runs: List Objects, List Sequences (limit 1), and List Tasks (limit 1). No enrichment, record writes, query jobs, sequence enrollments, outreach or retries were performed. Actual billing counters were not inspected, so no numeric credit-consumption claim is made. Credentials are stored in local n8n, not in this repository.

The first object-list run used the UI default of 50 and returned 38 object definitions. The attempted UI change to 1 did not persist. Subsequent sequence and task limits were explicitly verified as 1 before execution. These object definitions are workspace schema metadata, not enriched records.

UI testing also exposed write operations selected by alphabetical resource defaults. Defaults now prefer GET operations with the fewest required inputs; regression tests ensure all shipped resources start with a read operation.
