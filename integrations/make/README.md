# Unify custom app for Make

Status: source draft. No Make account has been connected, and these components have not been executed in Make or submitted for review.

The generated source contains 78 API operation modules and one universal API-call module. `manifest.json` is a local inventory, not a supported one-click import format.

## Load in Make

1. Create a Make account and open the custom app developer area. Create a private **Unify** app, version 1.
2. Copy `base.json` into Base.
3. Add a basic API-key connection. Copy its Parameters and Communication from `connections/api-key/`. Attach this connection to each module.
4. For each directory under `modules/`, create a module of the type in `metadata.json`, then paste its Communication, Mappable Parameters and Interface files into the matching editor tabs. Metadata records guide editor setup; they are not an API import payload.
5. Enter a dedicated Unify test key in the connection. First test **List Objects**, then the smoke-test matrix and every module's success/error paths. Capture actual output samples in the Make editor after testing.
6. Complete branding, app documentation and review requirements in Make before requesting a public listing.

## Behavior and limitations to validate

- Write modules accept the complete request body as JSON. The schemas are in `../../docs/operation-contracts.json`.
- Search modules paginate and return individual bundles, with a required total limit. Make imposes its own request and runtime limits.
- Date output values remain ISO strings in this source draft. Convert to native Make date fields and verify mapping during platform testing.
- Enrollment status and sequence step type filters accept one value in the generated search UI. For repeated filters use **Make an API Call**, including repeated query keys in the relative URL.
- Polymorphic or dynamically keyed response objects use an `any` interface where a single structure cannot describe the API. Expand those interfaces from real test responses before review.
- **Make an API Call** always prefixes the Unify API host. Enter a relative URL such as `/data/v1/objects`; authentication is provided by the connection. Redirects are disabled in Base.
- Analytics is excluded because it uses different credentials and has no documented read-only connection test.

The automated tests check component coverage and structural invariants. They do not evaluate Make IML, validate editor acceptance or prove API execution. These are required next steps in a real Make account.

Sources: [Make custom apps](https://developers.make.com/custom-apps-documentation), [pagination](https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination), [universal module](https://developers.make.com/custom-apps-documentation/app-components/modules/universal-module/rest).
