# Make review corrections, November 11, 2026

The reviewer evaluated all 79 modules, including the 74 hidden prototypes. The initial release remains limited to five modules, as selected by the owner. The other 74 are now archived and hidden in Make, preserved in the repository and backed up before archiving. No module was deleted. Make rejected deletion from a public app and rejected reverting that app to private. The review form still lists archived modules, so exclusion from review requires Make's confirmation.

## Implemented and uploaded for the five-module release

- Lowercase `x-api-key` header and exact `request.headers.x-api-key` sanitization on Base and Connection.
- HTTP status plus the API message with `ifempty` fallback.
- Typed object and attribute interfaces, including the union of select and reference attribute fields. Get and List emit the same resource shape.
- Two read-only, 100-result RPCs for object and attribute selections, preserving mapping mode.
- Optional List limits defaulting to 10.
- Entity groups in List/Get order, with only the universal module in Other. Archived prototypes have a separate group.
- Sentence-case labels, third-person descriptions, corrected parameter labels and read actions on all four read-only modules.
- Key/value header and query-string mappings in the universal API module, relative URL validation and disabled redirects.
- Updated public app documentation explaining pagination, resource envelopes, date applicability, validation and the scope question.

The two schema-list endpoints expose no pagination parameters in the pinned public OpenAPI. The four schema-definition modules have no date fields. Requests for structured writes, sequence/task IDs, repeated filters and query-job polling apply to archived prototypes and are not represented as completed.

## Validation

`npm run check` passed lint, TypeScript build and 22 tests. The release-specific checks cover scope, RPC references, credential sanitization, typed output parity, output limits and universal-module mappings. All 15 uploaded module sections were read back and matched the release source. Both RPCs returned valid options in Make.

The updated scenario completed five operations for five additional Make credits. Its existing attribute mapping was changed from `3.result.api_name` to `3.api_name` to match the corrected output. The expected missing-object test completed with zero credits and the API's actual 404 message. Both scenarios remain inactive. No enrichment, record writes or outreach was run. Unify billing was not separately queried.

- [Successful execution](https://us2.make.com/3421041/scenarios/7003064/logs/0f936ad092734b148e0cb65e3ecf4f7e)
- [Expected error execution](https://us2.make.com/3421041/scenarios/7003087/logs/567be0a4724b4c60a92e565026e6ba62)
- [Review page](https://us2.make.com/apps/unifygtm-qzxruy/1/review)

## Regeneration and upload

`python3 scripts/generate_make_release.py` generates `integrations/make/release/` independently of the prototype catalog. `node tools/make-uploader/review.mts` validates this release offline. Live uploads require an explicit scoped token file and backup directory. Prototype archiving is performed through the Make UI. The uploader never deletes modules or publishes archived prototypes.

Only five modules are requested for approval. Approval, directory publication and backlink attributes remain unconfirmed.
