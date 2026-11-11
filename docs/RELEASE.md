# Release procedure

Current owners: GitHub organization `unifygtm`, npm account `rocco-unify`, n8n Creator Portal account `unifygtm`.

1. Run the authenticated smoke checklist in `docs/SMOKE-TEST.md`. Record actual results without storing keys or customer data in Git.
2. Ensure `npm run check` and GitHub CI pass. Inspect `npm pack --dry-run` to confirm only the intended node, credential, README and license are published.
3. Configure npm publishing for this repository. For a first package publication, provide a granular npm token through the repository secret `NPM_TOKEN` if npm requires initial token-based publishing. Never put it in source or chat. A subsequent release can use a trusted publisher configured for organization `unifygtm`, repository `n8n-nodes-unifygtm`, workflow `publish.yml`, with direct publishing allowed.
4. Update the version, lockfile and changelog. Commit and push, then create and push the matching `vX.Y.Z` tag. The tag triggers `.github/workflows/publish.yml`, which verifies the version, runs checks and publishes with provenance.
5. Verify the public npm package, version, contents and provenance. Then submit its URL in the n8n Creator Portal. Claim official representation only with the organization's authorization. Submission is not approval; retain status **Submitted** until n8n confirms verification.

After the initial release, revoke the temporary npm token and remove `NPM_TOKEN` from GitHub. Further releases require a newly authorized credential or configured trusted publisher.

Sources: [n8n verification guidelines](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines/), [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

## Initial release record

On November 11, 2026, version [0.1.0](https://www.npmjs.com/package/n8n-nodes-unifygtm/v/0.1.0) was published through [GitHub Actions](https://github.com/unifygtm/n8n-nodes-unifygtm/actions/runs/43120919498) from commit `b6c6c3b71a21f1b35dc125fef1ffa45581cf0834`. The registry tarball integrity, node and credential entry points, orange monogram, latest tag and provenance were verified. Build, lint and all 18 automated tests passed.

The temporary publishing token was revoked and the GitHub `NPM_TOKEN` secret removed. Trusted publishing is not configured.

The package was submitted to the n8n Creator Portal and ownership was confirmed. Automated review passed. A continuous demo video (approximately 2 minutes 40 seconds) was uploaded, and the portal confirmed manual review is **UNDER REVIEW**. The portal estimates up to four weeks for review. This is not n8n approval or a public integration listing. Live API validation remains limited to the read operations documented in `SMOKE-TEST.md`.
