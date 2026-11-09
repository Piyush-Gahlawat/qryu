# Threat Model — Shiryu Kit

**Document version:** 1.0
**Date:** 9 November 2026
**Author:** Piyush Gahlawat
**Methodology:** STRIDE with likelihood × impact scoring
**Scope:** The production deployment at `https://shiryu-kit.shiryu.workers.dev`

---

## 1. Purpose and Method

This threat model identifies the realistic threats against the Shiryu Kit deployment, documents the controls in place for each, and assesses residual risk.

**Methodology.** Each threat is classified under the STRIDE framework (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege). Likelihood and impact are scored Low / Medium / High, and residual risk is assessed after existing controls.

**What this threat model is not.** It is not a penetration test. It does not involve an adversary actively attempting to compromise the system. It is a structured analytical exercise conducted by the maintainer, based on the architecture as documented in the SRS.

---

## 2. Architecture Summary

- **Deployment:** Cloudflare Workers, static assets + Worker script.
- **Request flow:** Visitor → Cloudflare edge → Worker script → asset binding → HTML/CSS/JS response.
- **Client-side processing:** All six tools run entirely in the browser.
- **No backend:** No server-side code, no database, no user accounts.
- **No user data retention:** The site processes no personal data beyond transient IP addresses at the edge.

This architecture dramatically reduces the attack surface. There is no login to brute-force, no database to inject into, no API to abuse, no session to hijack.

---

## 3. Threats

### T-01 — Sensitive File Disclosure (Information Disclosure)

**Threat.** An attacker requests deployment artifacts — `.git/config`, `.git/logs/HEAD`, `wrangler.jsonc`, `worker.js`, `package.json`, `.env` — and obtains source code, commit history, or configuration.

**Attack scenario.** Automated scanners routinely probe for `/.git/config` on every web server. If exposed, the full repository history can be reconstructed with `git-dumper`, exposing historical secrets even if they were later removed.

**Impact:** High. Exposure of commit history could reveal author email, internal URLs, or historical credentials.

**Likelihood before controls:** High — this incident actually occurred on 6–7 November 2026 (documented in [INC-2026-001](./post-incident-review-git-exposure.md)).

**Existing controls:**
- `.assetsignore` excludes sensitive files from upload
- `worker.js` blocklist returns 404 for sensitive paths before asset serving
- `run_worker_first: true` ensures the Worker runs before asset fallback
- Post-deploy verification (Runbook Section 4b) is content-aware, distinguishing 404 from SPA fallback from actual file content

**Verification:** `curl` on each sensitive path returns 404; verified after every deploy.

**Residual risk:** Low. The incident is closed and the check is now mandatory.

---

### T-02 — CDN Supply Chain Compromise (Tampering)

**Threat.** An attacker compromises `cdn.jsdelivr.net` or one of the open-source packages it serves (`qrcodejs`, `jszip`), replacing the library with malicious JavaScript.

**Attack scenario.** The compromised library executes in the visitor's browser and could exfiltrate data entered into the tools. Because tools process resume content, JSON, and passwords, this would be severe.

**Impact:** High. Malicious scripts would run with the same privileges as the legitimate library.

**Likelihood before controls:** Medium. CDN compromises are rare but documented.

**Existing controls:**
- Subresource Integrity (SRI) with SHA-384 hashes on every external script
- The browser refuses to execute any file whose hash does not match the `integrity` attribute
- Version-pinned CDN URLs (`@1.0.0`, `@3.10.1`) prevent silent version replacement

**Verification:** Browser console shows no `Failed to find a valid digest` errors; both tools load and function.

**Residual risk:** Low. Any CDN tampering is caught by the browser before execution.

---

### T-03 — Cross-Site Scripting via Injection (Tampering / Elevation of Privilege)

**Threat.** An attacker injects malicious JavaScript into the site — via a URL parameter, a form input, or a compromised dependency — and causes it to execute in the visitor's browser.

**Attack scenario.** The ATS resume cleaner and the JSON formatter both display user-provided text. If that text is rendered without escaping, an attacker could craft a payload that executes when a victim uses the tool.

**Impact:** High if successful. XSS in a tool that handles resume content could exfiltrate the entire resume to an attacker's server.

**Likelihood before controls:** Medium. The tools accept unstructured text.

**Existing controls:**
- Content Security Policy with `script-src 'self' https://cdn.jsdelivr.net` — inline scripts and eval are blocked
- All user input is escaped before being inserted into the DOM (see `escapeHtml` in each tool's view module)
- No `innerHTML` assignment of unescaped user input
- `object-src 'none'` blocks plugin-based XSS vectors
- `base-uri 'self'` prevents base-tag hijacking

**Verification:** CSP header confirmed live; browser console shows zero CSP violations during normal use; source review of all `innerHTML` call sites.

**Residual risk:** Low. Defence in depth — CSP blocks execution, and the code escapes inputs.

---

### T-04 — Clickjacking (Tampering / Spoofing)

**Threat.** An attacker embeds `shiryu-kit.shiryu.workers.dev` in an invisible iframe on a malicious site and tricks users into interacting with the tools through an overlay.

**Attack scenario.** A fake "you have won a prize" overlay covers the iframe; the user clicks what they think is a prize claim but actually clicks a tool action. Because the tools handle resume content, this could trick a victim into pasting sensitive data into an attacker-visible context.

**Impact:** Medium. The tools do not have authenticated actions, so the worst case is confusing the user rather than stealing credentials.

**Likelihood before controls:** Low. Requires a targeted attack against the site's visitors.

**Existing controls:**
- `X-Frame-Options: DENY`
- Content Security Policy `frame-ancestors 'none'`
- Both must be bypassed simultaneously, which is not possible in modern browsers

**Verification:** Both headers confirmed in production responses.

**Residual risk:** Very low.

---

### T-05 — MIME Type Confusion (Tampering)

**Threat.** An attacker serves a file with a misleading content type, causing the browser to interpret it as executable JavaScript when the server intended it as inert text.

**Attack scenario.** A `.txt` file served with a content type the browser sniffs as JavaScript could execute. Requires either a server misconfiguration or a compromise of the Cloudflare edge.

**Impact:** Medium. Same as T-03 if it enables XSS.

**Likelihood before controls:** Low. Cloudflare serves files with correct content types by default.

**Existing controls:**
- `X-Content-Type-Options: nosniff` — the browser is forbidden from guessing content type
- Files are served with explicit MIME types by the Workers asset binding

**Verification:** Header confirmed in production responses.

**Residual risk:** Very low.

---

### T-06 — Protocol Downgrade and SSL Stripping (Spoofing / Tampering)

**Threat.** An attacker positioned on the network between the visitor and the site intercepts the initial HTTP request and either serves a fake HTTP page or prevents the redirect to HTTPS.

**Attack scenario.** On public Wi-Fi, the attacker intercepts `http://shiryu-kit.shiryu.workers.dev` before the redirect and serves their own content. The victim believes they are using the real site.

**Impact:** High. The attacker fully controls what the victim sees.

**Likelihood before controls:** Medium on untrusted networks.

**Existing controls:**
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — the browser refuses HTTP for the site for one year, including the first request after the first successful HTTPS visit
- Cloudflare automatic HTTPS with HTTP/2
- No mixed content; CSP `upgrade-insecure-requests` upgrades any accidental `http://` subresource

**Verification:** HSTS header confirmed; `http://` request redirected to `https://`.

**Residual risk:** Low. First-ever visit is theoretically vulnerable; every subsequent visit is protected.

---

### T-07 — Cross-Origin Window Access (Information Disclosure)

**Threat.** A malicious page opens `shiryu-kit.shiryu.workers.dev` in a new window and uses `window.opener` or cross-window JavaScript APIs to inspect or manipulate the session.

**Attack scenario.** A user clicks a link on a malicious site that opens Shiryu Kit in a new tab; the malicious site tries to read data from the Shiryu Kit tab through `window.opener`.

**Impact:** Medium. The tools hold user-entered data (resumes, JSON, passwords) that could theoretically be exfiltrated this way if the isolation were absent.

**Likelihood before controls:** Low. Requires the user to click through from a malicious site.

**Existing controls:**
- `Cross-Origin-Opener-Policy: same-origin` — the site's browsing context is isolated from cross-origin openers
- `Cross-Origin-Resource-Policy: same-origin` — the site's resources cannot be loaded by other origins
- Both provide Spectre-class side-channel mitigation

**Verification:** Both headers confirmed in production responses.

**Residual risk:** Low.

---

### T-08 — Denial of Wallet via Request Flood (Denial of Service)

**Threat.** An attacker (or an automated botnet, or an over-eager crawler) floods the site with requests, exhausting the Cloudflare Workers free tier limit of 100,000 requests per day and taking the site offline for the remainder of the day.

**Attack scenario.** A single IP or a distributed botnet sends thousands of requests per minute. Cloudflare's default DDoS protection absorbs most automated floods, but a targeted application-layer flood consuming the free tier daily budget is not blocked at the Workers level without rate limiting.

**Impact:** Low-to-Medium. The site is a free tool suite; being offline for a few hours has no financial or data impact. It is inconvenient for users.

**Likelihood before controls:** Low. The site has no adversaries; the traffic since launch has been ~1,600 requests total.

**Existing controls:**
- Cloudflare's default DDoS protection
- Cloudflare Workers free tier: 100,000 requests/day
- Site is entirely static; no per-request compute cost beyond the Worker script itself

**Controls considered but not deployed:**
- Workers Rate Limiting binding — configured in `wrangler.jsonc` but not stress-tested in production. Documented as a known gap in [Security Controls Inventory Section 11](./security-controls.md).

**Verification:** Traffic volume is monitored via the Cloudflare Workers metrics dashboard.

**Residual risk:** Medium. This is the highest residual risk in the model, because the mitigation is not fully verified.

**Mitigation plan:** Revisit the rate limiting binding with a proper concurrent load test. If confirmed working, promote it from "configured" to "verified" in the Security Controls Inventory.

---

## 4. Risk Summary

| ID | Threat | STRIDE | Impact | Likelihood | Residual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T-01 | Sensitive file disclosure | Information disclosure | High | High | **Low** (incident closed) |
| T-02 | CDN supply chain compromise | Tampering | High | Medium | **Low** (SRI) |
| T-03 | Cross-site scripting | Tampering / Elevation | High | Medium | **Low** (CSP + escaping) |
| T-04 | Clickjacking | Tampering / Spoofing | Medium | Low | **Very low** |
| T-05 | MIME type confusion | Tampering | Medium | Low | **Very low** |
| T-06 | Protocol downgrade / SSL stripping | Spoofing / Tampering | High | Medium | **Low** (HSTS) |
| T-07 | Cross-origin window access | Information disclosure | Medium | Low | **Low** (COOP/CORP) |
| T-08 | Denial of wallet | Denial of service | Low-Medium | Low | **Medium** (rate limiter unverified) |

---

## 5. Threats Considered and Excluded

| Threat | Why excluded |
| :--- | :--- |
| SQL injection | No database exists |
| Authentication bypass | No login exists |
| Session hijacking | No session exists |
| Server-side request forgery (SSRF) | No server-side outbound requests |
| Broken access control | No access-controlled resources |
| Insecure direct object references | No object references exist |
| User data breach | No user data is stored |
| Payment card data exposure | No payment processing |

The absence of these common threats is a direct consequence of the architecture: no backend, no database, no user accounts. The threat model is short because the attack surface is small, not because the analysis is shallow.

---

## 6. Review Schedule

This threat model shall be reviewed:
- Annually (next review: November 2027)
- On any material change to the architecture
- On any new control being added or removed
- After any security incident

---

## Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 9 November 2026 | Piyush Gahlawat | Initial threat model — 8 STRIDE-classified threats with mitigations and residual risk |
| 1.1 | 9 November 2026 | Piyush Gahlawat | Cross-references updated to include Runbook and Decision Log |

**Related documents:** [SRS](./srs.md) · [PIR — .git exposure](./post-incident-review-git-exposure.md) · [ROPA](./ropa.md) · [Runbook](./runbook.md) · [Decision Log](./decisions.md) · [Security Controls](./security-controls.md)