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

## Conflict semantics

When relevant evidence disagrees:

1. determine the kind of fact the user is asking for;
2. identify the evidence role most directly applicable to that semantic question;
3. preserve the workspace-relative provenance of the conflicting claims;
4. prefer direct evidence for the requested semantic question;
5. report meaningful disagreement when it affects the answer;
6. weaken the conclusion when available workspace evidence cannot resolve it.

Do not silently discard a conflicting claim and do not resolve disagreement through
a static directory hierarchy.

For example, an official document can remain normative for a documented
specification while repository evidence simultaneously shows that today's
implementation differs. The answer should state the applicable conclusion and the
relevant discrepancy instead of collapsing both into one fact.

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
