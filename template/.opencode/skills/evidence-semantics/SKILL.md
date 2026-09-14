---
name: evidence-semantics
description: Interpret workspace source roles, contextual authority, claim certainty and evidence conflicts
---

# Evidence semantics

Use this skill when an answer depends on what a workspace source means, how much
a claim from it establishes, or how evidence from different source classes should
be reconciled.

This skill interprets evidence already discovered through workspace retrieval. It
does not own broad candidate discovery, repository traversal or source mutation.

## Source roles

Treat workspace source classes as semantic roles rather than interchangeable file
locations:

- `knowledge-base/` is curated implementation-derived evidence. Prefer it for
  efficient high-level understanding of analysed implementation concerns, but do
  not treat it as an independent normative authority. Escalate to repository
  evidence when freshness, precision, ambiguity or missing detail requires direct
  verification.
- `documents/` is reviewed or official project evidence. Treat it as the normal
  authority for approved intent, architecture, procedures, specifications and
  formally documented decisions. It does not silently override direct repository
  evidence when the question is about current implemented behaviour.
- `trainings/` is expert-derived contextual evidence. It may strongly support an
  explanation, but may be simplified, incomplete, perspective-dependent or stale.
  Do not promote it automatically to a formal specification.
- `notes/` is working contextual evidence. Preserve hypotheses, TODOs, open
  questions, recollections and proposals as such; declarative wording alone does
  not make a note a confirmed project fact. Notes may still be the most applicable
  source when the user asks about current investigation, thinking or pending work.
- `repositories/` is primary implementation evidence. Source, configuration,
  manifests, interfaces and tests directly support questions about what is
  implemented, but do not by themselves establish approved project intent.

Repository and dependency evidence-strength rules owned by other capabilities
remain in force.

## Contextual precedence

Do not define or infer one global source ranking. Determine precedence from the
semantic question being asked.

Examples:

- current implementation: generated knowledge may lead efficient retrieval, with
  repository evidence providing direct verification when needed;
- official or approved behaviour: reviewed documents are the primary normative
  evidence, with implementation differences reported separately;
- onboarding or expert explanation: training material is directly applicable;
- current investigation or proposal: notes may be directly applicable while
  retaining their working status;
- design rationale: combine the source classes that actually carry rationale and
  use repository evidence only to confirm the resulting implementation where
  relevant.

Retrieval convenience is not authority. A source inspected first must not become
more authoritative merely because it was cheaper or easier to retrieve.

Preserve the selected semantic role through the final answer. Once the user's
question establishes an applicable primary role and evidence from that role has
been inspected, evidence acquired from other roles remains supporting,
contradictory or implementation-verification evidence unless the user changes
the question. Do not silently promote a supporting source to the requested role.

In particular, `knowledge-base/` remains curated implementation-derived evidence
even when an artifact is marked high-confidence or summarizes a business rule.
Do not describe it as an official document, formal specification, normative
authority or authoritative project record unless the artifact itself is the
explicit subject of the question. For questions about what is officially or
formally documented, `documents/` evidence is the primary normative evidence.
If inspected official documentation only partially answers the question, state
that documented boundary explicitly; implementation-derived knowledge may explain
or corroborate behaviour, but must not be used to manufacture an official claim
that the reviewed document does not establish.

## Claim certainty

Preserve source role and claim certainty as separate dimensions. Useful qualitative
states include:

- observed or confirmed;
- strongly supported;
- tentative;
- speculative;
- unresolved.

Do not assign artificial numeric confidence. Do not give every statement in one
source class identical certainty: claim wording, provenance and corroborating or
contradictory evidence still matter.

## Multi-source reconciliation

Reconcile evidence at claim level rather than flattening all inspected material into
one source pool. For each material claim used in the answer, reason through:

```text
claim
    ↓
source role
    ↓
semantic applicability to the user's question
    ↓
directness / temporal context / certainty
    ↓
agreement, conflict or different-context relationship
    ↓
final supported conclusion
```

This is an interpretation step over evidence already acquired through the retrieval
strategy. It must not trigger broad workspace scanning merely because multiple
source classes exist.

When multiple source roles agree, synthesize the shared conclusion only to the
strength they jointly support while retaining their distinct meanings. Agreement
between curated knowledge and repository source can strengthen a current
implementation conclusion; agreement from reviewed documentation can additionally
show that the behaviour is officially documented. Do not imply that those sources
are interchangeable or that repeated contextual claims override direct evidence.

When a source contributes useful explanation without directly establishing the
requested fact, preserve it as context. Training material can explain a concept,
notes can record a proposal or investigation, and roadmap/design material can record
future intent without becoming evidence that the behaviour is currently
implemented.

## Conflict semantics

When relevant evidence disagrees:

1. identify the conflicting material claims and keep their provenance separate;
2. determine the semantic question each claim can actually answer;
3. identify the evidence role most directly applicable to the user's question;
4. consider directness, temporal or version context, and claim certainty where they
   are available from observed evidence;
5. prefer the claim that directly supports the requested semantic question;
6. report meaningful disagreement when it affects interpretation of the answer;
7. avoid declaring another source wrong when it may describe a different timeframe,
   intent, simplification or working context;
8. weaken or leave the conclusion unresolved when the observed evidence cannot
   safely determine which claim applies.

Do not silently discard a conflicting claim and do not resolve disagreement through
a static directory hierarchy, source count or inspection order.

For example, an official document can remain normative for a documented
specification while repository evidence simultaneously shows that today's
implementation differs. A training statement may remain useful explanatory context
while repository evidence shows a different configurable default. A note describing
a possible change remains a proposal when approved or implementation evidence still
shows the current value.

## Temporal interpretation

Before treating differing claims as contradictory, determine whether observed
content places them in different temporal or version contexts. Distinguish current
state, approved future intent and working proposal when the evidence supports those
roles.

Use timestamps, versions, roadmap wording, issue state or other temporal evidence
only when they were actually observed. Do not invent dates, freshness guarantees or
a historical sequence from directory names or intuition alone.

A generated knowledge artifact that conflicts materially with direct repository
evidence can be described as possibly stale or incomplete only to the degree the
observed conflict supports. The conflict does not authorize Ask to modify the
knowledge base.

## Specialized analysis composition

Source reconciliation determines how claims from heterogeneous evidence roles relate
to the user's question. It does not duplicate technical analysis owned elsewhere.
For example, let `configuration-resolution` establish an effective configuration
chain, `execution-flow-analysis` establish propagation, `architecture-analysis`
establish architectural relationships and `impact-analysis` establish affected
surfaces. Reconcile the resulting evidence with documents, trainings, notes or
knowledge after those capabilities have established their own technical claims.

Reuse evidence already acquired for a specialized analysis. Do not rerun equivalent
retrieval merely to perform reconciliation.

Do not strengthen the evidentiary meaning of discovery results during reconciliation.
A candidate path, inventory entry or repository search match remains evidence only
for what that acquisition directly exposed. Before describing a file as supporting
a behavioural, test, configuration or design claim, require that the relevant
content itself was observed in the active run or attribute the claim to an inspected
persisted artifact that records it. If the candidate is merely corroborative and
not needed to answer the question, omit the claim instead of expanding retrieval.

## Run-local provenance boundary

Persisted workspace evidence can describe actions performed when that artifact was
created, such as files being read, commands being executed, dependencies being
inspected or configuration being rendered. Treat those statements as provenance
of the persisted artifact, not as actions performed by the active Ask run.

A final answer may say that inspected knowledge records or reports such a prior
observation, but must not restate it as `read in this run`, `observed in this run`,
`verified in this run`, `executed in this run` or equivalent unless the active tool
trace actually acquired that evidence directly. Repository paths mentioned inside
knowledge remain transitive provenance until the repository source itself is read
or otherwise directly observed by a permitted current-run evidence capability.

Before final synthesis, apply this provenance gate to every material claim:

1. identify whether the claim is supported by direct current-run acquisition or only
   by inspected persisted evidence;
2. preserve persisted observations as attributed historical evidence when they are
   still useful;
3. remove current-run wording that is not backed by an actual current-run read,
   search content hit or specialized tool result; and
4. acquire direct repository evidence when a material present-state conclusion
   requires confirmation beyond the persisted artifact.

This boundary applies even when the persisted artifact itself uses phrases such as
`in this run`; the deictic phrase belongs to the artifact-producing run, not to the
current Ask session.

## Reporting

Use workspace-relative evidence paths and describe claims according to the role
they actually support: current implementation, official project statement, expert
context, working context or unresolved interpretation. Preserve meaningful
uncertainty and source disagreement in the final answer.

When the user asks according to a specific evidence role, lead the answer with
what the inspected evidence from that role establishes. Label evidence from other
roles by its actual function (for example, implementation confirmation or expert
context) rather than using generic authority language such as `more authoritative`,
`lower-authority` or `best authoritative source` across source classes.
