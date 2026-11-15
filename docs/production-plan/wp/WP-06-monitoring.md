# WP-06: the live site is checked automatically, and a failure reaches the owner

Closes: OBS-04, PRF-04. Needs WP-05.

## Constraint

The repository is private: 2000 free GitHub Actions minutes a month, and every job run costs at least one minute.
`sync-youtube.yml` already uses about 1440 (every 30 minutes). So the monitor must **not** be a new scheduled
workflow: it runs as extra steps **inside the same job**, which costs no extra minutes.

## Targets (what "production ready" means here, measured by this monitor)

- availability of the home page and `/api/site`: 99.5% of checks in a month;
- error rate of server functions: under 1% of requests;
- a failed check is visible to the owner within 30 minutes.

## Steps

1. `scripts/smoke-test.mjs`: add checks (keep the existing ones):
   - `/api/site` answers 200 with non-empty `categories` and `lessons`;
   - `/api/live` answers 200 with a boolean `live`;
   - the home page HTML contains `id="root"` and a `<title>`;
   - the security headers are present on `/` (`content-security-policy`, `strict-transport-security`);
   - `/sitemap.xml` has at least 100 addresses.
   Make it exit with code 1 when any check fails, and print one line per failed check starting with `FAIL`.
   Add `--json` to print `{ ok, failed: [...] }` for the next step.
2. `.github/workflows/sync-youtube.yml`: after the commit step add:

   ```yaml
   - name: Check the live site
     id: smoke
     continue-on-error: true
     run: node scripts/smoke-test.mjs https://ashraf-mazen.vercel.app --json > smoke.json
   - name: Record a failed check
     if: steps.smoke.outcome == 'failure'
     run: node scripts/report-monitor.mjs smoke.json
     env:
       SITE_URL: https://ashraf-mazen.vercel.app
   - name: Fail the run when the site is down
     if: steps.smoke.outcome == 'failure'
     run: exit 1
   ```

   A failed run makes GitHub e-mail the repository owner (default notification).
3. Create `scripts/report-monitor.mjs`: posts `{ name: 'monitor', message: <failed checks>, path: '/' }` to
   `${SITE_URL}/api/log` so the failure also appears in the admin's error log. Never throws.
4. Rename the workflow's `name:` to `Sync YouTube and check the site` and update its header comment.
5. Add `docs/RUNBOOK.md`: for each `FAIL` line the smoke test can print, one line saying what it means and what to
   do (link to the matching section of `docs/TROUBLESHOOTING.md`; add missing sections there).

## Tests

- `scripts/smoke-test.test.mjs`: export the check functions from `scripts/smoke-test.mjs` (keep the CLI behaviour);
  with a stubbed `fetch`: all pass on good answers; a 500 on `/api/site` gives `ok: false` and names the check; an
  empty `lessons` list fails.

## Verify

```
npm run typecheck && npm run test:coverage
node scripts/smoke-test.mjs https://ashraf-mazen.vercel.app          # ALL PASSED, exit 0
python -c "import yaml;yaml.safe_load(open('.github/workflows/sync-youtube.yml',encoding='utf-8'));print('yaml ok')"
```

## Done when

- [ ] The smoke test covers the five new checks and exits 1 on failure.
- [ ] No new `schedule:` workflow was added (`grep -l "schedule:" .github/workflows/*` lists only `sync-youtube.yml`).
