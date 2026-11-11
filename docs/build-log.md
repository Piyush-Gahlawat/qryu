# Build Log — Shiryu Kit

**Document version:** 1.0
**Date:** 11 November 2026
**Author:** Piyush Gahlawat
**Purpose:** Chronological record of the build — what was done, when, why, and what was learned. This is not the Decision Log (which records architectural choices) or the Post-Incident Review (which records a specific failure). This is the running history of the project.

**Why this exists:** So that future-me — and any reviewer evaluating the project — can see the actual build sequence, including the dead ends and the over-polishing. The governance documents record what the system *is*; this document records what it *took to get there*.

---

## 1. Build Phases at a Glance

| Phase | Date range | Outcome |
| :--- | :--- | :--- |
| **0. Foundation** | 3 Nov 2026 | QR tool, Cloudflare Worker, first deploy |
| **1. Tool suite expansion** | 4–6 Nov 2026 | 5 more tools, hub page, MVC refactor |
| **2. Rebrand** | 6 Nov 2026 | QRyu → Shiryu Kit; URL change; DPDP initial work |
| **3. Security incident + hardening** | 7 Nov 2026 | INC-2026-001; header hardening; DPDP breach procedure |
| **4. Documentation expansion** | 8–9 Nov 2026 | SRS, Threat Model added; full doc set review; observability disclosure |
| **5. Open issues** | ongoing | Resume cleaner retest; rate limiter untested; zero distribution |

---

## 2. Phase 0 — Foundation (3 November 2026)

**What was built:** A single QR code generator, deployed on Cloudflare Workers. Vanilla HTML/CSS/JS, no framework.

**Why this tool first:** It was the smallest possible complete product — one input, one output, one download. Enough to prove the deploy pipeline worked end-to-end.

**Key decisions made in this phase:**
- Cloudflare Workers over Vercel (free tier, no commercial-use restriction)
- Vanilla JS over React (no build step needed)
- Zero-cost constraint accepted as a hard limit, not an aspiration

**What worked:** The first deploy took under an hour. The Cloudflare + GitHub integration is genuinely frictionless.

**What didn't:** Two failed deploys before realizing `html_handling: "none"` needed `not_found_handling` configured to serve `/index.html` for the root path.

**Time spent:** ~4 hours (including learning Cloudflare Workers).

---

## 3. Phase 1 — Tool Suite Expansion (4–6 November 2026)

**What was built:** Five more tools — password generator, word counter, JSON formatter, ATS resume cleaner, resume templates. Plus a hub page.

**Why expand:** A single tool is a demo. A suite is a product. Each tool targets a separate search query, which means multiple SEO entry points from one domain.

**Key decisions:**
- **MVC per tool** (model/view/controller) — chosen because the resume cleaner's `stripLatex` function was already proving hard to debug when tangled with DOM logic
- **No backend, no database** — every tool runs in browser memory. Chosen to keep GDPR obligations minimal (no stored data = no DSARs to fulfil)
- **Hub page** — a landing page with 6 tool cards, replacing the previous QR-generator-as-homepage

**Technical surprises:**
- The resume cleaner required JSZip (in-browser DOCX parsing), which is a 150KB CDN dependency — the first real third-party risk
- JSON syntax highlighting needed an overlay technique (transparent textarea over a colored `<pre>`) because browsers don't support rich text in textareas
- Resume templates needed `@media print` + `@page` rules to render A4 with correct margins

**What didn't work on the first try:**
- The initial resume-templates parse logic deleted entire sections when the heading wasn't recognized. Fixed by adding a synonym map (~300 variants across 18 categories).
- The JSON formatter rendered duplicate panels after a copy-paste error. Took two attempts to clean up.

**Time spent:** ~12 hours across three evenings.

**Mistake worth recording:** I did the MVC refactor on all 5 tools before verifying any of them worked end-to-end. The next refactor should be verified per tool, not across the whole suite.

---

## 4. Phase 2 — Rebrand and DPDP (6 November 2026)

**What happened:** Renamed the project from "QRyu" to "Shiryu Kit" because the site had outgrown the QR-specific name. Migrated the URL from `qryu.shiryu.workers.dev` to `shiryu-kit.shiryu.workers.dev`.

**Why a rebrand so early:** "QRyu" was actively misleading — a visitor landing on the password generator saw a name about QR codes. Better to fix at 6 tools than at 20.

**What was added in this phase:**
- Privacy policy covering GDPR
- Initial DPDP analysis (Grievance Officer, Section 7(a) basis, nomination right)
- New domain with updated canonical tags, sitemap, og:url

**Technical trouble:**
- The URL change required re-verifying Google Search Console and resubmitting the sitemap — a 2-hour detour that could have been avoided by picking the final name first
- Old `qryu` Worker had to be explicitly deleted after being verified to return 404 on all paths (see INC-2026-001)

**Mistake worth recording:** Renaming mid-build cost ~4 hours across the session. The correct discipline is **pick the brand name before writing the first line of HTML**.

**Time spent:** ~8 hours.

---

## 5. Phase 3 — Security Incident and Hardening (7 November 2026)

**What happened:** A self-initiated security audit found that `.git`, `wrangler.jsonc`, `worker.js`, and `package.json` were all publicly accessible on the live site. The exposure had existed since the first deploy (~16 hours).

**Root cause:** Cloudflare Workers serves static assets before the Worker script runs, unless `run_worker_first: true` is set. The Worker's blocklist never executed on asset requests.

**Remediation:** Four attempts over nine minutes (documented in INC-2026-001 and D005). The final fix required `.assetsignore` + `worker.js` blocklist + `run_worker_first: true` together.

**What this taught me:**
- Default configurations are not secure by default
- Build-time and runtime controls are different controls — both are required
- The deployment checklist must include "verify sensitive paths return 404", not just "verify the site works"

**Post-incident hardening added:**
- 10 security headers (HSTS, CSP, COOP, CORP, Permissions-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection, Cache-Control)
- SRI hashes on both CDN scripts
- `.assetsignore` to prevent future uploads of sensitive files
- Post-deploy verification Section 4b — content-aware check distinguishing 404, SPA fallback, and actual leak

**Time spent:** ~10 hours (incident response + hardening + PIR writing).

**The one thing that went right:** The incident was found by self-directed audit, not by an external report. The practice of "audit before launch" worked.

---

## 6. Phase 4 — Documentation Expansion (8–9 November 2026)

**What happened:** This phase is the reason this build log exists. It is honest about an imbalance that needs naming.

**What was produced:** 9 documentation artifacts in total — 8 governance documents (SRS, Threat Model, PIR, ROPA, Runbook, Decision Log, Security Controls, README) plus this build log. All cross-referenced, all with version tables, all internally consistent.

**What this phase cost:**
- Roughly **20+ hours** across two days
- Multiple rounds of review per document
- 6+ review cycles on `privacy.html` alone, each catching a new contradiction introduced by the previous fix

**What it produced for the site's quality:** A governance documentation set genuinely better than most small professional products have. Every claim is verifiable against the live system. Every retention period is disclosed. Every version table matches its header date.

**What it produced for the site's traffic:** Nothing. Nothing in this phase touched a potential user.

**The lesson, recorded for future-me:** Documentation is necessary but not urgent. The 20+ hours spent on doc review in this phase could have been split as **4 hours on the essential docs** (README, privacy policy, one ROPA) and **16 hours on distribution**. The result would have been slightly weaker docs and significantly stronger traffic.

**Specific mistakes worth recording:**

1. **The observability ripple.** Enabling `"observability": { "enabled": true }` in `wrangler.jsonc` created a new data processing activity (3-day log retention) that required updates to 5 documents. Each document needed a different kind of correction:
   - Privacy policy: disclosure paragraph
   - ROPA: retention field rewrite
   - Threat model: "no user data" exclusion clarification
   - Security controls: new control row
   - SRS: new PR-08 requirement

   The first time I fixed the privacy policy, I introduced a contradiction elsewhere in the same file (the "How long we keep data" section still said "we do not retain personal data"). This required two more rounds to catch. **The lesson: after adding a disclosure, grep the entire document for the old claim before committing.**

2. **The `Shiryru` typo** — the word "Shiryu" was misspelled as "Shiryru" in the README link line for several commits. It only got caught on a final pass. **The lesson: after any find-and-replace, grep for the old pattern to confirm zero matches.**

3. **Markdown corruption from clipboard.** Multiple times, markdown tables and code fences were lost when copying from a chat interface into an editor. The fix is always the same: save via `cat > file << 'EOF'` heredoc, never paste-into-editor. This cost an estimated 2 hours across the phase.

**Time spent:** ~20 hours.

---

## 7. Current State (11 November 2026)

### What is complete

| Item | Status |
| :--- | :--- |
| 6 tools live | ✅ |
| 8 pages returning 200 | ✅ |
| 10 security headers | ✅ Verified live |
| Sensitive path blocklist | ✅ Verified live |
| SRI on both CDN scripts | ✅ |
| GDPR + DPDP privacy policy | ✅ |
| 9 documentation artifacts (8 governance + this build log) | ✅ Complete, cross-referenced, version-controlled |
| Observability disclosure | ✅ In all 5 documents that make retention claims |
| Jade + gold palette | ✅ Live |
| Log retention disclosed | ✅ 3 days, in 5 documents |
| Document control dates | ✅ Match header dates |
| All session edits committed | ✅ Committed 11 Nov 2026 alongside this build log |

### What is NOT complete

| Item | Status | Why it matters |
| :--- | :--- | :--- |
| **Resume Cleaner space-loss bug** | ✅ Fixed and verified with a real two-page resume (11 Nov 2026) | Root cause was twofold: `flattenTables` joined `<w:t>` nodes with the empty string, dropping `<w:br/>`, `<w:tab/>`, and paragraph boundaries inside cells (`with5+`, `yearsof`, `ManagerDS`); and `stripLatex` called `.trim()` on every text node, stripping the boundary spaces that separated runs after LaTeX removal — so the preview looked right while the downloaded DOCX was still glued. Fix: shared boundary-aware extraction (`collectTextPieces` + `assembleText`) used by both the preview and table flattening, and `.trim()` removed from `stripLatex`. |
| **Rate limiter** | ⚠️ Configured in `wrangler.jsonc`, deployed, but not stress-tested | The `security-controls.md` §11 honestly documents this as "not stress-tested". A 110-request test has been attempted twice but never completed under load. |
| **Favicon** | ❌ Still indigo placeholder | A dragon-S design was drafted in chat (jade background, white dragon body, 12 dorsal spikes, open mouth, dark blue eyes) but never saved to disk. All 8 pages still use the placeholder fill value. |
| **Launch** | ❌ Zero distribution | No Product Hunt, no directories, no LinkedIn Featured section, no Reddit post. No confirmed human visitors since day one (see §12). |
| **GSC indexing** | ⏳ Sitemap submitted, some pages requested, not all | 8 URLs in sitemap; 4 requested for indexing; 4 not. |
| **Custom domain** | ❌ Deferred | ~₹800/year; deferred until traffic or revenue justifies it |

### What the site actually has

- 8 pages, technically excellent
- No confirmed human users
- Every governance claim verifiable against the live system
- No one knows it exists

---

## 8. Time Accounting (approximate)

| Phase | Duration | % of total |
| :--- | :--- | :--- |
| Foundation | 4 hrs | 7% |
| Tool suite expansion | 12 hrs | 21% |
| Rebrand + DPDP initial | 8 hrs | 14% |
| Security incident + hardening | 10 hrs | 18% |
| Documentation expansion | 20 hrs | 36% |
| Distribution | 0 hrs | 0% |
| **Total** | **~54 hrs** | **100%** |

**The 0% on distribution is the finding.** It is not a moral failing — the docs, security, and tools genuinely needed the attention they got. But the imbalance is now the primary bottleneck. Further time on docs, favicon, or rate limiter testing will not produce a user.

---

## 9. What Actually Worked (patterns to keep)

1. **Small tools, one at a time.** The 6-tool suite was built one tool per session, each committed before the next began. This was not always smooth (see the MVC refactor note above), but the incremental rhythm kept the codebase comprehensible.

2. **Vanilla JS + ES Modules + MVC separation.** Zero framework overhead, zero build step, and the stripLatex bug was fixable in 20 minutes because it lived in an isolated function.

3. **Cloudflare Workers + GitHub auto-deploy.** Every commit to `main` produces a live deploy in ~60 seconds. No CI configuration needed.

4. **Content-aware verification.** The post-deploy check in the runbook doesn't just assert "status 200" — it compares response hashes to distinguish "SPA fallback" from "actual leak". This caught nothing yet, but it's the right shape for a real deployment.

5. **Self-directed security audit before launch.** The `.git` incident was found by self-audit, not by an external report. The practice of "audit before distribute" is worth carrying into every project.

---

## 10. What to Change for Product #2

Patterns to carry forward and patterns to break, based on what actually happened:

| Pattern | Keep or change | Rationale |
| :--- | :--- | :--- |
| Vanilla JS + ES Modules + MVC | **Keep** | Proven, zero overhead, debuggable |
| Cloudflare Workers + GitHub auto-deploy | **Keep** | The pipeline is genuinely frictionless |
| Governance documentation | **Reduce scope** | Write README, privacy policy, and a single ROPA. Defer SRS/Threat Model/Runbook until traffic justifies. |
| Rebrand mid-build | **Never do** | Cost 4 hours on Shiryu Kit. Pick the brand before writing the first line. |
| Multiple review cycles per document | **Cap at one** | After one review, commit and move on. Further review is polish, not accuracy. |
| Favicon / palette / decoration | **Defer until traffic** | These were the least valuable hours spent on Shiryu Kit. |
| Distribution | **Do first, not last** | Zero hours on distribution is the primary bottleneck. For product #2, distribution should be Week 1 work, not Week 4. |
| Commit after each meaningful change | **Keep** | The uncommitted 20-hour doc session was a real risk until committed. Small commits are cheap insurance. |

---

## 11. The Honest One-Paragraph Summary

Shiryu Kit is a fully-functional, security-hardened, privacy-compliant, well-documented small product that no confirmed human has used. It took ~54 hours to build and reached a quality level comparable to a professionally-governed small SaaS. 36% of those hours went to documentation; 0% went to telling anyone the product exists. The next action that produces a user is not more code, more docs, or a better favicon — it is `git commit`, then `Product Hunt`, then `directories`. Every additional hour on the current site before distribution is a mistake.

---

## 12. Traffic Analysis (11 November 2026)

**Why this section exists:** To record what the request metrics actually show, and to prevent a future reviewer — or future-me — from mistaking request volume for an audience.

**Observed data (Workers metrics, production, all-time to date):**

| Metric | Value |
| :--- | :--- |
| Asset requests | ~1.8k |
| Invocations | ~1.38k |
| Subrequests | ~1.18k |
| Asset cache hit rate | 83.19% |
| Asset 4xx responses | 10 |
| Asset 5xx responses | 0 |
| CPU time (median) | 524 µs |
| Wall time | 11 ms |

**Request distribution by Cloudflare data centre:**

| Colo | Requests |
| :--- | :--- |
| Singapore, SG (SIN) | ~1,000 (≈72%) |
| Hong Kong, HK (HKG) | ~70 |
| Seattle, US (SEA) | ~60 |
| Frankfurt, DE (FRA) | ~20 |
| Amsterdam, NL (AMS) | ~10 |
| Paris, FR (CDG) | ~10 |
| Bucharest, RO (OTP) | ~10 |
| Newark, US (EWR) | ~10 |
| Atlanta, US (ATL) | ~10 |
| Dhaka, BD (DAC) | ~10 |
| Tokyo, JP (NRT) | ~10 |
| Dulles, US (IAD) | ~10 |

**Interpretation:**

1. **These are data-centre locations, not user locations.** Cloudflare Workers metrics report the colo that served the request. They do not identify where a visitor is. Country-level attribution therefore cannot be inferred from this table.
2. **The distribution is not organic.** Organic traffic is diffuse. A single colo accounting for ~72% of requests, against single-digit long-tail counts everywhere else, is the signature of automated traffic — and Singapore hosts a large share of the cloud infrastructure that scanning and scraping tools run from.
3. **The SPA fallback converts probes into successful-looking requests.** Because `not_found_handling: "single-page-application"` returns `index.html` with status 200 for any unmatched path, a scanner probing `/.env` or `/wp-login.php` produces an invocation, a subrequest, and a 200 — never a 4xx. Only 10 asset 4xx responses were recorded, which is consistent with almost nothing being able to fail.
4. **Request counts are not visitor counts.** A single page load fetches HTML, CSS, several ES modules, and a favicon. At roughly 10–15 requests per visit, ~1.38k invocations is on the order of 100–150 page visits at the very most, with the caveat above applied to that figure.

**Conclusion:** There are **no confirmed human visitors**. The request volume is dominated by automated traffic, most plausibly infrastructure scanners against a public `workers.dev` subdomain. The site is technically healthy — zero 5xx, zero errors, low CPU — but it has not been distributed.

**Actions taken or planned:**

- Enable **Cloudflare Web Analytics** (free, cookieless, JS-based) to obtain a visitor count that excludes non-executing clients. This is the only metric on this stack that distinguishes a browser from a script.
- Consider a WAF rule to rate-limit or challenge the dominant source if it begins to approach the free-tier ceiling (100,000 requests/day). Not urgent at current volume.
- Re-check **Search Console** impressions to determine whether any real search traffic exists, independent of Workers metrics.

---

## Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 11 November 2026 | Piyush Gahlawat | Initial build log — 5 phases (3–9 Nov), 54-hour time accounting, state assessment, traffic analysis. Includes the INC-2026-001 incident record by reference and the honest distribution finding in §11. |
| 1.1 | 11 November 2026 | Piyush Gahlawat | §7: Resume Cleaner space-loss bug marked fixed and verified; recorded twofold root cause (table flattening + stripLatex trim) and the shared extraction fix |
**Related documents:** [SRS](./srs.md) · [Threat Model](./threat-model.md) · [PIR — .git exposure](./post-incident-review-git-exposure.md) · [ROPA](./ropa.md) · [Runbook](./runbook.md) · [Decision Log](./decisions.md) · [Security Controls](./security-controls.md) · [README](./README.md)