# Deployment Runbook — Shiryu Kit

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

---

## 2. Pre-Deploy Checklist

Before pushing to `main`, verify:

- [ ] Local changes committed and pushed to `main` branch
- [ ] No sensitive files staged: `git status` shows no `.env`, `.dev.vars`, `*.key`, `*.pem`
- [ ] If a new file was added, `.assetsignore` was updated to exclude it if sensitive
- [ ] If `worker.js` was changed, the sensitive-path blocklist is still consistent with the entries in `.assetsignore` (the file itself is the source of truth — do not maintain a separate list)
- [ ] If a CDN script was added or updated, an SRI hash was generated and included (see Section 6 for hash regeneration)
- [ ] `wrangler.jsonc` still has `"run_worker_first": true` — see [decision D005](./decisions.md) for why this is non-negotiable
- [ ] If the change involves a new page, `sitemap.xml` and `robots.txt` were updated
- [ ] If the change involves a new tool, the hub (`index.html`) card was added and the tool's footer links back to the hub
- [ ] Local test passed: `python -m http.server 8000` and open each changed tool at `http://localhost:8000/...`

---

## 3. Deploy Procedure

```bash
# 1. Confirm working directory
cd ~/projects/qr-generator

# 2. Confirm branch
git branch --show-current
# Expected: main

# 3. Confirm no uncommitted changes
git status
# Expected: "nothing to commit, working tree clean"

# 4. Push
git push

# 5. Watch the build in the Cloudflare dashboard:
#    Workers & Pages → shiryu-kit → Deployments
#    Wait for status: Success (typically 60s)
#    Confirm the commit SHA matches your push

# 6. Purge cache
#    Cloudflare dashboard → Caching → Configuration → Purge Everything → Confirm

# 7. Wait 30 seconds for cache propagation
sleep 30