# Software Requirements Specification — Shiryu Kit

**Document version:** 1.1
**Date:** 9 November 2026
**Author:** Piyush Gahlawat
**Status:** Implemented and deployed
**Live deployment:** https://shiryu-kit.shiryu.workers.dev

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) documents the requirements for Shiryu Kit, a suite of six browser-based utility tools deployed as a static site on Cloudflare Workers. The specification records what the system does, what it is required to do, and the constraints under which it operates.

### 1.2 Document conventions
- **Shall** indicates a mandatory requirement.
- **Should** indicates a recommended requirement.
- **May** indicates an optional requirement.
- Requirement identifiers follow the pattern `FR-<tool>-<number>` for functional requirements and `NFR-<category>-<number>` for non-functional requirements.

### 1.3 Intended audience
The SRS is intended for the project maintainer, prospective collaborators, and technical reviewers evaluating the project as a portfolio artifact. It is written in a practitioner register — not a formal IEEE 830 template — because the project is a solo-operated side project, not a procured enterprise system.

---

## 2. Scope and Boundaries

### 2.1 In scope
- Six browser-based utility tools: QR code generator, password generator, word counter, JSON formatter, ATS resume cleaner, and resume templates.
- The hub page that links to all six tools.
- A privacy policy page.
- The governance documentation set.
- Deployment on Cloudflare Workers (static assets + a Worker script).

### 2.2 Out of scope
- User accounts, authentication, or session management.
- Server-side processing of any user data.
- A database, KV store, or any persistence layer.
- Payment processing or paid features.
- Analytics, advertising, or tracking of any kind.
- Mobile native applications.

### 2.3 Design boundary
The system is deliberately stateless. Every tool runs entirely in the browser. This boundary is not a technical limitation but a design decision documented in `docs/decisions.md` (D007).

---

## 3. Definitions and Acronyms

| Term | Definition |
| :--- | :--- |
| **ATS** | Applicant Tracking System — software recruiters use to filter resumes |
| **CSP** | Content Security Policy — HTTP header restricting resource loading |
| **DOCX** | Microsoft Word file format (a ZIP of XML files) |
| **DPDP** | Digital Personal Data Protection Act, 2023 (India) |
| **GDPR** | General Data Protection Regulation (EU) |
| **ROPA** | Records of Processing Activities — GDPR Article 30 record |
| **SRI** | Subresource Integrity — cryptographic hash verifying CDN files |
| **Worker** | Cloudflare's serverless execution environment |
| **OMML** | Office Math Markup Language — Word's native equation format |

---

## 4. Overall System Description

### 4.1 Product perspective
Shiryu Kit is a standalone static site deployed on Cloudflare Workers. There is no backend, no database, and no third-party API integration. Every tool executes in the user's browser using client-side JavaScript delivered as ES Modules.

### 4.2 Product functions
Six utility functions and one hub navigation page:
1. Generate and download QR codes from text or URL input.
2. Generate cryptographically secure passwords with configurable complexity.
3. Count words, characters, sentences, and paragraphs in real time, with reading-time estimation.
4. Format, minify, and validate JSON with syntax highlighting.
5. Clean DOCX resumes for ATS compatibility — removing LaTeX residue, OMML equations, hidden text, and text boxes.
6. Generate print-ready PDF resumes from pasted text using three templates.

### 4.3 User characteristics
- **End users:** General public with no technical training, using desktop or mobile browsers.
- **Maintainer:** A solo developer with serverless, frontend, and governance experience.
- **Reviewers:** Hiring managers, auditors, or collaborators evaluating the project as evidence of competence.

### 4.4 Operating environment
- **Hosting:** Cloudflare Workers (static assets) with a Worker script for request routing.
- **Client:** Any modern browser supporting ES Modules (Chrome, Firefox, Safari, Edge — last 2 versions).
- **No installation required.**

### 4.5 Design and implementation constraints
- Zero cost: no paid services, no domain purchases, no paid analytics or monitoring.
- No user data retention: the site must not store personal data at any point.
- Client-side only: no server-side processing of user content.

---

## 5. User Roles and Use Cases

### 5.1 User roles
- **Visitor:** Any person who accesses the site. No login, no role differentiation.
- **Maintainer:** The developer who deploys and documents the site.

### 5.2 Primary use cases

| ID | Actor | Use case | Precondition | Postcondition |
| :--- | :--- | :--- | :--- | :--- |
| UC-01 | Visitor | Generate a QR code from a URL | Visitor has opened the QR tool | QR code rendered in the browser; downloadable as PNG |
| UC-02 | Visitor | Generate a strong password | Visitor has opened the password tool | Password displayed; copyable to clipboard |
| UC-03 | Visitor | Count words in pasted text | Visitor has opened the word counter | Statistics displayed live as text is typed |
| UC-04 | Visitor | Format a JSON string | Visitor has opened the JSON formatter | Formatted or minified JSON displayed; copyable |
| UC-05 | Visitor | Clean a DOCX resume for ATS | Visitor has opened the resume cleaner | Cleaned DOCX downloaded; original untouched |
| UC-06 | Visitor | Generate a PDF resume | Visitor has opened the templates tool | Print dialog opens with resume-only content |
| UC-07 | Maintainer | Deploy a change | Maintainer has committed to the main branch | Site redeployed automatically; verification checks pass |

---

## 6. Functional Requirements — QR Code Generator

| ID | Requirement |
| :--- | :--- |
| FR-QR-01 | The system shall accept text or URL input up to 2,000 characters. |
| FR-QR-02 | The system shall render a QR code using the `qrcodejs` library loaded via CDN with Subresource Integrity verification. |
| FR-QR-03 | The system shall allow the generated QR code to be downloaded as a PNG image. |
| FR-QR-04 | The system shall trigger generation on the Enter key as well as on the Generate button. |
| FR-QR-05 | The system shall display an inline error if the input is empty or exceeds the length limit. |
| FR-QR-06 | The system shall generate QR codes at 320×320 pixels with high error correction (`QRCode.CorrectLevel.H`). |

---

## 7. Functional Requirements — Password Generator

| ID | Requirement |
| :--- | :--- |
| FR-PW-01 | The system shall generate passwords of a configurable length between 8 and 64 characters. |
| FR-PW-02 | The system shall allow enabling or disabling uppercase letters, lowercase letters, numbers, and symbols. |
| FR-PW-03 | The system shall allow the exclusion of ambiguous characters (`0`, `O`, `1`, `l`, `I`, `|`, `` ` ``, `'`, `"`). |
| FR-PW-04 | The system shall use `crypto.getRandomValues()` and rejection sampling to produce unbiased, cryptographically secure randomness. |
| FR-PW-05 | The system shall guarantee at least one character from each selected character set. |
| FR-PW-06 | The system shall display a strength indicator (Weak / Good / Strong) with an estimated bit entropy. |
| FR-PW-07 | The system shall allow one-click copy to clipboard. |

---

## 8. Functional Requirements — Word Counter

| ID | Requirement |
| :--- | :--- |
| FR-WC-01 | The system shall display live counts of words, characters, characters without spaces, sentences, and paragraphs. |
| FR-WC-02 | The system shall estimate reading time using 225 words per minute. |
| FR-WC-03 | The system shall provide text transformations: UPPERCASE, lowercase, Title Case, Sentence case. |
| FR-WC-04 | The system shall allow copy-to-clipboard and clear operations, with confirmation for clear. |
| FR-WC-05 | The system shall update counts on every keystroke without noticeable latency. |

---

## 9. Functional Requirements — JSON Formatter

| ID | Requirement |
| :--- | :--- |
| FR-JF-01 | The system shall format (beautify) valid JSON with 2-space, 4-space, or tab indentation. |
| FR-JF-02 | The system shall minify valid JSON to a single line. |
| FR-JF-03 | The system shall display syntax highlighting for keys, strings, numbers, booleans, null, and punctuation. |
| FR-JF-04 | The system shall display parse errors with position information. |
| FR-JF-05 | The system shall provide two-panel input/output with synchronized scrolling. |
| FR-JF-06 | The system shall allow copying the output and downloading it as a `.json` file. |
| FR-JF-07 | The system shall provide a sample JSON document for demonstration. |

---

## 10. Functional Requirements — ATS Resume Cleaner

| ID | Requirement |
| :--- | :--- |
| FR-RC-01 | The system shall accept `.docx` files via drag-and-drop or click-to-browse. |
| FR-RC-02 | The system shall compute an ATS-readiness score (0–100) based on severity-weighted detected issues. |
| FR-RC-03 | The system shall detect: tables, text boxes, drawings, OMML equations, hidden text, LaTeX residue, and comments. |
| FR-RC-04 | The system shall detect content in headers and footers. |
| FR-RC-05 | The system shall display a plain-text preview of what an ATS would read from the document. |
| FR-RC-06 | The system shall allow the user to toggle each cleanup category independently. |
| FR-RC-07 | The system shall re-analyze the document when any toggle is changed. |
| FR-RC-08 | The system shall download the cleaned document as a new `.docx` file without modifying the original. |
| FR-RC-09 | The system shall preserve text content when stripping LaTeX formatting (e.g. `\textbf{Python}` becomes `Python`, not empty). |
| FR-RC-10 | The system shall process the document entirely in browser memory, with no network transmission. |

---

## 11. Functional Requirements — Resume Templates

| ID | Requirement |
| :--- | :--- |
| FR-RT-01 | The system shall accept pasted resume text as input. |
| FR-RT-02 | The system shall parse the text into a name, contact block, and section list using a synonym-based heading detector. |
| FR-RT-03 | The system shall recognize over 300 heading variations across 18 canonical categories (Summary, Experience, Education, Skills, Projects, Certifications, Awards, Publications, Research, Languages, Volunteer, Activities, Interests, References, Professional Development, Teaching, Conferences, Additional Information). |
| FR-RT-04 | The system shall render the parsed resume in three templates: Classic, Modern, and Compact. |
| FR-RT-05 | The system shall render to A4 page dimensions (8.27in × 11.69in) with 0.75in margins. |
| FR-RT-06 | The system shall provide a print-to-PDF path via the browser print dialog. |
| FR-RT-07 | The system shall display a disclaimer explaining that PDF output is for human readers and not for ATS submission. |
| FR-RT-08 | The system shall support inline bold (`**text**`) and bullet (`- text`) markdown conventions. |
| FR-RT-09 | The system shall automatically bold the label portion of a bullet line when it precedes a colon (e.g. `- Languages: Python` → `**Languages:** Python`). |

---

## 12. Non-Functional Requirements

| ID | Requirement | Target |
| :--- | :--- | :--- |
| NFR-PERF-01 | First Contentful Paint | Under 1.5 seconds on 4G |
| NFR-PERF-02 | Total page weight (excluding CDN libraries) | Under 100 KB |
| NFR-PERF-03 | Time to Interactive | Under 2 seconds on 4G |
| NFR-COMPAT-01 | Browser support | Last 2 versions of Chrome, Firefox, Safari, Edge |
| NFR-COMPAT-02 | Mobile support | iOS Safari 15+, Android Chrome |
| NFR-A11Y-01 | Focus indicators | Visible on all interactive elements |
| NFR-A11Y-02 | Minimum input font size | 16px (prevents iOS zoom) |
| NFR-A11Y-03 | Minimum tap target | 44×44 px on mobile |
| NFR-A11Y-04 | Status regions | Announced via `aria-live="polite"` |
| NFR-A11Y-05 | Colour contrast | WCAG AA minimum |
| NFR-A11Y-06 | Dark mode | Supported via `prefers-color-scheme` |
| NFR-SEO-01 | Unique title per page | Under 62 characters |
| NFR-SEO-02 | Unique meta description | 50–160 characters |
| NFR-SEO-03 | Canonical URL | Every page declares one |
| NFR-SEO-04 | Sitemap | Contains every indexable page |
| NFR-SEO-05 | Internal linking | Every tool links to the hub and sibling tools |
| NFR-COST-01 | Total operating cost | ₹0 |

---

## 13. Security and Privacy Requirements

### 13.1 Security requirements

| ID | Requirement | Verification |
| :--- | :--- | :--- |
| SR-01 | All traffic shall be served over HTTPS with HSTS. | `curl -I` shows `Strict-Transport-Security` header |
| SR-02 | The system shall block access to sensitive files (`.git`, configuration, dependency manifests, environment files). | `curl` on each path returns 404 |
| SR-03 | The system shall set Content Security Policy restricting scripts to `'self'` and `https://cdn.jsdelivr.net`. | CSP header verified in production |
| SR-04 | The system shall set `X-Frame-Options: DENY` and `frame-ancestors 'none'`. | Both headers verified |
| SR-05 | The system shall set `X-Content-Type-Options: nosniff`. | Header verified |
| SR-06 | The system shall set `Referrer-Policy: strict-origin-when-cross-origin`. | Header verified |
| SR-07 | The system shall set comprehensive `Permissions-Policy` disabling sensors, payment, and ad-targeting APIs. | Header verified |
| SR-08 | The system shall set `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` to `same-origin`. | Both headers verified |
| SR-09 | All CDN-loaded scripts shall have SHA-384 Subresource Integrity hashes. | Verified in browser console |
| SR-10 | Account access to GitHub and Cloudflare shall require 2FA. | Verified in account settings |

### 13.2 Privacy requirements

| ID | Requirement | Verification |
| :--- | :--- | :--- |
| PR-01 | No cookies shall be set by application code. | Browser DevTools shows only Cloudflare strictly-necessary cookies if any |
| PR-02 | No analytics or tracking scripts shall be present. | HTML source review |
| PR-03 | No user file or text shall be transmitted to any server. | Network tab during tool use shows no outgoing requests |
| PR-04 | The system shall publish a GDPR-compliant privacy policy and DPDP-compliant notice. | `/privacy.html` accessible and complete |
| PR-05 | The system shall publish a GDPR Article 30 Records of Processing Activities. | `docs/ropa.md` |
| PR-06 | The system shall designate and publish a DPDP Grievance Officer with a 90-day resolution commitment. | `/privacy.html` Grievance Redressal section |
| PR-07 | The system shall document a DPDP lawful-basis analysis with interpretive caveat. | `docs/ropa.md` Section 4 |

---

## 14. Deployment and Operational Requirements

| ID | Requirement |
| :--- | :--- |
| DR-01 | Deployment shall be triggered automatically by pushing to the `main` branch. |
| DR-02 | Deployment shall be reversible via `git revert` or the Cloudflare dashboard. |
| DR-03 | The deployment process shall be documented in `docs/runbook.md`. |
| DR-04 | Post-deploy verification shall confirm 8 pages return 200 and 25 sensitive paths return 404 or SPA fallback. |
| DR-05 | Cache shall be purged after every deploy. |
| DR-06 | A Post-Incident Review shall be written after any production security incident. |
| DR-07 | A breach assessment shall be conducted under both GDPR Article 33 and DPDP Rule 7 after any incident involving personal data. |
| DR-08 | Governance documentation shall be reviewed annually and after any material change. |

---

## 15. Acceptance Criteria

The system is accepted as meeting this specification when all of the following are true:

1. All six tools function correctly on desktop and mobile browsers.
2. All eight pages return HTTP 200 in production.
3. All sensitive paths return either HTTP 404 or SPA fallback with the homepage HTML — never actual file content. Verified by content-aware check, not status-only.
4. All ten security header families are present in production responses.
5. The Content Security Policy produces zero console violations during normal tool use.
6. Both CDN scripts load with valid SRI hashes.
7. The Post-Incident Review, ROPA, Runbook, Decision Log, Security Controls Inventory, and README are published in the public repository.
8. The privacy policy includes the DPDP Grievance Officer with contact details, acknowledgment SLA, and 90-day resolution commitment.
9. The sitemap contains all eight indexable URLs and Google Search Console has verified the property.
10. The site operates at zero cost with no paid dependencies.

---

## Document Control

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 9 November 2026 | Piyush Gahlawat | Initial SRS — 15 sections documenting the deployed system |
| 1.1 | 9 November 2026 | Piyush Gahlawat | Cross-references updated to include Threat Model, PIR, ROPA, Runbook, Decision Log, and Security Controls; DR-04 corrected (6→8 pages, 24→25 paths); acceptance criterion #3 clarified for SPA fallback accuracy |

**Related documents:** [Threat Model](./threat-model.md) · [PIR — .git exposure](./post-incident-review-git-exposure.md) · [ROPA](./ropa.md) · [Runbook](./runbook.md) · [Decision Log](./decisions.md) · [Security Controls](./security-controls.md)