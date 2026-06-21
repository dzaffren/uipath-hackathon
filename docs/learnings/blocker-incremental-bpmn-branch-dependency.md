# blocker: incremental-bpmn-branch-dependency

## What Failed

Starting a new feature branch from `master` when the spec references gateway
stubs or BPMN nodes that were introduced in a prior feature branch but have not
yet been merged to `master`. The referenced stubs are absent on the new branch,
causing the build to fail or silently produce an incomplete BPMN graph.

## Resolution

Before branching, check which gateway stubs the spec references and confirm
they exist in the base branch. If they live on a prior feature branch that has
not been merged, branch off that feature branch instead of `master`.

## Why

This repo delivers BPMN incrementally — each feature branch adds gateway stubs
that the next spec completes. Branching from `master` skips whatever the
in-flight feature branch contributed, leaving nodes the spec depends on absent.

## Example

The `maker-checker-challenger` spec depended on the `high_challenger` gateway
stub that was added in `feature/red-flag-override`. Starting from `master`
would have omitted that stub; branching off `feature/red-flag-override`
provided it.

## Source

Observed at the start of the maker-checker-challenger build session when the
caller confirmed the correct base branch before proceeding.
