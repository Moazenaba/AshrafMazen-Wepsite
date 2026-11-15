# GOAL: make this site production-grade, one work package at a time

You are the executor. This file is your only instruction set. Read it fully, then `STATE.md`, then start.
Do not re-audit the project: the audit is done (`problems/`), and each fix is specified (`wp/`).

## 1. The goal and when you are finished

**Finished** = every row of the table in `STATE.md` is `DONE` or `BLOCKED` (with a reason), and the final review
(section 8) is written in `STATE.md`. Then stop and report. Do not invent more work.

There are **16 steps**, in this fixed order. Do not reorder; a step marked "needs" cannot start before those are `DONE`.

| # | Step | File | Needs |
|---|---|---|---|
| 1 | WP-09 test foundation | `wp/WP-09-test-foundation.md` | - |
| 2 | WP-14a finished branches | `wp/WP-14-features-in-flight.md` step 1 | 1 |
| 3 | WP-01 security | `wp/WP-01-security.md` | 1 |
| 4 | WP-02 admin session | `wp/WP-02-admin-session.md` | 1 |
| 5 | WP-07 timeouts and degraded states | `wp/WP-07-timeouts-and-degraded-states.md` | 1 |
| 6 | WP-04 file lifecycle | `wp/WP-04-file-lifecycle.md` | 1, 2 |
| 7 | WP-03 site bundle size | `wp/WP-03-site-bundle-size.md` | 1 |
| 8 | WP-05 error visibility | `wp/WP-05-error-visibility.md` | 1, 3, 5 |
| 9 | WP-06 monitoring | `wp/WP-06-monitoring.md` | 8 |
| 10 | WP-08 YouTube robustness | `wp/WP-08-youtube-robustness.md` | 2, 5, 8 |
| 11 | WP-11 admin forms | `wp/WP-11-admin-forms.md` | 1 |
| 12 | WP-12 build, CI, documents | `wp/WP-12-build-ci-docs.md` | 1, 9 |
| 13 | WP-10 browser tests | `wp/WP-10-browser-tests.md` | 1, 11 |
| 14 | WP-14b Quran page | `wp/WP-14-features-in-flight.md` step 2 | 2, 5, 13 |
| 15 | WP-13 performance | `wp/WP-13-performance.md` | 13 |
| 16 | WP-15 database shape | `wp/WP-15-database-shape.md` | 1, 8 |

## 2. Hard rules (breaking one is worse than not finishing)

1. **Never push, merge, or commit to `main`.** A push to `main` deploys to real visitors. Never run `git push` at
   all unless the owner's own chat message says so. Never force-push. Never delete a branch you did not create.
2. **Never run SQL, never write to the live database, never upload/delete files in the live bucket.** SQL changes
   are files in `docs/migrations/` that the owner runs (list them in `STATE.md`).
3. **Never print, write, or commit a secret.** Never open `.env.local` with a tool that shows its contents;
   scripts read it themselves. Never type a password anywhere.
4. **Do not test against the live site with writes.** Only `GET` requests to `https://ashraf-mazen.vercel.app`.
   No sign-in. No form submission.
5. **Stay in scope.** Do only what the package file says. A new problem you notice goes in `STATE.md` under
   "Found on the way" (one line); do not fix it unless it blocks the package.
6. **Follow the project's `CLAUDE.md`**: files under 350 lines, tests next to the code, small edits, never open
   `src/data/**`, `dist/`, `node_modules/`, `package-lock.json`.
7. **No retry loops.** The same command failing twice with the same error = stop that step (section 6).
8. **Never weaken a check to make it pass**: no `.skip`, no deleting a failing test, no lowering a coverage
   number, no `// @ts-ignore`, no `eslint-disable` for a whole file, no `--no-verify`.
9. Do not add a dependency that the package file does not name. Do not upgrade existing dependencies.
10. Test audio must be silence or muted. Never music.
11. Commit author: use the repository's configured identity as it is (`git config user.name` must print
    `Moazenaba`). Do not change git config.

## 3. Branches

- First time only: `git checkout docs/production-audit && git checkout -b prod/integration`
  (if `prod/integration` exists, just check it out). This branch collects the finished packages.
- Each step: `git checkout prod/integration && git checkout -b prod/wp-NN-short-name`.
- When the step passes section 5: `git checkout prod/integration && git merge --no-ff prod/wp-NN-short-name`,
  then run the verify command once more on `prod/integration`. If it fails there, fix on the package branch and merge again.
- Wherever a package file says "cut from `main`", read it as "cut from `prod/integration`".
- The owner merges `prod/integration` into `main` (OWNER-10). You never do.

## 4. Procedure for each step

1. Open `STATE.md`; take the first row that is `TODO` and whose "needs" are all `DONE`. Set it to `IN PROGRESS`
   with the branch name. (A row `IN PROGRESS` from an earlier session: check out its branch, run `git status` and
   the verify command, and continue from what is missing.)
2. Read the package file **completely**, and the problem rows it closes (`grep -n "<ID>" docs/production-plan/problems/*.md`).
3. Read only the code the package names (use `grep -n`, then the line range).
4. When the package changes a rule: **write or change the test first**, see it fail, then write the code.
5. Commit in small commits (`WP-NN: what changed`), one topic each.
6. Run the package's "Verify" block. Then the self-review (section 5).
7. Tick the package's "Done when" boxes in your head; every box must be true. Update `STATE.md` (section 7),
   commit it, merge into `prod/integration`.
8. Go to the next row. Do not ask the owner between steps unless a rule in section 6 says stop.

## 5. Self-review before a step is `DONE` (do all, every time)

```
npm run typecheck
npm run test:coverage          # before WP-09 is done: npm run test
npm run build
git diff --stat prod/integration...HEAD
```

Then check, and fix before going on:

- [ ] The number of tests is **not lower** than the last number in `STATE.md`; coverage is not lower.
- [ ] Every new function with a decision in it has a test for the normal case, one edge case and one failure case.
- [ ] No changed file is over 350 lines (`git diff --name-only prod/integration...HEAD | xargs wc -l | sort -nr | head -5`).
- [ ] `git diff prod/integration...HEAD | grep -nE "^\+.*(console\.log|debugger|\.only\(|\.skip\(|@ts-ignore|TODO)"` prints nothing.
- [ ] `git diff prod/integration...HEAD | grep -niE "^\+.*(service_role|secret|password|eyJ[A-Za-z0-9_-]{20,})"` shows no real value.
- [ ] Every text a visitor or the admin sees is Arabic; every code comment and commit message is English.
- [ ] Every failure path either shows a message to the person or calls the logger (after WP-05); none is swallowed.
- [ ] Read your own diff once from top to bottom as a reviewer. Remove anything the package did not ask for.

## 6. When to stop

**Stop the current step** (set the row to `BLOCKED: <reason in one line>`, commit `STATE.md` on the package
branch, do **not** merge it, go to the next row whose needs are met) when:

- the same command fails twice with the same error after one real fix attempt;
- the package says "stop and record";
- the work needs something only the owner can give (a secret, a SQL run, a decision listed in `OWNER-ACTIONS.md`);
- the code is so different from what the package describes that following it would mean guessing (a file or
  function it names does not exist, and `grep` does not find where it moved).

**Stop everything and report to the owner** when:

- `npm run test` fails on `prod/integration` and you cannot make it pass by undoing your last merge
  (`git reset --hard` is forbidden; use `git revert -m 1 <merge>`);
- you find a secret committed in the repository;
- you notice you pushed, or changed `main`, or changed live data (say exactly what happened);
- three steps in a row ended `BLOCKED`;
- no row can start (all remaining need a blocked step).

## 7. What to write in `STATE.md` after each step

Update the row (`DONE`, branch, date, tests count, coverage %), and append to the matching lists:
"SQL the owner must run", "Needs the owner", "Found on the way", "Measurements". Keep each entry to one line.
`STATE.md` is the memory between sessions: anything not written there is lost.

## 8. Final review (after the last row)

On `prod/integration`:

```
npm run typecheck && npm run lint && npm run test:coverage && npm run build && npm run e2e
node scripts/smoke-test.mjs https://ashraf-mazen.vercel.app
```

Then write in `STATE.md` under "Final review":

1. the totals: tests (unit, component, handler, browser), coverage, files over 350 lines (must be 0 outside `src/data`);
2. for every problem id in `problems/*.md`: `closed by WP-NN` / `owner action OWNER-NN` / `open: reason`
   (check each by its package's "Done when", not from memory);
3. the list of SQL files and owner actions still waiting;
4. the steps that are `BLOCKED` and what unblocks each.

Report to the owner in short Egyptian Arabic: what is done, what is blocked, what they must do (merge
`prod/integration`, run the SQL files, the owner actions). Then stop.

## 9. The kinds of tests this plan adds (so none is forgotten)

| Kind | What it proves | Where | Tool | Added by |
|---|---|---|---|---|
| Unit | one rule, no screen, no network | `*.test.ts` next to the rule | Vitest (node) | every package |
| Core | the rules the site cannot be wrong about: who may upload what, what a visitor may send, what counts as a view, lesson placement, live-channel check | `api/*.test.ts`, `src/services/**`, `src/pages/**/**.test.ts` | Vitest | WP-01, WP-04, WP-08, WP-09 |
| Component | one screen part renders and reacts | `*.test.tsx` with `// @vitest-environment jsdom` | Testing Library | WP-09, WP-11, WP-05, WP-14b |
| Integration | a service with the (fake) database and storage; a server function with stubbed `fetch` | `src/services/data/*.test.ts`, `api/*.test.ts` | Vitest + `src/test/fakeDatabase.ts` | WP-09, WP-04, WP-15 |
| Functionality | a whole task end to end in a browser (send a request, create/edit/delete a lesson) | `e2e/local/*.spec.ts` | Playwright | WP-10 |
| System | the deployed site answers, headers, sitemap, functions | `scripts/smoke-test.mjs`, `e2e/live/` | Node, Playwright | WP-06, WP-10 |
| Guard | a mistake that already happened cannot come back (CORS origin, `type="url"`, second extension list, undocumented env name) | `src/test/*.test.ts`, `scripts/*.test.mjs` | Vitest | WP-11, WP-12 |
| Budget | the site does not get heavier or slower unnoticed | `scripts/check-bundle-size.mjs`, coverage gate | Node | WP-09, WP-13 |
