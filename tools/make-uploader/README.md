# Make component uploader

Private development tooling, separate from the published n8n package. Uses the official `@makehq/sdk` pinned to 1.8.1 and Node.js 24.

Run `npm ci --ignore-scripts` in this directory, then `node upload.mts` for a credential-free source check. Live upload requires the explicit `--live` flag and environment variables `MAKE_API_KEY`, `MAKE_ZONE`, `MAKE_APP_NAME`, `MAKE_CONNECTION_NAME`, `MAKE_MODULE_TYPES_JSON`, and `MAKE_UPLOAD_REPORT_DIR`.

The app and its API-key connection must already exist. The uploader refuses public apps, unexpected module names, and missing module type mappings. Obtain type IDs from the current Make editor or API contract; the editor used for the initial upload exposed Action 4, Search 9, and Universal 12. Local snake_case operation identifiers map to camelCase Make module names because the editor disallows underscores.

Each section is read back and compared exactly. Progress reports contain section hashes, not source content or credentials. Retries are disabled. After a partial failure, inspect the failed component before rerunning; writes are not transactional. The uploader never publishes the app, activates scenarios, or calls the Unify API.

Keep the temporary Make token outside this repository, scope it to SDK app read/write only, and revoke it after the authorized setup work.

The uploader is a standalone TypeScript ES module (`.mts`), outside the n8n runtime. CI checks it separately with TypeScript and an offline source validation. The default strict n8n lint configuration remains unchanged.
