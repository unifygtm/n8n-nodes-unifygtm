# Unify

Connect [Unify](https://www.unifygtm.com/) to your Make workflows. Inspect object definitions and attributes, or make authenticated requests to the Unify API.

## Create a connection

Create an API key in [Unify Settings > Developers](https://app.unifygtm.com/dashboard/settings/data/developers). In a Unify module, select **Create a connection**, name the connection, and enter your API key. Make validates the key by reading object definitions. The connection does not create or enrich records.

## Choose a module

Use **List Objects** to inspect available object definitions. **Get Object** retrieves one definition by its API name, such as `company`. **List Object Attributes** lists the fields defined on an object. **Get Object Attribute** retrieves a field definition by its API name.

List and search modules return one bundle per result. **Limit** caps the total number of returned bundles. Use a low limit when testing.

**Make an API Call** uses the same connection. Enter a relative path beginning with `/`, such as `/data/v1/objects/company`, and select an HTTP method. Authorization is included automatically.

For API requests with a body, use the complete JSON body described in the [Unify API documentation](https://docs.unifygtm.com/). Keep JSON value types intact. Query jobs are asynchronous: check job status before retrieving results.

Creating enrollments, approving enrollments, and resuming sequences can start outreach. Use the appropriate Unify workspace and controlled recipients when testing those actions.

## Support and source

See the [integration repository](https://github.com/unifygtm/n8n-nodes-unifygtm/tree/main/integrations/make) for operation coverage and current validation status. Report integration issues through the repository's issue tracker without including credentials or private record data.
