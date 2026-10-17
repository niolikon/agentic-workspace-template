# Functional requirement assessment evidence

Synthetic canonical inputs for issue #63. Each scenario directory contains
provider fixture catalogs, a registry and independent reference selections.
`evidence.json` is the combined input for deterministic fidelity comparisons;
the registry selects the separate originating-backend catalogs through existing
acquisition interfaces. No review verdicts or expected findings are fixture data.

S01: bounded size; S02: API/client cursor; S03: cap plus default;
S04: complete unbounded implementation; S05: applicable cap refinement plus a
later future-release question; S06: ambiguous criteria and truncated implementation;
S07: two items and three changes with shared API contributions; S09: provider-renamed
S01 inputs. S08 provenance is checked across every case, not a separate input.

Deterministic tests exercise real acquisition and confirmed handoff, field fidelity,
read-only behavior and provider metamorphism. They do not test language-model
reasoning. The independent OpenCode suite, predeclared semantic oracles, negative
controls and trace reviews are retained outside the candidate under
`harness-results/issue-63/iteration-01/`.
