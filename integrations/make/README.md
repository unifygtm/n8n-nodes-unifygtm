# Current review scope

The five-module release lives in [release/](release/). The 74 remaining prototype modules are archived in Make after the November 11 review. The original catalog below is retained for future development and is not a validated release. See [REVIEW-FIXES.md](REVIEW-FIXES.md).

# Unify custom app for Make

Status: submitted to Make for review on November 11, 2026. Make displays **pending approval** and **Review process started**. The app is published for invite-link distribution, with five visible modules: List Objects, Get Object, List Object Attributes, Get Object Attribute, and Make an API Call. The other 74 uploaded modules remain hidden and are outside this initial review scope. Catalog approval and an integration directory page are not yet confirmed.

All 79 modules, Base and connection sections were uploaded through the official Make SDK and read back exactly. The five visible modules completed one authenticated, read-only scenario successfully (5 operations, 5 Make credits). A separate missing-object test returned a sanitized HTTP 404 error (1 operation, 0 Make credits). These tests read schema definitions only; no enrichment, record changes or outreach was performed. Both scenarios remain inactive. The temporary SDK token was revoked and its local file removed after submission.

See [validation evidence](VALIDATION.md) and [user documentation](APP-DOCUMENTATION.md).

The generated source contains 78 API operation modules and one universal API-call module. `manifest.json` is a local inventory, not a supported one-click import format.

## Load in Make

1. Create a Make account and open the custom app developer area. Create a private **Unify** app, version 1. Use `assets/unify.png` as the app icon: the official orange monogram on a transparent square canvas.
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

The automated tests check component coverage and structural invariants. They do not evaluate Make IML, validate editor acceptance or prove API execution. The five visible modules were additionally exercised in the real Make account. The remaining 74 modules still need live testing before publication.

An additional check against the official Make editor schemas identified and corrected the redirect directive names (`followRedirects` and `followAllRedirects`) and omitted empty parameter help strings. Schema warnings about absent bodies on bodyless POST actions are advisory: those provider operations do not define request bodies. The five visible modules passed the runtime checks above. Broader validation remains pending for hidden modules.

Sources: [Make custom apps](https://developers.make.com/custom-apps-documentation), [pagination](https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination), [universal module](https://developers.make.com/custom-apps-documentation/app-components/modules/universal-module/rest).
