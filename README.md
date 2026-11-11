# n8n-nodes-unifygtm

Connect n8n workflows to the [Unify API](https://docs.unifygtm.com/). The Unify node implements 78 operations across the Data, Sequences and Tasks APIs.

**Release status:** implementation, automated tests and limited authenticated read-only smoke tests complete. Broader operation testing, npm publication and n8n verification are pending. This repository does not imply an approved marketplace listing.

## Capabilities

- Read, create, update, find and upsert object records.
- Manage objects, attributes, attribute options, lists and list entries.
- Read sequences and steps, and manage sequence enrollments.
- Create and manage tasks.
- Submit asynchronous query jobs, inspect their status and retrieve their results.
- Paginate list results using cursors or numbered pages, with a total output limit.

[Full operation coverage](docs/API-COVERAGE.md) and [request schemas](docs/operation-contracts.json) are generated from the pinned public OpenAPI files in `sources/`.

## Credentials

Create a key in [Unify Settings > Developers](https://app.unifygtm.com/dashboard/settings/integrations/api-keys), then enter it in an **Unify API** credential in n8n. The connection test performs a read-only `GET /data/v1/objects` request. Keys are sent using `X-Api-Key` to `https://api.unifygtm.com`.

Analytics uses a separate Write Key and API host. Its three operations are excluded from the shipped package because the public schema provides no read-only credential test. The unfinished source is retained under `experimental/analytics/`.

## Local development

Use Node.js 24.15 or newer on the 24.x line, or another supported version from `package.json`.

```sh
npm ci
npm run check
npm run dev -- --custom-user-folder /tmp/unify-n8n-preview
```

The official n8n development CLI starts an isolated local instance and registers this node. Add a Manual Trigger and a Unify node, select **Objects > List Objects**, and select your credential. This verifies a read operation without editing workspace data.

After public npm publication, self-hosted users can install `n8n-nodes-unifygtm` through **Settings > Community Nodes**. n8n Cloud availability requires n8n verification first.

## Usage

Choose a resource and an operation. Required inputs appear directly; optional values are in **Additional Fields**. Object maps, arrays and polymorphic request bodies accept JSON or n8n expressions returning structured values. These are actual API payloads, not JSON strings embedded inside the request.

For an upsert, provide the object API name and a **Match** JSON object containing a unique attribute. Add **Create**, **Create Or Update**, or **Create Or Update If Empty**. Attribute names and values must match your workspace schema.

List operations return one n8n item per record. **Limit** caps the total across pages. **Return All** follows pagination, with a guard of 1,000 pages per input item. Query job creation does not poll automatically: use a Wait node and a job status operation before requesting results.

Write operations return the full API response, including partial-success details for list entry operations. Writes are not retried by this node. Configure n8n retries only when repeating the selected operation is appropriate. Deletion, enrollment, approval and resume operations can change workspace data or start outreach.

## Implementation and validation

This is a programmatic node because the APIs use multiple pagination strategies, varying array response keys, total output caps and operation-specific validation. HTTP requests use n8n's authenticated request helper. There are no runtime package dependencies beyond n8n's peer dependency.

Automated tests cover operation contracts, representative request schemas, pagination, limits, item linkage, input validation, partial-success responses and credential-safe error handling. They use mocks and synthetic examples, not live customer data. Nested JSON schemas are validated by Unify during real requests; the node validates required fields, JSON shape and documented top-level bounds locally.

Run `npm run generate` after intentionally updating the public source schemas. Review the resulting API changes before shipping a new version.

## Make

[Make custom app source](integrations/make/README.md) includes 78 operation component sets and a universal API-call module. It is a source draft for the Make developer editor, not a scenario blueprint or a deployed app. Make account setup and runtime validation are pending.

## Release

See [release instructions](docs/RELEASE.md). Publication uses GitHub Actions and npm provenance. The Creator Portal submission follows npm publication.

## License

MIT. See [LICENSE](LICENSE). The Unify name and logo identify the service and are not licensed for unrelated use by the source code license.
