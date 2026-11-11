# Authenticated smoke tests

Status: pending. Automated mock tests do not establish live API compatibility.

Use a dedicated test workspace and enter the API key in the platform credential UI. Do not commit credentials, real IDs, captured headers or customer response data.

| Test | Expected result | Status |
| --- | --- | --- |
| Save Unify API credential | Read-only object listing succeeds | Pending |
| List objects | Individual output items, usable field mapping | Pending |
| List sequences with a low limit | Total output respects limit | Pending |
| List a fixture collection across two pages | No missing or duplicated IDs | Pending |
| Find a known fixture record | Correct record or documented not-found response | Pending |
| Create and update a fixture record | Values match the documented schema | Pending |
| Upsert the same fixture twice | Same record is matched, no duplicate | Pending |
| Add one valid and one invalid fixture list entry | Partial failure details remain visible | Pending |
| Create and retrieve a fixture query job | Retrieve results only after completion | Pending |
| Delete a disposable fixture | API result is returned without retry | Pending |
| Invalid test key | Clear error without exposing key | Pending |

Do not test sequence enrollment, approval or resume against real prospects. Validate those in a workspace with controlled test mailboxes and recipients. Before a marketplace release, exercise every exposed operation's success and error path in its platform, especially polymorphic task/attribute JSON payloads.
