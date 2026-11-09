# Decision Log — Shiryu Kit

**Document version:** 1.4
**Date:** 9 November 2026
**Author:** Piyush Gahlawat

Every significant architectural or operational decision, with the alternatives that were considered and the reasoning for the choice made.

**Why this exists:** So that future-me — or an interviewer, or a collaborator — can understand *why* the project is shaped the way it is, not just *what* it looks like. Where a decision's reasoning changed after an incident, that's recorded too.

**📌 Portfolio note:** This decision log is published as a portfolio artifact. The entries document the actual reasoning behind each choice — including the failed attempts, not just the successes. Some operational specifics (commit SHAs, exact configuration values) are referenced by commit so they remain verifiable in the repository history, but are not duplicated here as copy-paste-able operational recipes.

---


## D001 — Hosting: Cloudflare Workers over Vercel, Netlify, or a VPS

**Date:** 3 November 2026 (initial) · **Revised:** 7 November 2026
**Status:** Decided

**Context:** Needed a hosting platform for a static site with 8 pages and 6 client-side tools. Zero-cost requirement.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Vercel** | Excellent DX; auto-deploy; familiar | Hobby plan explicitly forbids commercial use; would require Pro ($20/mo) as soon as any revenue appears | ❌ Rejected |
| **Netlify** | Generous free tier; good DX | Credit-based model since Sept 2025; 300 credits/month consumed quickly; less control over request routing | ❌ Rejected |
| **Cloudflare Pages** | Free; unlimited bandwidth | No `run_worker_first` equivalent for request-level control | ❌ Rejected |
| **Cloudflare Workers (static assets)** | Free; unlimited requests on static assets; **`run_worker_first` enables request-level blocking**; no commercial-use restriction | Requires a `worker.js` script even for a static site | ✅ **Chosen** |
| **Self-hosted VPS** | Full control | Costs money; requires maintenance; overkill for 8 static pages | ❌ Rejected |

**Initial decision (3 Nov 2026):** Cloudflare Workers, primarily on free-tier terms — unlimited static assets, no commercial-use restriction, and native Git integration.

**Revised reasoning (7 Nov 2026):** After [INC-2026-001](./post-incident-review-git-exposure.md), the `run_worker_first` capability became the decisive factor. Cloudflare Pages — which was the simpler and equally free option — cannot intercept requests before asset serving. Without that capability, sensitive file blocking is not achievable on the free tier. The initial choice turned out to be correct, but for a reason that was not appreciated at the time.

**Reversibility:** High. Migration to another host is a `wrangler.jsonc` change and a DNS update.

---


## D002 — Framework: Vanilla JS + ES Modules over React, Vue, or Svelte

**Date:** 3 November 2026
**Status:** Decided

**Context:** Six tools with interactive UI, no backend, zero-cost requirement.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **React** | Ecosystem; familiar to most devs | Requires build step; ~45KB gzipped minimum; added complexity for 6 simple tools | ❌ Rejected |
| **Vue** | Simpler than React; good DX | Still requires build step for production | ❌ Rejected |
| **Svelte** | Compiled; small output | Still requires build step; adds tooling | ❌ Rejected |
| **Vanilla JS + ES Modules** | Zero build step; native browser modules; <10KB total JS; directly editable in any editor | Manual DOM management; no reactive bindings | ✅ **Chosen** |

**Decision:** Vanilla JS with ES Modules. The tools are simple enough that reactive frameworks add more overhead than they save. Each tool is ~50–100 lines of controller code. A framework would have tripled the boilerplate for no benefit.

**Trade-off accepted:** If the tool count grows past ~15 or UI complexity increases significantly, the lack of reactive bindings will become a bottleneck. At that point, migrating one tool at a time to a lightweight framework (Preact, Alpine) would be reasonable.

**Reversibility:** Medium. Individual tools can be migrated independently because they share no framework state.

---


## D003 — Architecture: MVC Separation per Tool

**Date:** 6 November 2026
**Status:** Decided

**Context:** Six tools, each with form inputs, validation, processing logic, and DOM output.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Single file per tool** (HTML + CSS + JS inline) | Fastest to build; no file navigation | Becomes unmaintainable past ~100 lines; hard to test; hard to share logic | ❌ Rejected |
| **No separation** (JS directly manipulates DOM in event handlers) | Simple at small scale | Business logic tangled with DOM; impossible to test without a browser | ❌ Rejected |
| **MVC per tool** (model.js + view.js + controller.js) | Testable model; DOM logic isolated; controller orchestrates cleanly | More files; slight boilerplate | ✅ **Chosen** |

**Decision:** MVC separation. Each tool has three files:

- `model.js` — pure business logic, zero DOM access
- `view.js` — DOM accessors only, no business logic
- `controller.js` — wires Model and View together

Implemented progressively across commits `a189f10` (QR), `45ce1fa` (password), `c4a6506` (word counter), `ee530b3` (JSON formatter), and in the resume cleaner's later refactor.

**Why:** The resume cleaner's `stripLatex` function is the clearest example. It had a critical bug (deleting text instead of stripping formatting) that was diagnosed and fixed at commit `eb2a979` *because* it was in an isolated model with a testable function. If the stripping logic had been tangled with DOM manipulation, the debugging would have taken hours.

**Trade-off accepted:** Slight boilerplate overhead. Accepted because the debugging benefit has already paid for itself once.

**Reversibility:** High. Tools can be merged back to single-file if complexity drops, but there's no reason to.

---


## D004 — Analytics: No Analytics in v1

**Date:** 6 November 2026
**Status:** Decided

**Context:** Needed to know if anyone was using the site, but wanted to maintain a zero-cookie, zero-tracking posture for GDPR reasons.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Google Analytics (GA4)** | Industry standard; rich data | Sets cookies; requires consent banner; contradicts "no tracking" claim in privacy policy; adds 45KB+ | ❌ Rejected |
| **Cloudflare Web Analytics** | Free; cookieless; no consent banner needed | Limited metrics (pageviews, referrers); no funnel analysis | ⏳ **Deferred** — will add later |
| **Plausible / Umami (self-hosted)** | Privacy-first; good metrics | Requires self-hosting (a second Worker); extra complexity for a side project at zero traffic | ⏳ **Deferred** |
| **No analytics** | Absolute privacy; no banner; no compliance overhead | Flying blind on traffic | ✅ **Chosen for v1** |

**Decision:** No analytics for v1. Use Cloudflare Workers' built-in request metrics (visible in the dashboard) as a rough proxy for traffic. Revisit when the site has meaningful traffic.

**Trigger for reconsideration:** If GSC shows any organic impressions at all, add Cloudflare Web Analytics (cookieless, no consent banner, no privacy policy change required). It is the correct first step.

**Reversibility:** High. Adding Cloudflare Web Analytics is a 10-minute change with no GDPR impact.

---


## D005 — Security: `run_worker_first: true` After `.git` Exposure

**Date:** 7 November 2026
**Status:** Decided (in response to INC-2026-001)

**Context:** A self-initiated pre-distribution security audit on 7 November found that repository metadata, configuration files, and dependency manifests were publicly accessible on `shiryu-kit.shiryu.workers.dev`. See [INC-2026-001](./post-incident-review-git-exposure.md) for the full inventory and timeline.

**Alternatives considered for remediation** — and this is where the history matters. The fix required **four commits over nine minutes**. Each attempt was real, tested, and found insufficient:

| # | Commit | Time | What was tried | Why it failed |
| :-- | :--- | :--- | :--- | :--- |
| 1 | `70b82be` | 13:52 | `.assetsignore` only | Files already uploaded; Worker not intercepting |
| 2 | `7c06235` | 13:54 | Added security headers | Headers applied but blocklist never executed |
| 3 | `4fd897c` | 13:58 | Corrected `.assetsignore` + worker blocklist | Blocklist still bypassed by asset serving |
| 4 | `519ae3d` | 14:01 | **`run_worker_first: true`** | **Effective** |

**Decision:** All three controls together — `.assetsignore`, `worker.js` blocklist, and `run_worker_first: true`. Each alone was tested and found insufficient. The combination is what makes the blocklist effective.

**Why this entry documents the failures and not just the fix:** The instinct is to record only the working solution. But the three failed attempts are the actual decision-making process — and knowing *why* each simpler approach didn't work is more valuable than knowing that the final approach did. Future-me reading "just add `run_worker_first`" would miss the non-obvious interaction between build-time and runtime controls that made the four-step process necessary.

**Trade-off accepted:** Every request now runs the Worker script. Adds a few milliseconds per request. Acceptable for the security benefit.

**Reversibility:** Low. Removing `run_worker_first` would re-expose sensitive paths. Do not reverse this decision.

---


## D006 — URLs: `.html` extensions with `html_handling: "none"`

**Date:** 6 November 2026
**Status:** Decided (commit `9d29d47`)

**Context:** Cloudflare Workers' default behavior is `auto-trailing-slash`, which 307-redirects `/page.html` to `/page`. Needed a decision on whether to accept the redirects or serve `.html` files directly.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Accept 307 redirects; use extensionless URLs** | Matches Cloudflare's canonical behavior; cleaner URLs | Requires find-and-replace across all internal links, canonical tags, sitemap, and og:url; loses any external links pointing to `.html` versions | ❌ Rejected |
| **`html_handling: "none"`** | `.html` URLs return 200 directly; no redirect chain | Requires `not_found_handling` configuration to serve `/index.html` for `/`; non-standard behavior | ✅ **Chosen** |

**Decision:** `html_handling: "none"` with `.html` URLs kept in all internal links, canonical tags, og:url, and sitemap. Consistency is preserved — everything says `.html`, everything returns 200, and the canonical tags match what's actually served.

**Trigger for reconsideration:** If a custom domain is added, the default URL structure becomes less important and could be restructured.

**Reversibility:** Medium. Requires a find-and-replace across 8 HTML files + sitemap if changed later.

---


## D007 — No Backend, No Database

**Date:** 3 November 2026
**Status:** Decided

**Context:** Every tool could benefit from user accounts or saved state (QR history, saved JSON, resume storage). A database would enable this.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Supabase (free tier)** | 500MB DB, auth, storage; generous free tier | Introduces personal data storage — triggers full GDPR obligations (DSARs become real, ROPA becomes complex, breach risk becomes real) | ⏳ **Deferred** |
| **Cloudflare D1 (SQLite)** | Free tier; native to Workers | Same GDPR implications as Supabase | ⏳ **Deferred** |
| **localStorage only** | No server; per-browser state | Session-scoped only; some GDPR complexity (storage is akin to cookies under ePrivacy) | ❌ Rejected for v1 |
| **No persistence** | Zero GDPR complexity; no accounts; no breach risk | Tools are stateless; users can't save their work | ✅ **Chosen for v1** |

**Decision:** No persistence in v1. Every tool is stateless. This is a deliberate choice that keeps GDPR obligations minimal (no user data stored → no DSARs to fulfill → no breach notification risk).

**Trigger for reconsideration:** If a specific feature demonstrably requires persistence (e.g. "save my QR history across devices") *and* the GDPR overhead is justified by user demand.

**Reversibility:** High. Persistence can be added later with appropriate privacy controls. But the current stateless design is a significant privacy advantage that should not be given up lightly.

---


## D008 — Security: SRI on All CDN Dependencies

**Date:** 7 November 2026
**Status:** Decided (commit `6f83e53`, prefix fix at `a73bd98`)

**Context:** Two open-source JavaScript libraries are loaded from public CDNs. If a CDN is compromised, malicious code could be injected into every user session.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **No SRI** | Simpler HTML | CDN compromise = full site compromise; browser runs whatever the CDN serves | ❌ Rejected |
| **Self-host the libraries** | No CDN dependency at all | Adds ~150KB to repo; loses CDN caching benefits | ⏳ Considered — viable alternative |
| **SRI with SHA-384 hashes** | One attribute per script; browser rejects tampered files | Must be regenerated if library is updated | ✅ **Chosen** |

**Decision:** SRI on every external script. Both libraries are pinned to specific versions with SHA-384 hashes. If either CDN serves a modified file, the browser refuses to execute it and the tool fails loudly rather than silently running malicious code.

**Note on the prefix:** The first commit (`6f83e53`) included the hash but omitted the required `sha384-` prefix. The tools broke silently — the browser refused to execute the scripts. Fixed at `a73bd98`. The format is `<algorithm>-<base64-hash>`, not just the base64 hash.

**Trade-off accepted:** Library upgrades require recomputing the hash. This is intentional friction — it forces a conscious decision about every dependency update.

**Reversibility:** Low. Removing SRI would reduce security. Do not reverse.

---


## D009 — Resume Templates: PDF Output, with ATS Disclaimer

**Date:** 7 November 2026
**Status:** Decided (commit `2bf56a4`)

**Context:** The resume templates tool could output DOCX (ATS-friendly format) or PDF (human-friendly format). Both are useful, for different audiences.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **DOCX only** | ATS-friendly | Requires a DOCX generation library; styling limitations; users typically want a "finished" file | ❌ Rejected |
| **PDF only, no disclaimer** | Simple; browser print-to-PDF | Misleads users into submitting PDFs to ATS systems, which often parse PDF less reliably than DOCX | ❌ Rejected |
| **PDF output, with clear ATS disclaimer** | Users get a clean print-ready PDF; disclaimed as non-ATS; linked to the DOCX cleaner for ATS submissions | Requires users to understand the distinction | ✅ **Chosen** |
| **Both DOCX and PDF** | Maximum flexibility | Doubles the implementation work; user confusion about which to pick | ⏳ Deferred — could be added later |

**Decision:** PDF only, with a prominent yellow disclaimer at the top of the page: *"PDF is for humans, not ATS."* The tool explicitly directs ATS submissions to the Resume Cleaner (which produces DOCX).

**Why this matters:** The honest framing is a competitive advantage. Most resume template tools claim "ATS-friendly PDF" — which is often not true. Making the disclaimer explicit builds trust and differentiates the tool.

**Reversibility:** High. DOCX output could be added as a second export option.

---


## D010 — Email: Dedicated Gmail, Rejecting `+privacy` Sub-address

**Date:** 7 November 2026
**Status:** Decided (commit `6ffbad7`)

**Context:** Needed a contact email for GDPR data subject requests. Options included using the personal Gmail with a `+privacy` suffix, a dedicated Gmail, a paid alias service, or a self-hosted mailbox.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Personal Gmail with `+privacy` suffix** | Free; no new account | **Exposes real email** — anyone can strip the `+privacy` and email directly; unsuitable for a public GDPR contact point | ❌ Rejected |
| **Paid alias service** (AdGuard, SimpleLogin) | Hides personal email; professional | Adds a sub-processor (must disclose in privacy policy); requires account | ⏳ Viable but not chosen |
| **Dedicated Gmail** (documented in privacy policy) | Free; isolates privacy correspondence; no personal email exposure; professional reading | Still a `@gmail.com` address | ✅ **Chosen** |
| **Cloudflare Email Routing** | Free; first-party; best deliverability | **Requires a custom domain** — not available on `workers.dev` subdomain | ⏳ Deferred until domain purchase |

**Decision:** Dedicated Gmail, address published in the privacy policy. 2FA enabled with authenticator app. Recovery email set. Gmail filter configured to flag "Privacy" in subject line.

**Trigger for reconsideration:** When a custom domain is purchased (~₹1,000/yr), Cloudflare Email Routing becomes the better option for a `privacy@yourdomain.com` address.

**Reversibility:** Medium. Changing the contact email requires updating the privacy policy and any external listings that reference it.

---


## D011 — Resume Templates: Comprehensive Heading Detection via Synonym Map

**Date:** 8 November 2026
**Status:** Decided

**Context:** The resume templates tool initially recognized a narrow set of section headings (Summary, Experience, Education, Skills, Projects, Certifications). Real-world resumes use hundreds of variations — Professional Summary, Technical Proficiency, Core Competencies, Work History, Areas of Expertise — and the narrow list meant most user text was silently dropped into the wrong section or into the contact block.

**Alternatives considered:**

| Option | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Regex-only matching** | Flexible; catches unexpected variants | Fragile — adding a new variant requires careful regex editing; false positives common (e.g. "Note:" in prose would match a heading pattern) | ❌ Rejected |
| **Machine learning classification** | Handles arbitrary headings | Overkill for a browser-side tool; requires an external model or a bundled trained classifier; adds latency and complexity | ❌ Rejected |
| **Hardcoded synonym map with normalization** | Explicit, extensible; no false positives (exact match on normalized string) | Adding new headings requires a map entry | ✅ **Chosen** |

**Decision:** A hardcoded synonym map of over 300 heading variations across 18 categories. Normalization strips decorations (colons, dashes, asterisks, equals signs, numbering), lowercases, removes articles, and standardizes `&` / `and`. Matching is exact on the normalized string, which eliminates false positives entirely.

**Trade-off accepted:** New headings require manual map extension. This is intentional friction — it forces a decision about every synonym, rather than accepting regex false positives silently.

**Reversibility:** High. The map can be replaced with a different approach (regex, ML classifier, external service) without changing the caller API — the `parseResume(text)` function signature stays stable.

---

## Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 7 November 2026 | Piyush Gahlawat | Initial decision log — 10 decisions recorded |
| 1.1 | 7 November 2026 | Piyush Gahlawat | D005 corrected to document the four-attempt remediation from actual git log; commit references added throughout |
| 1.2 | 7 November 2026 | Piyush Gahlawat | Sanitization pass for public portfolio: added portfolio note; generalized exposed-path list in D005; removed specific library names and email address from D008 and D010 where they added no informational value beyond "open-source JavaScript libraries" and "dedicated Gmail" |
| 1.3 | 8 November 2026 | Piyush Gahlawat | D011 added — comprehensive heading detection via synonym map |
| 1.4 | 9 November 2026 | Piyush Gahlawat | Cross-references updated to include SRS and Threat Model |

**Related documents:** [SRS](./srs.md) · [Threat Model](./threat-model.md) · [PIR — .git exposure](./post-incident-review-git-exposure.md) · [ROPA](./ropa.md) · [Runbook](./runbook.md) · [Security Controls](./security-controls.md)