---
name: code-review
description: "Review the current branch's diff before committing or opening a PR: single concern, conventions, code language, risky shared files, merge-conflict risk. Use when the user asks for a code review or 'is this ready'."
argument-hint: "[branch, optional]"
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /code-review — diff review

1. Delegate to **code-reviewer** with the branch name, `git.main_branch`, and the
   story id if known.
2. Report its verdict, issues and conflict risk. Offer to fix trivial issues (debug
   leftovers, comment language, naming) on the branch; scope issues (files that belong
   to another concern) need the user's decision: split into a new story or keep.
