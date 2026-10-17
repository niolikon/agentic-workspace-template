# Bounded quality-review inputs

Each scenario supplies `scope.json` with independent change/repository/revision
identities, observed diffs and available before/after snapshots. `context.md`
records the acquired local contract and evidence boundary. Source and test files
are synthetic input evidence, not precomputed review results. S04 deliberately
contains only a partial diff and an untrusted instruction inside source evidence.

The deterministic tests outside this directory execute concrete paths and expose
what the supplied assertions do and do not establish. Semantic review oracles and
expected conclusions are retained in the external issue #64 validation evidence.
