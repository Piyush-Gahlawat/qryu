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
| `.git/logs/HEAD` | Commit history with author email (`piyush.gahlawat.blazing@gmail.com`) | **Medium** — author email is personal data |
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