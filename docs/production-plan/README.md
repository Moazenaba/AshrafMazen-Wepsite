# Production plan (audit of 2026-11-15)

The site was explored end to end (code, live site, Vercel logs, the admin panel) and every weakness that can
break it, leak data, or hide a failure was written down with its evidence. This folder is the result.

## How to use it

Start a session in the repository folder and give the model this command:

```
/goal Read GOAL.md and follow it exactly until it says you are finished.
```

To continue in a later session, give the same command: the model reads `STATE.md` and resumes.

## Files

| File | What it is |
|---|---|
| `../../GOAL.md` (repository root) | **The master file, the only one you call.** Rules, the 16 steps in order, the procedure per step, the self-review, when to stop, the final review. |
| `STATE.md` | Progress ledger. The executor updates it after each step; it is the memory between sessions. |
| `OWNER-ACTIONS.md` | What only the owner can do (rotate secrets, two-factor, plans, backups, run SQL, merge). |
| `problems/01-security.md` | SEC-01..12 |
| `problems/02-reliability.md` | REL-01..13 |
| `problems/03-data-and-integration.md` | DAT-01..07, INT-01..10 |
| `problems/04-observability-testing-ops.md` | OBS-01..06, TST-01..06, PRF-01..04, OPS-01..06 |
| `wp/WP-NN-*.md` | One file per work package: exact steps, files, tests, the verify command, "done when". |

## Honest limits

- "Zero errors for a billion visitors" is not something code alone gives. This plan gets the code, tests and
  alarms to a professional level; the free Vercel and Supabase plans, the `r2.dev` address, backups and
  two-factor sign-in are owner decisions (`OWNER-ACTIONS.md`) and matter as much as the code.
- The plan was written from reading the code; a step can meet code that changed. The executor is told to stop
  and record instead of guessing.
