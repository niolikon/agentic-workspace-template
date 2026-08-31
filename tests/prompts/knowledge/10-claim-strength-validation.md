# Claim-strength-aware knowledge validation

**Agent:** Knowledge

## Recommended fixture

Use a disposable repository `Demo.ClaimValidation` with:

- a project manifest that explicitly declares a language/toolchain fact;
- source containing syntax whose validity depends on the configured language or
  compiler version;
- an explicit behavioural/configuration rule that can be understood directly
  from inspected repository content;
- optionally, an existing knowledge artifact containing a deliberately weak
  confirmed claim about the syntax.

A .NET fixture is particularly useful for reproducing the original class of
failure. For example, include a collection expression such as:

```csharp
Claim[] claims =
[
    new Claim("sub", userId),
    new Claim("role", "user")
];
```

Choose project/toolchain metadata so that the syntax validity can be established
from repository evidence, or intentionally omit the decisive setting for the
unresolved variant.

## Scenario A — toolchain-dependent claim

Run:

```text
/knowledge-init Demo.ClaimValidation
```

### Expected behavior

- Records accurately that the source syntax was inspected.
- Separates that observation from a claim about compilation validity.
- Inspects the relevant project/language/toolchain context before confirming a
  compilation-validity conclusion.
- Does not infer `invalid syntax`, `does not compile` or an equivalent defect
  from source appearance alone.
- If decisive semantics cannot be established, keeps the finding qualified or
  unresolved rather than confirmed.
- Uses `dependency-inspection` only if required semantics belong to an external
  library/framework/package and repository evidence is insufficient.
- Does not run a build or test merely because one could provide stronger
  evidence.

## Scenario B — direct manifest observation

Ensure the manifest contains an explicit declaration such as a language version,
target framework or equivalent stable project fact. Re-run initialization or a
focused update.

### Expected behavior

- Persists the declaration directly from the inspected manifest.
- Does not require unrelated compiler, dependency or runtime verification for
  the direct fact.
- Does not make the claim weaker merely because claim validation is enabled.

## Scenario C — explicit behavioural rule

Include an explicit rule whose meaning is directly supported by inspected
configuration or implementation, for example an authorization matcher with an
unambiguous permit/authenticate rule.

### Expected behavior

- Persists the behaviour directly supported by the inspected rule.
- Does not invoke unrelated toolchain verification.
- Keeps the evidence path/content traceable through the normal run-local ledger.

## Scenario D — correct a previously persisted weak claim

Seed the repository knowledge with a confirmed claim such as:

```text
JwtTokenFactory.cs contains invalid C# syntax and may not compile.
```

Then run:

```text
/knowledge-init Demo.ClaimValidation
```

or a focused `/knowledge-update` for the same finding.

### Expected behavior

- Inspects the existing knowledge before reconciliation.
- Acquires current repository evidence relevant to the disputed claim.
- Compares evidence sufficiency rather than treating existing validated knowledge
  as immutable.
- Corrects, removes or explicitly qualifies the stale claim when stronger current
  evidence contradicts it.
- Uses the canonical `knowledge_artifact_refresh` inspect/replace protocol when a
  structured repository artifact materially changes.
- Does not downgrade repository coverage solely because the individual finding
  was corrected.

## Scenario E — stable repeated analysis

Without changing the fixture or knowledge, repeat the same scoped initialization.

### Expected behavior

- Confirmed findings remain stable.
- Qualified/unresolved findings are not silently promoted without new evidence.
- Fresh inspection alone does not introduce a new speculative defect.
- No structured artifact is replaced when there is no material knowledge delta.

## TaskBoard regression

After the deterministic fixture passes, run the same safeguard against
`TaskBoard.Framework.Core`, especially the source that originally motivated this
test if it is present:

```text
/knowledge-init TaskBoard.Framework.Core
```

Use TaskBoard as a regression test, not as the only acceptance fixture: its
current source/configuration and accumulated knowledge may change, while the
dedicated fixture keeps the claim-strength scenarios deterministic.

## Failure checks

The test fails if any of the following occurs:

- a content read is treated as sufficient proof of every interpretation derived
  from that content;
- unusual syntax is persisted as a compilation defect without the relevant
  language/toolchain semantics being established;
- a framework/runtime/deployment outcome is confirmed from source appearance
  alone;
- an unresolved finding becomes confirmed on a later unchanged run;
- direct manifest or explicit behavioural facts trigger unnecessary unrelated
  verification;
- stronger current evidence cannot correct a weaker persisted claim;
- artifact refresh is used as a substitute for claim validation rather than
  after validation has established a material delta.
