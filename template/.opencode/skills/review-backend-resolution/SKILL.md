---
name: review-backend-resolution
description: Discover and select configured work-item and change evidence backends for Review, with deterministic precedence, explicit ambiguity and credential isolation
---

# Review backend resolution

Use for selecting acquisition backends before provider retrieval. This capability
owns backend configuration and selection, not remote acquisition or review reasoning.
Use `review-evidence-model` for normalization after acquisition.

## Configuration contract

The only configuration source is workspace-root `review-backends.json`, strict JSON
with `schemaVersion: "review-backends/v1"`. Do not add custom backend keys or secrets
to `opencode.jsonc`; it remains native OpenCode configuration. No nested repository,
user-global or model-provider configuration is merged. Missing configuration means
unavailable; malformed configuration means invalid-config, never silent fallback.

Required independent arrays `workItemBackends` and `changeBackends` contain zero or
more entries. Each entry has:

- `id`: stable, case-sensitive identifier matching `[A-Za-z0-9][A-Za-z0-9._-]*`,
  unique across both families. Preserve IDs across display-name/connection changes;
  never derive them from array position, URL, provider or credentials. To use one
  service in both families, declare two explicit IDs.
- `provider`: stable provider type (e.g. `jira`, `github`, `gitlab`, `bitbucket`,
  `azure-devops`); new types require an acquisition adapter before retrieval.
- `baseUrl`: explicit HTTPS service/API root, including a self-hosted path if needed.
  No userinfo, query, fragment, interpolation or secret-bearing URL is allowed.
- Optional `credentialEnv`: environment-variable NAME matching
  `[A-Za-z_][A-Za-z0-9_]*`, never its value
  and never OpenCode `{env:...}` expansion. Omit for unauthenticated acquisition.
- Optional `repository` and `project`: exact non-secret provider scope identities.
  Repository limits compatibility; project is connection context for the adapter.

Unknown fields, duplicate IDs, inline auth fields and dangling or wrong-family
selection references invalidate the configuration. All metadata must be secret-free;
schema validation cannot recognize a secret disguised as an ordinary name.

Optional `defaults` contains `workItemBackend` and/or `changeBackend` IDs.
Optional `repositoryHints` maps exact repository identities to the same selection
shape. Absence of a family selection never copies the other family's selection.
Example (all service names are synthetic):

```json
{
  "schemaVersion": "review-backends/v1",
  "workItemBackends": [
    {"id":"jira-team", "provider":"jira", "baseUrl":"https://issues.example.test", "credentialEnv":"REVIEW_JIRA_TOKEN", "project":"TEAM"},
    {"id":"gitlab-issues", "provider":"gitlab", "baseUrl":"https://git.example.test/api/v4", "credentialEnv":"REVIEW_GITLAB_TOKEN"}
  ],
  "changeBackends": [
    {"id":"gitlab-changes", "provider":"gitlab", "baseUrl":"https://git.example.test/api/v4", "credentialEnv":"REVIEW_GITLAB_TOKEN", "repository":"team/service"}
  ],
  "defaults": {"workItemBackend":"jira-team"},
  "repositoryHints": {"team/service":{"changeBackend":"gitlab-changes"}}
}
```

## Resolution procedure

Invoke `review_backend_resolve` separately for the work item and for each change
request, supplying `family` and only selectors actually observed in the request
or secret-free repository evidence. Do not read configuration directly or inspect
the process environment. The tool reads the fixed configuration file and never
accesses credential values. It is the authoritative mechanical selector.

Precedence within each family:

1. `backendId` explicitly supplied by the user for that resource;
2. the family ID in project `defaults`;
3. the configured `repositoryHints` entry and/or an observed `backendHint`;
4. safe inference among configured entries compatible with the supplied scope,
   only if exactly one remains.

At the first applicable level, an invalid ID or incompatible resource is an
invalid-request, not permission to try a lower level. Conflicting repository
hints are ambiguous. Lower levels never override a higher-level selection.
Use request IDs per change request; one review can use several change backends.

Compatibility requires exact repository equality when both request and backend
declare it, and equal URL origin plus a path-segment prefix under `baseUrl` when
`resourceUrl` is supplied. Use an API URL for API roots; a human page URL outside
that root is not equivalent. No short-name, substring-host or provider-name guessing.
Repository metadata may contribute explicit backend IDs or a sanitized source URL;
do not read nested OpenCode configs or raw credential-bearing Git configuration.
If safe metadata is absent, leave selectors absent; never invent a hint.

`resolved` returns `source` (`request`, `project`, `repository`, `inference`) and
an allowlisted backend descriptor with the stable `id`, provider and connection
scope, excluding credential references. `ambiguous` returns sorted candidate IDs
and no selected backend. Ask for the intended ID. `unavailable`, `invalid-request`
and `invalid-config` stop acquisition for the affected resource. Do not try each
backend, infer a new unconfigured backend, or convert resolution errors into
normalization provenance. Selection alone proves no retrieval or authentication.

## Acquisition and secret boundary

Pass the exact resolved ID as `backendId`, together with the family and source
resource identity, to the evidence-acquisition capability. Its trusted adapter
looks up that entry again and resolves `credentialEnv` internally at execution time.
Credentials must never become skill arguments, prompts, tool output, logs,
provenance, diffs or persisted evidence. Adapters must redact transport failures.
Never ask an agent to expand, print, test or forward an environment variable.
Missing credentials are an acquisition limitation, not grounds to select another
backend. The resolver intentionally neither checks credentials nor calls services.

Record this originating ID in normalized `Provenance.backend`; preserve additional
cache/fixture origins according to `review-evidence-model`. Selecting a backend
before acquisition does not authorize repairing missing origins in existing data.
Provider adapters and acquisition skills are separate capabilities; if absent,
report acquisition unavailable rather than using shell/curl with a token.
