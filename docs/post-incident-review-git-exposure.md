# Post-Incident Review — Exposure of Version Control and Configuration Files

| Field | Detail |
| :--- | :--- |
| **Incident ID** | INC-2026-001 |
| **Date detected** | 7 November 2026, approximately 13:45 IST (inferred from first remediation commit) |
| **Date resolved** | 7 November 2026, 14:01 IST (commit `519ae3d`) |
| **Date fully closed** | 7 November 2026 — old `qryu` Worker verified returning 404 on all paths |
| **Severity** | High |
| **Classification** | Confidentiality exposure — no confirmed exploitation |
| **Author** | Piyush Gahlawat |

---

## 1. Summary

During a self-initiated pre-distribution security audit, sensitive repository and configuration files were found to be publicly accessible on the live Shiryu Kit deployment. The following paths returned HTTP 200:

- `/.git/config`
- `/.git/HEAD`
- `/.git/logs/HEAD`
- `/wrangler.jsonc`
- `/worker.js`
- `/package.json`
- `/.env`
- `/.dev.vars`

Remediation required **four commits over nine minutes**, because the underlying Cloudflare Workers request flow was not correctly understood at the time. The full fix, including SRI hardening, was completed in 37 minutes.

The incident was formally closed the same day, after verifying that the old `qryu.shiryu.workers.dev` deployment — which preceded the rename to `shiryu-kit` — returned 404 on all paths, including the root.

---

## 2. Timeline (verified from git log)

All times IST. Commit SHAs included for verifiability.

| Time | Commit | Event |
| :--- | :--- | :--- |
| **6 Nov, 22:14** | `e419dee` | Worker renamed to `shiryu-kit`; the exposure on `shiryu-kit.shiryu.workers.dev` begins here |
| **6 Nov, 22:17** | `c06841d` | All URLs updated to new domain — exposure persists |
| **6 Nov, 22:27–22:54** | `11b1131`, `fa0541`, `2a7da41`, `a6aa917`, `a2c78ec` | GSC property verification saga (unrelated to security incident) |
| **6 Nov, 23:05–23:07** | `ae116dd`, `2513585` | Cleanup of stray personal file (unrelated) |
| **7 Nov, 10:41–12:50** | `71efb0e` … `2bf56a4` | Feature work: ATS score, resume templates, JSON highlighting |
| **7 Nov, 13:25** | `bad1ab5` | GDPR compliance — privacy policy added |
| **7 Nov, 13:38** | `6ffbad7` | Dedicated privacy email |
| **7 Nov, ~13:45** | — | Security audit detected `.git` exposure (inferred — first remediation commit follows at 13:52) |
| **7 Nov, 13:52** | `70b82be` | **Attempt 1:** `.assetsignore` added — insufficient |
| **7 Nov, 13:54** | `7c06235` | **Attempt 2:** security headers + sensitive path blocking |
| **7 Nov, 13:58** | `4fd897c` | **Attempt 3:** corrected `.assetsignore` + worker-level blocklist — still insufficient |
| **7 Nov, 14:01** | `519ae3d` | **Attempt 4:** `run_worker_first: true` — the fix that actually worked |
| **7 Nov, 14:24** | `6f83e53` | Complete security hardening: SRI hashes added |
| **7 Nov, 14:29** | `a73bd98` | SRI `sha384-` prefix fixed |
| **7 Nov, ~17:00** | — | Old `qryu.shiryu.workers.dev` verified returning 404 on all paths — incident formally closed |

**Exposure window on `shiryu-kit`:** 6 Nov 22:14 → 7 Nov 14:01 IST = **approximately 15 hours 47 minutes**

**Detection-to-resolution:** approximately 16 minutes from first remediation commit to working fix. If detection was ~7 minutes before the first commit, then total detection-to-resolution is approximately **23 minutes**.

**Incident-to-closure:** approximately 27 hours from first exposure (6 Nov 22:14) to full verification that no residual deployment exposed the same files (7 Nov ~17:00).

---

## 3. Root Cause

Cloudflare Workers serves static assets **before** the Worker script executes by default. Unless `run_worker_first` is explicitly enabled in the assets configuration, any file present in the deployment directory is served directly by the CDN edge — the Worker script is never consulted.

The project used `"directory": "./"` in `wrangler.jsonc`, which uploaded the **entire project root** as static assets. This included:

- `.git/` (because the project root was the git repository root)
- `wrangler.jsonc`, `worker.js`, `package.json` (all live at project root)
- Any `.env` or `.dev.vars` files

The `.assetsignore` file (attempt 1, commit `70b82be`) is a **build-time** control that excludes files at upload. It failed for two reasons:

1. The files had already been uploaded in the earlier deploy at `22:14`
2. Even with exclusions at build time, the Worker was not configured to run first, so any pre-existing uploaded files remained directly accessible

This required **four iterations** to solve because each attempt addressed part of the problem but not the interaction between build-time exclusion and runtime execution order:

| Attempt | Commit | What it did | Why it failed |
| :--- | :--- | :--- | :--- |
| 1 | `70b82be` (13:52) | `.assetsignore` only | Files already uploaded; Worker not configured to intercept |
| 2 | `7c06235` (13:54) | Added security headers + path blocking in `worker.js` | Worker still not running first, so headers applied but blocklist never executed |
| 3 | `4fd897c` (13:58) | Corrected `.assetsignore`, added explicit blocklist | Same — blocklist still bypassed by asset serving |
| 4 | `519ae3d` (14:01) | `"run_worker_first": true` | **Effective** — Worker now intercepts before asset serving |

The lesson: `.assetsignore` and `run_worker_first` are **separate controls** documented separately, and both are required. The build-time control prevents future uploads; the runtime control prevents access to anything already uploaded.

---

## 4. Impact Assessment

### What was exposed

| File | What it reveals | Actual risk |
| :--- | :--- | :--- |
| `.git/config` | Remote repository URL | Low — repository already public on GitHub |
| `.git/HEAD` | Current branch reference | Low |
| `.git/logs/HEAD` | Commit history with author email | **Medium** — author email is personal data (redacted from this document) |
| `.git/objects/*` | Full repository history (recoverable with `git-dumper`) | **Medium** — historical commits could contain secrets |
| `wrangler.jsonc` | Worker configuration and routing rules | Low — no credentials |
| `worker.js` | Routing logic and blocklist | Low — blocklist added *after* the exposure |
| `package.json` | Dependency list | Low — already public on GitHub |
| `.env`, `.dev.vars` | Potential secrets | **Verified empty/non-existent** during remediation |

### What was NOT exposed

- No user data was ever transmitted to any server (tools process everything in browser memory)
- No API keys or credentials were in the repository. Verified with:
  ```bash
  git log -p --all -S 'API_KEY'
  git log -p --all -S 'SECRET'
  git log -p --all -S 'token'
```

  No matches found. The only "credential-like" content was the GitHub PAT used for `git push`, which lives in the OS credential helper — never in the repository.

### Blast radius conclusion

The source code was already public on GitHub (linked from the site footer). The incremental risk from `.git` exposure was not "source code disclosure" — it was:

1. **Author email exposure** in commit metadata — but the same email was already visible in GitHub's public commit history
2. **Historical secret exposure** — audited, none found
3. **Repository cloning** — but the GitHub repo was already public

**Overall impact: Low to Medium.** No confirmed exploitation. No third-party personal data exposed. No secrets exfiltrated.

### Residual consideration — closed

The original `qryu.shiryu.workers.dev` deployment preceded the rename to `shiryu-kit`. This deployment was a candidate for the same exposure, since it was created before any security hardening was applied.

**Verified on 7 November 2026:** all paths on `qryu.shiryu.workers.dev` return 404, including the root `/`. The old Worker has been deleted or has no assets bound. **No residual exposure. Item closed.**

---

## 5. GDPR Assessment

Under Article 33, a personal data breach must be notified to the supervisory authority within 72 hours if it is likely to result in a risk to the rights and freedoms of data subjects.

### Was personal data involved?

The `.git/logs/HEAD` file contained the author's email address. This is the controller's own email address.

**Yes, technically personal data was involved** — the controller's own email, in a public-facing file.

### Was there a risk to data subjects?

| Question | Assessment |
| :--- | :--- |
| Is the data subject identifiable? | Yes — the controller |
| Is the data sensitive? | No — professional contact email |
| Is there risk of harm? | No — already public on GitHub commit history |
| Are third parties affected? | No |
| Identity theft / financial loss / reputational damage? | No |

### Conclusion

**Not reportable under Article 33.** The exposed personal data was the controller's own contact information, already publicly available, with no plausible risk. Documented here for Article 5(2) accountability.

---

## 6. What Went Wrong

**1. Default configuration was assumed to be safe.** Cloudflare Workers serves static assets before the Worker script runs unless explicitly configured otherwise. The initial `wrangler.jsonc` did not include `run_worker_first`, and the security implication of that omission was not obvious.

**2. `.assetsignore` was assumed to be sufficient.** It excludes files from being *uploaded*, not from being *served*. Files uploaded before the `.assetsignore` was created remained accessible.

**3. Three ineffective remediation attempts before the fix.** Commits `70b82be`, `7c06235`, and `4fd897c` each addressed part of the problem without solving it. Only `519ae3d` (adding `run_worker_first: true`) made the blocklist effective.

**4. No pre-deployment security check.** The deployment pipeline validated that pages returned 200 and tools worked. It did not validate that sensitive paths returned 404. This would have caught the issue on Nov 6 at 22:14 instead of Nov 7 at ~13:45.

**5. Deployment root was the project root.** Using `"directory": "./"` meant the entire repository root — including `.git/`, `wrangler.jsonc`, and `worker.js` — was uploaded as static assets.

---

## 7. What Went Well

**1. Self-initiated detection.** The audit was proactive. No external report, no exploitation indicator, no alert.

**2. Same-session resolution.** Detection to working fix was under 25 minutes — despite three failed attempts.

**3. Defence-in-depth once resolved.** Three layered controls: `.assetsignore` (build-time), `worker.js` blocklist (runtime), and `run_worker_first: true` (enabling control). Each alone is insufficient; together they are robust.

**4. Continued hardening.** SRI hashes were added at `6f83e53` and the `sha384-` prefix was fixed at `a73bd98` within the same session.

**5. Full close-out including residual deployments.** The old `qryu` Worker was explicitly verified as returning 404 on all paths, rather than assumed to be gone. This is the difference between "remediated" and "verified remediated."

**6. Transparency.** The repository and this review are public. Including the three failed attempts — not just the final fix.

---

## 8. Action Items

| # | Action | Commit / Evidence | Status |
| :-- | :--- | :--- | :--- |
| 1 | Add `.assetsignore` | `70b82be` | ✅ Done (insufficient alone) |
| 2 | Add security headers to `_headers` | `7c06235` | ✅ Done |
| 3 | Add explicit blocklist to `worker.js` | `4fd897c` | ✅ Done |
| 4 | Add `run_worker_first: true` | `519ae3d` | ✅ Done — effective |
| 5 | Add SRI hashes | `6f83e53` | ✅ Done |
| 6 | Fix SRI `sha384-` prefix | `a73bd98` | ✅ Done |
| 7 | Add "sensitive paths return 404" to post-deploy checklist | Runbook §4b | ✅ Done |
| 8 | Verify old `qryu` Worker is deleted or equivalently hardened | Verified 7 Nov — all paths return 404 | ✅ **Closed** |
| 9 | Consider restructuring to `public/` directory for served files only | — (architectural) | ⏳ Backlog |
| 10 | Add automated post-deploy verification script | — (tooling) | ⏳ Backlog |
| 11 | Add GitHub Dependabot for dependency vulnerability scanning | — (tooling) | ⏳ Backlog |

**All security-critical items from this incident are closed.** Items 9–11 are process improvements, not open risks.

---

## 9. Lessons

**Default configurations are not secure by default.** Every static hosting platform has an implicit request handling model. Cloudflare Workers serves assets before scripts; this is a performance optimisation that has a security consequence if not corrected.

**Build-time and runtime controls are different controls.** `.assetsignore` is build-time. `run_worker_first` is runtime. Sensitive files need both. This was learned the hard way — three commits over six minutes.

**Test the negative case.** Every deployment checklist verifies that the site works. Fewer verify that specific bad states don't exist. "Verify sensitive paths return 404" is now a mandatory step in the runbook.

**Iteration is normal; document it.** The three failed remediation attempts are not embarrassing — they are the actual shape of debugging an unfamiliar system.

**"Remediated" is not the same as "verified remediated."** Fixing the live deployment is necessary but not sufficient. The old `qryu` Worker — a candidate for the same exposure — needed to be explicitly verified as gone.

---

## 10. Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 7 Nov 2026 | Piyush Gahlawat | Initial fictional timeline (rejected) |
| 1.1 | 7 Nov 2026 | Piyush Gahlawat | Corrected using actual git log — real commit SHAs, real times, four-attempt remediation documented |
| 1.2 | 7 Nov 2026 | Piyush Gahlawat | Action item 8 closed — old `qryu` Worker verified returning 404 on all paths |
| 1.3 | 7 Nov 2026 | Piyush Gahlawat | Sanitization pass for public portfolio: author email redacted from Section 4 |

**Related documents:** [ROPA](./ropa.md) · [Runbook](./runbook.md) · [Decision Log](./decisions.md) · [Security Controls](./security-controls.md)
