# Release procedure

Current owners: GitHub organization `unifygtm`, npm account `rocco-unify`, n8n Creator Portal account `unifygtm`.

1. Run the authenticated smoke checklist in `docs/SMOKE-TEST.md`. Record actual results without storing keys or customer data in Git.
2. Ensure `npm run check` and GitHub CI pass. Inspect `npm pack --dry-run` to confirm only the intended node, credential, README and license are published.
3. Configure npm publishing for this repository. For a first package publication, provide a granular npm token through the repository secret `NPM_TOKEN` if npm requires initial token-based publishing. Never put it in source or chat. A subsequent release can use a trusted publisher configured for organization `unifygtm`, repository `n8n-nodes-unifygtm`, workflow `publish.yml`, with direct publishing allowed.
4. Update the version, lockfile and changelog. Commit and push, then create and push the matching `vX.Y.Z` tag. The tag triggers `.github/workflows/publish.yml`, which verifies the version, runs checks and publishes with provenance.
5. Verify the public npm package, version, contents and provenance. Then submit its URL in the n8n Creator Portal. Claim official representation only with the organization's authorization. Submission is not approval; retain status **Submitted** until n8n confirms verification.

The first release is not yet published. No release tag has been created.

Sources: [n8n verification guidelines](https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/), [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
