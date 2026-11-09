# Security Controls Inventory — Shiryu Kit

**Document version:** 1.7
**Date:** 9 November 2026
**Author:** Piyush Gahlawat

A complete inventory of security controls implemented, mapped to the risks they mitigate.

**Purpose:** Demonstrates that security was implemented deliberately, not accidentally. Each control exists for a specific reason and addresses a specific threat.

**Post-incident note:** This inventory was substantially expanded after [INC-2026-001](./post-incident-review-git-exposure.md), which found that several controls assumed to be effective were not. Sections 6 and 7 reflect the corrected, verified state.

**📌 Portfolio note:** This inventory is published as a portfolio artifact. The exact list of paths in the blocklist and the precise header values are generalized here. The full operational version is maintained privately. Control categories, reasoning, and verification approaches below are accurate and complete.

---

## 1. Transport Security

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| HTTPS enforced | Cloudflare automatic | Man-in-the-middle, eavesdropping | Browser padlock |
| HSTS | One-year max-age with includeSubDomains and preload | Protocol downgrade, SSL stripping | `curl -I` header check |
| No mixed content | All resources served over HTTPS or from HTTPS CDN; CSP `upgrade-insecure-requests` enforces this | Downgrade attacks, mixed-content warnings | Browser console |

---

## 2. Content Security

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| Content Security Policy | Fourteen directives — restricts scripts to self and one trusted CDN, blocks plugin content, blocks iframes, prevents base-tag hijacking, restricts form submission to same origin, upgrades any accidental HTTP subresource, restricts manifest and worker sources | XSS, injection, clickjacking, unauthorised resource loading, base-tag hijacking, form exfiltration | `curl -I` header check; DevTools console showing zero CSP violations |
| X-Frame-Options | `DENY` | Clickjacking | `curl -I` header check |
| Frame-ancestors (CSP) | `'none'` | Clickjacking (CSP-level, complements X-Frame-Options) | `curl -I` header check |
| Legacy XSS auditor disabled | `X-XSS-Protection: 0` | Prevents the legacy auditor from introducing vulnerabilities (OWASP recommendation) | `curl -I` header check |

**Implemented in commit `7c06235`; expanded on 8 November 2026 to cover the additional CSP directives.**

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
| Permissions-Policy | Sixteen browser features explicitly disabled — sensors, media devices, location, USB, payment, screen wake lock, picture-in-picture, display capture, encrypted media, MIDI, credential APIs, XR, and the Topics ad-targeting API | Unauthorised access to browser hardware and APIs | `curl -I` header check |

**Permissions-Policy expanded on 8 November 2026 to cover the full set of disabled features. Three deprecated directives (`interest-cohort`, `join-ad-interest-group`, `run-ad-auction`) were removed to eliminate browser console warnings — those APIs have been removed from modern browsers.**

---

## 5. Cross-Origin Isolation

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| Cross-Origin-Opener-Policy | `same-origin` | Cross-origin window access; Spectre-class side-channel attacks | `curl -I` header check |
| Cross-Origin-Resource-Policy | `same-origin` | Other origins embedding assets without permission | `curl -I` header check |

**Added on 8 November 2026 as part of the header-hardening pass.**

---

## 6. Sensitive File Protection

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| `.git` directory blocking | Worker script blocklist + worker-first execution | Source code and commit history disclosure | Probing the path returns 404 |
| Configuration file blocking | Blocklist covers repository metadata, configuration files, dependency manifests, and environment variable files | Configuration and credential disclosure | Probing each path returns 404 |
| Build-time exclusion | `.assetsignore` prevents future uploads of sensitive files | Defence in depth against blocklist gaps | `.assetsignore` exists at repo root |
| Worker-first execution | `run_worker_first: true` in `wrangler.jsonc` | Ensures blocklist executes before asset serving | Sensitive paths return 404 (verified) |

**Implemented across commits `70b82be`, `7c06235`, `4fd897c`, and `519ae3d`.** The four-commit sequence is documented in [D005](./decisions.md) — each attempt addressed part of the problem, and only the final combination (build-time exclusion + runtime blocklist + worker-first execution) was effective.

**The complete list of protected paths lives in `.assetsignore` in the repository** — that file is the source of truth. It is not duplicated here because publishing the exact list tells an attacker precisely which paths are guarded.

**This is the control most likely to silently regress.** Post-deploy verification Section 4b in the [runbook](./runbook.md) exists specifically to catch this.

---

## 7. Supply Chain Integrity

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| SRI on qrcodejs | `integrity="sha384-..."` on `<script>` tag | CDN compromise / tampered library | Browser console (no errors) + tool works |
| SRI on JSZip | `integrity="sha384-..."` on `<script>` tag | CDN compromise / tampered library | Browser console (no errors) + tool works |
| Version pinning | Both libraries loaded from specific versioned URLs | Silent version bumps | HTML source review |

**Implemented in commits `6f83e53` and `a73bd98`.** The first commit omitted the `sha384-` prefix, causing both tools to silently fail. The prefix fix is a reminder that the format is `<algorithm>-<base64>`, not base64 alone.

---

## 8. Authentication and Access (Repository and Cloudflare)

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| GitHub 2FA | Authenticator app on GitHub account | Account compromise | GitHub settings |
| Cloudflare 2FA | Authenticator app on Cloudflare account | Account compromise | Cloudflare settings |
| PAT (not password) for git | Personal Access Token with `repo` scope | Credential leakage | `git config --list` |
| Dedicated email 2FA | 2FA enabled on the dedicated privacy contact account | Compromise of GDPR / DPDP contact point | Email account security settings |

---

## 9. Privacy Controls

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| No tracking cookies | Zero cookies set by code; only strictly necessary Cloudflare security cookies may exist | Tracking, GDPR/ePrivacy consent requirement | DevTools → Application → Cookies (only `__cf_bm` / `cf_clearance` if present) |
| No analytics | No tracking scripts | Behavioural profiling, GDPR complexity | HTML source review |
| Client-side processing | File and text processing libraries run entirely in browser | Server-side data exposure | DevTools → Network tab during tool use (no outgoing requests) |
| No user accounts | No authentication system | Credential breach, account takeover | No login page |
| Accurate claims | "Your files never leave your browser" (not "nothing leaves") | Misrepresentation, transparency violation | Privacy policy review |
| DPDP Grievance Officer | Named officer with contact, acknowledgment SLA, 90-day resolution commitment, DPB escalation path | DPDP Section 13 / Rule 14(3) non-compliance | Privacy policy review |
| DPDP lawful basis documented | ROPA Section 4 — reasoned Section 7(a) position with explicit caveat | DPDP Act processing without lawful basis | ROPA review |

---

## 10. Incident Response Readiness

| Control | Implementation | Threat mitigated | Verified by |
| :--- | :--- | :--- | :--- |
| Post-incident review template | [post-incident-review-git-exposure.md](./post-incident-review-git-exposure.md) | Unstructured incident handling | Document exists |
| Breach assessment process (GDPR) | Documented in [ROPA Section 9](./ropa.md) | GDPR Article 33 non-compliance | Document exists |
| Breach notification procedure (DPDP) | Documented in [Runbook Section 7a](./runbook.md) | DPDP Section 8(6) / Rule 7 non-compliance | Document exists |
| Deployment verification checklist | [Runbook Section 4](./runbook.md) | Unverified deploys | Document exists |
| Mandatory sensitive-path check | [Runbook Section 4b](./runbook.md) | Regression of `.git` exposure | Document exists |

**The 4b check is not optional.** It is the direct remediation of the detection gap that existed on 6–7 November 2026.

---

## 11. Known Gaps and Residual Risk

| Gap | Residual risk | Mitigation plan |
| :--- | :--- | :--- |
| ~~Old `qryu` Worker verification~~ | ✅ **Closed** — verified 7 Nov 2026: all paths return 404 | N/A |
| ~~DPDP compliance documentation~~ | ✅ **Closed 8 Nov 2026** — privacy policy updated with Grievance Officer and DPDP rights; ROPA Section 4 added with DPDP lawful-basis analysis and caveat; runbook Section 7a added with Rule 7 breach procedure | N/A |
| ~~Threat model coverage~~ | ✅ **Closed 9 Nov 2026** — 8 STRIDE threats analysed with controls and residual risk documented in [Threat Model](./threat-model.md) | N/A |
| **No WAF** | No edge-level blocking of known attack signatures, IP reputation, or geo-based rules. Cloudflare WAF requires a zone, and `workers.dev` is not a zone. | Accept while on free tier. Upgrade to custom domain (~₹800/year) when traffic or threat profile justifies it. |
| **No Bot Fight Mode** | Automated scrapers and known bots not challenged at the edge. Zone-level feature, unavailable on `workers.dev`. | Same as WAF — requires custom domain. |
| No CSP reporting endpoint | CSP violations are not logged centrally. Detected only in individual browser consoles. | Accept. Add `report-to` and a reporting endpoint if a zone becomes available. |
| No automated post-deploy verification | Human error possible in the 4a–4e checks in the runbook. | Backlog: add a shell script that runs the verification suite. |
| No dependency vulnerability scanning | CVE in a pinned library may go unnoticed until an incident. | Backlog: add GitHub Dependabot with weekly scans. |
| No custom domain | `workers.dev` BIC may block Googlebot occasionally; also blocks access to all zone-level security features. | Accept. Upgrade when justified by traffic or WAF requirement. |
| Manual cache purge after every deploy | Forgetting to purge = stale content served. | Documented as mandatory step in runbook §8. |
| Deployment root is project root | Future files added at root may be unintentionally uploaded. | Backlog: consider restructuring to `public/` for served files only. |
| **Rate limiting** — Workers rate-limiting binding configured in `wrangler.jsonc` with fail-open guard in `worker.js`, deployed via commit `43730969`. Not stress-tested — the 100 req/60s threshold has not been verified under load. | Denial-of-wallet from sustained request floods. Low: site has no user data, no login, no financial impact. | Backlog: run a concurrent load test from a single IP to verify the binding triggers. Add a zone-level rate rule if a custom domain is added. |

**All items from INC-2026-001 are now closed.** The old `qryu` Worker was verified returning 404 on all paths on 7 November 2026. There are no open security items from the incident.

**The WAF and Bot Fight Mode gaps are the two that require a paid decision, not technical work.** Every other gap is either already mitigated or tracked as backlog work.

---

## Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 7 November 2026 | Piyush Gahlawat | Initial inventory |
| 1.1 | 7 November 2026 | Piyush Gahlawat | Post-INC-2026-001: added commit references, expanded Section 6, added 4b check reference, added open item for old `qryu` Worker |
| 1.2 | 7 November 2026 | Piyush Gahlawat | Closed old `qryu` Worker verification item — verified returning 404 |
| 1.3 | 7 November 2026 | Piyush Gahlawat | Sanitization pass for public portfolio |
| 1.4 | 8 November 2026 | Piyush Gahlawat | Header hardening: expanded Section 2 (14 CSP directives, disabled legacy XSS auditor), expanded Section 4 (16 Permissions-Policy features), added Section 5 (Cross-Origin Isolation), added WAF and Bot Fight Mode gaps |
| 1.5 | 8 November 2026 | Piyush Gahlawat | Closed DPDP compliance documentation gap — privacy policy, ROPA, and runbook updated with DPDP Act 2023 obligations; added DPDP controls to Section 9; added DPDP breach procedure reference to Section 10; updated ROPA cross-reference from Section 8 to Section 9 |
| 1.6 | 8 November 2026 | Piyush Gahlawat | Rate limiting — status clarified to "configured but not stress-tested" (previously claimed as verified). Honest status per assessment. |
| 1.7 | 9 November 2026 | Piyush Gahlawat | Rate limiting moved from Section 9 to Section 11 (DoS, not privacy, control). Threat model coverage row formatted with strikethrough. Cross-references updated to include SRS and Threat Model |

**Related documents:** [SRS](./srs.md) · [Threat Model](./threat-model.md) · [PIR — .git exposure](./post-incident-review-git-exposure.md) · [ROPA](./ropa.md) · [Runbook](./runbook.md) · [Decision Log](./decisions.md)