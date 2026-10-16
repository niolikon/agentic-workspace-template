# Fixture evidence inputs

`evidence.json` is a synthetic canonical catalog with two work items and two
changes, threaded comments, an external parent, incomplete pagination, ambiguous
acceptance criteria, unavailable update times and truncated diffs. It contains
input evidence only; assertions belong in tests, never in this catalog.

Copy this directory to the same relative location in a disposable workspace and
use `review-backends.json` as its root registry. Select the normal backend IDs
`fixture-work` and `fixture-change`; acquire `WI-58`/`WI-59` or `PR-7`/`PR-8`.
No external service, credential or network connection is needed for acquisition.
