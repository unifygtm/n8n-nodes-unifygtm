# Unify for Make

Connect Unify to Make using an API key created in Unify Settings > Developers.
API documentation: https://docs.unifygtm.com/

## Initial release

- List objects: returns object definitions as individual bundles.
- Get an object: returns one object definition.
- List object attributes: returns attribute definitions as individual bundles.
- Get an object attribute: returns one attribute definition.
- Make an API call: performs an authorized request to the Unify API.

Objects and attributes can be selected from a dropdown or supplied as mapped API names. Dropdowns return at most 100 options. The List modules default to 10 results and accept a configurable limit. The object and attribute list endpoints return their complete arrays: the current public OpenAPI specification exposes no cursor or page parameter for these two endpoints. Therefore these modules do not invent pagination parameters.

Get and List modules expose the same resource fields without the transport envelope. Object output fields are provider, API name, display name and description. Attribute outputs also include type, required/unique flags, select options and reference metadata where applicable. These schema-definition resources have no date fields. The universal module preserves its generic body, headers and status code output and accepts key/value headers and query parameters.

The API key is attached automatically and sanitized in request logs. Errors include the HTTP status and the API's message, with a fallback if no message is returned. Requests remain on the Unify API host and redirects are disabled.

## Review scope clarification, November 11, 2026

This initial submission requests approval for the five modules above. The other 74 prototype modules are now archived and hidden, and their source is retained separately for future development. They are not ready for publication and should not be enabled. Make's review form still displays those archived modules. Please confirm that archived prototypes can be excluded from this initial five-module review, or advise how to remove them from the review scope. The platform refuses deletion from a published app and refuses reverting a published app to private.

The full 79-module prototype catalog has not passed review or runtime validation. This release does not claim to resolve findings against archived write, outreach, task, sequence or query-job modules.

Test scenarios are linked in the Review form. The successful scenario uses only schema definitions. The error scenario intentionally requests a nonexistent object. Neither scenario performs enrichment, record writes or outreach, and scheduling remains inactive.

## Validation evidence, November 11, 2026

- Successful five-module run: https://us2.make.com/3421041/scenarios/7003064/logs/0f936ad092734b148e0cb65e3ecf4f7e
- Expected API error run: https://us2.make.com/3421041/scenarios/7003087/logs/567be0a4724b4c60a92e565026e6ba62
- Successful run: 5 operations and 5 Make credits. Expected error: 1 operation and 0 Make credits.
- Error shown: `[404] Object does not exist or has been deleted.`
- Object options verified in the scenario editor. Attribute options verified with Make's Test RPC using object `company`.
- The universal module was exercised with an `Accept: application/json` header. Query-string mapping passed source validation; no separate provider request was made solely for a query-string test.
