# Deployment Runbook — Shiryu Kit

**Document version:** 1.6
**Date:** 9 November 2026
**Author:** Piyush Gahlawat

**Purpose:** Step-by-step procedures for deploying, verifying, and rolling back changes to the Shiryu Kit production environment.

**Audience:** Anyone (including future-me) who needs to deploy safely without relying on memory.

**Why this exists:** A deploy that "succeeded" once exposed `.git` and configuration files on the live site for ~16 hours. See [INC-2026-001](./post-incident-review-git-exposure.md). This runbook exists so that never happens again.

**📌 Portfolio note:** This runbook is published as a portfolio artifact. Specific operational values — real commit SHAs, exact verification commands, and the complete `.assetsignore` blocklist — are generalized here. The full operational version is maintained privately. The structure, reasoning, and process below are accurate and complete.

---

## 1. Environment

| Field | Detail |
| :--- | :--- |
| **Production URL** | https://shiryu-kit.shiryu.workers.dev |
| **Hosting** | Cloudflare Workers (static assets + Worker script) |
| **Build** | Automatic, triggered by git push to `main` |
| **Build time** | ~60 seconds |
| **Rollback method** | `git revert` (preferred) or Cloudflare dashboard |
| **Cache** | Must be purged manually after every deploy |
| **System specification** | [SRS Section 14](./srs.md) — deployment and operational requirements |

---

## 2. Pre-Deploy Checklist

Before pushing to `main`, verify:

- [ ] Local changes committed and pushed to `main` branch
- [ ] No sensitive files staged: `git status` shows no `.env`, `.dev.vars`, `*.key`, `*.pem`
- [ ] If a new file was added, `.assetsignore` was updated to exclude it if sensitive
- [ ] If `worker.js` was changed, the sensitive-path blocklist is still consistent with the entries in `.assetsignore` (the file itself is the source of truth)
- [ ] If a CDN script was added or updated, an SRI hash was generated and included (see Section 6)
- [ ] `wrangler.jsonc` still has `"run_worker_first": true` — see [decision D005](./decisions.md)
- [ ] If the change involves a new page, `sitemap.xml` and `robots.txt` were updated
- [ ] If the change involves a new tool, the hub card was added and the tool's footer links back to the hub
- [ ] Local test passed: `python -m http.server 8000` and open each changed tool at `http://localhost:8000/...`

---

## 3. Deploy Procedure

```bash
cd ~/projects/qr-generator

git branch --show-current      # Expected: main
git status                      # Expected: "nothing to commit, working tree clean"
git push

# Watch: Cloudflare dashboard → Workers & Pages → shiryu-kit → Deployments
# Wait for status: Success (~60s). Confirm commit SHA matches your push.

# Cloudflare dashboard → Caching → Configuration → Purge Everything → Confirm

sleep 30
```

---

## 4. Post-Deploy Verification (MANDATORY)

**Do not skip this.** A successful build does not mean the site is correct. This section exists because of [INC-2026-001](./post-incident-review-git-exposure.md) — a deploy that "succeeded" but exposed sensitive files.

### 4a. All expected pages return 200

```bash
for p in / /qr-generator.html /password-generator.html /word-counter.html \
         /json-formatter.html /resume-cleaner.html /resume-templates.html /privacy.html; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://shiryu-kit.shiryu.workers.dev$p")
  printf "%-30s %s\n" "$p" "$code"
done
```

**All must be `200`.** If any is not, see Section 6.

### 4b. Sensitive paths are not served

**Important context:** `not_found_handling: single-page-application` means any non-existent path returns **200 with `index.html`** — not 404. So a 200 doesn't mean "leak." A leak means **actual file content is served**.

The check must distinguish three outcomes:

| Response | Meaning | Safe? |
| :--- | :--- | :--- |
| `404` + body `"Not Found"` | Blocklist caught it | ✅ Safe |
| `200` + body = homepage HTML | File not deployed, SPA fallback | ✅ Safe |
| `200` + body = file content | Actual file served | ⚠ **Leak** |

```bash
homepage_hash=$(curl -s https://shiryu-kit.shiryu.workers.dev/ | sha256sum | cut -d' ' -f1)

PATHS=(
  ".git/config" ".git/HEAD" ".git/logs/HEAD"
  ".gitignore" ".gitattributes"
  ".env" ".env.local" ".dev.vars" ".assetsignore"
  "wrangler.jsonc" "wrangler.toml" "worker.js"
  "package.json" "package-lock.json" "yarn.lock" "pnpm-lock.yaml"
  "README.md" "LICENSE" "CHANGELOG.md"
  ".DS_Store" "Thumbs.db"
  "node_modules" "dist" ".wrangler" ".github"
)

LEAKS=0
for path in "${PATHS[@]}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://shiryu-kit.shiryu.workers.dev/$path")
  response=$(curl -s "https://shiryu-kit.shiryu.workers.dev/$path")
  hash=$(echo -n "$response" | sha256sum | cut -d' ' -f1)

  if [ "$code" = "404" ]; then
    printf "  ✓ %-22s 404 (blocked)\n" "/$path"
  elif [ "$hash" = "$homepage_hash" ]; then
    printf "  ✓ %-22s 200 (SPA fallback — file not deployed)\n" "/$path"
  else
    printf "  ⚠ %-22s %s (LEAK — content served)\n" "/$path" "$code"
    LEAKS=$((LEAKS+1))
  fi
done

if [ "$LEAKS" -gt 0 ]; then
  echo ""
  echo "  $LEAKS path(s) serving actual content — see Section 7."
fi
```

**Why the curated list instead of reading `.assetsignore` directly:** that file contains globs (`*.log`) and directory patterns (`node_modules/`), which produce meaningless URLs when probed literally. Every such probe triggers the SPA fallback and appears as a false leak. The curated list + content-aware check eliminates the noise.

### 4c. Security headers are present

```bash
curl -s -I https://shiryu-kit.shiryu.workers.dev/ | grep -iE \
  "strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy|content-security|cross-origin|x-xss|cache-control"
```

All ten header families must appear.

### 4d. Tools function correctly

| Tool | Test |
| :--- | :--- |
| QR Generator | Enter a URL → Generate → QR appears → Download works |
| Password Generator | Password auto-generates → Copy works |
| Word Counter | Type text → counts update → Copy works |
| JSON Formatter | Paste JSON → Format → highlighted output appears |
| Resume Cleaner | Drop `.docx` → score appears → Download works |
| Resume Templates | Paste text → Preview renders → Print dialog opens |

**If any tool fails with a red console error**, check for `Failed to find a valid digest` — broken SRI hash — or `Refused to load` — CSP violation. See Section 6.

### 4e. Cache was actually purged

```bash
curl -s -H "Cache-Control: no-cache" \
  "https://shiryu-kit.shiryu.workers.dev/?nocache=$(date +%s)" | grep -o "<title>[^<]*</title>"
```

Should show the current title from the deploy, not a stale one.

---

## 5. Rollback Procedure

Use this **only when a deploy has broken production** and the fix is not immediately obvious. For normal fixes, push a new commit instead.

**Pre-check — is rollback actually needed?**

```bash
for p in / /qr-generator.html /json-formatter.html; do
  echo "$p → $(curl -s -o /dev/null -w '%{http_code}' https://shiryu-kit.shiryu.workers.dev$p)"
done
```

If any expected page returns non-200, or tools are visibly broken, rollback is justified. If everything works, **do not roll back**.

### 5a. Identify the rollback target

```bash
git log --oneline -10
```

Pick the commit you want to go **back to** — the last known-good state. If `a73bd98` broke something, the rollback target is `6f83e53` (the commit before it).

### 5b. Choose a rollback method

**Method 1 — Revert (preferred, preserves history).** Creates a new commit that undoes the bad one.

```bash
# Replace COMMIT_SHA with the SHA of the BAD commit
# Example: git revert a73bd98
git revert COMMIT_SHA
git push
```

If you see `unknown revision` → the SHA is wrong; re-run `git log --oneline` and copy again.

**Method 2 — Hard reset (only if certain, single contributor only).** Discards commits; rewrites history.

```bash
# Replace GOOD_SHA with the SHA of the last known-good commit
# Example: git reset --hard 6f83e53
git reset --hard GOOD_SHA
git push --force-with-lease
```

**⚠️ Warning:** this permanently discards every commit between `GOOD_SHA` and `HEAD`. Only use if you are the sole contributor, certain the discarded commits contain nothing you want, and the bad commit is fully broken. **For a public repo, prefer Method 1.**

### 5c. Fastest rollback — Cloudflare dashboard

1. Cloudflare dashboard → **Workers & Pages** → **shiryu-kit** → **Deployments**
2. Find the last known-good deployment
3. Click **three dots** → **Rollback** (or **Retry deployment**)
4. Confirm
5. **Purge cache** — Caching → Configuration → Purge Everything

**Trade-off:** git history and live deployment are now diverged. Do the git-based rollback (5b) afterward so the next `git push` doesn't re-introduce the broken commit.

### 5d. Verify the rollback succeeded

Re-run [Section 4](#4-post-deploy-verification-mandatory). Every check must pass. If either 4a or 4b fails, **do not declare the rollback complete**.

### 5e. Common mistakes to avoid

| Mistake | What happens | Prevention |
| :--- | :--- | :--- |
| Pasting `git revert <bad-commit-sha>` literally | Bash sees `<` as redirect, errors "syntax error near unexpected token `newline`" — no damage, but alarming | Replace placeholders with actual SHAs from `git log --oneline` |
| Using `git reset --hard` when `git revert` would work | Loses commit history; on public repo, looks unprofessional | Default to `git revert` |
| Rolling back before confirming something is broken | Wastes time; may roll back working code | Run pre-check first |
| Forgetting to purge cache after rollback | Edge serves broken build | Included in 5c and 5d |
| Rolling back, then pushing the same broken code | Defeats the purpose | Fix locally, test, push as new commit |

### 5f. After the rollback — write it up

If the rollback was triggered by production breakage, document it using the [post-incident review template](./post-incident-review-git-exposure.md). Required for accountability (Article 5(2) GDPR and DPDP Section 8(6)), learning, and resume value.

---

## 6. Common Failures and Fixes

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| Page returns 200 but shows homepage HTML | File didn't deploy; SPA fallback serving `/index.html` | Check `git log -1 --stat` includes the file; check Cloudflare build log |
| Tool silently does nothing, no error | SRI hash is wrong — browser blocked the script | DevTools console → "Failed to find a valid digest"; recompute hash via `curl -s <url> \| openssl dgst -sha384 -binary \| openssl base64 -A` |
| SRI present but tool still fails | Missing `sha384-` prefix | Format is `<alg>-<base64>`, not base64 alone — see commit `a73bd98` |
| Tool fails with `Refused to load` in console | CSP violation — resource not in the allowlist | Add the origin to the relevant CSP directive in `_headers` |
| Sensitive path returns actual content | `run_worker_first` not `true`, or path not in blocklist | Check `wrangler.jsonc`; verify path is in `.assetsignore`; redeploy |
| 307 redirect on `.html` URL | `html_handling` changed to default | Check `wrangler.jsonc` has `"html_handling": "none"` |
| Old content still showing | Cache not purged | Purge Everything |
| Build fails | Syntax error in `worker.js`, or invalid `wrangler.jsonc` | Check Cloudflare build log |

---

## 7. Security Incident Procedure

If any verification in Section 4b fails (a path serves actual content):

1. **Treat as incident.** Do not continue with the deploy.
2. **Identify** which path is exposed and what it contains.
3. **Assess exposure window** — how long has it been accessible? Check git log for last successful deploy.
4. **Check for exploitation** — review available logs and metrics for requests to the exposed path.
5. **Remediate immediately** — update `worker.js` blocklist; ensure `run_worker_first` is `true`; redeploy; purge cache.
6. **Verify** the path now returns 404 or SPA fallback.
7. **Document** using the [post-incident review template](./post-incident-review-git-exposure.md).
8. **Assess GDPR reporting obligation** — was any personal data exposed? See [ROPA Section 9](./ropa.md).

### 7a. DPDP Act breach notification (India)

If the incident involves personal data and the controller is established in India, the DPDP Act 2023 imposes a parallel notification obligation to the GDPR one. Both must be assessed; neither replaces the other.

**Step 1 — Notify the Data Protection Board of India without delay.**
On becoming aware of a personal data breach, send an initial intimation to the Data Protection Board describing the nature, extent, timing, and location of the breach, and its likely impact. This is the "without delay" obligation under Rule 7(2).

**Step 2 — Notify each affected Data Principal without delay.**
The notice must be concise, clear, and in plain language. It must state:
- the nature, extent, and timing of the breach;
- the likely consequences for the affected individual;
- the measures taken and being taken to mitigate risk;
- the safety steps the individual can take;
- business contact details for queries.

**Step 3 — Send the detailed report to the Board within 72 hours.**
Rule 7(2) requires a fuller report within 72 hours (extendable on written request). It must cover:
- updated and detailed information on the initial intimation;
- the broad facts, events, circumstances, and reasons behind the breach;
- the measures implemented or proposed to mitigate risk;
- any findings about the person who caused the breach;
- remedial measures to prevent recurrence;
- a report on the intimations given to affected Data Principals.

**Step 4 — Preserve the evidence.**
Keep the incident timeline, the exact wording of every notice sent, the time each was sent, and the decision log on whether an extension was requested. The Board's report asks for a record of who was told, how, and when — the record is part of the deliverable, not an afterthought.

**Relationship to GDPR Article 33.** The GDPR and DPDP clocks run in parallel. A breach that is reportable under GDPR Article 33 is likely reportable under DPDP Rule 7, but the thresholds and the recipients differ. Complete both assessments. For the Shiryu Kit architecture — no stored personal data beyond transient IPs — most incidents will conclude that neither regime requires notification, and that conclusion must itself be documented with reasoning. See [INC-2026-001](./post-incident-review-git-exposure.md) for a worked example of a "not reportable" assessment that would have applied under both regimes. See [ROPA Section 9](./ropa.md) for the combined GDPR/DPDP breach assessment process.

---

## 8. Cache Purge Reminder

**Cloudflare Workers caches HTML at the edge.** After every deploy, changed files may not be visible for minutes to hours without a cache purge. **This is the single most common cause of "I deployed but nothing changed."**

Always: complete deploy → purge everything → verify with `curl -H "Cache-Control: no-cache"` before declaring success.

---

## 9. Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 7 November 2026 | Piyush Gahlawat | Initial runbook |
| 1.1 | 7 November 2026 | Piyush Gahlawat | Post-INC-2026-001: added Section 4b as mandatory, added SRI prefix failure mode, added Section 7 incident procedure |
| 1.2 | 7 November 2026 | Piyush Gahlawat | Rewrote Section 5 with explicit placeholder handling, worked examples, Cloudflare dashboard rollback path, common mistakes table, post-rollback documentation requirement |
| 1.3 | 7 November 2026 | Piyush Gahlawat | Sanitization pass: added portfolio note; removed exact blocklist paths from Sections 2 and 6 |
| 1.4 | 7 November 2026 | Piyush Gahlawat | Section 4b rewritten to be content-aware — distinguishes 404 (blocked) from 200-with-homepage (SPA fallback, safe) from 200-with-content (leak). Curated path list replaces the flawed `grep .assetsignore` approach |
| 1.5 | 8 November 2026 | Piyush Gahlawat | Added Section 7a — DPDP Act 2023 breach notification procedure (Rule 7, dual notification to Board and Data Principals, 72-hour detailed report); updated Section 4c for the expanded header set (nine families); added CSP failure mode to Section 6; updated ROPA cross-reference from Section 8 to Section 9 |
| 1.6 | 9 November 2026 | Piyush Gahlawat | Version header added; Section 4c extended with cache-control (nine → ten header families, matching production and SRS acceptance criterion #4); SRS Section 14 reference added to Environment table; cross-references updated to include SRS and Threat Model |

**Related documents:** [SRS](./srs.md) · [Threat Model](./threat-model.md) · [PIR — .git exposure](./post-incident-review-git-exposure.md) · [ROPA](./ropa.md) · [Decision Log](./decisions.md) · [Security Controls](./security-controls.md)
