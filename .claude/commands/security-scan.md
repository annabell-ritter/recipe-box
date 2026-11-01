---
description: Run the Supabase, Next.js and Vercel security scanners in parallel and merge their findings into one report
---

Run a security scan of this project with the three security subagents and merge their findings
into one report. This is a report only: nothing in the project changes.

## 1. Dispatch the scanners in parallel

In a single message, make three Agent tool calls so the scanners run at the same time, not one
after another:

- `subagent_type: supabase-security-scanner`
- `subagent_type: nextjs-security-scanner`
- `subagent_type: vercel-security-scanner`

Give each one this prompt, plus any extra focus the user passed: "$ARGUMENTS"

> Scan this project and return your report. Report only: do not edit, create or delete files,
> commit, deploy, or change the database or any Vercel or Supabase setting.

Wait until all three have returned before going on. If one fails or can't finish, keep the other
two reports and say in the final report which scanner didn't complete and why.

## 2. Merge the findings

- Put every finding under one of four groups: **Critical**, **High**, **Medium**, **Low**. Keep
  the severity the scanner gave it. The Supabase scanner has no Low group, so its findings only
  land in the first three.
- A finding is a duplicate when two or more scanners describe the same problem in the same place
  (same file and line, same variable, same table or policy, same header). List it once, under the
  highest severity any scanner gave it, and merge the details: keep the clearest description and
  combine the suggested fixes.
- After every finding, note which scanner(s) flagged it, for example
  `Flagged by: Supabase, Next.js`. When the scanners disagreed on severity, say so, for example
  `Next.js: High, Vercel: Medium`.
- Don't add findings of your own, and don't drop or soften a finding. If you aren't sure whether
  two findings are the same, list both.
- Never print the value of a key, token or secret, not even partly. Name the variable instead.

## 3. Report

Return one report in this shape:

```
# Security scan

Summary: <n> critical, <n> high, <n> medium, <n> low (<n> flagged by more than one scanner)

## Critical
### <short title>
- **Location:** ...
- **Risk:** ...
- **What could go wrong:** ...
- **Suggested fix:** ...
- **Flagged by:** ...

## High
...

## Medium
...

## Low
...

## What was checked
- Supabase: <the scanner's short list of checks, and any it couldn't run and why>
- Next.js: ...
- Vercel: ...
```

Write "None found" under an empty group.

Don't fix anything, even when a fix looks small. When the report is done, ask the user which
findings, if any, they want fixed.
