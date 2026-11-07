# Security Controls Inventory — Shiryu Kit

A complete inventory of security controls implemented, mapped to the risks they mitigate.

**Purpose:** Demonstrates that security was implemented deliberately, not accidentally. Each control exists for a specific reason and addresses a specific threat.

**Post-incident note:** This inventory was substantially expanded after [INC-2026-001](./post-incident-review-git-exposure.md), which found that several controls assumed to be effective were not. Sections 5 and 6 reflect the corrected, verified state.

---

## 1. Transport Security

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| HTTPS enforced | Cloudflare automatic | Man-in-the-middle, eavesdropping | Browser padlock |
| HSTS | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` | Protocol downgrade, SSL stripping | `curl -I` header check |
| No mixed content | All resources served over HTTPS or from HTTPS CDN | Downgrade attacks | Browser console |

---

## 2. Content Security

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| Content Security Policy | `default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'` | XSS, injection, unauthorised resource loading | `curl -I` header check; DevTools console |
| X-Frame-Options | `DENY` | Clickjacking | `curl -I` header check |
| Frame-ancestors (CSP) | `'none'` | Clickjacking (CSP-level, complements X-Frame-Options) | `curl -I` header check |

**Implemented in commit `7c06235`.**

---

## 3. MIME and Content Type

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| X-Content-Type-Options | `nosniff` | MIME type confusion attacks | `curl -I` header check |

**Implemented in commit `7c06235`.**

---

## 4. Referrer and Feature Control

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| Referrer-Policy | `strict-origin-when-cross-origin` | Referrer leakage to third parties | `curl -I` header check |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=()` | Unauthorised access to browser features | `curl -I` header check |

**Implemented in commit `7c06235`.**

---

## 5. Sensitive File Protection

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| `.git` directory blocking | `worker.js` blocklist + `run_worker_first: true` | Source code and commit history disclosure | `curl /.git/config` returns 404 |
| Configuration file blocking | Blocklist covers `wrangler.jsonc`, `worker.js`, `package.json`, `package-lock.json`, `.env`, `.dev.vars`, `.assetsignore`, `_headers`, `.gitignore` | Configuration and credential disclosure | `curl` on each path returns 404 |
| Build-time exclusion | `.assetsignore` prevents future uploads of sensitive files | Defence in depth against blocklist gaps | `.assetsignore` exists at repo root |
| Worker-first execution | `"run_worker_first": true` in `wrangler.jsonc` | Ensures blocklist executes before asset serving | Sensitive paths return 404 (verified) |

**Implemented across commits `70b82be`, `7c06235`, `4fd897c`, and `519ae3d`.** The four-commit sequence is documented in [D005](./decisions.md) — each attempt addressed part of the problem, and only the final combination (build-time exclusion + runtime blocklist + worker-first execution) was effective.

**This is the control most likely to silently regress.** Post-deploy verification Section 4b in the [runbook](./runbook.md) exists specifically to catch this.

---

## 6. Supply Chain Integrity

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| SRI on qrcodejs | `integrity="sha384-..."` on `<script>` tag | CDN compromise / tampered library | Browser console (no errors) + tool works |
| SRI on JSZip | `integrity="sha384-..."` on `<script>` tag | CDN compromise / tampered library | Browser console (no errors) + tool works |
| Version pinning | Both libraries loaded from specific versioned URLs (`@1.0.0`, `@3.10.1`) | Silent version bumps | HTML source review |

**Implemented in commits `6f83e53` and `a73bd98`.** The first commit omitted the `sha384-` prefix, causing both tools to silently fail. The prefix fix is a reminder that the format is `<algorithm>-<base64>`, not base64 alone.

---

## 7. Authentication and Access (Repository and Cloudflare)

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| GitHub 2FA | Authenticator app on GitHub account | Account compromise | GitHub settings |
| Cloudflare 2FA | Authenticator app on Cloudflare account | Account compromise | Cloudflare settings |
| PAT (not password) for git | Personal Access Token with `repo` scope | Credential leakage | `git config --list` |
| Dedicated email 2FA | `shiryukit.privacy@gmail.com` with 2FA | Compromise of GDPR contact point | Gmail settings |

---

## 8. Privacy Controls

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| No cookies | Zero cookies set by code | Tracking, GDPR consent requirement | DevTools → Application → Cookies (empty) |
| No analytics | No tracking scripts | Behavioural profiling, GDPR complexity | HTML source review |
| Client-side processing | JSZip, qrcodejs run in browser | Server-side data exposure | DevTools → Network tab during tool use (no outgoing requests) |
| No user accounts | No authentication system | Credential breach, account takeover | No login page |
| Accurate claims | "Your files never leave your browser" (not "nothing leaves") | Misrepresentation, transparency violation | Privacy policy review |

---

## 9. Incident Response Readiness

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| Post-incident review template | [post-incident-review-git-exposure.md](./post-incident-review-git-exposure.md) | Unstructured incident handling | Document exists |
| Breach assessment process | Documented in [ROPA Section 8](./ropa.md) | GDPR Article 33 non-compliance | Document exists |
| Deployment verification checklist | [Runbook Section 4](./runbook.md) | Unverified deploys | Document exists |
| Mandatory sensitive-path check | [Runbook Section 4b](./runbook.md) | Regression of `.git` exposure | Document exists |

**The 4b check is not optional.** It is the direct remediation of the detection gap that existed on 6–7 November 2026.

---

## 10. Known Gaps and Residual Risk

| Gap | Residual risk | Mitigation plan |
| :--- | :--- | :--- |
| ~~Old `qryu` Worker verification~~ | ✅ **Closed** — verified 7 Nov 2026: all paths return 404 | N/A |
| No WAF (free tier) | DDoS / targeted attack relies on Cloudflare's default DDoS protection | Accept; upgrade if threat materialises |
| No CSP reporting endpoint | CSP violations are not logged | Accept; add `report-uri` if needed |
| No automated post-deploy verification | Human error possible in manual checks | Backlog: add a shell script for the runbook checklist |
| No dependency vulnerability scanning | CVE in `qrcodejs` or `jszip` may go unnoticed | Backlog: add GitHub Dependabot |
| No custom domain | `workers.dev` BIC may block Googlebot occasionally | Accept; upgrade to custom domain when justified |
| Manual cache purge after every deploy | Forgetting to purge = stale content served | Documented in runbook as mandatory step |
| Deployment root is project root | Future files added at root may be unintentionally uploaded | Backlog: consider restructuring to `public/` for served files only |

**All items from INC-2026-001 are now closed.** The old `qryu` Worker was verified returning 404 on all paths on 7 November 2026. There are no open security items from the incident.

---

## Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 7 November 2026 | Piyush Gahlawat | Initial inventory |
| 1.1 | 7 November 2026 | Piyush Gahlawat | Post-INC-2026-001: added commit references, expanded Section 5, added 4b check reference, added open item for old `qryu` Worker |
| 1.2 | 7 November 2026 | Piyush Gahlawat | Closed old `qryu` Worker verification item — verified returning 404 |

**Related documents:** [PIR — .git exposure](./post-incident-review-git-exposure.md) · [ROPA](./ropa.md) · [Runbook](./runbook.md) · [Decision Log](./decisions.md)