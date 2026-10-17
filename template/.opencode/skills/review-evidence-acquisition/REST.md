# Internal read-only REST adapter runtime

`rest.ts` is a library for trusted provider implementations, not an agent tool
or an installed live adapter. `review_evidence_acquire` continues to support
fixtures only. Do not expose a generic HTTP operation to agents or skills.

Call `readRest(workspace, {family, backendId, repository?}, operation, options?)`
inside a provider tool. The explicit backend is looked up again through the
validated registry; fixture backends are rejected. The configured HTTPS base URL
is the service/API root; relative endpoints append to its path. Each provider
adapter must register only documented read-only GET endpoints and construct paths
from validated/encoded resource IDs. GET alone does not establish service-side
read-only semantics: the adapter must never register GET endpoints with effects.
No caller-supplied methods, bodies, headers or arbitrary URLs belong in tool args.

Trusted `ReadOperation<T>` supplies `path`, `auth` and `decode(unknown)`.
Authentication supports anonymous, bearer, private-token and Basic (environment
value is the complete user:password pair). Only the runtime reads `credentialEnv`
at execution time. Missing credentials fail closed without backend fallback.
Never return the internal lookup or log requests, headers, raw responses or errors.
The adapter receives parsed unknown data, never auth material. Normalize by
allowlisting fields and type-checking optional values; ignore unknown fields and
represent missing/invalid optional evidence explicitly. Return `{items, partial?,
next?}`; `next` is a root-relative/absolute scoped URL or a base-relative path,
including any opaque pagination query. Cursor/page-number APIs construct that URL
in their trusted decoder. Provider-specific pagination is not inferred.

Results contain `state`, `items`, `pages` and optional fixed `failure` code.
`available` includes a confirmed empty collection. `partial` preserves completed
pages when a later request/decoder fails, a next link is unsafe, a cycle/page bound
is reached, or the decoder marks incompleteness. A failure before the first valid
page is `unavailable`; it never proves a requirement violation or resource absence.
The adapter maps this state to canonical EvidenceField states with originating
backend, source resource, retrieval capability/mode and explicit limits. This
library does not create canonical provenance, cache responses or persist evidence.

Failure codes: `invalid-request`, `invalid-config`, `credentials-unavailable`,
`unauthorized` (401/403), `not-found` (404), `rate-limited` (429), `http-error`
(including redirects), `network-error`, `timeout`, `invalid-response`,
`pagination-limit`. Error bodies, headers and exception messages never escape.
No retries are automatic. Each page has a deadline covering fetch and body reads
(default 15 s; max 120 s). Default limits: 20 pages and 2 MiB per page; maxima:
1000 pages, 16 MiB. Cycles are rejected. All requests use GET and manual redirects;
next links must remain in the same HTTPS origin and API path-segment boundary.
Credentials in URLs, fragments, traversal and encoded path separators are rejected.

After normalization, the runtime redacts its active credential, URI-encoded and
Base64 forms and Authorization value recursively in keys/values before returning
items. Redaction is defense in depth: providers must still omit unrelated secrets
and sensitive fields. Arbitrarily transformed or unrelated secrets cannot be
recognized. Credentials remain only in process memory and transport headers;
agents/skills receive neither values nor credential references. Use TLS with
normal certificate verification. The optional `transport` injection is for trusted
local tests; production uses native fetch and must never log credential material.

Run `node --experimental-strip-types --test tests/review-rest-runtime.test.mjs`
from the template development repository for deterministic transport-boundary tests.
