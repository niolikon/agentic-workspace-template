---
description: Initialize the structured workspace knowledge base
agent: knowledge
subtask: false
---

Optional repository scope supplied by the user:

$ARGUMENTS

Execute the repository/workspace initialization workflow defined by
`knowledge-initialization`.

Load `knowledge-initialization` before starting and let that skill select and
compose the shared analysis, evidence, persistence and coverage capabilities it
requires.

The command owns only initialization intent and the user-supplied scope. Do not
reimplement the initialization procedure in this command prompt.
